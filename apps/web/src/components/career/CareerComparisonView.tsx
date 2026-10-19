'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass, ArrowLeftRight, CheckCircle2, DollarSign,
  TrendingUp, Award, Layers, AlertCircle
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';

interface ComparisonProps {
  roles?: any[];
  countries?: any[];
}

export const CareerComparisonView: React.FC<ComparisonProps> = ({ roles = [], countries = [] }) => {
  const [roleA, setRoleA] = useState('data-analyst');
  const [roleB, setRoleB] = useState('data-scientist');
  const [countryCode, setCountryCode] = useState('US');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<any[]>(roles);
  const [allCountries, setAllCountries] = useState<any[]>(countries);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api';

  useEffect(() => {
    if (allRoles.length === 0 || allCountries.length === 0) {
      Promise.all([
        fetch(`${API_BASE}/careers`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_BASE}/countries`).then((r) => r.ok ? r.json() : []),
      ]).then(([r, c]) => {
        if (r.length > 0) setAllRoles(r);
        if (c.length > 0) setAllCountries(c);
      }).catch(console.error);
    }
  }, [allRoles.length, allCountries.length, API_BASE]);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/analytics/careers/comparison?role_a=${roleA}&role_b=${roleB}&country_code=${countryCode}`
      );
      if (res.ok) {
        setComparisonData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [roleA, roleB, countryCode]);

  return (
    <Card elevated className="p-6 md:p-8 max-w-5xl mx-auto border-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Comparative Labor Intelligence
          </span>
          <h2 className="text-xl font-bold text-white mt-1">Cross-Career Competency Comparison</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="bg-surface border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            {allCountries.map((c) => (
              <option key={c.iso_code} value={c.iso_code}>
                {c.name} ({c.currency_code || c.currency || 'USD'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Career Role A</label>
          <select
            value={roleA}
            onChange={(e) => setRoleA(e.target.value)}
            className="w-full bg-surface border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {allRoles.map((r) => (
              <option key={r.slug} value={r.slug}>{r.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">Career Role B</label>
          <select
            value={roleB}
            onChange={(e) => setRoleB(e.target.value)}
            className="w-full bg-surface border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {allRoles.map((r) => (
              <option key={r.slug} value={r.slug}>{r.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Computing Jaccard overlap and empirical salary delta...</span>
        </div>
      ) : comparisonData ? (
        <div className="space-y-6">
          {/* Similarity & Sample Sizes KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface/50 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">Jaccard Competency Similarity</span>
              <div className="text-2xl font-bold text-primary font-mono">
                {Math.round(comparisonData.jaccard_similarity * 100)}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Intersection over Union</span>
            </div>

            <div className="p-4 rounded-xl bg-surface/50 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">Shared Competencies</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {comparisonData.shared_skills_count || comparisonData.shared_skills?.length || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Directly transferable</span>
            </div>

            <div className="p-4 rounded-xl bg-surface/50 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">Empirical Observations</span>
              <div className="text-2xl font-bold text-accent font-mono">
                {comparisonData.sample_sizes ? `${comparisonData.sample_sizes.role_a} vs ${comparisonData.sample_sizes.role_b}` : 'N ≥ 25'}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Verified postings</span>
            </div>
          </div>

          {/* Skill Lists Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Shared Skills (Transferable Core)
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(comparisonData.shared_skills || []).map((s: string) => (
                  <Badge key={s} variant="success">{s}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                Divergent Specializations for Role B
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(comparisonData.unique_to_role_b || []).map((s: string) => (
                  <Badge key={s} variant="warning">{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};
