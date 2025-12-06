# 🎬 ComfyUI 動画生成ガイド

このガイドでは、Reactアプリで生成した絵コンテプロンプトから、Google Colab + ComfyUI で実際の動画を生成する方法を説明します。

## 📋 概要

### ワークフロー
```
歌詞入力 → 字コンテ生成 → 英語プロンプト生成 → JSONエクスポート → ComfyUI動画生成
```

### 必要なもの
- ✅ Google アカウント（Google Colab用）
- ✅ Reactアプリで生成した絵コンテプロンプト
- ✅ GPU環境（ColabのT4以上推奨）

---

## 🚀 Step 1: Reactアプリでプロンプトを生成

### 1-1. 歌詞を入力
1. Reactアプリを開く（http://localhost:5174/）
2. Gemini APIキーを入力
3. 曲名、アーティスト名、歌詞を入力
4. カメラ設定を選択（アングル、動き、テクニック、スタイル）
5. 「字コンテを生成する」をクリック

### 1-2. 絵コンテプロンプトを生成
1. OpenRouter APIキーを入力（無料モデル推奨）
2. 「絵コンテプロンプトを生成」をクリック
3. 各シーンの英語プロンプトが生成される

### 1-3. JSONエクスポート
1. 「ComfyUI用にエクスポート（JSON）」ボタンをクリック
2. `storyboard_prompts_for_comfyui.json` がダウンロードされる

**エクスポートされるデータ形式：**
```json
[
  {
    "scene": 1,
    "timestamp": "0:00-0:05",
    "duration_seconds": 5,
    "prompt": "cinematic shot of...",
    "negative_prompt": "blurry, low quality...",
    "cut_description": "主人公が夜の街を歩く",
    "direction_memo": "ネオン街、レトロフューチャー",
    "audio_se": "足音、雑踏の音",
    "telop": "",
    "narration": ""
  },
  ...
]
```

---

## 🎨 Step 2: Google Colab で ComfyUI をセットアップ

### 2-1. Colabノートブックを開く
1. `ComfyUI_Video_Generation.ipynb` をGoogle Colabにアップロード
2. または、以下のリンクから直接開く：
   ```
   https://colab.research.google.com/
   ```

### 2-2. GPU ランタイムを設定

1. 「ランタイム」→「ランタイムのタイプを変更」
2. 「ハードウェアアクセラレータ」→「T4 GPU」を選択
3. 「保存」をクリック

### 2-3. 環境セットアップ（初回のみ）

以下のセルを順番に実行：

**セル1: GPU確認**

```python
!nvidia-smi
```

**期待される出力：**
```
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 550.54.15              Driver Version: 550.54.15      CUDA Version: 12.4     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
|   0  Tesla T4                       Off |   00000000:00:04.0 Off |                    0 |
| N/A   34C    P8              9W /   70W |       0MiB /  15360MiB |      0%      Default |
+-----------------------------------------------------------------------------------------+
✅ GPU環境を確認しました
```

**重要なポイント：**
- **GPU Name**: Tesla T4（または A100/V100）が表示されること
- **Memory**: 15360MiB（T4の場合）のVRAMが利用可能
- **CUDA Version**: 12.x 以上が推奨

❌ **もしGPUが表示されない場合：**
1. ランタイムタイプがGPUになっているか確認
2. 「ランタイム」→「ランタイムを再起動」
3. Colab無料版の制限に達している可能性（数時間待つ）

**セル2: ComfyUI インストール**
```python
# 約5分かかります
```
→ ComfyUIがクローンされ、依存関係がインストールされる

**セル3: カスタムノードのインストール**
```python
# AnimateDiff, VideoHelperSuite等
```
→ 動画生成に必要なノードがインストールされる

**セル4: モデルのダウンロード**
```python
# Stable Diffusion 1.5, AnimateDiff motion module
```
→ 約2-3GB のモデルがダウンロードされる

⏱️ **合計セットアップ時間：約10-15分**

---

## 🎬 Step 3: 動画を生成する

### 3-1. ComfyUI サーバーを起動
**セル5: サーバー起動**
```python
# バックグラウンドで起動
```
→ CloudflareトンネルのURLが表示される
→ そのURLでComfyUI WebUIにアクセス可能

### 3-2. プロンプトを読み込む

**方法A: JSONファイルをアップロード（推奨）**
```python
# セル6の前に実行
import json

# ファイルをアップロード
from google.colab import files
uploaded = files.upload()

# JSONを読み込み
filename = list(uploaded.keys())[0]
with open(filename, 'r', encoding='utf-8') as f:
    prompts = json.load(f)

print(f"✅ {len(prompts)} シーンのプロンプトを読み込みました")
```

**方法B: 直接ペースト**
```python
# セル6にエクスポートしたJSONの内容をコピー&ペースト
prompts = [
    {
        "scene": 1,
        "timestamp": "0:00-0:05",
        ...
    },
    ...
]
```

### 3-3. 動画生成を実行
**セル7-8: バッチ生成**
```python
# 全シーンの動画を自動生成
```

⏱️ **生成時間の目安：**
- 1シーン（16フレーム）：約2-3分
- 10シーン：約20-30分

---

## 📹 Step 4: 結果の確認とダウンロード

### 4-1. 生成された動画をプレビュー
**セル9: 動画確認**
```python
# 生成された全動画を表示
```
→ ノートブック内で各シーンの動画を確認

### 4-2. 個別ダウンロード
**セル10: ZIP ダウンロード**
```python
# すべての動画を1つのZIPに圧縮
```
→ `generated_videos.zip` がダウンロードされる

### 4-3. 動画を結合（オプション）
**セル11: 全シーン結合**
```python
# MoviePy で1つの動画に結合
```
→ `final_music_video.mp4` が生成される

---

## ⚙️ カスタマイズ設定

### フレーム数の変更
```python
# ワークフローの batch_size を変更
"batch_size": 16  # 16フレーム = 2秒 @ 8fps
"batch_size": 24  # 24フレーム = 3秒 @ 8fps
"batch_size": 32  # 32フレーム = 4秒 @ 8fps
```

### 解像度の変更
```python
"width": 512,   # 標準
"height": 512,

"width": 768,   # 高解像度
"height": 768,

"width": 1024,  # より高解像度（要GPU RAM）
"height": 576,  # 16:9アスペクト比
```

### 品質の向上
```python
"steps": 20,    # 標準
"steps": 30,    # 高品質（生成時間が増加）

"cfg": 7.5,     # 標準
"cfg": 8.5,     # よりプロンプトに忠実
```

### フレームレートの変更
```python
"frame_rate": 8,   # 標準（滑らか）
"frame_rate": 12,  # より滑らか
"frame_rate": 16,  # 最も滑らか（要多フレーム）
```

---

## 🔧 トラブルシューティング

### ❌ GPU メモリ不足エラー
**エラー：** `CUDA out of memory`

**解決策：**
1. 解像度を下げる（512x512 → 448x448）
2. バッチサイズを減らす（16 → 12）
3. ランタイムを再起動
4. T4 → A100 にアップグレード（有料）

### ❌ モデルが見つからない
**エラー：** `Model not found`

**解決策：**
1. セル4のモデルダウンロードを再実行
2. `/content/ComfyUI/models/checkpoints/` を確認
```python
!ls -lh /content/ComfyUI/models/checkpoints/
```

### ❌ API エラー
**エラー：** `Connection refused`

**解決策：**
1. セル5のサーバー起動を確認
2. 30秒待ってから再試行
3. ランタイムを再起動

### ❌ 動画が生成されない
**チェック項目：**
1. プロンプトが正しく読み込まれているか確認
   ```python
   print(len(prompts))
   print(prompts[0])
   ```
2. `/content/ComfyUI/output/` を確認
   ```python
   !ls -lh /content/ComfyUI/output/
   ```
3. ComfyUI のログを確認
   ```python
   # サーバーログを表示
   ```

---

## 📚 高度な使い方

### 1. カスタムモデルの使用
```python
# Stable Diffusion 1.5 以外のモデル
# 例：Realistic Vision, DreamShaper等
!wget -O /content/ComfyUI/models/checkpoints/model.safetensors \
  "https://huggingface.co/.../model.safetensors"
```

### 2. ControlNet の追加
```python
# より正確な構図制御
# OpenPose, Depth, Canny等
```

### 3. LoRA の適用
```python
# 特定のスタイル（アニメ、リアル等）
# キャラクター学習モデル
```

### 4. フレーム補間
```python
# RIFE または Frame Interpolation で滑らかに
!pip install rife-ncnn-vulkan-python
```

---

## 💡 ベストプラクティス

### プロンプトの最適化
- ✅ 具体的で詳細な記述
- ✅ カメラアングルを明記
- ✅ 照明・雰囲気を指定
- ❌ 抽象的すぎる表現は避ける

### バッチ生成の工夫
- ✅ 1-2シーンずつテスト生成
- ✅ 満足したら全シーン生成
- ❌ いきなり全シーン生成は避ける

### GPU 使用時間の節約
- ✅ プロンプトを事前に確認
- ✅ テストは低解像度で実行
- ✅ 満足したら高解像度で最終生成
- ❌ 試行錯誤を高解像度でやらない

---

## 📊 コスト情報

### Google Colab
- **無料版：** T4 GPU、1日数時間まで
- **Colab Pro：** $9.99/月、A100利用可、長時間実行可能
- **Colab Pro+：** $49.99/月、優先アクセス

### 推奨プラン
- **テスト・学習：** 無料版で十分
- **本番制作：** Pro 推奨
- **大量生成：** Pro+ 推奨

---

## 🎓 参考リンク

### 公式ドキュメント
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [AnimateDiff-Evolved](https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved)
- [VideoHelperSuite](https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite)

### チュートリアル動画
- [ComfyUI 基礎講座](https://www.youtube.com/results?search_query=comfyui+tutorial)
- [AnimateDiff 使い方](https://www.youtube.com/results?search_query=animatediff+tutorial)

### コミュニティ
- [ComfyUI Discord](https://discord.gg/comfyui)
- [Reddit r/StableDiffusion](https://www.reddit.com/r/StableDiffusion/)

---

## ✨ サンプルワークフロー

### ミュージックビデオ制作の完全フロー

**1日目：プリプロダクション**
- 歌詞解析
- 字コンテ作成（Reactアプリ）
- 絵コンテプロンプト生成
- テスト動画生成（2-3シーン）

**2日目：本番生成**
- 全シーン動画生成（Colab）
- 品質チェック
- 再生成（必要に応じて）

**3日目：ポストプロダクション**
- DaVinci Resolve / Premiere Pro で編集
- 音楽とタイミング調整
- カラーグレーディング
- 最終出力

---

## 🤝 サポート

問題が発生した場合：
1. このガイドのトラブルシューティングを確認
2. Google Colab のログを確認
3. ComfyUI コミュニティに質問
4. GitHub Issue を作成

---

**Happy Video Making! 🎬✨**
