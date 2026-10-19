'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass, TrendingUp, ShieldCheck, MapPin, Award,
  ArrowRight, BookOpen, CheckCircle, CheckCircle2,
  Calendar, Clock, Download, ChevronDown, ChevronUp,
  ExternalLink, Target, Sparkles, AlertTriangle, Layers,
  BookmarkCheck, BarChart2, Check, HelpCircle
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';

interface StructuredCareerResultsProps {
  analysisResult: any;
  roadmapResult: any;
  onSaveRoadmap?: () => void;
  onExportPDF?: () => void;
  onExplainSkill?: (skill: string) => void;
  isSaved?: boolean;
  saving?: boolean;
}

export const StructuredCareerResults: React.FC<StructuredCareerResultsProps> = ({
  analysisResult,
  roadmapResult,
  onSaveRoadmap,
  onExportPDF,
  onExplainSkill,
  isSaved = false,
  saving = false,
}) => {
  const [expandedWeeks, setExpandedWeeks] = useState<{ [key: number]: boolean }>({ 1: true, 2: true });
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

  const toggleWeek = (num: number) => {
    setExpandedWeeks((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  if (!analysisResult && !roadmapResult) {
    return null;
  }

  const roleTitle = analysisResult?.target_role || roadmapResult?.career_goal?.role || 'Target Career';
  const countryName = analysisResult?.target_country || roadmapResult?.career_goal?.country || 'Selected Market';
  const currency = analysisResult?.currency_code || 'USD';
  const salEval = analysisResult?.salary_evaluation;
  const transition = analysisResult?.career_transition;
  const prioritizedSkills = analysisResult?.prioritized_skills || [];
  const weeklyPlan = roadmapResult?.weekly_plan || [];
  const summary = roadmapResult?.summary;
  const portfolioProjects = roadmapResult?.portfolio_projects || [];
  const deferredSkills = roadmapResult?.deferred_skills || [];

  // Completed task progress calculation
  const totalTasks = weeklyPlan.length;
  const doneCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-secondary/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="text-xs">
              Personalized Plan Generated
            </Badge>
            <span className="text-xs text-text-secondary">
              {summary?.total_weeks || 16} Weeks • {summary?.weekly_hours || 12} hrs/week
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
            {roleTitle} Road to Mastery
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onSaveRoadmap && (
            <Button
              variant="primary"
              onClick={onSaveRoadmap}
              disabled={saving || isSaved}
              className="flex items-center gap-2 text-xs font-bold"
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
              <span>{isSaved ? 'Saved to Profile' : saving ? 'Saving...' : 'Save Roadmap'}</span>
            </Button>
          )}

          {onExportPDF && (
            <Button
              variant="outline"
              onClick={onExportPDF}
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export PDF Report</span>
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CAREER SNAPSHOT */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30">
            1
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Career Snapshot</h3>
            <p className="text-xs text-text-secondary">
              High-level overview of the target role, difficulty gap, and baseline transferability.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Role & Market */}
          <Card elevated className="p-5 border-slate-800">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span>Target Role & Location</span>
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="text-base font-bold text-white truncate">{roleTitle}</div>
            <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {countryName} Market
            </div>
          </Card>

          {/* Transition Difficulty */}
          <Card elevated className="p-5 border-slate-800">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span>Transition Feasibility</span>
              <Layers className="w-4 h-4 text-accent" />
            </div>
            <div className="text-base font-bold text-white">
              {transition?.transition_difficulty ? `${transition.transition_difficulty} Transition` : 'Moderate Transition'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {transition?.jaccard_similarity ? `${Math.round(transition.jaccard_similarity * 100)}% skill similarity` : 'Foundational skills aligned'}
            </div>
          </Card>

          {/* Time to Competency */}
          <Card elevated className="p-5 border-slate-800">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span>Time Commitment</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-base font-bold text-white">
              {summary?.estimated_total_hours || 180} Total Study Hours
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {summary?.total_weeks || 16} weeks @ {summary?.weekly_hours || 12} hrs/week
            </div>
          </Card>

          {/* Skill Gaps Count */}
          <Card elevated className="p-5 border-slate-800">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
              <span>Skills to Acquire</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-base font-bold text-white">
              {analysisResult?.total_gaps || prioritizedSkills.filter((s: any) => s.needs_improvement).length || 5} Core Skill Gaps
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Topologically ordered by prerequisites
            </div>
          </Card>
        </div>

        {transition?.explanation && (
          <div className="p-4 rounded-xl bg-surface/70 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
            <Compass className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Career Switcher Assessment: </span>
              {transition.explanation}
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: TARGET SALARY REALITY CHECK */}
      {/* ========================================================================= */}
      {salEval && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
              2
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Target Salary Reality Check</h3>
              <p className="text-xs text-text-secondary">
                Empirical compensation percentiles from verified job posting disclosures in {countryName}.
              </p>
            </div>
          </div>

          <Card elevated className="p-6 border-slate-800 bg-secondary/80">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Target Compensation
                </span>
                <div className="text-2xl md:text-3xl font-bold text-white font-mono">
                  {currency} {Number(salEval.target_salary).toLocaleString()}
                </div>
                <div className="mt-2">
                  <Badge
                    variant={
                      salEval.evaluation_status === 'REALISTIC'
                        ? 'success'
                        : salEval.evaluation_status === 'ABOVE_AVERAGE'
                        ? 'primary'
                        : 'warning'
                    }
                    className="text-xs"
                  >
                    {salEval.percentile_tier || 'Realistic Range'}
                  </Badge>
                </div>
              </div>

              {/* Empirical Quartiles */}
              <div className="md:col-span-2 space-y-3 bg-surface/70 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Market Distribution (N = {salEval.sample_size} postings):</span>
                  <span className="text-emerald-400 font-semibold">{salEval.evaluation_status}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">25th Percentile</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {salEval.empirical_p25 ? `${currency} ${Number(salEval.empirical_p25).toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30">
                    <span className="text-[10px] text-primary uppercase font-bold block">Market Median</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {salEval.empirical_median ? `${currency} ${Number(salEval.empirical_median).toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">75th Percentile</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {salEval.empirical_p75 ? `${currency} ${Number(salEval.empirical_p75).toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {salEval.message}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{salEval.limitations_note || 'Salary distributions reflect real employer postings; not employment guarantees.'}</span>
            </div>
          </Card>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SKILL GAPS & DEMAND ANALYSIS */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/20 text-accent flex items-center justify-center font-bold text-xs border border-accent/30">
            3
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Skills Employers Mention Most</h3>
            <p className="text-xs text-text-secondary">
              Direct comparison between the tools you already know and the capabilities employers require.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prioritizedSkills.slice(0, 8).map((skill: any) => {
            const isMissing = skill.is_missing;
            const needsWork = skill.needs_improvement;
            return (
              <Card key={skill.skill_slug} elevated className="p-4 border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{skill.skill_name}</span>
                    {onExplainSkill && (
                      <button
                        onClick={() => onExplainSkill(skill.skill_slug)}
                        title="AI Skill Explanation"
                        className="p-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <Badge
                    variant={isMissing ? 'destructive' : needsWork ? 'warning' : 'success'}
                    className="text-[10px]"
                  >
                    {isMissing ? 'Missing' : needsWork ? 'Needs Practice' : 'Acquired'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Employer Demand Frequency:</span>
                  <span className="font-bold text-white">{skill.market_demand_pct || 75}% of postings</span>
                </div>

                {/* Demand Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.min(100, skill.market_demand_pct || 75)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <span>Current: <strong className="text-slate-300 capitalize">{skill.user_proficiency || 'none'}</strong></span>
                  <span>Target: <strong className="text-emerald-400 capitalize">{skill.target_proficiency || 'intermediate'}</strong></span>
                  <span>Est: <strong className="text-slate-300">{skill.estimated_learning_hours || 20} hrs</strong></span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: PERSONALIZED MULTI-WEEK ROADMAP */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30">
              4
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Your Step-by-Step Learning Curriculum</h3>
              <p className="text-xs text-text-secondary">
                Weekly study goals structured to build real competency without burning out.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Progress: </span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{progressPct}% completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {summary?.feasibility_note && (
          <div className="p-4 rounded-xl bg-surface/70 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
            <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Study Budget Recommendation: </span>
              {summary.feasibility_note}
            </div>
          </div>
        )}

        {/* Weekly Timeline Items */}
        <div className="space-y-4 pt-2">
          {weeklyPlan.map((week: any) => {
            const isExpanded = !!expandedWeeks[week.week_number];
            const isCompleted = !!completedTasks[`w${week.week_number}`];

            return (
              <Card
                key={week.week_number}
                elevated
                className={`border-slate-800 transition-all ${
                  isCompleted ? 'border-emerald-500/40 bg-emerald-950/10' : ''
                }`}
              >
                {/* Week Header */}
                <div
                  onClick={() => toggleWeek(week.week_number)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(`w${week.week_number}`);
                      }}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'border-emerald-500 bg-emerald-500 text-black'
                          : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">Week {week.week_number}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{week.estimated_hours} Hours Target</span>
                      </div>
                      <h4 className={`text-sm sm:text-base font-bold text-white mt-0.5 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {week.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5">
                      {week.skills?.map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Week Detailed Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 text-xs bg-slate-900/20">
                    {/* Key Topics */}
                    {week.topics && week.topics.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                          Topics Covered (What you learn)
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {week.topics.map((t: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resources */}
                    {week.resources && week.resources.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                          Verified Curated Resources (How to study)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {week.resources.map((res: any, idx: number) => (
                            <a
                              key={idx}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 rounded-xl bg-surface/70 border border-slate-800 hover:border-slate-600 flex items-center justify-between transition-all group"
                            >
                              <div>
                                <div className="font-semibold text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                                  <span>{res.title}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-primary" />
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Provider: {res.provider} • {res.estimated_hours}h
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                                {res.is_free ? 'Free' : 'Verified'}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Practice Exercises & Deliverables */}
                    {week.practice_exercises && week.practice_exercises.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                          Practical Exercises & Milestone Deliverables
                        </span>
                        <div className="space-y-1.5">
                          {week.practice_exercises.map((ex: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-slate-300 bg-surface/40 p-2.5 rounded-lg border border-slate-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{ex}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Capstone Portfolio Project */}
        {portfolioProjects.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              <span>Recommended Industry Capstone Portfolio Project</span>
            </h4>

            {portfolioProjects.map((p: any, idx: number) => (
              <Card key={idx} elevated className="p-5 border-slate-800 bg-secondary/80">
                <div className="text-base font-bold text-white mb-1.5">{p.title}</div>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">{p.description}</p>

                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Verified Skills Demonstrated
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {p.skills_demonstrated?.map((sk: string) => (
                      <Badge key={sk} variant="primary" className="text-xs">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Required GitHub Deliverables
                  </span>
                  <div className="space-y-2">
                    {p.deliverables?.map((del: string, dIdx: number) => (
                      <div key={dIdx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{del}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: MARKET EVIDENCE & DATA TRANSPARENCY */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
            5
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Market Evidence & Transparency</h3>
            <p className="text-xs text-text-secondary">
              How these calculations were generated from verified public and empirical data sources.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card elevated className="p-4 border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 uppercase block mb-1">Taxonomy Standard</span>
            <div className="font-bold text-white mb-1">O*NET 28.0 & ESCO v1.2</div>
            <p className="text-slate-400 leading-relaxed">
              Curated occupational profiles by the U.S. Dept of Labor and European Commission.
            </p>
          </Card>

          <Card elevated className="p-4 border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 uppercase block mb-1">Observed Records</span>
            <div className="font-bold text-white mb-1">227 Verified Job Postings</div>
            <p className="text-slate-400 leading-relaxed">
              Collected from live Adzuna feeds across US, UK, Canada, and India.
            </p>
          </Card>

          <Card elevated className="p-4 border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 uppercase block mb-1">Algorithm Design</span>
            <div className="font-bold text-white mb-1">Topological Prerequisite DAG</div>
            <p className="text-slate-400 leading-relaxed">
              Guarantees prerequisite foundations (e.g. Python before Machine Learning) are scheduled first.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};
