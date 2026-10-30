import React, { useState, useMemo } from 'react';
import {
  FileText,
  Eye,
  Play,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileCode,
  FileQuestion,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowUpDown
} from 'lucide-react';
import { FileRecordItem } from '../types';
import { formatBytes } from '../utils/formatDetector';

interface RecentFilesTableProps {
  files: FileRecordItem[];
  searchQuery: string;
  onPreview: (file: FileRecordItem) => void;
  onProcess: (file: FileRecordItem) => void;
  onAutoSplit?: (file: FileRecordItem) => void;
  onDownload: (file: FileRecordItem) => void;
  onRemove: (id: string) => void;
  onViewAll?: () => void;
}

export const RecentFilesTable: React.FC<RecentFilesTableProps> = ({
  files,
  searchQuery,
  onPreview,
  onProcess,
  onAutoSplit,
  onDownload,
  onRemove,
  onViewAll,
}) => {
  const [sortField, setSortField] = useState<'name' | 'date' | 'size' | 'records'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 7;

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    let result = files.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.format.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'size') cmp = a.size - b.size;
      else if (sortField === 'records') cmp = a.recordsCount - b.recordsCount;
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [files, searchQuery, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const paginatedFiles = filteredFiles.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: 'name' | 'date' | 'size' | 'records') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Helper for colored file icons matching reference
  const getFileBadge = (file: FileRecordItem) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const nameLower = file.name.toLowerCase();

    if (nameLower.includes('xd') || ext === 'xd') {
      return { bg: 'bg-[#FF2BC2]', text: 'XD' };
    }
    if (nameLower.includes('figma') || ext === 'fig') {
      return { bg: 'bg-[#A259FF]', text: 'FG' };
    }
    if (nameLower.includes('doc') || ext === 'txt') {
      return { bg: 'bg-[#FF4D4D]', text: 'TX' };
    }
    if (nameLower.includes('sound') || ext === 'log') {
      return { bg: 'bg-[#FF8800]', text: 'LG' };
    }
    if (nameLower.includes('media') || ext === 'json' || ext === 'jsonl') {
      return { bg: 'bg-[#FFB800]', text: 'JS' };
    }
    if (nameLower.includes('pdf') || ext === 'tsv') {
      return { bg: 'bg-[#00D097]', text: 'PD' };
    }
    if (nameLower.includes('excel') || ext === 'csv') {
      return { bg: 'bg-[#2997FF]', text: 'XL' };
    }

    return { bg: 'bg-[#4F46E5]', text: 'DB' };
  };

  return (
    <div className="bg-[#25283c] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full">
      <div>
        {/* Table Header Row matching reference */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Recent Files
          </h2>
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#A5A8BA] hover:text-[#2997FF] transition-colors"
          >
            See more
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="text-[#A5A8BA] border-b border-white/5 font-medium">
                <th
                  onClick={() => toggleSort('name')}
                  className="pb-3 pl-2 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>File Name</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="pb-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('size')}
                  className="pb-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Size</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedFiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#A5A8BA]">
                    No files found. Click "+ Add New" to upload or create sample data.
                  </td>
                </tr>
              ) : (
                paginatedFiles.map((file) => {
                  const badge = getFileBadge(file);
                  const isProcessing = file.status === 'processing';

                  return (
                    <tr
                      key={file.id}
                      className="group hover:bg-white/[0.03] transition-colors"
                    >
                      {/* File Name & Icon Badge */}
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg ${badge.bg} text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm`}
                          >
                            {badge.text}
                          </div>
                          <div>
                            <span className="font-semibold text-white group-hover:text-[#2997FF] transition-colors truncate block max-w-[160px]">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-[#A5A8BA]">
                              {file.recordsCount.toLocaleString()} records · {file.format}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 text-[#A5A8BA] font-mono tabular-nums">
                        {file.date}
                      </td>

                      {/* Size */}
                      <td className="py-3 text-white font-medium font-mono tabular-nums">
                        {formatBytes(file.size)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          {/* Preview button */}
                          <button
                            onClick={() => onPreview(file)}
                            className="p-1.5 rounded-lg text-[#A5A8BA] hover:text-white hover:bg-white/10 transition-colors"
                            title="Preview Records & Secrets Redaction"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 1-Click Auto Split Button */}
                          <button
                            onClick={() => (onAutoSplit ? onAutoSplit(file) : onProcess(file))}
                            disabled={isProcessing}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                              isProcessing
                                ? 'bg-white/10 text-[#A5A8BA]'
                                : 'bg-gradient-to-r from-[#2997FF] to-[#00F0FF] text-white hover:opacity-90 shadow-sm shadow-[#2997FF]/20 active:scale-95'
                            }`}
                            title="Auto-detect data & split into ZIP (অটো স্প্লিট)"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span className="text-[11px]">⚡</span>
                            )}
                            <span>Auto</span>
                          </button>

                          {/* Process / Split button */}
                          <button
                            onClick={() => onProcess(file)}
                            disabled={isProcessing}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isProcessing
                                ? 'text-[#2997FF] animate-spin'
                                : 'text-[#A5A8BA] hover:text-white hover:bg-white/10'
                            }`}
                            title="Configure Split Options"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Download ZIP button */}
                          <button
                            onClick={() => onDownload(file)}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                            title="Download ZIP Archive"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => onRemove(file.id)}
                            className="p-1.5 rounded-lg text-[#A5A8BA] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove from Workspace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-[11px] text-[#A5A8BA]">
          <span>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredFiles.length)} of {filteredFiles.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg bg-[#1e2030] hover:bg-white/5 disabled:opacity-40 transition-colors text-white"
            >
              Prev
            </button>
            <span className="font-mono px-1">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg bg-[#1e2030] hover:bg-white/5 disabled:opacity-40 transition-colors text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
