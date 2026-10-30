import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Trash2,
  ArrowRight,
  Database,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { FileRecordItem, DetectedFormat } from '../types';
import { detectFormat, formatBytes } from '../utils/formatDetector';
import { generateSyntheticFile } from '../utils/sampleDataGenerator';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFiles: (newFiles: FileRecordItem[]) => void;
  onProceedToSplit?: (file: FileRecordItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAddFiles,
  onProceedToSplit,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<FileRecordItem[]>([]);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processDroppedFiles = async (fileList: FileList | File[]) => {
    const newItems: FileRecordItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Read first 64KB for format detection and preview
      const sampleBlob = file.slice(0, 64 * 1024);
      const sampleText = await sampleBlob.text();
      const format: DetectedFormat = detectFormat(sampleText, file.name);

      const previewLines = sampleText.split(/\r?\n/).slice(0, 15);
      const estRecords = Math.max(1, Math.round(file.size / Math.max(20, (sampleText.length / (previewLines.length || 1)))));

      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      newItems.push({
        id: `file_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        format,
        date: dateStr,
        recordsCount: estRecords,
        status: 'idle',
        progress: 0,
        fileBlob: file,
        previewLines,
        processedBytes: 0,
        speedBytesPerSec: 0,
        recordsPerSec: 0,
        estimatedSecondsRemaining: 0,
      });
    }

    setStagedFiles((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDroppedFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processDroppedFiles(e.target.files);
    }
  };

  const handleGenerateSample = (type: 'log' | 'csv' | 'jsonl' | 'txt', count: number) => {
    setIsGeneratingSample(true);
    setTimeout(() => {
      const sample = generateSyntheticFile(type, count);
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      const newItem: FileRecordItem = {
        id: `file_gen_${Date.now()}`,
        name: sample.name,
        size: sample.blob.size,
        type: 'text/plain',
        format: type === 'log' ? 'structured_log' : type === 'csv' ? 'csv' : type === 'jsonl' ? 'jsonl' : 'plain_text',
        date: dateStr,
        recordsCount: sample.recordsCount,
        status: 'idle',
        progress: 0,
        fileBlob: sample.blob,
        previewLines: [
          `Sample generated dataset (${count.toLocaleString()} records)`,
          `Format: ${type.toUpperCase()}`,
          `Preview record 1`,
          `Preview record 2`,
        ],
        processedBytes: 0,
        speedBytesPerSec: 0,
        recordsPerSec: 0,
        estimatedSecondsRemaining: 0,
      };

      setStagedFiles((prev) => [...prev, newItem]);
      setIsGeneratingSample(false);
    }, 200);
  };

  const removeStaged = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const commitFiles = () => {
    if (stagedFiles.length === 0) return;
    onAddFiles(stagedFiles);
    if (onProceedToSplit && stagedFiles.length === 1) {
      onProceedToSplit(stagedFiles[0]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2030] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2997FF]/15 text-[#2997FF] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Files to Split</h2>
              <p className="text-xs text-[#A5A8BA]">
                Support for TXT, CSV, JSON, JSONL, LOG files up to 10GB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A5A8BA] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-[#2997FF] bg-[#2997FF]/10 scale-[0.99]'
                : 'border-white/10 hover:border-[#2997FF]/40 bg-[#25283c]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.csv,.tsv,.json,.jsonl,.log,.dat"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#2997FF]/20 text-[#2997FF] mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Click to browse or drag & drop files here
            </h3>
            <p className="text-xs text-[#A5A8BA] max-w-md mx-auto">
              TXT, CSV, JSON, JSONL, LOG or plain text archives. Files are processed locally with streaming chunks.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Local File Processing · No Server Storage</span>
            </div>
          </div>

          {/* Instant Synthetic Sample Generators */}
          <div className="p-4 rounded-2xl bg-[#25283c] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2997FF]" />
                Generate Sample Test Datasets
              </span>
              <span className="text-[10px] text-[#A5A8BA]">Instant browser synthesis</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleGenerateSample('csv', 2500)}
                disabled={isGeneratingSample}
                className="px-3 py-2 rounded-xl bg-[#1e2030] hover:bg-[#2997FF]/20 hover:text-[#2997FF] text-white text-xs font-medium border border-white/5 transition-all text-left"
              >
                <div className="font-semibold">CSV Records</div>
                <div className="text-[10px] text-[#A5A8BA]">2,500 rows</div>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSample('log', 5000)}
                disabled={isGeneratingSample}
                className="px-3 py-2 rounded-xl bg-[#1e2030] hover:bg-[#2997FF]/20 hover:text-[#2997FF] text-white text-xs font-medium border border-white/5 transition-all text-left"
              >
                <div className="font-semibold">Server Log</div>
                <div className="text-[10px] text-[#A5A8BA]">5,000 entries</div>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSample('jsonl', 3000)}
                disabled={isGeneratingSample}
                className="px-3 py-2 rounded-xl bg-[#1e2030] hover:bg-[#2997FF]/20 hover:text-[#2997FF] text-white text-xs font-medium border border-white/5 transition-all text-left"
              >
                <div className="font-semibold">JSONL Events</div>
                <div className="text-[10px] text-[#A5A8BA]">3,000 objects</div>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateSample('txt', 10000)}
                disabled={isGeneratingSample}
                className="px-3 py-2 rounded-xl bg-[#1e2030] hover:bg-[#2997FF]/20 hover:text-[#2997FF] text-white text-xs font-medium border border-white/5 transition-all text-left"
              >
                <div className="font-semibold">Large 10k TXT</div>
                <div className="text-[10px] text-[#A5A8BA]">10,000 records</div>
              </button>
            </div>
          </div>

          {/* Staged files list */}
          {stagedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Upload Queue ({stagedFiles.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {stagedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#25283c] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-[#2997FF] shrink-0" />
                      <div>
                        <p className="font-semibold text-white truncate max-w-xs">{file.name}</p>
                        <p className="text-[10px] text-[#A5A8BA]">
                          {formatBytes(file.size)} · format: {file.format} · ~{file.recordsCount.toLocaleString()} records
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStaged(file.id)}
                      className="p-1.5 text-[#A5A8BA] hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/5 bg-[#171824]/60">
          <span className="text-xs text-[#A5A8BA]">
            {stagedFiles.length} file(s) staged
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A5A8BA] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={commitFiles}
              disabled={stagedFiles.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2997FF] hover:bg-[#1a85ed] disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-md shadow-[#2997FF]/20"
            >
              <span>Add to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
