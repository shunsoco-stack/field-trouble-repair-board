"use client";
import { useState } from "react";
import { useTickets } from "@/components/app-shell";
export default function About() {
  const { reset, ready } = useTickets();
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ABOUT THIS DEMO</p>
          <h1>このデモについて</h1>
          <p className="muted">現場と本部をつなぐ、設備トラブル対応のデモです。</p>
        </div>
      </div>
      <section className="panel prose">
        <h2>「起きたあと」の対応を一枚に</h2>
        <p>
          現場スタッフがトラブルを報告し、本部の設備担当が業者を手配。修理の進捗と現場での復旧確認まで、受付ごとに追いかけます。
        </p>
        <ol>
          <li>現場からトラブル受付</li>
          <li>本部で担当・業者を決め、修理進捗を更新</li>
          <li>現場で復旧確認。原因と再発防止メモを残す</li>
        </ol>
        <h2>データと保存について</h2>
        <p>
          拠点・会社・店舗・人名・業者名・受付内容はすべてデモ用の架空データであり、実在する企業・個人とは無関係です。実在の個人情報や連絡先は入力しないでください。
        </p>
        <p>
          データはお使いのブラウザのlocalStorage（キー：ftrb:v1）に保存されます。認証、外部API、データベースは利用していません。別の端末・ブラウザとは共有されず、ブラウザのデータ削除で記録は失われます。
        </p>
        <h2>表示のルール</h2>
        <p>
          対応遅れは未完了の「緊急」で受付から2時間超、「高」で24時間超の場合に表示します。完了後は経過時間を固定します。再発は現在から90日以内の同じ拠点×設備種別の受付が2件以上ある場合です。
        </p>
        <p>
          日時と採番日は日本時間、今週完了は月曜日0時から現在までの完了件数です。時刻の表示は30秒ごとに更新します。
        </p>
      </section>
      <section className="panel">
        <h2>デモデータをリセット</h2>
        <p className="muted">
          現在の記録を削除し、今の時刻を基準とした6拠点・16件の既定データに戻します。
        </p>
        {!confirm ? (
          <button className="button danger" disabled={!ready} onClick={() => setConfirm(true)}>
            既定データに戻す
          </button>
        ) : (
          <div className="reset-confirm">
            <p>追加した受付・変更履歴も削除されます。実行しますか？</p>
            <div className="actions">
              <button
                className="button danger"
                onClick={() => {
                  if (reset()) {
                    setMessage("既定データに戻しました。");
                    setConfirm(false);
                  }
                }}
              >
                削除して既定データに戻す
              </button>
              <button className="button" onClick={() => setConfirm(false)}>
                キャンセル
              </button>
            </div>
          </div>
        )}
        <p role="status">{message}</p>
      </section>
    </div>
  );
}
