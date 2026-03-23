# Deploy Marimbas CRM to Vercel

## One-time setup (from your Mac terminal)

```bash
cd ~/MarimbasHome/Codigo/crm
npx vercel --scope marimbashome
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → marimbashome
- **Link to existing project?** → No (create new)
- **Project name?** → marimbas-crm
- **Directory?** → ./
- **Override settings?** → No

## After first deploy: add custom domain

```bash
npx vercel domains add crm.marimbashome.com --scope marimbashome
```

## Environment variable (set in Vercel dashboard)

```
NEXT_PUBLIC_SUPABASE_URL = https://xqjjdopwinljrnxexpwd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key from Supabase]
```

## Subsequent deploys

```bash
cd ~/MarimbasHome/Codigo/crm
npx vercel --prod --scope marimbashome
```
