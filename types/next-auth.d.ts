import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
            role: "camper" | "owner" | "admin";
            avatar?: string;
            city?: string;
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
    }
}