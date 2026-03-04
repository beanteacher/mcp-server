import { Navigation } from './Navigation';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-card border-b border-neutral-200/10 px-6 flex items-center justify-between">
      <span className="text-xl font-bold text-primary-500">MCP Tools</span>
      <Navigation />
      <div className="w-8 h-8 rounded-full border border-primary-500 bg-neutral-800" />
    </header>
  );
}
