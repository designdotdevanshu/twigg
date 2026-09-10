import {
  Layers,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Building2,
  Wallet,
} from "lucide-react";

export function AuthHeroPanel() {
  return (
    <div className="relative hidden h-full w-full flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-zinc-100 select-none lg:flex">
      {/* Background ambient lighting and subtle grid */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg font-bold text-zinc-950 shadow-md">
            T
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              twigg
            </span>
            <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
              v2.0 PRO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400 backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Bank-Grade Security</span>
        </div>
      </div>

      {/* Center: Interactive Fintech Mockups */}
      <div className="relative z-10 my-auto flex flex-col items-center gap-6 py-8">
        {/* Card 1: Personal Pocket Card */}
        <div className="w-full max-w-md transform rounded-2xl border border-zinc-800/80 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-xl transition duration-500 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Emergency Pocket
                </p>
                <p className="text-[11px] text-zinc-400">
                  Personal Savings Vault
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              82% of Goal
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white">
                $12,450.00
              </span>
              <span className="text-xs text-zinc-400">Target: $15,000</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-[82%] rounded-full bg-linear-to-r from-emerald-500 to-teal-400" />
            </div>
          </div>
        </div>

        {/* Card 2: Business Runway Card (layered slight offset) */}
        <div className="w-full max-w-md -translate-y-2 transform rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Studio Operating Runway
                </p>
                <p className="text-[11px] text-zinc-400">
                  Apex Media Workspace
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
              <TrendingUp className="h-3 w-3" />
              Healthy Runway
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800/80 pt-3">
            <div>
              <p className="text-[11px] text-zinc-400">Cash Reserves</p>
              <p className="text-lg font-bold text-white">$84,200.00</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-400">Projected Runway</p>
              <p className="text-lg font-bold text-indigo-300">14.2 Months</p>
            </div>
          </div>
        </div>

        {/* Subtle Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
            <Wallet className="h-3.5 w-3.5 text-zinc-400" />
            <span>Multi-Account Pockets</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
            <span>Smart Receipt Scanning</span>
          </div>
        </div>
      </div>

      {/* Bottom: Social Proof & Quote */}
      <div className="relative z-10 border-t border-zinc-900 pt-6">
        <p className="text-xs leading-relaxed text-zinc-400 italic">
          &ldquo;Twigg brings clarity to personal goals with pockets, while
          providing exact runway predictability for my business.&rdquo;
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-200">
              DD
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                Devanshu Sagar
              </p>
              <p className="text-[10px] text-zinc-500">Founder & Designer</p>
            </div>
          </div>
          <div className="flex text-xs text-amber-400">★★★★★</div>
        </div>
      </div>
    </div>
  );
}
