import { test } from "node:test";
import assert from "node:assert/strict";
import { memberAuthConfig } from "../lib/members/config";
import { memberErrorMessage, memberNameSchema, memberPasswordSchema, memberSignInSchema, memberSignUpSchema, safeMemberReturnPath } from "../lib/members/validation";

const password = "A-test-password-2026!";
const secret = "a-unit-test-secret-that-is-only-used-in-tests-123456789";

test("sign-up trims the name, normalizes email and enforces matching passwords", () => {
  const result = memberSignUpSchema.parse({ name: "  Ayşe Yılmaz  ", email: " User@Example.COM ", password, confirmPassword: password });
  assert.equal(result.name, "Ayşe Yılmaz");
  assert.equal(result.email, "user@example.com");
  assert.equal(memberSignUpSchema.safeParse({ ...result, confirmPassword: "different" }).success, false);
});
test("name and password boundaries reject invalid signup input", () => {
  const valid = { name: "Test Member", email: "member@example.com", password, confirmPassword: password };
  for (const name of [" ", "A", "A".repeat(121)]) assert.equal(memberNameSchema.safeParse(name).success, false);
  for (const value of ["short", "a".repeat(129)]) assert.equal(memberSignUpSchema.safeParse({ ...valid, password: value, confirmPassword: value }).success, false);
  assert.equal(memberSignUpSchema.safeParse({ ...valid, email: "not-email" }).success, false);
});
test("login does not trim or alter passwords", () => {
  assert.equal(memberSignInSchema.parse({ email: "a@example.com", password: "  password  " }).password, "  password  ");
});
test("password changes require confirmation and a different password", () => {
  assert.equal(memberPasswordSchema.safeParse({ currentPassword: password, newPassword: password, confirmPassword: password }).success, false);
  assert.equal(memberPasswordSchema.safeParse({ currentPassword: password, newPassword: "New-password-2026!", confirmPassword: "New-password-2026!" }).success, true);
});
test("return paths allow only customer-facing same-origin destinations", () => {
  for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/admin", "/api/auth/login", "/giris", "/kayit", "/%2f%2fevil.test", "/passenger/%5cevil.test", "/tour/%00evil", "/tour/%", ["/tours", "/admin"], undefined]) assert.equal(safeMemberReturnPath(path), "/hesabim");
  assert.equal(safeMemberReturnPath("/tours?q=Japonya"), "/tours?q=Japonya");
  assert.equal(safeMemberReturnPath("/passenger/example?departureId=abc"), "/passenger/example?departureId=abc");
});
test("member authentication never starts with missing, short or placeholder secrets", () => {
  assert.equal(memberAuthConfig({}), null);
  assert.equal(memberAuthConfig({ BETTER_AUTH_SECRET: "short" }), null);
  assert.equal(memberAuthConfig({ ADMIN_COOKIE_SECRET: "replace-with-a-long-random-string" }), null);
  assert.equal(memberAuthConfig({ BETTER_AUTH_SECRET: "replace-with-a-long-random-string" }), null);
});
test("member secret is separated from the admin signing secret", () => {
  const config = memberAuthConfig({ ADMIN_COOKIE_SECRET: secret });
  assert.ok(config);
  assert.notEqual(config.secret, secret);
  assert.equal(config.baseURL, "http://localhost:3000");
  assert.deepEqual(memberAuthConfig({ ADMIN_COOKIE_SECRET: secret }), config);
});
test("auth origins reject non-HTTPS remote sites and malformed configuration", () => {
  for (const value of ["http://example.com", "https://example.com/path", "https://user:pass@example.com", "https://example.com?query=1", "invalid"]) assert.equal(memberAuthConfig({ BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL: value }), null);
  assert.equal(memberAuthConfig({ BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL: "https://example.com/" })?.baseURL, "https://example.com");
  assert.equal(memberAuthConfig({ BETTER_AUTH_SECRET: secret, BETTER_AUTH_URL: "http://127.0.0.1:3107" })?.baseURL, "http://127.0.0.1:3107");
});
test("user-facing failures are translated without exposing backend messages", () => {
  assert.match(memberErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" }), /hatalı/);
  assert.match(memberErrorMessage({ status: 429 }), /Bir dakika/);
  assert.equal(memberErrorMessage({ message: "sensitive database connection details" }).includes("sensitive"), false);
});
