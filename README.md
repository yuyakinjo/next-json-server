This is something I created to enable requests from JSON in Next.js, taking inspiration from [json-server](https://github.com/typicode/json-server).

## Getting Started

1. Install the package

```bash
bun -v # or npm, yarn, pnpm

bun i
```

2. Create a file in the root of your project called `db.json`

```json:db.json
// db.json
{
  "posts": [
    { "id": "1", "title": "a title", "views": 100 },
    { "id": "2", "title": "another title", "views": 200 }
  ],
  "comments": [
    { "id": "1", "text": "a comment about post 1", "postsId": "1" },
    { "id": "2", "text": "another comment about post 1", "postsId": "1" }
  ],
  "profile": {
    "name": "yuyakinjo"
  }
}
```

3. Generate a route using CLI

```bash
bun gen:json:route

# Folders and route.ts files created successfully.
```

Then, genarated the following files:

```bash
app/json/comments/[id]/route.ts
app/json/comments/route.ts
app/json/posts/[id]/route.ts
app/json/posts/route.ts
app/json/profile/route.ts
```

4. Run the server

```bash
bun dev
```

5. Request the route

```bash
curl http://localhost:3000/json/posts
```

```json:response.json
[
  {
    "id": "1",
    "title": "a title",
    "views": 100,
    "comments": [
      {
        "id": "1",
        "text": "a comment about post 1",
        "postsId": "1"
      },
      {
        "id": "2",
        "text": "another comment about post 1",
        "postsId": "1"
      }
    ]
  },
  {
    "id": "2",
    "title": "another title",
    "views": 200,
    "comments": []
  }
]
```

## TODO

- [ ] use [instruments.ts](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) to generate a json route
- [ ] generate server action
- [ ] create validation for zod object or class
- [ ] create test of every request and function
- [ ] deliver the npm package
- [ ] choice db.json name, put path in the command
- [x] set dependabot config
- [ ] generate prisma schema from db.json
