# Next JSON Server

[![Test](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml)
[![Build](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml)
[![Lint](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml)

Next.js App Router ベースの軽量な JSON Server 実装です。[json-server](https://github.com/typicode/json-server)にインスパイアされており、シンプルな RESTful API を JSON file ベースで提供します。

## 特徴

- 💡 Next.js App Router 対応
- 🚀 シンプルなセットアップ
- 📝 JSON file ベースのデータ管理
- 🔄 完全な RESTful API サポート
- 🛠 カスタマイズ可能なエンドポイント

## 始め方

1. パッケージをインストール

```bash
bun -v # or npm, yarn, pnpm
bun i
```

2. プロジェクトのルートに`db.json`を作成

```json
{
  "posts": [
    { "id": "1", "title": "a title", "views": 100 },
    { "id": "2", "title": "another title", "views": 200 }
  ],
  "comments": [
    { "id": "1", "text": "a comment about post 1", "postsId": "1" },
    { "id": "2", "text": "another comment about post 1", "postsId": "1" }
  ],
  "users": [{ "id": "1", "name": "yuyakinjo" }]
}
```

3. サーバーを起動

```bash
bun dev
```

## API エンドポイント

以下の RESTful API エンドポイントが利用可能です：

### リソースの取得

- `GET /json/posts` - 全ての投稿を取得
- `GET /json/posts/1` - ID:1 の投稿を取得
- `GET /json/comments` - 全てのコメントを取得
- `GET /json/users` - 全てのユーザーを取得

### リソースの作成

- `POST /json/posts` - 新しい投稿を作成

```json
{
  "title": "新しい投稿",
  "views": 0
}
```

### リソースの更新

- `PUT /json/posts/1` - ID:1 の投稿を更新

```json
{
  "title": "更新された投稿",
  "views": 150
}
```

### リソースの削除

- `DELETE /json/posts/1` - ID:1 の投稿を削除

## レスポンス例

### GET /json/posts

```json
[
  {
    "id": "1",
    "title": "a title",
    "views": 100
  },
  {
    "id": "2",
    "title": "another title",
    "views": 200
  }
]
```

### ステータスコード

- `200` - リクエスト成功
- `201` - リソース作成成功
- `204` - リソース削除成功
- `404` - リソースが見つからない

## 開発環境での使用

1. リポジトリをクローン

```bash
git clone https://github.com/yuyakinjo/next-json-server.git
```

2. 依存関係をインストール

```bash
cd next-json-server
bun install
```

3. 開発サーバーを起動

```bash
bun dev
```

## Docker での実行

Docker を使用して実行することも可能です：

```bash
docker compose up -d
```

## ライセンス

MIT ライセンスの下で公開されています。詳細については[LICENSE](LICENSE)を参照してください。
