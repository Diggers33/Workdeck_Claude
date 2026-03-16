/Context]
     ↓            ↓              ↓
"James Wilson" + "completed" + "Budget Review"
```

---

## 20. TIME FORMATTING

### Time Display Patterns
| Time Range | Format | Example |
|------------|--------|---------|
| < 1 hour | "Xm ago" | "45m ago" |
| 1-23 hours | "Xh ago" | "2h ago", "3h ago" |
| Yesterday | "Yesterday" | "Yesterday" |
| 2-6 days | "X days ago" | "2 days ago", "3 days ago" |
| 1 week+ | "X weeks ago" | "2 weeks ago" |
| 1 month+ | Date string | "Jan 15" or "Dec 2" |

### Sorting
- Most recent at top (2h ago)
- Oldest at bottom (3 days ago)
- Chronological descending order

---

## 21. COUNT BADGE DESIGN

### Visual Appearance
```
┌────┐
│ 12 │ ← Gray 400 background, white text, pill shape
└────┘
```

### Specifications
- **Shape:** Pill (rounded-full)
- **Background:** `#9CA3AF` (Gray 400)
- **Text Color:** `#FFFFFF` (white)
- **Font Size:** `10px`
- **Font Weight:** `500` (medium)
- **Padding:** `6px horizontal × 2px vertical`
- **Height:** Auto (typically ~14-16px)
- **Min Width:** Auto (expands with number)

### Number Formatting
- **1-9:** Single digit (e.g., "3")
- **10-99:** Two digits (e.g., "12", "42")
- **100-999:** Three digits (e.g., "156")
- **1000+:** Consider "999+" format

---

## 22. ACCESSIBILITY FEATURES

### Current Implementation
- **Semantic HTML:** Proper heading (`<h3>`), buttons
- **Button Elements:** Proper `<button>` tags for actions
- **Hover States:** Visual feedback on interaction
- **Color Differentiation:** Read/unread states

### Text Contrast Ratios
- **Gray 800 on White:** ~12:1 ✓ (AAA)
- **Gray 700 on White:** ~9:1 ✓ (AAA)
- **Gray 400 on White:** ~4.5:1 ✓ (AA)
- **White on Violet 400:** ~3.8:1 ⚠️ (AA Large)
- **White on Slate 500:** ~5.7:1 ✓ (AA)
- **White on Violet 500:** ~5.2:1 ✓ (AA)
- **White on Blue 500:** ~4.6:1 ✓ (AA)
- **White on Green 500:** ~3.2:1 ⚠️ (AA Large)
- **White on Pink 500:** ~4.8:1 ✓ (AA)
- **White on Gray 400 (badge):** ~3.1:1 ⚠️ (AA Large)

### Potential Improvements
- Add ARIA labels for buttons ("Clear all notifications", "View all notifications")
- Add `aria-live="polite"` region for new notifications
- Add keyboard navigation for notification items
- Add visual focus indicators
- Mark read/unread with aria-label ("Unread notification", "Read notification")
- Add role="listitem" to notification items
- Add role="list" to items container
- Improve badge contrast (use darker gray or blue)
- Add timestamp as time element with datetime attribute

---

## 23. RESPONSIVE BEHAVIOR

### Fixed Dimensions
- **Width:** 340px (fixed from grid)
- **Height:** 340px typical (can be 100% of grid cell)
- **Grid Position:** Single cell

### Scrolling Behavior
- **Notification List:** Vertical scroll when content overflows
- **User Scroll:** Free scroll through notifications
- **Scroll Indicator:** Custom scrollbar (hover-reveal)

### Text Handling
- **Primary Text:** Truncates with ellipsis (truncate class)
- **Timestamp:** Single line, no wrapping
- **Min Width:** 0 on content container enables truncation

### Item Height
- **Dynamic:** Based on content
- **Typical:** ~44-48px per notification item
- **Padding:** 6px maintains consistent spacing

---

## 24. FUNCTIONAL FEATURES

### 1. Notification Display
- **Sample Data:** 6 notifications shown
- **Real Implementation:** Would fetch from API
- **Sorting:** Chronological descending (newest first)
- **Filtering:** None (shows all)

### 2. Read/Unread States
- **Visual:** Opacity differentiation (100% vs 50%)
- **Text Style:** Bold vs regular for names
- **Marking:** Clicking item would mark as read
- **Persistence:** Would save to backend/localStorage

### 3. Clear All Action
- **Button:** "Clear all" in header
- **Behavior:** Would dismiss all notifications
- **Confirmation:** May show confirmation modal
- **Color:** Hover turns red (destructive action)

### 4. View All Navigation
- **Link:** "View all →" in footer
- **Destination:** Full notifications page
- **Badge:** Shows total count (12)
- **Count:** Includes notifications beyond visible list

### 5. Item Interaction
- **Click:** Navigate to related item/page
- **Hover:** Shows hover background
- **Context:** Each notification links to its source
  - "completed Budget Review" → Budget Review page
  - "mentioned you in Design Sprint" → Design Sprint page
  - etc.

---

## 25. DESIGN TOKENS SUMMARY

### Spacing Scale (Tailwind)
- **0.5:** 2px (items gap, badge padding vertical)
- **1:** 4px (border radius)
- **1.5:** 6px (header/footer padding vertical, item padding, badge padding horizontal)
- **2:** 8px (avatar to text gap)
- **3:** 12px (header/footer padding horizontal, content padding horizontal)
- **7:** 28px (avatar size)

### Radius Scale
- **4px:** Item hover background
- **6px:** Widget container
- **full:** Avatar circle, count badge pill

### Font Size Scale
- **10px:** Avatar initials, timestamp, count badge
- **11px:** Clear all button, footer link
- **12px:** Notification text
- **14px:** Header title

### Font Weight Scale
- **400 (Regular):** Default text, read notification names
- **500 (Medium):** Headers, unread notification names, avatar text, badge text

---

## 26. ICON SPECIFICATIONS

### Icons Used (from lucide-react)

| Icon | Location | Size | Color | Usage |
|------|----------|------|-------|-------|
| Bell | Header | 16px | #A78BFA (Violet 400) | Widget identifier |

### Icon Properties
- **Stroke Width:** 2px (Lucide default)
- **Style:** Outline/stroke icon
- **Alignment:** Vertically centered with title text
- **Flex Shrink:** 0 (prevents distortion)

### Bell Icon SVG (Angular 9)
```html
<svg xmlns="http://www.w3.org/2000/svg" 
     width="16" height="16" 
     viewBox="0 0 24 24" 
     fill="none" 
     stroke="#A78BFA" 
     stroke-width="2" 
     stroke-linecap="round" 
     stroke-linejoin="round">
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
</svg>
```

---

## 27. COMPARISON TO OTHER WIDGETS

### Similar Patterns
- **To-Do Widget:** Similar scrollable list, avatar-like priority icons
- **Pending Approvals:** Similar item cards, user identifiers
- **Red Zone:** Similar urgent items list

### Unique Features
- **Read/Unread Opacity:** Only widget using 50% opacity for state
- **Avatar Colors:** User-specific color coding
- **Clear All:** Destructive action in header (red hover)
- **Count Badge:** Pill badge in footer showing total
- **Purple Theme:** Unique gradient accent color

---

## 28. DATA STRUCTURE

### Notification Item Interface
```typescript
interface FYIItem {
  name: string;          // User name
  text: string;          // Action text
  time: string;          // Relative time
  avatar: string;        // Initials (2 chars)
  color: string;         // Avatar background color (hex)
  read: boolean;         // Read state
}
```

### Real Implementation Considerations
```typescript
interface FYINotification {
  id: string;                    // Unique identifier
  userId: string;                // User who performed action
  userName: string;              // Display name
  userAvatar?: string;           // Avatar URL or initials
  avatarColor: string;           // Background color
  actionType: NotificationType;  // Type of action
  actionText: string;            // Human-readable action
  targetId?: string;             // Related item ID
  targetName?: string;           // Related item name
  timestamp: Date;               // ISO timestamp
  read: boolean;                 // Read status
  dismissed: boolean;            // Dismissed status
  priority?: 'low' | 'normal' | 'high';
}

enum NotificationType {
  COMPLETION = 'completion',
  MENTION = 'mention',
  UPDATE = 'update',
  FILE_SHARE = 'file_share',
  COMMENT = 'comment',
  REQUEST = 'request',
  ASSIGNMENT = 'assignment'
}
```

---

## 29. USAGE PATTERNS

### When to Use FYI Widget
- Dashboard notification feed
- Activity stream for user
- Mention alerts
- Status update notifications
- Non-urgent informational updates
- Social-style activity feed

### When NOT to Use
- Urgent alerts (use Red Zone Widget)
- Actionable approvals (use Pending Approvals Widget)
- Task management (use To-Do Widget)
- System errors (use Alert components)
- Marketing/promotional content

---

## SUMMARY

The FYI Widget is a modern notification feed featuring:

### Key Features
- **Read/Unread States:** 50% opacity differentiation for read items
- **User Avatars:** Circular avatars with initials and color coding
- **Activity Feed:** Chronological notifications (newest first)
- **Clear All Action:** Destructive action (red hover) to dismiss all
- **Count Badge:** Gray pill badge showing total notifications
- **Hover Interactions:** Subtle background on item hover
- **Scrollable List:** Custom scrollbar for overflow content
- **View All Link:** Navigation to full notifications page

### Visual Design
- **Purple Theme:** #A78BFA → #C4B5FD gradient accent for notifications
- **Avatar Colors:** User-specific (Slate, Violet, Blue, Green, Pink)
- **Clean Typography:** 12px notification text, 10px timestamps
- **Truncation:** Long text truncates with ellipsis
- **Minimal Padding:** 6px items, 2px gaps for density

### Interaction Patterns
- **Click Item:** Navigate to related content
- **Hover Item:** Show gray background
- **Clear All:** Dismiss all notifications (confirmation?)
- **View All:** Navigate to full page
- **Mark Read:** Click item (implicit)

### Technical Sophistication
- **Opacity States:** Visual hierarchy through transparency
- **Font Weight Changes:** Bold/regular for read states
- **Color Coding:** User avatars with consistent colors
- **Time Formatting:** Relative time strings (2h ago, Yesterday)
- **Text Truncation:** Ellipsis for long content
- **Scrollable Container:** Fixed height with overflow

The widget successfully provides a social-media-style notification feed in a compact 340px widget, balancing information density with readability and clear visual hierarchy for read/unread states.
