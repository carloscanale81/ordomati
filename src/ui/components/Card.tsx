import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface CardProps {
  title: React.ReactNode;
  icon?: LucideIcon;
  center?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon: Icon, center, action, children, className = '' }) => {
  const hasOverflow = className.includes('overflow-');
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-200 ${
        hasOverflow ? '' : 'overflow-hidden'
      } flex flex-col ${className}`}
    >
      <div className="relative bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between gap-3 min-h-[52px]">
        <div className={`flex items-center gap-2 z-10 min-w-0 ${center ? 'max-w-[42%] sm:max-w-[48%]' : ''}`}>
          {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />}
          <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">{title}</div>
        </div>

        {center && (
          <div className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none max-w-[38%]">
            <div className="pointer-events-auto truncate">{center}</div>
          </div>
        )}

        {action && <div className="z-10 shrink-0">{action}</div>}
      </div>
      {children != null && children !== false && (
        <div className="p-4 flex-1">{children}</div>
      )}
    </div>
  );
};
