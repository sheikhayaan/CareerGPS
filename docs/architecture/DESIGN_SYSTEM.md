# Design System & UI/UX Standards

## 1. Design Tokens & Visual Hierarchy

CareerGPS employs a dark-first SaaS aesthetic inspired by modern engineering tools and financial intelligence terminals (e.g. Linear, Stripe, Vercel).

### Core Color Palette

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `Background` | `#080B14` | Primary viewport background |
| `Background Secondary` | `#101625` | Section wrappers and canvas cards |
| `Surface` | `#161E30` | Interactive card surfaces |
| `Surface Hover` | `#1E293B` | Hover and active elevation |
| `Primary` | `#6366F1` | Brand indigo, call-to-action buttons |
| `Accent` | `#06B6D4` | Cyan highlight, knowledge graph nodes |
| `Success` | `#10B981` | Completed tasks, verified benchmarks |
| `Warning` | `#F59E0B` | Above-market salary sanity alerts |
| `Error` | `#EF4444` | Form errors, missing prerequisites |
| `Text Primary` | `#F8FAFC` | Headings and high-contrast labels |
| `Text Secondary` | `#94A3B8` | Subtitles, tooltips, metadata |

---

## 2. Component System (`@/components/ui`)

- **`<Button />`**: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) with loading spinners and accessible focus rings.
- **`<Card />`**: Elevated surfaces with border treatments (`border-slate-800/80`) and subtle hover lighting.
- **`<Badge />`**: Semantic micro-tags for skill proficiencies, data sufficiency warnings, and job market metrics.
- **`<Skeleton />`**: Pulsing placeholder loaders preventing cumulative layout shifts (CLS) during asynchronous fetches.

---

## 3. Accessibility Standards & Reduced Motion

- **WCAG 2.1 AA Compliance**: All text tokens maintain at least 4.5:1 contrast against `#080B14` and `#101625`.
- **Keyboard Navigation**: All interactive elements (tabs, checkboxes, range sliders) support tab indexing and explicit `focus:ring-2` focus states.
- **Reduced Motion**: Chart animations and drawer transitions respect the CSS media feature `prefers-reduced-motion: reduce`.
