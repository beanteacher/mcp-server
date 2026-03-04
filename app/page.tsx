import { MCP_TOOLS } from '@/config/tools';
import McpToolCard from '../components/McpToolCard';

export default function HomePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-50 mb-2">My Tools</h2>
      <p className="text-sm text-neutral-400 mb-8">GitHub 도구 모음 대시보드</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {MCP_TOOLS.map((tool) => (
          <McpToolCard key={tool.id} tool={tool} />
        ))}
        <div className="flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-neutral-200/20 rounded-lg text-neutral-600 cursor-not-allowed select-none">
          <span className="text-3xl mb-2">+</span>
          <span className="text-sm text-center">도구 추가 예정</span>
        </div>
      </div>
    </div>
  );
}
