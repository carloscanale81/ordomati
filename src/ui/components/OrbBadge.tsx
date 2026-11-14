import React, { useId } from 'react';

export interface OrbBadgeProps {
  name: string;
  image?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'slate';
  isDimension?: boolean;
  className?: string;
  title?: string;
  onClick?: () => void;
}

// Scaled dimensions with squircle/rounded corners matching the left stepper
const sizeClasses: Record<string, string> = {
  xs: 'w-[26px] h-[26px] text-[11px] rounded-lg',
  sm: 'w-[31px] h-[31px] text-xs rounded-lg',
  md: 'w-[42px] h-[42px] text-sm rounded-xl',
  lg: 'w-[52px] h-[52px] text-base rounded-xl',
  xl: 'w-[62px] h-[62px] text-xl rounded-2xl'
};

const elementColorPalettes: Record<string, { start: string; mid: string; edge: string; dark: string }> = {
  blue: { start: '#60a5fa', mid: '#3b82f6', edge: '#1d4ed8', dark: '#1e3a8a' },
  indigo: { start: '#818cf8', mid: '#6366f1', edge: '#4338ca', dark: '#312e81' },
  emerald: { start: '#34d399', mid: '#10b981', edge: '#059669', dark: '#064e3b' },
  amber: { start: '#fbbf24', mid: '#f59e0b', edge: '#d97706', dark: '#78350f' },
  purple: { start: '#c084fc', mid: '#a855f7', edge: '#7e22ce', dark: '#581c87' },
  slate: { start: '#94a3b8', mid: '#64748b', edge: '#475569', dark: '#1e293b' }
};

/**
 * Derives a clean, readable abbreviation when no image is provided.
 * Shows full string if <= 3 chars, otherwise initials or first 2 chars.
 */
const getBadgeLabel = (str: string): string => {
  if (!str) return '?';
  const trimmed = str.trim();
  if (trimmed.length <= 3) return trimmed;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
};

export const OrbBadge: React.FC<OrbBadgeProps> = ({
  name,
  image,
  size = 'md',
  color = 'blue',
  isDimension = false,
  className = '',
  title,
  onClick
}) => {
  const rawId = useId();
  const uniqueId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const dimensionClass = sizeClasses[size] || sizeClasses.md;
  const displayTitle = title || name;
  const hasImage = typeof image === 'string' && image.trim().length > 0;
  const label = getBadgeLabel(name);

  // Dynamic font size depending on label length
  const fontSize = label.length <= 1 ? 40 : label.length === 2 ? 35 : label.length === 3 ? 30 : 24;

  const palette = elementColorPalettes[color] || elementColorPalettes.blue;

  return (
    <div
      onClick={onClick}
      title={displayTitle}
      className={`relative shrink-0 flex items-center justify-center select-none overflow-hidden transition-transform duration-200 ${dimensionClass} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
      } ${className}`}
      style={{
        boxShadow: hasImage
          ? '0 1px 2px rgba(0, 0, 0, 0.12), inset 0 0 1px rgba(0, 0, 0, 0.20)'
          : isDimension
          ? '0 1px 2px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.06)'
          : '0 1px 2px rgba(0, 0, 0, 0.14), inset 0 0 0 1px rgba(255, 255, 255, 0.15)'
      }}
    >
      {hasImage ? (
        <div className="relative w-full h-full rounded-[inherit] overflow-hidden">
          {/* Base Image */}
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover rounded-[inherit] pointer-events-none"
            loading="lazy"
          />

          {/* Minimal Corner Depth Border Overlay */}
          <div
            className="absolute inset-0 rounded-[inherit] pointer-events-none border border-black/10 dark:border-white/10"
            style={{
              boxShadow: 'inset 0 0 2px rgba(0, 0, 0, 0.15)'
            }}
          />
        </div>
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full select-none overflow-hidden rounded-[inherit]">
          <defs>
            {/* Background Gradient: Pure White for Dimensions, Linear Gradient for Elements */}
            {isDimension ? (
              <linearGradient id={`badge-bg-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f8fafc" />
              </linearGradient>
            ) : (
              <linearGradient id={`badge-bg-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.start} />
                <stop offset="55%" stopColor={palette.mid} />
                <stop offset="100%" stopColor={palette.edge} />
              </linearGradient>
            )}
          </defs>

          {/* Squircle / Rounded Square base */}
          <rect
            x="2"
            y="2"
            width="96"
            height="96"
            rx="22"
            ry="22"
            fill={`url(#badge-bg-${uniqueId})`}
            stroke={isDimension ? '#cbd5e1' : 'rgba(255,255,255,0.22)'}
            strokeWidth="2.5"
          />

          {/* Centered Crisp Text */}
          <text
            x="50"
            y="50"
            dominantBaseline="central"
            textAnchor="middle"
            fill={isDimension ? '#1e293b' : '#ffffff'}
            fontSize={fontSize}
            fontWeight="700"
            className="font-sans tracking-tight select-none pointer-events-none"
            style={{
              filter: isDimension
                ? 'none'
                : 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))'
            }}
          >
            {label}
          </text>
        </svg>
      )}
    </div>
  );
};
