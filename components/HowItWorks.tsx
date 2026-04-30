"use client";

import { MapPin, ClipboardList, Flame } from "lucide-react";
import { useState, useEffect } from "react";

const steps = [
  {
    number: "01",
    title: "Find a Campsite",
    icon: <MapPin className="w-8 h-8" style={{ color: "var(--accent)" }} />,
    description: "Browse hundreds of campsites across Algeria — from Sahara dunes to mountain forests and coastal spots.",
  },
  {
    number: "02",
    title: "Plan Your Trip",
    icon: <ClipboardList className="w-8 h-8" style={{ color: "var(--accent)" }} />,
    description: "Save your favorites, set your dates, and build a packing checklist tailored to your destination.",
  },
  {
    number: "03",
    title: "Go Camping",
    icon: <Flame className="w-8 h-8" style={{ color: "var(--accent)" }} />,
    description: "Head out with everything organized. Contact the campsite owner directly and enjoy the adventure.",
  },
];

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
}

export default function HowItWorks() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

  useEffect(() => {
    function onThemeChange(e: Event) {
      setTheme((e as CustomEvent).detail);
    }
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

  const isDark = theme === "dark";

  return (
    <section
      className="px-6 md:px-16 py-24 overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-2 text-center mb-32">
          <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>Simple</span>
          <h2
            className="text-4xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            How It Works
          </h2>
        </div>

        <div className="relative">
          {/* Glowing line */}
          <div className="hidden md:block absolute top-[-60px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent">
            <div className="absolute inset-0 blur-[4px] opacity-40" style={{ background: "var(--accent)" }} />
          </div>

          <div className="flex flex-col md:flex-row items-stretch justify-center relative z-10">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group w-full"
                style={{ marginLeft: index === 0 ? "0" : "-3rem", zIndex: 10 - index }}
              >
                {/* Timeline node */}
                <div className="hidden md:flex absolute top-[-68px] left-1/2 -translate-x-1/2 md:translate-x-[0.5rem] z-30">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)]"
                    style={{ background: "var(--bg-deep)" }}
                  />
                </div>

                {/* Border wrapper */}
                <div
                  className="relative h-full min-h-[380px] transition-all duration-500
                    md:[clip-path:polygon(0%_0%,_88%_0%,_100%_50%,_88%_100%,_0%_100%,_12%_50%)]"
                  style={{
                    background: "var(--accent-border)",
                    padding: "1.5px",
                  }}
                >
                  {/* Card inner */}
                  <div
                    className="relative h-full p-10 py-16 backdrop-blur-sm
                      transition-all duration-500 min-h-[380px] flex flex-col justify-center
                      md:[clip-path:polygon(0%_0%,_88%_0%,_100%_50%,_88%_100%,_0%_100%,_12%_50%)]"
                    style={{
                      background: "var(--bg-card)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover-strong)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-card)";
                    }}
                  >
                    <div className="flex flex-col items-center text-center pl-6">
                      {/* Icon */}
                      <div className="mb-8 p-4 rounded-full border group-hover:scale-110 transition-transform" style={{ background: "var(--accent-subtle)", borderColor: "var(--accent-border)" }}>
                        {step.icon}
                      </div>

                      <div className="mb-4">
                        <span className="font-mono text-xs font-bold tracking-[0.2em] block mb-1" style={{ color: "var(--accent)" }}>
                          STEP {step.number}
                        </span>
                        <h3
                          className="text-2xl font-bold tracking-tight"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {step.title.toUpperCase()}
                        </h3>
                      </div>

                      <p
                        className="text-sm leading-relaxed max-w-[240px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
