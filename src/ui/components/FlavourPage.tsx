import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Download,
  FileDown,
  FileText,
  Flag,
  Link2,
  Loader2,
  MapPin,
  Play,
  RotateCw,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Upload,
  X
} from 'lucide-react';
import {
  calculateOrdomatica,
  FLAVOUR_DEFINITIONS,
  FlavourAnalysisCase,
  FlavourId,
  scrapeMatchData,
  DEFAULT_SOCCER_MATCH_URL,
  parseSoccerTimeline,
  computeSoccerDimensionalAnalysis,
  computeSoccerAggregatedAnalysis,
  DEFAULT_SOCCER_DIM_AFFINITY,
  extractMatchCentreDataFromHtml,
  extractMatchInfoFromUrl,
  formatMatchDate,
  TimelineSegment,
  SoccerDimensionalAnalysis,
  SoccerConcept,
  SOCCER_CONCEPTS,
  SOCCER_OWA_PRESETS,
  SoccerOwaConfig,
  SynergyConfig,
  SoccerPropagationConfig,
  SoccerBlockingConfig,
  SoccerRelativeAdjustmentConfig,
  SoccerEqualizationConfig
} from '../../logic';
import { downloadJsonFile, downloadTextFile, readJsonFile } from '../../io/browserIO';
import {
  buildFlavourReportHtml,
  parseFlavourCase,
  serializeFlavourCase
} from '../../io/flavourIO';
import { openSoccerPdfReport } from '../../io/soccerPdfReport';
import { Card } from './Card';
import { FlavourWatermark } from './FlavourWatermark';
import { SoccerTimelineSlider } from './SoccerTimelineSlider';
import { SoccerGeneralConfigPanel } from './SoccerGeneralConfigPanel';
import { SoccerDimensionCard } from './SoccerDimensionCard';
import { SoccerAggregateCard } from './SoccerAggregateCard';
import { SoccerIntegralMatchAnalysis } from './SoccerIntegralMatchAnalysis';
import { AppFooter } from './AppFooter';
import { useI18n } from '../i18n/I18nContext';
import { TranslationKey } from '../i18n/translations';

export interface FlavourPageProps {
  flavourCase: FlavourAnalysisCase;
  onUpdateFlavourCase: (updater: (prev: FlavourAnalysisCase) => FlavourAnalysisCase) => void;
}

const FLAVOUR_TEXT_KEYS: Record<
  FlavourId,
  {
    titleKey: TranslationKey;
    descKey: TranslationKey;
    placeholderKey: TranslationKey;
  }
> = {
  'match-soccer-mvp': {
    titleKey: 'header.menu.matchSoccerMvp',
    descKey: 'header.menu.matchSoccerMvpDesc',
    placeholderKey: 'flavours.analysisControls.urlPlaceholder.matchSoccerMvp'
  },
  'race-driver': {
    titleKey: 'header.menu.raceDriver',
    descKey: 'header.menu.raceDriverDesc',
    placeholderKey: 'flavours.analysisControls.urlPlaceholder.raceDriver'
  }
};

interface StatusNotice {
  kind: 'success' | 'error';
  message: string;
}

/**
 * Full-width workspace view for a specific domain flavour (without left sidebar).
 * Places a monochrome top-right watermark behind cards and leads with Analysis Controls.
 */
export const FlavourPage: React.FC<FlavourPageProps> = ({
  flavourCase,
  onUpdateFlavourCase
}) => {
  const { t, language } = useI18n();
  const urlInputId = useId();
  const jsonTextareaId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<StatusNotice | null>(null);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isJsonExpanded, setIsJsonExpanded] = useState<boolean>(false);

  // Soccer MVP specific state: tabs, timeline segment, calculation status, synergy, OWA & dim affinity
  const isSoccerFlavour = flavourCase.flavour === 'match-soccer-mvp';
  const [activeSoccerTab, setActiveSoccerTab] = useState<'segments' | 'integral'>('segments');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [isConfigCollapsed, setIsConfigCollapsed] = useState<boolean>(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState<boolean>(false);
  const [soccerAnalysisCalculated, setSoccerAnalysisCalculated] = useState<boolean>(true);
  const [soccerPropagationConfig, setSoccerPropagationConfig] = useState<SoccerPropagationConfig>({
    type: 'maxRatio'
  });
  const [soccerBlockingConfig, setSoccerBlockingConfig] = useState<SoccerBlockingConfig>({
    type: 'none'
  });
  const [soccerSynergyConfigs, setSoccerSynergyConfigs] = useState<Record<SoccerConcept, SynergyConfig>>({
    dribblesWon: { type: 'none', k: 1.0 },
    goals: { type: 'none', k: 1.0 },
    aerial: { type: 'none', k: 1.0 },
    shotsOnTarget: { type: 'none', k: 1.0 },
    touches: { type: 'none', k: 1.0 },
    passAccuracy: { type: 'none', k: 1.0 },
    accuratePasses: { type: 'none', k: 1.0 },
    keyPasses: { type: 'none', k: 1.0 },
    tacklesSuccessful: { type: 'none', k: 1.0 },
    clearances: { type: 'none', k: 1.0 },
    interceptions: { type: 'none', k: 1.0 },
    cornerAccuracy: { type: 'none', k: 1.0 },
    dribbles: { type: 'none', k: 1.0 },
    shots: { type: 'none', k: 1.0 }
  });
  const [soccerRelativeConfig, setSoccerRelativeConfig] = useState<SoccerRelativeAdjustmentConfig>({
    type: 'none'
  });
  const [soccerEqualizationConfig, setSoccerEqualizationConfig] = useState<SoccerEqualizationConfig>({
    type: 'max'
  });
  const [soccerOwaConfig, setSoccerOwaConfig] = useState<SoccerOwaConfig>({
    type: 'average',
    weights: [...SOCCER_OWA_PRESETS.average]
  });
  const [soccerDimAffinity, setSoccerDimAffinity] = useState<number[][]>(() =>
    DEFAULT_SOCCER_DIM_AFFINITY.map(row => [...row])
  );
  const [isGeneratingSoccerReport, setIsGeneratingSoccerReport] = useState<boolean>(false);

  // Memoize parsed match data object exclusively for soccer flavour (no cached fallback on initial load)
  const parsedSoccerMatchData = useMemo(() => {
    if (!isSoccerFlavour) return null;
    const json = flavourCase.matchDataJson?.trim();
    if (!json) {
      return null;
    }
    try {
      return JSON.parse(json);
    } catch (err) {
      console.warn('Failed to parse matchDataJson', err);
      return null;
    }
  }, [isSoccerFlavour, flavourCase.matchDataJson]);

  // Summary statistics of loaded match JSON (characters, events count, squad players)
  const jsonSummary = useMemo(() => {
    if (!flavourCase.matchDataJson) return null;
    const chars = flavourCase.matchDataJson.length.toLocaleString(language);
    if (!parsedSoccerMatchData) {
      return { chars, events: null, players: null };
    }
    const eventsCount = Array.isArray(parsedSoccerMatchData.events)
      ? parsedSoccerMatchData.events.length
      : 0;
    const homeCount = Array.isArray(parsedSoccerMatchData?.home?.players)
      ? parsedSoccerMatchData.home.players.length
      : 0;
    const awayCount = Array.isArray(parsedSoccerMatchData?.away?.players)
      ? parsedSoccerMatchData.away.players.length
      : 0;
    const totalPlayers = homeCount + awayCount;

    return {
      chars,
      events: eventsCount > 0 ? eventsCount.toLocaleString(language) : null,
      players: totalPlayers > 0 ? totalPlayers.toLocaleString(language) : null
    };
  }, [flavourCase.matchDataJson, parsedSoccerMatchData, language]);

  // Extract URL metadata dynamically (competition, stage/round, season, date, venue)
  const urlMatchInfo = useMemo(() => {
    return extractMatchInfoFromUrl(flavourCase.sourceUrl || DEFAULT_SOCCER_MATCH_URL);
  }, [flavourCase.sourceUrl]);

  // Dynamic formatted match date in DD/MM/YYYY
  const formattedMatchDate = useMemo(() => {
    const rawDate =
      parsedSoccerMatchData?.matchDate ||
      parsedSoccerMatchData?.startDate ||
      parsedSoccerMatchData?.startTime ||
      urlMatchInfo?.matchDate;
    return formatMatchDate(rawDate);
  }, [parsedSoccerMatchData, urlMatchInfo]);

  // Dynamic competition
  const displayCompetition = useMemo(() => {
    return (
      parsedSoccerMatchData?.competition ||
      parsedSoccerMatchData?.tournamentName ||
      urlMatchInfo?.competition ||
      'FIFA World Cup 2026'
    );
  }, [parsedSoccerMatchData, urlMatchInfo]);

  // Dynamic stage / round / jornada
  const displayStage = useMemo(() => {
    if (parsedSoccerMatchData?.stage) return parsedSoccerMatchData.stage;
    if (parsedSoccerMatchData?.round) return `Jornada ${parsedSoccerMatchData.round}`;
    if (parsedSoccerMatchData?.stageName) return parsedSoccerMatchData.stageName;
    return urlMatchInfo?.stage || 'Final';
  }, [parsedSoccerMatchData, urlMatchInfo]);

  // Dynamic venue
  const displayVenue = useMemo(() => {
    return (
      parsedSoccerMatchData?.venueName ||
      parsedSoccerMatchData?.venue ||
      parsedSoccerMatchData?.stadium ||
      urlMatchInfo?.venueName ||
      'MetLife Stadium (East Rutherford, NJ)'
    );
  }, [parsedSoccerMatchData, urlMatchInfo]);

  // Memoize timeline segmentation for Home (España) and Away (Argentina)
  const soccerTimeline = useMemo(() => {
    if (!parsedSoccerMatchData) return null;
    try {
      return parseSoccerTimeline(parsedSoccerMatchData);
    } catch (err) {
      console.warn('Failed to parse soccer timeline', err);
      return null;
    }
  }, [parsedSoccerMatchData]);

  // Currently selected active segment on the timeline
  const activeSegment: TimelineSegment | null = useMemo(() => {
    if (!soccerTimeline) return null;
    const allSegments = [...soccerTimeline.homeSegments, ...soccerTimeline.awaySegments];
    if (selectedSegmentId) {
      const match = allSegments.find(s => s.id === selectedSegmentId);
      if (match) return match;
    }
    return soccerTimeline.homeSegments[0] || soccerTimeline.awaySegments[0] || null;
  }, [soccerTimeline, selectedSegmentId]);

  // Compute dimensional analyses for all 4 concepts (Regates, Goles, Aéreos ganados, Tiros) for the active segment
  const soccerDimAnalyses: SoccerDimensionalAnalysis[] = useMemo(() => {
    if (!parsedSoccerMatchData || !activeSegment) return [];
    try {
      return SOCCER_CONCEPTS.map(cfg =>
        computeSoccerDimensionalAnalysis(
          parsedSoccerMatchData,
          activeSegment,
          soccerAnalysisCalculated,
          soccerSynergyConfigs[cfg.key] || { type: 'none', k: 1.0 },
          cfg.key,
          soccerPropagationConfig,
          soccerBlockingConfig,
          soccerRelativeConfig
        )
      );
    } catch (err) {
      console.warn('Failed to compute soccer dimensional analyses', err);
      return [];
    }
  }, [
    parsedSoccerMatchData,
    activeSegment,
    soccerAnalysisCalculated,
    soccerSynergyConfigs,
    soccerPropagationConfig,
    soccerBlockingConfig,
    soccerRelativeConfig
  ]);

  // Compute multi-dimensional aggregated analysis for the active segment
  const soccerAggAnalysis = useMemo(() => {
    if (!activeSegment || soccerDimAnalyses.length === 0) return null;
    try {
      return computeSoccerAggregatedAnalysis(
        soccerDimAnalyses,
        activeSegment,
        soccerOwaConfig,
        soccerDimAffinity,
        soccerEqualizationConfig
      );
    } catch (err) {
      console.warn('Failed to compute soccer aggregated analysis', err);
      return null;
    }
  }, [activeSegment, soccerDimAnalyses, soccerOwaConfig, soccerDimAffinity, soccerEqualizationConfig]);

  const definition = FLAVOUR_DEFINITIONS[flavourCase.flavour];
  const textKeys = FLAVOUR_TEXT_KEYS[flavourCase.flavour];

  const currentUrl =
    flavourCase.sourceUrl ||
    (flavourCase.flavour === 'match-soccer-mvp' ? DEFAULT_SOCCER_MATCH_URL : '');

  const isValidHttpUrl = (rawUrl: string): boolean => {
    try {
      const parsed = new URL(rawUrl.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (nextUrl: string) => {
    onUpdateFlavourCase(prev => ({
      ...prev,
      sourceUrl: nextUrl,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleJsonChange = (nextJson: string) => {
    let cleanJson = nextJson;
    const trimmed = nextJson.trim();
    if (trimmed.startsWith('<') || trimmed.includes('matchCentreData') || trimmed.includes('require.config.params')) {
      const extracted = extractMatchCentreDataFromHtml(nextJson);
      if (extracted) {
        cleanJson = JSON.stringify(extracted, null, 2);
        setNotice({
          kind: 'success',
          message: t('flavours.analysisControls.statusScrapedSuccess', {
            chars: cleanJson.length.toLocaleString(language)
          })
        });
      }
    }
    onUpdateFlavourCase(prev => ({
      ...prev,
      matchDataJson: cleanJson,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleCopyJson = async () => {
    if (!flavourCase.matchDataJson) return;
    try {
      await navigator.clipboard.writeText(flavourCase.matchDataJson);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      setNotice({
        kind: 'success',
        message: t('flavours.analysisControls.statusJsonCopied')
      });
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  const handleLoadUrl = async () => {
    const trimmed = (flavourCase.sourceUrl || currentUrl).trim();
    if (!isValidHttpUrl(trimmed)) {
      setNotice({
        kind: 'error',
        message: t('flavours.analysisControls.invalidUrl')
      });
      return;
    }

    setIsScraping(true);
    setNotice(null);

    try {
      // Try internal API scraper endpoint first (if running on server/docker), fallback to client scraper
      let scrapeResult: any = null;
      try {
        const apiRes = await fetch('/api/scrape-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed })
        });
        if (apiRes.ok) {
          const contentType = apiRes.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            scrapeResult = await apiRes.json();
          }
        }
      } catch {
        // API server not reachable, use client scraper directly
      }

      if (!scrapeResult || !scrapeResult.jsonString) {
        scrapeResult = await scrapeMatchData(trimmed);
      }

      const jsonStr = scrapeResult.jsonString || '';
      onUpdateFlavourCase(prev => ({
        ...prev,
        sourceUrl: trimmed,
        matchDataJson: jsonStr,
        updatedAt: new Date().toISOString()
      }));

      // In Soccer MVP, clicking Cargar automatically solves the Own Value vector (VP) for the active segment
      if (isSoccerFlavour) {
        setSoccerAnalysisCalculated(true);
      }

      setNotice({
        kind: 'success',
        message: t('flavours.analysisControls.statusScrapedSuccess', {
          chars: jsonStr.length.toLocaleString(language)
        })
      });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        message: err?.message || 'Error al extraer información del partido.'
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleExecute = () => {
    // In Soccer MVP flavour, Execute triggers full dimensional calculation across the segment
    if (isSoccerFlavour && parsedSoccerMatchData) {
      setSoccerAnalysisCalculated(true);
      const teamLabel = activeSegment ? `${activeSegment.teamName} (${activeSegment.label})` : 'MVP';
      setNotice({
        kind: 'success',
        message: t('flavours.analysisControls.statusRunSuccess', {
          elements: activeSegment ? activeSegment.activePlayers.length : 11,
          top: teamLabel
        })
      });
      return;
    }

    if (flavourCase.dataset) {
      const result = calculateOrdomatica(flavourCase.dataset);
      const topIdx = result.agg.ranking[0];
      const topElement =
        topIdx !== undefined ? flavourCase.dataset.elements[topIdx] || `#${topIdx + 1}` : '-';
      onUpdateFlavourCase(prev => ({
        ...prev,
        updatedAt: new Date().toISOString()
      }));
      setNotice({
        kind: 'success',
        message: t('flavours.analysisControls.statusRunSuccess', {
          elements: flavourCase.dataset.elements.length,
          top: topElement
        })
      });
      return;
    }

    if (flavourCase.sourceUrl.trim()) {
      setNotice({
        kind: 'success',
        message: t('flavours.analysisControls.statusRunUrlOnly')
      });
      return;
    }

    setNotice({
      kind: 'error',
      message: t('flavours.analysisControls.statusRunNeedsInput')
    });
  };

  const handleExport = () => {
    const jsonStr = serializeFlavourCase(flavourCase);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`${definition.filePrefix}_${dateStr}.json`, jsonStr);
    setNotice({
      kind: 'success',
      message: t('flavours.analysisControls.statusExported')
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await readJsonFile(file);
      const restored = parseFlavourCase(parsed, flavourCase.flavour);
      onUpdateFlavourCase(() => restored);
      setNotice({
        kind: 'success',
        message: t('flavours.analysisControls.statusImported')
      });
    } catch (err: any) {
      const msgKey: TranslationKey =
        err?.message === 'INVALID_JSON'
          ? 'header.importInvalidJson'
          : err?.message === 'FILE_READ_ERROR'
          ? 'header.importReadError'
          : err?.message === 'FLAVOUR_MISMATCH'
          ? 'flavours.analysisControls.importFlavourMismatch'
          : 'flavours.analysisControls.importInvalidFormat';

      setNotice({
        kind: 'error',
        message: t(msgKey)
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerateReport = () => {
    const htmlReport = buildFlavourReportHtml(
      flavourCase,
      {
        documentTitle: t('flavours.report.title'),
        flavourLabel: t('flavours.report.flavourLabel'),
        flavourTitle: t(textKeys.titleKey),
        flavourDescription: t(textKeys.descKey),
        generatedAtLabel: t('flavours.report.generatedAt'),
        sourceUrlLabel: t('flavours.report.sourceUrlLabel'),
        noUrlProvided: t('flavours.report.noUrlProvided'),
        statusSectionTitle: t('flavours.report.statusSection'),
        statusConfigured: t('flavours.report.statusConfigured'),
        statusEmpty: t('flavours.report.statusEmpty'),
        rankingSectionTitle: t('flavours.report.rankingSection'),
        rankColumn: t('flavours.report.rankCol'),
        elementColumn: t('flavours.report.elementCol'),
        scoreColumn: t('flavours.report.scoreCol'),
        dimensionsSectionTitle: t('flavours.report.dimensionsSection'),
        dimensionColumn: t('flavours.report.dimensionCol'),
        typeColumn: t('flavours.report.typeCol'),
        quantitativeLabel: t('char.config.type.quantitative'),
        qualitativeLabel: t('char.config.type.qualitative'),
        weightColumn: t('flavours.report.weightCol')
      },
      language
    );

    const dateStr = new Date().toISOString().slice(0, 10);
    const suffix = language === 'es' ? 'informe' : 'report';
    downloadTextFile(
      `${definition.filePrefix}_${suffix}_${dateStr}.html`,
      htmlReport,
      'text/html;charset=utf-8'
    );
    setNotice({
      kind: 'success',
      message: t('flavours.analysisControls.statusReportDownloaded')
    });
  };

  const handleGenerateSoccerReport = () => {
    if (!parsedSoccerMatchData || !soccerTimeline) return;
    setIsGeneratingSoccerReport(true);
    try {
      openSoccerPdfReport({
        matchData: parsedSoccerMatchData,
        sourceUrl: flavourCase.sourceUrl || DEFAULT_SOCCER_MATCH_URL,
        timeline: soccerTimeline,
        matchInfo: {
          homeTeam: parsedSoccerMatchData?.home?.name || soccerTimeline.homeTeamName || 'España',
          awayTeam: parsedSoccerMatchData?.away?.name || soccerTimeline.awayTeamName || 'Argentina',
          score: parsedSoccerMatchData?.score || '3 : 2 (AET)',
          competition: displayCompetition,
          stage: displayStage,
          date: formattedMatchDate,
          venue: displayVenue
        },
        config: {
          propagationConfig: soccerPropagationConfig,
          blockingConfig: soccerBlockingConfig,
          synergyConfigs: soccerSynergyConfigs,
          relativeConfig: soccerRelativeConfig,
          equalizationConfig: soccerEqualizationConfig,
          owaConfig: soccerOwaConfig,
          dimAffinityMatrix: soccerDimAffinity
        },
        language
      });
      setNotice({
        kind: 'success',
        message: language === 'es' ? 'Informe oficial generado con éxito.' : 'Official report generated successfully.'
      });
    } catch (err: any) {
      setNotice({
        kind: 'error',
        message: err?.message || 'Error al generar el informe del partido.'
      });
    } finally {
      setIsGeneratingSoccerReport(false);
    }
  };

  const secondaryButtonClass =
    'h-10 inline-flex items-center justify-center gap-1.5 px-3.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200/90 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors shadow-2xs cursor-pointer whitespace-nowrap';

  const primaryButtonClass =
    'h-10 inline-flex items-center justify-center gap-1.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg border border-transparent shadow-xs transition-colors cursor-pointer whitespace-nowrap';

  return (
    <div className="relative flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Top-right monochrome watermark layer behind all cards */}
      <FlavourWatermark variant={definition.watermarkVariant} />

      <main className="relative z-10 h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-[1360px] mx-auto space-y-4 pb-16">
          {/* First Card: Analysis Controls */}
          <Card
            title={
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>{t('header.menu.ordomachine')}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/70">
                  {t('flavours.badge')}
                </span>
                <span>{t(textKeys.titleKey)}</span>
              </span>
            }
            icon={SlidersHorizontal}
            className="bg-white/95 dark:bg-gray-900/95"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('flavours.analysisControls.subtitle')}
            </p>

            <div>
              <label
                htmlFor={urlInputId}
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t('flavours.analysisControls.sourceUrl')}
              </label>

              <div className="flex flex-col xl:flex-row xl:items-center gap-2.5">
                {/* Source Data URL Input + Load Button */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="relative flex-1 min-w-0 flex items-center">
                    <Link2 className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 pointer-events-none" />
                    <input
                      id={urlInputId}
                      type="url"
                      value={flavourCase.sourceUrl}
                      onChange={e => handleUrlChange(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleLoadUrl();
                      }}
                      placeholder={t(textKeys.placeholderKey)}
                      className="w-full h-10 pl-9 pr-9 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    />
                    {flavourCase.sourceUrl && (
                      <button
                        type="button"
                        onClick={() => handleUrlChange('')}
                        title={t('flavours.analysisControls.clearUrl')}
                        aria-label={t('flavours.analysisControls.clearUrl')}
                        className="absolute right-2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadUrl}
                    disabled={isScraping}
                    className={`${secondaryButtonClass} shrink-0 disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isScraping ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ArrowDownToLine className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>{isScraping ? t('flavours.analysisControls.loading') : t('flavours.analysisControls.load')}</span>
                  </button>
                </div>

                {!isSoccerFlavour && (
                  <>
                    <div className="hidden xl:block h-7 w-px bg-gray-200 dark:bg-gray-700 mx-0.5 shrink-0" />

                    {/* Action Buttons: Run, Export, Import & Generate Report */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleExecute}
                        className={primaryButtonClass}
                      >
                        <RotateCw className="w-4 h-4" />
                        <span>{t('flavours.analysisControls.run')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExport}
                        className={secondaryButtonClass}
                      >
                        <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{t('flavours.analysisControls.export')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={secondaryButtonClass}
                      >
                        <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{t('flavours.analysisControls.import')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateReport}
                        className={secondaryButtonClass}
                      >
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{t('flavours.analysisControls.generateReport')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                {t('flavours.analysisControls.sourceUrlHelp')}
              </p>

              {/* Match Metadata Integrated Strip (Only for Soccer MVP flavour when match data is present) */}
              {isSoccerFlavour && parsedSoccerMatchData && (
                <div className="mt-3.5 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Teams & Score */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                      {soccerTimeline?.homeCrestUrl && (
                        <img
                          src={soccerTimeline.homeCrestUrl}
                          alt={soccerTimeline.homeTeamName}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span>{parsedSoccerMatchData?.home?.name || 'España'}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-2xs">
                      {parsedSoccerMatchData?.score || '3 : 2 (AET)'}
                    </span>

                    <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                      {soccerTimeline?.awayCrestUrl && (
                        <img
                          src={soccerTimeline.awayCrestUrl}
                          alt={soccerTimeline.awayTeamName}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span>{parsedSoccerMatchData?.away?.name || 'Argentina'}</span>
                    </div>
                  </div>

                  {/* Competition, Stage, Date, Venue */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>{displayCompetition}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                      <Flag className="w-3 h-3 text-blue-500" />
                      <span>{displayStage}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{formattedMatchDate}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{displayVenue}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Extracted Match Data JSON String Field (Collapsible Debug Panel) */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsJsonExpanded(prev => !prev)}
                    title={
                      isJsonExpanded
                        ? t('flavours.analysisControls.collapseDebugJson')
                        : t('flavours.analysisControls.expandDebugJson')
                    }
                    aria-label={
                      isJsonExpanded
                        ? t('flavours.analysisControls.collapseDebugJson')
                        : t('flavours.analysisControls.expandDebugJson')
                    }
                    aria-expanded={isJsonExpanded}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer select-none"
                  >
                    {isJsonExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                    <Code2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <span>{t('flavours.analysisControls.debugJsonTitle')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                      {t('flavours.analysisControls.debugBadge')}
                    </span>
                    {jsonSummary ? (
                      <span className="text-[11px] font-normal text-gray-400 dark:text-gray-500">
                        (
                        {jsonSummary.events && jsonSummary.players
                          ? t('flavours.analysisControls.matchJsonStatsFull', {
                              chars: jsonSummary.chars,
                              events: jsonSummary.events,
                              players: jsonSummary.players
                            })
                          : t('flavours.analysisControls.matchJsonStats', {
                              chars: jsonSummary.chars
                            })}
                        )
                      </span>
                    ) : null}
                  </button>

                  {isJsonExpanded && flavourCase.matchDataJson ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyJson}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>
                          {isCopied
                            ? t('flavours.analysisControls.statusJsonCopied')
                            : t('flavours.analysisControls.copyJson')}
                        </span>
                      </button>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <button
                        type="button"
                        onClick={() => handleJsonChange('')}
                        className="text-xs font-semibold text-gray-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      >
                        {t('flavours.analysisControls.clearJson')}
                      </button>
                    </div>
                  ) : null}
                </div>

                {isJsonExpanded && (
                  <div className="mt-2.5 space-y-1.5 animate-in fade-in-50 duration-200">
                    <textarea
                      id={jsonTextareaId}
                      rows={8}
                      value={flavourCase.matchDataJson || ''}
                      onChange={e => handleJsonChange(e.target.value)}
                      placeholder={t('flavours.analysisControls.matchJsonPlaceholder')}
                      className="w-full p-3 font-mono text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-colors leading-relaxed"
                      spellCheck={false}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {t('flavours.analysisControls.matchJsonHelp')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            {notice && (
              <div
                role="status"
                className={`mt-4 flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                  notice.kind === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notice.kind === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{notice.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </Card>

          {/* Soccer Flavour Empty State (when no match JSON loaded yet) */}
          {isSoccerFlavour && !parsedSoccerMatchData && (
            <Card
              title={
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {t('soccer.emptyState.title')}
                  </span>
                </div>
              }
              className="bg-white/95 dark:bg-gray-900/95 shadow-sm text-center py-8"
            >
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t('soccer.emptyState.heading')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('soccer.emptyState.description')}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLoadUrl}
                    disabled={isScraping}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {isScraping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{t('flavours.analysisControls.load')}</span>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Soccer Flavour Analysis Container (rendered once match data is loaded) */}
          {isSoccerFlavour && parsedSoccerMatchData && (
            <div className="space-y-4">
              {/* 1. Tarjeta: Configuración General del Análisis */}
              {activeSegment && soccerDimAnalyses.length > 0 && (
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {t('soccer.generalConfig.cardTitle')}
                      </span>
                    </div>
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => setIsConfigCollapsed(prev => !prev)}
                      title={isConfigCollapsed ? t('soccer.dimension.expand') : t('soccer.dimension.collapse')}
                      aria-label={isConfigCollapsed ? t('soccer.dimension.expand') : t('soccer.dimension.collapse')}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                    >
                      {isConfigCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  }
                  className="bg-white/95 dark:bg-gray-900/95 shadow-sm"
                >
                  {!isConfigCollapsed && (
                    <SoccerGeneralConfigPanel
                      segment={activeSegment}
                      players={activeSegment.activePlayers}
                      AC={soccerDimAnalyses[0].AC}
                      passCounts={soccerDimAnalyses[0].passCounts}
                      teamKey={activeSegment.team}
                      propagationConfig={soccerPropagationConfig}
                      onUpdatePropagation={setSoccerPropagationConfig}
                      blockingConfig={soccerBlockingConfig}
                      onUpdateBlocking={setSoccerBlockingConfig}
                      synergyConfig={soccerSynergyConfigs['dribblesWon'] || { type: 'none', k: 1.0 }}
                      onUpdateSynergy={nextCfg => {
                        setSoccerSynergyConfigs(prev => {
                          const updated = { ...prev };
                          SOCCER_CONCEPTS.forEach(c => {
                            updated[c.key] = nextCfg;
                          });
                          return updated;
                        });
                      }}
                      relativeConfig={soccerRelativeConfig}
                      onUpdateRelativeAdjustment={setSoccerRelativeConfig}
                      equalizationConfig={soccerEqualizationConfig}
                      onUpdateEqualization={setSoccerEqualizationConfig}
                      owaConfig={soccerOwaConfig}
                      onUpdateOwa={setSoccerOwaConfig}
                      dimAffinityMatrix={soccerDimAffinity}
                      onUpdateDimAffinity={setSoccerDimAffinity}
                      crestUrl={activeSegment.team === 'home' ? soccerTimeline?.homeCrestUrl : soccerTimeline?.awayCrestUrl}
                    />
                  )}
                </Card>
              )}

              {/* 2. Barra de Agrupador de Pestañas (Análisis Segmentado / Análisis Integrado + Botón Generar Informe) */}
              <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-blue-600/80 dark:border-blue-500/80 px-2 pt-2 -mb-2">
                <div className="flex items-end gap-1.5 -mb-[2px]">
                  <button
                    type="button"
                    onClick={() => setActiveSoccerTab('segments')}
                    className={`inline-flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-xl transition-all cursor-pointer select-none border-t-2 border-l-2 border-r-2 ${
                      activeSoccerTab === 'segments'
                        ? 'bg-white dark:bg-gray-900 border-blue-600/80 dark:border-blue-500/80 text-blue-600 dark:text-blue-400 shadow-xs z-10'
                        : 'bg-gray-100/80 dark:bg-gray-800/60 border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/80'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>{t('soccer.tabs.segmentAnalysis')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSoccerTab('integral')}
                    className={`inline-flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-xl transition-all cursor-pointer select-none border-t-2 border-l-2 border-r-2 ${
                      activeSoccerTab === 'integral'
                        ? 'bg-white dark:bg-gray-900 border-blue-600/80 dark:border-blue-500/80 text-blue-600 dark:text-blue-400 shadow-xs z-10'
                        : 'bg-gray-100/80 dark:bg-gray-800/60 border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/80'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('soccer.tabs.integralAnalysis')}</span>
                  </button>
                </div>

                {/* Botón Generar Informe en el espacio libre del lado derecho */}
                <div className="pb-2">
                  <button
                    type="button"
                    onClick={handleGenerateSoccerReport}
                    disabled={isGeneratingSoccerReport}
                    className="h-9 inline-flex items-center justify-center gap-2 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none"
                    title={t('soccer.report.generatePdfButton')}
                  >
                    {isGeneratingSoccerReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span>{t('soccer.report.generatePdfButton')}</span>
                  </button>
                </div>
              </div>

              {/* 3. Contenido Pestaña 1: Análisis por Segmento */}
              {activeSoccerTab === 'segments' && (
                <div className="space-y-4">
                  {/* Tarjeta Separada: Segmentación Temporal del Partido */}
                  {soccerTimeline && (
                    <Card
                      title={
                        <div className="flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {t('soccer.timeline.cardTitle')}
                          </span>
                        </div>
                      }
                      action={
                        <button
                          type="button"
                          onClick={() => setIsTimelineCollapsed(prev => !prev)}
                          title={isTimelineCollapsed ? t('soccer.dimension.expand') : t('soccer.dimension.collapse')}
                          aria-label={isTimelineCollapsed ? t('soccer.dimension.expand') : t('soccer.dimension.collapse')}
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-2xs cursor-pointer select-none"
                        >
                          {isTimelineCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      }
                      className="bg-white/95 dark:bg-gray-900/95 shadow-sm"
                    >
                      {!isTimelineCollapsed && (
                        <SoccerTimelineSlider
                          totalMinutes={soccerTimeline.totalMinutes}
                          homeTeamName={soccerTimeline.homeTeamName}
                          awayTeamName={soccerTimeline.awayTeamName}
                          homeCrestUrl={soccerTimeline.homeCrestUrl}
                          awayCrestUrl={soccerTimeline.awayCrestUrl}
                          homeSegments={soccerTimeline.homeSegments}
                          awaySegments={soccerTimeline.awaySegments}
                          homeEvents={soccerTimeline.homeEvents}
                          awayEvents={soccerTimeline.awayEvents}
                          selectedSegmentId={activeSegment?.id || ''}
                          onSelectSegment={seg => setSelectedSegmentId(seg.id)}
                        />
                      )}
                    </Card>
                  )}

                  {/* 12 Dimension Cards */}
                  {soccerDimAnalyses.map(analysis => (
                    <SoccerDimensionCard
                      key={analysis.concept}
                      concept={analysis.concept}
                      conceptTitle={analysis.conceptName}
                      analysis={analysis}
                      onRecalculate={handleExecute}
                    />
                  ))}

                  {/* Aggregated Analysis Card (Ranking & Scores) */}
                  {soccerAggAnalysis && (
                    <SoccerAggregateCard
                      analysis={soccerAggAnalysis}
                    />
                  )}
                </div>
              )}

              {/* Contenido Pestaña 2: Análisis Integral del Partido */}
              {activeSoccerTab === 'integral' && soccerTimeline && (
                <SoccerIntegralMatchAnalysis
                  timeline={soccerTimeline}
                  matchData={parsedSoccerMatchData}
                  owaConfig={soccerOwaConfig}
                  dimAffinityMatrix={soccerDimAffinity}
                  synergyConfigs={soccerSynergyConfigs}
                  propagationConfig={soccerPropagationConfig}
                  blockingConfig={soccerBlockingConfig}
                  relativeConfig={soccerRelativeConfig}
                  equalizationConfig={soccerEqualizationConfig}
                />
              )}
            </div>
          )}

          {/* Persistent Author & Intellectual Property Footer */}
          <AppFooter />
        </div>
      </main>
    </div>
  );
};
