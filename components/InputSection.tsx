import React, { useState } from 'react';
import { VisualStyle, GenerationConfig } from '../types';
import { Sparkles, Loader2, Music, User, Type as TypeIcon, Key } from 'lucide-react';

interface InputSectionProps {
  onGenerate: (config: GenerationConfig) => void;
  isLoading: boolean;
}

const STYLE_LABELS: Record<VisualStyle, string> = {
  [VisualStyle.CINEMATIC]: "シネマティック（実写 4K映画風）",
  [VisualStyle.ANIME]: "アニメ調（新海誠風・美麗な背景）",
  [VisualStyle.CYBERPUNK]: "サイバーパンク / SF・近未来",
  [VisualStyle.SURREAL]: "シュルレアリスム / 幻想的・夢の中",
  [VisualStyle.VINTAGE]: "ヴィンテージ（90年代 VHSレトロ風）",
  [VisualStyle.MINIMALIST]: "ミニマリスト / 抽象的アート",
  [VisualStyle.PIXEL_ART]: "ピクセルアート / ドット絵",
};

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [lyrics, setLyrics] = useState('');
  const [artistName, setArtistName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(VisualStyle.CINEMATIC);
  
  // ローカルストレージからAPIキーを読み込む
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });

  // APIキーが変更されたらローカルストレージに保存
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('gemini_api_key', value);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyrics.trim()) return;
    
    console.log('📤 送信データ確認:');
    console.log('  - APIキー:', apiKey ? (apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4)) : '未設定');
    console.log('  - 曲名:', songTitle || '未設定');
    console.log('  - アーティスト:', artistName || '未設定');
    console.log('  - スタイル:', visualStyle);
    console.log('  - 歌詞文字数:', lyrics.length);
    
    onGenerate({
      lyrics,
      artistName,
      songTitle,
      visualStyle,
      apiKey: apiKey.trim() || undefined
    });
  };

  return (
    <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow-xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5" />
        設定入力
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-1 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
          <label className="text-xs font-bold text-yellow-300 flex items-center gap-1">
            <Key className="w-4 h-4" /> Gemini API Key (必須)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="AIzaSy... で始まるAPIキーを入力"
            className="w-full bg-background border border-yellow-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition font-mono"
          />
          <div className="text-xs text-yellow-200/80 mt-1 space-y-1">
            <p>🔑 新しいAPIキーを取得: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:underline font-bold">Google AI Studio →</a></p>
            <p>💡 「Create API Key」→「Create API key in new project」を選択</p>
            <p>💾 入力したAPIキーはブラウザに自動保存されます</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
              <Music className="w-3 h-3" /> 曲名 (任意)
            </label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="例: Blinding Lights"
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
               <User className="w-3 h-3" /> アーティスト名 (任意)
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="例: The Weeknd"
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        {/* Style Selector */}
        <div className="space-y-1">
           <label className="text-xs font-medium text-muted flex items-center gap-1">
              <TypeIcon className="w-3 h-3" /> 映像スタイル
            </label>
          <select
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
            className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm text-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          >
            {Object.entries(STYLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Lyrics Area */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">
            歌詞 (ここに貼り付け)
          </label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="ここに歌詞を貼り付けてください..."
            rows={8}
            required
            className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none font-mono leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading || !lyrics.trim()}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all duration-200
            ${isLoading || !lyrics.trim() 
              ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
              : 'bg-gradient-to-r from-primary to-accent hover:opacity-90 hover:scale-[1.01] shadow-lg shadow-indigo-500/20'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              シーンを分析中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              プロンプトを生成する
            </>
          )}
        </button>
      </form>
    </div>
  );
};