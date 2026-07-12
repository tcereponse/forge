# Guide de déploiement Vercel — React Forge

## Étape 1 : Créer une base PostgreSQL gratuite sur Neon

1. Va sur **https://neon.tech** → "Sign up" (gratuit avec Google)
2. Clique **"New Project"** → nomme-le "React Forge"
3. Choisis la région **EU (Frankfurt)**
4. Clique **"Create"**
5. Copie l'**URL de connexion** (ressemble à `postgresql://user:pass@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`)

## Étape 2 : Push le code sur GitHub

```bash
cd /home/z/my-project
git init
git add .
git commit -m "React Forge — Gold Grade Industrial"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/react-forge.git
git push -u origin main
```

## Étape 3 : Déployer sur Vercel

1. Va sur **https://vercel.com** → "Sign up" (gratuit avec GitHub)
2. Clique **"New Project"**
3. Importe le repo **react-forge**
4. Dans **"Environment Variables"**, ajoute :

| Nom | Valeur |
|-----|--------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` (URL Neon) |
| `NEXTAUTH_SECRET` | Une clé aléatoire de 32+ caractères (ex: `tiger-forge-secret-2024-xyz`) |
| `SMTP_USER` | `patriceadja@gmail.com` |
| `SMTP_PASS` | `lzgj xwdr sgex jgee` |

5. Clique **"Deploy"**
6. Attends 2-3 minutes (build + migration Prisma)
7. Ton app est en ligne sur `https://react-forge-xxx.vercel.app` 🎉

## Étape 4 : Configurer l'URL de l'app

Une fois déployé, ajoute une variable supplémentaire :
- `NEXTAUTH_URL` = `https://react-forge-xxx.vercel.app`

Redéploie pour appliquer.

## Ce qui fonctionne sur Vercel

✅ Authentification (inscription, connexion, mot de passe oublié)
✅ Création de projets (standard + Gold Grade)
✅ Génération GLM-4.6 (via z-ai-web-dev-sdk)
✅ Isolation des utilisateurs (chacun voit ses projets)
✅ Emails (mot de passe oublié, bienvenue, suppression)
✅ Aperçu des projets (build + iframe)
✅ Export ZIP
✅ App mobile (QR code → /mobile)
✅ Base de données PostgreSQL (Neon — 500MB gratuits)
✅ HTTPS automatique

⚠️ Compilation APK : limitée à 60s (timeout Vercel). Pour les APK, utilise l'app mobile web (/mobile) ou l'APK souverain.

## Limites du plan gratuit Vercel

- **100 déploiements par jour** (largement suffisant)
- **Fonctions serverless : 60s max** (la génération Gold prend 3-6 min → utilise le mode fire-and-forget + polling déjà implémenté)
- **Bandwidth : 100GB/mois** (suffisant)
- **Neon PostgreSQL : 500MB** (des milliers de projets)

## Mises à jour

Pour mettre à jour l'app après des changements :
```bash
git add .
git commit -m "mise à jour"
git push
```
Vercel redéploie automatiquement.

## Support

Pour tout problème, vérifie les logs dans Vercel → Dashboard → ton projet → "Functions" → "Logs".
