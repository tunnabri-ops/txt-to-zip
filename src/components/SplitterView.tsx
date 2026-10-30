import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Download,
  Eye,
  Settings,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Archive,
  Layers,
  ChevronRight,
  FolderArchive,
  AlertTriangle,
  Lock,
  Sparkles,
  Zap,
  Cpu,
  HelpCircle,
  Check
} from 'lucide-react';
import { FileRecordItem, SplitConfig, SplitMode, CustomSplitType, DetectedFormat, AutoAnalysisResult } from '../types';
import { FileProcessor } from '../utils/fileProcessor';
import { createZipArchive, downloadBlob, downloadText } from '../utils/zipGenerator';
import { formatBytes, analyzeFileForAutoSplit } from '../utils/formatDetector';

interface SplitterViewProps {
  files: FileRecordItem[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onUpdateFile: (file: FileRecordItem) => void;
  onSwitchToZipView?: () => void;
}

export const SplitterView: React.FC<SplitterViewProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  onUpdateFile,
  onSwitchToZipView,
}) => {
  const currentFile = files.find((f) => f.id === selectedFileId) || files[0] || null;

  // Auto Analysis of active file
  const autoAnalysis = useMemo<AutoAnalysisResult | null>(() => {
    if (!currentFile) return null;
    return analyzeFileForAutoSplit(currentFile);
  }, [currentFile?.id, currentFile?.recordsCount, currentFile?.size]);

  // Split Configuration State - Default to 'auto' for zero-friction experience!
  const [config, setConfig] = useState<SplitConfig>({
    mode: 'auto',
    recordsPerFile: 50,
    customType: 'record_count',
    customValue: 100,
    delimiter: '---',
    hasHeader: true,
    retainHeader: true,
    prefix: '',
    extension: 'txt',
    subfolderGrouping: false,
    groupFolderSize: 50,
    redactSecrets: true,
    compressionLevel: 6,
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedBytes, setProcessedBytes] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [outputCount, setOutputCount] = useState(0);
  const [speedBytes, setSpeedBytes] = useState(0);
  const [speedRecords, setSpeedRecords] = useState(0);
  const [etaSeconds, setEtaSeconds] = useState(0);
  const [sanitizedCount, setSanitizedCount] = useState(0);
  const [generatedChunks, setGeneratedChunks] = useState<{ name: string; content: string; size: number }[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [generatedZipBlob, setGeneratedZipBlob] = useState<Blob | null>(null);
  const [selectedPreviewChunk, setSelectedPreviewChunk] = useState<{ name: string; content: string } | null>(null);

  const processorRef = useRef<FileProcessor | null>(null);

  // Sync prefix & auto-parameters if current file or autoAnalysis changes
  useEffect(() => {
    if (currentFile) {
      const base = currentFile.name.replace(/\.[^/.]+$/, '');
      setConfig((prev) => {
        const updated = {
          ...prev,
          prefix: prev.prefix || `${base}_split`,
        };

        if (autoAnalysis && prev.mode === 'auto') {
          updated.recordsPerFile = autoAnalysis.recommendedBatchSize;
          updated.retainHeader = autoAnalysis.retainHeader;
          updated.hasHeader = autoAnalysis.hasHeaders;
          if (autoAnalysis.recommendedDelimiter) {
            updated.delimiter = autoAnalysis.recommendedDelimiter;
          }
        }
        return updated;
      });
    }
  }, [currentFile?.id, autoAnalysis]);

  if (!currentFile) {
    return (
      <div className="bg-[#25283c] border border-white/5 rounded-3xl p-12 text-center">
        <Scissors className="w-12 h-12 text-[#2997FF] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">No File Selected</h3>
        <p className="text-sm text-[#A5A8BA] max-w-md mx-auto">
          Please upload or select a file from the dashboard to begin splitting.
        </p>
      </div>
    );
  }

  const startSplitting = async () => {
    if (!currentFile.fileBlob) {
      alert('File payload not loaded in browser memory.');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    setProgress(0);
    setProcessedBytes(0);
    setRecordsCount(0);
    setOutputCount(0);
    setSanitizedCount(0);
    setGeneratedChunks([]);
    setGeneratedZipBlob(null);

    // Apply auto analysis parameters if in Auto mode
    const effectiveConfig = { ...config };
    if (config.mode === 'auto' && autoAnalysis) {
      effectiveConfig.recordsPerFile = autoAnalysis.recommendedBatchSize;
      effectiveConfig.retainHeader = autoAnalysis.retainHeader;
      effectiveConfig.hasHeader = autoAnalysis.hasHeaders;
      if (autoAnalysis.recommendedDelimiter) {
        effectiveConfig.delimiter = autoAnalysis.recommendedDelimiter;
      }
    }

    const processor = new FileProcessor();
    processorRef.current = processor;

    try {
      const result = await processor.processFile(
        currentFile.fileBlob,
        currentFile.name,
        effectiveConfig,
        {
          onProgress: (p) => {
            setProgress(p.percentage);
            setProcessedBytes(p.processedBytes);
            setRecordsCount(p.recordsCount);
            setOutputCount(p.outputCount);
            setSpeedBytes(p.speedBytesPerSec);
            setSpeedRecords(p.recordsPerSec);
            setEtaSeconds(p.estimatedSecondsRemaining);
            setSanitizedCount(p.sanitizedSecretsCount);
          },
          onChunkGenerated: (name, content) => {
            setGeneratedChunks((prev) => {
              if (prev.length < 60) {
                return [...prev, { name, content, size: content.length }];
              }
              return prev;
            });
          },
        }
      );

      setGeneratedChunks(result.outputFiles);
      setIsProcessing(false);
      setProgress(100);

      // Update parent file record
      onUpdateFile({
        ...currentFile,
        status: 'completed',
        progress: 100,
        outputCount: result.outputFiles.length,
        outputTxtFiles: result.outputFiles,
        sanitizedSecretsCount: result.sanitizedSecretsCount,
      });
    } catch (err: any) {
      setIsProcessing(false);
      if (err.message !== 'Processing cancelled by user') {
        alert(`Error splitting file: ${err.message}`);
      }
    }
  };

  const handlePause = () => {
    if (processorRef.current && isProcessing) {
      processorRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResume = () => {
    if (processorRef.current && isProcessing) {
      processorRef.current.resume();
      setIsPaused(false);
    }
  };

  const handleCancel = () => {
    if (processorRef.current) {
      processorRef.current.cancel();
      setIsProcessing(false);
      setIsPaused(false);
    }
  };

  const handleReset = () => {
    handleCancel();
    setProgress(0);
    setProcessedBytes(0);
    setRecordsCount(0);
    setOutputCount(0);
    setGeneratedChunks([]);
    setGeneratedZipBlob(null);
  };

  const handleCreateAndDownloadZip = async () => {
    if (generatedChunks.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zipName = `${config.prefix || 'txt_split'}_archive.zip`;
      const zipResult = await createZipArchive(
        generatedChunks.map((c) => ({ name: c.name, content: c.content })),
        {
          zipFilename: zipName,
          compressionLevel: config.compressionLevel,
          onProgress: (p) => setZipProgress(p),
        }
      );

      setGeneratedZipBlob(zipResult.blob);
      downloadBlob(zipResult.blob, zipResult.filename);

      onUpdateFile({
        ...currentFile,
        outputZipSize: zipResult.size,
        outputZipBlob: zipResult.blob,
      });
    } catch (e: any) {
      alert(`Failed to build ZIP: ${e.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Selector & Quick Auto Action Bar */}
      <div className="bg-[#25283c] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2997FF]/15 text-[#2997FF] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A5A8BA] font-semibold uppercase tracking-wider">Active File:</span>
              <select
                value={currentFile.id}
                onChange={(e) => onSelectFile(e.target.value)}
                className="bg-[#1e2030] text-white text-xs font-bold py-1 px-3 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#2997FF]"
              >
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({formatBytes(f.size)})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-[#A5A8BA] mt-0.5">
              Detected format: <span className="text-white font-medium">{currentFile.format}</span> · Est. records: <span className="text-white font-medium">{currentFile.recordsCount.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* 1-Click Auto Run + Privacy Badge */}
        <div className="flex items-center gap-3">
          {!isProcessing && (
            <button
              onClick={() => {
                setConfig((prev) => ({ ...prev, mode: 'auto' }));
                setTimeout(() => startSplitting(), 50);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2997FF] to-[#00F0FF] text-white text-xs font-bold shadow-md shadow-[#2997FF]/20 hover:opacity-95 transition-all active:scale-98"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>1-Click Auto Split (অটো স্প্লিট)</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Privacy Guard Active</span>
          </div>
        </div>
      </div>

      {/* Main Splitter Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Split Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-[#2997FF]" />
                  Splitting Modes / মোড নির্বাচন
                </h2>
                <p className="text-xs text-[#A5A8BA]">
                  Choose Smart Auto for zero-config automatic splitting, or pick a manual mode
                </p>
              </div>
            </div>

            {/* 4 Mode Selectors: Auto is #1 Recommended */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
              {/* Option 0: Smart Auto Split (NEW & RECOMMENDED) */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'auto' })}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  config.mode === 'auto'
                    ? 'bg-gradient-to-b from-[#2997FF]/25 to-[#1e2030] border-[#00F0FF] shadow-lg shadow-[#2997FF]/20 ring-1 ring-[#00F0FF]/50'
                    : 'bg-[#1e2030] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="absolute top-2 right-2 bg-gradient-to-r from-[#2997FF] to-[#00F0FF] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Recommended
                </div>
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2997FF] to-[#00F0FF] text-white flex items-center justify-center mb-2 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5">✨ Smart Auto (অটো)</h3>
                <p className="text-[11px] text-[#A5A8BA] leading-tight">
                  Auto-detects data structure & creates balanced files.
                </p>
              </button>

              {/* Mode 1: Individual Split */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'individual' })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  config.mode === 'individual'
                    ? 'bg-[#2997FF]/15 border-[#2997FF] shadow-md shadow-[#2997FF]/10'
                    : 'bg-[#1e2030] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#2997FF]/20 text-[#2997FF] flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5">Individual Split</h3>
                <p className="text-[11px] text-[#A5A8BA] leading-tight">
                  1 separate TXT file per record or line item.
                </p>
              </button>

              {/* Mode 2: Group Split */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'group' })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  config.mode === 'group'
                    ? 'bg-[#2997FF]/15 border-[#2997FF] shadow-md shadow-[#2997FF]/10'
                    : 'bg-[#1e2030] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center mb-2">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5">Group Split</h3>
                <p className="text-[11px] text-[#A5A8BA] leading-tight">
                  10, 50, 100, 500, 1k or custom count per file.
                </p>
              </button>

              {/* Mode 3: Custom Split */}
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'custom' })}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  config.mode === 'custom'
                    ? 'bg-[#2997FF]/15 border-[#2997FF] shadow-md shadow-[#2997FF]/10'
                    : 'bg-[#1e2030] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] flex items-center justify-center mb-2">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white mb-0.5">Custom Split</h3>
                <p className="text-[11px] text-[#A5A8BA] leading-tight">
                  Delimiter, size, line count, CSV row or JSON.
                </p>
              </button>
            </div>

            {/* Smart Auto Explanation Panel (Shown when Auto mode is selected) */}
            {config.mode === 'auto' && autoAnalysis && (
              <div className="bg-gradient-to-br from-[#1e2030] via-[#212437] to-[#1a1d2e] p-5 rounded-2xl border border-[#2997FF]/30 mb-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-[#2997FF]/20 text-[#2997FF]">
                      <Cpu className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Auto Data Intelligence (অটো অ্যানালাইজার)</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                          Analysis Ready
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#A5A8BA]">
                        Structure: <span className="text-[#00F0FF] font-semibold">{autoAnalysis.detectedTypeLabel}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#2997FF] font-mono font-bold bg-[#2997FF]/10 px-2.5 py-1 rounded-lg">
                    {autoAnalysis.reasonTag}
                  </span>
                </div>

                {/* Explanation in plain English and Bengali */}
                <div className="space-y-2">
                  <p className="text-xs text-white/95 leading-relaxed bg-[#171824]/60 p-3 rounded-xl border border-white/5">
                    💡 <span className="font-semibold">{autoAnalysis.explanation}</span>
                  </p>
                  <p className="text-xs text-emerald-300/90 leading-relaxed bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                    🇧🇩 <span className="font-medium">{autoAnalysis.explanationBn}</span>
                  </p>
                </div>

                {/* Strategy Snapshot Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-[#171824]/50 border border-white/5">
                    <span className="text-[#A5A8BA] block">Est. Partitions:</span>
                    <span className="text-white font-bold font-mono text-xs">
                      ~{autoAnalysis.expectedPartitions} files
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#171824]/50 border border-white/5">
                    <span className="text-[#A5A8BA] block">Records per Part:</span>
                    <span className="text-white font-bold font-mono text-xs">
                      {autoAnalysis.recommendedBatchSize} records
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#171824]/50 border border-white/5">
                    <span className="text-[#A5A8BA] block">Table Headers:</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      {autoAnalysis.hasHeaders ? 'Auto-Retained' : 'Plain Records'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#171824]/50 border border-white/5">
                    <span className="text-[#A5A8BA] block">Auto Redaction:</span>
                    <span className="text-[#00F0FF] font-bold text-xs">
                      Pass/Token Mask
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mode-Specific Sub-Controls */}
            {config.mode === 'group' && (
              <div className="bg-[#1e2030] p-4 rounded-2xl border border-white/5 mb-6 space-y-3">
                <label className="text-xs font-bold text-white block">
                  Records per TXT file:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[10, 50, 100, 500, 1000].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConfig({ ...config, recordsPerFile: num })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        config.recordsPerFile === num
                          ? 'bg-[#2997FF] text-white shadow-xs'
                          : 'bg-[#25283c] text-[#A5A8BA] hover:text-white'
                      }`}
                    >
                      {num} records
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-xs text-[#A5A8BA]">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={config.recordsPerFile}
                      onChange={(e) =>
                        setConfig({ ...config, recordsPerFile: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-20 bg-[#25283c] text-white text-xs px-2.5 py-1.5 rounded-xl border border-white/10 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {config.mode === 'custom' && (
              <div className="bg-[#1e2030] p-4 rounded-2xl border border-white/5 mb-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-white block mb-2">
                    Custom Split Criteria:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'record_count', label: 'Record Count' },
                      { id: 'line_count', label: 'Line Count' },
                      { id: 'file_size', label: 'Target Size (MB)' },
                      { id: 'delimiter', label: 'Custom Delimiter' },
                      { id: 'csv_row', label: 'CSV Row' },
                      { id: 'json_object', label: 'JSON Object' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setConfig({ ...config, customType: type.id as CustomSplitType })}
                        className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                          config.customType === type.id
                            ? 'bg-[#2997FF] text-white font-semibold'
                            : 'bg-[#25283c] text-[#A5A8BA] hover:text-white'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {config.customType === 'delimiter' ? (
                  <div>
                    <label className="text-xs text-[#A5A8BA] block mb-1">
                      Enter Delimiter String:
                    </label>
                    <input
                      type="text"
                      value={config.delimiter}
                      onChange={(e) => setConfig({ ...config, delimiter: e.target.value })}
                      placeholder="e.g. --- or ### or [RECORD_BREAK]"
                      className="w-full bg-[#25283c] text-white text-xs px-3 py-2 rounded-xl border border-white/10 font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-[#A5A8BA] block mb-1">
                      {config.customType === 'file_size'
                        ? 'Target size per split file (MB):'
                        : 'Count per file:'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={config.customValue}
                      onChange={(e) =>
                        setConfig({ ...config, customValue: Math.max(1, parseInt(e.target.value) || 1) })
                      }
                      className="w-32 bg-[#25283c] text-white text-xs px-3 py-2 rounded-xl border border-white/10 font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Advanced Output Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-[#A5A8BA] block mb-1">
                  Output Filename Prefix:
                </label>
                <input
                  type="text"
                  value={config.prefix}
                  onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                  placeholder="e.g. customer_records"
                  className="w-full bg-[#1e2030] text-white text-xs px-3 py-2 rounded-xl border border-white/10"
                />
                <span className="text-[10px] text-[#A5A8BA] mt-1 block">
                  Example: {config.prefix || 'part'}_0001.{config.extension}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A5A8BA] block mb-1">
                  Output File Format:
                </label>
                <select
                  value={config.extension}
                  onChange={(e) => setConfig({ ...config, extension: e.target.value })}
                  className="w-full bg-[#1e2030] text-white text-xs px-3 py-2 rounded-xl border border-white/10 font-mono"
                >
                  <option value="txt">.txt (Standard Plain Text)</option>
                  <option value="csv">.csv (Retain Table Format)</option>
                  <option value="log">.log (Log File)</option>
                  <option value="json">.json (Structured JSON)</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="retainHeader"
                  checked={config.retainHeader}
                  onChange={(e) => setConfig({ ...config, retainHeader: e.target.checked })}
                  className="w-4 h-4 rounded-sm bg-[#1e2030] border-white/20 text-[#2997FF] focus:ring-0"
                />
                <label htmlFor="retainHeader" className="text-xs text-white cursor-pointer">
                  Repeat header row in each split file
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="redactSecrets"
                  checked={config.redactSecrets}
                  onChange={(e) => setConfig({ ...config, redactSecrets: e.target.checked })}
                  className="w-4 h-4 rounded-sm bg-[#1e2030] border-white/20 text-[#2997FF] focus:ring-0"
                />
                <label htmlFor="redactSecrets" className="text-xs text-white cursor-pointer">
                  Sanitize passwords & auth tokens
                </label>
              </div>
            </div>

            {/* Real-Time Processing Execution Bar */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {!isProcessing ? (
                    <button
                      onClick={startSplitting}
                      className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#2997FF] hover:bg-[#1f87ed] text-white text-sm font-bold shadow-lg shadow-[#2997FF]/25 transition-all active:scale-98"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{config.mode === 'auto' ? 'Start Auto Split (অটো স্প্লিট শুরু করুন)' : 'Start Splitting'}</span>
                    </button>
                  ) : (
                    <>
                      {isPaused ? (
                        <button
                          onClick={handleResume}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          onClick={handlePause}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all"
                        >
                          <Pause className="w-4 h-4 fill-white" />
                          <span>Pause</span>
                        </button>
                      )}
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleReset}
                    className="p-2.5 rounded-xl text-[#A5A8BA] hover:text-white hover:bg-white/5 transition-colors"
                    title="Reset controls"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {generatedChunks.length > 0 && !isProcessing && (
                  <button
                    onClick={handleCreateAndDownloadZip}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <FolderArchive className="w-4 h-4" />
                    <span>{isZipping ? `Archiving (${zipProgress}%)...` : `Download All as ZIP (${generatedChunks.length} files)`}</span>
                  </button>
                )}
              </div>

              {/* Progress Bar & Telemetry */}
              {(isProcessing || progress > 0) && (
                <div className="space-y-3 bg-[#1e2030] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span>Progress:</span>
                      <span className="text-[#2997FF] font-mono">{progress}%</span>
                    </span>
                    <span className="text-[#A5A8BA] font-mono">
                      {formatBytes(processedBytes)} of {formatBytes(currentFile.size)}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-2.5 bg-[#171824] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2997FF] to-[#00F0FF] rounded-full transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Telemetry stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[#A5A8BA] block">Records Streamed:</span>
                      <span className="text-white font-mono font-semibold">{recordsCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[#A5A8BA] block">Partitions Created:</span>
                      <span className="text-white font-mono font-semibold">{outputCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[#A5A8BA] block">Stream Speed:</span>
                      <span className="text-[#00F0FF] font-mono font-semibold">
                        {(speedBytes / (1024 * 1024)).toFixed(1)} MB/s ({Math.round(speedRecords).toLocaleString()} rec/s)
                      </span>
                    </div>
                    <div>
                      <span className="text-[#A5A8BA] block">Est. Time Remaining:</span>
                      <span className="text-white font-mono font-semibold">{etaSeconds}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Output Preview & Chunks Inspector */}
        <div className="space-y-6">
          <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Output Preview</h3>
                <p className="text-[11px] text-[#A5A8BA]">
                  {generatedChunks.length > 0
                    ? `${generatedChunks.length} partitioned file(s) generated`
                    : 'Awaiting execution'}
                </p>
              </div>
              {sanitizedCount > 0 && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                  {sanitizedCount} secrets masked
                </span>
              )}
            </div>

            {/* Generated Chunks List */}
            <div className="flex-1 overflow-y-auto max-h-96 space-y-2 pr-1">
              {generatedChunks.length === 0 ? (
                <div className="h-64 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-xs text-[#A5A8BA]">
                  <Archive className="w-8 h-8 text-[#A5A8BA]/40 mb-2" />
                  <span>Click "Start Auto Split" to automatically generate partitions</span>
                </div>
              ) : (
                generatedChunks.slice(0, 30).map((chunk, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedPreviewChunk(chunk)}
                    className="p-3 rounded-xl bg-[#1e2030] hover:bg-[#1e2030]/80 border border-white/5 hover:border-[#2997FF]/40 cursor-pointer transition-all flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#2997FF] shrink-0" />
                      <span className="font-mono text-white truncate max-w-[150px]">{chunk.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#A5A8BA] font-mono">{formatBytes(chunk.size)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadText(chunk.content, chunk.name.split('/').pop() || chunk.name);
                        }}
                        className="p-1 rounded-lg text-[#A5A8BA] hover:text-[#2997FF] hover:bg-white/5"
                        title="Download single file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Preview Modal / Drawer */}
            {selectedPreviewChunk && (
              <div className="mt-4 p-3 rounded-2xl bg-[#171824] border border-white/10 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="font-mono font-bold text-[#2997FF] truncate max-w-[160px]">
                    {selectedPreviewChunk.name}
                  </span>
                  <button
                    onClick={() => setSelectedPreviewChunk(null)}
                    className="text-[#A5A8BA] hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-white/90 overflow-x-auto max-h-36 whitespace-pre-wrap leading-relaxed">
                  {selectedPreviewChunk.content.slice(0, 500)}
                  {selectedPreviewChunk.content.length > 500 && '\n... [Remaining content omitted from preview]'}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
