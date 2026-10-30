import React, { useState } from 'react';
import {
  MoreVertical,
  Activity,
  Zap,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface AnalyticsChartProps {
  totalRecordsProcessed: number;
  averageSpeed: number;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  totalRecordsProcessed,
  averageSpeed,
}) => {
  const [metricView, setMetricView] = useState<'records' | 'speed' | 'files'>('records');

  // Days data modeled closely after the reference image
  const chartData = [
    { day: 'Sat', records: 45, speed: 28, files: 14, color: '#2997FF' },
    { day: 'Sun', records: 68, speed: 34, files: 22, color: '#2997FF' },
    { day: 'Mon', records: 82, speed: 48, files: 36, color: '#00F0FF' },
    { day: 'Tuh', records: 42, speed: 25, files: 12, color: '#2997FF' },
    { day: 'Wed', records: 95, speed: 56, files: 45, color: '#2997FF' },
    { day: 'Thu', records: 58, speed: 38, files: 29, color: '#FFB800' }, // Amber signature bar
    { day: 'Fri', records: 35, speed: 20, files: 11, color: '#00F0FF' },
  ];

  const currentMetricKey = metricView === 'records' ? 'records' : metricView === 'speed' ? 'speed' : 'files';

  return (
    <div className="bg-[#25283c] border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col justify-between h-full">
      {/* Card Header matching reference */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Analytics
          </h2>
          <span className="text-[11px] text-[#A5A8BA] font-medium hidden sm:inline">
            · Real-time Metrics
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-[#1e2030] p-1 rounded-xl text-[10px]">
          <button
            onClick={() => setMetricView('records')}
            className={`px-2 py-1 rounded-lg transition-colors font-medium ${
              metricView === 'records'
                ? 'bg-[#2997FF] text-white shadow-xs'
                : 'text-[#A5A8BA] hover:text-white'
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setMetricView('speed')}
            className={`px-2 py-1 rounded-lg transition-colors font-medium ${
              metricView === 'speed'
                ? 'bg-[#2997FF] text-white shadow-xs'
                : 'text-[#A5A8BA] hover:text-white'
            }`}
          >
            Speed
          </button>
          <button
            onClick={() => setMetricView('files')}
            className={`px-2 py-1 rounded-lg transition-colors font-medium ${
              metricView === 'files'
                ? 'bg-[#2997FF] text-white shadow-xs'
                : 'text-[#A5A8BA] hover:text-white'
            }`}
          >
            Output
          </button>
        </div>
      </div>

      {/* Quick stat row */}
      <div className="flex items-center gap-4 text-xs text-[#A5A8BA] mb-3">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#2997FF]" />
          <span>Avg Speed:</span>
          <span className="text-white font-mono font-semibold">
            {averageSpeed > 0 ? `${(averageSpeed / (1024 * 1024)).toFixed(1)} MB/s` : '18.4 MB/s'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Peak Rate:</span>
          <span className="text-white font-mono font-semibold">4,200 rec/s</span>
        </div>
      </div>

      {/* Recharts Bar Chart Container with custom pill bars */}
      <div className="h-56 w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              stroke="#A5A8BA"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              stroke="#A5A8BA"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              dx={-5}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 8 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1e2030] border border-white/10 p-2.5 rounded-xl shadow-xl text-xs">
                      <p className="font-bold text-white mb-1">{data.day}</p>
                      <p className="text-[#2997FF]">Records: {(data.records * 100).toLocaleString()}</p>
                      <p className="text-[#00F0FF]">Throughput: {data.speed} MB/s</p>
                      <p className="text-[#A5A8BA]">Partitions: {data.files}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey={currentMetricKey}
              radius={[12, 12, 12, 12]}
              barSize={14}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend */}
      <div className="flex items-center justify-between text-[11px] text-[#A5A8BA] pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2997FF]" />
            Processed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />
            Peak Load
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF]" />
            Stream Chunks
          </span>
        </div>
        <span className="font-mono text-white/80">Local Stream</span>
      </div>
    </div>
  );
};
