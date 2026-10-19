'use client';

import React, { useState } from 'react';
import {
  Compass, ArrowLeft, ArrowRight, CheckCircle2,
  DollarSign, MapPin, Clock, Calendar, Sparkles, BookOpen,
  Briefcase, GraduationCap, Target, HelpCircle, Check
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

interface WizardProps {
  roles: any[];
  countries: any[];
  allSkills: any[];
  onComplete: (config: any) => void;
  onCancel?: () => void;
  initialValues?: any;
}

export const CareerPlannerWizard: React.FC<WizardProps> = ({
  roles,
  countries,
  allSkills,
  onComplete,
  onCancel,
  initialValues = {},
}) => {
  const [step, setStep] = useState(1);

  // Form State
  const [targetRole, setTargetRole] = useState(initialValues.targetRole || 'data-analyst');
  const [currentRole, setCurrentRole] = useState(initialValues.currentRole || 'business-analyst');
  const [experienceLevel, setExperienceLevel] = useState(initialValues.experienceLevel || 'Entry-level');
  const [targetCountry, setTargetCountry] = useState(initialValues.targetCountry || 'US');
  const [targetSalary, setTargetSalary] = useState<number>(initialValues.targetSalary || 85000);
  const [weeklyHours, setWeeklyHours] = useState<number>(initialValues.weeklyHours || 12);
  const [targetWeeks, setTargetWeeks] = useState<number>(initialValues.targetWeeks || 16);
  const [selectedSkills, setSelectedSkills] = useState<{ [key: string]: string }>(
    initialValues.selectedSkills || {
      sql: 'intermediate',
      excel: 'intermediate',
    }
  );

  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleSkillProficiency = (slug: string) => {
    setSelectedSkills((prev) => {
      const current = prev[slug];
      if (!current) return { ...prev, [slug]: 'beginner' };
      if (current === 'beginner') return { ...prev, [slug]: 'intermediate' };
      if (current === 'intermediate') return { ...prev, [slug]: 'advanced' };
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  };

  const handleFinish = () => {
    onComplete({
      targetRole,
      currentRole,
      targetCountry,
      targetSalary,
      experienceLevel,
      weeklyHours,
      targetWeeks,
      selectedSkills,
    });
  };

  // Salary guideline based on selected country and role
  const getSalaryBenchmarkHint = () => {
    if (targetCountry === 'US') return { median: '$75,000', p75: '$95,000', currency: 'USD ($)', min: 40000, max: 200000, step: 5000 };
    if (targetCountry === 'GB') return { median: '£45,000', p75: '£60,000', currency: 'GBP (£)', min: 25000, max: 120000, step: 2500 };
    if (targetCountry === 'CA') return { median: 'C$78,000', p75: 'C$98,000', currency: 'CAD (C$)', min: 45000, max: 180000, step: 5000 };
    return { median: '₹8,50,000', p75: '₹14,00,000', currency: 'INR (₹)', min: 300000, max: 3500000, step: 50000 };
  };

  const salHint = getSalaryBenchmarkHint();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto rounded-3xl" style={{ background: 'rgba(14,21,37,0.95)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Step-by-Step Career Planner
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Conversational Onboarding
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
            {step === 1 && 'Where do you want to take your career?'}
            {step === 2 && 'What is your current starting point?'}
            {step === 3 && 'Which country market are you targeting?'}
            {step === 4 && 'What skills do you already possess?'}
            {step === 5 && 'What are your target compensation goals?'}
            {step === 6 && 'How much time can you commit to study?'}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-primary">Step {step} of 6</div>
          <div className="text-[11px] text-slate-400">
            {step === 1 && 'Target Role'}
            {step === 2 && 'Background'}
            {step === 3 && 'Location'}
            {step === 4 && 'Skill Assessment'}
            {step === 5 && 'Salary Sanity'}
            {step === 6 && 'Study Budget'}
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2 mb-8">
        {[1,2,3,4,5,6].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300"
              style={{
                background: n < step ? 'rgba(16,185,129,0.2)' : n === step ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'rgba(30,41,59,0.5)',
                border: `1px solid ${n < step ? '#10B981' : n === step ? '#6366F1' : 'rgba(71,85,105,0.3)'}`,
                color: n < step ? '#34D399' : n === step ? '#fff' : '#334155',
                boxShadow: n === step ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
              }}>
              {n < step ? '✓' : n}
            </div>
            {n < 6 && <div className="flex-1 h-px" style={{ background: n < step ? '#10B981' : 'rgba(30,41,59,0.8)', minWidth: '12px' }} />}
          </div>
        ))}
      </div>

      {/* STEP 1: Target Career Goal */}
      {step === 1 && (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            Choose the specific role you are aiming for. We will analyze real-time job openings to extract the most in-demand skills and salary percentiles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {roles.map((r) => {
              const isSelected = targetRole === r.slug;
              return (
                <div
                  key={r.slug}
                  onClick={() => setTargetRole(r.slug)}
                  className="p-4 rounded-2xl text-left cursor-pointer interactive-press transition-all"
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(79,70,229,0.15))' : 'rgba(14,21,37,0.6)',
                    border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: isSelected ? '0 4px 20px rgba(99,102,241,0.2)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm" style={{ color: isSelected ? '#A5B4FC' : '#E2E8F0' }}>{r.title}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4" style={{ color: '#818CF8' }} />}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
                    {r.description || 'Analyze real market opportunities, requisite tools, and salary percentiles.'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: Current Background */}
      {step === 2 && (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            Tell us about your background so our Career Transition Analyzer can compute transferable skills and bridge the difficulty gap.
          </p>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Your Current or Closest Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.slug}
                  type="button"
                  onClick={() => setCurrentRole(r.slug)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    currentRole === r.slug
                      ? 'border-accent bg-accent/15 text-white font-semibold'
                      : 'border-slate-800 bg-surface/50 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Your Experience Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Student / Fresher', 'Entry-level (0-2 yrs)', 'Mid-level (3-5 yrs)', 'Senior (5+ yrs)'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setExperienceLevel(lvl)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                    experienceLevel === lvl
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-slate-800 bg-surface/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Geographic Market */}
      {step === 3 && (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            Labor markets vary greatly by country. Select your target market to align with empirical local salary benchmarks and regional skill trends.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {countries.map((c) => {
              const isSelected = targetCountry === c.iso_code;
              return (
                <div
                  key={c.iso_code}
                  onClick={() => setTargetCountry(c.iso_code)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-surface/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center font-bold text-white text-sm border border-slate-700">
                      {c.iso_code}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{c.name}</div>
                      <div className="text-xs text-text-secondary">
                        Standard Currency: <span className="text-emerald-400 font-semibold">{c.currency_code}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Existing Skills & Proficiencies */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              Click any skill to cycle proficiency: <span className="text-slate-400">None</span> → <span className="text-blue-400 font-medium">Beginner</span> → <span className="text-emerald-400 font-medium">Intermediate</span> → <span className="text-purple-400 font-medium">Advanced</span>.
            </p>
            <Badge variant="outline" className="text-xs">
              {Object.keys(selectedSkills).length} skills tagged
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {allSkills.map((s) => {
              const prof = selectedSkills[s.slug];
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggleSkillProficiency(s.slug)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between ${
                    prof === 'beginner'
                      ? 'border-blue-500/70 bg-blue-500/10 text-white font-medium'
                      : prof === 'intermediate'
                      ? 'border-emerald-500/70 bg-emerald-500/10 text-white font-medium'
                      : prof === 'advanced'
                      ? 'border-purple-500/70 bg-purple-500/10 text-white font-medium'
                      : 'border-slate-800 bg-surface/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  {prof && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800/80">
                      {prof.slice(0, 3)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Target Salary Sanity */}
      {step === 5 && (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            Set your target annual salary. Our engine verifies whether your expectations align with observed empirical job postings in {targetCountry}.
          </p>

          <div className="p-6 rounded-2xl" style={{ background: 'rgba(14,21,37,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#475569' }}>
                Target Compensation ({salHint.currency})
              </span>
              <span className="text-2xl font-black font-mono" style={{ color: '#A5B4FC' }}>
                {targetCountry === 'IN' ? `₹${targetSalary.toLocaleString()}` : targetCountry === 'GB' ? `£${targetSalary.toLocaleString()}` : `$${targetSalary.toLocaleString()}`}
              </span>
            </div>

            <input
              type="range"
              min={salHint.min}
              max={salHint.max}
              step={salHint.step}
              value={targetSalary}
              onChange={(e) => setTargetSalary(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              style={{ background: 'rgba(30,41,59,0.8)' }}
            />

            <div className="flex justify-between text-xs mt-2" style={{ color: '#334155' }}>
              <span>{salHint.min.toLocaleString()}</span>
              <span style={{ color: '#6366F1' }}>Median: {salHint.median}</span>
              <span>{salHint.max.toLocaleString()}</span>
            </div>

            <div className="mt-5 p-3.5 rounded-xl flex items-start gap-3 text-xs" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#94A3B8' }}>
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#6366F1' }} />
              <span>
                Verified {targetCountry} postings show median around {salHint.median}, top quartile reaching {salHint.p75}.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Study Budget & Horizon */}
      {step === 6 && (
        <div className="space-y-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            Be honest about your available time. We use these parameters to prioritize must-have foundational skills and eliminate cognitive burnout.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Weekly Hours */}
            <div className="bg-surface/70 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Weekly Time Budget</span>
                <span className="text-xl font-bold text-primary font-mono">{weeklyHours} hrs/week</span>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Recommended: 10–15 hours/week for working professionals, 20+ for full-time students.
              </p>
              <input
                type="range"
                min={4}
                max={40}
                step={2}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Target Weeks */}
            <div className="bg-surface/70 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Target Horizon</span>
                <span className="text-xl font-bold text-accent font-mono">{targetWeeks} weeks</span>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                (~{Math.round(targetWeeks / 4)} months total learning journey)
              </p>
              <input
                type="range"
                min={4}
                max={48}
                step={4}
                value={targetWeeks}
                onChange={(e) => setTargetWeeks(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface/50 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span>Total Available Study Capacity:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {weeklyHours * targetWeeks} hours total
            </span>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-6 mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          {step > 1 ? (
            <button onClick={prevStep}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ color: '#64748B', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : onCancel ? (
            <button onClick={onCancel} className="text-xs text-slate-500 hover:text-white transition-colors px-3 py-2">Cancel</button>
          ) : (
            <div />
          )}
        </div>

        <div>
          {step < 6 ? (
            <button
              onClick={nextStep}
              className="btn-magnetic flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn-magnetic flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5, #06B6D4)', boxShadow: '0 6px 24px rgba(99,102,241,0.45)' }}
            >
              <Sparkles className="w-4 h-4" /> Generate My Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
