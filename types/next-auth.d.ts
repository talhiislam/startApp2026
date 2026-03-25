import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            username: string;
            role: "camper" | "owner" | "admin";
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        username?: string;
        role?: "camper" | "owner" | "admin";
    }
}