import React, { useMemo, useState } from 'react';
import { TrialRowTegangan, TeganganGlobalParams } from '../types';
import { calculateTeganganMediumStats } from '../utils';
import { RotateCcw, Info, ArrowUp, ArrowDown, Droplet, Thermometer, Compass, Sliders, BarChart3, HelpCircle, Sparkles } from 'lucide-react';
import NumericCell from './NumericCell';

interface TeganganPermukaanExperimentProps {
  rows: TrialRowTegangan[];
  setRows: React.Dispatch<React.SetStateAction<TrialRowTegangan[]>>;
  params: TeganganGlobalParams;
  setParams: React.Dispatch<React.SetStateAction<TeganganGlobalParams>>;
  onReset: () => void;
}

export default function TeganganPermukaanExperiment({
  rows,
  setRows,
  params,
  setParams,
  onReset,
}: TeganganPermukaanExperimentProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const loadSampleData = () => {
    setParams({
      x0: 0.1,
      delta_x0: 0.05,
      x1: 1.4,
      delta_x1: 0.05,
      p: 71.0,
      delta_p: 0.05,
      t: 1.45,
      delta_t: 0.05,
      mBeban: 1.0,
      delta_mBeban: 0.05,
      g: 9.8,
      delta_g: 0.05,
    });
    setRows([
      { id: 'air', cairan: 'Air', trials: [1.1, 1.2, 1.2, 1.0, 1.1], suhu: 25, literatureVal: 0.0720 },
      { id: 'alkohol', cairan: 'Alkohol', trials: [0.5, 0.4, 0.3, 0.6, 0.6], suhu: 24, literatureVal: 0.0220 },
      { id: 'spiritus', cairan: 'Spiritus', trials: [0.7, 0.8, 0.8, 0.8, 0.7], suhu: 24, literatureVal: 0.0240 },
    ]);
  };

  // Keyboard navigation for global parameters
  const handleParamKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: keyof TeganganGlobalParams) => {
    const fields: (keyof TeganganGlobalParams)[] = ['x0', 'delta_x0', 'x1', 'delta_x1', 'p', 'delta_p', 't', 'delta_t', 'mBeban', 'delta_mBeban', 'g', 'delta_g'];
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
        // Move focus to first trial of first liquid
        const el = document.getElementById('input-trial-0-0');
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

  // Keyboard navigation for trial values
  const handleTrialKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, mediumIdx: number, trialIdx: number) => {
    let targetMediumIdx = mediumIdx;
    let targetTrialIdx = trialIdx;

    if (e.key === 'Enter' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (trialIdx < 4) {
        targetTrialIdx = trialIdx + 1;
      } else if (mediumIdx < rows.length - 1) {
        targetMediumIdx = mediumIdx + 1;
        targetTrialIdx = 0;
      } else {
        return; // reached end
      }
    } else if (e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (trialIdx > 0) {
        targetTrialIdx = trialIdx - 1;
      } else if (mediumIdx > 0) {
        targetMediumIdx = mediumIdx - 1;
        targetTrialIdx = 4;
      } else {
        // focus the last parameter field
        const el = document.getElementById('param-delta_g');
        if (el) {
          (el as HTMLInputElement).focus();
          (el as HTMLInputElement).select();
        }
        return;
      }
    } else {
      return;
    }

    const nextId = `input-trial-${targetMediumIdx}-${targetTrialIdx}`;
    const nextEl = document.getElementById(nextId);
    if (nextEl) {
      (nextEl as HTMLInputElement).focus();
      (nextEl as HTMLInputElement).select();
    }
  };

  // Updates global parameter value
  const handleNumericParamChange = (field: keyof TeganganGlobalParams, val: number) => {
    setParams(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Updates single trial value
  const handleNumericTrialChange = (mediumIdx: number, trialIdx: number, val: number) => {
    setRows(prev => prev.map((row, idx) => {
      if (idx === mediumIdx) {
        const updatedTrials = [...row.trials];
        updatedTrials[trialIdx] = val;
        return { ...row, trials: updatedTrials };
      }
      return row;
    }));
  };

  // Updates temperature or literature value for a liquid
  const handleNumericLiquidMetaChange = (mediumIdx: number, field: 'suhu' | 'literatureVal', val: number) => {
    setRows(prev => prev.map((row, idx) => {
      if (idx === mediumIdx) {
        return {
          ...row,
          [field]: val
        };
      }
      return row;
    }));
  };

  // Calculates all medium results
  const mediumResults = useMemo(() => {
    return rows.map((r, idx) => {
      const stats = calculateTeganganMediumStats(r.trials, params);
      const isSufficient = r.trials.filter(t => t > 0).length > 0;
      const isValid = isSufficient && stats.meanX2 > params.x0;
      const errorPct = isValid && r.literatureVal > 0 ? (Math.abs(stats.gamma - r.literatureVal) / r.literatureVal) * 100 : 0;

      return {
        ...r,
        stats,
        isValid,
        errorPct
      };
    });
  }, [rows, params]);

  // SVG Chart Dimensions & Configuration
  const chartWidth = 480;
  const chartHeight = 300;
  const paddingLeft = 55;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartMaxY = 0.090; // maximum display gamma in N/m (water is ~0.072)
  const chartYScale = (chartHeight - paddingTop - paddingBottom) / chartMaxY;

  return (
    <div className="grid grid-cols-12 gap-6 h-full items-start">
      {/* LEFT COLUMN: Calibration and General Configuration */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-4 text-slate-850 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800">Kalibrasi Jolly Balance</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={loadSampleData}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded shadow-xs transition"
                id="load-sample-tegangan-btn"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" /> Isi Data Sampel
              </button>
              <button
                onClick={onReset}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded shadow-xs transition"
                id="reset-tegangan-btn"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" /> Reset Data
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* Parameter Fields */}
            <div className="space-y-4 shadow-2xs">
              <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                <label className="text-xs font-semibold text-slate-750 block mb-1">
                  1. Skala Piringan Kosong Bebas (x0)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <NumericCell
                      id="param-x0"
                      value={params.x0}
                      onChange={val => handleNumericParamChange('x0', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'x0')}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-sm text-slate-800 font-mono font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">Skala</span>
                  </div>
                  <span className="text-slate-400 text-xs font-light">±</span>
                  <div className="w-24">
                    <NumericCell
                      id="param-delta_x0"
                      value={params.delta_x0}
                      onChange={val => handleNumericParamChange('delta_x0', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'delta_x0')}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm text-slate-500 font-mono focus:border-blue-500 outline-none text-center"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                <label className="text-xs font-semibold text-slate-755 block mb-1">
                  2. Skala Gantung Pelat Kering Kaca (x1)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <NumericCell
                      id="param-x1"
                      value={params.x1}
                      onChange={val => handleNumericParamChange('x1', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'x1')}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-sm text-slate-800 font-mono font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">Skala</span>
                  </div>
                  <span className="text-slate-400 text-xs font-light">±</span>
                  <div className="w-24">
                    <NumericCell
                      id="param-delta_x1"
                      value={params.delta_x1}
                      onChange={val => handleNumericParamChange('delta_x1', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'delta_x1')}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm text-slate-500 font-mono focus:border-blue-500 outline-none text-center"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                <label className="text-xs font-semibold text-slate-755 block mb-1">
                  3. Panjang Pelat Kaca (p)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <NumericCell
                      id="param-p"
                      value={params.p}
                      onChange={val => handleNumericParamChange('p', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'p')}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-sm text-slate-800 font-mono font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">mm</span>
                  </div>
                  <span className="text-slate-400 text-xs font-light">±</span>
                  <div className="w-24">
                    <NumericCell
                      id="param-delta_p"
                      value={params.delta_p}
                      onChange={val => handleNumericParamChange('delta_p', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'delta_p')}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm text-slate-500 font-mono focus:border-blue-500 outline-none text-center"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                <label className="text-xs font-semibold text-slate-750 block mb-1">
                  4. Tebal Pelat Kaca (t)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <NumericCell
                      id="param-t"
                      value={params.t}
                      onChange={val => handleNumericParamChange('t', val)}
                      onKeyDown={e => handleParamKeyDown(e, 't')}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-sm text-slate-800 font-mono font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">mm</span>
                  </div>
                  <span className="text-slate-400 text-xs font-light">±</span>
                  <div className="w-24">
                    <NumericCell
                      id="param-delta_t"
                      value={params.delta_t}
                      onChange={val => handleNumericParamChange('delta_t', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'delta_t')}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm text-slate-500 font-mono focus:border-blue-500 outline-none text-center"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                <label className="text-xs font-semibold text-slate-755 block mb-1">
                  5. Massa Beban Kalibrasi (m)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <NumericCell
                      id="param-mBeban"
                      value={params.mBeban}
                      onChange={val => handleNumericParamChange('mBeban', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'mBeban')}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-sm text-slate-800 font-mono font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">gram</span>
                  </div>
                  <span className="text-slate-400 text-xs font-light">±</span>
                  <div className="w-24">
                    <NumericCell
                      id="param-delta_mBeban"
                      value={params.delta_mBeban}
                      onChange={val => handleNumericParamChange('delta_mBeban', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'delta_mBeban')}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm text-slate-500 font-mono focus:border-blue-500 outline-none text-center"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-100">
                <label className="text-xs font-semibold text-slate-755 block mb-1">
                  6. Percepatan Gravitasi (g)
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <NumericCell
                      id="param-g"
                      value={params.g}
                      onChange={val => handleNumericParamChange('g', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'g')}
                      className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-sm text-slate-800 font-mono font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="9.8"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">m/s²</span>
                  </div>
                  <span className="text-slate-400 text-xs font-light">±</span>
                  <div className="w-24">
                    <NumericCell
                      id="param-delta_g"
                      value={params.g ? params.delta_g : 0}
                      onChange={val => handleNumericParamChange('delta_g', val)}
                      onKeyDown={e => handleParamKeyDown(e, 'delta_g')}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm text-slate-500 font-mono focus:border-blue-500 outline-none text-center"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Scaling Result Container */}
              {(() => {
                const diffX1X0 = params.x1 - params.x0;
                const kPegasVal = diffX1X0 > 0 ? ((params.mBeban / 1000) * params.g) / diffX1X0 : 0;
                return (
                  <div className="bg-blue-50/40 rounded-xl border border-blue-105 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs uppercase tracking-wide">
                      <HelpCircle className="w-4 h-4 text-blue-600 block" />
                      <span>Hasil Kesetaraan Skala (k)</span>
                    </div>
                    <div className="text-slate-700 text-xs leading-relaxed space-y-1.5">
                      <p className="text-[11px] font-medium leading-relaxed">
                        Menghitung kesetaraan skala kawat terhadap gaya pemulih:
                      </p>
                      <div className="bg-white/90 p-2.5 py-3 rounded-lg border border-blue-50 shadow-2xs font-mono text-[11px] text-center text-blue-900 border-dashed flex justify-center items-center gap-2">
                        <span>1 Skala =</span>
                        <div className="inline-block text-center mx-1">
                          <span className="block border-b border-blue-900/40 pb-0.5">m &middot; g</span>
                          <span className="block pt-0.5">x₁ - x₀</span>
                        </div>
                        <span>N</span>
                      </div>
                      <div className="font-mono text-center py-2.5 px-3 text-xs bg-blue-100/40 rounded-lg border border-blue-200/50 text-blue-900 mt-2">
                        <div className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-0.5">Nilai 1 Skala dalam Newton</div>
                        <div className="text-sm font-extrabold">{kPegasVal > 0 ? `${kPegasVal.toFixed(8)} N` : '0.00 N'}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

      </div>

      {/* CENTER COLUMN: Trials and statistics for each medium */}
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-600" />
            Zat Cair Medium Pengamatan
          </h2>
          <p className="text-xs text-slate-500">
            Isi kolom percobaan X2 (skala saat perbatasan permukaan cakar pelat terlepas). Sistem menghitung statistik, ralat, dan validitas relatif ke literature.
          </p>
        </div>

        {/* Medium Cards Grid */}
        <div className="grid grid-cols-1 gap-5">
          {mediumResults.map((m, mediumIdx) => {
            const meanX2 = m.stats.meanX2;
            const F = m.stats.F;
            const delta_F = m.stats.delta_F;
            const gamma = m.stats.gamma;
            const delta_gamma = m.stats.delta_gamma;

            // Compute error class
            let badgeClass = 'bg-slate-100 text-slate-850';
            if (m.isValid) {
              if (m.errorPct <= 10) badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
              else if (m.errorPct <= 25) badgeClass = 'bg-amber-100 text-amber-800 border border-amber-255';
              else badgeClass = 'bg-rose-100 text-rose-800 border border-rose-200';
            }

            return (
              <div
                key={m.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition"
              >
                {/* Header row */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="font-bold text-slate-800">{m.cairan}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    {/* Temperature Input */}
                    <div className="flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Suhu:</span>
                      <NumericCell
                        id={`input-suhu-${mediumIdx}`}
                        value={m.suhu}
                        onChange={val => handleNumericLiquidMetaChange(mediumIdx, 'suhu', val)}
                        className="w-12 px-1 text-center bg-transparent border-b border-dashed border-slate-300 font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                        placeholder="0.0"
                        allowZero={true}
                      />
                      <span className="text-slate-400">°C</span>
                    </div>

                    {/* Literature Input */}
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500">Lit:</span>
                      <NumericCell
                        id={`input-lit-${mediumIdx}`}
                        value={m.literatureVal}
                        onChange={val => handleNumericLiquidMetaChange(mediumIdx, 'literatureVal', val)}
                        className="w-18 px-1 text-center bg-transparent border-b border-dashed border-slate-300 font-mono font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                        placeholder="0.0000"
                        allowZero={true}
                      />
                      <span className="text-slate-400">N/m</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Left Column: Trial Inputs */}
                  <div className="lg:col-span-4 flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                      1. Masukkan Skala Penarikan Lepas (X₂) - 5 Kali Pengamatan
                    </span>

                    <div className="grid grid-cols-5 gap-2.5">
                      {m.trials.map((trialVal, trialIdx) => (
                        <div key={trialIdx} className="flex flex-col gap-1 group bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition">
                          <span className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wide group-hover:text-blue-500 transition">
                            T{trialIdx + 1}
                          </span>
                          <NumericCell
                            id={`input-trial-${mediumIdx}-${trialIdx}`}
                            value={trialVal}
                            placeholder="0.0"
                            onChange={val => handleNumericTrialChange(mediumIdx, trialIdx, val)}
                            onKeyDown={e => handleTrialKeyDown(e, mediumIdx, trialIdx)}
                            className="w-full py-1 border border-slate-200 focus:border-blue-400 focus:bg-white text-center bg-white rounded-md font-mono font-bold text-slate-800 text-[11px] outline-none transition"
                            allowZero={true}
                          />
                        </div>
                      ))}
                    </div>

                    {meanX2 > 0 && meanX2 <= params.x0 && (
                      <div className="mt-1 text-[10px] text-red-600 font-medium leading-relaxed bg-red-50 p-2.5 border border-red-100 rounded-lg animate-pulse flex gap-1.5 items-start">
                        <span className="text-xs">⚠️</span>
                        <span>
                          <strong>Perhatian:</strong> Nilai X₂ rata-rata ({meanX2.toFixed(3)}) kurang dari atau sama dengan skala piringan kosong x₀ ({params.x0.toFixed(3)}). Pastikan penarikan melewati titik seimbang piringan kosong!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Calculated Outcomes (Intermediate) */}
                  <div className="lg:col-span-3 pl-0 lg:pl-5 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-center gap-4">
                    {/* X2 Rerata */}
                    <div>
                      <span className="text-[10px] text-slate-450 uppercase block font-semibold">X₂ Rata-rata</span>
                      <div className="text-md font-mono font-bold text-slate-800">
                        {meanX2 > 0 ? (
                          <span>
                            {meanX2.toFixed(3)}{' '}
                            <span className="text-xs font-normal text-slate-500 block lg:inline">± {m.stats.stdErrX2.toFixed(4)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 font-light">-</span>
                        )}
                      </div>
                    </div>

                    {/* Gaya Pemulih F */}
                    <div>
                      <span className="text-[10px] text-slate-450 uppercase block font-semibold">Gaya Pemulih (F)</span>
                      <div className="text-md font-mono font-bold text-slate-800 leading-none">
                        {m.isValid ? (
                          <div className="space-y-1">
                            <span>{F.toFixed(6)} N</span>
                            <div className="text-[10px] font-normal text-slate-400">Ralat ΔF: ±{delta_F.toFixed(6)} N</div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-light">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Gamma and Literature Error */}
                  <div className="lg:col-span-5 pl-0 lg:pl-5 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-center">
                    <div className="space-y-4 bg-blue-50/20 p-4 rounded-xl border border-blue-100/40">
                      {/* Gamma */}
                      <div className="border-b border-blue-100/30 pb-3">
                        <span className="text-[10px] text-blue-600 block font-bold">γ (TEGANGAN PERMUKAAN)</span>
                        <div className="text-md font-mono font-bold text-blue-900 leading-none mt-1">
                          {m.isValid ? (
                            <div>
                              <div className="text-lg text-blue-950 font-extrabold">{gamma.toFixed(6)} N/m</div>
                              <div className="text-[10px] text-slate-500 font-normal mt-2 leading-relaxed space-y-1">
                                <div><span className="font-semibold text-blue-600">Ralat Mutlak (Δγ):</span> ±{delta_gamma.toFixed(6)} N/m</div>
                                <div><span className="font-semibold text-blue-600">Ralat Relatif:</span> {gamma > 0 ? ((delta_gamma / gamma) * 100).toFixed(2) : '0.00'}%</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-light">-</span>
                          )}
                        </div>
                      </div>

                      {/* Percent Difference & Literature Error */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Uji Literatur</span>
                        {m.isValid ? (
                          <div className="flex flex-col gap-1.5">
                            <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wide inline-block leading-none text-center ${badgeClass}`}>
                              {m.errorPct.toFixed(2)}% Ralat
                            </span>
                            <div className="text-[10px] text-slate-600 font-mono space-y-1">
                              <div><span className="font-semibold font-sans text-slate-500 text-[10px]">Setara Lab:</span> {(gamma * 1000).toFixed(2)} dyne/cm</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-light block">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Comparison Visualizer using Interactive SVG Chart */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-5 py-4 text-slate-800 border-b border-slate-200 flex gap-2 items-center">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-tight text-slate-800">Korelasi Tegangan Permukaan</h3>
          </div>

          <div className="p-5 flex flex-col lg:flex-row gap-6 items-center">
            {/* Legend & Summary text */}
            <div className="lg:w-2/5 space-y-3">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-widest block">Dashboard Grafik</span>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Berikut adalah perbandingan nilai tegangan permukaan <span className="font-semibold text-slate-800">γ (N/m)</span> hasil kalkulasi ralat praktikum terhadap nilai tabel referensi fisik literatur. Hover balok diagram untuk memeriksa koordinat pasti!
              </p>

              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-blue-600 rounded"></div>
                  <span className="text-slate-650 font-medium">γ_eksperimen (Pengamatan)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-slate-300 rounded"></div>
                  <span className="text-slate-650 font-medium">γ_literatur (Referensi)</span>
                </div>
              </div>

              {/* Tooltip display */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs min-h-[70px] flex flex-col justify-center">
                {hoveredBar ? (
                  (() => {
                    const matched = mediumResults.find(r => r.cairan === hoveredBar);
                    if (!matched || !matched.isValid) {
                      return <span className="text-slate-400 font-sans italic text-center">Masukan data pengamatan valid terlebih dahulu</span>;
                    }
                    return (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-850">{matched.cairan} (Suhu: {matched.suhu}°C)</div>
                        <div className="grid grid-cols-2 gap-x-2 font-mono text-[11px]">
                          <div>γ Eks: <strong className="text-blue-700">{matched.stats.gamma.toFixed(5)}</strong> N/m</div>
                          <div>γ Lit: <strong className="text-slate-700">{matched.literatureVal.toFixed(5)}</strong> N/m</div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <span className="text-slate-400 font-sans italic text-center">Arahkan kursor ke diagram batang untuk mendeteksi rincian</span>
                )}
              </div>
            </div>

            {/* Pure SVG Bar Chart comparing results side-by-side */}
            <div className="lg:w-3/5 w-full flex justify-center">
              <svg
                width={chartWidth}
                height={chartHeight}
                className="overflow-visible font-mono select-none"
              >
                {/* Background grid lines */}
                {[0, 0.02, 0.04, 0.06, 0.08].map((yVal, idx) => {
                  const y = chartHeight - paddingBottom - yVal * chartYScale;
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        textAnchor="end"
                        className="text-[9px] fill-slate-400 font-bold"
                      >
                        {yVal.toFixed(3)}
                      </text>
                    </g>
                  );
                })}

                {/* X axis lines */}
                <line
                  x1={paddingLeft}
                  y1={chartHeight - paddingBottom}
                  x2={chartWidth - paddingRight}
                  y2={chartHeight - paddingBottom}
                  stroke="#cbd5e1"
                  strokeWidth={1.5}
                />

                {/* Draw paired bars for each liquid */}
                {mediumResults.map((r, idx) => {
                  const spacing = (chartWidth - paddingLeft - paddingRight) / 3;
                  const centerX = paddingLeft + idx * spacing + spacing / 2;

                  // Bar metrics
                  const barWidth = 24;
                  const leftBarX = centerX - barWidth - 2;
                  const rightBarX = centerX + 2;

                  // Heights
                  const heightEks = r.isValid ? r.stats.gamma * chartYScale : 0;
                  const heightLit = r.literatureVal * chartYScale;

                  const yEks = chartHeight - paddingBottom - heightEks;
                  const yLit = chartHeight - paddingBottom - heightLit;

                  // Error limits (using standard error representation)
                  const errHeight = r.isValid ? r.stats.delta_gamma * chartYScale : 0;
                  const errY1 = yEks - errHeight;
                  const errY2 = yEks + errHeight;

                  return (
                    <g
                      key={r.id}
                      onMouseEnter={() => setHoveredBar(r.cairan)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="cursor-pointer group"
                    >
                      {/* Label of medium below the bar */}
                      <text
                        x={centerX}
                        y={chartHeight - paddingBottom + 16}
                        textAnchor="middle"
                        className="text-[10px] fill-slate-600 font-sans font-bold group-hover:fill-blue-600 transition-colors"
                      >
                        {r.cairan}
                      </text>

                      {/* Reference line/value label atop literature bar */}
                      <text
                        x={rightBarX + barWidth / 2}
                        y={yLit - 4}
                        textAnchor="middle"
                        className="text-[8px] fill-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                      >
                        {r.literatureVal.toFixed(3)}
                      </text>

                      {/* Experimental value label atop experimental bar */}
                      {r.isValid && (
                        <text
                          x={leftBarX + barWidth / 2}
                          y={yEks - 8}
                          textAnchor="middle"
                          className="text-[8px] fill-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {r.stats.gamma.toFixed(3)}
                        </text>
                      )}

                      {/* Bar 1: Experimental */}
                      <rect
                        x={leftBarX}
                        y={yEks}
                        width={barWidth}
                        height={heightEks}
                        fill={hoveredBar === r.cairan ? '#1d4ed8' : '#2563eb'}
                        rx={2}
                        className="transition-all"
                      />

                      {/* Bar 2: Literature */}
                      <rect
                        x={rightBarX}
                        y={yLit}
                        width={barWidth}
                        height={heightLit}
                        fill="#cbd5e1"
                        rx={2}
                        className="transition-all"
                      />

                      {/* Draw standard Error bars on top of experimental bar */}
                      {r.isValid && errHeight > 1 && (
                        <g>
                          {/* Vertical center indicator */}
                          <line
                            x1={leftBarX + barWidth / 2}
                            y1={errY1}
                            x2={leftBarX + barWidth / 2}
                            y2={errY2}
                            stroke="#dc2626"
                            strokeWidth={1.5}
                          />
                          {/* Upper cap */}
                          <line
                            x1={leftBarX + barWidth / 2 - 4}
                            y1={errY1}
                            x2={leftBarX + barWidth / 2 + 4}
                            y2={errY1}
                            stroke="#dc2626"
                            strokeWidth={1.5}
                          />
                          {/* Lower cap */}
                          <line
                            x1={leftBarX + barWidth / 2 - 4}
                            y1={errY2}
                            x2={leftBarX + barWidth / 2 + 4}
                            y2={errY2}
                            stroke="#dc2626"
                            strokeWidth={1.5}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
