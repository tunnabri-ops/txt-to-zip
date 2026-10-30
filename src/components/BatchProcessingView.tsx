import React, { useState, useRef } from 'react';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Clock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { FileRecordItem, SplitConfig } from '../types';
import { FileProcessor } from '../utils/fileProcessor';
import { createZipArchive, downloadBlob } from '../utils/zipGenerator';
import { formatBytes } from '../utils/formatDetector';

interface BatchProcessingViewProps {
  files: FileRecordItem[];
  onUpdateFile: (file: FileRecordItem) => void;
  onOpenSplitter: (fileId: string) => void;
  onOpenUpload: () => void;
}

export const BatchProcessingView: React.FC<BatchProcessingViewProps> = ({
  files,
  onUpdateFile,
  onOpenSplitter,
  onOpenUpload,
}) => {
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1);
  const [batchProgress, setBatchProgress] = useState(0);
  const [totalRecordsDone, setTotalRecordsDone] = useState(0);
  const [totalFilesDone, setTotalFilesDone] = useState(0);
  const [batchSpeed, setBatchSpeed] = useState(0);

  const activeProcessorRef = useRef<FileProcessor | null>(null);

  const runBatch = async () => {
    if (files.length === 0) return;
    setIsBatchRunning(true);
    setCurrentProcessingIndex(0);
    setTotalRecordsDone(0);
    setTotalFilesDone(0);

    const defaultConfig: SplitConfig = {
      mode: 'group',
      recordsPerFile: 100,
      customType: 'record_count',
      customValue: 100,
      delimiter: '---',
      hasHeader: true,
      retainHeader: true,
      prefix: 'batch_part',
      extension: 'txt',
      subfolderGrouping: true,
      groupFolderSize: 50,
      redactSecrets: true,
      compressionLevel: 6,
    };

    let processedCount = 0;
    let recordsAccum = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentProcessingIndex(i);

      if (file.fileBlob) {
        const processor = new FileProcessor();
        activeProcessorRef.current = processor;

        try {
          const res = await processor.processFile(file.fileBlob, file.name, defaultConfig, {
            onProgress: (p) => {
              setBatchSpeed(p.speedBytesPerSec);
            },
          });

          recordsAccum += res.totalRecords;
          processedCount++;
          setTotalRecordsDone(recordsAccum);
          setTotalFilesDone(processedCount);
          setBatchProgress(Math.round((processedCount / files.length) * 100));

          onUpdateFile({
            ...file,
            status: 'completed',
            progress: 100,
            outputCount: res.outputFiles.length,
            outputTxtFiles: res.outputFiles,
            sanitizedSecretsCount: res.sanitizedSecretsCount,
          });
        } catch (e) {
          console.error('Batch item failed', e);
        }
      }
    }

    setIsBatchRunning(false);
    setCurrentProcessingIndex(-1);
    setBatchProgress(100);
  };

  const cancelBatch = () => {
    if (activeProcessorRef.current) {
      activeProcessorRef.current.cancel();
    }
    setIsBatchRunning(false);
    setCurrentProcessingIndex(-1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFB800] to-[#FF8800] flex items-center justify-center text-white shadow-lg shadow-[#FFB800]/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Batch Processing Engine</h2>
            <p className="text-xs text-[#A5A8BA]">
              Process multi-file queues concurrently with memory chunking and automatic format adaptation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isBatchRunning ? (
            <button
              onClick={runBatch}
              disabled={files.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2997FF] hover:bg-[#1a85ed] disabled:opacity-40 text-white text-xs md:text-sm font-bold shadow-lg shadow-[#2997FF]/25 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Process All {files.length} Files</span>
            </button>
          ) : (
            <button
              onClick={cancelBatch}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition-all"
            >
              <span>Stop Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#25283c] border border-white/5 rounded-2xl p-4">
          <span className="text-[11px] text-[#A5A8BA] block mb-1">Queue Size</span>
          <span className="text-xl font-bold text-white font-mono">{files.length} files</span>
        </div>
        <div className="bg-[#25283c] border border-white/5 rounded-2xl p-4">
          <span className="text-[11px] text-[#A5A8BA] block mb-1">Processed in Batch</span>
          <span className="text-xl font-bold text-[#2997FF] font-mono">{totalFilesDone} of {files.length}</span>
        </div>
        <div className="bg-[#25283c] border border-white/5 rounded-2xl p-4">
          <span className="text-[11px] text-[#A5A8BA] block mb-1">Records Partitioned</span>
          <span className="text-xl font-bold text-[#00F0FF] font-mono">{totalRecordsDone.toLocaleString()}</span>
        </div>
        <div className="bg-[#25283c] border border-white/5 rounded-2xl p-4">
          <span className="text-[11px] text-[#A5A8BA] block mb-1">Current Stream Speed</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {batchSpeed > 0 ? `${(batchSpeed / (1024 * 1024)).toFixed(1)} MB/s` : 'Idle'}
          </span>
        </div>
      </div>

      {/* Real-time Progress Bar */}
      {isBatchRunning && (
        <div className="bg-[#25283c] border border-white/5 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-xs text-white">
            <span className="font-semibold flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2997FF]" />
              Processing File {currentProcessingIndex + 1} of {files.length}...
            </span>
            <span className="font-mono text-[#2997FF]">{batchProgress}%</span>
          </div>
          <div className="w-full h-2 bg-[#171824] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2997FF] to-[#00F0FF] rounded-full transition-all duration-300"
              style={{ width: `${batchProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* File Queue List */}
      <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-4">Batch Queue Management</h3>
        <div className="space-y-2">
          {files.map((file, idx) => {
            const isCurrent = currentProcessingIndex === idx;
            const isDone = file.status === 'completed';

            return (
              <div
                key={file.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-[#1e2030] border-[#2997FF]'
                    : isDone
                    ? 'bg-[#1e2030]/60 border-emerald-500/20'
                    : 'bg-[#1e2030]/40 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#2997FF]/15 text-[#2997FF] flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{file.name}</h4>
                    <p className="text-[10px] text-[#A5A8BA]">
                      {formatBytes(file.size)} · {file.format} · ~{file.recordsCount.toLocaleString()} records
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {isCurrent ? (
                    <span className="text-xs text-[#2997FF] flex items-center gap-1.5 font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Splitting...
                    </span>
                  ) : isDone ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {file.outputCount || 0} Parts Ready
                    </span>
                  ) : (
                    <span className="text-xs text-[#A5A8BA]">Queued</span>
                  )}

                  <button
                    onClick={() => onOpenSplitter(file.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors"
                  >
                    Configure
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
