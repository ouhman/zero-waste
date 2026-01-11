# Zero Waste Impact Scoring System

**Proposal Draft v1.0** | January 2026

---

## Goal

Create a fair, mostly automated scoring system that highlights locations with the highest zero waste impact, while remaining inclusive of all sustainable businesses.

**Principle**: Positive reinforcement — reward good practices, don't penalize.

---

## Scoring Formula

```
Final Score = Base Tier + Practice Bonuses + Admin Adjustment
```

| Component | Source | Range |
|-----------|--------|-------|
| Base Tier | Category (automatic) | 1-5 points |
| Practice Bonuses | User submission (checkboxes) | 0-2 points |
| Admin Adjustment | Manual override | -2 to +2 points |

**Final Score Range**: 1-7 points

---

## Base Tier by Category (Automatic)

Assigned automatically when category is selected. No manual work.

| Tier | Points | Categories |
|------|--------|------------|
| **1** | 5 pts | Teilen & Tauschen, Repair-Cafés |
| **2** | 4 pts | Unverpackt, Milchtankstellen, Trinkwasser |
| **3** | 3 pts | Second-Hand, Flohmärkte, Nachhaltige Mode |
| **4** | 2 pts | Feinkost, Bäckereien, Wochenmärkte, Hofläden, Haushalt & Pflege |
| **5** | 1 pt | Bio & Regional, Gastronomie, Übernachten, Andere |

**Multi-category rule**: Highest tier wins (e.g., Bio + Unverpackt = Tier 2).

---

## Practice Bonuses (User Submission)

Optional checkboxes shown during location submission. Each adds **+0.5 points**.

| Practice | Description |
|----------|-------------|
| Bring your own container | Accepts customer containers for products/takeaway |
| Package-free options | Offers products without packaging |
| Refill station | Customers can refill bottles/containers |
| Community-run | Volunteer-operated, nonprofit, or solidarity-based |
| Repair services | Fixes items to extend their lifespan |

**Maximum bonus**: +2.5 points (all 5 checked)

*Note: Practices are self-reported by submitter, verified by admin during approval.*

---

## Admin Controls

During location approval/editing, admin can:

| Field | Purpose |
|-------|---------|
| **Verify practices** | Confirm or uncheck user-claimed practices |
| **Score adjustment** | Manual +/- adjustment (-2 to +2) |
| **Adjustment reason** | Text field explaining override (internal) |

---

## Display Tiers (User-Facing)

Translate numeric score to simple visual tiers:

| Score | Display | Icon Treatment |
|-------|---------|----------------|
| 6-7 | 🌟 **Vorbildlich** (Exemplary) | Highlighted, larger marker |
| 4-5 | 🌿 **Nachhaltig** (Sustainable) | Standard marker |
| 2-3 | 🌱 **Auf dem Weg** (On the way) | Standard marker |
| 1 | — (no label) | Standard marker |

All locations appear on map. Higher tiers get visual prominence, not exclusion.

---

## Example Calculations

| Location | Category | Base | Practices | Admin Adj. | Final | Display |
|----------|----------|------|-----------|------------|-------|---------|
| Teilerei FFM | Teilen & Tauschen | 5 | +1.0 (community, package-free) | — | **6.0** | 🌟 Vorbildlich |
| Die Auffüllerei | Unverpackt | 4 | +1.0 (refill, bring container) | — | **5.0** | 🌿 Nachhaltig |
| Repair Café Bornheim | Repair-Cafés | 5 | +0.5 (community) | — | **5.5** | 🌿 Nachhaltig |
| Local Bakery | Bäckereien | 2 | +0.5 (bring container) | — | **2.5** | 🌱 Auf dem Weg |
| Alnatura | Bio & Regional | 1 | — | — | **1.0** | — |
| Exceptional Restaurant | Gastronomie | 1 | +1.5 (container, package-free, community) | +1 | **3.5** | 🌱 Auf dem Weg |

---

## Database Changes

```sql
-- Categories table
ALTER TABLE categories ADD COLUMN base_tier INTEGER DEFAULT 5;

-- Locations table
ALTER TABLE locations ADD COLUMN practices JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN score_adjustment INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN adjustment_reason TEXT;
ALTER TABLE locations ADD COLUMN calculated_score DECIMAL(3,1);
```

---

## Implementation Phases

**Phase 1**: Add tier column to categories, assign base tiers

**Phase 2**: Add practice checkboxes to submission form

**Phase 3**: Add score fields to admin panel

**Phase 4**: Update map display with tier-based styling

---

## Summary

- **Automatic**: 80% of scoring handled by category selection
- **User input**: Optional practice checkboxes enrich the score
- **Admin control**: Final override capability for edge cases
- **Inclusive**: All locations displayed; higher impact = more prominence
- **Minimal maintenance**: System runs itself after initial setup
