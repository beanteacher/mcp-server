import { MCP_TOOLS } from '@/config/tools';
import { McpToolCard } from '@/components/common/mcp-tool-card';

export default function HomePage() {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-600 mb-6">My tools</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MCP_TOOLS.map((tool) => (
          <McpToolCard key={tool.id} tool={tool} />
        ))}
        <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-400 cursor-not-allowed select-none min-h-[140px]">
          <span className="text-3xl mb-2">+</span>
          <span className="text-sm text-center">도구 추가 예정</span>
        </div>
      </div>
    </div>
  );
}
