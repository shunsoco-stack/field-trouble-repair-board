import Link from "next/link";
import { elapsedLabel, formatDate, isDelayed, Ticket } from "@/lib/tickets";
export function Badges({
  ticket,
  recurring,
  now,
}: {
  ticket: Ticket;
  recurring: boolean;
  now: number;
}) {
  return (
    <div className="badges">
      <span className={`badge priority-${ticket.priority}`}>
        {ticket.priority === "緊急" ? "! 緊急" : `優先度 ${ticket.priority}`}
      </span>
      {isDelayed(ticket, now) && <span className="badge delay">対応遅れ</span>}
      {recurring && <span className="badge recurrence">↻ 再発</span>}
    </div>
  );
}
export default function TicketCard({
  ticket,
  recurring,
  now,
}: {
  ticket: Ticket;
  recurring: boolean;
  now: number;
}) {
  return (
    <Link
      className={`ticket-card ${isDelayed(ticket, now) ? "overdue" : ""}`}
      href={`/tickets/${ticket.id}`}
    >
      <Badges ticket={ticket} recurring={recurring} now={now} />
      <span className="ticket-number">{ticket.id}</span>
      <h3>{ticket.symptom}</h3>
      <p className="site-name">{ticket.site}</p>
      <p className="ticket-meta">
        {ticket.location} <span>／ {ticket.equipment}</span>
      </p>
      {(ticket.status === "到着待ち" || ticket.status === "修理中") && ticket.eta && (
        <p className="arrival-note">到着予定 {formatDate(ticket.eta)}</p>
      )}
      <div className="card-bottom">
        <span className={isDelayed(ticket, now) ? "danger-text" : ""}>
          ◷ {elapsedLabel(ticket, now)}
          {ticket.status === "完了" ? "で完了" : "経過"}
        </span>
        <span>{ticket.assignee ? "担当済" : "未担当"}</span>
      </div>
    </Link>
  );
}
