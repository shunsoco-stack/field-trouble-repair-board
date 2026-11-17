"use client";
import Link from "next/link";
import { useState } from "react";
import { Loading, useTickets } from "./app-shell";
import { Badges } from "./ticket-card";
import {
  CAUSES,
  elapsedLabel,
  formatDate,
  isRecurring,
  STAFF,
  STATUSES,
  Status,
  Ticket,
  VENDORS,
} from "@/lib/tickets";
export default function TicketDetail({ id }: { id: string }) {
  const { tickets, ready } = useTickets();
  if (!ready) return <Loading />;
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket)
    return (
      <div className="empty">
        <h1>受付が見つかりません</h1>
        <p>このブラウザに保存されていないか、既定データに戻された可能性があります。</p>
        <Link className="button" href="/">
          ボードへ戻る
        </Link>
      </div>
    );
  return <Detail key={`${id}:${ticket.history.length}`} ticket={ticket} />;
}
function Detail({ ticket }: { ticket: Ticket }) {
  const { tickets, save, now } = useTickets();
  const [assignee, setAssignee] = useState(ticket.assignee);
  const [vendor, setVendor] = useState(ticket.vendor);
  const [eta, setEta] = useState(ticket.eta);
  const [repair, setRepair] = useState(ticket.repair);
  const [cause, setCause] = useState(ticket.cause);
  const [resolution, setResolution] = useState(ticket.resolution);
  const [prevention, setPrevention] = useState(ticket.prevention);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const stage = STATUSES.indexOf(ticket.status);
  function update(status: Status, action: string) {
    if (status === "完了" && (!cause || !resolution.trim() || !prevention.trim())) {
      setError("完了には原因分類・対応内容・再発防止メモが必要です。");
      return;
    }
    if (action === "まだ不具合あり" && !feedback.trim()) {
      setError("残っている不具合を入力してください。");
      return;
    }
    const at = new Date().toISOString();
    const fields = {
      assignee,
      vendor,
      eta,
      repair: repair.trim(),
      cause,
      resolution: resolution.trim(),
      prevention: prevention.trim(),
    };
    const labels = {
      assignee: "担当者",
      vendor: "手配先業者",
      eta: "到着予定（日本時間）",
      repair: "修理内容メモ",
      cause: "原因分類",
      resolution: "対応内容",
      prevention: "再発防止メモ",
    };
    const displayField = (key: keyof typeof fields, value: string) =>
      value ? (key === "eta" ? formatDate(value) : value) : "未登録";
    const changes = (Object.keys(fields) as (keyof typeof fields)[])
      .filter((k) => fields[k] !== ticket[k])
      .map((k) => `${labels[k]}：${displayField(k, ticket[k])} → ${displayField(k, fields[k])}`);
    if (status === ticket.status && changes.length === 0) {
      setError("変更された項目はありません。");
      return;
    }
    const text = [
      action,
      status !== ticket.status ? `${ticket.status} → ${status}` : "",
      ...changes,
      action === "まだ不具合あり" ? `現場確認：${feedback.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const next: Ticket = {
      ...ticket,
      ...fields,
      status,
      completedAt: status === "完了" ? ticket.completedAt || at : undefined,
      history: [...ticket.history, { at, text }],
    };
    save(tickets.map((t) => (t.id === ticket.id ? next : t)));
  }
  return (
    <>
      <Link className="back-link" href="/">
        ← 進捗ボードに戻る
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{ticket.id}</p>
          <h1>{ticket.symptom}</h1>
          <p className="muted">
            {ticket.site} ／ {ticket.location} ／ {ticket.equipment}
          </p>
        </div>
        <Badges ticket={ticket} recurring={isRecurring(ticket, tickets, now)} now={now} />
      </div>
      <ol className="progress-steps" aria-label="現在の進捗">
        {STATUSES.map((s, i) => (
          <li
            key={s}
            className={i === stage ? "current" : i < stage ? "passed" : ""}
            aria-current={i === stage ? "step" : undefined}
          >
            <span>{i < stage ? "✓" : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="section-heading">
              <h2>受付内容</h2>
              <span className="badge neutral">{ticket.status}</span>
            </div>
            <dl className="facts">
              <div>
                <dt>報告者</dt>
                <dd>{ticket.reporter}</dd>
              </div>
              <div>
                <dt>受付日時（日本時間）</dt>
                <dd>{formatDate(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt>{ticket.status === "完了" ? "完了まで" : "受付からの経過"}</dt>
                <dd>{elapsedLabel(ticket, now)}</dd>
              </div>
              {ticket.eta && (
                <div>
                  <dt>到着予定（日本時間）</dt>
                  <dd>{formatDate(ticket.eta)}</dd>
                </div>
              )}
            </dl>
            <p className="preserve">{ticket.symptom}</p>
          </section>
          <section className="panel">
            <h2>担当・手配・修理情報</h2>
            <div className="form-grid">
              <label>
                社内担当者
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">未担当</option>
                  {STAFF.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                手配先業者
                <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
                  <option value="">未手配</option>
                  {VENDORS.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              到着予定日時（日本時間）
              <input type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} />
            </label>
            <label>
              修理内容メモ
              <textarea
                rows={4}
                maxLength={3000}
                value={repair}
                onChange={(e) => setRepair(e.target.value)}
                placeholder="業者への連絡内容、現地での作業状況など"
              />
            </label>
            <button className="button primary" onClick={() => update(ticket.status, "情報を更新")}>
              変更を保存
            </button>
          </section>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          {ticket.status === "復旧確認待ち" && (
            <section className="panel recovery">
              <p className="eyebrow">RECOVERY CHECK</p>
              <h2>現場で復旧を確認</h2>
              <p className="muted">設備が通常どおり使えることを確認し、結果を記録してください。</p>
              <label>
                原因分類 <span className="required">必須</span>
                <select value={cause} onChange={(e) => setCause(e.target.value)}>
                  <option value="">原因を選択</option>
                  {CAUSES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                対応内容 <span className="required">必須</span>
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="どのような処置で復旧したか"
                />
              </label>
              <label>
                再発防止メモ <span className="required">必須</span>
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={prevention}
                  onChange={(e) => setPrevention(e.target.value)}
                  placeholder="再発を防ぐために現場で気をつけること。不明ならその旨を記録"
                />
              </label>
              <button
                className="button primary full"
                onClick={() => update("完了", "現場確認：復旧OK。完了記録を保存")}
              >
                ✓ 復旧OK・完了にする
              </button>
              <div className="recheck">
                <label>
                  まだ不具合がある場合
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="残っている不具合（差し戻す場合は必須）"
                  />
                </label>
                <button
                  className="button danger"
                  onClick={() => update("修理中", "まだ不具合あり")}
                >
                  まだ不具合あり → 修理中に戻す
                </button>
              </div>
            </section>
          )}
          {ticket.status === "完了" && (
            <section className="panel recovery">
              <h2>✓ 復旧確認済み</h2>
              <p className="muted">{ticket.completedAt && formatDate(ticket.completedAt)} に完了</p>
              <dl className="completion-facts">
                <dt>原因分類</dt>
                <dd>{ticket.cause}</dd>
                <dt>対応内容</dt>
                <dd>{ticket.resolution}</dd>
                <dt>再発防止メモ</dt>
                <dd>{ticket.prevention}</dd>
              </dl>
            </section>
          )}
          <section className="panel">
            <h2>ステータスを変更</h2>
            <p className="muted small">
              入力中の担当・手配情報も一緒に保存します。完了は現場の復旧確認から行います。
            </p>
            <div className="actions">
              {stage > 0 && (
                <button
                  className="button"
                  onClick={() => update(STATUSES[stage - 1], "ステータスを戻す")}
                >
                  ← {STATUSES[stage - 1]}へ戻す
                </button>
              )}
              {stage < 4 && (
                <button
                  className="button primary"
                  onClick={() => update(STATUSES[stage + 1], "ステータスを進める")}
                >
                  {STATUSES[stage + 1]}へ進める →
                </button>
              )}
            </div>
          </section>
        </div>
        <aside className="panel history">
          <h2>対応タイムライン</h2>
          <p className="muted small">変更履歴は自動で記録されます</p>
          <ol>
            {[...ticket.history].reverse().map((h, i) => (
              <li key={`${h.at}-${i}`}>
                <time dateTime={h.at}>{formatDate(h.at)}</time>
                <p>{h.text}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
