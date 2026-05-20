# Mode: tracker — Applications Tracker

Read and display `data/applications.md`.

**Tracker format:**
```markdown
| # | Date | Company | Role | Score | Status | PDF | Report |
```

Canonical statuses (see `templates/states.yml`): `Evaluated` → `Applied` → `Responded` → `Interview` → `Offer` / `Rejected` / `Discarded` / `SKIP`

- `Applied` = candidate submitted the application
- `Responded` = A recruiter/company reached out and the candidate replied (inbound)
- Outbound LinkedIn outreach is logged in **Notes**, not a separate status column

If the user asks to update a status, edit the corresponding row and prepend `{YYYY-MM-DD}: {NewStatus}. ` to **Notes** (see `AGENTS.md`).

Also show statistics:
- Total applications
- By status
- Average score
- % with PDF generated
- % with report generated
