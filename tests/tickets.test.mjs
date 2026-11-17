import { test } from "node:test";
import assert from "node:assert/strict";
import {
  nextTicketId,
  elapsedMinutes,
  isDelayed,
  recurrenceGroups,
  completedThisWeek,
} from "../src/lib/tickets.ts";
const now = Date.parse("2026-11-17T03:00:00Z");
const ticket = (overrides = {}) => ({
  id: "TR-20261117-001",
  site: "架空拠点",
  equipment: "空調",
  priority: "緊急",
  status: "受付",
  createdAt: new Date(now - 7200000).toISOString(),
  ...overrides,
});
test("日本時間の日付、日別最大番号、1000件以上の採番", () => {
  assert.equal(nextTicketId([], new Date("2026-11-16T15:00:00Z")), "TR-20261117-001");
  assert.equal(
    nextTicketId([{ id: "TR-20261117-999" }, { id: "TR-20261116-1200" }], new Date(now)),
    "TR-20261117-1000",
  );
});
test("対応遅れは閾値を超えた未完了案件のみ", () => {
  assert.equal(isDelayed(ticket(), now), false);
  assert.equal(isDelayed(ticket(), now + 1), true);
  const high = ticket({ priority: "高", createdAt: new Date(now - 86400000).toISOString() });
  assert.equal(isDelayed(high, now), false);
  assert.equal(isDelayed(high, now + 1), true);
  assert.equal(isDelayed(ticket({ status: "完了" }), now + 1), false);
  assert.equal(isDelayed(ticket({ priority: "中" }), now + 86400000), false);
});
test("完了時に経過時間を固定、未来の起票は0分", () => {
  assert.equal(
    elapsedMinutes(ticket({ completedAt: new Date(now - 3600000).toISOString() }), now + 86400000),
    60,
  );
  assert.equal(elapsedMinutes(ticket({ createdAt: new Date(now + 60000).toISOString() }), now), 0);
});
test("再発は90日境界を含み、拠点と設備の両方でグループ化", () => {
  const old = ticket({ id: "old", createdAt: new Date(now - 90 * 86400000).toISOString() });
  assert.equal(recurrenceGroups([ticket(), old], now).length, 1);
  assert.equal(recurrenceGroups([ticket(), old], now + 1).length, 0);
  assert.equal(
    recurrenceGroups([ticket(), ticket({ site: "別拠点" }), ticket({ equipment: "給排水" })], now)
      .length,
    0,
  );
});
test("今週完了は日本時間の月曜0時から", () => {
  assert.equal(
    completedThisWeek(ticket({ status: "完了", completedAt: "2026-11-15T15:00:00Z" }), now),
    true,
  );
  assert.equal(
    completedThisWeek(ticket({ status: "完了", completedAt: "2026-11-15T14:59:59Z" }), now),
    false,
  );
  assert.equal(
    completedThisWeek(ticket({ status: "修理中", completedAt: "2026-11-16T00:00:00Z" }), now),
    false,
  );
});
