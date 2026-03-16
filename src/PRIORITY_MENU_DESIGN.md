# Priority Menu/Popover - Complete Design Specification

## Overview
The Priority Menu is a dropdown popover that appears when clicking the priority indicator bar on tasks in the To-Do List Widget. It allows users to set task priority to High, Medium, or Low with color-coded vertical bars and hover effects. The menu features a header, three priority options with visual indicators, and smooth hover transitions.

---

## Visual Structure

```
┌─────────────────────┐
│ SET PRIORITY        │ ← Header (Gray background)
├─────────────────────┤
│ │ High              │ ← Red bar + hover effect
├─────────────────────┤
│ │ Medium            │ ← Yellow bar + hover effect
├─────────────────────┤
│ │ Low               │ ← Blue bar + hover effect
└─────────────────────┘
```

---

## 1. CONTAINER

### Popover Container
- **Element:** `<div>`
- **Position:** `absolute`
- **Location:** `left: 32px (8), top: 8px (2)` relative to task row
- **Background:** `#FFFFFF` (white)
- **Border:** `1px solid #D1D5DB` (Gray 300)
- **Border Radius:** `4px` (rounded)
- **Box Shadow:** `shadow-xl`
  - Values: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **Z-Index:** `20`
- **Padding Vertical:** `6px` (py-1.5)
- **Overflow:** `hidden`
- **Min Width:** `140px`

### Backdrop/Overlay
- **Element:** `<div>`
- **Position:** `fixed`
- **Inset:** `0` (covers entire viewport)
- **Z-Index:** `10` (below popover)
- **Background:** Transparent
- **Click:** Closes menu

### Purpose
Dropdown menu for setting task priority levels.

---

## 2. HEADER SECTION

### Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `6px` (py-1.5)
- **Background:** `#F9FAFB` (Gray 50)
- **Border Bottom:** `1px solid #E5E7EB` (Gray 200)

### Text
- **Element:** Text content
- **Text:** "SET PRIORITY"
- **Font Size:** `10px`
- **Text Transform:** `uppercase`
- **Letter Spacing:** `wide` (0.025em)
- **Color:** `#6B7280` (Gray 500)
- **Font Weight:** `500` (font-medium)

### Visual Appearance
```
┌─────────────────────┐
│ SET PRIORITY        │ ← Gray 50 background
└─────────────────────┘
  10px uppercase, Gray 500
  Wide letter spacing
```

---

## 3. PRIORITY OPTION DESIGN

### Option Button Container
- **Element:** `<button>`
- **Width:** `100%` (w-full)
- **Text Align:** `left`
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `8px` (py-2)
- **Font Size:** `13px`
- **Color:** `#1F2937` (Gray 800)
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `10px` (gap-2.5)
- **Transition:** `colors 150ms`
- **Class:** `group` (for child hover effects)

### Default State
- **Background:** Transparent
- **Cursor:** `pointer`

### Hover State
- **Background:** Priority-specific color (very light)
  - High: `#FEF2F2` (Red 50)
  - Medium: `#FFFBEB` (Amber 50)
  - Low: `#EFF6FF` (Blue 50)
- **Transition:** `colors 150ms`

---

## 4. PRIORITY INDICATOR BAR

### Bar Element
- **Element:** `<div>`
- **Width:** `4px` (w-1)
- **Height:** `20px` (h-5)
- **Border Radius:** `full` (rounded-full - pill shape)
- **Transition:** `all 150ms`

### Default State
- **Width:** `4px`
- **Background Color:** Priority-specific

### Hover State (Group Hover)
- **Width:** `6px` (w-1.5)
- **Transition:** `all 150ms`

### Color by Priority
| Priority | Color Name | Hex Code |
|----------|-----------|----------|
| High | Red 400 | `#F87171` |
| Medium | Amber 400 | `#FBBF24` |
| Low | Blue 400 | `#60A5FA` |

### Visual Examples
```
Default (4px wide):
│ High

Hover (6px wide):
│ High
↑
Slightly wider
```

---

## 5. PRIORITY LABEL TEXT

### Text Element
- **Element:** `<span>`
- **Font Weight:** `500` (font-medium)
- **Color:** `#1F2937` (Gray 800)
- **Font Size:** `13px`

### Text Content
- **High:** "High"
- **Medium:** "Medium"
- **Low:** "Low"

---

## 6. THREE PRIORITY OPTIONS

### High Priority Option

**Button:**
- **Background (default):** Transparent
- **Background (hover):** `#FEF2F2` (Red 50)
- **Click:** Sets priority to 'high'

**Indicator Bar:**
- **Color:** `#F87171` (Red 400)
- **Width:** 4px → 6px on hover

**Visual:**
```
┌─────────────────────┐
│ │ High              │ ← Red bar (4px → 6px)
└─────────────────────┘
  Red 50 background on hover
```

---

### Medium Priority Option

**Button:**
- **Background (default):** Transparent
- **Background (hover):** `#FFFBEB` (Amber 50)
- **Click:** Sets priority to 'medium'

**Indicator Bar:**
- **Color:** `#FBBF24` (Amber 400)
- **Width:** 4px → 6px on hover

**Visual:**
```
┌─────────────────────┐
│ │ Medium            │ ← Yellow bar (4px → 6px)
└─────────────────────┘
  Amber 50 background on hover
```

---

### Low Priority Option

**Button:**
- **Background (default):** Transparent
- **Background (hover):** `#EFF6FF` (Blue 50)
- **Click:** Sets priority to 'low'

**Indicator Bar:**
- **Color:** `#60A5FA` (Blue 400)
- **Width:** 4px → 6px on hover

**Visual:**
```
┌─────────────────────┐
│ │ Low               │ ← Blue bar (4px → 6px)
└─────────────────────┘
  Blue 50 background on hover
```

---

## 7. COMPLETE VISUAL APPEARANCE

### Full Menu (Default State)
```
┌─────────────────────┐
│ SET PRIORITY        │ ← Gray header
├─────────────────────┤
│ │ High              │ ← Red bar (4px)
├─────────────────────┤
│ │ Medium            │ ← Yellow bar (4px)
├─────────────────────┤
│ │ Low               │ ← Blue bar (4px)
└─────────────────────┘
  140px min-width
  White background
  Shadow-xl
```

### Full Menu (High Hovered)
```
┌─────────────────────┐
│ SET PRIORITY        │
├─────────────────────┤
│█│ High              │ ← Red 50 bg, wider bar (6px)
├─────────────────────┤
│ │ Medium            │
├─────────────────────┤
│ │ Low               │
└─────────────────────┘
```

---

## 8. COLOR PALETTE

### Container Colors
| Element | Color | Hex Code |
|---------|-------|----------|
| Background | White | `#FFFFFF` |
| Border | Gray 300 | `#D1D5DB` |

### Header Colors
| Element | Color | Hex Code |
|---------|-------|----------|
| Background | Gray 50 | `#F9FAFB` |
| Text | Gray 500 | `#6B7280` |
| Border | Gray 200 | `#E5E7EB` |

### Text Colors
| Element | Color | Hex Code |
|---------|-------|----------|
| Labels | Gray 800 | `#1F2937` |

### Priority Indicator Colors
| Priority | Bar Color | Hex Code | Hover Background | Hex Code |
|----------|-----------|----------|------------------|----------|
| High | Red 400 | `#F87171` | Red 50 | `#FEF2F2` |
| Medium | Amber 400 | `#FBBF24` | Amber 50 | `#FFFBEB` |
| Low | Blue 400 | `#60A5FA` | Blue 50 | `#EFF6FF` |

---

## 9. TYPOGRAPHY

### Header Text
- **Size:** 10px
- **Weight:** 500 (Medium)
- **Transform:** Uppercase
- **Tracking:** Wide (0.025em)
- **Color:** Gray 500 (#6B7280)

### Option Labels
- **Size:** 13px
- **Weight:** 500 (Medium)
- **Color:** Gray 800 (#1F2937)

---

## 10. SPACING & LAYOUT

### Menu Dimensions
```
Popover (140px min-width × auto height)
│
├─ Header: auto height
│  ├─ Padding: 12px (h) × 6px (v)
│  └─ Border bottom: 1px
│
├─ Priority Options: 3 buttons
│  └─ Each option:
│     ├─ Padding: 12px (h) × 8px (v)
│     ├─ Gap: 10px (between bar and text)
│     │
│     ├─ Indicator bar: 4px × 20px
│     │  └─ Hover: 6px × 20px
│     │
│     └─ Label: 13px medium
```

### Key Measurements
- **Min Width:** 140px
- **Header Padding:** 12px × 6px
- **Option Padding:** 12px × 8px
- **Bar Width:** 4px (default), 6px (hover)
- **Bar Height:** 20px
- **Gap:** 10px (bar to text)

---

## 11. POSITIONING

### Relative to Task Row
- **Anchor:** Priority indicator bar (left edge of task)
- **Position:** `absolute`
- **Left:** `32px` (left: 8 in Tailwind)
  - Offset from task's left edge
  - Appears to right of priority bar
- **Top:** `8px` (top: 2 in Tailwind)
  - Slight offset from top of task
- **Z-Index:** 20 (above task, below modal)

### Positioning Context
```
┌─────────────────────────────────┐
│ │ [Task Name]                   │ ← Task row
│ │                               │
│ ↓                               │
│ ┌─────────────────┐             │
│ │ SET PRIORITY    │             │ ← Popover (32px from left)
│ ├─────────────────┤             │
│ │ │ High          │             │
│ └─────────────────┘             │
└─────────────────────────────────┘
```

---

## 12. SHADOW SYSTEM

### Popover Shadow
- **Class:** `shadow-xl`
- **Values:** 
  - Layer 1: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`
  - Layer 2: `0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **Effect:** Strong elevation with depth

### Shadow Breakdown
**Layer 1:**
- X: 0px
- Y: 20px
- Blur: 25px
- Spread: -5px
- Color: Black at 10% opacity

**Layer 2:**
- X: 0px
- Y: 10px
- Blur: 10px
- Spread: -5px
- Color: Black at 4% opacity

---

## 13. BORDER SYSTEM

| Element | Width | Color | Radius |
|---------|-------|-------|--------|
| Popover | 1px | #D1D5DB (Gray 300) | 4px |
| Header Bottom | 1px | #E5E7EB (Gray 200) | - |
| Priority Bar | - | - | Full (pill) |

---

## 14. ANIMATION & TRANSITIONS

### Defined Transitions
| Element | Property | Duration | Timing |
|---------|----------|----------|--------|
| Button Background | colors | 150ms | ease |
| Priority Bar Width | all | 150ms | ease |

### State Transitions
- **Button Hover:** transparent → priority color 50 (150ms)
- **Bar Hover:** 4px → 6px width (150ms)

### Interaction Flow
```
1. User hovers over option
   └─> Background fades to light color (150ms)
   └─> Bar widens from 4px to 6px (150ms)

2. User clicks option
   └─> Priority updates
   └─> Menu closes
```

---

## 15. INTERACTION BEHAVIOR

### Opening the Menu
- **Trigger:** Click priority indicator bar on task
- **State Management:** `showPriorityMenu` state tracks open menu by task ID
- **Toggle:** Click same bar closes menu
- **Visual:** Menu appears immediately (no animation)

### Closing the Menu
- **Click Backdrop:** Clicks outside menu close it
- **Click Option:** Selecting priority closes menu
- **Click Priority Bar:** Toggling bar closes menu
- **ESC Key:** Not implemented (potential enhancement)

### Selecting a Priority
- **Click:** Click any priority option
- **Event:** `onClick` with `stopPropagation()`
- **Action:** Updates task priority via `changePriority()`
- **Feedback:** Visual update on task priority bar
- **Close:** Menu closes after selection

### Event Propagation
- **stopPropagation():** Prevents clicks from triggering parent elements
- **Backdrop Click:** Closes menu without other actions

---

## 16. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Proper `<button>` elements
- **Keyboard:** Buttons are focusable
- **Hover States:** Visual feedback on interaction

### Text Contrast Ratios
- **Gray 800 on White:** ~12:1 ✓ (AAA)
- **Gray 500 on Gray 50:** ~4.6:1 ✓ (AA)
- **Red 400 bar:** Visual only (not text)
- **Amber 400 bar:** Visual only (not text)
- **Blue 400 bar:** Visual only (not text)

### Potential Improvements
- Add ARIA labels: `aria-label="Set priority to high"`
- Add `role="menu"` to popover
- Add `role="menuitem"` to buttons
- Add keyboard navigation (Arrow keys)
- Add focus trap in menu
- Add `aria-expanded` to priority bar button
- Add `Escape` key to close
- Add focus visible indicators
- Add `aria-labelledby` for header

---

## 17. RESPONSIVE BEHAVIOR

### Fixed Dimensions
- **Min Width:** 140px (prevents text wrapping)
- **Height:** Auto (based on 3 options)
- **Position:** Absolute (fixed relative to task)

### Text Handling
- **No Wrapping:** Single-line labels
- **Min Width:** Ensures "Medium" displays fully

---

## 18. STATE MANAGEMENT

### React State
```typescript
const [showPriorityMenu, setShowPriorityMenu] = useState<string | null>(null);
```

### State Values
- **null:** No menu open
- **task.id:** Menu open for specific task

### Priority Values
```typescript
priority?: 'high' | 'medium' | 'low'
```

### Update Function
```typescript
const changePriority = (
  taskId: string, 
  priority: 'high' | 'medium' | 'low', 
  isAssigned: boolean
) => {
  // Updates task priority in state
  // Closes menu
}
```

---

## 19. INTEGRATION WITH TASK ROW

### Priority Indicator Bar (Trigger)
- **Location:** Absolute left edge of task row
- **Width:** `4px` (w-1)
- **Height:** Full task height (top: 0, bottom: 0)
- **Border Radius:** `rounded-l` (left side only)
- **Z-Index:** 10

### Hover Behavior on Bar
- **Default:** 4px width
- **Hover:** 12px width (w-3)
- **Transition:** `all 150ms`
- **Cursor:** Clickable

### Visual Feedback
```
Task row (priority bar on left):
┌───────────────────────────────┐
│ │ [Task content...]           │ ← 4px red bar
└───────────────────────────────┘

Task row (hovered):
┌───────────────────────────────┐
│█│ [Task content...]           │ ← 12px red bar (wider)
└───────────────────────────────┘

Task row (menu open):
┌───────────────────────────────┐
│ │ [Task content...]           │
│ ┌─────────────────┐           │
│ │ SET PRIORITY    │           │ ← Menu appears
│ ├─────────────────┤           │
│ │ │ High          │           │
│ └─────────────────┘           │
└───────────────────────────────┘
```

---

## 20. PRIORITY COLOR FUNCTION

### Color Mapping Function
```typescript
const getPriorityColor = (priority?: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return '#F87171';    // Red 400
    case 'medium': return '#FBBF24';  // Amber 400
    case 'low': return '#60A5FA';     // Blue 400
    default: return '#9CA3AF';        // Gray 400 (no priority)
  }
};
```

### Usage
- **Task Priority Bar:** `backgroundColor: getPriorityColor(task.priority)`
- **Menu Indicator Bars:** Hardcoded colors per option

---

## 21. DESIGN TOKENS SUMMARY

### Spacing Scale
- **1:** 4px (bar width default, border radius)
- **1.5:** 6px (header padding vertical, bar width hover)
- **2:** 8px (option padding vertical, top position)
- **2.5:** 10px (gap between bar and text)
- **3:** 12px (header/option padding horizontal)
- **5:** 20px (bar height)
- **8:** 32px (left position offset)

### Radius Scale
- **4px:** Popover container
- **full:** Priority bars (pill shape)

### Font Size Scale
- **10px:** Header text
- **13px:** Option labels

### Font Weight Scale
- **500 (Medium):** Header, option labels

---

## 22. USAGE CONTEXT

### When Priority Menu Appears
- **To-Do List Widget:** Task priority bar click
- **Non-completed Tasks:** Only active tasks show priority bar
- **One at a Time:** Only one menu open at once

### When Menu Closes
- Click outside (backdrop)
- Select a priority option
- Click priority bar again (toggle)
- Switch to different task's menu

---

## 23. COMPARISON TO OTHER MENUS

### Similar Patterns
- **"New" Menu:** Similar dropdown style in widget header
- **Task Detail Modal:** Different interaction pattern

### Unique Features
- **Color-Coded Bars:** Visual priority indicators
- **Hover Width Change:** Bar expands on hover
- **Hover Backgrounds:** Priority-specific tint colors
- **Uppercase Header:** Distinct section label

---

## 24. DESIGN RATIONALE

### Why Uppercase Header?
- **Visual Separation:** Distinguishes label from options
- **Hierarchy:** Indicates meta-information
- **Consistent Pattern:** Matches other UI label styles

### Why Vertical Bars?
- **Visual Continuity:** Matches task priority indicator
- **Color Association:** Reinforces color meaning
- **Compact:** Doesn't take horizontal space

### Why Hover Width Change?
- **Affordance:** Shows interactivity
- **Feedback:** Confirms hover state
- **Visual Interest:** Subtle animation

### Why Light Background Hovers?
- **Context:** Shows which option will be selected
- **Brand Colors:** Uses priority color system
- **Gentle:** 50 tints are subtle, not overwhelming

---

## SUMMARY

The Priority Menu is a polished dropdown popover featuring:

### Key Features
- **Uppercase Header:** "SET PRIORITY" label in gray
- **Three Priority Options:** High (red), Medium (yellow), Low (blue)
- **Vertical Bar Indicators:** 4px bars that widen to 6px on hover
- **Hover Backgrounds:** Light tint of priority color (50 shades)
- **Smooth Transitions:** 150ms width and color changes
- **Strong Shadow:** Shadow-xl for clear elevation
- **Click Outside to Close:** Backdrop dismisses menu

### Visual Design
- **140px Min Width:** Ensures text readability
- **White Background:** Clean, minimal appearance
- **Gray Border:** Subtle container definition
- **Color-Coded Bars:** Red/Amber/Blue priority system
- **13px Labels:** Medium weight, readable text

### Interaction Pattern
- **Click Priority Bar:** Opens menu (toggle)
- **Hover Option:** Widens bar (4px → 6px), shows tint background
- **Click Option:** Sets priority, closes menu
- **Click Outside:** Closes menu without action

### Technical Sophistication
- **Absolute Positioning:** 32px from left, 8px from top
- **Z-Index Layering:** Backdrop (10), popover (20)
- **Event Propagation:** stopPropagation prevents parent clicks
- **State Management:** Tracks open menu by task ID
- **Group Hover:** Parent hover affects child bar width

The priority menu successfully provides intuitive priority selection with clear visual feedback through color-coded bars, smooth animations, and a clean minimal design that matches the Workdeck design system.
