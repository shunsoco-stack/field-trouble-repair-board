"use client";
import { useState } from "react";
import Link from "next/link";
import { Loading, useTickets } from "@/components/app-shell";
import { EQUIPMENT, nextTicketId, PRIORITIES, Priority, SITES, Ticket } from "@/lib/tickets";
export default function NewTicket() {
  const { tickets, ready, save } = useTickets();
  const [site, setSite] = useState("");
  const [equipment, setEquipment] = useState("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [location, setLocation] = useState("");
  const [symptom, setSymptom] = useState("");
  const [reporter, setReporter] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState("");
  if (!ready) return <Loading />;
  if (created)
    return (
      <section className="success-panel">
        <span className="success-icon">✓</span>
        <p className="eyebrow">RECEIVED</p>
        <h1>トラブルを受け付けました</h1>
        <p>本部の設備担当が内容を確認します。</p>
        <div className="receipt">
          <span>受付番号</span>
          <strong>{created}</strong>
        </div>
        <Link className="button primary" href={`/tickets/${created}`}>
          受付内容・進捗を確認
        </Link>
        <Link className="button" href="/">
          ボードに戻る
        </Link>
      </section>
    );
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !site ||
      !equipment ||
      !priority ||
      !location.trim() ||
      !symptom.trim() ||
      !reporter.trim()
    ) {
      setError("必須項目をすべて入力・選択してください。");
      return;
    }
    const now = new Date();
    const id = nextTicketId(tickets, now);
    const t: Ticket = {
      id,
      site,
      equipment,
      priority,
      location: location.trim(),
      symptom: symptom.trim(),
      reporter: reporter.trim(),
      status: "受付",
      createdAt: now.toISOString(),
      assignee: "",
      vendor: "",
      eta: "",
      repair: "",
      cause: "",
      resolution: "",
      prevention: "",
      history: [{ at: now.toISOString(), text: `${reporter.trim()} が現場から起票` }],
    };
    if (save([...tickets, t])) setCreated(id);
  }
  return (
    <div className="narrow">
      <Link className="back-link" href="/">
        ← ボードに戻る
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">NEW REQUEST</p>
          <h1>トラブル受付</h1>
          <p className="muted">現場の状況を教えてください。すべて必須項目です。</p>
        </div>
      </div>
      <form onSubmit={submit} className="panel form-panel">
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <fieldset>
          <legend>
            <b>01</b> どこで起きていますか？
          </legend>
          <label>
            拠点 <span className="required">必須</span>
            <select required value={site} onChange={(e) => setSite(e.target.value)}>
              <option value="">拠点を選択</option>
              {SITES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            場所 <span className="required">必須</span>
            <input
              required
              maxLength={80}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例：厨房、トイレ、入口"
            />
          </label>
          <div className="quick-options">
            {["厨房", "トイレ", "入口", "客席", "バックヤード"].map((l) => (
              <button
                type="button"
                key={l}
                aria-pressed={location === l}
                onClick={() => setLocation(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <b>02</b> 何が起きていますか？
          </legend>
          <p className="field-title">
            設備種別 <span className="required">必須</span>
          </p>
          <div className="choices">
            {EQUIPMENT.map((eq) => (
              <button
                type="button"
                key={eq}
                aria-pressed={equipment === eq}
                onClick={() => setEquipment(eq)}
              >
                {eq}
              </button>
            ))}
          </div>
          <label>
            症状 <span className="required">必須</span>
            <textarea
              required
              maxLength={2000}
              rows={4}
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="例：冷蔵庫の温度が下がらず、庫内が15℃になっています。"
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>
            <b>03</b> 緊急度・報告者
          </legend>
          <p className="field-title">
            緊急度 <span className="required">必須</span>
          </p>
          <div className="choices priority-choices">
            {PRIORITIES.map((p, i) => (
              <button
                type="button"
                key={p}
                aria-pressed={priority === p}
                onClick={() => setPriority(p)}
              >
                <strong>{p}</strong>
                <small>
                  {
                    ["営業停止・継続困難", "営業に大きな影響", "一部に支障あり", "軽微・営業可能"][
                      i
                    ]
                  }
                </small>
              </button>
            ))}
          </div>
          <label>
            報告者名（架空） <span className="required">必須</span>
            <input
              required
              maxLength={60}
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              placeholder="例：木の実 あお（架空）"
              autoComplete="off"
            />
          </label>
        </fieldset>
        <p className="muted small">デモのため、実在する個人名・連絡先は入力しないでください。</p>
        <button className="button primary full" type="submit">
          トラブルを受け付ける →
        </button>
      </form>
    </div>
  );
}
