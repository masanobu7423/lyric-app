export interface PromptScene {
  sceneNumber: number;
  duration: string; // 秒数
  cutDescription: string; // カット割り（映像内容）
  audioSE: string; // 音声・SE・音楽
  telop: string; // テロップ
  narration: string; // ナレーション
  directionMemo: string; // 演出メモ（グレーディング・アングル）
}

export enum VisualStyle {
  CINEMATIC = "Cinematic (Realistic 4K)",
  ANIME = "Anime Style (Makoto Shinkai vibe)",
  CYBERPUNK = "Cyberpunk / Sci-Fi",
  SURREAL = "Surreal / Dreamy",
  VINTAGE = "Vintage 90s VHS",
  MINIMALIST = "Minimalist / Abstract",
  PIXEL_ART = "Pixel Art",
}

export interface GenerationConfig {
  lyrics: string;
  artistName?: string;
  songTitle?: string;
  visualStyle: VisualStyle;
  apiKey?: string; // Gemini API Key (optional, can use env var)
}
