import React from 'react';
import {
  History,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw
} from 'lucide-react';
import { FileRecordItem } from '../types';
import { formatBytes } from '../utils/formatDetector';

interface HistoryViewProps {
  files: FileRecordItem[];
  onDownload: (file: FileRecordItem) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  files,
  onDownload,
  onClearHistory,
}) => {
  const completedJobs = files.filter((f) => f.status === 'completed' || f.outputCount);

  return (
    <div className="space-y-6">
      <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Processing History</h2>
            <p className="text-xs text-[#A5A8BA]">
              Log of completed TXT partitions, record counts, and generated ZIP archives
            </p>
          </div>
        </div>

        {completedJobs.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-[#A5A8BA] hover:text-rose-400 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>

      <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl">
        {completedJobs.length === 0 ? (
          <div className="text-center py-16 text-[#A5A8BA] text-xs">
            <Clock className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p>No processed files yet. Run a split job to see historical logs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedJobs.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#1e2030] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[11px] text-[#A5A8BA]">
                      Partitioned on {item.date} · {item.recordsCount.toLocaleString()} records processed · {item.outputCount || 1} parts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <span className="text-white font-mono font-bold block">{formatBytes(item.size)}</span>
                    <span className="text-[10px] text-emerald-400">Successfully Split</span>
                  </div>
                  <button
                    onClick={() => onDownload(item)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2997FF] hover:bg-[#1a85ed] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ZIP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
