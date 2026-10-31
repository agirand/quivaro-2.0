import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { resetDemo } from '@/lib/seed';

export default function ResetButton() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); await resetDemo(); await qc.invalidateQueries(); setBusy(false); };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button disabled={busy} className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} {busy ? 'Resetting…' : 'Reset Demo'}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset the demo?</AlertDialogTitle>
          <AlertDialogDescription>All clients, matters, tasks, approvals, activity and Maya's conversation return to their original state.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={run}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}