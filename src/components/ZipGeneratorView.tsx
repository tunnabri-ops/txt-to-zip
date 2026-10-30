import React, { useState } from 'react';
import {
  Archive,
  Download,
  Settings,
  FolderTree,
  Sliders,
  CheckCircle2,
  FileText,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { FileRecordItem } from '../types';
import { createZipArchive, downloadBlob } from '../utils/zipGenerator';
import { formatBytes } from '../utils/formatDetector';

interface ZipGeneratorViewProps {
  files: FileRecordItem[];
  onOpenUpload: () => void;
}

export const ZipGeneratorView: React.FC<ZipGeneratorViewProps> = ({
  files,
  onOpenUpload,
}) => {
  const [zipName, setZipName] = useState('txt_to_zip_bundle');
  const [compressionLevel, setCompressionLevel] = useState<number>(6);
  const [includeFolderStructure, setIncludeFolderStructure] = useState(true);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(
    files.map((f) => f.id)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileLabel, setCurrentFileLabel] = useState('');
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; filename: string; size: number } | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedFileIds(files.map((f) => f.id));
  const deselectAll = () => setSelectedFileIds([]);

  const handleGenerateZip = async () => {
    const chosenFiles = files.filter((f) => selectedFileIds.includes(f.id));
    if (chosenFiles.length === 0) {
      alert('Please select at least one file to archive.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setDownloadReady(null);

    const itemsToZip: { name: string; content: string }[] = [];

    // Collate files
    for (const f of chosenFiles) {
      if (f.outputTxtFiles && f.outputTxtFiles.length > 0) {
        // Has split parts
        const folder = includeFolderStructure ? `${f.name.replace(/\.[^/.]+$/, '')}/` : '';
        for (const part of f.outputTxtFiles) {
          itemsToZip.push({
            name: `${folder}${part.name}`,
            content: part.content,
          });
        }
      } else if (f.fileBlob) {
        // Raw file content
        const text = await f.fileBlob.text();
        itemsToZip.push({
          name: f.name,
          content: text,
        });
      }
    }

    try {
      const result = await createZipArchive(itemsToZip, {
        zipFilename: zipName,
        compressionLevel,
        onProgress: (pct, curr) => {
          setProgress(pct);
          setCurrentFileLabel(curr);
        },
      });

      setDownloadReady(result);
      downloadBlob(result.blob, result.filename);
    } catch (err: any) {
      alert(`ZIP creation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2997FF] to-[#00F0FF] flex items-center justify-center text-white shadow-lg shadow-[#2997FF]/20">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">ZIP Archive Generator</h2>
            <p className="text-xs text-[#A5A8BA]">
              Package split TXT partitions and source files with streaming compression
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateZip}
          disabled={isGenerating || selectedFileIds.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#2997FF] hover:bg-[#1a85ed] disabled:opacity-40 text-white text-xs md:text-sm font-bold shadow-lg shadow-[#2997FF]/25 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>{isGenerating ? `Generating ZIP (${progress}%)...` : 'Build & Download ZIP'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Files Selection */}
        <div className="lg:col-span-2 bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white">Files & Partitions to Archive</h3>
              <p className="text-[11px] text-[#A5A8BA]">
                {selectedFileIds.length} of {files.length} items selected
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={selectAll}
                className="text-[#2997FF] hover:underline font-medium"
              >
                Select All
              </button>
              <span className="text-[#A5A8BA]">·</span>
              <button
                onClick={deselectAll}
                className="text-[#A5A8BA] hover:text-white"
              >
                Deselect All
              </button>
            </div>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12 text-[#A5A8BA] text-xs">
              No files in workspace. Click "Upload Files" to add items.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {files.map((file) => {
                const isSelected = selectedFileIds.includes(file.id);
                const hasSplits = file.outputTxtFiles && file.outputTxtFiles.length > 0;

                return (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1e2030] border-[#2997FF]/50 shadow-xs'
                        : 'bg-[#1e2030]/50 border-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded-sm bg-[#25283c] text-[#2997FF] border-white/10"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{file.name}</span>
                          {hasSplits && (
                            <span className="text-[10px] bg-[#2997FF]/15 text-[#2997FF] px-1.5 py-0.5 rounded-md font-medium">
                              {file.outputTxtFiles?.length} split parts
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#A5A8BA]">
                          {formatBytes(file.size)} · {file.format} · {file.recordsCount.toLocaleString()} records
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-white/90">
                        {file.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Compression & Hierarchy Settings */}
        <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#2997FF]" />
              Archive Configuration
            </h3>

            {/* Custom ZIP Name */}
            <div>
              <label className="text-xs font-semibold text-[#A5A8BA] block mb-1.5">
                Output ZIP Archive Name:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  className="w-full bg-[#1e2030] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <span className="absolute right-3 top-2 text-xs text-[#A5A8BA]">.zip</span>
              </div>
            </div>

            {/* Compression Level Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#A5A8BA]">Compression Level:</span>
                <span className="font-mono text-[#2997FF] font-bold">
                  {compressionLevel === 0 ? '0 (Store / Fast)' : `Level ${compressionLevel} (Deflate)`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={9}
                value={compressionLevel}
                onChange={(e) => setCompressionLevel(parseInt(e.target.value))}
                className="w-full accent-[#2997FF]"
              />
              <div className="flex justify-between text-[10px] text-[#A5A8BA] mt-1">
                <span>0 (Fastest)</span>
                <span>6 (Recommended)</span>
                <span>9 (Max Ratio)</span>
              </div>
            </div>

            {/* Folder hierarchy option */}
            <div className="p-3 rounded-2xl bg-[#1e2030] border border-white/5 space-y-2">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="includeFolder"
                  checked={includeFolderStructure}
                  onChange={(e) => setIncludeFolderStructure(e.target.checked)}
                  className="w-4 h-4 rounded-sm bg-[#25283c] text-[#2997FF] border-white/10"
                />
                <label htmlFor="includeFolder" className="text-xs font-medium text-white cursor-pointer">
                  Preserve folder hierarchy for split parts
                </label>
              </div>
              <p className="text-[10px] text-[#A5A8BA] pl-6 leading-relaxed">
                Groups partitioned chunks into clean subdirectory trees (e.g. <code>my_file/part_0001.txt</code>).
              </p>
            </div>

            {/* Generation Progress Indicator */}
            {isGenerating && (
              <div className="p-3.5 rounded-2xl bg-[#1e2030] border border-[#2997FF]/30 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-bold">Compressing...</span>
                  <span className="text-[#2997FF] font-mono">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#171824] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2997FF] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {currentFileLabel && (
                  <p className="text-[10px] text-[#A5A8BA] truncate">
                    Packing: {currentFileLabel}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Direct Download button */}
          {downloadReady && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Archive Built Successfully!</span>
              </div>
              <p className="text-[11px] text-[#A5A8BA] mb-2 font-mono">
                {downloadReady.filename} ({formatBytes(downloadReady.size)})
              </p>
              <button
                onClick={() => downloadBlob(downloadReady.blob, downloadReady.filename)}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Again</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
