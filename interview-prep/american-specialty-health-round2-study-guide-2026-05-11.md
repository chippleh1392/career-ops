# American Specialty Health — Round 2 study guide (from Haley’s debrief + prep)

**For:** Cristofer — Front End Engineer II process, panel + coding-style round (per Ivana / Haley / prior candidates).  
**Sources:** Haley’s forwarded **prior-candidate panel notes** (two write-ups) + her earlier **topic checklist** (behavioral + a11y/SEO/perf + React/JS fundamentals).  
**Created:** 2026-05-11.

**Related docs:** [Panelist dossier](./american-specialty-health-panelist-dossier-2026-05-11.md) · [Main ASH prep](./american-specialty-health-frontend-engineer.md) · [Question bank](./american-specialty-health-frontend-engineer-question-bank.md) · **Life OS handbook:** [React debugging in practice](../../life-os/life-os/knowledge/frontend/react-debugging/index.md) (hooks, keys, Network-first triage, deploy skew — matches prior-candidate “fix React + DevTools” notes below)

---

## Prior candidate notes (raw, from Haley’s forward — formatted)

**Attribution:** Second-hand via **Haley Foxworth** (Eliassen); **two anonymous** candidate write-ups from the same email thread as your prep. Only **structure** (headings, lists, line breaks) was added; wording follows the forward unless noted.

**Conflict to flag:** In an **earlier** message in that thread, Haley described this round as having **“No live Coding”** — that **contradicts** the detailed write-ups below, which mention a **live coding / debugging exercise**. Treat both as **signals**, not guarantees.

### Write-up A — “panel interview”

- **Panel size:** **5 people** total (**3 frontend**, **2 managers**).
- **Format:** Mix of **technical and behavioral**; **well organized**; **back and forth** between the two.

**Technical (as reported):**

- Explanation of **recent project** and **challenges faced**.
- **What is a component**, and **advantages / disadvantages** vs using **global styles** for shared look & feel.
- **Data table with incorrect data** — walk through **debugging process** and **tools**: what could cause bad data → **Chrome DevTools → Network** for the payload → check **keys** and **transform functions** if data is actually correct.
- Why an **`<a>`** element might **not behave as intended** in an **SPA**.
- Given a **function + arguments** — determine if output is **true or false** (logic / coercion style).
- **SSR vs SPA** — **differences**, **advantages / disadvantages**.
- **Coding exercise:** debug why a **list didn’t update** when elements were added — root causes were **wrong `key`** and **array change detection** issues.

**Behavioral (as reported):**

- Wrong / **incorrect decision** (your story).
- **Ideal remote collaboration**.
- How you worked with a team on **final architectural decisions**.
- **Greatest weakness**.

**Closing (candidate A):** Straightforward, **not tricky**; they care **how you work with a team** — have **detailed examples** ready for **follow-ups**.

---

### Write-up B — “panel interview”

- **Panel size:** **4 people** — **hiring manager** + **3 frontend engineers**.
- **Opening:** Intros; candidate mentioned **React** experience. Company is **migrating Ember → React**; interview **emphasized JavaScript fundamentals**.

**Technical (as reported):**

- **~10 JavaScript “trivia” questions** — whether expressions are **truthy or falsy**. Example values mentioned: `''`, `0`, `1`, `' '` (string with one space), `[]`, `{}`, `[0]`, `[1]`, `[{}]`.
- **Non-functional React component** — fix it; used **console** + **Network** tab; focused on **React hooks** (**`useEffect`**, **`useState`**) and troubleshooting.
- **Basic React form** — **suggestions** only (conversational, no direct code edits): e.g. **accessibility**, **comments** for devex, **memoization (`useMemo`)** for inefficient bits.
- **`<a>` in SPA** — does it cause **full page refresh**? Plain anchors **do** refresh; contrast with **react-router / Next.js** navigation model.
- **Mistake story** — show **learning / growth**; **don’t** badmouth companies or coworkers.
- **Process gap** — example of noticing a gap; candidate used **POCs** + **meetings** for feedback before rolling out change. **Heavy on team collaboration** — bring **team** stories.

**Other question examples (same forward, listed in-line):**

- Explain **`filter` & `reduce`**
- **Architecturally**, what would you do **differently** in your last project?
- **Walk through unit testing**
- Asked about **`diffusion`**, **`foreach`**, **`reduce`** *(likely transcription noise — possibly **diffing / forEach / reduce**; see **Track A § A.4** below)*

---

### Recruiter commentary on other candidates (same forward — not a third candidate transcript)

**Positive signals mentioned:** Could talk through work, answered specific questions, **great communication**, **knows JS**, **explained thinking on challenges** well, **communicator and team player**.

**Negative pattern mentioned:** On tech, **kept going back to React** when asked about **non-React JS** and didn’t show command of the **concepts** asked; **couldn’t go deep** on **architectural decisions** for their own work. **Panel asks harder concepts** and **how you think through problems**.

**On resume metrics (% improvement claims):** Haley likes **outcomes**, not only tasks/tech — but many candidates with **% increases** can’t explain **what drove the number**, **how it was measured**, or **what they personally identified vs executed from a ticket** (e.g. “50% faster by class → function components” without owning **diagnosis + measurement + causality**). If you can’t discuss **identify → measure → why that %** in detail, it’s harder to trust you can **repeat** that impact at ASH.

---

## 1. Meta: Is Haley describing the “coding test” or the “panel”?

**Short answer:** She’s summarizing **what past candidates experienced in the same round-2-style interview** — not a secret second agenda. She **does not** have the literal rubric for *your* session.

**Why it feels merged:** Both prior write-ups describe **one interview** that already included **technical + behavioral** and explicitly mention a **coding / debugging exercise** *in the same flow* as the panel (5 or 4 people). That matches **one Teams block with many attendees**: not “coding alone, then a totally different panel,” but **one session** that can include **shared-screen work** plus **round-robin questions**.

**Haley’s “coding test then panel” wording:** Treat as **recruiter paraphrase** / ASH still aligning internally. **Practical prep:** assume **round 2 = panel + hands-on JS/React signal in one sitting** unless they send a **separate** async link (HackerRank, etc.).

**Guess at “the” coding test (speculative):** ASH’s stack history is **Ember → React**; prior notes emphasize **JS fundamentals**, **truthy/falsy**, **fix a broken React component** (hooks), **list/key/immutability bug**, **DevTools / Network tab**, **SPA navigation**. So the live portion is more likely **debugging / small React repair / predict output** than **LeetCode hards**. See **Track C § C.1**.

---

## 2. How to use this doc

| Column | Meaning |
|--------|--------|
| **Topic** | What came up in Haley’s material |
| **You should know** | Minimum bar |
| **Answer skeleton** | How to respond out loud or on a shared editor — **personalize** with DYODE / Shopify / CS degree (NEIU) specifics |

---

## 3. Study map — five tracks (macro categories)

All prep below is grouped into **five tracks**. Prep **Track A + B** first if you want the biggest “not only React” lift before drilling React-only edge cases.

| Track | What it covers | Prep order hint |
|-------|----------------|-----------------|
| **A — JavaScript core** | Coercion / truthy-falsy, **arrays + iteration** (`filter` / `reduce` / `forEach`), **object merge**, debrief typo (“diffusion” → diffing?); **broader language fundamentals** possible (see **A.5**) | **1st** — fast signal / elimination lane |
| **B — Web platform & architecture** | **Components vs global CSS**, **`<a>` in SPA**, **SSR vs SPA**, **wrong-table / API→UI debugging**; **broader web-platform / “systems for UI”** topics possible (see **B.5**) | **2nd** — conceptual + “how you think” |
| **C — React & live exercise** | **Likely live-debug shapes**, **hooks / keys / immutability / forms / perf** | **3rd** — matches product stack |
| **D — Quality & product craft** | **Unit testing walkthrough**, **a11y**, **perf/CWV**, **SEO** | **4th** — Haley checklist + ASH culture |
| **E — Behavioral & communication** | STAR themes, **weakness / mistake / process gap**, **remote collab**, **metrics you can defend** | **Parallel** — stories on flash cards |

**End of doc:** [Checklist by track](#checklist-by-track) (replaces the old long linear list).

---

## Track A: JavaScript core

**Scope:** The write-ups called out **specific** topics (truthy/falsy, `filter`/`reduce`, merge collisions, garbled “diffusion/forEach/reduce”). In the real loop, **anything under “language fundamentals”** is fair game — the debrief is a **sample**, not a **closed syllabus**. **§ A.5** lists **adjacent** topics that often still get tested in the same lane.

### A.1 Truthy / falsy & “trivia” values

**From debrief:** Values like `''`, `0`, `1`, `' '` (space), `[]`, `{}`, `[0]`, `[1]`, `[{}]` — “10 JS trivia questions” style.

#### You should know

- **Falsy in JS (classic list):** `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`.  
- **Everything else is truthy** — including **`"0"`**, **`"false"`** (strings), **`[]`**, **`{}`**, **`new Boolean(false)`** (object wrapper is truthy even if boxed value is false).

#### Quick reference (common traps)

| Expression | Result | Why |
|------------|--------|-----|
| `Boolean('')` | `false` | empty string falsy |
| `Boolean(' ')` | `true` | non-empty string |
| `Boolean(0)` | `false` | |
| `Boolean([])` | `true` | object |
| `Boolean({})` | `true` | object |
| `[].toString()` | `""` | join of empty → empty string |
| `{}.toString()` | `"[object Object]"` | truthy string if coerced in string context |
| `[] == false` | `true` | loose equality; `[]` → `""` → `0` |
| `[] === false` | `false` | |
| `if ([])` | enters block | array is truthy |

#### Answer skeleton

> “In JavaScript I treat **falsy** as the fixed seven values. **Arrays and objects are always truthy** even when empty, which surprises people when they do `if (arr)` vs checking `arr.length`. For comparisons I default to **`===`**, explicit **`.length > 0`**, **`Array.isArray`**, or **`??` / optional chaining** so I don’t rely on implicit coercion.”

**Practice:** Write predictions for: `'' == 0`, `[] == 0`, `'0' == 0`, `null >= 0`, `typeof null`, `NaN === NaN`.

---

### A.2 `filter` vs `reduce` (and `forEach`)

**From debrief:** Named explicitly; you also mentioned **filter vs reduce** to Haley after round 1.

#### You should know

- **`filter`:** returns **new array** of elements where predicate is truthy; **does not mutate**; skips holes in sparse arrays.  
- **`reduce`:** accumulates to **one value** (or another structure if you push inside acc); second arg = **initial value** (critical for empty arrays).  
- **`forEach`:** side effects; returns **`undefined`**; cannot break like a `for` loop (no built-in break — use `for`/`some`/`every`).

#### Answer skeleton

> “**`filter`** is when I need a **subset** of items immutably. **`reduce`** is when I need to **fold** a collection into one summary — counts, maps, grouped objects — and I always pass an **initial value** when the shape could be empty to avoid the ‘first element is string, rest are numbers’ bug. **`forEach`** when I need **iteration for effects** only, not a transformed return value.”

**Tiny example (say out loud):**

```js
const cart = [{ qty: 2, price: 10 }, { qty: 1, price: 15 }];
const total = cart.reduce((sum, line) => sum + line.qty * line.price, 0); // 35
const bigLines = cart.filter((line) => line.qty * line.price > 15);
```

---

### A.3 Object merge / overlapping keys

**From your round 1 recap to Haley** (collision behavior).

#### You should know

- **`Object.assign(target, ...sources)`** — later sources **overwrite** same keys on **target**; mutates target.  
- **Spread `{ ...a, ...b }`** — rightmost wins.  
- **`Object.defineProperty`** / non-enumerable keys — spread/`assign` only copies **enumerable own** properties (symbols with `Object.assign` rules differ slightly from spread in edge cases).  
- **`structuredClone`** vs shallow copy — **nested objects** still shared on shallow merge.

#### Answer skeleton

> “For plain config objects I use **spread** with **rightmost wins** so overrides are explicit: `const merged = { ...defaults, ...user }`. I’m careful with **nested** objects — that’s only one level deep — so for deep merge I either **namespace** (`theme.colors`, `theme.typography`), use a **small util**, or merge at the **API boundary** so the client doesn’t need a heavy deep merge.”

---

### A.4 Debrief typo: “diffusion, foreach, reducer”

The note said **“diffusion, foreach, reducer”** — likely garbled.

- **Reasonable interpretations:** **`forEach`**, **`reduce`**, and **React diffing / reconciliation** (virtual DOM diff).  
- **Prep:** **A.1–A.3** + **Track C** (keys, `memo`, reconciliation). If they literally say “diffusion,” ask **clarifying question**: “Do you mean **reconciliation / diffing**, or something else?”

---

### A.5 Adjacent fundamentals (same “Track A” umbrella)

The debrief is **not exhaustive**. Interviewers often stay in **language fundamentals** without naming them in Haley’s forward. If time permits, lightly refresh:

**`this` binding** (strict mode, implicit loss), **closures** (loop + `var` vs `let`), **event loop** at a high level (microtasks vs macrotasks), **`==` vs `===`**, **`typeof` / `Array.isArray`**, **optional chaining / nullish coalescing**, **spread/rest**, **destructuring defaults**, **shallow vs deep copy** (when it matters), **pure vs mutating** array methods, **Promise.all / race / allSettled** basics, **try/catch + async errors**.

You don’t need DSA depth — you need **predictable, explainable JS behavior** out loud.

---

## Track B: Web platform & architecture

**Scope:** The debrief hit **component vs global styles**, **SPA navigation**, **SSR vs SPA**, and **API→UI debugging**. The same lane often expands into **adjacent platform + “systems thinking for UI”** (see **§ B.5**) — common for **enterprise / regulated** products and **large migrations** (e.g. **Ember → React**).

### B.1 Components vs “global” styles

**From debrief:** Explain what a component is; pros/cons vs global styles for shared look-and-feel.

#### You should know

- **Component (UI):** bounded **template + behavior + styles + tests** with a **clear API** (props/slots), reusable, composable.  
- **Pros:** encapsulation, **isolated refactors**, easier testing, design-system alignment, tree-shaking unused CSS modules.  
- **Cons:** **boilerplate**, over-splitting, prop drilling (mitigate with context), runtime cost if abused, CSS-in-JS bundle tradeoffs depending on stack.  
- **Global styles:** fast for **one-offs** and **legacy**; risks **specificity wars**, **unintended bleed**, harder deletes, worse **parallel team** scaling.

#### Answer skeleton (commerce-flavored)

> “On Shopify I think of **sections and snippets** or **React components** as the unit of reuse: props in, predictable DOM and CSS boundaries out. **Global SCSS** still exists for **tokens, resets, and typography scale**, but feature CSS lives with the component so two teams don’t fight in the same selector namespace. Tradeoff: more **upfront structure**; payoff is **safer refactors** and easier **a11y** fixes because impact is localized.”

---

### B.2 SPA — why would `<a href="...">` misbehave?

**From debrief (twice):** Full page refresh vs client-side routing.

#### You should know

- Default `<a href="/path">` causes **full document navigation** unless prevented.  
- In **React Router / Next.js:** use **`<Link>`** / **`router.push`**; `<a>` to **external** URLs or **`download`** is fine.  
- **`event.preventDefault()`** + programmatic navigation for custom cases.  
- **Next:** `<Link>` still renders `<a>` — **client transition**; plain `<a>` to internal path without router = **MPA-style** full reload.

#### Answer skeleton

> “A plain anchor always means **‘let the browser load a new document’** unless I intercept it. In an SPA the router owns navigation history. So internal routes should go through **`<Link>` or the router API**; I use **real `<a>`** for **mailto, external https, and PDFs**. If something ‘blinks’ the whole app on internal click, I look for a **raw `<a href>`** or **`window.location`** usage.”

---

### B.3 SSR vs SPA — tradeoffs

**From debrief.**

#### You should know

| | SPA | SSR / hybrid (Next, etc.) |
|--|-----|---------------------------|
| **Pros** | Rich interactions after load; simpler hosting for static+API | **First paint + SEO**; **OG tags** per request; faster **TTI** for content-heavy pages |
| **Cons** | **SEO/OG** harder for public index pages; blank shell if JS slow | **Complexity**: server data fetching, hydration mismatches, infra |
| **ASH angle** | They lived Ember SPA; moving React — **hydration** and **Ember-to-React** migration topics may resonate |

#### Answer skeleton

> “**SPA** optimizes for **logged-in app shells** and heavy interactivity after one bundle. **SSR** helps when **HTML must be right on first byte** — SEO, social previews, slow devices — at the cost of **server pipeline and hydration**. At DYODE, storefronts are often **hybrid**: marketing pages care about **LCP/SEO**; account/checkout care about **app-like** flows — I’d pick per surface, not one global architecture.”

---

### B.4 Debugging — wrong table data

**From debrief:** Network tab, keys, transforms.

#### Answer skeleton

> “**Confirm source of truth**: is the bug in **API**, **client normalization**, or **rendering**? Network shows **status and payload**. Then I diff **expected schema** vs actual — wrong field name, **unit mismatch**, **null vs 0**. In UI I check **column definitions** vs **accessor keys** and any **memoized selectors** that might cache stale props.”

Tie to your CV: **GA4/GTM**, **metafields**, **GraphQL** — good examples of **schema mismatch** or **wrong field mapped to component**.

---

### B.5 Adjacent web platform (high-likelihood add-ons)

Not quoted verbatim in Haley’s forward; **common** in this kind of FE panel (enterprise product, **migration**, design-system culture). Prep as **tight verbal answers** unless they go to the whiteboard.

- **FE ↔ API contract:** **REST** basics (status codes, error payloads, **loading / empty / error** UI), when you’d **retry** vs **surface** failure; if you mention **GraphQL** (your CV), know **schema as contract**, **over/under-fetching**, and when **REST** is still the right tool (binary payloads, heavy caching). Pairs with debrief-style **“architecturally, what would you do differently?”**
- **Security at the UI boundary (conceptual):** **XSS** (untrusted HTML, escaping, **CSP** idea), **CSRF** (cookie-based sessions + mitigations) — you’re not implementing crypto; you show you **avoid classic footguns**.
- **Browser mechanics that bite real apps:** **Same-origin / CORS** (what it protects, when **preflight** happens), **cookies** (`HttpOnly`, `SameSite` in plain English), why **long-lived secrets in `localStorage`** is risky vs **HttpOnly** patterns.
- **Hydration / server–client mismatch:** extends **B.3** — what goes wrong when first paint HTML and client tree disagree, and how you’d **detect** / **mitigate** (often verbal; sometimes ties to React SSR).
- **Migration architecture (Ember → React):** **incremental** strategies (page-by-page **strangler**, **feature flags**, **shared tokens**, stable URLs), **risk to users** — you don’t need ASH’s exact plan; you need **pattern names + tradeoffs**.
- **Design system as architecture:** **tokens**, versioning, **breaking changes** — extends **B.1** without repeating the same answer.

**Lower priority** unless they steer: **WebSockets vs polling**, **service workers / offline**, **micro-frontends**.

---

## Track C: React & live exercise

### C.1 Likely “coding exercise” shapes (guesswork)

**Evidence:** Prior candidates described **in-interview** debugging / small React fixes — not a separate “take home only” story.

**Plausible formats (prep all lightly):**

1. **Broken React component** — wrong **`useEffect` dependency array**, **stale closure**, **`setState` async batching**, **missing dependency array** causing infinite fetch, **mutating state in place** (`arr.push` then `setArr(arr)`).  
2. **List not re-rendering** — **bad `key`** (`key={index}` with reorder), **mutated array** without new reference, **pure component** blocking updates.  
3. **“Predict output”** — **closures in loops**, **`var` vs `let`**, **`this`**, **promises microtasks** (lighter than full event-loop deep dive).  
4. **Table with bad data** — walk through **Network tab** (status, payload shape), **compare to UI mapping**, **defensive parsing**, **keys in `map`**. *(Also covered under **Track B § B.4** as a narrative; here as live exercise.)*

#### Answer skeleton (while screen-sharing)

> “I’d **reproduce**, open **DevTools → Network** to confirm the response, **log or breakpoint** at the **boundary** where API JSON becomes view-model, then verify **keys** and **transforms**. For React I’d check **state updates are immutable** and **effects** aren’t **stale** or **double-firing** in Strict Mode.”

---

### C.2 React — hooks, performance, forms

**From Haley’s earlier checklist + debrief:** Components, diff, libraries, HOC, lifecycle vs hooks, perf techniques; **fix** non-functional component; **form improvements** (a11y, `useMemo`, comments).

#### You should know

- **`useState` / `useReducer`:** when to use which (multi-field forms with coupled validation → sometimes `useReducer`).  
- **`useEffect`:** fetch + cleanup; dependency array discipline; **don’t use effect for derived state** — compute in render or `useMemo`.  
- **`useMemo` / `useCallback`:** use when **referential stability** matters (child `memo`, expensive pure calc) — not everywhere.  
- **`useRef`:** DOM access, mutable value without re-render.  
- **HOC vs hooks:** legacy patterns (`withRouter`); modern codebases prefer **hooks**.  
- **Reconciliation (diff):** **same type + same key** → update; **key change** → remount; why **stable keys** matter for **preserved state** (inputs, animations).  
- **Forms:** `<label htmlFor>`, **errors tied to `aria-describedby`**, **focus management** on error, **controlled inputs**, **debounced** search where appropriate.

#### Answer skeleton — “fix this component”

> “I’d read **warnings** (React 18 Strict Mode double-invoke), check **effect deps**, ensure **fetch cleanup** with `AbortController`, verify **list keys** are stable IDs, and replace **in-place mutation** with **spread / immutable updates**. If performance is the claim, I’d **measure** before `useMemo`.”

#### Answer skeleton — “improve this form”

> “**Labels** on every control, **visible and programmatic** error text, **keyboard** path and **focus order**, don’t rely on **placeholder-only** labels, consider **`fieldset`/`legend`** for groups, and **validate on submit** plus optional **inline** for long forms. For perf, **memoize expensive derived options** not every keystroke.”

---

## Track D: Quality & product craft

### D.1 Unit testing — “walk through”

**From debrief.**

#### You should know

- **Arrange / Act / Assert**; **test behavior not implementation** where possible.  
- **React Testing Library:** query by **role/label**, `userEvent`, `waitFor` async.  
- **What to mock:** network (`msw` or `fetch` mock), **time**, **random**.  
- **Hooks:** `renderHook` when testing custom hooks.

#### Answer skeleton

> “I start from **user-visible behavior**: ‘when I click Add to cart, the count updates.’ I use **RTL + userEvent**, mock **network at the boundary**, and assert **accessible names** so tests track UX. For pure utils I use **Jest** table-driven cases on **edge inputs**.”

---

### D.2 Accessibility — tools & how you achieved it

**From Haley checklist + ASH culture (Trama / Jesmok).**

#### You should know

- **WCAG** levels (A/AA), **perceivable / operable / understandable / robust**.  
- Tools: **axe DevTools**, **Lighthouse**, **eslint-plugin-jsx-a11y**, **manual keyboard** pass, **zoom 200%**, **color contrast** (Figma plugins / WebAIM).  
- Common fixes: **alt text** policy, **focus visible**, **skip link**, **heading order**, **live regions** for async updates.

#### Answer skeleton (use real DYODE work)

> “On retainers I run **axe + keyboard-only** passes before sign-off, fix **contrast and focus order** on nav and drawers, and wire **announcements** for cart updates where designers want non-visual feedback. I treat **lint rules** in CI as guardrails, not a substitute for **manual** passes on **templates we changed**.”

---

### D.3 Performance — tools & how you achieved it

#### You should know

- **Core Web Vitals:** LCP, INP, CLS — what each measures.  
- **DevTools:** Performance panel, **Coverage**, **Network waterfall**, **image** sizing, **font** loading (`font-display`), **third-party scripts**.  
- **React:** `memo`, **code splitting**/`lazy`, **list virtualization** for huge tables, **avoid layout thrashing**.

#### Answer skeleton

> “I start with **Lighthouse + field data** if available, then **profile**: is it **LCP image**, **main-thread long tasks**, or **CLS** from late-loading media? On Shopify I’ve reduced **hero LCP** by **responsive images**, **preload critical font**, and **deferring non-critical apps**; for INP I target **event handlers** that block — **debounce**, **move work off the critical path**, **split components**.”

---

### D.4 SEO — tools & how you achieved it

#### You should know

- **Title/meta description**, **canonical**, **robots**, **structured data** where relevant, **hreflang** for multi-region (if applicable).  
- **SSR vs SPA** SEO implications (tie to **Track B § B.3**).  
- Tools: **Screaming Frog** / **Ahrefs** / **GSC** — pick what you’ve actually used.

#### Answer skeleton

> “For commerce I care about **indexable templates**: unique **titles**, **clean URL** strategy, **no accidental noindex** on launches, and **JSON-LD** for **Product** when the platform supports it. I coordinate with **strategy** on **canonical** when faceted URLs exist.”

---

## Track E: Behavioral & communication

Prepare **2–3 STAR stories** each (Situation, Task, Action, Result) — **quantify where honest** (your CV emphasizes **audits, CWV, ADA, experimentation** — use those, don’t invent percentages you can’t defend).

| Theme | What they want | Your hook ideas |
|-------|----------------|-----------------|
| **Wrong decision** | Learning, no trash-talk | Scoped wrong approach on a client feature; **how you detected** and **what changed in process** |
| **Remote collaboration** | Async comms, docs, reviews | DYODE **cross-functional** scoping, **PR reviews**, **Slack + Loom** for design alignment |
| **Architectural decision with team** | Tradeoffs, dissent | **Metafield model** vs hardcoding; **component split** for reuse vs speed |
| **Weakness** | Real + mitigation | e.g. tendency to **over-document** early — mitigated with **timeboxed spikes** |
| **Process gap → POC** | Initiative | **Audit finding** → **ticket pattern** for recurring a11y issues |
| **“Greatest weakness” / mistake** | Same as above | Pick **one** strong story |
| **Metrics depth** (Haley’s warning) | **How measured**, not only % | Tie **Lighthouse before/after**, **GSC** clicks, **test cell** from A/B — only if you can explain **baseline + intervention** |

### Answer skeleton — weakness

> “I used to **optimize prematurely** on small client tweaks. Now I **timebox discovery**: reproduce in **DevTools**, confirm with **one metric** (e.g. LCP element), fix, **re-measure in the same environment**. That’s been easier to communicate to stakeholders than subjective ‘felt faster.’”

---

## Checklist by track

### Track A — JavaScript core

- [ ] **A.1** Truthy/falsy rapid-fire + loose vs strict practice  
- [ ] **A.2** `filter` / `reduce` / `forEach` + empty-array `reduce` gotcha  
- [ ] **A.3** Object spread merge + nested shallow caveat  
- [ ] **A.4** “Diffusion” clarifying question + link to **reconciliation** (Track C)  
- [ ] **A.5** (optional sweep) Skim **adjacent fundamentals** list — pick 3 weak spots to drill

### Track B — Web platform & architecture

- [ ] **B.1** Component vs global CSS — commerce example  
- [ ] **B.2** `<a>` in SPA + router model  
- [ ] **B.3** SSR vs SPA — when you’d pick each  
- [ ] **B.4** Wrong-table / Network-tab debugging narrative  
- [ ] **B.5** (optional sweep) **API contract**, **CORS/cookies/XSS/CSRF** one-liners, **hydration**, **Ember→React migration** talking points, **design system governance**  

### Track C — React & live exercise

- [ ] **C.1** Likely exercise shapes (hooks, keys, predict-output)  
- [ ] **C.2** Hooks failure modes, forms/a11y suggestions, `memo` discipline  

### Track D — Quality & product craft

- [ ] **D.1** RTL / Jest walkthrough  
- [ ] **D.2** a11y tools + **your** audit story  
- [ ] **D.3** perf / CWV narrative  
- [ ] **D.4** SEO + canonical / indexing story  

### Track E — Behavioral & cross-cutting

- [ ] STAR table: at least **one** solid story per theme (merge where possible)  
- [ ] **Metrics depth** drill: pick **one** real before/after with **how measured**  
- [ ] Read [panelist dossier](./american-specialty-health-panelist-dossier-2026-05-11.md) once — **who cares about what**  

---

## Changelog

- **2026-05-11:** Initial study guide from Haley-forwarded candidate notes + checklist; added coding-format guess and panel/coding meta.
- **2026-05-11:** Reorganized body into **five tracks** (A–E) + **§3 study map** + **checklist by track**; updated internal cross-references from old § numbers.
- **2026-05-11:** **Track A** — clarified **open syllabus** (not limited to debrief bullets) + added **§ A.5** adjacent JS fundamentals; fixed section order (A.1–A.4 then A.5).
- **2026-05-11:** **Track B** — **scope** note + **§ B.5** high-likelihood adjacent web-platform topics; study-map row updated.
