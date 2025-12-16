# FPL Draft Stats - Style Guide

**Design Direction:** Scientific Data Lab
**Inspiration:** Helix_Lab website
**Created:** 2025-12-15

---

## 1. Color Palette

### Primary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f8f8f6` | Off-white canvas, main page background |
| `--foreground` | `#1a1a1a` | Primary text, headlines |
| `--accent` | `#00a89d` | Stats highlights, interactive elements, key data |
| `--accent-foreground` | `#ffffff` | Text on accent backgrounds |

### Supporting Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--muted` | `#f0f0ee` | Card backgrounds, subtle sections |
| `--muted-foreground` | `#6b6b6b` | Secondary text, labels, descriptions |
| `--border` | `#e2e2e0` | Card borders, dividers |
| `--card` | `#ffffff` | Card surfaces |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#22c55e` | Positive stats, wins, gains |
| `--destructive` | `#ef4444` | Negative stats, losses |
| `--pattern` | `#00a89d` at 10% opacity | Dot-matrix texture fills |

---

## 2. Typography

### Font Stack

```
Headline:  Playfair Display (serif)
Labels:    JetBrains Mono (monospace)
Body:      Inter (sans-serif)
```

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap');
```

### Type Scale

| Element | Font | Size | Weight | Style |
|---------|------|------|--------|-------|
| Page Title | Playfair Display | 48px / `text-5xl` | 700 | Normal |
| Section Heading | Playfair Display | 32px / `text-3xl` | 600 | Normal |
| Card Title | Playfair Display | 24px / `text-2xl` | 600 | Normal |
| Stat Number | JetBrains Mono | 48px / `text-5xl` | 700 | Normal |
| Stat Label | JetBrains Mono | 12px / `text-xs` | 400 | Uppercase, tracking-wider |
| Tab/Nav Label | JetBrains Mono | 14px / `text-sm` | 500 | Uppercase, tracking-wide |
| Body Text | Inter | 16px / `text-base` | 400 | Normal |
| Small/Caption | Inter | 14px / `text-sm` | 400 | Normal |

### Typography Rules

1. **Headlines** - Playfair for all major headings
2. **Data Labels** - Always monospace, always uppercase with letter-spacing
3. **Numbers** - Large stats use monospace
4. **Body** - Inter for readability in paragraphs
5. **No emoji** - Use Lucide line icons instead

---

## 3. Visual Elements & Patterns

### Dot-Matrix Pattern

```css
.dot-pattern {
  background-image: radial-gradient(#00a89d 1px, transparent 1px);
  background-size: 8px 8px;
  opacity: 0.08;
}
```

### Pattern Usage

| Location | Application |
|----------|-------------|
| Hero/Header area | Full-width pattern band behind title |
| Card accents | Small pattern strip on left edge (4px wide) |
| Section dividers | Horizontal pattern bar between major sections |
| Empty states | Subtle pattern fill behind placeholder content |

### Accent Bar

Vertical teal bar indicating importance:

```css
.accent-bar {
  width: 4px;
  background-color: var(--accent);
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
}
```

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-section` | 64px | Between major page sections |
| `--space-card` | 24px | Card internal padding |
| `--space-stack` | 16px | Between stacked elements |
| `--space-inline` | 8px | Between inline elements |

### Border Radius

- Cards: `4px`
- Buttons: `4px`
- Badges: `2px`

---

## 4. Component Styles

### Hero Stats Row

```
┌─────────────────────────────────────────────────────────────┐
│ ▌ 1,247        ▌ 89.3         ▌ 12           ▌ GW 15       │
│   TOTAL PTS      AVG SCORE      MANAGERS        CURRENT     │
└─────────────────────────────────────────────────────────────┘
```

**Specs:**
- Container: Off-white background (`--muted`), no border
- Each stat: Teal accent bar left (4px), stat number in JetBrains Mono 48px
- Label: Monospace uppercase, 12px, muted color, tracking-wider
- Layout: Horizontal row on desktop, 2x2 grid on mobile

**Implementation:**

```svelte
<div class="grid grid-cols-2 md:grid-cols-4 gap-6 bg-muted p-6">
  <div class="relative pl-4 border-l-4 border-accent">
    <div class="font-mono text-5xl font-bold text-foreground">1,247</div>
    <div class="font-mono text-xs uppercase tracking-wider text-muted-foreground">Total Pts</div>
  </div>
  <!-- repeat for other stats -->
</div>
```

### Cards

**Specs:**
- Background: White (`--card`)
- Border: 1px `--border`
- Radius: 4px
- Padding: 24px
- Shadow: None (flat design)

```svelte
<Card.Root class="bg-card border border-border rounded shadow-none">
  <Card.Header>
    <Card.Title class="font-serif text-2xl font-semibold">
      League Standings
    </Card.Title>
    <Card.Description class="font-sans text-sm text-muted-foreground">
      Updated gameweek 15
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <!-- content -->
  </Card.Content>
</Card.Root>
```

### Tabs/Navigation

- Monospace uppercase labels
- No background on inactive tabs
- Active tab: Teal underline (2px) + teal text
- Use Lucide icons instead of emoji

```svelte
<Tabs.Trigger class="font-mono text-sm uppercase tracking-wide data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent">
  <ChartLine class="w-4 h-4 mr-2" />
  Overview
</Tabs.Trigger>
```

---

## 5. Data Display Components

### Tables

**Specs:**
- Header: Monospace uppercase, 12px, muted color, tracking-wider
- Cells: Inter 14px, subtle row borders
- Row hover: `--muted` background
- Alternating rows: Off
- Number columns: Right-aligned, monospace

```svelte
<Table.Head class="font-mono text-xs uppercase tracking-wider text-muted-foreground">
  Rank
</Table.Head>
<Table.Cell class="font-mono text-right">847</Table.Cell>
```

### Badges/Tags

| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| Default | `--muted` | `--foreground` | Position tags (GK, DEF, MID, FWD) |
| Accent | `--accent` | white | Highlighted stats, current GW |
| Success | `#dcfce7` | `#166534` | Points gained, wins |
| Destructive | `#fee2e2` | `#991b1b` | Points lost, losses |

**Specs:** Monospace, uppercase, 11px, 2px radius, padding 4px 8px

### Form Indicators

Win/Loss dots:
- Win: Filled teal circle (`--accent`)
- Loss: Empty circle with border
- Draw: Gray filled circle

---

## 6. Implementation Checklist

### Files to Modify

- [ ] `src/app.css` - Color tokens, fonts, patterns, utilities
- [ ] `src/routes/+page.svelte` - Hero stats row, remove emojis
- [ ] `src/routes/+layout.svelte` - Font imports
- [ ] `src/lib/components/ui/*` - Update component defaults
- [ ] All component files - Apply new typography classes

### Key Transformations

1. Remove emojis → Lucide icons
2. Remove gradient background → Flat off-white
3. Remove FPL colors → Teal accent system
4. Add monospace labels → All data labels uppercase mono
5. Add dot patterns → Header and card accents
6. Sharpen corners → 4px radius
7. Add hero stats row → Top of overview page

---

## 7. Tailwind Configuration

Add to `app.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap');

@theme inline {
  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Playfair Display', serif;
  --font-mono: 'JetBrains Mono', monospace;

  --color-background: #f8f8f6;
  --color-foreground: #1a1a1a;
  --color-accent: #00a89d;
  --color-accent-foreground: #ffffff;
  --color-muted: #f0f0ee;
  --color-muted-foreground: #6b6b6b;
  --color-border: #e2e2e0;
  --color-card: #ffffff;
  --color-card-foreground: #1a1a1a;
  --color-success: #22c55e;
  --color-destructive: #ef4444;

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 4px;
}

@layer utilities {
  .dot-pattern {
    background-image: radial-gradient(var(--color-accent) 1px, transparent 1px);
    background-size: 8px 8px;
  }

  .label {
    @apply font-mono text-xs uppercase tracking-wider text-muted-foreground;
  }

  .stat-number {
    @apply font-mono text-5xl font-bold text-foreground;
  }

  .accent-bar {
    @apply border-l-4 border-accent pl-4;
  }
}

@layer base {
  body {
    @apply bg-background text-foreground font-sans;
  }

  h1, h2, h3 {
    @apply font-serif;
  }
}
```
