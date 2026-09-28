import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL must point to the disposable local turtakip_reservations_test database.");
const url = new URL(databaseUrl);
if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.pathname !== "/turtakip_reservations_test") throw new Error("Only the local turtakip_reservations_test database is permitted.");
process.env.DATABASE_URL = databaseUrl;

let prisma: typeof import("../lib/prisma").prisma;
let auth: ReturnType<typeof import("../lib/members/auth").createMemberAuth>;
const origin = "https://member.test";
const password = "Member-test-password-2026!";
const emails: string[] = [];
let clientNumber = 1;
const cookieHeaders = (response: Response) => response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");

before(async () => {
  ({ prisma } = await import("../lib/prisma"));
  const { createMemberAuth } = await import("../lib/members/auth");
  auth = createMemberAuth(prisma, { baseURL: origin, secret: "a-test-only-member-secret-with-at-least-32-characters-2026" });
});
after(async () => {
  if (!prisma) return;
  await prisma.member.deleteMany({ where: { email: { in: emails } } });
  await prisma.memberRateLimit.deleteMany({ where: { key: { startsWith: "203.0.113." } } });
  await prisma.$disconnect();
});

function send(path: string, body?: unknown, cookie = "", extraHeaders: Record<string, string> = {}) {
  return auth.handler(new Request(`${origin}/api/member-auth${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", origin, "x-forwarded-for": `203.0.113.${clientNumber++}`, ...(cookie ? { cookie } : {}), ...extraHeaders },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  }));
}
async function signup(extra: Record<string, unknown> = {}) {
  const email = `member-${randomUUID()}@example.com`;
  emails.push(email);
  const response = await send("/sign-up/email", { email, name: "Test Üye", password, ...extra });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  return { response, data, email, cookie: cookieHeaders(response) };
}

test("signup creates a member, hashed credential and secure member session atomically", async () => {
  const { email, data, response, cookie } = await signup({ name: "  Ayşe Test  ", role: "ADMIN", emailVerified: true });
  assert.equal(data.user.name, "Ayşe Test");
  assert.equal(data.user.emailVerified, false);
  assert.equal(data.user.role, undefined);
  const member = await prisma.member.findUniqueOrThrow({ where: { email }, include: { accounts: true, sessions: true } });
  assert.equal(member.accounts.length, 1);
  assert.equal(member.sessions.length, 1);
  assert.ok(member.accounts[0].password);
  assert.notEqual(member.accounts[0].password, password);
  assert.match(response.headers.get("set-cookie") || "", /HttpOnly/i);
  assert.match(response.headers.get("set-cookie") || "", /Secure/i);
  assert.match(response.headers.get("set-cookie") || "", /SameSite=Lax/i);
  assert.ok(cookie.includes("ejder-member"));
  assert.ok(!cookie.includes("ejder_admin"));
  const session = await (await send("/get-session", undefined, cookie)).json();
  assert.equal(session.user.id, data.user.id);
  assert.equal(JSON.stringify(session).includes("password"), false);
});

test("duplicate email is case insensitive and cannot create a second account", async () => {
  const { email } = await signup();
  const response = await send("/sign-up/email", { email: email.toUpperCase(), name: "Other Member", password });
  assert.ok(response.status >= 400 && response.status < 500);
  assert.equal(await prisma.member.count({ where: { email } }), 1);
});

test("invalid names and short passwords are rejected by the server", async () => {
  for (const extra of [{ name: " " }, { name: "x".repeat(121) }, { password: "short" }]) {
    const email = `invalid-${randomUUID()}@example.com`; emails.push(email);
    const response = await send("/sign-up/email", { email, name: "Valid Name", password, ...extra });
    assert.ok(response.status >= 400 && response.status < 500);
    assert.equal(await prisma.member.count({ where: { email } }), 0);
  }
});

test("wrong password fails, valid credentials sign in and signout revokes the session", async () => {
  const { email } = await signup();
  const invalid = await send("/sign-in/email", { email, password: "wrong-password-2026" });
  assert.equal(invalid.status, 401);
  const valid = await send("/sign-in/email", { email, password });
  assert.equal(valid.status, 200);
  const cookie = cookieHeaders(valid);
  assert.equal((await (await send("/get-session", undefined, cookie)).json()).user.email, email);
  assert.equal((await send("/sign-out", {}, cookie)).status, 200);
  assert.equal(await (await send("/get-session", undefined, cookie)).json(), null);
});

test("expired and tampered sessions are rejected", async () => {
  const { data, cookie } = await signup();
  assert.equal(await (await send("/get-session", undefined, "__Secure-ejder-member.session_token=forged")).json(), null);
  await prisma.memberSession.updateMany({ where: { userId: data.user.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await (await send("/get-session", undefined, cookie)).json(), null);
});

test("profile writes require membership and cannot change another member's profile", async () => {
  const one = await signup();
  const two = await signup();
  assert.equal((await send("/update-user", { name: "Unauthorized" })).status, 401);
  const response = await send("/update-user", { name: "Updated Name", userId: two.data.user.id, id: two.data.user.id, emailVerified: true }, one.cookie);
  assert.equal(response.status, 200);
  assert.equal((await prisma.member.findUniqueOrThrow({ where: { id: one.data.user.id } })).name, "Updated Name");
  assert.equal((await prisma.member.findUniqueOrThrow({ where: { id: two.data.user.id } })).name, "Test Üye");
  assert.equal((await prisma.member.findUniqueOrThrow({ where: { id: one.data.user.id } })).emailVerified, false);
});

test("password changes verify old password, rotate the current session and revoke other sessions", async () => {
  const { email, cookie } = await signup();
  const otherSession = await send("/sign-in/email", { email, password });
  const otherCookie = cookieHeaders(otherSession);
  const newPassword = "Updated-member-password-2026!";
  const wrong = await send("/change-password", { currentPassword: "incorrect-password", newPassword, revokeOtherSessions: true }, cookie);
  assert.equal(wrong.status, 400);
  const changed = await send("/change-password", { currentPassword: password, newPassword, revokeOtherSessions: true }, cookie);
  assert.equal(changed.status, 200);
  assert.equal(await (await send("/get-session", undefined, otherCookie)).json(), null);
  assert.equal(await (await send("/get-session", undefined, cookie)).json(), null);
  assert.ok((await (await send("/get-session", undefined, cookieHeaders(changed))).json()).user);
  assert.equal((await send("/sign-in/email", { email, password })).status, 401);
  assert.equal((await send("/sign-in/email", { email, password: newPassword })).status, 200);
});

test("cross-origin signup and authenticated writes are rejected", async () => {
  const { cookie } = await signup();
  const response = await send("/update-user", { name: "Attacker" }, cookie, { origin: "https://evil.test" });
  assert.equal(response.status, 403);
  const response2 = await send("/sign-up/email", { name: "Attacker", email: "csrf@example.com", password }, "", { origin: "https://evil.test" });
  assert.equal(response2.status, 403);
});

test("member cookies cannot authenticate as the existing administrator", async () => {
  const { cookie } = await signup();
  const { verifyAdminToken } = await import("../lib/auth");
  const token = decodeURIComponent(cookie.split(";")[0].split("=").slice(1).join("="));
  assert.equal(verifyAdminToken(token), false);
});

test("persistent rate limits block repeated login attempts across auth instances", async () => {
  const { createMemberAuth } = await import("../lib/members/auth");
  const headers = { "x-forwarded-for": "203.0.113.250" };
  for (let index = 0; index < 10; index++) {
    const response = await send("/sign-in/email", { email: "does-not-exist@example.com", password }, "", headers);
    assert.equal(response.status, 401);
  }
  const anotherInstance = createMemberAuth(prisma, { baseURL: origin, secret: "a-test-only-member-secret-with-at-least-32-characters-2026" });
  const response = await anotherInstance.handler(new Request(`${origin}/api/member-auth/sign-in/email`, { method: "POST", headers: { "Content-Type": "application/json", origin, ...headers }, body: JSON.stringify({ email: "does-not-exist@example.com", password }) }));
  assert.equal(response.status, 429);
});
