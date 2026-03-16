# Pending Approvals Widget - Complete Design Specification

## Overview
The Pending Approvals Widget displays items requiring user approval (budget requests, time off, purchases, contractor approvals) with inline approve/reject actions. It uses a pink/rose color scheme to signify items requiring attention.

---

## Widget Structure

```
┌──────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓ Pink Gradient Top Accent ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← 4px height
├──────────────────────────────────────────────────┤
│ 🔔 Pending Approvals                         [4] │ ← Header (36px min)
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Budget increase for BIOGEMSE        URGENT │ │
│  │ Charlie Day • €12,500                      │ │
│  │ [✓ Approve]              [✗ Reject]        │ │
│  └────────────────────────────────────────────┘ │
│                                                  │ ← Content area
│  ┌────────────────────────────────────────────┐ │   (scrollable)
│  │ Time off request                           │ │
│  │ Alice Chen • Dec 23-27                     │ │
│  │ [✓ Approve]              [✗ Reject]        │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
├──────────────────────────────────────────────────┤
│ Settings                                         │ ← Footer (30px min)
└──────────────────────────────────────────────────┘
```

---

## 1. CONTAINER

### Outer Container
- **Element:** `<div>`
- **Background:** `#FFFFFF` (white)
- **Border Radius:** `6px` (rounded-lg)
- **Box Shadow:** `0 2px 8px rgba(0,0,0,0.1)`
  - Subtle shadow for card elevation
  - 2px vertical offset, 8px blur
  - 10% black opacity
- **Position:** `relative`
- **Overflow:** `hidden` (clips gradient at edges)
- **Height:** `100%` (fills grid cell)
- **Display:** `flex`
- **Flex Direction:** `column`

### Purpose
Creates a clean, elevated card with rounded corners and subtle depth.

---

## 2. TOP ACCENT GRADIENT

### Visual Element
- **Element:** `<div>`
- **Position:** `absolute`
- **Location:** `left: 0, right: 0, top: 0`
- **Height:** `4px` (h-1 in Tailwind = 4px actual render)
- **Background:** `linear-gradient(90deg, #F472B6 0%, #FBCFE8 100%)`
  - **Start Color (0%):** `#F472B6` - Hot Pink/Rose 400
  - **End Color (100%):** `#FBCFE8` - Light Pink/Rose 200
  - **Direction:** Left to right (90deg)

### Color Details
- **#F472B6** (Rose 400):
  - RGB: 244, 114, 182
  - HSL: 326°, 85%, 70%
  - Vibrant, attention-grabbing pink
  
- **#FBCFE8** (Rose 200):
  - RGB: 251, 207, 232
  - HSL: 326°, 85%, 90%
  - Soft, pastel pink

### Purpose
Visual brand identifier for the widget type; creates immediate recognition and adds visual interest.

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
- **Gap:** `6px` (gap-1.5)

### Icon Element
- **Component:** `<AlertCircle>` from lucide-react
- **Size:** `16px × 16px` (w-4 h-4)
- **Color:** `#F472B6` (Rose 400 - matches gradient start)
- **Style:** Outline/stroke icon
- **Stroke Width:** 2px (Lucide default)

### Title Text
- **Element:** `<h3>`
- **Text:** "Pending Approvals"
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#1F2937` (Gray 800)
- **Line Height:** Default (1.5 for headings)

### Count Badge
- **Element:** `<span>`
- **Size:** `16px × 16px` (w-4 h-4)
- **Shape:** Circle (rounded-full)
- **Background:** `#F472B6` (Rose 400)
- **Text Color:** `#FFFFFF` (white)
- **Font Size:** `10px`
- **Font Weight:** `700` (font-bold)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`
- **Content:** Dynamic count of approval items

### Visual Hierarchy
```
[🔔 Icon]  [Pending Approvals]  [4]
   ↓              ↓               ↓
 Pink         Dark Gray       Pink Badge
 16px          14px            10px bold
 Accent      Medium Weight     White text
```

---

## 4. CONTENT AREA (SCROLLABLE)

### Scrollable Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `6px` (py-1.5)
- **Flex:** `1` (takes all remaining vertical space)
- **Overflow Y:** `auto` (vertical scroll when needed)
- **Scrollbar:** Custom styled (custom-scrollbar class)

### Item Container
- **Element:** `<div>`
- **Spacing:** `6px` between items (space-y-1.5)

---

## 5. APPROVAL CARD (INDIVIDUAL ITEM)

### Card Container
- **Element:** `<div>`
- **Background:** `#FAFAFA` (Gray 50 - very light gray)
- **Border Radius:** `6px` (rounded-lg)
- **Padding:** `8px` all sides (p-2)
- **Border:** `1px solid #F3F4F6` (Gray 100)
- **Cursor:** `pointer`
- **Transition:** `all 150ms` (transition-all)

### Hover State
- **Box Shadow:** Elevated shadow appears (hover:shadow-sm)
  - `0 1px 2px rgba(0, 0, 0, 0.05)`
- **Effect:** Subtle lift on hover to indicate interactivity

### Card Structure
```
┌─────────────────────────────────────────┐
│ [Title]                        [URGENT] │ ← Top row (flex)
│ Requestor • Amount                      │ ← Meta row
│ ───────────────────────────────────────  │
│ [✓ Approve]         [✗ Reject]          │ ← Action row
└─────────────────────────────────────────┘
```

---

## 6. APPROVAL CARD - TOP ROW

### Container
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `start` (top-aligned)
- **Justify Content:** `space-between`
- **Margin Bottom:** `6px` (mb-1.5)

### Title Section (Left)
- **Element:** `<div>`
- **Flex:** `1` (takes available space)
- **Min Width:** `0` (allows text truncation)

#### Title Text
- **Element:** `<p>`
- **Font Size:** `12px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#1F2937` (Gray 800)
- **Line Height:** `tight` (1.25)
- **Text Overflow:** `truncate` (ellipsis if too long)
- **Examples:**
  - "Budget increase for BIOGEMSE"
  - "Time off request"
  - "Equipment purchase"
  - "Contractor approval"

#### Metadata Text
- **Element:** `<p>`
- **Font Size:** `10px`
- **Color:** `#9CA3AF` (Gray 400 - muted)
- **Margin Top:** `2px` (mt-0.5)
- **Format:** `{Requestor} • {Amount}`
- **Separator:** Bullet point (•)
- **Examples:**
  - "Charlie Day • €12,500"
  - "Alice Chen • Dec 23-27"
  - "Bob Ross • €8,200"
  - "Emma Wilson • €5,400/mo"

### Urgent Badge (Right) - Conditional
- **Element:** `<span>`
- **Display:** Only when `approval.urgent === true`
- **Font Size:** `9px`
- **Font Weight:** `700` (font-bold)
- **Padding:**
  - Horizontal: `6px` (px-1.5)
  - Vertical: `2px` (py-0.5)
- **Background:** `#FEE2E2` (Red 100 - light red)
- **Text Color:** `#DC2626` (Red 600 - dark red)
- **Border Radius:** `4px` (rounded)
- **Margin Left:** `8px` (ml-2)
- **Flex Shrink:** `0` (doesn't shrink)
- **Text:** "URGENT"
- **Letter Spacing:** Slightly wider (uppercase emphasis)

### Visual Weight
```
Title Text         Urgent Badge
12px Medium        9px Bold
Gray 800          Red 600 on Red 100
Truncates         Fixed size
```

---

## 7. APPROVAL CARD - ACTION BUTTONS ROW

### Container
- **Element:** `<div>`
- **Display:** `flex`
- **Gap:** `8px` (gap-2)
- **Justify Content:** `space-between`

### Approve Button (Left)
- **Element:** `<button>`
- **Background:** `#34D399` (Green 400 - emerald)
- **Hover Background:** `#10B981` (Green 500 - darker emerald)
- **Text Color:** `#FFFFFF` (white)
- **Font Size:** `11px`
- **Font Weight:** `500` (font-medium)
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `4px` (py-1)
- **Border Radius:** `6px` (rounded-lg)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`
- **Gap:** `4px` (gap-1)
- **Transition:** `colors 150ms` (transition-colors)
- **Cursor:** `pointer`

#### Approve Icon
- **Component:** `<Check>` from lucide-react
- **Size:** `12px × 12px` (w-3 h-3)
- **Color:** `#FFFFFF` (white - inherited)
- **Stroke Width:** 2px

#### Button Text
- **Text:** "Approve"
- **Color:** White
- **Alignment:** Centered with icon

### Reject Button (Right)
- **Element:** `<button>`
- **Background:** `#F87171` (Red 400)
- **Hover Background:** `#EF4444` (Red 500 - darker red)
- **Text Color:** `#FFFFFF` (white)
- **Font Size:** `11px`
- **Font Weight:** `500` (font-medium)
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `4px` (py-1)
- **Border Radius:** `6px` (rounded-lg)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`
- **Gap:** `4px` (gap-1)
- **Transition:** `colors 150ms` (transition-colors)
- **Cursor:** `pointer`

#### Reject Icon
- **Component:** `<X>` from lucide-react
- **Size:** `12px × 12px` (w-3 h-3)
- **Color:** `#FFFFFF` (white - inherited)
- **Stroke Width:** 2px

#### Button Text
- **Text:** "Reject"
- **Color:** White
- **Alignment:** Centered with icon

### Button Layout
```
┌──────────────┐         ┌──────────────┐
│ ✓  Approve   │  8px   │ ✗  Reject    │
│ Green        │   gap   │ Red          │
└──────────────┘         └──────────────┘
    Equal width (flex-1 if needed)
```

---

## 8. FOOTER SECTION

### Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `6px` (py-1.5)
- **Border Top:** `1px solid #E5E7EB` (Gray 200)
- **Min Height:** `30px`

### Settings Button
- **Element:** `<button>`
- **Font Size:** `11px`
- **Color:** `#9CA3AF` (Gray 400 - muted)
- **Hover Color:** `#111827` (Gray 900 - almost black)
- **Transition:** `color 150ms`
- **Cursor:** `pointer`
- **Text:** "Settings"
- **Background:** Transparent
- **Border:** None
- **Padding:** None (clickable text link style)

---

## 9. COLOR PALETTE

### Primary Colors (Pink/Rose Theme)
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Rose 400 | `#F472B6` | Top gradient start, icon, count badge |
| Rose 200 | `#FBCFE8` | Top gradient end |

### Text Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 800 | `#1F2937` | Primary text (titles, headings) |
| Gray 900 | `#111827` | Hover state for settings link |
| Gray 400 | `#9CA3AF` | Secondary text (metadata, footer) |
| White | `#FFFFFF` | Button text, badge text |

### Background Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| White | `#FFFFFF` | Widget background |
| Gray 50 | `#FAFAFA` | Card background |
| Gray 100 | `#F3F4F6` | Card border |

### Action Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Green 400 | `#34D399` | Approve button |
| Green 500 | `#10B981` | Approve button hover |
| Red 400 | `#F87171` | Reject button |
| Red 500 | `#EF4444` | Reject button hover |
| Red 100 | `#FEE2E2` | Urgent badge background |
| Red 600 | `#DC2626` | Urgent badge text |

### Border Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 200 | `#E5E7EB` | Header/footer borders |
| Gray 100 | `#F3F4F6` | Card borders |

---

## 10. TYPOGRAPHY SCALE

### Font Family
- **All Text:** `Inter` (via globals.css)
- **Fallback:** System UI fonts

### Size & Weight Breakdown
| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| Widget Title | 14px | 500 (Medium) | #1F2937 | Default |
| Count Badge | 10px | 700 (Bold) | #FFFFFF | Default |
| Card Title | 12px | 500 (Medium) | #1F2937 | Tight (1.25) |
| Card Metadata | 10px | 400 (Regular) | #9CA3AF | Default |
| Urgent Badge | 9px | 700 (Bold) | #DC2626 | Default |
| Action Buttons | 11px | 500 (Medium) | #FFFFFF | Default |
| Footer Link | 11px | 400 (Regular) | #9CA3AF | Default |

---

## 11. SPACING & LAYOUT

### Grid Measurements
```
Container (100% height)
│
├─ Top Gradient: 4px
│
├─ Header: 36px min
│  ├─ Padding: 12px (horizontal) × 8px (vertical)
│  └─ Gap: 6px between elements
│
├─ Content: flex-1 (remaining space)
│  ├─ Padding: 12px (horizontal) × 6px (vertical)
│  ├─ Cards: 6px gap between
│  │
│  └─ Each Card:
│     ├─ Padding: 8px all around
│     ├─ Border: 1px
│     ├─ Border Radius: 6px
│     │
│     ├─ Top Row: 6px margin bottom
│     ├─ Metadata: 2px margin top
│     │
│     └─ Buttons:
│        ├─ Padding: 12px (h) × 4px (v)
│        ├─ Gap: 8px between buttons
│        └─ Icon gap: 4px
│
└─ Footer: 30px min
   └─ Padding: 12px (horizontal) × 6px (vertical)
```

---

## 12. INTERACTIVE STATES

### Card Hover
- **Trigger:** Mouse over card
- **Effect:** 
  - Shadow increases (hover:shadow-sm)
  - Subtle elevation effect
- **Duration:** Smooth (transition-all)
- **Cursor:** Pointer

### Approve Button States
| State | Background | Text | Icon | Cursor |
|-------|------------|------|------|--------|
| Default | #34D399 | White | White Check | Default |
| Hover | #10B981 | White | White Check | Pointer |
| Active | (undefined) | White | White Check | Pointer |
| Focus | (undefined) | White | White Check | Pointer |

### Reject Button States
| State | Background | Text | Icon | Cursor |
|-------|------------|------|------|--------|
| Default | #F87171 | White | White X | Default |
| Hover | #EF4444 | White | White X | Pointer |
| Active | (undefined) | White | White X | Pointer |
| Focus | (undefined) | White | White X | Pointer |

### Settings Link States
| State | Color | Cursor |
|-------|-------|--------|
| Default | #9CA3AF | Default |
| Hover | #111827 | Pointer |

---

## 13. SCROLLBAR STYLING

### Custom Scrollbar (custom-scrollbar class)
Assuming standard Workdeck scrollbar styling:
- **Width:** ~6px
- **Track:** Transparent or very light gray
- **Thumb:** Light gray (#D1D5DB)
- **Thumb Hover:** Medium gray (#9CA3AF)
- **Border Radius:** Rounded

---

## 14. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Uses proper heading (`<h3>`)
- **Button Elements:** Proper `<button>` for interactions
- **Text Contrast:** 
  - Gray 800 on White: ~12:1 ratio ✓
  - White on Green 400: ~3.5:1 ratio ⚠️ (AA for large text)
  - White on Red 400: ~3.5:1 ratio ⚠️ (AA for large text)
  - Red 600 on Red 100: ~4.5:1 ratio ✓

### Potential Improvements
- Add ARIA labels for buttons
- Add aria-live region for approval updates
- Keyboard navigation for approve/reject
- Focus visible states
- Screen reader announcements

---

## 15. RESPONSIVE BEHAVIOR

### Current Behavior
- **Width:** Inherits from grid cell (1fr - flexible)
- **Height:** 100% of grid cell
- **Content:** Scrolls vertically when overflow
- **Text:** Truncates with ellipsis if too long
- **Buttons:** Flex layout maintains spacing

### Breakpoint Considerations
Widget is designed for desktop dashboard - mobile version would need:
- Stacked button layout
- Larger touch targets
- Adjusted font sizes

---

## 16. DATA STRUCTURE

### Approval Object Schema
```typescript
interface Approval {
  id: number;           // Unique identifier
  title: string;        // Main approval description
  requestor: string;    // Person requesting approval
  amount: string;       // Dollar amount or date range
  urgent: boolean;      // Shows red URGENT badge
}
```

### Sample Data
```javascript
[
  { 
    id: 1, 
    title: 'Budget increase for BIOGEMSE', 
    requestor: 'Charlie Day', 
    amount: '€12,500', 
    urgent: true 
  },
  { 
    id: 2, 
    title: 'Time off request', 
    requestor: 'Alice Chen', 
    amount: 'Dec 23-27', 
    urgent: false 
  },
  { 
    id: 3, 
    title: 'Equipment purchase', 
    requestor: 'Bob Ross', 
    amount: '€8,200', 
    urgent: false 
  },
  { 
    id: 4, 
    title: 'Contractor approval', 
    requestor: 'Emma Wilson', 
    amount: '€5,400/mo', 
    urgent: true 
  }
]
```

---

## 17. ANIMATION & TRANSITIONS

### Defined Transitions
| Element | Property | Duration | Timing |
|---------|----------|----------|--------|
| Card | all | 150ms | ease |
| Approve Button | colors | 150ms | ease |
| Reject Button | colors | 150ms | ease |
| Settings Link | color | 150ms | ease |

### Transition Effects
- **Color Changes:** Smooth fade between states
- **Shadow:** Subtle elevation on hover
- **No Animation:** Position, size changes (instant)

---

## 18. SHADOW SYSTEM

### Box Shadows Used
| Element | Shadow | Values |
|---------|--------|--------|
| Widget Container | Elevated | `0 2px 8px rgba(0,0,0,0.1)` |
| Card Hover | Small | `0 1px 2px rgba(0,0,0,0.05)` |

### Shadow Breakdown
**Widget Container:**
- **X Offset:** 0px (centered)
- **Y Offset:** 2px (drops down slightly)
- **Blur Radius:** 8px (soft edge)
- **Spread:** 0px
- **Color:** Black at 10% opacity

**Card Hover:**
- **X Offset:** 0px
- **Y Offset:** 1px (subtle drop)
- **Blur Radius:** 2px (tight, subtle)
- **Spread:** 0px
- **Color:** Black at 5% opacity

---

## 19. ICON SPECIFICATIONS

### Icons Used (from lucide-react)
1. **AlertCircle** (Header)
   - Size: 16×16px
   - Color: #F472B6
   - Stroke: 2px
   - Style: Outline

2. **Check** (Approve button)
   - Size: 12×12px
   - Color: White
   - Stroke: 2px
   - Style: Outline

3. **X** (Reject button)
   - Size: 12×12px
   - Color: White
   - Stroke: 2px
   - Style: Outline

### Icon Alignment
- Header icon: Vertically centered with text
- Button icons: Centered with text, 4px gap

---

## 20. BORDER SYSTEM

### Border Specifications
| Element | Width | Color | Radius |
|---------|-------|-------|--------|
| Widget | - | - | 6px |
| Header Bottom | 1px | #E5E7EB | - |
| Footer Top | 1px | #E5E7EB | - |
| Card | 1px | #F3F4F6 | 6px |
| Buttons | - | - | 6px |
| Urgent Badge | - | - | 4px |
| Count Badge | - | - | Full (circle) |

---

## 21. DESIGN TOKENS SUMMARY

### Spacing Tokens
- **xs:** 2px
- **sm:** 4px
- **md:** 6px
- **lg:** 8px
- **xl:** 12px
- **2xl:** 16px

### Radius Tokens
- **sm:** 4px
- **md:** 6px
- **full:** 9999px (circle)

### Font Size Tokens
- **xs:** 9px
- **sm:** 10px
- **base:** 11px
- **md:** 12px
- **lg:** 14px

---

## SUMMARY

The Pending Approvals Widget is a sophisticated, well-designed component featuring:
- **Pink/Rose branding** for immediate recognition
- **Efficient layout** showing 4 approvals in compact cards
- **Clear CTAs** with green/red color coding
- **Visual hierarchy** with bold urgent badges
- **Smooth interactions** with hover states and transitions
- **Accessible structure** with semantic HTML
- **Scrollable content** for handling many approvals
- **Consistent spacing** following 4px base unit system
