# 🚀 Supabase Database Setup Guide

## ✅ **Step 1: Open Your Supabase Dashboard**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click on your project: **jnvbqcaweufmfswpnacv**

## ✅ **Step 2: Open SQL Editor**

1. In the left sidebar, click **SQL Editor**
2. Click **New Query** (or the "+" button)

## ✅ **Step 3: Copy and Paste the Schema**

1. **Copy the entire contents** of the `supabase-schema.sql` file
2. **Paste it** into the SQL Editor
3. Click **Run** (or press Ctrl+Enter)

## ✅ **Step 4: Enable Realtime**

1. Go to **Database → Replication** in the left sidebar
2. Enable realtime for these tables:
   - ✅ `users`
   - ✅ `avatars` 
   - ✅ `chat_messages`
   - ✅ `world_states`
   - ✅ `user_sessions`

## ✅ **Step 5: Verify Setup**

1. Go to **Database → Tables** in the left sidebar
2. You should see these tables:
   - `users`
   - `avatars`
   - `chat_messages`
   - `world_states`
   - `user_sessions`

## 🎉 **You're Done!**

Your Supabase database is now ready for your metaverse application!

---

## 📋 **Quick Copy-Paste Instructions:**

### **For SQL Editor:**
1. Open `supabase-schema.sql` in your project
2. Select all content (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Supabase SQL Editor
5. Click Run

### **For Realtime:**
1. Database → Replication
2. Toggle ON for all 5 tables listed above

---

## 🔧 **Troubleshooting:**

**If you get errors:**
- Make sure you're in the correct project
- Try running the SQL in smaller chunks
- Check that you have admin permissions

**Need help?**
- The SQL is designed to be safe and won't overwrite existing data
- All tables use `IF NOT EXISTS` so they won't conflict

---

## 🚀 **Next Steps:**

Once the database is set up, your metaverse app will be ready to use Supabase instead of Socket.IO, eliminating all CORS issues! 