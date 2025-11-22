import Link from "next/link";
import Logo from "./components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-purple-300/50 dark:border-purple-900/50 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg neon-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Logo />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Badge */}
          <div className="inline-block float">
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white px-6 py-3 rounded-full text-sm font-bold ring-2 ring-white/40 shadow-2xl neon-glow">
              ✨ Powered by Google Gemini AI
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 leading-tight tracking-tighter drop-shadow-xl glow-pulse">
              Transform Prospects Into{" "}
              <span className="block mt-2 bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 text-transparent bg-clip-text">
                Conversations
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-200 max-w-3xl mx-auto leading-relaxed font-medium">
              AI-powered client insight extraction for B2B sales teams. Upload your LinkedIn prospect data and get personalized outreach strategies in seconds.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto my-16">
            {[
              {
                icon: "👥",
                title: "Identify Ideal Clients",
                desc: "AI categorizes prospects by role and needs",
                color: "from-cyan-400 to-blue-500",
              },
              {
                icon: "💡",
                title: "Tailored Pitch Suggestions",
                desc: "3 personalized service offerings per prospect",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: "💬",
                title: "Conversation Starters",
                desc: "Ready-to-send personalized opening messages",
                color: "from-pink-500 to-purple-600",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${item.color} rounded-3xl p-1 hover:shadow-2xl transition-all transform hover:scale-110 hover:-rotate-1 group`}
              >
                <div className="bg-white/95 dark:bg-gray-900/95 rounded-3xl p-8 h-full backdrop-blur group-hover:bg-white/98 dark:group-hover:bg-gray-900/98 transition-all">
                  <div className="text-6xl mb-6 transform group-hover:scale-125 transition-transform">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-xl">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-10">
            <Link
              href="/upload"
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 hover:from-purple-700 hover:via-pink-600 hover:to-blue-600 text-white font-bold px-12 py-6 rounded-full transition-all shadow-2xl hover:shadow-4xl hover:-translate-y-2 active:translate-y-0 text-lg neon-glow"
            >
              <span>🚀 Get Started</span>
              <svg
                className="w-7 h-7 group-hover:translate-x-3 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>

            <a
              href="#features"
              className="text-gray-900 dark:text-white hover:text-white font-bold px-12 py-6 rounded-full transition-all border-3 border-white/40 hover:border-white/80 text-lg bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur"
            >
              📚 Learn More
            </a>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-gradient-to-b from-purple-50 via-blue-50 to-cyan-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-cyan-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
              Built for B2B Sales Teams
            </h2>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto font-medium">
              Designed specifically for Cehpoint's custom software development and cybersecurity services
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                emoji: "🎯",
                title: "Smart Categorization",
                items: [
                  "Founders & CTOs seeking technical leadership",
                  "IT service companies needing partnership",
                  "Health-tech founders requiring compliance",
                ],
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                emoji: "⚡",
                title: "Instant Results",
                items: [
                  "Upload Excel or CSV files in seconds",
                  "AI analysis in under 60 seconds",
                  "Download insights in TXT or JSON",
                ],
                gradient: "from-purple-500 to-pink-500",
              },
            ].map((section, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${section.gradient} rounded-3xl p-1 hover:shadow-2xl transition-all transform hover:scale-105`}
              >
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 h-full">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-4">
                    <span className="text-5xl">{section.emoji}</span>
                    {section.title}
                  </h3>
                  <ul className="space-y-4">
                    {section.items.map((item, sidx) => (
                      <li
                        key={sidx}
                        className="flex items-start gap-4 text-gray-700 dark:text-gray-300 text-lg"
                      >
                        <span className={`text-2xl font-bold flex-shrink-0 ${idx === 0 ? 'text-blue-500' : 'text-purple-500'}`}>
                          ✓
                        </span>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo className="scale-90 md:scale-100" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              © 2025 Cehpoint. Built with Next.js & Gemini AI. 🚀
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
