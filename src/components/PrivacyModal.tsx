import React from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  Lock,
  HardDrive,
  EyeOff,
  CheckCircle2,
  ServerOff
} from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2030] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Privacy & Local Processing Audit</h2>
              <p className="text-xs text-[#A5A8BA]">
                100% Client-Side Engine Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A5A8BA] hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-[#25283c] border border-emerald-500/20 flex items-start gap-3">
            <ServerOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">Zero Cloud Uploads</h4>
              <p className="text-[#A5A8BA] leading-relaxed">
                Your files NEVER leave your browser runtime. All reading, splitting, format parsing, and ZIP packaging occur strictly inside your device's memory.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#25283c] border border-white/5 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-[#2997FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">Automated Credential Redaction</h4>
              <p className="text-[#A5A8BA] leading-relaxed">
                Active bearer tokens, session identifiers, database passwords, and auth cookies are detected via regex rules and masked with <code>[REDACTED_SECRET]</code> prior to partition export.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#25283c] border border-white/5 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-[#00F0FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">Large File Engine (Up to 10GB)</h4>
              <p className="text-[#A5A8BA] leading-relaxed">
                Uses 2MB slice streaming with asynchronous event yields to prevent out-of-memory browser tab crashes. Never loads multi-gigabyte datasets into RAM all at once.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#171824] border border-white/5 space-y-1.5 text-[11px] text-[#A5A8BA]">
            <span className="font-bold text-white block">Engine Compliance:</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No analytics tracking or file telemetry</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Works offline in disconnected PWA mode</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Immediate memory garbage collection on job reset</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#171824] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#2997FF] hover:bg-[#1a85ed] text-white text-xs font-bold"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
