import test from "node:test";
import assert from "node:assert/strict";
import { migrationEnvironment, migrateWithRetry } from "./migrate-with-retry.mjs";

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

test("Neon migrations use the same database directly without changing runtime configuration", () => {
  const environment = { DATABASE_URL: "postgresql://user:password@ep-example-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true", OTHER: "retained" };
  const result = migrationEnvironment(environment);
  const direct = new URL(result.DATABASE_URL);
  assert.equal(direct.hostname, "ep-example.eu-central-1.aws.neon.tech");
  assert.equal(direct.username, "user");
  assert.equal(direct.password, "password");
  assert.equal(direct.pathname, "/neondb");
  assert.equal(direct.searchParams.get("sslmode"), "require");
  assert.equal(direct.searchParams.has("pgbouncer"), false);
  assert.equal(result.OTHER, "retained");
  assert.ok(environment.DATABASE_URL.includes("-pooler"));
});

test("direct, non-Neon and unset connections remain unchanged", () => {
  for (const environment of [{}, { DATABASE_URL: "postgresql://user:password@localhost/db" }, { DATABASE_URL: "postgresql://user:password@ep-example.eu-central-1.aws.neon.tech/db" }, { DATABASE_URL: "postgresql://user:password@pooler.example.com/db" }]) {
    assert.deepEqual(migrationEnvironment(environment), environment);
  }
});

test("migration subprocess receives the direct connection on every retry", async () => {
  const environment = { DATABASE_URL: "postgresql://user:password@ep-example-pooler.eu-central-1.aws.neon.tech/db" };
  const connections = [];
  await migrateWithRetry("prisma-cli", {
    environment,
    execute: (_command, _args, options) => { connections.push(options.env.DATABASE_URL); return connections.length === 1 ? locked : success; },
    wait: async () => {}, stdout: { write() {} }, stderr: { write() {} }
  });
  assert.equal(connections.length, 2);
  assert.ok(connections.every((connection) => !connection.includes("-pooler")));
});
