# Next JSON Server

[![Test](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml)
[![Build](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml)
[![Lint](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml)

Next.js App Router ベースの軽量な JSON Server 実装です。[json-server](https://github.com/typicode/json-server)にインスパイアされており、シンプルな RESTful API を JSON file ベースで提供します。

## 特徴

- 💡 Next.js App Router 対応
- 🚀 シンプルなセットアップ
- 📝 JSON file ベースのデータ管理
- 🔄 RESTful API サポート
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

#### パスを辿る

- `GET /json/posts` - 全ての posts を取得
- `GET /json/posts/1` - ID:1 の投稿を取得
- `GET /json/posts/1/comments` - ID:1 の投稿のコメントを取得
- `GET /json/posts/1/comments/1` - ID:1 の投稿のコメントを取得

#### クエリを使用

- `GET /json/posts?id=1` - ID:1 の投稿を取得
- `GET /json/posts?id=1&id=2` - ID:1 と ID:2 の投稿を取得
- `GET /json/posts?title=starwars` - title が starwars の投稿を取得
- `GET /json/posts?gt_views=100` - views が 100 より大きい投稿を取得
- `GET /json/posts?lt_views=100` - views が 100 より小さい投稿を取得
- `GET /json/posts?gte_views=100` - views が 100 以上の投稿を取得
- `GET /json/posts?lte_views=100` - views が 100 以下の投稿を取得
- `GET /json/posts?ne_views=100` - views が 100 でない投稿を取得
- `GET /json/posts?in_views=100,200` - views が 100 か 200 の投稿を取得

### リソースの作成

- `POST /json/posts` - 新しい posts を作成

```json
{
  "title": "新しい投稿",
  "views": 0
}
```

### リソースの更新

- `PUT /json/posts/1` - ID:1 の posts を更新

```json
{
  "title": "更新された投稿",
  "views": 150
}
```

### リソースの削除

- `DELETE /json/posts/1` - ID:1 の posts を削除

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
