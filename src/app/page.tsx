"use client";
import Link from "next/link";
import { useState } from "react";
import { Loading, useTickets } from "@/components/app-shell";
import TicketCard from "@/components/ticket-card";
import {
  completedThisWeek,
  isDelayed,
  isRecurring,
  PRIORITIES,
  SITES,
  STATUSES,
  Status,
} from "@/lib/tickets";
export default function Board() {
  const { tickets, ready, now } = useTickets();
  const [site, setSite] = useState("");
  const [priority, setPriority] = useState("");
  const [query, setQuery] = useState("");
  const [delayed, setDelayed] = useState(false);
  const [tab, setTab] = useState<Status>("受付");
  if (!ready) return <Loading />;
  const filtered = tickets
    .filter(
      (t) =>
        (!site || t.site === site) &&
        (!priority || t.priority === priority) &&
        (!delayed || isDelayed(t, now)) &&
        `${t.id} ${t.site} ${t.equipment} ${t.symptom} ${t.location} ${t.reporter} ${t.assignee} ${t.vendor}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
        a.createdAt.localeCompare(b.createdAt),
    );
  const counts = [
    tickets.filter((t) => t.status !== "完了").length,
    tickets.filter((t) => t.status !== "完了" && t.priority === "緊急").length,
    tickets.filter((t) => isDelayed(t, now)).length,
    tickets.filter((t) => completedThisWeek(t, now)).length,
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FIELD SUPPORT / OVERVIEW</p>
          <h1>修理進捗ボード</h1>
          <p className="muted">現場の「困った」を、復旧までつなぐ。</p>
        </div>
        <div className="heading-note">
          <span className="live-dot" /> 全{SITES.length}拠点 <span>・</span> 日本時間
        </div>
      </div>
      <section className="summary" aria-label="対応件数">
        {["未完了", "緊急", "対応遅れ", "今週完了"].map((label, i) => (
          <div key={label} className={`summary-item summary-${i}`}>
            <span>{label}</span>
            <strong>
              {counts[i]}
              <small>件</small>
            </strong>
            <p>
              {
                [
                  "復旧までフォロー中",
                  "営業への影響あり",
                  "優先して状況を確認",
                  "月曜からの復旧実績",
                ][i]
              }
            </p>
          </div>
        ))}
      </section>
      <section className="filter-bar" aria-label="絞り込み">
        <label className="search-label">
          <span className="sr-only">キーワード検索</span>
          <input
            placeholder="⌕  受付番号・拠点・症状を検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">拠点</span>
          <select value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="">すべての拠点</option>
            {SITES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">緊急度</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">すべての緊急度</option>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="check-label">
          <input type="checkbox" checked={delayed} onChange={(e) => setDelayed(e.target.checked)} />
          対応遅れのみ
        </label>
        <button
          className="text-button"
          onClick={() => {
            setSite("");
            setPriority("");
            setQuery("");
            setDelayed(false);
          }}
        >
          クリア
        </button>
      </section>
      <div className="board-caption">
        <span>
          <strong>{filtered.length}</strong> 件のトラブル
        </span>
        <span>緊急度順・受付が古い順に表示</span>
      </div>
      <div className="status-tabs" role="tablist" aria-label="ステータス">
        {STATUSES.map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={tab === s}
            aria-controls={`column-${s}`}
            onClick={() => setTab(s)}
          >
            {s}
            <span>{filtered.filter((t) => t.status === s).length}</span>
          </button>
        ))}
      </div>
      <div className="board">
        {STATUSES.map((s, i) => (
          <section
            id={`column-${s}`}
            key={s}
            className={`column stage-${i} ${tab === s ? "selected" : ""}`}
            aria-label={s}
          >
            <div className="column-heading">
              <h2>
                <span className="status-dot" />
                {s}
              </h2>
              <span>{filtered.filter((t) => t.status === s).length}</span>
            </div>
            <div className="column-body">
              {filtered
                .filter((t) => t.status === s)
                .map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    recurring={isRecurring(t, tickets, now)}
                    now={now}
                  />
                ))}
              {!filtered.some((t) => t.status === s) && (
                <p className="column-empty">該当するトラブルはありません</p>
              )}
            </div>
          </section>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty">
          条件に一致するトラブルはありません。絞り込み条件を変更してください。
        </div>
      )}
      <p className="board-help">
        カードを選択して、担当・手配情報や修理の進捗を更新できます。{" "}
        <Link href="/new">新しいトラブルを受付 →</Link>
      </p>
    </>
  );
}
