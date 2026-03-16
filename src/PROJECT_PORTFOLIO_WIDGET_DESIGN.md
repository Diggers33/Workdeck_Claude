# Project Portfolio Widget - Complete Design Specification

## Overview
The Project Portfolio Widget is a dashboard widget displaying a scrollable list of projects with status indicators, progress bars, and metadata. It features a blue gradient accent, filter dropdown, status pills with color-coded backgrounds, inline progress bars, and clickable project rows. The widget spans a full-width dashboard grid cell and includes a Briefcase icon header.

---

## Widget Structure

```
┌────────────────────────────────────────────┐
│ ▓▓▓▓▓ Blue Gradient Top Accent ▓▓▓▓▓▓▓▓▓▓ │ ← 4px height
├────────────────────────────────────────────┤
│ 💼 Project Portfolio    [My projects ▾]   │ ← Header (40px)
├────────────────────────────────────────────┤
│ Phoenix Rebrand         [On Track]      → │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← 68% progress
│ 8 open • 2 overdue                         │
├────────────────────────────────────────────┤ ← 1px divider
│ Apex Digital Redesign   [At Risk]       → │ ← Scrollable
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   content
│ Next milestone in 4 days                   │
├────────────────────────────────────────────┤
│ Stellar Analytics       [Critical]      → │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Budget used: 87%                           │
└────────────────────────────────────────────┘
```

---

## 1. CONTAINER

### Outer Container
- **Element:** `<div>`
- **Background:** `#FFFFFF` (white)
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `8px` (rounded-lg)
- **Box Shadow:** `0 1px 3px 0 rgba(0, 0, 0, 0.1)`
  - 1px vertical offset, 3px blur
  - 10% black opacity
- **Height:** `100%` (fills grid cell - typically 340px or 680px)
- **Display:** `flex`
- **Flex Direction:** `column`
- **Overflow:** `hidden`
- **Position:** `relative`

### Purpose
Dashboard widget for project portfolio overview.

---

## 2. TOP ACCENT GRADIENT

### Visual Element
- **Element:** `<div>`
- **Position:** `absolute`
- **Location:** `left: 0, right: 0, top: 0`
- **Height:** `4px`
- **Background:** `linear-gradient(90deg, #93C5FD 0%, #BFDBFE 100%)`
  - **Start Color (0%):** `#93C5FD` - Blue 300
  - **End Color (100%):** `#BFDBFE` - Blue 200 (lighter)
  - **Direction:** Left to right (90deg)

### Color Details
- **#93C5FD** (Blue 300):
  - RGB: 147, 197, 253
  - HSL: 214°, 95%, 78%
  - Bright blue
  
- **#BFDBFE** (Blue 200):
  - RGB: 191, 219, 254
  - HSL: 214°, 95%, 87%
  - Very light blue

### Purpose
Visual brand identifier for project-related widgets.

---

## 3. HEADER SECTION

### Container
- **Element:** `<div>`
- **Height:** `40px` (fixed)
- **Padding:** `0 20px`
- **Border Bottom:** `1px solid #E5E7EB` (Gray 200)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`
- **Flex Shrink:** `0` (doesn't compress)
- **Position:** `relative`

---

## 4. HEADER LEFT SIDE (TITLE)

### Title Container
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `6px`
- **Cursor:** `pointer` (if onHeaderClick provided)
- **Transition:** `color 150ms ease`

### Briefcase Icon
- **Component:** `<Briefcase>` from lucide-react
- **Size:** `16px × 16px`
- **Color:** `#60A5FA` (Blue 400)
- **Stroke Width:** 2px

### Title Text
- **Element:** `<h3>`
- **Text:** "Project Portfolio"
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#1F2937` (Gray 800)
- **Margin:** `0`

### Visual Layout
```
[💼]  Project Portfolio
  ↓           ↓
16px      14px medium
Blue 400  Gray 800
```

---

## 5. HEADER RIGHT SIDE (FILTER DROPDOWN)

### Filter Button
- **Element:** `<button>`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `4px`
- **Font Size:** `12px`
- **Color:** `#6B7280` (Gray 500)
- **Background:** Transparent
- **Border:** None
- **Cursor:** `pointer`
- **Padding:** `4px 6px`
- **Border Radius:** `4px`
- **Transition:** `background 150ms ease`
- **Position:** `relative`

### Hover State
- **Background:** `#F9FAFB` (Gray 50)
- **Transition:** `background 150ms ease`

### Button Content
- **Text:** Current filter (e.g., "My projects")
- **Icon:** `<ChevronDown>` 12px × 12px

### Visual
```
[My projects ▾]
      ↓       ↓
   12px    12px icon
   Gray 500
   Hover: Gray 50 bg
```

---

## 6. FILTER DROPDOWN MENU

### Backdrop
- **Element:** `<div>`
- **Position:** `fixed`
- **Inset:** `0` (covers viewport)
- **Z-Index:** `5`
- **Click:** Closes menu

### Menu Container
- **Element:** `<div>`
- **Position:** `absolute`
- **Right:** `20px`
- **Top:** `40px` (below header)
- **Background:** `#FFFFFF` (white)
- **Border:** `1px solid #E5E7EB` (Gray 200)
- **Border Radius:** `6px`
- **Box Shadow:** `0 4px 12px rgba(0, 0, 0, 0.15)`
  - 4px vertical offset, 12px blur
  - 15% black opacity
- **Z-Index:** `10`
- **Min Width:** `160px`
- **Padding:** `4px 0` (top/bottom only)

### Menu Options
- **Options:** 'My projects', 'All projects', 'Critical', 'At risk', 'Upcoming'

### Menu Item Button
- **Element:** `<button>`
- **Width:** `100%`
- **Display:** `block`
- **Text Align:** `left`
- **Font Size:** `13px`
- **Color (default):** `#0A0A0A` (near black)
- **Color (selected):** `#0066FF` (primary blue)
- **Background:** `transparent`
- **Border:** None
- **Cursor:** `pointer`
- **Padding:** `8px 16px`
- **Transition:** `background 150ms ease`

### Hover State
- **Background:** `#F9FAFB` (Gray 50)
- **Transition:** `background 150ms ease`

### Visual
```
┌─────────────────┐
│ My projects  ✓  │ ← Selected (blue text)
├─────────────────┤
│ All projects    │ ← Hover (gray 50 bg)
├─────────────────┤
│ Critical        │
├─────────────────┤
│ At risk         │
├─────────────────┤
│ Upcoming        │
└─────────────────┘
  160px min-width
  Shadow for depth
```

---

## 7. PROJECT LIST AREA

### Scrollable Container
- **Element:** `<div>`
- **Flex:** `1` (takes remaining vertical space)
- **Overflow Y:** `auto` (vertical scroll)
- **Overflow X:** `hidden` (no horizontal scroll)

### Scroll Behavior
- Native browser scrollbar
- Scrollable when projects exceed available height

---

## 8. PROJECT ROW STRUCTURE

### Row Container
- **Element:** `<div>`
- **Height:** `74px` (fixed)
- **Padding:** `12px 20px`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `12px`
- **Cursor:** `pointer`
- **Transition:** `background 150ms ease`

### Hover State
- **Background:** `#F9FAFB` (Gray 50)
- **Transition:** `background 150ms ease`

### Row Layout
```
┌───────────────────────────────────────┐
│ Left Column (flex: 1)     Right Col   │
│ ├─ Name + Status pill    Arrow icon   │
│ ├─ Progress bar                        │
│ └─ Metadata                            │
└───────────────────────────────────────┘
  74px height total
  12px padding top/bottom
  20px padding left/right
```

---

## 9. PROJECT LEFT COLUMN

### Column Container
- **Element:** `<div>`
- **Flex:** `1` (takes remaining space)
- **Min Width:** `0` (allows text truncation)
- **Display:** `flex`
- **Flex Direction:** `column`
- **Gap:** `6px` (between rows)

### Structure
```
├─ Line 1: Project Name + Status Pill
├─ Line 2: Progress Bar (4px height)
└─ Line 3: Metadata text
```

---

## 10. LINE 1: PROJECT NAME + STATUS PILL

### Line Container
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `8px`

### Project Name
- **Element:** `<span>`
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#0A0A0A` (near black)
- **Overflow:** `hidden`
- **Text Overflow:** `ellipsis`
- **White Space:** `nowrap`
- **Flex:** `1` (takes remaining space)
- **Examples:** "Phoenix Rebrand", "Apex Digital Redesign", "Stellar Analytics Platform"

### Status Pill
- **Element:** `<span>`
- **Height:** `18px`
- **Font Size:** `11px`
- **Font Weight:** `500` (font-medium)
- **Padding:** `0 6px`
- **Border Radius:** `6px`
- **White Space:** `nowrap`
- **Flex Shrink:** `0` (doesn't compress)
- **Display:** `flex`
- **Align Items:** `center`

### Status Colors

| Status | Label | Background | Text Color |
|--------|-------|------------|------------|
| **on-track** | On Track | `#D1FAE5` (Emerald 100) | `#065F46` (Emerald 800) |
| **at-risk** | At Risk | `#FEF3C7` (Amber 100) | `#92400E` (Amber 900) |
| **critical** | Critical | `#FEE2E2` (Red 100) | `#991B1B` (Red 800) |
| **upcoming** | Upcoming | `#F3F4F6` (Gray 100) | `#374151` (Gray 700) |

### Visual Examples
```
Phoenix Rebrand [On Track]
      ↓             ↓
  14px medium   11px medium
  Near black    Green text on green bg

Apex Digital Redesign [At Risk]
      ↓                  ↓
  14px medium      Amber text on amber bg

Stellar Analytics [Critical]
      ↓               ↓
  14px medium    Red text on red bg
```

---

## 11. LINE 2: PROGRESS BAR

### Progress Track (Background)
- **Element:** `<div>`
- **Height:** `4px`
- **Background:** `#E5E7EB` (Gray 200)
- **Border Radius:** `2px`
- **Overflow:** `hidden`
- **Position:** `relative`

### Progress Fill (Foreground)
- **Element:** `<div>` (child)
- **Position:** `absolute`
- **Left:** `0`
- **Top:** `0`
- **Bottom:** `0`
- **Width:** `{progress}%` (dynamic)
- **Border Radius:** `2px`
- **Transition:** `width 300ms ease`

### Progress Colors by Status

| Status | Progress Color | Hex |
|--------|----------------|-----|
| **on-track** | Emerald 400 | `#34D399` |
| **at-risk** | Amber 400 | `#FBBF24` |
| **critical** | Red 400 | `#F87171` |
| **upcoming** | Gray 400 | `#9CA3AF` |

### Visual Examples
```
On Track (68%):
━━━━━━━━━━━━━━━░░░░░░░░░░░░░
  Green fill   Gray track

At Risk (45%):
━━━━━━━━━░░░░░░░░░░░░░░░░░░░
  Amber fill   Gray track

Critical (23%):
━━━━░░░░░░░░░░░░░░░░░░░░░░░░
  Red fill     Gray track
```

---

## 12. LINE 3: METADATA TEXT

### Text Element
- **Element:** `<div>`
- **Font Size:** `12px`
- **Color:** `#6B7280` (Gray 500)
- **Overflow:** `hidden`
- **Text Overflow:** `ellipsis`
- **White Space:** `nowrap`

### Text Examples
- "8 open • 2 overdue"
- "Next milestone in 4 days"
- "Budget used: 87%"

### Format
Flexible text content, one line only with ellipsis truncation.

---

## 13. PROJECT RIGHT COLUMN (ARROW)

### Column Container
- **Element:** `<div>`
- **Flex Shrink:** `0` (doesn't compress)
- **Display:** `flex`
- **Align Items:** `center`
- **Padding Right:** `4px`

### Arrow Icon
- **Component:** `<ArrowRight>` from lucide-react
- **Size:** `14px × 14px`
- **Color:** `#D1D5DB` (Gray 300)
- **Stroke Width:** 2px

### Purpose
Visual affordance for clickable project row.

---

## 14. PROJECT ROW DIVIDER

### Divider Element
- **Element:** `<div>`
- **Height:** `1px`
- **Background:** `#E5E7EB` (Gray 200)
- **Margin:** `0`
- **Position:** Between rows (not after last)

### Logic
```javascript
{index < projects.length - 1 && (
  <div style={{ height: '1px', background: '#E5E7EB' }} />
)}
```

### Visual
```
┌────────────────────────────────┐
│ Project 1                      │
├────────────────────────────────┤ ← 1px divider
│ Project 2                      │
├────────────────────────────────┤ ← 1px divider
│ Project 3                      │
└────────────────────────────────┘ ← No divider after last
```

---

## 15. COMPLETE ROW VISUAL

### On Track Project
```
┌─────────────────────────────────────────┐
│ Phoenix Rebrand    [On Track]        → │ ← 14px + 11px pill
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░ │ ← 68% green
│ 8 open • 2 overdue                      │ ← 12px gray
└─────────────────────────────────────────┘
  74px height, 12px padding vertical
  Hover: Gray 50 background
```

### At Risk Project
```
┌─────────────────────────────────────────┐
│ Apex Digital Redesign [At Risk]      → │ ← Amber pill
│ ━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░ │ ← 45% amber
│ Next milestone in 4 days                │
└─────────────────────────────────────────┘
```

### Critical Project
```
┌─────────────────────────────────────────┐
│ Stellar Analytics   [Critical]        → │ ← Red pill
│ ━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← 23% red
│ Budget used: 87%                        │
└─────────────────────────────────────────┘
```

---

## 16. COLOR PALETTE

### Primary Colors (Blue Theme)
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Blue 300 | `#93C5FD` | Top gradient start |
| Blue 200 | `#BFDBFE` | Top gradient end |
| Blue 400 | `#60A5FA` | Briefcase icon |
| Blue 500 | `#3B82F6` | Workdeck primary (not used here) |

### Container Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| White | `#FFFFFF` | Widget background, menu background |
| Gray 200 | `#E5E7EB` | Border, dividers, progress track |

### Text Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Near Black | `#0A0A0A` | Project names, menu items |
| Gray 800 | `#1F2937` | Header title |
| Gray 700 | `#374151` | Upcoming status text |
| Gray 500 | `#6B7280` | Metadata, filter button |
| Gray 300 | `#D1D5DB` | Arrow icon |
| Primary Blue | `#0066FF` | Selected menu item |

### Status Pill Colors
| Status | Background | Text |
|--------|------------|------|
| On Track | `#D1FAE5` (Emerald 100) | `#065F46` (Emerald 800) |
| At Risk | `#FEF3C7` (Amber 100) | `#92400E` (Amber 900) |
| Critical | `#FEE2E2` (Red 100) | `#991B1B` (Red 800) |
| Upcoming | `#F3F4F6` (Gray 100) | `#374151` (Gray 700) |

### Progress Bar Colors
| Status | Color | Hex |
|--------|-------|-----|
| On Track | Emerald 400 | `#34D399` |
| At Risk | Amber 400 | `#FBBF24` |
| Critical | Red 400 | `#F87171` |
| Upcoming | Gray 400 | `#9CA3AF` |

### Background Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 50 | `#F9FAFB` | Hover states (row, button, menu) |

---

## 17. TYPOGRAPHY SCALE

### Font Family
- **All Text:** `Inter` (via globals.css)
- **Fallback:** System UI fonts

### Widget Typography
| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Header Title | 14px | 500 (Medium) | #1F2937 |
| Filter Button | 12px | 400 (Regular) | #6B7280 |
| Menu Item | 13px | 400 (Regular) | #0A0A0A |
| Menu Item (Selected) | 13px | 400 (Regular) | #0066FF |
| Project Name | 14px | 500 (Medium) | #0A0A0A |
| Status Pill | 11px | 500 (Medium) | Dynamic |
| Metadata | 12px | 400 (Regular) | #6B7280 |

---

## 18. SPACING & LAYOUT

### Widget Measurements
```
Container (340px width typical × 340px or 680px height)
│
├─ Top Gradient: 4px
│
├─ Header: 40px fixed
│  └─ Padding: 0 20px
│     ├─ Icon: 16px
│     ├─ Gap: 6px
│     ├─ Title: 14px
│     └─ Filter: 12px
│
├─ Project List: flex-1 (remaining space)
│  │
│  └─ Project Row: 74px
│     ├─ Padding: 12px 20px
│     ├─ Gap: 12px (left to right column)
│     │
│     ├─ Left Column: flex-1
│     │  ├─ Gap: 6px (vertical)
│     │  │
│     │  ├─ Line 1: Name + Pill
│     │  │  ├─ Gap: 8px
│     │  │  ├─ Name: 14px, truncate
│     │  │  └─ Pill: 18px height, 11px text
│     │  │
│     │  ├─ Line 2: Progress Bar
│     │  │  └─ Height: 4px
│     │  │
│     │  └─ Line 3: Metadata
│     │     └─ 12px, truncate
│     │
│     └─ Right Column: 14px icon
│        └─ Padding right: 4px
│
└─ Divider: 1px (between rows)
```

### Key Measurements
- **Header Height:** 40px
- **Row Height:** 74px (12px padding × 2 + 50px content)
- **Progress Bar:** 4px height
- **Status Pill:** 18px height, 6px horizontal padding
- **Icon Size:** 16px (header), 14px (arrow)
- **Gap (vertical):** 6px between name/progress/metadata
- **Gap (horizontal):** 8px (name to pill), 12px (left to right column)

---

## 19. SHADOW SYSTEM

### Widget Container Shadow
- **Values:** `0 1px 3px 0 rgba(0, 0, 0, 0.1)`
- **Breakdown:**
  - X: 0px, Y: 1px, Blur: 3px, Spread: 0px
  - Color: Black at 10% opacity
- **Effect:** Subtle elevation

### Filter Menu Shadow
- **Values:** `0 4px 12px rgba(0, 0, 0, 0.15)`
- **Breakdown:**
  - X: 0px, Y: 4px, Blur: 12px
  - Color: Black at 15% opacity
- **Effect:** Stronger elevation for dropdown

---

## 20. BORDER SYSTEM

| Element | Width | Color | Radius |
|---------|-------|-------|--------|
| Widget Container | 1px | #E5E7EB | 8px |
| Header Bottom | 1px | #E5E7EB | - |
| Row Divider | 1px | #E5E7EB | - |
| Filter Menu | 1px | #E5E7EB | 6px |
| Status Pill | - | - | 6px |
| Progress Track | - | - | 2px |
| Progress Fill | - | - | 2px |
| Filter Button | - | - | 4px |

---

## 21. ANIMATION & TRANSITIONS

### Defined Transitions
| Element | Property | Duration | Timing |
|---------|----------|----------|--------|
| Project Row | background | 150ms | ease |
| Filter Button | background | 150ms | ease |
| Menu Item | background | 150ms | ease |
| Progress Fill | width | 300ms | ease |
| Header Title | color | 150ms | ease |

### State Transitions
- **Row Hover:** transparent → Gray 50 (150ms)
- **Button Hover:** transparent → Gray 50 (150ms)
- **Menu Hover:** transparent → Gray 50 (150ms)
- **Progress:** width animates on change (300ms)

---

## 22. INTERACTIVE STATES

### Project Row States

#### Default
```css
background: transparent
cursor: pointer
```

#### Hover
```css
background: #F9FAFB (Gray 50)
transition: background 150ms ease
cursor: pointer
```

### Filter Button States

#### Default
```css
background: transparent
color: #6B7280 (Gray 500)
```

#### Hover
```css
background: #F9FAFB (Gray 50)
transition: background 150ms ease
```

### Menu Item States

#### Default
```css
background: transparent
color: #0A0A0A (Near black)
```

#### Selected
```css
background: transparent
color: #0066FF (Primary blue)
```

#### Hover
```css
background: #F9FAFB (Gray 50)
transition: background 150ms ease
```

---

## 23. RESPONSIVE BEHAVIOR

### Fixed Dimensions
- **Header Height:** 40px (fixed)
- **Row Height:** 74px (fixed)
- **Widget Width:** Grid cell width (typically 340px or full-width)
- **Widget Height:** 100% of grid cell (typically 340px or 680px)

### Scrolling Behavior
- **Project List:** Vertical scroll when projects exceed available height
- **Scroll Type:** Native browser scrollbar
- **Horizontal:** Hidden (no horizontal scroll)

### Text Handling
- **Project Name:** Truncates with ellipsis (text-overflow: ellipsis)
- **Metadata:** Truncates with ellipsis
- **Status Pill:** No wrapping (white-space: nowrap)
- **Min Width:** 0 on name container enables truncation

---

## 24. DATA STRUCTURE

### Project Interface
```typescript
interface Project {
  id: string;              // Unique identifier
  name: string;            // Project name
  status: 'on-track' | 'at-risk' | 'critical' | 'upcoming';
  progress: number;        // 0-100 percentage
  metadata: string;        // One-line description
}
```

### Sample Data
```typescript
const projects: Project[] = [
  {
    id: '1',
    name: 'Phoenix Rebrand',
    status: 'on-track',
    progress: 68,
    metadata: '8 open • 2 overdue'
  },
  {
    id: '2',
    name: 'Apex Digital Redesign',
    status: 'at-risk',
    progress: 45,
    metadata: 'Next milestone in 4 days'
  },
  {
    id: '3',
    name: 'Stellar Analytics Platform',
    status: 'critical',
    progress: 23,
    metadata: 'Budget used: 87%'
  }
];
```

### Status Configuration
```typescript
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'on-track':
      return { label: 'On Track', bg: '#D1FAE5', text: '#065F46' };
    case 'at-risk':
      return { label: 'At Risk', bg: '#FEF3C7', text: '#92400E' };
    case 'critical':
      return { label: 'Critical', bg: '#FEE2E2', text: '#991B1B' };
    case 'upcoming':
      return { label: 'Upcoming', bg: '#F3F4F6', text: '#374151' };
    default:
      return { label: 'Unknown', bg: '#F3F4F6', text: '#6B7280' };
  }
};
```

### Progress Color Mapping
```typescript
const getProgressColor = (status: string) => {
  switch (status) {
    case 'on-track': return '#34D399';    // Emerald 400
    case 'at-risk': return '#FBBF24';     // Amber 400
    case 'critical': return '#F87171';    // Red 400
    case 'upcoming': return '#9CA3AF';    // Gray 400
    default: return '#60A5FA';            // Blue 400
  }
};
```

---

## 25. FUNCTIONAL FEATURES

### 1. Project Navigation
- **Click Row:** Navigate to project detail page
- **Callback:** `onProjectClick(projectId)`
- **Visual Feedback:** Row hover state (gray background)

### 2. Filter Dropdown
- **Options:** 'My projects', 'All projects', 'Critical', 'At risk', 'Upcoming'
- **State:** `selectedFilter` tracks current selection
- **Toggle:** Click button opens/closes menu
- **Selection:** Click option updates filter, closes menu
- **Backdrop:** Click outside closes menu

### 3. Header Click
- **Click Header:** Navigate to full portfolio view
- **Callback:** `onHeaderClick()`
- **Condition:** Only if callback provided

### 4. Scrolling
- **Auto Scroll:** When projects exceed widget height
- **Type:** Native browser scrollbar
- **Smooth:** Native scroll behavior

### 5. Progress Animation
- **Transition:** Width changes animate over 300ms
- **Effect:** Smooth progress updates

---

## 26. STATE MANAGEMENT

### React State
```typescript
const [showFilterMenu, setShowFilterMenu] = useState(false);
const [selectedFilter, setSelectedFilter] = useState('My projects');
```

### Filter Options
```typescript
['My projects', 'All projects', 'Critical', 'At risk', 'Upcoming']
```

### Callbacks
```typescript
interface ProjectPortfolioWidgetProps {
  onProjectClick?: (projectId: string) => void;
  onHeaderClick?: () => void;
}
```

---

## 27. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Proper heading (`<h3>`), buttons
- **Button Elements:** Proper `<button>` tags for interactions
- **Hover States:** Visual feedback on interaction
- **Click Areas:** Full row clickable (74px height)

### Text Contrast Ratios
- **Near Black on White:** ~18:1 ✓ (AAA)
- **Gray 800 on White:** ~12:1 ✓ (AAA)
- **Gray 500 on White:** ~7.2:1 ✓ (AAA)
- **Emerald 800 on Emerald 100:** ~10.2:1 ✓ (AAA)
- **Amber 900 on Amber 100:** ~8.1:1 ✓ (AAA)
- **Red 800 on Red 100:** ~9.5:1 ✓ (AAA)

### Potential Improvements
- Add ARIA labels for project rows
- Add keyboard navigation (Arrow keys)
- Add `role="list"` to project list
- Add `role="listitem"` to project rows
- Add focus visible indicators
- Add `aria-expanded` to filter button
- Add `role="menu"` to dropdown
- Add `Escape` key to close dropdown
- Add screen reader text for progress percentage

---

## 28. DESIGN TOKENS SUMMARY

### Spacing Scale (Tailwind)
- **1px:** Divider height, border width
- **4px:** Top gradient, progress bar height, filter button padding
- **6px:** Icon/title gap, vertical gap (name/progress/metadata), status pill radius, menu border radius, status pill horizontal padding
- **8px:** Widget border radius, name/pill gap, menu item vertical padding
- **12px:** Row left/right column gap, row vertical padding, metadata size, filter icon size, ChevronDown size
- **16px:** Briefcase icon size, menu item horizontal padding
- **18px:** Status pill height
- **20px:** Header horizontal padding, row horizontal padding, header right offset

### Radius Scale
- **2px:** Progress track/fill
- **4px:** Filter button
- **6px:** Status pill, filter menu
- **8px:** Widget container

### Font Size Scale
- **11px:** Status pill text
- **12px:** Filter button, metadata
- **13px:** Menu items
- **14px:** Header title, project name, arrow icon

### Font Weight Scale
- **400 (Regular):** Filter button, menu items, metadata
- **500 (Medium):** Header title, project name, status pill

---

## 29. COMPARISON TO OTHER WIDGETS

### Similar Patterns
- **Top Gradient:** 4px height (matches other widgets)
- **Header Height:** 40px (standard)
- **Hover States:** Gray 50 background (consistent)
- **Scrollable Content:** Custom scrollbar (via globals.css)

### Unique Features
- **Blue Gradient:** Distinct from red (Red Zone) and other colors
- **Briefcase Icon:** Project-specific identifier
- **Status Pills:** Color-coded inline badges
- **Progress Bars:** Inline 4px height bars with smooth animation
- **Filter Dropdown:** Header-level filtering
- **74px Rows:** Taller than typical list items for rich content
- **Three-Line Layout:** Name + Progress + Metadata

---

## SUMMARY

The Project Portfolio Widget is a sophisticated dashboard component featuring:

### Key Features
- **Blue Gradient Accent:** #93C5FD → #BFDBFE (project theme)
- **Briefcase Icon:** 16px Blue 400 identifier
- **Filter Dropdown:** 'My projects', 'All projects', 'Critical', etc.
- **74px Rows:** Name + Status pill + Progress bar + Metadata
- **Color-Coded Status Pills:** On Track (green), At Risk (amber), Critical (red), Upcoming (gray)
- **Inline Progress Bars:** 4px height, status-colored fill
- **Full Row Clickable:** Navigate to project details
- **Vertical Scrolling:** Native scrollbar for overflow
- **1px Dividers:** Between rows (not after last)

### Visual Design
- **40px Header:** Icon + title + filter dropdown
- **Status Pill Design:** 18px height, 11px medium text, 6px radius, color-coded backgrounds
- **Progress Bar:** 4px height, 2px radius, 300ms width animation
- **Metadata Text:** 12px gray, one line with ellipsis
- **Arrow Icon:** 14px Gray 300 affordance

### Filter Dropdown
- **160px Min Width:** Right-aligned menu
- **Shadow:** 0 4px 12px rgba(0,0,0,0.15)
- **Options:** 5 filter choices
- **Selection:** Blue text (#0066FF) for selected
- **Hover:** Gray 50 background

### Status System
```
On Track:  Green pill (#D1FAE5 bg, #065F46 text)
           + Green progress (#34D399)

At Risk:   Amber pill (#FEF3C7 bg, #92400E text)
           + Amber progress (#FBBF24)

Critical:  Red pill (#FEE2E2 bg, #991B1B text)
           + Red progress (#F87171)

Upcoming:  Gray pill (#F3F4F6 bg, #374151 text)
           + Gray progress (#9CA3AF)
```

### Row Layout
```
Phoenix Rebrand         [On Track]    →
━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░
8 open • 2 overdue
  ↓                        ↓          ↓
14px medium           11px pill    14px icon
Name truncates        Fixed       Gray 300
```

### Interaction Patterns
- **Click Row:** Navigate to project (full 74px height clickable)
- **Hover Row:** Gray 50 background (150ms)
- **Click Filter:** Toggle dropdown menu
- **Click Option:** Update filter, close menu
- **Click Outside:** Close menu (backdrop)
- **Progress Update:** Smooth 300ms animation

### Technical Sophistication
- **Responsive Height:** Adapts to grid cell (340px or 680px)
- **Text Truncation:** Ellipsis for long names/metadata
- **Status-Color Mapping:** Dynamic colors based on status
- **Smooth Animations:** 150ms hovers, 300ms progress
- **Z-Index Layering:** Backdrop (5), menu (10)
- **Event Propagation:** stopPropagation on filter button

The complete specification with all design elements, color mappings, and interaction patterns is in `/PROJECT_PORTFOLIO_WIDGET_DESIGN.md`!
