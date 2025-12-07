import { betterAuth, type User as BetterAuthUser } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
import {
  sendEmail,
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
} from "@/lib/email"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendVerificationEmail: async ({ user, url }: { user: BetterAuthUser; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email - OrbiFinance",
        html: getVerificationEmailTemplate(url),
      })
    },
    sendResetPasswordEmail: async ({ user, url }: { user: BetterAuthUser; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password - OrbiFinance",
        html: getPasswordResetEmailTemplate(url),
      })
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      accessType: "offline",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      tenantId: "common",
      authority: "https://login.microsoftonline.com",
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
})

export type Session = typeof auth.$Infer.Session.session
export type User = typeof auth.$Infer.Session.user
