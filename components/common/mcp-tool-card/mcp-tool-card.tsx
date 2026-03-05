import Link from 'next/link';
import type { McpTool } from '@/config/tools';

interface McpToolCardProps {
  tool: McpTool;
}

export function McpToolCard({ tool }: McpToolCardProps) {
  return (
    <Link href={tool.path}>
      <div className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-surface-card border border-neutral-200 dark:border-neutral-200/10 rounded-lg min-h-[160px] text-center hover:border-primary-500/50 hover:shadow-md hover:scale-[1.02] transition-all duration-150 cursor-pointer">
        <span className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-200">{tool.icon}</span>
        <span className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{tool.title}</span>
        <span className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 leading-tight text-center">{tool.description}</span>
      </div>
    </Link>
  );
}
