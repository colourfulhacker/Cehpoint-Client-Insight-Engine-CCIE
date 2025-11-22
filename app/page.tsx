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

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6 }
};

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <div className="text-xs font-semibold text-slate-600 tracking-widest uppercase">
            Enterprise Sales Intelligence
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Split Layout */}
      <section className="px-6 lg:px-8 py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: Text & CTA */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.h1
                className="text-6xl lg:text-7xl font-bold leading-tight text-slate-950"
                style={{
                  fontSize: "3.5rem",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em"
                }}
                variants={fadeInDown}
              >
                Transform Your Prospect Data Into Sales Intelligence
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 leading-relaxed max-w-xl"
                style={{
                  fontSize: "1.25rem",
                  lineHeight: 1.6,
                  maxWidth: "600px"
                }}
                variants={fadeInUp}
              >
                Upload your prospect list and instantly receive personalized pitch strategies, conversation starters, and strategic insights powered by advanced analysis.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-wrap gap-4 pt-4"
                variants={fadeInUp}
              >
                <Link href="/upload">
                  <button
                    className="px-8 py-4 bg-slate-950 text-white font-semibold rounded-lg hover:bg-slate-900 active:scale-95 transition-all shadow-sm hover:shadow-md"
                    style={{ backgroundColor: "#0C1A3D" }}
                  >
                    Start Analyzing
                  </button>
                </Link>
                <button
                  className="px-8 py-4 border-2 border-slate-300 text-slate-950 font-semibold rounded-lg hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Learn More
                </button>
              </motion.div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={fadeInRight}
              className="relative hidden lg:block"
            >
              <div
                className="relative w-full aspect-square rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0C1A3D 0%, #2D65FF 50%, #7BA7FF 100%)",
                  boxShadow: "0 8px 32px rgba(12, 26, 61, 0.15)"
                }}
              >
                {/* Abstract geometric pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="400" height="400" fill="url(#grid)" />
                    <circle cx="80" cy="80" r="60" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
                    <circle cx="320" cy="320" r="80" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
                  </svg>
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-6xl font-bold mb-4">📊</div>
                    <p className="text-xl font-semibold">Advanced Analytics</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* KPI METRIC STRIP */}
      <section className="px-6 lg:px-8 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            variants={staggerContainer}
            viewport={{ once: true }}
          >
            {[
              { icon: "📊", metric: "15", label: "Max Prospects" },
              { icon: "⚡", metric: "5", label: "Per Batch" },
              { icon: "🎯", metric: "3", label: "Pitches Each" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md transition-all"
                style={{
                  borderRadius: "20px",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                  borderColor: "rgba(0, 0, 0, 0.08)"
                }}
                variants={fadeInUp}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: "rgba(45, 101, 255, 0.1)" }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div
                      className="font-bold text-slate-950"
                      style={{ fontSize: "2rem" }}
                    >
                      {item.metric}
                    </div>
                    <p
                      className="text-slate-600"
                      style={{ fontSize: "0.875rem", fontWeight: 500 }}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section className="px-6 lg:px-8 py-20 lg:py-28 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            variants={fadeInDown}
            viewport={{ once: true }}
          >
            <h2
              className="font-bold text-slate-950 mb-4 text-slate-950"
              style={{
                fontSize: "2.25rem",
                fontWeight: 600,
                lineHeight: 1.2
              }}
            >
              Comprehensive Analysis Engine
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
                desc: "Automatically categorize prospects by industry, company size, and strategic fit"
              },
              {
                icon: "🎯",
                title: "Targeted Recommendations",
                desc: "Three customized pitch suggestions per prospect based on their profile and role"
              },
              {
                icon: "💬",
                title: "Personalized Outreach",
                desc: "Pre-crafted conversation starters tailored for maximum engagement"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-white border rounded-2xl p-8 hover:shadow-md transition-all"
                style={{
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                  borderRadius: "20px"
                }}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto"
                  style={{
                    backgroundColor: "rgba(45, 101, 255, 0.1)",
                    borderRadius: "50%"
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  className="text-slate-950 mb-3 text-center font-semibold"
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 600
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-slate-600 text-center leading-relaxed"
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: 1.6
                  }}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS - HORIZONTAL TIMELINE */}
      <section className="px-6 lg:px-8 py-20 lg:py-28 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial="initial"
            whileInView="animate"
            variants={fadeInDown}
            viewport={{ once: true }}
          >
            <h2
              className="font-bold text-slate-950 mb-4"
              style={{
                fontSize: "2.25rem",
                fontWeight: 600,
                lineHeight: 1.2
              }}
            >
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              Streamlined process for maximum efficiency and accuracy
            </p>
          </motion.div>

          <motion.div
            className="flex items-start justify-between relative"
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
          >
            {/* Connecting line */}
            <div
              className="absolute top-7 left-16 right-16 h-0.5 bg-gradient-to-r from-slate-300 via-slate-300 to-slate-300"
              style={{
                left: "calc(12.5% + 28px)",
                right: "calc(12.5% + 28px)",
                top: "28px"
              }}
            />

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
              <div key={idx} className="flex-1 flex flex-col items-center gap-6 relative z-10">
                {/* Circle badge */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                  style={{
                    backgroundColor: "#0C1A3D",
                    width: "56px",
                    height: "56px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)"
                  }}
                >
                  {item.step}
                </div>

                {/* Title & Description */}
                <div className="text-center">
                  <h3
                    className="text-slate-950 mb-2 font-semibold"
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-slate-600 leading-snug"
                    style={{
                      fontSize: "0.9375rem",
                      maxWidth: "120px"
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* DARK CTA SECTION */}
      <section
        className="px-6 lg:px-8 py-24 lg:py-32 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0B0F2A 0%, #0C1A3D 100%)"
        }}
      >
        {/* Subtle mesh texture */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="noise" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="white"/>
                <circle cx="2" cy="2" r="1" fill="black" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#noise)"/>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2
            className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            initial="initial"
            whileInView="animate"
            variants={fadeInDown}
            viewport={{ once: true }}
            style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              lineHeight: 1.2
            }}
          >
            Ready to Transform Your Sales Process?
          </motion.h2>

          <motion.p
            className="text-xl text-white/80 mb-10 leading-relaxed"
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.6,
              opacity: 0.9
            }}
          >
            Upload your prospect list and start generating personalized insights in minutes. Process unlimited prospects with continuous pagination and mid-analysis export capabilities.
          </motion.p>

          <motion.div
            initial="initial"
            whileInView="animate"
            variants={fadeInUp}
            viewport={{ once: true }}
          >
            <Link href="/upload">
              <button
                className="px-8 py-4 bg-white text-slate-950 font-semibold rounded-lg hover:shadow-lg active:scale-95 transition-all"
              >
                Begin Analysis
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOOTER - 3 COLUMN PROFESSIONAL LAYOUT */}
      <footer className="px-6 lg:px-8 py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-16 mb-12">
            <div>
              <h4
                className="font-semibold text-slate-950 mb-3"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                Company
              </h4>
              <p
                className="text-slate-600"
                style={{
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  opacity: 0.7
                }}
              >
                Leading B2B sales intelligence platform powered by advanced analytics and strategic insights.
              </p>
            </div>
            <div>
              <h4
                className="font-semibold text-slate-950 mb-3"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                Product
              </h4>
              <p
                className="text-slate-600"
                style={{
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  opacity: 0.7
                }}
              >
                AI-powered prospect analysis, personalized pitch recommendations, and conversation starters.
              </p>
            </div>
            <div>
              <h4
                className="font-semibold text-slate-950 mb-3"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}
              >
                Legal
              </h4>
              <p
                className="text-slate-600"
                style={{
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  opacity: 0.7
                }}
              >
                Privacy Policy • Terms of Service • Security & Compliance
              </p>
            </div>
          </div>

          <div
            className="border-t border-slate-200 pt-8"
            style={{
              borderColor: "rgba(0, 0, 0, 0.08)"
            }}
          >
            <p
              className="text-center text-slate-600"
              style={{
                fontSize: "0.875rem",
                opacity: 0.7
              }}
            >
              &copy; 2025 Cehpoint. All rights reserved. • Global Offices
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
