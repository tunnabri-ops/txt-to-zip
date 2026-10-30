import React, { useState } from 'react';
import {
  X,
  Eye,
  ShieldCheck,
  FileText,
  Lock,
  Search,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { FileRecordItem } from '../types';
import { formatBytes, sanitizeSecrets } from '../utils/formatDetector';

interface PreviewModalProps {
  file: FileRecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onProceedToSplit?: (file: FileRecordItem) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onProceedToSplit,
}) => {
  const [redactToggle, setRedactToggle] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const rawLines = file.previewLines || [];

  const displayLines = rawLines.map((line) => {
    if (redactToggle) {
      return sanitizeSecrets(line).sanitized;
    }
    return line;
  });

  const filteredLines = displayLines.filter((l) =>
    l.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(displayLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2030] border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2997FF]/15 text-[#2997FF] flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{file.name}</span>
                <span className="text-[10px] bg-[#2997FF]/15 text-[#2997FF] px-2 py-0.5 rounded-full font-mono uppercase">
                  {file.format}
                </span>
              </h2>
              <p className="text-xs text-[#A5A8BA]">
                {formatBytes(file.size)} · ~{file.recordsCount.toLocaleString()} estimated records
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#25283c]/50 border-b border-white/5 text-xs">
          {/* Search in preview */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter preview lines..."
              className="w-full bg-[#1e2030] border border-white/10 rounded-xl py-1.5 pl-3 pr-8 text-xs text-white placeholder-[#A5A8BA]"
            />
            <Search className="w-3.5 h-3.5 text-[#A5A8BA] absolute right-2.5 top-2.5" />
          </div>

          {/* Privacy redaction toggle */}
          <div className="flex items-center gap-2 bg-[#1e2030] px-3 py-1.5 rounded-xl border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <label className="text-xs text-white cursor-pointer select-none flex items-center gap-2">
              <input
                type="checkbox"
                checked={redactToggle}
                onChange={(e) => setRedactToggle(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm bg-[#25283c] text-[#2997FF]"
              />
              <span>Mask Passwords & Tokens</span>
            </label>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e2030] hover:bg-white/5 text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#A5A8BA]" />}
            <span>{copied ? 'Copied' : 'Copy Preview'}</span>
          </button>
        </div>

        {/* Line Content Area */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-[#171824]/80">
          <div className="space-y-1">
            {filteredLines.length === 0 ? (
              <div className="text-center py-10 text-[#A5A8BA]">
                No matching lines in preview.
              </div>
            ) : (
              filteredLines.map((line, idx) => (
                <div key={idx} className="flex gap-4 hover:bg-white/[0.02] py-0.5 px-1 rounded">
                  <span className="text-[#A5A8BA]/50 select-none w-8 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-white/90 whitespace-pre-wrap break-all">
                    {line.includes('[REDACTED_SECRET]') || line.includes('[REDACTED_TOKEN]') ? (
                      line.split(/(\[REDACTED_SECRET\]|\[REDACTED_TOKEN\])/g).map((chunk, ci) =>
                        chunk.startsWith('[REDACTED') ? (
                          <span key={ci} className="bg-amber-500/20 text-amber-300 px-1 rounded">
                            {chunk}
                          </span>
                        ) : (
                          chunk
                        )
                      )
                    ) : (
                      line
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/5 bg-[#1e2030]">
          <span className="text-xs text-[#A5A8BA]">
            Previewing first {rawLines.length} lines. Processing streams entire file via Web Workers.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A5A8BA] hover:text-white"
            >
              Close
            </button>
            {onProceedToSplit && (
              <button
                onClick={() => {
                  onProceedToSplit(file);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2997FF] hover:bg-[#1a85ed] text-white text-xs font-bold shadow-md shadow-[#2997FF]/25"
              >
                Split this File
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
