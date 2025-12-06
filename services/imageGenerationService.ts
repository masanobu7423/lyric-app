import { PromptScene } from '../types';

const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

export type ImageGenerationProvider = 
  | 'pollinations'  // 完全無料・APIキー不要
  | 'huggingface'   // 無料枠あり
  | 'segmind'       // 無料枠あり
  | 'stability'     // 有料
  | 'replicate'     // 有料
  | 'dalle';        // 有料

interface ImageGenerationConfig {
  provider: ImageGenerationProvider;
  apiKey: string;
  prompt: string;
  scene: PromptScene;
  seed?: number;  // キャラクター一貫性用のシード値（オプション）
}

/**
 * Stability AI (Stable Diffusion 3) を使用して画像生成
 */
const generateWithStability = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('output_format', 'png');
  formData.append('aspect_ratio', '16:9'); // 映像用の16:9
  formData.append('model', 'sd3-large');

  const response = await fetch(STABILITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'image/*',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Stability AI Error: ${errorData.message || response.statusText}`);
  }

  // 画像データをBlobとして取得
  const imageBlob = await response.blob();
  
  // BlobをData URLに変換
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
};

/**
 * Replicate (Flux, SDXL等) を使用して画像生成
 */
const generateWithReplicate = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  const response = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'latest',
      input: {
        prompt: prompt,
        aspect_ratio: '16:9',
        output_format: 'png',
        output_quality: 90,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Replicate Error: ${errorData.detail || response.statusText}`);
  }

  const prediction = await response.json();
  
  // ポーリングで結果を待つ
  let result = prediction;
  while (result.status !== 'succeeded' && result.status !== 'failed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(`${REPLICATE_API_URL}/${result.id}`, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error(`Replicate generation failed: ${result.error}`);
  }

  return result.output[0]; // 画像URL
};

/**
 * Pollinations.ai を使用して画像生成（完全無料・APIキー不要）
 */
const generateWithPollinations = async (
  prompt: string,
  seed?: number
): Promise<string> => {
  // Pollinations.aiは直接画像URLを返す
  const encodedPrompt = encodeURIComponent(prompt);
  
  // seedを指定すると同じプロンプトで同じ画像が生成される（キャラクター一貫性向上）
  const seedParam = seed !== undefined ? `&seed=${seed}` : '';
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&enhance=true${seedParam}`;
  
  // 画像が生成されるまで待機
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Pollinations Error: ${response.statusText}`);
  }
  
  return imageUrl;
};

/**
 * Hugging Face Inference API を使用して画像生成（無料枠あり）
 */
const generateWithHuggingFace = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  // Stable Diffusion XLモデルを使用
  const modelId = 'stabilityai/stable-diffusion-xl-base-1.0';
  const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: 1024,
        height: 576, // 16:9比率
        num_inference_steps: 30,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face Error: ${errorText}`);
  }

  const imageBlob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
};

/**
 * Segmind を使用して画像生成（無料枠あり）
 */
const generateWithSegmind = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  const apiUrl = 'https://api.segmind.com/v1/sdxl1.0-txt2img';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      negative_prompt: 'blurry, low quality, distorted',
      samples: 1,
      scheduler: 'DPM++ 2M Karras',
      num_inference_steps: 30,
      guidance_scale: 7.5,
      seed: Math.floor(Math.random() * 1000000),
      img_width: 1024,
      img_height: 576, // 16:9比率
      base64: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Segmind Error: ${errorData.message || response.statusText}`);
  }

  const imageBlob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
};

/**
 * OpenAI DALL-E 3 を使用して画像生成
 */
const generateWithDALLE = async (
  prompt: string,
  apiKey: string
): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1792x1024', // 16:9に近いサイズ
      quality: 'standard',
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`DALL-E Error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].url;
};

/**
 * 絵コンテ画像を生成
 */
export const generateStoryboardImage = async (
  config: ImageGenerationConfig
): Promise<string> => {
  const { provider, apiKey, prompt, seed } = config;

  // プロンプト検証
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('プロンプトが無効です');
  }

  // Pollinations以外はAPIキーが必要
  if (provider !== 'pollinations' && !apiKey) {
    throw new Error('画像生成APIキーが設定されていません');
  }

  console.log(`🎨 画像生成開始 (${provider})...`);
  console.log('📝 プロンプト:', prompt.substring(0, Math.min(100, prompt.length)) + (prompt.length > 100 ? '...' : ''));
  if (seed !== undefined) {
    console.log('🎲 シード値:', seed);
  }

  try {
    let imageUrl: string;

    switch (provider) {
      case 'pollinations':
        imageUrl = await generateWithPollinations(prompt, seed);
        break;
      case 'huggingface':
        imageUrl = await generateWithHuggingFace(prompt, apiKey);
        break;
      case 'segmind':
        imageUrl = await generateWithSegmind(prompt, apiKey);
        break;
      case 'stability':
        imageUrl = await generateWithStability(prompt, apiKey);
        break;
      case 'replicate':
        imageUrl = await generateWithReplicate(prompt, apiKey);
        break;
      case 'dalle':
        imageUrl = await generateWithDALLE(prompt, apiKey);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    console.log('✅ 画像生成成功');
    return imageUrl;
  } catch (error: any) {
    console.error('❌ 画像生成エラー:', error);
    throw error;
  }
};

/**
 * 複数シーンの絵コンテ画像を一括生成
 */
export const generateMultipleStoryboardImages = async (
  scenes: PromptScene[],
  prompts: string[],
  provider: ImageGenerationProvider,
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  console.log('📊 一括画像生成開始');
  console.log('   シーン数:', scenes.length);
  console.log('   プロンプト数:', prompts.length);
  console.log('   プロバイダー:', provider);
  
  const images: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    if (onProgress) {
      onProgress(i + 1, scenes.length);
    }

    try {
      const currentPrompt = prompts[i];
      
      if (!currentPrompt) {
        console.warn(`⚠️ シーン ${i + 1} のプロンプトが見つかりません`);
        images.push('');
        continue;
      }
      
      console.log(`🎨 シーン ${i + 1}/${scenes.length} 生成中...`);
      
      const imageUrl = await generateStoryboardImage({
        provider,
        apiKey,
        prompt: currentPrompt,
        scene: scenes[i],
      });
      images.push(imageUrl);
      
      console.log(`✅ シーン ${i + 1} 完了`);

      // レート制限対策: 各リクエスト間に1秒待機
      if (i < scenes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ シーン ${i + 1} の画像生成に失敗:`, error);
      images.push(''); // エラーの場合は空文字
    }
  }

  return images;
};
