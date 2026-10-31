import React from 'react';
import { Info } from 'lucide-react';
import { CHANNELS } from '@/lib/channels';
import ChatComposer from './ChatComposer';

export default function DemoChannel({ channel }) {
  const ch = CHANNELS[channel];
  return (
    <div className="card-soft flex flex-col h-[620px] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <ch.icon className="w-5 h-5 text-slate-400" />
        <div className="flex-1"><div className="text-sm font-semibold text-slate-900">{ch.label}</div><div className="text-xs text-slate-500">Provider: {ch.provider}</div></div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800">DEMONSTRATION</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-sm text-center space-y-3">
          <Info className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm text-slate-700 font-semibold">This channel is not connected.</p>
          <p className="text-xs text-slate-500 leading-relaxed">When connected, messages from {ch.label} will arrive in this same inbox, use the same conversation model and be answered by the same AI Manager. No messages are sent or received here today.</p>
        </div>
      </div>
      <ChatComposer locked placeholder={`${ch.label} is not connected. Nothing can be sent.`} />
    </div>
  );
}