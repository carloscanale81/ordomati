import React from 'react';
import { Settings, Columns3, Layers, Check } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { SoccerConcept, SoccerDimensionalAnalysis } from '../../logic/soccerAnalysis';
import { MicroTargetChart } from './MicroTargetChart';

export interface SoccerPhaseStepperProps {
  activePhase: number; // 0: Config/Setup, 1: Segments, 2: Integral
  onSelectPhase: (phase: number) => void;
  analyses?: SoccerDimensionalAnalysis[];
  activeConcept?: SoccerConcept | null;
  onSelectConcept?: (concept: SoccerConcept) => void;
}

export const SoccerPhaseStepper: React.FC<SoccerPhaseStepperProps> = ({
  activePhase,
  onSelectPhase,
  analyses = [],
  activeConcept,
  onSelectConcept
}) => {
  const { t } = useI18n();

  const phases = [
    {
      index: 0,
      number: '01',
      title: t('soccer.stepper.config'),
      desc: t('soccer.stepper.configDesc'),
      icon: Settings
    },
    {
      index: 1,
      number: '02',
      title: t('soccer.stepper.segments'),
      desc: t('soccer.stepper.segmentsDesc'),
      icon: Columns3
    },
    {
      index: 2,
      number: '03',
      title: t('soccer.stepper.integral'),
      desc: t('soccer.stepper.integralDesc'),
      icon: Layers
    }
  ];

  return (
    <nav aria-label={t('soccer.stepper.title')} className="relative flex flex-col gap-1 select-none">
      {/* Background linking vertical track line */}
      <div className="absolute left-[23px] top-[28px] bottom-[28px] w-0.5 bg-gray-200 dark:bg-gray-800 -z-1" />

      {phases.map((phase) => {
        const isCurrent = activePhase === phase.index;
        const isCompleted = activePhase > phase.index;
        const Icon = phase.icon;

        return (
          <div key={phase.index} className="flex flex-col">
            <button
              type="button"
              onClick={() => onSelectPhase(phase.index)}
              className={`group flex items-start gap-4 p-3.5 rounded-2xl text-left transition-all duration-300 relative cursor-pointer ${
                isCurrent
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 shadow-xs border border-blue-200/60 dark:border-blue-800/60'
                  : 'hover:bg-gray-50/90 dark:hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              {/* Step Node Circle */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-all duration-300 z-10 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-100 dark:ring-blue-900/40 scale-105'
                    : isCompleted
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-2 ring-blue-200/50 dark:ring-blue-800/50'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 group-hover:border-gray-300 dark:group-hover:border-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300 shadow-2xs'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {t('nav.phase')} {phase.number}
                  </span>
                </div>
                <h4
                  className={`text-sm font-bold truncate transition-colors ${
                    isCurrent
                      ? 'text-blue-900 dark:text-blue-100'
                      : isCompleted
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                  }`}
                >
                  {phase.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-normal">
                  {phase.desc}
                </p>
              </div>
            </button>

            {/* Nested 12 Dimensions Direct Jump for Phase 02 (Segment Analysis) */}
            {phase.index === 1 && analyses.length > 0 && (
              <div className="ml-7 pl-1 my-2 flex flex-col gap-1.5 animate-in fade-in duration-300">
                {analyses.map((analysis) => {
                  const isConceptActive = activePhase === 1 && activeConcept === analysis.concept;
                  const charValues = analysis.VP && analysis.VP.length > 0 ? analysis.VP : [];
                  const hasData = charValues.length > 0 && charValues.some(v => typeof v === 'number' && !isNaN(v) && v > 0);

                  return (
                    <button
                      key={analysis.concept}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectConcept?.(analysis.concept);
                      }}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all text-left group cursor-pointer w-full ${
                        isConceptActive
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 font-medium'
                      }`}
                      title={analysis.conceptName}
                    >
                      <span className="truncate shrink-0 max-w-[48%]">
                        {analysis.conceptName}
                      </span>

                      {/* Micro summary chart occupies all the remaining width */}
                      <div className="flex-1 min-w-[36px] ml-2.5 h-4 flex items-center">
                        <MicroTargetChart
                          values={charValues}
                          hasData={hasData}
                          isActive={isConceptActive}
                          min={0}
                          max={1}
                          height={16}
                          responsive={true}
                          noDataTitle={t('char.pagination.noData')}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
