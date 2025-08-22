# Next.js Build Fix

This document provides instructions to fix the Next.js build issues in the WorldVibe project.

## The Issue

You were experiencing a version mismatch between Next.js (14.1.0) and the SWC compiler (15.1.7), which caused build failures with errors like:

```
⚠ Mismatching @next/swc version, detected: 15.1.7 while Next.js is on 14.1.0. Please ensure these match
```

## Solution

The issue has been resolved by:

1. Downgrading to a stable version of Next.js (13.4.12)
2. Disabling SWC minification
3. Ensuring proper dependency resolution

## How to Run the Fix

### Using PowerShell (Recommended)

1. Open PowerShell in the project directory
2. Run the fix script:

```powershell
cd C:\Users\Drao\worldvibe
.\fix-build.ps1
```

### Manual Fix

If you prefer to fix it manually:

1. Delete `node_modules`, `.next`, and `package-lock.json`
2. Install Next.js 13.4.12:
   ```
   npm install next@13.4.12 --save-exact
   ```
3. Modify your `next.config.js` to set `swcMinify: false`
4. Reinstall all dependencies:
   ```
   npm install --force
   ```
5. Build the project:
   ```
   npm run build
   ```

## Development vs. Production

- For development: `npm run dev` should work fine
- For production: `npm run build` followed by `npm start`

## Why This Works

Next.js 13.4.12 is an LTS version with stable SWC integration. Disabling SWC minification reduces the potential for compiler conflicts. This approach resolves the mismatch while keeping your application running properly.

## If Issues Persist

- Update Node.js to the latest LTS version
- Consider using the Next.js standalone build option with `output: 'standalone'` in next.config.js
- Deploy to Vercel which handles Next.js builds optimally