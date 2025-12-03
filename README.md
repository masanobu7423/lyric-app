# 🎬 LyricToPrompt AI Studio

歌詞を入力するだけで、MV用の構成案を作成。AI動画生成プロンプト（Veo, Sora, Runway用）を自動生成します。

## ✨ 機能

- 📝 歌詞からシーン別に自動分割
- 🎨 7種類の映像スタイルから選択
- 🎥 カメラワーク、照明、ムードの詳細な設定
- 🌐 日本語の説明 + 英語のAIプロンプト生成
- 📊 Googleスプレッドシート用のコピー機能

## 🚀 セットアップ

### 1. APIキーの取得

無料のGemini APIキーを取得してください：
👉 [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. インストール

```bash
npm install @google/generative-ai
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173/ を開きます。

**重要**: APIキーは`.env`ファイルではなく、ブラウザのUIから直接入力してください。入力したAPIキーはブラウザのローカルストレージに自動保存されます。

## 📖 使い方

1. **APIキーを入力**（黄色いボックス内）
   - https://aistudio.google.com/app/apikey で取得
   - 入力すると自動的にブラウザに保存されます
2. **歌詞を貼り付け**
3. **映像スタイルを選択**（シネマティック、アニメ調など）
4. **「プロンプトを生成する」をクリック**
5. **生成された結果をGoogleスプレッドシートにコピー**

## 📂 プロジェクト構成

```
lyric-app/
├── components/          # Reactコンポーネント
│   ├── InputSection.tsx # 入力フォーム
│   └── ResultsTable.tsx # 結果表示テーブル
├── services/            # APIサービス
│   └── geminiService.ts # Gemini API統合
├── App.tsx              # メインアプリケーション
├── index.tsx            # エントリーポイント
├── index.html           # HTMLテンプレート
├── index.css            # グローバルスタイル
├── types.ts             # TypeScript型定義
├── vite.config.ts       # Vite設定
├── vite-env.d.ts        # Vite型定義
├── tailwind.config.js   # Tailwind CSS設定
├── postcss.config.js    # PostCSS設定
├── tsconfig.json        # TypeScript設定
├── tsconfig.node.json   # Node.js用TypeScript設定
├── package.json         # 依存関係
├── package-lock.json    # 依存関係ロックファイル
├── .gitignore           # Git除外設定
└── README.md            # このファイル
```

## 🔒 セキュリティ

- APIキーはブラウザのlocalStorageで管理（`.env`ファイルは使用しません）
- APIキーは絶対にGitにコミットしない
- `.gitignore`に`.env`を追加済み

## 💰 Gemini API料金について

### 無料枠の制限
- ⏱️ **15リクエスト/分**
- 📅 **1,500リクエスト/日**
- 🎯 対応モデル: gemini-2.5-flash, gemini-2.0-flash

### 有料プランへの移行
商用利用や高頻度利用が必要な場合は、Google Cloud Platformの有料プランをご検討ください。

**有料プランの利点**:
- 🚀 2,000リクエスト/分（gemini-2.5-flash）
- 💰 従量課金制（使った分だけ）
- 🎁 新規登録で $300の無料クレジット（90日間）
- 📊 高性能モデル（gemini-2.5-pro）へのアクセス

**アップグレード方法**:
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Generative Language APIを有効化
3. 請求先アカウントを設定
4. 新しいAPIキーを生成してアプリに入力

**料金目安（gemini-2.5-flash）**:
- 入力: $0.00001875/1Kトークン
- 出力: $0.000075/1Kトークン
- 例: 1曲分（約500トークン）× 100回 ≈ $0.004（約0.6円）

## ⚠️ トラブルシューティング

### エラー: "APIのクォータを超えました"

**原因**: Gemini APIの無料版には以下の制限があります：

- ⏱️ **15リクエスト/分**
- 📅 **1,500リクエスト/日**

**解決方法**:
1. 数秒待ってから再試行
2. 新しいAPIキーを取得
3. 使用状況を確認: https://aistudio.google.com/

### エラー: "モデルが見つかりません (404)"

**原因**: 使用しているモデルが無料枠でサポートされていない可能性があります。

**解決方法**:
1. ブラウザをリロード (Ctrl + Shift + R)
2. 新しいAPIキーを取得して入力
3. それでも解決しない場合は、有料プランをご検討ください

### 使用モデルについて

このアプリは `gemini-2.5-flash` モデルを使用しています（2025年最新版、無料枠対応）。
- ✅ 高速・軽量（最大100万トークン対応）
- ✅ 無料枠で利用可能
- ✅ 構造化出力に対応
- ✅ 2025年6月リリースの安定版

## 🛠️ 技術スタック

- **React 19** - UIフレームワーク
- **TypeScript** - 型安全性
- **Vite** - ビルドツール
- **Tailwind CSS** - スタイリング
- **Google Gemini API** - AI生成
- **Lucide React** - アイコン

## 📄 ライセンス

MIT

## 🤝 貢献

プルリクエストを歓迎します！
