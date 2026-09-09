import React, { useState, useMemo, useEffect } from 'react';
import { TrialRowPegasUnified } from '../types';
import { calculateLinearRegression, calculateStats } from '../utils';
import InteractivePhysicsChart from './InteractivePhysicsChart';
import FormulaGuide from './FormulaGuide';
import { Plus, Trash2, RotateCcw, Info, AlertCircle, TrendingUp, Sparkles, Sliders } from 'lucide-react';

interface PegasCellProps {
  value: number;
  onChange: (val: number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  id: string;
  className: string;
  placeholder?: string;
  allowZero?: boolean;
}

function PegasCell({
  value,
  onChange,
  onKeyDown,
  id,
  className,
  placeholder = "0",
  allowZero = false,
}: PegasCellProps) {
  const [localVal, setLocalVal] = useState<string>('');

  useEffect(() => {
    if (value === 0) {
      setLocalVal('');
    } else {
      setLocalVal(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const normalized = raw.replace(',', '.');
    if (normalized === '' || /^-?\d*\.?\d*$/.test(normalized)) {
      setLocalVal(raw);
      const parsed = parseFloat(normalized);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    const normalized = localVal.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (localVal === '' || isNaN(parsed) || parsed === 0) {
      setLocalVal('');
      onChange(0);
    } else {
      setLocalVal(parsed.toString());
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={(e) => {
        e.currentTarget.select();
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
}

interface PegasExperimentProps {
  rows: TrialRowPegasUnified[];
  setRows: React.Dispatch<React.SetStateAction<TrialRowPegasUnified[]>>;
  mp: number;
  setMp: (val: number) => void;
  mt: number;
  setMt: (val: number) => void;
  posisi1: number;
  setPosisi1: (val: number) => void;
  g: number;
  setG: (val: number) => void;
  onReset: () => void;
}

export default function PegasExperiment({
  rows,
  setRows,
  mp,
  setMp,
  mt,
  setMt,
  posisi1,
  setPosisi1,
  g,
  setG,
  onReset,
}: PegasExperimentProps) {
  // Navigation for layout tab within analysis: 'statis' or 'dinamis'
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'statis' | 'dinamis' | 'both'>('both');

  // Handle cell edits in our unified row model with numeric value from PegasCell
  const handleNumericCellChange = (id: string, field: keyof TrialRowPegasUnified, value: number) => {
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

  // Keyboard navigation for spreadsheet-like input experience (Arrow keys, Enter, PgUp, PgDn)
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'massaBeban' | 'posisi2' | 'waktu10T',
    idx: number
  ) => {
    const fields: ('massaBeban' | 'posisi2' | 'waktu10T')[] = ['massaBeban', 'posisi2', 'waktu10T'];
    const fieldIdx = fields.indexOf(field);
    const numCols = rows.length;

    let targetField = field;
    let targetColIdx = idx;

    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === 'PageDown') {
      e.preventDefault();
      if (fieldIdx < 2) {
        targetField = fields[fieldIdx + 1];
      } else {
        targetField = fields[0];
        targetColIdx = (idx + 1) % numCols;
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (fieldIdx > 0) {
        targetField = fields[fieldIdx - 1];
      } else {
        targetField = fields[2];
        targetColIdx = (idx - 1 + numCols) % numCols;
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionEnd === null || input.selectionEnd === input.value.length) {
        e.preventDefault();
        targetColIdx = (idx + 1) % numCols;
      } else {
        return;
      }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === null || input.selectionStart === 0) {
        e.preventDefault();
        targetColIdx = (idx - 1 + numCols) % numCols;
      } else {
        return;
      }
    } else {
      return;
    }

    const nextId = `pegas-input-${targetField}-${targetColIdx}`;
    setTimeout(() => {
      const nextEl = document.getElementById(nextId) as HTMLInputElement | null;
      if (nextEl) {
        nextEl.focus();
        nextEl.select();
      }
    }, 10);
  };

  // Add trial column from the right
  const addTrialColumn = () => {
    const id = (Math.max(...rows.map(r => parseInt(r.id) || 0), 0) + 1).toString();
    setRows(prev => [
      ...prev,
      {
        id,
        massaBeban: 0,
        posisi2: 0,
        waktu10T: 0,
      },
    ]);
  };

  // Remove the last trial column
  const removeTrialColumn = () => {
    if (rows.length <= 2) {
      alert("Harap pertahankan minimal 2 kolom praktikum untuk analisis statistik!");
      return;
    }
    setRows(prev => prev.slice(0, -1));
  };

  const loadSampleData = () => {
    setMp(15.6);
    setMt(50);
    setPosisi1(120);
    setG(10);
    setRows([
      { id: "1", massaBeban: 100, posisi2: 170, waktu10T: 5.53 },
      { id: "2", massaBeban: 150, posisi2: 195, waktu10T: 6.36 },
      { id: "3", massaBeban: 200, posisi2: 220, waktu10T: 7.09 },
      { id: "4", massaBeban: 250, posisi2: 245, waktu10T: 7.76 },
      { id: "5", massaBeban: 300, posisi2: 270, waktu10T: 8.38 },
      { id: "6", massaBeban: 350, posisi2: 295, waktu10T: 8.96 },
      { id: "7", massaBeban: 400, posisi2: 320, waktu10T: 9.51 },
      { id: "8", massaBeban: 450, posisi2: 345, waktu10T: 10.04 },
      { id: "9", massaBeban: 500, posisi2: 370, waktu10T: 10.55 },
    ]);
  };

  // Unified calculations
  const analysis = useMemo(() => {
    const processed = rows.map(r => {
      // Elongation deltaX = (Posisi-2 - Posisi-1) in mm, then converted value in meters
      const deltaX = r.posisi2 > posisi1 ? r.posisi2 - posisi1 : 0;
      const deltaXMeter = deltaX / 1000;

      // Gravity force caused by search beban gantung
      const force = (r.massaBeban / 1000) * g;

      // Period T = 10T / 10
      const period = r.waktu10T > 0 ? r.waktu10T / 10 : 0;
      const periodSq = period * period;

      // Individual Hooke constant k = F / deltaX (in N/m)
      const kStatisInd = deltaXMeter > 0 && force > 0 ? force / deltaXMeter : 0;

      // Individual Dynamic acceleration period mass (MT + MB + MP/3)
      const mEffKg = (r.massaBeban + mt + mp / 3) / 1000;
      const kDinamisInd = periodSq > 0 ? (4 * Math.PI * Math.PI * mEffKg) / periodSq : 0;

      return {
        ...r,
        deltaX,
        deltaXMeter,
        force,
        period,
        periodSq,
        kStatisInd,
        kDinamisInd,
        mEffKg,
      };
    });

    // 1. Hooke static analysis stats
    const validKStatis = processed.map(p => p.kStatisInd).filter(k => k > 0 && isFinite(k));
    const statisStats = calculateStats(validKStatis);

    // X = deltaX (m), Y = F (N)
    const ptsStatis = processed.filter(p => p.deltaXMeter > 0 && p.force > 0).map(p => ({ x: p.deltaXMeter, y: p.force }));
    const statisRegression = calculateLinearRegression(ptsStatis.map(p => p.x), ptsStatis.map(p => p.y));

    // 2. Dynamic oscillation analysis stats
    const validKDinamis = processed.map(p => p.kDinamisInd).filter(k => k > 0 && isFinite(k));
    const dinamisStats = calculateStats(validKDinamis);

    // X = M gross (kg) = (mb + mt)/1000, Y = T^2 (s^2)
    const ptsDinamis = processed.filter(p => p.massaBeban > 0 && p.periodSq > 0).map(p => ({
      x: (p.massaBeban + mt) / 1000,
      y: p.periodSq,
    }));
    const dinamisRegressionRaw = calculateLinearRegression(ptsDinamis.map(p => p.x), ptsDinamis.map(p => p.y));
    const kFromSlope = dinamisRegressionRaw.slope > 0 ? (4 * Math.PI * Math.PI) / dinamisRegressionRaw.slope : 0;

    // Estimate of mp from intercept -> Intercept = (4pi^2 / k) * (m_total_extra) => m_extra = Intercept * k / 4pi^2
    // m_extra = Intercept / Slope. Since m_extra = mp/3 => mp = 3 * Intercept / Slope (in kg) => in grams: * 1000
    const mpEstimated = dinamisRegressionRaw.slope > 0 && dinamisRegressionRaw.intercept > 0
      ? (3 * (dinamisRegressionRaw.intercept / dinamisRegressionRaw.slope) * 1000)
      : 0;

    const dinamisRegression = {
      ...dinamisRegressionRaw,
      kFromSlope,
      mpEstimated,
    };

    const periodStats = calculateStats(processed.map(p => p.period).filter(t => t > 0));
    const periodSqStats = calculateStats(processed.map(p => p.periodSq).filter(t => t > 0));
    const deltaXStats = calculateStats(processed.map(p => p.deltaX).filter(dx => dx > 0));
    const deltaXMeterStats = calculateStats(processed.map(p => p.deltaXMeter).filter(dx => dx > 0));
    const forceStats = calculateStats(processed.map(p => p.force).filter(f => f > 0));

    return {
      processed,
      statisStats,
      statisRegression,
      ptsStatis,
      dinamisStats,
      dinamisRegression,
      ptsDinamis,
      periodStats,
      periodSqStats,
      deltaXStats,
      deltaXMeterStats,
      forceStats,
    };
  }, [rows, mp, mt, posisi1, g]);

  // Combined sum totals for reference (sum only valid data points)
  const sumDeltaXMeter = analysis.ptsStatis.reduce((a, b) => a + b.x, 0);
  const sumForce = analysis.ptsStatis.reduce((a, b) => a + b.y, 0);
  const sumMassGross = analysis.ptsDinamis.reduce((a, b) => a + b.x, 0);
  const sumT2 = analysis.ptsDinamis.reduce((a, b) => a + b.y, 0);
  const sumMassLoad = analysis.processed.filter(p => p.massaBeban > 0 && p.periodSq > 0).reduce((a, b) => a + b.massaBeban / 1000, 0);

  return (
    <div className="grid grid-cols-12 gap-5 h-full items-start">
      {/* 1. CONST PARAMETERS CONTAINER: Exactly replicates top image layout */}
      <div className="col-span-12 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Parameter Tetap &amp; Kalibrasi Awal</h4>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
            Input konstan dari lembar kerja
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* mp */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Massa Pegas (<span className="italic font-bold font-serif text-slate-700">m_p</span>)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0"
                value={mp || ''}
                onChange={e => setMp(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition rounded px-2.5 py-1.5 font-mono text-xs text-slate-800 font-semibold"
                placeholder="0.0"
              />
              <span className="text-xs text-slate-400 font-semibold">gram</span>
            </div>
          </div>

          {/* mt */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Massa Tabung (<span className="italic font-bold font-serif text-slate-700">m_t</span>)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="0"
                value={mt || ''}
                onChange={e => setMt(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition rounded px-2.5 py-1.5 font-mono text-xs text-slate-800 font-semibold"
                placeholder="0.0"
              />
              <span className="text-xs text-slate-400 font-semibold">gram</span>
            </div>
          </div>

          {/* Posisi - 1 */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Posisi-1 (<span className="italic font-serif text-slate-700">Posisi acuan</span>)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="1"
                min="0"
                value={posisi1 || ''}
                onChange={e => setPosisi1(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition rounded px-2.5 py-1.5 font-mono text-xs text-slate-800 font-semibold"
                placeholder="0"
              />
              <span className="text-xs text-slate-400 font-semibold">mm</span>
            </div>
          </div>

          {/* g */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 relative">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Konstanta Gravitasi (<span className="italic font-bold font-serif text-slate-700">g</span>)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.1"
                min="1"
                value={g || ''}
                onChange={e => setG(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition rounded px-2.5 py-1.5 font-mono text-xs text-slate-800 font-semibold"
                placeholder="10.0"
              />
              <span className="text-xs text-slate-400 font-semibold">m/s²</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPREADSHEET TABLE INPUT CONTAINER: Fits exactly the uploaded image layout */}
      <div className="col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              TABEL DATA HASIL PENGAMATAN
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addTrialColumn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition"
              title="Tambah kolom uji coba di sebelah kanan"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Uji (+)
            </button>
            <button
              onClick={removeTrialColumn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-red-200 text-red-600 bg-red-50/20 hover:bg-red-55/10 rounded-lg shadow-sm transition"
              title="Hapus kolom uji coba terakhir"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Terakhir (-)
            </button>
            <button
              onClick={loadSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition"
              title="Isi data sampel hasil praktikum pegas"
            >
              <Sparkles className="w-3.5 h-3.5" /> Isi Data Sampel
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 shadow-sm transition"
              title="Isi dengan data sampel nyata"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Informative alerts */}
        {posisi1 <= 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2.5 items-start text-xs text-amber-800 animate-pulse">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">Nilai Posisi-1 Belum Diatur:</span>
              <p className="text-[11px] leading-relaxed mt-0.5">
                Harap tentukan <span className="font-semibold">Posisi-1 &gt; 0 mm</span> di paramater tetap atas untuk melengkapi perhitungan peregangan elastisitas pegas (&Delta;x).
              </p>
            </div>
          </div>
        )}

        {/* LANDSCAPE spreadsheet with horizontal trial columns! Perfect match to image */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-mini">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-2.5 text-[11px] font-extrabold uppercase text-slate-500 w-44 border-r border-slate-200 bg-slate-50/80 sticky left-0 z-10 shadow-sm">
                    Parameter / Trial
                  </th>
                  {rows.map((row, idx) => (
                    <th key={row.id} className="p-2.5 text-[11px] font-bold uppercase text-slate-600 text-center border-r border-slate-100 min-w-[70px]">
                      Uji {idx + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-slate-600">                {/* 1. ROW m_b (g) */}
                <tr className="border-b border-slate-150 hover:bg-slate-50/30 transition">
                  <td className="p-2.5 font-sans font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 shadow-sm flex items-center justify-between">
                    <span>Massa Beban m_b (g)</span>
                    <span className="text-[10px] text-blue-500 bg-blue-50 px-1 py-0.2 rounded font-sans">Input</span>
                  </td>
                  {rows.map((row, idx) => {
                    const isInvalid = row.massaBeban <= 0;
                    return (
                      <td key={row.id} className={`p-2 border-r border-slate-100 transition-colors ${isInvalid ? 'bg-red-50/10' : 'bg-transparent'}`}>
                        <PegasCell
                          id={`pegas-input-massaBeban-${idx}`}
                          value={row.massaBeban}
                          onChange={val => handleNumericCellChange(row.id, 'massaBeban', val)}
                          onKeyDown={e => handleKeyDown(e, 'massaBeban', idx)}
                          className={`w-full bg-transparent text-center outline-none border-b transition-colors font-bold font-mono py-1 ${
                            isInvalid 
                              ? 'border-red-300 text-red-500 focus:border-red-500' 
                              : 'text-slate-800 border-transparent focus:border-blue-500'
                          }`}
                          placeholder="0"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 2. ROW Posisi-2 (mm) */}
                <tr className="border-b border-slate-150 hover:bg-slate-50/30 transition">
                  <td className="p-2.5 font-sans font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 shadow-sm flex items-center justify-between">
                    <span>Posisi-2 (mm)</span>
                    <span className="text-[10px] text-blue-500 bg-blue-50 px-1 py-0.2 rounded font-sans">Input</span>
                  </td>
                  {rows.map((row, idx) => {
                    const isInvalid = row.posisi2 <= posisi1;
                    return (
                      <td key={row.id} className={`p-2 border-r border-slate-100 transition-colors ${isInvalid ? 'bg-amber-50/10' : 'bg-transparent'}`}>
                        <PegasCell
                          id={`pegas-input-posisi2-${idx}`}
                           value={row.posisi2}
                           onChange={val => handleNumericCellChange(row.id, 'posisi2', val)}
                           onKeyDown={e => handleKeyDown(e, 'posisi2', idx)}
                          className={`w-full bg-transparent text-center outline-none border-b transition-colors font-bold font-mono py-1 ${
                            isInvalid 
                              ? 'border-amber-300 text-amber-600 focus:border-amber-500' 
                              : 'text-slate-800 border-transparent focus:border-blue-500'
                          }`}
                          placeholder="0"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 3. ROW 10T (s) */}
                <tr className="border-b border-slate-200 hover:bg-slate-50/30 transition">
                  <td className="p-2.5 font-sans font-bold text-slate-700 bg-slate-50/50 border-r border-slate-200 sticky left-0 z-10 shadow-sm flex items-center justify-between">
                    <span>Waktu 10T (s)</span>
                    <span className="text-[10px] text-blue-500 bg-blue-50 px-1 py-0.2 rounded font-sans">Input</span>
                  </td>
                  {rows.map((row, idx) => {
                    const isInvalid = row.waktu10T <= 0;
                    return (
                      <td key={row.id} className={`p-2 border-r border-slate-100 transition-colors ${isInvalid ? 'bg-red-50/10' : 'bg-transparent'}`}>
                        <PegasCell
                          id={`pegas-input-waktu10T-${idx}`}
                           value={row.waktu10T}
                           onChange={val => handleNumericCellChange(row.id, 'waktu10T', val)}
                           onKeyDown={e => handleKeyDown(e, 'waktu10T', idx)}
                          className={`w-full bg-transparent text-center outline-none border-b transition-colors font-bold font-mono py-1 ${
                            isInvalid 
                              ? 'border-red-300 text-red-500 focus:border-red-500' 
                              : 'text-slate-800 border-transparent focus:border-blue-500'
                          }`}
                          placeholder="0.0"
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* 3b. ROW Periode T (s) - Auto Computed right under Waktu 10T */}
                <tr className="border-b border-slate-200 bg-emerald-50/5 hover:bg-emerald-50/10 transition">
                  <td className="p-2.5 font-sans font-bold text-emerald-800 bg-emerald-50/20 border-r border-slate-200 sticky left-0 z-10 shadow-sm flex items-center justify-between">
                    <span>Periode T (sekon)</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-sans">Otomatis</span>
                  </td>
                  {analysis.processed.map((p) => (
                    <td key={p.id} className="p-2 border-r border-slate-100 text-center font-bold font-mono text-emerald-700">
                      {p.period > 0 ? p.period.toFixed(3) : '-'}
                    </td>
                  ))}
                </tr>

                {/* --- SEPARATOR FOR AUTOMATIC CALCULATED TRIALS --- */}
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-bold">
                  <td className="p-2.5 px-2.5 sticky left-0 z-10 bg-slate-100 shadow-mini" colSpan={1}>
                    Perhitungan Regresi Linear
                  </td>
                  <td colSpan={rows.length} className="p-2.5 text-right font-sans italic text-[10px] text-slate-500 pr-4">
                    Pembaruan otomatis real-time
                  </td>
                </tr>
                {/* --- SUBHEADER: METODE STATIS --- */}
                <tr className="bg-blue-50/20 border-b border-blue-100 text-blue-800 text-[10px] font-bold">
                  <td className="p-1.5 px-2.5 sticky left-0 z-10 bg-blue-50/30 shadow-mini" colSpan={1}>
                    Statis (Hukum Hooke)
                  </td>
                  <td colSpan={rows.length} className="p-1.5 text-center font-sans italic text-[9px] text-blue-500">
                    Variabel untuk Analisis Hubungan Simpangan (Δx) & Gaya Berat (F)
                  </td>
                </tr>

                {/* 1. Statis: deltaX (m) */}
                <tr className="border-b border-slate-100 hover:bg-blue-50/10 transition bg-blue-50/5 text-blue-650">
                  <td className="p-2 px-2.5 font-sans font-medium border-r border-slate-200 sticky left-0 z-10 bg-blue-50/50 shadow-sm flex items-center justify-between">
                    <span>Δx (meter)</span>
                  </td>
                  {analysis.processed.map((p) => (
                    <td key={p.id} className="p-2 border-r border-slate-100 text-center font-mono font-bold text-blue-600">
                      {p.deltaXMeter > 0 ? p.deltaXMeter.toFixed(4) : '-'}
                    </td>
                  ))}
                </tr>

                {/* 2. Statis: Gaya F (N) */}
                <tr className="border-b border-slate-200 hover:bg-slate-50/40 transition bg-slate-50/5 text-slate-750">
                  <td className="p-2 px-2.5 font-sans font-bold border-r border-slate-200 sticky left-0 z-10 bg-slate-50/50 shadow-sm flex items-center justify-between">
                    <span>Gaya Berat F (N)</span>
                  </td>
                  {analysis.processed.map((p) => (
                    <td key={p.id} className="p-2 border-r border-slate-100 text-center font-bold font-mono text-slate-800">
                      {p.force > 0 ? p.force.toFixed(3) : '-'}
                    </td>
                  ))}
                </tr>

                {/* --- SUBHEADER: METODE DINAMIS --- */}
                <tr className="bg-emerald-50/20 border-b border-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <td className="p-1.5 px-2.5 sticky left-0 z-10 bg-emerald-50/30 shadow-mini" colSpan={1}>
                    Dinamis (Osilasi)
                  </td>
                  <td colSpan={rows.length} className="p-1.5 text-center font-sans italic text-[9px] text-emerald-500">
                    Variabel untuk Analisis Hubungan Massa Beban (Mb) & T²
                  </td>
                </tr>

                {/* 1. Dinamis: Mb (kg) */}
                <tr className="border-b border-slate-100 hover:bg-emerald-50/10 transition bg-emerald-50/5 text-emerald-800">
                  <td className="p-2 px-2.5 font-sans font-bold border-r border-slate-200 sticky left-0 z-10 bg-emerald-50/50 shadow-sm flex items-center justify-between">
                    <span>Massa Beban m_b (kg)</span>
                  </td>
                  {analysis.processed.map((p) => (
                    <td key={p.id} className="p-2 border-r border-slate-100 text-center font-bold font-mono text-emerald-700">
                      {p.massaBeban > 0 ? (p.massaBeban / 1000).toFixed(3) : '-'}
                    </td>
                  ))}
                </tr>

                {/* 2. Dinamis: T^2 (sekon^2) */}
                <tr className="border-b border-slate-250 hover:bg-emerald-50/10 transition bg-emerald-50/5 text-emerald-700">
                  <td className="p-2 px-2.5 font-sans font-bold border-r border-slate-200 sticky left-0 z-10 bg-emerald-50/50 shadow-sm flex items-center justify-between">
                    <span>T² (sekon²)</span>
                  </td>
                  {analysis.processed.map((p) => (
                    <td key={p.id} className="p-2 border-r border-slate-100 text-center font-bold font-mono text-emerald-600">
                      {p.periodSq > 0 ? p.periodSq.toFixed(4) : '-'}
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* Hasil Perhitungan Rerata Formula (Kotak Terpisah) */}
        <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-mini">
          <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              HASIL PERHITUNGAN TETAPAN PEGAS
            </span>
            <span className="text-[10px] text-slate-400 font-sans italic">Diperbarui otomatis secara real-time</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Box 6: k Statis */}
            <div className="bg-blue-50/45 border border-blue-200 p-3 rounded-lg shadow-mini flex flex-col justify-center">
              <span className="text-[10px] font-bold text-blue-700 uppercase mb-1">Rerata k Statis (Hukum Hooke)</span>
              <div className="text-base font-mono font-bold text-blue-800">
                {analysis.statisStats.mean > 0 
                  ? `${analysis.statisStats.mean.toFixed(3)} ± ${analysis.statisStats.stdError.toFixed(3)} N/m` 
                  : '-'}
              </div>
              {analysis.statisStats.mean > 0 && (
                <span className="text-[9px] text-blue-600 font-medium font-sans mt-0.5">
                  Presisi: {analysis.statisStats.precision.toFixed(2)}% | Ralat Rel: {analysis.statisStats.relativeError.toFixed(2)}%
                </span>
              )}
            </div>

            {/* Box 7: k Dinamis */}
            <div className="bg-indigo-50/45 border border-indigo-200 p-3 rounded-lg shadow-mini flex flex-col justify-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase mb-1">Rerata k Dinamis (Osilasi)</span>
              <div className="text-base font-mono font-bold text-indigo-800">
                {analysis.dinamisStats.mean > 0 
                  ? `${analysis.dinamisStats.mean.toFixed(3)} ± ${analysis.dinamisStats.stdError.toFixed(3)} N/m` 
                  : '-'}
              </div>
              {analysis.dinamisStats.mean > 0 && (
                <span className="text-[9px] text-indigo-600 font-medium font-sans mt-0.5">
                  Presisi: {analysis.dinamisStats.precision.toFixed(2)}% | Ralat Rel: {analysis.dinamisStats.relativeError.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CALCULATED RESULTS AREA */}
      <div className="col-span-12 flex flex-col gap-4">
        {/* Toggle between display views */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex max-w-lg">
          <button
            onClick={() => setActiveAnalysisTab('both')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeAnalysisTab === 'both'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tampilkan Kedua Analisis
          </button>
          <button
            onClick={() => setActiveAnalysisTab('statis')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeAnalysisTab === 'statis'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Metode Statis (Hooke)
          </button>
          <button
            onClick={() => setActiveAnalysisTab('dinamis')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeAnalysisTab === 'dinamis'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Metode Dinamis (Osilasi)
          </button>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* ================ METODE STATIS RESULTS CARD & PLOT ================ */}
          {(activeAnalysisTab === 'statis' || activeAnalysisTab === 'both') && (
            <div className={`col-span-12 ${activeAnalysisTab === 'both' ? 'lg:col-span-6' : ''} flex flex-col gap-4`}>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span>
                    Hasil Analisis Statis (Hukum Hooke)
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold uppercase font-mono">
                    F = k * Δx
                  </span>
                </div>

                <div className="bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Konstanta Pegas Regresi Statis (k_statis)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[40px] font-mono font-black text-slate-900 leading-none">
                      {analysis.statisRegression.slope > 0 ? analysis.statisRegression.slope.toFixed(3) : '-'}
                    </span>
                    <span className="text-lg font-medium text-slate-500 italic">N/m</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-3 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans">K-Rerata Statistik:</span>
                      <span className="font-semibold text-slate-700">
                        {analysis.statisStats.mean > 0 ? `${analysis.statisStats.mean.toFixed(3)} ± ${analysis.statisStats.stdError.toFixed(3)}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">Korelasi R² Linier:</span>
                      <span className="font-semibold text-amber-600">
                        {analysis.statisRegression.slope > 0 ? analysis.statisRegression.rSquared.toFixed(5) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 items-center">
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase tracking-wider">
                      {analysis.statisStats.mean > 0 ? `${analysis.statisStats.precision.toFixed(2)}% Ketelitian` : '-'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Ralat Relatif: {analysis.statisStats.mean > 0 ? `${analysis.statisStats.relativeError.toFixed(3)}%` : '-'}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-dashed border-slate-200/80 pt-2.5">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Parameter Ralat Regresi (y = mx + n):
                    </span>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] font-mono text-slate-650 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">m (Slope):</span>
                        <span className="font-bold text-slate-800">{analysis.statisRegression.slope > 0 ? analysis.statisRegression.slope.toFixed(5) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">sm:</span>
                        <span className="font-bold text-indigo-650">{analysis.statisRegression.slope > 0 ? analysis.statisRegression.slopeError.toFixed(5) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">n (Intercept):</span>
                        <span className="font-bold text-slate-800">{analysis.statisRegression.slope > 0 ? analysis.statisRegression.intercept.toFixed(5) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">sn:</span>
                        <span className="font-bold text-indigo-600">{analysis.statisRegression.slope > 0 ? analysis.statisRegression.interceptError.toFixed(5) : '-'}</span>
                      </div>
                      <div className="col-span-2 flex justify-between border-t border-slate-100 pt-0.5 mt-0.5">
                        <span className="text-slate-400 font-sans">sy (Ralat s_y):</span>
                        <span className="font-bold text-emerald-600">{analysis.statisRegression.slope > 0 ? analysis.statisRegression.sy.toFixed(5) : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                  <div className="flex justify-between">
                    <span>Jumlah Data (n)</span>
                    <span className="font-bold text-slate-700">{analysis.ptsStatis.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Gaya Berat ΣF</span>
                    <span className="text-slate-700">{sumForce.toFixed(3)} N</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Peregangan ΣΔx</span>
                    <span className="text-slate-700">{sumDeltaXMeter.toFixed(4)} m</span>
                  </div>
                </div>
              </div>

              <InteractivePhysicsChart
                points={analysis.ptsStatis}
                curve={{
                  type: 'linear',
                  slope: analysis.statisRegression.slope,
                  intercept: analysis.statisRegression.intercept,
                }}
                xLabel="Pertambahan Panjang Δx"
                yLabel="Gaya Beban F"
                xUnit="m"
                yUnit="N"
                title="Kurva Hukum Hooke: Δx vs F"
                subtitle="Elongasi berbanding lurus dengan berat beban."
              />
            </div>
          )}

          {/* ================ METODE DINAMIS RESULTS CARD & PLOT ================ */}
          {(activeAnalysisTab === 'dinamis' || activeAnalysisTab === 'both') && (
            <div className={`col-span-12 ${activeAnalysisTab === 'both' ? 'lg:col-span-6' : ''} flex flex-col gap-4`}>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block"></span>
                    Hasil Analisis Dinamis (Getaran Harmonik)
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold uppercase font-mono">
                    T² = (4π²/k) * M
                  </span>
                </div>

                <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-100 rounded-xl p-4 mb-4">
                  <span className="text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">
                    Konstanta Pegas Regresi Dinamis (k_dinamis)
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-mono font-black text-slate-900 leading-none">
                      {analysis.dinamisRegression.kFromSlope > 0 ? analysis.dinamisRegression.kFromSlope.toFixed(3) : '-'}
                    </span>
                    <span className="text-lg font-medium text-slate-500 italic">N/m</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-3 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans">K-Rerata Praktikum:</span>
                      <span className="font-semibold text-slate-700">
                        {analysis.dinamisStats.mean > 0 ? `${analysis.dinamisStats.mean.toFixed(3)} ± ${analysis.dinamisStats.stdError.toFixed(3)}` : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-sans">Korelasi R² Regulator:</span>
                      <span className="font-semibold text-amber-600">
                        {analysis.dinamisRegression.slope > 0 ? analysis.dinamisRegression.rSquared.toFixed(5) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 items-center">
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase tracking-wider">
                      {analysis.dinamisStats.mean > 0 ? `${analysis.dinamisStats.precision.toFixed(2)}% Ketelitian` : '-'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Ralat Relatif: {analysis.dinamisStats.mean > 0 ? `${analysis.dinamisStats.relativeError.toFixed(3)}%` : '-'}
                    </span>
                  </div>

                  <div className="mt-3 border-t border-dashed border-slate-200/80 pt-2.5">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Parameter Ralat Regresi (y = mx + n):
                    </span>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] font-mono text-slate-650 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">m (Slope):</span>
                        <span className="font-bold text-slate-800">{analysis.dinamisRegression.slope > 0 ? analysis.dinamisRegression.slope.toFixed(5) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">sm:</span>
                        <span className="font-bold text-indigo-650">{analysis.dinamisRegression.slope > 0 ? analysis.dinamisRegression.slopeError.toFixed(5) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">n (Intercept):</span>
                        <span className="font-bold text-slate-800">{analysis.dinamisRegression.slope > 0 ? analysis.dinamisRegression.intercept.toFixed(5) : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">sn:</span>
                        <span className="font-bold text-indigo-600">{analysis.dinamisRegression.slope > 0 ? analysis.dinamisRegression.interceptError.toFixed(5) : '-'}</span>
                      </div>
                      <div className="col-span-2 flex justify-between border-t border-slate-100 pt-0.5 mt-0.5">
                        <span className="text-slate-400 font-sans">sy (Ralat s_y):</span>
                        <span className="font-bold text-emerald-600">{analysis.dinamisRegression.slope > 0 ? analysis.dinamisRegression.sy.toFixed(5) : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
                  <div className="flex justify-between">
                    <span>Jumlah Data (n)</span>
                    <span className="font-bold text-slate-700">{analysis.ptsDinamis.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Massa Beban Σm_b</span>
                    <span className="text-slate-700">{sumMassLoad.toFixed(3)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jumlah Kuadrat Periode ΣT²</span>
                    <span className="text-slate-700">{sumT2.toFixed(4)} s²</span>
                  </div>
                </div>
              </div>

              <InteractivePhysicsChart
                points={analysis.ptsDinamis}
                curve={{
                  type: 'linear',
                  slope: analysis.dinamisRegression.slope,
                  intercept: analysis.dinamisRegression.intercept,
                }}
                xLabel="Massa Gantung Gross M_gross"
                yLabel="Periode Kuadrat T²"
                xUnit="kg"
                yUnit="s²"
                title="Kurva Osilasi Pegas: M_gross vs T²"
                subtitle="Periode kuadrat bertambah linear seiring inersia massa gantung."
              />
            </div>
          )}
        </div>
      </div>

      {/* Comparison note for both */}
      <div className="col-span-12 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex gap-2.5 items-start mt-1">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">Analisis Komparatif Fisik Pegas:</span>
          <p className="leading-relaxed text-[11px]">
            Secara teoritis, konstanta pegas yang diperoleh dari metode statis (<span className="font-bold underline">{analysis.statisRegression.slope > 0 ? `${analysis.statisRegression.slope.toFixed(2)} N/m` : '-'}</span>) dan metode dinamis (<span className="font-bold underline">{analysis.dinamisRegression.kFromSlope > 0 ? `${analysis.dinamisRegression.kFromSlope.toFixed(2)} N/m` : '-'}</span>) harus bernilai serupa karena menggunakan pegas fisik yang sama. Perbedaan kecil disebabkan oleh friksi udara dan kontribusi dinamis massa pegas itu sendiri (<span className="font-bold">m_p</span>), yang secara teoretis bernilai sepertiga massa pegas fisik. 
            Estimasi regresi dari intercept menghasilkan massa pegas efektif teoritis sebesar <span className="font-bold underline">{analysis.dinamisRegression.mpEstimated > 0 ? `${analysis.dinamisRegression.mpEstimated.toFixed(1)} g` : '-'}</span> (dibandingkan massa fisik sebenarnya <span className="font-bold">{mp} g</span>).
          </p>
        </div>
      </div>
    </div>
  );
}
