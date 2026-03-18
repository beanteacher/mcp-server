import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { AgentDto } from './agent.dto';
import { parseSettingCmd } from './parsers/setting-cmd.parser';
import { parseSettingSh } from './parsers/setting-sh.parser';
import { parseAgentConf } from './parsers/agent-conf.parser';
import { parseJdbcConf } from './parsers/jdbc-conf.parser';

function parseJdbcUrl(
  url: string,
  dbType: AgentDto.JdbcConfResult['dbType'],
): { host: string; port: number; database: string } | null {
  try {
    if (dbType === 'mysql' || dbType === 'mariadb') {
      const m = url.match(/jdbc:(?:mysql|mariadb):\/\/([^:/]+)(?::(\d+))?\/([^?;]+)/i);
      if (m) return { host: m[1], port: m[2] ? parseInt(m[2]) : 3306, database: m[3] };
    }
    if (dbType === 'mssql') {
      const hostM = url.match(/jdbc:sqlserver:\/\/([^:;]+)(?::(\d+))?/i);
      const dbM = url.match(/databaseName=([^;]+)/i);
      if (hostM) return { host: hostM[1], port: hostM[2] ? parseInt(hostM[2]) : 1433, database: dbM?.[1] ?? '' };
    }
    if (dbType === 'oracle') {
      const m1 = url.match(/jdbc:oracle:thin:@\/\/([^:/]+):(\d+)\/([^?;]+)/i);
      if (m1) return { host: m1[1], port: parseInt(m1[2]), database: m1[3] };
      const m2 = url.match(/jdbc:oracle:thin:@([^:/]+):(\d+):([^?;]+)/i);
      if (m2) return { host: m2[1], port: parseInt(m2[2]), database: m2[3] };
    }
    if (dbType === 'tibero') {
      const m = url.match(/jdbc:tibero:thin:@([^:]+):(\d+):([^?;]+)/i);
      if (m) return { host: m[1], port: parseInt(m[2]), database: m[3] };
    }
  } catch {
    // ignore
  }
  return null;
}

function detectOs(agentHome: string): 'windows' | 'linux' {
  const winBin = path.resolve(agentHome, 'bin_win');
  const linuxBin = path.resolve(agentHome, 'bin_linux');
  if (fs.existsSync(winBin)) return 'windows';
  if (fs.existsSync(linuxBin)) return 'linux';
  // fallback: 현재 플랫폼 기준
  return process.platform === 'win32' ? 'windows' : 'linux';
}

export async function analyzeConfig(
  agentHome: string,
  os?: 'windows' | 'linux',
): Promise<AgentDto.ConfigResult> {
  const resolvedHome = path.resolve(agentHome);

  const detectedOs = os ?? detectOs(resolvedHome);

  const [setting, agentConf, jdbcConf] = await Promise.all([
    detectedOs === 'windows'
      ? parseSettingCmd(resolvedHome)
      : parseSettingSh(resolvedHome),
    parseAgentConf(resolvedHome),
    parseJdbcConf(resolvedHome),
  ]);

  const activeMessageTypes: string[] = [];
  if (agentConf.smsUse === 'Y') activeMessageTypes.push('SMS');
  if (agentConf.lmsUse === 'Y') activeMessageTypes.push('LMS');
  if (agentConf.mmsUse === 'Y') activeMessageTypes.push('MMS');
  if (agentConf.kkoUse === 'Y') activeMessageTypes.push('KKO');

  const { password: _pw, ...jdbcWithoutPassword } = jdbcConf;
  const maskedJdbc = { ...jdbcWithoutPassword, password: '****' as const };

  return {
    os: detectedOs,
    setting,
    agentConf,
    jdbcConf: maskedJdbc,
    activeMessageTypes,
  };
}

function classifyLine(line: string): AgentDto.LogEntry['category'] {
  if (
    /Communications link failure/i.test(line) ||
    /ORA-\d+/.test(line) ||
    /Cannot open database/i.test(line) ||
    /Connection refused/i.test(line) ||
    /Unable to acquire JDBC Connection/i.test(line)
  ) {
    return 'DB_CONNECTION_FAILED';
  }
  if (
    /Table .+ doesn't exist/i.test(line) ||
    /ORA-00942/.test(line) ||
    /Invalid object name/i.test(line)
  ) {
    return 'TABLE_NOT_FOUND';
  }
  if (
    /relay/i.test(line) &&
    (/Connection (refused|timed out|reset)/i.test(line) || /socket/i.test(line))
  ) {
    return 'RELAY_CONNECTION_FAILED';
  }
  if (/OutOfMemoryError/i.test(line) || /GC overhead limit exceeded/i.test(line)) {
    return 'JVM_MEMORY';
  }
  return 'UNKNOWN';
}

async function parseLogFile(filePath: string): Promise<AgentDto.LogEntry[]> {
  const fileName = path.basename(filePath);
  const entries: AgentDto.LogEntry[] = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const upper = line.toUpperCase();
    let level: 'ERROR' | 'WARN' | null = null;
    if (upper.includes('ERROR')) level = 'ERROR';
    else if (upper.includes('WARN')) level = 'WARN';

    if (level) {
      entries.push({
        file: fileName,
        level,
        line: line.trim(),
        category: classifyLine(line),
      });
    }
  }

  return entries;
}

export async function diagnose(
  agentHome: string,
  os?: 'windows' | 'linux',
): Promise<AgentDto.DiagnoseResult> {
  const [config, logResult] = await Promise.all([
    analyzeConfig(agentHome, os),
    analyzeLogs(agentHome),
  ]);

  const issues: AgentDto.DiagnoseIssue[] = [];
  const summary = logResult.summary;

  // 로그 기반 진단
  if (summary['DB_CONNECTION_FAILED']) {
    issues.push({
      severity: 'ERROR',
      category: 'DB_CONNECTION_FAILED',
      message: `DB 연결 실패 ${summary['DB_CONNECTION_FAILED']}건 감지. jdbc.conf URL/포트 확인 필요${config.jdbcConf.url ? ` (현재: ${config.jdbcConf.url})` : ''}`,
    });
  }

  if (summary['TABLE_NOT_FOUND']) {
    const tables = [
      config.agentConf.sendTableSms,
      config.agentConf.sendTableMms,
      config.agentConf.sendTableKko,
    ]
      .filter(Boolean)
      .join(', ');
    issues.push({
      severity: 'ERROR',
      category: 'TABLE_NOT_FOUND',
      message: `테이블 없음 ${summary['TABLE_NOT_FOUND']}건 감지. sendTable 설정 확인 필요${tables ? ` (현재: ${tables})` : ''}`,
    });
  }

  if (summary['RELAY_CONNECTION_FAILED']) {
    const relayInfo = [
      config.agentConf.relaySmsIp &&
        `SMS릴레이 ${config.agentConf.relaySmsIp}:${config.agentConf.relaySmsPort}`,
      config.agentConf.relayMmsIp &&
        `MMS릴레이 ${config.agentConf.relayMmsIp}:${config.agentConf.relayMmsPort}`,
    ]
      .filter(Boolean)
      .join(', ');
    issues.push({
      severity: 'ERROR',
      category: 'RELAY_CONNECTION_FAILED',
      message: `릴레이 연결 실패 ${summary['RELAY_CONNECTION_FAILED']}건 감지. 릴레이 서버 접속 확인 필요${relayInfo ? ` (${relayInfo})` : ''}`,
    });
  }

  if (summary['JVM_MEMORY']) {
    issues.push({
      severity: 'ERROR',
      category: 'JVM_MEMORY',
      message: `JVM 메모리 부족 ${summary['JVM_MEMORY']}건 감지. jvmOpts -Xmx 값 증가 필요${config.setting.jvmOpts ? ` (현재: ${config.setting.jvmOpts})` : ''}`,
    });
  }

  // 설정 기반 진단
  if (config.activeMessageTypes.length === 0) {
    issues.push({
      severity: 'WARN',
      category: 'NO_ACTIVE_MESSAGE_TYPE',
      message:
        'SMS/LMS/MMS/KKO 중 활성화된 메시지 타입이 없습니다. agent.conf의 smsUse/lmsUse/mmsUse/kkoUse 확인 필요',
    });
  }

  if (!config.setting.javaHome) {
    issues.push({
      severity: 'WARN',
      category: 'JAVA_HOME_MISSING',
      message: 'JAVA_HOME이 설정되지 않았습니다. setting 파일 확인 필요',
    });
  }

  if (config.jdbcConf.dbType === 'unknown') {
    issues.push({
      severity: 'WARN',
      category: 'UNKNOWN_DB_TYPE',
      message: 'DB 타입을 인식할 수 없습니다. jdbc.conf의 driver/url 확인 필요',
    });
  }

  return {
    config,
    logSummary: summary,
    issues,
    healthy: issues.every((i) => i.severity !== 'ERROR'),
  };
}

export async function analyzeLogs(agentHome: string): Promise<AgentDto.LogResult> {
  const logsDir = path.resolve(agentHome, 'logs');

  if (!fs.existsSync(logsDir)) {
    return { entries: [], summary: {} };
  }

  const logFiles = fs
    .readdirSync(logsDir)
    .filter((f) => f.endsWith('.log'))
    .map((f) => path.join(logsDir, f));

  const allEntries = (await Promise.all(logFiles.map(parseLogFile))).flat();

  const summary: Record<string, number> = {};
  for (const entry of allEntries) {
    summary[entry.category] = (summary[entry.category] ?? 0) + 1;
  }

  return { entries: allEntries, summary };
}

export async function testDb(agentHome: string): Promise<AgentDto.DbTestResult> {
  const jdbcConf = await parseJdbcConf(path.resolve(agentHome));
  const { dbType, url = '', username = '', password = '' } = jdbcConf;
  const connParams = url ? parseJdbcUrl(url, dbType) : null;
  const start = Date.now();

  try {
    if (dbType === 'mysql' || dbType === 'mariadb') {
      const mysql = await import('mysql2/promise');
      const conn = await mysql.createConnection({
        host: connParams?.host,
        port: connParams?.port,
        database: connParams?.database,
        user: username,
        password,
        connectTimeout: 5000,
      });
      await conn.end();
      return { dbType, url, connected: true, elapsedMs: Date.now() - start };
    }

    if (dbType === 'mssql') {
      const mssql = await import('mssql');
      const pool = await mssql.connect({
        server: connParams?.host ?? '',
        port: connParams?.port,
        database: connParams?.database,
        user: username,
        password,
        options: { trustServerCertificate: true },
        connectionTimeout: 5000,
      });
      await pool.close();
      return { dbType, url, connected: true, elapsedMs: Date.now() - start };
    }

    if (dbType === 'oracle') {
      return {
        dbType, url, connected: false, elapsedMs: Date.now() - start,
        error: 'Oracle은 oracledb 설치가 필요합니다. npm install oracledb 후 재시도하세요.',
      };
    }

    if (dbType === 'tibero') {
      return {
        dbType, url, connected: false, elapsedMs: Date.now() - start,
        error: 'Tibero는 Node.js 드라이버가 미지원입니다.',
      };
    }

    return {
      dbType, url, connected: false, elapsedMs: Date.now() - start,
      error: `지원하지 않는 DB 타입: ${dbType}`,
    };
  } catch (e) {
    return {
      dbType, url, connected: false, elapsedMs: Date.now() - start,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function insertSample(
  agentHome: string,
  opts?: {
    messageType?: string;
    destaddr?: string;
    sendMsg?: string;
    count?: number;
  },
): Promise<AgentDto.InsertSampleResult> {
  const resolvedHome = path.resolve(agentHome);
  const [agentConf, jdbcConf] = await Promise.all([
    parseAgentConf(resolvedHome),
    parseJdbcConf(resolvedHome),
  ]);

  const messageType = opts?.messageType ?? 'sms';
  const destaddr = opts?.destaddr ?? '01000000000';
  const sendMsg = opts?.sendMsg ?? '[테스트] 샘플 메시지';
  const count = Math.min(opts?.count ?? 1, 10);

  let tableName: string | undefined;
  if (messageType === 'mms') {
    tableName = agentConf.sendTableMms ?? agentConf.sendTableSms;
  } else if (messageType === 'kko') {
    tableName = agentConf.sendTableKko ?? agentConf.sendTableSms;
  } else {
    tableName = agentConf.sendTableSms;
  }

  if (!tableName) {
    throw new Error(`agent.conf에 ${messageType} 테이블명이 설정되지 않았습니다.`);
  }

  const { dbType, url = '', username = '', password = '' } = jdbcConf;
  const connParams = url ? parseJdbcUrl(url, dbType) : null;
  const now = new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
  const insertedPks: number[] = [];

  if (dbType === 'mysql' || dbType === 'mariadb') {
    const mysql = await import('mysql2/promise');
    const conn = await mysql.createConnection({
      host: connParams?.host,
      port: connParams?.port,
      database: connParams?.database,
      user: username,
      password,
    });
    try {
      for (let i = 0; i < count; i++) {
        const [result] = await conn.execute(
          `INSERT INTO ${tableName} (destaddr, sendmsg, stat, reg_date) VALUES (?, ?, 0, ?)`,
          [destaddr, sendMsg, now],
        );
        insertedPks.push((result as { insertId: number }).insertId);
      }
    } finally {
      await conn.end();
    }
  } else if (dbType === 'mssql') {
    const mssql = await import('mssql');
    const pool = await mssql.connect({
      server: connParams?.host ?? '',
      port: connParams?.port,
      database: connParams?.database,
      user: username,
      password,
      options: { trustServerCertificate: true },
    });
    try {
      for (let i = 0; i < count; i++) {
        const result = await pool
          .request()
          .input('destaddr', mssql.VarChar(20), destaddr)
          .input('sendmsg', mssql.VarChar(4000), sendMsg)
          .input('reg_date', mssql.VarChar(20), now)
          .query(
            `INSERT INTO ${tableName} (destaddr, sendmsg, stat, reg_date) VALUES (@destaddr, @sendmsg, 0, @reg_date); SELECT SCOPE_IDENTITY() AS id`,
          );
        insertedPks.push(result.recordset[0]?.id ?? 0);
      }
    } finally {
      await pool.close();
    }
  } else {
    throw new Error(`insertSample은 MySQL/MariaDB/MSSQL만 지원합니다. 현재 DB: ${dbType}`);
  }

  return { tableName, insertedCount: insertedPks.length, insertedPks };
}
