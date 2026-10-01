import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { capacityTransition, importChanges } from "../lib/admin/notifications";
import { AdminNotifications } from "../components/admin/AdminNotifications";

test("capacity notifications only fire when known inventory crosses full", () => {
  assert.equal(capacityTransition(1, 0), "CAPACITY_FULL");
  assert.equal(capacityTransition(0, 2), "CAPACITY_AVAILABLE");
  for (const [before, after] of [[null, 0], [0, 0], [2, 1], [0, null], [null, null]] as const) assert.equal(capacityTransition(before, after), null);
});

test("legacy and malformed import summaries are safe to display", () => {
  assert.equal(importChanges(null), null);
  assert.equal(importChanges([]), null);
  assert.deepEqual(importChanges({ changeType: "UPDATED", changes: ["Fiyat değişti", 12], addedDates: null }), { type: "UPDATED", changes: ["Fiyat değişti"], addedDates: [], removedDates: [] });
});

test("overview combines inventory and dated source changes, newest first", () => {
  const tour = { id: "tour-1", name: "Japonya turu" };
  const markup = renderToStaticMarkup(AdminNotifications({
    logs: [{ id: "log", createdAt: new Date("2026-10-01T06:00:00Z"), message: "Güncellendi", tour, rawSummary: { changeType: "UPDATED", changes: ["Yeni çıkış tarihi eklendi"], addedDates: ["2027-03-15"] } }],
    notifications: [{ id: "full", createdAt: new Date("2026-10-01T07:00:00Z"), type: "CAPACITY_FULL", message: "Kontenjan doldu.", tour, startDate: new Date("2027-03-15T00:00:00Z"), departureId: "departure-1" }],
    fullDepartures: [{ id: "departure-1", startDate: new Date("2027-03-15T00:00:00Z"), tour }]
  }));
  assert.match(markup, /Bildirimler/);
  assert.match(markup, /Eklenen tarih: 15 Mar(?:t)? 2027/);
  assert.match(markup, /Şu anda kontenjanı dolu 1 çıkış/);
  assert.match(markup, /\/admin\/reservations\?departureId=departure-1/);
  assert.ok(markup.indexOf("Kontenjan doldu") < markup.indexOf("Tur güncellendi"));
});

test("overview provides an empty state", () => {
  const markup = renderToStaticMarkup(AdminNotifications({ logs: [], notifications: [], fullDepartures: [] }));
  assert.match(markup, /Henüz değişiklik bildirimi yok/);
});
