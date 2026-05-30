"use client";
import Link from "next/link";
import Image from "next/image";
import ConfirmModal from "@/components/ConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
];

const bottomNavItems = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
];

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState("");
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const logoSrc = theme === "light" ? "/logo_light.png" : "/logo_dark.png";

  const user = session?.user;
  const avatarSrc = user?.id
    ? "/api/profile/avatar"
    : user?.avatar || user?.image || "/default-avatar.png";
  const visibleAvatarSrc =
    failedAvatarSrc === avatarSrc ? "/default-avatar.png" : avatarSrc;

  useEffect(() => {
    function onThemeChange(e: Event) {
      setTheme((e as CustomEvent).detail);
    }
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && e.target instanceof Node && !menuRef.current.contains(e.target)) {
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

  function openAuthPrompt() {
    setOpen(false);
    setSheetOpen(false);
    setAuthPromptOpen(true);
  }

  const navLinkClass = (href: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      pathname === href
        ? "text-[var(--accent)]"
        : "hover:bg-[var(--bg-hover)]"
    }`;

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 h-[72px] hidden md:flex items-center justify-between px-12 backdrop-blur-xl border-b z-[1000]"
        style={{
          background: "color-mix(in srgb, var(--bg-base) 85%, transparent)",
          borderColor: "var(--border)",
          backgroundColor: "color-mix(in srgb, var(--bg-base) 85%, transparent)",
        }}
      >
        <Link href="/">
          <Image src={logoSrc} alt="SahaTour" width={120} height={40} className="h-10 w-auto object-contain rounded-lg" />
        </Link>

        <ul className="absolute left-1/2 -translate-x-1/2 flex gap-2 items-center list-none">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={navLinkClass(link.href)}
                style={{ color: pathname === link.href ? "var(--accent)" : "var(--text-muted)" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="flex gap-2 items-center list-none">
          <li><ThemeToggle /></li>

          {status === "loading" ? (
            <li className="w-24" />
          ) : user ? (
            <li className="relative">
              <div ref={menuRef}>
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                  style={{ color: "var(--text-muted)" }}
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
                  className={`absolute right-0 mt-2 w-52 rounded-xl shadow-lg transition-all duration-200
                    ${open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}`}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <ul className="flex flex-col p-2 gap-1">
                    <li>
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 rounded-lg text-sm transition"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/trips"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 rounded-lg text-sm transition"
                        style={{ color: "var(--text-muted)" }}
                      >
                        My Trips
                      </Link>
                    </li>
                    {(user.role === "owner" || user.role === "admin") && (
                      <li>
                        <Link
                          href="/dashboard"
                          onClick={() => setOpen(false)}
                          className="block px-4 py-2 rounded-lg text-sm transition"
                          style={{ color: "var(--text-muted)" }}
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
                          className="block px-4 py-2 rounded-lg text-sm transition"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Admin
                        </Link>
                      </li>
                    )}
                    <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                    <li>
                      <button
                        onClick={() => { setOpen(false); setSignOutOpen(true); }}
                        className="w-full text-left px-4 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 transition"
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
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                  style={{ color: pathname === "/auth/login" ? "var(--accent)" : "var(--text-muted)" }}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-300 bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                >
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <div
        className="fixed top-0 left-0 right-0 h-[44px] flex md:hidden items-center justify-between px-4 border-b z-[1000]"
        style={{
          background: "color-mix(in srgb, var(--bg-base) 95%, transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="w-8" />
        <Link href="/">
          <Image src={logoSrc} alt="SahaTour" width={100} height={28} className="h-7 w-auto object-contain rounded-md" />
        </Link>
        <ThemeToggle />
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 flex md:hidden items-center border-t z-[1000] px-2"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        {bottomNavItems.map((item) => {
          const active = isBottomNavActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-all duration-200"
              style={{ color: active ? "var(--accent)" : "var(--text-ghost)" }}
            >
              {item.icon(active)}
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Avatar tab */}
        <button
          onClick={() => {
            if (!user && status !== "loading") { openAuthPrompt(); return; }
            setSheetOpen(true);
          }}
          className="flex-1 flex flex-col items-center justify-center py-2 transition-all duration-200"
          style={{ color: "var(--text-ghost)" }}
        >
          {user ? (
            <img
              src={visibleAvatarSrc}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover ring-1"
              style={{ boxShadow: "0 0 0 1px var(--accent-border)" }}
              onError={(e) => {
                setFailedAvatarSrc(avatarSrc);
                e.currentTarget.src = "/default-avatar.png";
              }}
            />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>
      </nav>

      {/* ── Mobile Slide-up Sheet ── */}
      {sheetOpen && (
        <>
          <div className="fixed inset-0 z-[1001] bg-black/60 md:hidden" onClick={() => setSheetOpen(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[1002] md:hidden rounded-t-2xl pb-safe"
            style={{
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>

            {user && (
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
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
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user.username}</p>
                  <p className="text-xs capitalize" style={{ color: "var(--text-faint)" }}>{user.role}</p>
                </div>
              </div>
            )}

            <ul className="flex flex-col p-3 gap-1">
              <li>
                <Link
                  href="/profile"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/trips"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  My Trips
                </Link>
              </li>
              {(user?.role === "owner" || user?.role === "admin") && (
                <li>
                  <Link
                    href="/dashboard"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Admin Panel
                  </Link>
                </li>
              )}
              <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />
              <li>
                <button
                  onClick={() => { setSheetOpen(false); setSignOutOpen(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 transition"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </li>
            </ul>
            <div className="h-4" />
          </div>
        </>
      )}

      <ConfirmModal
        open={authPromptOpen}
        title="Sign in required"
        message="You need to log in or sign up before opening this page."
        confirmLabel="Log In"
        secondaryLabel="Sign Up"
        cancelLabel="Stay here"
        variant="warning"
        onConfirm={() => { setAuthPromptOpen(false); router.push("/auth/login"); }}
        onSecondary={() => { setAuthPromptOpen(false); router.push("/auth/signup"); }}
        onCancel={() => setAuthPromptOpen(false)}
      />

      <ConfirmModal
        open={signOutOpen}
        title="Sign Out?"
        message="You'll be returned to the home page and will need to sign in again to access your trips."
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        variant="warning"
        onConfirm={() => { setSignOutOpen(false); signOut({ callbackUrl: "/" }); }}
        onCancel={() => setSignOutOpen(false)}
      />
    </>
  );
}