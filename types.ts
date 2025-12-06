export interface PromptScene {
  sceneNumber: number;
  duration: string; // 秒数
  timestamp?: string; // タイムスタンプ（例: "0:00-0:05"）
  cutDescription: string; // カット割り（映像内容）
  audioSE: string; // 音声・SE・音楽
  telop: string; // テロップ
  narration: string; // ナレーション
  directionMemo: string; // 演出メモ（グレーディング・アングル）
  storyboardImage?: string; // 生成された絵コンテ画像URL
}

export interface SavedProject {
  id: string;
  title: string;
  artistName?: string;
  songTitle?: string;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  specialTechnique: SpecialTechnique;
  visualStyle: VisualStyle;
  scenes: PromptScene[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardGenerationConfig {
  scene: PromptScene;
  apiKey: string;
  model?: string;
}

// カメラアングル
export enum CameraAngle {
  HIGH_ANGLE = "High angle shot (俯瞰ショット)",
  LOW_ANGLE = "Low angle shot (ローアングル)",
  EYE_LEVEL = "Eye level shot (アイレベル)",
  DUTCH_ANGLE = "Dutch angle (アオリ)",
  AERIAL_VIEW = "Aerial view (空撮)",
  BIRDS_EYE = "Bird's eye view (真俯瞰)",
  WORMS_EYE = "Worm's eye view (虫の目視点)",
  OVER_SHOULDER = "Over the shoulder (肩越し)",
  POV_SHOT = "POV shot (主観視点)",
  EXTREME_CLOSEUP = "Extreme close-up (超クローズアップ)",
}

// カメラの動き
export enum CameraMovement {
  NONE = "Static shot (静止)",
  PAN_SHOT = "Pan shot (パン・左右振り)",
  TILT_SHOT = "Tilt shot (ティルト・上下振り)",
  DOLLY_SHOT = "Dolly shot (ドリー・前後移動)",
  TRACKING_SHOT = "Tracking shot (トラッキング・追従)",
  ZOOM_INOUT = "Zoom in/out (ズームイン・アウト)",
  CRANE_SHOT = "Crane shot (クレーン・高低移動)",
  STEADICAM = "Steadicam shot (ステディカム・滑らか移動)",
  GIMBAL_SHOT = "Gimbal shot (ジンバル・安定追従)",
  HANDHELD = "Handheld shot (手持ち・臨場感)",
  DRONE_SHOT = "Drone shot (ドローン撮影)",
}

// 特殊テクニック
export enum SpecialTechnique {
  NONE = "Normal (通常)",
  TIMELAPSE = "Time-lapse (タイムラプス)",
  SLOW_MOTION = "Slow motion (スローモーション)",
  WHIP_PAN = "Whip pan (ホイップパン・高速振り)",
  RACK_FOCUS = "Rack focus (ラックフォーカス・ピント移動)",
  SPLIT_SCREEN = "Split screen (スプリットスクリーン)",
  PANORAMA_360 = "360-degree shot (パノラマ回転)",
  ORBITAL_SHOT = "Orbital shot (オービタル・円周)",
  VERTIGO_EFFECT = "Vertigo effect (バーティゴ)",
  FISHEYE_LENS = "Fish-eye lens (魚眼レンズ)",
  TELEPHOTO = "Telephoto shot (望遠圧縮)",
}

// 映像スタイル  
export enum VisualStyle {
  CINEMATIC = "Cinematic (映画的)",
  DOCUMENTARY = "Documentary style (ドキュメンタリー風)",
  MUSIC_VIDEO = "Music video style (ミュージックビデオ風)",
  ANIME_STYLE = "Anime style (アニメ風)",
  PIXAR_STYLE = "Pixar style (ピクサー風3D)",
  GHIBLI_STYLE = "Studio Ghibli style (ジブリ風)",
  FILM_NOIR = "Film noir (フィルムノワール)",
  CYBERPUNK = "Cyberpunk (サイバーパンク)",
  STEAMPUNK = "Steampunk (スチームパンク)",
  FANTASY = "Fantasy (ファンタジー)",
}

export interface GenerationConfig {
  lyrics: string;
  artistName?: string;
  songTitle?: string;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  specialTechnique: SpecialTechnique;
  visualStyle: VisualStyle;
  apiKey?: string; // Gemini API Key (optional, can use env var)
}
