import { prisma } from '../../lib/prisma';

const CHANNEL_TO_MSG_TYPE = {
  sms: 'SMS',
  rcs: 'RCS',
  atalk: 'AT',
} as const;

type Channel = keyof typeof CHANNEL_TO_MSG_TYPE;

export type EnqueueTranAlarmInput = {
  channel: Channel;
  msgSubType: string;
  destaddr: string;
  callback?: string;
  sendMsg: string;
  userId?: string;
  kisaCode?: string;
  billCode?: string;
  groupId?: string;
  requestDate?: string;
};

export type EnqueueTranAlarmResult = {
  msgId: string;
  msgType: string;
  msgSubType: string;
  destaddr: string;
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

function parseGroupId(value: string | undefined): bigint | undefined {
  if (!value) {
    return undefined;
  }

  if (!/^-?\d+$/.test(value)) {
    throw new Error('groupId는 정수 문자열이어야 합니다.');
  }

  return BigInt(value);
}

export async function enqueueTranAlarm(input: EnqueueTranAlarmInput): Promise<EnqueueTranAlarmResult> {
  const msgType = CHANNEL_TO_MSG_TYPE[input.channel];
  if (!msgType) {
    throw new Error('channel은 sms, rcs, atalk 중 하나여야 합니다.');
  }

  const msgSubType = ensureString(input.msgSubType, 'msgSubType', 5);
  const destaddr = normalizePhone(ensureString(input.destaddr, 'destaddr', 32), 'destaddr');
  const callbackRaw = input.callback ?? process.env.MCP_TRAN_DEFAULT_CALLBACK;
  const callback = normalizePhone(
    ensureString(callbackRaw, 'callback', 32),
    'callback',
  );

  const sendMsg = ensureString(input.sendMsg, 'sendMsg', 300);
  const userId = ensureOptionalString(input.userId, 'userId', 32) ?? process.env.MCP_TRAN_DEFAULT_USER_ID;
  const kisaCode = ensureOptionalString(input.kisaCode, 'kisaCode', 20) ?? process.env.MCP_TRAN_DEFAULT_KISA_CODE;
  const billCode = ensureOptionalString(input.billCode, 'billCode', 10) ?? process.env.MCP_TRAN_DEFAULT_BILL_CODE;
  const groupId = parseGroupId(input.groupId);
  const requestDate = parseRequestDate(input.requestDate);

  const created = await prisma.sendSmsTranAlarm.create({
    data: {
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
    },
  });

  return {
    msgId: created.msgId.toString(),
    msgType: created.msgType,
    msgSubType: created.msgSubType,
    destaddr: created.destaddr,
    requestDate: created.requestDate.toISOString(),
  };
}
