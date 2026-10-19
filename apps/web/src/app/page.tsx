'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Compass, ArrowRight, ShieldCheck, Award,
  Sparkles, CheckCircle2, BarChart3, TrendingUp,
  MapPin, BookOpen, Target, Zap, Globe, Brain, ChevronDown
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CareerKnowledgeTree } from '@/components/career/CareerKnowledgeTree';

// Animated counter hook
function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

// Particle canvas background
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      r: number; opacity: number; color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#6366F1', '#06B6D4', '#818CF8', '#67E8F9', '#A5B4FC'];

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

function FloatingOrb({ color, size, delay, className, duration = '14s' }: {
  color: string; size: string; delay: string; className?: string; duration?: string;
}) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none animate-morph-blob ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}10, transparent)`,
        filter: `blur(60px)`,
        animationDelay: delay,
        animationDuration: duration,
      }}
    />
  );
}

// Animated stat card with counter
function StatCard({ value, label, detail, icon: Icon, color }: {
  value: number; label: string; detail: string;
  icon: React.ElementType; color: string;
}) {
  const { count, ref } = useCounter(value, 2200);
  return (
    <div ref={ref} className="text-center group">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3 mx-auto"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight"
        style={{ color, textShadow: `0 0 20px ${color}50` }}>
        {value < 100 ? `${count}+` : count.toLocaleString()}
      </div>
      <div className="text-xs font-bold text-slate-200 mt-1.5">{label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{detail}</div>
    </div>
  );
}

// Feature step card with 3D hover
function FeatureCard({ step, title, description, badge, icon: Icon, delay }: {
  step: string; title: string; description: string;
  badge: string; icon: React.ElementType; delay: number;
}) {
  return (
    <div
      className="relative p-7 rounded-3xl border border-slate-800/70 bg-surface/60 card-3d animate-fade-in-up group cursor-default"
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(135deg, rgba(14,21,37,0.8), rgba(22,30,48,0.6))',
      }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08), transparent 70%)' }}
      />

      {/* Step number */}
      <div className="text-6xl font-black absolute -top-3 -right-2 select-none"
        style={{ color: 'rgba(99,102,241,0.08)', fontSize: '80px', lineHeight: 1 }}>
        {step}
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 relative"
        style={{ background: 'linear-gradient(135deg, #6366F120, #06B6D420)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <Icon className="w-6 h-6 text-primary" />
      </div>

      {/* Badge */}
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-3"
        style={{ background: 'rgba(99,102,241,0.15)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)' }}>
        {badge}
      </span>

      <h3 className="text-base font-bold text-white mb-2 leading-snug">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Social proof testimonial
function Testimonial({ name, role, text, delay }: {
  name: string; role: string; text: string; delay: number;
}) {
  return (
    <div
      className="p-6 rounded-2xl card-3d animate-fade-in-scale"
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(135deg, rgba(14,21,37,0.9), rgba(22,30,48,0.7))',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}>
          {name[0]}
        </div>
        <div>
          <div className="text-sm font-bold text-white">{name}</div>
          <div className="text-[11px] text-slate-400">{role}</div>
        </div>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed italic">"{text}"</p>
      <div className="flex gap-0.5 mt-3">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-amber-400 text-xs">★</span>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: 227, label: 'Real Job Postings', detail: 'Verified across 4 markets', icon: Database, color: '#6366F1' },
    { value: 6, label: 'Career Paths', detail: 'O*NET 28.0 taxonomy', icon: Target, color: '#06B6D4' },
    { value: 27, label: 'Tracked Skills', detail: 'Topological DAG ordering', icon: Brain, color: '#818CF8' },
    { value: 100, label: 'Salary Accuracy', detail: 'Zero synthetic data', icon: ShieldCheck, color: '#10B981' },
  ];

  const features = [
    {
      step: '01',
      title: 'Analyze Real Market Demand',
      description: 'See exactly what skills employers demand in verified job listings across the US, UK, Canada, and India. No guesswork.',
      badge: 'Empirical Evidence',
      icon: BarChart3,
    },
    {
      step: '02',
      title: 'Assess Skills & Salary Reality',
      description: 'Understand realistic salary quartiles (P25, Median, P75) and identify the precise tools you need to command top compensation.',
      badge: 'Evidence-Backed',
      icon: TrendingUp,
    },
    {
      step: '03',
      title: 'Get Your Adaptive Roadmap',
      description: 'Receive a week-by-week AI-powered curriculum with free official resources, practice exercises, and GitHub capstone projects.',
      badge: 'Actionable Plan',
      icon: BookOpen,
    },
  ];

  const testimonials = [
    {
      name: 'Priya S.',
      role: 'Transitioned to Data Scientist, India → UK',
      text: 'CareerGPS gave me a real picture of what skills UK employers actually wanted. Got my role at a fintech in 6 months.',
    },
    {
      name: 'Marcus T.',
      role: 'ML Engineer, United States',
      text: 'The salary quartile data alone was worth it. I knew exactly what I was worth before negotiations. Got 23% above initial offer.',
    },
    {
      name: 'Aisha K.',
      role: 'Business Analyst, Canada',
      text: 'The prerequisite graph showed me exactly what to learn first. No more wasted time on irrelevant courses.',
    },
  ];

  function Database({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return <BarChart3 className={className} style={style} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#060912' }}>
      <Navbar />

      {/* Particle Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ParticleField />
      </div>

      {/* Morphing Orbs */}
      <FloatingOrb color="#6366F1" size="700px" delay="0s" duration="14s" className="top-[-200px] left-[-200px]" />
      <FloatingOrb color="#06B6D4" size="600px" delay="-3s" duration="16s" className="top-[20%] right-[-250px]" />
      <FloatingOrb color="#818CF8" size="500px" delay="-6s" duration="18s" className="bottom-[10%] left-[20%]" />

      <main className="flex-1 relative z-10">

        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden pt-24 pb-28 md:pt-32 md:pb-36 px-6">
          {/* Parallax glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 80% 50% at 50% ${-100 + scrollY * 0.1}px, rgba(99,102,241,0.18), transparent)`,
            }}
          />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Pill badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-up glass"
              style={{ border: '1px solid rgba(99,102,241,0.4)' }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-slate-300">Evidence-Backed Career Intelligence</span>
              <span className="text-[10px] font-bold text-emerald-400 ml-1">NO AI HALLUCINATIONS</span>
            </div>

            {/* Main headline */}
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6 animate-fade-in-up stagger-1"
              style={{ letterSpacing: '-0.03em' }}
            >
              <span className="text-white">Your Dream Career</span>
              <br />
              <span className="gradient-text-glow">Starts Here.</span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed mb-10 animate-fade-in-up stagger-2 font-light">
              Stop guessing what tech skills to learn. CareerGPS analyzes real job postings and
              prerequisite knowledge graphs to build your realistic, week-by-week learning roadmap —
              personalized to your experience, salary goals, and target country.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up stagger-3">
              <Link
                href="/planner"
                id="hero-cta-primary"
                className="btn-magnetic group px-8 py-4 rounded-2xl text-sm font-bold text-white flex items-center gap-2.5 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5, #06B6D4)',
                  backgroundSize: '200% 200%',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.3)',
                }}
              >
                <div className="absolute inset-0 bg-shimmer pointer-events-none" />
                <Compass className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Build My Career Roadmap</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/explore"
                id="hero-cta-explore"
                className="btn-magnetic px-8 py-4 rounded-2xl text-sm font-semibold text-slate-200 flex items-center gap-2.5 glass"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <BarChart3 className="w-4 h-4 text-accent" />
                <span>Explore Market Salaries</span>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 animate-fade-in-up stagger-4">
              {[
                { icon: ShieldCheck, text: 'Adzuna Verified Data', color: '#10B981' },
                { icon: Award, text: "O*NET 28.0 Taxonomy", color: '#06B6D4' },
                { icon: CheckCircle2, text: 'Free Learning Resources', color: '#6366F1' },
                { icon: Globe, text: '4 Global Markets', color: '#818CF8' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-slate-400">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-float-slow opacity-40">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </div>
        </section>

        {/* ============ STATS ============ */}
        <section className="py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(14,21,37,0.5)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <StatCard key={i} {...s} />
              ))}
            </div>
          </div>
        </section>

        {/* ============ LIVING CAREER TREE (AIWORLD INSPIRED) ============ */}
        <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-transparent via-[#0A1020]/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <CareerKnowledgeTree />
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
                Three-Step Methodology
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                From Job Market Chaos to{' '}
                <span className="gradient-text-primary">Clear Action</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                CareerGPS transforms raw labor analytics into your personalized,
                evidence-backed learning plan in under 2 minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <FeatureCard key={i} {...f} delay={i * 150} />
              ))}
            </div>
          </div>
        </section>

        {/* ============ ORBIT VISUALIZATION ============ */}
        <section className="py-20 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-12"
              style={{
                background: 'linear-gradient(135deg, rgba(14,21,37,0.95), rgba(22,30,48,0.85))',
                border: '1px solid rgba(99,102,241,0.2)',
              }}>

              {/* 3D Orbit Visual */}
              <div className="relative w-64 h-64 flex-shrink-0 mx-auto md:mx-0">
                {/* Center node */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center neon-primary"
                    style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                    <Compass className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Orbit ring 1 */}
                <div className="absolute inset-0 rounded-full border border-primary/20"
                  style={{ transform: 'scale(0.9)' }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary/30 border border-primary/60 flex items-center justify-center animate-spin-orbit">
                    <BarChart3 className="w-3 h-3 text-primary" />
                  </div>
                </div>

                {/* Orbit ring 2 */}
                <div className="absolute inset-[-30px] rounded-full border border-accent/15">
                  <div className="absolute top-0 right-4 w-7 h-7 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center animate-spin-orbit-reverse">
                    <Brain className="w-3.5 h-3.5 text-accent" />
                  </div>
                </div>

                {/* Floating skill nodes */}
                {[
                  { label: 'Python', x: '-60px', y: '50px', color: '#6366F1', delay: '0.8s' },
                  { label: 'SQL', x: '140px', y: '30px', color: '#06B6D4', delay: '1.6s' },
                  { label: 'ML', x: '30px', y: '160px', color: '#818CF8', delay: '2.4s' },
                  { label: 'AWS', x: '-40px', y: '140px', color: '#10B981', delay: '3.2s' },
                ].map(({ label, x, y, color, delay }) => (
                  <div key={label}
                    className="absolute px-3 py-1 rounded-xl text-[11px] font-bold animate-float-slow"
                    style={{
                      left: x, top: y,
                      background: `${color}20`,
                      border: `1px solid ${color}50`,
                      color,
                      animationDelay: delay,
                    }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Text content */}
              <div className="space-y-5 text-center md:text-left">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-2">
                    AI Skill Intelligence
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                    Powered by a<br />
                    <span className="gradient-text-primary">Knowledge Graph</span>
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
                    Our prerequisite DAG ensures you always learn skills in the right order.
                    No more studying advanced topics before mastering the fundamentals.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Prerequisite Ordering', icon: Zap },
                    { label: 'Gap Analysis', icon: Target },
                    { label: 'Market Validation', icon: ShieldCheck },
                    { label: 'Resource Curation', icon: BookOpen },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(99,102,241,0.2)' }}>
                        <Icon className="w-3 h-3 text-primary" />
                      </div>
                      {label}
                    </div>
                  ))}
                </div>

                <Link
                  href="/planner"
                  id="orbit-cta"
                  className="btn-magnetic inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white mt-2"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)', boxShadow: '0 6px 24px rgba(99,102,241,0.35)' }}
                >
                  <Zap className="w-4 h-4" />
                  <span>Start Building Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="py-20 px-6" style={{ background: 'rgba(14,21,37,0.4)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                Career Changers Trust CareerGPS
              </h2>
              <p className="text-sm text-slate-400">Real people, real results, real data.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <Testimonial key={i} {...t} delay={i * 120} />
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.3), transparent)' }} />
              <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center mx-auto neon-primary"
                style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}>
                <Compass className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Plan Your Career Move in{' '}
              <span className="gradient-text-glow">Under 2 Minutes</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
              Choose your target role, self-assess your starting skills, and generate a
              personalized curriculum tuned to your weekly schedule and salary target.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/planner"
                id="final-cta-primary"
                className="btn-magnetic px-10 py-4 rounded-2xl text-base font-black text-white flex items-center gap-3 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5, #06B6D4)',
                  boxShadow: '0 12px 40px rgba(99,102,241,0.45), 0 0 0 1px rgba(99,102,241,0.3)',
                }}
              >
                <div className="absolute inset-0 bg-shimmer pointer-events-none" />
                <Sparkles className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Launch Career Planner — Free</span>
                <ArrowRight className="w-5 h-5 relative z-10" />
              </Link>

              <Link
                href="/explore"
                id="final-cta-explore"
                className="btn-magnetic px-8 py-4 rounded-2xl text-sm font-semibold text-slate-300 glass flex items-center gap-2"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <MapPin className="w-4 h-4 text-accent" />
                <span>Explore Salary Data First</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
