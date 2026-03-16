# Red Zone Widget - Complete Design Specification

## Overview
The Red Zone Widget is a critical project health monitoring dashboard displaying high-risk projects with severity indicators. It features color-coded risk dots, inline risk scores with badge styling, compact one-line-per-project layout, a settings modal for threshold configuration, and a prominent count badge. The widget uses a red/coral gradient accent and spans a single dashboard grid cell (340px × 340px).

---

## Widget Structure

```
┌──────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓ Red Gradient Top Accent ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← 4px height
├──────────────────────────────────────────────────┤
│ ⚠️  Red Zone [5]                   Settings      │ ← Header (36px min)
├──────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐ │
│ │ ● SUSALGAEFUEL [94] 8 overdue • €12k over → │ │ ← Critical (Red)
│ ├──────────────────────────────────────────────┤ │
│ │ ● Mobile App Redesign [87] 6 weeks late...→ │ │ ← High (Orange)
│ ├──────────────────────────────────────────────┤ │
│ │ ● Q4 Marketing Campaign [72] Budget +€8.4k→ │ │ ← Warning (Yellow)
│ ├──────────────────────────────────────────────┤ │ ← Content area
│ │ ● Platform Migration [68] 3 dependencies → │ │   (scrollable)
│ ├──────────────────────────────────────────────┤ │
│ │ ● Client Portal v2 [65] 2 resources short→ │ │ ← Caution (Light Yellow)
│ └──────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│ All projects →                                   │ ← Footer (30px min)
└──────────────────────────────────────────────────┘
```

---

## 1. CONTAINER

### Outer Container
- **Element:** `<div>`
- **Background:** `#FFFFFF` (white)
- **Border Radius:** `6px` (rounded-lg)
- **Box Shadow:** `0 2px 8px rgba(0,0,0,0.1)`
  - 2px vertical offset, 8px blur
  - 10% black opacity
- **Position:** `relative`
- **Overflow:** `hidden` (clips gradient)
- **Height:** `100%` (fills grid cell - typically 340px)
- **Display:** `flex`
- **Flex Direction:** `column`

### Purpose
Critical project monitoring widget for at-risk projects.

---

## 2. TOP ACCENT GRADIENT

### Visual Element
- **Element:** `<div>`
- **Position:** `absolute`
- **Location:** `left: 0, right: 0, top: 0`
- **Height:** `4px` (h-1 in Tailwind)
- **Background:** `linear-gradient(90deg, #F87171 0%, #FCA5A5 100%)`
  - **Start Color (0%):** `#F87171` - Red 400
  - **End Color (100%):** `#FCA5A5` - Red 300 (lighter coral)
  - **Direction:** Left to right (90deg)

### Color Details
- **#F87171** (Red 400):
  - RGB: 248, 113, 113
  - HSL: 0°, 91%, 71%
  - Vibrant red/coral
  
- **#FCA5A5** (Red 300):
  - RGB: 252, 165, 165
  - HSL: 0°, 94%, 82%
  - Light coral pink

### Purpose
Visual brand identifier for critical/warning widgets.

---

## 3. HEADER SECTION

### Container
- **Element:** `<div>`
- **Padding:** 
  - Horizontal: `12px` (px-3)
  - Vertical: `8px` (py-2)
- **Border Bottom:** `1px solid #E5E7EB` (Gray 200)
- **Min Height:** `36px`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`

### Left Side: Title Group
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `6px` (gap-1.5)

**AlertTriangle Icon:**
- **Component:** `<AlertTriangle>` from lucide-react
- **Size:** `16px × 16px` (w-4 h-4)
- **Color:** `#F87171` (Red 400 - matches gradient)
- **Stroke Width:** 2px

**Title Text:**
- **Element:** `<h3>`
- **Text:** "Red Zone"
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#F87171` (Red 400 - matches icon)

**Count Badge:**
- **Element:** `<span>`
- **Width:** `16px` (w-4)
- **Height:** `16px` (h-4)
- **Border Radius:** `full` (rounded-full - perfect circle)
- **Background:** `#F87171` (Red 400)
- **Text Color:** `#FFFFFF` (white)
- **Font Size:** `10px`
- **Font Weight:** `700` (font-bold)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`
- **Content:** Number of risk items (e.g., "5")

### Right Side: Settings Button
- **Element:** `<button>`
- **Font Size:** `11px`
- **Default Color:** `#9CA3AF` (Gray 400)
- **Hover Color:** `#111827` (Gray 900 - very dark)
- **Transition:** `colors 150ms`
- **Text:** "Settings"
- **Background:** Transparent
- **Border:** None
- **Cursor:** `pointer`
- **Action:** Opens settings modal

### Visual Hierarchy
```
[⚠️ Icon]  [Red Zone]  [5]          [Settings]
   ↓          ↓         ↓                ↓
 Red 400    Red 400   Red 400      Gray 400 → Gray 900
 16px       14px      10px circle   11px
           Medium    Bold          Regular
```

---

## 4. CONTENT AREA (RISK LIST)

### Scrollable Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `6px` (py-1.5)
- **Flex:** `1` (takes all remaining vertical space)
- **Overflow Y:** `auto` (vertical scroll)
- **Scrollbar:** Custom styled (custom-scrollbar class)

### Items Container
- **Element:** `<div>`
- **Class:** `space-y-1`
- **Gap:** `4px` between items (vertical spacing)

---

## 5. RISK ITEM DATA STRUCTURE

### Sample Data
```javascript
const risks = [
  { 
    id: 1, 
    project: 'SUSALGAEFUEL', 
    riskScore: 94, 
    color: '#EF4444',      // Red 500
    issues: '8 overdue • €12k over' 
  },
  { 
    id: 2, 
    project: 'Mobile App Redesign', 
    riskScore: 87, 
    color: '#F59E0B',      // Amber 500
    issues: '6 weeks late • 5 blocked' 
  },
  { 
    id: 3, 
    project: 'Q4 Marketing Campaign', 
    riskScore: 72, 
    color: '#FBBF24',      // Amber 400
    issues: 'Budget +€8.4k' 
  },
  { 
    id: 4, 
    project: 'Platform Migration', 
    riskScore: 68, 
    color: '#FBBF24',      // Amber 400
    issues: '3 dependencies' 
  },
  { 
    id: 5, 
    project: 'Client Portal v2', 
    riskScore: 65, 
    color: '#FCD34D',      // Amber 300
    issues: '2 resources short' 
  }
];
```

### Risk Score to Color Mapping
| Risk Score | Color | Hex | Severity |
|------------|-------|-----|----------|
| 90-100 | Red 500 | `#EF4444` | Critical |
| 80-89 | Amber 500 | `#F59E0B` | High |
| 70-79 | Amber 400 | `#FBBF24` | Warning |
| 60-69 | Amber 400 | `#FBBF24` | Warning |
| 50-59 | Amber 300 | `#FCD34D` | Caution |

---

## 6. RISK ITEM DESIGN (ONE-LINE LAYOUT)

### Item Container
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `8px` (gap-2)
- **Padding:** `6px` (p-1.5)
- **Border Radius:** `8px` (rounded-lg)
- **Background:** `#FAFAFA` (very light gray)
- **Border:** `1px solid #F3F4F6` (Gray 100)
- **Cursor:** `pointer`
- **Transition:** `all 150ms`

### Hover State
- **Box Shadow:** `shadow-sm` (0 1px 2px 0 rgba(0, 0, 0, 0.05))
- **Transition:** `all 150ms`

### Visual Structure
```
┌────────────────────────────────────────────────┐
│ ● SUSALGAEFUEL [94] 8 overdue • €12k over  → │
│ ↑       ↑        ↑            ↑              ↑ │
│ Dot  Project  Score      Issues         Arrow │
└────────────────────────────────────────────────┘
```

---

## 7. RISK INDICATOR DOT

### Dot Element
- **Element:** `<div>`
- **Width:** `8px` (w-2)
- **Height:** `8px` (h-2)
- **Border Radius:** `full` (rounded-full - perfect circle)
- **Flex Shrink:** `0` (prevents compression)
- **Background Color:** Dynamic (based on risk score)

### Color Examples
```
● Red 500 (#EF4444)      - Score 94 (Critical)
● Amber 500 (#F59E0B)    - Score 87 (High)
● Amber 400 (#FBBF24)    - Score 72 (Warning)
● Amber 300 (#FCD34D)    - Score 65 (Caution)
```

### Purpose
Visual severity indicator at-a-glance.

---

## 8. PROJECT NAME & SCORE SECTION

### Container
- **Element:** `<div>`
- **Flex:** `1` (takes remaining space)
- **Min Width:** `0` (allows text truncation)
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `8px` (gap-2)

### Project Name
- **Element:** `<p>`
- **Font Size:** `12px`
- **Font Weight:** `700` (font-bold)
- **Color:** `#1F2937` (Gray 800)
- **Text Overflow:** `truncate` (ellipsis)
- **Examples:** "SUSALGAEFUEL", "Mobile App Redesign", "Q4 Marketing Campaign"

### Risk Score Badge
- **Element:** `<span>`
- **Font Size:** `10px`
- **Font Weight:** `700` (font-bold)
- **Padding:**
  - Horizontal: `6px` (px-1.5)
  - Vertical: `2px` (py-0.5)
- **Border Radius:** `4px` (rounded)
- **Flex Shrink:** `0` (prevents compression)

#### Badge Styling (Dynamic)
- **Background:** `{risk.color}20` (color at 20% opacity)
- **Text Color:** `{risk.color}` (full color)

#### Examples
```
[94] ← Red 500 text on Red 500 20% background
[87] ← Amber 500 text on Amber 500 20% background
[72] ← Amber 400 text on Amber 400 20% background
```

### Visual Layout
```
SUSALGAEFUEL [94]
      ↓         ↓
  12px bold   10px bold
  Gray 800    Red 500 on Red 20%
  Truncate    Fixed width
```

---

## 9. ISSUES TEXT

### Container
- **Element:** `<div>`
- **Flex Shrink:** `0` (prevents compression)
- **Font Size:** `10px`
- **Color:** `#6B7280` (Gray 500)

### Text Format
Compact inline issue description with bullet separator:
- **Format:** `{issue1} • {issue2}` (bullet: `•`)
- **Examples:**
  - "8 overdue • €12k over"
  - "6 weeks late • 5 blocked"
  - "Budget +€8.4k"
  - "3 dependencies"
  - "2 resources short"

### Issue Categories
| Category | Example |
|----------|---------|
| **Overdue Tasks** | "8 overdue" |
| **Budget Variance** | "€12k over", "Budget +€8.4k" |
| **Schedule Delay** | "6 weeks late" |
| **Blockers** | "5 blocked" |
| **Dependencies** | "3 dependencies" |
| **Resources** | "2 resources short" |

---

## 10. ARROW BUTTON

### Container
- **Element:** `<button>`
- **Flex Shrink:** `0` (prevents compression)
- **Padding:** `2px` (p-0.5)
- **Border Radius:** `4px` (rounded)
- **Transition:** `colors 150ms`

### Hover State
- **Background:** `#FFFFFF` (white)
- **Transition:** `colors 150ms`

### Arrow Icon
- **Component:** `<ArrowRight>` from lucide-react
- **Size:** `14px × 14px` (w-3.5 h-3.5)
- **Color:** `#9CA3AF` (Gray 400)
- **Stroke Width:** 2px

### Purpose
Navigate to project details page.

---

## 11. FOOTER SECTION

### Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `6px` (py-1.5)
- **Border Top:** `1px solid #E5E7EB` (Gray 200)
- **Min Height:** `30px`

### All Projects Link
- **Element:** `<button>`
- **Font Size:** `11px`
- **Color:** `#3B82F6` (Blue 500)
- **Hover Color:** `#2563EB` (Blue 600)
- **Transition:** Not specified (instant)
- **Text:** "All projects →"
- **Background:** Transparent
- **Border:** None
- **Cursor:** `pointer`

---

## 12. SETTINGS MODAL

### Modal Overview
A full-screen overlay with centered modal dialog for configuring Red Zone thresholds.

### Overlay
- **Element:** `<div>`
- **Position:** `fixed`
- **Inset:** `0` (covers entire viewport)
- **Z-Index:** `50`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`
- **Background:** `rgba(0, 0, 0, 0.5)` (50% black overlay)
- **Click:** Closes modal

### Modal Container
- **Element:** `<div>`
- **Background:** `#FFFFFF` (white)
- **Border Radius:** `8px` (rounded-lg)
- **Width:** `480px`
- **Max Height:** `90vh`
- **Box Shadow:** `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
  - Layer 1: Y: 20px, Blur: 25px, Spread: -5px, 10% black
  - Layer 2: Y: 10px, Blur: 10px, Spread: -5px, 4% black
- **Click:** Stops propagation (doesn't close)

---

## 13. MODAL HEADER

### Container
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`
- **Padding:** `24px horizontal (px-6), 16px vertical (py-4)`
- **Border Bottom:** `1px solid #E5E7EB` (Gray 200)

### Left Side: Title Group
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `12px` (gap-3)

**Icon Container:**
- **Element:** `<div>`
- **Width:** `40px` (w-10)
- **Height:** `40px` (h-10)
- **Border Radius:** `8px` (rounded-lg)
- **Background:** `#FEE2E2` (Red 100)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`

**AlertTriangle Icon:**
- **Size:** `20px × 20px` (w-5 h-5)
- **Color:** `#EF4444` (Red 500)

**Text Group:**
- **Title (h2):**
  - Font Size: `18px`
  - Font Weight: `600` (font-semibold)
  - Color: `#111827` (Gray 900)
  - Text: "Red Zone Settings"

- **Subtitle (p):**
  - Font Size: `13px`
  - Color: `#6B7280` (Gray 500)
  - Text: "Configure alert thresholds"

### Right Side: Close Button
- **Element:** `<button>`
- **Padding:** `8px` (p-2)
- **Border Radius:** `8px` (rounded-lg)
- **Hover Background:** `#F3F4F6` (Gray 100)
- **Transition:** `colors 150ms`

**X Icon:**
- **Size:** `20px × 20px` (w-5 h-5)
- **Color:** `#6B7280` (Gray 500)

---

## 14. MODAL CONTENT

### Container
- **Element:** `<div>`
- **Padding:** `24px` (px-6 py-6)
- **Space:** `24px` between sections (space-y-6)

### Three Threshold Controls
1. Budget Variance Threshold
2. Schedule Delay Threshold
3. Minimum Risk Score

Each follows the same pattern.

---

## 15. THRESHOLD CONTROL DESIGN

### Control Container
- **Element:** `<div>`

### Label
- **Element:** `<label>`
- **Display:** `block`
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#374151` (Gray 700)
- **Margin Bottom:** `8px` (mb-2)
- **Text Examples:**
  - "Budget Variance Threshold"
  - "Schedule Delay Threshold"
  - "Minimum Risk Score"

### Input Row
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `12px` (gap-3)

#### Range Slider
- **Element:** `<input type="range">`
- **Flex:** `1` (takes remaining space)
- **Accent Color:** `#EF4444` (Red 500 - thumb color)

**Budget Variance:**
- Min: 5
- Max: 50
- Step: 5
- Default: 10

**Schedule Delay:**
- Min: 1
- Max: 12
- Step: 1
- Default: 2

**Risk Score:**
- Min: 50
- Max: 90
- Step: 5
- Default: 70

#### Value Display Badge
- **Element:** `<div>`
- **Padding:** `6px horizontal (px-3), 6px vertical (py-1.5)`
- **Border Radius:** `8px` (rounded-lg)
- **Font Size:** `14px`
- **Font Weight:** `600` (font-semibold)
- **Background:** `#FEE2E2` (Red 100)
- **Color:** `#EF4444` (Red 500)
- **Min Width:** `60px`
- **Text Align:** `center`
- **Text Format:**
  - Budget: "10%" (percentage)
  - Schedule: "2w" (weeks)
  - Risk: "70" (score)

### Help Text
- **Element:** `<p>`
- **Font Size:** `12px`
- **Color:** `#6B7280` (Gray 500)
- **Margin Top:** `4px` (mt-1)
- **Examples:**
  - "Projects exceeding budget by this percentage appear in Red Zone"
  - "Projects delayed by this many weeks appear in Red Zone"
  - "Projects with risk scores above this value appear in Red Zone"

---

## 16. INFO BOX (WARNING)

### Container
- **Element:** `<div>`
- **Padding:** `16px` (p-4)
- **Border Radius:** `8px` (rounded-lg)
- **Border:** `1px solid`
- **Background:** `#FEF3C7` (Amber 100)
- **Border Color:** `#FDE68A` (Amber 200)

### Text Content
- **Element:** `<p>`
- **Font Size:** `13px`
- **Color:** `#92400E` (Amber 900)

**Text Structure:**
```
Note: Changes to these thresholds will affect which projects 
appear in your Red Zone widget. Current settings will flag 
{X} of {Y} projects.
```

**Bold Text:**
- **Element:** `<strong>`
- **Text:** "Note:"
- **Font Weight:** Inherited bold

### Purpose
Dynamic feedback showing impact of threshold changes.

---

## 17. MODAL FOOTER

### Container
- **Element:** `<div>`
- **Padding:** `24px horizontal (px-6), 16px vertical (py-4)`
- **Border Top:** `1px solid #E5E7EB` (Gray 200)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `flex-end` (right-aligned)
- **Gap:** `12px` (gap-3)

### Cancel Button
- **Element:** `<button>`
- **Padding:** `8px horizontal (px-4), 8px vertical (py-2)`
- **Border Radius:** `8px` (rounded-lg)
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#374151` (Gray 700)
- **Background:** Transparent
- **Hover Background:** `#F3F4F6` (Gray 100)
- **Transition:** `colors 150ms`
- **Text:** "Cancel"

### Save Settings Button
- **Element:** `<button>`
- **Padding:** `8px horizontal (px-4), 8px vertical (py-2)`
- **Border Radius:** `8px` (rounded-lg)
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#FFFFFF` (white)
- **Background:** `#EF4444` (Red 500)
- **Hover Background:** `#DC2626` (Red 600)
- **Transition:** `colors 150ms`
- **Text:** "Save Settings"

---

## 18. COLOR PALETTE

### Primary Colors (Red Theme)
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Red 400 | `#F87171` | Top gradient start, header icon/title, count badge |
| Red 300 | `#FCA5A5` | Top gradient end |
| Red 500 | `#EF4444` | Critical risk dot, score badge, modal accent, save button |
| Red 600 | `#DC2626` | Save button hover |

### Risk Severity Colors
| Severity | Color | Hex | Score Range |
|----------|-------|-----|-------------|
| Critical | Red 500 | `#EF4444` | 90-100 |
| High | Amber 500 | `#F59E0B` | 80-89 |
| Warning | Amber 400 | `#FBBF24` | 70-79 |
| Caution | Amber 300 | `#FCD34D` | 60-69 |

### Modal Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Red 100 | `#FEE2E2` | Icon container, value badge background |
| Amber 100 | `#FEF3C7` | Info box background |
| Amber 200 | `#FDE68A` | Info box border |
| Amber 900 | `#92400E` | Info box text |

### Text Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 900 | `#111827` | Modal title, settings button hover |
| Gray 800 | `#1F2937` | Project names |
| Gray 700 | `#374151` | Modal labels, cancel button |
| Gray 500 | `#6B7280` | Issues text, modal subtitle, help text |
| Gray 400 | `#9CA3AF` | Settings button, arrow icon |
| White | `#FFFFFF` | Count badge text, arrow hover background, save button text |

### Background Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| White | `#FFFFFF` | Widget background, modal background |
| Gray 50 | `#FAFAFA` | Risk item background |
| Gray 100 | `#F3F4F6` | Risk item border, modal hover states |

### Border Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 200 | `#E5E7EB` | Header/footer borders, modal borders |

### Interaction Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Blue 500 | `#3B82F6` | Footer link |
| Blue 600 | `#2563EB` | Footer link hover |

---

## 19. TYPOGRAPHY SCALE

### Font Family
- **All Text:** `Inter` (via globals.css)
- **Fallback:** System UI fonts

### Widget Typography
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Header Title | 14px | 500 (Medium) | #F87171 |
| Count Badge | 10px | 700 (Bold) | #FFFFFF |
| Settings Button | 11px | 400 (Regular) | #9CA3AF |
| Project Name | 12px | 700 (Bold) | #1F2937 |
| Risk Score Badge | 10px | 700 (Bold) | Dynamic |
| Issues Text | 10px | 400 (Regular) | #6B7280 |
| Footer Link | 11px | 400 (Regular) | #3B82F6 |

### Modal Typography
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Modal Title | 18px | 600 (Semibold) | #111827 |
| Modal Subtitle | 13px | 400 (Regular) | #6B7280 |
| Label | 14px | 500 (Medium) | #374151 |
| Value Badge | 14px | 600 (Semibold) | #EF4444 |
| Help Text | 12px | 400 (Regular) | #6B7280 |
| Info Box | 13px | 400 (Regular) | #92400E |
| Button Text | 14px | 500 (Medium) | #374151/#FFFFFF |

---

## 20. SPACING & LAYOUT

### Widget Measurements
```
Container (340px × 340px typical)
│
├─ Top Gradient: 4px
│
├─ Header: 36px min
│  └─ Padding: 12px (h) × 8px (v)
│     ├─ Icon: 16px
│     ├─ Title: 14px
│     ├─ Count badge: 16px circle
│     └─ Settings: 11px
│
├─ Content: flex-1 (remaining space)
│  ├─ Padding: 12px (h) × 6px (v)
│  └─ Items gap: 4px (space-y-1)
│     │
│     └─ Risk Item: variable height (~32px)
│        ├─ Padding: 6px all sides (p-1.5)
│        ├─ Gap: 8px between elements (gap-2)
│        │
│        ├─ Risk dot: 8px circle
│        ├─ Project + Score: flex-1
│        │  ├─ Project: 12px bold, truncate
│        │  ├─ Gap: 8px
│        │  └─ Score badge: 10px bold
│        │     └─ Padding: 6px × 2px
│        ├─ Issues: 10px, flex-shrink-0
│        └─ Arrow: 14px icon
│           └─ Padding: 2px (p-0.5)
│
└─ Footer: 30px min
   └─ Padding: 12px (h) × 6px (v)
```

### Modal Measurements
```
Modal (480px × auto)
│
├─ Header: auto height
│  ├─ Padding: 24px (h) × 16px (v)
│  ├─ Icon container: 40px square
│  ├─ Title: 18px
│  └─ Subtitle: 13px
│
├─ Content: auto height
│  ├─ Padding: 24px all sides
│  ├─ Sections gap: 24px (space-y-6)
│  │
│  └─ Threshold control:
│     ├─ Label: 14px, margin-bottom 8px
│     ├─ Input row: gap 12px
│     │  ├─ Slider: flex-1
│     │  └─ Badge: 60px min-width
│     │     └─ Padding: 12px × 6px
│     └─ Help text: 12px, margin-top 4px
│
└─ Footer: auto height
   ├─ Padding: 24px (h) × 16px (v)
   ├─ Buttons gap: 12px
   └─ Button padding: 16px × 8px
```

---

## 21. INTERACTIVE STATES

### Risk Item States

#### Default
```css
background: #FAFAFA
border: 1px solid #F3F4F6
box-shadow: none
cursor: pointer
```

#### Hover
```css
background: #FAFAFA
border: 1px solid #F3F4F6
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
transition: all 150ms
cursor: pointer
```

### Button States

#### Settings Button
| State | Color | Transition |
|-------|-------|------------|
| Default | #9CA3AF (Gray 400) | colors 150ms |
| Hover | #111827 (Gray 900) | colors 150ms |

#### Footer Link
| State | Color | Transition |
|-------|-------|------------|
| Default | #3B82F6 (Blue 500) | None |
| Hover | #2563EB (Blue 600) | None |

#### Arrow Button
| State | Background | Transition |
|-------|------------|------------|
| Default | Transparent | colors 150ms |
| Hover | #FFFFFF (White) | colors 150ms |

#### Modal Cancel Button
| State | Background | Transition |
|-------|------------|------------|
| Default | Transparent | colors 150ms |
| Hover | #F3F4F6 (Gray 100) | colors 150ms |

#### Modal Save Button
| State | Background | Transition |
|-------|------------|------------|
| Default | #EF4444 (Red 500) | colors 150ms |
| Hover | #DC2626 (Red 600) | colors 150ms |

#### Modal Close Button
| State | Background | Transition |
|-------|------------|------------|
| Default | Transparent | colors 150ms |
| Hover | #F3F4F6 (Gray 100) | colors 150ms |

---

## 22. RANGE SLIDER STYLING

### HTML Input Range
- **Element:** `<input type="range">`
- **Flex:** `1` (takes available space)
- **Accent Color:** `#EF4444` (Red 500)
  - Controls thumb/handle color in modern browsers

### Native Styling
The accent-color property automatically styles:
- **Track:** Browser default (usually light gray)
- **Thumb:** Red 500 (#EF4444)
- **Fill:** Red 500 (#EF4444) on supporting browsers

### Cross-Browser Appearance
- **Chrome/Edge:** Thumb and progress use accent color
- **Firefox:** Thumb uses accent color
- **Safari:** Thumb uses accent color

---

## 23. SHADOW SYSTEM

### Widget Container Shadow
- **Values:** `0 2px 8px rgba(0,0,0,0.1)`
- **Breakdown:**
  - X: 0px, Y: 2px, Blur: 8px
  - Color: Black at 10% opacity
- **Effect:** Subtle elevation

### Risk Item Hover Shadow
- **Values:** `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Breakdown:**
  - X: 0px, Y: 1px, Blur: 2px, Spread: 0px
  - Color: Black at 5% opacity
- **Effect:** Subtle lift on hover

### Modal Container Shadow
- **Values:** `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **Layer 1:**
  - X: 0px, Y: 20px, Blur: 25px, Spread: -5px
  - Color: Black at 10% opacity
- **Layer 2:**
  - X: 0px, Y: 10px, Blur: 10px, Spread: -5px
  - Color: Black at 4% opacity
- **Effect:** Strong elevation with depth

---

## 24. BORDER SYSTEM

### Border Specifications
| Element | Width | Color | Radius |
|---------|-------|-------|--------|
| Widget | - | - | 6px |
| Header Bottom | 1px | #E5E7EB | - |
| Footer Top | 1px | #E5E7EB | - |
| Risk Item | 1px | #F3F4F6 | 8px |
| Risk Dot | - | - | Full (circle) |
| Count Badge | - | - | Full (circle) |
| Score Badge | - | - | 4px |
| Arrow Button | - | - | 4px |
| Modal Container | - | - | 8px |
| Modal Header Bottom | 1px | #E5E7EB | - |
| Modal Icon Container | - | - | 8px |
| Modal Value Badge | - | - | 8px |
| Modal Info Box | 1px | #FDE68A | 8px |
| Modal Footer Top | 1px | #E5E7EB | - |
| Modal Buttons | - | - | 8px |

---

## 25. ANIMATION & TRANSITIONS

### Defined Transitions
| Element | Property | Duration | Timing |
|---------|----------|----------|--------|
| Risk Item | all | 150ms | ease |
| Settings Button | colors | 150ms | ease |
| Arrow Button | colors | 150ms | ease |
| Modal Close Button | colors | 150ms | ease |
| Modal Cancel Button | colors | 150ms | ease |
| Modal Save Button | colors | 150ms | ease |

### State Transitions
- **Item Hover:** shadow none → sm (150ms)
- **Settings Hover:** Gray 400 → Gray 900 (150ms)
- **Arrow Hover:** transparent → white (150ms)
- **Save Hover:** Red 500 → Red 600 (150ms)

### No Transition
- **Footer Link:** Instant color change (no transition specified)

---

## 26. SCROLLBAR STYLING

### Custom Scrollbar (custom-scrollbar class)
- **Width:** 8px
- **Track:** Transparent
- **Thumb (default):** Transparent (invisible)
- **Thumb (container hover):** `rgba(156, 163, 175, 0.4)` (Gray 400 at 40%)
- **Thumb (direct hover):** `rgba(156, 163, 175, 0.7)` (Gray 400 at 70%)
- **Border Radius:** 4px

See `/SCROLLBAR_DESIGN.md` for complete specifications.

---

## 27. ICON SPECIFICATIONS

### Icons Used (from lucide-react)

| Icon | Location | Size | Color | Usage |
|------|----------|------|-------|-------|
| AlertTriangle | Widget header | 16px | #F87171 (Red 400) | Widget identifier |
| AlertTriangle | Modal header | 20px | #EF4444 (Red 500) | Settings modal icon |
| ArrowRight | Risk items | 14px | #9CA3AF (Gray 400) | View project |
| X | Modal header | 20px | #6B7280 (Gray 500) | Close modal |

### Icon Properties
- **Stroke Width:** 2px (Lucide default)
- **Style:** Outline/stroke icons
- **Alignment:** Vertically centered
- **Flex Shrink:** 0 (prevents distortion)

---

## 28. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Proper heading (`<h3>`), buttons
- **Button Elements:** Proper `<button>` tags for actions
- **Hover States:** Visual feedback on interaction
- **Color Differentiation:** Risk severity via color + score
- **Modal:** Overlay dismisses on click outside

### Text Contrast Ratios
- **Red 400 on White:** ~4.2:1 ✓ (AA)
- **Gray 800 on White:** ~12:1 ✓ (AAA)
- **Gray 500 on White:** ~7.2:1 ✓ (AAA)
- **Gray 400 on White:** ~4.5:1 ✓ (AA)
- **White on Red 400:** ~4.2:1 ✓ (AA)
- **White on Red 500:** ~5.1:1 ✓ (AA)
- **Red 500 on Red 100:** ~7.8:1 ✓ (AAA)
- **Amber 900 on Amber 100:** ~8.1:1 ✓ (AAA)

### Potential Improvements
- Add ARIA labels for buttons ("Open settings", "View project")
- Add `role="alertdialog"` to modal
- Add `aria-labelledby` for modal title
- Add keyboard shortcuts (Escape to close modal)
- Add focus trap in modal
- Add `aria-live="polite"` for threshold changes
- Mark count badge with `aria-label="5 at-risk projects"`
- Add keyboard navigation for risk items
- Ensure range sliders have labels with for/id
- Add visual focus indicators

---

## 29. RESPONSIVE BEHAVIOR

### Fixed Dimensions
- **Widget Width:** 340px (fixed from grid)
- **Widget Height:** 340px typical (can be 100% of grid cell)
- **Modal Width:** 480px (fixed)
- **Modal Max Height:** 90vh (responsive to viewport)

### Scrolling Behavior
- **Risk List:** Vertical scroll when content overflows
- **Modal Content:** Scrollable if taller than 90vh
- **Scroll Indicator:** Custom scrollbar (hover-reveal)

### Text Handling
- **Project Name:** Truncates with ellipsis (truncate class)
- **Issues Text:** Fixed width, may wrap or truncate
- **Min Width:** 0 on project container enables truncation

### Item Height
- **Dynamic:** Based on content
- **Typical:** ~32-36px per risk item
- **Padding:** 6px maintains consistent spacing

---

## 30. FUNCTIONAL FEATURES

### 1. Risk Monitoring
- **Sample Data:** 5 risk items shown
- **Real Implementation:** Would fetch from API/database
- **Sorting:** Risk score descending (highest first)
- **Filtering:** Based on threshold settings

### 2. Risk Scoring
- **Range:** 0-100 (shown: 65-94)
- **Calculation:** Algorithm considering:
  - Budget variance
  - Schedule delays
  - Blockers/dependencies
  - Resource availability
  - Task completion rate
- **Color Mapping:** Score → severity color

### 3. Settings Configuration
- **Budget Variance:** 5-50% (step: 5%)
- **Schedule Delay:** 1-12 weeks (step: 1 week)
- **Risk Score:** 50-90 (step: 5)
- **Default Values:** 10%, 2w, 70
- **Persistence:** Would save to localStorage/API

### 4. Dynamic Filtering
- **Info Box:** Shows live count of flagged projects
- **Formula:** `risks.filter(r => r.riskScore >= thresholds.riskScore).length`
- **Real-time:** Updates as sliders change

### 5. Navigation
- **Click Item:** Navigate to project detail page
- **Arrow Button:** Same as click item
- **All Projects Link:** Navigate to full risk dashboard
- **Settings:** Opens modal overlay

---

## 31. DATA STRUCTURE

### Risk Item Interface
```typescript
interface RiskItem {
  id: number;           // Unique identifier
  project: string;      // Project name
  riskScore: number;    // Score 0-100
  color: string;        // Severity color (hex)
  issues: string;       // Comma-separated issues
}
```

### Threshold Settings Interface
```typescript
interface ThresholdSettings {
  budgetVariance: number;   // Percentage (5-50)
  scheduleDelay: number;    // Weeks (1-12)
  riskScore: number;        // Score (50-90)
}
```

### Real Implementation Considerations
```typescript
interface RiskProject {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'warning' | 'caution';
  issues: {
    overdueTasks?: number;
    budgetVariance?: number;      // Amount over/under
    budgetVariancePercent?: number;
    scheduleDelay?: number;        // Days/weeks late
    blockedTasks?: number;
    dependencies?: number;
    resourceShortfall?: number;
  };
  lastUpdated: Date;
  projectManager: string;
  department: string;
}
```

---

## 32. DESIGN TOKENS SUMMARY

### Spacing Scale (Tailwind)
- **0.5:** 2px (score badge padding vertical, arrow padding)
- **1:** 4px (items gap, score badge radius)
- **1.5:** 6px (item padding, footer padding vertical, score badge padding horizontal)
- **2:** 8px (item gap, risk dot size, modal label margin, header padding vertical, modal icon container, widget radius)
- **3:** 12px (header/footer padding horizontal, modal header gap, modal input gap, modal footer gap)
- **4:** 16px (info box padding, modal header/footer padding vertical)
- **6:** 24px (modal content/header/footer padding horizontal)

### Radius Scale
- **4px:** Score badge, arrow button
- **6px:** Widget container
- **8px:** Risk item, modal container, modal icon, modal badges, modal buttons
- **full:** Risk dot, count badge

### Font Size Scale
- **10px:** Count badge, risk score, issues text
- **11px:** Settings button, footer link
- **12px:** Project name, modal help text
- **13px:** Modal subtitle, info box
- **14px:** Header title, modal labels, modal buttons, modal value badge
- **18px:** Modal title

### Font Weight Scale
- **400 (Regular):** Settings button, issues text, footer link, modal subtitle/help
- **500 (Medium):** Header title, modal labels, modal buttons
- **600 (Semibold):** Modal title, modal value badge
- **700 (Bold):** Count badge, project name, risk score badge

---

## SUMMARY

The Red Zone Widget is a critical project health monitoring dashboard featuring:

### Key Features
- **Risk Severity Colors:** Red/Amber spectrum (Critical → Caution)
- **Compact One-Line Layout:** Project + Score + Issues + Arrow
- **Risk Indicator Dots:** 8px colored circles for at-a-glance severity
- **Inline Risk Scores:** Badge-styled scores with semi-transparent backgrounds
- **Count Badge:** Circular badge showing total at-risk projects
- **Settings Modal:** Configure thresholds for budget, schedule, risk score
- **Dynamic Filtering:** Live preview of threshold impact
- **Hover Interactions:** Subtle shadow elevation on item hover

### Visual Design
- **Red Theme:** #F87171 → #FCA5A5 gradient accent for urgency
- **Risk Colors:** Red 500 (critical) → Amber 300 (caution)
- **Clean Typography:** 12px bold project names, 10px issues
- **Compact Layout:** ~32px per item for high information density
- **Badge Styling:** Risk scores with color-coded backgrounds

### Settings Modal
- **480px Width:** Centered overlay modal
- **Three Controls:** Budget variance, schedule delay, risk score
- **Range Sliders:** Red-accented native inputs
- **Value Badges:** Red 100 background with Red 500 text
- **Info Box:** Yellow warning box with dynamic count
- **Dual Actions:** Cancel (gray) + Save (red)

### Interaction Patterns
- **Click Item:** Navigate to project details
- **Hover Item:** Show subtle shadow
- **Settings:** Opens threshold configuration modal
- **Sliders:** Adjust risk criteria in real-time
- **All Projects:** Navigate to full dashboard

### Technical Sophistication
- **Risk Scoring Algorithm:** 0-100 scale with color mapping
- **Threshold Configuration:** Customizable alert criteria
- **Dynamic Filtering:** Real-time project count updates
- **State Management:** React hooks for settings
- **Modal Overlay:** Full-screen backdrop with centered dialog
- **Color Gradients:** Semi-transparent badge backgrounds

The widget successfully provides critical project monitoring in a compact 340px space, with sophisticated threshold configuration through a polished settings modal.
