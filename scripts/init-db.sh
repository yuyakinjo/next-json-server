#!/bin/bash
set -e

echo "データベースの初期化を開始します..."

# PostgreSQLが起動するのを待つ
echo "PostgreSQLの起動を待機しています..."
max_retries=30
counter=0
while ! pg_isready -h postgres -U postgres > /dev/null 2>&1; do
  counter=$((counter+1))
  if [ $counter -ge $max_retries ]; then
    echo "PostgreSQL接続のタイムアウト"
    exit 1
  fi
  echo "PostgreSQLの起動を待機中... ($counter/$max_retries)"
  sleep 2
done
echo "PostgreSQLが起動しました！"

# db.jsonからスキーマを生成
echo "db.jsonからスキーマを生成しています..."
bun scripts/generate-schema-from-json.ts

# drizzle-kitコマンドを直接実行してマイグレーション (alterモードを指定)
echo "マイグレーションスキーマを生成しています..."
bunx drizzle-kit generate:pg --mode=alter

# マイグレーションを実行
echo "マイグレーションを実行しています..."
bun app/api/db/postgres/migrate.ts

# db.jsonからシードデータを挿入
echo "db.jsonからデータをシードしています..."
bun app/api/db/postgres/seed.ts

echo "データベースの初期化が完了しました。"