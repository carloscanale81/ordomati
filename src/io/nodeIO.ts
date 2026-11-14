import { OrdomaticaDataset } from '../logic/types';
import { serializeFullCase, deserializeFullCase } from './serializer';

/**
 * Filesystem access operations for Node.js / MCP / backend API servers.
 * Always exports and imports the entire case state.
 */

export const exportCaseToFileNode = async (
  filePath: string,
  dataset: OrdomaticaDataset
): Promise<void> => {
  const fs = await import('fs/promises');
  const content = serializeFullCase(dataset);
  await fs.writeFile(filePath, content, 'utf-8');
};

export const importCaseFromFileNode = async (
  filePath: string
): Promise<OrdomaticaDataset> => {
  const fs = await import('fs/promises');
  const rawText = await fs.readFile(filePath, 'utf-8');
  return deserializeFullCase(rawText);
};

export const exportToJsonFileNode = exportCaseToFileNode;
export const importFromJsonFileNode = async (
  filePath: string,
  _currentDataset?: OrdomaticaDataset
): Promise<OrdomaticaDataset> => importCaseFromFileNode(filePath);
