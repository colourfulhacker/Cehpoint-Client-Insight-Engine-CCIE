import Link from "next/link";
import Logo from "./components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Logo />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 sm:py-32">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Identify & Engage Your{" "}
              <span className="text-slate-600 dark:text-slate-300">
                Ideal Prospects
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Upload your prospect list and get personalized outreach strategies with tailored pitches and conversation starters—ready to use immediately.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/upload"
              className="inline-block bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold px-10 py-4 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
            >
              Start Analyzing
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-4">
            Powerful Insights
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-300 mb-16 max-w-2xl mx-auto">
            Our system analyzes each prospect and generates actionable recommendations tailored to your services.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Smart Classification",
                desc: "Prospects categorized by industry, role, and business needs",
              },
              {
                number: "2",
                title: "Service Suggestions",
                desc: "Three personalized recommendations per prospect based on their profile",
              },
              {
                number: "3",
                title: "Outreach Ready",
                desc: "Pre-written conversation starters tailored for each prospect",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  {item.number}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">
            How It Works
          </h2>

          <div className="space-y-6">
            {[
              {
                step: "Upload",
                desc: "Import your Excel or CSV file with prospect data (name, role, company required)",
              },
              {
                step: "Analyze",
                desc: "Our system processes each prospect and generates insights (typically 30-60 seconds)",
              },
              {
                step: "Export",
                desc: "Download your results as formatted reports or structured JSON for CRM integration",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg flex items-center justify-center font-bold text-lg">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                    {item.step}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-slate-600 dark:text-slate-400 text-sm">
          <p>Cehpoint Client Insights Engine • Custom Software Development & Security Services</p>
        </div>
      </footer>
    </div>
  );
}
