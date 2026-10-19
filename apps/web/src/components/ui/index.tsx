import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background relative overflow-hidden';

  const variants: Record<string, string> = {
    primary:
      'text-white border border-indigo-500/30 focus-visible:ring-primary',
    secondary:
      'text-slate-200 border border-slate-700/70 focus-visible:ring-slate-500',
    outline:
      'text-slate-200 border border-slate-700 focus-visible:ring-slate-500',
    ghost:
      'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5',
    danger:
      'text-white border border-rose-500/40 focus-visible:ring-rose-500',
  };

  const variantBg: Record<string, string> = {
    primary: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    secondary: 'rgba(22,30,48,0.9)',
    outline: 'rgba(14,21,37,0.6)',
    ghost: 'transparent',
    danger: 'linear-gradient(135deg, #DC2626, #EF4444)',
  };

  const sizes: Record<string, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2.5 gap-2',
    lg: 'text-sm px-6 py-3.5 gap-2.5',
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' },
    secondary: { transform: 'translateY(-1px)' },
    outline: { transform: 'translateY(-1px)' },
    ghost: {},
    danger: { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(239,68,68,0.35)' },
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      style={{ background: variantBg[variant] }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          const el = e.currentTarget as HTMLButtonElement;
          Object.assign(el.style, hoverStyles[variant]);
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = '';
        el.style.boxShadow = '';
      }}
      onMouseDown={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = 'translateY(1px) scale(0.98)';
      }}
      onMouseUp={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = '';
      }}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export const Card: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    elevated?: boolean;
    glass?: boolean;
    glow?: boolean;
  }
> = ({ children, className = '', hover = false, elevated = false, glass = false, glow = false, ...props }) => {
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 card-3d ${className}`}
      style={{
        background: elevated
          ? 'rgba(14,21,37,0.9)'
          : glass
          ? 'rgba(14,21,37,0.6)'
          : 'rgba(6,9,18,0.8)',
        borderColor: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: glow ? '0 0 30px rgba(99,102,241,0.1)' : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'destructive';
  className?: string;
}> = ({ children, variant = 'primary', className = '' }) => {
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.3)' },
    secondary: { background: 'rgba(30,41,59,0.8)', color: '#94A3B8', border: '1px solid rgba(71,85,105,0.5)' },
    success: { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' },
    warning: { background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' },
    error: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' },
    destructive: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' },
    outline: { background: 'rgba(14,21,37,0.5)', color: '#94A3B8', border: '1px solid rgba(71,85,105,0.5)' },
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${className}`}
      style={variants[variant]}
    >
      {children}
    </span>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <div className={`skeleton ${className}`} />;
};
