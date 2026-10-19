'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck, Database, Award, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-background/90 text-text-secondary py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base">CareerGPS</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Data-backed career roadmaps powered by empirical labor market analytics, O*NET taxonomies, and DAG knowledge graphs.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero synthetic statistics • 100% transparent data</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Platform Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link href="/planner" className="hover:text-white transition-colors">Career Planner Wizard</Link></li>
            <li><Link href="/explore" className="hover:text-white transition-colors">Explore Labor Market</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">Student & Professional Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Empirical Sources</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-primary-400" />
              <span>Adzuna Global Job Postings (US, UK, CA, IN)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Award className="w-3 h-3 text-accent" />
              <span>U.S. Department of Labor O*NET 28.0</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>European Commission ESCO v1.2</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Award className="w-3 h-3 text-blue-400" />
              <span>U.S. Bureau of Labor Statistics (BLS OEWS)</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Methodology & Disclaimers</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Salary estimates, skill demand frequencies, and roadmap timelines are calculated for educational planning guidance. They do not constitute guaranteed hiring outcomes or salary offers.
          </p>
          <div className="text-[10px] text-slate-500">
            CareerGPS Architecture • MIT Licensed Core Analytics
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>© 2026 CareerGPS. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="/admin/analytics" className="hover:text-slate-300 transition-colors">Telemetry & Analytics</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
};
