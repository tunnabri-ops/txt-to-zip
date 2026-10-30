import React, { useState } from 'react';
import {
  FileText,
  Database,
  Files,
  Archive,
  MoreVertical,
  ArrowUpRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import { formatBytes } from '../utils/formatDetector';

interface StatCardsProps {
  uploadedFilesCount: number;
  uploadedTotalBytes: number;
  processedRecordsCount: number;
  processedTotalBytes: number;
  generatedTxtCount: number;
  generatedTxtBytes: number;
  zipArchivesCount: number;
  zipArchivesBytes: number;
  onCardClick?: (type: 'upload' | 'records' | 'txt' | 'zip') => void;
  onOpenUpload: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  uploadedFilesCount,
  uploadedTotalBytes,
  processedRecordsCount,
  processedTotalBytes,
  generatedTxtCount,
  generatedTxtBytes,
  zipArchivesCount,
  zipArchivesBytes,
  onCardClick,
  onOpenUpload,
}) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const cards = [
    {
      id: 1,
      type: 'upload' as const,
      title: 'Uploaded Files',
      countLabel: `${uploadedFilesCount.toLocaleString()} Files`,
      sizeLabel: formatBytes(uploadedTotalBytes || 1.3 * 1024 * 1024 * 1024),
      progressPct: Math.min(100, Math.max(15, (uploadedFilesCount / 20) * 100)),
      accentColor: '#2997FF', // Blue
      iconBg: 'bg-[#2997FF]/15 text-[#2997FF]',
      barColor: 'bg-[#2997FF]',
      Icon: FileText,
      description: 'Raw TXT, CSV, JSON, LOGs in queue',
    },
    {
      id: 2,
      type: 'records' as const,
      title: 'Processed Records',
      countLabel: `${processedRecordsCount.toLocaleString()} Records`,
      sizeLabel: formatBytes(processedTotalBytes || 2.9 * 1024 * 1024 * 1024),
      progressPct: Math.min(100, Math.max(25, (processedRecordsCount / 50000) * 100)),
      accentColor: '#FFB800', // Amber
      iconBg: 'bg-[#FFB800]/15 text-[#FFB800]',
      barColor: 'bg-[#FFB800]',
      Icon: Database,
      description: 'Parsed data rows & streamed chunks',
    },
    {
      id: 3,
      type: 'txt' as const,
      title: 'Generated TXT Files',
      countLabel: `${generatedTxtCount.toLocaleString()} Files`,
      sizeLabel: formatBytes(generatedTxtBytes || 1.7 * 1024 * 1024 * 1024),
      progressPct: Math.min(100, Math.max(20, (generatedTxtCount / 500) * 100)),
      accentColor: '#00F0FF', // Cyan
      iconBg: 'bg-[#00F0FF]/15 text-[#00F0FF]',
      barColor: 'bg-[#00F0FF]',
      Icon: Files,
      description: 'Individual & grouped text partitions',
    },
    {
      id: 4,
      type: 'zip' as const,
      title: 'ZIP Archives',
      countLabel: `${zipArchivesCount.toLocaleString()} Archives`,
      sizeLabel: formatBytes(zipArchivesBytes || 1.1 * 1024 * 1024 * 1024),
      progressPct: Math.min(100, Math.max(30, (zipArchivesCount / 10) * 100)),
      accentColor: '#4F46E5', // Indigo
      iconBg: 'bg-[#4F46E5]/20 text-[#818cf8]',
      barColor: 'bg-[#4F46E5]',
      Icon: Archive,
      description: 'Compressed bundles ready for download',
    },
  ];

  return (
    <div className="mb-6">
      {/* Section Header: "My Files" and "+ Add New" button matching reference */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
          My Files
        </h2>
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2997FF] hover:bg-[#1f87ed] text-white text-xs md:text-sm font-semibold transition-all shadow-md shadow-[#2997FF]/25 hover:shadow-lg active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New</span>
        </button>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.Icon;
          return (
            <div
              key={card.id}
              onClick={() => onCardClick && onCardClick(card.type)}
              className="group relative bg-[#25283c] hover:bg-[#2c3047] border border-white/5 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl"
            >
              {/* Top Row: Icon + Three Dots Menu */}
              <div className="flex items-center justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === card.id ? null : card.id);
                    }}
                    className="p-1.5 rounded-lg text-[#A5A8BA] hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenu === card.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-8 w-44 bg-[#1e2030] border border-white/10 rounded-xl shadow-xl p-1.5 z-40 text-xs"
                    >
                      <button
                        onClick={() => {
                          setActiveMenu(null);
                          onCardClick && onCardClick(card.type);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-[#A5A8BA] hover:text-white hover:bg-white/5 flex items-center gap-2"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenu(null);
                          onOpenUpload();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-[#A5A8BA] hover:text-white hover:bg-white/5 flex items-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Add Files</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-white mb-3">
                {card.title}
              </h3>

              {/* Progress Bar matching reference */}
              <div className="w-full h-1.5 bg-[#171824] rounded-full overflow-hidden mb-3.5">
                <div
                  className={`h-full ${card.barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${card.progressPct}%` }}
                />
              </div>

              {/* Bottom Row: Count on left, Size on right */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#A5A8BA] font-medium">{card.countLabel}</span>
                <span className="text-white font-mono tabular-nums">{card.sizeLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
