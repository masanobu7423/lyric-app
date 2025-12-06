import React, { useState } from 'react';
import { PromptScene } from '../types';
import { generateMultipleStoryboardPrompts } from '../services/openRouterService';
import { generateMultipleStoryboardImages, ImageGenerationProvider } from '../services/imageGenerationService';
import { Wand2, Key, AlertCircle, CheckCircle, Loader, Image as ImageIcon } from 'lucide-react';

interface StoryboardGeneratorProps {
  scenes: PromptScene[];
  projectId?: string;
  onImagesGenerated?: (images: Map<number, string>) => void;
}

export const StoryboardGenerator: React.FC<StoryboardGeneratorProps> = ({ scenes, onImagesGenerated }) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('openrouter_api_key') || '');
  const [imageApiKey, setImageApiKey] = useState<string>(() => localStorage.getItem('image_api_key') || '');
  const [imageProvider, setImageProvider] = useState<ImageGenerationProvider>(() => 
    (localStorage.getItem('image_provider') as ImageGenerationProvider) || 'pollinations'
  );
  const [model, setModel] = useState<string>('tngtech/deepseek-r1t-chimera:free');
  
  // キャラクター・スタイル設定
  const [characterDescription, setCharacterDescription] = useState<string>(() => 
    localStorage.getItem('character_description') || ''
  );
  const [visualStyle, setVisualStyle] = useState<string>(() => 
    localStorage.getItem('visual_style') || 'anime'
  );
  const [timeOfDay, setTimeOfDay] = useState<string>(() => 
    localStorage.getItem('time_of_day') || ''
  );
  const [weather, setWeather] = useState<string>(() => 
    localStorage.getItem('weather') || ''
  );
  const [location, setLocation] = useState<string>(() => 
    localStorage.getItem('location') || ''
  );
  const [positivePrompt, setPositivePrompt] = useState<string>(() => 
    localStorage.getItem('positive_prompt') || 'high quality, detailed, masterpiece, best quality, highly detailed, sharp focus, professional'
  );
  const [negativePrompt, setNegativePrompt] = useState<string>(() => 
    localStorage.getItem('negative_prompt') || 'bad quality, EasyNegative, nsfw, lowres, bad anatomy, badhand-v1, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, blurry, artifacts, unrealistic, deformed, ugly, duplicate, morbid, mutilated, mutation, disfigured, out of frame, poorly drawn, blurred'
  );
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [showImageApiKey, setShowImageApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [imageProgress, setImageProgress] = useState({ completed: 0, total: 0 });
  const [generatedPrompts, setGeneratedPrompts] = useState<Map<number, string>>(new Map());
  const [generatedImages, setGeneratedImages] = useState<Map<number, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const aiModels = [
    { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera (無料) ⭐推奨', description: '高性能推論モデル・無料' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera (無料)', description: '第2世代・高速・無料' },
    { id: 'amazon/nova-2-lite:free', name: 'Amazon Nova 2 Lite (無料)', description: '高速・マルチモーダル対応' },
    { id: 'openai/gpt-oss-20b:free', name: 'OpenAI GPT-OSS 20B (無料)', description: 'OpenAI公式無料モデル' },
    { id: 'google/gemma-3-27b:free', name: 'Google Gemma 3 27B (無料)', description: '多言語対応・無料' },
    { id: 'nvidia/nemotron-nano-12b-2-vl:free', name: 'NVIDIA Nemotron Nano (無料)', description: 'ビデオ理解・ドキュメント処理' },
    { id: 'z-ai/glm-4.5-air:free', name: 'GLM 4.5 Air (無料)', description: 'エージェント最適化' },
    { id: 'openai/gpt-4o', name: 'GPT-4o (有料)', description: '最高性能' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (有料)', description: '詳細描写' }
  ];

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('openrouter_api_key', value);
  };

  const handleImageApiKeyChange = (value: string) => {
    setImageApiKey(value);
    localStorage.setItem('image_api_key', value);
  };

  const handleImageProviderChange = (value: ImageGenerationProvider) => {
    setImageProvider(value);
    localStorage.setItem('image_provider', value);
  };

  const handleCharacterDescriptionChange = (value: string) => {
    setCharacterDescription(value);
    localStorage.setItem('character_description', value);
  };

  const handleVisualStyleChange = (value: string) => {
    setVisualStyle(value);
    localStorage.setItem('visual_style', value);
  };

  const handleTimeOfDayChange = (value: string) => {
    setTimeOfDay(value);
    localStorage.setItem('time_of_day', value);
  };

  const handleWeatherChange = (value: string) => {
    setWeather(value);
    localStorage.setItem('weather', value);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    localStorage.setItem('location', value);
  };

  const handlePositivePromptChange = (value: string) => {
    setPositivePrompt(value);
    localStorage.setItem('positive_prompt', value);
  };

  const handleNegativePromptChange = (value: string) => {
    setNegativePrompt(value);
    localStorage.setItem('negative_prompt', value);
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('OpenRouter APIキーを入力してください');
      return;
    }

    if (scenes.length === 0) {
      setError('生成する字コンテがありません');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress({ completed: 0, total: scenes.length });

    try {
      const prompts = await generateMultipleStoryboardPrompts(
        scenes,
        apiKey,
        model,
        (completed, total) => {
          setProgress({ completed, total });
        }
      );

      const promptMap = new Map<number, string>();
      scenes.forEach((scene, index) => {
        const prompt = prompts.get(index);
        if (prompt) {
          promptMap.set(scene.sceneNumber, prompt);
        }
      });

      setGeneratedPrompts(promptMap);
      setIsGenerating(false);
      alert(`${promptMap.size}個の絵コンテプロンプトを生成しました！`);
    } catch (err: any) {
      setError(err.message || '絵コンテプロンプトの生成に失敗しました');
      setIsGenerating(false);
    }
  };

  // Geminiの絵コンテ説明を直接使用（OpenRouterのレート制限回避）
  const handleUseGeminiDescriptions = () => {
    const promptMap = new Map<number, string>();
    scenes.forEach((scene) => {
      // Geminiの絵コンテ説明を英訳風に整形
      const englishPrompt = `Scene ${scene.sceneNumber}: ${scene.cutDescription}`;
      promptMap.set(scene.sceneNumber, englishPrompt);
    });

    setGeneratedPrompts(promptMap);
    alert(`${promptMap.size}個のプロンプトを準備しました！（Gemini絵コンテを使用）`);
  };

  const handleGenerateImages = async () => {
    console.log('🎨 画像生成開始');
    console.log('📊 プロバイダー:', imageProvider);
    console.log('🔑 APIキー:', imageApiKey ? '設定済み' : '未設定');
    console.log('📝 プロンプト数:', generatedPrompts.size);
    
    // Pollinations以外はAPIキーが必要
    if (imageProvider !== 'pollinations' && !imageApiKey.trim()) {
      setError('画像生成APIキーを入力してください');
      return;
    }

    if (generatedPrompts.size === 0) {
      setError('まず絵コンテプロンプトを生成してください');
      return;
    }

    setIsGeneratingImages(true);
    setError(null);
    setImageProgress({ completed: 0, total: generatedPrompts.size });

    try {
      // スタイルプリセットを取得
      const getStylePrompts = (style: string): { positive: string; negative: string } => {
        const presets: Record<string, { positive: string; negative: string }> = {
          anime: {
            positive: 'anime style, 2D animation, cel shaded, vibrant colors, Japanese animation',
            negative: 'realistic, photorealistic, photo, 3D, live action, real life, photography, hyperrealistic'
          },
          realistic: {
            positive: 'photorealistic, realistic, photo, detailed, high quality photography, cinematic lighting',
            negative: 'anime, cartoon, drawing, illustration, painting, animated, 2D, cel shaded'
          },
          illustration: {
            positive: 'digital illustration, artwork, painted, artistic style, illustration art',
            negative: 'photorealistic, photo, 3D render, anime, cartoon'
          },
          '3d': {
            positive: '3D render, CGI, computer graphics, rendered, digital 3D art',
            negative: 'anime, cartoon, 2D, hand drawn, sketch, photorealistic'
          }
        };
        return presets[style] || { positive: '', negative: '' };
      };

      const stylePrompts = getStylePrompts(visualStyle);
      
      // 環境設定を構築
      const environmentParts: string[] = [];
      if (timeOfDay) environmentParts.push(timeOfDay);
      if (weather) environmentParts.push(weather);
      if (location) environmentParts.push(location);
      const environmentPrefix = environmentParts.length > 0 
        ? `[ENVIRONMENT] ${environmentParts.join(', ')}. ` 
        : '';
      
      // キャラクター説明
      const characterPrefix = characterDescription.trim() 
        ? `[CHARACTER] ${characterDescription.trim()}. ` 
        : '';
      
      // ポジティブ・ネガティブプロンプトの構築
      const fullPositivePrompt = [
        stylePrompts.positive,
        positivePrompt.trim()
      ].filter(Boolean).join(', ');
      
      const fullNegativePrompt = [
        stylePrompts.negative,
        negativePrompt.trim()
      ].filter(Boolean).join(', ');
      
      const positivePrefix = fullPositivePrompt 
        ? `[POSITIVE] ${fullPositivePrompt}. ` 
        : '';
      const negativePrefix = fullNegativePrompt 
        ? `[NEGATIVE] ${fullNegativePrompt}. ` 
        : '';
      
      // プロンプトをシーン番号順に並べ、すべての設定を追加
      const promptArray: string[] = scenes.map(scene => {
        const prompt = generatedPrompts.get(scene.sceneNumber);
        if (!prompt) {
          console.warn(`⚠️ シーン ${scene.sceneNumber} のプロンプトが見つかりません`);
          return `${positivePrefix}${characterPrefix}${environmentPrefix}Scene ${scene.sceneNumber}: ${scene.cutDescription}${negativePrefix}`;
        }
        return `${positivePrefix}${characterPrefix}${environmentPrefix}${prompt}${negativePrefix}`;
      });
      
      console.log('📝 プロンプト配列作成完了:', promptArray.length, '個');
      console.log('🎨 スタイル:', visualStyle);
      if (characterDescription.trim()) {
        console.log('👤 キャラクター設定適用済み');
      }
      if (environmentParts.length > 0) {
        console.log('🌍 環境設定:', environmentParts.join(', '));
      }
      if (fullPositivePrompt) {
        console.log('➕ ポジティブプロンプト適用済み');
      }
      if (fullNegativePrompt) {
        console.log('➖ ネガティブプロンプト適用済み');
      }
      
      const imageUrls = await generateMultipleStoryboardImages(
        scenes,
        promptArray,
        imageProvider,
        imageApiKey || '', // Pollinationsの場合は空文字列でOK
        (completed: number, total: number) => {
          setImageProgress({ completed, total });
        }
      );

      const imageMap = new Map<number, string>();
      scenes.forEach((scene, index) => {
        if (imageUrls[index]) {
          imageMap.set(scene.sceneNumber, imageUrls[index]);
        }
      });

      setGeneratedImages(imageMap);
      setIsGeneratingImages(false);

      console.log('✅ 画像生成完了:', imageMap.size, '枚');
      
      if (onImagesGenerated) {
        onImagesGenerated(imageMap);
      }

      alert(`${imageMap.size}個の絵コンテ画像を生成しました！`);
    } catch (err: any) {
      console.error('❌ 画像生成エラー:', err);
      setError(err.message || '絵コンテ画像の生成に失敗しました');
      setIsGeneratingImages(false);
    }
  };

  const copyPrompt = (prompt: string, sceneNumber: number) => {
    navigator.clipboard.writeText(prompt);
    alert(`シーン${sceneNumber}のプロンプトをコピーしました`);
  };

  const exportForComfyUI = () => {
    let cumulativeSeconds = 0;
    
    const exportData = Array.from(generatedPrompts.entries()).map(([sceneNumber, prompt]) => {
      const scene = scenes.find(s => s.sceneNumber === sceneNumber);
      
      const durationMatch = scene?.duration.match(/(\d+)/);
      const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 5;
      
      const startTime = cumulativeSeconds;
      const endTime = cumulativeSeconds + durationSeconds;
      
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
      };
      
      cumulativeSeconds = endTime;
      
      return {
        scene: sceneNumber,
        timestamp: `${formatTime(startTime)}-${formatTime(endTime)}`,
        duration_seconds: durationSeconds,
        prompt: prompt,
        negative_prompt: 'blurry, low quality, distorted, deformed, ugly, static, messy, amateur'
      };
    });

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storyboard_prompts_for_comfyui.json';
    a.click();
    URL.revokeObjectURL(url);

    alert(`✅ ${exportData.length}個のプロンプトをエクスポートしました！\n\n📂 ファイル名: storyboard_prompts_for_comfyui.json\n\n🎬 Google Colabで使用方法：\n1. ComfyUI_Video_Generation.ipynb を開く\n2. エクスポートしたJSONファイルをアップロード\n3. セル10.5で読み込んで実行`);
  };

  // スプレッドシート用に画像付き絵コンテをエクスポート
  const exportForSpreadsheet = () => {
    if (generatedPrompts.size === 0) {
      alert('まず絵コンテプロンプトを生成してください');
      return;
    }

    // TSV形式（タブ区切り）でエクスポート - Googleスプレッドシートに直接貼り付け可能
    const headers = [
      'シーン番号',
      '時間',
      'カット割り・映像内容',
      '絵コンテ画像URL',
      '日本語プロンプト',
      '音声・SE',
      'テロップ',
      'ナレーション',
      '演出メモ'
    ];

    const rows = scenes.map(scene => {
      const prompt = generatedPrompts.get(scene.sceneNumber) || '未生成';
      const imageUrl = generatedImages.get(scene.sceneNumber) || '画像未生成';
      
      return [
        scene.sceneNumber.toString(),
        scene.duration,
        scene.cutDescription,
        imageUrl,
        prompt,
        scene.audioSE,
        scene.telop,
        scene.narration,
        scene.directionMemo
      ];
    });

    // TSV形式に変換
    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    // クリップボードにコピー
    navigator.clipboard.writeText(tsvContent).then(() => {
      alert(`✅ ${scenes.length}個の絵コンテをクリップボードにコピーしました！\n\n📊 Googleスプレッドシートへの貼り付け方法：\n1. スプレッドシートを開く\n2. セルA1を選択\n3. Ctrl+V で貼り付け\n4. 画像URLを「=IMAGE(D2)」で表示\n\n💡 ヒント：\n- 列幅を調整して見やすくする\n- 画像セルは高さを広げる（例：200px）\n- 条件付き書式で見やすくカスタマイズ`);
    }).catch(() => {
      // フォールバック：ファイルとしてダウンロード
      const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'storyboard_with_images.tsv';
      a.click();
      URL.revokeObjectURL(url);
      
      alert('✅ TSVファイルとしてダウンロードしました！\nGoogleスプレッドシートで「ファイル → インポート」から開いてください');
    });
  };

  if (scenes.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-gray-700 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-muted mx-auto mb-2" />
        <p className="text-muted">字コンテを生成してから絵コンテを作成してください</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-gray-700 shadow-xl overflow-hidden animate-fade-in">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-700 bg-gray-900/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5 text-accent" />
          絵コンテプロンプト生成
        </h2>

        {/* API設定 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted mb-2 flex items-center gap-2">
              <Key className="w-4 h-4" />
              OpenRouter APIキー
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-4 py-2 pr-20 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted hover:text-primary px-2 py-1"
              >
                {showApiKey ? '🙈 隠す' : '👁️ 表示'}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">
              APIキーは{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenRouter
              </a>
              {' '}で取得してください（初回のみ入力、以降は自動保存）
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">使用モデル</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              aria-label="使用モデル"
            >
              {aiModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} - {m.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">
              💡 無料モデル推奨：コスト0円で高品質なプロンプト生成
            </p>
          </div>

          {/* キャラクター設定 */}
          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              👤 画像統一設定（全シーン共通・オプション）
            </h3>
            
            {/* スタイルプリセット */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted mb-2">
                🎨 ビジュアルスタイル（アニメ/実写の統一）
              </label>
              <select
                value={visualStyle}
                onChange={(e) => handleVisualStyleChange(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                aria-label="ビジュアルスタイル"
              >
                <option value="anime">アニメスタイル（2Dアニメーション）</option>
                <option value="realistic">実写・フォトリアル</option>
                <option value="illustration">イラスト・絵画風</option>
                <option value="3d">3D/CGIレンダリング</option>
              </select>
              <p className="text-xs text-muted mt-1">
                ⚠️ スタイルを選択すると、アニメと実写が混在しないように自動調整されます
              </p>
            </div>

            {/* キャラクター外見 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted mb-2">
                👤 登場人物の外見設定
              </label>
              <textarea
                value={characterDescription}
                onChange={(e) => handleCharacterDescriptionChange(e.target.value)}
                placeholder="例：20代後半の日本人男性、短い黒髪、茶色い瞳、カジュアルな服装（白Tシャツ、ジーンズ）"
                className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                rows={3}
              />
              <p className="text-xs text-muted mt-1">
                💡 複数キャラクター：「主人公：〇〇、ヒロイン：〇〇」のように区別
              </p>
            </div>

            {/* 環境設定 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  ⏰ 時間帯
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => handleTimeOfDayChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                  aria-label="時間帯"
                >
                  <option value="">指定なし</option>
                  <option value="early morning">早朝（日の出前）</option>
                  <option value="morning">朝（午前）</option>
                  <option value="noon">昼（正午）</option>
                  <option value="afternoon">午後</option>
                  <option value="evening">夕方（黄昏）</option>
                  <option value="dusk">夕暮れ</option>
                  <option value="night">夜</option>
                  <option value="midnight">深夜</option>
                  <option value="golden hour">ゴールデンアワー</option>
                  <option value="blue hour">ブルーアワー</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  🌤️ 天候
                </label>
                <select
                  value={weather}
                  onChange={(e) => handleWeatherChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                  aria-label="天候"
                >
                  <option value="">指定なし</option>
                  <option value="sunny">晴れ</option>
                  <option value="clear sky">快晴</option>
                  <option value="partly cloudy">曇り時々晴れ</option>
                  <option value="cloudy">曇り</option>
                  <option value="overcast">どんより曇り</option>
                  <option value="rainy">雨</option>
                  <option value="heavy rain">大雨</option>
                  <option value="drizzle">小雨・霧雨</option>
                  <option value="stormy">嵐</option>
                  <option value="snowy">雪</option>
                  <option value="foggy">霧</option>
                  <option value="misty">もや・霞</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  📍 場所・環境
                </label>
                <select
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary text-sm"
                  aria-label="場所・環境"
                >
                  <option value="">指定なし</option>
                  <option value="urban city">都市部</option>
                  <option value="downtown">繁華街</option>
                  <option value="residential area">住宅街</option>
                  <option value="countryside">田舎・田園</option>
                  <option value="beach">ビーチ・海岸</option>
                  <option value="mountains">山岳地帯</option>
                  <option value="forest">森林</option>
                  <option value="park">公園</option>
                  <option value="indoor room">室内・部屋</option>
                  <option value="office">オフィス</option>
                  <option value="school">学校</option>
                  <option value="cafe">カフェ</option>
                  <option value="street">路上・通り</option>
                  <option value="rooftop">屋上</option>
                </select>
              </div>
            </div>

            {/* ポジティブプロンプト */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted mb-2">
                ➕ ポジティブプロンプト（追加したい要素）
              </label>
              <textarea
                value={positivePrompt}
                onChange={(e) => handlePositivePromptChange(e.target.value)}
                placeholder="例：high quality, detailed, masterpiece, beautiful lighting, cinematic composition, professional photography"
                className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                rows={2}
              />
              <p className="text-xs text-muted mt-1">
                🎯 全シーンに追加される要素（品質、構図、ライティングなど）
              </p>
            </div>

            {/* ネガティブプロンプト */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted mb-2">
                ➖ ネガティブプロンプト（除外したい要素）
              </label>
              <textarea
                value={negativePrompt}
                onChange={(e) => handleNegativePromptChange(e.target.value)}
                placeholder="例：blurry, low quality, distorted, deformed, ugly, bad anatomy, extra limbs, watermark, text, signature"
                className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary resize-none"
                rows={2}
              />
              <p className="text-xs text-muted mt-1">
                🚫 全シーンから除外される要素（品質劣化、不要な要素など）
              </p>
            </div>
          </div>

          {/* 画像生成設定 */}
          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              絵コンテ画像生成（オプション）
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">画像生成サービス</label>
                <select
                  value={imageProvider}
                  onChange={(e) => handleImageProviderChange(e.target.value as ImageGenerationProvider)}
                  className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                  aria-label="画像生成サービス"
                >
                  <optgroup label="🆓 完全無料">
                    <option value="pollinations">Pollinations.ai (完全無料・APIキー不要) ⭐推奨</option>
                  </optgroup>
                  <optgroup label="💳 無料枠あり（APIキー必要）">
                    <option value="huggingface">Hugging Face (無料枠あり)</option>
                    <option value="segmind">Segmind (無料枠あり)</option>
                  </optgroup>
                  <optgroup label="💰 有料サービス">
                    <option value="stability">Stability AI (Stable Diffusion 3)</option>
                    <option value="replicate">Replicate (Flux Pro)</option>
                    <option value="dalle">OpenAI DALL-E 3</option>
                  </optgroup>
                </select>
                <p className="text-xs text-muted mt-1">
                  {imageProvider === 'pollinations' && '✅ APIキー不要・完全無料・即座に使用可能'}
                  {imageProvider === 'huggingface' && '🔑 Hugging Face APIキーが必要（無料枠: 月1000リクエスト）'}
                  {imageProvider === 'segmind' && '🔑 Segmind APIキーが必要（無料枠: 月100クレジット）'}
                  {imageProvider === 'stability' && '💰 Stability AI APIキーが必要（有料）'}
                  {imageProvider === 'replicate' && '💰 Replicate APIキーが必要（有料）'}
                  {imageProvider === 'dalle' && '💰 OpenAI APIキーが必要（有料）'}
                </p>
              </div>

              {imageProvider !== 'pollinations' && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">画像生成APIキー</label>
                  <div className="relative">
                    <input
                      type={showImageApiKey ? "text" : "password"}
                      value={imageApiKey}
                      onChange={(e) => handleImageApiKeyChange(e.target.value)}
                      placeholder={
                        imageProvider === 'huggingface' ? 'hf_...' :
                        imageProvider === 'segmind' ? 'SG-...' :
                        'sk-...'
                      }
                      className="w-full px-4 py-2 pr-20 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
                      autoComplete="new-password"
                      data-lpignore="true"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setShowImageApiKey(!showImageApiKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted hover:text-primary px-2 py-1"
                    >
                      {showImageApiKey ? '🙈 隠す' : '👁️ 表示'}
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {imageProvider === 'huggingface' && (
                      <>
                        <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Hugging Face Tokenを取得 →
                        </a>
                      </>
                    )}
                    {imageProvider === 'segmind' && (
                      <>
                        <a href="https://www.segmind.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Segmind APIキーを取得 →
                        </a>
                      </>
                    )}
                    {imageProvider === 'stability' && 'Stability AI APIキー'}
                    {imageProvider === 'replicate' && 'Replicate APIキー'}
                    {imageProvider === 'dalle' && 'OpenAI APIキー'}
                    （初回のみ入力、以降は自動保存）
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !apiKey}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  生成中... ({progress.completed}/{progress.total})
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  絵コンテプロンプト生成
                </>
              )}
            </button>

            <button
              onClick={handleGenerateImages}
              disabled={isGeneratingImages || generatedPrompts.size === 0 || (imageProvider !== 'pollinations' && !imageApiKey)}
              className="flex-1 bg-accent hover:bg-accent/80 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {isGeneratingImages ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  画像生成中... ({imageProgress.completed}/{imageProgress.total})
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  絵コンテ画像生成 {generatedPrompts.size === 0 && '(プロンプト生成後に有効化)'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* 生成結果 */}
      {generatedPrompts.size > 0 && (
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          <div className="flex items-center gap-2 text-green-400 mb-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">{generatedPrompts.size}個の絵コンテプロンプトを生成しました</span>
            <div className="ml-auto flex gap-2">
              <button
                onClick={exportForSpreadsheet}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm flex items-center gap-2"
              >
                📊 スプレッドシート形式でコピー
              </button>
              <button
                onClick={exportForComfyUI}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
              >
                💾 ComfyUI用JSONエクスポート
              </button>
            </div>
          </div>

          {Array.from(generatedPrompts.entries()).map(([sceneNumber, prompt]) => {
            const scene = scenes.find(s => s.sceneNumber === sceneNumber);
            const imageUrl = generatedImages.get(sceneNumber);

            return (
              <div key={sceneNumber} className="bg-background border border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-bold">シーン {sceneNumber}</h3>
                    <p className="text-sm text-muted">{scene?.timestamp} | {scene?.duration}</p>
                    <p className="text-sm text-muted mt-1">{scene?.cutDescription}</p>
                  </div>
                  <button
                    onClick={() => copyPrompt(prompt, sceneNumber)}
                    className="text-primary hover:text-primary-hover transition-colors text-sm"
                  >
                    📋 コピー
                  </button>
                </div>

                {imageUrl && (
                  <div className="mt-3">
                    <img
                      src={imageUrl}
                      alt={`Scene ${sceneNumber}`}
                      className="w-full rounded-lg border border-gray-600"
                    />
                  </div>
                )}

                <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 whitespace-pre-wrap">
                  {prompt}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
