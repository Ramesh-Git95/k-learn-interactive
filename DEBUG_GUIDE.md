# 🔍 Debug Your Authentication UI

## Quick Checks

### 1. **Open Browser Developer Tools**
1. Press `F12` or right-click → "Inspect Element"
2. Go to the **Console** tab
3. Look for any red error messages

### 2. **Check Network Tab**
1. In Developer Tools, go to **Network** tab
2. Refresh the page (`F5`)
3. Look for any failed requests (red entries)
4. Specifically check if `http://localhost:5000/api/...` requests are working

### 3. **Verify What You Should See**
You should see in the header:
- **Top-right corner**: "Sign In" and "Get Started" buttons
- **If you don't see these**, there might be a component loading issue

## 🚨 Common Issues & Fixes

### **Issue 1: Components Not Loading**
```bash
# Stop the dev server (Ctrl+C) and restart:
npm run dev
```

### **Issue 2: Auth Context Error** 
Look for errors in console like:
- "useAuth must be used within AuthProvider"
- "Cannot read properties of undefined"

### **Issue 3: API Connection Issues**
Check console for:
- "Failed to fetch"
- "Network Error"
- CORS errors

### **Issue 4: Environment Variables**
Make sure your `.env.local` has:
```
VITE_API_URL=http://localhost:5000/api
```

## 🔧 Quick Fixes

### **Fix 1: Restart Everything**
```bash
# Terminal 1 (Frontend):
# Press Ctrl+C, then:
npm run dev

# Terminal 2 (Backend):
# Press Ctrl+C, then:
cd backend
npm run dev
```

### **Fix 2: Clear Browser Cache**
1. Press `Ctrl+Shift+R` (hard refresh)
2. Or go to Developer Tools → Application → Storage → Clear All

### **Fix 3: Check Component Rendering**
In the browser console, type:
```javascript
// This should return the AuthProvider element
document.querySelector('[data-auth-provider]')
```

## 📋 Debug Checklist

Please check these and let me know what you find:

- [ ] Do you see "Sign In" and "Get Started" buttons in the header?
- [ ] Are there any red errors in the browser console?
- [ ] Are there any failed network requests in the Network tab?
- [ ] Does the page show the Korean learning content (vocabulary, etc.)?
- [ ] Can you see your username/avatar if you're logged in?

## 🎯 What Should Happen

1. **First Visit**: You should see "Sign In" and "Get Started" buttons
2. **Click "Get Started"**: Registration modal should open
3. **Click "Sign In"**: Login modal should open
4. **After Login**: Should see user avatar/menu instead of login buttons

Let me know what you see in the browser console! 🔍
