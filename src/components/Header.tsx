import React, { useState } from 'react';
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  Menu,
  Shield,
  Trash2,
  FileText,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onOpenSettings,
  onToggleMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, text: 'Privacy Guard: Secrets auto-masked in exported TXT parts', time: 'Just now' },
    { id: 2, text: 'Engine Ready: Chunked streaming mode initialized (10GB capacity)', time: '2m ago' },
    { id: 3, text: 'JSZip & Stream ready for high-compression archive packaging', time: '10m ago' },
  ];

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      {/* Title & Mobile Menu trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2.5 rounded-xl bg-[#25283c] text-white hover:bg-[#2c3047] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#A5A8BA]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Local File Processing
            </span>
            <span>·</span>
            <span>Zero Cloud Uploads</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Search bar + Notification + Settings + Profile Dropdown */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Search input with signature blue square search button */}
        <div className="relative flex items-center min-w-[260px] md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files or records..."
            className="w-full bg-[#25283c] border border-white/5 rounded-2xl py-2.5 pl-4 pr-12 text-sm text-white placeholder-[#A5A8BA] focus:outline-none focus:ring-2 focus:ring-[#2997FF]/50 transition-all"
          />
          <button
            className="absolute right-1.5 top-1.5 bottom-1.5 w-9 h-9 bg-[#2997FF] hover:bg-[#1a85ed] text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            aria-label="Submit search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="w-10 h-10 rounded-2xl bg-[#25283c] border border-white/5 flex items-center justify-center text-[#A5A8BA] hover:text-white hover:bg-[#2c3047] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#2997FF]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1e2030] border border-white/10 rounded-2xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Engine Activity</span>
                <span className="text-[11px] text-[#2997FF]">Live local logs</span>
              </div>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div key={n.id} className="text-xs p-2.5 rounded-xl bg-[#25283c]/60 border border-white/5">
                    <p className="text-white/90 leading-snug">{n.text}</p>
                    <span className="text-[10px] text-[#A5A8BA] mt-1 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-2xl bg-[#25283c] border border-white/5 flex items-center justify-center text-[#A5A8BA] hover:text-white hover:bg-[#2c3047] transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Pill Dropdown matching reference */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl bg-[#25283c] border border-white/5 hover:bg-[#2c3047] transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center ring-2 ring-[#2997FF]/30">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Angelina Joli"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xs font-bold text-white">AJ</span>
            </div>
            <span className="text-xs font-semibold text-white">Angelina Joli</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#A5A8BA]" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#1e2030] border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-white/5 mb-1">
                <p className="text-xs font-semibold text-white">Angelina Joli</p>
                <p className="text-[11px] text-[#A5A8BA]">Local Workspace Operator</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-[#A5A8BA] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Splitter Preferences</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  window.location.reload();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Cached Data</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
