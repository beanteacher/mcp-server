import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/Header';
import { Providers } from './providers';

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
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <Header />
          <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 pt-24 animate-fade-in">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
