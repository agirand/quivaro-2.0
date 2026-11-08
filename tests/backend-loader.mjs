import { readFile } from 'node:fs/promises';
import ts from 'typescript';
export async function resolve(specifier, context, next) {
  if (specifier === '@/api/base44Client') return { url: new URL('./mock-sdk.mjs', import.meta.url).href, shortCircuit: true };
  if (specifier.startsWith('npm:@base44/sdk@')) return { url: new URL('./mock-sdk.mjs', import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
}
export async function load(url, context, next) {
  if (url.endsWith('.ts')) {
    const source = ts.transpileModule(await readFile(new URL(url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    return { format: 'module', source, shortCircuit: true };
  }
  return next(url, context);
}
