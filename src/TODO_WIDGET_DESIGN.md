# To-Do List Widget - Complete Design Specification

## Overview
The To-Do List Widget is a sophisticated task management interface featuring two collapsible groups (Assigned and Personal tasks), inline checklists, priority indicators, drag-and-drop functionality, and quick-add capabilities. It uses a blue color scheme and spans the full height of the dashboard (340px × full height).

---

## Widget Structure

```
┌──────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓ Blue Gradient Top Accent ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ ← 4px height
├──────────────────────────────────────────────────┤
│ ☑ To-Do                             [New +]      │ ← Header (40px min)
├──────────────────────────────────────────────────┤
│                                                  │
│  ▼ Assigned                                 [4]  │ ← Group header
│  ─────────────────────────────────────────────── │
│                                                  │
│  ┌─┬────────────────────────────────────────┐   │
│  │█│☐ Review project budget             ⋮ ˅│   │ ← Task card
│  │█│  BIOGEMSE • Finance • Today • 15:00   │   │   (priority bar)
│  └─┴────────────────────────────────────────┘   │
│                                                  │ ← Content area
│  ▼ Personal                                 [3]  │   (scrollable)
│  ─────────────────────────────────────────────── │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │☐ Prepare team standup notes          ↗ ☑ │  │
│  │  People • Today • 09:30                    │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
├──────────────────────────────────────────────────┤
│ All tasks →                          7 active    │ ← Footer (36px min)
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
- **Height:** `100%` (fills grid cell - full height)
- **Width:** `340px` (fixed width from grid)
- **Display:** `flex`
- **Flex Direction:** `column`
- **Grid Position:** `gridRow: '1 / 3'` (spans 2 rows)

### Purpose
Full-height task list that serves as primary to-do management interface.

---

## 2. TOP ACCENT GRADIENT

### Visual Element
- **Element:** `<div>`
- **Position:** `absolute`
- **Location:** `left: 0, right: 0, top: 0`
- **Height:** `4px` (h-1 in Tailwind)
- **Background:** `linear-gradient(90deg, #60A5FA 0%, #93C5FD 100%)`
  - **Start Color (0%):** `#60A5FA` - Blue 400
  - **End Color (100%):** `#93C5FD` - Blue 300 (lighter)
  - **Direction:** Left to right (90deg)

### Color Details
- **#60A5FA** (Blue 400):
  - RGB: 96, 165, 250
  - HSL: 213°, 94%, 68%
  - Primary Workdeck blue
  
- **#93C5FD** (Blue 300):
  - RGB: 147, 197, 253
  - HSL: 213°, 97%, 78%
  - Lighter sky blue

### Purpose
Visual brand identifier for task/to-do widget type.

---

## 3. HEADER SECTION

### Container
- **Element:** `<div>`
- **Padding:** 
  - Horizontal: `16px` (px-4)
  - Vertical: `10px` (py-2.5)
- **Border Bottom:** `1px solid #E5E7EB` (Gray 200)
- **Min Height:** `40px`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`

### Left Side: Title Group
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `6px` (gap-1.5)

#### Icon Element
- **Component:** `<CheckSquare>` from lucide-react
- **Size:** `16px × 16px` (w-4 h-4)
- **Color:** `#60A5FA` (Blue 400)
- **Style:** Outline/stroke icon
- **Stroke Width:** 2px

#### Title Text
- **Element:** `<h3>`
- **Text:** "To-Do"
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#1F2937` (Gray 800)

### Right Side: New Button
- **Element:** `<button>`
- **Background:** `#60A5FA` (Blue 400)
- **Hover Background:** `#3B82F6` (Blue 500)
- **Text Color:** `#FFFFFF` (white)
- **Padding:**
  - Horizontal: `10px` (px-2.5)
  - Vertical: `4px` (py-1)
- **Border Radius:** `4px` (rounded)
- **Font Size:** `11px`
- **Font Weight:** `500` (font-medium)
- **Text:** "New +"
- **Transition:** `all 150ms`
- **Cursor:** `pointer`

### New Dropdown Menu (When Active)
- **Container:**
  - Position: `absolute`, `right: 0`, `mt-1`
  - Background: White
  - Border: `1px solid #E5E7EB`
  - Border Radius: `4px` (rounded)
  - Box Shadow: `shadow-lg`
  - Min Width: `180px`
  - Z-Index: `20`

#### Menu Item 1: Quick to-do
- **Padding:** `12px horizontal (px-3), 8px vertical (py-2)`
- **Font Size:** `13px`
- **Color:** `#1F2937`
- **Hover Background:** `#F9FAFB`
- **Icon:** CheckSquare (14px, #60A5FA)
- **Gap:** `8px` (gap-2)

#### Menu Item 2: Project task
- **Padding:** `12px horizontal (px-3), 8px vertical (py-2)`
- **Font Size:** `13px`
- **Color:** `#1F2937`
- **Hover Background:** `#F9FAFB`
- **Border Top:** `1px solid #E5E7EB` (divider)
- **Icon:** ArrowUpRight (14px, #60A5FA)
- **Gap:** `8px` (gap-2)

---

## 4. CONTENT AREA (SCROLLABLE)

### Scrollable Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `16px` (px-4)
  - Vertical: `12px` (py-3)
- **Flex:** `1` (takes all remaining vertical space)
- **Overflow Y:** `auto` (vertical scroll)
- **Scrollbar:** Custom styled (custom-scrollbar class)
- **Spacing:** `16px` between groups (space-y-4)

### Purpose
Contains two collapsible groups with task lists.

---

## 5. GROUP STRUCTURE

### Group Container
- **Element:** `<div>`
- **Spacing:** `8px` between internal elements (space-y-2)

### Group Header
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`
- **Cursor:** `pointer`
- **Hover Background:** `#F9FAFB`
- **Padding:** `4px horizontal (px-1), 4px vertical (py-1)`
- **Border Radius:** `4px` (rounded)
- **Margin:** `-4px horizontal (-mx-1)` (negative to extend hover area)
- **Transition:** `colors 150ms`

#### Left Side: Title + Chevron
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `6px` (gap-1.5)

**Chevron Icon:**
- **Component:** `<ChevronDown>` or `<ChevronRight>` from lucide-react
- **Size:** `14px × 14px` (w-3.5 h-3.5)
- **Color:** `#6B7280` (Gray 500)
- **Rotation:** Down when expanded, right when collapsed

**Group Title:**
- **Element:** `<span>`
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#374151` (Gray 700)
- **Text:** "Assigned" or "Personal"

#### Right Side: Count Badge
- **Element:** `<span>`
- **Font Size:** `11px`
- **Padding:**
  - Horizontal: `8px` (px-2)
  - Vertical: `2px` (py-0.5)
- **Border Radius:** `6px`
- **Background:** `#F3F4F6` (Gray 100)
- **Text Color:** `#6B7280` (Gray 500)
- **Font Weight:** `500` (font-medium)
- **Content:** Task count (e.g., "4", "3")

### Group Divider
- **Element:** `<div>`
- **Border Bottom:** `1px solid #E5E7EB` (Gray 200)
- **Margin:** `8px vertical` (from space-y-2)

### Group Content (When Expanded)
- **Element:** `<div>`
- **Spacing:** `8px` between tasks (space-y-2)
- **Margin Top:** `8px` (from space-y-2)

---

## 6. QUICK-ADD INPUT (Personal Group Only)

### Container
- **Element:** `<div>`
- **Display:** Only in Personal group when activated
- **Background:** `#EFF6FF` (Blue 50)
- **Border:** `1px solid #60A5FA` (Blue 400)
- **Border Radius:** `4px` (rounded)
- **Padding:** `10px horizontal (px-2.5), 8px vertical (py-2)`
- **Margin Bottom:** `6px` (mb-1.5)

### Input Row
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `8px` (gap-2)
- **Margin Bottom:** `6px` (mb-1.5)

#### Icon
- **Component:** `<CheckSquare>` from lucide-react
- **Size:** `16px × 16px` (w-4 h-4)
- **Color:** `#60A5FA` (Blue 400)
- **Flex Shrink:** `0`

#### Input Field
- **Element:** `<input type="text">`
- **Flex:** `1` (takes remaining space)
- **Background:** `transparent`
- **Border:** `none`
- **Outline:** `none`
- **Font Size:** `14px`
- **Text Color:** `#1F2937` (Gray 800)
- **Placeholder:** "Add quick to-do..."
- **Placeholder Color:** `#9CA3AF` (Gray 400)
- **Auto Focus:** `true`
- **Key Handlers:**
  - Enter: Add task
  - Escape: Cancel

### Button Row
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `flex-end` (right-aligned)
- **Gap:** `6px` (gap-1.5)

#### Cancel Button
- **Element:** `<button>`
- **Padding:** `8px horizontal (px-2), 2px vertical (py-0.5)`
- **Hover Background:** `rgba(255, 255, 255, 0.5)`
- **Text Color:** `#6B7280` (Gray 500)
- **Font Size:** `11px`
- **Border Radius:** `4px` (rounded)
- **Text:** "Cancel"
- **Transition:** `colors 150ms`

#### Add Button
- **Element:** `<button>`
- **Padding:** `10px horizontal (px-2.5), 2px vertical (py-0.5)`
- **Background:** `#60A5FA` (Blue 400)
- **Hover Background:** `#3B82F6` (Blue 500)
- **Text Color:** `#FFFFFF` (white)
- **Font Size:** `11px`
- **Font Weight:** `500` (font-medium)
- **Border Radius:** `4px` (rounded)
- **Text:** "Add"
- **Transition:** `colors 150ms`

---

## 7. TASK CARD STRUCTURE

### Card Container
- **Element:** `<div>`
- **Border:** `1px solid`
- **Border Radius:** `4px` (rounded)
- **Position:** `relative`
- **Transition:** `all 150ms`
- **Class:** `group` (for child hover effects)

### Card States

#### Normal (Not Completed)
- **Background:** `#FFFFFF` (white)
- **Border Color:** `#E5E7EB` (Gray 200)
- **Hover Border Color:** `#60A5FA` (Blue 400)
- **Hover Background:** `#F9FAFB` (on inner row)
- **Cursor:** `pointer` (on main row)
- **Draggable:** `true`

#### Completed
- **Background:** `#F9FAFB` (Gray 50)
- **Border Color:** `#F3F4F6` (Gray 100)
- **Opacity:** `0.4` (40%)
- **Cursor:** `default`
- **Draggable:** `false`

---

## 8. PRIORITY INDICATOR BAR

### Container
- **Element:** `<div>`
- **Position:** `absolute`
- **Location:** `left: 0, top: 0, bottom: 0`
- **Width:** `4px` (w-1)
- **Border Radius:** `4px 0 0 4px` (rounded-l)
- **Z-Index:** `10`
- **Display:** Only when not completed

### Clickable Button
- **Element:** `<button>`
- **Position:** `absolute inset-0`
- **Width:** `4px` (default)
- **Hover Width:** `12px` (w-3)
- **Background Color:** Dynamic based on priority
- **Border Radius:** `4px 0 0 4px` (rounded-l)
- **Transition:** `all 150ms`
- **Cursor:** `pointer`

### Priority Colors
| Priority | Color Code | Color Name |
|----------|------------|------------|
| High | `#F87171` | Red 400 |
| Medium | `#FBBF24` | Yellow 400 |
| Low | `#60A5FA` | Blue 400 |
| Default | `#9CA3AF` | Gray 400 |

### Priority Dropdown Menu (When Active)
- **Container:**
  - Position: `absolute`, `left: 32px (left-8)`, `top: 8px (top-2)`
  - Background: White
  - Border: `1px solid #D1D5DB` (Gray 300)
  - Border Radius: `4px` (rounded)
  - Box Shadow: `shadow-xl`
  - Z-Index: `20`
  - Min Width: `140px`
  - Padding: `6px vertical (py-1.5)`
  - Overflow: `hidden`

#### Dropdown Header
- **Element:** `<div>`
- **Padding:** `12px horizontal (px-3), 6px vertical (py-1.5)`
- **Font Size:** `10px`
- **Text Transform:** `uppercase`
- **Letter Spacing:** `wide`
- **Color:** `#6B7280` (Gray 500)
- **Font Weight:** `500` (font-medium)
- **Background:** `#F9FAFB` (Gray 50)
- **Border Bottom:** `1px solid #E5E7EB`
- **Text:** "SET PRIORITY"

#### Priority Option Button (High)
- **Element:** `<button>`
- **Width:** `100%`
- **Text Align:** `left`
- **Padding:** `12px horizontal (px-3), 8px vertical (py-2)`
- **Font Size:** `13px`
- **Color:** `#1F2937` (Gray 800)
- **Hover Background:** `#FEF2F2` (Red 50)
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `10px` (gap-2.5)
- **Transition:** `colors 150ms`

**Priority Indicator:**
- **Element:** `<div>`
- **Width:** `4px` (w-1)
- **Hover Width:** `6px` (w-1.5)
- **Height:** `20px` (h-5)
- **Border Radius:** `full` (rounded-full)
- **Background:** `#F87171` (Red 400)
- **Transition:** `all 150ms`

**Label:**
- **Element:** `<span>`
- **Font Weight:** `500` (font-medium)
- **Text:** "High"

#### Priority Option Button (Medium)
- Same as High but:
- **Hover Background:** `#FFFBEB` (Yellow 50)
- **Indicator Color:** `#FBBF24` (Yellow 400)
- **Text:** "Medium"

#### Priority Option Button (Low)
- Same as High but:
- **Hover Background:** `#EFF6FF` (Blue 50)
- **Indicator Color:** `#60A5FA` (Blue 400)
- **Text:** "Low"

---

## 9. MAIN TASK ROW

### Container
- **Element:** `<div>`
- **Draggable:** `true` (when not completed)
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `8px` (gap-2)
- **Padding:** `10px horizontal (px-2.5), 8px vertical (py-2)`
- **Transition:** `all 150ms`
- **Hover Background:** `#F9FAFB` (when not completed)
- **Cursor:** `pointer` (when not completed)

### Drag Handle
- **Component:** `<GripVertical>` from lucide-react
- **Size:** `12px × 12px` (w-3 h-3)
- **Color:** `#9CA3AF` (Gray 400)
- **Flex Shrink:** `0`
- **Display:** Only when not completed

### Checkbox
- **Element:** `<input type="checkbox">`
- **Size:** `16px × 16px` (w-4 h-4)
- **Accent Color:** `#60A5FA` (Blue 400)
- **Cursor:** `pointer`
- **Flex Shrink:** `0`
- **On Change:** Toggles task completion

### Task Content Container
- **Element:** `<div>`
- **Flex:** `1` (takes remaining space)
- **Min Width:** `0` (allows truncation)
- **Cursor:** `pointer` (for Assigned tasks)

#### Task Title
- **Element:** `<p>`
- **Font Size:** `14px`
- **Line Height:** `tight` (1.25)
- **Font Weight:** `500` (font-medium)
- **Color (normal):** `#1F2937` (Gray 800)
- **Color (completed):** `#9CA3AF` (Gray 400)
- **Text Decoration (completed):** `line-through`

#### Task Metadata Row
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `6px` (gap-1.5)
- **Font Size:** `12px`
- **Color:** `#6B7280` (Gray 500)
- **Flex Wrap:** `wrap`
- **Margin Top:** `2px` (mt-0.5)

**Project Tag (Assigned tasks only):**
- **Element:** `<span>`
- **Font Size:** `11px`
- **Padding:** `6px horizontal (px-1.5), 2px vertical (py-0.5)`
- **Border Radius:** `4px` (rounded)
- **Font Weight:** `500` (font-medium)
- **Text Color:** `#FFFFFF` (white)
- **Background:** Dynamic project color
- **White Space:** `nowrap`
- **Examples:**
  - BIOGEMSE: #60A5FA (Blue)
  - MATRIX: #34D399 (Green)
  - CORE: #9CA3AF (Gray)
  - APEX: #60A5FA (Blue)

**Category:**
- **Format:** `• {category}`
- **Examples:** "• Finance", "• People", "• Strategy"

**Due Date:**
- **Format:** `• {due}`
- **Examples:** "• Today", "• Tomorrow", "• This week"

**Scheduled Time (if exists):**
- **Format:** `• 🕐 {time}`
- **Icon:** Clock (12px, same color as text)
- **Gap:** `4px` (gap-1)
- **White Space:** `nowrap`
- **Examples:** "• 🕐 15:00", "• 🕐 09:30"

**Checklist Progress (if exists):**
- **Format:** `• Checklist {completed}/{total}`
- **Examples:** "• Checklist 2/4", "• Checklist 1/3"

### Action Buttons (Right Side)

#### Convert to Task Button (Personal tasks only)
- **Component:** `<ArrowUpRight>` from lucide-react
- **Size:** `14px × 14px` (w-3.5 h-3.5)
- **Color:** `#60A5FA` (Blue 400)
- **Container:**
  - Padding: `4px` (p-1)
  - Hover Background: `#EFF6FF` (Blue 50)
  - Border Radius: `4px` (rounded)
  - Opacity: `0` (default)
  - Group Hover Opacity: `100%`
  - Transition: `all 150ms`
  - Flex Shrink: `0`
- **Title:** "Convert to project task"
- **Display:** Only when not completed and not in Assigned group

#### Add Checklist Button (when no checklist)
- **Component:** `<CheckSquare>` from lucide-react
- **Size:** `14px × 14px` (w-3.5 h-3.5)
- **Color:** `#60A5FA` (Blue 400)
- **Container:**
  - Padding: `4px` (p-1)
  - Hover Background: `#EFF6FF` (Blue 50)
  - Border Radius: `4px` (rounded)
  - Opacity: `0` (default)
  - Group Hover Opacity: `100%`
  - Transition: `all 150ms`
  - Flex Shrink: `0`
- **Title:** "Add checklist"
- **Display:** Only when not completed and no checklist exists

#### Expand/Collapse Chevron (when checklist exists)
- **Component:** `<ChevronUp>` or `<ChevronDown>` from lucide-react
- **Size:** `14px × 14px` (w-3.5 h-3.5)
- **Color:** `#6B7280` (Gray 500)
- **Container:**
  - Padding: `2px` (p-0.5)
  - Hover Background: `#F3F4F6` (Gray 100)
  - Border Radius: `4px` (rounded)
  - Transition: `colors 150ms`
  - Flex Shrink: `0`
- **Display:** Always visible when checklist exists

---

## 10. CHECKLIST SECTION (EXPANDED)

### Container
- **Element:** `<div>`
- **Border Top:** `1px solid #E5E7EB` (Gray 200)
- **Padding:** `10px horizontal (px-2.5), 8px vertical (py-2)`
- **Padding Left:** `52px` (pl-[52px]) - indented to align with task title
- **Display:** Only when expanded

### Checklist Items Container
- **Element:** `<div>`
- **Spacing:** `6px` between items (space-y-1.5)

### Checklist Item
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `8px` (gap-2)

#### Checkbox
- **Element:** `<input type="checkbox">`
- **Size:** `14px × 14px` (w-3.5 h-3.5)
- **Accent Color:** `#60A5FA` (Blue 400)
- **Cursor:** `pointer`
- **Flex Shrink:** `0`

#### Label Text
- **Element:** `<span>`
- **Font Size:** `13px`
- **Color (normal):** `#4B5563` (Gray 600)
- **Color (completed):** `#9CA3AF` (Gray 400)
- **Text Decoration (completed):** `line-through`
- **Examples:**
  - "Review Q3 expenses"
  - "Check contractor invoices"
  - "Update forecast model"
  - "Send to CFO for approval"

### Add New Checklist Item
- **Container:**
  - Display: `flex`
  - Align Items: `center`
  - Gap: `8px` (gap-2)
  - Margin Top: `8px` (mt-2)
  - Padding Top: `6px` (pt-1.5)
  - Border Top: `1px solid #E5E7EB`

#### Icon
- **Component:** `<CheckSquare>` from lucide-react
- **Size:** `14px × 14px` (w-3.5 h-3.5)
- **Color:** `#60A5FA` (Blue 400)
- **Flex Shrink:** `0`

#### Input Field
- **Element:** `<input type="text">`
- **Flex:** `1`
- **Background:** `transparent`
- **Border:** `none`
- **Outline:** `none`
- **Font Size:** `13px`
- **Text Color:** `#1F2937` (Gray 800)
- **Placeholder:** "Add item..."
- **Placeholder Color:** `#9CA3AF` (Gray 400)
- **Key Handler:** Enter to add new item

---

## 11. FOOTER SECTION

### Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `16px` (px-4)
  - Vertical: `8px` (py-2)
  - Padding Top: `8px` (additional)
- **Border Top:** `1px solid #E5E7EB` (Gray 200)
- **Min Height:** `36px`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`

### All Tasks Link (Left)
- **Element:** `<button>`
- **Font Size:** `11px`
- **Color:** `#3B82F6` (Blue 500)
- **Hover Color:** `#2563EB` (Blue 600)
- **Hover Decoration:** `underline`
- **Transition:** `all 150ms`
- **Text:** "All tasks →"
- **Background:** Transparent
- **Border:** None

### Active Count (Right)
- **Element:** `<span>`
- **Font Size:** `11px`
- **Color:** `#6B7280` (Gray 500)
- **Format:** `{count} active`
- **Examples:** "7 active", "4 active"

---

## 12. COLOR PALETTE

### Primary Colors (Blue Theme)
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Blue 400 | `#60A5FA` | Primary theme, icons, buttons, checkboxes |
| Blue 300 | `#93C5FD` | Gradient end |
| Blue 500 | `#3B82F6` | Button hover, link color |
| Blue 600 | `#2563EB` | Link hover |
| Blue 50 | `#EFF6FF` | Quick-add background, hover states |

### Priority Colors
| Priority | Hex Code | Color Name |
|----------|----------|------------|
| High | `#F87171` | Red 400 |
| Medium | `#FBBF24` | Yellow/Amber 400 |
| Low | `#60A5FA` | Blue 400 |

### Project Colors
| Project | Hex Code | Color Name |
|---------|----------|------------|
| BIOGEMSE | `#60A5FA` | Blue 400 |
| MATRIX | `#34D399` | Green 400 |
| CORE | `#9CA3AF` | Gray 400 |
| APEX | `#60A5FA` | Blue 400 |

### Text Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 800 | `#1F2937` | Primary text (task titles, input) |
| Gray 700 | `#374151` | Group headers |
| Gray 600 | `#4B5563` | Checklist items |
| Gray 500 | `#6B7280` | Secondary text (metadata, counts) |
| Gray 400 | `#9CA3AF` | Completed text, placeholders, drag handle |
| White | `#FFFFFF` | Button text, project tag text |

### Background Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| White | `#FFFFFF` | Widget background, task cards |
| Gray 50 | `#F9FAFB` | Hover states, completed tasks, dropdown header |
| Gray 100 | `#F3F4F6` | Count badges, completed task borders |

### Border Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 200 | `#E5E7EB` | Standard borders (header, footer, dividers) |
| Gray 300 | `#D1D5DB` | Priority dropdown border |
| Blue 400 | `#60A5FA` | Hover border, quick-add border |

### Hover Backgrounds (Priority Menu)
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Red 50 | `#FEF2F2` | High priority hover |
| Yellow 50 | `#FFFBEB` | Medium priority hover |
| Blue 50 | `#EFF6FF` | Low priority hover |

---

## 13. TYPOGRAPHY SCALE

### Font Family
- **All Text:** `Inter` (via globals.css)
- **Fallback:** System UI fonts

### Size & Weight Breakdown
| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| Widget Title | 14px | 500 (Medium) | #1F2937 | Default |
| New Button | 11px | 500 (Medium) | #FFFFFF | Default |
| Menu Items | 13px | 400 (Regular) | #1F2937 | Default |
| Group Header | 14px | 500 (Medium) | #374151 | Default |
| Count Badge | 11px | 500 (Medium) | #6B7280 | Default |
| Task Title | 14px | 500 (Medium) | #1F2937/#9CA3AF | Tight (1.25) |
| Task Metadata | 12px | 400 (Regular) | #6B7280 | Default |
| Project Tag | 11px | 500 (Medium) | #FFFFFF | Default |
| Checklist Item | 13px | 400 (Regular) | #4B5563/#9CA3AF | Default |
| Footer Link | 11px | 400 (Regular) | #3B82F6 | Default |
| Footer Count | 11px | 400 (Regular) | #6B7280 | Default |
| Priority Label | 13px | 500 (Medium) | #1F2937 | Default |
| Priority Header | 10px | 500 (Medium) | #6B7280 | Default (uppercase) |

---

## 14. SPACING & LAYOUT

### Overall Widget Measurements
```
Container (340px × 100% height)
│
├─ Top Gradient: 4px
│
├─ Header: 40px min
│  ├─ Padding: 16px (h) × 10px (v)
│  └─ Gap: 6px between title elements
│
├─ Content: flex-1 (remaining space)
│  ├─ Padding: 16px (h) × 12px (v)
│  ├─ Group Spacing: 16px between groups
│  │
│  └─ Each Group:
│     ├─ Header: auto height
│     │  ├─ Padding: 4px (h) × 4px (v)
│     │  ├─ Margin: -4px (h) for hover
│     │  └─ Gap: 6px
│     │
│     ├─ Divider: 1px
│     │
│     ├─ Task Spacing: 8px between
│     │
│     └─ Each Task Card:
│        ├─ Priority Bar: 4px wide (12px on hover)
│        ├─ Main Row Padding: 10px (h) × 8px (v)
│        ├─ Gap: 8px between elements
│        │
│        └─ Checklist (if expanded):
│           ├─ Border Top: 1px
│           ├─ Padding: 10px (h) × 8px (v)
│           ├─ Padding Left: 52px (indent)
│           ├─ Item Spacing: 6px
│           └─ Add Item Border: 1px top
│
└─ Footer: 36px min
   └─ Padding: 16px (h) × 8px (v) + 8px top
```

### Detailed Spacing Tokens
- **Group Gap:** 16px (space-y-4)
- **Task Gap:** 8px (space-y-2)
- **Element Gap (row):** 8px (gap-2)
- **Small Gap:** 6px (gap-1.5)
- **Checklist Item Gap:** 6px (space-y-1.5)
- **Priority Bar Width:** 4px → 12px (hover)
- **Checklist Indent:** 52px

---

## 15. INTERACTIVE STATES & ANIMATIONS

### Task Card States
| State | Background | Border | Opacity | Cursor | Draggable |
|-------|------------|--------|---------|--------|-----------|
| Normal | White | #E5E7EB | 100% | pointer | true |
| Hover | #F9FAFB (inner) | #60A5FA | 100% | pointer | true |
| Completed | #F9FAFB | #F3F4F6 | 40% | default | false |

### Priority Bar States
| State | Width | Cursor | Transition |
|-------|-------|--------|------------|
| Default | 4px | pointer | all 150ms |
| Hover | 12px | pointer | all 150ms |

### Button Hover States
| Button | Default | Hover | Transition |
|--------|---------|-------|------------|
| New | #60A5FA | #3B82F6 | all 150ms |
| Quick Add | #60A5FA | #3B82F6 | colors 150ms |
| All Tasks Link | #3B82F6 | #2563EB + underline | all 150ms |

### Opacity Transitions (Group Hover)
| Element | Default | Group Hover | Transition |
|---------|---------|-------------|------------|
| Convert Button | 0% | 100% | all 150ms |
| Add Checklist Button | 0% | 100% | all 150ms |

### Color Transitions
- **All hover effects:** 150ms ease
- **Border color changes:** 150ms ease
- **Background changes:** 150ms ease
- **Opacity changes:** 150ms ease

---

## 16. DRAG & DROP FUNCTIONALITY

### Draggable Elements
- **Task cards (when not completed)**
- **Drag Handle:** GripVertical icon visible
- **Cursor:** Changes to grab/grabbing (browser default)
- **On Drag Start:** Calls `onDragStart(task)`
- **On Drag End:** Calls `onDragEnd()`

### Visual Feedback
- **Drag Handle Color:** #9CA3AF (Gray 400)
- **Drag Handle Size:** 12px × 12px
- **Active Drag:** Task remains in list (no opacity change in this widget)

### Integration
Tasks can be dragged to Agenda widget for scheduling.

---

## 17. DROPDOWN MENUS

### New Dropdown Menu
- **Trigger:** Click "New +" button
- **Position:** Absolute, right-aligned under button
- **Margin Top:** 4px (mt-1)
- **Overlay:** Full-screen transparent click target (z-10)
- **Menu Z-Index:** 20
- **Animation:** Instant (no transition defined)

### Priority Dropdown Menu
- **Trigger:** Click priority bar
- **Position:** Absolute, left: 32px, top: 8px
- **Overlay:** Full-screen transparent click target (z-10)
- **Menu Z-Index:** 20
- **Animation:** Instant (no transition defined)
- **Close On:** Click outside, select priority

---

## 18. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Proper heading (`<h3>`), buttons, checkboxes
- **Form Controls:** Native checkbox inputs
- **Button Elements:** Proper `<button>` tags
- **Keyboard Support:** Enter key for input fields, Escape for cancel
- **Draggable Attribute:** Proper HTML5 drag-and-drop

### Text Contrast Ratios
- **Gray 800 on White:** ~12:1 ✓ (AAA)
- **White on Blue 400:** ~3.5:1 ⚠️ (AA Large)
- **Gray 600 on White:** ~8:1 ✓ (AAA)
- **Gray 500 on White:** ~5:1 ✓ (AA)

### Potential Improvements
- Add ARIA labels for icon buttons
- Add aria-expanded for collapsible groups
- Add aria-checked for custom checkboxes (if applicable)
- Focus visible states for keyboard navigation
- Screen reader announcements for task completion
- Live region updates for dynamic content

---

## 19. SCROLLBAR STYLING

### Custom Scrollbar (custom-scrollbar class)
Assuming standard Workdeck scrollbar styling:
- **Width:** ~6px
- **Track:** Transparent or very light gray
- **Thumb:** Light gray (#D1D5DB)
- **Thumb Hover:** Medium gray (#9CA3AF)
- **Border Radius:** Rounded
- **Overflow:** auto (vertical scroll)

---

## 20. SHADOW SYSTEM

### Box Shadows Used
| Element | Shadow Name | Values |
|---------|-------------|--------|
| Widget Container | Elevated | `0 2px 8px rgba(0,0,0,0.1)` |
| New Dropdown | Large | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` |
| Priority Dropdown | Extra Large | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)` |

### Shadow Breakdown

**Widget Container:**
- X: 0px, Y: 2px, Blur: 8px
- Color: Black at 10% opacity

**Large Shadow (Dropdowns):**
- Layer 1: X: 0, Y: 10px, Blur: 15px, Spread: -3px
- Layer 2: X: 0, Y: 4px, Blur: 6px, Spread: -2px
- Color: Black at 10% and 5% opacity

**Extra Large Shadow (Priority):**
- Layer 1: X: 0, Y: 20px, Blur: 25px, Spread: -5px
- Layer 2: X: 0, Y: 10px, Blur: 10px, Spread: -5px
- Color: Black at 10% and 4% opacity

---

## 21. ICON SPECIFICATIONS

### Icons Used (from lucide-react)

| Icon | Location | Size | Color | Stroke |
|------|----------|------|-------|--------|
| CheckSquare | Header, buttons, checklist | 16px/14px | #60A5FA | 2px |
| GripVertical | Task drag handle | 12px | #9CA3AF | 2px |
| Clock | Scheduled time indicator | 12px | #6B7280 | 2px |
| ChevronDown | Expanded groups, expand task | 14px | #6B7280/#6B7280 | 2px |
| ChevronRight | Collapsed groups | 14px | #6B7280 | 2px |
| ChevronUp | Collapse task | 14px | #6B7280 | 2px |
| ArrowUpRight | Convert to task, new task menu | 14px | #60A5FA | 2px |
| MoreHorizontal | (potential menu) | 14px | #6B7280 | 2px |

### Icon Alignment
- All icons vertically centered with adjacent text
- Consistent gap spacing (4px, 6px, 8px depending on context)
- Flex shrink: 0 to prevent distortion

---

## 22. BORDER SYSTEM

### Border Specifications
| Element | Width | Color | Radius |
|---------|-------|-------|--------|
| Widget | - | - | 6px |
| Header Bottom | 1px | #E5E7EB | - |
| Footer Top | 1px | #E5E7EB | - |
| Group Divider | 1px | #E5E7EB | - |
| Task Card | 1px | #E5E7EB/#60A5FA | 4px |
| Task Card (completed) | 1px | #F3F4F6 | 4px |
| Priority Bar | - | - | 4px (left only) |
| Buttons | - | - | 4px |
| Quick-Add Container | 1px | #60A5FA | 4px |
| Dropdown Menus | 1px | #E5E7EB/#D1D5DB | 4px |
| Checklist Section | 1px (top) | #E5E7EB | - |
| Checklist Add Item | 1px (top) | #E5E7EB | - |

---

## 23. DATA STRUCTURE

### Task Interface
```typescript
interface Task {
  id: string;              // Unique identifier (e.g., 'a1', 'p1')
  title: string;           // Task description
  project?: string;        // Project name (Assigned only)
  projectColor?: string;   // Project badge color (Assigned only)
  category: string;        // Category label
  due: string;             // Due date label
  duration: string;        // Estimated duration
  completed: boolean;      // Completion status
  endDate?: string;        // Scheduled time (e.g., '15:00')
  checklist?: ChecklistItem[]; // Optional checklist
  priority?: 'high' | 'medium' | 'low'; // Priority level
}

interface ChecklistItem {
  id: string;              // Unique identifier
  label: string;           // Item description
  completed: boolean;      // Completion status
}
```

### Sample Assigned Task
```javascript
{
  id: 'a1',
  title: 'Review project budget',
  project: 'BIOGEMSE',
  projectColor: '#60A5FA',
  category: 'Finance',
  due: 'Today',
  duration: '2h',
  completed: false,
  priority: 'high',
  endDate: '15:00',
  checklist: [
    { id: 'c1', label: 'Review Q3 expenses', completed: true },
    { id: 'c2', label: 'Check contractor invoices', completed: true },
    { id: 'c3', label: 'Update forecast model', completed: false },
    { id: 'c4', label: 'Send to CFO for approval', completed: false }
  ]
}
```

### Sample Personal Task
```javascript
{
  id: 'p1',
  title: 'Prepare team standup notes',
  category: 'People',
  due: 'Today',
  duration: '30m',
  completed: false,
  priority: 'medium',
  endDate: '09:30'
}
```

---

## 24. FUNCTIONAL FEATURES

### Task Management
1. **Toggle Completion:** Click checkbox
2. **Expand/Collapse Group:** Click group header
3. **Expand/Collapse Task:** Click chevron (when checklist exists)
4. **Change Priority:** Click priority bar → select from menu
5. **Drag Task:** Grab drag handle → drag to Agenda widget
6. **Open Task Detail:** Click task title (Assigned tasks only)
7. **Convert to Project Task:** Click arrow icon (Personal tasks)

### Quick Add Feature
1. **Activate:** Click "New +" → "Quick to-do"
2. **Input:** Type task name
3. **Confirm:** Press Enter or click "Add"
4. **Cancel:** Press Escape or click "Cancel"
5. **Result:** New task added to Personal group

### Checklist Management
1. **Add Checklist:** Click CheckSquare icon → type item → Enter
2. **Toggle Item:** Click checkbox on item
3. **Add Item:** Type in "Add item..." field → Enter
4. **Progress Display:** Shows "Checklist X/Y" in metadata

### Group Collapsing
- **Assigned Group:** Shows/hides 4 assigned tasks
- **Personal Group:** Shows/hides 3 personal tasks
- **State:** Preserved in React state
- **Default:** Both groups expanded

---

## 25. RESPONSIVE BEHAVIOR

### Fixed Dimensions
- **Width:** 340px (fixed from grid)
- **Height:** 100% of dashboard (spans 2 rows)
- **Grid Position:** Column 3, Rows 1-2

### Scrolling Behavior
- **Content Area:** Vertical scroll when tasks overflow
- **Checklist:** Expands inline, increases content height
- **Quick-Add:** Appears inline at top of Personal group

### Text Handling
- **Task Title:** Wraps, no truncation
- **Metadata Items:** nowrap, can wrap row
- **Group Title:** No truncation
- **Checklist Items:** Wraps as needed

---

## 26. DESIGN TOKENS SUMMARY

### Spacing Scale (Tailwind)
- **0.5:** 2px
- **1:** 4px
- **1.5:** 6px
- **2:** 8px
- **2.5:** 10px
- **3:** 12px
- **3.5:** 14px
- **4:** 16px

### Radius Scale
- **rounded (4px):** Task cards, buttons, badges, dropdowns
- **rounded-lg (6px):** Widget container, count badges
- **rounded-full:** Priority indicators in menu, count badge circles

### Font Size Scale
- **10px:** Uppercase labels
- **11px:** Buttons, footer, metadata tags, counts
- **12px:** Task metadata row
- **13px:** Menu items, checklist items, priority labels
- **14px:** Headings, task titles, main text

### Font Weight Scale
- **400 (Regular):** Body text, metadata, checklist
- **500 (Medium):** Headings, task titles, buttons, badges
- **700 (Bold):** (not used in this widget)

### Z-Index Layers
- **10:** Overlay backgrounds (click-to-close)
- **10:** Priority bar
- **20:** Dropdown menus

---

## SUMMARY

The To-Do List Widget is a comprehensive task management interface featuring:

### Key Features
- **Two-Group System:** Assigned (project-linked) and Personal tasks
- **Collapsible Groups:** Expand/collapse with chevron icons
- **Priority System:** Visual bar indicator (red/yellow/blue) with dropdown menu
- **Inline Checklists:** Expandable sub-task lists
- **Drag & Drop:** Draggable tasks to schedule in Agenda
- **Quick-Add:** Fast personal task creation
- **Task Conversion:** Convert personal tasks to project tasks
- **Smart UI:** Hover-revealed actions, smooth transitions
- **Progress Tracking:** Checklist counters, active task count
- **Full-Height Design:** Spans entire dashboard height (340px × 100%)

### Visual Design
- **Blue Theme:** #60A5FA primary color throughout
- **Priority Colors:** Red (high), Yellow (medium), Blue (low)
- **Clean Layout:** 4px spacing unit, 4px/6px border radius
- **Hover States:** Border highlights, background tints, revealed actions
- **Consistent Typography:** 10-14px range, 400-500 weight

### Interaction Patterns
- **Click:** Checkboxes, priority bar, chevrons, buttons
- **Drag:** Task cards to Agenda widget
- **Keyboard:** Enter/Escape for quick-add
- **Hover:** Reveal convert/checklist buttons
- **Dropdown:** New menu, priority menu

The widget successfully balances information density with usability, providing powerful task management in a compact 340px width.
