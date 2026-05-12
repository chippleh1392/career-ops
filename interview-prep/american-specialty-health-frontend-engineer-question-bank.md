---

## type: interview-question-bank
parent: american-specialty-health-frontend-engineer.md
company: American Specialty Health
role: Frontend Engineer (React)
purpose: Scale-out drills from confirmed likely prompts (behavioral + scenario + React/JS fundamentals)
updated: 2026-05-07

---

# ASH — Expanded question bank

Derived from the **confirmed likely format** in `american-specialty-health-frontend-engineer.md`: behavioral + scenario + React/JavaScript fundamentals; **no live coding** expected for that round.

Use this file for **reps**: answer aloud, then strip to a tight STAR or crisp technical definition.

---

## 1. Tell me about yourself

- Walk me through your background in ~2 minutes.
- How did you get into frontend engineering?
- What are you looking for in your next role, specifically?
- Why are you interested in ASH / health & wellness tech?
- What should we know about you that isn’t on your resume?
- What’s the thread that connects your last few roles?
- How would you describe your engineering philosophy in one sentence?
- What kind of teams do you do your best work on?
- What do you want to learn next professionally?
- If I only remembered one thing about you after this call, what should it be?

---

## 2. What did you achieve in your last project?

- What was the business problem you were solving?
- What was your specific scope vs the team’s?
- What trade-offs did you make and why?
- What would you do differently if you ran it again?
- How did you measure success?
- What was the hardest technical challenge?
- What was the hardest people/process challenge?
- Tell me about a time you had to push back on scope or timeline.
- How did you collaborate with design / PM / QA?
- What did you ship last quarter that you’re proud of?

---

## 3. What are your strengths?

- What do teammates come to you for?
- Where do you add the most value on a cross-functional team?
- What’s an example of you operating at your best?
- How do you balance speed vs quality?
- How do you approach code review?
- How do you mentor or uplift others (if at all)?
- What’s a strength that sometimes gets misread?
- How do you handle ambiguity?
- What’s your superpower as a frontend engineer — and the flip side?

---

## 4. What are your weaknesses / growth areas?

- What’s something you’re actively working to improve?
- Tell me about a time you received tough feedback. What changed?
- What’s a mistake you made and what you learned?
- Where do you need more support from leadership or peers?
- What’s harder for you: technical depth or stakeholder communication?
- How do you avoid over-engineering?
- How do you manage imposter syndrome or self-doubt (if relevant)?
- What would your last manager say you should work on?
- How do you decide when “good enough” is appropriate?

---

## 5. Remote collaboration

- How do you stay aligned when the team is distributed?
- How do you communicate progress and blockers?
- What’s your approach to async vs sync?
- How do you build trust with people you rarely see in person?
- Tell me about a remote miscommunication and how you fixed it.
- How do you run or participate in effective meetings?
- How do you handle timezone friction?
- How do you document decisions so the team doesn’t re-litigate them?
- How do you review PRs in a remote culture?
- How do you partner with UX when you can’t whiteboard together?

---

## 6. Priorities & time management

- How do you prioritize when everything is urgent?
- Walk me through how you plan a sprint or a week of work.
- How do you say no (or “not now”) to stakeholders?
- Tell me about conflicting priorities from two stakeholders — what did you do?
- How do you estimate frontend work?
- How do you handle thrash or shifting requirements mid-sprint?
- How do you balance tech debt vs feature delivery?
- What do you do when you’re blocked?
- How do you manage context switching?
- How do you communicate delays early?

---

## 7. Accessibility — tools & outcomes

- How do you define “accessible” for a web app?
- What WCAG concepts do you actually apply day to day?
- How do you test accessibility beyond automated scans?
- Which tools have you used (axe, Lighthouse, screen readers, keyboard-only)?
- Tell me about a concrete accessibility bug you fixed — root cause and prevention.
- How do you handle accessible forms: labels, errors, focus management?
- How do you approach modals and focus traps?
- How do you work with design when the mock isn’t keyboard-friendly?
- How do you balance **508 / compliance** pressure vs shipping?
- What’s your approach when a third-party widget isn’t accessible?

---

## 8. SEO — tools & outcomes

- What SEO work have you owned vs partnered on?
- How do you think about SEO for a **SPA** vs marketing pages?
- What tools have you used (Search Console, Lighthouse SEO audits, structured data testing)?
- How do you approach meta tags, canonical URLs, and routing?
- How do you collaborate with marketing or content on SEO?
- Tell me about an SEO-related fix you shipped — what moved?
- How do you avoid SEO regressions during refactors or migrations?
- What’s your take on SSR/SSG vs CSR for SEO — when does it matter?
- How do you handle internationalization / duplicate content risks (if relevant)?
- What metrics do you watch (if any) after an SEO change?

---

## 9. Performance — tools & outcomes

- How do you define “fast enough” for users?
- What Core Web Vitals do you pay attention to and why?
- What tools do you use (Lighthouse, WebPageTest, RUM, Chrome Performance panel)?
- Tell me about a performance win — before/after signal (metrics or proxy).
- How do you find and fix bundle-size regressions?
- How do you approach lazy loading, code splitting, and route-level chunks?
- How do you debug layout shifts (CLS)?
- How do you balance third-party scripts vs performance?
- How do you prevent perf regressions in CI (budgets, profiling)?
- What’s a perf mistake you’ve made and how you’d avoid it now?

---

## 10. React fundamentals (components, state, effects)

- How do you decide where state lives in a React tree?
- Explain controlled vs uncontrolled inputs — when do you pick each?
- When do you lift state up vs colocate it?
- How do you handle derived state — compute vs store?
- Rules of Hooks — what breaks them and why does React care?
- `useEffect` — what belongs there vs event handlers vs render?
- How do you avoid stale closures in effects?
- Keys in lists — what goes wrong with a bad key?
- Error boundaries — what they catch, what they don’t.
- Suspense — where you’ve used it or would consider it.

---

## 11. React reconciliation, rendering, updates

- What is reconciliation at a high level?
- What triggers a re-render in React?
- How do you reduce unnecessary renders **without** prematurely optimizing?
- When is `React.memo` appropriate? When is it foot-gun territory?
- `useMemo` / `useCallback` — when do they help vs add noise?
- How do you debug “why did this render?”
- How do batching updates affect what you observe in React 18?
- How do you think about concurrent features / transitions (if you use them)?

---

## 12. React ecosystem patterns (HOCs, composition, legacy awareness)

- What is a Higher Order Component — pros/cons vs hooks?
- Have you maintained legacy class components — how did you migrate or wrap them?
- Render props vs hooks — trade-offs you’ve seen in real codebases.
- Context — good uses vs “global Redux via context” pitfalls.
- Code-splitting patterns at route vs component level.
- How do you structure feature folders vs layers?
- How do you isolate side effects from presentation components?

---

## 13. React performance techniques

- Profiling workflow in DevTools — what you look for first.
- Virtualization for long lists — when it matters.
- Debouncing/throttling user-driven updates — examples.
- Image and asset loading strategies that improved UX for you.
- Animation perf — layout thrashing, `will-change`, avoiding main-thread overload (high level).
- Identifying expensive third-party libraries.
- Measuring impact after a perf change — what would you report to leadership?

---

## 14. JavaScript fundamentals — core language

- Explain event loop + microtasks vs macrotasks — why `setTimeout(0)` behaves oddly next to Promises.
- `async/await` — error handling patterns you prefer.
- Closures — a practical example from UI code.
- `this` binding — where it bites people in JS (and how modules/classes change the story).
- Shallow vs deep equality — when it matters in React state updates.
- Immutable updates — patterns for objects/arrays without mutation bugs.
- Modules: ESM vs CJS interop pain you’ve hit.

---

## 15. JavaScript — DOM, events, browser APIs

- Event bubbling vs capturing — give an example where it mattered.
- `preventDefault` vs `stopPropagation` — when each is correct.
- Understanding `target` vs `currentTarget`.
- Fetch API — timeouts, retries, cancellation (`AbortController`).
- Storage: session vs local — security-ish considerations for tokens (high level).
- Basic XSS mindset — where frontend engineers accidentally create holes.

---

## 16. Scenario-style (common follow-ups)

- The designer handed you a beautiful UI that fails keyboard navigation — what do you do?
- Production is down / users can’t complete enrollment — how do you triage frontend vs backend?
- You found a critical bug on Friday at 4pm — walk me through your response.
- Two PRs conflict on a shared component — how do you resolve without breaking consumers?
- You need to ship fast but accessibility is non-negotiable — how do you sequence work?
- Legacy Ember page vs new React page — how would you approach incremental migration questions **conceptually**?
- API keeps changing under you — how do you stabilize the frontend contract?

---

## Quick map → original likely prompts

| Original bucket              | Sections in this bank                          |
| ---------------------------- | ----------------------------------------------- |
| Tell me about yourself       | §1                                              |
| Last project / achievements  | §2                                              |
| Strengths                    | §3                                              |
| Weaknesses                   | §4                                              |
| Remote collaboration         | §5                                              |
| Priorities                   | §6                                              |
| Accessibility                | §7                                              |
| SEO                          | §8                                              |
| Performance                  | §9                                              |
| React fundamentals           | §10–§13                                         |
| JavaScript fundamentals      | §14–§15                                         |
| Scenario pressure-tests      | §16                                             |

---

## Maintenance

After the real interview, add **actually asked** questions to `american-specialty-health-frontend-engineer.md` (pipeline log) or append a dated subsection here so future rounds stay grounded in signal.
