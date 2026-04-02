import { execFile } from 'child_process';
import { stat } from 'fs/promises';
import { resolve, join } from 'path';

const SCRIPT_PATH = join(__dirname, 'md_to_docx.py');

interface ConvertResult {
  outputPath: string;
  sizeBytes: number;
}

export async function mdToDocx(sourcePath: string, outputPath?: string): Promise<ConvertResult> {
  const src = resolve(sourcePath);
  const out = outputPath ? resolve(outputPath) : src.replace(/\.md$/i, '.docx');

  await new Promise<void>((res, rej) => {
    execFile('python', [SCRIPT_PATH, src, out], { timeout: 60_000 }, (err, _stdout, stderr) => {
      if (err) rej(new Error(`변환 실패: ${stderr || err.message}`));
      else res();
    });
  });

  const info = await stat(out);
  return { outputPath: out, sizeBytes: info.size };
}
