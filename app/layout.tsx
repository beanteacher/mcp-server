import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/Header';

export const metadata: Metadata = {
  title: 'MCP Tools Dashboard',
  description: 'MCP 도구 모음 대시보드',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-8 pt-24">{children}</main>
      </body>
    </html>
  );
}
