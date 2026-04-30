"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { playfair } from "@/lib/fonts";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
}

export default function Hero() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    function onThemeChange(e: Event) {
      setTheme((e as CustomEvent).detail);
    }
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center text-center">
      <Image
        src={theme === "light" ? "/hero_light.jpg" : "/hero_dark.jpg"}
        alt="Algeria landscape"
        fill
        sizes="100vw"
        className="absolute inset-0 object-cover transition-opacity duration-500"
        priority
      />
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        <span className="text-xs font-medium px-4 py-1.5 rounded-full border border-orange-500/40 text-orange-400 tracking-widest uppercase">
          Discover Algeria
        </span>
        <h1
          className={`${playfair.className} text-5xl md:text-6xl font-bold leading-tight max-w-2xl`}
          style={{ color: theme === "light" ? "#0f172a" : "#ffffff" }}
        >
          Algeria&apos;s <span className="text-orange-500">Campsites,</span>
          <br />
          All in One Place
        </h1>
        <p
          className="text-lg max-w-md"
          style={{
            color: theme === "light" ? "#0f172a" : "#cbd5e1",
            textShadow: theme === "light"
              ? "0 1px 4px rgba(255,255,255,0.35)"
              : "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          Discover the best camping spots across Algeria — from the Sahara to the coast.
        </p>
        <Link
          href="/explore"
          className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium text-base hover:bg-orange-600 transition-all duration-300 mt-2"
        >
          Explore Campsites →
        </Link>
      </div>
    </section>
  );
}
