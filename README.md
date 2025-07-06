# Diino - Real-time Chat Application

A modern real-time chat application built with Next.js, Supabase, Tailwind CSS, and shadcn/ui.

## Features

- Real-time messaging with Supabase
- User authentication (login/signup)
- Responsive design with Tailwind CSS
- Beautiful UI components from shadcn/ui
- TypeScript for type safety

## Setup Instructions

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL commands in `supabase-setup.sql` in your Supabase SQL editor
   - Copy your project URL and anon key

3. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## Deployment to Vercel

1. Push your code to a GitHub repository
2. Connect your GitHub repo to Vercel
3. Add the environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Project Structure

```
diino/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── logout/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   └── ChatInterface.tsx
├── lib/
│   ├── supabase/
│   └── utils.ts
└── ...
```