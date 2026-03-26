import { prisma } from '../../lib/prisma';

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
  SMS: 'mcp_agent_sms_tran',
  MMS: 'mcp_agent_mms_tran',
  KKO: 'mcp_agent_kko_tran',
  RCS: 'mcp_agent_rcs_tran',
};

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

  return date;
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
  const requestDate = parseRequestDate(input.requestDate);

  const model = getModel(msgType);
  const created = await (model as typeof prisma.mcpAgentSmsTran).create({
    data: {
      msgType,
      msgSubType,
      destaddr,
      callback,
      sendMsg,
      subject,
      filePath,
      fileCount,
      userId,
      kisaCode,
      billCode,
      groupId,
      requestDate,
    },
  });

  return {
    msgId: created.msgId.toString(),
    msgType: created.msgType,
    msgSubType: created.msgSubType,
    destaddr: created.destaddr,
    tableName: TABLE_NAMES[msgType],
    requestDate: created.requestDate.toISOString(),
  };
}
