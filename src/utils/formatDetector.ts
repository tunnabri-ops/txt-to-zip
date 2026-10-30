import { DetectedFormat } from '../types';

// Sensitive patterns: passwords, api keys, tokens, session cookies
const SENSITIVE_PATTERNS = [
  // Password / Secret in json, kv, query strings
  /(['"]?(?:password|passwd|pwd|secret|api_key|apikey|access_token|private_key|auth_token)['"]?\s*[:=]\s*['"]?)([^'"\s,;&]+)(['"]?)/gi,
  // Bearer tokens
  /(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)/gi,
  // JWT tokens (eyJ...)
  /(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/g,
  // Cookie session keys (PHPSESSID, JSESSIONID, session_id, connect.sid, remember_token)
  /((?:sessionid|phpsessid|jsessionid|remember_token|auth_token|connect\.sid|csrftoken)\s*=\s*)([^;\s]+)/gi,
  // Authorization headers
  /(Authorization:\s*)([^\r\n]+)/gi,
];

/**
 * Sanitizes sensitive credentials and active auth tokens from text
 */
export function sanitizeSecrets(text: string): { sanitized: string; count: number } {
  let count = 0;
  let result = text;

  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, (match, prefix, secret, suffix) => {
      count++;
      if (suffix !== undefined) {
        return `${prefix}[REDACTED_SECRET]${suffix}`;
      } else if (secret !== undefined) {
        return `${prefix}[REDACTED_SECRET]`;
      } else {
        return '[REDACTED_TOKEN]';
      }
    });
  }

  return { sanitized: result, count };
}

/**
 * Detect format from file sample and extension
 */
export function detectFormat(sample: string, filename: string): DetectedFormat {
  const ext = filename.split('.').pop()?.toLowerCase();

  const trimmed = sample.trim();

  // Extension hints
  if (ext === 'json') {
    return 'json';
  }
  if (ext === 'jsonl') {
    return 'jsonl';
  }
  if (ext === 'csv') {
    return 'csv';
  }
  if (ext === 'tsv') {
    return 'tsv';
  }
  if (ext === 'log') {
    return 'structured_log';
  }

  // Content inspection
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      JSON.parse(sample);
      return 'json';
    } catch {
      // continues
    }
  }

  // Check for JSON lines
  const lines = trimmed.split('\n').filter(Boolean);
  if (lines.length > 0) {
    const jsonLinesCount = lines.slice(0, 5).filter(line => {
      const l = line.trim();
      return (l.startsWith('{') && l.endsWith('}')) || (l.startsWith('[') && l.endsWith(']'));
    }).length;

    if (jsonLinesCount >= Math.min(3, lines.length)) {
      return 'jsonl';
    }
  }

  // Check for CSV / TSV
  if (lines.length > 1) {
    const firstLine = lines[0];
    const secondLine = lines[1];
    
    // Check TSV
    if (firstLine.includes('\t') && secondLine.includes('\t')) {
      const tabs1 = firstLine.split('\t').length;
      const tabs2 = secondLine.split('\t').length;
      if (tabs1 > 1 && tabs1 === tabs2) {
        return 'tsv';
      }
    }

    // Check CSV
    if (firstLine.includes(',') && secondLine.includes(',')) {
      const commas1 = firstLine.split(',').length;
      const commas2 = secondLine.split(',').length;
      if (commas1 > 1 && commas1 === commas2) {
        return 'csv';
      }
    }
  }

  // Structured logs (Timestamp [INFO/ERROR] Message or 127.0.0.1 - - [date] ...)
  const logPattern = /^\d{4}-\d{2}-\d{2}|^\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}|\[(INFO|WARN|ERROR|DEBUG|TRACE)\]|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i;
  if (lines.slice(0, 3).some(l => logPattern.test(l.trim()))) {
    return 'structured_log';
  }

  return 'plain_text';
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Estimate records in a file sample
 */
export function estimateRecords(totalBytes: number, sampleBytes: number, sampleRecords: number): number {
  if (sampleBytes === 0 || sampleRecords === 0) return 1;
  const bytesPerRecord = sampleBytes / sampleRecords;
  return Math.max(1, Math.round(totalBytes / bytesPerRecord));
}
