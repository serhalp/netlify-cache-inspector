# Product

## Register

product

## Users

Netlify developers, support engineers, and framework authors debugging HTTP caching. They arrive with a specific URL and a specific question: why is this page not cached, why is it stale, why does the CDN and the browser disagree? They are in a task, usually with docs open in another tab, and often comparing two runs side by side.

## Product Purpose

Inspect a Netlify site's response headers with debug logging enabled and explain what each cache layer did: cache status, TTLs, stale-while-revalidate windows, who served the response, and likely misconfigurations. Success is a user leaving with a correct mental model of their cache behavior and a concrete next action.

## Brand Personality

Technical, precise, calm. Netlify-adjacent (teal accent) without being promotional. Dense but legible, like a good network inspector. It should read as a tool built by someone who understands caching, not a dashboard template.

## Anti-references

- Generic SaaS dashboards with decorative cards and empty metrics.
- Marketing-style callouts and badges that compete with the data.
- Terminal cosplay: monospace everywhere, neon-on-black, cryptic abbreviations.
- Alarmist color: every stale value red, every warning a full-width banner.
- Abbreviations without an explanation within reach.

## Design Principles

1. Data first, chrome quiet. Labels and values carry the weight; decoration stays out of the way.
2. One vocabulary. A state looks the same wherever it appears: same chip, same tone, same wording.
3. Explain in place. Abbreviations and jargon get a tooltip or an inline expansion, not a docs trip.
4. State is never color alone. Text, icon, or both carry the meaning; color reinforces it.
5. Density with rhythm. Keep the compact row grid; do not turn rows into prose blocks.

## Accessibility & Inclusion

WCAG 2.2 AA: 4.5:1 body text, 3:1 large text, visible focus rings, keyboard reachable tooltips, 200% zoom without horizontal scrolling. Status meanings are conveyed with text, not color alone. Dark mode has equivalent contrast. No motion required to understand state.
