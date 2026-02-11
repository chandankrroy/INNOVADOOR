# Fix for Tailwind CSS v4 PostCSS Error

## Problem
Tailwind CSS v4 has moved the PostCSS plugin to a separate package. The error says you need `@tailwindcss/postcss`.

## Solution

### Step 1: Install the PostCSS plugin
```powershell
cd frontend
npm install -D @tailwindcss/postcss
```

### Step 2: The postcss.config.js has been updated
The config now uses `@tailwindcss/postcss` instead of `tailwindcss`.

### Step 3: Restart the dev server
Stop the current server (Ctrl+C) and restart:
```powershell
npm run dev
```

## What Changed

1. **package.json**: Added `@tailwindcss/postcss` to devDependencies
2. **postcss.config.js**: Changed from `tailwindcss: {}` to `'@tailwindcss/postcss': {}`

## Alternative: Downgrade to Tailwind v3

If you prefer to use Tailwind v3 (which doesn't require the separate PostCSS package):

```powershell
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

Then change postcss.config.js back to:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

