import { FlavourId } from './flavours';

/**
 * Case Examples Loader for Ordomatics & Ordoexpertos.
 * Discovers and provides exported cases stored in the examples directories.
 */

export interface CaseExample {
  id: string;
  fileName: string;
  displayName: string;
  description?: string;
  category: 'ordomachine' | 'flavour';
  flavourId?: FlavourId;
  data: any;
}

/**
 * Extracts a human-readable description from an exported JSON case or dataset.
 */
export const extractExampleDescription = (data: any): string => {
  if (!data) return '';
  if (typeof data.description === 'string' && data.description.trim()) {
    return data.description.trim();
  }
  if (typeof data.dataset?.description === 'string' && data.dataset.description.trim()) {
    return data.dataset.description.trim();
  }
  if (typeof data.dataset?.name === 'string' && data.dataset.name.trim()) {
    return data.dataset.name.trim();
  }
  if (typeof data.name === 'string' && data.name.trim()) {
    return data.name.trim();
  }
  if (typeof data.title === 'string' && data.title.trim()) {
    return data.title.trim();
  }
  return '';
};

const mapFolderToFlavourId = (folder: string, data?: any): FlavourId | null => {
  const norm = folder.toLowerCase().replace(/_/g, '-');
  if (norm === 'match-soccer-mvp' || norm === 'soccer' || norm === 'futbol') {
    return 'match-soccer-mvp';
  }
  if (data?.flavour === 'match-soccer-mvp') {
    return 'match-soccer-mvp';
  }
  return null;
};

/**
 * Returns all root case examples for the main Ordomachine workspace.
 */
export const getCaseExamples = (): CaseExample[] => {
  const map = new Map<string, CaseExample>();

  try {
    const modules = import.meta.glob<any>('../examples/**/*.json', { eager: true });
    for (const [path, mod] of Object.entries(modules)) {
      const rel = path.replace(/^\.\.\/examples\//, '');
      const parts = rel.split('/');
      // Root level files belong to main Ordomachine
      if (parts.length === 1) {
        const fileName = parts[0];
        if (!fileName || fileName.startsWith('.')) continue;
        const data = mod?.default || mod;
        const description = extractExampleDescription(data);
        map.set(fileName, {
          id: path,
          fileName,
          displayName: fileName,
          description,
          category: 'ordomachine',
          data
        });
      }
    }
  } catch (err) {
    console.warn('Could not glob case examples:', err);
  }

  return Array.from(map.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));
};

/**
 * Returns case examples belonging to a specific Ordoexperto / flavour.
 */
export const getFlavourExamples = (targetFlavourId: FlavourId): CaseExample[] => {
  const map = new Map<string, CaseExample>();

  try {
    const modules = import.meta.glob<any>('../examples/**/*.json', { eager: true });
    for (const [path, mod] of Object.entries(modules)) {
      const rel = path.replace(/^\.\.\/examples\//, '');
      const parts = rel.split('/');
      // Subfolders belong to specific Ordoexpertos
      if (parts.length > 1) {
        const folder = parts[0];
        const fileName = parts.slice(1).join('/');
        if (!fileName || fileName.startsWith('.')) continue;
        const data = mod?.default || mod;
        const flavourId = mapFolderToFlavourId(folder, data);
        if (flavourId === targetFlavourId) {
          const description = extractExampleDescription(data);
          map.set(fileName, {
            id: path,
            fileName,
            displayName: fileName,
            description,
            category: 'flavour',
            flavourId,
            data
          });
        }
      }
    }
  } catch (err) {
    console.warn('Could not glob flavour examples:', err);
  }

  return Array.from(map.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));
};

/**
 * Returns all flavour examples grouped by flavourId.
 */
export const getAllFlavourExamples = (): Record<string, CaseExample[]> => {
  const result: Record<string, CaseExample[]> = {};

  try {
    const modules = import.meta.glob<any>('../examples/**/*.json', { eager: true });
    for (const [path, mod] of Object.entries(modules)) {
      const rel = path.replace(/^\.\.\/examples\//, '');
      const parts = rel.split('/');
      if (parts.length > 1) {
        const folder = parts[0];
        const fileName = parts.slice(1).join('/');
        if (!fileName || fileName.startsWith('.')) continue;
        const data = mod?.default || mod;
        const flavourId = mapFolderToFlavourId(folder, data);
        if (flavourId) {
          if (!result[flavourId]) result[flavourId] = [];
          const description = extractExampleDescription(data);
          result[flavourId].push({
            id: path,
            fileName,
            displayName: fileName,
            description,
            category: 'flavour',
            flavourId,
            data
          });
        }
      }
    }
  } catch (err) {
    console.warn('Could not glob all flavour examples:', err);
  }

  for (const k of Object.keys(result)) {
    result[k].sort((a, b) => a.fileName.localeCompare(b.fileName));
  }

  return result;
};
