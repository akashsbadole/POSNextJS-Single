import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { verifyOTPToken } from "@/lib/otp-token";
import { checkLogin } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as never,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/register",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentialsSchema.parse(credentials);

          if (!await checkLogin(email)) return null;

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;
          if (user.status === "SUSPENDED") return null;
          if (user.status === "INACTIVE") return null;

          // OTP token login: password starts with "__otp__:" followed by JWT
          if (password.startsWith("__otp__:")) {
            const token = password.slice(8);
            const payload = await verifyOTPToken(token);
            if (!payload || payload.email !== email) return null;
          } else {
            if (!user.password) return null;
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return null;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          const branch = user.branchId ? await prisma.branch.findUnique({ where: { id: user.branchId } }) : null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            businessType: branch?.businessType || "RETAIL_PHARMACY",
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.branchId = user.branchId;
        token.businessType = user.businessType || "RETAIL_PHARMACY";
        token.twoFactorEnabled = user.twoFactorEnabled || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
        session.user.branchId = token.branchId;
        session.user.businessType = token.businessType || "RETAIL_PHARMACY";
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entityType: "user",
          entityId: user.id,
        },
      });
    },
  },
};
