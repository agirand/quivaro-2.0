# Lead to proposal skill

Select **Lead to proposal** in Work catalog (or follow the AI Manager's skill handoff), describe the lead and desired proposal, and create a Work Order. The AI Manager offers the handoff; the existing Work Engine remains the only executor. No Base44 platform Agent or Workflow engine is added.

## Contract

`base44/shared/skills/leadToProposal.js` owns the canonical plan and per-step drafting instructions. `scopeWork` uses it for explicit selections and model-selected work, even before catalog seeding. Three fixed gates cannot be removed through template customization:

1. Sales qualifies the lead against owner criteria, recording fit, budget, authority, need, timing, evidence, unknowns and recommendation. Missing core information or a disqualification pauses for owner input. An owner may override a disqualification with a reason, retained in the evidence. Owner reviews qualification before proposal drafting.
2. Sales drafts scope, exclusions, deliverables, approved pricing/currency, timing and next steps. Unknown terms request information rather than fabricated commitments. Owner can edit, approve or reject the proposal.
3. Administration prepares the recipient, subject and message from the approved proposal. Missing recipient/channel/contact permission requests information. Owner reviews the exact communication before manually delivering it and recording recipient, channel and delivery evidence.

Work stays in the existing Review queue while awaiting scope/step approval, missing input, manual delivery or quality review. Rejection redrafts the current step. Rework clears **all** skill outputs and approvals, including downstream communication, so a changed proposal cannot reuse a stale approval. Final quality review and owner acceptance use the existing Deliverable flow.

## Data and access

No new entities or external integrations are introduced. Lead details live in the organization-scoped WorkOrder request, supplied information and step outputs; the final package lives in Deliverable. Catalog seeding adds the built-in for existing organizations without overwriting custom templates. Backend requests authenticate the user, derive their organization through `getOrg`, and reject a WorkOrder from another organization. Deliverable mutation queries include both organization and WorkOrder IDs. Entity calls retain user-scoped SDK access and existing creator-based RLS; service role is used only for Core.InvokeLLM.

## Validation

Run `npm test`, `npm run lint`, `npm run build`, and `npm run typecheck`. Tests transpile the actual backend handlers through a Node loader and replace only the Base44 SDK with an in-memory double; they never invoke paid AI, external delivery or a hosted app. They cover gates, missing inputs, rejection, rework, organization checks, authentication, fixed plans, catalog backfill, model-selected skills, quality failure and connected/manual delivery.

## Known limits

- External delivery is a manual handoff, including when Google Workspace is connected. No email/SMS send, CRM synchronization, payment, or automatic lead ingestion occurs.
- Qualification and commercial accuracy depend on Core.InvokeLLM and human review. These tests validate orchestration and prompt requirements, not a live model's factual accuracy. Manual delivery evidence is an owner attestation, not a provider receipt.
- Existing WorkOrder persistence has no transactional compare-and-swap. Concurrent owner actions can race; catalog backfill can also duplicate under simultaneous first visits. This feature does not add another lock/orchestration system.
- A local linked Base44 app was not available; no hosted integration, live UI or production-data tests were performed. Build works without app environment variables but the resulting bundle cannot connect to an app until configured.
- The repository's existing typecheck failures and dependency audit findings remain outside this focused feature. See the PR for the exact comparison and check results.

Do not publish or deploy as part of this change. Repository sync is not publication; deployment remains a separate owner action.
