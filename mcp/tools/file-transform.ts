import { mdToDocx, mdToPdf } from '../../feature/file-transform/service';
import { ToolModule } from '../types';
import { readRequiredString, readOptionalString } from '../utils';

function formatResult(result: { outputPath: string; sizeBytes: number }): string {
  const sizeKB = (result.sizeBytes / 1024).toFixed(1);
  return `변환 완료\n- 출력: ${result.outputPath}\n- 크기: ${sizeKB} KB`;
}

export const fileTransformModule: ToolModule = {
  tools: [
    {
      name: 'file_md_to_docx',
      description: 'Markdown 파일을 DOCX(Word) 문서로 변환합니다. 맑은 고딕 기반 스타일이 자동 적용됩니다.',
      inputSchema: {
        type: 'object',
        properties: {
          sourcePath: { type: 'string', description: '변환할 MD 파일의 절대 경로' },
          outputPath: { type: 'string', description: '출력 DOCX 파일 경로 (미지정 시 같은 위치에 .docx 생성)' },
        },
        required: ['sourcePath'],
      },
    },
    {
      name: 'file_md_to_pdf',
      description: 'Markdown 파일을 PDF 문서로 변환합니다. 맑은 고딕 기반 스타일과 목차 내부 링크가 자동 적용됩니다.',
      inputSchema: {
        type: 'object',
        properties: {
          sourcePath: { type: 'string', description: '변환할 MD 파일의 절대 경로' },
          outputPath: { type: 'string', description: '출력 PDF 파일 경로 (미지정 시 같은 위치에 .pdf 생성)' },
        },
        required: ['sourcePath'],
      },
    },
  ],

  async handle(name: string, args: Record<string, unknown>): Promise<string> {
    const sourcePath = readRequiredString(args, 'sourcePath');
    const outputPath = readOptionalString(args, 'outputPath');

    if (name === 'file_md_to_docx') {
      return formatResult(await mdToDocx(sourcePath, outputPath));
    }
    if (name === 'file_md_to_pdf') {
      return formatResult(await mdToPdf(sourcePath, outputPath));
    }
    throw new Error(`Unknown tool: ${name}`);
  },
};
