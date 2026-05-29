'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import { ParsedNote, valueToNoteName, NOTE_FULL_NAMES } from '@/lib/notes';

export interface SequenceData {
  notes: ParsedNote[];
  label: string;
  color: string;
}

interface Props {
  sequences: SequenceData[];
}

export default function NoteGraph({ sequences }: Props) {
  const isSingle = sequences.length === 1;
  const maxLen = Math.max(...sequences.map(s => s.notes.length), 0);

  const data = useMemo(() =>
    Array.from({ length: maxLen }, (_, i) => {
      const row: Record<string, any> = { x: i };
      sequences.forEach((seq, si) => {
        if (i < seq.notes.length) {
          row[`v${si}`] = seq.notes[i].value;
          row[`n${si}`] = seq.notes[i].name;
        }
      });
      return row;
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sequences],
  );

  const yTicks = useMemo(() => {
    const vals = new Set<number>();
    sequences.forEach(seq => seq.notes.forEach(n => vals.add(n.value)));
    return [...vals].sort((a, b) => a - b);
  }, [sequences]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const pos: number = payload[0]?.payload?.x;
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl min-w-[130px]">
        <p className="text-slate-500 text-xs mb-2">Note {pos + 1}</p>
        {payload.map((p: any) => {
          const si = parseInt(p.dataKey.slice(1));
          const noteName: string = p.payload[`n${si}`];
          const seq = sequences[si];
          const norm = ((p.value % 12) + 12) % 12;
          return (
            <div key={si} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seq.color }} />
              <span className="font-mono text-white font-bold">{noteName}</span>
              <span className="text-slate-400 text-xs">= {p.value}</span>
              {!isSingle && (
                <span className="text-slate-600 text-xs ml-auto">{seq.label}</span>
              )}
            </div>
          );
        })}
        {isSingle && payload[0] && (() => {
          const norm = ((payload[0].value % 12) + 12) % 12;
          return NOTE_FULL_NAMES[norm] ? (
            <p className="text-slate-500 text-xs mt-1.5 border-t border-slate-700 pt-1.5">
              {NOTE_FULL_NAMES[norm]}
            </p>
          ) : null;
        })()}
      </div>
    );
  };

  if (sequences.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 border border-slate-700/60 rounded-xl text-sm">
        Enter notes above and press Plot
      </div>
    );
  }

  const allValues = sequences.flatMap(s => s.notes.map(n => n.value));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  return (
    <div>
      {/* Legend for multiple sequences */}
      {!isSingle && (
        <div className="flex gap-4 mb-3 flex-wrap">
          {sequences.map((seq, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: seq.color }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seq.color }} />
              <span className="text-xs text-slate-400 font-mono">{seq.label}</span>
            </div>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 30, right: 24, left: 90, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

          <XAxis
            dataKey="x"
            type="number"
            domain={[-0.5, maxLen - 0.5]}
            ticks={Array.from({ length: maxLen }, (_, i) => i)}
            tickFormatter={(i: number) =>
              isSingle
                ? (sequences[0]?.notes[i]?.name ?? '')
                : String(i + 1)
            }
            tick={{ fill: '#94a3b8', fontFamily: 'monospace', fontSize: 13 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            label={{ value: 'Note', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 12 }}
          />

          <YAxis
            domain={[minVal - 1, maxVal + 1]}
            ticks={yTicks}
            tickFormatter={(v: number) => `${valueToNoteName(v)}  (${v})`}
            tick={{ fill: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            width={88}
            label={{ value: 'Semitones', angle: -90, position: 'insideLeft', offset: -8, fill: '#475569', fontSize: 12 }}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={0} stroke="#4f46e5" strokeDasharray="4 4" opacity={0.4} />

          {sequences.map((seq, si) => (
            <Line
              key={si}
              type="monotone"
              dataKey={`v${si}`}
              stroke={seq.color}
              strokeWidth={2.5}
              dot={{ r: 5, fill: seq.color, stroke: seq.color, strokeWidth: 2 }}
              activeDot={{ r: 8, fill: seq.color, stroke: '#fff', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive
            >
              {isSingle && (
                <LabelList
                  dataKey="n0"
                  position="top"
                  style={{ fill: seq.color, fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}
                />
              )}
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Integer sequence output */}
      <div className="mt-4 space-y-2">
        {sequences.map((seq, si) => (
          <div key={si} className="flex items-start gap-2">
            {!isSingle && (
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: seq.color }} />
            )}
            <div className="flex-1 min-w-0">
              {!isSingle && (
                <span className="text-xs text-slate-500 font-mono mr-2">{seq.label}:</span>
              )}
              <span className="font-mono text-sm break-all" style={{ color: seq.color }}>
                [{seq.notes.map((n) => n.value).join(', ')}]
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
