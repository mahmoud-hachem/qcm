# Deploy QuizFlow on Vercel

This version is a static Vite site. It needs no Render service, Neon database, API key, or server. PDF parsing and course history run in each visitor's browser. The domain stays registered at Porkbun.

## Deploy

1. Push the latest `qcm` commit to GitHub.
2. In Vercel, choose **Add New → Project** and import the GitHub repository. The Vite app is at the repository root. Leave **Root Directory** at `./`.
3. Use the **Vite** framework preset. The build command is `npm run build` and the output directory is `dist`. No environment variables are needed. If you already created a Vercel project with Root Directory set to `frontend`, change it to `./` in **Settings → Build and Deployment**, then redeploy.
4. Deploy. Open the assigned `*.vercel.app` URL and test `sample/sample-mcq.pdf`: create a course, preview and save the exam, complete an attempt, and reload the page to check that the history persists.
5. In Vercel project **Settings → Domains**, add `mahmoudhachem.dev` (and `www.mahmoudhachem.dev` if desired). Vercel will show the DNS records for this project.
6. In Porkbun **Domain Management → DNS**, set the exact records Vercel requests. Remove only website DNS records that conflict. Keep any email MX/TXT records you use. Return to Vercel to verify the domain and HTTPS.

The SPA route fallback is in `vercel.json`, so links to exams and results open correctly after a page reload.

## What visitors should know

Each browser has a separate local study library. There is no account or automatic sync. Visitors can export and import a backup in Settings. Clearing site data can remove their courses and results. The PDF file is read in the browser and is not sent to Vercel; only the app's static files are hosted there.

The temporary `*.vercel.app` address and `mahmoudhachem.dev` use separate browser storage. Export a backup from the temporary address and import it on the custom domain if you want to keep test courses.

Vercel's free Hobby plan is for personal, non-commercial projects and has usage limits. Check its current terms before using the site commercially.
