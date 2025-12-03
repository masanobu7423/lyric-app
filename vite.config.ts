import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 現在のディレクトリにある .env ファイルを読み込みます
  // 第3引数の '' は、VITE_ 以外のプレフィックスも許可する場合の設定ですが、
  // ここでは .env の内容をすべて env オブジェクトにロードします。
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // アプリのコード内にある process.env.API_KEY を、
      // .env ファイルの VITE_API_KEY の値に置き換えます。
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  };
});