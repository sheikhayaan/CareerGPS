'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Compass, ArrowLeft, CheckCircle2, Circle, Clock,
  BookOpen, ExternalLink, Award, Calendar, Layers,
  ChevronDown, ChevronUp, Share2, Download
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/lib/analytics';

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const roadmapId = params?.id as string;

  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<{ [key: number]: boolean }>({ 1: true });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (!token) return;
    fetchRoadmap();
  }, [roadmapId, token]);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/roadmaps/${roadmapId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmap(data);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (weekNum: number, taskIdentifier: string, currentCompleted: boolean) => {
    if (!token) return;

    // Optimistic UI update
    const updatedProgress = roadmap.progress.map((p: any) => {
      if (p.week_number === weekNum && p.task_identifier === taskIdentifier) {
        return { ...p, is_completed: !currentCompleted };
      }
      return p;
    });

    const completedCount = updatedProgress.filter((p: any) => p.is_completed).length;
    const newPct = Math.round((completedCount / updatedProgress.length) * 100);

    setRoadmap({
      ...roadmap,
      progress: updatedProgress,
      completion_percentage: newPct,
    });

    try {
      await fetch(`${API_BASE}/user/roadmaps/${roadmapId}/tasks/${weekNum}/${taskIdentifier}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_completed: !currentCompleted,
          actual_hours_spent: 2.0,
        }),
      });
      trackEvent('roadmap_task_completed', { roadmap_id: roadmapId, week: weekNum });
    } catch (e) {
      console.error('Failed to update task:', e);
    }
  };

  const toggleWeek = (w: number) => {
    setExpandedWeeks((prev) => ({ ...prev, [w]: !prev[w] }));
  };

  if (loading || !roadmap) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-300">Loading learning plan...</span>
        </div>
      </div>
    );
  }

  const weeklyPlan = roadmap.roadmap_data?.weekly_plan || [];
  const projects = roadmap.roadmap_data?.portfolio_projects || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">{roadmap.title}</h1>
            <div className="text-xs text-slate-400">
              {roadmap.target_role_title} • {roadmap.target_country_code} • {roadmap.experience_level}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400">Overall Progress</span>
            <div className="text-sm font-bold text-emerald-400">{roadmap.completion_percentage}%</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        {/* Progress Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">
                Active Learning Tracker
              </span>
              <h2 className="text-xl font-bold text-white mt-1">Paced Curriculum & Exercises</h2>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary-400" />
              <span>{roadmap.weekly_hours} hrs/week budget</span>
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${roadmap.completion_percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{roadmap.progress.filter((p: any) => p.is_completed).length} of {roadmap.progress.length} tasks completed</span>
            <span>{roadmap.total_hours_invested} logged practice hours</span>
          </div>
        </div>

        {/* Weekly Modules Timeline */}
        <div className="space-y-4 mb-8">
          {weeklyPlan.map((week: any, wIdx: number) => {
            const wNum = week.week_number || (wIdx + 1);
            const isExpanded = !!expandedWeeks[wNum];
            const weekTasks = roadmap.progress.filter((p: any) => p.week_number === wNum);
            const weekCompleted = weekTasks.length > 0 && weekTasks.every((p: any) => p.is_completed);

            return (
              <div
                key={wNum}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all"
              >
                {/* Week Header */}
                <div
                  onClick={() => toggleWeek(wNum)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        weekCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                      }`}
                    >
                      {wNum}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{week.title}</h3>
                      <div className="text-xs text-slate-400">
                        Focus: {week.skills?.join(', ') || 'Core Competencies'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {weekTasks.filter((t: any) => t.is_completed).length}/{weekTasks.length} tasks
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Week Details Body */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/60 bg-slate-900/40 space-y-4">
                    {/* Practice Tasks with Checkboxes */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary-400" />
                        <span>Interactive Exercises</span>
                      </h4>
                      <div className="space-y-2">
                        {weekTasks.map((task: any) => (
                          <div
                            key={task.task_identifier}
                            onClick={() => toggleTask(wNum, task.task_identifier, task.is_completed)}
                            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                              task.is_completed
                                ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-300'
                                : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-white'
                            }`}
                          >
                            {task.is_completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className={`text-xs flex-1 ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
                              {task.task_title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verified Learning Resources */}
                    {week.resources && week.resources.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Verified Documentation & Guides</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {week.resources.map((r: any, rIdx: number) => (
                            <a
                              key={rIdx}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-all group"
                            >
                              <div className="truncate pr-2">
                                <div className="font-medium truncate group-hover:text-primary-400">{r.title}</div>
                                <div className="text-[10px] text-slate-500">{r.provider}</div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover:text-primary-400" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Portfolio Deliverables */}
        {projects.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Capstone Portfolio Deliverables</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj: any, pIdx: number) => (
                <div key={pIdx} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-1">{proj.title}</h4>
                  <p className="text-xs text-slate-400 mb-3">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {proj.skills_demonstrated?.map((s: string, sIdx: number) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
