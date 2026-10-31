import React, { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useWsRefresh } from '@/hooks/useWs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TOOL_LABEL } from '@/lib/work';

const AGENTS = ['Manager', 'Sales', 'Operations', 'Finance', 'Administration'];

export default function TemplateEditor({ t, onClose }) {
  const refresh = useWsRefresh();
  const [f, setF] = useState({ industry_notes: t.industry_notes || '', steps: t.steps || [], criteria: (t.acceptance_criteria || []).join('\n'), price_mode: t.price_mode, package_price: t.package_price || 0 });
  const [saving, setSaving] = useState(false);
  const setStep = (i, k, v) => setF({ ...f, steps: f.steps.map((s, j) => (j === i ? { ...s, [k]: v } : s)) });
  const save = async () => {
    setSaving(true);
    await base44.entities.WorkTemplate.update(t.id, { industry_notes: f.industry_notes, steps: f.steps.filter((s) => s.title?.trim()), acceptance_criteria: f.criteria.split('\n').map((x) => x.trim()).filter(Boolean), price_mode: f.price_mode, package_price: Number(f.package_price) || 0 });
    setSaving(false); refresh(); onClose();
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Customize · {t.name}</DialogTitle></DialogHeader>
        <label className="text-xs text-slate-500">Industry-specific notes</label>
        <Textarea value={f.industry_notes} onChange={(e) => setF({ ...f, industry_notes: e.target.value })} rows={2} placeholder="e.g. We're a tax firm; clients need W-2s, 1099s and prior-year return." />
        <div className="text-xs text-slate-500 mt-2">Steps</div>
        <div className="space-y-2">
          {f.steps.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-slate-200 p-2">
              <Input value={s.title} onChange={(e) => setStep(i, 'title', e.target.value)} />
              <button onClick={() => setF({ ...f, steps: f.steps.filter((_, j) => j !== i) })} className="text-slate-400 hover:text-rose-600 px-2"><Trash2 className="w-4 h-4" /></button>
              <div className="col-span-2 flex flex-wrap gap-2 text-xs">
                <select value={s.agent} onChange={(e) => setStep(i, 'agent', e.target.value)} className="border rounded-lg px-2 py-1">{AGENTS.map((a) => <option key={a}>{a}</option>)}</select>
                <select value={s.tool} onChange={(e) => setStep(i, 'tool', e.target.value)} className="border rounded-lg px-2 py-1">{Object.entries(TOOL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <label className="flex items-center gap-1"><input type="checkbox" checked={!!s.needs_approval} onChange={(e) => setStep(i, 'needs_approval', e.target.checked)} />Needs approval</label>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setF({ ...f, steps: [...f.steps, { title: '', agent: 'Operations', tool: 'ai', needs_approval: false }] })}><Plus className="w-4 h-4 mr-1" />Add step</Button>
        </div>
        <label className="text-xs text-slate-500 mt-2">Acceptance criteria (one per line)</label>
        <Textarea value={f.criteria} onChange={(e) => setF({ ...f, criteria: e.target.value })} rows={3} />
        <div className="flex items-center gap-2 text-sm">
          <select value={f.price_mode} onChange={(e) => setF({ ...f, price_mode: e.target.value })} className="border rounded-lg px-2 py-1.5"><option value="included">Included in plan</option><option value="package">Work package</option></select>
          {f.price_mode === 'package' && <Input type="number" value={f.package_price} onChange={(e) => setF({ ...f, package_price: e.target.value })} className="w-28" />}
        </div>
        <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save template'}</Button></div>
      </DialogContent>
    </Dialog>
  );
}