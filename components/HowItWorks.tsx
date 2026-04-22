import { MapPin, ClipboardList, Flame } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Find a Campsite",
    icon: <MapPin className="w-8 h-8 text-orange-500" />,
    description: "Browse hundreds of campsites across Algeria — from Sahara dunes to mountain forests and coastal spots.",
  },
  {
    number: "02",
    title: "Plan Your Trip",
    icon: <ClipboardList className="w-8 h-8 text-orange-500" />,
    description: "Save your favorites, set your dates, and build a packing checklist tailored to your destination.",
  },
  {
    number: "03",
    title: "Go Camping",
    icon: <Flame className="w-8 h-8 text-orange-500" />,
    description: "Head out with everything organized. Contact the campsite owner directly and enjoy the adventure.",
  },
];

export default function HowItWorks() {
  return (
    <section className="px-6 md:px-16 py-24 bg-[#020617] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-2 text-center mb-32">
          <span className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em]">Simple</span>
          <h2 className="text-4xl font-bold text-white">How It Works</h2>
        </div>

        <div className="relative">
          {/* THE GLOWING LINE */}
          <div className="hidden md:block absolute top-[-60px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent">
            <div className="absolute inset-0 bg-orange-500 blur-[4px] opacity-40" />
          </div>

          <div className="flex flex-col md:flex-row items-stretch justify-center relative z-10">
            {steps.map((step, index) => (
              <div 
                key={step.number} 
                className="relative group w-full"
                style={{ 
                  marginLeft: index === 0 ? '0' : '-3rem', 
                  zIndex: 10 - index 
                }}
              >
                {/* NODE - Adjusted with translate-x to center over the visible card area */}
                <div className="hidden md:flex absolute top-[-68px] left-1/2 -translate-x-1/2 md:translate-x-[0.5rem] z-30">
                  <div className="w-4 h-4 rounded-full bg-[#020617] border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,1)]" />
                </div>

                {/* THE CARD */}
                <div 
                  className="relative h-full p-10 py-16 bg-[#111827]/40 border-y border-white/10 backdrop-blur-sm
                    transition-all duration-500 hover:bg-[#111827]/60 min-h-[380px] flex flex-col justify-center
                    md:[clip-path:polygon(0%_0%,_88%_0%,_100%_50%,_88%_100%,_0%_100%,_12%_50%)]"
                >
                  <div className="flex flex-col items-center text-center pl-6">
                    <div className="mb-8 p-4 rounded-full bg-orange-500/10 border border-orange-500/20 group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>

                    <div className="mb-4">
                      <span className="text-orange-500 font-mono text-xs font-bold tracking-[0.2em] block mb-1">
                        STEP {step.number}
                      </span>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        {step.title.toUpperCase()}
                      </h3>
                    </div>

                    <p className="text-slate-400 text-sm leading-relaxed max-w-[240px]">
                      {step.description}
                    </p>
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