import assert from "node:assert/strict";
import test from "node:test";
import { matchesTourSearch } from "../lib/tour-search";

const tour = {
  name: "Büyük Japonya Turu",
  departureCity: "İstanbul",
  airline: "TÜRK HAVA YOLLARI",
  visaStatus: "Vizesiz",
  days: [{ country: "Japonya", city: "Tokyo", title: "Şehir keşfi", description: "Kyoto gezisi" }],
};

test("matches Turkish characters and ASCII equivalents", () => {
  for (const query of ["istanbul", "İSTANBUL", "buyuk japonya", "şehir", "sehir"]) {
    assert.equal(matchesTourSearch(tour, query), true, query);
  }
});
test("matches all words across fields in any order", () => {
  for (const query of ["japonya istanbul", "istanbul japonya", "Tokyo vizesiz", "Japonya  hava"]) {
    assert.equal(matchesTourSearch(tour, query), true, query);
  }
  assert.equal(matchesTourSearch(tour, "japonya pegasus"), false);
});
test("matches common Turkish Airlines aliases", () => {
  assert.equal(matchesTourSearch(tour, "THY Japonya"), true);
  assert.equal(matchesTourSearch(tour, "Turkish Airlines"), true);
});
test("accepts short queries and empty searches", () => {
  assert.equal(matchesTourSearch(tour, "ja"), true);
  assert.equal(matchesTourSearch(tour, ""), true);
  assert.equal(matchesTourSearch(tour, "   "), true);
});
test("handles punctuation and missing optional fields", () => {
  assert.equal(matchesTourSearch(tour, "Japonya, İstanbul"), true);
  assert.equal(matchesTourSearch({ name: "Küba" }, "kuba"), true);
  assert.equal(matchesTourSearch({}, "japonya"), false);
});
