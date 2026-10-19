'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass, BarChart3, TrendingUp, Users, ArrowDown,
  Layers, Filter, ShieldCheck, Key, RefreshCw
} from 'lucide-react';

export default function AdminAnalyticsDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/user/admin/product-analytics`, {
        headers: {
          'X-Admin-Key': adminKey,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Authentication failed: Invalid X-Admin-Key provided.');
      }
    } catch (e) {
      setError('Failed to reach backend analytics service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Internal Product Analytics</h1>
            <span className="text-xs text-slate-400">Executive Cohort & Funnel Intelligence</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="X-Admin-Key"
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-400">Total Registered Users</span>
                <div className="text-2xl font-bold text-white mt-1">{data.kpis?.total_registered_users}</div>
                <div className="text-[11px] text-slate-500 mt-1">Verified Supabase accounts</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-400">Saved Roadmaps</span>
                <div className="text-2xl font-bold text-primary-400 mt-1">{data.kpis?.total_saved_roadmaps}</div>
                <div className="text-[11px] text-slate-500 mt-1">Active curricula tracked</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-400">Completed Study Tasks</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{data.kpis?.completed_learning_tasks}</div>
                <div className="text-[11px] text-slate-500 mt-1">Logged practice exercises</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs font-semibold text-slate-400">Roadmap Save Conversion</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{data.kpis?.roadmap_save_conversion_pct}%</div>
                <div className="text-[11px] text-slate-500 mt-1">Generated vs Saved ratio</div>
              </div>
            </div>

            {/* Funnel Analysis Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>Product Conversion Funnel</span>
              </h2>

              <div className="space-y-4">
                {data.funnel_analysis?.map((step: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">{step.step}</span>
                      <span className="text-slate-400">{step.visitors} interactions ({step.conversion_rate}% conversion)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-600 to-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.max(step.conversion_rate, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Careers & Countries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Top Selected Careers</h3>
                <div className="space-y-2">
                  {data.feature_adoption?.top_target_careers?.map((c: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-800/40 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-200">{c.career}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-primary-400 font-semibold">{c.saved_count} roadmaps</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Top Selected Target Countries</h3>
                <div className="space-y-2">
                  {data.feature_adoption?.top_target_countries?.map((c: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-800/40 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-200">{c.country}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-400 font-semibold">{c.count} users</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
