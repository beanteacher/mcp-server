import { enqueueTranAlarm } from '../../feature/message/service';
import { ToolModule } from '../types';
import { readRequiredString, readOptionalString } from '../utils';

export const messageModule: ToolModule = {
  tools: [
    {
      name: 'send_sms_tran_alarm',
      description: '문자/SMS, RCS, 알림톡 발송을 위해 send_sms_tran_alarm 테이블에 전송 요청을 적재합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          channel: { type: 'string', enum: ['sms', 'rcs', 'atalk'], description: '발송 채널 (sms | rcs | atalk)' },
          msgSubType: { type: 'string', description: '메시지 세부 유형 (최대 5자)' },
          destaddr: { type: 'string', description: '착신 번호' },
          callback: { type: 'string', description: '회신 번호' },
          sendMsg: { type: 'string', description: '메시지 본문 (최대 300자)' },
          userId: { type: 'string', description: '발송 사용자 ID' },
          kisaCode: { type: 'string', description: 'KISA 식별 코드' },
          billCode: { type: 'string', description: '과금 코드' },
          groupId: { type: 'string', description: '그룹 ID (정수 문자열)' },
          requestDate: { type: 'string', description: '전송 희망 일시(ISO 8601)' },
        },
        required: ['channel', 'msgSubType', 'destaddr', 'sendMsg'],
      },
    },
  ],

  async handle(name, args) {
    switch (name) {
      case 'send_sms_tran_alarm': {
        const result = await enqueueTranAlarm({
          channel: readRequiredString(args, 'channel') as 'sms' | 'rcs' | 'atalk',
          msgSubType: readRequiredString(args, 'msgSubType'),
          destaddr: readRequiredString(args, 'destaddr'),
          callback: readOptionalString(args, 'callback'),
          sendMsg: readRequiredString(args, 'sendMsg'),
          userId: readOptionalString(args, 'userId'),
          kisaCode: readOptionalString(args, 'kisaCode'),
          billCode: readOptionalString(args, 'billCode'),
          groupId: readOptionalString(args, 'groupId'),
          requestDate: readOptionalString(args, 'requestDate'),
        });
        return [`send_sms_tran_alarm 적재 성공`, `msg_id: ${result.msgId}`, `destaddr: ${result.destaddr}`, `request_date: ${result.requestDate}`].join('\n');
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },
};
