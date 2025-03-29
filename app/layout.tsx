import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import Script from 'next/script';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "人生重开模拟器",
  description: "人生重开模拟器 - 体验不同人生轨迹和修仙之路",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning={true}>
      <body
        className={`${inter.variable} ${sourceCodePro.variable} antialiased`}
      >
        {children}
        
        <Script id="error-handler" strategy="afterInteractive">
          {`
            // 添加全局错误处理
            window.onerror = function(message, source, lineno, colno, error) {
              if (source && source.includes('385-')) {
                console.log('处理已知的chunk加载错误，尝试恢复...');
                const hasReloaded = sessionStorage.getItem('hasReloaded');
                if (!hasReloaded) {
                  sessionStorage.setItem('hasReloaded', 'true');
                  window.location.reload();
                  return true;
                }
              }
              return false;
            };
          `}
        </Script>
      </body>
    </html>
  );
}
