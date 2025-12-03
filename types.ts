export interface PromptScene {
  sceneNumber: number;
  timeframe: string;
  lyricsSegment: string;
  visualDescription: string;
  cameraMovement: string;
  moodLighting: string;
  aiPrompt: string;
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
