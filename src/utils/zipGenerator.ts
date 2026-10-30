import JSZip from 'jszip';

export interface ZipProgressCallback {
  (percentage: number, currentFile: string): void;
}

export async function createZipArchive(
  files: { name: string; content: string }[],
  options: {
    zipFilename: string;
    compressionLevel?: number; // 0 to 9
    onProgress?: ZipProgressCallback;
  }
): Promise<{ blob: Blob; filename: string; size: number }> {
  const zip = new JSZip();

  // Add all files to zip
  for (const file of files) {
    zip.file(file.name, file.content);
  }

  const compression = options.compressionLevel && options.compressionLevel > 0 ? 'DEFLATE' : 'STORE';
  const compressionOptions = {
    level: options.compressionLevel || 6,
  };

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression,
      compressionOptions,
      mimeType: 'application/zip',
    },
    (metadata) => {
      if (options.onProgress) {
        options.onProgress(Math.round(metadata.percent), metadata.currentFile || '');
      }
    }
  );

  const cleanFilename = options.zipFilename.endsWith('.zip')
    ? options.zipFilename
    : `${options.zipFilename}.zip`;

  return {
    blob,
    filename: cleanFilename,
    size: blob.size,
  };
}

/**
 * Triggers a browser download for a Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers text download for a single file
 */
export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, filename);
}
