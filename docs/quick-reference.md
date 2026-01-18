# Quick Reference Guide

## Daily Commands

### Development
```bash
# Start local dev server
npx vercel dev --yes

# View at: http://localhost:3000
```

### Git (Save & Deploy)
```bash
# Save changes
git add .
git commit -m "Brief description of what you changed"
git push

# Check status
git status

# View recent commits
git log --oneline -5
```

### Vercel
```bash
# List deployments
npx vercel ls

# View logs
npx vercel logs

# Deploy to production manually
npx vercel --prod
```

### Supabase
```bash
# List projects
supabase projects list

# Open dashboard
open https://supabase.com/dashboard/project/tqezvppmechaczaulput
```

## File Structure

```
sprekta-lite/
├── index.html          # HTML structure
├── style.css           # Visual styles
├── app.js              # JavaScript logic
├── api/parse.js        # AI parsing function
├── .env                # Secrets (local only)
├── package.json        # Dependencies
├── vercel.json         # Vercel config
└── docs/               # Documentation
```

## Important URLs

- **Live Site:** https://sprekta-lite.vercel.app
- **GitHub Repo:** https://github.com/rramkhel/sprekta-lite
- **Vercel Dashboard:** https://vercel.com/rramkhels-projects/sprekta-lite
- **Supabase Dashboard:** https://supabase.com/dashboard/project/tqezvppmechaczaulput
- **Anthropic Dashboard:** https://console.anthropic.com/

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with the number from above)
kill [PID]
```

### "Authentication failed" (Git)
```bash
# Re-authenticate with GitHub
gh auth login
gh auth setup-git
```

### "Cannot find module" (Node)
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Changes not showing on live site
1. Check Vercel dashboard for deployment status
2. Make sure you pushed to GitHub (`git push`)
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### API not working
1. Check `.env` file has correct API keys
2. Check Vercel environment variables in dashboard
3. Check Anthropic usage limits
4. View serverless function logs: `npx vercel logs`

## Environment Variables

### Local (.env file)
```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...
```

### Production (Vercel Dashboard)
Same variables, set at: https://vercel.com/rramkhels-projects/sprekta-lite/settings/environment-variables

## Browser DevTools Shortcuts

- **Open DevTools:** `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
- **Console:** See JavaScript errors and `console.log()` outputs
- **Network:** See API calls and responses
- **Application:** View localStorage data

## Common Errors & Fixes

| Error | Solution |
|-------|----------|
| "Recursive invocation" | Use `npx vercel dev --yes` directly (not npm script) |
| "API key not configured" | Check `.env` file and Vercel env vars |
| "Permission denied" | Re-run `gh auth login` |
| "Module not found" | Run `npm install` |
| localStorage not saving | Check browser privacy settings |

## Git Workflow

```bash
# 1. See what changed
git status

# 2. Add files to commit
git add .

# 3. Commit with message
git commit -m "Add feature X"

# 4. Push to GitHub (triggers deployment)
git push

# 5. Check deployment in Vercel dashboard
```

## Need Help?

1. Check browser console (F12)
2. Check terminal output
3. Check Vercel deployment logs
4. Read error message carefully
5. Google the error message
6. Check documentation links in tech-stack.md
