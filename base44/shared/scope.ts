// Turns a requested outcome into a scoped Work Order. Used by scopeWork and the AI Manager chat.
import { AGENTS, TOOLS, INTERNAL, AI_COST, REVIEW_RATE, isLive, addHistory, businessContext } from './work.ts';

export async function scopeOrder(base44, org, { request, template_key = '', due_date = '' }) {
  const text = String(request || '').trim().slice(0, 2000);
  const E = base44.entities;
  const [tpls, ints, ctx] = await Promise.all([
    E.WorkTemplate.filter({ org_id: org.id }, { limit: 50 }),
    E.Integration.filter({ org_id: org.id }, { limit: 50 }),
    businessContext(base44, org),
  ]);
  const tpl = tpls.items.find((t) => t.key === template_key);

  const prompt = `You are the Quivaro Work Engine. Turn a small business owner's requested outcome into a structured, executable Work Order.

${ctx}
Available work templates: ${JSON.stringify(tpls.items.map((t) => ({ key: t.key, name: t.name, steps: t.steps, acceptance_criteria: t.acceptance_criteria })))}
${tpl ? `The owner chose the template "${tpl.name}". Start from its steps and criteria and adapt them to the request. Keep every step the template marks needs_approval=true as an approval step. Required inputs: ${JSON.stringify(tpl.inputs || [])}; list any the owner did not provide as inputs. Its exclusions always apply and are added automatically: ${tpl.exclusions || 'none'}. In "exclusions", list only additional ones specific to this request, or leave it empty. Industry notes: ${tpl.industry_notes || 'none'}.` : 'Pick the closest template if one fits (template_key), else leave it empty.'}

Owner's request: "${text}"

Rules:
- Scope precisely what was asked. List clear exclusions (e.g. no tax, legal or accounting advice; no payments).
- inputs: information or documents Quivaro needs from the owner or their systems.
- steps: 3-8 ordered steps. tool = "workspace" (Quivaro's own records), "ai" (drafting/analysis by Quivaro), or an external system (${TOOLS.filter((t) => !INTERNAL.includes(t)).join(', ')}) when the step must happen there. needs_approval=true for anything a client or employee would see, anything sent externally, financial, confidential or professionally regulated.
- acceptance_criteria: 3-6 objective, checkable statements describing a completed outcome.
- Never invent facts about the business.`;

  const out = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' }, template_key: { type: 'string' }, scope: { type: 'string' }, exclusions: { type: 'string' },
        inputs: { type: 'array', items: { type: 'string' } },
        steps: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, agent: { type: 'string', enum: AGENTS }, tool: { type: 'string', enum: TOOLS }, needs_approval: { type: 'boolean' } }, required: ['title', 'agent', 'tool'] } },
        acceptance_criteria: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'scope', 'steps', 'acceptance_criteria'],
    },
  });

  const steps = (out.steps || []).slice(0, 8).map((s) => {
    const tool = TOOLS.includes(s.tool) ? s.tool : 'ai';
    const external = !INTERNAL.includes(tool);
    return { title: String(s.title).slice(0, 200), agent: AGENTS.includes(s.agent) ? s.agent : 'Operations', tool, needs_approval: external || !!s.needs_approval, mode: isLive(tool, ints.items) ? 'connected' : 'not_connected', status: 'pending', output: '' };
  });
  const usedTpl = tpl || tpls.items.find((t) => t.key === out.template_key);
  const approvals = steps.filter((s) => s.needs_approval).length;
  const order = {
    org_id: org.id, title: String(out.title).slice(0, 200), request: text, template_key: usedTpl?.key || '', status: 'scoped',
    scope: out.scope, exclusions: [usedTpl?.exclusions, out.exclusions].filter(Boolean).join(' ').slice(0, 1500), inputs: (out.inputs || []).slice(0, 12), provided_info: [], steps,
    acceptance_criteria: (out.acceptance_criteria || []).slice(0, 6).map((c) => ({ text: c, met: null, evidence: '' })),
    due_date: due_date || '', progress: 0, price_mode: usedTpl?.price_mode || 'included', package_price: usedTpl?.package_price || 0,
    est_cost: +(steps.length * AI_COST + AI_COST + approvals * 3 * REVIEW_RATE).toFixed(2), actual_cost: AI_COST, review_minutes: 0, rework_cost: 0,
    hours_saved: usedTpl?.hours_saved || 0, bonus_status: 'none',
  };
  order.history = addHistory(order, 'Requested', text);
  order.history = addHistory(order, 'Scoped', `${steps.length} steps, ${approvals} approval gates. Waiting for your approval to begin.`);
  return E.WorkOrder.create(order);
}