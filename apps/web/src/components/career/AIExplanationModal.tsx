'use client';

import React, { useState } from 'react';
import { Sparkles, Brain, BookOpen, Layers, CheckCircle2, X } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

interface AIExplanationModalProps {
  skillName: string;
  targetRole: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  skillName,
  targetRole,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/career/ai/explain-skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_name: skillName,
          target_role: targetRole,
        }),
      });
      if (res.ok) {
        setExplanation(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && skillName) {
      fetchExplanation();
    }
  }, [isOpen, skillName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <Card elevated className="w-full max-w-lg p-6 relative border-slate-700 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Skill Intelligence</h3>
            <span className="text-xs text-text-secondary">Why {skillName} matters for {targetRole}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Synthesizing pedagogical rationale...</span>
          </div>
        ) : explanation ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-surface/60 border border-slate-800">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                Strategic Market Value
              </span>
              <p className="text-slate-200 leading-relaxed">{explanation.strategic_importance}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/60 border border-slate-800">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
                Topological Sequence Logic
              </span>
              <p className="text-slate-200 leading-relaxed">{explanation.learning_sequence_rationale}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/60 border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Portfolio Deliverable Strategy
              </span>
              <p className="text-slate-200 leading-relaxed">{explanation.capstone_application_guide}</p>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 text-center">
              * Grounded in empirical curriculum ontologies with deterministic guardrails.
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
};
