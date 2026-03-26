import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { analyzeConfig, analyzeLogs, diagnose } from './service';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-test-'));
}

function writeAgentFixtures(
  tmpDir: string,
  opts?: {
    os?: 'windows' | 'linux';
    agentConf?: string;
    jdbcConf?: string;
    settingContent?: string;
    logs?: Record<string, string>;
  },
) {
  const osType = opts?.os ?? 'windows';
  const binDir = path.join(tmpDir, osType === 'windows' ? 'bin_win' : 'bin_linux');
  const confDir = path.join(tmpDir, 'conf');
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(confDir, { recursive: true });

  // JAVA_HOME을 tmpDir 내부에 생성하여 파일 존재 검증 통과
  const javaHomeDir = path.join(tmpDir, 'jdk');
  const javaBinDir = path.join(javaHomeDir, 'bin');
  fs.mkdirSync(javaBinDir, { recursive: true });
  const javaExe = osType === 'windows' ? 'java.exe' : 'java';
  fs.writeFileSync(path.join(javaBinDir, javaExe), '');

  const settingFile = osType === 'windows' ? 'setting.cmd' : 'setting.sh';
  const defaultSetting =
    osType === 'windows'
      ? `SET JAVA_HOME=${javaHomeDir}\r\nSET JVM_OPTS=-Xmx256m\r\n`
      : `export JAVA_HOME=${javaHomeDir}\nexport JVM_OPTS="-Xmx256m"\n`;
  fs.writeFileSync(path.join(binDir, settingFile), opts?.settingContent ?? defaultSetting);

  fs.writeFileSync(
    path.join(confDir, 'agent.conf'),
    opts?.agentConf ??
      [
        'agent.sms.use=Y',
        'agent.lms.use=N',
        'agent.mms.use=Y',
        'agent.kko.use=N',
        'agent.relay.sms.ip=10.0.0.1',
        'agent.relay.sms.port=9090',
        'agent.send.table.sms=SMS_TRAN',
        'agent.send.table.mms=MMS_TRAN',
      ].join('\n'),
  );

  fs.writeFileSync(
    path.join(confDir, 'jdbc.conf'),
    opts?.jdbcConf ??
      [
        'jdbc.driver=com.mysql.cj.jdbc.Driver',
        'jdbc.url=jdbc:mysql://localhost:3306/testdb',
        'jdbc.username=root',
        'jdbc.password=secret',
      ].join('\n'),
  );

  if (opts?.logs) {
    const logsDir = path.join(tmpDir, 'logs');
    fs.mkdirSync(logsDir, { recursive: true });
    for (const [name, content] of Object.entries(opts.logs)) {
      fs.writeFileSync(path.join(logsDir, name), content);
    }
  }
}

describe('analyzeConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('Windows 환경에서 설정 분석', async () => {
    writeAgentFixtures(tmpDir, { os: 'windows' });

    const result = await analyzeConfig(tmpDir);
    expect(result.os).toBe('windows');
    expect(result.setting.javaHome).toContain('jdk');
    expect(result.agentConf.smsUse).toBe('Y');
    expect(result.jdbcConf.dbType).toBe('mysql');
    expect(result.jdbcConf.password).toBe('****');
    expect(result.activeMessageTypes).toEqual(['SMS', 'MMS']);
  });

  it('Linux 환경에서 설정 분석', async () => {
    writeAgentFixtures(tmpDir, { os: 'linux' });

    const result = await analyzeConfig(tmpDir, 'linux');
    expect(result.os).toBe('linux');
    expect(result.setting.javaHome).toContain('jdk');
  });

  it('활성 메시지 타입이 없으면 빈 배열', async () => {
    writeAgentFixtures(tmpDir, {
      agentConf: [
        'agent.sms.use=N',
        'agent.lms.use=N',
        'agent.mms.use=N',
        'agent.kko.use=N',
      ].join('\n'),
    });

    const result = await analyzeConfig(tmpDir);
    expect(result.activeMessageTypes).toEqual([]);
  });

  it('password는 **** 마스킹', async () => {
    writeAgentFixtures(tmpDir);

    const result = await analyzeConfig(tmpDir);
    expect(result.jdbcConf.password).toBe('****');
  });
});

describe('analyzeLogs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('logs 디렉토리가 없으면 빈 결과', async () => {
    const result = await analyzeLogs(tmpDir);
    expect(result.entries).toEqual([]);
    expect(result.summary).toEqual({});
  });

  it('ERROR/WARN 라인을 추출하고 카테고리 분류', async () => {
    writeAgentFixtures(tmpDir, {
      logs: {
        'agent.log': [
          '2026-03-18 10:00:00 INFO  - Agent started',
          '2026-03-18 10:01:00 ERROR - Communications link failure',
          '2026-03-18 10:02:00 ERROR - Table SMS_TRAN doesn\'t exist',
          '2026-03-18 10:03:00 WARN  - relay socket Connection timed out',
          '2026-03-18 10:04:00 ERROR - java.lang.OutOfMemoryError: Java heap space',
          '2026-03-18 10:05:00 ERROR - Could not find or load main class com.example.Main',
          '2026-03-18 10:06:00 ERROR - Something unknown happened',
        ].join('\n'),
      },
    });

    const result = await analyzeLogs(tmpDir);
    expect(result.entries.length).toBe(6);
    expect(result.summary['DB_CONNECTION_FAILED']).toBe(1);
    expect(result.summary['TABLE_NOT_FOUND']).toBe(1);
    expect(result.summary['RELAY_CONNECTION_FAILED']).toBe(1);
    expect(result.summary['JVM_MEMORY']).toBe(1);
    expect(result.summary['CLASSPATH_ERROR']).toBe(1);
    expect(result.summary['UNKNOWN']).toBe(1);
  });

  it('날짜 패턴이 있는 파일은 무시 (아카이브 로그)', async () => {
    writeAgentFixtures(tmpDir, {
      logs: {
        'agent.log': '2026-03-18 ERROR - test error\n',
        'agent.20260317.log': '2026-03-17 ERROR - old error\n',
        'agent.2026-03-16.log': '2026-03-16 ERROR - old error 2\n',
      },
    });

    const result = await analyzeLogs(tmpDir);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].file).toBe('agent.log');
  });
});

describe('diagnose', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('문제 없으면 healthy=true', async () => {
    writeAgentFixtures(tmpDir);

    const result = await diagnose(tmpDir);
    expect(result.healthy).toBe(true);
    expect(result.config.os).toBe('windows');
  });

  it('DB 연결 에러 로그가 있으면 이슈 감지', async () => {
    writeAgentFixtures(tmpDir, {
      logs: {
        'agent.log': '2026-03-18 ERROR - Communications link failure\n',
      },
    });

    const result = await diagnose(tmpDir);
    expect(result.healthy).toBe(false);
    const dbIssue = result.issues.find((i) => i.category === 'DB_CONNECTION_FAILED');
    expect(dbIssue).toBeDefined();
    expect(dbIssue!.severity).toBe('ERROR');
  });

  it('활성 메시지 타입 없으면 WARN 이슈', async () => {
    writeAgentFixtures(tmpDir, {
      agentConf: 'agent.sms.use=N\nagent.lms.use=N\nagent.mms.use=N\nagent.kko.use=N\n',
    });

    const result = await diagnose(tmpDir);
    expect(result.healthy).toBe(true); // WARN은 healthy에 영향 없음
    const issue = result.issues.find((i) => i.category === 'NO_ACTIVE_MESSAGE_TYPE');
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe('WARN');
  });

  it('JAVA_HOME 미설정 시 WARN 이슈', async () => {
    writeAgentFixtures(tmpDir, {
      settingContent: 'SET JVM_OPTS=-Xmx256m\r\n',
    });

    const result = await diagnose(tmpDir);
    const issue = result.issues.find((i) => i.category === 'JAVA_HOME_MISSING');
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe('WARN');
  });

  it('DB 타입 unknown이면 WARN 이슈', async () => {
    writeAgentFixtures(tmpDir, {
      jdbcConf: 'jdbc.driver=unknown.Driver\njdbc.url=jdbc:unknown://localhost\n',
    });

    const result = await diagnose(tmpDir);
    const issue = result.issues.find((i) => i.category === 'UNKNOWN_DB_TYPE');
    expect(issue).toBeDefined();
  });

  it('여러 에러가 동시에 발생하면 모두 감지', async () => {
    writeAgentFixtures(tmpDir, {
      agentConf: 'agent.sms.use=N\nagent.lms.use=N\nagent.mms.use=N\nagent.kko.use=N\n',
      jdbcConf: 'jdbc.driver=unknown.Driver\n',
      settingContent: 'SET JVM_OPTS=-Xmx256m\r\n',
      logs: {
        'agent.log': [
          'ERROR - Communications link failure',
          'ERROR - OutOfMemoryError',
        ].join('\n'),
      },
    });

    const result = await diagnose(tmpDir);
    expect(result.healthy).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(4);
  });
});
