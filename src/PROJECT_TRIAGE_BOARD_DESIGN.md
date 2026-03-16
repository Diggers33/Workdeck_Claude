# Project Triage Board - Complete Design Specification

## Overview
The Project Triage Board is a comprehensive table-based project management view displaying projects with alert indicators, progress tracking, timeline information, and next activities. It features a search bar, scope selector, filter chips, alert badge tooltips, hover-reveal Gantt buttons, and action menus. The table uses a 5-column grid layout with 88px minimum row height and rich hover interactions.

---

## Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│ [🔍 Search...]  [Mine ▾]                  [+ New Project]    │ ← Header bar
├──────────────────────────────────────────────────────────────┤
│ Showing: Charlie Day's Projects (12)    10 Active Projects   │ ← Context line
├──────────────────────────────────────────────────────────────┤
│ [All 12] [Urgent 4] [Watch List 0] [Completed 2] [By Client▾]│ ← Filter chips
├──────────────────────────────────────────────────────────────┤
│ ALERT  PROJECT CONTEXT   TIMELINE & PROGRESS  NEXT ACTIVITY  │ ← Table header
├──────────────────────────────────────────────────────────────┤
│  (3)   BIOGEMSE ↗        Feb'24 - Aug'24     Client review  │
│        EU • Charlie Day  ━━━━░░░░░░░░░░░░░   ⚠️ Tomorrow    │ ← Row 1
│        [Retainer]        30% • 476d overdue                   │
├──────────────────────────────────────────────────────────────┤
│  (5)   OCEAN-CLEAN-X ↘   Jan'24 - Dec'24     Budget approval│
│        Global NGO...     ━░░░░░░░░░░░░░░░░   📅 in 3d       │ ← Row 2
│        [Fixed Bid]       15% • 324d overdue                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. TOP HEADER BAR

### Container
- **Background:** White
- **Padding:** 20px
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Space-between

---

## 2. SEARCH BAR

### Search Input Container
- **Element:** `<div>`
- **Position:** Relative
- **Flex:** `1`
- **Max Width:** `400px`

### Search Icon
- **Component:** `<Search>` from lucide-react
- **Position:** `absolute`
- **Left:** `12px`
- **Top:** `50%`
- **Transform:** `translateY(-50%)`
- **Size:** `16px × 16px`
- **Color:** `#9CA3AF` (Gray 400)
- **Z-Index:** `1`

### Search Input Field
- **Element:** `<input type="text">`
- **Height:** `40px`
- **Width:** `100%`
- **Padding:** `0 40px` (left padding for icon)
- **Background:** `#F9FAFB` (Gray 50)
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `8px`
- **Font Size:** `14px`
- **Color:** `#0A0A0A` (near black)
- **Placeholder:** "Search projects, tasks, or people..."
- **Placeholder Color:** `#9CA3AF` (Gray 400)

### Focus State
- **Border Color:** `#60A5FA` (Blue 400)
- **Outline:** None
- **Transition:** `border 150ms ease`

### Visual
```
┌──────────────────────────────┐
│ 🔍 Search projects, tasks... │
└──────────────────────────────┘
  400px max-width, 40px height
  Gray 50 background
```

---

## 3. SCOPE DROPDOWN

### Dropdown Button
- **Element:** `<button>`
- **Position:** Relative
- **Height:** `40px`
- **Min Width:** `120px`
- **Padding:** `0 16px`
- **Background:** White
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `8px`
- **Font Size:** `14px`
- **Font Weight:** `500` (medium)
- **Color:** `#0A0A0A` (near black)
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Space-between
- **Gap:** `8px`
- **Cursor:** `pointer`
- **Transition:** `all 150ms ease`

### Hover State
- **Background:** `#F9FAFB` (Gray 50)
- **Border Color:** `#D1D5DB` (Gray 300)

### Active State (Open)
- **Border Color:** `#60A5FA` (Blue 400)
- **Box Shadow:** `0 0 0 3px rgba(96, 165, 250, 0.1)`

### ChevronDown Icon
- **Size:** `16px × 16px`
- **Color:** `#6B7280` (Gray 500)

### Visual
```
┌────────────┐
│ Mine    ▾  │ ← Selected scope
└────────────┘
  120px min-width
```

---

## 4. SCOPE DROPDOWN MENU

### Menu Container
- **Position:** `absolute`
- **Top:** `48px` (below button)
- **Right:** `0`
- **Min Width:** `200px`
- **Background:** White
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `8px`
- **Box Shadow:** `0 4px 16px rgba(0, 0, 0, 0.12)`
- **Padding:** `8px`
- **Z-Index:** `50`
- **Animation:** `menuSlideIn 200ms ease-out`

### Backdrop
- **Position:** Fixed
- **Inset:** `0` (full screen)
- **Z-Index:** `40`
- **Click:** Closes menu

### Menu Items
- **Options:** 'Mine', 'Team', 'Department', 'Company'
- **Format:** Label + Count in parentheses

### Menu Item Button
- **Width:** `100%`
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Space-between
- **Padding:** `8px 12px 8px 26px`
- **Background:** Transparent (default)
- **Border:** None
- **Cursor:** `pointer`
- **Border Radius:** `6px`
- **Transition:** `background 150ms ease`

### Selected Item
- **Background:** `#EFF6FF` (Blue 50)
- **Font Weight:** `500` (medium)
- **Color:** `#0A0A0A` (near black)
- **Indicator:** 6px blue dot at left (`marginLeft: -18px`)

### Non-Selected Item
- **Background:** Transparent
- **Font Weight:** `400` (regular)
- **Color:** `#6B7280` (Gray 500)

### Hover State (Non-Selected)
- **Background:** `#F9FAFB` (Gray 50)

### Item Structure
```
┌──────────────────────┐
│ ● Mine          (12) │ ← Selected (blue dot, blue bg)
├──────────────────────┤
│   Team          (43) │ ← Hover (gray bg)
├──────────────────────┤
│   Department    (87) │
├──────────────────────┤
│   Company      (180) │
└──────────────────────┘
  200px min-width
```

### Count Badge
- **Font Size:** `14px`
- **Font Weight:** `400` (regular)
- **Color (selected):** `#6B7280` (Gray 500)
- **Color (default):** `#9CA3AF` (Gray 400)

---

## 5. NEW PROJECT BUTTON

### Button
- **Element:** `<button>`
- **Width:** `140px`
- **Height:** `40px`
- **Background:** `#60A5FA` (Blue 400)
- **Color:** White
- **Font Size:** `14px`
- **Font Weight:** `500` (medium)
- **Border Radius:** `8px`
- **Border:** None
- **Cursor:** `pointer`
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Center
- **Gap:** `6px`

### Plus Icon
- **Component:** `<Plus>` from lucide-react
- **Size:** `16px × 16px`
- **Color:** White

### Hover State
- **Background:** `#3B82F6` (Blue 500)
- **Transform:** `translateY(-1px)`
- **Box Shadow:** `0 4px 12px rgba(96, 165, 250, 0.4)`

### Visual
```
┌──────────────────┐
│ + New Project    │ ← Blue button
└──────────────────┘
  140px width, 40px height
```

---

## 6. CONTEXT LINE

### Container
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Space-between
- **Margin Top:** `12px`
- **Padding:** `0 20px`

### Left Text
- **Font Size:** `14px`
- **Font Weight:** `400` (regular)
- **Color:** `#6B7280` (Gray 500)
- **Text:** "Showing: Charlie Day's Projects (12)"

### Right Text
- **Font Size:** `14px`
- **Font Weight:** `400` (regular)
- **Color:** `#6B7280` (Gray 500)
- **Text:** "10 Active Projects"

### Visual
```
Showing: Charlie Day's Projects (12)    10 Active Projects
         ↓                                       ↓
     14px Gray 500                          14px Gray 500
```

---

## 7. FILTER CHIPS ROW

### Container
- **Display:** Flex
- **Align Items:** Center
- **Gap:** `8px`
- **Margin Top:** `12px`
- **Margin Bottom:** `24px`

---

## 8. FILTER CHIP DESIGN

### Chip Button (Active)
- **Height:** `36px`
- **Padding:** `0 16px`
- **Border Radius:** `18px` (fully rounded pill)
- **Border:** None
- **Background:** `#60A5FA` (Blue 400)
- **Color:** White
- **Font Size:** `14px`
- **Font Weight:** `500` (medium)
- **Cursor:** `pointer`
- **Display:** Flex
- **Align Items:** Center
- **Gap:** `8px`
- **White Space:** `nowrap`

### Chip Button (Inactive)
- **Height:** `36px`
- **Padding:** `0 16px`
- **Border Radius:** `18px`
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Background:** White
- **Color:** `#6B7280` (Gray 500)
- **Font Size:** `14px`
- **Font Weight:** `500` (medium)
- **Cursor:** `pointer`
- **Display:** Flex
- **Align Items:** Center
- **Gap:** `8px`
- **White Space:** `nowrap`

### Count Badge (Active Chip)
- **Background:** `rgba(255, 255, 255, 0.3)` (30% white)
- **Color:** White
- **Padding:** `2px 8px`
- **Border Radius:** `10px`
- **Font Size:** `12px`
- **Font Weight:** `600` (semibold)
- **Min Width:** `20px`
- **Text Align:** Center

### Count Badge (Inactive Chip)
- **Background:** `#F3F4F6` (Gray 100)
- **Color:** `#6B7280` (Gray 500)
- **Padding:** `2px 8px`
- **Border Radius:** `10px`
- **Font Size:** `12px`
- **Font Weight:** `600` (semibold)
- **Min Width:** `20px`
- **Text Align:** Center

### Visual Examples
```
Active chip:
┌───────────┐
│ All  [12] │ ← Blue background, white text, 30% white badge
└───────────┘

Inactive chip:
┌─────────────────┐
│ Urgent  [4]     │ ← White background, gray text, gray badge
└─────────────────┘
```

### Filter Options
1. **All** - Count: 12, Active: true
2. **Urgent** - Count: 4, Active: false
3. **Watch List** - Count: 0, Active: false
4. **Completed** - Count: 2, Active: false

---

## 9. "BY CLIENT" DROPDOWN CHIP

### Button
- **Height:** `36px`
- **Padding:** `0 16px`
- **Border Radius:** `18px`
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Background:** White
- **Color:** `#6B7280` (Gray 500)
- **Font Size:** `14px`
- **Font Weight:** `500` (medium)
- **Cursor:** `pointer`
- **Display:** Flex
- **Align Items:** Center
- **Gap:** `6px`

### ChevronDown Icon
- **Size:** `12px × 12px`
- **Color:** `#6B7280` (Gray 500)

### Visual
```
┌──────────────┐
│ By Client ▾  │ ← Dropdown chip (same style as inactive)
└──────────────┘
```

---

## 10. TABLE CONTAINER

### Container
- **Background:** White
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `8px`
- **Box Shadow:** `0 2px 8px rgba(0,0,0,0.1)`
- **Overflow:** `hidden`

---

## 11. TABLE HEADER

### Header Container
- **Height:** `48px` (fixed)
- **Background:** `#F9FAFB` (Gray 50)
- **Display:** Grid
- **Grid Template Columns:** `60px 400px 280px 220px 160px`
- **Align Items:** Center
- **Padding:** `0 40px`

### Column Headings
- **Font Size:** `11px`
- **Font Weight:** `500` (medium)
- **Color:** `#6B7280` (Gray 500)
- **Letter Spacing:** `0.5px`
- **Text Transform:** `uppercase`

### Column Labels
1. **ALERT** - 60px width
2. **PROJECT CONTEXT** - 400px width
3. **TIMELINE & PROGRESS** - 280px width
4. **NEXT ACTIVITY** - 220px width
5. **ACTION** - 160px width (right-aligned)

### Visual
```
┌──────┬───────────────┬──────────────┬─────────────┬────────┐
│ALERT │PROJECT CONTEXT│TIMELINE &...│NEXT ACTIVITY│ ACTION │
└──────┴───────────────┴──────────────┴─────────────┴────────┘
  60px    400px           280px          220px        160px
  All uppercase, 11px medium, Gray 500, 0.5px tracking
```

---

## 12. PROJECT ROW STRUCTURE

### Row Container
- **Min Height:** `88px`
- **Display:** Grid
- **Grid Template Columns:** `60px 400px 280px 220px 160px`
- **Align Items:** `start`
- **Padding:** `20px 40px`
- **Border Bottom:** `1px solid #F3F4F6` (Gray 100)
- **Background (default):** White
- **Background (hover):** `#FAFAFA` (very light gray)
- **Box Shadow (default):** None
- **Box Shadow (hover):** `0 2px 12px rgba(0,0,0,0.08)`
- **Transition:** `all 200ms ease`
- **Cursor:** `pointer`
- **Position:** `relative`

### Row Layout
```
┌─────┬──────────────┬──────────────┬─────────────┬────────┐
│ (3) │ BIOGEMSE ↗   │ Feb'24...    │ Client...   │ ⋮  →  │
│     │ EU • Char... │ ━━━░░░░░░░░  │ ⚠️ Tomor... │        │
│     │ [Retainer]   │ 30% • 476d...│             │        │
└─────┴──────────────┴──────────────┴─────────────┴────────┘
  88px min-height, 20px padding vertical
  Hover: #FAFAFA background + shadow
```

---

## 13. COLUMN 1: ALERT ZONE (60px)

### Container
- **Display:** Flex Flex-col
- **Align Items:** Center
- **Justify Content:** Center
- **Gap:** `8px`
- **Position:** `relative`

### Alert Badge (Flag Count)
- **Width:** `36px`
- **Height:** `36px`
- **Border Radius:** `50%` (perfect circle)
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Center
- **Font Size:** `16px`
- **Font Weight:** `700` (bold)
- **Transition:** `transform 150ms ease`

### Alert Badge Colors by Severity

| Flag Count | Background | Text Color | Description |
|------------|------------|------------|-------------|
| **3** | `#FEE2E2` (Red 100) | `#F87171` (Red 400) | Critical |
| **5** | `#FEE2E2` (Red 100) | `#F87171` (Red 400) | Critical |
| **8** | `#FED7AA` (Orange 200) | `#FB923D` (Orange 400) | High |
| **12** | `#FED7AA` (Orange 200) | `#FB923D` (Orange 400) | High |

### Hover State
- **Transform:** `scale(1.05)`
- **Transition:** `transform 150ms ease`

### Visual Examples
```
Critical (Red):
┌─────┐
│ (3) │ ← Red 100 bg, Red 400 text, 36px circle
└─────┘

High (Orange):
┌─────┐
│ (8) │ ← Orange 200 bg, Orange 400 text, 36px circle
└─────┘
```

---

## 14. ALERT BREAKDOWN TOOLTIP

### Tooltip Container
- **Position:** `absolute`
- **Top:** `46px` (below badge)
- **Left:** `50%`
- **Margin Left:** `-100px` (center)
- **Width:** `200px`
- **Background:** White
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `8px`
- **Box Shadow:** `0 4px 16px rgba(0,0,0,0.15)`
- **Padding:** `12px`
- **Z-Index:** `100`
- **Animation:** `tooltipFadeIn 150ms ease-out`
- **Pointer Events:** `none` (doesn't block clicks)

### Tooltip Title
- **Font Size:** `12px`
- **Font Weight:** `600` (semibold)
- **Color:** `#0A0A0A` (near black)
- **Margin Bottom:** `8px`
- **Text:** "Alert Breakdown"

### Breakdown Item
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Space-between
- **Padding:** `4px 0`
- **Border Bottom:** `1px solid #F3F4F6` (not on last item)

### Item Label
- **Font Size:** `13px`
- **Color:** `#6B7280` (Gray 500)

### Item Count
- **Font Size:** `13px`
- **Font Weight:** `600` (semibold)
- **Color:** `#0A0A0A` (near black)
- **Min Width:** `20px`
- **Text Align:** `right`

### Visual
```
┌──────────────────────┐
│ Alert Breakdown      │ ← 12px bold title
├──────────────────────┤
│ Budget overrun    2  │
├──────────────────────┤
│ Resource conflict 1  │
└──────────────────────┘
  200px width, appears on badge hover
  13px labels + counts
```

### Sample Breakdowns
**BIOGEMSE (3 alerts):**
- Budget overrun: 2
- Resource conflict: 1

**OCEAN-CLEAN-X (5 alerts):**
- Schedule delays: 3
- Pending approvals: 2

**SUSALGAEFUEL (8 alerts):**
- Dependencies blocked: 4
- Scope changes: 3
- Risk identified: 1

---

## 15. COLUMN 2: PROJECT CONTEXT (400px)

### Container
- **Padding Left:** `20px`

### Flex Column Container
- **Display:** Flex Flex-col
- **Gap:** `4px`

---

## 16. LINE 1: PROJECT NAME + TREND

### Container
- **Display:** Flex
- **Align Items:** Center
- **Gap:** `8px`

### Project Name
- **Font Size:** `16px`
- **Font Weight:** `600` (semibold)
- **Color:** `#0A0A0A` (near black)
- **Examples:** "BIOGEMSE", "OCEAN-CLEAN-X", "SUSALGAEFUEL", "AGRIMAX"

### Trend Arrow
- **Font Size:** `14px`
- **Color:** Dynamic (based on trend)
- **Characters:** "↗" (up), "↘" (down), "→" (stable)

### Trend Colors
| Trend | Arrow | Color | Hex |
|-------|-------|-------|-----|
| **Up** | ↗ | Green | `#34D399` (Emerald 400) |
| **Down** | ↘ | Red | `#F87171` (Red 400) |
| **Stable** | → | Gray | `#9CA3AF` (Gray 400) |

### Visual
```
BIOGEMSE ↗           ← 16px bold + 14px green arrow
OCEAN-CLEAN-X ↘      ← 16px bold + 14px red arrow
SUSALGAEFUEL ↘       ← 16px bold + 14px red arrow
```

---

## 17. LINE 2: CLIENT + OWNER

### Text Element
- **Font Size:** `14px`
- **Font Weight:** `400` (regular)
- **Color:** `#6B7280` (Gray 500)
- **Format:** `{Client} • {Owner}`

### Examples
- "EU • Charlie Day"
- "Global NGO • Charlie Day"
- "Green Energy Corp • Bob Ross"
- "European Commission • John Doe"

### Bullet Separator
- **Character:** `•` (middle dot)
- **Spacing:** Space before and after

---

## 18. LINE 3: PROJECT BADGE

### Badge Element
- **Display:** `inline-block`
- **Padding:** `2px 8px`
- **Background:** `#F3F4F6` (Gray 100)
- **Color:** `#6B7280` (Gray 500)
- **Font Size:** `11px`
- **Font Weight:** `500` (medium)
- **Border Radius:** `10px`

### Badge Types
- "Retainer"
- "Fixed Bid"
- "T&M" (Time & Materials)

### Visual
```
[Retainer]  ← 11px medium, Gray 500 on Gray 100
[Fixed Bid] ← Small rounded pill
```

---

## 19. COLUMN 3: TIMELINE & PROGRESS (280px)

### Container
- **Padding Left:** `0`

### Flex Column Container
- **Display:** Flex Flex-col
- **Gap:** `4px`

---

## 20. LINE 1: DATE RANGE + DURATION

### Text Element
- **Font Size:** `14px`
- **Font Variant Numeric:** `tabular-nums` (monospaced numbers)
- **Color:** `#6B7280` (Gray 500)
- **Format:** `{Start} - {End} • {Duration}`

### Examples
- "Feb'24 - Aug'24 • 6mo"
- "Jan'24 - Dec'24 • 11mo"
- "Nov'23 - Jun'25 • 19mo"
- "Jun'23 - Dec'25 • 30mo"

### Date Format
- **Pattern:** `{Month abbrev}'{Year last 2 digits}`
- **Examples:** "Feb'24", "Aug'24", "Dec'25"

### Duration Format
- **Pattern:** `{Number}{unit}`
- **Examples:** "6mo", "11mo", "19mo", "30mo"

---

## 21. LINE 2: PROGRESS BAR

### Progress Track (Background)
- **Width:** `100%`
- **Max Width:** `260px`
- **Height:** `4px`
- **Background:** `#F0F0F0` (very light gray)
- **Border Radius:** `2px`
- **Overflow:** `hidden`

### Progress Fill (Foreground)
- **Height:** `100%`
- **Width:** `{progress}%` (dynamic)
- **Border Radius:** `2px`
- **Transition:** `width 1s ease-out`

### Progress Colors by Status

| Status | Color | Hex | Description |
|--------|-------|-----|-------------|
| **Critical** | Red 400 | `#F87171` | Red progress bar |
| **At Risk** | Orange 400 | `#FB923D` | Orange progress bar |
| **On Track** | Green 400 | `#34D399` | Green progress bar |
| **Delayed** | Amber 400 | `#FBBF24` | Amber progress bar |

### Visual Examples
```
Critical (30%):
━━━░░░░░░░░░░░░░░ ← Red fill, gray track

At Risk (15%):
━░░░░░░░░░░░░░░░░ ← Orange fill, gray track

Warning (52%):
━━━━━━━━━░░░░░░░░ ← Orange fill, gray track
```

---

## 22. LINE 3: STATUS TEXT

### Text Element
- **Font Size:** `13px`
- **Font Weight:** `500` (medium)
- **Color:** Dynamic (matches progress color)

### Format
- **Pattern:** `{Percentage}% • {Status text}`

### Examples
- "30% • 476d overdue" (Red color)
- "15% • 324d overdue" (Red color)
- "52% • 143d overdue" (Orange color)
- "45% • At risk" (Orange color)

### Status Text Types
| Type | Example | Color |
|------|---------|-------|
| **Critical Overdue** | "476d overdue" | Red (#F87171) |
| **Overdue** | "324d overdue" | Red (#F87171) |
| **At Risk** | "At risk" | Orange (#FB923D) |
| **On Track** | "On track" | Green (#34D399) |

---

## 23. COLUMN 4: NEXT ACTIVITY (220px)

### Container
- **Padding Left:** `20px`

### Flex Column Container
- **Display:** Flex Flex-col
- **Gap:** `4px`

---

## 24. LINE 1: ACTIVITY NAME

### Text Element
- **Font Size:** `14px`
- **Font Weight:** `500` (medium)
- **Color:** `#0A0A0A` (near black)

### Examples
- "Client review"
- "Budget approval"
- "Phase kickoff"
- "Milestone delivery"

---

## 25. LINE 2: TIME WITH ICON

### Container
- **Font Size:** `13px`
- **Font Weight:** Dynamic (400 or 600)
- **Color:** Dynamic (based on urgency)

### Icon (Emoji)
- **Margin Right:** `4px`
- **Font Size:** `14px`

### Format
- **Pattern:** `{Emoji} {Time text}`

### Examples
- "⚠️ Tomorrow" (Red color, 600 weight)
- "📅 in 3d" (Orange color, 600 weight)
- "📅 in 1w" (Gray color, 400 weight)
- "📅 in 5d" (Orange color, 600 weight)

### Color & Weight by Urgency

| Time | Icon | Color | Weight | Description |
|------|------|-------|--------|-------------|
| **Tomorrow** | ⚠️ | Red (#F87171) | 600 | Critical urgency |
| **in 3d** | 📅 | Orange (#FB923D) | 600 | High urgency |
| **in 1w** | 📅 | Gray (#6B7280) | 400 | Normal |
| **in 5d** | 📅 | Orange (#FB923D) | 600 | High urgency |

---

## 26. COLUMN 5: ACTIONS (160px)

### Container
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** `flex-end` (right-aligned)
- **Gap:** `12px`
- **Padding Right:** `20px`

---

## 27. THREE-DOT MENU BUTTON

### Button
- **Width:** `32px`
- **Height:** `32px`
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `6px`
- **Background:** Transparent
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Center
- **Cursor:** `pointer`
- **Color:** `#9CA3AF` (Gray 400)
- **Position:** `relative`

### MoreVertical Icon
- **Component:** `<MoreVertical>` from lucide-react
- **Size:** `16px × 16px`
- **Color:** `#9CA3AF` (Gray 400)

### Hover State
- **Border Color:** `#D1D5DB` (Gray 300)
- **Background:** `#F9FAFB` (Gray 50)

### Visual
```
┌────┐
│ ⋮  │ ← Three vertical dots, 32px square
└────┘
  Gray border, gray icon
```

---

## 28. ACTION BUTTON (ARROW / GANTT)

### Default State (Arrow Icon)
- **Component:** `<ArrowRight>` from lucide-react
- **Size:** `16px × 16px`
- **Color:** `#9CA3AF` (Gray 400)
- **Display:** Always visible

### Hover State (Gantt Button)
- **Width:** `90px`
- **Height:** `32px`
- **Background:** `#60A5FA` (Blue 400)
- **Color:** White
- **Border:** None
- **Border Radius:** `6px`
- **Font Size:** `13px`
- **Font Weight:** `600` (semibold)
- **Cursor:** `pointer`
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Center
- **Gap:** `4px`
- **Animation:** `slideIn 200ms ease-out`

### Gantt Button Content
- **Text:** "Gantt"
- **Icon:** `<ArrowRight>` 14px × 14px

### Visual
```
Default:
→  ← Gray arrow icon

Hover row:
┌──────────┐
│ Gantt → │ ← Blue button with arrow
└──────────┘
  Animated slide-in
```

---

## 29. THREE-DOT MENU DROPDOWN

### Backdrop
- **Position:** Fixed
- **Inset:** `0` (full screen)
- **Z-Index:** `40`
- **Click:** Closes menu

### Menu Container
- **Position:** `absolute`
- **Top:** `60px`
- **Right:** `60px`
- **Width:** `200px`
- **Background:** White
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `8px`
- **Box Shadow:** `0 4px 12px rgba(0,0,0,0.12)`
- **Padding:** `8px`
- **Z-Index:** `50`
- **Animation:** `menuSlideIn 200ms ease-out`

### Menu Item Button
- **Width:** `100%`
- **Height:** `36px`
- **Display:** Flex
- **Align Items:** Center
- **Justify Content:** Space-between
- **Padding:** `8px 12px`
- **Background:** Transparent
- **Border:** None
- **Cursor:** `pointer`
- **Font Size:** `13px`
- **Font Weight:** `400` (regular)
- **Border Radius:** `6px`
- **Transition:** `background 150ms ease`

### Hover State
- **Background:** `#F9FAFB` (Gray 50)

### Menu Item Colors
- **Default:** `#0A0A0A` (near black)
- **Danger:** `#EF4444` (Red 500) for delete/archive

### Menu Separator
- **Height:** `1px`
- **Background:** `#E5E7EB` (Gray 200)
- **Margin:** `4px 0`

### Sample Menu Items
1. "View Details"
2. "Open Gantt"
3. "Edit Project"
4. --- (separator)
5. "Mark Complete"
6. "Add to Watch List"
7. --- (separator)
8. "Archive" (red text)

---

## 30. COLOR PALETTE

### Alert Badge Colors
| Severity | Background | Text | Flag Count |
|----------|------------|------|------------|
| **Critical** | Red 100 (#FEE2E2) | Red 400 (#F87171) | 3, 5 |
| **High** | Orange 200 (#FED7AA) | Orange 400 (#FB923D) | 8, 12 |
| **Medium** | Yellow 100 (#FEF3C7) | Yellow 600 (#D97706) | - |
| **Low** | Blue 100 (#DBEAFE) | Blue 600 (#2563EB) | - |

### Status Colors (Progress & Text)
| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Critical** | Red 400 | `#F87171` | Progress bar, status text, alert badges |
| **At Risk** | Orange 400 | `#FB923D` | Progress bar, status text, alert badges |
| **On Track** | Green 400 | `#34D399` | Progress bar, trend arrow |
| **Warning** | Amber 400 | `#FBBF24` | Progress bar |

### Trend Arrow Colors
| Trend | Color | Hex |
|-------|-------|-----|
| **Up** | Emerald 400 | `#34D399` |
| **Down** | Red 400 | `#F87171` |
| **Stable** | Gray 400 | `#9CA3AF` |

### Activity Time Colors
| Urgency | Color | Hex | Weight |
|---------|-------|-----|--------|
| **Critical** | Red 400 | `#F87171` | 600 |
| **High** | Orange 400 | `#FB923D` | 600 |
| **Normal** | Gray 500 | `#6B7280` | 400 |

### UI Element Colors
| Element | Color | Hex |
|---------|-------|-----|
| Primary Button | Blue 400 | `#60A5FA` |
| Primary Button Hover | Blue 500 | `#3B82F6` |
| Text (Primary) | Near Black | `#0A0A0A` |
| Text (Secondary) | Gray 500 | `#6B7280` |
| Text (Tertiary) | Gray 400 | `#9CA3AF` |
| Border | Gray 200 | `#E5E7EB` |
| Border (Light) | Gray 100 | `#F3F4F6` |
| Background | White | `#FFFFFF` |
| Background (Hover) | Very Light Gray | `#FAFAFA` |
| Background (Input) | Gray 50 | `#F9FAFB` |
| Badge Background | Gray 100 | `#F3F4F6` |

---

## 31. TYPOGRAPHY SCALE

### Font Family
- **All Text:** `Inter` (via globals.css)
- **Fallback:** System UI fonts

### Header Typography
| Element | Size | Weight | Transform | Tracking |
|---------|------|--------|-----------|----------|
| Table Headers | 11px | 500 (Medium) | Uppercase | 0.5px |
| Search Placeholder | 14px | 400 (Regular) | - | - |
| Scope Dropdown | 14px | 500 (Medium) | - | - |
| Button Text | 14px | 500 (Medium) | - | - |
| Filter Chips | 14px | 500 (Medium) | - | - |
| Count Badges | 12px | 600 (Semibold) | - | - |
| Context Text | 14px | 400 (Regular) | - | - |

### Row Typography
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Alert Badge Number | 16px | 700 (Bold) | Dynamic |
| Tooltip Title | 12px | 600 (Semibold) | Near Black |
| Tooltip Item | 13px | 400 (Regular) | Gray 500 |
| Tooltip Count | 13px | 600 (Semibold) | Near Black |
| Project Name | 16px | 600 (Semibold) | Near Black |
| Trend Arrow | 14px | - | Dynamic |
| Client/Owner | 14px | 400 (Regular) | Gray 500 |
| Badge | 11px | 500 (Medium) | Gray 500 |
| Date Range | 14px | 400 (Regular) | Gray 500 |
| Status Text | 13px | 500 (Medium) | Dynamic |
| Activity Name | 14px | 500 (Medium) | Near Black |
| Activity Time | 13px | 400/600 | Dynamic |
| Activity Icon | 14px | - | - |
| Menu Items | 13px | 400 (Regular) | Near Black/Red |

---

## 32. SPACING & LAYOUT

### Page Layout
```
Page Container
│
├─ Header Bar: 40px height
│  ├─ Padding: 20px
│  ├─ Search: 400px max-width, 40px height
│  ├─ Scope: 120px min-width, 40px height
│  └─ Button: 140px width, 40px height
│
├─ Context Line: auto height
│  ├─ Margin top: 12px
│  └─ Padding: 0 20px
│
├─ Filter Chips: 36px height
│  ├─ Margin top: 12px
│  ├─ Margin bottom: 24px
│  ├─ Gap: 8px
│  └─ Chip padding: 0 16px
│
└─ Table: auto height
   ├─ Header: 48px height
   │  └─ Padding: 0 40px
   │
   └─ Rows: 88px min-height each
      ├─ Padding: 20px 40px
      ├─ Grid: 60px | 400px | 280px | 220px | 160px
      │
      ├─ Column 1 (Alert): 60px
      │  └─ Badge: 36px circle
      │
      ├─ Column 2 (Context): 400px
      │  ├─ Padding left: 20px
      │  ├─ Gap: 4px (vertical)
      │  ├─ Name: 16px
      │  ├─ Client: 14px
      │  └─ Badge: 11px
      │
      ├─ Column 3 (Timeline): 280px
      │  ├─ Gap: 4px (vertical)
      │  ├─ Dates: 14px
      │  ├─ Progress: 4px height, 260px max-width
      │  └─ Status: 13px
      │
      ├─ Column 4 (Activity): 220px
      │  ├─ Padding left: 20px
      │  ├─ Gap: 4px (vertical)
      │  ├─ Name: 14px
      │  └─ Time: 13px
      │
      └─ Column 5 (Actions): 160px
         ├─ Padding right: 20px
         ├─ Gap: 12px
         ├─ Menu button: 32px square
         └─ Arrow: 16px icon / Gantt: 90px × 32px
```

### Key Measurements
- **Table columns:** 60 + 400 + 280 + 220 + 160 = 1120px total grid width
- **Row padding:** 40px left/right (adds 80px to grid width)
- **Row min-height:** 88px (20px top/bottom padding)
- **Alert badge:** 36px circle
- **Progress bar:** 4px height, 260px max-width
- **Filter chip:** 36px height, 18px border radius (pill)
- **Table header:** 48px height
- **Buttons:** 32-40px height
- **Icons:** 12-16px standard sizes

---

## 33. SHADOW SYSTEM

### Table Container Shadow
- **Values:** `0 2px 8px rgba(0,0,0,0.1)`
- **Effect:** Subtle elevation

### Row Hover Shadow
- **Values:** `0 2px 12px rgba(0,0,0,0.08)`
- **Effect:** Lift on hover

### Dropdown Menu Shadow
- **Values:** `0 4px 12px rgba(0,0,0,0.12)`
- **Effect:** Strong elevation

### Tooltip Shadow
- **Values:** `0 4px 16px rgba(0,0,0,0.15)`
- **Effect:** Stronger elevation with more opacity

### Button Hover Shadow (New Project)
- **Values:** `0 4px 12px rgba(96, 165, 250, 0.4)`
- **Effect:** Colored shadow with blue tint

---

## 34. BORDER SYSTEM

| Element | Width | Color | Radius |
|---------|-------|-------|--------|
| Table Container | 1px | #E5E7EB | 8px |
| Search Input | 1px | #E5E7EB | 8px |
| Scope Dropdown | 1px | #E5E7EB | 8px |
| Filter Chip (Inactive) | 1px | #E5E7EB | 18px |
| Three-dot Button | 1px | #E5E7EB | 6px |
| Dropdown Menu | 1px | #E5E7EB | 8px |
| Tooltip | 1px | #E5E7EB | 8px |
| Row Divider | 1px | #F3F4F6 | - |
| Progress Bar | - | - | 2px |
| Badge | - | - | 10px |
| Gantt Button | - | - | 6px |
| New Project Button | - | - | 8px |

---

## 35. ANIMATION & TRANSITIONS

### Defined Animations

#### tooltipFadeIn
```css
@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
- **Duration:** 150ms ease-out

#### menuSlideIn
```css
@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
- **Duration:** 200ms ease-out

#### slideIn (Gantt Button)
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```
- **Duration:** 200ms ease-out

### Transition Table
| Element | Property | Duration | Timing |
|---------|----------|----------|--------|
| Row | all | 200ms | ease |
| Search Input | border | 150ms | ease |
| Buttons | all | 150ms | ease |
| Menu Items | background | 150ms | ease |
| Alert Badge | transform | 150ms | ease |
| Progress Fill | width | 1s | ease-out |
| Scope Dropdown | all | 150ms | ease |

---

## 36. INTERACTIVE STATES

### Project Row States

#### Default
```css
background: white
box-shadow: none
cursor: pointer
```

#### Hover
```css
background: #FAFAFA
box-shadow: 0 2px 12px rgba(0,0,0,0.08)
transition: all 200ms ease
```

#### Arrow → Gantt Button Reveal
- **Trigger:** Row hover
- **Effect:** Arrow icon fades out, Gantt button slides in from right
- **Animation:** slideIn 200ms ease-out

### Alert Badge States

#### Default
```css
transform: scale(1)
```

#### Hover
```css
transform: scale(1.05)
transition: transform 150ms ease
```

#### Tooltip Appear
- **Trigger:** Badge hover
- **Animation:** tooltipFadeIn 150ms ease-out

### Button States

#### Search Input Focus
```css
border-color: #60A5FA (Blue 400)
outline: none
```

#### Scope Dropdown Active
```css
border-color: #60A5FA (Blue 400)
box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1)
```

#### New Project Button Hover
```css
background: #3B82F6 (Blue 500)
transform: translateY(-1px)
box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4)
```

#### Filter Chip Hover (Inactive)
```css
background: #F9FAFB (Gray 50)
```

#### Three-dot Button Hover
```css
border-color: #D1D5DB (Gray 300)
background: #F9FAFB (Gray 50)
```

---

## 37. RESPONSIVE BEHAVIOR

### Fixed Dimensions
- **Table Grid:** 1120px (60 + 400 + 280 + 220 + 160)
- **Total Width:** 1200px+ (with padding)
- **Row Min-Height:** 88px
- **Header Height:** 48px
- **Filter Chips Height:** 36px

### Scrolling
- **Vertical:** Table scrolls when rows exceed viewport
- **Horizontal:** May need scroll on smaller screens

### Text Handling
- **Project Names:** May truncate if too long
- **Client Names:** May truncate
- **Status Text:** Single line

---

## 38. DATA STRUCTURE

### Project Interface
```typescript
interface Project {
  id: number;
  alert: {
    dotColor: string;
    pulse: boolean;
    icon: string | null;
  };
  name: string;
  trend: '↗' | '↘' | '→';
  trendColor: string;
  client: string;
  owner: string;
  badge: 'Retainer' | 'Fixed Bid' | 'T&M';
  timeline: string;
  duration: string;
  progress: number;           // 0-100
  progressColor: string;
  statusText: string;
  statusColor: string;
  showActionBadge: boolean;
  actionBadgeBg: string;
  actionBadgeColor: string;
  nextActivity: string;
  activityTime: string;
  activityIcon: string;
  activityColor: string;
  activityWeight: 400 | 600;
  flagCount: number;
  flagBg: string;
  flagColor: string;
  alertBreakdown: Array<{
    label: string;
    count: number;
  }>;
}
```

---

## 39. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Proper buttons, inputs
- **Keyboard Focus:** Inputs and buttons focusable
- **Hover States:** Visual feedback
- **Click Areas:** Large touch targets (32-40px)
- **Color Contrast:** AAA ratios for text

### Potential Improvements
- Add ARIA labels for alert badges
- Add `role="table"`, `role="row"`, `role="cell"`
- Add keyboard navigation (Arrow keys)
- Add `aria-sort` for sortable columns
- Add `aria-expanded` for dropdowns
- Add `aria-describedby` for tooltips
- Add focus visible indicators
- Add screen reader text for progress
- Add `Escape` key to close menus
- Add keyboard shortcuts (e.g., `n` for new project)

---

## SUMMARY

The Project Triage Board is a sophisticated table-based project list featuring:

### Key Features
- **5-Column Grid Layout:** Alert | Context | Timeline | Activity | Actions
- **Alert Badge System:** Circular badges (36px) with flag counts + hover tooltips
- **Trend Arrows:** ↗ (green), ↘ (red), → (gray) showing project direction
- **Color-Coded Progress:** 4px bars with red/orange/green colors
- **Status Text:** Percentage + overdue days or risk status
- **Hover Interactions:** Row highlights + shadow + Gantt button reveal
- **Filter Chips:** Pill-shaped chips (36px height, 18px radius)
- **Scope Dropdown:** Mine/Team/Department/Company with blue dot indicator
- **Search Bar:** 400px with icon, gray background
- **Alert Tooltips:** Breakdown of alert types on badge hover

### Visual Design
- **88px Rows:** Min-height for comfortable reading
- **20px Padding:** Generous vertical space
- **40px Horizontal Padding:** Table padding
- **36px Alert Badges:** Bold numbers, color-coded backgrounds
- **4px Progress Bars:** Thin, smooth animations (1s transition)
- **16px Project Names:** Bold, prominent
- **14px Metadata:** Client, owner, dates in gray

### Color System
```
Critical: Red 400 (#F87171) + Red 100 bg (#FEE2E2)
High:     Orange 400 (#FB923D) + Orange 200 bg (#FED7AA)
On Track: Green 400 (#34D399)
Primary:  Blue 400 (#60A5FA)
```

### Interaction Patterns
- **Row Hover:** Gray background + shadow + Gantt button
- **Badge Hover:** Tooltip with alert breakdown
- **Menu Click:** Dropdown with actions
- **Filter Click:** Toggle active state
- **Search Focus:** Blue border

### Technical Sophistication
- **Grid Layout:** Fixed columns (60-400-280-220-160px)
- **Smooth Animations:** 150-200ms transitions, 1s progress
- **Z-Index Layering:** Backdrop (40), menu (50), tooltip (100)
- **State Management:** Hover, open menu, scope selection
- **Dynamic Colors:** Based on severity, trend, urgency

The complete specification with all measurements, colors, animations, and interaction patterns is in `/PROJECT_TRIAGE_BOARD_DESIGN.md`!
