# Next JSON Server

[![Test](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml)
[![Build](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml)
[![Lint](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml)

A lightweight JSON Server implementation based on Next.js App Router. Inspired by [json-server](https://github.com/typicode/json-server), it provides a simple RESTful API based on JSON files.

## Features

- 💡 Next.js App Router support
- 🚀 Simple setup
- 📝 JSON file based data management
- 🔄 RESTful API support
- 🛠 Customizable endpoints

## Getting Started

### Using npm package

1. Install the package

```bash
npm install next-json-server
```

2. Create a `db.json` in your project root

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

3. Generate JSON API route

```bash
npx next-json-server generate json
```

This will create `/app/json/[...api]/internal.ts` and `/app/json/[...api]/route.ts` files in your project.

4. Start your Next.js development server

```bash
npm run dev
```

5. Access your API at `http://localhost:3000/json/posts`

### Clone and Run

1. Clone the repository

```bash
git clone https://github.com/yuyakinjo/next-json-server.git
```

2. Install dependencies

```bash
cd next-json-server
bun install
```

3. Start the development server

```bash
bun dev
```

## API Endpoints

The following RESTful API endpoints are available:

### Retrieving Resources

#### Navigate by path

- `GET /json/posts` - Get all posts
- `GET /json/posts/1` - Get post with ID:1
- `GET /json/posts/1/comments` - Get comments for post with ID:1
- `GET /json/posts/1/comments/1` - Get comment with ID:1 for post with ID:1

#### Using queries

- `GET /json/posts?id=1` - Get post with ID:1
- `GET /json/posts?id=1&id=2` - Get posts with ID:1 and ID:2
- `GET /json/posts?title=starwars` - Get posts with title "starwars"
- `GET /json/posts?gt_views=100` - Get posts with views greater than 100
- `GET /json/posts?lt_views=100` - Get posts with views less than 100
- `GET /json/posts?gte_views=100` - Get posts with views greater than or equal to 100
- `GET /json/posts?lte_views=100` - Get posts with views less than or equal to 100
- `GET /json/posts?ne_views=100` - Get posts with views not equal to 100
- `GET /json/posts?in_views=100,200` - Get posts with views equal to 100 or 200

### Creating Resources

- `POST /json/posts` - Create a new post

```json
{
  "title": "New post",
  "views": 0
}
```

### Updating Resources

- `PUT /json/posts/1` - Update post with ID:1

```json
{
  "title": "Updated post",
  "views": 150
}
```

### Deleting Resources

- `DELETE /json/posts/1` - Delete post with ID:1

## Response Examples

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

### Status Codes

- `200` - Request successful
- `201` - Resource created successfully
- `204` - Resource deleted successfully
- `404` - Resource not found

## CLI Commands

- `npx next-json-server generate json` - Generate JSON API route files
- `npx next-json-server help` - Show help message

## Usage in Development Environment

1. Clone the repository

```bash
git clone https://github.com/yuyakinjo/next-json-server.git
```

2. Install dependencies

```bash
cd next-json-server
bun install
```

3. Start the development server

```bash
bun dev
```

## Running with Docker

You can also run it using Docker:

```bash
docker compose up -d
```

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
