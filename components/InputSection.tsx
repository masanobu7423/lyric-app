import React, { useState } from 'react';
import { CameraAngle, CameraMovement, SpecialTechnique, VisualStyle, GenerationConfig } from '../types';
import { Sparkles, Loader2, Music, User, Key } from 'lucide-react';

interface InputSectionProps {
  onGenerate: (config: GenerationConfig) => void;
  isLoading: boolean;
}

const CAMERA_ANGLE_LABELS: Record<CameraAngle, string> = {
  [CameraAngle.HIGH_ANGLE]: "俯瞰ショット（被写体を上から見下ろす）",
  [CameraAngle.LOW_ANGLE]: "ローアングル（下から見上げる迫力）",
  [CameraAngle.EYE_LEVEL]: "アイレベル（視線の高さ）",
  [CameraAngle.DUTCH_ANGLE]: "アオリ（斜めに傾けた緊張感）",
  [CameraAngle.AERIAL_VIEW]: "空撮（ドローンのような上空視点）",
  [CameraAngle.BIRDS_EYE]: "真俯瞰（真上からの撮影）",
  [CameraAngle.WORMS_EYE]: "虫の目視点（地面すれすれから）",
  [CameraAngle.OVER_SHOULDER]: "肩越し（人物の肩越しに撮影）",
  [CameraAngle.POV_SHOT]: "主観視点（登場人物の視点）",
  [CameraAngle.EXTREME_CLOSEUP]: "超クローズアップ（極端に拡大）",
};

const CAMERA_MOVEMENT_LABELS: Record<CameraMovement, string> = {
  [CameraMovement.NONE]: "静止（カメラ固定）",
  [CameraMovement.PAN_SHOT]: "パン（カメラを左右に振る）",
  [CameraMovement.TILT_SHOT]: "ティルト（カメラを上下に振る）",
  [CameraMovement.DOLLY_SHOT]: "ドリー（カメラを前後に移動）",
  [CameraMovement.TRACKING_SHOT]: "トラッキング（被写体を追従）",
  [CameraMovement.ZOOM_INOUT]: "ズーム（近づく・遠ざかる）",
  [CameraMovement.CRANE_SHOT]: "クレーン（高所から上下移動）",
  [CameraMovement.STEADICAM]: "ステディカム（滑らかな移動）",
  [CameraMovement.GIMBAL_SHOT]: "ジンバル（安定した追従）",
  [CameraMovement.HANDHELD]: "手持ち（臨場感を演出）",
  [CameraMovement.DRONE_SHOT]: "ドローン（空中から動的撮影）",
};

const SPECIAL_TECHNIQUE_LABELS: Record<SpecialTechnique, string> = {
  [SpecialTechnique.NONE]: "通常（特殊効果なし）",
  [SpecialTechnique.TIMELAPSE]: "タイムラプス（時間経過を早送り）",
  [SpecialTechnique.SLOW_MOTION]: "スローモーション（ゆっくり再生）",
  [SpecialTechnique.WHIP_PAN]: "ホイップパン（素早いパンニング）",
  [SpecialTechnique.RACK_FOCUS]: "ラックフォーカス（ピント移動）",
  [SpecialTechnique.SPLIT_SCREEN]: "スプリットスクリーン（画面分割）",
  [SpecialTechnique.PANORAMA_360]: "360度ショット（回転撮影）",
  [SpecialTechnique.ORBITAL_SHOT]: "オービタル（円を描く撮影）",
  [SpecialTechnique.VERTIGO_EFFECT]: "バーティゴ（ズーム＋ドリー効果）",
  [SpecialTechnique.FISHEYE_LENS]: "魚眼レンズ（歪んだ広角）",
  [SpecialTechnique.TELEPHOTO]: "望遠（遠景を圧縮）",
};

const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  [VisualStyle.CINEMATIC]: "シネマティック（映画的）",
  [VisualStyle.DOCUMENTARY]: "ドキュメンタリー風（リアルな記録映像）",
  [VisualStyle.MUSIC_VIDEO]: "ミュージックビデオ風（リズミカル）",
  [VisualStyle.ANIME_STYLE]: "アニメ風（日本アニメーション）",
  [VisualStyle.PIXAR_STYLE]: "ピクサー風（3Dアニメ）",
  [VisualStyle.GHIBLI_STYLE]: "ジブリ風（手描きアニメ）",
  [VisualStyle.FILM_NOIR]: "フィルムノワール（モノクロ犯罪映画）",
  [VisualStyle.CYBERPUNK]: "サイバーパンク（近未来ネオン）",
  [VisualStyle.STEAMPUNK]: "スチームパンク（蒸気機関世界）",
  [VisualStyle.FANTASY]: "ファンタジー（魔法・幻想世界）",
};

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [lyrics, setLyrics] = useState('');
  const [artistName, setArtistName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>(CameraAngle.EYE_LEVEL);
  const [cameraMovement, setCameraMovement] = useState<CameraMovement>(CameraMovement.NONE);
  const [specialTechnique, setSpecialTechnique] = useState<SpecialTechnique>(SpecialTechnique.NONE);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(VisualStyle.CINEMATIC);
  
  // ローカルストレージからAPIキーを読み込む
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });

  // APIキーが変更されたらローカルストレージに保存
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('gemini_api_key', value);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyrics.trim()) return;
    
    console.log('📤 送信データ確認:');
    console.log('  - APIキー:', apiKey ? (apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4)) : '未設定');
    console.log('  - 曲名:', songTitle || '未設定');
    console.log('  - アーティスト:', artistName || '未設定');
    console.log('  - カメラアングル:', cameraAngle);
    console.log('  - カメラの動き:', cameraMovement);
    console.log('  - 特殊テクニック:', specialTechnique);
    console.log('  - 映像スタイル:', visualStyle);
    console.log('  - 歌詞文字数:', lyrics.length);
    
    onGenerate({
      lyrics,
      artistName,
      songTitle,
      cameraAngle,
      cameraMovement,
      specialTechnique,
      visualStyle,
      apiKey: apiKey.trim() || undefined
    });
  };

  return (
    <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow-xl">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
        <Sparkles className="w-5 h-5" />
        設定入力
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* API Key Input */}
        <div className="space-y-1 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
          <label className="text-xs font-bold text-yellow-300 flex items-center gap-1">
            <Key className="w-4 h-4" /> Gemini API Key (必須)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="AIzaSy... で始まるAPIキーを入力"
            className="w-full bg-background border border-yellow-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition font-mono"
            autoComplete="off"
            name="gemini-api-key"
          />
          <div className="text-xs text-yellow-200/80 mt-1 space-y-1">
            <p>🔑 新しいAPIキーを取得: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:underline font-bold">Google AI Studio →</a></p>
            <p>💡 「Create API Key」→「Create API key in new project」を選択</p>
            <p>💾 入力したAPIキーはブラウザに自動保存されます</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
              <Music className="w-3 h-3" /> 曲名 (任意)
            </label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="例: Blinding Lights"
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              autoComplete="off"
              name="song-title"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
               <User className="w-3 h-3" /> アーティスト名 (任意)
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="例: The Weeknd"
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              autoComplete="off"
              name="artist-name"
            />
          </div>
        </div>

        {/* Camera Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Camera Angle */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
              📹 カメラアングル
            </label>
            <select
              value={cameraAngle}
              onChange={(e) => setCameraAngle(e.target.value as CameraAngle)}
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm text-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              title="カメラアングルを選択"
              name="camera-angle"
            >
              {Object.entries(CAMERA_ANGLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Camera Movement */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
              🎬 カメラの動き
            </label>
            <select
              value={cameraMovement}
              onChange={(e) => setCameraMovement(e.target.value as CameraMovement)}
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm text-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              title="カメラの動きを選択"
              name="camera-movement"
            >
              {Object.entries(CAMERA_MOVEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Special Technique */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
              ✨ 特殊テクニック
            </label>
            <select
              value={specialTechnique}
              onChange={(e) => setSpecialTechnique(e.target.value as SpecialTechnique)}
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm text-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              title="特殊テクニックを選択"
              name="special-technique"
            >
              {Object.entries(SPECIAL_TECHNIQUE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Visual Style */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted flex items-center gap-1">
              🎨 映像スタイル
            </label>
            <select
              value={visualStyle}
              onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
              className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm text-text focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              title="映像スタイルを選択"
              name="visual-style"
            >
              {Object.entries(VISUAL_STYLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lyrics Area */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">
            歌詞 (ここに貼り付け)
          </label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="ここに歌詞を貼り付けてください..."
            rows={8}
            required
            className="w-full bg-background border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none font-mono leading-relaxed"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading || !lyrics.trim()}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all duration-200
            ${isLoading || !lyrics.trim() 
              ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
              : 'bg-gradient-to-r from-primary to-accent hover:opacity-90 hover:scale-[1.01] shadow-lg shadow-indigo-500/20'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              シーンを分析中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              プロンプトを生成する
            </>
          )}
        </button>
      </form>
    </div>
  );
};