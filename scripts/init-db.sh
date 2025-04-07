#!/bin/bash
set -e

echo "データベースの初期化を開始します..."
echo "$(date): 初期化開始" > /app/init-db.log

# PostgreSQLが起動するのを待つ
echo "PostgreSQLの起動を待機しています..."
max_retries=30
counter=0
while ! pg_isready -h postgres -U postgres > /dev/null 2>&1; do
  counter=$((counter+1))
  if [ $counter -ge $max_retries ]; then
    echo "PostgreSQL接続のタイムアウト"
    echo "$(date): PostgreSQL接続タイムアウト" >> /app/init-db.log
    exit 1
  fi
  echo "PostgreSQLの起動を待機中... ($counter/$max_retries)"
  sleep 2
done
echo "PostgreSQLが起動しました！"
echo "$(date): PostgreSQL起動確認" >> /app/init-db.log

# パスワードファイルを設定
echo "postgres:5432:app_db:postgres:postgres" > ~/.pgpass
chmod 600 ~/.pgpass

# db.jsonからスキーマを生成
echo "db.jsonからスキーマを生成しています..."
bun scripts/generate-schema-from-json.ts
echo "$(date): スキーマ生成完了" >> /app/init-db.log

# drizzle-kitコマンドを直接実行してマイグレーション
echo "マイグレーションスキーマを生成しています..."
bunx drizzle-kit generate
echo "$(date): マイグレーションスキーマ生成完了" >> /app/init-db.log

# マイグレーションを実行
echo "マイグレーションを実行しています..."
bun app/db/pg/migrate.ts
echo "$(date): マイグレーション実行完了" >> /app/init-db.log

# データベース内のテーブルを確認
echo "データベーステーブルの確認:"
PGPASSFILE=~/.pgpass psql -h postgres -U postgres -d app_db -c "\dt" >> /app/init-db.log 2>&1

# db.jsonからシードデータを挿入
echo "db.jsonからデータをシードしています..."
bun app/db/pg/seed.ts
echo "$(date): シード実行完了" >> /app/init-db.log

# データ確認
echo "データ確認:"
PGPASSFILE=~/.pgpass psql -h postgres -U postgres -d app_db -c "SELECT COUNT(*) FROM users;" >> /app/init-db.log 2>&1
PGPASSFILE=~/.pgpass psql -h postgres -U postgres -d app_db -c "SELECT COUNT(*) FROM posts;" >> /app/init-db.log 2>&1
PGPASSFILE=~/.pgpass psql -h postgres -U postgres -d app_db -c "SELECT COUNT(*) FROM comments;" >> /app/init-db.log 2>&1

echo "データベースの初期化が完了しました。"
echo "$(date): 初期化完了" >> /app/init-db.log

# マーカーファイルを作成してマイグレーションとシードが完了したことを示す
touch /app/db-initialized