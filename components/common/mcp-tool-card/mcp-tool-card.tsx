import Link from 'next/link';
import type { McpTool } from '@/config/tools';

interface McpToolCardProps {
  tool: McpTool;
}

export function McpToolCard({ tool }: McpToolCardProps) {
  return (
    <Link href={tool.path}>
      <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer min-h-[140px] text-center">
        <span className="text-4xl mb-3">{tool.icon}</span>
        <span className="text-sm font-medium text-gray-700">{tool.title}</span>
        <span className="text-xs text-gray-400 mt-1 leading-tight">{tool.description}</span>
      </div>
    </Link>
  );
}
