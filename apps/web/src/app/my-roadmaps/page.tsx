'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen, ArrowRight, Trash2, Plus, Sparkles,
  MapPin, Clock, CheckCircle2, Zap, Target
} from 'lucide-react';

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

const countryFlags: Record<string, string> = { US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', IN: '🇮🇳' };

function ProgressRing({ percent, color = '#6366F1' }: { percent: number; color?: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
    <svg width={52} height={52} className="rotate-[-90deg]">
      <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth={5} />
      <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 5px ${color}80)` }} />
    </svg>
  );
}

export default function MyRoadmapsPage() {
  const { user, token, loginWithEmail } = useAuth();
  const [roadmaps, setRoadmaps] = useState<any[]>(DEMO_FALLBACK_ROADMAPS);
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    async function fetchRoadmaps() {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/user/roadmaps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setRoadmaps(data);
        }
      } catch (err) {
        console.error('Failed to load roadmaps', err);
      }
    }
    fetchRoadmaps();
  }, [token]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || !confirm('Delete this roadmap?')) return;
    try {
      const res = await fetch(`${API_BASE}/user/roadmaps/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRoadmaps(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error('Delete error', err); }
  };

  const handleQuickDemoAccess = async () => {
    setLoggingIn(true);
    await loginWithEmail('student@careergps.ai', 'Password123!');
    setLoggingIn(false);
  };

  const totalTasks = roadmaps.reduce((a, r) => a + (r.total_tasks || 0), 0);
  const completedTasks = roadmaps.reduce((a, r) => a + (r.completed_tasks || 0), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060912', color: '#F8FAFC' }}>
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none animate-pulse-glow"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none animate-float-reverse"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.05), transparent 70%)', filter: 'blur(80px)' }} />

      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Persistent Learning Plans
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              My Saved Roadmaps
            </h1>
            {roadmaps.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {completedTasks} of {totalTasks} tasks completed across {roadmaps.length} active {roadmaps.length === 1 ? 'plan' : 'plans'}
              </p>
            )}
          </div>

          <Link
            href="/planner"
            id="my-roadmaps-create"
            className="btn-magnetic flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          >
            <Plus className="w-4 h-4" />
            Create New Plan
          </Link>
        </div>

        {/* Not logged in */}
        {!user && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="max-w-md w-full p-10 rounded-3xl text-center animate-fade-in-scale"
              style={{ background: 'rgba(14,21,37,0.9)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Save & Track Your Progress</h3>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                Sign in to check off weekly tasks, track your readiness, and access your roadmaps from any device.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleQuickDemoAccess}
                  disabled={loggingIn}
                  id="roadmaps-demo-login"
                  className="btn-magnetic w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 6px 24px rgba(99,102,241,0.35)' }}
                >
                  {loggingIn
                    ? <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Authenticating...</>
                    : <><Zap className="w-4 h-4" /> ⚡ One-Click Instant Access</>
                  }
                </button>
                <Link
                  href="/login"
                  id="roadmaps-signin"
                  className="block w-full py-3.5 rounded-2xl text-sm font-semibold text-slate-300 text-center cursor-pointer transition-colors hover:text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Sign In with Password
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Loading your saved plans...</p>
          </div>
        )}

        {/* Empty state (logged in but no roadmaps) */}
        {user && !loading && roadmaps.length === 0 && (
          <div className="py-12 text-center animate-fade-in-scale">
            <div className="max-w-md mx-auto p-10 rounded-3xl"
              style={{ background: 'rgba(14,21,37,0.7)', border: '1px dashed rgba(99,102,241,0.25)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float-slow"
                style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
                <Target className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Roadmaps Yet</h3>
              <p className="text-xs text-slate-400 mb-7 leading-relaxed max-w-xs mx-auto">
                You haven't generated any personalized roadmaps yet. Run our 6-step planner to create your first curriculum.
              </p>
              <Link
                href="/planner"
                id="roadmaps-first-plan"
                className="btn-magnetic inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-white cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
              >
                <Plus className="w-4 h-4" />
                Build My First Roadmap
              </Link>
            </div>
          </div>
        )}

        {/* Roadmaps Grid */}
        {user && !loading && roadmaps.length > 0 && (
          <>
            {/* Summary banner */}
            <div className="p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="text-center sm:text-left">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overall Progress</div>
                <div className="text-2xl font-black text-white font-mono">
                  {completedTasks} <span className="text-slate-500">/ {totalTasks}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">tasks completed</div>
              </div>

              {/* Overall progress bar */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                  <span>Learning velocity</span>
                  <span className="font-mono text-white">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
                      background: 'linear-gradient(90deg, #6366F1, #06B6D4)',
                      boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                      transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />
                </div>
              </div>

              <Link
                href="/planner"
                id="roadmaps-add-new"
                className="btn-magnetic flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 3px 12px rgba(99,102,241,0.3)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Plan
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {roadmaps.map((r, i) => {
                const progress = r.total_tasks > 0
                  ? Math.round((r.completed_tasks / r.total_tasks) * 100)
                  : 0;
                return (
                  <Link key={r.id} href={`/my-roadmaps/${r.id}`} id={`roadmap-card-${r.id}`}>
                    <div
                      className="p-6 rounded-3xl card-3d group cursor-pointer relative overflow-hidden animate-fade-in-up"
                      style={{
                        animationDelay: `${i * 80}ms`,
                        background: 'linear-gradient(135deg, rgba(14,21,37,0.95), rgba(22,30,48,0.8))',
                        border: '1px solid rgba(99,102,241,0.12)',
                      }}
                    >
                      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: 'radial-gradient(circle at 30% 0%, rgba(99,102,241,0.06), transparent 70%)' }} />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors duration-200 truncate">
                              {r.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                              <span>{countryFlags[r.target_country_code] || '🌍'} {r.target_country_code}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="relative flex-shrink-0">
                            <ProgressRing percent={progress}
                              color={progress === 100 ? '#10B981' : '#6366F1'} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-black text-white">{progress}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden mb-4"
                          style={{ background: 'rgba(99,102,241,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${progress}%`,
                              background: progress === 100
                                ? 'linear-gradient(90deg, #10B981, #34D399)'
                                : 'linear-gradient(90deg, #6366F1, #06B6D4)',
                              boxShadow: `0 0 8px rgba(99,102,241,0.4)`,
                              transition: 'width 1s ease',
                            }}
                          />
                        </div>

                        <div className="text-xs text-slate-500 mb-4">
                          {r.completed_tasks || 0} of {r.total_tasks || 0} tasks complete
                        </div>

                        <div className="flex items-center justify-between pt-4"
                          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Open Weekly Plan
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(r.id, e);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(r.id, e as any);
                                }
                              }}
                              title="Delete roadmap"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
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
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
