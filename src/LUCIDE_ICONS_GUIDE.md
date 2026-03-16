# Lucide Icons in Workdeck - Complete Usage Guide

## Overview
Workdeck uses **Lucide React** as the icon library for all UI components and widgets. Lucide is a modern, clean icon set with 1000+ icons, designed for consistency and accessibility. This guide covers usage in React (Workdeck) and how to achieve the same in Angular 9 using raw SVGs.

---

## Table of Contents
1. [React Usage (Current Workdeck Setup)](#react-usage)
2. [Angular 9 Compatible Approach](#angular-9-compatible-approach)
3. [Complete Icon Inventory](#complete-icon-inventory)
4. [Icon Styling Patterns](#icon-styling-patterns)
5. [Size & Color Standards](#size--color-standards)
6. [Accessibility Guidelines](#accessibility-guidelines)

---

## React Usage (Current Workdeck Setup)

### Installation
```bash
npm install lucide-react
```

### Import Pattern
```tsx
import { IconName } from 'lucide-react';
```

### Basic Usage
```tsx
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

function MyComponent() {
  return (
    <>
      <Calendar className="w-4 h-4 text-[#FBBF24]" />
      <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
      <ChevronRight className="w-4 h-4 text-[#6B7280]" />
    </>
  );
}
```

### With Props
```tsx
<Calendar 
  className="w-4 h-4" 
  color="#FBBF24"
  size={16}
  strokeWidth={2}
/>
```

---

## Angular 9 Compatible Approach

Since `lucide-angular` requires Angular 15+, use **raw SVG code** directly from [lucide.dev](https://lucide.dev).

### Method 1: Inline SVG Component

#### Step 1: Get SVG from lucide.dev
Visit https://lucide.dev/icons/calendar and copy the SVG code.

#### Step 2: Create Icon Component
```typescript
// icon.component.ts
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-icon',
  template: '<span [innerHTML]="svgContent" [class]="className"></span>',
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    span {
      display: inline-flex;
      line-height: 0;
    }
  `]
})
export class IconComponent {
  @Input() name: string;
  @Input() size: number = 16;
  @Input() color: string = 'currentColor';
  @Input() strokeWidth: number = 2;
  @Input() className: string = '';
  
  svgContent: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(
      this.getIconSvg(this.name)
    );
  }

  private getIconSvg(name: string): string {
    const icons = {
      'calendar': `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}" viewBox="0 0 24 24" fill="none" stroke="${this.color}" stroke-width="${this.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
      'chevron-left': `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}" viewBox="0 0 24 24" fill="none" stroke="${this.color}" stroke-width="${this.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
      'chevron-right': `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}" viewBox="0 0 24 24" fill="none" stroke="${this.color}" stroke-width="${this.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
      // Add more icons as needed
    };
    
    return icons[name] || '';
  }
}
```

#### Step 3: Usage in Templates
```html
<!-- Angular 9 usage -->
<app-icon name="calendar" [size]="16" color="#FBBF24" class="mr-2"></app-icon>
<app-icon name="chevron-left" [size]="16" color="#6B7280"></app-icon>
<app-icon name="chevron-right" [size]="16" color="#6B7280"></app-icon>
```

### Method 2: Direct SVG in Template

```html
<!-- calendar icon -->
<svg xmlns="http://www.w3.org/2000/svg" 
     width="16" height="16" 
     viewBox="0 0 24 24" 
     fill="none" 
     stroke="#FBBF24" 
     stroke-width="2" 
     stroke-linecap="round" 
     stroke-linejoin="round"
     class="mr-2">
  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
  <line x1="16" x2="16" y1="2" y2="6"/>
  <line x1="8" x2="8" y1="2" y2="6"/>
  <line x1="3" x2="21" y1="10" y2="10"/>
</svg>
```

### Method 3: SVG Icon Service (Recommended for Angular 9)

```typescript
// icon.service.ts
import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class IconService {
  private icons: { [key: string]: string } = {
    'calendar': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
    'chevron-left': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    // ... add all icons
  };

  constructor(private sanitizer: DomSanitizer) {}

  getIcon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      this.icons[name] || ''
    );
  }
}
```

---

## Complete Icon Inventory

### Dashboard Widgets

#### Agenda Widget
```tsx
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `Calendar` | Widget header | 16px | #FBBF24 (Amber 400) |
| `ChevronLeft` | Previous day | 16px | #6B7280 (Gray 500) |
| `ChevronRight` | Next day | 16px | #6B7280 (Gray 500) |

**Angular 9 SVG:**
```html
<!-- Calendar -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
  <line x1="16" x2="16" y1="2" y2="6"/>
  <line x1="8" x2="8" y1="2" y2="6"/>
  <line x1="3" x2="21" y1="10" y2="10"/>
</svg>

<!-- ChevronLeft -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m15 18-6-6 6-6"/>
</svg>

<!-- ChevronRight -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m9 18 6-6-6-6"/>
</svg>
```

#### To-Do List Widget
```tsx
import { 
  GripVertical, 
  Clock, 
  CheckSquare, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  MoreHorizontal, 
  ArrowUpRight 
} from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `GripVertical` | Drag handle | 16px | #D1D5DB (Gray 300) |
| `Clock` | Time estimate | 12px | #9CA3AF (Gray 400) |
| `CheckSquare` | Widget header | 16px | #EF4444 (Red 500) |
| `ChevronDown` | Expand group | 16px | #6B7280 (Gray 500) |
| `ChevronRight` | Collapse group | 16px | #6B7280 (Gray 500) |
| `ChevronUp` | Priority high | 12px | #DC2626 (Red 600) |
| `MoreHorizontal` | Task menu | 16px | #9CA3AF (Gray 400) |
| `ArrowUpRight` | External link | 12px | #3B82F6 (Blue 500) |

**Key Angular 9 SVGs:**
```html
<!-- GripVertical (Drag Handle) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="9" cy="12" r="1"/>
  <circle cx="9" cy="5" r="1"/>
  <circle cx="9" cy="19" r="1"/>
  <circle cx="15" cy="12" r="1"/>
  <circle cx="15" cy="5" r="1"/>
  <circle cx="15" cy="19" r="1"/>
</svg>

<!-- Clock (Time Estimate) -->
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>

<!-- CheckSquare (Widget Header) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="9 11 12 14 22 4"/>
  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
</svg>
```

#### Pending Approvals Widget
```tsx
import { Check, X, AlertCircle } from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `AlertCircle` | Widget header | 16px | #F59E0B (Amber 500) |
| `Check` | Approve button | 14px | #FFFFFF (White) |
| `X` | Reject button | 14px | #FFFFFF (White) |

**Angular 9 SVGs:**
```html
<!-- AlertCircle (Widget Header) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" x2="12" y1="8" y2="12"/>
  <line x1="12" x2="12.01" y1="16" y2="16"/>
</svg>

<!-- Check (Approve) -->
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"/>
</svg>

<!-- X (Reject) -->
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 6 6 18"/>
  <path d="m6 6 12 12"/>
</svg>
```

#### FYI Widget
```tsx
import { Bell } from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `Bell` | Widget header | 16px | #3B82F6 (Blue 500) |

**Angular 9 SVG:**
```html
<!-- Bell (Notifications) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
</svg>
```

#### Who's Where Widget
```tsx
import { MapPin, Building2, Laptop, Home } from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `MapPin` | Widget header | 16px | #10B981 (Green 500) |
| `Building2` | Office location | 16px | #10B981 (Green 500) |
| `Laptop` | Remote work | 16px | #3B82F6 (Blue 500) |
| `Home` | Home location | 16px | #9CA3AF (Gray 400) |

**Angular 9 SVGs:**
```html
<!-- MapPin (Widget Header) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
  <circle cx="12" cy="10" r="3"/>
</svg>

<!-- Building2 (Office) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
  <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
  <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
  <path d="M10 6h4"/>
  <path d="M10 10h4"/>
  <path d="M10 14h4"/>
  <path d="M10 18h4"/>
</svg>

<!-- Laptop (Remote) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>
</svg>

<!-- Home -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
</svg>
```

#### Red Zone Widget
```tsx
import { ArrowRight, AlertTriangle, X } from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `AlertTriangle` | Widget header | 16px | #EF4444 (Red 500) |
| `ArrowRight` | View details | 12px | #6B7280 (Gray 500) |
| `X` | Dismiss | 16px | #6B7280 (Gray 500) |

**Angular 9 SVGs:**
```html
<!-- AlertTriangle (Warning) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
  <path d="M12 9v4"/>
  <path d="M12 17h.01"/>
</svg>

<!-- ArrowRight (View Details) -->
<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12h14"/>
  <path d="m12 5 7 7-7 7"/>
</svg>
```

#### Quick Access Widget
```tsx
import { Pin, Clock, TrendingUp, ExternalLink, X } from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `Pin` | Widget header | 16px | #6B7280 (Gray 500) |
| `Clock` | Recent items | 16px | #9CA3AF (Gray 400) |
| `TrendingUp` | Trending | 16px | #10B981 (Green 500) |
| `ExternalLink` | Open link | 12px | #6B7280 (Gray 500) |
| `X` | Remove pin | 14px | #6B7280 (Gray 500) |

#### Task Overview Widget
```tsx
import { BarChart3 } from 'lucide-react';
```
| Icon | Usage | Size | Color |
|------|-------|------|-------|
| `BarChart3` | Widget header | 16px | #8B5CF6 (Purple 500) |

**Angular 9 SVG:**
```html
<!-- BarChart3 (Analytics) -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 3v18h18"/>
  <path d="M18 17V9"/>
  <path d="M13 17V5"/>
  <path d="M8 17v-3"/>
</svg>
```

---

## Icon Styling Patterns

### React (Tailwind)
```tsx
// Size classes (width × height)
<Icon className="w-3 h-3" />  // 12px
<Icon className="w-4 h-4" />  // 16px (most common)
<Icon className="w-5 h-5" />  // 20px
<Icon className="w-6 h-6" />  // 24px

// Color classes
<Icon className="text-[#FBBF24]" />  // Amber 400
<Icon className="text-[#6B7280]" />  // Gray 500
<Icon className="text-[#3B82F6]" />  // Blue 500
<Icon className="text-[#EF4444]" />  // Red 500

// Combined
<Icon className="w-4 h-4 text-[#FBBF24]" />

// Hover effects
<Icon className="w-4 h-4 text-[#6B7280] hover:text-[#374151]" />

// Opacity
<Icon className="w-4 h-4 text-[#6B7280] opacity-70" />
```

### Angular 9 (Inline Styles)
```html
<!-- Basic styling -->
<svg width="16" height="16" stroke="#FBBF24" stroke-width="2">...</svg>

<!-- With classes -->
<svg class="icon-medium text-amber-400" stroke="currentColor">...</svg>

<!-- Dynamic color -->
<svg [attr.stroke]="iconColor" width="16" height="16">...</svg>

<!-- Dynamic size -->
<svg [attr.width]="iconSize" [attr.height]="iconSize">...</svg>
```

---

## Size & Color Standards

### Standard Sizes
| Size Name | Pixels | Tailwind Class | Usage |
|-----------|--------|----------------|-------|
| Small | 12px | `w-3 h-3` | Inline text, metadata |
| Medium | 16px | `w-4 h-4` | **Most common** - Widget headers, buttons |
| Large | 20px | `w-5 h-5` | Prominent actions |
| X-Large | 24px | `w-6 h-6` | Page headers, main navigation |

### Standard Colors (Workdeck Palette)

#### Primary Colors
| Color Name | Hex | Usage |
|------------|-----|-------|
| Primary Blue | `#0066FF` | Primary actions, links |
| Blue 500 | `#3B82F6` | Secondary actions, info |
| Blue 600 | `#2563EB` | Hover states |

#### Widget Accent Colors
| Widget | Color | Hex |
|--------|-------|-----|
| Agenda (Calendar) | Amber 400 | `#FBBF24` |
| To-Do | Red 500 | `#EF4444` |
| Pending Approvals | Amber 500 | `#F59E0B` |
| FYI | Blue 500 | `#3B82F6` |
| Who's Where | Green 500 | `#10B981` |
| Red Zone | Red 500 | `#EF4444` |
| Task Overview | Purple 500 | `#8B5CF6` |

#### Neutral Colors
| Color Name | Hex | Usage |
|------------|-----|-------|
| Gray 800 | `#1F2937` | Primary text |
| Gray 500 | `#6B7280` | Secondary icons, muted actions |
| Gray 400 | `#9CA3AF` | Tertiary text, metadata icons |
| Gray 300 | `#D1D5DB` | Drag handles, disabled states |

#### Status Colors
| Status | Color | Hex |
|--------|-------|-----|
| Success | Green 500 | `#10B981` |
| Warning | Amber 500 | `#F59E0B` |
| Error | Red 500 | `#EF4444` |
| Info | Blue 500 | `#3B82F6` |

### Stroke Width
- **Standard:** `2px` (all icons)
- **Consistent:** Never change stroke-width for visual consistency

---

## Accessibility Guidelines

### React Implementation
```tsx
// Add aria-label for screen readers
<Calendar className="w-4 h-4" aria-label="Calendar" />

// Use aria-hidden for decorative icons
<ChevronRight className="w-4 h-4" aria-hidden="true" />

// Add title for tooltips
<Bell className="w-4 h-4" aria-label="Notifications">
  <title>Notifications</title>
</Bell>
```

### Angular 9 Implementation
```html
<!-- With aria-label -->
<svg width="16" height="16" role="img" aria-label="Calendar">
  <title>Calendar</title>
  <!-- SVG paths -->
</svg>

<!-- Decorative icon -->
<svg width="16" height="16" aria-hidden="true">
  <!-- SVG paths -->
</svg>

<!-- In button -->
<button aria-label="Open calendar">
  <svg width="16" height="16" aria-hidden="true">
    <!-- SVG paths -->
  </svg>
</button>
```

### Accessibility Checklist
- ✅ Add `aria-label` or `aria-labelledby` for meaningful icons
- ✅ Use `aria-hidden="true"` for decorative icons
- ✅ Ensure 4.5:1 contrast ratio (icon color vs background)
- ✅ Don't rely on color alone (use text labels)
- ✅ Icons in buttons should have text alternatives
- ✅ Use `<title>` element for SVG tooltips
- ✅ Test with screen readers (NVDA, JAWS, VoiceOver)

---

## Common Patterns

### Widget Headers (React)
```tsx
<div className="flex items-center gap-1.5">
  <Calendar className="w-4 h-4 text-[#FBBF24]" />
  <h3 className="text-[14px] font-medium text-[#1F2937]">Today</h3>
</div>
```

### Widget Headers (Angular 9)
```html
<div class="flex items-center gap-1.5">
  <svg width="16" height="16" stroke="#FBBF24" stroke-width="2" 
       fill="none" viewBox="0 0 24 24" class="flex-shrink-0">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
  <h3 class="text-sm font-medium text-gray-800">Today</h3>
</div>
```

### Action Buttons (React)
```tsx
<button className="p-0.5 hover:bg-[#F9FAFB] rounded transition-colors">
  <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
</button>
```

### Action Buttons (Angular 9)
```html
<button class="p-0.5 hover:bg-gray-50 rounded transition-colors">
  <svg width="16" height="16" stroke="#6B7280" stroke-width="2" 
       fill="none" viewBox="0 0 24 24">
    <path d="m15 18-6-6 6-6"/>
  </svg>
</button>
```

### Inline Icons (React)
```tsx
<div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
  <Clock className="w-3 h-3" />
  <span>2h</span>
</div>
```

### Inline Icons (Angular 9)
```html
<div class="flex items-center gap-1 text-xs text-gray-400">
  <svg width="12" height="12" stroke="currentColor" stroke-width="2" 
       fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
  <span>2h</span>
</div>
```

---

## All Icons Used in Workdeck

### Complete Alphabetical List
| Icon Name | Components Using It | Primary Color |
|-----------|---------------------|---------------|
| `AlertCircle` | PendingApprovalsWidget | #F59E0B |
| `AlertTriangle` | RedZoneWidget, AgencyTriage | #EF4444 |
| `ArrowRight` | RedZoneWidget, Various | #6B7280 |
| `ArrowUpRight` | TodoListWidget | #3B82F6 |
| `BarChart3` | TaskOverviewWidget | #8B5CF6 |
| `Bell` | FYIWidget, Navigation | #3B82F6 |
| `Building2` | WhosWhereWidget | #10B981 |
| `Calendar` | AgendaWidget, Input | #FBBF24 |
| `Check` | PendingApprovalsWidget | #FFFFFF |
| `CheckCircle` | Alerts | #10B981 |
| `CheckSquare` | TodoListWidget | #EF4444 |
| `ChevronDown` | Navigation, Dropdowns | #6B7280 |
| `ChevronLeft` | AgendaWidget | #6B7280 |
| `ChevronRight` | AgendaWidget, Navigation | #6B7280 |
| `ChevronUp` | TodoListWidget (Priority) | #DC2626 |
| `Clock` | TodoListWidget, QuickAccess | #9CA3AF |
| `DollarSign` | Spending, Triage | #10B981 |
| `ExternalLink` | QuickAccessWidget | #6B7280 |
| `Eye` | Input (show password) | #6B7280 |
| `EyeOff` | Input (hide password) | #6B7280 |
| `GripVertical` | TodoListWidget (Drag) | #D1D5DB |
| `Home` | WhosWhereWidget | #9CA3AF |
| `Info` | Alerts | #3B82F6 |
| `Laptop` | WhosWhereWidget | #3B82F6 |
| `Loader2` | Loading states | #0066FF |
| `MapPin` | WhosWhereWidget | #10B981 |
| `Menu` | Navigation | #1F2937 |
| `MoreHorizontal` | TodoListWidget | #9CA3AF |
| `MoreVertical` | Tables, Cards | #9CA3AF |
| `Pin` | QuickAccessWidget | #6B7280 |
| `Plus` | Add actions | #FFFFFF/#0066FF |
| `Search` | Navigation, Input | #6B7280 |
| `TrendingUp` | QuickAccessWidget | #10B981 |
| `Users` | Triage Dashboard | #6B7280 |
| `X` | Close, Dismiss, Reject | #6B7280/#FFFFFF |
| `XCircle` | Alerts (Error) | #EF4444 |
| `Zap` | Navigation | #FBBF24 |

---

## Quick Reference Card

### React Import
```tsx
import { IconName } from 'lucide-react';
<IconName className="w-4 h-4 text-[#FBBF24]" />
```

### Angular 9 Inline SVG
```html
<svg xmlns="http://www.w3.org/2000/svg" 
     width="16" height="16" 
     viewBox="0 0 24 24" 
     fill="none" 
     stroke="#FBBF24" 
     stroke-width="2" 
     stroke-linecap="round" 
     stroke-linejoin="round">
  <!-- Icon paths from lucide.dev -->
</svg>
```

### Standard Sizes
- 12px: `w-3 h-3` (inline text)
- **16px: `w-4 h-4` (most common)**
- 20px: `w-5 h-5` (prominent)
- 24px: `w-6 h-6` (headers)

### Standard Colors
- Primary: `#0066FF`
- Blue: `#3B82F6`
- Green: `#10B981`
- Red: `#EF4444`
- Amber: `#F59E0B` / `#FBBF24`
- Gray: `#6B7280` / `#9CA3AF`

---

## Resources

### Official Documentation
- **Lucide React:** https://lucide.dev/guide/packages/lucide-react
- **Icon Library:** https://lucide.dev/icons
- **GitHub:** https://github.com/lucide-icons/lucide

### Getting SVG Code
1. Visit https://lucide.dev/icons
2. Search for icon name (e.g., "calendar")
3. Click icon
4. Click "Copy SVG" button
5. Paste into Angular template or component

### Browser Support
- ✅ Chrome 4+
- ✅ Firefox 3+
- ✅ Safari 3.1+
- ✅ Edge (all versions)
- ✅ IE 9+ (with polyfills)

---

## Summary

### For React (Workdeck Current)
```tsx
import { Calendar } from 'lucide-react';
<Calendar className="w-4 h-4 text-[#FBBF24]" />
```

### For Angular 9 (Compatible Approach)
```html
<svg width="16" height="16" stroke="#FBBF24" stroke-width="2" 
     fill="none" viewBox="0 0 24 24">
  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
  <line x1="16" x2="16" y1="2" y2="6"/>
  <line x1="8" x2="8" y1="2" y2="6"/>
  <line x1="3" x2="21" y1="10" y2="10"/>
</svg>
```

**Key Takeaway:** While `lucide-angular` package requires Angular 15+, you can use the **raw SVG code** from lucide.dev in Angular 9 projects. Create a reusable icon component or service to manage the SVG strings, and you'll have the same clean icon system with full Angular 9 compatibility.
