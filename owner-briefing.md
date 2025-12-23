# Zero Waste Frankfurt - Project Summary for Owner

## What We're Building

An interactive map website to help people find zero-waste and sustainable shops in Frankfurt.

**Think of it as:** A custom-built, ad-free alternative to Google Maps - specifically designed for the zero-waste community.

---

## Why Move Away from Google Maps?

| Current (Google My Maps) | New Solution |
|--------------------------|--------------|
| Limited customization | Fully branded to Zero Waste Frankfurt |
| Google controls the data | You own all the data |
| Can't accept community submissions | Users can submit new locations |
| No moderation tools | You approve what goes on the map |
| Dependent on Google's pricing | Predictable, low costs (~€5-70/month) |

---

## What Users Will Be Able To Do

### All Visitors (No Account Needed)
- View the interactive map
- Filter by category (bulk shops, repair cafés, etc.)
- Search for locations by name or address
- Find locations near them ("Near Me" feature)
- View location details (address, hours, website, etc.)
- Switch between German and English

### Registered Users (!! not needed)
- Submit new locations for review
- Track the status of their submissions
- !! when new users see a new shop (not owner) should be able to register

### Admins (You + Trusted Team)
- Approve or reject submitted locations
- Edit any location's information
- See dashboard with statistics

---

## Timeline Overview

The project is split into 7 phases. Each phase produces something usable:

| Phase | What Gets Built | You'll See |
|-------|-----------------|------------|
| 1 | Foundation | Empty map, database ready |
| 2 | Map + Locations | Locations appear on map |
| 3 | Filters + Search | Users can filter and search |
| 4 | User Accounts | Users can register and submit |
| 5 | Admin Panel | You can moderate submissions |
| 6 | Go Live | Website is publicly accessible |
| 7 | Polish | Final touches, ready for launch |

---

## Estimated Costs

### Monthly Running Costs

| Stage | Monthly Cost | What's Included |
|-------|--------------|-----------------|
| **MVP Launch** | ~€5/month | Handles thousands of visitors |
| **Growth (Germany-wide)** | ~€70/month | 50,000+ locations, heavy traffic |

### One-Time Costs
- Domain: Already owned
- Development: [Your arrangement]
- Supabase: Free tier to start

---

## What We Need From You

### 1. Categories (Required Before We Start)

We need to define the categories for the map. Here are suggestions based on typical zero-waste maps:

**Proposed Categories:**
- [ ] Unverpackt-Läden (Bulk/Package-free shops)
- [ ] Second-Hand Läden (Second-hand stores)
- [ ] Repair-Cafés (Repair cafes)
- [ ] Bio & Regional (Organic & local food)
- [ ] Zero-Waste Gastronomie (Restaurants/Cafés)
- [ ] Nachhaltige Mode (Sustainable fashion)
- [ ] Leihläden (Sharing/lending libraries)
- [ ] Andere (Other)

**Questions:**
- Are these categories correct?
- Do you want to add or remove any?
- Should a shop be able to have multiple categories? (e.g., a shop that is both bulk AND organic) → **We recommend: Yes**

---

### 2. Existing Data

**Questions:**
- How many locations are currently on the Google Map? (rough number)
- Can you export the data, or should we extract it?
- Do all locations have descriptions in both German AND English?
- Who originally added these locations? (you, community, businesses?)

---

### 3. Admin Access

**Questions:**
- Who will be the initial admin(s)? (email addresses)
- How many people need admin access?
- What should the approval criteria be? (What makes a location eligible?)
  - Must be a physical location?
  - Must have some zero-waste aspect?
  - Must be currently open/operating?

---

### 4. Moderation Expectations

**Questions:**
- How many new location submissions do you expect per week?
- Should users need to verify their email before submitting?
- What happens if a business closes permanently?
- Who will review submissions? (Just you? A team?)

---

### 5. Languages

**Questions:**
- Should the website default to German or detect browser language?
- Who will translate submissions that only come in one language?
- Future: Any other languages planned? (Turkish, Arabic, etc.)

---

### 6. Branding

**Questions:**
- What is the exact domain name? (e.g., map.zerowaste-frankfurt.de)
- Do you have brand guidelines? (colors, logo, fonts)
- Do you have a logo in high resolution (PNG or SVG)?
- Do you have images for social media previews?

---

### 7. Legal / Privacy

**Questions:**
- Do you have a privacy policy (Datenschutzerklärung)?
- Do you have an imprint (Impressum)?
- Should we include cookie consent? (We can avoid it with privacy-friendly setup)

---

### 8. Future Plans (Not for MVP, Just to Know)

**Questions:**
- Do you want businesses to be able to "claim" their listing and edit it themselves?
- Should users be able to save favorite locations?
- Any partner websites that might want to embed the map?
- Interest in expanding beyond Frankfurt? (When? Where?)

---

## Decisions Already Made

| Decision | Choice | Why |
|----------|--------|-----|
| Map tiles | OpenStreetMap | Free, no Google dependency |
| Database | Supabase (PostgreSQL) | Modern, secure, scalable |
| Hosting | AWS (S3 + CloudFront) | Reliable, fast, cost-effective |
| Languages | German + English | Can add more later |
| User submissions | With email verification | Reduces spam |
| Multi-category | Yes | A shop can be both "Bulk" and "Organic" |

---

## Next Steps

1. **You review this document** and answer the questions
2. **We finalize categories** together
3. **You provide branding assets** (logo, colors)
4. **Development begins** (Phase 1)
5. **Regular check-ins** at each phase completion

---

## Questions?

Feel free to ask about anything unclear. The goal is to build exactly what you need - no surprises.
