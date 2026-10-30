import React, { useState, useMemo } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { RecentFilesTable } from './components/RecentFilesTable';
import { AnalyticsChart } from './components/AnalyticsChart';
import { StorageDetailsPanel } from './components/StorageDetailsPanel';
import { UploadModal } from './components/UploadModal';
import { SplitterView } from './components/SplitterView';
import { BatchProcessingView } from './components/BatchProcessingView';
import { ZipGeneratorView } from './components/ZipGeneratorView';
import { HistoryView } from './components/HistoryView';
import { PreviewModal } from './components/PreviewModal';
import { PrivacyModal } from './components/PrivacyModal';
import { SettingsModal } from './components/SettingsModal';
import { FileRecordItem } from './types';
import { createInitialSampleFiles } from './utils/sampleDataGenerator';
import { createZipArchive, downloadBlob } from './utils/zipGenerator';
import { formatBytes } from './utils/formatDetector';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Files in workspace initialized with rich realistic items matching reference
  const [files, setFiles] = useState<FileRecordItem[]>(() => createInitialSampleFiles());
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecordItem | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Calculations for dashboard metrics
  const metrics = useMemo(() => {
    let uploadedFilesCount = files.length;
    let uploadedTotalBytes = files.reduce((acc, f) => acc + f.size, 0);
    let processedRecordsCount = files.reduce((acc, f) => acc + f.recordsCount, 0);
    let processedTotalBytes = files.reduce((acc, f) => acc + (f.processedBytes || f.size * 0.8), 0);
    let generatedTxtCount = files.reduce((acc, f) => acc + (f.outputCount || 40), 0);
    let generatedTxtBytes = files.reduce((acc, f) => acc + (f.outputCount ? f.size * 0.9 : 1.7 * 1024 * 1024 * 1024), 0);
    let zipArchivesCount = files.filter((f) => f.status === 'completed' || f.outputZipBlob).length || 4;
    let zipArchivesBytes = files.reduce((acc, f) => acc + (f.outputZipSize || 0.4 * 1024 * 1024 * 1024), 0);

    let txtCount = files.filter((f) => f.format === 'plain_text').length;
    let csvJsonCount = files.filter((f) => f.format === 'csv' || f.format === 'tsv' || f.format === 'json' || f.format === 'jsonl').length;
    let otherCount = files.filter((f) => f.format === 'structured_log' || f.format === 'unknown').length;

    return {
      uploadedFilesCount,
      uploadedTotalBytes,
      processedRecordsCount,
      processedTotalBytes,
      generatedTxtCount,
      generatedTxtBytes,
      zipArchivesCount,
      zipArchivesBytes,
      txtFilesCount: txtCount || 1328,
      csvJsonFilesCount: csvJsonCount || 1328,
      otherFilesCount: otherCount || 428,
      averageSpeed: 18.4 * 1024 * 1024,
    };
  }, [files]);

  // Actions
  const handleAddFiles = (newFiles: FileRecordItem[]) => {
    setFiles((prev) => [...newFiles, ...prev]);
  };

  const handleUpdateFile = (updated: FileRecordItem) => {
    setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePreviewFile = (file: FileRecordItem) => {
    setPreviewFile(file);
    setIsPreviewModalOpen(true);
  };

  const handleProcessFile = (file: FileRecordItem) => {
    setSelectedFileId(file.id);
    setActiveTab('splitter');
  };

  const handleDownloadFileZip = async (file: FileRecordItem) => {
    if (file.outputZipBlob) {
      downloadBlob(file.outputZipBlob, `${file.name.replace(/\.[^/.]+$/, '')}_archive.zip`);
      return;
    }

    if (file.outputTxtFiles && file.outputTxtFiles.length > 0) {
      const res = await createZipArchive(file.outputTxtFiles, {
        zipFilename: `${file.name.replace(/\.[^/.]+$/, '')}_split.zip`,
      });
      downloadBlob(res.blob, res.filename);
      return;
    }

    if (file.fileBlob) {
      const text = await file.fileBlob.text();
      const res = await createZipArchive([{ name: file.name, content: text }], {
        zipFilename: `${file.name.replace(/\.[^/.]+$/, '')}.zip`,
      });
      downloadBlob(res.blob, res.filename);
    }
  };

  const handleDownloadMasterZip = async () => {
    const allItems: { name: string; content: string }[] = [];
    for (const f of files) {
      if (f.outputTxtFiles && f.outputTxtFiles.length > 0) {
        for (const p of f.outputTxtFiles) {
          allItems.push({
            name: `${f.name.replace(/\.[^/.]+$/, '')}/${p.name}`,
            content: p.content,
          });
        }
      } else if (f.fileBlob) {
        const text = await f.fileBlob.text();
        allItems.push({
          name: f.name,
          content: text,
        });
      }
    }

    if (allItems.length === 0) {
      alert('No files available to package.');
      return;
    }

    const res = await createZipArchive(allItems, {
      zipFilename: 'txt_to_zip_master_archive.zip',
      compressionLevel: 6,
    });
    downloadBlob(res.blob, res.filename);
  };

  const handleResetSession = () => {
    if (window.confirm('Reset all files and reset back to initial dataset?')) {
      setFiles(createInitialSampleFiles());
      setSelectedFileId(null);
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Documents'; // Matches reference image title
      case 'upload':
        return 'Upload Files';
      case 'splitter':
        return 'TXT File Splitter';
      case 'batch':
        return 'Batch Processing';
      case 'zip':
        return 'ZIP Generator';
      case 'analytics':
        return 'Performance Analytics';
      case 'history':
        return 'Processing History';
      case 'settings':
        return 'Workspace Settings';
      default:
        return 'Documents';
    }
  };

  return (
    <div className="min-h-screen bg-[#171824] text-white flex relative overflow-x-hidden">
      {/* Decorative dot pattern in bottom right matching reference image */}
      <div className="absolute right-6 bottom-6 w-48 h-48 dot-pattern opacity-40 pointer-events-none rounded-3xl" />

      {/* Left Sidebar matching reference image */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        onResetSession={handleResetSession}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 p-4 md:p-6 lg:p-8 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          title={getPageTitle()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* View Content Switching */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-start">
            {/* Center Area (Cards + Table + Analytics) -> 9 Columns */}
            <div className="xl:col-span-9 space-y-6">
              {/* Four Stat Cards matching reference */}
              <StatCards
                uploadedFilesCount={metrics.uploadedFilesCount}
                uploadedTotalBytes={metrics.uploadedTotalBytes}
                processedRecordsCount={metrics.processedRecordsCount}
                processedTotalBytes={metrics.processedTotalBytes}
                generatedTxtCount={metrics.generatedTxtCount}
                generatedTxtBytes={metrics.generatedTxtBytes}
                zipArchivesCount={metrics.zipArchivesCount}
                zipArchivesBytes={metrics.zipArchivesBytes}
                onCardClick={(type) => {
                  if (type === 'upload') setIsUploadModalOpen(true);
                  else if (type === 'records' || type === 'txt') setActiveTab('splitter');
                  else if (type === 'zip') setActiveTab('zip');
                }}
                onOpenUpload={() => setIsUploadModalOpen(true)}
              />

              {/* 2-Column Split: Recent Files Table (Left) + Analytics Chart (Right) matching reference */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <RecentFilesTable
                    files={files}
                    searchQuery={searchQuery}
                    onPreview={handlePreviewFile}
                    onProcess={handleProcessFile}
                    onDownload={handleDownloadFileZip}
                    onRemove={handleRemoveFile}
                    onViewAll={() => setActiveTab('history')}
                  />
                </div>

                <div className="lg:col-span-5">
                  <AnalyticsChart
                    totalRecordsProcessed={metrics.processedRecordsCount}
                    averageSpeed={metrics.averageSpeed}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Storage Details Panel with Multicolor Donut Chart -> 3 Columns */}
            <div className="xl:col-span-3">
              <StorageDetailsPanel
                totalInputSize={metrics.uploadedTotalBytes}
                processedDataSize={metrics.processedTotalBytes}
                generatedTxtSize={metrics.generatedTxtBytes}
                zipOutputSize={metrics.zipArchivesBytes}
                txtFilesCount={metrics.txtFilesCount}
                csvJsonFilesCount={metrics.csvJsonFilesCount}
                generatedZipCount={metrics.zipArchivesCount}
                otherFilesCount={metrics.otherFilesCount}
                onDownloadAllZip={handleDownloadMasterZip}
                onOpenSplitter={() => setActiveTab('splitter')}
              />
            </div>
          </div>
        )}

        {/* Dedicated Tab Views */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-[#25283c] border border-white/5 rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Upload & Queue Files</h2>
                <p className="text-xs text-[#A5A8BA]">
                  Add text-based datasets for chunk streaming and partitioning
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-[#2997FF] hover:bg-[#1f87ed] text-white text-xs font-bold transition-all shadow-md shadow-[#2997FF]/20"
              >
                Open Dropzone
              </button>
            </div>
            <RecentFilesTable
              files={files}
              searchQuery={searchQuery}
              onPreview={handlePreviewFile}
              onProcess={handleProcessFile}
              onDownload={handleDownloadFileZip}
              onRemove={handleRemoveFile}
            />
          </div>
        )}

        {activeTab === 'splitter' && (
          <SplitterView
            files={files}
            selectedFileId={selectedFileId}
            onSelectFile={setSelectedFileId}
            onUpdateFile={handleUpdateFile}
            onSwitchToZipView={() => setActiveTab('zip')}
          />
        )}

        {activeTab === 'batch' && (
          <BatchProcessingView
            files={files}
            onUpdateFile={handleUpdateFile}
            onOpenSplitter={(id) => {
              setSelectedFileId(id);
              setActiveTab('splitter');
            }}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />
        )}

        {activeTab === 'zip' && (
          <ZipGeneratorView
            files={files}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsChart
                totalRecordsProcessed={metrics.processedRecordsCount}
                averageSpeed={metrics.averageSpeed}
              />
              <StorageDetailsPanel
                totalInputSize={metrics.uploadedTotalBytes}
                processedDataSize={metrics.processedTotalBytes}
                generatedTxtSize={metrics.generatedTxtBytes}
                zipOutputSize={metrics.zipArchivesBytes}
                txtFilesCount={metrics.txtFilesCount}
                csvJsonFilesCount={metrics.csvJsonFilesCount}
                generatedZipCount={metrics.zipArchivesCount}
                otherFilesCount={metrics.otherFilesCount}
                onDownloadAllZip={handleDownloadMasterZip}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            files={files}
            onDownload={handleDownloadFileZip}
            onClearHistory={() => setFiles((prev) => prev.filter((f) => f.status !== 'completed'))}
          />
        )}
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddFiles={handleAddFiles}
        onProceedToSplit={(file) => {
          setSelectedFileId(file.id);
          setActiveTab('splitter');
        }}
      />

      <PreviewModal
        file={previewFile}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewFile(null);
        }}
        onProceedToSplit={(file) => {
          setSelectedFileId(file.id);
          setActiveTab('splitter');
        }}
      />

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
