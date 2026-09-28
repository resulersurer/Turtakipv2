import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { memberAuthConfig } from "./config";
import { MEMBER_PASSWORD_MAX, MEMBER_PASSWORD_MIN, memberNameSchema } from "./validation";

export function createMemberAuth(database: PrismaClient, config: { secret: string; baseURL: string }) {
  return betterAuth({
    appName: "Ejder Turizm",
    basePath: "/api/member-auth",
    baseURL: config.baseURL,
    secret: config.secret,
    database: prismaAdapter(database, { provider: "postgresql", transaction: true }),
    emailAndPassword: { enabled: true, autoSignIn: true, minPasswordLength: MEMBER_PASSWORD_MIN, maxPasswordLength: MEMBER_PASSWORD_MAX },
    user: { modelName: "member" },
    session: { modelName: "memberSession", expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
    account: { modelName: "memberAccount", accountLinking: { enabled: false } },
    verification: { modelName: "memberVerification" },
    advanced: { cookiePrefix: "ejder-member" },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "memberRateLimit",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
        "/change-password": { window: 60, max: 5 }
      }
    },
    databaseHooks: {
      user: {
        create: { before: async (user) => {
          const name = memberNameSchema.safeParse(user.name);
          if (!name.success) throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Geçersiz ad ve soyad." });
          return { data: { ...user, name: name.data } };
        } },
        update: { before: async (user) => {
          if (user.name === undefined) return { data: user };
          const name = memberNameSchema.safeParse(user.name);
          if (!name.success) throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Geçersiz ad ve soyad." });
          return { data: { ...user, name: name.data } };
        } }
      }
    }
  });
}

let instance: ReturnType<typeof createMemberAuth> | undefined;
export function getMemberAuth() {
  const config = memberAuthConfig();
  if (!config || !process.env.DATABASE_URL) return null;
  instance ??= createMemberAuth(prisma, config);
  return instance;
}
