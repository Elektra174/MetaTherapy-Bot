# MPT Therapist Chatbot Design Guidelines

## Design Approach

**Selected Approach**: Design System - Material Design 3  
**Justification**: Therapeutic application requiring trust, professionalism, and information clarity. Material Design 3 provides excellent text hierarchy, calm aesthetics, and proven patterns for conversational interfaces.

**Reference Inspirations**: Notion (clean information architecture), Linear (professional minimalism), BetterHelp (therapeutic trust-building)

**Core Principles**:
- Professional therapeutic environment
- Calm, distraction-free reading experience
- Clear information hierarchy for therapeutic scripts
- Trust and reliability through consistency

---

## Typography

**Font Families** (Google Fonts):
- Primary: Inter (400, 500, 600) - exceptional readability for chat messages and therapeutic content
- Secondary: Source Serif 4 (400, 600) - for therapeutic script quotations and emphasis

**Type Scale**:
- Chat Messages: text-base (16px) / leading-relaxed
- Therapist Responses: text-base / leading-loose for comfort
- Section Headers: text-2xl / font-semibold
- Session Titles: text-lg / font-medium
- Meta Info (timestamps, status): text-sm / text-gray-600
- Script Quotations: text-base / font-serif / italic

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card/message gaps: gap-4
- Major layout spacing: py-12, py-16

**Container Strategy**:
- Max width: max-w-5xl for main chat area
- Sidebar: w-64 or w-80 for session history
- Messages: max-w-3xl for optimal reading

---

## Component Library

### A. Layout Structure

**Main Layout**:
- Two-column: Sidebar (session history) + Main chat area
- Responsive: Stack vertically on mobile with hamburger menu
- Sticky header with app title "МПТ Терапевт" and mode switcher

**Sidebar**:
- Session list with timestamps
- New session button (prominent)
- Search/filter sessions
- Settings/knowledge base access

### B. Chat Interface

**Message Structure**:
- User messages: Right-aligned, subtle background, rounded corners (rounded-2xl)
- Therapist messages: Left-aligned, distinct background, avatar icon
- Streaming indicator: Subtle pulsing dots
- Timestamp on hover: text-xs / opacity-60

**Input Area**:
- Multi-line textarea with auto-expand
- Send button: Icon button with clear affordance
- Character counter if needed
- Subtle border-top separator

### C. Session Analysis Mode

**Analysis Panel**:
- Split view: Original session transcript + AI analysis
- Highlight key therapeutic moments
- Script references with expandable details
- Actionable insights in card format

### D. Knowledge Base Display

**Script Cards**:
- Title, description, usage context
- Expandable full script view
- Tags for categorization (Исследование стратегии, Работа с телом, etc.)
- Search with highlighting

### E. Navigation

**Top Bar**:
- Logo/Title (left)
- Mode tabs: "Сессия" / "Анализ сессий" / "База знаний"
- Settings icon (right)

### F. Forms & Inputs

**Session Metadata Input**:
- Session title field
- Date/time picker
- Client notes (optional textarea)
- Tags/categories selector

---

## Visual Elements

**Cards**: 
- Subtle shadow (shadow-sm), rounded-lg borders
- Hover: shadow-md transition

**Buttons**:
- Primary (start session): Solid background, rounded-lg, px-6 py-3
- Secondary (cancel, view): Outlined, same padding
- Icon buttons: Square, rounded-md, p-2

**Badges** (for script tags):
- Small, rounded-full, px-3 py-1, text-xs

**Dividers**:
- Subtle horizontal rules between message groups
- Use sparingly for temporal separation (new day)

---

## Chat Experience

**Message Flow**:
- Generous vertical spacing (space-y-6) between message exchanges
- Group messages by time (5min threshold)
- Date separators for multi-day sessions

**Therapeutic Script Integration**:
- When therapist references script: Inline expandable quote card
- Script name in small caps above quote
- Subtle left border accent

**Status Indicators**:
- Session active: Green dot + "Активная сессия"
- Analyzing: Amber spinner
- Completed: Checkmark icon

---

## Accessibility

- WCAG AA contrast ratios minimum
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- Keyboard navigation: Tab through messages, Ctrl+Enter to send
- Screen reader labels on icons
- Scalable text (rem units)

---

## Special Features

**Session Insights Panel** (collapsible sidebar):
- Current therapeutic phase indicator
- Detected needs/patterns
- Suggested follow-up questions
- Referenced scripts counter

**Export Functionality**:
- Download session as formatted document
- Include therapist analysis
- Privacy notice for GDPR compliance

---

## Responsive Behavior

**Desktop (1024px+)**: 
- Full sidebar visible
- Max-width chat area centered

**Tablet (768px-1023px)**:
- Collapsible sidebar (toggle)
- Slightly narrower chat width

**Mobile (<768px)**:
- Hidden sidebar, accessible via menu
- Full-width messages
- Sticky send button at bottom

---

## Images

**No large hero images** - this is a functional tool, not a marketing page.

**Small illustrative elements**:
- Therapist avatar: Simple, professional illustration (not photo)
- Empty state illustrations: Calming abstract shapes when no sessions exist
- Icons: Heroicons for consistency throughout (outline style)

**Placement**:
- Therapist avatar: 40x40px circle, left of therapist messages
- Empty states: Centered, max 200px height, with helpful onboarding text below