import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma mock 설정 (모듈 로드 전에 mock해야 함)
vi.mock('../../lib/prisma', () => {
  const mockCreate = vi.fn().mockImplementation(({ data }) => ({
    msgId: BigInt(99),
    msgType: data.msgType,
    msgSubType: data.msgSubType,
    destaddr: data.destaddr,
    requestDate: data.requestDate,
  }));

  return {
    prisma: {
      mcpAgentSmsTran: { create: mockCreate },
      mcpAgentMmsTran: { create: mockCreate },
      mcpAgentKkoTran: { create: mockCreate },
      mcpAgentRcsTran: { create: mockCreate },
    },
  };
});

import { messageSend } from './service';
import { prisma } from '../../lib/prisma';

describe('messageSend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('SMS 전송 요청이 올바르게 적재', async () => {
    const result = await messageSend({
      msgType: 'SMS',
      msgSubType: 'SMS',
      destaddr: '010-1234-5678',
      callback: '02-000-1234',
      sendMsg: '테스트 메시지',
    });

    expect(result.msgId).toBe('99');
    expect(result.msgType).toBe('SMS');
    expect(result.msgSubType).toBe('SMS');
    expect(result.destaddr).toBe('01012345678');
    expect(result.tableName).toBe('MCP_AGENT_SMS_TRAN');
    expect(result.requestDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/);
  });

  it('MMS 전송 요청', async () => {
    const result = await messageSend({
      msgType: 'MMS',
      msgSubType: 'LMS',
      destaddr: '01012345678',
      callback: '020001234',
      sendMsg: '긴 메시지',
      subject: '제목',
    });

    expect(result.tableName).toBe('MCP_AGENT_MMS_TRAN');
    expect(result.msgSubType).toBe('LMS');
  });

  it('KKO 전송 요청', async () => {
    const result = await messageSend({
      msgType: 'KKO',
      msgSubType: 'KAT',
      destaddr: '01012345678',
      callback: '020001234',
      sendMsg: '카카오 메시지',
    });

    expect(result.tableName).toBe('MCP_AGENT_KKO_TRAN');
  });

  it('RCS 전송 요청', async () => {
    const result = await messageSend({
      msgType: 'RCS',
      msgSubType: 'RSM',
      destaddr: '01012345678',
      callback: '020001234',
      sendMsg: 'RCS 메시지',
    });

    expect(result.tableName).toBe('MCP_AGENT_RCS_TRAN');
  });

  it('잘못된 msgType이면 에러', async () => {
    await expect(
      messageSend({
        msgType: 'INVALID',
        msgSubType: 'SMS',
        destaddr: '01012345678',
        callback: '020001234',
        sendMsg: '테스트',
      }),
    ).rejects.toThrow('msgType은 SMS, MMS, KKO, RCS 중 하나여야 합니다.');
  });

  it('잘못된 msgSubType이면 에러', async () => {
    await expect(
      messageSend({
        msgType: 'SMS',
        msgSubType: 'LMS',
        destaddr: '01012345678',
        callback: '020001234',
        sendMsg: '테스트',
      }),
    ).rejects.toThrow('msgType SMS의 msgSubType은 SMS 중 하나여야 합니다.');
  });

  it('destaddr가 비어있으면 에러', async () => {
    await expect(
      messageSend({
        msgType: 'SMS',
        msgSubType: 'SMS',
        destaddr: '',
        callback: '020001234',
        sendMsg: '테스트',
      }),
    ).rejects.toThrow('destaddr');
  });

  it('sendMsg가 비어있으면 에러', async () => {
    await expect(
      messageSend({
        msgType: 'SMS',
        msgSubType: 'SMS',
        destaddr: '01012345678',
        callback: '020001234',
        sendMsg: '  ',
      }),
    ).rejects.toThrow('sendMsg');
  });

  it('전화번호에서 하이픈/공백을 제거', async () => {
    const result = await messageSend({
      msgType: 'SMS',
      msgSubType: 'SMS',
      destaddr: '010-1111-2222',
      callback: '02-000-1234',
      sendMsg: '테스트',
    });

    expect(result.destaddr).toBe('01011112222');
  });

  it('requestDate 포맷이 KST +09:00', async () => {
    const result = await messageSend({
      msgType: 'SMS',
      msgSubType: 'SMS',
      destaddr: '01012345678',
      callback: '020001234',
      sendMsg: '테스트',
    });

    expect(result.requestDate).toContain('+09:00');
  });

  it('Prisma create에 KST 시프트된 Date가 전달', async () => {
    await messageSend({
      msgType: 'SMS',
      msgSubType: 'SMS',
      destaddr: '01012345678',
      callback: '020001234',
      sendMsg: '테스트',
    });

    const mockCreate = (prisma.mcpAgentSmsTran.create as ReturnType<typeof vi.fn>);
    expect(mockCreate).toHaveBeenCalledOnce();

    const calledData = mockCreate.mock.calls[0][0].data;
    const requestDate: Date = calledData.requestDate;
    const createDate: Date = calledData.createDate;

    // KST 시프트: UTC 기준으로 현재 시각 + 9시간이어야 함
    const nowUtc = Date.now();
    const kstShifted = nowUtc + 9 * 60 * 60 * 1000;
    // 5초 이내 차이
    expect(Math.abs(requestDate.getTime() - kstShifted)).toBeLessThan(5000);
    expect(Math.abs(createDate.getTime() - kstShifted)).toBeLessThan(5000);
  });

  it('소문자 msgType도 정상 처리', async () => {
    const result = await messageSend({
      msgType: 'sms',
      msgSubType: 'sms',
      destaddr: '01012345678',
      callback: '020001234',
      sendMsg: '테스트',
    });

    expect(result.msgType).toBe('SMS');
  });
});
