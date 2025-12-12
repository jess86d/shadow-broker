import React, { useState, useEffect } from 'react';

interface TerminalOutputProps {
  text: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    if (text) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
        if (i > text.length) {
          clearInterval(intervalId);
        }
      }, 10);
      return () => clearInterval(intervalId);
    }
  }, [text]);

  return (
    <div className="bg-gray-900/50 p-4 border border-cyan-800 rounded-md min-h-[200px] w-full mt-4 shadow-inner shadow-cyan-900/30">
      <pre className="text-green-400 whitespace-pre-wrap break-words">
        <code>{displayedText}</code>
        <span className="animate-ping">_</span>
      </pre>
    </div>
  );
};
