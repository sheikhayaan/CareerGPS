'use client';

import React from 'react';
import Link from 'next/link';
import {
  Brain,
  Cpu,
  Code2,
  BarChart3,
  Shield,
  Briefcase,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CareerFruit {
  id: string;
  roleSlug: string;
  title: string;
  subtitle: string;
  medianSalary: string;
  demandTrend: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  positionClass: string;
}

const CAREER_FRUITS: CareerFruit[] = [
  {
    id: 'fruit-1',
    roleSlug: 'data-scientist',
    title: 'Data Scientist',
    subtitle: 'Python • ML • Math',
    medianSalary: '$128,500',
    demandTrend: '+18% YoY',
    icon: Brain,
    colorClass: 'text-indigo-400',
    positionClass: 'tree-fruit-1',
  },
  {
    id: 'fruit-2',
    roleSlug: 'machine-learning-engineer',
    title: 'ML Engineer',
    subtitle: 'PyTorch • MLOps • LLMs',
    medianSalary: '$146,000',
    demandTrend: '+28% YoY',
    icon: Cpu,
    colorClass: 'text-cyan-400',
    positionClass: 'tree-fruit-2',
  },
  {
    id: 'fruit-3',
    roleSlug: 'software-engineer',
    title: 'Software Engineer',
    subtitle: 'System Design • APIs',
    medianSalary: '$122,000',
    demandTrend: '+14% YoY',
    icon: Code2,
    colorClass: 'text-blue-400',
    positionClass: 'tree-fruit-3',
  },
  {
    id: 'fruit-4',
    roleSlug: 'data-analyst',
    title: 'Data Analyst',
    subtitle: 'SQL • BI • Statistics',
    medianSalary: '$88,000',
    demandTrend: '+12% YoY',
    icon: BarChart3,
    colorClass: 'text-emerald-400',
    positionClass: 'tree-fruit-4',
  },
  {
    id: 'fruit-5',
    roleSlug: 'cybersecurity-analyst',
    title: 'Cybersecurity',
    subtitle: 'Threat Intel • Defense',
    medianSalary: '$116,000',
    demandTrend: '+22% YoY',
    icon: Shield,
    colorClass: 'text-purple-400',
    positionClass: 'tree-fruit-5',
  },
  {
    id: 'fruit-6',
    roleSlug: 'business-analyst',
    title: 'Business Analyst',
    subtitle: 'KPIs • Product • Growth',
    medianSalary: '$94,000',
    demandTrend: '+11% YoY',
    icon: Briefcase,
    colorClass: 'text-amber-400',
    positionClass: 'tree-fruit-6',
  },
];

export function CareerKnowledgeTree() {
  return (
    <div className="career-feature-tree-container py-12">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-semibold tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Interactive Knowledge Graph
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-100 tracking-tight">
          The Living Career Tree
        </h2>
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto mt-2">
          Every technical career branches from foundational mathematical and programming roots into specialized, high-growth domains. Explore each path below.
        </p>
      </div>

      {/* Interactive Tree Scene */}
      <div className="career-feature-tree" aria-label="CareerGPS Living Career Tree">
        {/* SVG Glowing Tree Branches & Roots */}
        <svg className="feature-tree-lines" viewBox="0 0 900 760" aria-hidden="true">
          <defs>
            <linearGradient id="careerTreeGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#06B6D4" stopOpacity="0.95" />
              <stop offset="85%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </linearGradient>

            <filter id="treeBranchGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Trunk A & B (Double Helix Central Flow) */}
          <path
            className="tree-trunk trunk-a"
            d="M451 720 C384 596 520 510 432 404 C352 306 518 238 449 76"
            filter="url(#treeBranchGlow)"
          />
          <path
            className="tree-trunk trunk-b"
            d="M449 720 C530 590 383 500 472 390 C548 296 386 220 455 76"
            filter="url(#treeBranchGlow)"
          />

          {/* Energy Spirals (Dynamic Orbiting Fields) */}
          <path
            className="tree-spiral"
            d="M270 646 C590 720 700 520 470 456 C210 384 276 170 608 190"
            filter="url(#treeBranchGlow)"
          />
          <path
            className="tree-spiral second"
            d="M646 620 C302 660 178 438 440 372 C704 306 612 104 296 152"
            filter="url(#treeBranchGlow)"
          />

          {/* 6 Radiating Branches to Career Nodes */}
          <path
            className="tree-branch"
            d="M444 554 C340 510 286 464 204 406"
            filter="url(#treeBranchGlow)"
          />
          <path
            className="tree-branch"
            d="M468 515 C578 472 640 422 724 356"
            filter="url(#treeBranchGlow)"
          />
          <path
            className="tree-branch"
            d="M430 398 C316 360 250 300 176 226"
            filter="url(#treeBranchGlow)"
          />
          <path
            className="tree-branch"
            d="M478 378 C594 332 664 270 744 202"
            filter="url(#treeBranchGlow)"
          />
          <path
            className="tree-branch"
            d="M448 270 C390 226 340 178 276 112"
            filter="url(#treeBranchGlow)"
          />
          <path
            className="tree-branch"
            d="M466 260 C548 210 604 158 668 98"
            filter="url(#treeBranchGlow)"
          />

          {/* Deep Roots Spreading into Foundational Math & Logic */}
          <g className="tree-roots" filter="url(#treeBranchGlow)">
            <path d="M450 704 C390 735 330 748 250 742" />
            <path d="M452 704 C520 738 586 746 676 730" />
            <path d="M450 704 C426 744 386 764 312 782" />
            <path d="M452 704 C480 744 524 764 610 780" />
          </g>

          {/* Glowing Junction Synapses */}
          <circle className="tree-node-circle" cx="444" cy="554" r="8" />
          <circle className="tree-node-circle" cx="468" cy="515" r="8" />
          <circle className="tree-node-circle" cx="430" cy="398" r="8" />
          <circle className="tree-node-circle" cx="478" cy="378" r="8" />
          <circle className="tree-node-circle" cx="448" cy="270" r="8" />
          <circle className="tree-node-circle" cx="466" cy="260" r="8" />
          <circle className="tree-node-circle" cx="450" cy="76" r="10" />
        </svg>

        {/* Central Glowing Core Hub */}
        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-center">
          <div className="px-5 py-2.5 rounded-2xl bg-surface/90 border border-primary/40 backdrop-blur-xl shadow-[0_0_40px_rgba(99,102,241,0.35)] inline-block">
            <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 block uppercase">
              TOPOLOGICAL DAG ENGINE
            </span>
            <span className="text-sm font-black text-slate-100 block">
              Evidence-Backed Taxonomy
            </span>
          </div>
        </div>

        {/* Interactive Fruit Nodes (6 Pathways) */}
        {CAREER_FRUITS.map((fruit) => {
          const Icon = fruit.icon;
          return (
            <Link
              key={fruit.id}
              href={`/explore?role=${fruit.roleSlug}`}
              className={`tree-fruit ${fruit.positionClass} group`}
            >
              <div className="fruit-orb group-hover:scale-110">
                <Icon className={`w-6 h-6 ${fruit.colorClass} drop-shadow-[0_0_8px_currentColor]`} />
              </div>
              <span className="fruit-title group-hover:text-primary transition-colors">
                {fruit.title}
              </span>
              <span className="fruit-subtitle">
                {fruit.subtitle}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                <span>{fruit.medianSalary}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
