# Pennsylvania First-Time Homebuyer Landing Page

A simple Next.js landing page with a contact form that sends leads with Resend.

## 1) Install

```bash
npm install
```

## 2) Add your one environment variable

Create a `.env.local` file:

```env
RESEND_API_KEY=your_real_resend_api_key
```

## 3) Run locally

```bash
npm run dev
```

Open http://localhost:3000

## 4) Deploy

Deploy to Vercel (or another Node host) and set `RESEND_API_KEY` in project environment variables.
