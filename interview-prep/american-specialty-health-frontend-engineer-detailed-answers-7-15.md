# ASH — Detailed answer scripts (sections 7-15)

Source questions: `interview-prep/american-specialty-health-frontend-engineer-question-bank.md` (sections `7` through `15`).

These are written to be practical for an interview where you may not have time to tell a full story for every sub-question. Where I describe “an example”, treat it as a pattern you can anchor to your exact DYODE project details (forms, modals, onboarding, checkout-adjacent UX, etc.).

---

## 7. Accessibility — tools & outcomes

### 7.1 How do you define “accessible” for a web app?
Accessible means the UI works for people with different abilities and assistive technologies, not just that it “passes a scan”. In practice, I think in terms of perceivable, operable, understandable, and robust experiences: keyboard users can complete tasks, focus order is correct, and labels/errors are meaningful. I also treat accessibility as part of product quality: it reduces friction and improves reliability for everyone, especially in forms-heavy flows.

### 7.2 What WCAG concepts do you actually apply day to day?
Day to day I focus on semantics and structure (proper headings/landmarks where appropriate), text alternatives, and meaningful form labeling. For interactivity, I prioritize keyboard operability and predictable focus management (including after validation errors and during UI state changes like modals). I also pay attention to “understandable” aspects: clear error messaging, not just color-based cues, and keeping status updates easy to perceive.

### 7.3 How do you test accessibility beyond automated scans?
Automated tools catch a subset, but real bugs often live in interaction and state: focus traps, missing focus restoration, broken tab order, and dynamic content not being announced clearly. My approach is manual verification: keyboard-only navigation end-to-end, visual focus states, and checking how interactive components behave through their full lifecycle (open/close, error/empty/loading). When feasible, I also validate with a screen reader and confirm the announcement/reading order matches the intended UX.

### 7.4 Which tools have you used (axe, Lighthouse, screen readers, keyboard-only)?
I use a combination of WCAG/ADA-oriented audits plus manual validation. On the manual side, keyboard-only testing is non-negotiable for component correctness (especially custom controls and modals). I also rely on browser accessibility inspection to confirm roles/names in the accessibility tree, then validate dynamic UI states (validation messages, loading/empty states).

### 7.5 Tell me about a concrete accessibility bug you fixed — root cause and prevention.
One common category I’ve fixed in production involves form UI where the “visual” state changed but accessibility semantics didn’t: for example, users would see an error, but focus didn’t move to the error or the error wasn’t properly associated with the field. The root cause is usually a mismatch between React state updates and how assistive tech perceives the DOM (labels, descriptions, and focus targets). Prevention is to treat accessibility as part of the component contract: define how the component handles validation, where focus goes, and how errors are communicated consistently.

### 7.6 How do you handle accessible forms: labels, errors, focus management?
I ensure every input has an explicit programmatic name (typically via a real `label` associated to the input, and/or `aria-label` when needed). For errors, I show a clear message and connect it to the relevant field using relationships like described-by patterns, not just color changes. For focus management, I move focus intentionally to the first actionable problem (or keep it stable when appropriate), so keyboard users don’t have to “hunt” after submission.

### 7.7 How do you approach modals and focus traps?
For modals I treat focus behavior as a first-class requirement: focus must move into the modal on open, be trapped while the modal is open, and be restored to the triggering element on close. I also ensure the modal has the right semantic properties (`aria-modal` and appropriate labeling) so assistive tech understands the context. Finally, I handle escape and click-outside behavior carefully to avoid “surprise” navigation or losing user input.

### 7.8 How do you work with design when the mock isn’t keyboard-friendly?
I start by translating the design into an interaction model: what are the key actions, what’s the tab order, and what are the focus/hover/active states required for keyboard users. If the mock lacks keyboard affordances, I propose minimal, aligned changes that preserve the intent (e.g., adding focus styles, ensuring hover-only cues aren’t the only signal). I also suggest testing in the flow early so we don’t discover accessibility issues late.

### 7.9 How do you balance 508 / compliance pressure vs shipping?
I don’t treat accessibility as “extra time at the end”; I integrate it into implementation so the risk doesn’t pile up. When timelines are tight, I prioritize the criteria that block task completion (keyboard access, labels/errors, focus management), then iterate on polish. I’m comfortable documenting trade-offs temporarily, but I’d rather ship a correct baseline experience than rush a UI that excludes users or causes avoidable usability failures.

### 7.10 What’s your approach when a third-party widget isn’t accessible?
First I evaluate severity: does it block core user tasks (high risk) or is it peripheral (lower risk)? If it’s high impact, I look for accessible configuration options, wrappers, or alternate flows while keeping the product’s intent intact. If there’s no viable workaround, I escalate to the vendor and align with PM/UX on a product decision—either replace it, limit usage, or add an accessible fallback so users aren’t stuck.

---

## 8. SEO — tools & outcomes

### 8.1 What SEO work have you owned vs partnered on?
On the frontend side, I’ve owned technical/on-page SEO fundamentals: correct metadata (titles/descriptions), clean URL routing behavior, and ensuring dynamic pages don’t regress crawlability. I partner with marketing/content on what the pages should say and on experiment goals, while I keep the implementation aligned with SEO constraints. I also connect SEO thinking to performance and UX, because slow pages and brittle routes often create downstream SEO issues.

### 8.2 How do you think about SEO for a SPA vs marketing pages?
For a SPA, the main risk is that the initial response and routing behavior may not produce stable, crawlable metadata for each “page”. My approach is to make sure the right titles, descriptions, and canonical URLs are present for the routes users actually hit, and that navigation changes don’t cause confusing or inconsistent page identity. I also think about whether some routes need server-rendering or pre-rendering depending on how the product is deployed and how search engines discover content.

### 8.3 What tools have you used (Search Console, Lighthouse SEO audits, structured data testing)?
I rely on a combination of SEO reporting and validation: search indexing/visibility signals, page audits for metadata and structured content, and targeted checks during refactors. The key for me isn’t the specific tool brand—it’s having a repeatable way to confirm that the pages we change still have the expected head tags, URL behavior, and content identity. I also use performance signals alongside SEO because Core Web Vitals directly affect user experience and often correlate with search performance.

### 8.4 How do you approach meta tags, canonical URLs, and routing?
I treat metadata and canonical URLs as part of the routing contract. For each route, I ensure the app sets the right title/description and uses stable canonical URLs that don’t accidentally change because of client-side navigation or query parameters. During refactors, I verify that URL slugs and redirects remain consistent so search engines don’t perceive duplicate or broken content.

### 8.5 How do you collaborate with marketing or content on SEO?
I translate SEO requirements into engineering tasks: where metadata should come from, how page identity maps to routes, and what must remain stable for indexing. Then I collaborate on experiment planning—especially when A/B testing could inadvertently cause metadata or URL changes. The goal is to keep iteration fast for content while protecting the “technical scaffolding” that SEO depends on.

### 8.6 Tell me about an SEO-related fix you shipped — what moved?
A typical win I’ve delivered looks like fixing metadata/routing regressions during a storefront or template update so the pages again had consistent titles/descriptions and stable URLs. I validate the change by checking the resulting page head data and then monitoring the expected visibility signals over time. The “what moved” is usually improved stability: fewer regressions, better indexing consistency, and a reduction in SEO-related surprises after deployments.

### 8.7 How do you avoid SEO regressions during refactors or migrations?
I use a checklist mindset: route mapping correctness, head tag correctness per route, and URL behavior (including redirects/canonical rules). I also prefer automated verification where possible (e.g., snapshot checks for head tags and basic route smoke tests), so regressions show up before production. Finally, I coordinate release timing with marketing/content when SEO risk is high, because changes often need monitoring windows.

### 8.8 What’s your take on SSR/SSG vs CSR for SEO — when does it matter?
If a route’s content and metadata need to be available to crawlers reliably, SSR/SSG can reduce uncertainty by producing a more complete initial response. CSR can still work, but only when you control the initial metadata and ensure crawlers can understand the final state well enough for the product’s SEO needs. In practice, I’d evaluate which routes matter most, how content is discovered, and what the hosting/deployment constraints are.

### 8.9 How do you handle internationalization / duplicate content risks (if relevant)?
For i18n, the biggest risk is having multiple versions of similar content that don’t clearly identify their language/region. I handle this by ensuring locale-aware routing and correct canonical behavior, so each locale version is distinguishable rather than treated as duplicates. I also coordinate with content on stable slugs and avoid “accidental duplicates” caused by query parameters or inconsistent mapping.

### 8.10 What metrics do you watch (if any) after an SEO change?
I watch visibility and engagement signals rather than only rankings: indexed coverage, organic clicks, and overall organic traffic patterns over a sensible monitoring window. I also track whether performance changes (Core Web Vitals) or routing changes correlate with user behavior changes, because SEO is downstream of UX reliability. For experiments, I keep measurement consistent so we can attribute outcomes correctly.

---

## 9. Performance — tools & outcomes

### 9.1 How do you define “fast enough” for users?
Fast enough means the experience feels responsive and stable during the moments users care about: initial load, scrolling, and interacting with key controls. I think in terms of both perceived performance and measurable outcomes, like avoiding long tasks that block interaction and minimizing layout instability. I also align performance work with the product’s real user paths (enrollment/search/checkout-adjacent flows).

### 9.2 What Core Web Vitals do you pay attention to and why?
I focus on LCP because it reflects how quickly meaningful content appears, CLS because layout stability is part of user trust, and INP because it reflects real interaction responsiveness. These map directly to user pain: late content, jumping layouts, and sluggish or delayed controls. For ecommerce/customer experiences, those are also business-critical because friction directly impacts conversion.

### 9.3 What tools do you use (Lighthouse, WebPageTest, RUM, Chrome Performance panel)?
I use the browser performance ecosystem and field-style Core Web Vitals reporting to identify what’s actually hurting users. Locally, I inspect timelines and rendering performance (what blocks the main thread, what triggers reflow/repaint patterns). In parallel, I cross-check against analytics/CRO instrumentation so we can connect performance changes to user experience outcomes and business metrics.

### 9.4 Tell me about a performance win — before/after signal (metrics or proxy).
One performance win pattern from my experience is improving perceived and measured load quality by reducing blocking work and optimizing how key UI assets load. Concretely, that often looks like optimizing image delivery, tightening JavaScript execution paths, and ensuring route transitions don’t trigger heavy re-renders. For “before/after”, I typically report both the Core Web Vitals improvement and the user-facing proxy: smoother interaction and fewer UX issues reported in releases.

### 9.5 How do you find and fix bundle-size regressions?
I start by identifying what changed: which dependency or code path increased the shipped bundle or delayed critical execution. Then I focus on impact-first fixes: removing unused code, improving import granularity, and verifying that route-level and feature-level chunks load only when needed. After that, I re-validate performance in a realistic flow so we don’t optimize something that doesn’t affect actual user paths.

### 9.6 How do you approach lazy loading, code splitting, and route-level chunks?
I code-split based on user intent and navigation boundaries, not just file boundaries. The goal is that initial render stays small and stable, and secondary/less frequently used features load when the user reaches them. For route-level chunks, I make sure the app still manages metadata and loading states cleanly so the UX remains predictable even with async loading.

### 9.7 How do you debug layout shifts (CLS)?
CLS usually comes from elements changing size unexpectedly after initial render: images without stable dimensions, fonts loading late, or components that appear/disappear without reserving space. I debug by looking at layout shift regions, then tracing back to the DOM elements that move and the causes (missing width/height, late-loaded content, or dynamic banners). The fixes generally involve reserving space, stabilizing image/font rendering, and sequencing UI so critical content isn’t pushed around.

### 9.8 How do you balance third-party scripts vs performance?
Third-party scripts are often where performance budgets go to die, so I treat them like production dependencies with explicit ownership. I prioritize which scripts are essential, defer what can be deferred, and ensure they load in a way that doesn’t block key UI rendering. I also validate impact after changes because third-party updates can cause unexpected regressions even if our code didn’t change.

### 9.9 How do you prevent perf regressions in CI (budgets, profiling)?
I advocate for automated checks that catch regressions before release: basic performance smoke tests for critical routes and budget-style alerts where feasible. Even when full budgets aren’t available, I ensure we have repeatable profiling steps for PR review (what changed, what the main-thread cost became, and whether the critical routes stayed stable). Most importantly, I connect performance work to release ownership so performance regressions are treated like correctness issues.

### 9.10 What’s a perf mistake you’ve made and how you’d avoid it now?
A realistic mistake to mention is optimizing before you fully understand the bottleneck, which can lead to improvements that don’t move the user experience. The correction is to validate with data first (Core Web Vitals + rendering timelines), then target the highest-impact changes tied to the measured issue. I also learned to keep performance decisions tied to user journeys, so we don’t improve something users don’t experience.

---

## 10. React fundamentals (components, state, effects)

### 10.1 How do you decide where state lives in a React tree?
I place state where it’s needed and where it naturally owns the data lifecycle. If multiple sibling components need the same value, I lift it to the nearest common ancestor (or to a dedicated parent/container) so state isn’t duplicated. If the state is strictly local to one component’s interaction, I keep it colocated to reduce prop drilling and complexity.

### 10.2 Explain controlled vs uncontrolled inputs — when do you pick each?
Controlled inputs are best when you need immediate validation, predictable form state, and controlled UX for errors/loading states. Uncontrolled inputs can be fine for simple cases where you don’t need to mirror every keystroke in React state, or where integration is easier and the form library handles the details. In practice, in commerce and forms-heavy UIs, I default to controlled inputs for correctness and consistent accessibility behavior.

### 10.3 When do you lift state up vs colocate it?
I colocate by default for interaction details that don’t need to be shared, then lift when another component needs the same source of truth. A key guideline: avoid “lifting just because it’s convenient”, because it increases coupling and makes the component harder to reason about. I only lift when it eliminates duplication or prevents inconsistent UI.

### 10.4 How do you handle derived state — compute vs store?
If the derived value can be computed from existing state/props, I compute it instead of storing a second copy. Storing derived state risks the “two sources of truth” problem, where one gets updated and the other doesn’t. If computation is expensive, I use memoization patterns, but only after I understand and measure the performance impact.

### 10.5 Rules of Hooks — what breaks them and why does React care?
Hooks must be called unconditionally and in the same order on every render for React to map hook state to the correct call site. What breaks them is calling hooks inside conditionals, loops, or after early returns. React cares because it relies on call order to associate stateful behavior with the right component instance.

### 10.6 useEffect — what belongs there vs event handlers vs render?
I use render for deriving UI from current props/state, event handlers for responding to user actions, and `useEffect` for synchronization with external systems and side effects. Typical side effects include subscriptions, DOM interactions that can’t happen during render, and async data fetching. I avoid putting logic in `useEffect` that conceptually belongs in event handlers, because it can create confusing timing and stale dependency issues.

### 10.7 How do you avoid stale closures in effects?
I treat dependencies as the source of truth: if an effect uses a value, it belongs in the dependency array. When I need to reference the latest value without re-running everything, I consider patterns like functional state updates or restructuring so the effect doesn’t capture stale state. I also keep effects focused so the dependency list is stable and understandable.

### 10.8 Keys in lists — what goes wrong with a bad key?
A key is React’s identity signal for list items. With unstable or incorrect keys (like array index), React may reuse DOM elements for different data, causing subtle UI bugs: wrong item state, incorrect animations, or inputs preserving the wrong value. Good keys represent stable identity for the underlying data.

### 10.9 Error boundaries — what they catch, what they don’t.
Error boundaries catch errors during rendering, in lifecycle methods, and in constructors of their child components. They do not catch errors in event handlers or async code paths like Promises/`setTimeout`. For async failures, the pattern is to handle errors where the async work happens (and to present user-friendly UI), while still using error boundaries for render-time safety.

### 10.10 Suspense — where you’ve used it or would consider it.
Suspense is useful for coordinating loading states when parts of the UI are not ready yet, especially for code-splitting and data fetching patterns. I’d consider it when a component can be split into independently loadable segments and when the UX benefits from showing fallbacks in a controlled way. The key is to keep the loading experience consistent and avoid confusing “partial UI” states.

---

## 11. React reconciliation, rendering, updates

### 11.1 What is reconciliation at a high level?
Reconciliation is how React figures out what changed between renders and updates the DOM efficiently. It compares the previous render output with the next one and determines the minimal changes required. Conceptually, it’s about identity and difference: which components are the same, and which need to update.

### 11.2 What triggers a re-render in React?
Re-renders are triggered when a component’s state or props change, or when the component subscribes to new context values. Parent component updates can also cause child re-renders if the child receives new props (even if the child’s visual output ends up being the same). React may batch updates, but the trigger is fundamentally prop/state/context changes.

### 11.3 How do you reduce unnecessary renders without prematurely optimizing?
I start by identifying why re-renders are happening and whether they matter for user-visible performance. Then I apply structural fixes: avoid recreating new objects/functions every render, split components so unrelated state changes don’t force whole subtrees to update, and lift shared state appropriately. Memoization (`React.memo`, `useMemo`, `useCallback`) is a targeted tool after the baseline is correct.

### 11.4 When is React.memo appropriate? When is it foot-gun territory?
React.memo is appropriate when a component is a “pure” visual mapping from props and those props are stable enough to make memoization effective. It becomes a foot-gun when you wrap everything without addressing unstable props, because the memo won’t help and can add mental overhead. I use it sparingly and only after confirming (via profiling) that the memoized boundary meaningfully reduces work.

### 11.5 useMemo / useCallback — when do they help vs add noise?
They help when the memoized computation is expensive or when stable function identity prevents downstream rerenders. They add noise when they’re used by default “because it’s fast”, turning code into a dependency-management exercise that’s easy to get wrong. My rule of thumb: optimize after you can explain the performance reason and validate it.

### 11.6 How do you debug “why did this render?”
I use React DevTools to inspect component renders and the React Profiler to see where time is spent. Then I trace the data flow: what props/state changed, and whether the component is re-rendering due to identity changes (functions/objects). This lets me fix the root cause rather than just paper over symptoms.

### 11.7 How do batching updates affect what you observe in React 18?
Batching groups multiple state updates so React can re-render efficiently rather than after every single call. In React 18, many updates are batched automatically in more cases (e.g., within event handlers). Practically, that means logging inside render may not show intermediate values the way you’d expect if you’re thinking imperatively.

### 11.8 How do you think about concurrent features / transitions (if you use them)?
Concurrent features are about keeping the UI responsive by prioritizing urgent updates over non-urgent ones. If I use transitions, I treat them as a UX tool: they allow interactive states to remain snappy while data-heavy updates occur in the background. I only introduce them when the product has clear “typeahead/search/filter” style UX where the distinction matters.

---

## 12. React ecosystem patterns (HOCs, composition, legacy awareness)

### 12.1 What is a Higher Order Component — pros/cons vs hooks?
An HOC is a function that takes a component and returns a new component with extra behavior. Pros include reusable cross-cutting logic without modifying the base component, but it can increase wrapper nesting and make prop flows harder to follow. Hooks usually provide clearer composition for most modern cases, especially for stateful logic and effects.

### 12.2 Have you maintained legacy class components — how did you migrate or wrap them?
When modernizing a codebase, I’d either isolate legacy components behind stable interfaces or gradually refactor them into functional components with hooks. The key is to avoid big-bang rewrites: preserve behavior, add tests around the boundaries, and refactor incrementally. If wrappers are needed, I keep them thin so they don’t create a long-term dependency on HOC nesting.

### 12.3 Render props vs hooks — trade-offs you’ve seen in real codebases.
Render props can be flexible but can also lead to more indirection and harder-to-read code if overused. Hooks often simplify the mental model because logic lives directly in a component. In practice, render props may still be useful for certain generic composition patterns, but for most feature logic, hooks are the more straightforward long-term maintainable approach.

### 12.4 Context — good uses vs “global Redux via context” pitfalls.
Context is great for passing dependencies or state that many descendants truly need, especially app-level configuration or theming. The pitfall is treating context as a catch-all store, which can cause broad re-renders and make performance/debugging harder. I use context when the data truly needs to be available widely and when I can manage update frequency.

### 12.5 Code-splitting patterns at route vs component level.
Route-level splitting is usually aligned to navigation boundaries and user intent, giving you better control over initial load size. Component-level splitting is useful for optional or infrequently used UI pieces nested within a route. I choose based on how users actually interact with the product and which parts block time-to-interactive.

### 12.6 How do you structure feature folders vs layers?
I like a structure where the feature folder contains its UI components and the feature-specific orchestration, while shared “platform” concerns (API clients, shared utilities, analytics adapters) live in stable places. Within a feature, I separate presentational components from data/state orchestration when it improves readability and testability. This keeps side effects isolated and makes component reuse clearer.

### 12.7 How do you isolate side effects from presentation components?
Presentation components should ideally be driven by props and not own side effects like network calls, subscriptions, or external analytics reporting. Side effects live in containers, hooks, or service modules, so the UI stays easy to test and the behavior is easier to reason about. This also makes it easier to mock dependencies in tests.

---

## 13. React performance techniques

### 13.1 Profiling workflow in DevTools — what you look for first
First I verify if the issue is expensive renders (CPU in React work) vs slow loading/blocked main thread vs layout instability. Then I use the profiler flame graph/commit timings to identify which components re-render too often or spend too much time reconciling. Once I have a suspect component or state change, I inspect why it re-renders and whether identity (props/functions) is stable.

### 13.2 Virtualization for long lists — when it matters
Virtualization matters when the list is large enough that rendering every item becomes a performance bottleneck and users feel lag during scroll. It’s especially important for ecommerce/category pages or any “search results” style UI with many items. I’d choose virtualization when I can accept the UX constraints and ensure accessibility (like correct item semantics and keyboard behavior) is handled carefully.

### 13.3 Debouncing/throttling user-driven updates — examples
Debounce is useful for text input where you only want to update search/filter results after the user pauses, while throttling is useful for high-frequency events like scroll/resize. In React, I keep the approach predictable by centralizing the timing logic and ensuring the latest value is used (avoiding stale closures). I also pair it with good UI states: loading indicators and cancelable requests where applicable.

### 13.4 Image and asset loading strategies that improved UX for you
I apply responsive images and correct dimensions to avoid layout shifts, and I lazy-load below-the-fold assets while prioritizing above-the-fold content. For key hero images, I ensure the page reserves space and doesn’t delay meaningful paint unnecessarily. I also watch for heavy third-party assets and prefer optimized formats and delivery strategies aligned to the product’s target devices.

### 13.5 Animation perf — layout thrashing, will-change, avoiding main-thread overload
For smooth animations, I focus on avoiding layout thrashing by not repeatedly reading layout and forcing reflows in tight loops. I prefer transform/opacity-based animations when possible, because they tend to be cheaper than animating layout-affecting properties. I use `will-change` sparingly for cases where it’s clearly beneficial, since overusing it can harm memory/performance.

### 13.6 Identifying expensive third-party libraries
I treat third-party additions as measurable risks: I check the contribution to bundle size and runtime cost, then validate impact on critical routes. Profiling and performance timelines help isolate whether the library causes long tasks, heavy scripting, or unnecessary rerenders. If the library is optional, I defer or lazy-load it so it doesn’t affect time-to-interactive.

### 13.7 Measuring impact after a perf change — what would you report to leadership?
I report the user-relevant outcomes: Core Web Vitals movement (qualitatively describing which metric improved) and evidence from performance profiling that the bottleneck is gone or reduced. I also connect performance to UX/business signals via analytics where possible (e.g., fewer friction events, improved funnel step performance, reduced bounce on key pages). The goal is to show that the change improved real user experience, not just a synthetic metric.

---

## 14. JavaScript fundamentals — core language

### 14.1 Explain event loop + microtasks vs macrotasks — why setTimeout(0) behaves oddly next to Promises
In JavaScript, the event loop processes tasks (macrotasks) and then runs microtasks (like Promise callbacks) with higher priority before the next macrotask. That’s why `Promise.then(...)` callbacks typically run before a `setTimeout(..., 0)` callback scheduled around the same time. The interview-safe takeaway is to reason about “task vs microtask queues” when ordering asynchronous work.

### 14.2 async/await — error handling patterns you prefer
I use `try/catch` around the awaited operations and ensure errors are surfaced in a way that the UI can handle (loading states, error messages, and retries if appropriate). For concurrent async work, I’m careful with `Promise.all` vs independent failures so I don’t mask useful error information. I also avoid swallowing errors; if I handle them, I make the user outcome explicit.

### 14.3 Closures — a practical example from UI code
Closures show up any time you create functions that retain access to values from a previous render—like event handlers or debounced callbacks. The practical pitfall is stale values, which is why I’m careful about dependencies and cancellation patterns. When used intentionally, closures are what make stateful UI behaviors possible (like remembering the latest input to apply after a delay).

### 14.4 this binding — where it bites people in JS (and how modules/classes change the story)
`this` depends on call-site rules in JavaScript, so using regular functions can lead to unexpected `this` values if you lose the intended receiver. Arrow functions capture `this` lexically, which prevents many of those issues in modern codebases. In practice, modern module patterns and class fields reduce the common mistakes, but it’s still important to understand the underlying binding rules.

### 14.5 Shallow vs deep equality — when it matters in React state updates
React state updates and memoization decisions often rely on reference identity, which is shallow by nature. That means mutating an object in place can prevent React from detecting changes, and it can break memoization assumptions because references don’t change. In UI code, I treat state as immutable and always produce new references for what changes.

### 14.6 Immutable updates — patterns for objects/arrays without mutation bugs
I use non-mutating patterns like object/array spreads and `map`/`filter` to update only the fields/items that changed. This keeps state updates predictable and avoids subtle bugs where previous state is modified. When updating nested structures, I still make sure the parts of the tree that need to change get new references.

### 14.7 Modules: ESM vs CJS interop pain you’ve hit
A common interop issue is differences around default imports/exports when consuming CJS from ESM or vice versa. The symptom can be “undefined default” or needing `.default` at the call site depending on build tooling. When it comes up, I align the import style with the package’s documented export shape and verify in the bundler output so the behavior is consistent across environments.

---

## 15. JavaScript — DOM, events, browser APIs

### 15.1 Event bubbling vs capturing — give an example where it mattered
Bubbling means an event triggers handlers from the innermost element up to ancestors, while capturing works the opposite direction. This matters in complex UIs with nested clickable components—like a card containing buttons—because a parent click handler might run when you didn’t intend it to. Understanding bubbling/capturing helps you decide where to handle events and when to stop propagation to prevent double actions.

### 15.2 preventDefault vs stopPropagation — when each is correct
`preventDefault` cancels the browser’s default behavior (like stopping a form submission or preventing a link navigation). `stopPropagation` stops the event from bubbling up (or being captured down, depending on which phase you’re in), which is useful when nested handlers conflict. I choose based on the desired effect: prevent the browser action vs prevent ancestor handlers from running.

### 15.3 Understanding target vs currentTarget
`event.target` is the element that actually initiated the event, while `event.currentTarget` is the element whose handler is currently executing. This matters when you’re attaching handlers to a container and want to figure out which child was interacted with. Using the right property avoids incorrect assumptions about what DOM element to read attributes from.

### 15.4 Fetch API — timeouts, retries, cancellation (AbortController)
For cancellation, I use `AbortController` and connect the signal to the fetch call so the request can be stopped when the UI state changes (like navigating away or canceling a search). For retries, I implement only for safe idempotent operations and with a backoff strategy so I don’t overwhelm services. For timeouts, I handle it with abort as well—so the same cancellation mechanism applies consistently.

### 15.5 Storage: session vs local — security-ish considerations for tokens (high level)
Session storage is scoped to a tab/session lifecycle, while local storage persists longer, which increases the risk of token exposure if XSS occurs. For auth tokens, I generally prefer security-conscious patterns (depending on backend constraints), and I treat any token stored client-side as a high-value target. The practical interview answer is: minimize what’s stored, prefer safer transport (often cookies when feasible), and ensure strong XSS prevention.

### 15.6 Basic XSS mindset — where frontend engineers accidentally create holes
The most common sources are rendering untrusted HTML/strings without escaping, using dangerously HTML injection patterns, or building HTML/attributes directly from user input. I mitigate by treating inputs as untrusted, rendering text safely, using sanitization libraries for any rich-content cases, and setting strict content security policies when available. I also keep an eye on template rendering paths and third-party content integrations.

