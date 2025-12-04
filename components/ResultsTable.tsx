import React, { useState } from 'react';
import { PromptScene } from '../types';
import { Copy, Check, FileSpreadsheet, Film } from 'lucide-react';

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
    const headers = ["シーン番号", "秒数", "カット割り（映像内容）", "音声・SE・音楽", "テロップ", "ナレーション", "演出メモ（グレーディング・アングル）"];
    
    // Rows
    const rows = scenes.map(scene => [
      scene.sceneNumber,
      scene.duration,
      scene.cutDescription,
      scene.audioSE,
      scene.telop,
      scene.narration,
      scene.directionMemo
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
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-gray-900/50 text-xs uppercase tracking-wider text-muted border-b border-gray-700">
              <th className="p-4 font-semibold w-16">#</th>
              <th className="p-4 font-semibold w-20">秒数</th>
              <th className="p-4 font-semibold w-1/4">カット割り（映像内容）</th>
              <th className="p-4 font-semibold w-1/6">音声・SE・音楽</th>
              <th className="p-4 font-semibold w-24">テロップ</th>
              <th className="p-4 font-semibold w-24">ナレーション</th>
              <th className="p-4 font-semibold w-1/5">演出メモ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {scenes.map((scene, idx) => (
              <tr key={idx} className="hover:bg-gray-700/30 transition-colors group">
                <td className="p-4 text-muted font-mono text-sm">{scene.sceneNumber}</td>
                <td className="p-4 text-accent text-sm font-medium whitespace-nowrap">{scene.duration}</td>
                <td className="p-4 text-gray-300 text-sm leading-relaxed">{scene.cutDescription}</td>
                <td className="p-4 text-text text-sm italic">{scene.audioSE}</td>
                <td className="p-4 text-yellow-300 text-xs">{scene.telop || '-'}</td>
                <td className="p-4 text-blue-300 text-xs">{scene.narration || '-'}</td>
                <td className="p-4">
                  <div className="relative">
                    <div className="bg-background border border-gray-700 rounded-lg p-3 text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                      {scene.directionMemo}
                    </div>
                    <button
                      onClick={() => handleCopyPrompt(scene.directionMemo, idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="演出メモをコピー"
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