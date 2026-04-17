"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/trips", label: "My Trips" },
];

const bottomNavItems = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/trips",
    label: "My Trips",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);

  const user = session?.user;
  const avatarSrc = user?.id
    ? "/api/profile/avatar"
    : user?.avatar || user?.image || "/default-avatar.png";
  const visibleAvatarSrc =
    failedAvatarSrc === avatarSrc ? "/default-avatar.png" : avatarSrc;

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

  function isBottomNavActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 h-[72px] hidden md:flex items-center justify-between px-12 bg-[rgba(10,14,23,0.85)] backdrop-blur-xl border-b border-white/[0.08] z-[1000]">
        <Link href="/">
          <Image
            src="/logo_dark.png"
            alt="SahaTour"
            width={120}
            height={40}
            className="h-10 w-auto object-contain rounded-lg"
          />
        </Link>

        <ul className="absolute left-1/2 -translate-x-1/2 flex gap-2 items-center list-none">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                                    ${
                                      pathname === link.href
                                        ? "text-orange-500"
                                        : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                                    }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="flex gap-2 items-center list-none">
          {status === "loading" ? (
            <li className="w-24" />
          ) : user ? (
            <li className="relative">
              <div ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-all duration-300"
                >
                  <img
                    src={visibleAvatarSrc}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      setFailedAvatarSrc(avatarSrc);
                      e.currentTarget.src = "/default-avatar.png";
                    }}
                  />
                  <span>{user.username}</span>
                </button>

                <div
                  className={`absolute right-0 mt-2 w-52 bg-[#111827] border border-white/10 rounded-xl shadow-lg transition-all duration-200
                                        ${open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}
                                    `}
                >
                  <ul className="flex flex-col p-2 gap-1">
                    <li>
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5"
                      >
                        Profile
                      </Link>
                    </li>
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
                    <div className="h-px bg-white/10 my-1" />
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
              </div>
            </li>
          ) : (
            <>
              <li>
                <Link
                  href="/auth/login"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                                        ${
                                          pathname === "/auth/login"
                                            ? "text-orange-500"
                                            : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                                        }`}
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

      {/* ── Mobile Top Bar (logo only) ── */}
      <div className="fixed top-0 left-0 right-0 h-[44px] flex md:hidden items-center justify-center bg-[rgba(10,14,23,0.95)] border-b border-white/[0.08] z-[1000]">
        <Link href="/">
          <Image
            src="/logo_dark.png"
            alt="SahaTour"
            width={100}
            height={28}
            className="h-7 w-auto object-contain rounded-md"
          />
        </Link>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 flex md:hidden items-center bg-[#111827] border-t border-white/[0.08] z-[1000] px-2">
        {bottomNavItems.map((item) => {
          const active = isBottomNavActive(item.href);
          const href =
            !user && status !== "loading" && item.href === "/trips"
              ? "/auth/login"
              : item.href;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200 ${
                active
                  ? "text-orange-500"
                  : "text-slate-600 hover:text-slate-400"
              }`}
            >
              {item.icon(active)}
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Avatar tab */}
        <button
          onClick={() => {
            if (!user && status !== "loading") {
              window.location.href = "/auth/login";
              return;
            }
            setSheetOpen(true);
          }}
          className="flex-1 flex flex-col items-center justify-center py-2 transition-all duration-200"
        >
          {user ? (
            <img
              src={visibleAvatarSrc}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-orange-500/40"
              onError={(e) => {
                setFailedAvatarSrc(avatarSrc);
                e.currentTarget.src = "/default-avatar.png";
              }}
            />
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
      </nav>

      {/* ── Mobile Slide-up Sheet ── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1001] bg-black/60 md:hidden"
            onClick={() => setSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[1002] md:hidden bg-[#111827] border-t border-white/[0.08] rounded-t-2xl pb-safe">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <img
                  src={visibleAvatarSrc}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    setFailedAvatarSrc(avatarSrc);
                    e.currentTarget.src = "/default-avatar.png";
                  }}
                />
                <div>
                  <p className="text-slate-100 text-sm font-medium">
                    {user.username}
                  </p>
                  <p className="text-slate-500 text-xs capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            )}

            {/* Menu items */}
            <ul className="flex flex-col p-3 gap-1">
              <li>
                <Link
                  href="/profile"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
              </li>
              {(user?.role === "owner" || user?.role === "admin") && (
                <li>
                  <Link
                    href="/dashboard"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
              )}
              {user?.role === "admin" && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Admin Panel
                  </Link>
                </li>
              )}
              <div className="h-px bg-white/[0.06] my-1" />
              <li>
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </li>
            </ul>

            {/* Safe area spacer for phones with home indicator */}
            <div className="h-4" />
          </div>
        </>
      )}
    </>
  );
}
