# Workdeck Custom Scrollbar Design Specification

## Overview
Workdeck uses a custom-styled scrollbar with a **"minimal hover-reveal"** design pattern. The scrollbar is invisible by default and only appears when hovering over the scrollable container, creating a clean, uncluttered interface.

---

## Visual Behavior

### Default State (No Hover)
```
┌────────────────────────┐
│ Content                │
│ More content           │
│ Even more content      │
│ Keep scrolling...      │
│                        │ ← No visible scrollbar
│                        │
└────────────────────────┘
```

### Hover State (Container Hover)
```
┌────────────────────────┐
│ Content               ▌│ ← Gray scrollbar appears (40%)
│ More content          ▌│
│ Even more content     ▌│
│ Keep scrolling...     ▌│
│                       ▌│
│                       ▌│
└────────────────────────┘
```

### Scrollbar Thumb Hover
```
┌────────────────────────┐
│ Content               █│ ← Darker gray (70%)
│ More content          █│
│ Even more content     █│
│ Keep scrolling...     ▌│
│                       ▌│
│                       ▌│
└────────────────────────┘
```

---

## Implementation

### CSS Class
```css
.custom-scrollbar
```

### Applied to Widgets
All scrollable areas in dashboard widgets use this class:
- To-Do List Widget content area
- Agenda Widget timeline
- Pending Approvals Widget list
- FYI Widget notifications
- Who's Where Widget list
- Red Zone Widget list
- Any scrollable content

---

## Technical Specifications

### Chrome/Safari/Edge (WebKit)

#### Scrollbar Width
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
```
- **Width:** 8px
- **Purpose:** Thin scrollbar that doesn't take much space

#### Track (Background)
```css
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
```
- **Background:** Transparent
- **Purpose:** Invisible track/gutter

#### Thumb (Draggable Part) - Default
```css
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 4px;
}
```
- **Background:** Transparent (invisible)
- **Border Radius:** 4px (rounded)
- **Purpose:** Hidden until hover

#### Thumb - Container Hover
```css
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
}
```
- **Background:** `rgba(156, 163, 175, 0.4)`
  - Color: Gray 400 (#9CA3AF)
  - Opacity: 40%
- **Purpose:** Subtle appearance on container hover

#### Thumb - Direct Hover
```css
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
```
- **Background:** `rgba(156, 163, 175, 0.7)`
  - Color: Gray 400 (#9CA3AF)
  - Opacity: 70%
- **Purpose:** Darker when hovering scrollbar itself

---

### Firefox

#### Width Style
```css
.custom-scrollbar {
  scrollbar-width: thin;
}
```
- **Width:** `thin` (Firefox's thin preset)
- **Purpose:** Narrow scrollbar

#### Colors - Default
```css
.custom-scrollbar {
  scrollbar-color: transparent transparent;
}
```
- **Format:** `scrollbar-color: [thumb] [track]`
- **Thumb:** Transparent
- **Track:** Transparent
- **Purpose:** Invisible by default

#### Colors - Container Hover
```css
.custom-scrollbar:hover {
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}
```
- **Thumb:** `rgba(156, 163, 175, 0.4)` (Gray 400 at 40%)
- **Track:** Transparent
- **Purpose:** Appears on hover

---

## Color Breakdown

### Gray 400 (#9CA3AF)
- **RGB:** 156, 163, 175
- **HSL:** 214°, 11%, 65%
- **Usage:** Base color for scrollbar thumb

### Opacity Levels
| State | Opacity | RGBA | Visual Effect |
|-------|---------|------|---------------|
| Default | 0% | `transparent` | Invisible |
| Container Hover | 40% | `rgba(156, 163, 175, 0.4)` | Subtle gray |
| Thumb Hover | 70% | `rgba(156, 163, 175, 0.7)` | Darker gray |

---

## State Transitions

### Interaction Flow
```
1. Default State
   └─> Scrollbar: Invisible
   
2. User hovers over content area
   └─> Scrollbar thumb: Appears at 40% opacity
   
3. User hovers directly on scrollbar thumb
   └─> Scrollbar thumb: Darkens to 70% opacity
   
4. User leaves content area
   └─> Scrollbar: Fades back to invisible
```

### Transition Behavior
- **No CSS transitions defined**
- **Browser default behavior:** Instant opacity change
- **Could add:** `transition: background 150ms ease;` for smooth fade

---

## Browser Compatibility

### Supported Browsers
| Browser | Selector | Support |
|---------|----------|---------|
| Chrome | `::-webkit-scrollbar` | ✅ Full |
| Safari | `::-webkit-scrollbar` | ✅ Full |
| Edge | `::-webkit-scrollbar` | ✅ Full |
| Firefox | `scrollbar-width`, `scrollbar-color` | ✅ Full |
| Opera | `::-webkit-scrollbar` | ✅ Full |

### Fallback Behavior
- **Unsupported browsers:** Use default OS scrollbar
- **No degradation:** Content remains fully scrollable

---

## Design Philosophy

### Why Invisible by Default?
1. **Clean UI:** Reduces visual clutter
2. **Focus on Content:** Scrollbar doesn't distract
3. **Modern Aesthetic:** Matches macOS/iOS design patterns
4. **Progressive Disclosure:** Appears when needed

### Why Hover-Reveal?
1. **Discoverability:** Users learn content is scrollable
2. **Accessibility:** Scrollbar available when needed
3. **Visual Hierarchy:** Doesn't compete with content
4. **Space Efficiency:** 8px doesn't waste space when not in use

---

## Usage Examples

### To-Do List Widget
```tsx
<div className="px-4 py-3 custom-scrollbar space-y-4" 
     style={{ flex: 1, overflowY: 'auto' }}>
  {/* Task groups */}
</div>
```

### Agenda Widget Timeline
```tsx
<div 
  ref={timelineRef}
  className="px-2 py-1.5 custom-scrollbar" 
  style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
  {/* Timeline and events */}
</div>
```

### Pending Approvals Widget
```tsx
<div className="px-3 py-1.5 custom-scrollbar" 
     style={{ flex: 1, overflowY: 'auto' }}>
  <div className="space-y-1.5">
    {/* Approval cards */}
  </div>
</div>
```

---

## Measurements

### Dimensions
- **Width:** 8px
- **Height:** Proportional to content (automatic)
- **Border Radius:** 4px (rounded ends)
- **Track:** Invisible (0px effective width)

### Spacing
- **Position:** Right edge of scrollable container
- **Overlap:** Does not push content (overlays)
- **Padding:** No additional padding

---

## Accessibility Considerations

### Current Implementation
✅ **Keyboard scrolling works:** Arrow keys, Page Up/Down
✅ **Screen readers work:** Content remains accessible
✅ **Touch scrolling works:** Mobile devices use native scrolling
✅ **Visible on hover:** Provides visual feedback

### Potential Concerns
⚠️ **Low contrast:** 40% gray may be hard to see on light backgrounds
⚠️ **Discovery:** Users might not know content scrolls without hover
⚠️ **Motor control:** Small 8px target for mouse users

### Improvements
- Add `focus-within` state to show scrollbar when focused
- Increase contrast to 60% for better visibility
- Add scroll indicators at top/bottom of content
- Consider always-visible option for accessibility mode

---

## Customization Options

### Increase Visibility
```css
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.6); /* 40% → 60% */
}
```

### Always Visible
```css
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3); /* Always 30% */
}
```

### Wider Scrollbar
```css
.custom-scrollbar::-webkit-scrollbar {
  width: 12px; /* 8px → 12px */
}
```

### Colored Scrollbar (Brand)
```css
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(96, 165, 250, 0.4); /* Blue 400 */
}
```

### Smooth Transitions
```css
.custom-scrollbar::-webkit-scrollbar-thumb {
  transition: background 200ms ease;
}
```

---

## Comparison to Other Patterns

### macOS Style (Native)
- ✅ Similar hover-reveal behavior
- ✅ Overlay scrollbar (doesn't push content)
- ❌ Workdeck: Gray vs. macOS dark gray
- ❌ Workdeck: 8px vs. macOS ~11px

### Windows Style (Native)
- ❌ Windows: Always visible
- ❌ Windows: Buttons at top/bottom
- ✅ Workdeck: Cleaner, minimal design
- ✅ Workdeck: Doesn't take layout space

### iOS/Mobile (Native)
- ✅ Similar invisible-by-default
- ✅ Appears during scroll
- ❌ iOS: Auto-hides after scroll stops
- ❌ Workdeck: Stays while hovering

---

## Design Tokens

### Color Tokens
```css
--scrollbar-color: #9CA3AF;           /* Gray 400 */
--scrollbar-opacity-default: 0;        /* Invisible */
--scrollbar-opacity-hover: 0.4;        /* 40% */
--scrollbar-opacity-active: 0.7;       /* 70% */
```

### Size Tokens
```css
--scrollbar-width: 8px;
--scrollbar-radius: 4px;
```

### Usage in Design System
```css
.custom-scrollbar::-webkit-scrollbar {
  width: var(--scrollbar-width);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-radius);
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: rgba(var(--scrollbar-color), var(--scrollbar-opacity-hover));
}
```

---

## Testing Checklist

### Visual Testing
- [ ] Scrollbar invisible by default
- [ ] Scrollbar appears on container hover (40%)
- [ ] Scrollbar darkens on direct hover (70%)
- [ ] Scrollbar disappears when hover leaves
- [ ] Border radius applied (4px rounded)
- [ ] Width is 8px
- [ ] Track is transparent

### Functional Testing
- [ ] Mouse wheel scrolling works
- [ ] Dragging scrollbar thumb works
- [ ] Clicking scrollbar track works
- [ ] Keyboard scrolling works (arrows, page up/down)
- [ ] Touch scrolling works (mobile/tablet)
- [ ] Content doesn't shift when scrollbar appears

### Cross-Browser Testing
- [ ] Chrome: WebKit styles apply
- [ ] Safari: WebKit styles apply
- [ ] Firefox: scrollbar-color applies
- [ ] Edge: WebKit styles apply
- [ ] Mobile browsers: Native scrolling works

---

## Summary

Workdeck uses a **minimal hover-reveal scrollbar** with these characteristics:

### Key Properties
- **Width:** 8px (thin)
- **Color:** Gray 400 (#9CA3AF)
- **Default:** Invisible (0% opacity)
- **Container Hover:** Visible (40% opacity)
- **Direct Hover:** Darker (70% opacity)
- **Border Radius:** 4px (rounded)
- **Track:** Transparent
- **Browser Support:** Chrome, Safari, Edge (WebKit) + Firefox

### Design Benefits
- ✅ Clean, uncluttered interface
- ✅ Focus remains on content
- ✅ Modern, minimal aesthetic
- ✅ Space-efficient (8px overlay)
- ✅ Progressive disclosure (appears when needed)
- ✅ Consistent across widgets

### Implementation
- CSS class: `.custom-scrollbar`
- Applied to all scrollable widget areas
- Works with `overflow-y: auto`
- No JavaScript required
- Cross-browser compatible

The scrollbar design perfectly complements Workdeck's clean, modern interface while maintaining excellent usability.
