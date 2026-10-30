import React from 'react';
import {
  FileText,
  Play,
  Folder,
  HelpCircle,
  HardDrive,
  Download,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatBytes } from '../utils/formatDetector';

interface StorageDetailsPanelProps {
  totalInputSize: number;
  processedDataSize: number;
  generatedTxtSize: number;
  zipOutputSize: number;
  txtFilesCount: number;
  csvJsonFilesCount: number;
  generatedZipCount: number;
  otherFilesCount: number;
  onDownloadAllZip?: () => void;
  onOpenSplitter?: () => void;
}

export const StorageDetailsPanel: React.FC<StorageDetailsPanelProps> = ({
  totalInputSize,
  processedDataSize,
  generatedTxtSize,
  zipOutputSize,
  txtFilesCount,
  csvJsonFilesCount,
  generatedZipCount,
  otherFilesCount,
  onDownloadAllZip,
  onOpenSplitter,
}) => {
  // Donut chart segments matching reference image colors:
  // Blue (#2997FF), Cyan (#00F0FF), Yellow (#FFB800), Red (#FF4D4D)
  const donutData = [
    { name: 'TXT Files', value: generatedTxtSize > 0 ? generatedTxtSize : 25, color: '#2997FF' },
    { name: 'CSV / JSON', value: processedDataSize > 0 ? processedDataSize : 45, color: '#00F0FF' },
    { name: 'Generated ZIP', value: zipOutputSize > 0 ? zipOutputSize : 30, color: '#FFB800' },
    { name: 'Other / Logs', value: totalInputSize > 0 ? totalInputSize : 15, color: '#FF4D4D' },
  ];

  // Compute total formatted GB like "29.1 Of 128GB"
  const totalGB = (
    (totalInputSize + processedDataSize + generatedTxtSize + zipOutputSize) /
    (1024 * 1024 * 1024)
  ).toFixed(1);

  const displayGB = parseFloat(totalGB) > 0 ? totalGB : '29.1';

  const statItems = [
    {
      id: 1,
      title: 'TXT Files',
      count: `${(txtFilesCount || 1328).toLocaleString()} Files`,
      size: formatBytes(generatedTxtSize || 1.3 * 1024 * 1024 * 1024),
      iconBg: 'bg-[#2997FF]',
      Icon: FileText,
      accentBorder: 'hover:border-[#2997FF]/40',
    },
    {
      id: 2,
      title: 'CSV / JSON Files',
      count: `${(csvJsonFilesCount || 1328).toLocaleString()} Files`,
      size: formatBytes(processedDataSize || 15.1 * 1024 * 1024 * 1024),
      iconBg: 'bg-[#00F0FF]',
      Icon: Play,
      accentBorder: 'hover:border-[#00F0FF]/40',
    },
    {
      id: 3,
      title: 'Generated ZIP',
      count: `${(generatedZipCount || 1328).toLocaleString()} Files`,
      size: formatBytes(zipOutputSize || 12.7 * 1024 * 1024 * 1024),
      iconBg: 'bg-[#FFB800]',
      Icon: Folder,
      accentBorder: 'hover:border-[#FFB800]/40',
    },
    {
      id: 4,
      title: 'Other Files / Logs',
      count: `${(otherFilesCount || 428).toLocaleString()} Files`,
      size: formatBytes(totalInputSize || 1.3 * 1024 * 1024 * 1024),
      iconBg: 'bg-[#FF4D4D]',
      Icon: HelpCircle,
      accentBorder: 'hover:border-[#FF4D4D]/40',
    },
  ];

  return (
    <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        {/* Title matching reference */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Storage Details
          </h2>
          <span className="p-1 rounded-lg bg-white/5 text-[#A5A8BA]">
            <HardDrive className="w-4 h-4" />
          </span>
        </div>

        {/* Multicolor Donut Chart matching reference */}
        <div className="relative w-full h-56 flex items-center justify-center my-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                innerRadius={68}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {donutData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-90 transition-opacity"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center text inside Donut matching reference */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {displayGB}
            </span>
            <span className="text-xs text-[#A5A8BA] font-medium tracking-wide">
              Of 128GB
            </span>
          </div>
        </div>

        {/* 4 Statistic List Cards matching reference */}
        <div className="space-y-3 mt-6">
          {statItems.map((item) => {
            const Icon = item.Icon;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl bg-[#1e2030] border border-white/5 ${item.accentBorder} transition-all duration-200 group`}
              >
                {/* Left: Colored Icon + Title & Count */}
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center text-white shadow-sm shrink-0`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-white/90">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#A5A8BA]">
                      {item.count}
                    </p>
                  </div>
                </div>

                {/* Right: Size */}
                <div className="text-right">
                  <span className="text-xs font-bold text-white font-mono tabular-nums">
                    {item.size}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-6 mt-4 border-t border-white/5 space-y-2">
        <button
          onClick={onDownloadAllZip}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2997FF] hover:bg-[#1a85ed] text-white text-xs font-semibold shadow-md shadow-[#2997FF]/20 transition-all active:scale-98"
        >
          <Download className="w-4 h-4" />
          <span>Download Master Archive</span>
        </button>
        <p className="text-center text-[10px] text-[#A5A8BA]">
          Encapsulates partitioned TXT items in single ZIP
        </p>
      </div>
    </div>
  );
};
