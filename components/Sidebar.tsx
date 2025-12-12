import React from 'react';
import { Tool } from '../types';
import { CodeIcon, ImageIcon, TextIcon, ShieldIcon, NetworkIcon, RadarIcon, LedgerIcon } from './Icons';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  hotkey?: string;
}> = ({ label, icon, isActive, onClick, hotkey }) => {
  const activeClasses = 'bg-cyan-900/50 text-cyan-300 border-cyan-500';
  const inactiveClasses = 'bg-gray-900/30 text-cyan-600 border-gray-800 hover:bg-gray-800/50 hover:border-cyan-700';
  
  return (
    <div className="relative group my-2">
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 border-l-4 transition-all duration-300 ${isActive ? activeClasses : inactiveClasses}`}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-4">{label}</span>
        </div>
        {hotkey && <span className="text-xs text-cyan-700 opacity-75">{hotkey}</span>}
      </button>

      {/* Tooltip appears on the right of the button on hover */}
      <span 
        className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-cyan-300 text-sm rounded-md shadow-lg shadow-cyan-900/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50"
        role="tooltip"
      >
        {label}
      </span>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool }) => {
  return (
    <aside className="w-64 bg-black border-r border-cyan-900/50 p-4 flex-shrink-0">
      <h2 className="text-lg text-purple-400 mb-4 tracking-wider">PROTOCOLS</h2>
      <nav>
        <NavButton
          label="Shadow Scribe"
          hotkey="Ctrl+1"
          icon={<TextIcon />}
          isActive={activeTool === Tool.ShadowScribe}
          onClick={() => setActiveTool(Tool.ShadowScribe)}
        />
        <NavButton
          label="Abyssal Vision"
          hotkey="Ctrl+2"
          icon={<ImageIcon />}
          isActive={activeTool === Tool.AbyssalVision}
          onClick={() => setActiveTool(Tool.AbyssalVision)}
        />
        <NavButton
          label="Code Weaver"
          hotkey="Ctrl+3"
          icon={<CodeIcon />}
          isActive={activeTool === Tool.CodeWeaver}
          onClick={() => setActiveTool(Tool.CodeWeaver)}
        />
        <NavButton
          label="Specter Sentinel"
          hotkey="Ctrl+4"
          icon={<ShieldIcon />}
          isActive={activeTool === Tool.SpecterSentinel}
          onClick={() => setActiveTool(Tool.SpecterSentinel)}
        />
        <NavButton
          label="Shadow Crawler"
          hotkey="Ctrl+5"
          icon={<NetworkIcon />}
          isActive={activeTool === Tool.ShadowCrawler}
          onClick={() => setActiveTool(Tool.ShadowCrawler)}
        />
        <NavButton
          label="OSINT Harbinger"
          hotkey="Ctrl+6"
          icon={<RadarIcon />}
          isActive={activeTool === Tool.OsintHarbinger}
          onClick={() => setActiveTool(Tool.OsintHarbinger)}
        />
        <NavButton
          label="Abyssal Ledger"
          hotkey="Ctrl+7"
          icon={<LedgerIcon />}
          isActive={activeTool === Tool.AbyssalLedger}
          onClick={() => setActiveTool(Tool.AbyssalLedger)}
        />
      </nav>
    </aside>
  );
};