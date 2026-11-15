import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TOOL_LABEL } from '@/lib/work';

const Block = ({ title, children }) => <div><div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">{title}</div>{children}</div>;
const List = ({ items }) => <ul className="space-y-1.5">{items.map((x) => <li key={x} className="flex gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />{x}</li>)}</ul>;

export default function TemplateDetails({ t, onClose }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-[11px] uppercase tracking-wider text-teal-700">{t.category}</div>
          <DialogTitle className="font-heading text-2xl font-normal">{t.name}</DialogTitle>
          <p className="text-sm text-slate-500">{t.description}</p>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {!!t.inputs?.length && <Block title="What we need from you"><List items={t.inputs} /></Block>}
          <Block title="How the work runs">
            <ol className="space-y-2">{(t.steps || []).map((s, i) => (
              <li key={i} className="flex gap-3 text-sm"><span className="w-5 h-5 rounded-full bg-slate-100 text-[11px] flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-slate-700 flex-1">{s.title} <span className="text-xs text-slate-400">· {TOOL_LABEL[s.tool] || s.tool}</span>
                  {s.needs_approval && <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" />Your approval</span>}</span></li>))}</ol>
          </Block>
          {!!t.deliverables?.length && <Block title="What you receive"><List items={t.deliverables} /></Block>}
          {t.exclusions && <Block title="Not included"><p className="text-sm text-slate-700">{t.exclusions}</p></Block>}
          {!!t.acceptance_criteria?.length && <Block title="Done means"><List items={t.acceptance_criteria} /></Block>}
        </div>
        <Link to={`/w?template=${t.key}`} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800">Request this work<ArrowRight className="w-4 h-4" /></Link>
      </DialogContent>
    </Dialog>
  );
}