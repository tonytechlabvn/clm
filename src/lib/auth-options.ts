// Shared NextAuth configuration — must be passed to getServerSession() in API routes
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma-client";

/* eslint-disable */

export const authOptions: NextAuthOptions = {
  providers: [
    // WordPress SSO (primary auth — custom OAuth endpoints)
    {
      id: "wordpress",
      name: "TonyTechLab",
      type: "oauth",
      authorization: {
        url: process.env.WP_OAUTH_AUTHORIZE_URL!,
        params: { scope: "basic" },
      },
      token: {
        url: process.env.WP_OAUTH_TOKEN_URL!,
        async request({ params, provider }: any) {
          const res = await fetch(process.env.WP_OAUTH_TOKEN_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: params.code,
              client_id: provider.clientId,
              client_secret: provider.clientSecret,
              redirect_uri: provider.callbackUrl,
            }),
          });
          if (!res.ok) {
            throw new Error(`WP token endpoint returned ${res.status}`);
          }
          const tokens = await res.json();
          return { tokens };
        },
      },
      userinfo: {
        url: process.env.WP_OAUTH_USERINFO_URL!,
        async request({ tokens }: any) {
          const res = await fetch(process.env.WP_OAUTH_USERINFO_URL!, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (!res.ok) {
            throw new Error(`WP userinfo endpoint returned ${res.status}`);
          }
          return await res.json();
        },
      },
      clientId: process.env.WP_OAUTH_CLIENT_ID!,
      clientSecret: process.env.WP_OAUTH_CLIENT_SECRET!,
      profile(profile: any) {
        const roles: string[] = profile.roles || [];
        const isWpAdmin = roles.includes("administrator");
        return {
          id: String(profile.ID || profile.id),
          name: profile.display_name || profile.user_nicename || profile.name,
          email: profile.user_email || profile.email,
          image: profile.avatar_url || null,
          wpRole: isWpAdmin ? "admin" : "user",
        };
      },
    },
    // Google OAuth (secondary — for Gemini API access via server-side token)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/generative-language.retriever",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    // Guard: only allow Google sign-in if user already exists via WP SSO
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });
        return !!existingUser;
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // WordPress OAuth sign-in
      if (account?.provider === "wordpress" && user) {
        token.wpUser = {
          id: user.id,
          email: user.email!,
          name: user.name!,
        };

        const wpRole = (user as any).wpRole || "user";

        try {
          const wpId = parseInt(user.id, 10);
          if (isNaN(wpId)) {
            console.error("Invalid WP user ID:", user.id);
            return token;
          }
          const dbUser = await prisma.user.upsert({
            where: { wpId },
            update: { name: user.name, email: user.email },
            create: {
              wpId,
              name: user.name,
              email: user.email,
              role: wpRole,
            },
          });
          token.dbUserId = dbUser.id;
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;

          // Auto-create default org + membership for admin users on first sign-in
          if (dbUser.role === "admin" || dbUser.role === "root") {
            const hasMembership = await prisma.orgMember.findFirst({
              where: { userId: dbUser.id },
            });
            if (!hasMembership) {
              // Find or create the default org
              let defaultOrg = await prisma.organization.findFirst({
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
              });
              if (!defaultOrg) {
                defaultOrg = await prisma.organization.create({
                  data: {
                    name: "Tony Tech Lab",
                    slug: "tony-tech-lab",
                    description: "Default organization",
                  },
                });
              }
              await prisma.orgMember.create({
                data: {
                  userId: dbUser.id,
                  orgId: defaultOrg.id,
                  role: "owner",
                },
              });
            }
          }
        } catch (error) {
          console.error("Failed to upsert user:", error);
        }
      }

      // Google OAuth sign-in — store tokens server-side only (NOT exposed to session)
      if (account?.provider === "google") {
        token.accessToken = account.access_token as string;
        token.refreshToken = account.refresh_token as string;
        token.expiresAt = account.expires_at;
      }

      // Re-check isActive + role from DB on token refresh
      if (token.dbUserId && !account) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.dbUserId as string },
            select: { isActive: true, role: true },
          });
          if (dbUser) {
            token.isActive = dbUser.isActive;
            token.role = dbUser.role;
          }
        } catch {
          // Keep existing token values on DB error
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.wpUser) {
        session.wpUser = token.wpUser;
      }
      if (token.dbUserId) {
        session.dbUserId = token.dbUserId;
      }
      if (token.role) {
        session.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
