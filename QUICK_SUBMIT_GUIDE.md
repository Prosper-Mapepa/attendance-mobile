# Quick Automated Submission Guide

## 🚀 Quick Steps (5 minutes)

### 1. Google Cloud Console Setup (2 min)

1. Go to: https://console.cloud.google.com
2. Create/Select project
3. Enable API: **APIs & Services → Library → Search "Google Play Android Developer API" → Enable**
4. Create Service Account: **IAM & Admin → Service Accounts → Create → Name it → Grant "Editor" role**
5. Create Key: **Click service account → Keys tab → Add Key → JSON → Download**

### 2. Move Key File (30 sec)

```bash
# Rename and move the downloaded JSON file
mv ~/Downloads/your-project-*.json attendance-mobile/service-account-key.json
```

### 3. Grant Play Console Access (2 min)

1. Go to: https://play.google.com/console
2. Select your app → **Setup → API access**
3. Click **"Link service account"**
4. Select your project and service account
5. Grant permissions:
   - ✅ View app information
   - ✅ Manage production releases
6. Click **"Grant access"**

### 4. Submit! (30 sec)

```bash
cd attendance-mobile

# Build (if not done already - takes 10-20 min)
eas build --platform android --profile production

# Submit (once build is complete)
eas submit --platform android --profile production
```

## ✅ Verification Checklist

Before submitting, verify:

- [ ] `service-account-key.json` exists in project root
- [ ] File is in `.gitignore` (already done)
- [ ] `eas.json` has correct path: `"./service-account-key.json"`
- [ ] Google Play Android Developer API is enabled
- [ ] Service account has Play Console access
- [ ] Production build is complete

## 📝 File Structure

```
attendance-mobile/
├── service-account-key.json  ← Your downloaded key (DO NOT COMMIT!)
├── eas.json                  ← Already configured ✅
├── app.json                  ← Already configured ✅
└── .gitignore                ← Already has key file ✅
```

## 🎯 That's It!

Once you run `eas submit`, your app will be automatically uploaded to Play Store!

For detailed instructions, see: `AUTOMATED_SUBMISSION_SETUP.md`



