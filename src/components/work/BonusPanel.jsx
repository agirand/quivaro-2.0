import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BONUS_OPTIONS } from '@/lib/work';

// Optional post-delivery bonus. Always explicit, never automatic, no payment collected.
export default function BonusPanel({ o, act, busy }) {
  const [pick, setPick] = useState(null);
  if (!['delivered', 'accepted'].includes(o.status)) return null;
  if (o.bonus_status === 'pledged') return <div className="card-soft p-4 text-sm text-slate-600 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" />You pledged a ${o.bonus_amount} bonus for this work. Thank you.</div>;
  if (o.bonus_status === 'declined') return null;
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2 font-medium text-slate-900"><Heart className="w-4 h-4 text-rose-500" />Was this work worth more?</div>
      <p className="text-sm text-slate-500 mt-1">This is included in your plan. If the outcome was especially valuable, you can add an optional bonus. It's entirely up to you.</p>
      <div className="flex flex-wrap gap-2 mt-4">
        {BONUS_OPTIONS.map((a) => <Button key={a} size="sm" variant="outline" onClick={() => setPick(a)}>${a}</Button>)}
        <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act('bonus', { amount: 0 })}>No thanks</Button>
      </div>
      <AlertDialog open={pick !== null} onOpenChange={(v) => !v && setPick(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pledge a ${pick} bonus?</AlertDialogTitle>
            <AlertDialogDescription>This records your bonus for "{o.title}". Billing isn't active yet, so no payment will be taken now. You'll be asked again before anything is charged.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => act('bonus', { amount: pick })}>Confirm pledge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}