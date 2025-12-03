import { GoogleGenerativeAI } from "@google/generative-ai";
import { PromptScene, GenerationConfig } from "../types";

const parseGeminiResponse = (responseText: string): PromptScene[] => {
  try {
    // Attempt to parse JSON directly
    return JSON.parse(responseText);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    console.log("🔧 JSON修復を試行中...");
    
    // 途中で切れたJSONを修復
    let fixedJson = responseText.trim();
    
    // Case 1: 配列が閉じていない場合
    if (!fixedJson.endsWith(']')) {
      console.log("⚠️ JSON配列が閉じていません。修復中...");
      
      // 最後の完全なオブジェクトを見つける
      const lastCompleteObject = fixedJson.lastIndexOf('}');
      if (lastCompleteObject !== -1) {
        // 最後の完全なオブジェクトまでを抽出
        fixedJson = fixedJson.substring(0, lastCompleteObject + 1);
        
        // 配列の閉じ括弧を追加
        if (!fixedJson.endsWith(']')) {
          fixedJson = fixedJson + '\n]';
        }
      }
    }
    
    // Case 2: JSON配列を抽出
    const jsonMatch = fixedJson.match(/\[.*\]/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("✅ JSON修復成功！", parsed.length, "シーンを抽出しました");
        return parsed;
      } catch (e2) {
        console.error("修復後もパースに失敗:", e2);
      }
    }
    
    console.error("❌ JSON修復に失敗しました");
    return [];
  }
};

export const generatePromptsFromLyrics = async (config: GenerationConfig): Promise<PromptScene[]> => {
  // フォーム入力のみを使用（環境変数は使用しない）
  const apiKey = config.apiKey?.trim();
  
  if (!apiKey) {
    throw new Error("APIキーが設定されていません。\n\nフォームの「Gemini API Key」欄にAPIキーを入力してください。\n\nAPIキー取得先: https://aistudio.google.com/app/apikey");
  }
  
  // APIキーの形式を確認
  if (!apiKey.startsWith('AIzaSy')) {
    throw new Error("❌ APIキーの形式が正しくありません。\n\nGemini APIキーは 'AIzaSy' で始まる必要があります。\n\n正しいAPIキーを https://aistudio.google.com/app/apikey で取得してください。");
  }
  
  console.log('🔑 APIキー確認:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // gemini-2.5-flashを使用（2025年最新版、無料枠対応）
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
  });
  
  console.log('📦 使用モデル: gemini-2.5-flash (最新版、無料枠対応)');

  // Schema definition for structured output
  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 65536,  // 8192から大幅に増やして長い歌詞にも対応
    responseMimeType: "application/json",
  };

  const systemInstruction = `
    あなたは熟練のミュージックビデオ監督であり、AIプロンプトエンジニアです。
    あなたの仕事は、提供された歌詞を分析し、それを魅力的なミュージックビデオにするための絵コンテを作成することです。
    
    以下の手順で各歌詞パートを処理してください：
    1. 歌詞の感情やリズムを解釈し、対応する視覚的なシーンを想像してください。
    2. シーンを細かく区切り、各カットの詳細な視覚的描写を作成してください。
    3. 全体を通してキャラクターやスタイルの一貫性を維持してください。
    4. **シーン数は10-20個程度に抑えてください**（重要な部分に集中）。
    
    重要：出力言語のルール
    - **Visual Description, Camera Movement, Mood Lighting**: 日本語で出力してください（ユーザーが内容を理解するため）。
    - **AI Prompt**: 必ず**英語**で出力してください（AI動画生成ツールの精度を高めるため）。具体的で技術的なキーワード（例：4k, cinematic lighting, hyper-realistic, slow motion）を含めてください。
    
    スタイル要件: ${config.visualStyle}
    ${config.artistName ? `アーティストの雰囲気: ${config.artistName}` : ''}
    ${config.songTitle ? `楽曲の文脈: ${config.songTitle}` : ''}

    単に歌詞を翻訳するのではなく、その歌詞が持つ世界観を映像として翻訳してください。
    
    必ず以下のJSON配列形式で出力してください：
    [
      {
        "sceneNumber": 1,
        "timeframe": "00:00-00:05",
        "lyricsSegment": "歌詞の一部",
        "visualDescription": "日本語での視覚描写",
        "cameraMovement": "日本語でのカメラワーク",
        "moodLighting": "日本語での照明・雰囲気",
        "aiPrompt": "Detailed English prompt for AI video generation"
      }
    ]
  `;

  const userPrompt = `
    ${systemInstruction}
    
    以下の歌詞を分析し、シーンごとに分割してJSON形式で出力してください：
    
    ${config.lyrics}
  `;

  try {
    console.log('🚀 API呼び出し開始...');
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig,
    });

    console.log('✅ API呼び出し成功');
    
    const response = result.response;
    const text = response.text();
    
    if (text) {
      console.log('📝 レスポンス受信:', text.substring(0, 100) + '...');
      return parseGeminiResponse(text);
    }
    throw new Error("No response generated");

  } catch (error: any) {
    console.error("❌ Gemini API Error:", error);
    console.error("エラー詳細:", JSON.stringify(error, null, 2));
    
    // より詳細なエラーメッセージを提供
    if (error?.message?.includes('API key expired') || error?.message?.includes('API_KEY_INVALID')) {
      throw new Error(
        "🔑 APIキーが期限切れまたは無効です。\n\n" +
        "新しいAPIキーを取得してください：\n" +
        "1. https://aistudio.google.com/app/apikey を開く\n" +
        "2. 「Create API Key」→「Create API key in new project」をクリック\n" +
        "3. 生成されたAPIキーをコピー\n" +
        "4. フォームの「Gemini API Key」欄に貼り付け\n" +
        "5. 再度「プロンプトを生成する」をクリック"
      );
    }
    
    if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('not found')) {
      throw new Error(
        "❌ モデルが見つかりません (404エラー)\n\n" +
        "**原因：**\n" +
        "使用しようとしたモデルが存在しないか、廃止されています。\n\n" +
        "**2025年12月時点で利用可能なモデル：**\n" +
        "• gemini-2.5-flash ✅（現在使用中・最新版）\n" +
        "• gemini-2.0-flash ✅（安定版）\n" +
        "• gemini-2.5-pro ✅（より高性能）\n\n" +
        "**廃止されたモデル：**\n" +
        "• gemini-1.5-flash ❌（2025年に廃止）\n" +
        "• gemini-1.5-pro ❌（2025年に廃止）\n" +
        "• gemini-pro ❌（旧バージョン）\n\n" +
        "**解決方法：**\n" +
        "1. ブラウザをリロードして再試行\n" +
        "2. 新しいAPIキーを取得して入力\n" +
        "3. 問題が続く場合は PRICING_GUIDE.md を参照"
      );
    }
    
    if (error?.error?.code === 429) {
      throw new Error(
        "APIのクォータ（使用制限）を超えました。\n\n" +
        "解決方法：\n" +
        "1. 数秒待ってから再試行してください\n" +
        "2. 新しいAPIキーを取得してください: https://aistudio.google.com/apikey\n" +
        "3. Google AI Studioで使用状況を確認してください: https://aistudio.google.com/\n\n" +
        "無料版のGemini APIには1分あたりのリクエスト制限があります。"
      );
    }
    
    if (error?.error?.code === 400) {
      throw new Error(
        "APIキーが無効です。\n" +
        "正しいAPIキーを https://aistudio.google.com/apikey で取得してください。"
      );
    }
    
    if (error?.message) {
      throw new Error(error.message);
    }
    
    throw new Error("プロンプトの生成中にエラーが発生しました。APIキーを確認してください。");
  }
};
