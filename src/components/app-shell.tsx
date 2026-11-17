"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { createSeed } from "@/lib/seed";
import { STATUSES, PRIORITIES, Ticket } from "@/lib/tickets";

const KEY = "ftrb:v1";
type Store = {
  tickets: Ticket[];
  now: number;
  ready: boolean;
  save: (tickets: Ticket[]) => boolean;
  reset: () => boolean;
};
const Context = createContext<Store | null>(null);
function valid(value: unknown): value is Ticket[] {
  return (
    Array.isArray(value) &&
    value.every(
      (t) =>
        t &&
        [
          "id",
          "site",
          "location",
          "equipment",
          "symptom",
          "reporter",
          "createdAt",
          "assignee",
          "vendor",
          "eta",
          "repair",
          "cause",
          "resolution",
          "prevention",
        ].every((k) => typeof t[k] === "string") &&
        Number.isFinite(Date.parse(t.createdAt)) &&
        STATUSES.includes(t.status) &&
        PRIORITIES.includes(t.priority) &&
        (!t.completedAt || Number.isFinite(Date.parse(t.completedAt))) &&
        Array.isArray(t.history) &&
        t.history.every(
          (h: { at: string; text: string }) =>
            h && typeof h.text === "string" && Number.isFinite(Date.parse(h.at)),
        ),
    )
  );
}
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    function read() {
      try {
        const raw = localStorage.getItem(KEY);
        const value: unknown = raw ? JSON.parse(raw) : createSeed(Date.now());
        if (!valid(value)) throw new Error("Invalid data");
        if (!raw) localStorage.setItem(KEY, JSON.stringify(value));
        setTickets(value);
        setError("");
      } catch {
        setError(
          "保存データを読み込めませんでした。ブラウザの保存設定を確認するか、デモ説明から既定データに戻してください。",
        );
      }
      setNow(Date.now());
      setReady(true);
    }
    read();
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    const sync = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) read();
    };
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function save(next: Ticket[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setTickets(next);
      setNow(Date.now());
      setError("");
      return true;
    } catch {
      setError(
        "保存できませんでした。ブラウザの保存容量・設定をご確認ください。変更は未保存です。",
      );
      return false;
    }
  }
  return (
    <Context.Provider
      value={{ tickets, now, ready, save, reset: () => save(createSeed(Date.now())) }}
    >
      {error && (
        <div role="alert" className="storage-error">
          {error}
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
export function useTickets() {
  const value = useContext(Context);
  if (!value) throw new Error("Provider missing");
  return value;
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/">
            <span className="brand-icon">＋</span>
            <span>
              現場トラブル<span className="brand-sub">受付・修理進捗ボード</span>
            </span>
          </Link>
          <nav aria-label="メインナビゲーション">
            {[
              ["/", "進捗ボード"],
              ["/recurrence", "再発一覧"],
              ["/about", "デモについて"],
            ].map(([href, label]) => (
              <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/new" className="button primary header-new">
            ＋ トラブル受付
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <span className="demo-dot" /> デモ用の架空データです{" "}
        <span>データはこのブラウザに保存されます</span>
      </footer>
    </>
  );
}
export function Loading() {
  return (
    <div className="empty" role="status">
      保存データを読み込んでいます…
    </div>
  );
}
