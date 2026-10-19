'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CareerPlannerWizard } from '@/components/career/CareerPlannerWizard';
import { StructuredCareerResults } from '@/components/career/StructuredCareerResults';
import { AIExplanationModal } from '@/components/career/AIExplanationModal';
import { Card, Button, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Compass, Sparkles, RefreshCw, Sliders, ArrowLeft } from 'lucide-react';

export default function PlannerPage() {
  const { user, token } = useAuth();
  const [showWizard, setShowWizard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Taxonomy
  const [roles, setRoles] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState<any[]>([]);

  // Generated results
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [roadmapResult, setRoadmapResult] = useState<any>(null);
  const [currentConfig, setCurrentConfig] = useState<any>(null);

  // AI Modal
  const [aiSkill, setAiSkill] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api';

  useEffect(() => {
    async function initTaxonomy() {
      try {
        const [rRes, cRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/careers`),
          fetch(`${API_BASE}/countries`),
          fetch(`${API_BASE}/skills`),
        ]);
        if (rRes.ok) setRoles(await rRes.json());
        if (cRes.ok) setCountries(await cRes.json());
        if (sRes.ok) setAllSkills(await sRes.json());
      } catch (err) {
        console.error('Failed to load taxonomy', err);
      }
    }
    initTaxonomy();
  }, [API_BASE]);

  const handleGenerateFromWizard = async (config: any) => {
    setCurrentConfig(config);
    setGenerating(true);
    setIsSaved(false);

    try {
      const currentSkillsPayload = Object.entries(config.selectedSkills || {}).map(([slug, prof]) => ({
        skill_slug: slug,
        proficiency: prof,
      }));

      const payload = {
        target_role_slug: config.targetRole,
        target_country_code: config.targetCountry,
        current_role_slug: config.currentRole,
        experience_level: config.experienceLevel,
        target_salary: config.targetSalary,
        weekly_hours: config.weeklyHours,
        target_weeks: config.targetWeeks,
        current_skills: currentSkillsPayload,
      };

      const [profileRes, planRes] = await Promise.all([
        fetch(`${API_BASE}/career/profile/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
        fetch(`${API_BASE}/career/roadmap/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      ]);

      if (profileRes.ok) setAnalysisResult(await profileRes.json());
      if (planRes.ok) setRoadmapResult(await planRes.json());

      setShowWizard(false);
    } catch (e) {
      console.error('Failed to generate career plan', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/user/roadmaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `${analysisResult?.target_role || 'Career'} Roadmap`,
          target_role_slug: currentConfig?.targetRole || 'data-analyst',
          target_country_code: currentConfig?.targetCountry || 'US',
          roadmap_payload: roadmapResult,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to save roadmap', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#0B0F19' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CareerGPS_${currentConfig?.targetRole || 'Roadmap'}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    }
  };

  const steps = [
    'Parsing your career profile...',
    'Analyzing job market demand...',
    'Computing salary quartiles...',
    'Building prerequisite graph...',
    'Generating week-by-week plan...',
    'Curating learning resources...',
  ];

  const [genStep, setGenStep] = React.useState(0);

  React.useEffect(() => {
    if (!generating) { setGenStep(0); return; }
    const timer = setInterval(() => {
      setGenStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 900);
    return () => clearInterval(timer);
  }, [generating]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060912', color: '#F8FAFC' }}>
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07), transparent 70%)', filter: 'blur(80px)' }} />

      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 max-w-6xl mx-auto w-full relative z-10">
        {/* Wizard View */}
        {showWizard && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Personalized Career Architecture
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white" style={{ letterSpacing: '-0.02em' }}>
                Configure Your Career Roadmap
              </h1>
              <p className="text-sm text-slate-400">
                Answer 6 quick questions to generate your evidence-backed learning plan.
              </p>
            </div>

            <CareerPlannerWizard
              roles={roles}
              countries={countries}
              allSkills={allSkills}
              onComplete={handleGenerateFromWizard}
              initialValues={currentConfig || {}}
            />
          </div>
        )}

        {/* Generating Loading Screen */}
        {generating && (
          <div className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
            {/* Orbit animation */}
            <div className="relative w-32 h-32 mb-10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
                  <Compass className="w-10 h-10 text-white" />
                </div>
              </div>
              {/* Spinning rings */}
              <div className="absolute inset-[-8px] rounded-full border border-primary/30 animate-spin"
                style={{ animationDuration: '3s' }} />
              <div className="absolute inset-[-20px] rounded-full border border-accent/20 animate-spin"
                style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
              <div className="absolute inset-[-34px] rounded-full border border-primary/10 animate-spin"
                style={{ animationDuration: '8s' }} />
            </div>

            <h3 className="text-xl font-black text-white mb-3">Building Your Career Roadmap</h3>
            <p className="text-sm text-slate-400 mb-8 text-center max-w-md">
              Running empirical analysis across {roles.length} career paths and verified job posting data...
            </p>

            {/* Step progress */}
            <div className="w-full max-w-sm space-y-2.5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                    style={{
                      background: i < genStep
                        ? 'rgba(16,185,129,0.2)'
                        : i === genStep
                        ? 'rgba(99,102,241,0.3)'
                        : 'rgba(30,41,59,0.5)',
                      border: `1px solid ${i < genStep ? '#10B981' : i === genStep ? '#6366F1' : 'rgba(71,85,105,0.3)'}`,
                    }}>
                    {i < genStep ? (
                      <span className="text-emerald-400 text-[10px]">✓</span>
                    ) : i === genStep ? (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(71,85,105,0.5)' }} />
                    )}
                  </div>
                  <span className="text-xs transition-colors duration-300"
                    style={{
                      color: i < genStep ? '#34D399' : i === genStep ? '#A5B4FC' : '#334155',
                      fontWeight: i === genStep ? 600 : 400,
                    }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results View */}
        {!showWizard && !generating && (analysisResult || roadmapResult) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <Button
                variant="ghost"
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Parameters & Re-calculate</span>
              </Button>
            </div>

            <div ref={reportRef}>
              <StructuredCareerResults
                analysisResult={analysisResult}
                roadmapResult={roadmapResult}
                onSaveRoadmap={handleSaveToProfile}
                onExportPDF={handleExportPDF}
                onExplainSkill={(slug) => setAiSkill(slug)}
                isSaved={isSaved}
                saving={saving}
              />
            </div>
          </div>
        )}

        {aiSkill && (
          <AIExplanationModal
            isOpen={!!aiSkill}
            onClose={() => setAiSkill(null)}
            skillName={aiSkill}
            targetRole={currentConfig?.targetRole || 'data-analyst'}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
