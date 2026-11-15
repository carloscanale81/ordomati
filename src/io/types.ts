import { OrdomaticaDataset, Characteristic } from '../logic/types';

/**
 * Metadata accompanying an exported Ordomatics case file.
 */
export interface OrdomaticaCaseMetadata {
  version: string;
  exportedAt: string;
  elementsCount: number;
  dimensionsCount: number;
}

/**
 * Descriptive dimension entry in exported JSON schema.
 */
export interface ExportedDimension extends Characteristic {
  granularity?: number;
  semantics?: 'core' | 'support';
  distanceMatrix?: (number | null)[][];
  blockingVector?: number[];
  blockingConfig?: { type: 'standard' | 'custom'; customExpr?: string };
  propagationConfig?: { type: string; limit: number; l1?: number; customExpr?: string };
  synergyConfig?: { type: string; k: number; customExpr?: string };
  adjustmentConfig?: {
    targetValue: 'vp' | 'vc';
    relativeContrastDimensionIndex: number;
    equalizationMode: 'none' | 'maximum' | 'target';
    targetObjective: number;
  };
  calculationTarget?: 'vp' | 'ac' | 'vc';
  customDirectAffinityMatrix?: number[][];
  customAutoinducedAffinityMatrix?: number[][];
  customContextualAffinityMatrix?: number[][];
}

/**
 * Descriptive dataset structure for export/import.
 */
export interface ExportedDataset extends OrdomaticaDataset {
  dimensions?: ExportedDimension[];
  criteriaCorrelationMatrix?: number[][];
  orderedWeightedAveragingWeights?: number[];
}

/**
 * Full case file structure designed for seamless saving and resuming of analysis sessions.
 */
export interface OrdomaticaCaseFile {
  version: string;
  exportedAt: string;
  dataset: ExportedDataset;
}
