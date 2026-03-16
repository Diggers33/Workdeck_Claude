# Billing Module - Quick Start Guide

## 🚀 Getting Started

### Access the Module

1. Navigate to **Finance** tab in main navigation
2. Click **Billing** in the submenu
3. You'll see the invoice list view by default

### Creating Your First Invoice

1. Click **"New Invoice"** button (top right)
2. Fill in invoice details (auto-generated number provided)
3. Select client and project from dropdowns
4. Configure tax rate and payment terms
5. Click **"Next"**
6. Select billable items (time, expenses, milestones)
7. Add any custom items if needed
8. Click **"Preview Invoice"**
9. Add notes (optional)
10. Click **"Save & View Document"**

### Sending an Invoice

1. Open any invoice with **"Draft"** or **"Pending"** status
2. Click **"Send Invoice"** button
3. Add recipient email addresses
4. Optionally add a personal message
5. Review email preview
6. Click **"Send Invoice"**

Draft invoices automatically become **"Pending"** when sent.

## 📋 Common Tasks

### Filter Invoices by Status

Click sidebar filters:
- **All Invoices** - Shows everything
- **Drafts** - Work in progress
- **Pending Payment** - Sent, awaiting payment
- **Paid** - Completed invoices
- **Cancelled** - Voided invoices

### Search Invoices

Use the search bar to find invoices by:
- Invoice number (e.g., "INV-2024-001")
- Client name (e.g., "Acme")
- Project name (e.g., "Website")

### Mark Invoice as Paid

1. Open a **Pending** invoice
2. Click the **More (⋮)** menu
3. Select **"Mark as Paid"**
4. Status updates to **Paid** with current date

### Edit a Draft Invoice

1. Find the draft in the list
2. Click **"Edit"** from the actions menu
3. Modify any details across all 3 steps
4. Save changes

### Cancel an Invoice

1. Open a **Pending** or **Draft** invoice
2. Click **More (⋮)** menu
3. Select **"Cancel Invoice"**
4. Confirm the action

### Configure Settings

1. Click **"Settings"** tab
2. Update company information
3. Add bank details for payment instructions
4. Set default tax rate and payment terms
5. Configure invoice numbering format
6. Click **"Save Settings"**

## 🎯 Mock Data

The module includes 4 sample invoices:

| Invoice | Client | Amount | Status | Purpose |
|---------|--------|--------|--------|---------|
| INV-2024-001 | Acme Corporation | $16,500 | Paid | Show paid invoice with payment date |
| INV-2024-002 | TechStart Inc | $26,400 | Paid | Multiple paid invoices example |
| INV-2024-003 | Global Solutions Ltd | $20,350 | Pending | Active pending invoice |
| INV-2024-004 | Innovate Labs | $13,200 | Draft | Editable draft |

## 💡 Pro Tips

### Invoice Numbers
- Auto-generated based on settings
- Format: `PREFIX-YEAR-NUMBER` (e.g., INV-2024-001)
- Customize in Settings → Invoice Numbering

### Due Dates
- Automatically calculated from invoice date + payment terms
- NET 30 = 30 days from invoice date
- NET 60 = 60 days from invoice date
- etc.

### Tax Calculations
- Applied to selected line items
- Toggle "Taxable" checkbox per item
- Tax rate set in invoice setup (default from settings)

### Line Item Selection
- Select/deselect items in Step 2
- Use "Select All" / "Deselect All" for bulk actions
- Summary sidebar shows live totals

### Display Formats
**Time Entries**:
- Grouped by Person & Task (default)
- Grouped by Task
- Detailed (individual entries)

**Expenses**:
- Detailed (individual items)
- Combined (single line)

### Saving Progress
- Click **"Save Draft"** at any step to save work
- Return later to continue editing
- Drafts appear in the Drafts filter

### Print/Export
- Click **"Print"** to open browser print dialog
- Click **"Export PDF"** for downloadable PDF
- Document is optimized for A4/Letter paper

## 🔍 Keyboard Shortcuts

Currently, the billing module uses standard browser shortcuts:

- **Tab** - Navigate between fields
- **Enter** - Submit forms, activate buttons
- **Escape** - Close modals
- **Ctrl/Cmd + P** - Print (when viewing invoice)

## ⚠️ Important Notes

### Status Flow
```
Draft → Pending → Paid
             ↓
         Cancelled
```

- **Draft**: Fully editable, can be deleted
- **Pending**: Limited editing, can be marked paid or cancelled
- **Paid**: View only, shows payment date
- **Cancelled**: View only, visual indication

### Data Persistence
Currently using **in-memory mock data**. In production:
- Data would persist to database
- API calls would replace local state updates
- Real email sending would be implemented
- PDF generation would be server-side

### Validation
The module validates:
- ✅ Required fields (client, project, dates)
- ✅ Unique invoice numbers
- ✅ Email format in send modal
- ✅ Numeric values for amounts

### Browser Support
Tested and optimized for:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Invoice not saving?
- Check that all required fields are filled
- Verify invoice number is unique
- Ensure at least one line item is selected

### Can't edit invoice?
- Only **Draft** invoices are fully editable
- **Pending** invoices have limited editing
- **Paid/Cancelled** invoices are read-only

### Send button disabled?
- Add at least one recipient email
- Verify email format is valid
- Check that invoice has content

### Calculations seem wrong?
- Verify tax rate is set correctly
- Check that items are marked taxable/non-taxable
- Ensure hours and rates are entered correctly

## 📚 Further Reading

- **BILLING_MODULE.md** - Complete feature documentation
- **COMPONENT_GUIDE.md** - Component patterns and styling
- **BillingContext.tsx** - State management implementation
- **Individual component files** - Detailed implementation

## 🆘 Getting Help

For issues or questions:
1. Check the documentation files
2. Review component comments in code
3. Examine mock data in BillingContext
4. Test with sample invoices provided

## 🎨 Customization

### Change Colors
Edit status badge colors in:
- `InvoiceListView.tsx`
- `InvoiceDocumentView.tsx`

### Modify Invoice Template
Edit layout in:
- `InvoiceDocumentView.tsx` - Document structure

### Add New Fields
1. Update `Invoice` interface in `BillingContext.tsx`
2. Add fields to `InvoiceSetupStep.tsx`
3. Display in `InvoiceDocumentView.tsx`

### Change Default Settings
Modify initial values in:
- `BillingContext.tsx` - `useState<BillingSettings>()`

---

**Ready to invoice!** 🎉

Start by clicking **"New Invoice"** or explore the sample invoices to see the full workflow.
