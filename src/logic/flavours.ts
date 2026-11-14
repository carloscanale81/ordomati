import { OrdomaticaDataset } from './types';
import { createRecreationMatchData2007644, DEFAULT_SOCCER_MATCH_URL } from './matchScraper';

export { DEFAULT_SOCCER_MATCH_URL };

/**
 * Supported domain-specific flavour identifiers.
 */
export type FlavourId = 'match-soccer-mvp' | 'race-driver';

/**
 * Top-level navigation view identifiers across the application.
 */
export type AppMenuView = 'ordomachine' | FlavourId;

/**
 * Visual watermark illustration variant rendered behind flavour views.
 */
export type FlavourWatermarkVariant = 'soccer-ball' | 'race-car';

/**
 * Static configuration describing each flavour entry and its UI bindings.
 */
export interface FlavourDefinition {
  id: FlavourId;
  filePrefix: string;
  watermarkVariant: FlavourWatermarkVariant;
}

/**
 * Serializable case container stored and exchanged by each flavour page.
 */
export interface FlavourAnalysisCase {
  version: string;
  flavour: FlavourId;
  sourceUrl: string;
  matchDataJson?: string;
  updatedAt: string;
  exportedAt?: string;
  dataset?: OrdomaticaDataset;
}

/**
 * Ordered registry of available flavours.
 */
export const FLAVOUR_DEFINITIONS: Record<FlavourId, FlavourDefinition> = {
  'match-soccer-mvp': {
    id: 'match-soccer-mvp',
    filePrefix: 'match_soccer_mvp',
    watermarkVariant: 'soccer-ball'
  },
  'race-driver': {
    id: 'race-driver',
    filePrefix: 'race_driver',
    watermarkVariant: 'race-car'
  }
};

export const FLAVOUR_LIST: FlavourDefinition[] = [
  FLAVOUR_DEFINITIONS['match-soccer-mvp'],
  FLAVOUR_DEFINITIONS['race-driver']
];

/**
 * Type guard verifying whether an arbitrary value matches a known FlavourId.
 */
export const isFlavourId = (value: unknown): value is FlavourId =>
  value === 'match-soccer-mvp' || value === 'race-driver';

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
