'use client';

import { useState, useEffect } from 'react';
import { parseNoteSequence, ParsedNote, applyMoorchhana, valueToNoteName } from '@/lib/notes';
import NoteGraph from '@/components/NoteGraph';
import NoteCalculator from '@/components/NoteCalculator';

const SEQ_COLORS = ['#8b5cf6', '#34d399', '#fbbf24', '#fb7185'];
const LS_KEY = 'swargraph_saved';

// Monotonic counter — avoids duplicate IDs when called multiple times in the same millisecond
let _uid = Date.now();
const uid = () => _uid++;

const REFERENCE = [
  { num: 0,  short: 'S',  full: 'Sa' },
  { num: 1,  short: 'r',  full: 'komal Re' },
  { num: 2,  short: 'R',  full: 'Re' },
  { num: 3,  short: 'g',  full: 'komal Ga' },
  { num: 4,  short: 'G',  full: 'Ga' },
  { num: 5,  short: 'm',  full: 'Ma' },
  { num: 6,  short: 'M',  full: 'tivra Ma' },
  { num: 7,  short: 'P',  full: 'Pa' },
  { num: 8,  short: 'd',  full: 'komal Dha' },
  { num: 9,  short: 'D',  full: 'Dha' },
  { num: 10, short: 'n',  full: 'komal Ni' },
  { num: 11, short: 'N',  full: 'Ni' },
];

interface SeqState {
  id: number;
  input: string;
  notes: ParsedNote[];
  error: string;
}

interface SavedEntry {
  id: number;
  label: string;
  value: string;
}

function defaultLabel(value: string): string {
  return value.length > 20 ? value.slice(0, 18) + '…' : value;
}

function SavedChip({
  entry,
  onLoad,
  onRename,
  onRemove,
}: {
  entry: SavedEntry;
  onLoad: (value: string) => void;
  onRename: (id: number, label: string) => void;
  onRemove: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.label);

  // Keep draft in sync when label is updated externally (e.g. list reorder after a new save)
  useEffect(() => {
    if (!editing) setDraft(entry.label);
  }, [entry.label, editing]);

  const commit = () => {
    const trimmed = draft.trim();
    onRename(entry.id, trimmed || defaultLabel(entry.value));
    setEditing(false);
  };

  return (
    <div className="group flex items-center gap-1 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg pl-3 pr-1.5 py-1.5 transition-colors">
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setDraft(entry.label); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent text-white text-xs font-mono w-28 outline-none border-b border-violet-500 pb-px"
        />
      ) : (
        <button
          onClick={() => onLoad(entry.value)}
          className="text-slate-200 text-xs font-mono hover:text-white text-left"
          title={entry.value}
        >
          {entry.label}
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setDraft(entry.label);
          setEditing((v) => !v);
        }}
        className="text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-sm leading-none px-0.5"
        aria-label="Rename"
        title="Rename"
      >
        ✎
      </button>
      <button
        onClick={() => onRemove(entry.id)}
        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none px-0.5"
        aria-label="Remove"
      >
        ×
      </button>
    </div>
  );
}

export default function Home() {
  const [seqs, setSeqs] = useState<SeqState[]>([
    { id: uid(), input: '', notes: [], error: '' },
  ]);
  const [saved, setSaved] = useState<SavedEntry[]>([]);

  const [moorInput, setMoorInput] = useState('');
  const [moorOffset, setMoorOffset] = useState('');
  const [moorResult, setMoorResult] = useState<ParsedNote[]>([]);
  const [moorError, setMoorError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
  }, [saved]);

  const upsertSaved = (value: string) => {
    if (!value.trim()) return;
    setSaved((prev) => {
      const existing = prev.find((s) => s.value === value);
      if (existing) return [existing, ...prev.filter((s) => s.value !== value)];
      return [{ id: uid(), label: defaultLabel(value), value }, ...prev].slice(0, 4);
    });
  };

  const renameSaved = (id: number, label: string) =>
    setSaved((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));

  const removeSaved = (id: number) =>
    setSaved((prev) => prev.filter((s) => s.id !== id));

  const loadSaved = (value: string) => {
    const parsed = parseNoteSequence(value);
    setSeqs((prev) => {
      // Fill the first empty slot if one exists
      const emptyIdx = prev.findIndex((s) => !s.input.trim());
      if (emptyIdx !== -1) {
        const updated = [...prev];
        updated[emptyIdx] = { ...updated[emptyIdx], input: value, notes: parsed, error: '' };
        return updated;
      }
      // Otherwise append a new sequence (up to max 4)
      if (prev.length < 4) {
        return [...prev, { id: uid(), input: value, notes: parsed, error: '' }];
      }
      // At capacity with no empty slots — do nothing
      return prev;
    });
  };

  const updateInput = (id: number, value: string) =>
    setSeqs((prev) => prev.map((s) => (s.id === id ? { ...s, input: value, error: '' } : s)));

  const addSeq = () => {
    if (seqs.length >= 4) return;
    setSeqs((prev) => [...prev, { id: uid(), input: '', notes: [], error: '' }]);
  };

  const removeSeq = (id: number) =>
    setSeqs((prev) => prev.filter((s) => s.id !== id));

  const handlePlot = () => {
    const next = seqs.map((s) => {
      if (!s.input.trim()) return { ...s, notes: [], error: '' };
      const parsed = parseNoteSequence(s.input);
      return {
        ...s,
        notes: parsed,
        error: parsed.length === 0 ? 'No valid notes found.' : '',
      };
    });
    setSeqs(next);
    // Save each successfully parsed sequence (save in reverse so first ends up at front)
    for (let i = next.length - 1; i >= 0; i--) {
      if (next[i].notes.length > 0) upsertSaved(next[i].input.trim());
    }
  };

  const handleMoorchhana = () => {
    const parsed = parseNoteSequence(moorInput);
    if (parsed.length === 0) {
      setMoorError('No valid notes found.');
      setMoorResult([]);
      return;
    }
    const shift = parseInt(moorOffset, 10);
    if (isNaN(shift)) {
      setMoorError('Enter a valid integer offset.');
      setMoorResult([]);
      return;
    }
    setMoorError('');
    setMoorResult(applyMoorchhana(parsed, shift));
  };

  const loadMoorchhanaIntoGraph = () => {
    if (moorResult.length === 0) return;
    const text = moorResult.map((n) => n.name).join(' ');
    loadSaved(text);
  };

  const offsetInt = parseInt(moorOffset, 10);
  const offsetHint = !isNaN(offsetInt) ? valueToNoteName(offsetInt) : null;

  const graphSequences = seqs
    .map((s, i) => ({ notes: s.notes, label: `Seq ${i + 1}`, color: SEQ_COLORS[i] }))
    .filter((s) => s.notes.length > 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Swargraph</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Graph and arithmetic calculator for Indian classical music notes
        </p>
        <p className="text-slate-400 mt-2 text-sm">
          Developed by Mihir Deshpande &nbsp;·&nbsp;{' '}
          <a
            href="https://www.mihirdeshpande.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-400 transition-colors"
          >
            www.mihirdeshpande.com
          </a>
        </p>
      </div>

      {/* Note Reference */}
      <section className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Note Reference — middle octave
        </h2>
        <div className="grid grid-cols-6 gap-2">
          {REFERENCE.map(({ num, short, full }) => (
            <div key={short} className="bg-slate-800/60 rounded-xl p-2.5 text-center">
              <div className="text-violet-300 font-mono text-base font-bold">{short}</div>
              <div className="text-slate-300 font-mono text-xs">{num}</div>
              <div className="text-slate-500 text-[10px] leading-tight mt-0.5">{full}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-slate-600 text-xs font-mono space-x-4">
          <span><span className="text-slate-400">'S</span> = S − 12 (lower octave)</span>
          <span><span className="text-slate-400">S'</span> = S + 12 (higher octave)</span>
          <span><span className="text-slate-400">S''</span> = S + 24</span>
        </div>
      </section>

      {/* Graph Section */}
      <section className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-base font-semibold text-white mb-3">Plot Notes</h2>

        {/* Sequence inputs */}
        <div className="space-y-2 mb-3">
          {seqs.map((seq, i) => (
            <div key={seq.id} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: SEQ_COLORS[i] }}
              />
              <input
                value={seq.input}
                onChange={(e) => updateInput(seq.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlot()}
                placeholder={`Sequence ${i + 1} — e.g. S R G M P D N S'`}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
              />
              {seqs.length > 1 && (
                <button
                  onClick={() => removeSeq(seq.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors w-7 h-7 flex items-center justify-center text-lg leading-none"
                  aria-label="Remove sequence"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add / Plot row */}
        <div className="flex items-center gap-2 mb-3">
          {seqs.length < 4 ? (
            <button
              onClick={addSeq}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add sequence
            </button>
          ) : (
            <span className="text-slate-600 text-xs">Max 4 sequences</span>
          )}
          <button
            onClick={handlePlot}
            className="ml-auto bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white px-5 py-1.5 rounded-lg font-medium text-sm transition-colors"
          >
            Plot
          </button>
        </div>

        {/* Saved / Recent sequences */}
        <div className="min-h-[28px]">
          {saved.length === 0 ? (
            <p className="text-xs text-slate-600">
              Plotted sequences are saved here (up to 4) — hover to rename or remove
            </p>
          ) : (
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs text-slate-600 shrink-0">Recent:</span>
              {saved.map((entry) => (
                <SavedChip
                  key={entry.id}
                  entry={entry}
                  onLoad={loadSaved}
                  onRename={renameSaved}
                  onRemove={removeSaved}
                />
              ))}
            </div>
          )}
        </div>

        {/* Errors */}
        {seqs.some((s) => s.error) && (
          <div className="mt-2 space-y-0.5">
            {seqs.map((s, i) =>
              s.error ? (
                <p key={s.id} className="text-red-400 text-sm">
                  Seq {i + 1}: {s.error}
                </p>
              ) : null,
            )}
          </div>
        )}

        <div className="mt-4">
          <NoteGraph sequences={graphSequences} />
        </div>
      </section>

      {/* Moorchhana Section */}
      <section className="mb-6 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-base font-semibold text-white mb-1">Moorchhana</h2>
        <p className="text-slate-500 text-xs mb-3">
          Shift every note by a fixed number of semitones, preserving all intervals.
        </p>

        <div className="space-y-2 mb-3">
          <input
            value={moorInput}
            onChange={(e) => { setMoorInput(e.target.value); setMoorError(''); setMoorResult([]); }}
            onKeyDown={(e) => e.key === 'Enter' && handleMoorchhana()}
            placeholder="Note sequence — e.g. S R G M"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={moorOffset}
              onChange={(e) => { setMoorOffset(e.target.value); setMoorError(''); setMoorResult([]); }}
              onKeyDown={(e) => e.key === 'Enter' && handleMoorchhana()}
              placeholder="Semitone offset"
              className="w-40 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
            />
            {offsetHint && (
              <span className="text-violet-400 font-mono text-sm">= {offsetHint}</span>
            )}
            <button
              onClick={handleMoorchhana}
              className="ml-auto bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white px-5 py-1.5 rounded-lg font-medium text-sm transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {moorError && <p className="text-red-400 text-sm mb-2">{moorError}</p>}

        {moorResult.length > 0 && (
          <div className="mt-3 p-3 bg-slate-800 rounded-xl flex items-center gap-3">
            <span className="text-white font-mono text-sm flex-1">
              {moorResult.map((n) => n.name).join(' ')}
            </span>
            <button
              onClick={loadMoorchhanaIntoGraph}
              className="text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1 rounded-lg transition-colors shrink-0"
            >
              Load into graph
            </button>
          </div>
        )}
      </section>

      {/* Calculator Section — hidden, re-enable when ready */}
      {/* <section className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <h2 className="text-base font-semibold text-white mb-3">Note Calculator</h2>
        <NoteCalculator />
        <div className="mt-4 text-slate-600 text-xs space-x-3">
          <span>Notes act as their numeric values in expressions.</span>
        </div>
        <div className="mt-1.5 text-slate-600 text-xs">
          <span className="font-mono text-slate-400">S + P</span> = 7 (Pa) &nbsp;·&nbsp;
          <span className="font-mono text-slate-400">P - S</span> = 7 &nbsp;·&nbsp;
          <span className="font-mono text-slate-400">N + 1</span> = 12 (S') &nbsp;·&nbsp;
          <span className="font-mono text-slate-400">M - m</span> = 1 (interval)
        </div>
      </section> */}

      {/* Footer */}

    </main>
  );
}
