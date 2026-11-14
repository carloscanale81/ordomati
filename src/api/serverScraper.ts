import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import {
  extractMatchCentreDataFromHtml,
  enrichMatchDataWithMetadata,
  scrapeMatchData,
  ScrapeMatchResult
} from '../logic/matchScraper';

const execFileAsync = promisify(execFile);

/**
 * Searches system paths for installed Chromium-based browsers (Chrome or Edge)
 * to execute authentic client-rendered page DOM retrieval.
 */
export function findSystemBrowserBinary(): string | null {
  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths = [
    `${programFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`,
    `${localAppData}\\Google\\Chrome\\Application\\chrome.exe`,
    `${programFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${programFilesX86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
  ];

  for (const path of candidatePaths) {
    if (path && fs.existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Fetches page HTML using the local browser engine with legitimate client capabilities,
 * preventing bot detection barriers from returning 403 or corrupt data.
 */
export async function fetchMatchHtmlWithBrowser(targetUrl: string): Promise<string | null> {
  const binary = findSystemBrowserBinary();
  if (!binary) return null;

  try {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      '--dump-dom',
      targetUrl
    ];

    const { stdout } = await execFileAsync(binary, args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 25000
    });

    return stdout;
  } catch (err) {
    console.warn('[serverScraper] Browser DOM dump failed or timed out:', err);
    return null;
  }
}

/**
 * Fetches page HTML using HTTP fetch with full legitimate browser headers.
 */
export async function fetchMatchHtmlWithHeaders(targetUrl: string): Promise<string | null> {
  try {
    const urlObj = new URL(targetUrl);
    const origin = urlObj.origin;

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': origin + '/',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok) {
      return await res.text();
    }
  } catch (err) {
    console.warn('[serverScraper] HTTP fetch with headers failed:', err);
  }
  return null;
}

/**
 * Server-side entry point for match scraping that guarantees authentic live match extraction.
 * 1. Tries local browser DOM extraction with legitimate client capabilities.
 * 2. Tries HTTP fetch with complete browser-compliant headers.
 * 3. Falls back to canonical recreation dataset if network is unavailable.
 */
export async function scrapeMatchServer(targetUrl: string): Promise<ScrapeMatchResult> {
  const trimmed = (targetUrl || '').trim();
  if (!trimmed) {
    return {
      success: false,
      jsonString: '',
      source: 'manual',
      error: 'URL_EMPTY'
    };
  }

  const urlMatchId = trimmed.match(/\/matches\/(\d+)/i);
  const parsedUrlMatchId = urlMatchId ? parseInt(urlMatchId[1], 10) : undefined;

  // 1. Try local browser DOM dump
  const browserHtml = await fetchMatchHtmlWithBrowser(trimmed);
  if (browserHtml) {
    const extracted = extractMatchCentreDataFromHtml(browserHtml);
    if (extracted && (extracted.home || extracted.players || extracted.events)) {
      enrichMatchDataWithMetadata(extracted, trimmed, browserHtml);
      const mId = typeof extracted.matchId === 'number' ? extracted.matchId : parsedUrlMatchId;
      extracted.matchId = mId;
      const homeTeam = (extracted.home as any)?.name || 'Home';
      const awayTeam = (extracted.away as any)?.name || 'Away';
      const matchTitle = `${homeTeam} vs ${awayTeam} (Match ${mId || ''})`.trim();

      return {
        success: true,
        matchId: mId,
        matchTitle,
        matchData: extracted,
        jsonString: JSON.stringify(extracted, null, 2),
        source: 'live-scraped'
      };
    }
  }

  // 2. Try HTTP fetch with authentic browser headers
  const httpHtml = await fetchMatchHtmlWithHeaders(trimmed);
  if (httpHtml) {
    const extracted = extractMatchCentreDataFromHtml(httpHtml);
    if (extracted && (extracted.home || extracted.players || extracted.events)) {
      enrichMatchDataWithMetadata(extracted, trimmed, httpHtml);
      const mId = typeof extracted.matchId === 'number' ? extracted.matchId : parsedUrlMatchId;
      extracted.matchId = mId;
      const homeTeam = (extracted.home as any)?.name || 'Home';
      const awayTeam = (extracted.away as any)?.name || 'Away';
      const matchTitle = `${homeTeam} vs ${awayTeam} (Match ${mId || ''})`.trim();

      return {
        success: true,
        matchId: mId,
        matchTitle,
        matchData: extracted,
        jsonString: JSON.stringify(extracted, null, 2),
        source: 'live-scraped'
      };
    }
  }

  // 3. Fallback to match recreation dataset
  return await scrapeMatchData(trimmed);
}
