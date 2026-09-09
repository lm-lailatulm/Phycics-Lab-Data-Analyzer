import React, { useState, useMemo } from 'react';
import { Info, AlertCircle, RotateCcw } from 'lucide-react';
import { TrialRowGravitasi } from '../types';
import { calculateLinearRegression, calculateStats } from '../utils';
import InteractivePhysicsChart from './InteractivePhysicsChart';
import FormulaGuide from './FormulaGuide';
import NumericCell from './NumericCell';

interface GravitasiExperimentProps {
  rows: TrialRowGravitasi[];
  setRows: React.Dispatch<React.SetStateAction<TrialRowGravitasi[]>>;
  l: number;
  setL: (val: number) => void;
  r: number;
  setR: (val: number) => void;
  onReset: () => void;
}

export default function GravitasiExperiment({
  rows,
  setRows,
  l,
  setL,
  r,
  setR,
  onReset,
}: GravitasiExperimentProps) {
  // Chart visualization selection state
  const [chartTab, setChartTab] = useState<'regression' | 'oscillation'>('regression');
  const [simRowId, setSimRowId] = useState<string>('average');

  // Handle changing input cells
  const handleCellChange = (id: string, field: 't1' | 't2', value: number) => {
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

  // Perform full physics and statistics calculation
  const calculations = useMemo(() => {
    // Effective length in meters (L = l_meter + r/1000)
    const lM = l / 100;
    const Leff = lM + r / 1000;
    const gammaVal = r / 1000;
    const sumLGP = lM + gammaVal;
    
    // Faktor koreksi fisis/sferis bandul: K = (l_m + gamma) + 2*gamma^2 / (5 * (l_m + gamma))
    const K_correction = sumLGP + (2 * gammaVal * gammaVal) / (5 * sumLGP);

    const processedRows = rows.map(row => {
      // 100T = t2 - t1
      const hasT1 = row.noPeriode1 === 0 ? row.t1 >= 0 : row.t1 > 0;
      const deltaT = hasT1 && row.t2 > row.t1 ? row.t2 - row.t1 : 0;
      const period = deltaT / 100;
      const periodSq = period * period;

      // Refined individual gravity using physical pendulum sferis model
      const gIndividual = periodSq > 0 ? (4 * Math.PI * Math.PI * K_correction) / periodSq : 0;

      return {
        ...row,
        deltaT,
        period,
        periodSq,
        gIndividual,
      };
    });

    // Filter valid rows where times were correctly input and t2 > t1
    const validRows = processedRows.filter(row => (row.noPeriode1 === 0 ? row.t1 >= 0 : row.t1 > 0) && row.t2 > row.t1);
    const validGValues = validRows.map(row => row.gIndividual);
    const stats = calculateStats(validGValues);

    const deltaTVals = validRows.map(row => row.deltaT);
    const avg100T = deltaTVals.length > 0 ? deltaTVals.reduce((a, b) => a + b, 0) / deltaTVals.length : 0;

    // Period calculation: Mean T (T̄ = sum(T) / n) & Delta T (Uncertainty of Mean Period)
    const validPeriods = validRows.map(row => row.period);
    const n = validPeriods.length;
    let avgT = 0;
    let deltaPeriod = 0;
    if (n > 0) {
      avgT = validPeriods.reduce((sum, t) => sum + t, 0) / n;
      if (n > 1) {
        const sumTSq = validPeriods.reduce((sum, t) => sum + t * t, 0);
        // Formula: Delta T = sqrt((sum T^2 - n * avgT^2) / (n * (n - 1)))
        const valInside = (sumTSq - n * avgT * avgT) / (n * (n - 1));
        deltaPeriod = valInside > 0 ? Math.sqrt(valInside) : 0;
      }
    }

    // Refined gBar & Delta g using propagation error differentials from image
    let gBar = 0;
    let deltaG = 0;
    const deltaLConst = 0.0005; // 0.05 cm typical ruler measurement uncertainty
    const deltaGammaConst = 0.00005; // 0.05 mm typical caliper measurement uncertainty

    if (avgT > 0) {
      gBar = (4 * Math.PI * Math.PI / (avgT * avgT)) * K_correction;
      
      // Partials
      const dG_dT = -2 * gBar / avgT;
      const dG_dl = (4 * Math.PI * Math.PI / (avgT * avgT)) * (1 - (2 * gammaVal * gammaVal) / (5 * sumLGP * sumLGP));
      const dG_dgamma = (4 * Math.PI * Math.PI / (avgT * avgT)) * (1 + (4 * lM * gammaVal + 2 * gammaVal * gammaVal) / (5 * sumLGP * sumLGP));
      
      // Uncertainty differential propagation
      deltaG = Math.abs(dG_dT) * deltaPeriod + Math.abs(dG_dl) * deltaLConst + Math.abs(dG_dgamma) * deltaGammaConst;
    }

    // Literature error relative to 9.8 m/s^2
    const gLitError = gBar > 0 ? (Math.abs(gBar - 9.8) / 9.8) * 100 : 0;

    // Regression of t vs N
    // Points represent (N, t)
    const regressionPoints: { x: number; y: number }[] = [];
    rows.forEach(row => {
      const isValid = (row.noPeriode1 === 0 ? row.t1 >= 0 : row.t1 > 0) && row.t2 > row.t1;
      if (isValid) {
        regressionPoints.push({ x: row.noPeriode1, y: row.t1 });
        regressionPoints.push({ x: row.noPeriode2, y: row.t2 });
      }
    });

    const regX = regressionPoints.map(p => p.x);
    const regY = regressionPoints.map(p => p.y);
    const regression = calculateLinearRegression(regX, regY);

    // Period from regression slope: t = T * N + t0 -> slope = T
    const TReg = regression.slope;
    // Regression physical gravity
    const gFromSlope = TReg > 0 ? (4 * Math.PI * Math.PI * K_correction) / (TReg * TReg) : 0;

    return {
      Leff,
      processedRows,
      stats,
      avg100T,
      avgT,
      deltaPeriod,
      gBar,
      deltaG,
      gLitError,
      deltaLConst,
      deltaGammaConst,
      regression: {
        ...regression,
        gFromSlope,
      },
      points: regressionPoints,
    };
  }, [rows, l, r]);

  const {
    Leff,
    processedRows,
    stats,
    avg100T,
    avgT,
    deltaPeriod,
    gBar,
    deltaG,
    gLitError,
    deltaLConst,
    deltaGammaConst,
    regression,
    points,
  } = calculations;

  return (
    <div className="grid grid-cols-12 gap-6 h-full items-start">
      {/* 1. Left Side: Input Form & Physics Theory */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Input Data Eksperimen GHS</h3>
            <p className="text-xs text-slate-500">Isi waktu t1 dan t2 untuk menghitung 100T, rerata, dan percepatan gravitasi g</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-705 bg-white rounded-lg hover:bg-slate-50 shadow-sm transition"
              id="reset-grav"
              title="Reset ke Data Default"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Isi Data Sampel
            </button>
          </div>
        </div>

        {/* Pendulum Dimension Specifications Input Card */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Panjang Kawat l (cm)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={l || ''}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setL(isNaN(val) ? 0 : val);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Contoh: 31.2"
            />
            <span className="text-[10px] text-slate-400 block mt-1 italic">
              Diukur dalam satuan centimeter (cm)
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Jejari Bola r (milimeter)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={r || ''}
              onChange={e => {
                const val = parseFloat(e.target.value);
                setR(isNaN(val) ? 0 : val);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Contoh: 10.0"
            />
            <span className="text-[10px] text-slate-400 block mt-1 italic">
              Diukur dalam satuan mm (milimeter)
            </span>
          </div>
        </div>

        {/* Validation check */}
        {processedRows.some(row => {
          const hasT1 = row.noPeriode1 === 0 ? row.t1 >= 0 : row.t1 > 0;
          return hasT1 && row.t2 > 0 && row.t2 <= row.t1;
        }) && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-start text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-650 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Koreksi Data Masukan:</span>
              <p className="mt-0.5 leading-relaxed">
                Terdapat baris data di mana nilai <b>t2</b> kurang dari atau sama dengan <b>t1</b>. Pastikan nilai waktu t2 lebih besar daripada t1 untuk mencegah perhitungan ralat negatif.
              </p>
            </div>
          </div>
        )}

        {/* Input Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="p-3 text-[11px] font-bold uppercase w-12 text-center">No</th>
                  <th className="p-3 text-[11px] font-bold uppercase text-center bg-slate-100/50">No. Periode (t1)</th>
                  <th className="p-3 text-[11px] font-bold uppercase bg-blue-50/40">Waktu t1 (s)</th>
                  <th className="p-3 text-[11px] font-bold uppercase text-center bg-slate-100/50">No. Periode (t2)</th>
                  <th className="p-3 text-[11px] font-bold uppercase bg-blue-50/40">Waktu t2 (s)</th>
                  <th className="p-3 text-[11px] font-bold uppercase text-right">100T = t2 - t1 (s)</th>
                  <th className="p-3 text-[11px] font-bold uppercase text-right text-slate-400">g (m/s²)</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono text-slate-600">
                {processedRows.map((row, idx) => {
                  const hasT1 = row.noPeriode1 === 0 ? row.t1 >= 0 : row.t1 > 0;
                  const hasBoth = hasT1 && row.t2 > 1; // row is populated if it has values
                  const isNegativeDiff = hasBoth && row.t2 <= row.t1;
                  
                  return (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="p-3 font-sans text-slate-400 text-center">{idx + 1}</td>
                      
                      {/* No Periode 1 */}
                      <td className="p-3 text-center bg-slate-50/50 font-bold text-slate-700">
                        {row.noPeriode1}
                      </td>

                      {/* Input t1 */}
                      <td className="p-3 bg-blue-50/10">
                        <NumericCell
                          value={row.t1}
                          onChange={val => handleCellChange(row.id, 't1', val)}
                          className="w-full bg-transparent outline-none font-semibold border-b border-transparent focus:border-blue-500 text-slate-800 text-center"
                          placeholder="t1"
                          allowZero={row.noPeriode1 === 0}
                        />
                      </td>

                      {/* No Periode 2 */}
                      <td className="p-3 text-center bg-slate-50/50 font-bold text-slate-700">
                        {row.noPeriode2}
                      </td>

                      {/* Input t2 */}
                      <td className="p-3 bg-blue-50/10">
                        <NumericCell
                          value={row.t2}
                          onChange={val => handleCellChange(row.id, 't2', val)}
                          className={`w-full bg-transparent outline-none font-semibold border-b border-transparent focus:border-blue-500 text-slate-800 text-center ${
                            isNegativeDiff ? 'text-red-500' : ''
                          }`}
                          placeholder="t2"
                          allowZero={false}
                        />
                      </td>

                      {/* 100T */}
                      <td className={`p-3 text-right font-bold transition-colors ${
                        isNegativeDiff ? 'text-red-600 bg-red-50' : 'text-slate-800'
                      }`}>
                        {hasBoth ? (row.t2 - row.t1).toFixed(2) : '-'}
                      </td>

                      {/* gIndividual */}
                      <td className="p-3 text-right text-slate-400 font-light text-xs">
                        {row.gIndividual > 0 ? row.gIndividual.toFixed(3) : '-'}
                      </td>
                    </tr>
                  );
                })}

                {/* Bottom Summary Row - rerata 100T */}
                <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                  <td colSpan={5} className="p-3 font-sans text-right uppercase tracking-wider text-xs">
                    (100T) Rerata :
                  </td>
                  <td className="p-3 text-right text-blue-700 text-base font-mono">
                    {avg100T > 0 ? `${avg100T.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right text-slate-500 text-xs font-mono">
                    s
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Formula Display removed */}
      </div>      {/* 2. Right Side: Automated Calculations and Plots */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Hasil Analisis Otomatis GHS</h3>

        {/* Core Calculated Acceleration Card */}
        <div className="bg-white border-l-4 border-l-blue-600 border border-slate-200 p-5 rounded-xl shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-2">
              HASIL ANALISIS DATA PERCEPATAN GRAVITASI
            </span>
            <div className="space-y-1.5">
              {/* Gravity Section */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-medium block">Rerata Gravitasi (ḡ):</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-mono font-extrabold text-slate-800">
                    {gBar > 0 ? gBar.toFixed(5) : '-'}
                  </span>
                  <span className="text-xs text-slate-500 italic">m/s²</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-none">Ralat Diferensial (Δg):</div>
                <span className="font-mono font-semibold text-slate-700 text-xs block">
                  {gBar > 0 ? `± ${deltaG.toFixed(5)}` : '-'} m/s²
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3.5 flex flex-wrap gap-2 text-xs">
            {/* Kesalahan Literatur Card */}
            <div className="flex-1 min-w-[140px] flex items-center justify-between bg-rose-50/70 border border-rose-100 px-3 py-2 rounded-lg text-rose-900">
              <div className="flex flex-col">
                <span className="font-black text-[9px] uppercase tracking-wide text-rose-600">Ralat Lit. (9.8 m/s²):</span>
                <span className="text-[9px] text-rose-500 font-sans">Kesalahan Literatur</span>
              </div>
              <span className="font-mono font-black text-sm">
                {gBar > 0 ? `${gLitError.toFixed(3)}%` : '-'}
              </span>
            </div>

            {/* Ralat Relatif Card */}
            <div className="flex-1 min-w-[140px] flex items-center justify-between bg-teal-50/70 border border-teal-100 px-3 py-2 rounded-lg text-teal-900">
              <div className="flex flex-col">
                <span className="font-black text-[9px] uppercase tracking-wide text-teal-650">Ralat Rel. (δg):</span>
                <span className="text-[9px] text-teal-500 font-sans">Presisi Pengukuran</span>
              </div>
              <span className="font-mono font-black text-sm">
                {gBar > 0 && deltaG > 0 ? `${((deltaG / gBar) * 100).toFixed(3)}%` : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Analytical Grids */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-sans mb-1">Rerata Periode (T̄ & ΔT)</div>
            <div className="text-[13px] font-bold text-slate-800">
              T̄: {avgT > 0 ? `${avgT.toFixed(5)} s` : '-'}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              ΔT: {avgT > 0 ? `± ${deltaPeriod.toFixed(5)} s` : '-'}
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-sans mb-1">Penulisan Ralat T</div>
            <div className="text-[11px] font-bold text-slate-700 leading-tight">
              {avgT > 0 ? `(${avgT.toFixed(5)} ± ${deltaPeriod.toFixed(5)}) s` : '-'}
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-lg">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-sans mb-1">g (dari Regresi Linier)</div>
            <div className="text-base font-bold text-amber-600">
              {regression.gFromSlope > 0 ? `${regression.gFromSlope.toFixed(4)}` : '-'}
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col justify-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase font-sans mb-1">Penulisan Ralat g</div>
            <div className="text-[11px] font-bold text-slate-705 leading-tight">
              {gBar > 0 ? `(${gBar.toFixed(3)} ± ${deltaG.toFixed(3)}) m/s²` : '-'}
            </div>
          </div>
        </div>

        {/* Regression Parameters block for GHS */}
        {regression.slope > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-sans">
              Parameter Ralat Regresi Fitting Kurva (t = T·N + t₀)
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[11px] text-slate-650 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">m (Slope):</span>
                <span className="font-bold text-slate-800">{regression.slope.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">sm:</span>
                <span className="font-bold text-indigo-600">{regression.slopeError.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">n (Intercept):</span>
                <span className="font-bold text-slate-800">{regression.intercept.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">sn:</span>
                <span className="font-bold text-indigo-500">{regression.interceptError.toFixed(5)}</span>
              </div>
              <div className="col-span-2 flex justify-between border-t border-slate-150 pt-1 mt-1">
                <span className="text-slate-400 font-sans w-full">sy (Ralat s_y):</span>
                <span className="font-bold text-emerald-600">{regression.sy.toFixed(5)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switcher for Charts */}
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-xs border border-slate-200">
          <button
            onClick={() => setChartTab('regression')}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              chartTab === 'regression'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Kurva Fitting No. Periode vs t
          </button>
          <button
            onClick={() => setChartTab('oscillation')}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
              chartTab === 'oscillation'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Simulasi Osilasi Pendulum
          </button>
        </div>

        {chartTab === 'regression' ? (
          <InteractivePhysicsChart
            points={points}
            curve={{
              type: 'linear',
              slope: regression.slope,
              intercept: regression.intercept,
            }}
            xLabel="No. Periode Osc"
            yLabel="Waktu Elapsed t"
            xUnit=""
            yUnit="s"
            title="Sumbu Koordinat No. Periode vs Waktu"
            subtitle="Garis kecocokan linear t terhadap jumlah putaran getaran N."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Simulation Parameter Controls */}
            {(() => {
              const gravityVal = stats.mean > 0 ? stats.mean : (regression.gFromSlope > 0 ? regression.gFromSlope : 9.80665);
              const omegaValue = Math.sqrt(gravityVal / (Leff || 0.3));
              const periodValue = 2 * Math.PI / omegaValue;

              return (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <span className="font-bold text-slate-800">Panjang Pendulum GHS (L):</span>
                      <span className="font-mono font-bold text-blue-700 text-sm">{Leff.toFixed(4)} meter</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-b border-slate-100 py-2.5">
                      <div>
                        <span className="text-slate-400 block font-sans">Frekuensi Sudut (ω):</span>
                        <span className="font-bold text-slate-800">{omegaValue.toFixed(4)} rad/s</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans">Periode Osilasi (T):</span>
                        <span className="font-bold text-slate-800">{periodValue.toFixed(4)} s</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                      Kurva biru utuh melambangkan <span className="font-extrabold text-blue-600">Simpangan Posisi x(t)</span> (A = 10 cm), sedangkan kurva merah putus-putus menunjukkan koordinat kecepatan laju <span className="font-extrabold text-red-500">v(t)</span> (v_max = { (10 * omegaValue).toFixed(1) } cm/s).
                    </p>
                  </div>

                  <InteractivePhysicsChart
                    points={[]}
                    curve={{
                      type: 'sinusoidal',
                      amplitude: 10, // 10 cm amplitude
                      omega: omegaValue,
                    }}
                    xLabel="Waktu t"
                    yLabel="Simpangan/Laju"
                    xUnit="s"
                    yUnit="unit"
                    title="Grafik Fungsi Waktu Gerak Harmonik Sederhana"
                    subtitle={`Simulasi ayunan tali l_efektif = ${Leff.toFixed(4)} m, g = ${gravityVal.toFixed(4)} m/s²`}
                  />
                </>
              );
            })()}
          </div>
        )}


      </div>
    </div>
  );
}
