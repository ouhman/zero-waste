# Phase 1 Quick Start Guide

## 🎯 Goal
Create Bücherschrank category in Supabase database

## ⚡ 2-Minute Setup

### Step 1: Open Supabase SQL Editor
https://supabase.com/dashboard/project/lccpndhssuemudzpfvvg/sql/new

### Step 2: Run This SQL

```sql
INSERT INTO categories (
  slug, name_de, name_en, icon, color,
  description_de, description_en, sort_order
)
SELECT
  'buecherschrank',
  'Bücherschrank',
  'Public Bookcase',
  '📚',
  '#8B4513',
  'Offene Bücherschränke zum kostenlosen Tauschen und Ausleihen von Büchern',
  'Public bookcases for free book exchange',
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'buecherschrank'
)
RETURNING *;
```

### Step 3: Save Category ID

Copy the `id` value from the results (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Step 4: Verify

```bash
cd /home/ouhman/projects/zerowaste-frankfurt
npx ts-node scripts/create-buecherschrank-category.ts
```

Should output: `✅ Phase 1 Complete - Category Verified`

## 📋 Expected Result

```
✅ Category created successfully!

Category Details:
  ID: [SAVE THIS ID]
  Slug: buecherschrank
  Name (DE): Bücherschrank
  Name (EN): Public Bookcase
  Icon: 📚
  Color: #8B4513
```

## ✅ Done!

Proceed to Phase 2: Data Extraction

---

**Full Documentation:**
- `docs/plans/PHASE-1-EXECUTION-SUMMARY.md` - Complete details
- `docs/plans/phase-1-category-setup.md` - Reference guide
- `scripts/create-buecherschrank-category.sql` - Full SQL script
