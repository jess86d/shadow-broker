import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ShadowScribe } from './components/ShadowScribe';
import { AbyssalVision } from './components/AbyssalVision';
import { CodeWeaver } from './components/CodeWeaver';
import { SpecterSentinel } from './components/SpecterSentinel';
import { ShadowCrawler } from './components/ShadowCrawler';
import { OsintHarbinger } from './components/OsintHarbinger';
import { AbyssalLedger } from './components/AbyssalLedger';
import { Tool } from './types';

const toolOrder = [
  Tool.ShadowScribe,
  Tool.AbyssalVision,
  Tool.CodeWeaver,
  Tool.SpecterSentinel,
  Tool.ShadowCrawler,
  Tool.OsintHarbinger,
  Tool.AbyssalLedger,
];

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.ShadowScribe);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Use metaKey for Command key on macOS
      if (event.ctrlKey || event.metaKey) {
        const keyNumber = parseInt(event.key, 10);
        if (keyNumber >= 1 && keyNumber <= toolOrder.length) {
          // Prevent browser shortcuts like Ctrl+1 (switch to first tab)
          event.preventDefault();
          const selectedTool = toolOrder[keyNumber - 1];
          if (selectedTool) {
            setActiveTool(selectedTool);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array ensures this effect runs only once


  const renderTool = () => {
    switch (activeTool) {
      case Tool.ShadowScribe:
        return <ShadowScribe />;
      case Tool.AbyssalVision:
        return <AbyssalVision />;
      case Tool.CodeWeaver:
        return <CodeWeaver />;
      case Tool.SpecterSentinel:
        return <SpecterSentinel />;
      case Tool.ShadowCrawler:
        return <ShadowCrawler />;
      case Tool.OsintHarbinger:
        return <OsintHarbinger />;
      case Tool.AbyssalLedger:
        return <AbyssalLedger />;
      default:
        return <ShadowScribe />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTool={activeTool} setActiveTool={setActiveTool} />
        <main className="flex-1 p-6 overflow-y-auto scrollbar-thin-cyan">
          {renderTool()}
        </main>
      </div>
    </div>
  );
};

export default App;