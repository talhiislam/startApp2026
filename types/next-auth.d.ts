import "next-auth";
import "next-auth/jwt";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: DefaultSession["user"] & {
            id: string;
            username: string;
            role: "camper" | "owner" | "admin";
            avatar?: string;
            city?: string;
            image?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        username?: string;
        role?: "camper" | "owner" | "admin";
        avatar?: string;
        city?: string;
        picture?: string;
    }
}
