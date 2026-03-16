# Agenda Widget (Today's Schedule) - Complete Design Specification

## Overview
The Agenda Widget is a sophisticated time-based calendar interface displaying today's schedule with a vertical timeline (0:00-23:00). It features drag-and-drop scheduling from the To-Do widget, inline event editing with resize handles, overlapping event management, auto-scroll to current time, and a live drop indicator. It uses a yellow/amber color scheme and spans the full height of the dashboard (340px × full height).

---

## Widget Structure

```
┌──────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓ Yellow Gradient Top Accent ▓▓▓▓▓�▓▓▓▓▓▓▓▓ │ ← 4px height
├──────────────────────────────────────────────────┤
│ 📅 Today                          [◀] [▶]        │ ← Header (36px min)
│ Saturday, November 22                            │
├──────────────────────────────────────────────────┤
│  0:00  ─────────────────────────────────────────│
│  1:00  ─────────────────────────────────────────│
│  ...   ─────────────────────────────────────────│
│  9:00  ┌──────────────────────────────────────┐ │
│        │ Team standup                         │ │
│        │ 09:00 - 10:00                        │ │
│  10:00 ├──────────────────────────────────────┤ │ ← Content area
│        │ Client call - BIOGEMSE               │ │   (scrollable
│        │ 10:30 - 11:00                        │ │   timeline)
│  11:00 └──────────────────────────────────────┘ │
│  12:00 ─────────────────────────────────────────│
│  13:00 ─────────────────────────────────────────│
│ ●14:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━ (current time)│
│  15:00 ┌──────────────────────────────────────┐ │
│        │ Finalize Q4 goals                    │ │
│  ...   └──────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│ Full calendar →                                  │ ← Footer (30px min)
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

### Mouse Event Handlers
- **onMouseMove:** Handles resize and drag operations
- **onMouseUp:** Ends resize/drag operations
- **onMouseLeave:** Cancels resize/drag on mouse exit

### Purpose
Full-height timeline calendar for daily schedule management.

---

## 2. TOP ACCENT GRADIENT

### Visual Element
- **Element:** `<div>`
- **Position:** `absolute`
- **Location:** `left: 0, right: 0, top: 0`
- **Height:** `4px` (h-1 in Tailwind)
- **Background:** `linear-gradient(90deg, #FBBF24 0%, #FDE68A 100%)`
  - **Start Color (0%):** `#FBBF24` - Amber/Yellow 400
  - **End Color (100%):** `#FDE68A` - Amber/Yellow 200 (lighter)
  - **Direction:** Left to right (90deg)

### Color Details
- **#FBBF24** (Amber 400):
  - RGB: 251, 191, 36
  - HSL: 43°, 96%, 56%
  - Warm, calendar yellow
  
- **#FDE68A** (Amber 200):
  - RGB: 253, 230, 138
  - HSL: 48°, 97%, 77%
  - Light, pastel yellow

### Purpose
Visual brand identifier for calendar/time-based widgets.

---

## 3. HEADER SECTION

### Container
- **Element:** `<div>`
- **Padding:** 
  - Horizontal: `12px` (px-3)
  - Vertical: `8px` (py-2)
- **Border Bottom:** `1px solid #E5E7EB` (Gray 200)
- **Min Height:** `36px`

### Top Row
- **Element:** `<div>`
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `space-between`
- **Margin Bottom:** `4px` (mb-1)

#### Left Side: Title Group
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `6px` (gap-1.5)

**Calendar Icon:**
- **Component:** `<Calendar>` from lucide-react
- **Size:** `16px × 16px` (w-4 h-4)
- **Color:** `#FBBF24` (Amber 400 - matches gradient)
- **Stroke Width:** 2px

**Title Text:**
- **Element:** `<h3>`
- **Text:** "Today"
- **Font Size:** `14px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#1F2937` (Gray 800)

#### Right Side: Navigation Buttons
- **Display:** `flex`
- **Align Items:** `center`
- **Gap:** `4px` (gap-1)

**Previous Day Button:**
- **Element:** `<button>`
- **Padding:** `2px` (p-0.5)
- **Hover Background:** `#F9FAFB` (Gray 50)
- **Border Radius:** `4px` (rounded)
- **Transition:** `colors 150ms`
- **Icon:** ChevronLeft (16px, #6B7280)

**Next Day Button:**
- **Element:** `<button>`
- **Padding:** `2px` (p-0.5)
- **Hover Background:** `#F9FAFB` (Gray 50)
- **Border Radius:** `4px` (rounded)
- **Transition:** `colors 150ms`
- **Icon:** ChevronRight (16px, #6B7280)

### Date Subtitle Row
- **Element:** `<p>`
- **Font Size:** `10px`
- **Color:** `#9CA3AF` (Gray 400 - muted)
- **Text:** "Saturday, November 22"
- **Format:** `{Day of week}, {Month} {Date}`

### Visual Hierarchy
```
[📅 Icon]  [Today]              [◀] [▶]
   ↓          ↓                    ↓
 Amber     Gray 800            Gray 500
 16px       14px                16px icons
           Medium              Navigation

Saturday, November 22
         ↓
    Gray 400, 10px
```

---

## 4. TIMELINE CONTAINER

### Scrollable Container
- **Element:** `<div>`
- **Ref:** `timelineRef` (for programmatic scrolling)
- **Padding:**
  - Horizontal: `8px` (px-2)
  - Vertical: `6px` (py-1.5)
- **Flex:** `1` (takes all remaining vertical space)
- **Overflow Y:** `auto` (vertical scroll)
- **Position:** `relative`
- **Scrollbar:** Custom styled (custom-scrollbar class)

### Drag & Drop Handlers
- **onDragOver:** Shows drop indicator, calculates time
- **onDragLeave:** Hides drop indicator
- **onDrop:** Creates new event at drop time
- **onMouseMove:** Updates drop indicator position

### Auto-Scroll Behavior
- **On Mount:** Scrolls to center current time (14:00 / 2pm)
- **Current Time:** `currentHour = 14`
- **Scroll Position:** `currentHour * 60px - (containerHeight / 2)`

### Inner Timeline Container
- **Element:** `<div>`
- **Position:** `relative`
- **Height:** `${(endHour - startHour + 1) * pixelsPerHour}px`
  - `(23 - 0 + 1) * 60px = 1440px` (24 hours)
- **Purpose:** Absolute positioning context for events and grid

---

## 5. HOUR GRID SYSTEM

### Grid Parameters
- **Start Hour:** `0` (midnight)
- **End Hour:** `23` (11pm)
- **Pixels Per Hour:** `60px`
- **Total Hours:** `24` (0-23)
- **Total Height:** `1440px` (24 × 60px)
- **Time Increment:** 15 minutes (for snapping)

### Hour Row
- **Element:** `<div>`
- **Border Bottom:** `1px solid #F3F4F6` (Gray 100)
- **Height:** `60px` (pixelsPerHour)
- **Position:** `absolute`
- **Top:** `${(hour - startHour) * 60}px`
- **Left:** `0`
- **Right:** `0`

### Hour Label
- **Element:** `<div>`
- **Position:** `absolute`
- **Left:** `0`
- **Top:** `2px` (top-0.5)
- **Width:** `40px` (w-10)
- **Font Size:** `10px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#9CA3AF` (Gray 400)
- **Format:** `{hour}:00` (e.g., "0:00", "9:00", "14:00")

### Grid Visual
```
  0:00  ─────────────────────────────────────
        ↑
        60px height
        ↓
  1:00  ─────────────────────────────────────
  2:00  ─────────────────────────────────────
  ...
  23:00 ─────────────────────────────────────
```

---

## 6. CURRENT TIME INDICATOR

### Container
- **Element:** `<div>`
- **Position:** `absolute`
- **Left:** `0`
- **Right:** `0`
- **Top:** `${((currentHour - startHour) * 60)}px`
  - For 14:00: `14 * 60 = 840px` from top
- **Display:** `flex`
- **Align Items:** `center`
- **Z-Index:** `10`
- **Pointer Events:** `none` (doesn't block interactions)

### Red Dot (Left)
- **Element:** `<div>`
- **Width:** `6px` (w-1.5)
- **Height:** `6px` (h-1.5)
- **Border Radius:** `full` (rounded-full - circle)
- **Background:** `#EF4444` (Red 500)
- **Margin Left:** `2px` (ml-0.5)

### Red Line (Right)
- **Element:** `<div>`
- **Flex:** `1` (takes remaining width)
- **Height:** `2px` (h-0.5)
- **Background:** `#EF4444` (Red 500)
- **Opacity:** `0.7` (70%)

### Visual Appearance
```
●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
↑                    ↑
Red dot (6px)    Red line (2px, 70% opacity)
```

### Purpose
Shows current time position in 24-hour timeline.

---

## 7. DROP INDICATOR LINE

### Container
- **Element:** `<div>`
- **Display:** Only when `isDragOver && dragOverTime !== null`
- **Position:** `absolute`
- **Left:** `40px` (after time labels)
- **Right:** `6px`
- **Top:** `${dragOverTime * 60}px`
- **Height:** `2px`
- **Background:** `#3B82F6` (Blue 500)
- **Z-Index:** `15` (above events)
- **Pointer Events:** `none`

### Time Label
- **Element:** `<div>`
- **Position:** `absolute`
- **Left:** `0`
- **Top:** `-10px` (above line)
- **Font Size:** `9px`
- **Color:** `#3B82F6` (Blue 500)
- **Font Weight:** `500` (font-medium)
- **Background:** `#FFFFFF` (white)
- **Padding:** `4px horizontal (px-1)`
- **Border Radius:** `4px` (rounded)
- **Text:** Formatted time (e.g., "10:30", "14:45")

### Visual Appearance
```
        10:30
─────────━━━━━━━━━━━━━━━━━━━━━━━━━━ (blue line)
```

### Purpose
Shows where dragged task will be scheduled.

---

## 8. DROP HINT TOOLTIP

### Container
- **Element:** `<div>`
- **Display:** Only when `isDragOver`
- **Position:** `absolute`
- **Top:** `56px` (top-14 - below header)
- **Left:** `50%`
- **Transform:** `translateX(-50%)` (centered)
- **Pointer Events:** `none`
- **Z-Index:** `20` (above everything)

### Tooltip Box
- **Element:** `<div>`
- **Background:** `#3B82F6` (Blue 500)
- **Text Color:** `#FFFFFF` (white)
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `6px` (py-1.5)
- **Border Radius:** `4px` (rounded)
- **Font Size:** `12px`
- **Font Weight:** `500` (font-medium)
- **Box Shadow:** `shadow-lg`
- **Text:** "Drop to schedule at {time}"
  - Example: "Drop to schedule at 10:30"

### Visual Appearance
```
┌──────────────────────────────────┐
│ Drop to schedule at 10:30        │
└──────────────────────────────────┘
      Blue background, white text
```

### Purpose
Provides clear feedback during drag operation.

---

## 9. EVENT CARD STRUCTURE

### Event Data Interface
```typescript
interface Event {
  id: string;              // Unique identifier
  start: number;           // Start time in hours (e.g., 9, 10.5, 14)
  duration: number;        // Duration in hours (e.g., 1, 0.5, 1.5)
  title: string;           // Event title
  color: string;           // Background color (hex)
  overlap?: number;        // Column position (0, 1, 2...)
  totalOverlaps?: number;  // Total columns in overlap group
}
```

### Sample Events
```javascript
{ id: '1', start: 9, duration: 1, title: 'Team standup', color: '#8B5CF6' }
{ id: '2', start: 10.5, duration: 0.5, title: 'Client call - BIOGEMSE', color: '#10B981' }
{ id: '3', start: 14, duration: 1.5, title: 'Project review', color: '#F59E0B' }
{ id: '4', start: 15, duration: 1, title: 'Finalize Q4 goals', color: '#60A5FA' }
{ id: '5', start: 16, duration: 1, title: 'Design sync', color: '#3B82F6' }
```

### Event Colors
| Color Code | Color Name | Example Use |
|------------|------------|-------------|
| `#8B5CF6` | Purple 500 | Team standup |
| `#10B981` | Green 500 | Client call |
| `#F59E0B` | Amber 500 | Project review |
| `#60A5FA` | Blue 400 | Q4 goals |
| `#3B82F6` | Blue 500 | Design sync |

---

## 10. EVENT POSITIONING & OVERLAPS

### Position Calculation
```javascript
// For non-overlapping events:
left: calc(40px + 0%)         // Starts after time labels
width: calc(100% - 6px)       // Full width minus padding

// For overlapping events (e.g., 2 events):
left: calc(40px + 0%)         // Event 1 (column 0)
width: calc(50% - 2px)        // Half width

left: calc(40px + 50%)        // Event 2 (column 1)
width: calc(50% - 2px)        // Half width
```

### Overlap Algorithm
1. **Sort events** by start time
2. **Find overlapping events** (time ranges intersect)
3. **Assign columns** (0, 1, 2...) to avoid conflicts
4. **Calculate total columns** in each overlap group
5. **Position events** using `widthPercent = 100 / totalOverlaps`

### Example Overlap Layout
```
9:00   ┌─────────────────────────┐
       │ Team standup            │ (full width)
10:00  └─────────────────────────┘
       ┌────────────┐┌───────────┐
       │ Meeting A  ││ Meeting B │ (50% width each)
11:00  └────────────┘└───────────┘
```

### Visual Properties
- **Top Position:** `${event.start * 60}px`
- **Height:** `${event.duration * 60}px`
- **Min Height:** `30px` (for very short events)
- **Left Position:** `calc(40px + ${leftPercent}%)`
- **Width:** `calc(${widthPercent}% - ${gap}px)`
  - Gap: 2px for overlaps, 6px for single events

---

## 11. EVENT CARD DESIGN

### Outer Container
- **Element:** `<div>`
- **Position:** `absolute`
- **Background Color:** Dynamic (event.color)
- **Border Radius:** `4px`
- **Padding:** `0`
- **Display:** `flex`
- **Flex Direction:** `column`
- **Cursor:** `move`
- **Class:** `group` (for child hover effects)
- **Z-Index:** 
  - `5` (normal)
  - `15` (when dragging)
- **Opacity:**
  - `1` (normal)
  - `0.7` (when dragging)
- **Transition:** `opacity 150ms`
- **User Select:** `none` (prevent text selection during drag)

### Hover State
- **Opacity:** `0.9` (90%)
- **Transition:** `opacity 150ms`

### Event Structure
```
┌────────────────────────────────┐ ← Top resize handle (6px)
│           (dots)               │
├────────────────────────────────┤
│ Event Title                    │ ← Content area (flex: 1)
│ 09:00 - 10:00                  │   (6px × 8px padding)
├────────────────────────────────┤
│           (dots)               │ ← Bottom resize handle (6px)
└────────────────────────────────┘
```

---

## 12. TOP RESIZE HANDLE

### Container
- **Element:** `<div>`
- **Class:** `resize-handle`
- **Height:** `6px`
- **Width:** `100%`
- **Cursor:** `ns-resize` (north-south)
- **Background:** `transparent` (default)
- **Hover Background:** `rgba(255, 255, 255, 0.25)` (25% white overlay)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`
- **Border Top Radius:** `4px`
- **Transition:** `background 150ms`

### Drag Handle Indicator (Dots)
- **Element:** `<div>`
- **Width:** `20px`
- **Height:** `2px`
- **Border Radius:** `2px` (rounded)
- **Background:** `rgba(255, 255, 255, 0.5)` (50% white)
- **Opacity:** `0` (default)
- **Group Hover Opacity:** `100%` (visible on event hover)
- **Transition:** `opacity 150ms`

### Interaction
- **onMouseDown:** Starts top resize (changes start time)
- **onMouseEnter:** Shows hover background
- **onMouseLeave:** Hides hover background

### Visual Appearance (on hover)
```
┌────────────────────────────────┐
│      ━━━━                      │ ← White dots (20px × 2px)
│  (25% white overlay)           │
```

---

## 13. EVENT CONTENT AREA

### Container
- **Element:** `<div>`
- **Flex:** `1` (takes remaining vertical space)
- **Padding:** `6px horizontal, 8px vertical` (6px 8px)
- **Display:** `flex`
- **Flex Direction:** `column`
- **Overflow:** `hidden`
- **Cursor:** `move`

### Mouse Interaction
- **onMouseDown:** Starts event drag (moves entire event)
- **stopPropagation:** Prevents conflicts with resize handles

### Event Title
- **Element:** `<div>`
- **Font Size:** `11px`
- **Font Weight:** `500` (font-medium)
- **Color:** `#FFFFFF` (white)
- **Line Height:** `tight` (1.25)
- **Overflow:** `hidden`
- **Text:** Event title (e.g., "Team standup", "Client call - BIOGEMSE")

### Event Time Range
- **Element:** `<div>`
- **Font Size:** `9px`
- **Color:** `#FFFFFF` (white)
- **Opacity:** `0.8` (80%)
- **Margin Top:** `2px` (mt-0.5)
- **Format:** `{start} - {end}` (e.g., "09:00 - 10:00", "10:30 - 11:00")

### Text Hierarchy
```
Client call - BIOGEMSE      ← 11px, medium, white
10:30 - 11:00                ← 9px, regular, 80% white
```

---

## 14. BOTTOM RESIZE HANDLE

### Container
- **Element:** `<div>`
- **Class:** `resize-handle`
- **Height:** `6px`
- **Width:** `100%`
- **Cursor:** `ns-resize` (north-south)
- **Background:** `transparent` (default)
- **Hover Background:** `rgba(255, 255, 255, 0.25)` (25% white overlay)
- **Display:** `flex`
- **Align Items:** `center`
- **Justify Content:** `center`
- **Border Bottom Radius:** `4px`
- **Transition:** `background 150ms`

### Drag Handle Indicator (Dots)
- **Element:** `<div>`
- **Width:** `20px`
- **Height:** `2px`
- **Border Radius:** `2px` (rounded)
- **Background:** `rgba(255, 255, 255, 0.5)` (50% white)
- **Opacity:** `0` (default)
- **Group Hover Opacity:** `100%` (visible on event hover)
- **Transition:** `opacity 150ms`

### Interaction
- **onMouseDown:** Starts bottom resize (changes duration)
- **onMouseEnter:** Shows hover background
- **onMouseLeave:** Hides hover background
- **Minimum Duration:** 15 minutes (0.25 hours)

### Visual Appearance (on hover)
```
│  (25% white overlay)           │
│      ━━━━                      │ ← White dots (20px × 2px)
└────────────────────────────────┘
```

---

## 15. INTERACTIVE BEHAVIORS

### 1. Drag Event (Move)
- **Trigger:** Mouse down on content area
- **State:** `draggingEvent` set to event ID
- **Visual:** Event opacity 70%, z-index 15
- **Behavior:** Event follows mouse position
- **Snap:** 15-minute increments
- **Bounds:** 0:00 - 23:45
- **Release:** Mouse up anywhere

### 2. Resize Event (Top)
- **Trigger:** Mouse down on top handle
- **State:** `resizingEvent` set to { id, edge: 'top' }
- **Behavior:** Changes start time (preserves end time)
- **Snap:** 15-minute increments
- **Minimum:** 15 minutes (0.25 hours)
- **Release:** Mouse up anywhere

### 3. Resize Event (Bottom)
- **Trigger:** Mouse down on bottom handle
- **State:** `resizingEvent` set to { id, edge: 'bottom' }
- **Behavior:** Changes duration (preserves start time)
- **Snap:** 15-minute increments
- **Minimum:** 15 minutes (0.25 hours)
- **Release:** Mouse up anywhere

### 4. Drop Task (Schedule)
- **Trigger:** Drag task from To-Do widget
- **Visual:** Blue drop indicator line + time label
- **Tooltip:** "Drop to schedule at {time}"
- **Snap:** 15-minute increments
- **Default Duration:** 30 minutes (0.5 hours)
- **Default Color:** #60A5FA (Blue 400)
- **Release:** Creates new event at drop position

### 5. Click Event (Open Detail)
- **Trigger:** Click event (not during drag)
- **Action:** Opens EventModal for editing
- **Modal Features:** Edit title, time, delete

### Time Snapping Formula
```javascript
const totalMinutes = (mouseY / 60) * 60;  // Convert pixels to minutes
const roundedMinutes = Math.round(totalMinutes / 15) * 15;  // Snap to 15min
const hours = Math.floor(roundedMinutes / 60);
const minutes = roundedMinutes % 60;
return hours + minutes / 60;  // Returns decimal hours (e.g., 10.5)
```

---

## 16. FOOTER SECTION

### Container
- **Element:** `<div>`
- **Padding:**
  - Horizontal: `12px` (px-3)
  - Vertical: `6px` (py-1.5)
- **Border Top:** `1px solid #E5E7EB` (Gray 200)
- **Min Height:** `30px`

### Full Calendar Link
- **Element:** `<button>`
- **Font Size:** `11px`
- **Color:** `#3B82F6` (Blue 500)
- **Hover Color:** `#2563EB` (Blue 600)
- **Transition:** `color 150ms`
- **Text:** "Full calendar →"
- **Background:** Transparent
- **Border:** None
- **Cursor:** `pointer`

---

## 17. COLOR PALETTE

### Primary Colors (Yellow/Amber Theme)
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Amber 400 | `#FBBF24` | Top gradient start, calendar icon |
| Amber 200 | `#FDE68A` | Top gradient end |

### Event Colors (Sample)
| Color Name | Hex Code | Event Type |
|------------|----------|------------|
| Purple 500 | `#8B5CF6` | Team standup |
| Green 500 | `#10B981` | Client call |
| Amber 500 | `#F59E0B` | Project review |
| Blue 400 | `#60A5FA` | Q4 goals, default new events |
| Blue 500 | `#3B82F6` | Design sync |

### Indicator Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Red 500 | `#EF4444` | Current time indicator |
| Blue 500 | `#3B82F6` | Drop indicator, tooltip, footer link |
| Blue 600 | `#2563EB` | Footer link hover |

### Text Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 800 | `#1F2937` | Header title |
| Gray 500 | `#6B7280` | Navigation icons |
| Gray 400 | `#9CA3AF` | Date subtitle, hour labels |
| White | `#FFFFFF` | Event text, tooltip text, time labels |

### Background Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| White | `#FFFFFF` | Widget background, time labels |
| Gray 50 | `#F9FAFB` | Button hover states |

### Border Colors
| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Gray 200 | `#E5E7EB` | Header/footer borders |
| Gray 100 | `#F3F4F6` | Hour grid lines |

### Overlay Colors
| Color Name | RGBA Value | Usage |
|------------|------------|-------|
| White 25% | `rgba(255, 255, 255, 0.25)` | Resize handle hover |
| White 50% | `rgba(255, 255, 255, 0.5)` | Drag dots |

---

## 18. TYPOGRAPHY SCALE

### Font Family
- **All Text:** `Inter` (via globals.css)
- **Fallback:** System UI fonts

### Size & Weight Breakdown
| Element | Size | Weight | Color | Opacity |
|---------|------|--------|-------|---------|
| Header Title | 14px | 500 (Medium) | #1F2937 | 100% |
| Date Subtitle | 10px | 400 (Regular) | #9CA3AF | 100% |
| Hour Labels | 10px | 500 (Medium) | #9CA3AF | 100% |
| Event Title | 11px | 500 (Medium) | #FFFFFF | 100% |
| Event Time | 9px | 400 (Regular) | #FFFFFF | 80% |
| Drop Time Label | 9px | 500 (Medium) | #3B82F6 | 100% |
| Drop Tooltip | 12px | 500 (Medium) | #FFFFFF | 100% |
| Footer Link | 11px | 400 (Regular) | #3B82F6 | 100% |

---

## 19. SPACING & LAYOUT

### Overall Widget Measurements
```
Container (340px × 100% height)
│
├─ Top Gradient: 4px
│
├─ Header: 36px min
│  ├─ Padding: 12px (h) × 8px (v)
│  ├─ Top row margin: 4px bottom
│  └─ Navigation gap: 4px
│
├─ Timeline: flex-1 (remaining space)
│  ├─ Padding: 8px (h) × 6px (v)
│  ├─ Overflow: auto (vertical scroll)
│  │
│  └─ Inner container: 1440px height
│     ├─ Hour rows: 60px each (24 hours)
│     │  ├─ Time label: 40px wide
│     │  └─ Border: 1px bottom
│     │
│     ├─ Current time indicator:
│     │  ├─ Dot: 6px circle
│     │  └─ Line: 2px height
│     │
│     ├─ Drop indicator:
│     │  ├─ Line: 2px height
│     │  └─ Label: 10px above
│     │
│     └─ Events:
│        ├─ Left: 40px + overlap%
│        ├─ Top: start × 60px
│        ├─ Height: duration × 60px
│        ├─ Min height: 30px
│        │
│        ├─ Top handle: 6px
│        ├─ Content: flex-1
│        │  └─ Padding: 6px (h) × 8px (v)
│        └─ Bottom handle: 6px
│
└─ Footer: 30px min
   └─ Padding: 12px (h) × 6px (v)
```

### Key Measurements
- **Time label width:** 40px
- **Pixels per hour:** 60px
- **Snap increment:** 15 minutes
- **Event min height:** 30px
- **Event min duration:** 15 minutes (0.25 hours)
- **Resize handle height:** 6px
- **Drag dots size:** 20px × 2px

---

## 20. ANIMATION & TRANSITIONS

### Defined Transitions
| Element | Property | Duration | Timing |
|---------|----------|----------|--------|
| Navigation Buttons | colors | 150ms | ease |
| Event Card | opacity | 150ms | ease |
| Resize Handle | background | 150ms | ease |
| Resize Handle Dots | opacity | 150ms | ease |
| Footer Link | color | 150ms | ease |

### State Transitions
- **Event Hover:** opacity 100% → 90% (150ms)
- **Event Dragging:** opacity 100% → 70% (150ms)
- **Resize Handle Hover:** background transparent → white 25% (150ms)
- **Drag Dots Hover:** opacity 0% → 100% (150ms)

### No Animation
- **Position changes:** Events snap instantly during resize/drag
- **Drop indicator:** Appears/disappears instantly
- **Current time line:** Static position

---

## 21. SCROLLBAR STYLING

### Custom Scrollbar (custom-scrollbar class)
Assuming standard Workdeck scrollbar styling:
- **Width:** ~6px
- **Track:** Transparent or very light gray
- **Thumb:** Light gray (#D1D5DB)
- **Thumb Hover:** Medium gray (#9CA3AF)
- **Border Radius:** Rounded
- **Overflow:** auto (vertical scroll)

### Scroll Behavior
- **Initial Scroll:** Programmatically scrolled to current time
- **User Scroll:** Free scroll through 24-hour timeline
- **Smooth Scroll:** Not enabled (instant scroll)

---

## 22. SHADOW SYSTEM

### Box Shadows Used
| Element | Shadow Name | Values |
|---------|-------------|--------|
| Widget Container | Elevated | `0 2px 8px rgba(0,0,0,0.1)` |
| Drop Tooltip | Large | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)` |

### Shadow Breakdown

**Widget Container:**
- X: 0px, Y: 2px, Blur: 8px
- Color: Black at 10% opacity

**Drop Tooltip:**
- Layer 1: X: 0, Y: 10px, Blur: 15px, Spread: -3px
- Layer 2: X: 0, Y: 4px, Blur: 6px, Spread: -2px
- Color: Black at 10% and 5% opacity

---

## 23. ICON SPECIFICATIONS

### Icons Used (from lucide-react)

| Icon | Location | Size | Color | Usage |
|------|----------|------|-------|-------|
| Calendar | Header | 16px | #FBBF24 | Widget identifier |
| ChevronLeft | Header nav | 16px | #6B7280 | Previous day |
| ChevronRight | Header nav | 16px | #6B7280 | Next day |

### Icon Properties
- **Stroke Width:** 2px (Lucide default)
- **Style:** Outline/stroke icons
- **Alignment:** Vertically centered with text
- **Flex Shrink:** 0 (prevents distortion)

---

## 24. BORDER SYSTEM

### Border Specifications
| Element | Width | Color | Radius |
|---------|-------|-------|--------|
| Widget | - | - | 6px |
| Header Bottom | 1px | #E5E7EB | - |
| Footer Top | 1px | #E5E7EB | - |
| Hour Grid Lines | 1px | #F3F4F6 | - |
| Event Cards | - | - | 4px |
| Navigation Buttons | - | - | 4px |
| Drop Time Label | - | - | 4px |
| Drop Tooltip | - | - | 4px |
| Resize Handle Top | - | - | 4px (top only) |
| Resize Handle Bottom | - | - | 4px (bottom only) |

---

## 25. Z-INDEX LAYERS

### Stacking Order
| Layer | Z-Index | Elements |
|-------|---------|----------|
| Base | 0 | Hour grid, labels |
| Events | 5 | Normal event cards |
| Current Time | 10 | Red time indicator |
| Drop Indicator | 15 | Blue drop line + label |
| Dragging Event | 15 | Event being dragged |
| Tooltip | 20 | Drop hint tooltip |

### Purpose
Ensures proper layering during complex interactions (drag, resize, drop).

---

## 26. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Proper heading (`<h3>`), buttons
- **Button Elements:** Proper `<button>` tags for navigation
- **Visual Indicators:** Current time line, drop indicator
- **Mouse Interactions:** Click, drag, resize all work

### Text Contrast Ratios
- **Gray 800 on White:** ~12:1 ✓ (AAA)
- **Gray 400 on White:** ~4.5:1 ✓ (AA)
- **White on Event Colors:** Varies by color
  - Purple 500: ~4.5:1 ✓
  - Green 500: ~2.8:1 ⚠️
  - Amber 500: ~2.5:1 ⚠️
  - Blue 400: ~3.2:1 ⚠️
- **White on Blue 500 (tooltip):** ~3.5:1 ⚠️ (AA Large)

### Potential Improvements
- Add ARIA labels for navigation buttons
- Add keyboard shortcuts for event manipulation
- Add focus visible states
- Add screen reader announcements for drag/drop
- Add aria-live regions for time updates
- Improve text contrast on event colors
- Add keyboard navigation for events

---

## 27. RESPONSIVE BEHAVIOR

### Fixed Dimensions
- **Width:** 340px (fixed from grid)
- **Height:** 100% of dashboard (spans 2 rows)
- **Grid Position:** Column 4, Rows 1-2

### Scrolling Behavior
- **Timeline:** Vertical scroll through 24 hours (1440px)
- **Auto-scroll:** Centers on current time (14:00) on mount
- **User Scroll:** Free scroll to any hour

### Event Handling
- **Overlapping Events:** Automatically calculates columns and widths
- **Dynamic Width:** Adjusts based on number of overlaps (50%, 33%, 25%...)
- **Minimum Size:** 30px height maintained even for short events

### Text Handling
- **Event Title:** Wraps if needed, overflow hidden
- **Event Time:** Single line, no wrapping
- **Hour Labels:** Fixed position, no overflow

---

## 28. FUNCTIONAL FEATURES

### 1. Time Grid Management
- **24-Hour Format:** 0:00 - 23:00
- **60px per Hour:** Consistent scaling
- **Grid Lines:** Visual separation every hour
- **Hour Labels:** Left-aligned, 40px wide

### 2. Current Time Display
- **Red Indicator:** Dot + line at current hour (14:00)
- **Auto-Position:** Calculated on render
- **Auto-Scroll:** Timeline scrolls to center current time on mount

### 3. Event Creation (Drop)
- **Source:** Dragged task from To-Do widget
- **Default Duration:** 30 minutes
- **Default Color:** Blue 400 (#60A5FA)
- **Snap:** 15-minute increments
- **Visual Feedback:** Blue line + tooltip

### 4. Event Editing
- **Move:** Drag content area to change start time
- **Resize Top:** Drag top handle to change start time (preserves end)
- **Resize Bottom:** Drag bottom handle to change duration
- **Minimum Duration:** 15 minutes
- **Snap:** 15-minute increments
- **Click:** Opens EventModal for title/time editing

### 5. Overlap Management
- **Automatic Detection:** Finds time-overlapping events
- **Column Assignment:** Assigns non-conflicting columns
- **Width Calculation:** Divides available space equally
- **Visual Layout:** Side-by-side arrangement

### 6. Date Navigation
- **Previous Day:** ChevronLeft button
- **Next Day:** ChevronRight button
- **Current Display:** "Today" + formatted date
- **Future Enhancement:** Actually change displayed date

---

## 29. DESIGN TOKENS SUMMARY

### Spacing Scale (Tailwind)
- **0.5:** 2px (time label top, red dot margin)
- **1:** 4px (navigation gap, border radius)
- **1.5:** 6px (header gap, timeline padding vertical, resize handles)
- **2:** 8px (timeline padding horizontal, event content padding)
- **3:** 12px (header/footer padding horizontal, tooltip padding)

### Radius Scale
- **4px:** Events, buttons, labels, tooltips
- **6px:** Widget container
- **full:** Current time dot, drag dots

### Font Size Scale
- **9px:** Event time, drop time label
- **10px:** Date subtitle, hour labels
- **11px:** Event title, footer link
- **12px:** Drop tooltip
- **14px:** Header title

### Font Weight Scale
- **400 (Regular):** Date subtitle, event time, footer link
- **500 (Medium):** Headers, labels, event title, tooltips

---

## SUMMARY

The Agenda Widget is a sophisticated calendar timeline interface featuring:

### Key Features
- **24-Hour Timeline:** Full day view (0:00-23:00) with 60px per hour
- **Current Time Indicator:** Red dot + line showing current time (14:00)
- **Drag & Drop Scheduling:** Accept tasks from To-Do widget
- **Event Manipulation:** Move (drag), resize top/bottom with handles
- **Overlap Management:** Automatically arranges overlapping events side-by-side
- **Visual Feedback:** Blue drop indicator line + tooltip
- **Auto-Scroll:** Centers on current time on load
- **Event Detail:** Click to open EventModal for editing
- **Time Snapping:** 15-minute increments for precision
- **Responsive Layout:** Calculates event widths for overlaps

### Visual Design
- **Yellow Theme:** #FBBF24 gradient accent for calendar context
- **Event Colors:** Purple, green, amber, blue for visual variety
- **Clean Timeline:** Gray grid lines, subtle hour labels
- **White Event Text:** High contrast on colored backgrounds
- **Resize Handles:** Subtle white dots appear on hover
- **Current Time:** Red indicator for immediate orientation

### Interaction Patterns
- **Drag Task → Schedule:** Drop indicator shows placement
- **Drag Event → Move:** 70% opacity during drag
- **Drag Handle → Resize:** Cursor changes to ns-resize
- **Click Event → Edit:** Opens modal for details
- **Hover Event → Handles:** Shows resize dots
- **Scroll Timeline → Navigate:** Free scroll through day

### Technical Sophistication
- **Overlap Algorithm:** Smart column assignment for concurrent events
- **Mouse Position Tracking:** Converts Y position to time
- **State Management:** Tracks dragging, resizing, drop state
- **Event Lifecycle:** Create, read, update, delete (CRUD)
- **Programmatic Scrolling:** Auto-centers on current time
- **Minimum Constraints:** 15min duration, 30px height

The widget successfully provides a powerful calendar interface in a compact 340px width, balancing information density with precise time management capabilities.
