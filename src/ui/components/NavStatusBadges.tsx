import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Construction, ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

const BULERIA_THESIS_URL =
  'https://buleria.unileon.es/entities/publication/1431d535-a1a1-4e2c-9254-6b85d7bfa1e8';

export const NavStatusBadges: React.FC = () => {
  const { t } = useI18n();

  const [academicPinned, setAcademicPinned] = useState(false);
  const [academicHover, setAcademicHover] = useState(false);
  const academicExpanded = academicPinned || academicHover;
  const academicRef = useRef<HTMLDivElement>(null);

  const [devPinned, setDevPinned] = useState(false);
  const [devHover, setDevHover] = useState(false);
  const devExpanded = devPinned || devHover;
  const devRef = useRef<HTMLDivElement>(null);

  // Close pinned badges when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (academicRef.current && !academicRef.current.contains(e.target as Node)) {
        setAcademicPinned(false);
      }
      if (devRef.current && !devRef.current.contains(e.target as Node)) {
        setDevPinned(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const handleAcademicClick = () => {
    setAcademicPinned(prev => !prev);
  };

  const handleDevClick = () => {
    setDevPinned(prev => !prev);
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Academic Thesis Badge */}
      <div
        ref={academicRef}
        onClick={handleAcademicClick}
        onMouseEnter={() => setAcademicHover(true)}
        onMouseLeave={() => {
          setAcademicHover(false);
        }}
        title={academicExpanded ? undefined : `${t('header.academicBadgePrefix')}${t('header.academicBadgeLink')}`}
        className={`group relative flex items-center h-8 rounded-full text-xs font-medium bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300 shadow-2xs select-none cursor-pointer transition-all duration-300 ease-in-out ${
          academicExpanded
            ? 'px-3 max-w-[340px] bg-indigo-100/90 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700'
            : 'w-8 px-0 justify-center hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40'
        }`}
      >
        <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />

        <div
          className={`flex items-center whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            academicExpanded ? 'max-w-xs opacity-100 ml-1.5' : 'max-w-0 opacity-0 ml-0'
          }`}
        >
          <span>{t('header.academicBadgePrefix')}</span>
          <a
            href={BULERIA_THESIS_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title={t('header.academicBadgeLink')}
            className="inline-flex items-center gap-0.5 ml-1 font-semibold underline decoration-indigo-400 dark:decoration-indigo-500 hover:text-indigo-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>{t('header.academicBadgeLink')}</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70 group-hover:opacity-100 shrink-0" />
          </a>
        </div>
      </div>

      {/* Under Construction Badge */}
      <div
        ref={devRef}
        onClick={handleDevClick}
        onMouseEnter={() => setDevHover(true)}
        onMouseLeave={() => {
          setDevHover(false);
        }}
        title={devExpanded ? undefined : t('header.underDevelopmentBadge')}
        className={`flex items-center h-8 rounded-full text-xs font-medium bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 shadow-2xs select-none cursor-pointer transition-all duration-300 ease-in-out ${
          devExpanded
            ? 'px-3 max-w-[280px] bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700'
            : 'w-8 px-0 justify-center hover:bg-amber-100/70 dark:hover:bg-amber-900/40'
        }`}
      >
        <Construction className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />

        <div
          className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
            devExpanded ? 'max-w-xs opacity-100 ml-1.5' : 'max-w-0 opacity-0 ml-0'
          }`}
        >
          <span>{t('header.underDevelopmentBadge')}</span>
        </div>
      </div>
    </div>
  );
};
