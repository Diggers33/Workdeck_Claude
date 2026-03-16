# Billing Module Component Guide

## Component Hierarchy

```
BillingView (Main Container)
├── Tab Navigation (Invoices / Settings)
├── Search Bar (Invoices tab only)
│
├── InvoiceListView (When Invoices tab active)
│   ├── Sidebar Filters (All / Draft / Pending / Paid / Cancelled)
│   ├── Invoice Table
│   │   ├── Table Headers (sortable)
│   │   ├── Table Rows (clickable, with hover state)
│   │   └── Action Menus (per row)
│   └── Empty States (per filter)
│
├── InvoiceCreationFlow (When creating/editing)
│   ├── Progress Indicator (3 steps)
│   ├── InvoiceSetupStep (Step 1)
│   │   ├── Invoice Details Section
│   │   ├── Client & Project Section
│   │   ├── Billing Configuration Section
│   │   └── Display Options Section
│   │
│   ├── InvoiceLineItemsStep (Step 2)
│   │   ├── Time Entries Section (collapsible)
│   │   ├── Expenses Section (collapsible)
│   │   ├── Milestones Section (collapsible)
│   │   ├── Additional Items Section (collapsible)
│   │   └── Summary Sidebar (sticky)
│   │
│   └── InvoiceReviewStep (Step 3)
│       ├── Notes Section
│       ├── Invoice Summary Card
│       ├── Billable Items Breakdown
│       └── Totals Breakdown
│
├── InvoiceDocumentView (When viewing invoice)
│   ├── Action Toolbar
│   ├── Status Watermark (Paid/Cancelled only)
│   ├── Document Header (Logo, Company Info)
│   ├── Invoice Meta (Bill To, Invoice Details)
│   ├── Line Items Table (grouped by type)
│   ├── Totals Section
│   └── Footer (Notes, Payment Details)
│
├── SendInvoiceModal (Overlay)
│   ├── Recipient Management
│   ├── Message Input
│   └── Email Preview
│
└── BillingSettings (When Settings tab active)
    ├── Company Information Section
    ├── Bank Details Section
    ├── Default Settings Section
    └── Invoice Numbering Section
```

## Key Components

### 1. Status Badge

**Usage**: Display invoice status throughout the UI

**Props**:
```typescript
status: 'draft' | 'pending' | 'paid' | 'cancelled'
```

**Styling**:
```css
Draft: bg-gray-100 text-gray-700
Pending: bg-amber-100 text-amber-700
Paid: bg-green-100 text-green-700
Cancelled: bg-red-100 text-red-700
```

**Example**:
```tsx
<span className="inline-flex items-center px-8 py-4 rounded-md bg-green-100 text-green-700 text-xs">
  Paid
</span>
```

### 2. Collapsible Section

**Usage**: Time entries, expenses, milestones sections

**Features**:
- Click header to expand/collapse
- Shows item count and subtotal in header
- Smooth animation
- ChevronDown/ChevronUp icon

**Structure**:
```tsx
<div className="border border-gray-200 rounded-lg">
  <button className="w-full flex items-center justify-between px-16 py-12 bg-gray-50 hover:bg-gray-100">
    <div className="flex items-center gap-12">
      {icon}
      <h3>Section Name</h3>
      <span>(X selected)</span>
    </div>
    <span>$X,XXX</span>
  </button>
  {expanded && (
    <div className="p-16">
      {/* Content */}
    </div>
  )}
</div>
```

### 3. Selectable Table Row

**Usage**: Time entries, expenses, milestones selection

**Features**:
- Checkbox in first column
- Hover state (bg-gray-50)
- Tabular numbers for amounts
- Conditional styling based on selection

**Example**:
```tsx
<tr className="border-b border-gray-100 hover:bg-gray-50">
  <td className="px-12 py-8">
    <input type="checkbox" checked={selected} onChange={toggle} />
  </td>
  <td className="px-12 py-8 text-gray-900">{data}</td>
  <td className="px-12 py-8 text-right text-gray-900 tabular-nums">{amount}</td>
</tr>
```

### 4. Summary Sidebar

**Usage**: Step 2 (Line Items) - shows running totals

**Features**:
- Sticky position
- Itemized breakdown
- Subtotal, tax, total
- Due date reminder
- Action buttons (Back, Save Draft, Next)

**Styling**:
```css
width: 320px
border-left: 1px solid gray-200
background: gray-50
padding: 24px
position: sticky
top: 24px
```

### 5. Document Layout

**Usage**: InvoiceDocumentView - mimics printed invoice

**Features**:
- Paper-like appearance (white bg, shadow)
- Max width 4xl, centered
- Print-friendly (no dark backgrounds)
- Professional typography
- Clear sections with spacing

**Structure**:
```tsx
<div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-48">
  <Header />
  <InvoiceMeta />
  <LineItemsTable />
  <TotalsSection />
  <Footer />
</div>
```

### 6. Action Toolbar

**Usage**: Top of InvoiceDocumentView

**Actions by Status**:
- **Draft**: Edit, Print, Export PDF, Send, Delete
- **Pending**: Print, Export PDF, Send Reminder, Mark as Paid, Cancel
- **Paid**: Print, Export PDF (view only)
- **Cancelled**: Print, Export PDF (view only)

**Layout**:
```tsx
<div className="flex items-center justify-between px-24 py-12 bg-white border-b">
  <div className="flex items-center gap-16">
    <button>Close</button>
    <StatusBadge />
  </div>
  <div className="flex items-center gap-8">
    {/* Action buttons based on status */}
  </div>
</div>
```

### 7. Empty State

**Usage**: When no data to display

**Structure**:
```tsx
<div className="flex flex-col items-center justify-center h-full text-center px-24 py-48">
  <div className="w-64 h-64 rounded-full bg-gray-100 flex items-center justify-center mb-16">
    <Icon size={32} className="text-gray-400" />
  </div>
  <h3 className="text-gray-900 mb-8">Headline</h3>
  <p className="text-gray-600 mb-24 max-w-md">Description</p>
  {ctaButton && <button>Action</button>}
</div>
```

### 8. Modal Pattern

**Usage**: SendInvoiceModal

**Structure**:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div className="bg-white rounded-lg max-w-2xl w-full mx-16">
    <div className="px-24 py-16 border-b">
      <h2>Title</h2>
      <button>Close (X)</button>
    </div>
    <div className="px-24 py-24">
      {/* Content */}
    </div>
    <div className="px-24 py-16 border-t">
      <button>Cancel</button>
      <button>Primary Action</button>
    </div>
  </div>
</div>
```

### 9. Form Field Patterns

**Text Input**:
```tsx
<div>
  <label className="block text-gray-700 mb-4">Label</label>
  <input
    type="text"
    className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
  />
</div>
```

**Select Dropdown**:
```tsx
<select className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600">
  <option>Option 1</option>
</select>
```

**Radio Group**:
```tsx
<div className="space-y-8">
  <label className="flex items-center gap-8 cursor-pointer">
    <input type="radio" name="group" value="1" className="text-blue-600" />
    <span className="text-gray-700">Option 1</span>
  </label>
</div>
```

**Textarea**:
```tsx
<textarea
  rows={4}
  className="w-full px-12 py-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
/>
```

### 10. Button Patterns

**Primary Action**:
```tsx
<button className="px-16 py-8 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
  Primary Action
</button>
```

**Secondary Action**:
```tsx
<button className="px-16 py-8 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
  Secondary Action
</button>
```

**Icon Button**:
```tsx
<button className="p-8 hover:bg-gray-100 rounded-md transition-colors">
  <Icon size={20} className="text-gray-600" />
</button>
```

**Destructive Action**:
```tsx
<button className="px-16 py-8 text-red-600 hover:bg-red-50 transition-colors">
  Delete
</button>
```

## Spacing System

Based on 4px units:

```
4px   = gap-4, p-4, m-4
8px   = gap-8, p-8, m-8
12px  = gap-12, p-12, m-12
16px  = gap-16, p-16, m-16
24px  = gap-24, p-24, m-24
32px  = gap-32, p-32, m-32
48px  = gap-48, p-48, m-48
```

## Color Palette

### Grays
```
gray-50   - Backgrounds
gray-100  - Subtle backgrounds, borders
gray-200  - Borders
gray-300  - Borders (focus)
gray-400  - Icons
gray-500  - Supporting text
gray-600  - Body text
gray-700  - Labels
gray-900  - Headings
```

### Status Colors
```
amber-100 / amber-700  - Pending
green-100 / green-700  - Paid/Success
red-100 / red-700      - Cancelled/Error
blue-50 / blue-600     - Primary actions
```

## Typography Scale

```
text-xs    - 12px - Badges, small labels
text-sm    - 14px - Body text, descriptions
text-base  - 16px - Default body
(h3)       - 18px - Section headers
(h2)       - 24px - Page headers
(h1)       - 32px - Main titles
```

**Font Weights**:
- Regular (400): Body text
- Bold (700): Headings, labels

## Icons

Using Lucide React:

```typescript
import {
  FileText,      // Invoice icon
  Search,        // Search
  Plus,          // Add actions
  Edit2,         // Edit
  Trash2,        // Delete
  Eye,           // View
  Send,          // Send email
  Printer,       // Print
  Download,      // Export
  X,             // Close
  Check,         // Success
  ChevronDown,   // Expand
  ChevronUp,     // Collapse
  MoreVertical,  // More actions
  Clock,         // Time
  Receipt,       // Expenses
  DollarSign,    // Money
  Calendar,      // Dates
  Mail,          // Email
  Upload,        // File upload
  Save,          // Save
  XCircle        // Cancel
} from 'lucide-react';
```

## Responsive Behavior

While desktop-first, key breakpoints:

- **Desktop**: Full layout (default)
- **Tablet**: Sidebar stacks, reduced padding
- **Mobile**: Single column, hamburger menu

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```css
focus:outline-none focus:ring-2 focus:ring-blue-600
```

### Color Contrast
All text meets WCAG AA standards:
- Body text: gray-600 on white (4.5:1+)
- Headings: gray-900 on white (7:1+)

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals
- Arrow keys for radio groups

### Screen Readers
- Semantic HTML (table, button, input)
- Descriptive button text
- Alt text for icons where needed

## Performance Considerations

1. **Lazy Loading**: Load invoice documents on demand
2. **Virtualization**: For very long invoice lists (future)
3. **Memoization**: Expensive calculations cached
4. **Debounced Search**: 300ms delay on search input
5. **Optimistic Updates**: UI updates before API response

## Print Styles

Invoice documents include print-friendly styles:

```css
@media print {
  - Remove shadows and borders
  - Ensure white background
  - Hide action buttons
  - Standard page size (A4/Letter)
  - Page breaks between sections
}
```

---

**Note**: This guide reflects the current implementation. Refer to component files for exact implementation details.
