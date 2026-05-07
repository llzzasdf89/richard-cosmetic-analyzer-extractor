import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "化妆品专利成分提取器",
  description: "上传化妆品专利 PDF，自动生成成分 Excel 报告",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}