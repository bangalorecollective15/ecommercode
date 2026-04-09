"use client";

import React from "react";
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  const sections = [
    { id: "intro", title: "Introduction", icon: <FileText size={18} /> },
    { id: "collection", title: "Information We Collect", icon: <Eye size={18} /> },
    { id: "usage", title: "How We Use Data", icon: <Lock size={18} /> },
    { id: "rights", title: "Your Rights", icon: <ShieldCheck size={18} /> },
  ];

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24">
      {/* --- HEADER --- */}
      <header className="bg-gradient-to-r from-[#c4a174] to-[#8a6d3b] pt-32 pb-20 px-6 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Return to Maison</span>
          </Link>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
            Privacy Policy<span className="text-black/20">.</span>
          </h1>
          <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.4em]">
            Last Updated: April 2026 • Bangalore Collective
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 -mt-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* --- SIDEBAR NAVIGATION --- */}
          <aside className="lg:w-1/4">
            <div className="sticky top-32 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Contents</p>
              <nav className="space-y-4">
                {sections.map((section) => (
                  <a 
                    key={section.id}
                    href={`#${section.id}`} 
                    className="flex items-center gap-3 text-slate-500 hover:text-[#c4a174] transition-all group"
                  >
                    <span className="p-2 rounded-xl bg-slate-50 group-hover:bg-[#c4a174]/10 transition-all">
                      {section.icon}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-tight">{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* --- CONTENT AREA --- */}
          <div className="lg:w-3/4 bg-white border border-slate-200 rounded-[3rem] p-8 md:p-16 shadow-sm prose prose-slate max-w-none">
            
            <section id="intro" className="mb-16">
              <p className="text-lg leading-relaxed text-slate-600 font-medium">
                Bangalore Collective operates this store and website, including all related information, content, features, tools, products and services, in order to provide you, the customer, with a curated shopping experience (the “Services”). 
              </p>
              <p className="text-slate-600">
                This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use, or make a purchase or other transaction using the Services or otherwise communicate with us.
              </p>
            </section>

            <section id="collection" className="mb-16">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#2b2652] mb-8 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#c4a174]"></span>
                Personal Information We Collect
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: "Contact Details", desc: "Name, address, billing/shipping address, phone number, and email address." },
                  { title: "Financial Info", desc: "Payment card information, transaction details, and payment confirmation." },
                  { title: "Account Details", desc: "Username, password, security questions, and shopping preferences." },
                  { title: "Device Information", desc: "IP address, browser type, and network connection details." }
                ].map((item, i) => (
                  <div key={i} className="p-6 bg-[#f8fafc] rounded-2xl border border-slate-100">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-[#c4a174] mb-2">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed m-0">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="usage" className="mb-16">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#2b2652] mb-8 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#c4a174]"></span>
                How We Use Your Information
              </h2>
              <ul className="space-y-6 list-none p-0">
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c4a174] shrink-0" />
                  <div>
                    <strong className="text-slate-800 uppercase text-[12px] tracking-widest">Tailoring Services:</strong>
                    <p className="text-slate-500 mt-1">To process payments, fulfill orders, and create a customized shopping experience including product recommendations.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c4a174] shrink-0" />
                  <div>
                    <strong className="text-slate-800 uppercase text-[12px] tracking-widest">Security & Fraud:</strong>
                    <p className="text-slate-500 mt-1">To authenticate accounts and ensure a secure payment experience, protecting against malicious activity.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#c4a174] shrink-0" />
                  <div>
                    <strong className="text-slate-800 uppercase text-[12px] tracking-widest">Communication:</strong>
                    <p className="text-slate-500 mt-1">To provide customer support and maintain our business relationship with you.</p>
                  </div>
                </li>
              </ul>
            </section>

            <section id="rights" className="mb-16">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#2b2652] mb-8 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#c4a174]"></span>
                Your Rights & Choices
              </h2>
              <p className="text-slate-500 mb-6">Depending on where you live, you may have the following rights regarding your personal data:</p>
              <div className="space-y-4">
                {["Right to Access", "Right to Delete", "Right to Correct", "Right of Portability"].map((right) => (
                  <div key={right} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-[#c4a174]/30 transition-colors">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-700">{right}</span>
                    <ShieldCheck size={16} className="text-[#c4a174]" />
                  </div>
                ))}
              </div>
            </section>

            <footer className="pt-12 border-t border-slate-100">
              <p className="text-xs text-slate-400 italic">
                For questions regarding this policy, please reach out to our concierge at <a href="mailto:bangalorecollective15@gmail.com" className="text-[#c4a174] underline">bangalorecollective15@gmail.com</a>.
              </p>
            </footer>

          </div>
        </div>
      </div>
    </main>
  );
}