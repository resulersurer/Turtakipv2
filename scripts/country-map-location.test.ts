import assert from "node:assert/strict";
import test from "node:test";
import { countryMapLocation } from "../lib/country-map-location";

test("UAE country marker stays in UAE independently of tour coordinates", () => {
  for (const name of ["Birleşik Arap Emirlikleri", "BİRLEŞİK ARAP EMİRLİKLERİ", "BAE", "United Arab Emirates", "AE"]) {
    const point = countryMapLocation(name);
    assert.equal(point?.code, "AE");
    assert.ok(point && point.lat > 22 && point.lat < 27 && point.lng > 51 && point.lng < 57);
  }
});
test("Japan uses a separate country position", () => {
  const point = countryMapLocation("Japonya");
  assert.equal(point?.code, "JP");
  assert.ok(point && point.lng > 130);
});
test("country aliases merge into the same marker", () => {
  assert.deepEqual(countryMapLocation("Güney Kore"), countryMapLocation("South Korea"));
  assert.equal(countryMapLocation("Fransa")?.code, "FR");
});
test("unknown country is not placed at arbitrary coordinates", () => {
  assert.equal(countryMapLocation("Bilinmeyen ülke"), null);
});
