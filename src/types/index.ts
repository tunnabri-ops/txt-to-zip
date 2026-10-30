export type DetectedFormat = 
  | 'plain_text'
  | 'csv'
  | 'tsv'
  | 'json'
  | 'jsonl'
  | 'structured_log'
  | 'custom_delimiter'
  | 'unknown';

export type SplitMode = 'individual' | 'group' | 'custom';

export type CustomSplitType = 'record_count' | 'line_count' | 'file_size' | 'delimiter' | 'json_object' | 'csv_row';

export interface SplitConfig {
  mode: SplitMode;
  recordsPerFile: number; // for group mode (10, 50, 100, 500, 1000, custom)
  customType: CustomSplitType;
  customValue: string | number;
  delimiter: string;
  hasHeader: boolean;
  retainHeader: boolean;
  prefix: string;
  extension: string;
  subfolderGrouping: boolean;
  groupFolderSize: number;
  redactSecrets: boolean;
  compressionLevel: number; // 0 to 9
}

export type ProcessingStatus = 'idle' | 'analyzing' | 'processing' | 'paused' | 'completed' | 'error' | 'cancelled';

export interface FileRecordItem {
  id: string;
  name: string;
  size: number;
  type: string;
  format: DetectedFormat;
  date: string;
  recordsCount: number;
  status: ProcessingStatus;
  progress: number; // 0 to 100
  fileBlob?: File | Blob;
  previewLines: string[];
  outputCount?: number;
  outputZipSize?: number;
  outputZipBlob?: Blob;
  outputTxtFiles?: { name: string; content: string; size: number }[];
  error?: string;
  processedBytes: number;
  speedBytesPerSec: number;
  recordsPerSec: number;
  estimatedSecondsRemaining: number;
  sanitizedSecretsCount?: number;
}

export interface ProcessingMetrics {
  totalInputSize: number;
  totalProcessedBytes: number;
  totalRecordsProcessed: number;
  totalGeneratedTxtFiles: number;
  totalGeneratedZipSize: number;
  zipArchivesCount: number;
  txtFilesCount: number;
  csvJsonFilesCount: number;
  otherFilesCount: number;
  activeSpeed: number; // records per sec
}

export interface DayAnalytics {
  day: string;
  records: number;
  files: number;
  speed: number;
  color: string;
}
