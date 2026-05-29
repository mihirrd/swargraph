'use client';

import { useState } from 'react';
import { evaluateExpression, CalcResult } from '@/lib/notes';

const EXAMPLES = [
  'S + P',
  "Sa' - Ga",
  'P - S',
  'N + 1',
  'M - m',
];

export default function NoteCalculator() {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState('');

  const calculate = (input = expr) => {
    if (!input.trim()) return;
    const res = evaluateExpression(input);
    if (res) {
      setResult(res);
      setError('');
    } else {
      setResult(null);
      setError('Could not parse. Try: S + P  or  Sa\' - Ga  or  P - S');
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={expr}
          onChange={(e) => { setExpr(e.target.value); setResult(null); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && calculate()}
          placeholder="e.g.  S + P   or   Sa' - Ga   or   P - S"
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          onClick={() => calculate()}
          className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          Calculate
        </button>
      </div>

      {/* Quick examples */}
      <div className="flex gap-2 flex-wrap mt-2.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => { setExpr(ex); calculate(ex); }}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700 hover:border-violet-700 font-mono transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-red-400 text-sm">{error}</p>
      )}

      {result && (
        <div className="mt-4 p-4 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center gap-4">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-mono font-bold text-violet-300">{result.noteName}</span>
              <span className="text-slate-400 text-xl font-mono">= {result.value}</span>
            </div>
            {result.fullName && (
              <p className="text-slate-400 text-sm mt-1">{result.fullName}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
