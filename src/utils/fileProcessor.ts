import { SplitConfig } from '../types';
import { sanitizeSecrets } from './formatDetector';

export interface ProcessingCallbacks {
  onProgress: (progress: {
    percentage: number;
    processedBytes: number;
    recordsCount: number;
    outputCount: number;
    speedBytesPerSec: number;
    recordsPerSec: number;
    estimatedSecondsRemaining: number;
    sanitizedSecretsCount: number;
  }) => void;
  onChunkGenerated?: (fileName: string, content: string) => void;
}

export class FileProcessor {
  private isPaused = false;
  private isCancelled = false;
  private resumeResolver: (() => void) | null = null;

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    if (this.resumeResolver) {
      this.resumeResolver();
      this.resumeResolver = null;
    }
  }

  public cancel(): void {
    this.isCancelled = true;
    if (this.resumeResolver) {
      this.resumeResolver();
      this.resumeResolver = null;
    }
  }

  private async checkPauseOrCancel(): Promise<boolean> {
    if (this.isCancelled) return true;
    if (this.isPaused) {
      await new Promise<void>((resolve) => {
        this.resumeResolver = resolve;
      });
    }
    return this.isCancelled;
  }

  /**
   * Reads a file in streaming chunks, parses records, applies splitting logic, and collects or streams outputs.
   */
  public async processFile(
    file: File | Blob,
    filename: string,
    config: SplitConfig,
    callbacks: ProcessingCallbacks
  ): Promise<{
    outputFiles: { name: string; content: string; size: number }[];
    totalRecords: number;
    sanitizedSecretsCount: number;
  }> {
    this.isPaused = false;
    this.isCancelled = false;

    const totalBytes = file.size;
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const ext = config.extension.startsWith('.') ? config.extension : `.${config.extension}`;

    const chunkSize = 2 * 1024 * 1024; // 2MB read chunks
    let offset = 0;
    let remainder = '';
    let recordIndex = 0;
    let fileIndex = 1;
    let headerLine = '';
    let totalSanitizedCount = 0;

    const outputFiles: { name: string; content: string; size: number }[] = [];
    let currentBatch: string[] = [];
    let currentBatchBytes = 0;

    const startTime = performance.now();
    let lastReportTime = startTime;
    let lastReportBytes = 0;
    let lastReportRecords = 0;
    let currentSpeedBytes = 0;
    let currentSpeedRecords = 0;

    // Helper to flush current batch to an output file
    const flushBatch = () => {
      if (currentBatch.length === 0) return;

      let content = currentBatch.join('\n');
      if (config.retainHeader && headerLine && config.hasHeader && fileIndex > 1) {
        content = headerLine + '\n' + content;
      }

      if (config.redactSecrets) {
        const { sanitized, count } = sanitizeSecrets(content);
        content = sanitized;
        totalSanitizedCount += count;
      }

      const paddedIndex = String(fileIndex).padStart(4, '0');
      const folderPrefix = config.subfolderGrouping
        ? `batch_${Math.ceil(fileIndex / config.groupFolderSize)}/`
        : '';
      const partName = `${folderPrefix}${config.prefix || baseName}_part_${paddedIndex}${ext}`;

      const item = {
        name: partName,
        content,
        size: new Blob([content]).size,
      };

      outputFiles.push(item);
      if (callbacks.onChunkGenerated) {
        callbacks.onChunkGenerated(item.name, item.content);
      }

      fileIndex++;
      currentBatch = [];
      currentBatchBytes = 0;
    };

    // Determine target record batch size
    let targetRecordsPerFile = 1;
    if (config.mode === 'individual') {
      targetRecordsPerFile = 1;
    } else if (config.mode === 'group') {
      targetRecordsPerFile = Math.max(1, config.recordsPerFile);
    } else if (config.mode === 'custom') {
      if (config.customType === 'record_count' || config.customType === 'line_count' || config.customType === 'csv_row') {
        targetRecordsPerFile = Math.max(1, Number(config.customValue) || 100);
      }
    }

    const maxFileSizeLimit = (config.mode === 'custom' && config.customType === 'file_size')
      ? (Number(config.customValue) || 1) * 1024 * 1024
      : 0;

    // Process file in chunks
    while (offset < totalBytes) {
      if (await this.checkPauseOrCancel()) {
        throw new Error('Processing cancelled by user');
      }

      const end = Math.min(offset + chunkSize, totalBytes);
      const blobChunk = file.slice(offset, end);
      const textChunk = await blobChunk.text();
      offset = end;

      const combined = remainder + textChunk;
      let records: string[] = [];

      if (config.mode === 'custom' && config.customType === 'delimiter' && config.delimiter) {
        const parts = combined.split(config.delimiter);
        remainder = parts.pop() || '';
        records = parts;
      } else {
        const lines = combined.split(/\r?\n/);
        remainder = lines.pop() || '';
        records = lines;
      }

      // Check header on first batch
      if (config.hasHeader && !headerLine && records.length > 0) {
        headerLine = records.shift() || '';
        if (config.retainHeader) {
          currentBatch.push(headerLine);
        }
      }

      for (const record of records) {
        if (!record && config.mode !== 'individual') continue;

        recordIndex++;
        currentBatch.push(record);
        currentBatchBytes += record.length + 1;

        const shouldFlushByCount = maxFileSizeLimit === 0 && currentBatch.length >= targetRecordsPerFile;
        const shouldFlushBySize = maxFileSizeLimit > 0 && currentBatchBytes >= maxFileSizeLimit;

        if (shouldFlushByCount || shouldFlushBySize) {
          flushBatch();
        }
      }

      // Periodic progress reporting
      const now = performance.now();
      if (now - lastReportTime >= 100 || offset >= totalBytes) {
        const timeDiffSec = (now - lastReportTime) / 1000;
        const bytesDiff = offset - lastReportBytes;
        const recordsDiff = recordIndex - lastReportRecords;

        if (timeDiffSec > 0) {
          currentSpeedBytes = bytesDiff / timeDiffSec;
          currentSpeedRecords = recordsDiff / timeDiffSec;
        }

        const remainingBytes = totalBytes - offset;
        const etaSeconds = currentSpeedBytes > 0 ? Math.ceil(remainingBytes / currentSpeedBytes) : 0;
        const percentage = totalBytes > 0 ? Math.min(100, Math.round((offset / totalBytes) * 100)) : 100;

        callbacks.onProgress({
          percentage,
          processedBytes: offset,
          recordsCount: recordIndex,
          outputCount: outputFiles.length + (currentBatch.length > 0 ? 1 : 0),
          speedBytesPerSec: currentSpeedBytes,
          recordsPerSec: currentSpeedRecords,
          estimatedSecondsRemaining: etaSeconds,
          sanitizedSecretsCount: totalSanitizedCount,
        });

        lastReportTime = now;
        lastReportBytes = offset;
        lastReportRecords = recordIndex;

        // Yield to event loop to keep UI completely responsive
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    // Flush last remainder record if exists
    if (remainder.trim()) {
      recordIndex++;
      currentBatch.push(remainder);
    }

    // Final flush
    flushBatch();

    return {
      outputFiles,
      totalRecords: recordIndex,
      sanitizedSecretsCount: totalSanitizedCount,
    };
  }
}
