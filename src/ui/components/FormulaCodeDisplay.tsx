import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export interface FormulaCodeDisplayProps {
  code: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export const FormulaCodeDisplay: React.FC<FormulaCodeDisplayProps> = ({
  code,
  label,
  className = '',
  compact = false
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!code) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border transition-all ${
        compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      } bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 ${className}`}
    >
      <div className="flex items-center gap-1.5 shrink-0 text-indigo-500 dark:text-indigo-400">
        <Code className="w-3.5 h-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-wider select-none text-indigo-600/80 dark:text-indigo-400/80">
          {label || t('char.tower.formulaCode')}:
        </span>
      </div>

      <code className="flex-1 min-w-0 font-mono font-medium truncate select-all text-indigo-700 dark:text-indigo-300">
        {code}
      </code>

      <button
        type="button"
        onClick={handleCopy}
        title={copied ? t('common.copied') : t('common.copyFormula')}
        aria-label={copied ? t('common.copied') : t('common.copyFormula')}
        className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 transition-colors shrink-0 cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
