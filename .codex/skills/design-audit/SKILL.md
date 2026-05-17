---
name: design-audit
description: Evaluate website, web app, landing page, or frontend implementation quality with a structured design audit and scoring grid. Use when Codex is asked to review UI design, visual hierarchy, UX, responsiveness, accessibility, performance perception, copy clarity, frontend polish, or to produce a design/frontend evaluation rubric for a URL, localhost app, screenshot, repository, or live page. Also use for re-audits that compare before vs after changes, track score deltas, and verify whether prior design/frontend issues were fixed.
---

# Design Audit

## Overview

Use this skill to inspect a website or frontend surface and produce a practical design audit: evidence, scores, concrete issues, and prioritized fixes. Prefer direct inspection of the running page whenever possible.

Use re-audit mode when the user asks to compare before/after, check improvements, re-run the audit after fixes, or verify whether a previous audit's issues were solved.

## Language

Match the user's language for the entire audit. Support English and Italian explicitly.

- If the user writes in Italian, write headings, table labels, statuses, priorities, verdicts, category notes, and fix sections in Italian.
- If the user writes in English, write the audit in English.
- If the user mixes languages, use the dominant language of the request.
- Keep preset IDs unchanged (`landing-page`, `saas-dashboard`, etc.) so prompts and comparisons remain stable.
- Keep standard frontend terms in English when they are clearer or commonly used: `CTA`, `focus state`, `keyboard navigation`, `layout shift`, `responsive`, `mock`, `hero`, `dashboard`.

Italian label mapping:

- `Overall` -> `Sintesi`
- `Scorecard` -> `Griglia`
- `Category Notes` -> `Note per Categoria`
- `Top Issues` -> `Problemi Principali`
- `Recommended Fixes` -> `Fix Consigliati`
- `Quick wins` -> `Fix Veloci`
- `Medium work` -> `Interventi Medi`
- `Deeper work` -> `Interventi Strutturali`
- `Re-Audit` -> `Rivalutazione`
- `Score Delta` -> `Delta Punteggi`
- `Fix Verification` -> `Verifica Fix`
- `Verification notes` -> `Note di Verifica`
- `Remaining Priorities` -> `Priorità Rimaste`
- `Next Fix Pass` -> `Prossimo Giro di Fix`
- `What works` -> `Cosa funziona`
- `What hurts` -> `Cosa penalizza`
- `Fix` -> `Fix`
- `Priority` -> `Priorità`
- `Confidence` -> `Confidenza`
- `Verdict` -> `Verdetto`
- `Excellent` -> `Eccellente`
- `Good` -> `Buono`
- `Needs work` -> `Da migliorare`
- `Weak` -> `Debole`
- `Critical` -> `Critico`
- `High` -> `Alta`
- `Medium` -> `Media`
- `Low` -> `Bassa`
- `Fixed` -> `Risolto`
- `Improved` -> `Migliorato`
- `Still open` -> `Ancora aperto`
- `Regressed` -> `Peggiorato`

## Workflow

1. Define the evaluation target:
   - Use the provided URL, localhost address, screenshot, or repository app.
   - If the target is local code, run the app when feasible and inspect it in a browser.
   - If only screenshots are available, state that interaction, responsive behavior, and runtime performance are partially inferred.
   - Select an audit preset before scoring. Infer it from the page/app when clear; otherwise ask the user to choose from a compact numbered list.

2. Gather evidence:
   - Inspect desktop and mobile widths at minimum.
   - Capture visible states relevant to the task: first viewport, navigation, primary flow, forms, modals, empty/loading/error states if available.
   - Check implementation details when repository access exists: semantic HTML, CSS organization, responsive constraints, component states, accessibility attributes, asset loading, and console errors.
   - Do not rely on visual impression alone when code or runtime inspection is available.

3. Score with the rubric:
   - Read `references/rubric.md` when producing a formal grid.
   - Apply the selected preset's emphasis and category choices.
   - Use 1-5 scores unless the user requests another scale.
   - Anchor each score to observed evidence, not generic best practices.
   - Call out uncertainty explicitly when a score depends on missing context.

4. Deliver the audit:
   - Start with the overall score and a short verdict.
   - Include a compact scorecard.
   - Include only the highest-impact notes and fixes by default.
   - When reviewing code, include file references for concrete frontend fixes.

## Output Length

Default to concise output. The audit should be useful at a glance, especially in chat and demos.

- Keep the verdict to 2-3 short sentences.
- Use 5-7 scorecard rows, not every possible rubric category.
- Show category notes only for the 3 weakest or highest-impact areas.
- Keep each category note to `What works`, `What hurts`, and `Fix`, one short sentence each.
- List at most 3 top issues.
- List at most 3 recommended fixes by default.
- Avoid long paragraphs and repeated evidence.
- Expand only if the user asks for a `deep audit`, `full audit`, `detailed report`, or `more detail`.

## Re-Audit Mode

When comparing before and after:

1. Identify the baseline:
   - Use the previous audit in the conversation when available.
   - If no previous audit is available, ask for the old audit, old screenshot, old URL, commit, branch, or written issue list. If the user cannot provide one, run a normal audit and state that deltas cannot be measured.

2. Reinspect the current target:
   - Use the same categories as the baseline when possible.
   - Inspect the same viewport types and flows where possible.
   - Separate real improvements from changes that only moved the problem elsewhere.

3. Report deltas:
   - Compare overall score and per-category scores.
   - Mark each prior issue as `Fixed`, `Improved`, `Still open`, or `Regressed`.
   - Localize status labels in the final output while keeping the underlying meaning stable.
   - Include new issues only after the before/after comparison.

Use this output shape for re-audits:

```markdown
**Re-Audit**
Previous score: X.X/5
Current score: X.X/5
Delta: +X.X

Verdict: ...

**Score Delta**
| Area | Before | After | Delta | Status |
|---|---:|---:|---:|---|
| Visual hierarchy | 3/5 | 4/5 | +1 | Improved |
| Accessibility | 3/5 | 3/5 | 0 | Still open |

**Fix Verification**
| Previous Issue | Status | Confidence |
|---|---|---|
| CTA hierarchy unclear | Fixed | High |
| Mobile spacing inconsistent | Improved | Medium |

Verification notes:
- CTA hierarchy unclear: ...
- Mobile spacing inconsistent: ...

**Remaining Priorities**
1. ...
2. ...
3. ...

**Next Fix Pass**
Quick wins:
- ...

Medium work:
- ...
```

Keep re-audits comparative. Do not repeat the full original audit unless the user asks for a fresh full audit.

Keep `Fix Verification` narrow. Do not put evidence paragraphs inside the table. Use the table only for issue, status, and confidence; put evidence in short bullets under `Verification notes`.

## Audit Presets

Use a preset to adapt the audit to the product type. Do not force the same criteria onto every site.

Available presets:

- `auto`: infer the best preset from the page, repository, URL, copy, and visible UI.
- `landing-page`: marketing pages, waitlists, product launches, SaaS homepages.
- `saas-dashboard`: admin panels, analytics, CRM, internal tools, operational products.
- `portfolio`: personal sites, agency sites, case-study collections.
- `ecommerce`: product pages, stores, checkout-oriented websites.
- `mobile-first`: mobile web apps, responsive experiences where mobile is primary.
- `accessibility-heavy`: audits where accessibility risk is the main concern.
- `general`: use when the target does not fit a specific preset.

Preset selection rules:

- If the user names a preset, use it.
- If the target clearly fits one preset, use it and mention `Preset: ...` in the output.
- If the target is ambiguous and the preset materially changes the audit, ask one short question before auditing:

```markdown
Which preset should I use? / Che preset vuoi usare?
1. landing-page
2. saas-dashboard
3. portfolio
4. ecommerce
5. mobile-first
6. accessibility-heavy
7. general
```

- If the user says to proceed without choosing, use `auto`.
- For re-audits, keep the same preset as the baseline unless the user explicitly changes it.

Preset emphasis:

- `landing-page`: purpose, conversion, CTA clarity, trust signals, copy, first viewport, visual hierarchy.
- `saas-dashboard`: information density, navigation, workflow efficiency, component states, data readability, keyboard/focus behavior.
- `portfolio`: identity, case-study clarity, project hierarchy, credibility, contact path, visual distinctiveness.
- `ecommerce`: product clarity, purchase path, pricing/shipping clarity, trust, product imagery, checkout friction.
- `mobile-first`: mobile layout, touch targets, mobile nav, responsive hierarchy, performance perception, thumb-friendly flows.
- `accessibility-heavy`: semantics, headings, labels, contrast, keyboard navigation, focus states, alt text, screen reader noise.
- `general`: balanced scoring across the core rubric.

## Scoring Rules

Use these meanings consistently:

- `5`: Strong, production-level execution with only minor refinements.
- `4`: Good execution with a few noticeable issues.
- `3`: Functional but inconsistent, generic, or missing important polish.
- `2`: Significant quality problems that affect comprehension, trust, or use.
- `1`: Broken, inaccessible, visually incoherent, or not fit for purpose.

Use decimal averages only for the overall score. Category scores should stay whole numbers unless the user asks for more granularity.

## Output Shape

For most audits, use this structure:

```markdown
**Overall**
Preset: auto / landing-page / saas-dashboard / portfolio / ecommerce / mobile-first / accessibility-heavy / general
Score: X.X/5
Verdict: Strong / Good / Mixed / Weak

Short verdict in 2-4 sentences.

**Scorecard**
| Area | Score | Level | Priority |
|---|---:|---|---|
| Visual hierarchy | 4/5 | Good | Medium |
| Accessibility | 3/5 | Needs work | High |

**Category Notes**

Visual hierarchy - 4/5 [Medium]
What works: ...
What hurts: ...
Fix: ...

Accessibility - 3/5 [High]
What works: ...
What hurts: ...
Fix: ...

**Top Issues**
1. ...
2. ...
3. ...

**Recommended Fixes**
1. ...
2. ...
3. ...
```

Keep the scorecard narrow. Do not put long evidence paragraphs inside table cells; long text makes chat tables hard to scan and can overflow horizontally. Put detailed evidence in `Category Notes` instead.

Keep the default response compact. Do not include quick wins, medium work, and deeper work sections unless the user asks for a deeper implementation plan.

Use `Level` labels consistently:

- `5/5`: `Excellent`
- `4/5`: `Good`
- `3/5`: `Needs work`
- `2/5`: `Weak`
- `1/5`: `Critical`

Localize `Level` labels with the language mapping above.

## Review Standards

Judge the site against its apparent purpose. A SaaS dashboard, portfolio, ecommerce product page, documentation site, game, and marketing page should not be scored with identical expectations.

Prioritize:

- Clarity of purpose in the first viewport.
- Visual hierarchy and scannability.
- Layout rhythm, spacing, alignment, and responsive behavior.
- Interaction quality: controls, states, feedback, navigation, forms.
- Accessibility: contrast, focus states, semantic structure, keyboard use, labels.
- Frontend implementation quality: maintainability, performance perception, asset handling, console/runtime issues.
- Content quality: copy clarity, information architecture, trust signals, calls to action.

Avoid:

- Recommending decorative redesigns without tying them to user comprehension or task success.
- Over-scoring attractive pages that are inaccessible, slow, or hard to use.
- Penalizing minimal design when it serves the product well.
- Producing vague advice such as "make it modern" without concrete changes.

## Resources

- `references/rubric.md`: Detailed scoring categories and evidence prompts.
