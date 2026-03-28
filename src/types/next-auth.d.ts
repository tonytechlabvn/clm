import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    dbUserId?: string;
    role?: string;
    wpUser?: {
      id: string;
      email: string;
      name: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    dbUserId?: string;
    role?: string;
    isActive?: boolean;
    wpUser?: {
      id: string;
      email: string;
      name: string;
    };
  }
}
