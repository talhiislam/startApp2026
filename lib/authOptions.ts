import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";

interface AuthUser extends NextAuthUser {
    username: string;
    role: "camper" | "owner" | "admin";
    avatar?: string;
    city?: string;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {},
                password: {},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password)
                    return null;
                await connectToDatabase();
                const  user = await User.findOne({ email: credentials.email });
                if (!user || !user.password)
                    return null;
                const isMatch = await bcrypt.compare(credentials.password, user.password);
                if (!isMatch)
                    return null;
                return {
                    id: user._id.toString(),
                    email: user.email,
                    username: user.username,
                    role: user.role,
                };
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                if (!user.email) return false;

                await connectToDatabase();
                const existing = await User.findOne({ email: user.email });

                if (!existing) {
                    await User.create({
                        email: user.email,
                        username:
                            user.name?.replace(/\s+/g, "").toLowerCase() ??
                            user.email?.split("@")[0],
                        role: "camper",
                        avatar: user.image ?? undefined,
                    });
                } else if (user.image && existing.avatar !== user.image) {
                    existing.avatar = user.image ?? undefined;
                    await existing.save();
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                const u = user as AuthUser;
                token.id = u.id;
                token.username = u.username;
                token.role = u.role;
                token.avatar = u.avatar;
                token.city = u.city;
            }

            if (token.email) {
                await connectToDatabase();
                const dbUser = await User.findOne({ email: token.email });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.username = dbUser.username;
                    token.role = dbUser.role;
                    token.avatar = dbUser.avatar || token.avatar;
                    token.city = dbUser.city;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.role = token.role as "camper" | "owner" | "admin";
                session.user.avatar =
                    (token.avatar as string) || (token.picture as string);
                session.user.city = token.city as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
