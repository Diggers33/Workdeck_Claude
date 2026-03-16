# Workdeck Dashboard - Widget Sizing & Spacing Audit

## Dashboard Grid Layout

### Main Container
- **Background Color:** #FAFBFC
- **Height:** `calc(100vh - 60px)` (full viewport minus 60px navigation)
- **Padding:** 16px all around
- **Max Width:** 1600px (centered with auto margins)

### Grid System
```css
display: grid
grid-template-columns: 1fr 1fr 340px 340px
grid-template-rows: 1fr 1fr
gap: 12px
height: 100%
```

**Column Breakdown:**
- **Column 1:** 1fr (flexible)
- **Column 2:** 1fr (flexible)
- **Column 3:** 340px (fixed - To-Do widget)
- **Column 4:** 340px (fixed - Agenda widget)

**Row Breakdown:**
- **Row 1:** 1fr (50% height)
- **Row 2:** 1fr (50% height)

**Grid Gap:** 12px between all widgets

---

## Widget Placement & Spanning

### Position Grid
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Row 1      │  Row 1      │  Row 1-2    │  Row 1-2    │
│  Col 1      │  Col 2      │  Col 3      │  Col 4      │
│             │             │  (SPANS)    │  (SPANS)    │
│  FYI or     │  Who's      │             │             │
│  Portfolio  │  Where or   │  TO-DO      │  AGENDA     │
│             │  Portfolio  │  (FULL      │  (FULL      │
│             │             │  HEIGHT)    │  HEIGHT)    │
├─────────────┼─────────────┤             │             │
│  Row 2      │  Row 2      │             │             │
│  Col 1      │  Col 2      │             │             │
│             │             │             │             │
│  Pending    │  Red Zone   │             │             │
│  Approvals  │  or         │             │             │
│             │  Portfolio  │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

**Full-Height Widgets:**
- **To-Do List:** `gridRow: '1 / 3'` (spans rows 1-2)
- **Agenda:** `gridRow: '1 / 3'` (spans rows 1-2)

---

## Universal Widget Structure

### Standard Widget Anatomy
```
┌──────────────────────────────────┐
│ Gradient Top Accent (1px)        │ ← 4px height colored gradient
├──────────────────────────────────┤
│ Header Section (36px min)        │ ← px-3 py-2
│ - Icon + Title + Badge/Button    │
├──────────────────────────────────┤
│                                  │
│ Content Area (flex: 1)           │ ← px-3 py-1.5, scrollable
│ - Scrollable content             │
│                                  │
├──────────────────────────────────┤
│ Footer Section (30px min)        │ ← px-3 py-1.5
│ - Action link + status           │
└──────────────────────────────────┘
```

### Common Widget Properties
- **Box Shadow:** `0 2px 8px rgba(0,0,0,0.1)`
- **Border Radius:** 6px (`rounded-lg`)
- **Background:** White (#FFFFFF)
- **Height:** 100% (fills grid cell)
- **Display:** flex, flexDirection: column

---

## Widget-by-Widget Breakdown

### 1. PENDING APPROVALS WIDGET

#### Container
- **Height:** 100%
- **Display:** flex column
- **Box Shadow:** `0 2px 8px rgba(0,0,0,0.1)`

#### Top Accent
- **Height:** 1px (h-1 = 4px actual)
- **Gradient:** #F472B6 → #FBCFE8

#### Header
- **Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Min Height:** 36px
- **Border Bottom:** 1px #E5E7EB
- **Gap between elements:** 6px (gap-1.5)

#### Content Area
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Flex:** 1 (takes remaining space)
- **Overflow:** auto (scrollable)
- **Item Spacing:** 6px between items (space-y-1.5)

#### Approval Cards
- **Padding:** 8px all around (p-2)
- **Border:** 1px #F3F4F6
- **Border Radius:** 6px (rounded-lg)
- **Background:** #FAFAFA
- **Margin Bottom:** 6px (mb-1.5)

#### Action Buttons
- **Padding:** 12px horizontal (px-3), 4px vertical (py-1)
- **Gap between buttons:** 8px (gap-2)
- **Border Radius:** 6px (rounded-lg)

#### Footer
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Min Height:** 30px
- **Border Top:** 1px #E5E7EB

---

### 2. AGENDA WIDGET (TODAY'S SCHEDULE)

#### Container
- **Height:** 100%
- **Display:** flex column
- **Width:** 340px (fixed)
- **Spans:** Rows 1-2 (full height)

#### Top Accent
- **Height:** 1px (h-1 = 4px actual)
- **Gradient:** #FBBF24 → #FDE68A

#### Header
- **Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Min Height:** 36px
- **Border Bottom:** 1px #E5E7EB
- **Inner Margin:** 4px bottom (mb-1)
- **Button Padding:** 2px (p-0.5)
- **Gap between nav buttons:** 4px (gap-1)

#### Timeline Container
- **Padding:** 8px horizontal (px-2), 6px vertical (py-1.5)
- **Flex:** 1 (takes remaining space)
- **Overflow:** auto (scrollable vertically)
- **Position:** relative

#### Hour Grid
- **Pixels Per Hour:** 60px
- **Total Height:** `(endHour - startHour + 1) * 60px`
- **Hour Row Height:** 60px each
- **Time Label Width:** 40px (w-10)
- **Hour Label Position:** left: 0, top: 2px (top-0.5)

#### Event Cards
- **Left Position:** `calc(40px + overlap%)`
- **Width:** `calc(width% - 2px or 6px)` (depending on overlaps)
- **Height:** `duration * 60px`
- **Border Radius:** 4px
- **Padding:** 6px horizontal, 8px vertical (6px 8px)
- **Min Height:** 30px
- **Z-Index:** 5 (normal), 15 (dragging)

#### Resize Handles
- **Height:** 6px
- **Width:** 100%
- **Cursor:** ns-resize

#### Drag Handle (dots)
- **Width:** 20px
- **Height:** 2px
- **Border Radius:** 2px
- **Opacity:** 0 (visible on hover: 100%)

#### Current Time Indicator
- **Height:** 2px
- **Position:** absolute at current hour position
- **Z-Index:** 15

#### Footer
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Min Height:** 30px
- **Border Top:** 1px #E5E7EB

---

### 3. TO-DO LIST WIDGET

#### Container
- **Height:** 100%
- **Display:** flex column
- **Width:** 340px (fixed)
- **Spans:** Rows 1-2 (full height)

#### Top Accent
- **Height:** 1px (h-1 = 4px actual)
- **Gradient:** #60A5FA → #93C5FD

#### Header
- **Padding:** 16px horizontal (px-4), 10px vertical (py-2.5)
- **Min Height:** 40px
- **Border Bottom:** 1px #E5E7EB
- **Gap:** 6px (gap-1.5)

#### New Button
- **Padding:** 10px horizontal (px-2.5), 4px vertical (py-1)
- **Border Radius:** 6px (rounded)

#### Dropdown Menu
- **Min Width:** 180px
- **Margin Top:** 4px (mt-1)
- **Menu Item Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Border Top (second item):** 1px #E5E7EB

#### Content Area (Groups)
- **Padding:** 16px horizontal (px-4), 12px vertical (py-3)
- **Flex:** 1
- **Overflow:** auto
- **Spacing between groups:** 16px (space-y-4)

#### Group Header
- **Padding:** 4px horizontal (px-1), 4px vertical (py-1)
- **Margin Horizontal:** -4px (-mx-1)
- **Gap:** 6px (gap-1.5)
- **Border Bottom:** 1px #E5E7EB (after header)

#### Group Content
- **Spacing between tasks:** 8px (space-y-2)
- **Margin Top:** 8px

#### Task Cards
- **Padding:** 10px horizontal (px-2.5), 8px vertical (py-2)
- **Border:** 1px #E5E7EB
- **Border Radius:** 6px (rounded)
- **Gap between elements:** 8px (gap-2)

#### Priority Indicator
- **Width:** 4px (w-1)
- **Height:** Full task height
- **Position:** absolute left: 0
- **Hover Width:** 12px (w-3)
- **Border Radius:** left side only

#### Priority Dropdown
- **Position:** absolute left: 32px (left-8), top: 8px (top-2)
- **Min Width:** 140px
- **Padding:** 6px vertical (py-1.5)
- **Header Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Menu Item Padding:** 12px horizontal (px-3), 8px vertical (py-2)

#### Checklist Section
- **Padding:** 10px horizontal (px-2.5), 8px vertical (py-2)
- **Padding Left:** 52px (pl-[52px]) - indented
- **Border Top:** 1px #E5E7EB
- **Item Spacing:** 6px (space-y-1.5)
- **Add Item Margin Top:** 8px (mt-2)
- **Add Item Padding Top:** 6px (pt-1.5)

#### Quick Add Section
- **Background:** #EFF6FF
- **Border:** 1px #60A5FA
- **Padding:** 10px horizontal (px-2.5), 8px vertical (py-2)
- **Margin Bottom:** 6px (mb-1.5)
- **Button Padding:** 8px horizontal (px-2), 2px vertical (py-0.5)
- **Button Spacing:** 6px (gap-1.5)

#### Footer
- **Padding:** 16px horizontal (px-4), 8px vertical (py-2)
- **Min Height:** 36px
- **Padding Top:** 8px
- **Border Top:** 1px #E5E7EB

---

### 4. FYI WIDGET

#### Container
- **Height:** 100%
- **Display:** flex column

#### Top Accent
- **Height:** 1px (h-1 = 4px actual)
- **Gradient:** #A78BFA → #DDD6FE

#### Header
- **Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Min Height:** 36px
- **Border Bottom:** 1px #E5E7EB
- **Gap:** 6px (gap-1.5)

#### Content Area
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Flex:** 1
- **Overflow:** auto
- **Item Spacing:** 8px (space-y-2)

#### Notification Items
- **Padding:** 6px (p-1.5)
- **Border:** 1px #F3F4F6
- **Border Radius:** 6px (rounded-lg)
- **Background:** #FAFAFA
- **Gap between elements:** 8px (gap-2)

#### Avatar
- **Size:** 28px × 28px (w-7 h-7)
- **Border Radius:** 50% (rounded-full)

#### Footer
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Min Height:** 30px
- **Border Top:** 1px #E5E7EB

#### Count Badge
- **Padding:** 6px horizontal (px-1.5), 2px vertical (py-0.5)
- **Border Radius:** full (rounded-full)

---

### 5. WHO'S WHERE WIDGET

#### Container
- **Height:** 100%
- **Display:** flex column

#### Top Accent
- **Height:** 1px (h-1 = 4px actual)
- **Gradient:** #5EEAD4 → #99F6E4

#### Header
- **Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Min Height:** 36px
- **Border Bottom:** 1px #E5E7EB
- **Gap:** 6px (gap-1.5)

#### Add Button
- **Padding:** 8px horizontal (px-2), 4px vertical (py-1)
- **Border Radius:** 6px (rounded)

#### Content Area
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Flex:** 1
- **Overflow:** auto
- **Item Spacing:** 6px (space-y-1.5)

#### Person Cards
- **Padding:** 6px (p-1.5)
- **Border:** 1px #F3F4F6
- **Border Radius:** 6px (rounded-lg)
- **Background:** #FAFAFA
- **Gap:** 8px (gap-2)

#### Avatar
- **Size:** 28px × 28px (w-7 h-7)
- **Border Radius:** 50% (rounded-full)

#### Status Badge
- **Padding:** 6px horizontal (px-1.5), 2px vertical (py-0.5)
- **Border Radius:** full (rounded-full)

#### Footer Legend
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Min Height:** 30px
- **Border Top:** 1px #E5E7EB
- **Gap between legend items:** 8px (gap-2)
- **Gap within item:** 4px (gap-1)

#### Legend Icons
- **Size:** 12px × 12px (w-3 h-3)

---

### 6. RED ZONE WIDGET

#### Container
- **Height:** 100%
- **Display:** flex column

#### Top Accent
- **Height:** 1px (h-1 = 4px actual)
- **Gradient:** #F87171 → #FCA5A5

#### Header
- **Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Min Height:** 36px
- **Border Bottom:** 1px #E5E7EB
- **Gap:** 6px (gap-1.5)

#### Content Area
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Flex:** 1
- **Overflow:** auto
- **Item Spacing:** 4px (space-y-1)

#### Risk Cards
- **Padding:** 6px (p-1.5)
- **Border:** 1px #F3F4F6
- **Border Radius:** 6px (rounded-lg)
- **Background:** #FAFAFA
- **Gap between elements:** 8px (gap-2)

#### Risk Score Badge
- **Padding:** 6px horizontal (px-1.5), 2px vertical (py-0.5)
- **Border Radius:** 4px (rounded)

#### Risk Dot
- **Size:** 8px × 8px (w-2 h-2)
- **Border Radius:** 50% (rounded-full)

#### Footer
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Min Height:** 30px
- **Border Top:** 1px #E5E7EB

---

### 7. TASK OVERVIEW WIDGET

#### Container
- **Height:** 100%
- **Display:** flex column

#### Top Accent
- **Height:** 1px (h-1 = 4px actual)
- **Gradient:** #6366F1 → #A5B4FC

#### Header
- **Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Min Height:** 36px
- **Border Bottom:** 1px #E5E7EB
- **Gap:** 6px (gap-1.5)

#### Content Area
- **Padding:** 12px horizontal (px-3), 8px vertical (py-2)
- **Flex:** 1
- **Overflow:** auto
- **Item Spacing:** 12px (space-y-3)

#### Category Cards
- **Padding:** 8px (p-2)
- **Border:** 1px #E5E7EB
- **Border Radius:** 6px (rounded-lg)
- **Background:** White
- **Gap:** 6px (gap-1.5)

#### Progress Bar
- **Height:** 6px (h-1.5)
- **Border Radius:** full (rounded-full)
- **Background:** #F3F4F6

#### Footer
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Min Height:** 30px
- **Border Top:** 1px #E5E7EB

---

## Settings Modal (Red Zone Example)

### Modal Container
- **Width:** 480px
- **Max Height:** 90vh
- **Box Shadow:** `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **Border Radius:** 6px (rounded-lg)

### Modal Header
- **Padding:** 24px horizontal (px-6), 16px vertical (py-4)
- **Border Bottom:** 1px #E5E7EB
- **Gap:** 12px (gap-3)

### Icon Container
- **Size:** 40px × 40px (w-10 h-10)
- **Border Radius:** 6px (rounded-lg)

### Modal Content
- **Padding:** 24px horizontal (px-6), 24px vertical (py-6)
- **Section Spacing:** 24px (space-y-6)

### Range Slider
- **Margin Bottom:** 8px (mb-2)
- **Gap with value:** 12px (gap-3)

### Value Display
- **Padding:** 12px horizontal (px-3), 6px vertical (py-1.5)
- **Border Radius:** 6px (rounded-lg)
- **Min Width:** 60px
- **Text Align:** center

### Info Box
- **Padding:** 16px (p-4)
- **Border Radius:** 6px (rounded-lg)
- **Border:** 1px

### Modal Footer
- **Padding:** 24px horizontal (px-6), 16px vertical (py-4)
- **Border Top:** 1px #E5E7EB
- **Button Gap:** 12px (gap-3)

### Buttons
- **Padding:** 16px horizontal (px-4), 8px vertical (py-2)
- **Border Radius:** 6px (rounded-lg)

---

## Common Spacing Patterns

### Padding Scale (Tailwind)
- **p-0.5** = 2px
- **p-1** = 4px
- **p-1.5** = 6px
- **p-2** = 8px
- **p-2.5** = 10px
- **p-3** = 12px
- **p-4** = 16px
- **p-6** = 24px

### Gap Scale (Tailwind)
- **gap-1** = 4px
- **gap-1.5** = 6px
- **gap-2** = 8px
- **gap-2.5** = 10px
- **gap-3** = 12px

### Margin Scale (Tailwind)
- **mb-1** = 4px
- **mb-1.5** = 6px
- **mb-2** = 8px
- **mt-0.5** = 2px
- **-mx-1** = -4px

### Border Radius
- **rounded** = 4px
- **rounded-lg** = 6px
- **rounded-full** = 9999px (circular)

### Z-Index Layers
- **z-5** = Normal content
- **z-10** = Priority bar, dropdowns overlay
- **z-15** = Dragging items, current time
- **z-20** = Dropdown menus, modals

---

## Summary of Key Measurements

### Widget Dimensions
- **Standard Width:** Flexible (1fr) or Fixed (340px)
- **Standard Height:** 100% of grid cell
- **Fixed Widgets:** To-Do and Agenda at 340px width

### Standard Spacing
- **Grid Gap:** 12px
- **Widget Header Height:** 36px minimum
- **Widget Footer Height:** 30px minimum
- **Top Accent:** 4px (appears as 1px)
- **Border Width:** 1px throughout

### Standard Padding
- **Widget Header:** 12px horizontal, 8px vertical
- **Widget Content:** 12px horizontal, 6px vertical
- **Widget Footer:** 12px horizontal, 6px vertical
- **Item Cards:** 8px all around
- **Small Cards:** 6px all around

### Standard Gaps
- **Between items:** 6-8px
- **Between groups:** 12-16px
- **Between sections:** 16-24px
