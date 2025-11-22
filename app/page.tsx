import Link from "next/link";
import Logo from "./components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
          <Logo />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-32 sm:py-48">
        <div className="max-w-3xl w-full text-center space-y-12">
          <div className="space-y-8">
            <h1 className="text-slate-900 dark:text-white">
              Identify & Engage Your Ideal Prospects
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Upload your prospect list and receive personalized outreach strategies with tailored pitch recommendations and conversation starters—immediately actionable.
            </p>
          </div>

          <div>
            <Link
              href="/upload"
              className="inline-flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold px-10 py-3.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 active:bg-slate-700 dark:active:bg-slate-200 transition-colors shadow-sm hover:shadow-md focus-visible:outline-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white focus-visible:outline-offset-2 min-h-12"
            >
              Start Analyzing
            </Link>
          </div>
        </div>
      </main>

      {/* Capabilities Section */}
      <section className="px-6 lg:px-8 py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-slate-900 dark:text-white">
              Platform Capabilities
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Generate comprehensive, actionable insights for each prospect in your pipeline
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Smart Classification",
                desc: "Automatically categorize prospects by industry vertical, decision-making authority, and strategic business needs",
              },
              {
                number: "02",
                title: "Service Recommendations",
                desc: "Receive three customized service suggestions for each prospect based on their company profile and role",
              },
              {
                number: "03",
                title: "Outreach Templates",
                desc: "Access pre-crafted, personalized conversation starters tailored to each individual prospect's context",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all"
              >
                <div className="text-4xl font-bold text-slate-300 dark:text-slate-600 mb-6">
                  {item.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 lg:px-8 py-24 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-slate-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Three simple steps to analyze and enhance your prospect engagement
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                step: 1,
                title: "Upload Your Data",
                desc: "Import an Excel (.xlsx, .xls) or CSV file containing prospect information with name, role, and company details",
              },
              {
                step: 2,
                title: "AI Analysis",
                desc: "Our system processes each prospect and generates personalized insights within 30-60 seconds",
              },
              {
                step: 3,
                title: "Export & Deploy",
                desc: "Download comprehensive reports as formatted text or structured JSON data for CRM integration",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-8 items-start pb-8 border-b border-slate-200 dark:border-slate-800 last:border-b-0 last:pb-0">
                <div className="flex-shrink-0 pt-1">
                  <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg flex items-center justify-center font-bold text-base">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 lg:px-8 py-24 bg-slate-900 dark:bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-white text-3xl sm:text-4xl font-bold">
              Ready to Transform Your Sales Process?
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Begin analyzing your prospect list today and unlock data-driven outreach strategies
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center bg-white text-slate-900 font-semibold px-10 py-3.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors shadow-lg hover:shadow-xl focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 min-h-12"
          >
            Start Analyzing
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6 lg:px-8 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto text-center space-y-3">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Cehpoint Client Insights Engine
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs">
            Custom Software Development • Security & Compliance Services
          </p>
        </div>
      </footer>
    </div>
  );
}
