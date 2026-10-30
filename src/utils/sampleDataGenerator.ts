import { FileRecordItem } from '../types';

export function createInitialSampleFiles(): FileRecordItem[] {
  // Sample 1: Auth access log
  const logLines = [
    '2026-10-30 08:12:01.412 [INFO] HTTP GET /api/v1/auth/session 200 OK ip=192.168.1.101 latency=14ms',
    '2026-10-30 08:12:03.901 [INFO] HTTP POST /api/v1/users/login 200 OK user_id=usr_9281 sessionid=s3cur3_t0k3n_98124',
    '2026-10-30 08:12:05.112 [WARN] HTTP GET /admin/config 403 Forbidden ip=10.0.0.42 user=guest',
    '2026-10-30 08:12:07.844 [INFO] HTTP POST /api/v1/files/upload 201 Created filename="dataset_q3.txt" size=4200192',
    '2026-10-30 08:12:10.512 [INFO] HTTP GET /api/v1/billing/invoices 200 OK Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    '2026-10-30 08:12:12.809 [ERROR] Database pool latency exceeded threshold 450ms',
    '2026-10-30 08:12:15.221 [INFO] Automated snapshot completed snapshot_id=snp_8892 status=success',
    '2026-10-30 08:12:18.012 [INFO] Worker pool rebalanced 12 active threads',
  ];
  const logContent = Array.from({ length: 120 }, (_, i) => 
    `2026-10-30 08:${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}.${String(100 + (i * 7) % 899)} [${i % 15 === 0 ? 'ERROR' : i % 5 === 0 ? 'WARN' : 'INFO'}] Request #${i + 1} status=200 latency=${12 + (i % 30)}ms token=auth_${i * 1024}`
  ).join('\n');
  const logBlob = new Blob([logContent], { type: 'text/plain' });

  // Sample 2: CSV Customer records
  const csvHeaders = 'id,first_name,last_name,email,company,city,country,balance,status';
  const csvRows = Array.from({ length: 250 }, (_, i) => {
    return `${1000 + i},User${i},Dev${i},user${i}@example.corp,CloudScale Systems,San Francisco,USA,$${(Math.random() * 5000).toFixed(2)},${i % 3 === 0 ? 'Active' : 'Pending'}`;
  });
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  const csvBlob = new Blob([csvContent], { type: 'text/csv' });

  // Sample 3: JSON Lines telemetry
  const jsonlLines = Array.from({ length: 180 }, (_, i) => {
    return JSON.stringify({
      event_id: `evt_${8000 + i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      device: `sensor-node-${(i % 8) + 1}`,
      temperature_c: +(21 + Math.sin(i / 10) * 4).toFixed(2),
      pressure_hpa: +(1013 + Math.cos(i / 5) * 6).toFixed(1),
      battery_pct: Math.max(10, 100 - Math.floor(i / 2)),
    });
  });
  const jsonlContent = jsonlLines.join('\n');
  const jsonlBlob = new Blob([jsonlContent], { type: 'application/json' });

  // Sample 4: Plain TXT Record list
  const txtContent = Array.from({ length: 400 }, (_, i) => {
    return `RECORD #${i + 1} | TXT-ARCHIVE-NODE | Checksum: ${Math.random().toString(36).substring(2, 10)} | Created: 2026-10-30 | Payload: Data chunk block #${i + 1}`;
  }).join('\n');
  const txtBlob = new Blob([txtContent], { type: 'text/plain' });

  return [
    {
      id: 'file_xd_file',
      name: 'Xd File',
      size: 3.5 * 1024 * 1024,
      type: 'text/plain',
      format: 'plain_text',
      date: '01-03-2021',
      recordsCount: 400,
      status: 'completed',
      progress: 100,
      fileBlob: txtBlob,
      previewLines: txtContent.split('\n').slice(0, 15),
      outputCount: 40,
      outputZipSize: 1.2 * 1024 * 1024,
      processedBytes: 3.5 * 1024 * 1024,
      speedBytesPerSec: 15.4 * 1024 * 1024,
      recordsPerSec: 3200,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_figma_file',
      name: 'Figma File',
      size: 19 * 1024 * 1024,
      type: 'application/json',
      format: 'jsonl',
      date: '27-02-2021',
      recordsCount: 180,
      status: 'completed',
      progress: 100,
      fileBlob: jsonlBlob,
      previewLines: jsonlContent.split('\n').slice(0, 10),
      outputCount: 18,
      outputZipSize: 5.4 * 1024 * 1024,
      processedBytes: 19 * 1024 * 1024,
      speedBytesPerSec: 18.2 * 1024 * 1024,
      recordsPerSec: 4100,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_documetns',
      name: 'Documetns',
      size: 15 * 1024 * 1024,
      type: 'text/csv',
      format: 'csv',
      date: '23-02-2021',
      recordsCount: 250,
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
      name: 'Sound File',
      size: 40 * 1024 * 1024,
      type: 'text/plain',
      format: 'structured_log',
      date: '21-02-2021',
      recordsCount: 120,
      status: 'idle',
      progress: 0,
      fileBlob: logBlob,
      previewLines: logLines,
      outputCount: 0,
      processedBytes: 0,
      speedBytesPerSec: 0,
      recordsPerSec: 0,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_media',
      name: 'Media',
      size: 15 * 1024 * 1024,
      type: 'text/plain',
      format: 'plain_text',
      date: '23-02-2021',
      recordsCount: 320,
      status: 'completed',
      progress: 100,
      fileBlob: txtBlob,
      previewLines: txtContent.split('\n').slice(0, 10),
      outputCount: 32,
      outputZipSize: 4.8 * 1024 * 1024,
      processedBytes: 15 * 1024 * 1024,
      speedBytesPerSec: 12.1 * 1024 * 1024,
      recordsPerSec: 2800,
      estimatedSecondsRemaining: 0,
    },
    {
      id: 'file_sals_pdf',
      name: 'Sals PDF',
      size: 9 * 1024 * 1024,
      type: 'text/csv',
      format: 'csv',
      date: '21-02-2021',
      recordsCount: 150,
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
      name: 'Excel File',
      size: 11 * 1024 * 1024,
      type: 'text/csv',
      format: 'csv',
      date: '23-02-2021',
      recordsCount: 512,
      status: 'completed',
      progress: 100,
      fileBlob: csvBlob,
      previewLines: csvContent.split('\n').slice(0, 10),
      outputCount: 52,
      outputZipSize: 3.1 * 1024 * 1024,
      processedBytes: 11 * 1024 * 1024,
      speedBytesPerSec: 14.2 * 1024 * 1024,
      recordsPerSec: 3500,
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
