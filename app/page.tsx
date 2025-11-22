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
          <div className="text-xs font-semibold text-slate-600 tracking-widest uppercase">
            Enterprise Sales Intelligence
          </div>
        </div>
      </nav>

      {/* Hero Section - Complete Redesign */}
      <section className="px-6 lg:px-8 py-32 lg:py-40" style={{ paddingTop: "140px", paddingBottom: "120px" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="text-center space-y-8"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Headline */}
            <motion.h1 
              className="text-5xl lg:text-7xl font-bold leading-tight text-slate-950"
              style={{ fontSize: "3.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}
              variants={fadeInDown}
            >
              Transform Your Prospect Data
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
              style={{ fontSize: "1.0625rem", maxWidth: "55%" }}
              variants={fadeInUp}
            >
              Upload your prospect list and instantly receive personalized pitch strategies and conversation starters
            </motion.p>

            {/* Dual CTA Buttons */}
            <motion.div 
              className="flex justify-center gap-4 pt-4"
              variants={fadeInUp}
            >
              <Link href="/upload">
                <button 
                  className="px-8 py-3 bg-slate-950 text-white font-semibold rounded-lg transition-all hover:shadow-md active:scale-95"
                  style={{ backgroundColor: "#0C1A3D" }}
                >
                  Start Analyzing
                </button>
              </Link>
              <button 
                className="px-8 py-3 border-2 border-slate-300 text-slate-950 font-semibold rounded-lg hover:bg-slate-50 active:scale-95 transition-all"
              >
                Learn More
              </button>
            </motion.div>
          </motion.div>

          {/* KPI Cards - Metrics Strip */}
          <motion.div 
            className="mt-24 pt-16 border-t border-slate-200"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "📊", metric: "15", label: "Max Prospects" },
                { icon: "⚡", metric: "5", label: "Per Batch" },
                { icon: "🎯", metric: "3", label: "Pitches Each" }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="p-6 bg-white border border-slate-200 rounded-2xl transition-all hover:shadow-sm"
                  style={{
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                    borderRadius: "16px"
                  }}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="text-3xl font-bold text-slate-950 mb-2" style={{ fontSize: "1.875rem" }}>{item.metric}</div>
                  <p className="text-sm font-medium text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section className="px-6 lg:px-8 py-32 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            variants={fadeInDown}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-950 mb-4">
              Comprehensive Analysis Engine
            </h2>
            <p className="text-lg text-slate-600 max-width-2xl mx-auto">
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
                className="p-8 bg-white border border-slate-200 rounded-2xl transition-all hover:shadow-md"
                variants={fadeInUp}
                style={{
                  borderRadius: "16px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)"
                }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl lg:text-2xl font-semibold text-slate-950 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed" style={{ fontSize: "0.9375rem" }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Section - Horizontal Timeline */}
      <section className="px-6 lg:px-8 py-32 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            className="text-center mb-20"
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

          {/* Horizontal Timeline */}
          <motion.div 
            className="flex items-center justify-between gap-8"
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
          >
            {[
              {
                step: 1,
                title: "Upload & Validate",
                desc: "Import prospect data via Excel or CSV"
              },
              {
                step: 2,
                title: "Smart Processing",
                desc: "Prospects analyzed with real-time tracking"
              },
              {
                step: 3,
                title: "Export Results",
                desc: "Download insights for CRM integration"
              }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4 relative">
                {/* Connecting line */}
                {idx < 2 && (
                  <div 
                    className="absolute top-7 left-1/2 w-1/2 h-px bg-slate-300"
                    style={{ left: "50%" }}
                  />
                )}

                {/* Circle with number */}
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg relative z-10"
                  style={{
                    backgroundColor: "#0C1A3D",
                    width: "56px",
                    height: "56px"
                  }}
                >
                  {item.step}
                </div>

                {/* Title & Desc */}
                <div className="text-center">
                  <h3 className="text-lg lg:text-xl font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2" style={{ fontSize: "0.875rem" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Dark CTA Band */}
      <section 
        className="px-6 lg:px-8 py-32 text-white"
        style={{
          backgroundColor: "#0B0F2A",
          paddingTop: "80px",
          paddingBottom: "80px"
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
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
            className="text-lg text-white/80 mb-8 max-w-2xl mx-auto"
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
              <button 
                className="px-8 py-3 bg-white text-slate-950 font-semibold rounded-lg hover:shadow-md active:scale-95 transition-all"
              >
                Begin Analysis
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-8 py-16 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16 mb-12">
            <div>
              <h4 className="font-semibold text-slate-950 mb-3">Company</h4>
              <p className="text-sm text-slate-600" style={{ opacity: 0.7 }}>
                Leading B2B sales intelligence platform powered by advanced analytics
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 mb-3">Product</h4>
              <p className="text-sm text-slate-600" style={{ opacity: 0.7 }}>
                AI-powered prospect analysis, personalized recommendations, and conversation starters
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 mb-3">Legal</h4>
              <p className="text-sm text-slate-600" style={{ opacity: 0.7 }}>
                Privacy Policy • Terms of Service • Security
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 text-center">
            <p className="text-sm text-slate-600" style={{ opacity: 0.7 }}>
              &copy; 2025 Cehpoint. All rights reserved. | Global Offices
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
