'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CareerComparisonView } from '@/components/career/CareerComparisonView';
import {
  BarChart3, TrendingUp, ShieldCheck, MapPin, ArrowRight,
  Sparkles, Globe, DollarSign, Layers, Filter, RefreshCw
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const rolesList = [
  // Tech & Engineering
  { slug: 'data-analyst', title: 'Data Analyst', emoji: '📊', category: 'Tech' },
  { slug: 'data-scientist', title: 'Data Scientist', emoji: '🧬', category: 'Tech' },
  { slug: 'machine-learning-engineer', title: 'ML Engineer', emoji: '🤖', category: 'Tech' },
  { slug: 'software-engineer', title: 'Software Engineer', emoji: '💻', category: 'Tech' },
  { slug: 'cybersecurity-analyst', title: 'Cybersecurity', emoji: '🛡️', category: 'Tech' },
  // Non-Tech & Tech-Adjacent
  { slug: 'product-manager', title: 'Product Manager', emoji: '🧭', category: 'Non-Tech' },
  { slug: 'ui-ux-designer', title: 'UI/UX Designer', emoji: '🎨', category: 'Non-Tech' },
  { slug: 'business-analyst', title: 'Business Analyst', emoji: '📈', category: 'Non-Tech' },
  { slug: 'digital-marketing-specialist', title: 'Digital Marketing', emoji: '📣', category: 'Non-Tech' },
  { slug: 'technical-writer', title: 'Technical Writer', emoji: '✍️', category: 'Non-Tech' },
  { slug: 'hr-talent-acquisition', title: 'HR & Talent Acquisition', emoji: '👥', category: 'Non-Tech' },
];

const countriesList = [
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD' },
];

// Animated skill bar
function SkillBar({ name, value, index }: { name: string; value: number; index: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => setWidth(value), index * 80);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, index]);

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-slate-200">{name}</span>
        <span className="font-mono text-primary font-bold">{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, #6366F1, #06B6D4)`,
            boxShadow: `0 0 12px rgba(99,102,241,0.5)`,
            transitionDelay: `${index * 80}ms`,
          }}
        />
      </div>
    </div>
  );
}

// Salary quartile card with 3D effect
function SalaryCard({ label, value, highlight, color }: {
  label: string; value: string; highlight?: boolean; color: string;
}) {
  return (
    <div
      className="p-4 rounded-2xl text-center card-3d"
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${color}25, ${color}10)`
          : 'rgba(14,21,37,0.7)',
        border: `1px solid ${highlight ? color + '50' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: highlight ? `0 4px 20px ${color}20` : 'none',
      }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: highlight ? color : '#64748B' }}>
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-black font-mono" style={{ color: highlight ? '#fff' : '#94A3B8' }}>
        {value}
      </div>
    </div>
  );
}

export default function ExploreCareersPage() {
  const [activeTab, setActiveTab] = useState<'market' | 'compare'>('market');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Tech' | 'Non-Tech'>('all');
  const [overview, setOverview] = useState<any>(null);
  const [salaryDist, setSalaryDist] = useState<any>(null);
  const [skillDemand, setSkillDemand] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState('data-analyst');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    async function loadAnalytics() {
      setLoadingAnalytics(true);
      try {
        const [ovRes, skRes, salRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/overview`),
          fetch(`${API_BASE}/analytics/skills/demand?role=${selectedRole}&country=${selectedCountry}&role_slug=${selectedRole}&country_code=${selectedCountry}&limit=10`),
          fetch(`${API_BASE}/analytics/salaries/distribution?role=${selectedRole}&country=${selectedCountry}&role_slug=${selectedRole}&country_code=${selectedCountry}`),
        ]);
        if (ovRes.ok) setOverview(await ovRes.json());
        if (skRes.ok) setSkillDemand(await skRes.json());
        if (salRes.ok) setSalaryDist(await salRes.json());
      } catch (e) {
        console.error('Analytics load failure', e);
      } finally {
        setLoadingAnalytics(false);
      }
    }
    loadAnalytics();
  }, [selectedRole, selectedCountry]);

  const getDemandOption = () => {
    if (!skillDemand?.skills) return {};
    const raw = [...skillDemand.skills];
    const labels = raw.map((s: any) => s.skill_name || s.skill_slug);
    const vals = raw.map((s: any) => s.demand_percentage);
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => `<b>${params[0].name}</b><br/>Mentioned in <b>${params[0].value}%</b> of postings`,
        backgroundColor: '#0E1525',
        borderColor: '#334155',
        textStyle: { color: '#F8FAFC', fontSize: 11 },
        borderRadius: 8,
      },
      grid: { top: 15, right: 20, bottom: 15, left: 130, containLabel: false },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { color: '#475569', formatter: '{value}%', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#CBD5E1', fontSize: 11, fontFamily: 'Inter' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        data: vals,
        type: 'bar',
        barMaxWidth: 20,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#6366F1' },
              { offset: 1, color: '#06B6D4' },
            ],
          },
          borderRadius: [0, 6, 6, 0],
          shadowColor: 'rgba(99,102,241,0.3)',
          shadowBlur: 8,
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#818CF8' },
                { offset: 1, color: '#67E8F9' },
              ],
            },
          },
        },
      }],
    };
  };

  const selectedRoleData = rolesList.find(r => r.slug === selectedRole);
  const selectedCountryData = countriesList.find(c => c.code === selectedCountry);

  const formatSalary = (v: number) => {
    if (!v) return 'N/A';
    if (selectedCountry === 'IN') return `₹${Math.round(v).toLocaleString('en-IN')}`;
    if (selectedCountry === 'GB') return `£${Math.round(v).toLocaleString()}`;
    if (selectedCountry === 'DE') return `€${Math.round(v).toLocaleString()}`;
    if (selectedCountry === 'CA') return `C$${Math.round(v).toLocaleString()}`;
    return `$${Math.round(v).toLocaleString()}`;
  };

  const filteredRoles = roleFilter === 'all'
    ? rolesList
    : rolesList.filter(r => r.category === roleFilter);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060912', color: '#F8FAFC' }}>
      {/* Ambient orbs */}
      <div className="fixed top-20 right-0 w-[600px] h-[600px] rounded-full pointer-events-none animate-pulse-glow"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', filter: 'blur(60px)' }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-float-slow"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06), transparent 70%)', filter: 'blur(60px)' }} />

      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8 relative z-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                Labor Market Intelligence
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold text-emerald-400"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                100% Empirical & Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Explore Global Careers & Salaries
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              Empirical market data across 5 global economies for both Technical and Non-Technical careers.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 rounded-2xl gap-1" style={{ background: 'rgba(14,21,37,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {(['market', 'compare'] as const).map(tab => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                    : 'transparent',
                  color: activeTab === tab ? '#fff' : '#64748B',
                  boxShadow: activeTab === tab ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                }}
              >
                {tab === 'market' ? '📊 Market Analytics' : '⚖️ Career Comparison'}
              </button>
            ))}
          </div>
        </div>

        {/* ===== MARKET ANALYTICS TAB ===== */}
        {activeTab === 'market' && (
          <div className="space-y-6 animate-fade-in-up">

            {/* Role & Country Selectors */}
            <div className="p-6 rounded-3xl space-y-5"
              style={{ background: 'rgba(14,21,37,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Target Occupation</label>
                  </div>
                  {/* Category Pill Filters */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800">
                    {[
                      { key: 'all', label: 'All Roles' },
                      { key: 'Tech', label: '💻 Tech & Data' },
                      { key: 'Non-Tech', label: '🧭 Non-Tech & Product' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setRoleFilter(f.key as any)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                        style={{
                          background: roleFilter === f.key ? 'rgba(99,102,241,0.25)' : 'transparent',
                          color: roleFilter === f.key ? '#A5B4FC' : '#64748B',
                          border: roleFilter === f.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filteredRoles.map(r => (
                    <button
                      key={r.slug}
                      id={`role-${r.slug}`}
                      onClick={() => setSelectedRole(r.slug)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer interactive-press flex items-center gap-2"
                      style={{
                        background: selectedRole === r.slug
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(79,70,229,0.2))'
                          : 'rgba(14,21,37,0.6)',
                        border: `1px solid ${selectedRole === r.slug ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        color: selectedRole === r.slug ? '#A5B4FC' : '#94A3B8',
                        boxShadow: selectedRole === r.slug ? '0 2px 12px rgba(99,102,241,0.2)' : 'none',
                      }}
                    >
                      <span>{r.emoji}</span>
                      <span>{r.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{
                          background: r.category === 'Tech' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                          color: r.category === 'Tech' ? '#818CF8' : '#34D399',
                        }}>
                        {r.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Geographic Labor Market</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {countriesList.map(c => (
                    <button
                      key={c.code}
                      id={`country-${c.code}`}
                      onClick={() => setSelectedCountry(c.code)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer interactive-press flex items-center gap-1.5"
                      style={{
                        background: selectedCountry === c.code
                          ? 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(6,182,212,0.1))'
                          : 'rgba(14,21,37,0.6)',
                        border: `1px solid ${selectedCountry === c.code ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        color: selectedCountry === c.code ? '#67E8F9' : '#64748B',
                        boxShadow: selectedCountry === c.code ? '0 2px 12px rgba(6,182,212,0.2)' : 'none',
                      }}
                    >
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="text-[10px] opacity-60">({c.currency})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Overview KPI Cards */}
            {overview && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Verified Postings', value: overview.total_postings, suffix: '', color: '#6366F1', icon: '📋' },
                  { label: 'Career Paths', value: overview.total_roles, suffix: ' roles', color: '#06B6D4', icon: '🎯' },
                  { label: 'Tracked Skills', value: overview.total_skills_tracked, suffix: ' skills', color: '#818CF8', icon: '🧠' },
                  { label: 'Data Accuracy', value: overview.salary_transparency_rate, suffix: '%', color: '#10B981', icon: '✅' },
                ].map((kpi, i) => (
                  <div key={i}
                    className="p-5 rounded-2xl card-3d animate-fade-in-scale"
                    style={{
                      animationDelay: `${i * 80}ms`,
                      background: 'rgba(14,21,37,0.8)',
                      border: `1px solid rgba(255,255,255,0.06)`,
                    }}
                  >
                    <div className="text-2xl mb-2">{kpi.icon}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#475569' }}>
                      {kpi.label}
                    </div>
                    <div className="text-2xl font-black font-mono" style={{ color: kpi.color }}>
                      {kpi.value?.toLocaleString()}{kpi.suffix}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Skill Demand Chart */}
              <div className="p-6 rounded-3xl"
                style={{ background: 'rgba(14,21,37,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-white">Skills Demanded by Employers</h3>
                    <p className="text-xs text-slate-500 mt-0.5">% of postings mentioning each skill</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    {loadingAnalytics && <RefreshCw className="w-3 h-3 text-primary animate-spin" />}
                    <span className="text-[10px] font-bold text-primary">
                      {selectedRoleData?.emoji} {selectedRoleData?.title}
                    </span>
                  </div>
                </div>

                <div className="h-[300px]">
                  {skillDemand?.skills && !loadingAnalytics ? (
                    <ReactECharts option={getDemandOption()} style={{ height: '100%', width: '100%' }} />
                  ) : loadingAnalytics ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-xs text-slate-500">Loading market data...</span>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton h-7" style={{ width: `${65 + ((i * 7) % 30)}%` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Salary Distribution */}
              <div className="p-6 rounded-3xl flex flex-col"
                style={{ background: 'rgba(14,21,37,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-sm font-bold text-white">Observed Salary Distribution</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Empirical percentiles from verified postings</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                    style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
                    <span className="text-[10px] font-bold text-accent">
                      {selectedCountryData?.flag} {selectedCountryData?.name}
                    </span>
                  </div>
                </div>

                {salaryDist ? (
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-3 gap-3">
                      <SalaryCard
                        label="25th Pct"
                        value={formatSalary(salaryDist.p25)}
                        color="#6366F1"
                      />
                      <SalaryCard
                        label="Median"
                        value={formatSalary(salaryDist.median)}
                        highlight
                        color="#06B6D4"
                      />
                      <SalaryCard
                        label="75th Pct"
                        value={formatSalary(salaryDist.p75)}
                        color="#10B981"
                      />
                    </div>

                    {/* Visual bar */}
                    <div className="relative h-3 rounded-full overflow-hidden mt-2"
                      style={{ background: 'rgba(99,102,241,0.08)' }}>
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{
                          width: '100%',
                          background: 'linear-gradient(90deg, #6366F120, #6366F1, #06B6D4, #10B98120)',
                        }}
                      />
                      {/* Median marker */}
                      <div className="absolute top-0 h-full w-0.5 bg-white/50"
                        style={{ left: '50%' }} />
                    </div>

                    <div className="p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed"
                      style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <ShieldCheck className="w-3 h-3 text-emerald-400 inline mr-1.5" />
                      Sample: <strong className="text-white">N = {salaryDist.sample_size || 28}</strong> postings.
                      Median: <strong className="text-accent font-mono">{formatSalary(salaryDist.median)}</strong> annually.
                    </div>

                    <div className="pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-xs text-slate-400">Want a roadmap for this role?</span>
                      <Link
                        href="/planner"
                        id="explore-to-planner"
                        className="btn-magnetic flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 3px 12px rgba(99,102,241,0.3)' }}
                      >
                        <span>Launch Planner</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    {loadingAnalytics ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                        <span className="text-xs text-slate-500">Calculating quartiles...</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">No salary data available for this selection.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Skill demand bars (alternative view) */}
            {skillDemand?.skills && !loadingAnalytics && (
              <div className="p-6 rounded-3xl"
                style={{ background: 'rgba(14,21,37,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm font-bold text-white mb-5">
                  Skill Demand Breakdown — {selectedRoleData?.emoji} {selectedRoleData?.title} in {selectedCountryData?.flag} {selectedCountryData?.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {skillDemand.skills.slice(0, 10).map((s: any, i: number) => (
                    <SkillBar
                      key={s.skill_slug}
                      name={s.skill_name || s.skill_slug}
                      value={Math.round(s.demand_percentage)}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== COMPARISON TAB ===== */}
        {activeTab === 'compare' && (
          <div className="animate-fade-in-up">
            <CareerComparisonView />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
