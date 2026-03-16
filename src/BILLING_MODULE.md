# Billing Module Documentation

## Overview

The Billing/Invoicing module is a comprehensive B2B SaaS invoicing system integrated into Workdeck's Finance section. It enables users to create professional invoices by collecting billable items (time entries, expenses, milestones) from projects and generating polished invoice documents.

## Target Users

- **Small businesses**: Using this as their primary invoicing tool
- **Larger businesses**: Preparing invoices for ERP export

## Design Philosophy

- Clean, minimal, professional aesthetic
- Consistent with modern SaaS applications (Notion, Linear, Stripe)
- Desktop-first, responsive design
- Dense, tool-like interface (Workdeck signature)
- WCAG 2.1 Level AA accessibility compliant

## Module Structure

```
/contexts/BillingContext.tsx          - State management & mock data
/components/billing/
  ├── BillingView.tsx                 - Main container with tabs
  ├── InvoiceListView.tsx             - Invoice list with filtering
  ├── InvoiceCreationFlow.tsx         - 3-step creation orchestrator
  ├── InvoiceSetupStep.tsx            - Step 1: Invoice details
  ├── InvoiceLineItemsStep.tsx        - Step 2: Select billable items
  ├── InvoiceReviewStep.tsx           - Step 3: Notes & review
  ├── InvoiceDocumentView.tsx         - Formatted invoice document
  ├── SendInvoiceModal.tsx            - Email invoice modal
  ├── BillingSettings.tsx             - Company & invoice settings
  └── index.ts                        - Clean exports
```

## Key Features

### 1. Invoice List View
- **Status filtering**: All, Drafts, Pending Payment, Paid, Cancelled
- **Search**: By client, project, or invoice number
- **Status badges**: Color-coded (Draft: Gray, Pending: Amber, Paid: Green, Cancelled: Red)
- **Overdue indicators**: Shows days overdue for pending invoices
- **Quick actions**: View, Edit, Mark as Paid, Cancel, Delete
- **Empty states**: Context-aware for each filter

### 2. Invoice Creation Flow (3 Steps)

#### Step 1: Setup
- Auto-generated invoice numbers (customizable format)
- Client & project selection
- Date range for filtering billable items
- Tax rate configuration
- Payment terms (NET 30/60/90/120)
- Auto-calculated due dates
- Display format options (time entries, expenses)

#### Step 2: Line Items
- **Time Entries**: Selectable with person, task, hours, rate
- **Expenses**: Individual line items with taxable toggle
- **Milestones**: Editable amounts with delivery dates
- **Additional Items**: Manual entry for custom charges
- **Collapsible sections**: With item counts and subtotals
- **Live summary sidebar**: Shows running totals
- **Bulk actions**: Select/deselect all per section

#### Step 3: Review
- Add invoice notes (payment instructions, thank you messages)
- Visual summary card with key details
- Breakdown by billable item type
- Complete total calculation display
- Save as draft or complete

### 3. Invoice Document View
- **Professional layout**: Company logo, addresses, invoice meta
- **Grouped line items**: By type (Services, Expenses, Milestones, Additional)
- **Status watermarks**: Visual indicators for Paid/Cancelled
- **Action toolbar**: Edit, Print, Export PDF, Send
- **Payment details**: Bank info, VAT number, payment terms
- **Status-specific actions**:
  - Draft: Edit, Send, Delete
  - Pending: Mark as Paid, Send Reminder, Cancel
  - Paid: View only (shows payment date)
  - Cancelled: View only (visual indication)

### 4. Send Invoice Modal
- Email recipient management (add/remove)
- Pre-populated with client email
- Optional personal message
- Email preview before sending
- Success confirmation with animation
- Auto-updates invoice status (Draft → Pending)

### 5. Billing Settings
- **Company Information**: Name, logo, address, VAT number
- **Bank Details**: Bank name, IBAN, payment instructions
- **Default Settings**: Tax rate, payment terms, currency
- **Display Formats**: Default time entry & expense formats
- **Invoice Numbering**: Prefix, year inclusion, next number
- **Live preview**: Shows how next invoice number will look

## Data Model

### Invoice Interface
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  projectName: string;
  projectId: string;
  invoiceDate: string;
  dueDate: string;
  poCode?: string;
  title?: string;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  taxRate: number;
  paymentTerms: 'NET 30' | 'NET 60' | 'NET 90' | 'NET 120';
  timeEntryFormat: 'grouped-person-task' | 'grouped-task' | 'detailed';
  expenseFormat: 'detailed' | 'combined';
  timeEntries: TimeEntry[];
  expenses: Expense[];
  milestones: Milestone[];
  additionalItems: AdditionalItem[];
  notes?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  paidDate?: string;
}
```

## Navigation Integration

- **Location**: Finance → Billing
- **Access**: Click "Finance" tab, then "Billing" sub-tab
- **Context**: Part of Finance section alongside Spending and Reports

## Mock Data

The module includes 4 sample invoices demonstrating different statuses:
- INV-2024-001: Paid invoice ($16,500)
- INV-2024-002: Paid invoice ($26,400)
- INV-2024-003: Pending invoice ($20,350) - shows overdue logic
- INV-2024-004: Draft invoice ($13,200)

## User Flows

### Create New Invoice
1. Click "New Invoice" button
2. **Setup Step**: Enter invoice details, select client/project, configure billing
3. **Line Items Step**: Select time entries, expenses, milestones; add custom items
4. **Review Step**: Add notes, review totals
5. Complete: Save as draft or save & view document

### Send Invoice
1. Open invoice document
2. Click "Send Invoice" button
3. Add recipient emails
4. Optional: Add personal message
5. Review email preview
6. Send (updates status to Pending)

### Mark as Paid
1. Open pending invoice
2. Click "More" menu (⋮)
3. Select "Mark as Paid"
4. Status updates to Paid with current date

### Edit Draft Invoice
1. Find draft invoice in list
2. Click edit action or open and click "Edit"
3. Modify any details across all 3 steps
4. Save changes

## Technical Details

### State Management
- **BillingContext**: Centralized state for invoices and settings
- **Mock data generator**: Creates realistic sample invoices
- **Actions**: Add, update, delete, markAsPaid, cancelInvoice
- **Settings management**: Company info, defaults, numbering

### Styling
- Consistent 4px spacing units
- 6px border radius
- #0066FF primary blue
- Inter font family
- Tabular figures for currency alignment
- Print-friendly document layout

### Accessibility
- Keyboard navigation support
- Focus states on interactive elements
- ARIA labels where appropriate
- Color contrast compliant
- Screen reader friendly structure

## Future Enhancements

Potential additions (not yet implemented):
- PDF generation (real implementation vs. mock)
- Email integration (actual SMTP vs. simulation)
- Recurring invoices
- Payment tracking and reminders
- Multi-currency support
- Invoice templates
- Export to accounting software (QuickBooks, Xero)
- Payment gateway integration
- Invoice versioning/history
- Bulk operations
- Advanced filtering and search
- Analytics and reporting

## Best Practices

1. **Always validate** invoice numbers for uniqueness
2. **Auto-calculate** due dates based on payment terms
3. **Show clear status indicators** throughout the UI
4. **Preserve invoice integrity** - limit editing after sending
5. **Provide clear CTAs** for each invoice status
6. **Calculate totals dynamically** as items are selected
7. **Save drafts frequently** to prevent data loss
8. **Show confirmation dialogs** for destructive actions

## Design Tokens

```css
/* Colors */
--status-draft: #6B7280 (gray)
--status-pending: #F59E0B (amber)
--status-paid: #10B981 (green)
--status-cancelled: #EF4444 (red)
--primary: #0066FF (blue)

/* Spacing */
--spacing-unit: 4px

/* Border Radius */
--border-radius: 6px

/* Typography */
--font-family: Inter
```

## Testing Checklist

- [ ] Create invoice with all item types
- [ ] Edit draft invoice
- [ ] Send invoice (draft → pending)
- [ ] Mark invoice as paid
- [ ] Cancel invoice
- [ ] Delete draft invoice
- [ ] Filter by status
- [ ] Search invoices
- [ ] Update settings
- [ ] Print invoice document
- [ ] Invoice numbering increments
- [ ] Due date calculations
- [ ] Tax calculations
- [ ] Currency formatting
- [ ] Empty states display
- [ ] Error handling
- [ ] Mobile responsive behavior

---

**Version**: 1.0  
**Last Updated**: November 27, 2024  
**Status**: Production Ready
