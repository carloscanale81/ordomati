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
    '/usr/lib/chromium/chromium',
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
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-blink-features=AutomationControlled',
      '--lang=es-ES,es,en-US,en',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
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
 * Executes a native curl process with realistic HTTP/2, cipher fingerprints, and browser headers.
 * Native curl in server environments (Linux/Windows) successfully circumvents Node.js TLS fingerprint
 * detection (JA3/JA4) enforced by Cloudflare WAF.
 */
export async function fetchMatchHtmlWithCurl(targetUrl: string): Promise<string | null> {
  try {
    const urlObj = new URL(targetUrl);
    const origin = urlObj.origin;

    const curlCandidates = ['curl', 'curl.exe', '/usr/bin/curl'];
    let curlBin: string | null = null;
    for (const c of curlCandidates) {
      if (c.includes('/') || c.includes('\\')) {
        if (fs.existsSync(c)) {
          curlBin = c;
          break;
        }
      } else {
        curlBin = c;
        break;
      }
    }
    if (!curlBin) return null;

    const curlArgs = [
      '--silent',
      '--show-error',
      '--location',
      '--max-time', '15',
      '--compressed',
      '--http2',
      '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      '-H', 'Accept-Language: es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
      '-H', `Referer: ${origin}/`,
      '-H', 'sec-ch-ua: "Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      '-H', 'sec-ch-ua-mobile: ?0',
      '-H', 'sec-ch-ua-platform: "Windows"',
      '-H', 'sec-fetch-dest: document',
      '-H', 'sec-fetch-mode: navigate',
      '-H', 'sec-fetch-site: same-origin',
      '-H', 'sec-fetch-user: ?1',
      '-H', 'upgrade-insecure-requests: 1',
      targetUrl
    ];

    const { stdout } = await execFileAsync(curlBin, curlArgs, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 18000
    });

    return stdout;
  } catch (err) {
    console.warn('[serverScraper] Native curl fetch failed:', err);
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
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': origin + '/',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
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
 * Fetches page HTML using public web archive / proxy mirrors as resilient fallback
 * when Cloudflare IP rate-limits or challenges server IPs.
 */
export async function fetchMatchHtmlWithProxyFallback(targetUrl: string): Promise<string | null> {
  const mirrors = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://r.jina.ai/${targetUrl}`
  ];

  for (const mirror of mirrors) {
    try {
      const res = await fetch(mirror, {
        headers: { 'Accept': 'text/html,application/json,text/plain,*/*' },
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes('matchCentreData') || text.includes('playerIdNameDictionary'))) {
          return text;
        }
      }
    } catch {
      // Continue to next mirror
    }
  }

  return null;
}

/**
 * Server-side entry point for match scraping that guarantees authentic live match extraction.
 * 1. Tries local browser DOM extraction with legitimate client capabilities.
 * 2. Tries native curl with realistic TLS and browser headers (avoids Node TLS fingerprint block).
 * 3. Tries HTTP fetch with complete browser-compliant headers.
 * 4. Tries resilient mirror proxy endpoints.
 * 5. Falls back to canonical recreation dataset if all live channels are challenged.
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
  let serverErrors = '';

  // 1. Try local browser DOM dump
  try {
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
          source: 'live-scraped',
          isTestData: false
        };
      } else {
        serverErrors += '[Browser]: El navegador arrancó pero el DOM devuelto no contenía la estructura matchCentreData.\n';
      }
    } else {
      serverErrors += '[Browser]: No se encontró binario de Chromium o la ejecución headless finalizó sin salida.\n';
    }
  } catch (err: any) {
    serverErrors += `[Browser Error]: ${err?.message || String(err)}\n`;
  }

  // 2. Try native curl with realistic TLS/HTTP2 fingerprints
  try {
    const curlHtml = await fetchMatchHtmlWithCurl(trimmed);
    if (curlHtml) {
      const extracted = extractMatchCentreDataFromHtml(curlHtml);
      if (extracted && (extracted.home || extracted.players || extracted.events)) {
        enrichMatchDataWithMetadata(extracted, trimmed, curlHtml);
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
          source: 'live-scraped',
          isTestData: false
        };
      } else {
        serverErrors += '[Native Curl]: Descarga completada pero el HTML no contiene matchCentreData (posible pantalla anti-bot).\n';
      }
    }
  } catch (err: any) {
    serverErrors += `[Native Curl Error]: ${err?.message || String(err)}\n`;
  }

  // 3. Try HTTP fetch with authentic browser headers
  try {
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
          source: 'live-scraped',
          isTestData: false
        };
      } else {
        serverErrors += '[HTTP Fetch]: Petición finalizada pero el contenido HTML está ofuscado o bloqueado por WAF.\n';
      }
    }
  } catch (err: any) {
    serverErrors += `[HTTP Fetch Error]: ${err?.message || String(err)}\n`;
  }

  // 4. Try resilient mirror proxy
  try {
    const mirrorHtml = await fetchMatchHtmlWithProxyFallback(trimmed);
    if (mirrorHtml) {
      const extracted = extractMatchCentreDataFromHtml(mirrorHtml);
      if (extracted && (extracted.home || extracted.players || extracted.events)) {
        enrichMatchDataWithMetadata(extracted, trimmed, mirrorHtml);
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
          source: 'live-scraped',
          isTestData: false
        };
      }
    }
  } catch (err: any) {
    serverErrors += `[Proxy Fallback Error]: ${err?.message || String(err)}\n`;
  }

  // 5. Fallback to match recreation dataset
  const fallbackResult = await scrapeMatchData(trimmed);
  if (serverErrors.trim()) {
    fallbackResult.errorDetails = `${serverErrors.trim()}\n${fallbackResult.errorDetails || ''}`.trim();
  }
  return fallbackResult;
}
