# Firebase সেটআপ গাইড

## ধাপ 1: Firebase প্রজেক্ট তৈরি করুন

1. [Firebase Console](https://console.firebase.google.com) এ যান
2. "নতুন প্রজেক্ট" ক্লিক করুন
3. প্রজেক্টের নাম দিন (যেমন: "Oasis Store")
4. অ্যানালিটিক্স অপশন ছেড়ে দিন
5. প্রজেক্ট তৈরি করুন

## ধাপ 2: Firestore Database সক্ষম করুন

1. Firebase Console এ যান
2. Left panel থেকে "Build" → "Firestore Database" নির্বাচন করুন
3. "Create Database" ক্লিক করুন
4. প্রোডাকশন মোড নির্বাচন করুন
5. অবস্থান নির্বাচন করুন (যেমন: us-central1)
6. তৈরি করুন

## ধাপ 3: Service Account Key পান

1. Firebase Console এ যান
2. Top right এ গিয়ার আইকন (⚙️) → "Project Settings" ক্লিক করুন
3. "Service Accounts" ট্যাব খুলুন
4. "Generate New Private Key" ক্লিক করুন
5. JSON ফাইল ডাউনলোড হবে

## ধাপ 4: Key কে Base64 এনকোড করুন

### Windows PowerShell এ:
```powershell
$content = Get-Content "path/to/your-key.json" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
$encoded = [Convert]::ToBase64String($bytes)
Write-Host $encoded
```

### Linux/Mac এ:
```bash
cat your-key.json | base64 | tr -d '\n'
```

## ধাপ 5: Environment Variables সেট করুন

### স্থানীয় ডেভেলপমেন্টের জন্য (`.env.local`):
```
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=আপনার-base64-এনকোডেড-কী
```

### Vercel এ:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. নিম্নোক্ত যোগ করুন:
   - `FIREBASE_PROJECT_ID` = আপনার প্রজেক্ট ID
   - `FIREBASE_SERVICE_ACCOUNT_KEY` = আপনার Base64 কী

## ধাপ 6: সিকিউরিটি নিয়মাবলী সেট করুন

Firebase Console এ Firestore এ যান → "Rules" ট্যাব:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Read: সবাই পড়তে পারবে
    // Write: শুধুমাত্র authenticated ব্যবহারকারী (আমাদের সার্ভার)
    match /products/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## পরীক্ষা করুন

```bash
# স্থানীয়ভাবে:
pnpm dev

# প্রোডাক্টসন (Vercel):
git push vercel main
```

তারপর:
1. Home Page এ যান
2. `3-3-1-5-4-8` টাইপ করুন (ইমপোর্ট ডায়ালগ খুলবে)
3. একটি ওয়েবসাইট URL পেস্ট করুন (যেমন: shopify store)
4. প্রোডাক্টস ইমপোর্ট হবে এবং Firebase এ সংরক্ষিত হবে

## ভেরিফাই করুন

Firebase Console এ:
1. Firestore Database → Collections → "products"
2. সমস্ত প্রোডাক্ট দেখতে পাবেন

আপনি যদি অন্য ব্রাউজার/ডিভাইস থেকে সাইট ভিজিট করেন, আপনি একই প্রোডাক্টস দেখবেন! ✅

## সমস্যা সমাধান

### "Firebase not initialized"
- আপনার `.env.local` বা Vercel environment variables চেক করুন
- Base64 কী সঠিকভাবে এনকোডেড আছে কিনা দেখুন

### Firestore রাইট পার্মিশন এরর
- Firebase Rules চেক করুন
- Rules সঠিকভাবে সেট আছে কিনা নিশ্চিত করুন
