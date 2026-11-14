/**
 * File I/O utilities for Web / Browser environments.
 */

/**
 * Triggers a client-side text/markup/data file download in the browser using Blob and URL.createObjectURL.
 */
export const downloadTextFile = (
  filename: string,
  content: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a client-side JSON file download in the browser using Blob and URL.createObjectURL.
 */
export const downloadJsonFile = (filename: string, jsonString: string): void => {
  downloadTextFile(filename, jsonString, 'application/json');
};

/**
 * Reads an HTML File input and parses its contents as JSON.
 */
export const readJsonFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        resolve(parsed);
      } catch (err) {
        reject(new Error('INVALID_JSON'));
      }
    };
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    reader.readAsText(file);
  });
};
