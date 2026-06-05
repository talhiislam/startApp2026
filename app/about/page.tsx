"use client";

import { playfair } from "@/lib/fonts";

const stats = [
  { value: "48", label: "Wilayas covered" },
  { value: "5", label: "Regions mapped" },
  { value: "4", label: "Campsite types" },
];

type TeamMember = {
  initials: string;
  name: string;
  role: string;
  email: string;
};

const team: TeamMember[] = [
  {
    initials: "HA",
    name: "HADEF Ahmed Anis",
    role: "Full-stack development · UI/UX",
    email: "hadef.anis@univ-oeb.dz",
  },
  {
    initials: "TI",
    name: "TALHI Islam",
    role: "Mobile application · UI/UX",
    email: "akramzd987@gmail.com",
  },
  {
    initials: "LN",
    name: "LACHGAR Naoufel",
    role: "Frontend developement · Business operations",
    email: "noufel.work11@gmail.com",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen px-6 md:px-16 py-16 md:py-24">
      <div className="max-w-5xl mx-auto flex flex-col gap-16">
        <div className="flex flex-col gap-5">
          <span
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--accent)" }}
          >
            About SahaTour
          </span>
          <h1
            className={`${playfair.className} text-4xl md:text-5xl font-bold leading-tight`}
            style={{ color: "var(--text-primary)" }}
          >
            Algeria&apos;s camping platform,{" "}
            <span style={{ color: "var(--accent)" }}>
              built for Algerians
            </span>
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Finding and booking campsites across Algeria was scattered and
            mostly word-of-mouth. SahaTour brings it all in one place â€” a
            trusted platform where campers discover great spots and owners
            reach adventurers across the country.
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            Built as a university project at{" "}
            <span style={{ color: "var(--text-muted)" }}>
              University © Larbi Ben M&apos;hidi, Oum El Bouaghi
            </span>
          </p>
        </div>

        <div className="h-px" style={{ background: "var(--border-subtle)" }} />

        <div className="flex flex-col gap-6">
          <span
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--accent)" }}
          >
            By the numbers
          </span>
          <div className="grid grid-cols-3 gap-4">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl p-6 flex flex-col items-center gap-2 text-center"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="text-3xl font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {value}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-faint)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px" style={{ background: "var(--border-subtle)" }} />

        <div className="flex flex-col gap-6">
          <span
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: "var(--accent)" }}
          >
            The team
          </span>
          <div className="flex flex-col gap-4">
            {team.map((member) => (
              <div
                key={member.email}
                className="flex items-center gap-5 rounded-2xl p-5"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {member.initials}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {member.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {member.role}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {member.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
