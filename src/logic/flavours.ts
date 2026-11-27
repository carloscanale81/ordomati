import { OrdomaticaDataset } from './types';
import { createRecreationMatchData2007644, DEFAULT_SOCCER_MATCH_URL } from './matchScraper';
import { SoccerConcept } from './soccerAnalysis';

export { DEFAULT_SOCCER_MATCH_URL };

/**
 * Supported domain-specific flavour identifiers.
 */
export type FlavourId = 'match-soccer-mvp';

/**
 * Top-level navigation view identifiers across the application.
 */
export type AppMenuView = 'intro' | 'ordomachine' | 'function-syntax' | FlavourId;

/**
 * Visual watermark illustration variant rendered behind flavour views.
 */
export type FlavourWatermarkVariant = 'soccer-ball';

/**
 * Static configuration describing each flavour entry and its UI bindings.
 */
export interface FlavourDefinition {
  id: FlavourId;
  filePrefix: string;
  watermarkVariant: FlavourWatermarkVariant;
}

/**
 * Optional snapshot of the complete soccer MVP model configuration for JSON export/import.
 */
export interface SoccerFlavourModelConfig {
  activeSoccerTab?: 'segments' | 'integral';
  selectedSegmentId?: string;
  propagationConfig?: any;
  blockingConfig?: any;
  synergyConfig?: any;
  relativeConfig?: any;
  equalizationConfig?: any;
  dimensionOverrides?: Record<string, any>;
  propagationConfigs?: Record<string, any>;
  blockingConfigs?: Record<string, any>;
  synergyConfigs?: Record<string, any>;
  relativeConfigs?: Record<string, any>;
  equalizationConfigs?: Record<string, any>;
  owaConfig?: any;
  dimAffinityMatrix?: number[][];
  activeDimensions?: SoccerConcept[];
  soccerAnalysisCalculated?: boolean;
}

/**
 * Serializable case container stored and exchanged by each flavour page.
 */
export interface FlavourAnalysisCase {
  version: string;
  flavour: FlavourId;
  description?: string; // Optional user description of the analysis / match case
  sourceUrl: string;
  matchDataJson?: string;
  updatedAt: string;
  exportedAt?: string;
  dataset?: OrdomaticaDataset;
  soccerModelConfig?: SoccerFlavourModelConfig;
}

/**
 * Ordered registry of available flavours.
 */
export const FLAVOUR_DEFINITIONS: Record<FlavourId, FlavourDefinition> = {
  'match-soccer-mvp': {
    id: 'match-soccer-mvp',
    filePrefix: 'match_soccer_mvp',
    watermarkVariant: 'soccer-ball'
  }
};

export const FLAVOUR_LIST: FlavourDefinition[] = [
  FLAVOUR_DEFINITIONS['match-soccer-mvp']
];

/**
 * Type guard verifying whether an arbitrary value matches a known FlavourId.
 */
export const isFlavourId = (value: unknown): value is FlavourId =>
  value === 'match-soccer-mvp';

/**
 * Creates a clean initial analysis case state for a given flavour.
 */
export const createInitialFlavourState = (flavour: FlavourId): FlavourAnalysisCase => ({
  version: '1.0.0',
  flavour,
  sourceUrl: flavour === 'match-soccer-mvp' ? DEFAULT_SOCCER_MATCH_URL : '',
  matchDataJson: '',
  updatedAt: new Date().toISOString()
});
