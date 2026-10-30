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

import { AutoAnalysisResult, FileRecordItem } from '../types';

/**
 * Intelligently analyzes file structure and generates optimal splitting strategy automatically
 */
export function analyzeFileForAutoSplit(
  file: FileRecordItem,
  sampleContent?: string
): AutoAnalysisResult {
  const format = file.format;
  const sample = sampleContent || (file.previewLines ? file.previewLines.join('\n') : '');
  const lines = sample.split(/\r?\n/).filter(Boolean);
  const totalRecords = file.recordsCount || 100;

  // 1. Check for prominent delimiter like --- or === or ###
  const delimiterMatch = sample.match(/(?:^|\n)(---|===|###|--- RECORD ---|=== END ===)(?:\n|$)/);
  if (delimiterMatch) {
    const delim = delimiterMatch[1];
    const estimatedDelimCount = Math.max(2, Math.round(sample.split(delim).length * (file.size / Math.max(1024, sample.length))));
    return {
      detectedTypeLabel: 'Delimited Document (বাউন্ডারি চিহ্নিত ফাইল)',
      recommendedMode: 'delimiter',
      recommendedBatchSize: 1,
      recommendedDelimiter: delim,
      hasHeaders: false,
      retainHeader: false,
      expectedPartitions: Math.max(2, Math.min(estimatedDelimCount, 500)),
      reasonTag: `Marker "${delim}"`,
      explanation: `Detected boundary marker "${delim}". Automatically splitting at each natural record divider.`,
      explanationBn: `ফাইলে "${delim}" চিহ্নিতকারী পাওয়া গেছে। স্বয়ংক্রিয়ভাবে প্রতিটি সেকশন আলাদা ফাইলে ভাগ করা হবে।`,
    };
  }

  // 2. CSV / TSV Table
  if (format === 'csv' || format === 'tsv') {
    let optimalBatch = 50;
    if (totalRecords <= 100) optimalBatch = 20;
    else if (totalRecords <= 1000) optimalBatch = 50;
    else if (totalRecords <= 10000) optimalBatch = 250;
    else optimalBatch = 500;

    const partitions = Math.ceil(totalRecords / optimalBatch);

    return {
      detectedTypeLabel: format === 'csv' ? 'CSV Structured Table (সিএসভি ডেটা টেবিল)' : 'TSV Tabular File (টিএসভি টেবিল)',
      recommendedMode: 'csv_row',
      recommendedBatchSize: optimalBatch,
      hasHeaders: true,
      retainHeader: true,
      expectedPartitions: partitions,
      reasonTag: `${optimalBatch} Rows / Partition`,
      explanation: `Detected structured table with header row. Automatically packaging ${optimalBatch} rows per file while retaining column headers in every partition.`,
      explanationBn: `এটি একটি টেবিল ফাইল। স্বয়ংক্রিয়ভাবে প্রতি ফাইলে ${optimalBatch}টি করে রেকর্ড রাখা হবে এবং প্রতিটি ফাইলে হেডারের নাম অক্ষত থাকবে।`,
    };
  }

  // 3. JSON Lines or JSON Array
  if (format === 'json' || format === 'jsonl') {
    let optimalBatch = 50;
    if (totalRecords <= 200) optimalBatch = 25;
    else if (totalRecords <= 2000) optimalBatch = 100;
    else optimalBatch = 250;

    const partitions = Math.ceil(totalRecords / optimalBatch);

    return {
      detectedTypeLabel: format === 'jsonl' ? 'JSON Lines Stream (জেসন লাইনস)' : 'JSON Object Archive (জেসন ডেটা)',
      recommendedMode: 'group',
      recommendedBatchSize: optimalBatch,
      hasHeaders: false,
      retainHeader: false,
      expectedPartitions: partitions,
      reasonTag: `${optimalBatch} Objects / Part`,
      explanation: `Detected structured JSON entries. Grouping into balanced ${optimalBatch}-object files for easy parsing and memory efficiency.`,
      explanationBn: `এটি জেসন (JSON) ফাইল। স্বয়ংক্রিয়ভাবে প্রতি ফাইলে ${optimalBatch}টি অবজেক্ট গুচ্ছাকারে আলাদা করা হবে।`,
    };
  }

  // 4. Structured Server Logs
  if (format === 'structured_log') {
    let optimalBatch = 100;
    if (totalRecords <= 300) optimalBatch = 50;
    else if (totalRecords <= 5000) optimalBatch = 100;
    else optimalBatch = 500;

    const partitions = Math.ceil(totalRecords / optimalBatch);

    return {
      detectedTypeLabel: 'Server & Access Logs (সার্ভার লগ ফাইল)',
      recommendedMode: 'group',
      recommendedBatchSize: optimalBatch,
      hasHeaders: false,
      retainHeader: false,
      expectedPartitions: partitions,
      reasonTag: `${optimalBatch} Log Entries / Part`,
      explanation: `Detected timestamped server logs. Grouping ${optimalBatch} entries per file with automatic password and session token redaction enabled.`,
      explanationBn: `এটি সার্ভার লগ ফাইল। প্রতি ফাইলে ${optimalBatch}টি লগ এন্ট্রি রাখা হবে এবং গোপনীয় পাসওয়ার্ড ও টোকেন স্বয়ংক্রিয়ভাবে মাস্ক করা হবে।`,
    };
  }

  // 5. Plain Text
  let optimalBatch = 100;
  if (totalRecords <= 150) optimalBatch = 25;
  else if (totalRecords <= 1000) optimalBatch = 50;
  else optimalBatch = 100;

  const partitions = Math.ceil(totalRecords / optimalBatch);

  return {
    detectedTypeLabel: 'Plain Text Document (সাধারণ টেক্সট ফাইল)',
    recommendedMode: 'group',
    recommendedBatchSize: optimalBatch,
    hasHeaders: false,
    retainHeader: false,
    expectedPartitions: partitions,
    reasonTag: `${optimalBatch} Lines / File`,
    explanation: `Detected standard text lines. Dividing into balanced ${optimalBatch}-line files optimized for readability and archiving.`,
    explanationBn: `ফাইলটি স্বয়ংক্রিয়ভাবে প্রতি ফাইলে ${optimalBatch} লাইন করে সুন্দরভাবে ভাগ করে জিপ (ZIP) তৈরি করবে।`,
  };
}
