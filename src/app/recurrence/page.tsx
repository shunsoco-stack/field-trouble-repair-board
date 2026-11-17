"use client";
import Link from "next/link";
import { Loading, useTickets } from "@/components/app-shell";
import { formatDate, recurrenceGroups } from "@/lib/tickets";
export default function Recurrence() {
  const { tickets, ready, now } = useTickets();
  if (!ready) return <Loading />;
  const groups = recurrenceGroups(tickets, now);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">RECURRENCE NOTES</p>
          <h1>再発一覧</h1>
          <p className="muted">同じトラブルを繰り返さないために、現場の記録を共有。</p>
        </div>
        <span className="badge recurrence">{groups.length} 組の再発</span>
      </div>
      <div className="info-banner">
        過去90日以内に、同じ拠点・同じ設備種別で2件以上の受付がある組み合わせを表示しています（完了を含む）。
      </div>
      <div className="recurrence-grid">
        {groups.map((g) => (
          <section className="panel" key={`${g.site}-${g.equipment}`}>
            <div className="section-heading">
              <span className="badge recurrence">↻ 再発</span>
              <strong>{g.tickets.length} 件</strong>
            </div>
            <h2>{g.site}</h2>
            <p className="equipment-label">{g.equipment}</p>
            <ul className="recurrence-list">
              {[...g.tickets]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((t) => (
                  <li key={t.id}>
                    <Link href={`/tickets/${t.id}`}>
                      <span className="ticket-number">
                        {t.id} ・ {formatDate(t.createdAt)}
                      </span>
                      <strong>{t.symptom} →</strong>
                      <span className="muted small">
                        {t.status} ／ 原因：{t.cause || "未確定"}
                      </span>
                    </Link>
                    <div
                      className={`prevention-note ${t.status === "完了" ? "completed-note" : ""}`}
                    >
                      {t.status === "完了" && (
                        <>
                          <span>復旧確認済み・原因</span>
                          <p>{t.cause}</p>
                        </>
                      )}
                      <span>再発防止メモ</span>
                      <p>{t.prevention || "未記録 — 復旧確認時に記録します。"}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      {!groups.length && <div className="empty">過去90日以内の再発はありません。</div>}
    </>
  );
}
