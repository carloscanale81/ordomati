import { OrdomaticaDataset } from '../logic/types';

/**
 * Metadata accompanying an exported Ordomatics case file.
 */
export interface OrdomaticaCaseMetadata {
  version: string;
  exportedAt: string;
  elementsCount: number;
  characteristicsCount: number;
}

/**
 * Full case file structure designed for seamless saving and resuming of analysis sessions.
 */
export interface OrdomaticaCaseFile {
  version: string;
  exportedAt: string;
  dataset: OrdomaticaDataset;
}
