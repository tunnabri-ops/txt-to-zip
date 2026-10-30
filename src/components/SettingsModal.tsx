import React, { useState } from 'react';
import {
  X,
  Settings,
  Cpu,
  Lock,
  HardDrive,
  Save,
  Check,
  RotateCcw
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [bufferSizeMb, setBufferSizeMb] = useState(2);
  const [defaultRecords, setDefaultRecords] = useState(50);
  const [enableSecretMasking, setEnableSecretMasking] = useState(true);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e2030] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2997FF]/15 text-[#2997FF] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Engine Settings</h2>
              <p className="text-xs text-[#A5A8BA]">Configure performance & processing rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A5A8BA] hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Buffer Chunk Size */}
          <div className="bg-[#25283c] p-4 rounded-2xl border border-white/5 space-y-2">
            <label className="font-bold text-white block">
              Stream Chunk Buffer Size (Memory Guard):
            </label>
            <p className="text-[11px] text-[#A5A8BA]">
              Controls how many bytes are loaded per slice before yielding to the UI thread.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[1, 2, 4, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => setBufferSizeMb(size)}
                  className={`py-2 rounded-xl font-bold font-mono text-center transition-colors ${
                    bufferSizeMb === size
                      ? 'bg-[#2997FF] text-white shadow-xs'
                      : 'bg-[#1e2030] text-[#A5A8BA] hover:text-white'
                  }`}
                >
                  {size} MB
                </button>
              ))}
            </div>
          </div>

          {/* Default Records Per File */}
          <div className="bg-[#25283c] p-4 rounded-2xl border border-white/5 space-y-2">
            <label className="font-bold text-white block">
              Default Records per Partition:
            </label>
            <input
              type="number"
              min={1}
              value={defaultRecords}
              onChange={(e) => setDefaultRecords(parseInt(e.target.value) || 50)}
              className="w-full bg-[#1e2030] border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          {/* Privacy Setting */}
          <div className="bg-[#25283c] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Privacy Token Redaction</span>
              <span className="text-[11px] text-[#A5A8BA]">
                Auto-sanitize passwords, API keys & bearer tokens
              </span>
            </div>
            <input
              type="checkbox"
              checked={enableSecretMasking}
              onChange={(e) => setEnableSecretMasking(e.target.checked)}
              className="w-4 h-4 rounded-sm bg-[#1e2030] text-[#2997FF] border-white/10"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-[#171824] flex items-center justify-between">
          <button
            onClick={() => {
              setBufferSizeMb(2);
              setDefaultRecords(50);
              setEnableSecretMasking(true);
            }}
            className="flex items-center gap-1.5 text-xs text-[#A5A8BA] hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A5A8BA] hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2997FF] hover:bg-[#1a85ed] text-white text-xs font-bold transition-all shadow-md shadow-[#2997FF]/25"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Preferences'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
