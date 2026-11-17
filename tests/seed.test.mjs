import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import {
  STATUSES,
  isDelayed,
  recurrenceGroups,
  formatDate,
  toDateTimeLocal,
} from "../src/lib/tickets.ts";

const now = Date.parse("2026-11-17T03:00:00Z");
const tickets = createSeed(now);

test("seed covers every status with unique IDs", () => {
  assert.equal(tickets.length, 16);
  assert.equal(new Set(tickets.map((t) => t.id)).size, tickets.length);
  assert.deepEqual(new Set(tickets.map((t) => t.status)), new Set(STATUSES));
  assert.deepEqual(createSeed(now), tickets);
});

test("seed has three recurrence groups with distinct historical completion notes", () => {
  const groups = recurrenceGroups(tickets, now);
  assert.equal(groups.length, 3);
  const past = groups.map((group) => {
    assert.equal(group.tickets.length, 2);
    const completed = group.tickets.find((t) => t.status === "完了");
    assert.ok(completed);
    const days = (now - Date.parse(completed.createdAt)) / 86400000;
    assert.ok(days >= 30 && days <= 80);
    assert.ok(completed.cause && completed.resolution && completed.prevention);
    return completed;
  });
  assert.equal(new Set(past.map((t) => t.cause)).size, 3);
  assert.equal(new Set(past.map((t) => t.prevention)).size, 3);
});

test("completion and history timestamps follow reception in chronological order", () => {
  for (const ticket of tickets) {
    assert.ok(ticket.history.length >= 2 && ticket.history.length <= 5);
    assert.equal(ticket.history[0].at, ticket.createdAt);
    let previous = Date.parse(ticket.createdAt);
    for (const event of ticket.history) {
      const time = Date.parse(event.at);
      assert.ok(time >= previous && time <= now, ticket.id);
      previous = time;
    }
    if (ticket.status === "完了") {
      const duration = Date.parse(ticket.completedAt) - Date.parse(ticket.createdAt);
      assert.ok(duration >= 2 * 3600000 && duration <= 3 * 86400000);
      assert.equal(ticket.history.at(-1).at, ticket.completedAt);
    } else {
      assert.equal(ticket.completedAt, undefined);
    }
  }
});

test("three delayed cases and arrival times for waiting and repairing cases", () => {
  assert.equal(tickets.filter((t) => isDelayed(t, now)).length, 3);
  for (const ticket of tickets) {
    if (["到着待ち", "修理中"].includes(ticket.status)) {
      assert.match(ticket.eta, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      const arrival = Date.parse(`${ticket.eta}:00+09:00`);
      assert.ok(arrival >= Date.parse(ticket.createdAt));
      assert.ok(ticket.assignee && ticket.vendor);
    }
  }
});

test("arrival display interprets datetime-local values as Japan time", () => {
  assert.equal(formatDate("2026-11-18T10:00"), "11/18 10:00");
  assert.equal(formatDate("2026-11-18T01:00:00Z"), "11/18 10:00");
  assert.equal(toDateTimeLocal("2026-11-18T01:00:00Z"), "2026-11-18T10:00");
});
