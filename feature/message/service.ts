import { prisma } from '../../lib/prisma';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Prisma는 Date의 UTC 값을 그대로 DB에 저장하므로, UTC+9 시프트된 Date를 만들어 KST가 저장되게 한다. */
function toKstNow(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

/** Date의 UTC 값이 이미 KST이므로 getUTC* 메서드를 사용한다. */
function formatKst(date: Date): string {
  const y = date.getUTCFullYear();
  const M = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${M}-${d}T${h}:${m}:${s}+09:00`;
}

const VALID_MSG_TYPES = ['SMS', 'MMS', 'KKO', 'RCS'] as const;
type MsgType = typeof VALID_MSG_TYPES[number];

const MSG_TYPE_SUB_TYPES: Record<MsgType, string[]> = {
  SMS: ['SMS'],
  MMS: ['LMS', 'MMS'],
  KKO: ['KAT', 'KAI', 'KFT', 'KFI', 'KFP'],
  RCS: ['RSM', 'RLM', 'RTT'],
};

function getModel(msgType: MsgType) {
  switch (msgType) {
    case 'SMS':
      return prisma.mcpAgentSmsTran;
    case 'MMS':
      return prisma.mcpAgentMmsTran;
    case 'KKO':
      return prisma.mcpAgentKkoTran;
    case 'RCS':
      return prisma.mcpAgentRcsTran;
  }
}

const TABLE_NAMES: Record<MsgType, string> = {
  SMS: 'MCP_AGENT_SMS_TRAN',
  MMS: 'MCP_AGENT_MMS_TRAN',
  KKO: 'MCP_AGENT_KKO_TRAN',
  RCS: 'MCP_AGENT_RCS_TRAN',
};

// --- message_get_result ---

export type MessageGetResultInput = {
  msgId: string;
};

export type MessageGetResultRow = {
  msgId: string;
  channel: string;
  msgType: string;
  msgSubType: string;
  destaddr: string;
  callback: string;
  sendMsg: string | null;
  subject?: string | null;
  messageState: number;
  resultCode: string | null;
  resultDeliverDate: string | null;
  requestDate: string;
  createDate: string;
  tableName: string;
};

const MESSAGE_STATE_LABELS: Record<number, string> = {
  0: '대기',
  1: '발송중',
  2: '발송완료(성공)',
  3: '발송완료(실패)',
  4: '취소',
};

function toRow(
  record: {
    msgId: bigint;
    msgType: string;
    msgSubType: string;
    destaddr: string;
    callback: string;
    sendMsg: string | null;
    messageState: number;
    resultCode: string | null;
    resultDeliverDate: Date | null;
    requestDate: Date;
    createDate: Date;
    subject?: string | null;
  },
  channel: MsgType,
): MessageGetResultRow {
  return {
    msgId: record.msgId.toString(),
    channel,
    msgType: record.msgType,
    msgSubType: record.msgSubType,
    destaddr: record.destaddr,
    callback: record.callback,
    sendMsg: record.sendMsg,
    subject: 'subject' in record ? (record as { subject?: string | null }).subject : undefined,
    messageState: record.messageState,
    resultCode: record.resultCode,
    resultDeliverDate: record.resultDeliverDate ? formatKst(record.resultDeliverDate) : null,
    requestDate: formatKst(record.requestDate),
    createDate: formatKst(record.createDate),
    tableName: TABLE_NAMES[channel],
  };
}

export async function messageGetResult(input: MessageGetResultInput): Promise<MessageGetResultRow> {
  const raw = input.msgId.trim();
  if (!raw || !/^\d+$/.test(raw)) {
    throw new Error('msgId는 양의 정수 문자열이어야 합니다.');
  }
  const id = BigInt(raw);

  const [sms, mms, kko, rcs] = await Promise.all([
    prisma.mcpAgentSmsTran.findUnique({ where: { msgId: id } }),
    prisma.mcpAgentMmsTran.findUnique({ where: { msgId: id } }),
    prisma.mcpAgentKkoTran.findUnique({ where: { msgId: id } }),
    prisma.mcpAgentRcsTran.findUnique({ where: { msgId: id } }),
  ]);

  if (sms) return toRow(sms, 'SMS');
  if (mms) return toRow(mms, 'MMS');
  if (kko) return toRow(kko, 'KKO');
  if (rcs) return toRow(rcs, 'RCS');

  throw new Error(`msgId ${raw}에 해당하는 메시지를 찾을 수 없습니다.`);
}

// --- message_send ---

export type MessageSendInput = {
  msgType: string;
  msgSubType: string;
  destaddr: string;
  callback: string;
  sendMsg: string;
  subject?: string;
  filePath?: string;
  userId?: string;
  kisaCode?: string;
  billCode?: string;
  groupId?: string;
  requestDate?: string;
};

export type MessageSendResult = {
  msgId: string;
  msgType: string;
  msgSubType: string;
  destaddr: string;
  tableName: string;
  requestDate: string;
};

function ensureString(value: unknown, field: string, maxLength?: number): string {
  if (typeof value !== 'string') {
    throw new Error(`${field}는 문자열이어야 합니다.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field}는 비어 있을 수 없습니다.`);
  }

  if (maxLength !== undefined && trimmed.length > maxLength) {
    throw new Error(`${field} 길이는 ${maxLength}자를 초과할 수 없습니다.`);
  }

  return trimmed;
}

function ensureOptionalString(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return ensureString(value, field, maxLength);
}

function normalizePhone(value: string, field: string): string {
  const normalized = value.replace(/[^0-9+]/g, '');
  if (!normalized) {
    throw new Error(`${field} 형식이 올바르지 않습니다.`);
  }

  return normalized;
}

function parseRequestDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('requestDate 형식이 올바르지 않습니다. ISO 8601 문자열을 사용하세요.');
  }

  // 입력값에 타임존이 포함되어 있으면 이미 올바른 순간을 가리키므로
  // DB 저장용으로 KST 시프트만 적용한다.
  return new Date(date.getTime() + KST_OFFSET_MS);
}

function parseGroupId(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  if (!/^-?\d+$/.test(value)) {
    throw new Error('groupId는 정수 문자열이어야 합니다.');
  }

  return parseInt(value, 10);
}

function countFiles(filePath: string | undefined): number {
  if (!filePath) return 0;
  return filePath.split(',').filter((p) => p.trim()).length;
}

export async function messageSend(input: MessageSendInput): Promise<MessageSendResult> {
  const msgType = input.msgType.toUpperCase() as MsgType;
  if (!VALID_MSG_TYPES.includes(msgType)) {
    throw new Error(`msgType은 ${VALID_MSG_TYPES.join(', ')} 중 하나여야 합니다.`);
  }

  const msgSubType = ensureString(input.msgSubType, 'msgSubType', 5).toUpperCase();
  const allowedSubTypes = MSG_TYPE_SUB_TYPES[msgType];
  if (!allowedSubTypes.includes(msgSubType)) {
    throw new Error(`msgType ${msgType}의 msgSubType은 ${allowedSubTypes.join(', ')} 중 하나여야 합니다.`);
  }

  const destaddr = normalizePhone(ensureString(input.destaddr, 'destaddr', 32), 'destaddr');
  const callback = normalizePhone(ensureString(input.callback, 'callback', 32), 'callback');
  const sendMsg = ensureString(input.sendMsg, 'sendMsg');

  const subject = msgType === 'SMS'
    ? undefined
    : ensureOptionalString(input.subject, 'subject', 120);

  const filePath = ensureOptionalString(input.filePath, 'filePath', 255);
  const fileCount = countFiles(filePath);

  const userId = ensureOptionalString(input.userId, 'userId', 32) ?? process.env.MCP_TRAN_DEFAULT_USER_ID;
  const kisaCode = ensureOptionalString(input.kisaCode, 'kisaCode', 20) ?? process.env.MCP_TRAN_DEFAULT_KISA_CODE;
  const billCode = ensureOptionalString(input.billCode, 'billCode', 30) ?? process.env.MCP_TRAN_DEFAULT_BILL_CODE;
  const groupId = parseGroupId(input.groupId);
  const requestDate = parseRequestDate(input.requestDate) ?? toKstNow();

  const kstNow = toKstNow();
  const commonData = {
    msgType,
    msgSubType,
    destaddr,
    callback,
    sendMsg,
    userId,
    kisaCode,
    billCode,
    groupId,
    requestDate,
    createDate: kstNow,
    updateDate: kstNow,
  };

  let created: { msgId: bigint; msgType: string; msgSubType: string; destaddr: string; requestDate: Date };

  if (msgType === 'SMS') {
    created = await prisma.mcpAgentSmsTran.create({ data: commonData });
  } else if (msgType === 'MMS') {
    created = await prisma.mcpAgentMmsTran.create({
      data: { ...commonData, subject, filePath, fileCount },
    });
  } else if (msgType === 'KKO') {
    created = await prisma.mcpAgentKkoTran.create({
      data: { ...commonData, subject, senderKey: '' },
    });
  } else {
    created = await prisma.mcpAgentRcsTran.create({
      data: { ...commonData, subject, filePath, fileCount },
    });
  }

  return {
    msgId: created.msgId.toString(),
    msgType: created.msgType,
    msgSubType: created.msgSubType,
    destaddr: created.destaddr,
    tableName: TABLE_NAMES[msgType],
    requestDate: formatKst(created.requestDate),
  };
}

// =========================================
// Shared query helpers
// =========================================

function parseDateFilter(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + 'T00:00:00Z');
  }
  if (/[+-]\d{2}:\d{2}$/.test(value) || value.endsWith('Z')) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new Error(`날짜 형식이 올바르지 않습니다: ${value}`);
    return new Date(d.getTime() + KST_OFFSET_MS);
  }
  const d = new Date(value + (value.includes('T') ? 'Z' : 'T00:00:00Z'));
  if (Number.isNaN(d.getTime())) throw new Error(`날짜 형식이 올바르지 않습니다: ${value}`);
  return d;
}

function todayStartKst(): Date {
  const now = new Date(Date.now() + KST_OFFSET_MS);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function yesterdayStartKst(): Date {
  const today = todayStartKst();
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}

function resolveChannelFilter(input?: string): { channels: MsgType[]; subTypeFilter?: string } {
  if (!input) return { channels: [...VALID_MSG_TYPES] };
  const upper = input.toUpperCase();
  if (VALID_MSG_TYPES.includes(upper as MsgType)) return { channels: [upper as MsgType] };
  for (const [type, subs] of Object.entries(MSG_TYPE_SUB_TYPES)) {
    if (subs.includes(upper)) return { channels: [type as MsgType], subTypeFilter: upper };
  }
  throw new Error(`알 수 없는 msgType: ${input}`);
}

interface WhereParams {
  dateFrom?: Date;
  dateTo?: Date;
  destaddr?: string;
  messageState?: number;
  messageStateIn?: number[];
  userId?: string;
  groupId?: number;
  resultCode?: string;
  subTypeFilter?: string;
}

function buildWhereSql(params: WhereParams): { conditions: string[]; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (params.dateFrom) { conditions.push('create_date >= ?'); values.push(params.dateFrom); }
  if (params.dateTo) { conditions.push('create_date <= ?'); values.push(params.dateTo); }
  if (params.destaddr) { conditions.push('destaddr LIKE ?'); values.push(`%${params.destaddr}%`); }
  if (params.messageState !== undefined) { conditions.push('message_state = ?'); values.push(params.messageState); }
  if (params.messageStateIn?.length) {
    conditions.push(`message_state IN (${params.messageStateIn.map(() => '?').join(', ')})`);
    values.push(...params.messageStateIn);
  }
  if (params.userId) { conditions.push('user_id = ?'); values.push(params.userId); }
  if (params.groupId !== undefined) { conditions.push('group_id = ?'); values.push(params.groupId); }
  if (params.resultCode) { conditions.push('result_code = ?'); values.push(params.resultCode); }
  if (params.subTypeFilter) { conditions.push('msg_sub_type = ?'); values.push(params.subTypeFilter); }
  return { conditions, values };
}

const COMMON_SELECT = 'msg_id, msg_type, msg_sub_type, destaddr, callback, send_msg, message_state, result_code, result_net_id, result_deliver_date, request_date, create_date, user_id, group_id';

interface RawTranRow {
  msg_id: bigint;
  msg_type: string;
  msg_sub_type: string;
  destaddr: string;
  callback: string;
  send_msg: string | null;
  message_state: number;
  result_code: string | null;
  result_net_id: string | null;
  result_deliver_date: Date | null;
  request_date: Date;
  create_date: Date;
  user_id: string | null;
  group_id: number | null;
  _channel: string;
}

function rawToSearchRow(r: RawTranRow) {
  return {
    msgId: r.msg_id.toString(),
    channel: r._channel,
    msgType: r.msg_type,
    msgSubType: r.msg_sub_type,
    destaddr: r.destaddr,
    callback: r.callback,
    sendMsg: r.send_msg,
    messageState: r.message_state,
    resultCode: r.result_code,
    resultNetId: r.result_net_id,
    resultDeliverDate: r.result_deliver_date ? formatKst(r.result_deliver_date) : null,
    requestDate: formatKst(r.request_date),
    createDate: formatKst(r.create_date),
    userId: r.user_id,
    groupId: r.group_id,
    tableName: TABLE_NAMES[r._channel as MsgType],
  };
}

function buildUnionSql(channels: MsgType[], select: string, where: { conditions: string[]; values: unknown[] }): { fragment: string; params: unknown[] } {
  const whereClause = where.conditions.length ? ' WHERE ' + where.conditions.join(' AND ') : '';
  const unions = channels.map(ch =>
    `SELECT ${select}, '${ch}' as _channel FROM ${TABLE_NAMES[ch]}${whereClause}`
  );
  const params: unknown[] = [];
  for (let i = 0; i < channels.length; i++) params.push(...where.values);
  return { fragment: unions.join(' UNION ALL '), params };
}

// =========================================
// 02: message_search
// =========================================

export type MessageSearchInput = {
  dateFrom?: string;
  dateTo?: string;
  destaddr?: string;
  msgType?: string;
  messageState?: number;
  userId?: string;
  groupId?: string;
  page?: number;
  size?: number;
};

export async function messageSearch(input: MessageSearchInput) {
  const page = Math.max(1, input.page ?? 1);
  const size = Math.min(100, Math.max(1, input.size ?? 20));
  const offset = (page - 1) * size;

  const { channels, subTypeFilter } = resolveChannelFilter(input.msgType);
  const where = buildWhereSql({
    dateFrom: parseDateFilter(input.dateFrom) ?? todayStartKst(),
    dateTo: parseDateFilter(input.dateTo),
    destaddr: input.destaddr,
    messageState: input.messageState,
    userId: input.userId,
    groupId: input.groupId ? parseInt(input.groupId, 10) : undefined,
    subTypeFilter,
  });

  const union = buildUnionSql(channels, COMMON_SELECT, where);
  const dataSql = `${union.fragment} ORDER BY create_date DESC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) as total FROM (${union.fragment}) t`;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<RawTranRow[]>(dataSql, ...union.params, size, offset),
    prisma.$queryRawUnsafe<{ total: bigint }[]>(countSql, ...union.params),
  ]);

  const total = Number(countResult[0].total);
  return {
    items: rows.map(rawToSearchRow),
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
  };
}

// =========================================
// 03: message_find_failures
// =========================================

export type MessageFindFailuresInput = {
  dateFrom?: string;
  dateTo?: string;
  msgType?: string;
  resultCode?: string;
  page?: number;
  size?: number;
};

export async function messageFindFailures(input: MessageFindFailuresInput) {
  const page = Math.max(1, input.page ?? 1);
  const size = Math.min(100, Math.max(1, input.size ?? 20));
  const offset = (page - 1) * size;

  const { channels, subTypeFilter } = resolveChannelFilter(input.msgType);
  const where = buildWhereSql({
    dateFrom: parseDateFilter(input.dateFrom) ?? todayStartKst(),
    dateTo: parseDateFilter(input.dateTo),
    messageState: 3,
    resultCode: input.resultCode,
    subTypeFilter,
  });

  const union = buildUnionSql(channels, COMMON_SELECT, where);
  const dataSql = `${union.fragment} ORDER BY create_date DESC LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) as total FROM (${union.fragment}) t`;
  const summarySql = `SELECT result_code, COUNT(*) as cnt FROM (${buildUnionSql(channels, 'result_code', where).fragment}) t GROUP BY result_code ORDER BY cnt DESC LIMIT 10`;

  const summaryUnion = buildUnionSql(channels, 'result_code', where);
  const [rows, countResult, summaryResult] = await Promise.all([
    prisma.$queryRawUnsafe<RawTranRow[]>(dataSql, ...union.params, size, offset),
    prisma.$queryRawUnsafe<{ total: bigint }[]>(countSql, ...union.params),
    prisma.$queryRawUnsafe<{ result_code: string | null; cnt: bigint }[]>(
      `SELECT result_code, COUNT(*) as cnt FROM (${summaryUnion.fragment}) t GROUP BY result_code ORDER BY cnt DESC LIMIT 10`,
      ...summaryUnion.params,
    ),
  ]);

  const total = Number(countResult[0].total);
  return {
    items: rows.map(rawToSearchRow),
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
    resultCodeSummary: summaryResult.map(r => ({
      resultCode: r.result_code ?? '(없음)',
      count: Number(r.cnt),
    })),
  };
}

// =========================================
// 04: message_result_code_explain
// =========================================

interface ResultCodeEntry {
  code: string;
  description: string;
  category: string;
  retryable: boolean;
}

const RESULT_CODE_MAP: Record<string, { description: string; category: string; retryable: boolean }> = {
  '1000': { description: '성공', category: '성공', retryable: false },
  '2000': { description: '형식 오류 (일반)', category: '형식오류', retryable: false },
  '2001': { description: '수신번호 형식 오류', category: '형식오류', retryable: false },
  '2002': { description: '발신번호 형식 오류', category: '형식오류', retryable: false },
  '2003': { description: '메시지 본문 누락', category: '형식오류', retryable: false },
  '2004': { description: '메시지 길이 초과', category: '형식오류', retryable: false },
  '3000': { description: '인증 오류 (일반)', category: '인증오류', retryable: false },
  '3001': { description: '발신번호 미등록', category: '인증오류', retryable: false },
  '3002': { description: '사용자 권한 없음', category: '인증오류', retryable: false },
  '3003': { description: '발송 한도 초과', category: '인증오류', retryable: true },
  '4000': { description: '수신 오류 (일반)', category: '수신오류', retryable: true },
  '4100': { description: '착신 거부 / 수신 차단', category: '수신오류', retryable: false },
  '4200': { description: '결번 / 존재하지 않는 번호', category: '수신오류', retryable: false },
  '4300': { description: '단말기 전원 꺼짐', category: '수신오류', retryable: true },
  '4400': { description: '음영지역 / 서비스 불가', category: '수신오류', retryable: true },
  '4500': { description: '메시지함 가득 참', category: '수신오류', retryable: true },
  '4600': { description: '단말기 메시지 수신 불가', category: '수신오류', retryable: true },
  '4700': { description: '스팸 차단', category: '수신오류', retryable: false },
  '5000': { description: '시스템 오류 (일반)', category: '시스템오류', retryable: true },
  '5001': { description: '릴레이 서버 연결 실패', category: '시스템오류', retryable: true },
  '5002': { description: '통신사 연동 실패', category: '시스템오류', retryable: true },
  '5003': { description: '타임아웃', category: '시스템오류', retryable: true },
  '5100': { description: '내부 처리 오류', category: '시스템오류', retryable: true },
};

function guessCategory(code: string): string {
  const prefix = code.charAt(0);
  switch (prefix) {
    case '1': return '성공';
    case '2': return '형식오류';
    case '3': return '인증오류';
    case '4': return '수신오류';
    case '5': return '시스템오류';
    default: return '기타';
  }
}

export type MessageResultCodeExplainInput = {
  resultCode?: string;
};

export function messageResultCodeExplain(input: MessageResultCodeExplainInput) {
  if (input.resultCode) {
    const entry = RESULT_CODE_MAP[input.resultCode];
    if (entry) {
      return { codes: [{ code: input.resultCode, ...entry }] };
    }
    return {
      codes: [{
        code: input.resultCode,
        description: '알 수 없는 결과코드',
        category: guessCategory(input.resultCode),
        retryable: input.resultCode.startsWith('4') || input.resultCode.startsWith('5'),
      }],
    };
  }
  return {
    codes: Object.entries(RESULT_CODE_MAP).map(([code, info]) => ({ code, ...info })),
  };
}

// =========================================
// 05: message_check_pending
// =========================================

export type MessageCheckPendingInput = {
  olderThanMinutes?: number;
  msgType?: string;
};

export async function messageCheckPending(input: MessageCheckPendingInput) {
  const { channels } = resolveChannelFilter(input.msgType);
  const where = buildWhereSql({ messageStateIn: [0, 1] });

  const union = buildUnionSql(channels, 'create_date, message_state', where);

  const countSql = `SELECT _channel, message_state, COUNT(*) as cnt FROM (${union.fragment}) t GROUP BY _channel, message_state`;
  const oldestSql = `SELECT create_date, _channel FROM (${union.fragment}) t ORDER BY create_date ASC LIMIT 1`;

  const [countResult, oldestResult] = await Promise.all([
    prisma.$queryRawUnsafe<{ _channel: string; message_state: number; cnt: bigint }[]>(countSql, ...union.params),
    prisma.$queryRawUnsafe<{ create_date: Date; _channel: string }[]>(oldestSql, ...union.params),
  ]);

  const byChannel: Record<string, { pending: number; processing: number; total: number }> = {};
  let totalPending = 0;
  let totalProcessing = 0;

  for (const row of countResult) {
    if (!byChannel[row._channel]) byChannel[row._channel] = { pending: 0, processing: 0, total: 0 };
    const cnt = Number(row.cnt);
    if (row.message_state === 0) {
      byChannel[row._channel].pending += cnt;
      totalPending += cnt;
    } else {
      byChannel[row._channel].processing += cnt;
      totalProcessing += cnt;
    }
    byChannel[row._channel].total += cnt;
  }

  const oldest = oldestResult.length > 0 ? {
    createDate: formatKst(oldestResult[0].create_date),
    channel: oldestResult[0]._channel,
  } : null;

  let staleCount = 0;
  if (input.olderThanMinutes && input.olderThanMinutes > 0) {
    const threshold = new Date(Date.now() + KST_OFFSET_MS - input.olderThanMinutes * 60 * 1000);
    const staleWhere = buildWhereSql({ messageStateIn: [0, 1] });
    staleWhere.conditions.push('create_date < ?');
    staleWhere.values.push(threshold);
    const staleUnion = buildUnionSql(channels, 'msg_id', staleWhere);
    const staleResult = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*) as total FROM (${staleUnion.fragment}) t`,
      ...staleUnion.params,
    );
    staleCount = Number(staleResult[0].total);
  }

  return {
    totalPending,
    totalProcessing,
    totalAll: totalPending + totalProcessing,
    byChannel,
    oldest,
    staleCount,
    olderThanMinutes: input.olderThanMinutes ?? 0,
  };
}

// =========================================
// 06: message_retry
// =========================================

export type MessageRetryInput = {
  msgIds?: string[];
  resultCode?: string;
  dateFrom?: string;
  dateTo?: string;
  maxCount?: number;
};

const MAX_RETRY_COUNT = 3;

export async function messageRetry(input: MessageRetryInput) {
  if (!input.msgIds?.length && !input.resultCode) {
    throw new Error('msgIds 또는 resultCode 중 하나는 필수입니다.');
  }

  const maxCount = Math.min(input.maxCount ?? 100, 1000);
  const kstNow = toKstNow();
  const channels: MsgType[] = [...VALID_MSG_TYPES];
  let totalRetried = 0;
  const retriedIds: string[] = [];
  const warnings: string[] = [];

  if (input.msgIds?.length) {
    const ids = input.msgIds.map(id => {
      if (!/^\d+$/.test(id.trim())) throw new Error(`유효하지 않은 msgId: ${id}`);
      return BigInt(id.trim());
    });

    for (const ch of channels) {
      const table = TABLE_NAMES[ch];
      // Find retryable records
      const placeholders = ids.map(() => '?').join(', ');
      const findSql = `SELECT msg_id, retry_count FROM ${table} WHERE msg_id IN (${placeholders}) AND message_state = 3`;
      const found = await prisma.$queryRawUnsafe<{ msg_id: bigint; retry_count: number | null }[]>(findSql, ...ids);

      if (!found.length) continue;

      const retryableIds: bigint[] = [];
      for (const row of found) {
        if ((row.retry_count ?? 0) >= MAX_RETRY_COUNT) {
          warnings.push(`msgId ${row.msg_id} (${ch}): 재시도 횟수 상한(${MAX_RETRY_COUNT}회) 초과`);
        } else {
          retryableIds.push(row.msg_id);
        }
      }

      if (retryableIds.length) {
        const ph = retryableIds.map(() => '?').join(', ');
        const updateSql = `UPDATE ${table} SET message_state = 0, retry_count = COALESCE(retry_count, 0) + 1, update_date = ? WHERE msg_id IN (${ph})`;
        const affected = await prisma.$executeRawUnsafe(updateSql, kstNow, ...retryableIds);
        totalRetried += affected;
        retriedIds.push(...retryableIds.map(id => id.toString()));
      }
    }
  } else {
    // Condition-based retry
    const dateFrom = parseDateFilter(input.dateFrom) ?? todayStartKst();
    const dateTo = parseDateFilter(input.dateTo);
    const where = buildWhereSql({ dateFrom, dateTo, messageState: 3, resultCode: input.resultCode });
    where.conditions.push(`COALESCE(retry_count, 0) < ?`);
    where.values.push(MAX_RETRY_COUNT);

    for (const ch of channels) {
      const table = TABLE_NAMES[ch];
      const whereClause = where.conditions.length ? ' WHERE ' + where.conditions.join(' AND ') : '';

      // Find IDs to retry (limited)
      const remaining = maxCount - totalRetried;
      if (remaining <= 0) break;

      const findSql = `SELECT msg_id FROM ${table}${whereClause} LIMIT ?`;
      const found = await prisma.$queryRawUnsafe<{ msg_id: bigint }[]>(findSql, ...where.values, remaining);

      if (!found.length) continue;

      const targetIds = found.map(r => r.msg_id);
      const ph = targetIds.map(() => '?').join(', ');
      const updateSql = `UPDATE ${table} SET message_state = 0, retry_count = COALESCE(retry_count, 0) + 1, update_date = ? WHERE msg_id IN (${ph})`;
      const affected = await prisma.$executeRawUnsafe(updateSql, kstNow, ...targetIds);
      totalRetried += affected;
      retriedIds.push(...targetIds.map(id => id.toString()));
    }
  }

  return { totalRetried, retriedIds, warnings };
}

// =========================================
// 07: message_cancel
// =========================================

export type MessageCancelInput = {
  msgIds?: string[];
  groupId?: string;
};

export async function messageCancel(input: MessageCancelInput) {
  if (!input.msgIds?.length && !input.groupId) {
    throw new Error('msgIds 또는 groupId 중 하나는 필수입니다.');
  }

  const kstNow = toKstNow();
  const channels: MsgType[] = [...VALID_MSG_TYPES];
  let totalCancelled = 0;
  let totalNotCancellable = 0;

  if (input.msgIds?.length) {
    const ids = input.msgIds.map(id => {
      if (!/^\d+$/.test(id.trim())) throw new Error(`유효하지 않은 msgId: ${id}`);
      return BigInt(id.trim());
    });

    for (const ch of channels) {
      const table = TABLE_NAMES[ch];
      const ph = ids.map(() => '?').join(', ');

      // Count total matching
      const totalResult = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
        `SELECT COUNT(*) as cnt FROM ${table} WHERE msg_id IN (${ph})`, ...ids
      );
      const totalInTable = Number(totalResult[0].cnt);

      if (!totalInTable) continue;

      // Cancel only pending (messageState = 0)
      const affected = await prisma.$executeRawUnsafe(
        `UPDATE ${table} SET message_state = 4, update_date = ? WHERE msg_id IN (${ph}) AND message_state = 0`,
        kstNow, ...ids
      );
      totalCancelled += affected;
      totalNotCancellable += totalInTable - affected;
    }
  } else {
    const gid = parseInt(input.groupId!, 10);
    if (Number.isNaN(gid)) throw new Error('groupId는 정수여야 합니다.');

    for (const ch of channels) {
      const table = TABLE_NAMES[ch];

      const totalResult = await prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
        `SELECT COUNT(*) as cnt FROM ${table} WHERE group_id = ?`, gid
      );
      const totalInTable = Number(totalResult[0].cnt);
      if (!totalInTable) continue;

      const affected = await prisma.$executeRawUnsafe(
        `UPDATE ${table} SET message_state = 4, update_date = ? WHERE group_id = ? AND message_state = 0`,
        kstNow, gid
      );
      totalCancelled += affected;
      totalNotCancellable += totalInTable - affected;
    }
  }

  return { totalCancelled, totalNotCancellable };
}

// =========================================
// 08: message_stat_summary
// =========================================

export type MessageStatSummaryInput = {
  dateFrom?: string;
  dateTo?: string;
  groupBy?: string; // 'channel' | 'hour' | 'day'
};

export async function messageStatSummary(input: MessageStatSummaryInput) {
  const dateFrom = parseDateFilter(input.dateFrom) ?? todayStartKst();
  const dateTo = parseDateFilter(input.dateTo);
  const groupByMode = (input.groupBy ?? 'channel').toLowerCase();
  const channels: MsgType[] = [...VALID_MSG_TYPES];
  const where = buildWhereSql({ dateFrom, dateTo });

  let groupSelect: string;
  let groupColumn: string;
  if (groupByMode === 'hour') {
    groupSelect = 'HOUR(create_date) as grp';
    groupColumn = 'grp';
  } else if (groupByMode === 'day') {
    groupSelect = 'DATE(create_date) as grp';
    groupColumn = 'grp';
  } else {
    groupSelect = '_channel as grp';
    groupColumn = 'grp';
  }

  const union = buildUnionSql(channels, `create_date, message_state`, where);
  const sql = `SELECT ${groupSelect}, message_state, COUNT(*) as cnt FROM (${union.fragment}) t GROUP BY ${groupColumn}, message_state ORDER BY ${groupColumn}`;

  const rows = await prisma.$queryRawUnsafe<{ grp: unknown; message_state: number; cnt: bigint }[]>(sql, ...union.params);

  // Aggregate
  let totalSuccess = 0, totalFail = 0, totalPending = 0, totalProcessing = 0;
  const groups: Record<string, { success: number; fail: number; pending: number; processing: number; total: number }> = {};

  for (const row of rows) {
    const key = String(row.grp);
    if (!groups[key]) groups[key] = { success: 0, fail: 0, pending: 0, processing: 0, total: 0 };
    const cnt = Number(row.cnt);
    groups[key].total += cnt;

    if (row.message_state === 2) { groups[key].success += cnt; totalSuccess += cnt; }
    else if (row.message_state === 3) { groups[key].fail += cnt; totalFail += cnt; }
    else if (row.message_state === 0) { groups[key].pending += cnt; totalPending += cnt; }
    else if (row.message_state === 1) { groups[key].processing += cnt; totalProcessing += cnt; }
  }

  const total = totalSuccess + totalFail + totalPending + totalProcessing;
  const successRate = (totalSuccess + totalFail) > 0
    ? Math.round(totalSuccess / (totalSuccess + totalFail) * 1000) / 10
    : 0;

  const breakdown = Object.entries(groups).map(([key, val]) => {
    const sr = (val.success + val.fail) > 0
      ? Math.round(val.success / (val.success + val.fail) * 1000) / 10
      : 0;
    return { group: key, ...val, successRate: sr };
  });

  return { total, success: totalSuccess, fail: totalFail, pending: totalPending, processing: totalProcessing, successRate, groupBy: groupByMode, breakdown };
}

// =========================================
// 09: message_diagnose_failures
// =========================================

export type MessageDiagnoseFailuresInput = {
  dateFrom?: string;
  dateTo?: string;
  msgType?: string;
};

export async function messageDiagnoseFailures(input: MessageDiagnoseFailuresInput) {
  const dateFrom = parseDateFilter(input.dateFrom) ?? todayStartKst();
  const dateTo = parseDateFilter(input.dateTo);
  const { channels, subTypeFilter } = resolveChannelFilter(input.msgType);

  const failWhere = buildWhereSql({ dateFrom, dateTo, messageState: 3, subTypeFilter });
  const allWhere = buildWhereSql({ dateFrom, dateTo, subTypeFilter });

  const failUnion = buildUnionSql(channels, 'create_date, result_code, result_net_id', failWhere);
  const allUnion = buildUnionSql(channels, 'msg_id', allWhere);

  // Total counts
  const totalCountSql = `SELECT COUNT(*) as total FROM (${allUnion.fragment}) t`;
  const failCountSql = `SELECT COUNT(*) as total FROM (${failUnion.fragment}) t`;

  // Hourly distribution
  const hourlySql = `SELECT HOUR(create_date) as h, COUNT(*) as cnt FROM (${failUnion.fragment}) t GROUP BY h ORDER BY h`;

  // ResultCode distribution
  const codeSql = `SELECT result_code, COUNT(*) as cnt FROM (${failUnion.fragment}) t GROUP BY result_code ORDER BY cnt DESC LIMIT 10`;

  // ResultNetId distribution
  const netSql = `SELECT result_net_id, COUNT(*) as cnt FROM (${failUnion.fragment}) t WHERE result_net_id IS NOT NULL GROUP BY result_net_id ORDER BY cnt DESC LIMIT 10`;

  const [totalResult, failResult, hourlyResult, codeResult, netResult] = await Promise.all([
    prisma.$queryRawUnsafe<{ total: bigint }[]>(totalCountSql, ...allUnion.params),
    prisma.$queryRawUnsafe<{ total: bigint }[]>(failCountSql, ...failUnion.params),
    prisma.$queryRawUnsafe<{ h: number; cnt: bigint }[]>(hourlySql, ...failUnion.params),
    prisma.$queryRawUnsafe<{ result_code: string | null; cnt: bigint }[]>(codeSql, ...failUnion.params),
    prisma.$queryRawUnsafe<{ result_net_id: string | null; cnt: bigint }[]>(netSql, ...failUnion.params),
  ]);

  const totalAll = Number(totalResult[0].total);
  const totalFail = Number(failResult[0].total);
  const failRate = totalAll > 0 ? Math.round(totalFail / totalAll * 1000) / 10 : 0;

  const hourly = hourlyResult.map(r => ({ hour: r.h, count: Number(r.cnt) }));
  const byCode = codeResult.map(r => ({ resultCode: r.result_code ?? '(없음)', count: Number(r.cnt) }));
  const byNet = netResult.map(r => ({ resultNetId: r.result_net_id ?? '(없음)', count: Number(r.cnt) }));

  // Pattern detection & diagnosis
  const diagnoses: string[] = [];

  if (totalFail === 0) {
    return { totalAll, totalFail, failRate, hourly, byCode, byNet, diagnoses: ['분석 기간 내 실패 건이 없습니다.'] };
  }

  // Time concentration
  if (hourly.length > 0) {
    const maxHour = hourly.reduce((a, b) => b.count > a.count ? b : a);
    if (maxHour.count / totalFail >= 0.8) {
      diagnoses.push(`${maxHour.hour}시에 실패의 ${Math.round(maxHour.count / totalFail * 100)}%가 집중 → 해당 시간대 일시 장애 추정`);
    }
  }

  // ResultCode concentration
  if (byCode.length > 0) {
    const topCode = byCode[0];
    if (topCode.count / totalFail >= 0.8) {
      const info = RESULT_CODE_MAP[topCode.resultCode];
      const desc = info ? info.description : topCode.resultCode;
      diagnoses.push(`결과코드 ${topCode.resultCode}(${desc})이 실패의 ${Math.round(topCode.count / totalFail * 100)}%를 차지 → 특정 원인에 의한 집중 실패`);
      if (topCode.resultCode.startsWith('5')) {
        diagnoses.push(`시스템 오류 계열 코드 집중 → 릴레이/통신사 연동 장애 가능성`);
      } else if (topCode.resultCode === '4100' || topCode.resultCode === '4200') {
        diagnoses.push(`수신 거부/결번 집중 → 수신번호 데이터 품질 점검 필요`);
      }
    }
  }

  // Carrier concentration
  if (byNet.length > 0) {
    const topNet = byNet[0];
    if (topNet.count / totalFail >= 0.8 && topNet.resultNetId !== '(없음)') {
      diagnoses.push(`통신사 ${topNet.resultNetId}에서 실패의 ${Math.round(topNet.count / totalFail * 100)}%가 발생 → 해당 통신사 측 이슈 추정`);
    }
  }

  if (diagnoses.length === 0) {
    diagnoses.push('특정 패턴이 감지되지 않았습니다. 실패가 여러 원인에 분산되어 있습니다.');
  }

  return { totalAll, totalFail, failRate, hourly, byCode, byNet, diagnoses };
}

// =========================================
// 10: message_daily_report
// =========================================

export type MessageDailyReportInput = {
  date?: string;
};

export async function messageDailyReport(input: MessageDailyReportInput) {
  let dayStart: Date;
  if (input.date && /^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    dayStart = new Date(input.date + 'T00:00:00Z');
  } else if (input.date) {
    dayStart = parseDateFilter(input.date)!;
  } else {
    dayStart = yesterdayStartKst();
  }
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  const channels: MsgType[] = [...VALID_MSG_TYPES];
  const where = buildWhereSql({ dateFrom: dayStart, dateTo: dayEnd });

  const union = buildUnionSql(channels, 'create_date, message_state, result_code, result_deliver_date', where);

  // Channel stats
  const channelSql = `SELECT _channel, message_state, COUNT(*) as cnt FROM (${union.fragment}) t GROUP BY _channel, message_state`;

  // Top fail codes
  const failWhere = buildWhereSql({ dateFrom: dayStart, dateTo: dayEnd, messageState: 3 });
  const failUnion = buildUnionSql(channels, 'result_code', failWhere);
  const failCodeSql = `SELECT result_code, COUNT(*) as cnt FROM (${failUnion.fragment}) t GROUP BY result_code ORDER BY cnt DESC LIMIT 5`;

  // Hourly distribution
  const hourlySql = `SELECT HOUR(create_date) as h, COUNT(*) as cnt FROM (${union.fragment}) t GROUP BY h ORDER BY h`;

  // Avg delivery time (for successful messages with result_deliver_date)
  const deliveryWhere = buildWhereSql({ dateFrom: dayStart, dateTo: dayEnd, messageState: 2 });
  const deliveryUnion = buildUnionSql(channels, 'create_date, result_deliver_date', deliveryWhere);
  const avgDeliverySql = `SELECT AVG(TIMESTAMPDIFF(SECOND, create_date, result_deliver_date)) as avg_sec FROM (${deliveryUnion.fragment}) t WHERE result_deliver_date IS NOT NULL`;

  const [channelResult, failCodeResult, hourlyResult, deliveryResult] = await Promise.all([
    prisma.$queryRawUnsafe<{ _channel: string; message_state: number; cnt: bigint }[]>(channelSql, ...union.params),
    prisma.$queryRawUnsafe<{ result_code: string | null; cnt: bigint }[]>(failCodeSql, ...failUnion.params),
    prisma.$queryRawUnsafe<{ h: number; cnt: bigint }[]>(hourlySql, ...union.params),
    prisma.$queryRawUnsafe<{ avg_sec: number | null }[]>(avgDeliverySql, ...deliveryUnion.params),
  ]);

  // Build channel breakdown
  const byChannel: Record<string, { total: number; success: number; fail: number; pending: number }> = {};
  let total = 0, success = 0, fail = 0, pending = 0;

  for (const row of channelResult) {
    const ch = row._channel;
    if (!byChannel[ch]) byChannel[ch] = { total: 0, success: 0, fail: 0, pending: 0 };
    const cnt = Number(row.cnt);
    byChannel[ch].total += cnt;
    total += cnt;
    if (row.message_state === 2) { byChannel[ch].success += cnt; success += cnt; }
    else if (row.message_state === 3) { byChannel[ch].fail += cnt; fail += cnt; }
    else { byChannel[ch].pending += cnt; pending += cnt; }
  }

  const successRate = (success + fail) > 0 ? Math.round(success / (success + fail) * 1000) / 10 : 0;
  const channelBreakdown = Object.entries(byChannel).map(([ch, val]) => ({
    channel: ch,
    ...val,
    successRate: (val.success + val.fail) > 0
      ? Math.round(val.success / (val.success + val.fail) * 1000) / 10
      : 0,
  }));

  const topFailCodes = failCodeResult.map(r => {
    const code = r.result_code ?? '(없음)';
    const info = RESULT_CODE_MAP[code];
    return { code, count: Number(r.cnt), description: info?.description ?? '알 수 없음' };
  });

  const hourlyDistribution = hourlyResult.map(r => ({ hour: r.h, count: Number(r.cnt) }));
  const avgDeliverySeconds = deliveryResult[0]?.avg_sec != null ? Math.round(deliveryResult[0].avg_sec * 10) / 10 : null;

  const dateStr = `${dayStart.getUTCFullYear()}-${String(dayStart.getUTCMonth() + 1).padStart(2, '0')}-${String(dayStart.getUTCDate()).padStart(2, '0')}`;

  return {
    date: dateStr,
    total,
    success,
    fail,
    pending,
    successRate,
    byChannel: channelBreakdown,
    topFailCodes,
    avgDeliverySeconds,
    hourlyDistribution,
  };
}

// =========================================
// 11: message_weekly_report
// =========================================

export type MessageWeeklyReportInput = {
  weekStartDate?: string;
};

export async function messageWeeklyReport(input: MessageWeeklyReportInput) {
  // 이번 주 시작일 결정 (기본: 7일 전 00:00 KST)
  let thisWeekStart: Date;
  if (input.weekStartDate && /^\d{4}-\d{2}-\d{2}$/.test(input.weekStartDate)) {
    thisWeekStart = new Date(input.weekStartDate + 'T00:00:00Z');
  } else if (input.weekStartDate) {
    thisWeekStart = parseDateFilter(input.weekStartDate)!;
  } else {
    const today = todayStartKst();
    thisWeekStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
  }
  const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  // 전주
  const prevWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevWeekEnd = new Date(thisWeekStart.getTime() - 1);

  const channels: MsgType[] = [...VALID_MSG_TYPES];

  // 이번 주: 일별 + 상태별 집계
  const thisWhere = buildWhereSql({ dateFrom: thisWeekStart, dateTo: thisWeekEnd });
  const thisUnion = buildUnionSql(channels, 'create_date, message_state, _channel', thisWhere);
  const thisDailySql = `SELECT DATE(create_date) as d, message_state, COUNT(*) as cnt FROM (${thisUnion.fragment}) t GROUP BY d, message_state ORDER BY d`;
  const thisChannelSql = `SELECT _channel, message_state, COUNT(*) as cnt FROM (${thisUnion.fragment}) t GROUP BY _channel, message_state`;

  // 전주: 총합만
  const prevWhere = buildWhereSql({ dateFrom: prevWeekStart, dateTo: prevWeekEnd });
  const prevUnion = buildUnionSql(channels, 'message_state', prevWhere);
  const prevSql = `SELECT message_state, COUNT(*) as cnt FROM (${prevUnion.fragment}) t GROUP BY message_state`;

  const [thisDailyResult, thisChannelResult, prevResult] = await Promise.all([
    prisma.$queryRawUnsafe<{ d: Date; message_state: number; cnt: bigint }[]>(thisDailySql, ...thisUnion.params),
    prisma.$queryRawUnsafe<{ _channel: string; message_state: number; cnt: bigint }[]>(thisChannelSql, ...thisUnion.params),
    prisma.$queryRawUnsafe<{ message_state: number; cnt: bigint }[]>(prevSql, ...prevUnion.params),
  ]);

  // 일별 표 데이터
  const dailyMap: Record<string, { total: number; success: number; fail: number; pending: number }> = {};
  for (const row of thisDailyResult) {
    const dateKey = row.d instanceof Date
      ? `${row.d.getUTCFullYear()}-${String(row.d.getUTCMonth() + 1).padStart(2, '0')}-${String(row.d.getUTCDate()).padStart(2, '0')}`
      : String(row.d);
    if (!dailyMap[dateKey]) dailyMap[dateKey] = { total: 0, success: 0, fail: 0, pending: 0 };
    const cnt = Number(row.cnt);
    dailyMap[dateKey].total += cnt;
    if (row.message_state === 2) dailyMap[dateKey].success += cnt;
    else if (row.message_state === 3) dailyMap[dateKey].fail += cnt;
    else dailyMap[dateKey].pending += cnt;
  }

  const daily = Object.entries(dailyMap).map(([date, val]) => ({
    date,
    ...val,
    successRate: (val.success + val.fail) > 0
      ? Math.round(val.success / (val.success + val.fail) * 1000) / 10
      : 0,
  }));

  // 이번 주 채널별 집계
  const channelMap: Record<string, { total: number; success: number; fail: number }> = {};
  let thisTotal = 0, thisSuccess = 0, thisFail = 0;
  for (const row of thisChannelResult) {
    if (!channelMap[row._channel]) channelMap[row._channel] = { total: 0, success: 0, fail: 0 };
    const cnt = Number(row.cnt);
    channelMap[row._channel].total += cnt;
    thisTotal += cnt;
    if (row.message_state === 2) { channelMap[row._channel].success += cnt; thisSuccess += cnt; }
    else if (row.message_state === 3) { channelMap[row._channel].fail += cnt; thisFail += cnt; }
  }

  const byChannel = Object.entries(channelMap).map(([ch, val]) => ({
    channel: ch,
    ...val,
    successRate: (val.success + val.fail) > 0
      ? Math.round(val.success / (val.success + val.fail) * 1000) / 10
      : 0,
  }));

  // 전주 집계
  let prevTotal = 0, prevSuccess = 0, prevFail = 0;
  for (const row of prevResult) {
    const cnt = Number(row.cnt);
    prevTotal += cnt;
    if (row.message_state === 2) prevSuccess += cnt;
    else if (row.message_state === 3) prevFail += cnt;
  }

  const thisSuccessRate = (thisSuccess + thisFail) > 0
    ? Math.round(thisSuccess / (thisSuccess + thisFail) * 1000) / 10 : 0;
  const prevSuccessRate = (prevSuccess + prevFail) > 0
    ? Math.round(prevSuccess / (prevSuccess + prevFail) * 1000) / 10 : 0;

  function changeRate(cur: number, prev: number): number | null {
    if (prev === 0) return cur > 0 ? 100 : null;
    return Math.round((cur - prev) / prev * 1000) / 10;
  }

  const weekStartStr = `${thisWeekStart.getUTCFullYear()}-${String(thisWeekStart.getUTCMonth() + 1).padStart(2, '0')}-${String(thisWeekStart.getUTCDate()).padStart(2, '0')}`;
  const weekEndStr = `${thisWeekEnd.getUTCFullYear()}-${String(thisWeekEnd.getUTCMonth() + 1).padStart(2, '0')}-${String(thisWeekEnd.getUTCDate()).padStart(2, '0')}`;

  return {
    period: `${weekStartStr} ~ ${weekEndStr}`,
    thisWeek: { total: thisTotal, success: thisSuccess, fail: thisFail, successRate: thisSuccessRate },
    prevWeek: { total: prevTotal, success: prevSuccess, fail: prevFail, successRate: prevSuccessRate },
    change: {
      totalRate: changeRate(thisTotal, prevTotal),
      successRate: changeRate(thisSuccess, prevSuccess),
      failRate: changeRate(thisFail, prevFail),
      successRateDiff: Math.round((thisSuccessRate - prevSuccessRate) * 10) / 10,
    },
    daily,
    byChannel,
  };
}

// =========================================
// 12: message_channel_breakdown
// =========================================

export type MessageChannelBreakdownInput = {
  dateFrom?: string;
  dateTo?: string;
};

export async function messageChannelBreakdown(input: MessageChannelBreakdownInput) {
  const dateFrom = parseDateFilter(input.dateFrom) ?? todayStartKst();
  const dateTo = parseDateFilter(input.dateTo);
  const channels: MsgType[] = [...VALID_MSG_TYPES];
  const where = buildWhereSql({ dateFrom, dateTo });

  const union = buildUnionSql(channels, 'msg_sub_type, message_state, _channel', where);
  const sql = `SELECT _channel, msg_sub_type, message_state, COUNT(*) as cnt FROM (${union.fragment}) t GROUP BY _channel, msg_sub_type, message_state ORDER BY _channel, msg_sub_type`;

  const rows = await prisma.$queryRawUnsafe<{ _channel: string; msg_sub_type: string; message_state: number; cnt: bigint }[]>(sql, ...union.params);

  // 채널 > subType 계층 집계
  const tree: Record<string, {
    total: number; success: number; fail: number; pending: number;
    subTypes: Record<string, { total: number; success: number; fail: number; pending: number }>;
  }> = {};
  let grandTotal = 0, grandSuccess = 0, grandFail = 0;

  for (const row of rows) {
    const ch = row._channel;
    const sub = row.msg_sub_type;
    const cnt = Number(row.cnt);

    if (!tree[ch]) tree[ch] = { total: 0, success: 0, fail: 0, pending: 0, subTypes: {} };
    if (!tree[ch].subTypes[sub]) tree[ch].subTypes[sub] = { total: 0, success: 0, fail: 0, pending: 0 };

    tree[ch].total += cnt;
    tree[ch].subTypes[sub].total += cnt;
    grandTotal += cnt;

    if (row.message_state === 2) {
      tree[ch].success += cnt; tree[ch].subTypes[sub].success += cnt; grandSuccess += cnt;
    } else if (row.message_state === 3) {
      tree[ch].fail += cnt; tree[ch].subTypes[sub].fail += cnt; grandFail += cnt;
    } else {
      tree[ch].pending += cnt; tree[ch].subTypes[sub].pending += cnt;
    }
  }

  const breakdown = Object.entries(tree).map(([ch, val]) => ({
    channel: ch,
    total: val.total,
    success: val.success,
    fail: val.fail,
    pending: val.pending,
    successRate: (val.success + val.fail) > 0
      ? Math.round(val.success / (val.success + val.fail) * 1000) / 10 : 0,
    share: grandTotal > 0 ? Math.round(val.total / grandTotal * 1000) / 10 : 0,
    subTypes: Object.entries(val.subTypes).map(([sub, sv]) => ({
      subType: sub,
      total: sv.total,
      success: sv.success,
      fail: sv.fail,
      pending: sv.pending,
      successRate: (sv.success + sv.fail) > 0
        ? Math.round(sv.success / (sv.success + sv.fail) * 1000) / 10 : 0,
      share: val.total > 0 ? Math.round(sv.total / val.total * 1000) / 10 : 0,
    })),
  }));

  return {
    total: grandTotal,
    success: grandSuccess,
    fail: grandFail,
    successRate: (grandSuccess + grandFail) > 0
      ? Math.round(grandSuccess / (grandSuccess + grandFail) * 1000) / 10 : 0,
    breakdown,
  };
}

// =========================================
// 13: message_delivery_time_stats
// =========================================

export type MessageDeliveryTimeStatsInput = {
  dateFrom?: string;
  dateTo?: string;
  msgType?: string;
};

const DELIVERY_BUCKETS = [
  { label: '1초 이내', maxSec: 1 },
  { label: '1~5초', maxSec: 5 },
  { label: '5~10초', maxSec: 10 },
  { label: '10~30초', maxSec: 30 },
  { label: '30~60초', maxSec: 60 },
  { label: '1~5분', maxSec: 300 },
  { label: '5분 초과', maxSec: Infinity },
];

export async function messageDeliveryTimeStats(input: MessageDeliveryTimeStatsInput) {
  const dateFrom = parseDateFilter(input.dateFrom) ?? todayStartKst();
  const dateTo = parseDateFilter(input.dateTo);
  const { channels, subTypeFilter } = resolveChannelFilter(input.msgType);
  const where = buildWhereSql({ dateFrom, dateTo, messageState: 2, subTypeFilter });

  const union = buildUnionSql(channels, 'create_date, result_deliver_date, _channel', where);

  // 구간별 CASE WHEN으로 버킷 분류
  const bucketSql = `
    SELECT
      CASE
        WHEN diff_sec <= 1 THEN 0
        WHEN diff_sec <= 5 THEN 1
        WHEN diff_sec <= 10 THEN 2
        WHEN diff_sec <= 30 THEN 3
        WHEN diff_sec <= 60 THEN 4
        WHEN diff_sec <= 300 THEN 5
        ELSE 6
      END as bucket,
      COUNT(*) as cnt
    FROM (
      SELECT TIMESTAMPDIFF(SECOND, create_date, result_deliver_date) as diff_sec
      FROM (${union.fragment}) t
      WHERE result_deliver_date IS NOT NULL
    ) d
    GROUP BY bucket
    ORDER BY bucket
  `;

  // 채널별 평균/최대/중앙값
  const channelStatsSql = `
    SELECT _channel,
      AVG(TIMESTAMPDIFF(SECOND, create_date, result_deliver_date)) as avg_sec,
      MAX(TIMESTAMPDIFF(SECOND, create_date, result_deliver_date)) as max_sec,
      MIN(TIMESTAMPDIFF(SECOND, create_date, result_deliver_date)) as min_sec,
      COUNT(*) as cnt
    FROM (${union.fragment}) t
    WHERE result_deliver_date IS NOT NULL
    GROUP BY _channel
  `;

  // 전체 통계
  const overallSql = `
    SELECT
      AVG(TIMESTAMPDIFF(SECOND, create_date, result_deliver_date)) as avg_sec,
      MAX(TIMESTAMPDIFF(SECOND, create_date, result_deliver_date)) as max_sec,
      MIN(TIMESTAMPDIFF(SECOND, create_date, result_deliver_date)) as min_sec,
      COUNT(*) as cnt
    FROM (${union.fragment}) t
    WHERE result_deliver_date IS NOT NULL
  `;

  const [bucketResult, channelStatsResult, overallResult] = await Promise.all([
    prisma.$queryRawUnsafe<{ bucket: number; cnt: bigint }[]>(bucketSql, ...union.params),
    prisma.$queryRawUnsafe<{ _channel: string; avg_sec: number | null; max_sec: number | null; min_sec: number | null; cnt: bigint }[]>(channelStatsSql, ...union.params),
    prisma.$queryRawUnsafe<{ avg_sec: number | null; max_sec: number | null; min_sec: number | null; cnt: bigint }[]>(overallSql, ...union.params),
  ]);

  // 히스토그램
  const totalWithDelivery = bucketResult.reduce((sum, r) => sum + Number(r.cnt), 0);
  const histogram = DELIVERY_BUCKETS.map((b, i) => {
    const row = bucketResult.find(r => Number(r.bucket) === i);
    const count = row ? Number(row.cnt) : 0;
    return {
      label: b.label,
      count,
      percentage: totalWithDelivery > 0 ? Math.round(count / totalWithDelivery * 1000) / 10 : 0,
    };
  });

  // 채널별
  const byChannel = channelStatsResult.map(r => ({
    channel: r._channel,
    count: Number(r.cnt),
    avgSeconds: r.avg_sec != null ? Math.round(r.avg_sec * 10) / 10 : null,
    maxSeconds: r.max_sec != null ? Number(r.max_sec) : null,
    minSeconds: r.min_sec != null ? Number(r.min_sec) : null,
  }));

  const overall = overallResult[0];

  return {
    totalMeasured: totalWithDelivery,
    overall: {
      avgSeconds: overall?.avg_sec != null ? Math.round(overall.avg_sec * 10) / 10 : null,
      maxSeconds: overall?.max_sec != null ? Number(overall.max_sec) : null,
      minSeconds: overall?.min_sec != null ? Number(overall.min_sec) : null,
    },
    histogram,
    byChannel,
  };
}

// =========================================
// 14: message_trend_compare
// =========================================

export type MessageTrendCompareInput = {
  periodA_from: string;
  periodA_to: string;
  periodB_from: string;
  periodB_to: string;
  groupBy?: string; // 'channel' | 'hour'
};

async function periodStats(dateFrom: Date, dateTo: Date, groupByMode: string) {
  const channels: MsgType[] = [...VALID_MSG_TYPES];
  const where = buildWhereSql({ dateFrom, dateTo });

  let groupSelect: string;
  if (groupByMode === 'hour') {
    groupSelect = 'HOUR(create_date) as grp';
  } else {
    groupSelect = '_channel as grp';
  }

  const union = buildUnionSql(channels, 'create_date, message_state, _channel', where);
  const sql = `SELECT ${groupSelect}, message_state, COUNT(*) as cnt FROM (${union.fragment}) t GROUP BY grp, message_state ORDER BY grp`;

  const rows = await prisma.$queryRawUnsafe<{ grp: unknown; message_state: number; cnt: bigint }[]>(sql, ...union.params);

  let total = 0, success = 0, fail = 0, pending = 0;
  const groups: Record<string, { total: number; success: number; fail: number; pending: number }> = {};

  for (const row of rows) {
    const key = String(row.grp);
    if (!groups[key]) groups[key] = { total: 0, success: 0, fail: 0, pending: 0 };
    const cnt = Number(row.cnt);
    groups[key].total += cnt;
    total += cnt;
    if (row.message_state === 2) { groups[key].success += cnt; success += cnt; }
    else if (row.message_state === 3) { groups[key].fail += cnt; fail += cnt; }
    else { groups[key].pending += cnt; pending += cnt; }
  }

  const successRate = (success + fail) > 0
    ? Math.round(success / (success + fail) * 1000) / 10 : 0;

  const breakdown = Object.entries(groups).map(([key, val]) => ({
    group: key,
    ...val,
    successRate: (val.success + val.fail) > 0
      ? Math.round(val.success / (val.success + val.fail) * 1000) / 10 : 0,
  }));

  return { total, success, fail, pending, successRate, breakdown };
}

export async function messageTrendCompare(input: MessageTrendCompareInput) {
  const aFrom = parseDateFilter(input.periodA_from);
  const aTo = parseDateFilter(input.periodA_to);
  const bFrom = parseDateFilter(input.periodB_from);
  const bTo = parseDateFilter(input.periodB_to);

  if (!aFrom || !aTo || !bFrom || !bTo) {
    throw new Error('periodA_from, periodA_to, periodB_from, periodB_to는 모두 필수입니다.');
  }

  const groupByMode = (input.groupBy ?? 'channel').toLowerCase();

  const [statsA, statsB] = await Promise.all([
    periodStats(aFrom, aTo, groupByMode),
    periodStats(bFrom, bTo, groupByMode),
  ]);

  function changeRate(cur: number, prev: number): number | null {
    if (prev === 0) return cur > 0 ? 100 : null;
    return Math.round((cur - prev) / prev * 1000) / 10;
  }

  // 그룹별 비교 표
  const allGroups = new Set([
    ...statsA.breakdown.map(b => b.group),
    ...statsB.breakdown.map(b => b.group),
  ]);

  const comparison = [...allGroups].sort().map(group => {
    const a = statsA.breakdown.find(b => b.group === group) ?? { total: 0, success: 0, fail: 0, pending: 0, successRate: 0 };
    const b = statsB.breakdown.find(b => b.group === group) ?? { total: 0, success: 0, fail: 0, pending: 0, successRate: 0 };
    return {
      group,
      periodA: { total: a.total, success: a.success, fail: a.fail, successRate: a.successRate },
      periodB: { total: b.total, success: b.success, fail: b.fail, successRate: b.successRate },
      change: {
        totalRate: changeRate(b.total, a.total),
        successRateDiff: Math.round((b.successRate - a.successRate) * 10) / 10,
      },
    };
  });

  return {
    periodA: { from: input.periodA_from, to: input.periodA_to, ...statsA, breakdown: undefined },
    periodB: { from: input.periodB_from, to: input.periodB_to, ...statsB, breakdown: undefined },
    change: {
      totalRate: changeRate(statsB.total, statsA.total),
      successRate: changeRate(statsB.success, statsA.success),
      failRate: changeRate(statsB.fail, statsA.fail),
      successRateDiff: Math.round((statsB.successRate - statsA.successRate) * 10) / 10,
    },
    groupBy: groupByMode,
    comparison,
  };
}
