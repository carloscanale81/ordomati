import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Plus,
  Trash2,
  SlidersHorizontal,
  X,
  Eye,
  EyeOff,
  BarChart2,
  Network,
  Table,
  Camera,
  Power,
  Target,
  Layers,
  AlertTriangle,
  Search
} from 'lucide-react';
import { Card } from '../components/Card';
import { MatrixEditor } from '../components/MatrixEditor';
import { MatrixGraph } from '../components/MatrixGraph';
import { VectorBarChart } from '../components/VectorBarChart';
import { ValueFlowGraph } from '../components/ValueFlowGraph';
import { PropagationGraph } from '../components/PropagationGraph';
import { SynergyGraph } from '../components/SynergyGraph';
import { OrbBadge } from '../components/OrbBadge';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { MatrixCalculationPlayer } from '../components/MatrixCalculationPlayer';
import { MatrixCellCalculationPlayer } from '../components/MatrixCellCalculationPlayer';
import { MathText } from '../components/Formula';
import { MicroTargetChart } from '../components/MicroTargetChart';
import { DecimalInput } from '../components/DecimalInput';
import { FormulaCodeDisplay } from '../components/FormulaCodeDisplay';
import { invertMatrix, invertMatrixDetailed, createDefaultSampleMatrices } from '../../logic/affinity';
import { OrdomaticaDataset, ProcessedCharacteristic, Characteristic, AffinityEntryStage } from '../../logic/types';
import { useI18n } from '../i18n/I18nContext';


interface TowerStageTransitionProps {
  badgeLabel: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}

const TowerStageTransition: React.FC<TowerStageTransitionProps> = ({
  badgeLabel,
  disabled = false,
  children
}) => {
  const lineBg = disabled ? 'bg-gray-200 dark:bg-gray-800' : 'bg-indigo-300 dark:bg-indigo-600';
  const arrowColor = disabled ? 'text-gray-300 dark:text-gray-700' : 'text-indigo-600 dark:text-indigo-400';

  return (
    <div className="relative w-full py-6 sm:py-8 flex items-center">
      {/* Left Conduit Lane: contains descending line, intersection badge, horizontal connector, and terminal arrow */}
      <div className="w-16 sm:w-28 shrink-0 relative self-stretch flex flex-col items-center">
        {/* Top half of descending line (from matrix above down to intersection) */}
        <div className={`w-0.5 flex-1 ${lineBg} transition-colors -mt-px`} />

        {/* Intersection Anchor: Badge + Horizontal Connector to the function card */}
        <div className="relative z-10 flex items-center justify-center my-2 w-full">
          {/* Horizontal hook connector line branching from intersection to the function card on the right */}
          <div
            className={`absolute top-1/2 left-1/2 right-0 h-0.5 -translate-y-1/2 ${lineBg} transition-colors pointer-events-none z-0`}
          />

          {/* Formula Badge (no downward arrow inside, only the formula) */}
          <div
            className={`relative z-10 px-2.5 py-1 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all border shadow-2xs whitespace-nowrap ${
              disabled
                ? 'bg-gray-100 dark:bg-gray-850 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                : 'bg-indigo-50 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
            }`}
          >
            <span className="font-mono text-[10.5px] font-medium">
              {typeof badgeLabel === 'string' ? <MathText text={badgeLabel} /> : badgeLabel}
            </span>
          </div>
        </div>

        {/* Bottom half of descending line (from intersection down to matrix below) */}
        <div className={`w-0.5 flex-1 ${lineBg} transition-colors`} />

        {/* Downward Arrow Terminal: A crisp solid arrowhead seamlessly capping the descending line into the next matrix */}
        <div className="shrink-0 flex items-center justify-center -mt-px z-10">
          <svg
            viewBox="0 0 12 8"
            className={`w-3.5 h-2.5 fill-current ${arrowColor} transition-colors`}
            aria-hidden="true"
          >
            <polygon points="1,0 11,0 6,8" />
          </svg>
        </div>
      </div>

      {/* Function quadrant: narrower width, aligned to right */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};

export interface CharacteristicPhaseProps {
  dataset: OrdomaticaDataset;
  activeCharIdx: number;
  onSelectCharIdx: (idx: number) => void;
  processedChars: ProcessedCharacteristic[];
  onUpdateDataset: (updater: (prev: OrdomaticaDataset) => OrdomaticaDataset) => void;
}

type DetailPillar = 'vp' | 'ac' | 'vc' | null;

interface BlockingVectorInputProps {
  value: number;
  disabled?: boolean;
  onChange: (val: number) => void;
}

const BlockingVectorInput: React.FC<BlockingVectorInputProps> = ({ value, disabled, onChange }) => {
  const isFocusedRef = useRef(false);
  const [text, setText] = useState<string>(String(value ?? 0));

  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(String(value ?? 0));
    }
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={text}
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onChange={e => {
        const clean = e.target.value.replace(',', '.');
        if (!/^-?\d*\.?\d*$/.test(clean) && clean !== '') return;
        setText(clean);
        const parsed = parseFloat(clean);
        if (!isNaN(parsed)) {
          onChange(Math.max(0, Math.min(1, parsed)));
        } else if (clean.trim() === '') {
          onChange(0);
        }
      }}
      onBlur={() => {
        isFocusedRef.current = false;
        const clean = text.trim().replace(',', '.');
        const parsed = parseFloat(clean);
        const clamped = isNaN(parsed) ? 0 : Math.max(0, Math.min(1, parsed));
        setText(String(clamped));
        onChange(clamped);
      }}
      className="w-full p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-mono text-sm font-normal text-gray-800 dark:text-gray-100 text-center tabular-nums focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
    />
  );
};

export const CharacteristicPhase: React.FC<CharacteristicPhaseProps> = ({
  dataset,
  activeCharIdx,
  onSelectCharIdx,
  processedChars,
  onUpdateDataset
}) => {
  const { t } = useI18n();
  const { elements, characteristics } = dataset;
  const activeChar = characteristics[activeCharIdx] || characteristics[0];
  const activeCalc = processedChars[activeCharIdx] || processedChars[0];

  // State to control which pillar's detailed internal operations are visible above
  const [activeDetail, setActiveDetail] = useState<DetailPillar>(null);

  // Ref to detail container so that opening it scrolls smoothly to its top
  const detailContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDetail && detailContainerRef.current) {
      requestAnimationFrame(() => {
        detailContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [activeDetail]);

  // State to manage dimension image picker modal
  const [isPickingCharImage, setIsPickingCharImage] = useState(false);

  // Scroll & overflow management for dimension paginator buttons strip
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 2;
    setIsOverflowing(overflow);
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);
    window.addEventListener('resize', checkScroll);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, characteristics.length]);

  useEffect(() => {
    if (activeBtnRef.current && isOverflowing) {
      activeBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [activeCharIdx, isOverflowing]);

  const handleScrollBy = (offset: number) => {
    scrollContainerRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // State for toggling between tabular/numeric data and graphical representation per card
  const [cardModes, setCardModes] = useState<Record<string, 'data' | 'graph'>>({});

  const toggleCardMode = (key: string) => {
    setCardModes(prev => ({
      ...prev,
      [key]: prev[key] === 'graph' ? 'data' : 'graph'
    }));
  };

  const isGraphMode = (key: string) => cardModes[key] === 'graph';

  const renderModeToggle = (key: string, isMatrix: boolean) => {
    const inGraph = cardModes[key] === 'graph';
    return (
      <button
        type="button"
        onClick={() => toggleCardMode(key)}
        title={inGraph ? t('char.view.data') : t('char.view.graph')}
        aria-label={inGraph ? t('char.view.data') : t('char.view.graph')}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs border ${
          inGraph
            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {inGraph ? (
          <Table className="w-4 h-4" />
        ) : isMatrix ? (
          <Network className="w-4 h-4" />
        ) : (
          <BarChart2 className="w-4 h-4" />
        )}
      </button>
    );
  };

  const toggleDetail = (pillar: DetailPillar) => {
    setActiveDetail(prev => (prev === pillar ? null : pillar));
  };

  const updateActiveChar = <K extends keyof Characteristic>(field: K, val: Characteristic[K]) => {
    onUpdateDataset(prev => {
      const nextChars = [...prev.characteristics];
      nextChars[activeCharIdx] = { ...nextChars[activeCharIdx], [field]: val };
      return { ...prev, characteristics: nextChars };
    });
  };

  const updateActiveCharNested = (field: 'prop' | 'syn' | 'adj' | 'block', nestedField: string, val: any) => {
    onUpdateDataset(prev => {
      const nextChars = [...prev.characteristics];
      const baseField = (nextChars[activeCharIdx][field] as any) || (field === 'block' ? { type: 'standard' } : {});
      nextChars[activeCharIdx] = {
        ...nextChars[activeCharIdx],
        [field]: { ...baseField, [nestedField]: val }
      };
      return { ...prev, characteristics: nextChars };
    });
  };

  const updateActiveCharMultiple = (updates: Partial<Characteristic>) => {
    onUpdateDataset(prev => {
      const nextChars = [...prev.characteristics];
      nextChars[activeCharIdx] = { ...nextChars[activeCharIdx], ...updates };
      return { ...prev, characteristics: nextChars };
    });
  };

  // Confirmation modal state when switching calculation target if target already has values
  const [pendingCalcTarget, setPendingCalcTarget] = useState<'vp' | 'ac' | 'vc' | null>(null);

  // Dynamic scale calculation based on model inputs, excluding calculation target
  const dynamicScale = React.useMemo(() => {
    if (!activeChar) {
      return {
        hasData: false,
        min: 0,
        max: 100,
        sourceLabel: t('char.config.scaleSource.noData'),
        targetExcluded: ''
      };
    }
    const rawNums: number[] = [];
    if (activeChar.rawInputs && Array.isArray(activeChar.rawInputs)) {
      activeChar.rawInputs.forEach(inp => {
        if (typeof inp === 'string' && inp.trim().length > 0) {
          inp.split(';').forEach(tok => {
            const num = parseFloat(tok.trim());
            if (Number.isFinite(num)) rawNums.push(num);
          });
        }
      });
    }

    const currentCalcTarget = activeChar.calcTarget || 'vc';
    const pool: number[] = [];
    let sourceLabel = '';
    let targetExcluded = '';

    if (currentCalcTarget === 'vc') {
      targetExcluded = t('char.topConfig.target.vc');
      // Contextual Value is calculation target -> Excluded!
      // Inputs are Own Values (V^P) or raw numeric element inputs
      if (rawNums.length > 0) {
        pool.push(...rawNums);
        sourceLabel = `${t('char.config.scaleSource.raw')} (${rawNums.length})`;
      } else if (activeCalc && activeCalc.vp && activeCalc.vp.length > 0) {
        pool.push(...activeCalc.vp.filter(v => Number.isFinite(v)));
        sourceLabel = t('char.config.scaleSource.vp');
      }
    } else if (currentCalcTarget === 'vp') {
      targetExcluded = t('char.topConfig.target.vp');
      // Own Value is calculation target -> Excluded!
      // Inputs are Contextual Values (V^C) or raw inputs
      if (activeCalc && activeCalc.VC && activeCalc.VC.length > 0) {
        pool.push(...activeCalc.VC.filter(v => Number.isFinite(v)));
        sourceLabel = t('char.config.scaleSource.vc');
      } else if (rawNums.length > 0) {
        pool.push(...rawNums);
        sourceLabel = `${t('char.config.scaleSource.raw')} (${rawNums.length})`;
      }
    } else {
      targetExcluded = t('char.topConfig.target.ac');
      // Target is AC -> inputs can be raw numbers or VP
      if (rawNums.length > 0) {
        pool.push(...rawNums);
        sourceLabel = `${t('char.config.scaleSource.raw')} (${rawNums.length})`;
      } else if (activeCalc && activeCalc.vp && activeCalc.vp.length > 0) {
        pool.push(...activeCalc.vp.filter(v => Number.isFinite(v)));
        sourceLabel = t('char.config.scaleSource.vp');
      }
    }

    if (pool.length === 0) {
      return {
        hasData: false,
        min: activeChar.min ?? 0,
        max: activeChar.max ?? 100,
        sourceLabel: t('char.config.scaleSource.noData'),
        targetExcluded
      };
    }

    let minVal = Math.min(...pool);
    let maxVal = Math.max(...pool);
    if (minVal === maxVal) {
      maxVal = minVal + (minVal === 0 ? 1 : Math.abs(minVal) * 0.2);
    }

    return {
      hasData: true,
      min: minVal,
      max: maxVal,
      sourceLabel,
      targetExcluded
    };
  }, [activeChar?.rawInputs, activeCalc, activeChar?.calcTarget, activeChar?.min, activeChar?.max, t]);

  // Synchronize dynamic bounds with characteristic when minMode or maxMode is dynamic
  const isMinDyn = activeChar ? (activeChar.minMode === 'dynamic' || (activeChar.scaleMode === 'dynamic' && activeChar.minMode !== 'manual')) : false;
  const isMaxDyn = activeChar ? (activeChar.maxMode === 'dynamic' || (activeChar.scaleMode === 'dynamic' && activeChar.maxMode !== 'manual')) : false;

  useEffect(() => {
    if (activeChar && dynamicScale.hasData && (isMinDyn || isMaxDyn)) {
      const needsMinUpdate = isMinDyn && activeChar.min !== dynamicScale.min;
      const needsMaxUpdate = isMaxDyn && activeChar.max !== dynamicScale.max;

      if (needsMinUpdate || needsMaxUpdate) {
        onUpdateDataset(prev => {
          const nextChars = [...prev.characteristics];
          if (!nextChars[activeCharIdx]) return prev;
          const curr = { ...nextChars[activeCharIdx] };
          if (needsMinUpdate) curr.min = dynamicScale.min;
          if (needsMaxUpdate) curr.max = dynamicScale.max;
          nextChars[activeCharIdx] = curr;
          return { ...prev, characteristics: nextChars };
        });
      }
    }
  }, [isMinDyn, isMaxDyn, dynamicScale.hasData, dynamicScale.min, dynamicScale.max, activeChar?.min, activeChar?.max, activeCharIdx, onUpdateDataset]);

  if (!activeChar || !activeCalc || characteristics.length === 0 || elements.length === 0) {
    return (
      <div className="w-full py-12 px-6 rounded-2xl bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 text-center space-y-2">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('char.emptyTitle')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('char.emptyHelp')}
        </p>
      </div>
    );
  }

  // Contextual Affinity calculation stage & direct entry point
  const entryStage: AffinityEntryStage = activeChar.affinityEntryStage || 'd';
  const isDDisabled = entryStage !== 'd';
  const isFpDisabled = entryStage !== 'd';
  const isADisabled = ['aa', 'ac'].includes(entryStage);
  const isVbDisabled = ['aa', 'ac'].includes(entryStage);
  const isAADisabled = entryStage === 'ac';
  const isFsDisabled = entryStage === 'ac';

  const isDEditable = entryStage === 'd';
  const isAEditable = entryStage === 'a';
  const isAAEditable = entryStage === 'aa';
  const isACEditable = entryStage === 'ac';

  const toggleFunctionStage = (stage: 'fp' | 'vb' | 'fs') => {
    if (stage === 'fp') {
      if (entryStage === 'd') {
        // Disabling F_P: disables everything above (D and F_P); next matrix A becomes editable
        updateActiveCharMultiple({
          affinityEntryStage: 'a',
          customA: (activeChar.customA && activeChar.customA.length === elements.length)
            ? activeChar.customA
            : activeCalc.A.map(r => [...r])
        });
      } else {
        // Enabling F_P: re-enables D and F_P; D becomes editable
        updateActiveCharMultiple({ affinityEntryStage: 'd' });
      }
    } else if (stage === 'vb') {
      if (!isVbDisabled) {
        // Disabling V^B: disables everything above (D, F_P, A, V^B); next matrix AA becomes editable
        updateActiveCharMultiple({
          affinityEntryStage: 'aa',
          customAA: (activeChar.customAA && activeChar.customAA.length === elements.length)
            ? activeChar.customAA
            : activeCalc.AA.map(r => [...r])
        });
      } else {
        // Enabling V^B: re-enables V^B and matrix A
        updateActiveCharMultiple({
          affinityEntryStage: 'a',
          customA: (activeChar.customA && activeChar.customA.length === elements.length)
            ? activeChar.customA
            : activeCalc.A.map(r => [...r])
        });
      }
    } else if (stage === 'fs') {
      if (!isFsDisabled) {
        // Disabling F_S: disables everything above (D, F_P, A, V^B, AA, F_S); next matrix AC becomes editable
        updateActiveCharMultiple({
          affinityEntryStage: 'ac',
          customAC: (activeChar.customAC && activeChar.customAC.length === elements.length)
            ? activeChar.customAC
            : activeCalc.AC.map(r => [...r])
        });
      } else {
        // Enabling F_S: re-enables F_S and matrix AA
        updateActiveCharMultiple({
          affinityEntryStage: 'aa',
          customAA: (activeChar.customAA && activeChar.customAA.length === elements.length)
            ? activeChar.customAA
            : activeCalc.AA.map(r => [...r])
        });
      }
    }
  };

  const renderMatrixStageAction = (
    modeKey: string
  ) => {
    return (
      <div className="flex items-center gap-1.5">
        {renderModeToggle(modeKey, true)}
      </div>
    );
  };

  const renderFunctionStageAction = (
    stage: 'fp' | 'vb' | 'fs',
    isDisabled: boolean,
    extraAction?: React.ReactNode
  ) => {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => toggleFunctionStage(stage)}
          title={
            isDisabled
              ? t('char.tower.funcDisabledTitle')
              : t('char.tower.funcEnabledTitle')
          }
          aria-label={
            isDisabled
              ? t('char.tower.funcDisabledLabel')
              : t('char.tower.funcEnabledLabel')
          }
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xs border ${
            isDisabled
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-red-50 hover:text-red-500 hover:border-red-300 dark:hover:bg-red-950/40'
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
        {extraAction}
      </div>
    );
  };

  const precision = dataset.decimalPrecision ?? 2;

  // Data availability checks for calculation scope based on algorithm rules
  const hasInputs = Boolean(
    activeChar.rawInputs &&
    activeChar.rawInputs.some(inp => typeof inp === 'string' && inp.trim().length > 0)
  );

  const hasDistances = Boolean(
    activeChar.d &&
    activeChar.d.some((row, i) =>
      row.some((val, j) => i !== j && typeof val === 'number' && Number.isFinite(val) && val > 0)
    )
  );

  const isVpAvailable = hasInputs;
  const isAcAvailable = hasDistances || entryStage !== 'd';
  const isVcAvailable = hasInputs && (hasDistances || entryStage !== 'd');
  const currentCalcTarget = activeChar.calcTarget || 'vc';
  const currentTargetValue = activeChar.adj?.targetValue || (activeChar.calcTarget === 'vp' ? 'vp' : 'vc');

  // Confirmation modal state when switching calculation target if target already has values
  const checkTargetHasValues = (tgt: 'vp' | 'ac' | 'vc') => {
    if (tgt === 'vp') {
      return Boolean(activeCalc?.vp && activeCalc.vp.some(v => typeof v === 'number' && Number.isFinite(v) && v > 0));
    }
    if (tgt === 'ac') {
      return Boolean(activeCalc?.AC && activeCalc.AC.some((r, i) => r.some((v, j) => i !== j && typeof v === 'number' && Number.isFinite(v) && v > 0)));
    }
    if (tgt === 'vc') {
      return Boolean(activeCalc?.VC && activeCalc.VC.some(v => typeof v === 'number' && Number.isFinite(v) && v > 0));
    }
    return false;
  };

  const handleSelectCalcTarget = (tgtId: 'vp' | 'ac' | 'vc') => {
    if (tgtId === 'ac') return; // Not supported: requires complex data inputs
    if (tgtId === currentCalcTarget) return;

    if (checkTargetHasValues(tgtId) || checkTargetHasValues(currentCalcTarget)) {
      setPendingCalcTarget(tgtId);
    } else {
      updateActiveChar('calcTarget', tgtId);
    }
  };

  const confirmChangeCalcTarget = () => {
    if (pendingCalcTarget) {
      updateActiveChar('calcTarget', pendingCalcTarget);
      setPendingCalcTarget(null);
    }
  };

  const renderCardPillarAction = (pillar: 'vp' | 'ac' | 'vc', modeKey: string, isMatrix: boolean) => {
    const isTarget = currentCalcTarget === pillar;
    const isBase = currentTargetValue === pillar;

    return (
      <div className="flex items-center gap-1.5">
        {/* Calculation Target Icon */}
        {isTarget && (
          <div
            title={t('char.topConfig.targetTitle')}
            aria-label={t('char.topConfig.targetTitle')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-2xs border ${
              pillar === 'vp'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : pillar === 'ac'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
        )}

        {/* Aggregation Base Icon */}
        {isBase && (
          <div
            title={t('char.targetAdj.badgeSelected')}
            aria-label={t('char.targetAdj.badgeSelected')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-2xs border bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          >
            <Layers className="w-4 h-4" />
          </div>
        )}

        {/* View Mode Toggle Button */}
        {renderModeToggle(modeKey, isMatrix)}
      </div>
    );
  };

  const calcTargets = [
    {
      id: 'vp' as const,
      title: t('char.topConfig.target.vp'),
      desc: t('char.topConfig.target.vpDesc'),
      available: isVpAvailable,
      isUnsupported: false,
      unavailReason: t('char.topConfig.status.requiresInputs')
    },
    {
      id: 'ac' as const,
      title: t('char.topConfig.target.ac'),
      desc: t('char.topConfig.target.acDesc'),
      available: false,
      isUnsupported: true,
      unavailReason: t('char.topConfig.status.unsupported')
    },
    {
      id: 'vc' as const,
      title: t('char.topConfig.target.vc'),
      desc: t('char.topConfig.target.vcDesc'),
      available: isVcAvailable,
      isUnsupported: false,
      unavailReason: t('char.topConfig.status.requiresBoth')
    }
  ];

  const renderDeviationBadges = (
    devAbs: number,
    devRel: number | null,
    isDevPos: boolean,
    isDevNeg: boolean,
    targetLabel: string,
    baseLabel: string
  ) => (
    <div className="flex flex-col items-end gap-0.5 shrink-0">
      {/* Absolute Deviation Badge */}
      <span
        className={`text-[10px] leading-tight font-mono px-1.5 py-0.5 rounded font-semibold tabular-nums ${
          isDevPos
            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
            : isDevNeg
            ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}
        title={t('char.deviation.absTitle', { target: targetLabel, base: baseLabel })}
      >
        Δ {devAbs >= 0 ? `+${devAbs.toFixed(precision)}` : devAbs.toFixed(precision)}
      </span>

      {/* Relative Deviation Badge */}
      <span
        className={`text-[10px] leading-tight font-mono px-1.5 py-0.5 rounded font-semibold tabular-nums ${
          isDevPos
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            : isDevNeg
            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
            : 'bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
        }`}
        title={t('char.deviation.relTitle', { base: baseLabel })}
      >
        {devRel !== null ? (devRel >= 0 ? `+${devRel.toFixed(2)}%` : `${devRel.toFixed(2)}%`) : 'N/A'}
      </span>
    </div>
  );

  const renderDataIntegrationCard = (targetType: 'vp' | 'vc' | 'val') => {
    const isVal = targetType === 'val';
    const isVP = targetType === 'vp';
    const cardTitle = isVal
      ? t('char.adjustmentCard.title')
      : isVP
      ? t('char.inputs.title')
      : t('char.inputs.vcTitle');
    const cardHelp = isVal
      ? t('char.adjustmentCard.help')
      : isVP
      ? t('char.inputs.help')
      : t('char.inputs.vcHelp');
    const badgeColor = isVal ? 'amber' : isVP ? 'blue' : 'emerald';

    return (
      <div className="w-full">
        <Card
          title={<MathText text={cardTitle} />}
          action={isVal ? renderModeToggle('adj-val', false) : undefined}
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{cardHelp}</p>
          {isVal && isGraphMode('adj-val') ? (
            <div className="py-2">
              <VectorBarChart elements={elements} values={activeCalc.vp} color="blue" elementImages={dataset.elementImages} decimalPrecision={precision} />
            </div>
          ) : (
            <div className="space-y-4">
              {elements.map((el, i) => {
                const rawVal = activeChar.rawInputs ? activeChar.rawInputs[i] || '' : '';
                const tokens = rawVal ? rawVal.split(';') : [''];
                const calcTokens = activeCalc.parsedInputs[i]?.tokens || [];
                const displayVal = isVP || isVal
                  ? (activeCalc.vp[i] ?? 0).toFixed(precision)
                  : (activeCalc.VC[i] ?? 0).toFixed(precision);

                return (
                  <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 dark:bg-gray-800/80 px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <OrbBadge
                          name={el}
                          image={dataset.elementImages?.[i]}
                          size="xs"
                          color={badgeColor}
                        />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{el}</span>
                      </div>
                      <span className="font-mono text-sm font-normal text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-md tabular-nums">
                        {displayVal}
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-900 space-y-3">
                      {tokens.map((tok, tIdx) => (
                        <div key={tIdx} className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={tok}
                              onChange={e => {
                                const newTokens = [...tokens];
                                newTokens[tIdx] = e.target.value;
                                const newRaw = [...(activeChar.rawInputs || Array(elements.length).fill(''))];
                                newRaw[i] = newTokens.join(';');
                                updateActiveChar('rawInputs', newRaw);
                              }}
                              placeholder={t('char.inputs.placeholder')}
                              className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                              onClick={() => {
                                const newTokens = [...tokens];
                                newTokens.splice(tIdx, 1);
                                const newRaw = [...(activeChar.rawInputs || Array(elements.length).fill(''))];
                                newRaw[i] = newTokens.join(';');
                                updateActiveChar('rawInputs', newRaw);
                              }}
                              className="px-2 text-gray-400 hover:text-red-500 transition-colors"
                              title={t('char.inputs.deleteValue')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {calcTokens[tIdx] && calcTokens[tIdx].trace !== 'Empty' && (
                            <div
                              className={`text-xs p-1.5 rounded border font-mono ml-2 ${
                                calcTokens[tIdx].valid
                                  ? 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/40'
                              }`}
                            >
                              ↳ {calcTokens[tIdx].traceKey ? t(calcTokens[tIdx].traceKey as any, calcTokens[tIdx].traceParams) : calcTokens[tIdx].trace}
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newRaw = [...(activeChar.rawInputs || Array(elements.length).fill(''))];
                          newRaw[i] = newRaw[i] ? newRaw[i] + ';' : ';';
                          updateActiveChar('rawInputs', newRaw);
                        }}
                        className={`flex items-center justify-center w-full gap-1.5 text-xs font-medium py-2 px-3 rounded-lg border border-dashed transition-colors cursor-pointer mt-2 ${
                          isVal
                            ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                            : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" /> {t('char.inputs.addValue')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderMatrixCalculationDetail = (targetType: 'vc' | 'vp') => {
    const isVC = targetType === 'vc';
    const sourceVectorName = isVC ? 'V^P' : 'V^C';
    const sourceVector = isVC ? activeCalc.vp : activeCalc.VC;
    const targetVectorName = isVC ? 'V^C' : 'V^P';
    const targetVector = isVC ? activeCalc.VC : activeCalc.vp;

    const invRes = !isVC ? invertMatrixDetailed(activeCalc.AC) : null;
    const isQuasiInverse = !isVC ? Boolean(invRes?.isQuasiInverse) : false;
    const matrix = isVC ? activeCalc.AC : (invRes?.matrix || activeCalc.AC);
    const matrixName = isVC ? 'A^C' : isQuasiInverse ? '(A^C)⁺' : '(A^C)⁻¹';
    const themeColor: 'emerald' | 'blue' = isVC ? 'emerald' : 'blue';

    return (
      <div className="w-full">
        {/* Animated Step-by-Step Matrix Calculation Player */}
        <MatrixCalculationPlayer
          elements={elements}
          elementImages={dataset.elementImages}
          sourceVectorName={sourceVectorName}
          sourceVector={sourceVector}
          matrixName={matrixName}
          matrix={matrix}
          targetVectorName={targetVectorName}
          targetVector={targetVector}
          decimalPrecision={precision}
          themeColor={themeColor}
          isQuasiInverse={isQuasiInverse}
        />
      </div>
    );
  };

  const renderAcSamplingCalculationDetail = () => {
    const n = elements.length;
    const defaultSamples = createDefaultSampleMatrices(n, activeCalc.vp, activeCalc.AC);
    const sampleVP = (activeChar.sampleVP && activeChar.sampleVP.length === n)
      ? activeChar.sampleVP
      : (activeCalc.sampleVP || defaultSamples.sampleVP);
    const sampleVC = (activeChar.sampleVC && activeChar.sampleVC.length === n)
      ? activeChar.sampleVC
      : (activeCalc.sampleVC || defaultSamples.sampleVC);
    const invSampleVP = activeCalc.invSampleVP || invertMatrixDetailed(sampleVP).matrix;
    const isQuasiInverse = Boolean(activeCalc.isSampleQuasiInverse);

    const sampleHeaders = Array.from({ length: n }, (_, i) => `M${i + 1}`);

    const handleUpdateSampleVP = (i: number, j: number, val: number | null) => {
      const nextVP = sampleVP.map(r => [...r]);
      nextVP[i][j] = val ?? 0;
      updateActiveChar('sampleVP', nextVP);
    };

    const handleUpdateSampleVC = (i: number, j: number, val: number | null) => {
      const nextVC = sampleVC.map(r => [...r]);
      nextVC[i][j] = val ?? 0;
      updateActiveChar('sampleVC', nextVC);
    };

    const handleResetSamples = () => {
      const defaults = createDefaultSampleMatrices(n, activeCalc.vp, activeCalc.AC);
      onUpdateDataset(prev => {
        const nextChars = [...prev.characteristics];
        nextChars[activeCharIdx] = {
          ...nextChars[activeCharIdx],
          sampleVP: defaults.sampleVP,
          sampleVC: defaults.sampleVC
        };
        return { ...prev, characteristics: nextChars };
      });
    };

    return (
      <div className="w-full space-y-6">
        {/* Animated Step-by-Step Matrix-by-Matrix Calculation Player */}
        <MatrixCellCalculationPlayer
          elements={elements}
          elementImages={dataset.elementImages}
          sampleVP={sampleVP}
          sampleVC={sampleVC}
          invSampleVP={invSampleVP}
          AC={activeCalc.AC}
          decimalPrecision={precision}
          themeColor="indigo"
          isQuasiInverse={isQuasiInverse}
        />

        {/* Configuration and inspection of Linearly Independent Sampling Profiles */}
        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                <MathText text={t('char.sampling.title')} />
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <MathText text={t('char.sampling.subtitle')} />
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSamples}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer self-start sm:self-auto"
            >
              {t('char.sampling.resetBtn')}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Sample Matrix VP */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <span><MathText text={t('char.sampling.vpCardTitle')} /></span>
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    isQuasiInverse
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                  }`}>
                    {isQuasiInverse ? t('char.sampling.quasiRequired') : t('char.sampling.linearIndep')}
                  </span>
                </div>
              }
            >
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <MathText text={t('char.sampling.vpCardDesc')} />
                </p>
                <MatrixEditor
                  data={sampleVP}
                  rows={elements}
                  cols={sampleHeaders}
                  readOnly={false}
                  decimalPrecision={precision}
                  onChange={handleUpdateSampleVP}
                />
              </div>
            </Card>

            {/* Sample Matrix VC */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <span><MathText text={t('char.sampling.vcCardTitle')} /></span>
                </div>
              }
            >
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <MathText text={t('char.sampling.vcCardDesc')} />
                </p>
                <MatrixEditor
                  data={sampleVC}
                  rows={elements}
                  cols={sampleHeaders}
                  readOnly={false}
                  decimalPrecision={precision}
                  onChange={handleUpdateSampleVC}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 w-full space-y-6">
      {/* Dimension Paginator: Horizontal row of pill buttons with conditional scroll arrows */}
      <div className="w-full flex items-center justify-center gap-2 mb-4 relative">
        {/* Left Scroll Arrow - only shown if buttons overflow available width */}
        {isOverflowing && (
          <button
            type="button"
            onClick={() => handleScrollBy(-220)}
            disabled={!canScrollLeft}
            title={t('char.pagination.prev')}
            aria-label={t('char.pagination.prev')}
            className="shrink-0 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Buttons Row */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 max-w-full"
        >
          {characteristics.map((char, idx) => {
            const isActive = idx === activeCharIdx;
            const proc = processedChars[idx];
            const charHasInputs = Boolean(
              char?.rawInputs &&
              char.rawInputs.some(inp => typeof inp === 'string' && inp.trim().length > 0)
            );
            const charHasDistances = Boolean(
              char?.d &&
              char.d.some((row, i) =>
                row.some((val, j) => i !== j && typeof val === 'number' && Number.isFinite(val) && val > 0)
              )
            );
            const charTarget = char?.calcTarget || 'vc';
            const charEntryStage = char?.affinityEntryStage || 'd';
            const isAdjustment = char?.type === 'adjustment';
            const charTargetAvailable =
              isAdjustment
                ? charHasInputs
                : charTarget === 'vp'
                ? charHasInputs
                : charTarget === 'ac'
                ? (charHasDistances || charEntryStage !== 'd')
                : (charHasInputs && (charHasDistances || charEntryStage !== 'd'));

            const isQualOrQuant = char?.type === 'quantitative' || char?.type === 'qualitative';
            const targetValues = proc?.vp && proc.vp.length > 0 ? proc.vp : (proc?.VCRN || []);
            const hasTargetData =
              charTargetAvailable &&
              targetValues.length > 0 &&
              targetValues.some(v => typeof v === 'number' && !isNaN(v));

            const minVal = char.min ?? 0;
            const maxVal = char.max ?? (char.type === 'qualitative' ? 1 : 100);

            return (
              <button
                key={char.id ?? idx}
                ref={isActive ? activeBtnRef : null}
                type="button"
                onClick={() => onSelectCharIdx(idx)}
                title={char.name}
                aria-label={char.name}
                className={`group shrink-0 px-3.5 py-1.5 rounded-full border shadow-sm flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/25 text-gray-900 dark:text-gray-100 shadow-md'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <OrbBadge
                  name={char.name}
                  image={char.image}
                  size="xs"
                  isDimension={true}
                />

                {isQualOrQuant ? (
                  <MicroTargetChart
                    values={targetValues}
                    hasData={hasTargetData}
                    isActive={isActive}
                    min={minVal}
                    max={maxVal}
                    width={48}
                    height={22}
                    noDataTitle={t('char.pagination.noData')}
                  />
                ) : (
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {char.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow - only shown if buttons overflow available width */}
        {isOverflowing && (
          <button
            type="button"
            onClick={() => handleScrollBy(220)}
            disabled={!canScrollRight}
            title={t('char.pagination.next')}
            aria-label={t('char.pagination.next')}
            className="shrink-0 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* TOP FULL-WIDTH CONFIGURATION & SCOPE CARD */}
      <Card title={t('char.topConfig.title')} className="w-full shadow-sm border-gray-200 dark:border-gray-800">
        <div className="space-y-6">
          {/* Dimension Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            {/* Dimension Name and Image */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {t('char.topConfig.name')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPickingCharImage(true)}
                  title={t('char.config.imageTitle')}
                  className="relative group/dim shrink-0 cursor-pointer"
                >
                  <OrbBadge
                    name={activeChar.name}
                    image={activeChar.image}
                    size="md"
                    isDimension={true}
                  />
                  <div className="absolute inset-0 rounded-xl bg-black/45 opacity-0 group-hover/dim:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </button>
                <input
                  type="text"
                  value={activeChar.name}
                  onChange={e => updateActiveChar('name', e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Type */}
            <div className="sm:col-span-1 lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {t('char.config.type')}
              </label>
              <select
                value={activeChar.type}
                onChange={e => updateActiveChar('type', e.target.value as any)}
                className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="quantitative">{t('char.config.type.quantitative')}</option>
                <option value="qualitative">{t('char.config.type.qualitative')}</option>
                <option value="adjustment">{t('char.config.type.adjustment')}</option>
              </select>
            </div>

            {/* Granularity & Min/Max/Semantics: only for quantitative or qualitative */}
            {activeChar.type !== 'adjustment' && (
              <>
                {/* Granularity */}
                <div className="sm:col-span-1 lg:col-span-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    {t('char.config.granularity')}
                  </label>
                  <select
                    value={activeChar.g ?? 5}
                    onChange={e => updateActiveChar('g', parseInt(e.target.value))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={3}>3 (B, M, A)</option>
                    <option value={5}>5 (MB, B, M, A, MA)</option>
                    <option value={7}>7 (N, MB, B, M, A, MA, P)</option>
                  </select>
                </div>

                {/* Scale Min / Max or Semantics */}
                {activeChar.type === 'quantitative' ? (
                  <>
                    {/* Minimum */}
                    <div className="sm:col-span-1 lg:col-span-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('char.config.min')}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextMinMode = isMinDyn ? 'manual' : 'dynamic';
                            onUpdateDataset(prev => {
                              const nextChars = [...prev.characteristics];
                              const curr = { ...nextChars[activeCharIdx] };
                              curr.minMode = nextMinMode;
                              if (nextMinMode === 'dynamic' && dynamicScale.hasData) {
                                curr.min = dynamicScale.min;
                              }
                              nextChars[activeCharIdx] = curr;
                              return { ...prev, characteristics: nextChars };
                            });
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors font-medium ${
                            isMinDyn
                              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                          title={isMinDyn ? t('char.config.switchMinToManual') : t('char.config.switchMinToDynamic')}
                        >
                          {isMinDyn ? t('char.config.dynamic') : t('char.config.manual')}
                        </button>
                      </div>
                      {isMinDyn ? (
                        <input
                          type="text"
                          readOnly
                          value={dynamicScale.hasData ? `${dynamicScale.min.toFixed(2)} (Auto)` : 'Auto (0)'}
                          className="w-full p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 rounded-lg text-sm font-mono cursor-default"
                          title={t('char.config.dynamicMinTooltip')}
                        />
                      ) : (
                        <DecimalInput
                          value={activeChar.min ?? 0}
                          onChange={val => updateActiveChar('min', val)}
                          className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      )}
                    </div>

                    {/* Maximum */}
                    <div className="sm:col-span-1 lg:col-span-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('char.config.max')}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextMaxMode = isMaxDyn ? 'manual' : 'dynamic';
                            onUpdateDataset(prev => {
                              const nextChars = [...prev.characteristics];
                              const curr = { ...nextChars[activeCharIdx] };
                              curr.maxMode = nextMaxMode;
                              if (nextMaxMode === 'dynamic' && dynamicScale.hasData) {
                                curr.max = dynamicScale.max;
                              }
                              nextChars[activeCharIdx] = curr;
                              return { ...prev, characteristics: nextChars };
                            });
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors font-medium ${
                            isMaxDyn
                              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                          }`}
                          title={isMaxDyn ? t('char.config.switchMaxToManual') : t('char.config.switchMaxToDynamic')}
                        >
                          {isMaxDyn ? t('char.config.dynamic') : t('char.config.manual')}
                        </button>
                      </div>
                      {isMaxDyn ? (
                        <input
                          type="text"
                          readOnly
                          value={dynamicScale.hasData ? `${dynamicScale.max.toFixed(2)} (Auto)` : 'Auto (100)'}
                          className="w-full p-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 rounded-lg text-sm font-mono cursor-default"
                          title={t('char.config.dynamicMaxTooltip')}
                        />
                      ) : (
                        <DecimalInput
                          value={activeChar.max ?? 100}
                          onChange={val => updateActiveChar('max', val)}
                          className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      {t('char.config.semantics')}
                    </label>
                    <select
                      value={activeChar.sem ?? 'core'}
                      onChange={e => updateActiveChar('sem', e.target.value as any)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="core">{t('char.config.semantics.core')}</option>
                      <option value="support">{t('char.config.semantics.support')}</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Calculation Target Parameter based on data availability and algorithm rules: hidden for adjustment */}
          {activeChar.type !== 'adjustment' && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="mb-3">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('char.topConfig.targetTitle')}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('char.topConfig.targetSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calcTargets.map(tgt => {
                const isSelected = currentCalcTarget === tgt.id;
                const isUnsupported = Boolean(tgt.isUnsupported);
                return (
                  <button
                    key={tgt.id}
                    type="button"
                    disabled={isUnsupported}
                    onClick={() => handleSelectCalcTarget(tgt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                        : isUnsupported
                        ? 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 opacity-80 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50/80 dark:hover:bg-gray-750 cursor-pointer shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{tgt.title}</span>
                        {isUnsupported && (
                          <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            {t('char.topConfig.status.unsupportedBadge')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {tgt.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-750 flex items-center justify-between text-[11px]">
                      {isUnsupported ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {tgt.unavailReason}
                        </span>
                      ) : tgt.available ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {t('char.topConfig.status.available')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {tgt.unavailReason}
                        </span>
                      )}

                      {isSelected && (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </Card>

      {/* --- DETAIL CONTAINER (APPEARS ABOVE SPANNING FULL WIDTH WHEN TOGGLED) --- */}
      {activeChar.type !== 'adjustment' && activeDetail && (
        <div
          ref={detailContainerRef}
          className={`w-full rounded-3xl p-6 shadow-md transition-all duration-300 relative animate-in fade-in zoom-in-98 scroll-mt-24 ${
            activeDetail === 'vp'
              ? 'border-2 border-blue-500 bg-blue-50/20'
              : activeDetail === 'ac'
              ? 'border-2 border-indigo-500 bg-indigo-50/20'
              : 'border-2 border-emerald-500 bg-emerald-50/20'
          }`}
        >
          {/* Header of the Detail Container */}
          <div className="flex items-center justify-between pb-3.5 mb-6 border-b border-gray-200/80 dark:border-gray-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${
                  activeDetail === 'vp'
                    ? 'bg-blue-600'
                    : activeDetail === 'ac'
                    ? 'bg-indigo-600'
                    : 'bg-emerald-600'
                }`}
              />
              <h3 className="font-bold text-base tracking-tight truncate">
                <span
                  className={`font-black ${
                    activeDetail === 'vp'
                      ? 'text-blue-700 dark:text-blue-400'
                      : activeDetail === 'ac'
                      ? 'text-indigo-700 dark:text-indigo-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {activeDetail === 'vp' && (currentCalcTarget === 'vp' ? <MathText text={t('char.detail.vpInverseHeader')} /> : t('char.summary.vpTitle'))}
                  {activeDetail === 'ac' && (currentCalcTarget === 'ac' ? <MathText text={t('char.detail.acSamplingHeader')} /> : t('char.summary.acTitle'))}
                  {activeDetail === 'vc' && (currentCalcTarget === 'vp' ? <MathText text={t('char.detail.vcInputsHeader')} /> : t('char.summary.vcTitle'))}
                </span>
              </h3>
            </div>

            <button
              onClick={() => setActiveDetail(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
              <span>{t('char.detail.close')}</span>
            </button>
          </div>

          {/* DETAIL CONTENT: PILLAR 1 - VALOR PROPIO (V^P) */}
          {activeDetail === 'vp' && (
            currentCalcTarget === 'vp'
              ? renderMatrixCalculationDetail('vp')
              : renderDataIntegrationCard('vp')
          )}

          {/* DETAIL CONTENT: PILLAR 2 - AFINIDAD CONTEXTUAL (A^C) */}
          {activeDetail === 'ac' && (
            currentCalcTarget === 'ac' ? (
              renderAcSamplingCalculationDetail()
            ) : (
              <div className="flex flex-col space-y-0 w-full max-w-4xl mx-auto">
              {/* 1. Distance Matrix (D) */}
              <Card
                title={
                  <div className="flex items-center gap-2.5">
                    <span>{t('char.tower.distanceMatrix')}</span>
                    {!hasDistances && !isDDisabled && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        {t('char.tower.noDataBadge')}
                      </span>
                    )}
                    {isDDisabled && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                        {t('char.tower.disabledBadge')}
                      </span>
                    )}
                    {isDEditable && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                        {t('char.tower.directInput')}
                      </span>
                    )}
                  </div>
                }
                action={renderMatrixStageAction('det-dist')}
                className={`transition-all duration-200 ${
                  isDDisabled ? 'opacity-55 grayscale-[35%] bg-gray-50/70 dark:bg-gray-950/40 border-dashed border-gray-300 dark:border-gray-700' : ''
                }`}
              >
                <div className={isDDisabled ? 'pointer-events-none select-none opacity-80' : ''}>
                  {isGraphMode('det-dist') ? (
                    <MatrixGraph
                      elements={elements}
                      elementImages={dataset.elementImages}
                      matrix={activeChar.d}
                      theme="blue"
                      decimalPrecision={precision}
                    />
                  ) : (
                    <MatrixEditor
                      data={activeChar.d}
                      rows={elements}
                      cols={elements}
                      readOnly={!isDEditable}
                      decimalPrecision={precision}
                      onChange={isDEditable ? (i, j, val) => {
                        const newD = activeChar.d.map(r => [...r]);
                        newD[i][j] = val;
                        updateActiveChar('d', newD);
                      } : undefined}
                    />
                  )}
                </div>
              </Card>

              {/* 2. Propagation Function (F_P) hooked into left descending conduit */}
              <TowerStageTransition
                badgeLabel="F_P(D) = A"
                disabled={isDDisabled || isFpDisabled}
              >
                <Card
                  title={
                    <div className="flex items-center gap-2.5">
                      <span>{t('char.tower.propagationFunction')}</span>
                      {isFpDisabled && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                          {t('char.tower.disabledBadge')}
                        </span>
                      )}
                    </div>
                  }
                  action={renderFunctionStageAction('fp', isFpDisabled)}
                  className={`transition-all duration-200 ${
                    isFpDisabled ? 'opacity-55 grayscale-[35%] bg-gray-50/70 dark:bg-gray-950/40 border-dashed border-gray-300 dark:border-gray-700' : ''
                  }`}
                >
                  <div className={isFpDisabled ? 'pointer-events-none select-none opacity-80' : ''}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                            {t('char.tower.function')}
                          </label>
                          <select
                            disabled={isFpDisabled}
                            value={activeChar.prop.type}
                            onChange={e => updateActiveCharNested('prop', 'type', e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                          >
                            <option value="inhibited">{t('char.tower.prop.inhibited')}</option>
                            <option value="triangular">{t('char.tower.prop.triangular')}</option>
                            <option value="rectangular">{t('char.tower.prop.rectangular')}</option>
                            <option value="trapezoidal">{t('char.tower.prop.trapezoidal')}</option>
                            <option value="sinusoidal">{t('char.tower.prop.sinusoidal')}</option>
                            <option value="custom">{t('char.tower.prop.custom')}</option>
                          </select>
                          <FormulaCodeDisplay
                            code={
                              activeChar.prop.type === 'inhibited'
                                ? '0'
                                : activeChar.prop.type === 'triangular'
                                ? 'd <= L ? (L - d) / L : 0'
                                : activeChar.prop.type === 'rectangular'
                                ? 'd <= L ? 1 : 0'
                                : activeChar.prop.type === 'trapezoidal'
                                ? 'd <= L1 ? 1 : (d <= L ? (L - d) / (L - L1) : 0)'
                                : activeChar.prop.type === 'sinusoidal'
                                ? 'd <= L ? 0.5 * (1 + cos(pi * d / L)) : 0'
                                : activeChar.prop.customExpr || 'exp(-d / 2)'
                            }
                            className="mt-2"
                          />
                        </div>

                        {activeChar.prop.type === 'trapezoidal' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                              {t('char.tower.limitL1')}
                            </label>
                            <DecimalInput
                              disabled={isFpDisabled}
                              value={activeChar.prop.l1 ?? 0}
                              onChange={val => updateActiveCharNested('prop', 'l1', val)}
                              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                            />
                          </div>
                        )}

                        {/* Custom propagation removes limit parameter as requested */}
                        {['triangular', 'rectangular', 'trapezoidal', 'sinusoidal'].includes(activeChar.prop.type) && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                              {activeChar.prop.type === 'trapezoidal' ? t('char.tower.limitL2') : t('char.tower.limit')}
                            </label>
                            <DecimalInput
                              disabled={isFpDisabled}
                              value={activeChar.prop.limit}
                              onChange={val => updateActiveCharNested('prop', 'limit', val)}
                              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                            />
                          </div>
                        )}

                        {activeChar.prop.type === 'custom' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                              {t('char.tower.prop.customExpr')}
                            </label>
                            <input
                              type="text"
                              disabled={isFpDisabled}
                              value={activeChar.prop.customExpr || ''}
                              placeholder="exp(-d / 2)"
                              onChange={e => updateActiveCharNested('prop', 'customExpr', e.target.value)}
                              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {['exp(-d / 2)', '1 / (1 + d)', 'max(0, 1 - (d / 5)^2)', 'cos(pi * d / 10)'].map(expr => (
                                <button
                                  key={expr}
                                  type="button"
                                  disabled={isFpDisabled}
                                  onClick={() => updateActiveCharNested('prop', 'customExpr', expr)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-mono cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                                >
                                  <MathText text={expr} />
                                </button>
                              ))}
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{t('char.tower.prop.customExprHelp')}</p>
                          </div>
                        )}
                      </div>

                      {/* Live Graphical Representation of Propagation */}
                      <div>
                        <PropagationGraph prop={activeChar.prop} />
                      </div>
                    </div>
                  </div>
                </Card>
              </TowerStageTransition>

              {/* 3. Affinity Matrix (A) */}
              <Card
                title={
                  <div className="flex items-center gap-2.5">
                    <span>{t('char.tower.affinityMatrix')}</span>
                    {isADisabled && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                        {t('char.tower.disabledBadge')}
                      </span>
                    )}
                    {isAEditable && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                        {t('char.tower.directInput')}
                      </span>
                    )}
                  </div>
                }
                action={renderMatrixStageAction('det-aff')}
                className={`transition-all duration-200 ${
                  isADisabled ? 'opacity-55 grayscale-[35%] bg-gray-50/70 dark:bg-gray-950/40 border-dashed border-gray-300 dark:border-gray-700' : ''
                }`}
              >
                <div className={isADisabled ? 'pointer-events-none select-none opacity-80' : ''}>
                  {isGraphMode('det-aff') ? (
                    <MatrixGraph
                      elements={elements}
                      elementImages={dataset.elementImages}
                      matrix={activeChar.customA && activeChar.customA.length === elements.length ? activeChar.customA : activeCalc.A}
                      theme="indigo"
                      decimalPrecision={precision}
                    />
                  ) : (
                    <MatrixEditor
                      data={activeChar.customA && activeChar.customA.length === elements.length ? activeChar.customA : activeCalc.A}
                      rows={elements}
                      cols={elements}
                      readOnly={!isAEditable}
                      decimalPrecision={precision}
                      onChange={isAEditable ? (i, j, val) => {
                        const baseA = (activeChar.customA && activeChar.customA.length === elements.length)
                          ? activeChar.customA
                          : activeCalc.A.map(r => [...r]);
                        const newA = baseA.map(r => [...r]);
                        newA[i][j] = val ?? 0;
                        updateActiveChar('customA', newA);
                      } : undefined}
                    />
                  )}
                </div>
              </Card>

              {/* 4. Blocking Function (F_B / V^B) hooked into left descending conduit */}
              <TowerStageTransition
                badgeLabel="F_B(A, V^B) = A^A"
                disabled={isADisabled || isVbDisabled}
              >
                <Card
                  title={
                    <div className="flex items-center gap-2.5">
                      <span>{t('char.tower.blockingFunction')}</span>
                      {isVbDisabled && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                          {t('char.tower.disabledBadge')}
                        </span>
                      )}
                    </div>
                  }
                  action={renderFunctionStageAction('vb', isVbDisabled)}
                  className={`transition-all duration-200 ${
                    isVbDisabled ? 'opacity-55 grayscale-[35%] bg-gray-50/70 dark:bg-gray-950/40 border-dashed border-gray-300 dark:border-gray-700' : ''
                  }`}
                >
                  <div className={isVbDisabled ? 'pointer-events-none select-none opacity-80' : ''}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                          {t('char.tower.function')}
                        </label>
                        <select
                          disabled={isVbDisabled}
                          value={activeChar.block?.type || 'standard'}
                          onChange={e => updateActiveCharNested('block', 'type', e.target.value)}
                          className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                        >
                          <option value="standard">{t('char.tower.block.standard')}</option>
                          <option value="custom">{t('char.tower.block.custom')}</option>
                        </select>
                        <FormulaCodeDisplay
                          code={
                            activeChar.block?.type === 'custom'
                              ? activeChar.block.customExpr || 'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))'
                              : 'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))'
                          }
                          className="mt-2"
                        />
                      </div>

                      {/* Standard blocking parameters: each position of vector VB */}
                      {(activeChar.block?.type || 'standard') === 'standard' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                            {t('char.tower.block.vectorParams')}
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {elements.map((el, i) => (
                              <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                <OrbBadge
                                  name={el}
                                  image={dataset.elementImages?.[i]}
                                  size="xs"
                                  color="indigo"
                                />
                                <BlockingVectorInput
                                  disabled={isVbDisabled}
                                  value={activeChar.vb[i] ?? 0}
                                  onChange={val => {
                                    const newVb = [...activeChar.vb];
                                    newVb[i] = val;
                                    updateActiveChar('vb', newVb);
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom blocking: single parameter input for custom formula */}
                      {activeChar.block?.type === 'custom' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                            {t('char.tower.block.customExpr')}
                          </label>
                          <input
                            type="text"
                            disabled={isVbDisabled}
                            value={activeChar.block?.customExpr || ''}
                            placeholder="i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))"
                            onChange={e => updateActiveCharNested('block', 'customExpr', e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {[
                              'i == j ? (1 / S)^(1 - vb) : (a / (S - 1)) * (1 - (1 / S)^(1 - vb))',
                              'i == j ? 1 : (a < 0.2 ? 0 : a)',
                              'i == j ? 1 / S : a / S'
                            ].map(expr => (
                              <button
                                key={expr}
                                type="button"
                                disabled={isVbDisabled}
                                onClick={() => updateActiveCharNested('block', 'customExpr', expr)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-mono cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                              >
                                <MathText text={expr} />
                              </button>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{t('char.tower.block.customExprHelp')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TowerStageTransition>

              {/* 5. Autoinduced Matrix (A^A) */}
              <Card
                title={
                  <div className="flex items-center gap-2.5">
                    <span>{t('char.tower.autoinducedMatrix')}</span>
                    {isAADisabled && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                        {t('char.tower.disabledBadge')}
                      </span>
                    )}
                    {isAAEditable && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                        {t('char.tower.directInput')}
                      </span>
                    )}
                  </div>
                }
                action={renderMatrixStageAction('det-auto')}
                className={`transition-all duration-200 ${
                  isAADisabled ? 'opacity-55 grayscale-[35%] bg-gray-50/70 dark:bg-gray-950/40 border-dashed border-gray-300 dark:border-gray-700' : ''
                }`}
              >
                <div className={isAADisabled ? 'pointer-events-none select-none opacity-80' : ''}>
                  {isGraphMode('det-auto') ? (
                    <MatrixGraph
                      elements={elements}
                      elementImages={dataset.elementImages}
                      matrix={activeChar.customAA && activeChar.customAA.length === elements.length ? activeChar.customAA : activeCalc.AA}
                      theme="indigo"
                      decimalPrecision={precision}
                    />
                  ) : (
                    <MatrixEditor
                      data={activeChar.customAA && activeChar.customAA.length === elements.length ? activeChar.customAA : activeCalc.AA}
                      rows={elements}
                      cols={elements}
                      readOnly={!isAAEditable}
                      decimalPrecision={precision}
                      onChange={isAAEditable ? (i, j, val) => {
                        const baseAA = (activeChar.customAA && activeChar.customAA.length === elements.length)
                          ? activeChar.customAA
                          : activeCalc.AA.map(r => [...r]);
                        const newAA = baseAA.map(r => [...r]);
                        newAA[i][j] = val ?? 0;
                        updateActiveChar('customAA', newAA);
                      } : undefined}
                    />
                  )}
                </div>
              </Card>

              {/* 6. Synergy Function (F_S) hooked into left descending conduit */}
              <TowerStageTransition
                badgeLabel="F_S(A^A) = A^C"
                disabled={isAADisabled || isFsDisabled}
              >
                <Card
                  title={
                    <div className="flex items-center gap-2.5">
                      <span>{t('char.tower.synergyFunction')}</span>
                      {isFsDisabled && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-200/80 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">
                          {t('char.tower.disabledBadge')}
                        </span>
                      )}
                    </div>
                  }
                  action={renderFunctionStageAction('fs', isFsDisabled)}
                  className={`transition-all duration-200 ${
                    isFsDisabled ? 'opacity-55 grayscale-[35%] bg-gray-50/70 dark:bg-gray-950/40 border-dashed border-gray-300 dark:border-gray-700' : ''
                  }`}
                >
                  <div className={isFsDisabled ? 'pointer-events-none select-none opacity-80' : ''}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                            {t('char.tower.function')}
                          </label>
                          <select
                            disabled={isFsDisabled}
                            value={activeChar.syn.type}
                            onChange={e => updateActiveCharNested('syn', 'type', e.target.value)}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                          >
                            <option value="none">{t('char.tower.syn.none')}</option>
                            <option value="factor">{t('char.tower.syn.factor')}</option>
                            <option value="custom">{t('char.tower.syn.custom')}</option>
                          </select>
                          <FormulaCodeDisplay
                            code={
                              activeChar.syn.type === 'none'
                                ? 'a'
                                : activeChar.syn.type === 'factor'
                                ? 'a * k'
                                : activeChar.syn.customExpr || 'min(1, a * 1.2)'
                            }
                            className="mt-2"
                          />
                        </div>

                        {activeChar.syn.type === 'factor' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                              {t('char.tower.factorK')}
                            </label>
                            <DecimalInput
                              disabled={isFsDisabled}
                              value={activeChar.syn.k}
                              onChange={val => updateActiveCharNested('syn', 'k', val)}
                              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                            />
                          </div>
                        )}

                        {activeChar.syn.type === 'custom' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                              {t('char.tower.syn.customExpr')}
                            </label>
                            <input
                              type="text"
                              disabled={isFsDisabled}
                              value={activeChar.syn.customExpr || ''}
                              placeholder="min(1, a * 1.2)"
                              onChange={e => updateActiveCharNested('syn', 'customExpr', e.target.value)}
                              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 dark:disabled:bg-gray-850"
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {['min(1, a * 1.2)', 'pow(a, 0.8)', 'a * (1 + 0.5 * (1 - a))', 'sqrt(a)'].map(expr => (
                                <button
                                  key={expr}
                                  type="button"
                                  disabled={isFsDisabled}
                                  onClick={() => updateActiveCharNested('syn', 'customExpr', expr)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-mono cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                                >
                                  {expr}
                                </button>
                              ))}
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{t('char.tower.syn.customExprHelp')}</p>
                          </div>
                        )}
                      </div>

                      {/* Live Graphical Representation of Synergy */}
                      <div>
                        <SynergyGraph syn={activeChar.syn} />
                      </div>
                    </div>
                  </div>
                </Card>
              </TowerStageTransition>

              {/* 7. Contextual Affinity Matrix (A^C) */}
              <Card
                title={
                  <div className="flex items-center gap-2.5">
                    <span>{t('char.tower.contextualMatrix')}</span>
                    {isACEditable && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                        {t('char.tower.directInput')}
                      </span>
                    )}
                  </div>
                }
                action={renderMatrixStageAction('det-contextual')}
              >
                <div>
                  {isGraphMode('det-contextual') ? (
                    <ValueFlowGraph
                      elements={elements}
                      elementImages={dataset.elementImages}
                      AC={activeChar.customAC && activeChar.customAC.length === elements.length ? activeChar.customAC : activeCalc.AC}
                      decimalPrecision={precision}
                    />
                  ) : (
                    <MatrixEditor
                      data={activeChar.customAC && activeChar.customAC.length === elements.length ? activeChar.customAC : activeCalc.AC}
                      rows={elements}
                      cols={elements}
                      readOnly={!isACEditable}
                      decimalPrecision={precision}
                      onChange={isACEditable ? (i, j, val) => {
                        const baseAC = (activeChar.customAC && activeChar.customAC.length === elements.length)
                          ? activeChar.customAC
                          : activeCalc.AC.map(r => [...r]);
                        const newAC = baseAC.map(r => [...r]);
                        newAC[i][j] = val ?? 0;
                        updateActiveChar('customAC', newAC);
                      } : undefined}
                    />
                  )}
                </div>
              </Card>
            </div>
            )
          )}

          {/* DETAIL CONTENT: PILLAR 3 - PROPAGACIÓN DE VALOR CONTEXTUAL (V^C) */}
          {activeDetail === 'vc' && (
            currentCalcTarget === 'vp'
              ? renderDataIntegrationCard('vc')
              : renderMatrixCalculationDetail('vc')
          )}
        </div>
      )}

      {/* --- MAIN HORIZONTAL ROW: THE 3 SUMMARY CARDS (V^P, A^C, V^C) --- */}
      {activeChar.type === 'adjustment' ? (
        <div className="pt-2">
          {renderDataIntegrationCard('val')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch pt-2">
        
        {/* CARD 1: VALOR PROPIO */}
        <div className="relative pt-7 flex flex-col">
          {/* Centered Round Button (Magnifying Glass, overlapping card top by 25%) */}
          <button
            type="button"
            onClick={() => toggleDetail('vp')}
            title={activeDetail === 'vp' ? t('char.summary.hideDetail') : t('char.summary.viewDetail')}
            aria-label={activeDetail === 'vp' ? t('char.summary.hideDetail') : t('char.summary.viewDetail')}
            className={`absolute top-7 left-1/2 -translate-x-1/2 -translate-y-[75%] z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-110 ${
              activeDetail === 'vp'
                ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40 shadow-md border-2 border-white dark:border-gray-900 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
            }`}
          >
            {activeDetail === 'vp' ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <Card
            title={t('char.summary.vpTitle')}
            action={renderCardPillarAction('vp', 'sum-vp', false)}
            className={`flex-1 transition-all duration-300 ${
              activeDetail === 'vp'
                ? 'ring-2 ring-blue-500 border-blue-300 dark:border-blue-600 shadow-md'
                : currentCalcTarget === 'vp'
                ? 'border-blue-300 dark:border-blue-700 shadow-sm'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentCalcTarget === 'vp'
                  ? t('char.summary.vpDescReconstructed')
                  : t('char.summary.vpDescNormalized')}
              </p>
            </div>
            {isGraphMode('sum-vp') ? (
              <div className="py-2">
                <VectorBarChart elements={elements} values={activeCalc.vp} color="blue" elementImages={dataset.elementImages} decimalPrecision={precision} />
              </div>
            ) : (
              <div className="space-y-3">
                {elements.map((el, i) => {
                  const vpVal = activeCalc.vp[i] ?? 0;
                  const vcVal = activeCalc.VC[i] ?? 0;
                  const isTarget = currentCalcTarget === 'vp';
                  const devAbs = vpVal - vcVal;
                  const devRel = Math.abs(vcVal) > 1e-10
                    ? (devAbs / vcVal) * 100
                    : (Math.abs(vpVal) < 1e-10 ? 0 : null);
                  const isDevPos = devAbs > 1e-9;
                  const isDevNeg = devAbs < -1e-9;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl border border-blue-100/60 dark:border-blue-900/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <OrbBadge name={el} image={dataset.elementImages?.[i]} size="xs" color="blue" />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isTarget && renderDeviationBadges(devAbs, devRel, isDevPos, isDevNeg, 'V^P', 'V^C')}
                        <span className="font-mono text-sm font-normal text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-md tabular-nums shadow-2xs">
                          {vpVal.toFixed(precision)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* CARD 2: AFINIDAD CONTEXTUAL */}
        <div className="relative pt-7 flex flex-col">
          {/* Centered Round Button (Magnifying Glass, overlapping card top by 25%) */}
          <button
            type="button"
            onClick={() => toggleDetail('ac')}
            title={activeDetail === 'ac' ? t('char.summary.hideDetail') : t('char.summary.viewDetail')}
            aria-label={activeDetail === 'ac' ? t('char.summary.hideDetail') : t('char.summary.viewDetail')}
            className={`absolute top-7 left-1/2 -translate-x-1/2 -translate-y-[75%] z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-110 ${
              activeDetail === 'ac'
                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40 shadow-md border-2 border-white dark:border-gray-900 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md'
            }`}
          >
            {activeDetail === 'ac' ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <Card
            title={t('char.summary.acTitle')}
            action={renderCardPillarAction('ac', 'sum-ac', true)}
            className={`flex-1 transition-all duration-300 ${
              activeDetail === 'ac'
                ? 'ring-2 ring-indigo-500 border-indigo-300 dark:border-indigo-600 shadow-md'
                : currentCalcTarget === 'ac'
                ? 'border-indigo-300 dark:border-indigo-700 shadow-sm'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentCalcTarget === 'ac'
                  ? t('char.summary.acDescSampling')
                  : t('char.summary.acDescPropagated')}
              </p>
            </div>
            {isGraphMode('sum-ac') ? (
              <MatrixGraph elements={elements} matrix={activeCalc.AC} theme="indigo" elementImages={dataset.elementImages} decimalPrecision={precision} />
            ) : (
              <div className="overflow-x-auto">
                <MatrixEditor data={activeCalc.AC} rows={elements} cols={elements} readOnly decimalPrecision={precision} />
              </div>
            )}
          </Card>
        </div>

        {/* CARD 3: VALOR CONTEXTUAL */}
        <div className="relative pt-7 flex flex-col">
          {/* Centered Round Button (Magnifying Glass, overlapping card top by 25%) */}
          <button
            type="button"
            onClick={() => toggleDetail('vc')}
            title={activeDetail === 'vc' ? t('char.summary.hideDetail') : t('char.summary.viewDetail')}
            aria-label={activeDetail === 'vc' ? t('char.summary.hideDetail') : t('char.summary.viewDetail')}
            className={`absolute top-7 left-1/2 -translate-x-1/2 -translate-y-[75%] z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-110 ${
              activeDetail === 'vc'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/40 shadow-md border-2 border-white dark:border-gray-900 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md'
            }`}
          >
            {activeDetail === 'vc' ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <Card
            title={t('char.summary.vcTitle')}
            action={renderCardPillarAction('vc', 'sum-vc', false)}
            className={`flex-1 transition-all duration-300 ${
              activeDetail === 'vc'
                ? 'ring-2 ring-emerald-500 border-emerald-300 dark:border-emerald-600 shadow-md'
                : currentCalcTarget === 'vc'
                ? 'border-emerald-300 dark:border-emerald-700 shadow-sm'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentCalcTarget === 'vp'
                  ? t('char.summary.vcDescObserved')
                  : t('char.summary.vcDescPropagated')}
              </p>
            </div>
            {isGraphMode('sum-vc') ? (
              <div className="py-2">
                <VectorBarChart elements={elements} values={activeCalc.VC} color="emerald" elementImages={dataset.elementImages} decimalPrecision={precision} />
              </div>
            ) : (
              <div className="space-y-3">
                {elements.map((el, i) => {
                  const vcVal = activeCalc.VC[i] ?? 0;
                  const vpVal = activeCalc.vp[i] ?? 0;
                  const isTarget = currentCalcTarget === 'vc';
                  const devAbs = vcVal - vpVal;
                  const devRel = Math.abs(vpVal) > 1e-10
                    ? (devAbs / vpVal) * 100
                    : (Math.abs(vcVal) < 1e-10 ? 0 : null);
                  const isDevPos = devAbs > 1e-9;
                  const isDevNeg = devAbs < -1e-9;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/60 dark:border-emerald-900/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <OrbBadge name={el} image={dataset.elementImages?.[i]} size="xs" color="emerald" />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isTarget && renderDeviationBadges(devAbs, devRel, isDevPos, isDevNeg, 'V^C', 'V^P')}
                        <span className="font-mono text-sm font-normal text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-md tabular-nums shadow-2xs">
                          {vcVal.toFixed(precision)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* --- NEW FULL-WIDTH CARD UNDER THE 3 SUMMARY CARDS: AJUSTE DE VALORES OBJETIVO --- */}
      <Card title={t('char.targetAdj.title')} className="w-full shadow-sm border-gray-200 dark:border-gray-800">
        <div className="space-y-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            {t('char.targetAdj.subtitle')}
          </p>

          {/* 1. Selector de Valor Objetivo para la Agregación */}
          <div>
            <div className="mb-3">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('char.targetAdj.selectTitle')}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('char.targetAdj.selectSubtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Valor Propio (V^P) */}
              <button
                type="button"
                onClick={() => updateActiveCharNested('adj', 'targetValue', 'vp')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer ${
                  currentTargetValue === 'vp'
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50/80 dark:hover:bg-gray-750 shadow-2xs'
                }`}
              >
                <div>
                  <div className="mb-1.5">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{t('char.targetAdj.target.vp')}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('char.targetAdj.target.vpDesc')}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-750 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {currentTargetValue === 'vp' ? t('char.targetAdj.badgeSelected') : t('char.topConfig.status.available')}
                  </span>
                  {currentTargetValue === 'vp' && (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs">{t('char.targetAdj.activeBadge')}</span>
                  )}
                </div>
              </button>

              {/* Option 2: Valor Contextual (V^C) */}
              <button
                type="button"
                onClick={() => updateActiveCharNested('adj', 'targetValue', 'vc')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer ${
                  currentTargetValue === 'vc'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-gray-50/80 dark:hover:bg-gray-750 shadow-2xs'
                }`}
              >
                <div>
                  <div className="mb-1.5">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{t('char.targetAdj.target.vc')}</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t('char.targetAdj.target.vcDesc')}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-750 flex items-center justify-between text-[11px]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {currentTargetValue === 'vc' ? t('char.targetAdj.badgeSelected') : t('char.topConfig.status.available')}
                  </span>
                  {currentTargetValue === 'vc' && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">{t('char.targetAdj.activeBadge')}</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pasos de Ajuste Relativo y Equiparación en tarjetas separadas */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Tarjeta 1: Ajuste */}
              <Card
                title={t('char.targetAdj.adjCardTitle')}
                className="shadow-xs border-gray-200 dark:border-gray-800"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      {t('char.adj.population')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t('char.targetAdj.adjCardHelp')}
                    </p>
                    <select
                      value={activeChar.adj.byPop}
                      onChange={e => updateActiveCharNested('adj', 'byPop', parseInt(e.target.value))}
                      className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={-1}>{t('char.adj.none')}</option>
                      {characteristics.map(
                        (c, i) =>
                          i !== activeCharIdx && (
                            <option key={i} value={i}>
                              {c.name} {c.type === 'adjustment' ? `(${t('char.config.type.adjShort')})` : ''}
                            </option>
                          )
                      )}
                    </select>
                    <FormulaCodeDisplay
                      code={activeChar.adj.byPop === -1 ? 'vc' : 'vc / pop'}
                      className="mt-2.5"
                    />
                  </div>
                </div>
              </Card>

              {/* Tarjeta 2: Equiparación */}
              <Card
                title={t('char.targetAdj.eqCardTitle')}
                className="shadow-xs border-gray-200 dark:border-gray-800"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      {t('char.adj.equalization')}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t('char.targetAdj.eqCardHelp')}
                    </p>
                    <select
                      value={activeChar.adj.normType}
                      onChange={e => updateActiveCharNested('adj', 'normType', e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="none">{t('char.adj.norm.none')}</option>
                      <option value="maximum">{t('char.adj.norm.maximum')}</option>
                      <option value="target">{t('char.adj.norm.target')}</option>
                    </select>
                    <FormulaCodeDisplay
                      code={
                        activeChar.adj.normType === 'none'
                          ? 'vcr'
                          : activeChar.adj.normType === 'target'
                          ? 'min(1, vcr / obj)'
                          : 'min(1, vcr / max_vcr)'
                      }
                      className="mb-3"
                    />
                    {activeChar.adj.normType === 'target' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                          {t('char.adj.targetValue')}
                        </label>
                        <DecimalInput
                          value={activeChar.adj.obj}
                          onChange={val => updateActiveCharNested('adj', 'obj', val)}
                          className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder={t('char.adj.targetValue')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Tarjeta 3: Valores Agregables Ajustados */}
              <Card
                title={t('char.targetAdj.equiparatedTitle')}
                action={renderModeToggle('target-eq', false)}
                className="border-emerald-200/80 dark:border-emerald-800/80 shadow-xs"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {t('char.targetAdj.equiparatedDesc')}
                </p>
                {isGraphMode('target-eq') ? (
                  <div className="py-2">
                    <VectorBarChart elements={elements} values={activeCalc.VCRN} color="emerald" elementImages={dataset.elementImages} decimalPrecision={precision} />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {elements.map((el, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2.5 px-3 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/60 dark:border-emerald-900/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <OrbBadge name={el} image={dataset.elementImages?.[i]} size="xs" color="emerald" />
                        </div>
                        <span className="font-mono text-sm font-normal text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1 rounded-md tabular-nums shadow-2xs">
                          {(activeCalc.VCRN[i] ?? 0).toFixed(precision)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </Card>
        </>
      )}

      {/* Modal for editing active dimension image */}
      {isPickingCharImage && (
        <ImagePickerModal
          isOpen={true}
          onClose={() => setIsPickingCharImage(false)}
          title={t('char.config.imageTitle')}
          name={activeChar.name}
          currentImage={activeChar.image}
          isDimension={true}
          onSave={newImg => updateActiveChar('image', newImg)}
        />
      )}

      {/* Confirmation Modal when switching calculation target with existing values */}
      {pendingCalcTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
                  {t('char.modal.targetChangeTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingCalcTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {t('char.modal.targetChangeDescBefore')}{' '}
              <strong className="text-gray-900 dark:text-gray-100">
                <MathText
                  text={
                    pendingCalcTarget === 'vp'
                      ? t('char.modal.targetVp')
                      : pendingCalcTarget === 'ac'
                      ? t('char.modal.targetAc')
                      : t('char.modal.targetVc')
                  }
                />
              </strong>
              {t('char.modal.targetChangeDescAfter')}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingCalcTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                {t('header.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmChangeCalcTarget}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {t('char.modal.confirmRecalc')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
