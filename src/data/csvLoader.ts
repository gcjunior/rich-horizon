/**
 * Optional CSV loader helper.
 * The prototype bundles a filtered JSON adapter derived from the supplied CSVs.
 * Papa Parse is available for a future document-picker import path.
 */
import Papa from 'papaparse';

export function parseCsvText<T extends Record<string, string>>(csvText: string): T[] {
  const result = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length > 0) {
    console.warn('CSV parse warnings', result.errors.slice(0, 3));
  }
  return result.data;
}
