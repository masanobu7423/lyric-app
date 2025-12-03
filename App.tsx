import React, { useState } from 'react';
import { InputSection } from './components/InputSection';
import { ResultsTable } from './components/ResultsTable';
import { PromptScene, GenerationConfig } from './types';
import { generatePromptsFromLyrics } from './services/geminiService';
import { Clapperboard, Video, AlertCircle } from 'lucide-react';

export default function App() {
  const [scenes, setScenes] = useState<PromptScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (config: GenerationConfig) => {
    setIsLoading(true);
    setError(null);
    setScenes([]); // Clear previous results

    try {
      const generatedScenes = await generatePromptsFromLyrics(config);
      setScenes(generatedScenes);
    } catch (err: any) {
      setError(err.message || "プロンプトの生成中に予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary selection:text-white">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-10 text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-indigo-500/20">
              <Clapperboard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              LyricToPrompt
            </h1>
          </div>
          <p className="text-muted max-w-xl mx-auto">
            歌詞を入力するだけで、MV用の構成案を作成。
            <br />
            Googleスプレッドシートに貼り付け可能な形式で、シーン別のAI動画生成プロンプト（Veo, Sora, Runway用）を自動生成します。
          </p>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-4 sticky top-8">
            <InputSection onGenerate={handleGenerate} isLoading={isLoading} />
            
            {/* Tips Section */}
            <div className="mt-6 p-4 rounded-xl border border-dashed border-gray-700 bg-gray-900/30 text-xs text-muted space-y-2">
              <h3 className="font-bold text-gray-400 flex items-center gap-2">
                <Video className="w-4 h-4" /> 使い方のヒント
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>歌詞に [間奏] や [ギターソロ] などを明記すると、より正確なシーン分割が可能です。</li>
                <li>統一感のある動画を作るために、適切な「映像スタイル」を選択してください。</li>
                <li>生成後は「スプレッドシート用にコピー」ボタンを押し、Google Sheetsに貼り付けてチームと共有しましょう。</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 min-h-[500px]">
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">生成に失敗しました</h4>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {scenes.length > 0 ? (
              <ResultsTable scenes={scenes} />
            ) : (
              !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/20">
                  <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 text-gray-600">
                    <Video className="w-8 h-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-400">準備完了</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-xs">
                    左側のフォームに歌詞を入力して、あなただけのビデオ絵コンテを作成しましょう。
                  </p>
                </div>
              )
            )}
            
            {isLoading && (
               <div className="h-full flex flex-col items-center justify-center text-center p-12">
                 <div className="w-full max-w-md space-y-4">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-primary animate-pulse w-2/3"></div>
                    </div>
                    <p className="text-sm text-accent animate-pulse">歌詞のリズムと感情を分析中...</p>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}