import type { Metadata } from "next";
import { AppProvider, Shell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "現場トラブル受付・修理進捗ボード",
  description:
    "現場の設備トラブルを受付から手配・修理・復旧確認まで追う、架空データのデモアプリです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
