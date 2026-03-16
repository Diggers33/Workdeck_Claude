# Task Detail Modal - Complete Style Specification

Complete styling documentation for the Task Detail Modal component in Workdeck, organized by tab sections.

---

## **SHARED ELEMENTS (All Tabs)**

### **Modal Container**

```css
Width: 680px
Max Height: 90vh
Background: #FFFFFF (white)
Border Radius: 12px
Box Shadow: 0 8px 32px rgba(0, 0, 0, 0.16)
Position: Fixed, centered
Overflow: hidden
Display: flex
Flex Direction: column
Z-Index: 1000
```

---

### **HEADER SECTION**

#### **Container**
```css
Padding: 20px 24px
Border Bottom: 1px solid #E5E7EB
Display: flex
Align Items: start
Justify Content: space-between
Gap: 16px
Background: #FAFAFA (very light gray)
```

#### **Left Side (Title Area)**

**Task ID Text:**
```css
Font Size: 13px
Font Weight: 400 (regular)
Color: #6B7280 (Gray 500)
Margin Bottom: 6px
Format: "Task • a1764760776654"
```

**Task Title:**
```css
Font Size: 24px
Font Weight: 700 (bold)
Color: #0A0A0A (near black)
Line Height: 1.2
Letter Spacing: -0.02em (tight)
Max Width: 480px
Word Break: break-word
```

#### **Right Side (Action Buttons)**

**Container:**
```css
Display: flex
Gap: 12px
Align Items: center
Flex Shrink: 0
```

**Close Button (X):**
```css
Width: 40px
Height: 40px
Background: transparent
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Display: flex
Align Items: center
Justify Content: center
Cursor: pointer
Transition: all 150ms ease

Hover:
  Background: #F3F4F6 (Gray 100)
  Border Color: #D1D5DB (Gray 300)

Icon (X):
  Size: 18px × 18px
  Color: #6B7280 (Gray 500)
  Stroke Width: 2px
```

**Save Button:**
```css
Width: 100px
Height: 40px
Background: #60A5FA (Blue 400)
Color: #FFFFFF (white)
Font Size: 14px
Font Weight: 600 (semibold)
Border: none
Border Radius: 8px
Cursor: pointer
Transition: all 150ms ease

Hover:
  Background: #3B82F6 (Blue 500)
  Transform: translateY(-1px)
  Box Shadow: 0 4px 12px rgba(96, 165, 250, 0.4)

Active:
  Transform: translateY(0)
```

---

### **TAB NAVIGATION**

#### **Container**
```css
Display: flex
Border Bottom: 1px solid #E5E7EB
Background: white
Padding: 0 24px
Gap: 0
```

#### **Tab Button (Inactive)**
```css
Height: 48px
Padding: 0 16px
Background: transparent
Border: none
Border Bottom: 3px solid transparent
Display: flex
Align Items: center
Gap: 8px
Font Size: 14px
Font Weight: 500 (medium)
Color: #6B7280 (Gray 500)
Cursor: pointer
Transition: all 150ms ease
Position: relative

Hover:
  Color: #374151 (Gray 700)
  Background: #F9FAFB (Gray 50)
```

#### **Tab Button (Active)**
```css
Height: 48px
Padding: 0 16px
Background: transparent
Border: none
Border Bottom: 3px solid #3B82F6 (Blue 500)
Display: flex
Align Items: center
Gap: 8px
Font Size: 14px
Font Weight: 600 (semibold)
Color: #0A0A0A (near black)
```

#### **Tab Icons**
```css
Size: 16px × 16px
Color: inherit (matches text color)
Stroke Width: 2px
```

**Icon Mapping:**
- **Details:** `<List>` or `<FileText>` icon
- **Participants:** `<Users>` icon (Badge: 8)
- **Comments:** `<MessageSquare>` icon (Badge: 3)
- **Files:** `<Paperclip>` icon (Badge: 5)
- **Flags:** `<Flag>` icon

#### **Tab Badge (Count)**
```css
Min Width: 20px
Height: 20px
Padding: 0 6px
Background: #60A5FA (Blue 400)
Color: white
Font Size: 11px
Font Weight: 600 (semibold)
Border Radius: 10px (pill shape)
Display: flex
Align Items: center
Justify Content: center
```

---

### **Content Area (All Tabs)**

```css
Padding: 24px
Overflow Y: auto
Flex: 1
Max Height: calc(90vh - 220px)
Background: white
```

**Scrollbar Styling:**
```css
/* Webkit browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #F3F4F6 (Gray 100);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #D1D5DB (Gray 300);
  border-radius: 4px;
  
  &:hover {
    background: #9CA3AF (Gray 400);
  }
}
```

---

## **TAB 1: DETAILS**

### **Form Field Patterns**

#### **Label (All Caps)**
```css
Font Size: 11px
Font Weight: 600 (semibold)
Color: #6B7280 (Gray 500)
Text Transform: uppercase
Letter Spacing: 0.5px
Margin Bottom: 8px
Display: block
```

#### **Dropdown Field**
```css
Width: 100%
Height: 40px
Padding: 0 12px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 6px
Font Size: 14px
Color: #9CA3AF (Gray 400) /* placeholder */
Color: #0A0A0A (near black) /* selected value */
Cursor: pointer
Display: flex
Align Items: center
Justify Content: space-between
Transition: all 150ms ease

Hover:
  Border Color: #D1D5DB (Gray 300)
  Background: #F9FAFB (Gray 50)

Focus:
  Border Color: #60A5FA (Blue 400)
  Outline: none
  Box Shadow: 0 0 0 3px rgba(96, 165, 250, 0.1)

Chevron Icon:
  Size: 16px × 16px
  Color: #9CA3AF (Gray 400)
  Position: absolute right 12px
```

---

### **FIELD 1: PROJECT**
```css
Label: "PROJECT"
Field Type: Dropdown
Width: 100%
Placeholder: "Select project..."
Margin Bottom: 20px
```

---

### **FIELD 2: ACTIVITY**
```css
Label: "ACTIVITY"
Field Type: Dropdown
Width: 100%
Placeholder: "Select activity..."
Margin Bottom: 20px
```

---

### **FIELD 3-5: FROM / TO / TASK HOURS (Grid Row)**

#### **Row Container**
```css
Display: grid
Grid Template Columns: 1fr 1fr 1fr
Gap: 16px
Margin Bottom: 20px
```

#### **FROM Field**
```css
Label: "FROM"
Field Type: Date picker
Width: 100%
Height: 40px
Placeholder: "Select date"
Icon: Calendar (16px, Gray 400, left side, 12px from edge)
Padding Left: 36px (to accommodate icon)
```

#### **TO Field**
```css
Label: "TO"
Field Type: Date picker
Width: 100%
Height: 40px
Placeholder: "Select date"
Icon: Calendar (16px, Gray 400, left side, 12px from edge)
Padding Left: 36px
```

#### **TASK HOURS Field**
```css
Label: "TASK HOURS"
Field Type: Number input
Width: 100%
Height: 40px
Padding: 0 12px
Text Align: left
Placeholder/Value: "0"
Suffix: "hours" (gray text, 13px, right side)
Type: number
Min: 0
```

---

### **FIELD 6: PROGRESS**

#### **Container**
```css
Margin Bottom: 20px
```

#### **Label Row**
```css
Display: flex
Justify Content: space-between
Align Items: center
Margin Bottom: 8px
```

**Label:**
```css
"PROGRESS" (uppercase, 11px, Gray 500)
```

**Percentage Display:**
```css
Font Size: 20px
Font Weight: 700 (bold)
Color: #60A5FA (Blue 400)
```

#### **Slider Track**
```css
Width: 100%
Height: 6px
Background: #E5E7EB (Gray 200)
Border Radius: 3px
Position: relative
Cursor: pointer
```

#### **Slider Fill**
```css
Height: 6px
Width: 0% (dynamic based on value)
Background: #60A5FA (Blue 400)
Border Radius: 3px
Position: absolute
Left: 0
Top: 0
Transition: width 200ms ease
```

#### **Slider Thumb**
```css
Width: 16px
Height: 16px
Background: #60A5FA (Blue 400)
Border: 3px solid white
Border Radius: 50%
Box Shadow: 0 2px 6px rgba(0, 0, 0, 0.2)
Position: absolute
Top: -5px (centered on track)
Transform: translateX(-50%)
Cursor: grab
Transition: transform 150ms ease

Hover/Active:
  Transform: translateX(-50%) scale(1.1)
```

---

### **FIELD 7: IMPORTANCE**

#### **Container**
```css
Margin Bottom: 20px
```

#### **Label**
```css
"IMPORTANCE" (uppercase, 11px, Gray 500)
Margin Bottom: 12px
```

#### **Slider Track (Gradient)**
```css
Width: 100%
Height: 8px
Background: linear-gradient(90deg, 
  #34D399 0%,     /* Green (Low) */
  #FBBF24 50%,    /* Yellow (Medium) */
  #EF4444 100%    /* Red (High) */
)
Border Radius: 4px
Position: relative
Cursor: pointer
```

#### **Slider Thumb**
```css
Width: 20px
Height: 20px
Background: white
Border: 3px solid #FB923D (Orange 400)
Border Radius: 50%
Box Shadow: 0 2px 8px rgba(0, 0, 0, 0.2)
Position: absolute
Top: -6px (centered on track)
Transform: translateX(-50%)
Cursor: grab

Hover/Active:
  Transform: translateX(-50%) scale(1.15)
  Box Shadow: 0 4px 12px rgba(0, 0, 0, 0.25)
```

#### **Labels (Low/Medium/High)**
```css
Display: flex
Justify Content: space-between
Margin Top: 8px
Font Size: 12px
Font Weight: 500 (medium)

"Low":
  Color: #34D399 (Green 400)
  
"Medium":
  Color: #FB923D (Orange 400)
  Font Weight: 600 (semibold)
  
"High":
  Color: #EF4444 (Red 400)
```

---

### **FIELD 8-9: ALERT STATUS / OPTIONS (Grid Row)**

#### **Row Container**
```css
Display: grid
Grid Template Columns: 1fr 1fr
Gap: 16px
Margin Bottom: 20px
```

#### **ALERT STATUS**
```css
Label: "ALERT STATUS"
Field Type: Dropdown with color dot
Width: 100%
Height: 40px

Color Dot:
  Width: 10px
  Height: 10px
  Border Radius: 50%
  Background: #34D399 (Green 400) /* or other status color */
  Margin Right: 8px
  
Placeholder: "Select..."
```

#### **OPTIONS**
```css
Label: "OPTIONS"
Display: flex
Gap: 16px
Align Items: center
```

**Checkbox (Billable / Time):**
```css
Width: 18px
Height: 18px
Border: 2px solid #D1D5DB (Gray 300)
Border Radius: 4px
Background: white
Cursor: pointer
Accent Color: #60A5FA (Blue 400)
Transition: all 150ms ease

Checked:
  Background: #60A5FA (Blue 400)
  Border Color: #60A5FA
  
Label:
  Font Size: 14px
  Font Weight: 400 (regular)
  Color: #374151 (Gray 700)
  Margin Left: 6px
  Cursor: pointer
```

---

### **FIELD 10: ASSIGNED TO**

#### **Container**
```css
Margin Bottom: 20px
```

#### **Label**
```css
"ASSIGNED TO" (uppercase, 11px, Gray 500)
Margin Bottom: 8px
```

#### **Assigned Person Card**
```css
Width: 100%
Height: 64px
Padding: 12px 16px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Display: flex
Align Items: center
Justify Content: space-between
Transition: all 150ms ease

Hover:
  Border Color: #D1D5DB (Gray 300)
  Background: #F9FAFB (Gray 50)
```

#### **Left Side (Avatar + Info)**
```css
Display: flex
Align Items: center
Gap: 12px
```

**Avatar:**
```css
Width: 40px
Height: 40px
Border Radius: 50%
Background: #60A5FA (Blue 400)
Color: white
Font Size: 16px
Font Weight: 600 (semibold)
Display: flex
Align Items: center
Justify Content: center
Text Transform: uppercase
Flex Shrink: 0
```

**Name + Role Container:**
```css
Display: flex
Flex Direction: column
Gap: 2px
```

**Name:**
```css
Font Size: 14px
Font Weight: 600 (semibold)
Color: #0A0A0A (near black)
Line Height: 1.2
```

**Role ("Owner"):**
```css
Font Size: 12px
Font Weight: 400 (regular)
Color: #6B7280 (Gray 500)
```

#### **Change Button**
```css
Height: 32px
Padding: 0 16px
Background: white
Border: 1px solid #60A5FA (Blue 400)
Color: #60A5FA (Blue 400)
Font Size: 13px
Font Weight: 600 (semibold)
Border Radius: 6px
Cursor: pointer
Transition: all 150ms ease
Flex Shrink: 0

Hover:
  Background: #EFF6FF (Blue 50)
  Border Color: #3B82F6 (Blue 500)
  Color: #3B82F6
  Transform: translateY(-1px)
```

---

### **FIELD 11-12: LABELS / SKILLS (Grid Row)**

#### **Row Container**
```css
Display: grid
Grid Template Columns: 1fr 1fr
Gap: 16px
Margin Bottom: 20px
```

#### **LABELS**
```css
Label: "LABELS"
Field Type: Multi-select dropdown
Placeholder: "Select..."
```

#### **SKILLS**
```css
Label: "SKILLS"
Field Type: Multi-select dropdown
Placeholder: "Select..."
```

---

### **FIELD 13-14: EXPERTISE / ESTIMATION (Grid Row)**

#### **Row Container**
```css
Display: grid
Grid Template Columns: 1fr 1fr
Gap: 16px
Margin Bottom: 20px
```

#### **EXPERTISE**
```css
Label: "EXPERTISE"
Field Type: Dropdown
Placeholder: "Select..."
```

#### **ESTIMATION**
```css
Label: "ESTIMATION"
Field Type: Dropdown
Placeholder: "Select..."
```

---

### **FIELD 15: TAGS**

#### **Container**
```css
Margin Bottom: 24px
```

#### **Header Row**
```css
Display: flex
Align Items: center
Justify Content: space-between
Margin Bottom: 8px
```

#### **Label**
```css
Display: flex
Align Items: center
Gap: 8px

Icon (Tag):
  Size: 14px × 14px
  Color: #60A5FA (Blue 400)
  
Text:
  Font Size: 11px
  Font Weight: 600 (semibold)
  Color: #6B7280 (Gray 500)
  Text Transform: uppercase
  Letter Spacing: 0.5px
```

#### **Add Tag Link**
```css
Font Size: 13px
Font Weight: 500 (medium)
Color: #60A5FA (Blue 400)
Cursor: pointer
Transition: color 150ms ease

Hover:
  Color: #3B82F6 (Blue 500)
  Text Decoration: underline
```

#### **Empty State**
```css
Font Size: 13px
Color: #9CA3AF (Gray 400)
Font Style: italic
Content: "No tags added yet"
```

---

### **CHECKLIST SECTION**

#### **Add Checklist Item Input**

**Container:**
```css
Display: flex
Gap: 8px
Align Items: center
Padding: 12px 16px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Transition: all 150ms ease
Margin Bottom: 16px

Focus-within:
  Border Color: #60A5FA (Blue 400)
  Box Shadow: 0 0 0 3px rgba(96, 165, 250, 0.1)
```

**Checkbox Icon:**
```css
Component: <CheckSquare>
Size: 18px × 18px
Color: #60A5FA (Blue 400)
Flex Shrink: 0
```

**Input Field:**
```css
Flex: 1
Border: none
Outline: none
Font Size: 14px
Color: #0A0A0A (near black)
Background: transparent
Placeholder: "Add checklist item..."
Placeholder Color: #9CA3AF (Gray 400)
```

**Add Button:**
```css
Width: 60px
Height: 32px
Background: #60A5FA (Blue 400)
Color: white
Font Size: 13px
Font Weight: 600 (semibold)
Border: none
Border Radius: 6px
Cursor: pointer
Transition: all 150ms ease
Flex Shrink: 0

Hover:
  Background: #3B82F6 (Blue 500)
  
Disabled:
  Background: #E5E7EB (Gray 200)
  Color: #9CA3AF (Gray 400)
  Cursor: not-allowed
```

---

## **TAB 2: PARTICIPANTS**

### **Badge Count: 8**

### **Container**
```css
Padding: 24px
Display: flex
Flex Direction: column
Gap: 20px
```

### **Section Header**
```css
Font Size: 11px
Font Weight: 600 (semibold)
Color: #6B7280 (Gray 500)
Text Transform: uppercase
Letter Spacing: 0.5px
Margin Bottom: 12px
```

### **Participant List**

#### **Participant Card**
```css
Width: 100%
Padding: 12px 16px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Display: flex
Align Items: center
Justify Content: space-between
Gap: 12px
Margin Bottom: 8px
Transition: all 150ms ease

Hover:
  Border Color: #D1D5DB (Gray 300)
  Background: #F9FAFB (Gray 50)
```

#### **Left Side (Avatar + Info)**
```css
Display: flex
Align Items: center
Gap: 12px
Flex: 1
```

**Avatar:**
```css
Width: 40px
Height: 40px
Border Radius: 50%
Background: #60A5FA (Blue 400) /* varies by user */
Color: white
Font Size: 16px
Font Weight: 600 (semibold)
Display: flex
Align Items: center
Justify Content: center
Text Transform: uppercase
Flex Shrink: 0
```

**Info Container:**
```css
Display: flex
Flex Direction: column
Gap: 2px
```

**Name:**
```css
Font Size: 14px
Font Weight: 600 (semibold)
Color: #0A0A0A (near black)
Line Height: 1.2
```

**Role/Title:**
```css
Font Size: 12px
Font Weight: 400 (regular)
Color: #6B7280 (Gray 500)
```

#### **Right Side (Role Badge)**

**Role Badge (Owner/Member/Viewer):**
```css
Padding: 4px 12px
Background: #EFF6FF (Blue 50) /* Owner */
Background: #F3F4F6 (Gray 100) /* Member */
Background: #FEF3C7 (Yellow 50) /* Viewer */
Color: #3B82F6 (Blue 600) /* Owner */
Color: #374151 (Gray 700) /* Member */
Color: #D97706 (Yellow 600) /* Viewer */
Font Size: 12px
Font Weight: 500 (medium)
Border Radius: 6px
Text Transform: capitalize
```

### **Add Participant Button**
```css
Width: 100%
Height: 40px
Background: white
Border: 1px dashed #D1D5DB (Gray 300)
Color: #60A5FA (Blue 400)
Font Size: 14px
Font Weight: 500 (medium)
Border Radius: 6px
Display: flex
Align Items: center
Justify Content: center
Gap: 8px
Cursor: pointer
Transition: all 150ms ease

Hover:
  Border Color: #60A5FA (Blue 400)
  Background: #EFF6FF (Blue 50)

Icon (+):
  Size: 16px × 16px
  Stroke Width: 2px
```

---

## **TAB 3: COMMENTS**

### **Badge Count: 3**

### **Container**
```css
Padding: 24px
Display: flex
Flex Direction: column
Gap: 20px
```

### **Comment Input (Top)**

#### **Container**
```css
Display: flex
Gap: 12px
Padding: 16px
Background: #F9FAFB (Gray 50)
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Margin Bottom: 24px
```

**Avatar:**
```css
Width: 36px
Height: 36px
Border Radius: 50%
Background: #60A5FA (Blue 400)
Color: white
Font Size: 14px
Font Weight: 600 (semibold)
Display: flex
Align Items: center
Justify Content: center
Text Transform: uppercase
Flex Shrink: 0
```

**Input Area:**
```css
Flex: 1
Display: flex
Flex Direction: column
Gap: 8px
```

**Textarea:**
```css
Width: 100%
Min Height: 80px
Padding: 12px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 6px
Font Size: 14px
Color: #0A0A0A (near black)
Resize: vertical
Font Family: inherit
Transition: all 150ms ease

Focus:
  Border Color: #60A5FA (Blue 400)
  Outline: none
  Box Shadow: 0 0 0 3px rgba(96, 165, 250, 0.1)

Placeholder:
  Color: #9CA3AF (Gray 400)
  Content: "Write a comment..."
```

**Button Row:**
```css
Display: flex
Justify Content: space-between
Align Items: center
```

**Formatting Buttons:**
```css
Display: flex
Gap: 4px
```

**Format Button (Bold/Italic/Link):**
```css
Width: 32px
Height: 32px
Background: transparent
Border: none
Border Radius: 4px
Color: #6B7280 (Gray 500)
Cursor: pointer
Display: flex
Align Items: center
Justify Content: center
Transition: all 150ms ease

Hover:
  Background: #E5E7EB (Gray 200)
  Color: #374151 (Gray 700)

Icon:
  Size: 16px × 16px
  Stroke Width: 2px
```

**Post Button:**
```css
Height: 32px
Padding: 0 16px
Background: #60A5FA (Blue 400)
Color: white
Font Size: 13px
Font Weight: 600 (semibold)
Border: none
Border Radius: 6px
Cursor: pointer
Transition: all 150ms ease

Hover:
  Background: #3B82F6 (Blue 500)

Disabled:
  Background: #E5E7EB (Gray 200)
  Color: #9CA3AF (Gray 400)
  Cursor: not-allowed
```

---

### **Comment List**

#### **Comment Card**
```css
Display: flex
Gap: 12px
Padding: 16px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Margin Bottom: 12px
Transition: all 150ms ease

Hover:
  Border Color: #D1D5DB (Gray 300)
  Background: #FAFAFA
```

**Avatar:**
```css
Width: 36px
Height: 36px
Border Radius: 50%
Background: varies by user
Color: white
Font Size: 14px
Font Weight: 600 (semibold)
Display: flex
Align Items: center
Justify Content: center
Text Transform: uppercase
Flex Shrink: 0
```

**Content Area:**
```css
Flex: 1
Display: flex
Flex Direction: column
Gap: 8px
```

**Header Row:**
```css
Display: flex
Justify Content: space-between
Align Items: center
```

**Author Name:**
```css
Font Size: 14px
Font Weight: 600 (semibold)
Color: #0A0A0A (near black)
```

**Timestamp:**
```css
Font Size: 12px
Font Weight: 400 (regular)
Color: #9CA3AF (Gray 400)
Format: "2 hours ago" / "Yesterday" / "Dec 1"
```

**Comment Text:**
```css
Font Size: 14px
Font Weight: 400 (regular)
Color: #374151 (Gray 700)
Line Height: 1.5
Word Break: break-word
```

**Action Row:**
```css
Display: flex
Gap: 16px
Margin Top: 4px
```

**Action Button (Reply/Edit/Delete):**
```css
Font Size: 12px
Font Weight: 500 (medium)
Color: #6B7280 (Gray 500)
Background: transparent
Border: none
Cursor: pointer
Transition: color 150ms ease

Hover:
  Color: #60A5FA (Blue 400)
```

---

## **TAB 4: FILES**

### **Badge Count: 5**

### **Container**
```css
Padding: 24px
Display: flex
Flex Direction: column
Gap: 20px
```

### **Upload Area**

#### **Container**
```css
Width: 100%
Min Height: 140px
Padding: 24px
Background: #F9FAFB (Gray 50)
Border: 2px dashed #D1D5DB (Gray 300)
Border Radius: 8px
Display: flex
Flex Direction: column
Align Items: center
Justify Content: center
Gap: 12px
Cursor: pointer
Transition: all 150ms ease
Margin Bottom: 24px

Hover:
  Border Color: #60A5FA (Blue 400)
  Background: #EFF6FF (Blue 50)
```

**Upload Icon:**
```css
Component: <Upload> or <Cloud>
Size: 32px × 32px
Color: #60A5FA (Blue 400)
```

**Text:**
```css
Font Size: 14px
Font Weight: 500 (medium)
Color: #374151 (Gray 700)
Text Align: center

Main Text: "Drop files here or click to upload"
Sub Text: "Supports: PDF, DOC, DOCX, XLS, PNG, JPG (Max 10MB)"
```

**Sub Text:**
```css
Font Size: 12px
Font Weight: 400 (regular)
Color: #9CA3AF (Gray 400)
```

---

### **File List**

#### **Section Header**
```css
Font Size: 11px
Font Weight: 600 (semibold)
Color: #6B7280 (Gray 500)
Text Transform: uppercase
Letter Spacing: 0.5px
Margin Bottom: 12px
```

#### **File Card**
```css
Width: 100%
Padding: 12px 16px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Display: flex
Align Items: center
Justify Content: space-between
Gap: 12px
Margin Bottom: 8px
Transition: all 150ms ease

Hover:
  Border Color: #D1D5DB (Gray 300)
  Background: #F9FAFB (Gray 50)
```

**Left Side:**
```css
Display: flex
Align Items: center
Gap: 12px
Flex: 1
```

**File Icon:**
```css
Width: 40px
Height: 40px
Background: #EFF6FF (Blue 50)
Border Radius: 6px
Display: flex
Align Items: center
Justify Content: center
Flex Shrink: 0

Icon (<FileText>, <File>, <Image>):
  Size: 20px × 20px
  Color: #60A5FA (Blue 400)
```

**File Info:**
```css
Display: flex
Flex Direction: column
Gap: 2px
Flex: 1
Min Width: 0
```

**File Name:**
```css
Font Size: 14px
Font Weight: 600 (semibold)
Color: #0A0A0A (near black)
Line Height: 1.2
White Space: nowrap
Overflow: hidden
Text Overflow: ellipsis
```

**File Meta (Size + Date):**
```css
Font Size: 12px
Font Weight: 400 (regular)
Color: #9CA3AF (Gray 400)
Format: "2.4 MB • Uploaded Dec 1, 2024"
```

**Right Side (Actions):**
```css
Display: flex
Gap: 4px
```

**Icon Button (Download/Delete):**
```css
Width: 32px
Height: 32px
Background: transparent
Border: none
Border Radius: 4px
Color: #6B7280 (Gray 500)
Cursor: pointer
Display: flex
Align Items: center
Justify Content: center
Transition: all 150ms ease

Hover:
  Background: #E5E7EB (Gray 200)
  Color: #374151 (Gray 700)

Delete Hover:
  Background: #FEE2E2 (Red 50)
  Color: #EF4444 (Red 500)

Icon:
  Size: 16px × 16px
  Stroke Width: 2px
```

---

## **TAB 5: FLAGS**

### **Container**
```css
Padding: 24px
Display: flex
Flex Direction: column
Gap: 20px
```

### **Add Flag Section**

#### **Container**
```css
Padding: 16px
Background: #F9FAFB (Gray 50)
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 8px
Margin Bottom: 24px
```

**Input Row:**
```css
Display: flex
Gap: 8px
Align Items: start
Margin Bottom: 12px
```

**Textarea:**
```css
Flex: 1
Min Height: 60px
Padding: 10px 12px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 6px
Font Size: 14px
Color: #0A0A0A (near black)
Resize: vertical
Transition: all 150ms ease

Focus:
  Border Color: #60A5FA (Blue 400)
  Outline: none
  Box Shadow: 0 0 0 3px rgba(96, 165, 250, 0.1)

Placeholder:
  Color: #9CA3AF (Gray 400)
  Content: "Describe the flag or issue..."
```

**Priority Selector:**
```css
Display: flex
Gap: 8px
```

**Priority Button:**
```css
Width: 32px
Height: 32px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Radius: 6px
Cursor: pointer
Display: flex
Align Items: center
Justify Content: center
Transition: all 150ms ease

Icon (<Flag>):
  Size: 16px × 16px
  
Low Priority:
  Hover: Border Color: #34D399, Background: #D1FAE5
  Active: Border Color: #34D399, Background: #34D399, Icon Color: white
  
Medium Priority:
  Hover: Border Color: #FB923D, Background: #FFEDD5
  Active: Border Color: #FB923D, Background: #FB923D, Icon Color: white
  
High Priority:
  Hover: Border Color: #EF4444, Background: #FEE2E2
  Active: Border Color: #EF4444, Background: #EF4444, Icon Color: white
```

**Add Flag Button:**
```css
Height: 36px
Padding: 0 16px
Background: #60A5FA (Blue 400)
Color: white
Font Size: 13px
Font Weight: 600 (semibold)
Border: none
Border Radius: 6px
Cursor: pointer
Transition: all 150ms ease

Hover:
  Background: #3B82F6 (Blue 500)
```

---

### **Flag List**

#### **Section Header**
```css
Font Size: 11px
Font Weight: 600 (semibold)
Color: #6B7280 (Gray 500)
Text Transform: uppercase
Letter Spacing: 0.5px
Margin Bottom: 12px
```

#### **Flag Card**
```css
Width: 100%
Padding: 16px
Background: white
Border: 1px solid #E5E7EB (Gray 200)
Border Left: 4px solid (varies by priority)
Border Radius: 8px
Display: flex
Gap: 12px
Margin Bottom: 12px
Transition: all 150ms ease

Low Priority:
  Border Left Color: #34D399 (Green 400)
  
Medium Priority:
  Border Left Color: #FB923D (Orange 400)
  
High Priority:
  Border Left Color: #EF4444 (Red 500)

Hover:
  Border Color: #D1D5DB (Gray 300)
  Background: #F9FAFB (Gray 50)
```

**Flag Icon:**
```css
Width: 20px
Height: 20px
Color: (matches priority color)
Flex Shrink: 0
Margin Top: 2px
```

**Content Area:**
```css
Flex: 1
Display: flex
Flex Direction: column
Gap: 8px
```

**Header Row:**
```css
Display: flex
Justify Content: space-between
Align Items: start
```

**Priority Badge:**
```css
Padding: 2px 8px
Font Size: 11px
Font Weight: 600 (semibold)
Border Radius: 4px
Text Transform: uppercase

Low:
  Background: #D1FAE5 (Green 100)
  Color: #059669 (Green 600)
  
Medium:
  Background: #FFEDD5 (Orange 100)
  Color: #EA580C (Orange 600)
  
High:
  Background: #FEE2E2 (Red 100)
  Color: #DC2626 (Red 600)
```

**Timestamp:**
```css
Font Size: 12px
Font Weight: 400 (regular)
Color: #9CA3AF (Gray 400)
Format: "2 hours ago"
```

**Flag Text:**
```css
Font Size: 14px
Font Weight: 400 (regular)
Color: #374151 (Gray 700)
Line Height: 1.5
```

**Meta Row:**
```css
Display: flex
Align Items: center
Gap: 12px
Font Size: 12px
Color: #6B7280 (Gray 500)
```

**Author:**
```css
Display: flex
Align Items: center
Gap: 6px

Icon (<User>):
  Size: 14px × 14px
```

**Action Buttons:**
```css
Display: flex
Gap: 12px
Margin Top: 4px
```

**Action Button (Resolve/Delete):**
```css
Font Size: 12px
Font Weight: 500 (medium)
Color: #6B7280 (Gray 500)
Background: transparent
Border: none
Cursor: pointer
Transition: color 150ms ease

Resolve Hover:
  Color: #34D399 (Green 400)
  
Delete Hover:
  Color: #EF4444 (Red 500)
```

---

## **GLOBAL STYLES**

### **Color Palette**

| Element | Color | Hex |
|---------|-------|-----|
| **Primary Blue** | Buttons, Links, Active | #60A5FA |
| **Hover Blue** | Button Hover | #3B82F6 |
| **Dark Blue** | Tab Active Underline | #3B82F6 |
| **Near Black** | Text Primary | #0A0A0A |
| **Gray 700** | Text Secondary | #374151 |
| **Gray 500** | Labels, Icons | #6B7280 |
| **Gray 400** | Placeholder | #9CA3AF |
| **Gray 300** | Borders Hover | #D1D5DB |
| **Gray 200** | Borders | #E5E7EB |
| **Gray 100** | Background Light | #F3F4F6 |
| **Gray 50** | Background Hover | #F9FAFB |
| **White** | Background | #FFFFFF |
| **Green 400** | Success, Low Priority | #34D399 |
| **Yellow 400** | Warning | #FBBF24 |
| **Orange 400** | Medium Priority | #FB923D |
| **Red 500** | Error, High Priority | #EF4444 |

---

### **Spacing System**

```
Base Unit: 4px

Vertical Spacing Between Fields: 20px (5 units)
Horizontal Gap in Grid Rows: 16px (4 units)
Modal Padding: 24px (6 units)
Header Padding: 20px 24px (5 units, 6 units)
Tab Navigation Height: 48px (12 units)
Field Height (standard): 40px (10 units)
Label Margin Bottom: 8px (2 units)
Card Padding: 12px 16px (3 units, 4 units)
Border Radius (small): 6px (1.5 units)
Border Radius (medium): 8px (2 units)
Border Radius (large): 12px (3 units)
```

---

### **Typography Scale**

```
Display (Task Title): 24px / Bold / -0.02em
Body Large: 16px / Regular
Body: 14px / Regular
Body Small: 13px / Regular
Caption: 12px / Regular
Label: 11px / Semibold / Uppercase / 0.5px
```

---

### **Responsive Behavior**

```css
@media (max-width: 768px) {
  Modal Width: 95vw (instead of 680px)
  Modal Padding: 16px (instead of 24px)
  
  All Grid Rows:
    Grid Template Columns: 1fr (stack vertically)
    Gap: 12px (instead of 16px)
  
  FROM/TO/TASK HOURS Row: Stack
  ALERT STATUS/OPTIONS Row: Stack
  LABELS/SKILLS Row: Stack
  EXPERTISE/ESTIMATION Row: Stack
  
  Tab Navigation:
    Overflow X: auto
    Scroll Behavior: smooth
    
  Tab Text:
    Display: none (on small screens, show icons only)
}

@media (max-width: 480px) {
  Modal Width: 100vw
  Modal Height: 100vh
  Border Radius: 0
  
  Header:
    Padding: 16px
  
  Task Title:
    Font Size: 20px
}
```

---

## **HELP BUTTON (Bottom Right)**

```css
Position: fixed
Bottom: 24px
Right: 24px
Width: 48px
Height: 48px
Background: #1F2937 (Gray 800)
Color: white
Border: none
Border Radius: 50%
Display: flex
Align Items: center
Justify Content: center
Cursor: pointer
Box Shadow: 0 4px 16px rgba(0, 0, 0, 0.2)
Z-Index: 1001 (above modal)
Transition: all 200ms ease

Hover:
  Background: #111827 (Gray 900)
  Transform: scale(1.05)
  Box Shadow: 0 6px 20px rgba(0, 0, 0, 0.3)

Icon (?):
  Font Size: 20px
  Font Weight: 700 (bold)
  Color: white
```

---

## **ACCESSIBILITY**

### **Focus States**

All interactive elements must have visible focus indicators:

```css
Focus Visible:
  Outline: 2px solid #60A5FA (Blue 400)
  Outline Offset: 2px
  Border Radius: inherit
```

### **Keyboard Navigation**

- Tab order follows visual flow (top to bottom, left to right)
- Modal traps focus (can't tab outside)
- Escape key closes modal
- Enter key submits forms
- Arrow keys navigate tabs

### **ARIA Labels**

```html
Modal: aria-label="Task detail modal" role="dialog" aria-modal="true"
Close Button: aria-label="Close modal"
Tabs: role="tablist" / role="tab" / aria-selected="true/false"
Tab Panels: role="tabpanel" / aria-labelledby="[tab-id]"
Sliders: role="slider" / aria-valuemin / aria-valuemax / aria-valuenow
```

### **Screen Reader Announcements**

- Tab changes announce: "[Tab Name] selected"
- Progress changes announce: "Progress set to [X] percent"
- Form submissions announce: "Task saved successfully"

---

## **ANIMATION SPECIFICATIONS**

### **Modal Entry**

```css
Animation: slideUp + fadeIn
Duration: 250ms
Easing: cubic-bezier(0.16, 1, 0.3, 1)

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### **Modal Exit**

```css
Animation: slideDown + fadeOut
Duration: 200ms
Easing: ease-in

@keyframes slideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(20px);
    opacity: 0;
  }
}
```

### **Tab Transitions**

```css
Duration: 150ms
Easing: ease-in-out
Properties: border-bottom-color, color, background-color
```

### **Hover Effects**

```css
Duration: 150ms
Easing: ease
Properties: background-color, border-color, transform, box-shadow
```

---

## **NOTES**

- All transitions use `transition: all 150ms ease` unless specified
- All interactive elements have 150ms hover/active states
- Border radius follows 6px (small), 8px (medium), 12px (large) scale
- Spacing uses 4px base unit (multiples of 4)
- Font uses Inter system font
- Icons from Lucide React library (16px standard, 2px stroke width)
- Mobile breakpoint: 768px
- Small mobile breakpoint: 480px

---

**Last Updated:** December 3, 2024  
**Version:** 1.0  
**Component:** TaskDetailModal.tsx
