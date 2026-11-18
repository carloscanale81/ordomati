/**
 * Case Examples Loader for Ordomatics.
 * Discovers and provides exported cases stored in the examples directories.
 */

export interface CaseExample {
  id: string;
  fileName: string;
  displayName: string;
  data: any;
}

export const getCaseExamples = (): CaseExample[] => {
  const map = new Map<string, CaseExample>();

  // Discover all json files dynamically bundled via Vite glob
  try {
    const modules = import.meta.glob<any>('../examples/*.json', { eager: true });
    for (const [path, mod] of Object.entries(modules)) {
      const fileName = path.split('/').pop() || '';
      if (!fileName || fileName.startsWith('.')) continue;
      const data = mod?.default || mod;
      map.set(fileName, {
        id: path,
        fileName,
        displayName: fileName,
        data
      });
    }
  } catch (err) {
    console.warn('Could not glob case examples:', err);
  }

  // Sort alphabetically by file name
  return Array.from(map.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));
};
