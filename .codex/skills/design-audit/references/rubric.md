# Design Audit Rubric

Use this reference when producing a formal design/frontend scorecard. Select categories that fit the target; do not force irrelevant categories.

## Preset Category Guidance

Use these category sets as defaults, then adjust to the observed product.

| Preset | Primary Categories |
|---|---|
| landing-page | Purpose and positioning, Visual hierarchy, Conversion quality, Trust signals, Copy quality, Performance perception |
| saas-dashboard | Dashboard ergonomics, Layout and composition, Interaction design, Accessibility, Frontend implementation, Production polish |
| portfolio | Brand and visual distinctiveness, Editorial quality, Content and information architecture, Visual hierarchy, Trust signals, Contact path |
| ecommerce | Product clarity, Conversion quality, Trust signals, Interaction design, Performance perception, Accessibility |
| mobile-first | Responsive behavior, Touch target quality, Mobile navigation, Performance perception, Visual hierarchy, Accessibility |
| accessibility-heavy | Accessibility, Semantic structure, Keyboard navigation, Focus states, Contrast, Alt text and screen reader noise |
| general | Purpose and positioning, Visual hierarchy, Layout and composition, Interaction design, Accessibility, Frontend implementation |
| auto | Infer from the target and state the selected preset in the audit |

If a preset-specific category is not in the core scorecard table, define it briefly in the audit using observed evidence.

## Core Scorecard

Keep the scorecard compact. Use this full rubric to decide scores, then summarize with a narrow table:

| Area | Score | Level | Priority |
|---|---:|---|---|
| Visual hierarchy | 4/5 | Good | Medium |

Put evidence and fixes below the table as category notes. Avoid tables with long evidence columns.

| Area | What to Evaluate | Evidence to Look For |
|---|---|---|
| Purpose and positioning | Whether the page communicates what it is, who it is for, and what the user should do next | First viewport, headline, navigation labels, CTA clarity, user journey |
| Visual hierarchy | Whether important elements stand out in the right order | Type scale, contrast, spacing, grouping, layout density, focal points |
| Layout and composition | Whether the page feels organized, balanced, and responsive | Grid, alignment, whitespace, section rhythm, mobile wrapping, overflow |
| Interaction design | Whether controls and flows are understandable and complete | Buttons, forms, hover/focus states, disabled/loading/error states, navigation |
| Accessibility | Whether the interface is usable with assistive tech and keyboard input | Semantic HTML, labels, alt text, contrast, focus indicators, target sizes |
| Frontend implementation | Whether the code supports reliable, maintainable UI behavior | Component structure, CSS patterns, responsive constraints, console errors, asset loading |
| Performance perception | Whether the UI feels fast and stable | Loading behavior, layout shift, image weight, animations, blocking scripts |
| Content and information architecture | Whether copy and structure help users decide and act | Labels, microcopy, section ordering, trust signals, pricing/details clarity |
| Brand and visual distinctiveness | Whether the visual system is coherent and appropriate | Palette, typography, imagery, iconography, consistency, memorability |
| Production polish | Whether the UI handles edge cases and feels finished | Empty states, error states, long text, mobile nav, form validation, browser quirks |

## Optional Categories

Use these when relevant:

| Area | Use When |
|---|---|
| Conversion quality | Landing pages, ecommerce, lead generation, signup flows |
| Dashboard ergonomics | Admin tools, analytics, CRMs, operational interfaces |
| Editorial quality | Blogs, magazines, documentation, portfolios |
| Game UI quality | Browser games or interactive entertainment |
| Motion and feedback | Sites with animation, transitions, drag/drop, realtime UI |
| Design system consistency | Products with multiple pages, components, or themes |

## Priority Labels

- `High`: Blocks comprehension, trust, accessibility, or core task completion.
- `Medium`: Noticeably weakens quality or creates repeated friction.
- `Low`: Refinement that improves polish but does not block use.

## Presentation Rules

- Use a compact scorecard for quick scanning.
- Use category notes for detail: `What works`, `What hurts`, `Fix`.
- Use clear `Level` labels instead of ASCII score bars.
- Default to a concise audit: 5-7 scorecard rows, 3 category notes, 3 top issues, and 3 recommended fixes.
- Limit each category note to 3 short lines unless the user asks for a deep audit.
- Put the most important category notes first, not necessarily the highest scores.
- Avoid long paragraphs and repeated evidence in default audits.
- Expand only for explicit requests such as `deep audit`, `full audit`, `detailed report`, or `more detail`.
- Use the user's language for all user-facing headings, table labels, priorities, statuses, and category-note labels.
- Keep preset IDs unchanged even in non-English audits.
- For Italian, use natural labels such as `Sintesi`, `Griglia`, `Note per Categoria`, `Problemi Principali`, `Fix Consigliati`, `Alta`, `Media`, `Bassa`, `Risolto`, `Migliorato`, `Ancora aperto`, and `Peggiorato`.

## Re-Audit Comparison Rules

Use these rules when comparing before and after changes:

- Keep category names consistent with the baseline audit when possible.
- Use score deltas only when the baseline has comparable scores.
- Use `+1`, `0`, `-1`, etc. for category deltas.
- Mark prior issues with one of: `Fixed`, `Improved`, `Still open`, `Regressed`.
- Localize these status labels in the final audit when the user's language is not English.
- Treat an issue as `Fixed` only when the observed current UI/code directly resolves the previous problem.
- Treat an issue as `Improved` when the direction is better but polish, accessibility, clarity, or consistency still needs work.
- Treat an issue as `Regressed` when the new version creates a worse user-facing or implementation problem.
- Add new issues in a separate section so the before/after comparison stays clear.
- Keep re-audit tables narrow. `Fix Verification` tables should use only `Previous Issue`, `Status`, and `Confidence`.
- Put evidence below the table as short bullets under `Verification notes`; do not place long sentences in table cells.

## Evidence Prompts

Ask these while auditing:

- Can a new visitor understand the value in five seconds?
- Is the next action obvious without reading every paragraph?
- Does mobile preserve the same hierarchy and task flow?
- Do buttons and form fields have complete states?
- Does text ever overflow, overlap, or become too small?
- Are images meaningful, sharp, and sized correctly?
- Are color and typography choices serving the product category?
- Can the page be navigated by keyboard?
- Are console errors or failed network assets visible?
- Does the implementation make future UI work easier or harder?

## Suggested Summary Language

Use direct, non-generic verdicts:

- "The page is visually coherent but undersells the product in the first viewport."
- "The UI looks polished at desktop size but breaks hierarchy on mobile."
- "The design direction is strong; the main risk is interaction completeness."
- "The frontend works, but spacing, states, and accessibility need a focused cleanup pass."
