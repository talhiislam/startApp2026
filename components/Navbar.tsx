"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/trips", label: "My Trips" },
];

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const user = session?.user;

    return (
        <nav className="fixed top-0 left-0 right-0 h-[72px] flex items-center justify-between px-12 bg-[rgba(10,14,23,0.85)] backdrop-blur-xl border-b border-white/[0.08] z-[1000]">

            {/* Logo */}
            <Link href="/">
                <img
                    src="/logo_dark.png"
                    alt="SahaTour"
                    className="h-10 w-auto object-contain rounded-lg"
                />
            </Link>

            { /* Nav Links */}
            <ul className="absolute left-1/2 -translate-x-1/2 flex gap-2 items-center list-none">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                                ${pathname === link.href
                                    ? "text-orange-500"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                                }`}
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Auth */}
            <ul className="flex gap-2 items-center list-none">
                {status === "loading" ? (
                    <li className="w-24" />
                ) : user ? (
                    <>
                        <li>
                            <Link
                                href="/profile"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                                    ${pathname === "/profile"
                                        ? "text-orange-500"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                                    }`}
                            >
                                {user.username}
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition-all duration-300"
                            >
                                Sign Out
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <Link
                                href="/auth/login"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                                    ${pathname === "/auth/login"
                                        ? "text-orange-500"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"    
                                    }`
                                }
                            >
                                Login
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/auth/signup"
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all duration-300"
                            >
                                Sign Up
                            </Link>
                        </li>
                    </>
                )}
            </ul>

        </nav>
    );
}
