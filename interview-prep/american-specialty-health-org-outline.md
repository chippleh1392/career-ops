---

## type: company-org-outline
company: American Specialty Health
source: [jobvite-careers, job-postings, linkedin-snapshots-aggregators]
updated: 2026-04-24
note: "Rough model from public openings + LinkedIn (Engineering filter). Titles change."

# ASH — rough org / function map (from job openings)

**Purpose:** first-pass picture of how the company *splits work*, so your HM conversation has vocabulary. This is **not** an org chart and **not** current headcount. Open roles change **daily**.

**Primary sources (today):** [Jobvite home](https://jobs.jobvite.com/ashcompanies) (buckets + featured jobs) + public listing text; linked aggregators (Built In, Career.com) for **Consumer Technology** / **IT** wording.

---

## 1) How they label departments (Jobvite “Explore your future”)

From the careers hub, they explicitly bucket hiring into (paraphrased from site navigation):


| Bucket                        | What it suggests                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| **Customer Service**          | Member / participant support, tier-1 type roles; many **Remote**, hourly.           |
| **Technology**                | IT / software / security / data — **broad** “digital enablement + products.”        |
| **User Experience & Design**  | UX, product design, design ops (often paired with Consumer Technology in practice). |
| **Claims**                    | Claims operations, financial reconciliation, benefit transactions.                  |
| **Sales & Marketing**         | Growth, B2B client acquisition, comms, field/adjacent.                              |
| **Clinical**                  | Licensed clinicians, **medical necessity** / quality / rehab / acupuncture, etc.    |
| **Accounting & Finance**      | Close, AR/AP, **treasury**, reconciliation.                                         |
| **Health Coaching**           | Coaching and wellness support (often separate from call-center CS).                 |
| **Human Resources**           | HRBP, comp/benefits, HRIS, coordination.                                            |
| **Regulatory & Compliance**   | Healthcare / contract / program compliance.                                         |
| **Legal & Contract Services** | Legal, contracting.                                                                 |


**Takeaway:** ASH is structurally a **payer / administrator + clinical network + consumer programs** business — technology sits **across** member-facing, internal ops, and enterprise integrations, not a single “product SWE” monolith.

---

## 2) “Technology” is multi-track (inferred from posting language)

### A. **Information Technology** (enterprise / back-office engineering)

- Listings (e.g. **Sr Software Engineer I**) point to **“Information Technology”** / **.NET** stack: **ASP.NET, C#, SQL Server/MySQL**, web services, **XML/XSLT** in places — classic **line-of-business and integration** work for a benefits administrator.
- Often appears alongside **data / EDI** work (**Manager-EDI**, **mid-level data engineer**-style copy on mirrors) for **eligibility, transactions, and partner feeds**.
- **Implication:** Some teams own **“ASHCore”-style** systems; front end may **consume** more than it owns the schema.

### B. **Consumer Technology** (member / digital products)

- **SDET** / test-automation copy explicitly says **“Consumer Technology”** — web apps, **Selenium/Playwright**-class automation, C#-ish backend tests in some posts.
- **Manager, Front End Engineering** (older Built In post, removed) said **“Consumer Technology – Software (CRS)”** — a named **org under consumer tech** for **front-end** leadership.
- **CTO (public management page)** is framed around **consumer-facing applications** and **member engagement** — so **this is the neighborhood** your **React / SPA** work most likely lives in (confirm with ASH).

### C. **Platform / security / operations**

- **Manager-DevSecOps**, **Manager-Security Incident Response & Operations** (featured on Jobvite in recent snapshots) — **security, IR, and cloud/tooling** as its own line.
- **Implication:** You may interact with **security reviews**, **WAF/identity**, and **compliance** on releases.

---

## 3) Service & operations (not “engineering” but huge)

- **Call center / Concierge** / **Credentials** (hourly, remote) — high-volume **operational** workforce; often **independent** from product engineering but defines **“what the app must not break.”**
- **Fort Worth** in particular = large **ops / service / claims / clinical support** site (per press); **Carmel** and **San Diego** are the other named **office** anchors on Jobvite (with **on-site** roles still present, e.g. some HR / data entry).
- **Implication:** Product teams are **serving** internal and external users under **tight** process; **UAT and compliance** are real.

---

## 4) Clinical & network (sister universe to your role)

- **CQE** (Clinical Quality) managers for **rehab, OT, PT, acupuncture**, etc. — **medical necessity** review, **licensed** staff.
- **Client Services – Clinical (CTC)** and **Client Services** — **B2B account** owners for plan sponsors.
- **Provider relations**, **fitness network** reps — keep **gym/ provider** networks and contracts healthy.
- **Implication:** These groups **define** program rules; engineering **implements** and **integrates** them. Good interview question: *Who owns the source of truth for business rules?*

---

## 5) Where your role probably sits (hypothesis to validate)


| Likely                                                     | Rationale                                                                                       |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Under Consumer Technology** (software product)           | React / web SPA, **Manager FE** was **Consumer Technology – Software (CRS)** in one public req. |
| **Partners with** **UX & Design**                          | Same careers navigation; you’ll work with product/design.                                       |
| **Integrates with** **IT/EDI** and **.NET** services       | Public stack signals for other teams.                                                           |
| **Uses** **QA/SDET** in Consumer Technology for automation | Listings name **Consumer Technology** for test engineers.                                       |
| **Peers:** security / DevSecOps, data/EDI, platform        | Cross-team for releases, incidents, and integrations.                                           |


**Ask the HM:** *Which cost center or VP chain?* *Which product line* (e.g. Active&Fit vs internal tools) *day one?*

---

## 6) Gaps in public data (honest)

- **Jobvite category filters** (e.g. `Technology` alone) can return **zero rows** when nothing is open in that filter — the **home page** may still list **featured** or **unfiltered** jobs.
- **Recruiter/contingent** reqs (e.g. your **React** pipeline) may **never** map 1:1 to a public title.
- **EmergeCore Networks** and similar can appear in **LinkedIn** search aggregations; **treat as noise** unless the posting clearly says ASH on the company line.

Re-run [View all jobs](https://jobs.jobvite.com/ashcompanies/jobs/alljobs) when you want a **fresh** list.

---

## 7) LinkedIn — company page stats (unfiltered / “all”)

From the company **People** tab **before** the Engineering filter (your screenshot):


| “What they do” (LinkedIn category) | Count   |
| ---------------------------------- | ------- |
| Customer Success and Support       | 342     |
| Healthcare Services                | 289     |
| **Information Technology**         | **204** |
| **Engineering**                    | **167** |
| Business Development               | 131     |


**Geography (top of People tab):** e.g. **~162** U.S. (toggle), **~73** California, **~57** San Diego metro, **~46** San Diego, **~19** Indiana.

**Implication:** On LinkedIn, **Engineering (167) < IT (204)**. Many **platform, business apps, integration, and ops-adjacent** people may sit under **IT** in this taxonomy, while “Engineering” is still a **substantial** product-build slice. **Not everyone who codes is in “Engineering.”**  

Company page: **1K–5K** employees, **~167** “associated members” on the org chart widget (LinkedIn’s networking concept — not FTE count).

---

## 8) Engineering filter — rough structure (from your scroll)

**Source:** you filtered to **“Engineering”** (~**167** in that category, **6 pages** of people). The list below is **inferred from one long scroll (effectively “page 1” worth of visible profiles)** — **not a full census** of all 167. Use it for **vocabulary and shape**, not exact ratios.

### A) Executive & senior engineering leadership (small)

- Titles that appeared: **VP, Software Engineering**; **SVP, Software Engineering**; **Associate Director, Software Development**; **Director, System Administration**; **VP**-class security (cloud) in at least one profile.
- **Implication:** A **classical** enterprise ladder — you’re not a flat 30-person dev shop. **Slavisa Mihajlovic** and **Hamid Sadre**-level names anchor **org-wide** software; your **FE** work likely rolls up under a **Manager → Director → VP** chain on the **application** side.

### B) Front-end and UI (where you want to be)

- Titles: **Sr. Manager, Front End Engineering** (Anthony Trama — same author as the **Ember → React** ASHTech post), **Staff Front End Engineer**, **Senior Frontend Engineer**, **Frontend Software Engineer**, **Sr Front-end engineer**, **React Frontend Developer**, **Fullstack React/Angular Web Developer**, **Tech Lead, .NET / React**, **UI Developer**.
- **Implication:** There is a **dedicated** front-end leadership and **IC ladder**; **React** and **.NET+React** both appear — matches **migration + enterprise stack** story.

### C) General software engineering (largest visible bucket)

- **Software Engineer I / II / III**, **Staff / Sr. Staff**, **Associate SE**, **Backend Developer**, **Programmer/Analyst**, **Software Developer** — wide spread of levels.
- **.NET** shows up in headlines (**C# .NET**, **.NET Application Developer**), matching public **IT job postings** (ASP.NET, SQL).

### D) Software development engineer in test (SDET) — very visible

- **Software Engineer in Test I/II**, **SDET I/II**, **Associate Software Engineer in Test** (e.g. **Playwright** + **CI/CD** in headline), **Software Test Automation Engineer**, **Software Design Engineer in Test**; a **Software Development Manager – QA**.
- **Implication:** **Test automation** is a **strong** function — aligns with the JD’s **unit testing** ask; you may work **with** a parallel QA/SDET org (white-box, Playwright, etc. per their postings).

### E) DevSecOps, platform, and cloud

- **Sr. / Staff DevSecOps**, **DevSecOps Engineer II**, **Platform Engineering** (e.g. **Sr Manager, Platform** in one result), **Principal Staff** cloud/security, **SRE/FinOps/Platform** language in a few, **GMC Inspire** (document composition) **Designer/Developer** (print/PDF/comm templates — enterprise).
- **Implication:** **Releases and security** are **staffed**; expect **compliance** (e.g. HIPAA) and **pipeline** gates in the conversation.

### F) EDI, integration, healthcare data exchange

- **EDI Software Engineer**, **EDI Integration Engineer**, **Senior Integration Engineer** (X12 EDI, healthcare IT).
- **Implication:** **Data interchange** is core to **benefit administration** — you may **integrate** with services owned by this lane even if you don’t do EDI yourself.

### G) Microsoft business applications

- **Dynamics 365**, **Power Platform & Dynamics**, **SR CRM Developer**, **ITSM / ServiceNow**-style “Developer” titles.
- **Implication:** **CRMs and internal business apps** are a **sizable** build surface **alongside** member-facing **React** web — useful to know **where** the hiring manager’s team sits (consumer product vs business apps).

### H) Data and analytics (edge of your paste)

- **Data Engineer**; some **Data Analyst / Big Data**-style (verify still at ASH).

### I) Delivery / process

- **Scrum Master I/II**, **Scrum Master Manager / Agile Coach**, **Software Development Manager** (several) — **Agile/Scrum** is explicit.

### People worth knowing for *your* thread (if you name-drop)

- **Anthony Trama** — **Sr. Manager, Front End Engineering**; public **React** migration narrative on Medium (**ASHTech**).
- **Bryan Creel** — **Staff Front End Engineer** (listed in your results).
- **Haley Foxworth** — mutual connection to **Trama** in one screenshot — small-world confirmation you’re in the right **org neighborhood**.

**Privacy:** we **did not** paste the full 167-name list into the repo. Add a private export locally if you want a permanent archive with names.

### Optional — append more pages

If you copy **pages 2–6** of Engineering only into a **local** file, you can refresh counts. Pattern should hold: more **SE** and **SDET** ICs, same leadership spine.

---

## See also

- [american-specialty-health-frontend-engineer.md](./american-specialty-health-frontend-engineer.md) — role dossier + questions.

