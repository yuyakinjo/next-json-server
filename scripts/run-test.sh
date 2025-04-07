#!/bin/bash
set -ex

echo "テスト環境のセットアップを開始します..."
echo "現在の作業ディレクトリ: $(pwd)"
echo "ファイル一覧:"
ls -la

# PostgreSQLクライアントの確認
echo "PostgreSQLクライアントの確認中..."
if ! command -v pg_isready &> /dev/null; then
  echo "pg_isreadyコマンドが見つかりません。PostgreSQLクライアントがインストールされていることを確認してください。"
  echo "代替方法でPostgreSQLの接続を確認します..."
  if ! command -v nc &> /dev/null; then
    apt-get update && apt-get install -y netcat-openbsd || apt-get install -y netcat
  fi

  # NCを使ってポート接続確認
  if nc -z postgres 5432; then
    echo "PostgreSQLポートが開いています"
  else
    echo "PostgreSQLに接続できません。サービスが起動しているか確認してください。"
    exit 1
  fi
else
  # PostgreSQLの起動確認
  echo "PostgreSQLの起動確認中..."
  pg_isready -h postgres -U postgres -d app_db || {
    echo "PostgreSQLが起動していません。起動してください。"
    exit 1
  }
  echo "PostgreSQLが起動しています"
fi

# テストファイルの存在確認
echo "テストディレクトリの確認中..."
if [ ! -d "tests" ]; then
  echo "testsディレクトリが見つかりません"
  exit 1
fi

echo "テストファイルの確認中..."
ls -la tests/
if [ ! -f "tests/postgres.test.ts" ]; then
  echo "postgres.test.tsファイルが見つかりません"
  exit 1
fi
echo "postgres.test.tsファイルが存在します"

# 環境変数の設定
export ENV=docker
export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/app_db"
export NODE_ENV=test

echo "テストを実行します..."
echo "NODE_ENV: $NODE_ENV"
echo "ENV: $ENV"
echo "DATABASE_URL: $DATABASE_URL"

# bun を使ってテストを直接実行
echo "Bunを使用してテストを実行します..."
bun test tests/postgres.test.ts