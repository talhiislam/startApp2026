"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
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

    const [open, setOpen] = useState(false);

    const user = session?.user;

    const menuRef = useRef<HTMLLIElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (
                menuRef.current &&
                e.target instanceof Node &&
                !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

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
                    <li className="relative" ref={menuRef}>
                        {/* Trigger */}
                        <button
                            onClick={() => setOpen(!open)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-300"
                        >
                            <img
                                src={user.avatar || user.image || "/default-avatar.png"}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/default-avatar.png";
                                }}
                            />
                            <span>{user.username}</span>
                        </button>

                        {/* Dropdown */}
                        <div
                            className={`absolute right-0 mt-2 w-52 bg-[rgba(10,14,23,0.95)] backdrop-blur-xl border border-white/10 rounded-xl shadow-lg transition-all duration-200
                                ${open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}
                            `}
                        >
                            <ul className="flex flex-col p-2 gap-1">

                                {/* Profile */}
                                <li>
                                    <Link
                                        href="/profile"
                                        onClick={() => setOpen(false)}
                                        className="block px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
                                    >
                                        Profile
                                    </Link>
                                </li>

                                {/* Dashboard */}
                                {(user.role === "owner" || user.role === "admin") && (
                                    <li>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setOpen(false)}
                                            className="block px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
                                        >
                                            Dashboard
                                        </Link>
                                    </li>
                                )}

                                {/* Admin */}
                                {user.role === "admin" && (
                                    <li>
                                        <Link
                                            href="/admin"
                                            onClick={() => setOpen(false)}
                                            className="block px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
                                        >
                                            Admin
                                        </Link>
                                    </li>
                                )}

                                {/* Divider */}
                                <div className="h-px bg-white/10 my-1" />

                                {/* Sign Out */}
                                <li>
                                    <button
                                        onClick={() => {
                                            setOpen(false);
                                            signOut({ callbackUrl: "/" });
                                        }}
                                        className="w-full text-left px-4 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
                                    >
                                        Sign Out
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </li>
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
