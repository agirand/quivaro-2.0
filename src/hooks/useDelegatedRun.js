import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runCommand } from '@/lib/maya';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs a real Maya command, then plays its delegation steps one by one
export default function useDelegatedRun() {
  const qc = useQueryClient();
  const [state, setState] = useState({ running: false, steps: [], done: 0, result: null });
  const run = async (cmd) => {
    setState({ running: true, steps: [], done: 0, result: null });
    const res = await runCommand(cmd);
    const steps = res.steps || [];
    for (let i = 0; i <= steps.length; i++) { setState({ running: true, steps, done: i, result: null }); await wait(650); }
    setState({ running: false, steps, done: steps.length, result: res });
    qc.invalidateQueries();
  };
  return { ...state, run };
}