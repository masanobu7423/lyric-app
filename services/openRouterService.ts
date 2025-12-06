import { PromptScene } from '../types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * OpenRouter APIを使用して絵コンテ用の画像プロンプトを生成
 * 注: OpenRouterは主にテキスト生成用です。画像生成には別のサービス（DALL-E、Stable Diffusion等）の統合が必要です。
 * ここでは、シーン情報から詳細な画像生成プロンプトを作成します。
 */
export const generateStoryboardPrompt = async (
  scene: PromptScene,
  apiKey: string,
  model: string = 'tngtech/deepseek-r1t-chimera:free'
): Promise<string> => {
  if (!apiKey) {
    throw new Error('OpenRouter APIキーが設定されていません');
  }

  const systemPrompt = `あなたは絵コンテ制作のプロフェッショナルです。
提供されたシーン情報から、詳細な絵コンテの画像を生成するための英語プロンプトを作成してください。

プロンプトには以下を含めてください：
- カメラアングルとフレーミング
- 被写体の配置と動き
- 照明とムード
- 色調とグレーディング
- 具体的なビジュアル要素

出力は英語のみで、簡潔かつ具体的に記述してください。`;

  const userPrompt = `以下のシーン情報から、絵コンテ用の詳細な画像生成プロンプトを作成してください：

シーン番号: ${scene.sceneNumber}
秒数: ${scene.duration}
カット割り（映像内容）: ${scene.cutDescription}
音声・SE・音楽: ${scene.audioSE}
テロップ: ${scene.telop || 'なし'}
ナレーション: ${scene.narration || 'なし'}
演出メモ: ${scene.directionMemo}

絵コンテ画像生成用の英語プロンプトを生成してください（技術的な詳細を含む）：`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'LyricToPrompt AI Studio',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`OpenRouter API Error (HTTP ${response.status}): ${errorMessage}\n\nModel: ${model}\n\n利用可能なモデルを確認: https://openrouter.ai/models`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('OpenRouter API Error:', error);
    throw new Error(`絵コンテプロンプト生成エラー: ${error.message}`);
  }
};

/**
 * 複数のシーンをバッチ処理
 */
export const generateMultipleStoryboardPrompts = async (
  scenes: PromptScene[],
  apiKey: string,
  model?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<number, string>> => {
  const results = new Map<number, string>();
  
  for (let i = 0; i < scenes.length; i++) {
    try {
      const prompt = await generateStoryboardPrompt(scenes[i], apiKey, model);
      results.set(scenes[i].sceneNumber, prompt);
      
      if (onProgress) {
        onProgress(i + 1, scenes.length);
      }
      
      // レート制限対策として少し待機
      if (i < scenes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Scene ${scenes[i].sceneNumber} failed:`, error);
      results.set(scenes[i].sceneNumber, '');
    }
  }
  
  return results;
};
