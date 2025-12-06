import React, { useState } from 'react';
import { generateVideoPrompts, calculateTimestamps } from '../services/videoPromptService';
import { PromptScene } from '../types';

interface VideoPromptGeneratorProps {
  lyrics: string;
  style: string;
  scenes?: PromptScene[];  // 字コンテデータ（オプション）
}

interface VideoScene {
  scene: number;
  timestamp: string;
  duration_seconds: number;
  prompt: string;
  negative_prompt: string;
}

export const VideoPromptGenerator: React.FC<VideoPromptGeneratorProps> = ({ lyrics, style, scenes: existingScenes }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_api_key') || '');
  const [model, setModel] = useState('tngtech/deepseek-r1t-chimera:free');
  const [scenes, setScenes] = useState<VideoScene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const aiModels = [
    { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera (無料) ⭐推奨', description: '高性能推論モデル・無料' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera (無料)', description: '第2世代・高速・無料' },
    { id: 'amazon/nova-2-lite:free', name: 'Amazon Nova 2 Lite (無料)', description: '高速・マルチモーダル対応' },
    { id: 'openai/gpt-oss-20b:free', name: 'OpenAI GPT-OSS 20B (無料)', description: 'OpenAI公式無料モデル' },
    { id: 'google/gemma-3-27b:free', name: 'Google Gemma 3 27B (無料)', description: '多言語対応・無料' },
    { id: 'nvidia/nemotron-nano-12b-2-vl:free', name: 'NVIDIA Nemotron Nano (無料)', description: 'ビデオ理解・ドキュメント処理' },
    { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (無料)', description: 'エージェント最適化' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (有料)', description: '最高性能' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (有料)', description: '詳細な描写' }
  ];

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('OpenRouter APIキーを入力してください');
      return;
    }

    if (!lyrics) {
      setError('歌詞を入力してください');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      localStorage.setItem('openrouter_api_key', apiKey);

      const generatedScenes = await generateVideoPrompts(apiKey, {
        lyrics,
        style,
        model,
        existingScenes  // 字コンテデータを渡す
      });

      const scenesWithTimestamps = calculateTimestamps(generatedScenes);
      setScenes(scenesWithTimestamps);

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (scenes.length === 0) return;

    const jsonData = JSON.stringify(scenes, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_prompts_for_comfyui.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    alert('プロンプトをコピーしました！');
  };

  return (
    <div className="video-prompt-generator">
      <div className="generator-header">
        <h2>🎬 動画生成用プロンプト生成（英語）</h2>
        <p>歌詞から直接、ComfyUI用の詳細な英語プロンプトを生成します</p>
      </div>

      <div className="api-settings">
        <div className="input-group">
          <label htmlFor="openrouter-key">
            OpenRouter APIキー
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
              （取得）
            </a>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="openrouter-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              spellCheck={false}
              style={{ paddingRight: '80px' }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px 8px'
              }}
            >
              {showApiKey ? '🙈 隠す' : '👁️ 表示'}
            </button>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="ai-model">AIモデル</label>
          <select
            id="ai-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {aiModels.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} - {m.description}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !lyrics}
          className="generate-btn"
        >
          {isGenerating ? '🔄 生成中...' : '🎬 動画プロンプト生成'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {scenes.length > 0 && (
        <div className="scenes-result">
          <div className="result-header">
            <h3>✅ {scenes.length}シーンのプロンプトを生成しました</h3>
            <button onClick={handleExport} className="export-btn">
              💾 JSONエクスポート
            </button>
          </div>

          <div className="scenes-list">
            {scenes.map((scene) => (
              <div key={scene.scene} className="scene-card">
                <div className="scene-header">
                  <span className="scene-number">シーン {scene.scene}</span>
                  <span className="scene-timestamp">{scene.timestamp}</span>
                  <span className="scene-duration">{scene.duration_seconds}秒</span>
                </div>

                <div className="prompt-section">
                  <div className="prompt-header">
                    <label>📝 Prompt (英語)</label>
                    <button
                      onClick={() => copyPrompt(scene.prompt)}
                      className="copy-btn"
                    >
                      📋 コピー
                    </button>
                  </div>
                  <div className="prompt-content">
                    {scene.prompt}
                  </div>
                </div>

                <div className="negative-prompt-section">
                  <label>🚫 Negative Prompt</label>
                  <div className="prompt-content negative">
                    {scene.negative_prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="usage-hint">
            <h4>💡 使い方</h4>
            <ol>
              <li>「💾 JSONエクスポート」でファイルをダウンロード</li>
              <li>Google Colabノートブックの<strong>セル10.5</strong>を開く</li>
              <li><code>raw_prompts = [...]</code>に上記JSONの内容を<strong>全部コピペ</strong></li>
              <li>セル10.5を実行 → 最適化完了</li>
              <li>セル11→12を実行 → 動画生成開始</li>
            </ol>
          </div>
        </div>
      )}

      <style>{`
        .video-prompt-generator {
          background: #0f172a;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          margin-top: 30px;
          border: 1px solid #1e293b;
        }

        .generator-header {
          margin-bottom: 25px;
        }

        .generator-header h2 {
          color: #f1f5f9;
          margin-bottom: 10px;
        }

        .generator-header p {
          color: #94a3b8;
          font-size: 14px;
        }

        .api-settings {
          background: #1e293b;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #334155;
        }

        .input-group {
          margin-bottom: 15px;
        }

        .input-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #f1f5f9;
        }

        .input-group label a {
          color: #60a5fa;
          font-size: 12px;
          margin-left: 10px;
        }

        .input-group input,
        .input-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #334155;
          border-radius: 6px;
          font-size: 14px;
          background: #0f172a;
          color: #f1f5f9;
        }

        .input-group select option {
          background: #0f172a;
          color: #f1f5f9;
        }

        .input-group input:focus,
        .input-group select:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .generate-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background: #3f1d1d;
          border: 2px solid #991b1b;
          color: #fca5a5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .scenes-result {
          margin-top: 30px;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .result-header h3 {
          color: #4ade80;
        }

        .export-btn {
          padding: 10px 20px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .export-btn:hover {
          background: #15803d;
        }

        .scenes-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .scene-card {
          background: #1e293b;
          border: 2px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .scene-header {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid #334155;
        }

        .scene-number {
          font-weight: 700;
          color: #818cf8;
          font-size: 16px;
        }

        .scene-timestamp {
          color: #94a3b8;
          font-size: 14px;
        }

        .scene-duration {
          color: #94a3b8;
          font-size: 14px;
        }

        .prompt-section,
        .negative-prompt-section {
          margin-bottom: 15px;
        }

        .prompt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .prompt-header label,
        .negative-prompt-section label {
          font-weight: 600;
          color: #f1f5f9;
        }

        .copy-btn {
          padding: 5px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .copy-btn:hover {
          background: #2563eb;
        }

        .prompt-content {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 15px;
          font-size: 13px;
          line-height: 1.6;
          color: #e2e8f0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .prompt-content.negative {
          background: #1e1b1b;
          border-color: #991b1b;
          color: #fca5a5;
        }

        .usage-hint {
          background: #1e293b;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }

        .usage-hint h4 {
          color: #60a5fa;
          margin-bottom: 15px;
        }

        .usage-hint ol {
          margin-left: 20px;
          line-height: 1.8;
          color: #cbd5e1;
        }

        .usage-hint code {
          background: #0f172a;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          color: #fca5a5;
        }

        .usage-hint strong {
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
};
