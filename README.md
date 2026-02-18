## Nick Tapp-Hughes's Blog

This repository contains all the code for my blog [nicholastapphughes.com](https://www.nicholastapphughes.com).

### Stack

- **Frontend**: React 18 + TypeScript, built with Vite
- **Backend**: AWS Amplify with Python Lambda functions, DynamoDB, and SES
- **Routing**: React Router v7
- **Deployment**: AWS Amplify with CI/CD via `amplify.yml`

### Pages

| Route | Description |
|-------|-------------|
| `/` | About/home |
| `/cv` | Resume with embedded PDF |
| `/publications` | Academic publications |
| `/blog` | Blog listing + subscribe form |
| `/blog/:title` | Individual post viewer |
| `/verify` | Email verification landing |
| `/unsubscribe` | Unsubscribe management |

### Blog Posts

Blog posts live as `.html` files in `app/src/blog_posts/`. The blog listing in `app/src/blog.tsx` has a hardcoded list of posts, and each post is rendered by injecting its HTML into the DOM.

### Subscription System

Email subscription logic lives in `app/amplify/functions/`:

- **`subscriber-handler`** — handles subscribe/verify/unsubscribe requests via a Lambda function URL
- **`blog-notifier`** — sends bulk emails to verified subscribers when a new post is published

### Running Locally

```bash
cd app
pnpm install
pnpm run dev      # dev server at http://localhost:5173
pnpm run build    # production build
```
