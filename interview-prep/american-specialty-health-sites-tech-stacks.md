---

## type: research
status: active
companies: [American Specialty Health]
source: [wappalyzer-csv, manual-html-2026-04, dom-first-paint-analysis, playwright-hydrated-2026-04-24]
role: n/a
updated: 2026-04-24

# American Specialty Health — public sites: tech stack rundown & comparison

This note compares **Wappalyzer** exports for ASH’s **fitness / wellness** web properties, plus a short **static HTML** supplement from server-source inspection. Use it to reason about **Ember → React** migration state and **shared platform** pieces — then **confirm in interview** (team + product own different surfaces).

**Sources**


| Source                                  | What it is                                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Wappalyzer CSVs** (user `Downloads/`) | Fingerprinting from the **scanned page**; toolVersion not in export — **re-run** Wappalyzer before big decisions.                        |
| **Server HTML (curl) — ~2026-04**       | `meta name=".../config/environment"` (Ember boot), `div#app-container`, `script` `src` to `ui.api.ashcompanies.com` / `static.ashn.com`. |


**Caveats**

- Wappalyzer can list **more than one** “JavaScript framework” on a URL if **both** appear in the response (migration, micro-frontends, or false positives in minified code).
- **activeandfitdirect.com** bare `**/`** had returned a small **ASP.NET-style error** page in one check; the **member** experience may live under paths like `**/default.aspx`** — scanners should use the **same** URL the member hits.

---

## 1) Executive comparison (Wappalyzer — framework & payments)


| URL                                                              | Product / role (approx.)                       | Wappalyzer: primary frameworks                         | Wappalyzer: pay / chat / cloud                   |
| ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| [www.activeandfit.com](https://www.activeandfit.com)             | Active&Fit Enterprise (employer / plan)        | **React**; **Emotion**; **React Router**               | **PayPal**; **Azure** (PaaS tag)                 |
| [www.activeandfitdirect.com](https://www.activeandfitdirect.com) | Direct / retail-style enrollment (scan target) | **React**; **Emotion**; **React Router**               | **PayPal**; **Intercom**; **Azure**              |
| [www.activeandfitnow.com](https://www.activeandfitnow.com)       | Active&Fit “Now” variant                       | **Ember.js** only (in this column)                     | **PayPal**; **Intercom**; **Azure**              |
| [www.silverandfit.com](https://www.silverandfit.com)             | Silver&Fit (member)                            | **React**; **Ember.js**; **Emotion**; **React Router** | **Recurly**; **PayPal**; **Intercom**; **Azure** |


**Read across:** **A&F (main)**, **A&F Direct** → Wappalyzer reads **React + Emotion + React Router** (and **MUI** in UI column — see §3). **A&F Now** → **Ember** in the same export style. **Silver&Fit (www)** → **both** React and Ember — consistent with a **strangler / dual-stack** period on that host.

---

## 2) Side-by-side: analytics, RUM, PWA, libraries


| URL                    | PWA (Misc)                 | Analytics                       | RUM / perf                                        | Live chat / CRM-ish | JS libraries (Wappalyzer)                      | UI (Wappalyzer)                                                                               |
| ---------------------- | -------------------------- | ------------------------------- | ------------------------------------------------- | ------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| activeandfit.com       | PWA                        | Google Analytics; Azure Monitor | Azure Monitor (perf)                              | —                   | —                                              | Google Font API; Material UI; Emotion                                                         |
| activeandfitdirect.com | PWA                        | Google Analytics; Azure Monitor | **web-vitals**; Azure Monitor                     | **Intercom**        | **web-vitals**                                 | Google Font API; Material UI; Emotion; **Intercom** (also under CRM-like)                     |
| activeandfitnow.com    | PWA; **Popper**; **Babel** | Google Analytics; Azure Monitor | **Microsoft Application Insights**; Azure Monitor | **Intercom**        | lit-html; lit-element; jQuery; core-js         | Google Font API; **Canyon**; **Intercom**                                                     |
| silverandfit.com       | **Popper**; **Babel**; PWA | Google Analytics; Azure Monitor | Microsoft Application Insights; Azure Monitor     | **Intercom**        | Swiper; jQuery; core-js; lit-html; lit-element | Google Font API; **Material UI**; **Canyon**; **Emotion**; **Intercom**; **YouTube** (player) |


**Patterns**

- **Azure**-aligned telemetry: **Google Analytics** + **Azure Monitor**; member surfaces often add **Application Insights** (strong **Microsoft** hosting / ops story).
- **Intercom** on several **member** flows; **Direct** and **A&F Now** and **Silver** list it; **A&F (main home scan)** did not in this CSV (may be route-dependent).
- **Ember**-adjacent or shared polyfills: **lit-html / lit-element** on A&F Now and Silver (common near **Ember** or shared chunks); **jQuery** + **core-js** still present in places.

---

## 3) Wappalyzer — full non-empty fields by site (export rows)

### [www.activeandfit.com](http://www.activeandfit.com)

- **Miscellaneous:** PWA  
- **Analytics:** Google Analytics; Azure Monitor  
- **Font scripts:** Google Font API  
- **Performance:** Azure Monitor  
- **JavaScript frameworks:** React; Emotion; React Router  
- **Payment processors:** PayPal  
- **PaaS:** Azure  
- **UI frameworks:** Material UI  
- **JavaScript graphics:** Emotion

### [www.activeandfitdirect.com](http://www.activeandfitdirect.com)

- **Miscellaneous:** PWA  
- **Analytics:** Google Analytics; Azure Monitor  
- **Font scripts:** Google Font API  
- **Tag managers / Live chat:** Intercom (listed under Live chat)  
- **JavaScript libraries:** web-vitals  
- **RUM:** web-vitals  
- **Performance:** Azure Monitor  
- **JavaScript frameworks:** React; Emotion; React Router  
- **Payment processors:** PayPal  
- **PaaS:** Azure  
- **UI frameworks:** Material UI  
- **Authentication / CRM (columns):** Intercom  
- **JavaScript graphics:** Emotion

### [www.activeandfitnow.com](http://www.activeandfitnow.com)

- **Miscellaneous:** PWA; Popper; Babel  
- **Analytics:** Google Analytics; Azure Monitor  
- **Font scripts:** Google Font API  
- **Tag managers / Live chat:** Intercom  
- **JavaScript libraries:** lit-html; lit-element; jQuery; core-js  
- **RUM:** Microsoft Application Insights  
- **Performance:** Azure Monitor  
- **JavaScript frameworks:** Ember.js  
- **Payment processors:** PayPal  
- **PaaS:** Azure  
- **Authentication / CRM (columns):** Intercom  
- **UI frameworks / graphics:** Canyon

### [www.silverandfit.com](http://www.silverandfit.com)

- **Miscellaneous:** Popper; Babel; PWA  
- **Analytics:** Google Analytics; Azure Monitor  
- **Font scripts:** Google Font API  
- **Tag managers / Live chat:** Intercom  
- **JavaScript libraries:** Swiper; jQuery; core-js; lit-html; lit-element  
- **RUM:** Microsoft Application Insights  
- **Performance:** Azure Monitor  
- **JavaScript frameworks:** React; Ember.js; Emotion; React Router  
- **Payment processors:** Recurly; PayPal  
- **PaaS:** Azure  
- **Video players:** YouTube  
- **UI frameworks:** Material UI  
- **Authentication / CRM (columns):** Intercom  
- **UI / graphics:** Canyon; Emotion

---

## 4) Static HTML supplement (server source — not Wappalyzer)

**When checked (~2026-04)** the **member** home pages for the four program sites exposed **Ember** boot metadata, e.g.:

- `meta name="active-and-fit/config/environment"`, `activeandfitnow-frontend/config/environment`, `silver-and-fit/config/environment`, `active-and-fit-direct/config/environment`  
- `APP.rootElement: "#app-container"` in those JSON blobs  
- Script bundles from `**https://ui.api.ashcompanies.com/.../assets/vendor.js`** + app-named chunks, and/or `**https://static.ashn.com/...-web-assets/...**`

**activeandfitdirect.com:** `GET /` returned a **small 404** body (jQuery/Bootstrap, ASH footer); `**/default.aspx`** returned the full **SPA** shell with the same Ember-style metas and **AFD** static assets.

**Tension with Wappalyzer:** the CSVs for **activeandfit.com** and **activeandfitdirect.com** list **React + Emotion + React Router**; the raw HTML in the same period still showed **Ember** `config/environment` on **A&F** and **AFD** home documents. Plausible reconciliations: **A/B** or **CDN cache** differences; **scanner** path vs. default document; or **in-flight** migration (React bundles in network while Ember metas remain). **Silver&Fit (www)** Wappalyzer **explicitly** lists **React and Ember** — best alignment with a **hybrid** period.

**Action:** for “what will I work on?”, use **Wappalyzer** as one signal, **this HTML** as another, and **Hiring Manager / team** as ground truth.

---

## 5) DOM, class names, and first-paint FE architecture (HTML analysis)

**What was analyzed:** **First-paint / View Source** HTML (same as pre-hydration DOM) for **[www.activeandfit.com](http://www.activeandfit.com)**, **[www.silverandfit.com](http://www.silverandfit.com)**, **[www.activeandfitnow.com](http://www.activeandfitnow.com)**, and **[www.activeandfitdirect.com/default.aspx](http://www.activeandfitdirect.com/default.aspx)** — **not** post-load DevTools (so **MUI** class names like `MuiButton-root` generally **do not** appear in this layer; MUI is inferred from **JS** via Wappalyzer and loads inside `**#app-container`**.)

### 5.1 Document shell: layout, grid, a11y

- `**html`:** often `class="no-js"` (JS removes/replaces for progressive enhancement).  
- `**body`:** `isPublic` on all; `**isHome`** on home; Direct uses `**isPublic**` without `isHome` in one capture.  
- **Outer structure (typical):** `div.body-inner` → (optional) **hidden SVG icon sprite** + header chrome + app mount. **SVG** uses `symbol` elements with **stable ids** (e.g. `*-icon`, `afLogo-icon`, `afdLogo-icon`) — **inline sprite** pattern for icons, not a separate font icon set in the first paint.  
- **Header / brand:** `mainHeader`, `main-container`, `primaryLogo` / `primaryLogoGlyph`, `hasGlyph` (Direct). Mix of **semantic-ish** and **BEM-like** kebab/lowerCamel (e.g. `message-text`, `icon-Alert`, `icon-large`, `status-message`, `keepSession` / `endSession` for session modals).  
- **Grid:** Bootstrap-y tokens appear (`container`, `row`, `col-12` on A&F home). **Screen-reader** affordances: `**sr-only`**.  
- **Direct** adds `**afd-app-container`** and `**applicationWrapper**` and `**app-container` as a class** in addition to `**id="app-container"`** (same label used as **id** and **class** in places — a mount + styling hook pattern).

### 5.2 Mount points and “who owns the screen”

- `**id="app-container"`** — main **client SPA** mount (Ember’s `config/environment` points `APP.rootElement` here). This is the **application island**; everything that looks “product” after load hydrates or renders **inside** or alongside as engines dictate.  
- `**id="navContainer-content"`** (seen on A&F + AFD) — **separate** region for **top-of-page navigation chrome**; suggests **split** between **nav shell** and **app body** in the static template (one server layout wrapping multiple concerns).  
- **Head** still holds **Ember** `meta name="<module>/config/environment"` for the primary app and **in-repo engines** (search, incentives, resource library) — so **orchestration** is **Ember**-centric at the **module** level even when **React** ships for **feature** slices (see below).

### 5.3 `data-*` and third-party boot

- `**data-dtconfig` / Dynatrace** — RUM / session replay style agent on the document.  
- `**data-ash-*`** — session / modal flows (e.g. keep vs end session); **server-owned** URL hooks for `data-ash-keepsession-url` / `data-ash-endsession-url`. This is a **.NET (or host) + SPA** contract: the shell knows about **auth/session UX** in markup.  
- **GTM** noscript iframe + normal **gtag** in head (analytics).

### 5.4 Server-injected config: `ASH.WebPlatform.SPAPlugin` and `$$params`

The member HTML includes a **large** inline assignment (e.g. `var $$params = { ... }`) whose types are namespaced `**ASH.WebPlatform.SPAPlugin.ServiceModel...`** (**.NET** types serialized to JSON for the client). This is a **structural** signal:

- **Host model:** a **web platform** layer serves the SPA, not a **static S3 index only**. It injects **per-request / per-tenant** config: e.g. `**tenant`** (`ActiveAndFit`, `SilverAndFit`, …), **menu** trees (`footer-nav`, `social-nav`, `main-nav`, etc.), **footer** / legal, **Recurly** public key, **feature flags** / toggles, **member/session** state placeholders, and **identity** (OIDC-style redirect URIs and client id strings — **sensitive; do not paste** into public docs or screenshots).  
- *“React” in toggles (examples, not exhaustive):** flags such as `**ReactBilling`**, `**ReactContactUs**`, `**ReactIdentity**`, `**ReactIncentives**`, `**ReactPlugin**`, `**ReactSurvey**`, and similar — i.e. **strangler** delivery: the **Ember/SPA** shell remains, but **specific flows** are **React**-backed when the flag is on. This matches Wappalyzer seeing **React** and **Ember** on the same host.  
- **Intercom** (and similar) is consistent with a `**ChatBot-Intercom`**-style flag in the same list.

**Security note:** that blob can contain **tokens**; treat production **View Source** as **confidential** and don’t store raw exports in git.

### 5.5 MUI: static HTML vs DevTools (hydrated DOM)

**Material UI (MUI)** / **Emotion** classes (`Mui`*, `css-*` hashes) show up in the **Elements** tree **after** React runs (hydrated / client-rendered DOM). A **View Source** or `curl` of the **first** document only sees the **shell** (metas, scripts, mount node, `$$params`) — not the `MuiBox` / `MuiAppBar` / `MuiGrid2` tree. So: **MUI is absolutely visible in DevTools** on e.g. **activeandfit.com** when you inspect the live page; it was “missing” in our static-only pass because we did **not** use post-load DevTools. First paint is mostly: **icon sprite**, **nav chrome**, mount root, and **injected** `$$params` — the **MUI** layout you see in the inspector is **downstream** of that.

### 5.6 Summary diagram (first paint → runtime)

```text
[.NET / ASH.WebPlatform host]
    → inline $$params (tenant, menus, flags, session hints)
    → layout HTML: body-inner, GTM, Dynatrace, SVG symbols
    → nav region (e.g. navContainer-content) + #app-container
[Ember engine(s) + React feature islands per toggles]  →  MUI/Emotion in client bundles (Wappalyzer)
[API: *.ashcompanies.com, identity, payment providers]
```

### 5.7 Full hydrated DOM (Playwright) — 2026-04-24

To capture the **post-JS** tree (what DevTools shows), use the repo script:

```bash
node scripts/capture-hydrated-dom.mjs --ash-public
# or: node scripts/capture-hydrated-dom.mjs https://www.activeandfit.com/
```

**Output:** `interview-prep/snapshots/<date>-<host>-hydrated.html` plus a `**.summary.json`** (counts, mount ids). That folder is **gitignored** — large and potentially sensitive; regenerate locally as needed.

**Chromium, headless:** `domcontentloaded` → wait for `[class*="Mui"], #root, #app-container` (15s cap) → **2.5s** settle for async UI.


| URL                                                                                    | Mount in hydrated DOM                                  | MUI-ish signal                                                                                     | Notes                                                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [activeandfit.com](https://www.activeandfit.com/)                                      | `**id="root"`** (no `#app-container`)                  | **~1.4k** `Mui*`/Emotion `css-*` ref hits; **MuiGrid2**, **MuiTypography**, **MuiButton** dominate | **React + MUI v5+** (Grid2) in live DOM.                                                                                                        |
| [activeandfitdirect.com/default.aspx](https://www.activeandfitdirect.com/default.aspx) | `**id="root"`**                                        | **~500**; **MuiButton** / **MuiGrid2** / **MuiDialog** / **MuiSwitch**                             | Same family; more **form/dialog**-shaped than A&F home.                                                                                         |
| [activeandfitnow.com](https://www.activeandfitnow.com/)                                | `**id="app-container"`**; `**body**` `isPublic isHome` | **0** `Mui*`; **~76** `ember` substring hits in `class`                                            | **Ember**-shaped class soup (`ember-*`, `ashLinkButton`, `homepage*`, `materialIcon` for icon font) — **not** the MUI-in-`#root` pattern.       |
| [silverandfit.com](https://www.silverandfit.com/)                                      | `**id="root"`**                                        | **~1.9k**; top tokens **MuiGrid** (v1) + **MuiTypography** + **MuiButton**; also **MuiCard**       | **React + MUI**; this page leans **Grid** (not Grid2) vs **Active&Fit** (Grid2-heavy) — possible **different app version or product template**. |


**Takeaway:** **Three** of four program homes in this capture use `**#root` + heavy MUI** when hydrated. **Active&Fit Now** is the outlier: `**#app-container` + Ember** classnames, no MUI tree in the same sense. That matches a **per-product** migration map, not one universal stack on every host.

### 5.8 Inferred React architecture (educated guess, not fact)

**What we know from the outside:** **React** + **React Router** + **MUI (Emotion)** on several surfaces; **.NET** host injects `$$params` and **toggles** like `ReactIdentity`, `ReactBilling`, etc.; ASHTech described **two starter repos** (one for **SPAs**, one for **shared components**) and **matrix** product teams. Hydrated pages mount at `**#root`** and are **MUI**-dense (**Grid2** on one home, **Grid** on another — suggests **not** a single global React version in every line of business, or different bundle generations).

**Reasonable model:**

1. **Apps:** **One React SPA (or a small number of deployable SPAs) per program line** — not one repo that powers *every* company on earth, but **repeated** “member portal” / enrollment patterns with **tenant** and **config** (menus, feature flags) supplied by the host. Each deployable is likely **one main `createRoot` on `#root`** (plus portals for dialogs, Intercom, etc.).
2. **Shell integration:** A **.NET** page wrapper (`**ASH.WebPlatform.SPAPlugin`**) preloads **session-ish config**, **nav/footer structure**, and **string toggles** so the client doesn’t re-fetch *everything* on first paint. The React app probably **hydrates** or **init-reads** that blob (e.g. `window` / a script tag) and then talks to `***.api.ashcompanies.com` APIs** for real business data. **Strangler** behavior: the same page can still host **Ember** for A&F Now while other routes use **React** where toggles enable `**React*`** feature bundles.
3. **UI layer:** **MUI v5+** with **default Emotion** styling (`css-*` hashes) — not Tailwind in the main tree. **Trama’s** org cares about a **common design system**; MUI is likely the **enforced** component layer for new React, with **theme overrides** to match **ASH** branding.
4. **Routing & code shape:** **React Router**-style **client routing** (Wappalyzer) for in-app navigation; public URLs may still be **.NET**-routed for SEO/cookie domains. **Code splitting** is implied (Medium: **lazy** routes, **vendor** + app chunks) — probably **webpack**- or **Vite**-style splits; the Medium post mentioned moving **beyond CRA** into **custom** starters, so the **bundler** is not necessarily identifiable from the outside.
5. **State & data:** Not visible from the DOM. Enterprise patterns for this shape are often **server state in TanStack Query / RTK Query** and **form/subscription** flows for Recurly — **no proof** in our artifacts; only **inference** from integration surface.
6. **What this is *not* (unless they tell you):** A single **Next.js** site for the member app (we didn’t see **Next** signals in our passes); a **unified** React monolith already owning **every** domain — **Ember** on A&F Now and **MuiGrid** vs **MuiGrid2** split argue against a single “one React to rule them all” release train without branches.

**Interview:** Ask how **one product** maps to **one repo** vs a **monorepo**, how `**$$params` / toggles** meet **Feature flags** (LaunchDarkly vs homegrown), and whether **MUI** is the **sole** design system for React or coexists with a **headless** internal package.

---

## 6) How this lines up with ASHTech (public)

- [I Love Ember… We Decided to Switch to React](https://medium.com/ashtech/i-love-ember-our-team-decided-to-switch-to-react-and-im-ecstatic-3eef66f01bd) — org-wide **React** decision; **Ember** history; multiple **SPAs** and **shared** components.  
- [How We Moved All Our Teams to React…](https://medium.com/ashtech/what-do-we-now-starting-our-journey-on-the-road-to-react-81878898fc7b) — **migration** strategy, **starter repos** (SPA vs shareable components), not a single **big-bang** rewrite for every line of business on day one.

So: **Wappalyzer + HTML** both support a story of **per-product** migration speed — **A&F Now** more **Ember**-weighted in the export; **A&F / AFD** more **React**-weighted; **Silver&Fit (www)** **both** flags.

---

## 7) Files referenced (Wappalyzer CSVs)

- `C:\Users\chipp\Downloads\wappalyzer_activeandfit-com.csv`  
- `C:\Users\chipp\Downloads\wappalyzer_activeandfitdirect-com.csv`  
- `C:\Users\chipp\Downloads\wappalyzer_activeandfitnow-com.csv`  
- `C:\Users\chipp\Downloads\wappalyzer_silverandfit-com.csv`

**Hydrated DOM (local, gitignored):** `interview-prep/snapshots/*-hydrated.html` — produced by `scripts/capture-hydrated-dom.mjs`.

---

## 8) Maintenance

When you re-scan in Wappalyzer, add a one-line **date** and **URL** under §3, or update §1/§2 tables. To refresh **§5.7** (hydrated), run `node scripts/capture-hydrated-dom.mjs --ash-public` and bump the table date. To refresh the **View Source / `$$params`** notes, re-fetch **View Source** for the same member URLs and update **§4–5** (avoid committing secrets). If you get **contradictory** framework rows again, copy **one** redacted `View Source` or **HAR** `document` for the same session into a scratch line here for later debugging.

If this doc drifts, cross-link the interview dossier: `interview-prep/american-specialty-health-frontend-engineer.md`.