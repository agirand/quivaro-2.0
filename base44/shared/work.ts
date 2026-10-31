// Shared Work Engine helpers.
import { knownNames } from './workspace.ts';
import { PROFILE_KEYS } from './facts.ts';

export const AGENTS = ['Manager', 'Sales', 'Operations', 'Finance', 'Administration'];
export const TOOLS = ['workspace', 'ai', 'google_workspace', 'microsoft_365', 'quickbooks', 'hubspot', 'dropbox'];
export const INTERNAL = ['workspace', 'ai'];
export const AI_COST = 0.03; // illustrative cost per AI step
export const REVIEW_RATE = 1; // illustrative $ per review minute

// External tools only count as live when a real (non-demo) connection exists.
export const isLive = (tool, integrations) => INTERNAL.includes(tool) || integrations.some((i) => i.provider === tool && i.status === 'connected' && i.mode === 'live');

export const addHistory = (o, event, detail = '') => [...(o.history || []), { at: new Date().toISOString(), event, detail: String(detail).slice(0, 400) }].slice(-150);

export const progressOf = (steps) => Math.round((100 * steps.filter((s) => s.status === 'done').length) / Math.max(1, steps.length));

export async function businessContext(db, org) {
  const known = await knownNames(db, org.id);
  const profile = Object.fromEntries(PROFILE_KEYS.filter((k) => org[k]).map((k) => [k, org[k]]));
  return `Company profile: ${JSON.stringify(profile)}\nKnown records: ${JSON.stringify(known)}`;
}