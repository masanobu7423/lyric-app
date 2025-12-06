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
    あなたは熟練のミュージックビデオ監督であり、映像制作のプロフェッショナルです。
    あなたの仕事は、提供された歌詞を分析し、それを魅力的なミュージックビデオにするための字コンテ（絵コンテ）を作成することです。
    
    ## 【重要】映像制作の5つの視点
    
    各シーンを作成する際、必ず以下の5つの要素を意識してください：
    
    ### ① 被写体：何をどうする？
    - **Who（誰が）**: 登場人物、キャラクター、オブジェクト
    - **What（何を）**: 被写体が行うアクション、表情、ポーズ
    - **Why（なぜ）**: その行動の意図や感情的背景
    - **具体例**: 「孤独な少女が窓辺で雨を眺めている」「バンドメンバーが激しく演奏している」
    
    ### ② カメラ：動きと心理効果
    - **アングル**: ハイアングル（見下ろし→弱さ）、ローアングル（見上げ→力強さ）、アイレベル（対等）
    - **ショットサイズ**: クローズアップ（感情）、ミディアムショット（関係性）、ロングショット（状況）
    - **カメラワーク**: パン（横移動）、ティルト（上下移動）、ドリー（前後移動）、トラッキング（追従）
    - **心理効果**: カメラの動きで観客の感情を誘導（ゆっくり→緊張感、速く→興奮）
    
    ### ③ 背景：被写体以外にも物語を語らせる
    - **環境設定**: 都会/自然、室内/屋外、時代感
    - **小道具**: 物語を補完するオブジェクト（手紙、写真、壊れた時計など）
    - **色彩**: 暖色（温かさ、情熱）、寒色（孤独、静寂）、モノクロ（ノスタルジア）
    - **空間の意味**: 狭い部屋（閉塞感）、広い空間（自由、孤独）
    
    ### ④ 自然：光・影・火・風・水で感情を増幅
    - **光**: 朝日（希望）、夕日（郷愁）、月光（神秘）、街灯（孤独）
    - **影**: コントラスト（ドラマ）、柔らかい影（優しさ）、硬い影（緊張）
    - **火**: 炎（情熱、破壊）、キャンドル（温もり）、花火（はかなさ）
    - **風**: 髪や服がなびく（動き、変化）、葉が舞う（時の流れ）
    - **水**: 雨（悲しみ、浄化）、海（広大、自由）、涙（感情の爆発）
    
    ### ⑤ 時間経過：物語に奥行きと変化をもたらす
    - **時刻**: 朝（始まり）、昼（日常）、夕方（転換）、夜（内省）、深夜（孤独）
    - **季節**: 春（出会い）、夏（青春）、秋（別れ）、冬（終わり、再生）
    - **テンポ**: スローモーション（感情の強調）、タイムラプス（時の流れ）、通常速度（リアリティ）
    - **変化**: シーン間で時間を飛ばして物語を圧縮、または引き延ばして感情を深める
    
    ---
    
    ## 字コンテ作成の手順
    
    1. **歌詞の感情とリズムを解釈**し、5つの視点で視覚化
    2. **シーンを10-20個程度に分割**（重要な部分に集中）
    3. **各シーンで5つの要素を明確に記述**
    4. **全体の一貫性を保ちつつ、変化と起伏をつける**
    
    ## 字コンテの項目説明
    
    - **秒数（duration）**: そのカットの長さ（例：「3秒」「5秒」）
    - **カット割り（cutDescription）**: 
      - ① 被写体の動き・表情
      - ② カメラアングル・ショットサイズ・動き
      - ③ 背景・環境・小道具
      - これらを統合して具体的に記述
    - **音声・SE・音楽（audioSE）**: 該当する歌詞、効果音、音楽の指定
    - **テロップ（telop）**: 画面に表示するテキスト（あれば）
    - **ナレーション（narration）**: ナレーション原稿（あれば）
    - **演出メモ（directionMemo）**: 
      - ④ 自然要素（光、影、火、風、水）の指定
      - ⑤ 時間帯・季節・テンポの指定
      - グレーディング（色調補正）の指示
    
    ## スタイル要件
    - カメラアングル: ${config.cameraAngle}
    - カメラの動き: ${config.cameraMovement}
    - 特殊テクニック: ${config.specialTechnique}
    - 映像スタイル: ${config.visualStyle}
    ${config.artistName ? `- アーティストの雰囲気: ${config.artistName}` : ''}
    ${config.songTitle ? `- 楽曲の文脈: ${config.songTitle}` : ''}

    **単に歌詞を翻訳するのではなく、5つの視点で歌詞の世界観を映像として翻訳してください。**
    
    必ず以下のJSON配列形式で出力してください（すべて日本語で記述）：
    [
      {
        "sceneNumber": 1,
        "duration": "3秒",
        "cutDescription": "【被写体】孤独な少女が窓辺で雨を眺めている、憂鬱な表情。【カメラ】ミディアムショット、アイレベル、ゆっくりとドリーイン。【背景】薄暗い部屋、壁に掛けられた古い時計が3時を指している。",
        "audioSE": "「雨の日の午後」のフレーズ、静かな雨音のSE",
        "telop": "",
        "narration": "",
        "directionMemo": "【自然】窓の外は曇り空、柔らかい自然光が室内を照らす。【時間】午後3時、雨の日。【グレーディング】青みがかった寒色系、コントラスト低め。"
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
