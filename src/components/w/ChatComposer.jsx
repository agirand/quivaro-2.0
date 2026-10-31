import React, { useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ChatComposer({ onSend, disabled, placeholder = 'Tell the AI Manager about your business…', locked }) {
  const [text, setText] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled || locked) return;
    onSend(text.trim());
    setText('');
  };
  return (
    <form onSubmit={submit} className="border-t border-slate-100 p-3 flex items-end gap-2 bg-white">
      <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
        rows={1} disabled={locked} placeholder={placeholder}
        className="flex-1 resize-none rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-60 max-h-32" />
      <button disabled={disabled || locked || !text.trim()} className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition disabled:opacity-40">
        <ArrowUp className="w-4 h-4" />
      </button>
    </form>
  );
}