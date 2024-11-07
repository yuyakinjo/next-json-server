This is something I created to enable requests from JSON in Next.js, taking inspiration from [json-server](https://github.com/typicode/json-server).

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
  "profile": {
    "name": "yuyakinjo"
  }
}
```

3. Generate a route using CLI

```bash
bun gen:json:route
```

4. Run the server

```bash
bun dev

# Folders and route.ts files created successfully.
```

5. Access the route

```bash
curl http://localhost:3000/json/posts
```

## TODO

- [ ] use [instruments.ts](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) to generate a json route
- [ ] generate server action
- [ ] create validation for zod object or class
- [ ] create test of every request and function
- [ ] deliver the npm package
- [ ] choice db.json name, put path in the command
