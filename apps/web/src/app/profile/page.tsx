'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass, User, MapPin, Briefcase, DollarSign,
  Clock, Calendar, Award, Trash2, ArrowLeft, Save,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/analytics';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [currentCountry, setCurrentCountry] = useState('US');
  const [currentRole, setCurrentRole] = useState('Data Analyst');
  const [targetCareer, setTargetCareer] = useState('data-scientist');
  const [targetCountry, setTargetCountry] = useState('US');
  const [targetSalary, setTargetSalary] = useState(110000);
  const [experienceLevel, setExperienceLevel] = useState('Entry-level');
  const [weeklyHours, setWeeklyHours] = useState(12);
  const [targetWeeks, setTargetWeeks] = useState(16);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && token) {
      fetchProfile();
    }
  }, [user, token, authLoading]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDisplayName(data.display_name || '');
        setCurrentCountry(data.current_country_code || 'US');
        setCurrentRole(data.current_role_title || 'Data Analyst');
        setTargetCareer(data.target_career_slug || 'data-scientist');
        setTargetCountry(data.target_country_code || 'US');
        setTargetSalary(data.target_annual_salary || 110000);
        setExperienceLevel(data.experience_level || 'Entry-level');
        setWeeklyHours(data.weekly_study_hours || 12);
        setTargetWeeks(data.target_timeline_weeks || 16);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          display_name: displayName,
          current_country_code: currentCountry,
          current_role_title: currentRole,
          target_career_slug: targetCareer,
          target_country_code: targetCountry,
          target_annual_salary: targetSalary,
          experience_level: experienceLevel,
          weekly_study_hours: weeklyHours,
          target_timeline_weeks: targetWeeks,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        trackEvent('profile_updated', { target_career: targetCareer });
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to permanently delete your account and all saved roadmaps? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        router.push('/');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-300">Loading user profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">User Profile & Career Goals</h1>
            <div className="text-xs text-slate-400">Configure your target expectations & study capacity</div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        {savedSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile and career goals updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" />
              <span>Personal Identity</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-800/40 border border-slate-750 rounded-xl px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Target Career Parameters</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Role</label>
                <select
                  value={targetCareer}
                  onChange={(e) => setTargetCareer(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}
                >
                  <option value="data-analyst" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Data Analyst</option>
                  <option value="data-scientist" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Data Scientist</option>
                  <option value="software-engineer" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Software Engineer</option>
                  <option value="machine-learning-engineer" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Machine Learning Engineer</option>
                  <option value="cybersecurity-analyst" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Cybersecurity Analyst</option>
                  <option value="product-manager" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Product Manager</option>
                  <option value="ui-ux-designer" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>UI/UX Designer</option>
                  <option value="business-analyst" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Business Analyst</option>
                  <option value="digital-marketing-specialist" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Digital Marketing Specialist</option>
                  <option value="technical-writer" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Technical Writer</option>
                  <option value="hr-talent-acquisition" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>HR & Talent Acquisition</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Country</label>
                <select
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}
                >
                  <option value="US" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>United States (USD)</option>
                  <option value="GB" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>United Kingdom (GBP)</option>
                  <option value="DE" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Germany (EUR)</option>
                  <option value="IN" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>India (INR)</option>
                  <option value="CA" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Canada (CAD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Expected Annual Salary</label>
                <input
                  type="number"
                  value={targetSalary}
                  onChange={(e) => setTargetSalary(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}
                >
                  <option value="Student" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Student / Intern</option>
                  <option value="Entry-level" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Entry-level (0-2 yrs)</option>
                  <option value="Mid-level" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Mid-level (3-5 yrs)</option>
                  <option value="Senior" style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}>Senior (5+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Weekly Study Budget (Hours)</label>
                <input
                  type="number"
                  min="2"
                  max="50"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Timeline (Weeks)</label>
                <input
                  type="number"
                  min="4"
                  max="52"
                  value={targetWeeks}
                  onChange={(e) => setTargetWeeks(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-primary-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
