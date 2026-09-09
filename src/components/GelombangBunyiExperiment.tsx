import React, { useMemo, useState } from 'react';
import { TrialRowBunyi } from '../types';
import { calculateLinearRegression, calculateStats } from '../utils';
import InteractivePhysicsChart from './InteractivePhysicsChart';
import FormulaGuide from './FormulaGuide';
import { RotateCcw, Info, AlertCircle, Sparkles } from 'lucide-react';
import NumericCell from './NumericCell';

interface GelombangBunyiExperimentProps {
  rows: TrialRowBunyi[];
  setRows: React.Dispatch<React.SetStateAction<TrialRowBunyi[]>>;
  f1: number;
  setF1: (val: number) => void;
  f2: number;
  setF2: (val: number) => void;
  temp: number;
  setTemp: (val: number) => void;
  vRef: number;
  setVRef: (val: number) => void;
  onReset: () => void;
}

export default function GelombangBunyiExperiment({
  rows,
  setRows,
  f1,
  setF1,
  f2,
  setF2,
  temp,
  setTemp,
  vRef,
  setVRef,
  onReset
}: GelombangBunyiExperimentProps) {


  // Cell change handler
  const handleCellChange = (id: string, field: keyof TrialRowBunyi, value: number) => {
    setRows(prev =>
      prev.map(row => {
        if (row.id === id) {
          return {
            ...row,
            [field]: value,
          };
        }
        return row;
      })
    );
  };

  // Keyboard navigation for global parameters of Gelombang Bunyi
  const handleParamKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'f1' | 'f2' | 'temp' | 'vRef') => {
    const fields = ['f1', 'f2', 'temp', 'vRef'] as const;
    const idx = fields.indexOf(field);
    if (e.key === 'Enter' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (idx < fields.length - 1) {
        const nextId = `param-${fields[idx + 1]}`;
        const el = document.getElementById(nextId);
        if (el) {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).select();
        }
      } else {
        // Move focus to first trial of first row
        const el = document.getElementById('input-bunyi-0-0');
        if (el) {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).select();
        }
      }
    } else if (e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (idx > 0) {
        const prevId = `param-${fields[idx - 1]}`;
        const el = document.getElementById(prevId);
        if (el) {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).select();
        }
      }
    }
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colIdx: number
  ) => {
    const totalCols = 6; // f1_t1, f1_t2, f1_t3, f2_t1, f2_t2, f2_t3
    const totalRows = rows.length;

    let targetRow = rowIdx;
    let targetCol = colIdx;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (colIdx >= 0 && colIdx <= 2) {
        // Frequency f1 columns: trials 1, 2, 3 (col indices 0, 1, 2)
        if (colIdx < 2) {
          targetCol = colIdx + 1;
        } else if (rowIdx < totalRows - 1) {
          targetRow = rowIdx + 1;
          targetCol = 0;
        } else {
          // Wrap from end of f1 (bottom-right) to start of f2 (top-left)
          targetRow = 0;
          targetCol = 3;
        }
      } else if (colIdx >= 3 && colIdx <= 5) {
        // Frequency f2 columns: trials 1, 2, 3 (col indices 3, 4, 5)
        if (colIdx < 5) {
          targetCol = colIdx + 1;
        } else if (rowIdx < totalRows - 1) {
          targetRow = rowIdx + 1;
          targetCol = 3;
        } else {
          return; // reached end of f2
        }
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (colIdx < totalCols - 1) {
        targetCol = colIdx + 1;
      } else if (rowIdx < totalRows - 1) {
        targetRow = rowIdx + 1;
        targetCol = 0;
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (colIdx > 0) {
        targetCol = colIdx - 1;
      } else if (rowIdx > 0) {
        targetRow = rowIdx - 1;
        targetCol = totalCols - 1;
      } else {
        // Go back to the last parameter field: vRef
        const el = document.getElementById('param-vRef');
        if (el) {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).select();
        }
        return;
      }
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (rowIdx < totalRows - 1) {
        targetRow = rowIdx + 1;
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (rowIdx > 0) {
        targetRow = rowIdx - 1;
      } else {
        // If at first row and press up, move back to parameters (specifically the corresponding index, or f1)
        const el = document.getElementById('param-f1');
        if (el) {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).select();
        }
        return;
      }
    } else {
      return; // let standard typed inputs pass
    }

    const nextId = `input-bunyi-${targetRow}-${targetCol}`;
    const nextEl = document.getElementById(nextId);
    if (nextEl) {
      (nextEl as HTMLInputElement).focus();
      (nextEl as HTMLInputElement).select();
    }
  };

  // Helper to compute average of non-zero entries
  const getAvg = (vals: number[]) => {
    const acts = vals.filter(v => v > 0);
    return acts.length > 0 ? acts.reduce((a, b) => a + b, 0) / acts.length : 0;
  };

  // Perform calculations converting cm input to meters for standard analysis
  const calculations = useMemo(() => {
    const processed = rows.map(r => {
      const avg1 = getAvg([r.f1_t1, r.f1_t2, r.f1_t3]);
      const avg2 = getAvg([r.f2_t1, r.f2_t2, r.f2_t3]);

      // Convert cm to meters for analysis
      const L1_m = avg1 / 100;
      const L2_m = avg2 / 100;

      return {
        ...r,
        avg1,
        avg2,
        L1_m,
        L2_m
      };
    });

    const f1_pts: { x: number; y: number; label: string }[] = [];
    const f2_pts: { x: number; y: number; label: string }[] = [];

    processed.forEach(p => {
      if (p.avg1 > 0 && f1 > 0) {
        f1_pts.push({ x: p.m, y: p.L1_m, label: `m=${p.m}, L=${p.avg1.toFixed(1)} cm` });
      }
      if (p.avg2 > 0 && f2 > 0) {
        f2_pts.push({ x: p.m, y: p.L2_m, label: `m=${p.m}, L=${p.avg2.toFixed(1)} cm` });
      }
    });

    // Linear regression of L_m (m) against m (order)
    // Formula L_m = (lambda / 2) * m + (lambda / 4 - e)
    const f1_X = f1_pts.map(pt => pt.x);
    const f1_Y = f1_pts.map(pt => pt.y);
    const regression1 = calculateLinearRegression(f1_X, f1_Y);
    const v1Slope = 2 * f1 * regression1.slope;

    const f2_X = f2_pts.map(pt => pt.x);
    const f2_Y = f2_pts.map(pt => pt.y);
    const regression2 = calculateLinearRegression(f2_X, f2_Y);
    const v2Slope = 2 * f2 * regression2.slope;

    // End correction (Faktor Koreksi). They are now strictly individual to each frequency.
    // e_slope = intercept - slope/2 (Derived from image formula: e = n_intercept - v_slope / (4f))
    const e1Slope = regression1.slope > 0 ? (regression1.intercept - (regression1.slope / 2)) : 0;
    const e2Slope = regression2.slope > 0 ? (regression2.intercept - (regression2.slope / 2)) : 0;

    // e_lit (Sesuai rumus foto: e = intercept - vRef/(4f))
    const e1Lit = (regression1.slope > 0 && f1 > 0) ? (regression1.intercept - (vRef / (4 * f1))) : 0;
    const e2Lit = (regression2.slope > 0 && f2 > 0) ? (regression2.intercept - (vRef / (4 * f2))) : 0;

    const e1SlopeAbs = Math.abs(e1Slope);
    const e2SlopeAbs = Math.abs(e2Slope);
    const e1LitAbs = Math.abs(e1Lit);
    const e2LitAbs = Math.abs(e2Lit);

    // Delta V uncertainty derived from slope error (delta v = 2f * delta m)
    const deltaV1 = 2 * f1 * regression1.slopeError;
    const deltaV2 = 2 * f2 * regression2.slopeError;

    // Individual speed values using their OWN individual correction factor
    const v1_vals: number[] = [];
    const v2_vals: number[] = [];

    processed.forEach(p => {
      if (p.avg1 > 0 && f1 > 0) {
        // Effective length is L' - e
        const L_eff = p.L1_m - e1Slope;
        const lambda = (4 * L_eff) / (2 * p.m + 1);
        v1_vals.push(f1 * lambda);
      }
      if (p.avg2 > 0 && f2 > 0) {
        const L_eff = p.L2_m - e2Slope;
        const lambda = (4 * L_eff) / (2 * p.m + 1);
        v2_vals.push(f2 * lambda);
      }
    });

    // Stats for speed of sound per frequency (row-by-row stats)
    const stats1 = calculateStats(v1_vals);
    const stats2 = calculateStats(v2_vals);

    // Precise precision and lit error based on slope-regression model
    const v1Precision = v1Slope > 0 ? Math.max(0, 100 - (deltaV1 / v1Slope) * 100) : 100;
    const v2Precision = v2Slope > 0 ? Math.max(0, 100 - (deltaV2 / v2Slope) * 100) : 100;

    const v1LitError = v1Slope > 0 && vRef > 0 ? (Math.abs(v1Slope - vRef) / vRef) * 100 : 0;
    const v2LitError = v2Slope > 0 && vRef > 0 ? (Math.abs(v2Slope - vRef) / vRef) * 100 : 0;

    return {
      processed,
      stats: {
        f1: stats1,
        f2: stats2,
        v1Slope,
        v2Slope,
        deltaV1,
        deltaV2,
        v1Precision,
        v2Precision,
        v1LitError,
        v2LitError,
        e1Slope,
        e2Slope,
        e1Lit,
        e2Lit,
        e1SlopeAbs,
        e2SlopeAbs,
        e1LitAbs,
        e2LitAbs
      },
      regressions: {
        f1: {
          regression: regression1,
          vSlope: v1Slope,
          deltaV: deltaV1,
          pts: f1_pts,
          eSlope: e1Slope,
          eLit: e1Lit,
          eLitAbs: e1LitAbs,
          vLitError: v1LitError,
          vPrecision: v1Precision
        },
        f2: {
          regression: regression2,
          vSlope: v2Slope,
          deltaV: deltaV2,
          pts: f2_pts,
          eSlope: e2Slope,
          eLit: e2Lit,
          eLitAbs: e2LitAbs,
          vLitError: v2LitError,
          vPrecision: v2Precision
        }
      }
    };
  }, [rows, f1, f2]);

  const { processed, stats, regressions } = calculations;



  // Check if inputs are missing/empty
  const hasNoData = rows.every(
    r => !r.f1_t1 && !r.f1_t2 && !r.f1_t3 && !r.f2_t1 && !r.f2_t2 && !r.f2_t3
  );

  const loadSampleData = () => {
    setF1(4000);
    setF2(5000);
    setTemp(27);
    setVRef(346.98);
    setRows([
      { id: '1', resonansiKe: 1, m: 0, f1_t1: 2.1, f1_t2: 2.2, f1_t3: 2.0, f2_t1: 1.7, f2_t2: 1.8, f2_t3: 1.6 },
      { id: '2', resonansiKe: 2, m: 1, f1_t1: 6.4, f1_t2: 6.3, f1_t3: 6.5, f2_t1: 5.1, f2_t2: 5.0, f2_t3: 5.2 },
      { id: '3', resonansiKe: 3, m: 2, f1_t1: 10.6, f1_t2: 10.7, f1_t3: 10.5, f2_t1: 8.5, f2_t2: 8.6, f2_t3: 8.4 },
      { id: '4', resonansiKe: 4, m: 3, f1_t1: 14.9, f1_t2: 14.8, f1_t3: 15.0, f2_t1: 11.9, f2_t2: 12.0, f2_t3: 11.8 },
    ]);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full items-start">
      {/* Left Input: Clean Physical Spreadsheet */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
              Tabel Pengamatan Gelombang Bunyi (Resonansi)
            </h3>
            <p className="text-xs text-slate-500">
              Input kolom tinggi udara <span className="font-semibold text-slate-700 font-mono">L' (cm)</span>. Nilai m (orde) diisi otomatis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              onClick={loadSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition"
              title="Isi data sampel hasil praktikum gelombang bunyi"
            >
              <Sparkles className="w-3.5 h-3.5" /> Isi Data Sampel
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 shadow-sm transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Data
            </button>
          </div>
        </div>

        {/* Parameter & Kalibrasi Fisika Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-tight mb-3">
            Parameter Eksperimen & Kalibrasi (Ketik langsung angka untuk merubah - navigasi arah/enter):
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* f1 */}
            <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col gap-1 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Frekuensi 1 (f₁)
              </span>
              <div className="flex items-center gap-1">
                <NumericCell
                  id="param-f1"
                  value={f1}
                  onChange={setF1}
                  onKeyDown={(e) => handleParamKeyDown(e, 'f1')}
                  className="w-full text-sm font-mono font-bold bg-slate-50/50 border border-slate-200 rounded px-2 py-1 text-blue-700 outline-none focus:ring-1 focus:ring-blue-400 text-center"
                  placeholder="f1"
                  allowZero={true}
                />
                <span className="text-xs font-semibold text-slate-500">Hz</span>
              </div>
            </div>

            {/* f2 */}
            <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col gap-1 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Frekuensi 2 (f₂)
              </span>
              <div className="flex items-center gap-1">
                <NumericCell
                  id="param-f2"
                  value={f2}
                  onChange={setF2}
                  onKeyDown={(e) => handleParamKeyDown(e, 'f2')}
                  className="w-full text-sm font-mono font-bold bg-slate-50/50 border border-slate-200 rounded px-2 py-1 text-emerald-700 outline-none focus:ring-1 focus:ring-emerald-400 text-center"
                  placeholder="f2"
                  allowZero={true}
                />
                <span className="text-xs font-semibold text-slate-500">Hz</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col gap-1 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Suhu Ruang (T)
              </span>
              <div className="flex items-center gap-1">
                <NumericCell
                  id="param-temp"
                  value={temp}
                  onChange={setTemp}
                  onKeyDown={(e) => handleParamKeyDown(e, 'temp')}
                  className="w-full text-sm font-mono font-bold bg-slate-50/50 border border-slate-200 rounded px-2 py-1 text-rose-700 outline-none focus:ring-1 focus:ring-rose-400 text-center"
                  placeholder="27"
                  allowZero={true}
                />
                <span className="text-xs font-semibold text-slate-500">°C</span>
              </div>
            </div>

            {/* Literature Speed of Sound */}
            <div className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col gap-1 shadow-3xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Laju Literatur (v)
              </span>
              <div className="flex items-center gap-1">
                <NumericCell
                  id="param-vRef"
                  value={vRef}
                  onChange={setVRef}
                  onKeyDown={(e) => handleParamKeyDown(e, 'vRef')}
                  className="w-full text-sm font-mono font-bold bg-slate-50/50 border border-slate-200 rounded px-2 py-1 text-teal-700 outline-none focus:ring-1 focus:ring-teal-400 text-center"
                  placeholder="347.7"
                  allowZero={true}
                />
                <span className="text-xs font-semibold text-slate-500">m/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Custom Multi-Header Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-100/80 border-b border-slate-200">
                <tr>
                  <th rowSpan={2} className="p-3 text-center text-xs font-bold text-slate-700 border-r border-slate-200">
                    Resonansi ke-
                  </th>
                  <th rowSpan={2} className="p-3 text-center text-xs font-bold text-slate-700 border-r border-slate-200">
                    m
                  </th>
                  <th colSpan={4} className="p-2.5 text-center text-xs font-bold text-blue-800 bg-blue-50/70 border-r border-slate-200">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span>L' (cm) pada f = <strong className="font-mono text-sm text-blue-700">{f1} Hz</strong></span>
                    </div>
                  </th>
                  <th colSpan={4} className="p-2.5 text-center text-xs font-bold text-emerald-800 bg-emerald-50/70">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span>L' (cm) pada f = <strong className="font-mono text-sm text-emerald-700">{f2} Hz</strong></span>
                    </div>
                  </th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                  <th className="p-2 text-center font-bold border-r border-slate-200">1</th>
                  <th className="p-2 text-center font-bold border-r border-slate-200">2</th>
                  <th className="p-2 text-center font-bold border-r border-slate-200">3</th>
                  <th className="p-2 text-center font-bold text-blue-705 bg-blue-50/30 border-r border-slate-200">Rerata</th>
                  <th className="p-2 text-center font-bold border-r border-slate-200">1</th>
                  <th className="p-2 text-center font-bold border-r border-slate-200">2</th>
                  <th className="p-2 text-center font-bold border-r border-slate-200">3</th>
                  <th className="p-2 text-center font-bold text-emerald-705 bg-emerald-50/30">Rerata</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono text-slate-600 divide-y divide-slate-100">
                {processed.map((row, rowIdx) => (
                  <tr key={row.id} className="hover:bg-slate-50/40 transition">
                    {/* Resonansi Ke */}
                    <td className="p-3 font-sans text-slate-800 font-semibold text-center border-r border-slate-100 bg-slate-50/30">
                      {row.resonansiKe}
                    </td>
                    {/* Orde m */}
                    <td className="p-3 text-slate-550 font-bold text-center border-r border-slate-100 bg-slate-50/30">
                      {row.m}
                    </td>

                    {/* F1 Trials in cm */}
                    <td className="p-1.5 px-2 border-r border-slate-100 bg-blue-50/5">
                      <NumericCell
                        id={`input-bunyi-${rowIdx}-0`}
                        value={row.f1_t1}
                        onChange={(val) => handleCellChange(row.id, 'f1_t1', val)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 0)}
                        className="w-full text-center bg-white border border-slate-205 focus:border-blue-400 focus:bg-white outline-none py-1.5 rounded-md text-slate-800 font-bold text-xs focus:shadow-xs"
                        placeholder="0.0"
                        allowZero={true}
                      />
                    </td>
                    <td className="p-1.5 px-2 border-r border-slate-100 bg-blue-50/5">
                      <NumericCell
                        id={`input-bunyi-${rowIdx}-1`}
                        value={row.f1_t2}
                        onChange={(val) => handleCellChange(row.id, 'f1_t2', val)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 1)}
                        className="w-full text-center bg-white border border-slate-205 focus:border-blue-400 focus:bg-white outline-none py-1.5 rounded-md text-slate-800 font-bold text-xs focus:shadow-xs"
                        placeholder="0.0"
                        allowZero={true}
                      />
                    </td>
                    <td className="p-1.5 px-2 border-r border-slate-100 bg-blue-50/5">
                      <NumericCell
                        id={`input-bunyi-${rowIdx}-2`}
                        value={row.f1_t3}
                        onChange={(val) => handleCellChange(row.id, 'f1_t3', val)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 2)}
                        className="w-full text-center bg-white border border-slate-205 focus:border-blue-400 focus:bg-white outline-none py-1.5 rounded-md text-slate-800 font-bold text-xs focus:shadow-xs"
                        placeholder="0.0"
                        allowZero={true}
                      />
                    </td>
                    {/* F1 Rerata (cm) */}
                    <td className="p-3 text-center font-bold text-blue-600 bg-blue-50/15 border-r border-slate-100">
                      {row.avg1 > 0 ? row.avg1.toFixed(2) : '-'}
                    </td>

                    {/* F2 Trials in cm */}
                    <td className="p-1.5 px-2 border-r border-slate-100 bg-emerald-50/5">
                      <NumericCell
                        id={`input-bunyi-${rowIdx}-3`}
                        value={row.f2_t1}
                        onChange={(val) => handleCellChange(row.id, 'f2_t1', val)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 3)}
                        className="w-full text-center bg-white border border-slate-205 focus:border-emerald-400 focus:bg-white outline-none py-1.5 rounded-md text-slate-800 font-bold text-xs focus:shadow-xs"
                        placeholder="0.0"
                        allowZero={true}
                      />
                    </td>
                    <td className="p-1.5 px-2 border-r border-slate-100 bg-emerald-50/5">
                      <NumericCell
                        id={`input-bunyi-${rowIdx}-4`}
                        value={row.f2_t2}
                        onChange={(val) => handleCellChange(row.id, 'f2_t2', val)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 4)}
                        className="w-full text-center bg-white border border-slate-205 focus:border-emerald-400 focus:bg-white outline-none py-1.5 rounded-md text-slate-800 font-bold text-xs focus:shadow-xs"
                        placeholder="0.0"
                        allowZero={true}
                      />
                    </td>
                    <td className="p-1.5 px-2 border-r border-slate-100 bg-emerald-50/5">
                      <NumericCell
                        id={`input-bunyi-${rowIdx}-5`}
                        value={row.f2_t3}
                        onChange={(val) => handleCellChange(row.id, 'f2_t3', val)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 5)}
                        className="w-full text-center bg-white border border-slate-205 focus:border-emerald-400 focus:bg-white outline-none py-1.5 rounded-md text-slate-800 font-bold text-xs focus:shadow-xs"
                        placeholder="0.0"
                        allowZero={true}
                      />
                    </td>
                    {/* F2 Rerata (cm) */}
                    <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/15">
                      {row.avg2 > 0 ? row.avg2.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unified Regression & Correction Factor Analysis Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-mini">
          <div className="border-b border-slate-205 pb-2 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-500" />
              HASIL ANALISIS REGRESI LINIER & FAKTOR KOREKSI UJUNG PIPA
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
              Dihitung secara otomatis menggunakan metode kuadrat terkecil (least squares regression) untuk kedua frekuensi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frekuensi 1 column */}
            <div className="bg-white border border-slate-150 rounded-lg p-3.5 space-y-3.5 shadow-3xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-extrabold text-blue-700 uppercase font-sans">
                  Frekuensi f₁ = {f1} Hz
                </span>
                {regressions.f1.regression.slope > 0 && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold animate-none">
                    R² = {regressions.f1.regression.rSquared.toFixed(5)}
                  </span>
                )}
              </div>

              {regressions.f1.regression.slope > 0 ? (
                <div className="space-y-3 font-mono text-slate-600">
                  {/* Model & Fit Parameters */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gradien Slope (m / λ/2):</span>
                      <span className="font-semibold text-slate-800">{regressions.f1.regression.slope.toFixed(4)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Intercept (n / λ/4 - e):</span>
                      <span className="font-semibold text-slate-800">{regressions.f1.regression.intercept.toFixed(4)} m</span>
                    </div>
                  </div>

                  {/* Correction Factors - Combined without duplication */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150/70 space-y-1.5 text-[11px]">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-sans">
                      Faktor Koreksi Ujung Pipet (e₁):
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2 rounded border border-slate-150 shadow-3xs">
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">e₁ (Ujung Lit):</span>
                        <span className="font-extrabold text-slate-800 block text-xs">{(stats.e1Lit * 100).toFixed(2)} cm</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{stats.e1Lit.toFixed(4)} m</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-150 shadow-3xs">
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">e₁ (Ujung Slope):</span>
                        <span className="font-extrabold text-blue-600 block text-xs">{(stats.e1Slope * 100).toFixed(2)} cm</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{stats.e1Slope.toFixed(4)} m</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated speed breakdown */}
                  <div className="bg-blue-50/40 p-2.5 rounded-lg border border-blue-100 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-550 text-[10px] uppercase font-sans font-bold block">Laju Bunyi Terhitung:</span>
                      <div className="text-base font-black text-blue-900 mt-0.5">
                        {regressions.f1.vSlope.toFixed(2)} m/s
                      </div>
                    </div>
                    <div className="text-right font-sans">
                      <span className="text-slate-500 text-[9.5px] block font-mono">Ralat (Δv₁): ±{regressions.f1.deltaV.toFixed(2)} m/s</span>
                      <span className="text-blue-700 text-[9.5px] font-extrabold block">Error Lit: {regressions.f1.vLitError.toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Uncertainty details */}
                  <div className="text-[10.5px] border-t border-dashed border-slate-200 pt-2.5 space-y-1.5">
                    <span className="text-slate-500 font-sans font-bold block">Parameter Ralat Regresi (y = mx + n):</span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-slate-50 p-2 rounded border border-slate-150">
                      <div className="flex justify-between">
                        <span className="text-slate-400">sm (Ralat Slope):</span>
                        <span className="font-bold text-slate-705">{regressions.f1.regression.slopeError.toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">sn (Ralat Int):</span>
                        <span className="font-bold text-slate-705">{regressions.f1.regression.interceptError.toFixed(5)}</span>
                      </div>
                      <div className="col-span-2 flex justify-between border-t border-slate-200 pt-1 mt-0.5">
                        <span className="text-slate-400">sy (Ralat s_y):</span>
                        <span className="font-bold text-slate-705">{regressions.f1.regression.sy.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 font-sans italic">
                  Belum ada data input untuk f₁
                </div>
              )}
            </div>

            {/* Frekuensi 2 column */}
            <div className="bg-white border border-slate-150 rounded-lg p-3.5 space-y-3.5 shadow-3xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                <span className="text-[11px] font-extrabold text-emerald-700 uppercase font-sans">
                  Frekuensi f₂ = {f2} Hz
                </span>
                {regressions.f2.regression.slope > 0 && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold animate-none">
                    R² = {regressions.f2.regression.rSquared.toFixed(5)}
                  </span>
                )}
              </div>

              {regressions.f2.regression.slope > 0 ? (
                <div className="space-y-3 font-mono text-slate-600">
                  {/* Model & Fit Parameters */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gradien Slope (m / λ/2):</span>
                      <span className="font-semibold text-slate-800">{regressions.f2.regression.slope.toFixed(4)} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Intercept (n / λ/4 - e):</span>
                      <span className="font-semibold text-slate-800">{regressions.f2.regression.intercept.toFixed(4)} m</span>
                    </div>
                  </div>

                  {/* Correction Factors - Combined without duplication */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150/70 space-y-1.5 text-[11px]">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-sans">
                      Faktor Koreksi Ujung Pipet (e₂):
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white p-2 rounded border border-slate-150 shadow-3xs">
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">e₂ (Ujung Lit):</span>
                        <span className="font-extrabold text-slate-800 block text-xs">{(stats.e2Lit * 100).toFixed(2)} cm</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{stats.e2Lit.toFixed(4)} m</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-150 shadow-3xs">
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">e₂ (Ujung Slope):</span>
                        <span className="font-extrabold text-emerald-600 block text-xs">{(stats.e2Slope * 100).toFixed(2)} cm</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{stats.e2Slope.toFixed(4)} m</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated speed breakdown */}
                  <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-550 text-[10px] uppercase font-sans font-bold block">Laju Bunyi Terhitung:</span>
                      <div className="text-base font-black text-emerald-900 mt-0.5">
                        {regressions.f2.vSlope.toFixed(2)} m/s
                      </div>
                    </div>
                    <div className="text-right font-sans">
                      <span className="text-slate-500 text-[9.5px] block font-mono">Ralat (Δv₂): ±{regressions.f2.deltaV.toFixed(2)} m/s</span>
                      <span className="text-emerald-700 text-[9.5px] font-extrabold block">Error Lit: {regressions.f2.vLitError.toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Uncertainty details */}
                  <div className="text-[10.5px] border-t border-dashed border-slate-200 pt-2.5 space-y-1.5">
                    <span className="text-slate-500 font-sans font-bold block">Parameter Ralat Regresi (y = mx + n):</span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 bg-slate-50 p-2 rounded border border-slate-150">
                      <div className="flex justify-between">
                        <span className="text-slate-400">sm (Ralat Slope):</span>
                        <span className="font-bold text-slate-705">{regressions.f2.regression.slopeError.toFixed(5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">sn (Ralat Int):</span>
                        <span className="font-bold text-slate-705">{regressions.f2.regression.interceptError.toFixed(5)}</span>
                      </div>
                      <div className="col-span-2 flex justify-between border-t border-slate-200 pt-1 mt-0.5">
                        <span className="text-slate-400">sy (Ralat s_y):</span>
                        <span className="font-bold text-slate-705">{regressions.f2.regression.sy.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 font-sans italic">
                  Belum ada data input untuk f₂
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Physical Graphs and Coefficients */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-5">
        {/* Interactive Physics Regression Fit Curve (Dual Frequencies) */}
        <InteractivePhysicsChart
          points={regressions.f1.pts}
          curve={{
            type: regressions.f1.regression.slope > 0 ? 'linear' : 'none',
            slope: regressions.f1.regression.slope,
            intercept: regressions.f1.regression.intercept
          }}
          points2={regressions.f2.pts}
          curve2={{
            type: regressions.f2.regression.slope > 0 ? 'linear' : 'none',
            slope: regressions.f2.regression.slope,
            intercept: regressions.f2.regression.intercept
          }}
          legend1={`f₁ (${f1} Hz)`}
          legend2={`f₂ (${f2} Hz)`}
          xLabel="Orde Resonansi (m)"
          yLabel="Tinggi Kolom Udara L (m)"
          xUnit=""
          yUnit="m"
          title="Regresi Linier 2 Frekuensi"
          subtitle="Tampilan gabungan f₁ dan f₂ mempermudah validasi perbandingan kecepatan bunyi teoritis."
          presetXMin={-0.5}
          presetXMax={3.5}
        />
      </div>
    </div>
  );
}
