import Link from "next/link";
import Logo from "./components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Enterprise Sales Intelligence
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 sm:py-32">
        <div className="max-w-4xl w-full space-y-10">
          {/* Subtitle - Removed AI branding per user preference */}

          {/* Main Headline */}
          <div className="space-y-8 text-center">
            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
              <span className="block text-white mb-3">Transform Prospect</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
                Data Into Intelligence
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
              Upload your prospect list and instantly receive personalized outreach strategies, tailored pitch recommendations, and conversation starters optimized for your sales pipeline.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center pt-8">
            <Link
              href="/upload"
              className="group relative inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl blur-xl opacity-80 group-hover:opacity-100 transition-all duration-300 scale-105" />
              <button className="relative inline-block bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-95 text-white font-black px-10 py-5 rounded-xl transition-all text-lg min-h-16 flex items-center justify-center whitespace-nowrap shadow-2xl shadow-blue-600/50">
                START ANALYZING
              </button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-6 pt-16 border-t border-slate-800">
            <div className="text-center bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-3">15</div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Max Prospects</p>
            </div>
            <div className="text-center bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-3">5</div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Per Batch</p>
            </div>
            <div className="text-center bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 hover:border-blue-500/50 transition-all">
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-3">3</div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Pitches Per Prospect</p>
            </div>
          </div>
        </div>
      </main>

      {/* Platform Capabilities Section */}
      <section className="px-6 lg:px-8 py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">
              Comprehensive Analysis Engine
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-base">
              Every prospect receives deep strategic analysis with actionable insights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "📊",
                title: "Smart Classification",
                desc: "Automatically categorize prospects by industry, decision-making authority, and strategic alignment with your services",
              },
              {
                icon: "🎯",
                title: "Targeted Recommendations",
                desc: "Receive three customized service suggestions based on each prospect's company profile, role, and business context",
              },
              {
                icon: "💬",
                title: "Personalized Outreach",
                desc: "Pre-crafted conversation starters tailored to each individual prospect for maximum engagement and relevance",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur" />
                <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur border border-slate-700/60 hover:border-blue-500/60 p-8 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 lg:px-8 py-24 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">
              Enterprise Workflow
            </h2>
            <p className="text-slate-300 text-base">
              Streamlined process designed for maximum efficiency and accuracy
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: 1,
                title: "Upload & Validate",
                desc: "Import prospect data via Excel or CSV with intelligent column mapping and automatic validation",
                icon: "📁",
              },
              {
                step: 2,
                title: "Intelligent Processing",
                desc: "Prospects analyzed in optimal batches with real-time progress tracking and live result streaming",
                icon: "⚡",
              },
              {
                step: 3,
                title: "Export Intelligence",
                desc: "Download comprehensive insights as formatted text or structured JSON for seamless CRM integration",
                icon: "📤",
              },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex gap-6 items-start relative"
              >
                {/* Connecting line */}
                {idx < 2 && (
                  <div className="absolute left-[30px] top-20 w-0.5 h-12 bg-gradient-to-b from-blue-600 to-transparent" />
                )}

                <div className="flex-shrink-0 pt-1">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center font-black text-3xl shadow-2xl shadow-blue-600/50 border-2 border-blue-400/30">
                    {item.step}
                  </div>
                </div>

                <div className="flex-1 pt-3">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{item.icon}</span>
                    <h3 className="text-2xl font-bold text-white">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-slate-300 text-base leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 lg:px-8 py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">
              Advanced Capabilities
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-base">
              Enterprise-grade features for professional sales teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { label: "Progressive Streaming", detail: "Results display as batches complete, zero wait time perception" },
              { label: "Batch Optimization", detail: "5 prospects per batch for maximum accuracy and cost efficiency" },
              { label: "API Key Rotation", detail: "Intelligent rotation system for seamless API rate management" },
              { label: "Intelligent Filtering", detail: "Automatic validation removes incomplete records before processing" },
              { label: "CRM Integration Ready", detail: "Export JSON format compatible with all major CRM platforms" },
              { label: "Production Scalable", detail: "Architecture ready for enterprise deployment and expansion" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="border border-slate-700 bg-slate-800/30 backdrop-blur p-6 rounded-lg hover:border-blue-500/50 transition-all"
              >
                <h3 className="font-bold text-white text-sm mb-2">
                  {item.label}
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 lg:px-8 py-24 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Ready to Gain <span className="text-blue-400">Sales Intelligence?</span>
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Transform your prospect engagement with actionable insights. Start analyzing your pipeline in under a minute.
            </p>
          </div>

          <Link
            href="/upload"
            className="group relative inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity" />
            <button className="relative inline-block bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-8 py-4 rounded-lg transition-all text-base min-h-14 flex items-center justify-center whitespace-nowrap">
              LAUNCH ANALYZER
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6 lg:px-8 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-slate-800">
            <div>
              <p className="font-bold text-white text-sm mb-2">Company</p>
              <p className="text-slate-400 text-xs">Cehpoint</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-2">Services</p>
              <p className="text-slate-400 text-xs leading-relaxed">Custom Software Development<br />Security & Compliance</p>
            </div>
            <div>
              <p className="font-bold text-white text-sm mb-2">Platform</p>
              <p className="text-slate-400 text-xs">Client Insights Engine</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs">
              © 2025 Cehpoint. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
