# Mode: deep — Deep Research Prompt

Generate a structured prompt for Perplexity/Claude/ChatGPT with 6 axes:

```
## Deep Research: [Company] — [Role]

Context: I'm evaluating an application for [role] at [company]. I need actionable information for the interview.

### 1. AI strategy
- What products/features use AI/ML?
- What is their AI stack? (models, infra, tools)
- Do they have an engineering blog? What do they publish?
- What papers or talks have they given on AI?

### 2. Recent moves (last 6 months)
- Relevant AI/ML/product hires?
- Acquisitions or partnerships?
- Product launches or pivots?
- Funding rounds or leadership changes?

### 3. Engineering culture
- How do they ship? (deploy cadence, CI/CD)
- Mono-repo or multi-repo?
- Languages/frameworks in use?
- Remote-first or office-first?
- Glassdoor/Blind reviews on eng culture?

### 4. Likely challenges
- Scaling problems?
- Reliability, cost, latency challenges?
- Migrations underway? (infra, models, platforms)
- Pain points mentioned in reviews?

### 5. Competitors and differentiation
- Main competitors?
- Moat / differentiator?
- Positioning vs competition?

### 6. Candidate angle
Given my profile (read from cv.md and profile.yml):
- What unique value do I bring to this team?
- Which of my projects are most relevant?
- What story should I tell in the interview?
```

Customize each section with the specific offer context.
