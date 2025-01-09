[![Test](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/test.yml)
[![Build](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/build.yml)
[![Lint](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml/badge.svg)](https://github.com/yuyakinjo/next-json-server/actions/workflows/lint.yml)

This is something I created to enable requests from JSON in Next.js, taking inspiration from [json-server](https://github.com/typicode/json-server).

## Features

- For App Routers

## Getting Started

1. Install the package

```bash
bun -v # or npm, yarn, pnpm

bun i
```

2. Create a file in the root of your project called `db.json`

```json:db.json
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

1. Run the server

```bash
bun dev
```

2. Request the route

```bash
curl http://localhost:3000/json/posts
```

```json:response.json
[
  {
    "id": "1",
    "title": "a title",
    "views": 100,
  },
  {
    "id": "2",
    "title": "another title",
    "views": 200,
  }
]
```

# Array Data can below requests

```
GET    /posts
GET    /posts/1
POST   /posts
PUT    /posts/1
PATCH  /posts/1
DELETE /posts/1
```

# Single Data

```
GET    /profile
POST   /profile
PUT    /profile
PATCH  /profile
```
