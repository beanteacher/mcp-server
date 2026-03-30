import {
  messageSend,
  messageGetResult,
  messageSearch,
  messageFindFailures,
  messageResultCodeExplain,
  messageCheckPending,
  messageRetry,
  messageCancel,
  messageStatSummary,
  messageDiagnoseFailures,
  messageDailyReport,
  messageWeeklyReport,
  messageChannelBreakdown,
  messageDeliveryTimeStats,
  messageTrendCompare,
} from '../../feature/message/service';
import { ToolModule } from '../types';
import { readRequiredString, readOptionalString, readNumber } from '../utils';

function stateLabel(s: number): string {
  if (s === 0) return '대기';
  if (s === 1) return '발송중';
  if (s === 2) return '발송완료(성공)';
  if (s === 3) return '발송완료(실패)';
  if (s === 4) return '취소';
  return `상태코드(${s})`;
}

function readStringArray(args: Record<string, unknown>, key: string): string[] | undefined {
  const value = args[key];
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map(v => String(v));
  if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
  throw new Error(`${key}는 문자열 배열이어야 합니다.`);
}

export const messageModule: ToolModule = {
  tools: [
    {
      name: 'message_get_result',
      description: 'msgId로 발송 결과를 단건 조회합니다. SMS/MMS/KKO/RCS 4개 테이블을 모두 검색하여 결과를 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          msgId: { type: 'string', description: '메시지 ID (정수 문자열)' },
        },
        required: ['msgId'],
      },
    },
    {
      name: 'message_search',
      description: '다중 조건으로 발송 결과를 검색합니다. 날짜/수신번호/채널/상태 등 조합 검색 + 페이징을 지원합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', description: '검색 시작일시 (ISO 8601 또는 YYYY-MM-DD, 기본: 오늘 00:00 KST)' },
          dateTo: { type: 'string', description: '검색 종료일시' },
          destaddr: { type: 'string', description: '수신번호 (부분 일치)' },
          msgType: { type: 'string', description: '채널 필터 (SMS/MMS/KKO/RCS 또는 세부유형)' },
          messageState: { type: 'number', description: '발송상태 (0=대기, 1=처리중, 2=성공, 3=실패, 4=취소)' },
          userId: { type: 'string', description: '발송 요청자' },
          groupId: { type: 'string', description: '그룹 ID' },
          page: { type: 'number', description: '페이지 번호 (기본: 1)' },
          size: { type: 'number', description: '페이지 크기 (기본: 20, 최대: 100)' },
        },
      },
    },
    {
      name: 'message_find_failures',
      description: '실패 건만 필터링하여 조회합니다. resultCode별 건수 요약도 함께 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', description: '검색 시작일시' },
          dateTo: { type: 'string', description: '검색 종료일시' },
          msgType: { type: 'string', description: '채널 필터' },
          resultCode: { type: 'string', description: '특정 결과코드만 필터' },
          page: { type: 'number', description: '페이지 번호 (기본: 1)' },
          size: { type: 'number', description: '페이지 크기 (기본: 20, 최대: 100)' },
        },
      },
    },
    {
      name: 'message_result_code_explain',
      description: '통신사 결과코드(resultCode)를 사람이 읽을 수 있는 사유로 해석합니다. 코드 미지정 시 전체 목록을 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          resultCode: { type: 'string', description: '조회할 결과코드 (미지정 시 전체 목록)' },
        },
      },
    },
    {
      name: 'message_check_pending',
      description: '현재 대기/처리중 상태인 건수를 채널별로 조회합니다. 일정 시간 이상 체류 중인 건 경고도 제공합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          olderThanMinutes: { type: 'number', description: 'N분 이상 대기 중인 건만 (기본: 0 = 전체)' },
          msgType: { type: 'string', description: '채널 필터' },
        },
      },
    },
    {
      name: 'message_retry',
      description: '실패 건의 messageState를 대기(0)로 리셋하여 재발송 대기열에 복귀시킵니다. msgIds 또는 조건(resultCode+기간)으로 지정합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          msgIds: { type: 'array', items: { type: 'string' }, description: '재발송할 메시지 ID 목록' },
          resultCode: { type: 'string', description: '이 결과코드의 실패 건 일괄 재발송' },
          dateFrom: { type: 'string', description: '대상 기간 시작' },
          dateTo: { type: 'string', description: '대상 기간 종료' },
          maxCount: { type: 'number', description: '최대 재발송 건수 (기본: 100)' },
        },
      },
    },
    {
      name: 'message_cancel',
      description: '미발송(대기) 상태인 건을 취소 상태로 변경합니다. msgIds 또는 groupId로 지정합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          msgIds: { type: 'array', items: { type: 'string' }, description: '취소할 메시지 ID 목록' },
          groupId: { type: 'string', description: '그룹 단위 일괄 취소' },
        },
      },
    },
    {
      name: 'message_stat_summary',
      description: '기간별 발송 건수/성공/실패/대기 통계를 집계합니다. 채널별, 시간대별, 일별 groupBy를 지원합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', description: '시작일시 (기본: 오늘 00:00 KST)' },
          dateTo: { type: 'string', description: '종료일시' },
          groupBy: { type: 'string', enum: ['channel', 'hour', 'day'], description: '그룹핑 기준 (기본: channel)' },
        },
      },
    },
    {
      name: 'message_diagnose_failures',
      description: '실패 건을 시간대/결과코드/통신사 축으로 분석하여 패턴과 추정 원인을 자동 진단합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', description: '분석 기간 시작' },
          dateTo: { type: 'string', description: '분석 기간 종료' },
          msgType: { type: 'string', description: '채널 필터' },
        },
      },
    },
    {
      name: 'message_daily_report',
      description: '특정 일자의 발송 종합 리포트를 생성합니다. 채널별 성공률, 평균 수신소요시간, top 실패코드, 시간대별 발송량을 포함합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: '대상 일자 (YYYY-MM-DD, 기본: 어제)' },
        },
      },
    },
    {
      name: 'message_weekly_report',
      description: '주간 발송 리포트를 생성합니다. 7일간 일별 추이 표, 채널별 집계, 전주 대비 증감률을 포함합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          weekStartDate: { type: 'string', description: '주간 시작일 (YYYY-MM-DD, 기본: 7일 전)' },
        },
      },
    },
    {
      name: 'message_channel_breakdown',
      description: '채널별 세부유형(subType) 분해 통계입니다. SMS/LMS/MMS/KAT/KAI/RSM 등 세부 유형별 건수·성공률·비중을 표로 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', description: '시작일시 (기본: 오늘 00:00 KST)' },
          dateTo: { type: 'string', description: '종료일시' },
        },
      },
    },
    {
      name: 'message_delivery_time_stats',
      description: '수신 소요시간 분포를 구간별 히스토그램으로 반환합니다. 1초/5초/10초/30초/60초/5분 구간 + 채널별 평균·최대·최소를 포함합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string', description: '시작일시 (기본: 오늘 00:00 KST)' },
          dateTo: { type: 'string', description: '종료일시' },
          msgType: { type: 'string', description: '채널 필터 (SMS/MMS/KKO/RCS 또는 세부유형)' },
        },
      },
    },
    {
      name: 'message_trend_compare',
      description: '두 기간의 발송 통계를 나란히 비교합니다. 전체 증감률 + 그룹별(채널/시간대) 비교 표를 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          periodA_from: { type: 'string', description: '기간A 시작일시 (기준 기간)' },
          periodA_to: { type: 'string', description: '기간A 종료일시' },
          periodB_from: { type: 'string', description: '기간B 시작일시 (비교 기간)' },
          periodB_to: { type: 'string', description: '기간B 종료일시' },
          groupBy: { type: 'string', enum: ['channel', 'hour'], description: '비교 그룹핑 기준 (기본: channel)' },
        },
        required: ['periodA_from', 'periodA_to', 'periodB_from', 'periodB_to'],
      },
    },
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
      // --- 01: message_get_result ---
      case 'message_get_result': {
        const row = await messageGetResult({ msgId: readRequiredString(args, 'msgId') });
        const lines = [
          `[${row.channel}] 발송 결과 조회`,
          `table: ${row.tableName}`,
          `msg_id: ${row.msgId}`,
          `msg_type: ${row.msgType} / ${row.msgSubType}`,
          `수신번호: ${row.destaddr}`,
          `발신번호: ${row.callback}`,
          `메시지: ${row.sendMsg ?? '(없음)'}`,
        ];
        if (row.subject) lines.push(`제목: ${row.subject}`);
        lines.push(
          `발송상태: ${stateLabel(row.messageState)}`,
          `결과코드: ${row.resultCode ?? '(없음)'}`,
          `결과수신시간: ${row.resultDeliverDate ?? '(없음)'}`,
          `등록일시: ${row.createDate}`,
          `발송요청일시: ${row.requestDate}`,
        );
        return lines.join('\n');
      }

      // --- 02: message_search ---
      case 'message_search': {
        const result = await messageSearch({
          dateFrom: readOptionalString(args, 'dateFrom'),
          dateTo: readOptionalString(args, 'dateTo'),
          destaddr: readOptionalString(args, 'destaddr'),
          msgType: readOptionalString(args, 'msgType'),
          messageState: args.messageState !== undefined ? readNumber(args, 'messageState', 0) : undefined,
          userId: readOptionalString(args, 'userId'),
          groupId: readOptionalString(args, 'groupId'),
          page: readNumber(args, 'page', 1),
          size: readNumber(args, 'size', 20),
        });
        if (result.items.length === 0) return `검색 결과가 없습니다. (전체 ${result.total}건)`;
        const header = `검색 결과: ${result.total}건 (${result.page}/${result.totalPages} 페이지)`;
        const rows = result.items.map(r =>
          `[${r.channel}] msg_id:${r.msgId} | ${r.destaddr} | ${stateLabel(r.messageState)} | ${r.resultCode ?? '-'} | ${r.createDate}`
        );
        return [header, '---', ...rows].join('\n');
      }

      // --- 03: message_find_failures ---
      case 'message_find_failures': {
        const result = await messageFindFailures({
          dateFrom: readOptionalString(args, 'dateFrom'),
          dateTo: readOptionalString(args, 'dateTo'),
          msgType: readOptionalString(args, 'msgType'),
          resultCode: readOptionalString(args, 'resultCode'),
          page: readNumber(args, 'page', 1),
          size: readNumber(args, 'size', 20),
        });
        if (result.total === 0) return '실패 건이 없습니다.';
        const header = `실패 건: ${result.total}건 (${result.page}/${result.totalPages} 페이지)`;
        const summary = result.resultCodeSummary.map(s => `  ${s.resultCode}: ${s.count}건`);
        const rows = result.items.map(r =>
          `[${r.channel}] msg_id:${r.msgId} | ${r.destaddr} | code:${r.resultCode ?? '-'} | ${r.createDate}`
        );
        return [header, '', '결과코드별 요약:', ...summary, '', '---', ...rows].join('\n');
      }

      // --- 04: message_result_code_explain ---
      case 'message_result_code_explain': {
        const result = messageResultCodeExplain({
          resultCode: readOptionalString(args, 'resultCode'),
        });
        const lines = result.codes.map(c =>
          `${c.code}: ${c.description} [${c.category}] ${c.retryable ? '(재시도 가능)' : '(재시도 불가)'}`
        );
        return lines.join('\n');
      }

      // --- 05: message_check_pending ---
      case 'message_check_pending': {
        const result = await messageCheckPending({
          olderThanMinutes: args.olderThanMinutes !== undefined ? readNumber(args, 'olderThanMinutes', 0) : undefined,
          msgType: readOptionalString(args, 'msgType'),
        });
        const lines = [
          `대기/처리중 현황`,
          `전체: ${result.totalAll}건 (대기: ${result.totalPending} / 처리중: ${result.totalProcessing})`,
          '',
          '채널별:',
        ];
        for (const [ch, val] of Object.entries(result.byChannel)) {
          lines.push(`  ${ch}: ${val.total}건 (대기: ${val.pending} / 처리중: ${val.processing})`);
        }
        if (result.oldest) {
          lines.push('', `가장 오래된 대기 건: ${result.oldest.createDate} (${result.oldest.channel})`);
        }
        if (result.olderThanMinutes > 0) {
          lines.push('', `${result.olderThanMinutes}분 이상 체류 건: ${result.staleCount}건${result.staleCount > 0 ? ' ⚠️' : ''}`);
        }
        return lines.join('\n');
      }

      // --- 06: message_retry ---
      case 'message_retry': {
        const result = await messageRetry({
          msgIds: readStringArray(args, 'msgIds'),
          resultCode: readOptionalString(args, 'resultCode'),
          dateFrom: readOptionalString(args, 'dateFrom'),
          dateTo: readOptionalString(args, 'dateTo'),
          maxCount: args.maxCount !== undefined ? readNumber(args, 'maxCount', 100) : undefined,
        });
        const lines = [`재발송 처리 완료: ${result.totalRetried}건`];
        if (result.retriedIds.length > 0 && result.retriedIds.length <= 20) {
          lines.push(`대상 msgId: ${result.retriedIds.join(', ')}`);
        }
        if (result.warnings.length > 0) {
          lines.push('', '경고:', ...result.warnings.map(w => `  ${w}`));
        }
        return lines.join('\n');
      }

      // --- 07: message_cancel ---
      case 'message_cancel': {
        const result = await messageCancel({
          msgIds: readStringArray(args, 'msgIds'),
          groupId: readOptionalString(args, 'groupId'),
        });
        const lines = [
          `취소 처리 완료`,
          `취소 성공: ${result.totalCancelled}건`,
          `취소 불가 (이미 발송): ${result.totalNotCancellable}건`,
        ];
        return lines.join('\n');
      }

      // --- 08: message_stat_summary ---
      case 'message_stat_summary': {
        const result = await messageStatSummary({
          dateFrom: readOptionalString(args, 'dateFrom'),
          dateTo: readOptionalString(args, 'dateTo'),
          groupBy: readOptionalString(args, 'groupBy'),
        });
        const lines = [
          `발송 통계 요약 (groupBy: ${result.groupBy})`,
          `전체: ${result.total}건 | 성공: ${result.success} | 실패: ${result.fail} | 대기: ${result.pending} | 처리중: ${result.processing}`,
          `성공률: ${result.successRate}%`,
          '',
        ];
        for (const b of result.breakdown) {
          const label = result.groupBy === 'hour' ? `${b.group}시` : b.group;
          lines.push(`  ${label}: ${b.total}건 (성공:${b.success} 실패:${b.fail} 대기:${b.pending}) 성공률:${b.successRate}%`);
        }
        return lines.join('\n');
      }

      // --- 09: message_diagnose_failures ---
      case 'message_diagnose_failures': {
        const result = await messageDiagnoseFailures({
          dateFrom: readOptionalString(args, 'dateFrom'),
          dateTo: readOptionalString(args, 'dateTo'),
          msgType: readOptionalString(args, 'msgType'),
        });
        const lines = [
          `실패 진단 결과`,
          `전체: ${result.totalAll}건 | 실패: ${result.totalFail}건 | 실패율: ${result.failRate}%`,
          '',
          '시간대별 실패 분포:',
          ...result.hourly.map(h => `  ${h.hour}시: ${h.count}건`),
          '',
          '결과코드별 분포 (상위):',
          ...result.byCode.map(c => `  ${c.resultCode}: ${c.count}건`),
          '',
          '통신사별 분포:',
          ...result.byNet.map(n => `  ${n.resultNetId}: ${n.count}건`),
          '',
          '진단:',
          ...result.diagnoses.map(d => `  • ${d}`),
        ];
        return lines.join('\n');
      }

      // --- 10: message_daily_report ---
      case 'message_daily_report': {
        const result = await messageDailyReport({
          date: readOptionalString(args, 'date'),
        });
        const lines = [
          `[${result.date}] 일간 발송 리포트`,
          `전체: ${result.total}건 | 성공: ${result.success} | 실패: ${result.fail} | 대기: ${result.pending}`,
          `성공률: ${result.successRate}%`,
          result.avgDeliverySeconds != null ? `평균 수신 소요시간: ${result.avgDeliverySeconds}초` : '평균 수신 소요시간: (데이터 없음)',
          '',
          '채널별:',
          ...result.byChannel.map(c => `  ${c.channel}: ${c.total}건 (성공:${c.success} 실패:${c.fail}) 성공률:${c.successRate}%`),
          '',
          'Top 실패코드:',
          ...result.topFailCodes.map(f => `  ${f.code}: ${f.count}건 - ${f.description}`),
          '',
          '시간대별 발송량:',
          ...result.hourlyDistribution.map(h => `  ${String(h.hour).padStart(2, '0')}시: ${h.count}건`),
        ];
        return lines.join('\n');
      }

      // --- 11: message_weekly_report ---
      case 'message_weekly_report': {
        const result = await messageWeeklyReport({
          weekStartDate: readOptionalString(args, 'weekStartDate'),
        });
        const lines = [
          `[주간 발송 리포트] ${result.period}`,
          '',
          '■ 전체 요약',
          `  이번 주: ${result.thisWeek.total}건 (성공:${result.thisWeek.success} 실패:${result.thisWeek.fail}) 성공률:${result.thisWeek.successRate}%`,
          `  전    주: ${result.prevWeek.total}건 (성공:${result.prevWeek.success} 실패:${result.prevWeek.fail}) 성공률:${result.prevWeek.successRate}%`,
          '',
          '■ 전주 대비 증감',
          `  발송량: ${result.change.totalRate != null ? (result.change.totalRate > 0 ? '+' : '') + result.change.totalRate + '%' : '-'}`,
          `  성공건: ${result.change.successRate != null ? (result.change.successRate > 0 ? '+' : '') + result.change.successRate + '%' : '-'}`,
          `  실패건: ${result.change.failRate != null ? (result.change.failRate > 0 ? '+' : '') + result.change.failRate + '%' : '-'}`,
          `  성공률: ${(result.change.successRateDiff > 0 ? '+' : '') + result.change.successRateDiff}%p`,
          '',
          '■ 일별 추이',
          '  날짜       | 전체  | 성공  | 실패  | 성공률',
          '  -----------|-------|-------|-------|-------',
        ];
        for (const d of result.daily) {
          lines.push(`  ${d.date} | ${String(d.total).padStart(5)} | ${String(d.success).padStart(5)} | ${String(d.fail).padStart(5)} | ${d.successRate}%`);
        }
        if (result.byChannel.length > 0) {
          lines.push('', '■ 채널별 집계');
          for (const c of result.byChannel) {
            lines.push(`  ${c.channel}: ${c.total}건 (성공:${c.success} 실패:${c.fail}) 성공률:${c.successRate}%`);
          }
        }
        return lines.join('\n');
      }

      // --- 12: message_channel_breakdown ---
      case 'message_channel_breakdown': {
        const result = await messageChannelBreakdown({
          dateFrom: readOptionalString(args, 'dateFrom'),
          dateTo: readOptionalString(args, 'dateTo'),
        });
        const lines = [
          `[채널별 세부유형 분해]`,
          `전체: ${result.total}건 | 성공: ${result.success} | 실패: ${result.fail} | 성공률: ${result.successRate}%`,
          '',
          '  채널  | 유형  | 건수   | 성공  | 실패  | 성공률 | 비중',
          '  ------|-------|--------|-------|-------|--------|------',
        ];
        for (const ch of result.breakdown) {
          lines.push(`  ${ch.channel.padEnd(5)} | (소계) | ${String(ch.total).padStart(6)} | ${String(ch.success).padStart(5)} | ${String(ch.fail).padStart(5)} | ${ch.successRate}% | ${ch.share}%`);
          for (const sub of ch.subTypes) {
            lines.push(`        | ${sub.subType.padEnd(5)} | ${String(sub.total).padStart(6)} | ${String(sub.success).padStart(5)} | ${String(sub.fail).padStart(5)} | ${sub.successRate}% | ${sub.share}%`);
          }
        }
        return lines.join('\n');
      }

      // --- 13: message_delivery_time_stats ---
      case 'message_delivery_time_stats': {
        const result = await messageDeliveryTimeStats({
          dateFrom: readOptionalString(args, 'dateFrom'),
          dateTo: readOptionalString(args, 'dateTo'),
          msgType: readOptionalString(args, 'msgType'),
        });
        const lines = [
          `[수신 소요시간 분포]`,
          `측정 대상: ${result.totalMeasured}건 (result_deliver_date가 있는 성공 건)`,
        ];
        if (result.overall.avgSeconds != null) {
          lines.push(`전체 평균: ${result.overall.avgSeconds}초 | 최소: ${result.overall.minSeconds}초 | 최대: ${result.overall.maxSeconds}초`);
        }
        lines.push('', '■ 구간별 분포');
        lines.push('  구간       | 건수   | 비율');
        lines.push('  -----------|--------|------');
        for (const h of result.histogram) {
          const bar = '█'.repeat(Math.max(1, Math.round(h.percentage / 5)));
          lines.push(`  ${h.label.padEnd(9)} | ${String(h.count).padStart(6)} | ${h.percentage}% ${bar}`);
        }
        if (result.byChannel.length > 0) {
          lines.push('', '■ 채널별 소요시간');
          for (const c of result.byChannel) {
            lines.push(`  ${c.channel}: 평균 ${c.avgSeconds ?? '-'}초 | 최소 ${c.minSeconds ?? '-'}초 | 최대 ${c.maxSeconds ?? '-'}초 (${c.count}건)`);
          }
        }
        return lines.join('\n');
      }

      // --- 14: message_trend_compare ---
      case 'message_trend_compare': {
        const result = await messageTrendCompare({
          periodA_from: readRequiredString(args, 'periodA_from'),
          periodA_to: readRequiredString(args, 'periodA_to'),
          periodB_from: readRequiredString(args, 'periodB_from'),
          periodB_to: readRequiredString(args, 'periodB_to'),
          groupBy: readOptionalString(args, 'groupBy'),
        });
        const a = result.periodA;
        const b = result.periodB;
        const lines = [
          `[기간 비교] (groupBy: ${result.groupBy})`,
          '',
          '■ 전체 요약',
          `  기간A (${a.from} ~ ${a.to}): ${a.total}건 (성공:${a.success} 실패:${a.fail}) 성공률:${a.successRate}%`,
          `  기간B (${b.from} ~ ${b.to}): ${b.total}건 (성공:${b.success} 실패:${b.fail}) 성공률:${b.successRate}%`,
          '',
          '■ 증감',
          `  발송량: ${result.change.totalRate != null ? (result.change.totalRate > 0 ? '+' : '') + result.change.totalRate + '%' : '-'}`,
          `  성공건: ${result.change.successRate != null ? (result.change.successRate > 0 ? '+' : '') + result.change.successRate + '%' : '-'}`,
          `  실패건: ${result.change.failRate != null ? (result.change.failRate > 0 ? '+' : '') + result.change.failRate + '%' : '-'}`,
          `  성공률: ${(result.change.successRateDiff > 0 ? '+' : '') + result.change.successRateDiff}%p`,
          '',
          '■ 그룹별 비교',
          `  ${'그룹'.padEnd(8)} | A건수  | A성공률 | B건수  | B성공률 | 증감`,
          `  ${''.padEnd(8, '-')}|--------|--------|--------|--------|------`,
        ];
        for (const c of result.comparison) {
          const label = result.groupBy === 'hour' ? `${c.group}시`.padEnd(8) : c.group.padEnd(8);
          const chg = c.change.totalRate != null ? (c.change.totalRate > 0 ? '+' : '') + c.change.totalRate + '%' : '-';
          lines.push(`  ${label} | ${String(c.periodA.total).padStart(6)} | ${String(c.periodA.successRate).padStart(5)}% | ${String(c.periodB.total).padStart(6)} | ${String(c.periodB.successRate).padStart(5)}% | ${chg}`);
        }
        return lines.join('\n');
      }

      // --- message_send ---
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
