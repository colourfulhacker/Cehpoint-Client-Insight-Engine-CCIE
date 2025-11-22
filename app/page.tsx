"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "./components/Logo";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="text-xs font-semibold text-slate-500 tracking-widest uppercase">
            Enterprise Sales Intelligence
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 sm:py-32 lg:py-40">
        <div className="max-w-5xl w-full">
          <motion.div 
            className="space-y-8 text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Main Headline */}
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-950"
              variants={fadeInDown}
            >
              Transform Your Prospect Data
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium"
              variants={fadeInUp}
            >
              Upload your list and instantly receive personalized pitch strategies and conversation starters
            </motion.p>

            {/* CTA Button */}
            <motion.div 
              className="flex justify-center pt-6"
              variants={fadeInUp}
            >
              <Link href="/upload">
                <motion.button 
                  className="px-8 py-4 bg-gradient-to-r from-slate-950 to-slate-800 text-white font-semibold rounded-full transition-all hover:shadow-lg hover:shadow-slate-950/20 active:scale-95"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Analyzing
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* KPI Strip - Horizontal Card */}
          <motion.div 
            className="mt-20 pt-16 border-t border-slate-200"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="grid grid-cols-3 gap-6">
              {[
                { metric: "15", label: "Max Prospects" },
                { metric: "5", label: "Per Batch" },
                { metric: "3", label: "Pitches Each" }
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  className="p-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-4xl font-bold text-slate-950 mb-2">{item.metric}</div>
                  <p className="text-sm font-medium text-slate-600">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Capabilities Section */}
      <section className="px-6 lg:px-8 py-20 lg:py-28 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            variants={fadeInDown}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-950 mb-4">
              Comprehensive Analysis
            </h2>
            <p className="text-lg text-slate-600">
              Every prospect receives deep strategic analysis with actionable insights
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            {[
              {
                icon: "📊",
                title: "Smart Classification",
                desc: "Automatically categorize prospects by industry and strategic fit"
              },
              {
                icon: "🎯",
                title: "Targeted Recommendations",
                desc: "Three customized service suggestions per prospect based on their profile"
              },
              {
                icon: "💬",
                title: "Personalized Outreach",
                desc: "Pre-crafted conversation starters tailored for maximum engagement"
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                className="p-8 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all"
                variants={fadeInUp}
                whileHover={{ y: -4 }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-slate-950 mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Timeline Section */}
      <section className="px-6 lg:px-8 py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            variants={fadeInDown}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-950 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Streamlined process for maximum efficiency and accuracy
            </p>
          </motion.div>

          <div className="space-y-12">
            {[
              {
                step: 1,
                title: "Upload & Validate",
                desc: "Import prospect data via Excel or CSV with intelligent column mapping"
              },
              {
                step: 2,
                title: "Smart Processing",
                desc: "Prospects analyzed in batches with real-time progress tracking"
              },
              {
                step: 3,
                title: "Export Results",
                desc: "Download insights as text or JSON for CRM integration"
              }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                className="flex gap-8 items-start"
                initial="initial"
                whileInView="animate"
                variants={fadeInUp}
                viewport={{ once: true }}
              >
                {/* Timeline line */}
                {idx < 2 && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-20 bg-gradient-to-b from-slate-950 to-slate-200 mt-24" />
                )}

                {/* Step number */}
                <div className="flex-shrink-0 pt-1 relative z-10">
                  <div className="w-14 h-14 bg-slate-950 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                    {item.step}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-2xl font-semibold text-slate-950 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-lg">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 lg:px-8 py-20 lg:py-28 bg-slate-950 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold mb-6"
            initial="initial"
            whileInView="animate"
            variants={fadeInDown}
            viewport={{ once: true }}
          >
            Ready to Transform Your Sales Process?
          </motion.h2>
          <motion.p 
            className="text-xl text-slate-300 mb-10"
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
          >
            Upload your prospect list and start generating personalized insights in minutes
          </motion.p>
          <motion.div
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
          >
            <Link href="/upload">
              <motion.button 
                className="px-8 py-4 bg-white text-slate-950 font-semibold rounded-full transition-all active:scale-95"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Begin Analysis
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-8 py-12 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-slate-950 mb-4">Company</h4>
              <p className="text-sm text-slate-600">Leading B2B sales intelligence platform</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 mb-4">Product</h4>
              <p className="text-sm text-slate-600">AI-powered prospect analysis and insights</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 mb-4">Legal</h4>
              <p className="text-sm text-slate-600">Privacy • Terms • Security</p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-600">
            <p>&copy; 2025 Cehpoint. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}