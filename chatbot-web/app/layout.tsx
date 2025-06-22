import React from 'react'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import ErrorBoundary from './components/ErrorBoundary'

export const metadata: Metadata = {
  title: '智能聊天机器人 | Next.js版',
  description: '支持自定义LLM、Prompt工程和MCP集成的智能聊天机器人',
  keywords: ['chatbot', 'llm', 'openai', 'mcp', 'prompt-engineering', 'nextjs', 'react', 'typescript'],
  authors: [{ name: 'ChatBot Web Next.js' }],
  creator: 'ChatBot Web Next.js',
  publisher: 'ChatBot Web Next.js',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: '智能聊天机器人 | Next.js版',
    description: '支持自定义LLM、Prompt工程和MCP集成的智能聊天机器人',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '智能聊天机器人 | Next.js版',
    description: '支持自定义LLM、Prompt工程和MCP集成的智能聊天机器人',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <div id="root">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 检测暗色模式偏好
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  )
} 