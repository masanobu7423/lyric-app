/**
 * Video Prompt Generation Service
 * 動画生成用の英語プロンプトを直接生成するサービス
 */

import { PromptScene } from '../types';

interface VideoPromptRequest {
  lyrics: string;
  style: string;
  model: string;
  existingScenes?: PromptScene[];  // 字コンテデータ（オプション）
}

interface VideoScene {
  scene: number;
  timestamp: string;
  duration_seconds: number;
  prompt: string;
  negative_prompt: string;
}

/**
 * 歌詞から動画生成用の英語プロンプトを直接生成
 */
export async function generateVideoPrompts(
  apiKey: string,
  request: VideoPromptRequest
): Promise<VideoScene[]> {
  
  // 字コンテがある場合は、それを基に生成
  const sceneCount = request.existingScenes?.length || 0;
  const hasExistingScenes = sceneCount > 0;
  
  const systemPrompt = `You are a professional storyboard artist and cinematographer specializing in music video production. Your task is to create detailed, technical English prompts for AI video generation (WAN Text-to-Video model).

CRITICAL REQUIREMENTS:
1. Generate prompts in ENGLISH ONLY (no Japanese)
2. Each prompt must be 150-300 words with technical cinematography details
3. Include: camera angles, movements, lighting, color grading, composition, mood
4. Output format: JSON array with scene, timestamp, duration_seconds, prompt, negative_prompt
5. ${hasExistingScenes ? `🚨 ABSOLUTE REQUIREMENT: Generate EXACTLY ${sceneCount} scenes - one for each provided scene description. COUNT your output before finishing. If you generate fewer than ${sceneCount} scenes, you FAILED.` : '🚨 ABSOLUTE REQUIREMENT: Generate ALL scenes based on lyrics length (every 2-4 lines = 1 scene). Do NOT truncate or stop early.'}

${hasExistingScenes ? `SCENE COUNT VERIFICATION:
- Input: ${sceneCount} storyboard scenes
- Output: MUST be ${sceneCount} JSON objects
- Before submitting, verify: scenes.length === ${sceneCount}
- If incomplete, continue generating remaining scenes` : ''}

PROMPT STRUCTURE (for each scene):
- Camera: angle (eye-level/low/high), movement (static/pan/dolly), lens (wide/medium/close-up)
- Subject: character description, action, expression
- Background: environment, depth of field
- Lighting: type (natural/artificial), direction, color temperature
- Color Grading: color palette, contrast, film look
- Mood: atmosphere, emotion
- Technical: 832x480, 24fps, cinematic

NEGATIVE PROMPT (standard):
"blurry, low quality, distorted, deformed, ugly, static, messy, amateur"

EXAMPLE OUTPUT:
{
  "scene": 1,
  "timestamp": "0:00-0:04",
  "duration_seconds": 4,
  "prompt": "Cinematic medium shot at eye level, young man (late 20s, casual outfit) standing on urban street at golden hour. Background shows blurred city buildings with warm sunset glow. Soft natural lighting from left creates gentle shadows. Color palette: warm oranges and deep blues, high contrast. Mood: contemplative and hopeful. Camera static, shallow depth of field (f/2.8), 832x480, 24fps, cinematic bokeh.",
  "negative_prompt": "blurry, low quality, distorted, deformed, ugly, static, messy, amateur"
}`;

  let userPrompt = '';
  
  if (hasExistingScenes && request.existingScenes) {
    // 字コンテベースの生成
    const sceneDescriptions = request.existingScenes.map((scene, index) => 
      `Scene ${index + 1} (${scene.duration}): ${scene.cutDescription}`
    ).join('\n\n');
    
    userPrompt = `Generate ${sceneCount} technical English video prompts based on these storyboard scenes.

STORYBOARD SCENES:
${sceneDescriptions}

VISUAL STYLE: ${request.style}

INSTRUCTIONS:
1. Generate EXACTLY ${sceneCount} scenes - one for each scene above
2. Each scene duration: extract from the storyboard duration
3. For EACH scene, create a 150-300 word technical English prompt with:
   - Camera setup (angle, movement, lens)
   - Subject details based on the scene description
   - Background and environment
   - Lighting (type, direction, temperature)
   - Color grading (palette, contrast)
   - Mood and atmosphere
4. Use standard negative_prompt for all scenes
5. Return ONLY valid JSON array - NO markdown code blocks, NO extra text

CRITICAL: Generate ALL ${sceneCount} scenes. Do not skip any scenes.

OUTPUT FORMAT:
[
  { "scene": 1, "timestamp": "0:00-0:04", "duration_seconds": 4, "prompt": "150-300 word English prompt...", "negative_prompt": "..." },
  { "scene": 2, "timestamp": "0:04-0:08", "duration_seconds": 4, "prompt": "150-300 word English prompt...", "negative_prompt": "..." },
  ...
  { "scene": ${sceneCount}, "timestamp": "...", "duration_seconds": 4, "prompt": "150-300 word English prompt...", "negative_prompt": "..." }
]`;
  } else {
    // 歌詞ベースの生成（従来通り）
    userPrompt = `Generate a music video storyboard with technical English prompts for AI video generation.

LYRICS:
${request.lyrics}

VISUAL STYLE: ${request.style}

INSTRUCTIONS:
1. Count lyric lines and create 1 scene per 2-4 lines (e.g., 16 lines = 4-8 scenes, 32 lines = 8-16 scenes)
2. Each scene duration: 3-5 seconds
3. For EACH scene, create a 150-300 word technical English prompt with:
   - Camera setup (angle, movement, lens)
   - Subject details (appearance, action)
   - Background (environment, depth)
   - Lighting (type, direction, temperature)
   - Color grading (palette, contrast)
   - Mood and atmosphere
4. Use standard negative_prompt for all scenes
5. Return ONLY valid JSON array - NO markdown code blocks, NO extra text

CRITICAL: Generate ALL scenes needed for the full lyrics. Do not truncate.

OUTPUT FORMAT (example for 2 scenes):
[
  {
    "scene": 1,
    "timestamp": "0:00-0:04",
    "duration_seconds": 4,
    "prompt": "150-300 word English prompt with camera, subject, background, lighting, color, mood...",
    "negative_prompt": "blurry, low quality, distorted, deformed, ugly, static, messy, amateur"
  },
  {
    "scene": 2,
    "timestamp": "0:04-0:08",
    "duration_seconds": 4,
    "prompt": "150-300 word English prompt with camera, subject, background, lighting, color, mood...",
    "negative_prompt": "blurry, low quality, distorted, deformed, ugly, static, messy, amateur"
  }
]`;
  }

  // リトライ機能付きAPIコール
  let lastError: Error | null = null;
  const maxRetries = 3;  // 増加: 502エラー対策
  const retryDelay = 5000; // 増加: 5秒（サーバー回復待ち）

  console.log(`🎬 動画プロンプト生成開始`);
  console.log(`📊 シーン数: ${hasExistingScenes ? sceneCount : '歌詞から自動計算'}`);
  console.log(`🤖 モデル: ${request.model}`);
  console.log(`📝 max_tokens: 50000 (長文応答サポート)`);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 リトライ ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      console.log(`🚀 OpenRouter API呼び出し中... (試行 ${attempt + 1})`);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LyricToPrompt AI Studio'
        },
        body: JSON.stringify({
          model: request.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 50000  // 増加: より長い応答をサポート
        })
      });

      console.log(`📡 API応答: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        
        console.error(`❌ APIエラー: ${errorMessage}`);
        
        // 502, 503, 504エラー（サーバーエラー）もリトライ対象
        if ([429, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
          const errorType = response.status === 429 ? 'レート制限' : 'サーバー';
          lastError = new Error(`${errorType}エラー (${response.status}): ${errorMessage}`);
          console.warn(`⏳ ${errorType}エラーが発生しました。${retryDelay/1000}秒後にリトライします...`);
          continue;
        }
        
        // その他のエラー
        let friendlyMessage = errorMessage;
        if (response.status === 429) {
          friendlyMessage = `⏳ レート制限エラー: リクエストが多すぎます。\n\n💡 対処法：\n- 数分待ってから再試行\n- 別の無料モデルを選択\n- 有料モデルを使用（レート制限が緩い）`;
        } else if (errorMessage.includes('Provider returned error') || errorMessage.includes('No endpoints found')) {
          friendlyMessage = `🚫 モデルエラー: ${request.model}が利用できません。\n\n💡 対処法：\n- 別の無料モデルを選択してください\n- 推奨モデル:\n  1️⃣ DeepSeek R1T Chimera (tngtech/deepseek-r1t-chimera:free)\n  2️⃣ Amazon Nova 2 Lite (amazon/nova-2-lite:free)\n  3️⃣ OpenAI GPT-OSS 20B (openai/gpt-oss-20b:free)`;
        } else if (response.status === 404) {
          friendlyMessage = `❌ 404エラー: モデルが見つかりません。\n\nモデルID: ${request.model}\n\n💡 OpenRouterで利用可能なモデルを確認:\nhttps://openrouter.ai/models?q=free\n\n推奨: DeepSeek R1T Chimera (tngtech/deepseek-r1t-chimera:free)`;
        }
        
        throw new Error(`OpenRouter API error: ${friendlyMessage}\n\nModel: ${request.model}\n\n利用可能なモデル: https://openrouter.ai/models`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      console.log(`📦 レスポンス受信 (長さ: ${content.length} 文字)`);
      console.log(`📝 レスポンスプレビュー: ${content.substring(0, 200)}...`);

      // JSONを抽出（マークダウンコードブロックを削除）
      let jsonContent = content.trim();
      
      // マークダウンコードブロックの除去
      jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // 前後の余分なテキストを削除（JSONの開始と終了を検出）
      const jsonStart = jsonContent.indexOf('[');
      const jsonEnd = jsonContent.lastIndexOf(']');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }

      console.log(`🔍 JSON抽出完了 (長さ: ${jsonContent.length} 文字)`);

      const scenes: VideoScene[] = JSON.parse(jsonContent);

      // バリデーション
      if (!Array.isArray(scenes) || scenes.length === 0) {
        throw new Error('Invalid scene data returned');
      }

      console.log(`✅ Generated ${scenes.length} scenes successfully`);
      
      if (hasExistingScenes && scenes.length !== sceneCount) {
        console.warn(`⚠️ シーン数不一致: 期待=${sceneCount}, 実際=${scenes.length}`);
        console.warn(`💡 ヒント: より強力なモデル（nova-2-lite, gpt-oss-20b）を試すか、シーン数を減らしてください`);
        
        // 不足シーン数が少ない場合は許容（80%以上）
        const completionRate = scenes.length / sceneCount;
        if (completionRate < 0.8) {
          throw new Error(`生成シーン数が不足しています (${scenes.length}/${sceneCount}シーン = ${Math.round(completionRate * 100)}%)。別のAIモデルをお試しください。`);
        } else {
          console.warn(`⚠️ ${Math.round(completionRate * 100)}%完了 - 処理を続行しますが、完全ではありません`);
        }
      }

      // 各シーンの必須フィールドをチェック
      scenes.forEach((scene, index) => {
        if (!scene.scene || !scene.timestamp || !scene.prompt) {
          throw new Error(`Scene ${index + 1} is missing required fields`);
        }
        
        // デフォルト値を設定
        if (!scene.duration_seconds) {
          scene.duration_seconds = 4;
        }
        if (!scene.negative_prompt) {
          scene.negative_prompt = 'blurry, low quality, distorted, deformed, ugly, static, messy, amateur';
        }
      });

      return scenes;

    } catch (error: any) {
      console.error(`❌ エラー発生 (試行 ${attempt + 1}):`, error.message);
      
      // リトライ可能なエラーの場合は次の試行へ
      if (attempt < maxRetries && (error.message.includes('429') || error.message.includes('timeout'))) {
        lastError = error;
        console.log(`⏳ ${retryDelay/1000}秒後にリトライします...`);
        continue;
      }
      
      // リトライ不可能なエラーまたは最終試行
      console.error('❌ Video prompt generation error:', error);
      throw error;
    }
  }

  // すべてのリトライが失敗した場合
  console.error('❌ All retry attempts failed:', lastError);
  throw lastError || new Error('動画プロンプトの生成に失敗しました');
}

/**
 * タイムスタンプを計算
 */
export function calculateTimestamps(scenes: VideoScene[]): VideoScene[] {
  let currentTime = 0;
  
  return scenes.map(scene => {
    const duration = scene.duration_seconds || 5;
    const startMinutes = Math.floor(currentTime / 60);
    const startSeconds = currentTime % 60;
    const endTime = currentTime + duration;
    const endMinutes = Math.floor(endTime / 60);
    const endSeconds = endTime % 60;
    
    const timestamp = `${startMinutes}:${String(startSeconds).padStart(2, '0')}-${endMinutes}:${String(endSeconds).padStart(2, '0')}`;
    
    currentTime = endTime;
    
    return {
      ...scene,
      timestamp
    };
  });
}
