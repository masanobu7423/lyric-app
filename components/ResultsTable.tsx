import React, { useState } from 'react';
import { PromptScene } from '../types';
import { Copy, Check, FileSpreadsheet, Film, Camera, Lightbulb } from 'lucide-react';

interface ResultsTableProps {
  scenes: PromptScene[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ scenes }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [tableCopied, setTableCopied] = useState(false);

  if (scenes.length === 0) return null;

  // Function to copy a single prompt
  const handleCopyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Function to copy table data formatted for Spreadsheets (TSV)
  const handleCopyToSpreadsheet = () => {
    // Headers (Japanese)
    const headers = ["シーン番号", "時間", "歌詞パート", "視覚的描写", "カメラワーク", "雰囲気・照明", "生成AI用プロンプト (英語)"];
    
    // Rows
    const rows = scenes.map(scene => [
      scene.sceneNumber,
      scene.timeframe,
      scene.lyricsSegment,
      scene.visualDescription,
      scene.cameraMovement,
      scene.moodLighting,
      scene.aiPrompt
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join("\t")); // Escape quotes and join with tab

    const tsvContent = [headers.join("\t"), ...rows].join("\n");
    
    navigator.clipboard.writeText(tsvContent);
    setTableCopied(true);
    setTimeout(() => setTableCopied(false), 3000);
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Header Toolbar */}
      <div className="p-4 border-b border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-accent" />
          生成された絵コンテ
          <span className="text-xs font-normal text-muted bg-gray-800 px-2 py-1 rounded-full">
            {scenes.length} シーン
          </span>
        </h2>
        
        <button
          onClick={handleCopyToSpreadsheet}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border
            ${tableCopied 
              ? 'bg-green-500/10 border-green-500 text-green-400' 
              : 'bg-surface border-gray-600 text-text hover:bg-gray-700'
            }`}
        >
          {tableCopied ? <Check className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
          {tableCopied ? 'コピー完了' : 'スプレッドシート用にコピー'}
        </button>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto custom-scrollbar flex-grow">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-900/50 text-xs uppercase tracking-wider text-muted border-b border-gray-700">
              <th className="p-4 font-semibold w-16">#</th>
              <th className="p-4 font-semibold w-24">時間</th>
              <th className="p-4 font-semibold w-1/6">歌詞</th>
              <th className="p-4 font-semibold w-1/5">視覚的描写</th>
              <th className="p-4 font-semibold w-1/6">技術指定</th>
              <th className="p-4 font-semibold w-1/4">生成AI用プロンプト (英語)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {scenes.map((scene, idx) => (
              <tr key={idx} className="hover:bg-gray-700/30 transition-colors group">
                <td className="p-4 text-muted font-mono text-sm">{scene.sceneNumber}</td>
                <td className="p-4 text-accent text-sm font-medium whitespace-nowrap">{scene.timeframe}</td>
                <td className="p-4 text-text text-sm italic">"{scene.lyricsSegment}"</td>
                <td className="p-4 text-gray-300 text-sm">{scene.visualDescription}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-2 text-xs text-muted">
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-3 h-3 text-primary" /> {scene.cameraMovement}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3 text-yellow-500" /> {scene.moodLighting}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="relative">
                    <div className="bg-background border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                      {scene.aiPrompt}
                    </div>
                    <button
                      onClick={() => handleCopyPrompt(scene.aiPrompt, idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="プロンプトをコピー"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};