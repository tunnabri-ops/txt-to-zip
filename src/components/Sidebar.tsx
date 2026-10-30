import React from 'react';
import {
  LayoutDashboard,
  Upload,
  Scissors,
  Layers,
  Archive,
  BarChart2,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'upload'
  | 'splitter'
  | 'batch'
  | 'zip'
  | 'analytics'
  | 'history'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenPrivacyModal?: () => void;
  onResetSession?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenPrivacyModal,
  onResetSession,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload' as NavTab, label: 'Upload Files', icon: Upload },
    { id: 'splitter' as NavTab, label: 'TXT Splitter', icon: Scissors },
    { id: 'batch' as NavTab, label: 'Batch Processing', icon: Layers },
    { id: 'zip' as NavTab, label: 'ZIP Generator', icon: Archive },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart2 },
    { id: 'history' as NavTab, label: 'Processing History', icon: History },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#1e2030] border-r border-white/5 flex flex-col justify-between p-6 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo matching reference */}
          <div className="flex items-center gap-3.5 px-2 mb-8">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1f72e6] to-[#2997FF] flex items-center justify-center shadow-lg shadow-[#2997FF]/25">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 12L12 14L14 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18V14" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00F0FF] border-2 border-[#1e2030]" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                TXT TO ZIP
              </div>
              <p className="text-[11px] text-[#A5A8BA] font-medium tracking-wide">
                Fast Splitter & Archive
              </p>
            </div>
          </div>

          {/* Navigation Links matching reference */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-[#2997FF] text-white shadow-md shadow-[#2997FF]/30 font-semibold'
                      : 'text-[#A5A8BA] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#A5A8BA]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          {/* Upgraded Local Security / Performance Card matching reference styling */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#25283c] to-[#1c1e2d] p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-[#2997FF]/15 text-[#2997FF]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[12px] font-semibold text-white">100% Local Engine</span>
            </div>
            <p className="text-[11px] text-[#A5A8BA] leading-relaxed mb-3">
              Zero cloud uploads. Supports chunked processing of files up to 10GB in browser.
            </p>
            <button
              onClick={onOpenPrivacyModal}
              className="text-[12px] font-medium text-[#2997FF] hover:text-[#55aaff] flex items-center gap-1.5 transition-colors group"
            >
              <span>Security & Limits</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Log Out / Reset button */}
          <button
            onClick={onResetSession}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#A5A8BA] hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Reset Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
