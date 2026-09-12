import test from "node:test";
import assert from "node:assert/strict";
import { migrateWithRetry } from "./migrate-with-retry.mjs";

const success = { status: 0, stdout: "No pending migrations.", stderr: "" };
const locked = { status: 1, stderr: "Error: P1002\nTimed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369))." };

async function simulate(results) {
  let calls = 0;
  const delays = [];
  const output = [];
  const result = await migrateWithRetry("prisma-cli", {
    execute: () => results[Math.min(calls++, results.length - 1)],
    wait: async (delay) => { delays.push(delay); },
    stdout: { write: (text) => output.push(text) },
    stderr: { write: (text) => output.push(text) }
  });
  return { result, calls, delays, output };
}

test("a successful migration runs once", async () => {
  const run = await simulate([success]);
  assert.equal(run.calls, 1);
  assert.deepEqual(run.delays, []);
  assert.equal(run.result.status, 0);
});

test("an advisory lock timeout retries and preserves diagnostic output", async () => {
  const run = await simulate([locked, success]);
  assert.equal(run.calls, 2);
  assert.deepEqual(run.delays, [5000]);
  assert.equal(run.result.status, 0);
  assert.ok(run.output.includes(locked.stderr));
});

test("persistent contention stops after three attempts with a failure", async () => {
  const run = await simulate([locked]);
  assert.equal(run.calls, 3);
  assert.deepEqual(run.delays, [5000, 10000]);
  assert.equal(run.result.status, 1);
});

test("SQL errors, other timeouts and process failures are not retried", async () => {
  for (const failure of [
    { status: 1, stderr: "Error: P3018 A migration failed to apply" },
    { status: 1, stderr: "Error: P1002 The database server was reached but timed out" },
    { status: null, error: new Error("spawn failed") },
    { status: null, signal: "SIGTERM" }
  ]) {
    const run = await simulate([failure]);
    assert.equal(run.calls, 1);
    assert.deepEqual(run.delays, []);
    assert.equal(run.result, failure);
  }
});
