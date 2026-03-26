import { messageSend } from '../../feature/message/service';
import { ToolModule } from '../types';
import { readRequiredString, readOptionalString } from '../utils';

export const messageModule: ToolModule = {
  tools: [
    {
      name: 'message_send',
      description: '채널별 tran 테이블에 메시지 전송 요청을 적재합니다. SMS→sms_tran, LMS/MMS→mms_tran, KKO→kko_tran, RCS→rcs_tran',
      inputSchema: {
        type: 'object',
        properties: {
          msgType: { type: 'string', enum: ['SMS', 'MMS', 'KKO', 'RCS'], description: '메시지 유형 (SMS | MMS | KKO | RCS)' },
          msgSubType: { type: 'string', description: '메시지 세부 유형. SMS→SMS, MMS→LMS/MMS, KKO→KAT/KAI 등, RCS→RSM/RLM/RTT 등' },
          destaddr: { type: 'string', description: '착신 번호' },
          callback: { type: 'string', description: '회신 번호 (필수)' },
          sendMsg: { type: 'string', description: '메시지 본문' },
          subject: { type: 'string', description: '메시지 제목 (최대 120자, SMS 제외)' },
          filePath: { type: 'string', description: '첨부파일 경로 (콤마 구분, 최대 255자)' },
          userId: { type: 'string', description: '발송 사용자 ID' },
          kisaCode: { type: 'string', description: 'KISA 식별 코드' },
          billCode: { type: 'string', description: '과금 코드' },
          groupId: { type: 'string', description: '그룹 ID (정수 문자열)' },
          requestDate: { type: 'string', description: '전송 희망 일시(ISO 8601)' },
        },
        required: ['msgType', 'msgSubType', 'destaddr', 'callback', 'sendMsg'],
      },
    },
  ],

  async handle(name, args) {
    switch (name) {
      case 'message_send': {
        const result = await messageSend({
          msgType: readRequiredString(args, 'msgType'),
          msgSubType: readRequiredString(args, 'msgSubType'),
          destaddr: readRequiredString(args, 'destaddr'),
          callback: readRequiredString(args, 'callback'),
          sendMsg: readRequiredString(args, 'sendMsg'),
          subject: readOptionalString(args, 'subject'),
          filePath: readOptionalString(args, 'filePath'),
          userId: readOptionalString(args, 'userId'),
          kisaCode: readOptionalString(args, 'kisaCode'),
          billCode: readOptionalString(args, 'billCode'),
          groupId: readOptionalString(args, 'groupId'),
          requestDate: readOptionalString(args, 'requestDate'),
        });
        return [`message_send 적재 성공`, `table: ${result.tableName}`, `msg_id: ${result.msgId}`, `msg_type: ${result.msgType}`, `msg_sub_type: ${result.msgSubType}`, `destaddr: ${result.destaddr}`, `request_date: ${result.requestDate}`].join('\n');
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  },
};
