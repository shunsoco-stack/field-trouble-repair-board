export const STATUSES = ["受付", "手配中", "到着待ち", "修理中", "復旧確認待ち", "完了"] as const;
export const PRIORITIES = ["緊急", "高", "中", "低"] as const;
export const EQUIPMENT = [
  "空調",
  "給排水",
  "電気・照明",
  "自動ドア",
  "冷蔵・冷凍",
  "POS・ネットワーク",
  "その他",
] as const;
export const SITES = [
  "サンプル食堂 港北店",
  "サンプル食堂 青葉店",
  "サンプル食堂 海岸店",
  "サンプル雑貨 森の店",
  "サンプル雑貨 丘の店",
  "サンプルオフィス 西館",
];
export const STAFF = ["青空 はる（架空）", "若葉 りく（架空）", "星野 なぎ（架空）"];
export const VENDORS = [
  "みなと設備サービス（架空）",
  "わかば電設（架空）",
  "そよかぜ修理工房（架空）",
];
export const CAUSES = ["経年劣化", "使用方法", "外的要因", "施工・部品不良", "不明"];
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Ticket = {
  id: string;
  site: string;
  location: string;
  equipment: string;
  symptom: string;
  priority: Priority;
  reporter: string;
  status: Status;
  createdAt: string;
  completedAt?: string;
  assignee: string;
  vendor: string;
  eta: string;
  repair: string;
  cause: string;
  resolution: string;
  prevention: string;
  history: { at: string; text: string }[];
};
export function nextTicketId(tickets: Pick<Ticket, "id">[], now: Date): string {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replaceAll("-", "");
  const prefix = `TR-${date}-`;
  const max = tickets.reduce(
    (n, t) => (t.id.startsWith(prefix) ? Math.max(n, Number(t.id.slice(prefix.length)) || 0) : n),
    0,
  );
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}
export function elapsedMinutes(
  ticket: Pick<Ticket, "createdAt" | "completedAt">,
  now: number,
): number {
  return Math.max(
    0,
    Math.floor(
      ((ticket.completedAt ? Date.parse(ticket.completedAt) : now) - Date.parse(ticket.createdAt)) /
        60000,
    ),
  );
}
export function elapsedLabel(
  ticket: Pick<Ticket, "createdAt" | "completedAt">,
  now: number,
): string {
  const m = elapsedMinutes(ticket, now);
  return m < 60
    ? `${m}分`
    : m < 1440
      ? `${Math.floor(m / 60)}時間 ${m % 60}分`
      : `${Math.floor(m / 1440)}日 ${Math.floor((m % 1440) / 60)}時間`;
}
export function isDelayed(ticket: Ticket, now: number): boolean {
  if (ticket.status === "完了") return false;
  const ms = now - Date.parse(ticket.createdAt);
  return ticket.priority === "緊急"
    ? ms > 2 * 3600000
    : ticket.priority === "高" && ms > 24 * 3600000;
}
export function recurrenceGroups(tickets: Ticket[], now: number) {
  const groups = new Map<string, { site: string; equipment: string; tickets: Ticket[] }>();
  for (const t of tickets) {
    const age = now - Date.parse(t.createdAt);
    if (age < 0 || age > 90 * 86400000) continue;
    const key = `${t.site}::${t.equipment}`;
    const group = groups.get(key) ?? { site: t.site, equipment: t.equipment, tickets: [] };
    group.tickets.push(t);
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((g) => g.tickets.length >= 2)
    .sort((a, b) => b.tickets.length - a.tickets.length);
}
export function isRecurring(ticket: Ticket, tickets: Ticket[], now: number) {
  return recurrenceGroups(tickets, now).some((g) => g.tickets.some((t) => t.id === ticket.id));
}
export function completedThisWeek(ticket: Ticket, now: number) {
  const jp = new Date(now + 9 * 3600000);
  const day = (jp.getUTCDay() + 6) % 7;
  const start =
    Date.UTC(jp.getUTCFullYear(), jp.getUTCMonth(), jp.getUTCDate() - day) - 9 * 3600000;
  return (
    ticket.status === "完了" &&
    !!ticket.completedAt &&
    Date.parse(ticket.completedAt) >= start &&
    Date.parse(ticket.completedAt) <= now
  );
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00+09:00` : value));
}

// datetime-local の値は日本時間として保存する。
export function toDateTimeLocal(value: string) {
  return new Date(Date.parse(value) + 9 * 3600000).toISOString().slice(0, 16);
}
