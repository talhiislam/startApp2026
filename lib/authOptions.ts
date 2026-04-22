import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import type { Profile } from "next-auth";

interface AuthUser extends NextAuthUser {
    username: string;
    role: "camper" | "owner" | "admin";
    avatar?: string;
    city?: string;
}

function getProfilePicture(profile?: Profile) {
    const picture = (profile as { picture?: unknown } | undefined)?.picture;
    return typeof picture === "string" ? picture : undefined;
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

                if (!user.isVerified) {
                    throw new Error("EMAIL_NOT_VERIFIED");
                }
                
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
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image:
                        typeof profile.picture === "string"
                            ? profile.picture
                            : null,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                if (!user.email) return false;
                const googleAvatar = user.image || getProfilePicture(profile);

                await connectToDatabase();
                const existing = await User.findOne({ email: user.email });

                if (!existing) {
                    await User.create({
                        email: user.email,
                        username:
                            user.name?.replace(/\s+/g, "").toLowerCase() ??
                            user.email?.split("@")[0],
                        role: "camper",
                        avatar: googleAvatar,
                    });
                } else if (googleAvatar && existing.avatar !== googleAvatar) {
                    existing.avatar = googleAvatar;
                    await existing.save();
                }
            }
            return true;
        },
        async jwt({ token, user, account, profile }) {
            if (user) {
                token.email = user.email ?? token.email;
                token.name = user.name ?? token.name;
                token.picture =
                    user.image ??
                    getProfilePicture(profile) ??
                    (typeof token.picture === "string" ? token.picture : undefined);
                token.avatar =
                    token.avatar ||
                    (typeof token.picture === "string" ? token.picture : undefined);

                if (account?.provider !== "google") {
                    const u = user as AuthUser;
                    token.id = u.id;
                    token.username = u.username;
                    token.role = u.role;
                    token.avatar = u.avatar;
                    token.city = u.city;
                    return token;
                }
            }

            if (token.email) {
                await connectToDatabase();
                const dbUser = await User.findOne({ email: token.email });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.username = dbUser.username;
                    token.role = dbUser.role;
                    token.avatar =
                        dbUser.avatar ||
                        token.avatar ||
                        (typeof token.picture === "string" ? token.picture : undefined);
                    token.city = dbUser.city;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username =
                    (token.username as string) ||
                    session.user.name?.replace(/\s+/g, "").toLowerCase() ||
                    "";
                session.user.role = (token.role as "camper" | "owner" | "admin") || "camper";
                session.user.avatar =
                    (token.avatar as string) || (token.picture as string);
                session.user.image = session.user.avatar || null;
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
