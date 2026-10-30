import { FileRecordItem } from '../types';

export function createInitialSampleFiles(): FileRecordItem[] {
  // Sample 1: Auth access log (Structured log)
  const logLines = Array.from({ length: 350 }, (_, i) => {
    const status = i % 25 === 0 ? 500 : i % 8 === 0 ? 404 : 200;
    const level = status === 500 ? 'ERROR' : status === 404 ? 'WARN' : 'INFO';
    return `2026-10-30 08:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.${String(100 + (i * 7) % 899)} [${level}] HTTP ${i % 3 === 0 ? 'POST' : 'GET'} /api/v1/resource/${i + 1} status=${status} latency=${12 + (i % 45)}ms token=auth_${i * 1024}`;
  });
  const logContent = logLines.join('\n');
  const logBlob = new Blob([logContent], { type: 'text/plain' });

  // Sample 2: CSV Customer records (with headers)
  const csvHeaders = 'id,first_name,last_name,email,company,city,country,balance,status';
  const csvRows = Array.from({ length: 450 }, (_, i) => {
    return `${1000 + i},User${i},Dev${i},user${i}@enterprise.corp,TechCorp Global,New York,USA,$${(Math.random() * 8000 + 500).toFixed(2)},${i % 3 === 0 ? 'Active' : 'Pending'}`;
  });
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  const csvBlob = new Blob([csvContent], { type: 'text/csv' });

  // Sample 3: JSON Lines telemetry events
  const jsonlLines = Array.from({ length: 300 }, (_, i) => {
    return JSON.stringify({
      event_id: `evt_${8000 + i}`,
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      device: `sensor-node-${(i % 8) + 1}`,
      temperature_c: +(21 + Math.sin(i / 10) * 4).toFixed(2),
      pressure_hpa: +(1013 + Math.cos(i / 5) * 6).toFixed(1),
      battery_pct: Math.max(10, 100 - Math.floor(i / 3)),
    });
  });
  const jsonlContent = jsonlLines.join('\n');
  const jsonlBlob = new Blob([jsonlContent], { type: 'application/json' });

  // Sample 4: Plain TXT Record list
  const txtContent = Array.from({ length: 500 }, (_, i) => {
    return `RECORD #${i + 1} | TXT-ARCHIVE-NODE | Checksum: ${Math.random().toString(36).substring(2, 10)} | Created: 2026-10-30 | Payload: Data partition block #${i + 1}`;
  }).join('\n');
  const txtBlob = new Blob([txtContent], { type: 'text/plain' });

  // Pre-split some files so initial completed states are 100% genuine
  const txtParts = Array.from({ length: 10 }, (_, partIdx) => {
    const chunkLines = txtContent.split('\n').slice(partIdx * 50, (partIdx + 1) * 50);
    const content = chunkLines.join('\n');
    return {
      name: `xd_file_part_${String(partIdx + 1).padStart(4, '0')}.txt`,
      content,
      size: new Blob([content]).size,
    };
  });

  return [
    {
      id: 'file_xd_file',
      name: 'Xd File.txt',
      size: txtBlob.size,
      type: 'text/plain',
      format: 'plain_text',
      date: '01-03-2021',
      recordsCount: 500,
      status: 'completed',
      progress: 100,
      fileBlob: txtBlob,
      previewLines: txtContent.split('\n').slice(0, 15),
      outputCount: 10,
      outputTxtFiles: txtParts,
      outputZipSize: Math.round(txtBlob.size * 0.4),
      processedBytes: txtBlob.size,
      speedBytesPerSec: 15.4 * 1024 * 1024,
      recordsPerSec: 3200,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_figma_file',
      name: 'Figma File.jsonl',
      size: jsonlBlob.size,
      type: 'application/json',
      format: 'jsonl',
      date: '27-02-2021',
      recordsCount: 300,
      status: 'idle',
      progress: 0,
      fileBlob: jsonlBlob,
      previewLines: jsonlContent.split('\n').slice(0, 10),
      outputCount: 0,
      processedBytes: 0,
      speedBytesPerSec: 0,
      recordsPerSec: 0,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_documetns',
      name: 'Documents.csv',
      size: csvBlob.size,
      type: 'text/csv',
      format: 'csv',
      date: '23-02-2021',
      recordsCount: 450,
      status: 'idle',
      progress: 0,
      fileBlob: csvBlob,
      previewLines: csvContent.split('\n').slice(0, 12),
      outputCount: 0,
      processedBytes: 0,
      speedBytesPerSec: 0,
      recordsPerSec: 0,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_sound_file',
      name: 'Server_Logs.log',
      size: logBlob.size,
      type: 'text/plain',
      format: 'structured_log',
      date: '21-02-2021',
      recordsCount: 350,
      status: 'idle',
      progress: 0,
      fileBlob: logBlob,
      previewLines: logLines.slice(0, 12),
      outputCount: 0,
      processedBytes: 0,
      speedBytesPerSec: 0,
      recordsPerSec: 0,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_media',
      name: 'Media_Archive.txt',
      size: txtBlob.size,
      type: 'text/plain',
      format: 'plain_text',
      date: '23-02-2021',
      recordsCount: 500,
      status: 'idle',
      progress: 0,
      fileBlob: txtBlob,
      previewLines: txtContent.split('\n').slice(0, 10),
      outputCount: 0,
      processedBytes: 0,
      speedBytesPerSec: 0,
      recordsPerSec: 0,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_sals_pdf',
      name: 'Sales_Data.csv',
      size: csvBlob.size,
      type: 'text/csv',
      format: 'csv',
      date: '21-02-2021',
      recordsCount: 450,
      status: 'idle',
      progress: 0,
      fileBlob: csvBlob,
      previewLines: csvContent.split('\n').slice(0, 8),
      outputCount: 0,
      processedBytes: 0,
      speedBytesPerSec: 0,
      recordsPerSec: 0,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_excel_file',
      name: 'Excel_Export.csv',
      size: csvBlob.size,
      type: 'text/csv',
      format: 'csv',
      date: '23-02-2021',
      recordsCount: 450,
      status: 'idle',
      progress: 0,
      fileBlob: csvBlob,
      previewLines: csvContent.split('\n').slice(0, 10),
      outputCount: 0,
      processedBytes: 0,
      speedBytesPerSec: 0,
      recordsPerSec: 0,
      estimatedSecondsRemaining: 0,
    },
  ];
}

/**
 * Generates an on-demand synthetic dataset of N records
 */
export function generateSyntheticFile(
  type: 'log' | 'csv' | 'jsonl' | 'txt',
  recordCount: number
): { name: string; blob: Blob; recordsCount: number } {
  let content = '';
  let filename = '';

  if (type === 'log') {
    filename = `server_access_log_${recordCount}r.log`;
    const lines = [];
    for (let i = 1; i <= recordCount; i++) {
      const verb = i % 4 === 0 ? 'POST' : i % 5 === 0 ? 'DELETE' : 'GET';
      const status = i % 20 === 0 ? 500 : i % 7 === 0 ? 404 : 200;
      lines.push(
        `2026-10-30T12:${String(Math.floor(i / 60) % 60).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}Z [API-GATEWAY] [${status === 500 ? 'ERROR' : 'INFO'}] ${verb} /api/v2/items/${i} status=${status} latency=${10 + (i % 80)}ms token=usr_key_${i * 99}`
      );
    }
    content = lines.join('\n');
  } else if (type === 'csv') {
    filename = `records_export_${recordCount}r.csv`;
    const lines = ['id,name,email,department,role,salary,join_date'];
    for (let i = 1; i <= recordCount; i++) {
      lines.push(`${i},Person_${i},person${i}@enterprise.corp,Engineering,Architect,$${120000 + (i % 50) * 1000},2024-03-15`);
    }
    content = lines.join('\n');
  } else if (type === 'jsonl') {
    filename = `events_stream_${recordCount}r.jsonl`;
    const lines = [];
    for (let i = 1; i <= recordCount; i++) {
      lines.push(JSON.stringify({
        id: i,
        channel: `ch_${(i % 5) + 1}`,
        metric: +(Math.random() * 100).toFixed(2),
        active: i % 2 === 0,
        ts: Date.now() - i * 1000,
      }));
    }
    content = lines.join('\n');
  } else {
    filename = `dataset_chunked_${recordCount}r.txt`;
    const lines = [];
    for (let i = 1; i <= recordCount; i++) {
      lines.push(`ITEM_${String(i).padStart(6, '0')} | RECORD_PAYLOAD_${Math.random().toString(36).substring(2, 12)} | AUTH_CHECK=PASS`);
    }
    content = lines.join('\n');
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  return { name: filename, blob, recordsCount: recordCount };
}
