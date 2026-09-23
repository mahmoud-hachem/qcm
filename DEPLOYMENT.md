# Free hosting trial: Render + Neon

The root `Dockerfile` builds React and serves it with FastAPI under one domain. PostgreSQL stores courses and attempts outside the web service. The domain remains registered at Porkbun.

## Accounts needed

- A free **Neon** account for PostgreSQL.
- A free **Render** account for the web service.
- A **GitHub** repository that Render can read. Keep it private if you prefer; Render can connect to private repositories after you authorize it.

No hosting account or DNS change has been made yet.

## Deploy the app

1. In Neon, create a free Postgres project. Copy its connection string from the Connect dialog. Keep it secret; it will be the `DATABASE_URL` environment variable in Render. Do not put it in a file or GitHub.
2. Put the contents of this `qcm` folder in a GitHub repository. `.gitignore` excludes the local SQLite database, virtual environment, and `node_modules`.
3. In Render, create **New > Web Service**, connect the repository, and select the **Free** instance. Render should detect the root `Dockerfile`. Set the environment variable `DATABASE_URL` to the Neon connection string. Set the health check path to `/api/health` if the form offers that option.
4. Deploy and open the temporary `*.onrender.com` address. Check that `/api/health` shows `{"status":"ok"}` and that the frontend loads. Test PDF preview, saving, and exam submission before connecting the domain.
5. In Render's service settings, add `mahmoudhachem.dev` under **Custom Domains**. Render will show the DNS records required for the root domain and `www`. In Porkbun, open **Domain Management > DNS** for the domain. Remove only DNS records that conflict with the new website records, then add Render's exact values. Preserve email-related MX and TXT records if you use email on the domain. Return to Render and verify the domain. Render provides HTTPS automatically.
6. Upload a real MCQ PDF, inspect the import preview, save the exam, complete an attempt, and verify a second browser gets a separate private workspace.

## Free-tier limits

Render's free web service sleeps after 15 minutes of inactivity, so the first visit can take around a minute. Its filesystem is temporary, which is why this setup uses Neon instead of cloud SQLite. Neon Free has usage and storage limits. This combination is suitable for a first public trial, not guaranteed to stay available under heavy use.

Each browser creates a random recovery key. In **Settings**, copy it before clearing browser data or switching devices. Anyone who has the key can access that workspace. User accounts and abuse controls are needed before a larger public launch.

## Local development

The Dockerfile is for hosting. The two-terminal local workflow in `README.md` remains available.
