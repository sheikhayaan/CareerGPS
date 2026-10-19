'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass, MapPin, CheckCircle2, BookOpen, Trash2,
  TrendingUp, ArrowRight, Sparkles, Plus, LogOut,
  BarChart3, Clock, Target, Zap
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api';

const DEMO_FALLBACK_ROADMAPS = [
  {
    id: 'demo-roadmap-1',
    title: 'Full-Stack Data Scientist Masterplan (US)',
    target_role_slug: 'data-scientist',
    target_role_title: 'Data Scientist',
    target_country_code: 'US',
    experience_level: 'Mid-level',
    total_weeks: 12,
    weekly_hours: 15,
    total_tasks: 24,
    completed_tasks: 16,
    completion_percentage: 66.7,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'demo-roadmap-2',
    title: 'Machine Learning Engineer Blueprint (US)',
    target_role_slug: 'machine-learning-engineer',
    target_role_title: 'Machine Learning Engineer',
    target_country_code: 'US',
    experience_level: 'Mid-level',
    total_weeks: 8,
    weekly_hours: 12,
    total_tasks: 16,
    completed_tasks: 8,
    completion_percentage: 50.0,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

// Animated progress ring
function ProgressRing({ percent, size = 64, color = '#6366F1' }: {
  percent: number; size?: number; color?: string;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(99,102,241,0.1)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

// Roadmap card with 3D hover
function RoadmapCard({ roadmap, onDelete }: { roadmap: any; onDelete: (id: string, e: React.MouseEvent) => void }) {
  const progress = roadmap.total_tasks > 0
    ? Math.round((roadmap.completed_tasks / roadmap.total_tasks) * 100)
    : 0;

  const countryFlags: Record<string, string> = { US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', IN: '🇮🇳' };

  return (
    <Link href={`/my-roadmaps/${roadmap.id}`}>
      <div className="p-6 rounded-3xl card-3d group cursor-pointer transition-all duration-300 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(14,21,37,0.95), rgba(22,30,48,0.8))',
          border: '1px solid rgba(99,102,241,0.15)',
        }}
      >
        {/* Hover glow */}
        <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08), transparent 70%)' }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors duration-200 truncate">
                {roadmap.title}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-accent" />
                  {countryFlags[roadmap.target_country_code] || '🌍'} {roadmap.target_country_code}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(roadmap.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <ProgressRing percent={progress} size={56}
                  color={progress === 100 ? '#10B981' : '#6366F1'} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">{progress}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
              <span>Tasks completed</span>
              <span className="font-mono text-slate-300">{roadmap.completed_tasks || 0} / {roadmap.total_tasks || 0}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress}%`,
                  background: progress === 100
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : 'linear-gradient(90deg, #6366F1, #06B6D4)',
                  boxShadow: `0 0 8px rgba(99,102,241,0.4)`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Continue Study Plan
            </span>
            <div className="flex items-center gap-2">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(roadmap.id, e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(roadmap.id, e as any);
                  }
                }}
                title="Delete roadmap"
                className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer"
                style={{ color: '#475569' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = '#F87171';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = '#475569';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </span>
              <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1.5 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, logout, loginWithEmail, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { setLoading(false); return; }
    if (user && token) { loadUserData(); }
  }, [user, token, authLoading]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profRes, roadRes] = await Promise.all([
        fetch(`${API_BASE}/user/profile`, { headers }),
        fetch(`${API_BASE}/user/roadmaps`, { headers }),
      ]);
      if (profRes.ok) {
        setProfile(await profRes.json());
      } else {
        setProfile({
          display_name: user?.user_metadata?.full_name || 'Tech Professional',
          current_country_code: 'US',
          current_role_title: 'Software Developer',
          target_career_slug: 'data-scientist',
          target_country_code: 'US',
          target_annual_salary: 135000,
          experience_level: 'Mid-level',
          weekly_study_hours: 12,
          target_timeline_weeks: 12,
        });
      }
      if (roadRes.ok) {
        const data = await roadRes.json();
        setRoadmaps(data && data.length > 0 ? data : DEMO_FALLBACK_ROADMAPS);
      } else {
        setRoadmaps(DEMO_FALLBACK_ROADMAPS);
      }
    } catch (e) {
      console.error('Dashboard load error', e);
      setProfile({
        display_name: user?.user_metadata?.full_name || 'Tech Professional',
        current_country_code: 'US',
      });
      setRoadmaps(DEMO_FALLBACK_ROADMAPS);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccess = async () => {
    setLoggingIn(true);
    await loginWithEmail('student@careergps.ai', 'Password123!');
    setLoggingIn(false);
  };

  const handleDeleteRoadmap = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this roadmap?')) return;
    try {
      const res = await fetch(`${API_BASE}/user/roadmaps/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRoadmaps(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
  };

  const totalTasks = roadmaps.reduce((a, r) => a + (r.total_tasks || 0), 0);
  const completedTasks = roadmaps.reduce((a, r) => a + (r.completed_tasks || 0), 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060912', color: '#F8FAFC' }}>
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[700px] h-[700px] rounded-full pointer-events-none animate-pulse-glow"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07), transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none animate-float-slow"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.05), transparent 70%)', filter: 'blur(80px)' }} />

      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 relative z-10 space-y-8">

        {/* Not signed in */}
        {!user && !authLoading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="max-w-md w-full p-10 rounded-3xl animate-fade-in-scale"
              style={{ background: 'rgba(14,21,37,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 neon-primary"
                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                <Compass className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Your Career Dashboard</h2>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                Track your learning milestones, monitor skill velocity, and access your generated roadmaps from any device.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleQuickDemoAccess}
                  disabled={loggingIn}
                  id="dashboard-demo-login"
                  className="btn-magnetic w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{
                    background: loggingIn ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    boxShadow: '0 6px 24px rgba(99,102,241,0.35)',
                  }}
                >
                  {loggingIn ? (
                    <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Authenticating...</>
                  ) : (
                    <><Zap className="w-4 h-4" /> ⚡ One-Click Demo Access</>
                  )}
                </button>
                <Link
                  href="/login"
                  id="dashboard-signin"
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold text-slate-300 transition-all flex items-center justify-center"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  Sign In with Password
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {(authLoading || (user && loading)) && (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Loading your learner portal...</p>
          </div>
        )}

        {/* Logged-in dashboard */}
        {user && !loading && (
          <div className="space-y-8">

            {/* Welcome banner */}
            <div className="relative p-7 sm:p-10 rounded-3xl overflow-hidden card-3d"
              style={{
                background: 'linear-gradient(135deg, rgba(14,21,37,0.95), rgba(22,30,48,0.85))',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {/* Background shimmer */}
              <div className="absolute inset-0 bg-shimmer pointer-events-none" />
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', filter: 'blur(40px)' }} />

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Verified Learner Portal
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
                    Welcome back, {profile?.display_name || user.email?.split('@')[0]} 👋
                  </h1>
                  <p className="text-sm text-slate-400 max-w-lg">
                    You're {overallProgress}% through your active curriculum.
                    {overallProgress < 50 ? " Keep pushing — you're building momentum!" : " Great progress — keep it up!"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/planner"
                    id="dashboard-new-plan"
                    className="btn-magnetic flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
                  >
                    <Plus className="w-4 h-4" />
                    New Roadmap
                  </Link>
                  <button
                    onClick={() => logout()}
                    id="dashboard-logout"
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.color = '#F87171';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.color = '#64748B';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  label: 'Saved Roadmaps',
                  value: roadmaps.length,
                  sub: 'Active personalized plans',
                  icon: BookOpen,
                  color: '#6366F1',
                },
                {
                  label: 'Tasks Completed',
                  value: `${completedTasks} / ${totalTasks || '—'}`,
                  sub: `${overallProgress}% overall readiness`,
                  icon: CheckCircle2,
                  color: '#10B981',
                },
                {
                  label: 'Target Market',
                  value: profile?.current_country_code || 'US',
                  sub: 'Empirical benchmark matching',
                  icon: MapPin,
                  color: '#06B6D4',
                },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div key={i}
                    className="p-6 rounded-3xl card-3d animate-fade-in-up"
                    style={{
                      animationDelay: `${i * 100}ms`,
                      background: 'rgba(14,21,37,0.8)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#475569' }}>
                        {kpi.label}
                      </span>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                        <Icon className="w-4.5 h-4.5" style={{ color: kpi.color }} />
                      </div>
                    </div>
                    <div className="text-3xl font-black font-mono" style={{ color: kpi.color }}>
                      {kpi.value}
                    </div>
                    <div className="text-xs mt-2" style={{ color: '#475569' }}>{kpi.sub}</div>
                  </div>
                );
              })}
            </div>

            {/* Roadmaps section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Your Learning Plans</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage and execute your career blueprints</p>
                </div>
                <Link
                  href="/planner"
                  id="dashboard-new-roadmap-btn"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 transition-all hover:border-indigo-500/40 hover:text-indigo-300 cursor-pointer"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Roadmap
                </Link>
              </div>

              {roadmaps.length === 0 ? (
                <div className="p-12 rounded-3xl text-center animate-fade-in-scale"
                  style={{ background: 'rgba(14,21,37,0.7)', border: '1px dashed rgba(99,102,241,0.25)' }}>
                  <Sparkles className="w-10 h-10 text-accent mx-auto mb-4 animate-pulse" />
                  <h3 className="text-base font-bold text-white mb-2">No Roadmaps Yet</h3>
                  <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                    Generate your first career roadmap using our 6-step wizard and track your weekly progress here.
                  </p>
                  <Link
                    href="/planner"
                    id="dashboard-start-planner"
                    className="btn-magnetic inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
                  >
                    <Plus className="w-4 h-4" />
                    Start Career Planner
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {roadmaps.map(r => (
                    <RoadmapCard key={r.id} roadmap={r} onDelete={handleDeleteRoadmap} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Explore Markets', href: '/explore', icon: BarChart3, color: '#6366F1' },
                { label: 'Career Planner', href: '/planner', icon: Target, color: '#06B6D4' },
                { label: 'My Roadmaps', href: '/my-roadmaps', icon: BookOpen, color: '#818CF8' },
                { label: 'Profile', href: '/profile', icon: Compass, color: '#10B981' },
              ].map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} id={`dashboard-quick-${link.label.toLowerCase().replace(/\s+/g,'-')}`}>
                    <div className="p-4 rounded-2xl text-center card-3d group cursor-pointer transition-all"
                      style={{ background: 'rgba(14,21,37,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                        style={{ background: `${link.color}15`, border: `1px solid ${link.color}30` }}>
                        <Icon className="w-5 h-5" style={{ color: link.color }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                        {link.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
