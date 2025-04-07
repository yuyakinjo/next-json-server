// テスト環境の設定ファイル
console.log("テスト環境をセットアップ中...");

// 環境変数の設定確認
console.log(`ENV: ${process.env.ENV}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);

// Bunのテストで必要な設定
// デフォルトのコード設定を拡張
export default {
  // モックなど必要な設定があればここに追加
};
