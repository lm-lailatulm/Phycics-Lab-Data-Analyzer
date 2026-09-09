import React, { useState, useEffect } from 'react';
import {
  ActiveExperiment,
  TrialRowGravitasi,
  TrialRowPegasUnified,
  TrialRowBunyi,
  TrialRowTegangan,
  TeganganGlobalParams,
} from './types';
import { SAMPLE_DATA, EMPTY_DATA, calculateStats, calculateLinearRegression, calculateTeganganMediumStats } from './utils';
import GravitasiExperiment from './components/GravitasiExperiment';
import PegasExperiment from './components/PegasExperiment';
import GelombangBunyiExperiment from './components/GelombangBunyiExperiment';
import TeganganPermukaanExperiment from './components/TeganganPermukaanExperiment';
import WelcomePortal from './components/WelcomePortal';
import {
  Atom,
  Layers,
  Music,
  Droplet,
  FileText,
  Clipboard,
  Check,
  RotateCcw,
  Info,
  ChevronRight,
  BookOpen,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';

export default function App() {
  // Global keyboard navigation listener to move cell focus downwards on Enter/PageDown/ArrowDown and upwards on PageUp/ArrowUp
  useEffect(() => {
    const handleCellNavigation = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active.tagName !== 'INPUT') {
        return;
      }

      const isEnter = e.key === 'Enter';
      const isPageDown = e.key === 'PageDown' || e.key === 'ArrowDown';
      const isPageUp = e.key === 'PageUp' || e.key === 'ArrowUp';

      if (!isEnter && !isPageDown && !isPageUp) {
        return;
      }

      // Find enclosing td and tr
      const td = active.closest('td');
      const tr = active.closest('tr');
      if (!td || !tr) {
        return;
      }

      // We should prevent default behavior (like form submission on enter or page scrolling)
      e.preventDefault();

      // Find the index of the td within the tr
      const siblingTds = Array.from(tr.children);
      const colIndex = siblingTds.indexOf(td);

      let targetTr: HTMLElement | null = null;
      if (isEnter || isPageDown) {
        targetTr = tr.nextElementSibling as HTMLElement | null;
      } else if (isPageUp) {
        targetTr = tr.previousElementSibling as HTMLElement | null;
      }

      // If we crossed headers or hit anything that is not a standard data row,
      // skip it until we find a row containing an input at that same index if possible.
      // E.g., skip header or summary borders if any.
      while (targetTr && !targetTr.children[colIndex]?.querySelector('input')) {
        if (isEnter || isPageDown) {
          targetTr = targetTr.nextElementSibling as HTMLElement | null;
        } else {
          targetTr = targetTr.previousElementSibling as HTMLElement | null;
        }
      }

      if (targetTr) {
        // Find cell at same colIndex
        const targetTd = targetTr.children[colIndex] as HTMLElement | null;
        if (targetTd) {
          const targetInput = targetTd.querySelector('input') as HTMLInputElement | null;
          if (targetInput && !targetInput.disabled) {
            targetInput.focus();
            // Automatically select text inside for seamless typing
            setTimeout(() => {
              targetInput.select();
            }, 10);
          }
        }
      }
    };

    window.addEventListener('keydown', handleCellNavigation);
    return () => {
      window.removeEventListener('keydown', handleCellNavigation);
    };
  }, []);

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<ActiveExperiment | 'welcome'>('welcome');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synchronise URL hash with activeTab to support native browser/device Back button navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'welcome';
      if (['welcome', 'gravitasi', 'pegas', 'bunyi', 'tegangan'].includes(hash)) {
        setActiveTab(hash as any);
      }
    };

    // Synchronise hash on initial mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update hash when activeTab changes
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (activeTab !== currentHash) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  // Spreadsheet state storage for each experiment - initially empty
  const [gravitasiRows, setGravitasiRows] = useState<TrialRowGravitasi[]>(EMPTY_DATA.gravitasi);
  const [gravitasiL, setGravitasiL] = useState<number>(0); // cm
  const [gravitasiR, setGravitasiR] = useState<number>(0);  // mm
  const [pegasUnifiedRows, setPegasUnifiedRows] = useState<TrialRowPegasUnified[]>(EMPTY_DATA.pegasUnified);
  const [pegasMp, setPegasMp] = useState<number>(0); // g
  const [pegasMt, setPegasMt] = useState<number>(0); // g
  const [pegasPosisi1, setPegasPosisi1] = useState<number>(0); // mm
  const [pegasG, setPegasG] = useState<number>(9.8); // m/s2
  const [bunyiRows, setBunyiRows] = useState<TrialRowBunyi[]>(EMPTY_DATA.bunyi);
  const [bunyiF1, setBunyiF1] = useState<number>(0);
  const [bunyiF2, setBunyiF2] = useState<number>(0);
  const [bunyiTemp, setBunyiTemp] = useState<number>(0);
  const [bunyiVRef, setBunyiVRef] = useState<number>(0);
  const [teganganRows, setTeganganRows] = useState<TrialRowTegangan[]>(EMPTY_DATA.tegangan);
  const [teganganParams, setTeganganParams] = useState<TeganganGlobalParams>({
    x0: 0,
    delta_x0: 0.05,
    x1: 0,
    delta_x1: 0.05,
    p: 0,
    delta_p: 0.05,
    t: 0,
    delta_t: 0.05,
    mBeban: 0,
    delta_mBeban: 0.05,
    g: 9.8,
    delta_g: 0.05,
  });

  // Copy report state indicator
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Reset current experiment data to default realistic physics values
  const handleResetCurrent = () => {
    if (window.confirm('Apakah Anda yakin ingin mengisi tabel saat ini dengan contoh data sampel praktikum nyata?')) {
      if (activeTab === 'gravitasi') {
        setGravitasiRows(SAMPLE_DATA.gravitasi);
        setGravitasiL(31.2); // cm
        setGravitasiR(10.0);
      }
      if (activeTab === 'pegas') {
        setPegasUnifiedRows(SAMPLE_DATA.pegasUnified);
        setPegasMp(15.0);
        setPegasMt(50.0);
        setPegasPosisi1(120.0);
        setPegasG(10.0);
      }
      if (activeTab === 'bunyi') {
        setBunyiRows(SAMPLE_DATA.bunyi);
        setBunyiF1(4000);
        setBunyiF2(5000);
        setBunyiTemp(27);
        setBunyiVRef(346.98);
      }
      if (activeTab === 'tegangan') {
        setTeganganRows(SAMPLE_DATA.tegangan);
        setTeganganParams({
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
      }
    }
  };

  // Clear current data for zero-start manual inputs (revert to clean empty templates)
  const handleClearCurrent = () => {
    if (window.confirm('Kosongkan semua baris data di tabel ini untuk pengisian manual dari awal?')) {
      if (activeTab === 'gravitasi') {
        setGravitasiRows(EMPTY_DATA.gravitasi);
        setGravitasiL(0);
        setGravitasiR(0);
      }
      if (activeTab === 'pegas') {
        setPegasUnifiedRows(EMPTY_DATA.pegasUnified);
        setPegasMp(0);
        setPegasMt(0);
        setPegasPosisi1(0);
        setPegasG(10.0);
      }
      if (activeTab === 'bunyi') {
        setBunyiRows(EMPTY_DATA.bunyi);
        setBunyiF1(0);
        setBunyiF2(0);
        setBunyiTemp(0);
        setBunyiVRef(0);
      }
      if (activeTab === 'tegangan') {
        setTeganganRows(EMPTY_DATA.tegangan);
         setTeganganParams({
           x0: 0,
           delta_x0: 0.05,
           x1: 0,
           delta_x1: 0.05,
           p: 0,
           delta_p: 0.05,
           t: 0,
           delta_t: 0.05,
           mBeban: 0,
           delta_mBeban: 0.05,
           g: 9.8,
           delta_g: 0.05,
         });
       }
    }
  };

  // Formatted Experiment Name
  const getExperimentTitle = () => {
    switch (activeTab) {
      case 'gravitasi':
        return 'Analisis Percepatan Gravitasi (Ayunan Matematis)';
      case 'pegas':
        return 'Analisis Tetapan Pegas (Hukum Hooke & Osilasi)';
      case 'bunyi':
        return 'Analisis Cepat Rambat (Resonansi Bunyi)';
      case 'tegangan':
        return 'Analisis Tegangan Permukaan (Pipa Kapiler)';
    }
  };

  // Build LIVE text report formatting for university practical report inclusion
  const liveReportText = React.useMemo(() => {
    const divider = '===========================================\n';
    let text = `LAPORAN HASIL ANALISIS DATA PRAKTIKUM FISIKA\n`;
    text += `Aplikasi Otomatisasi Terverifikasi - Physics Lab (Analisis Data PFD Ruang A)\n`;
    text += `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID')}\n`;
    text += divider;

    if (activeTab === 'gravitasi') {
      text += `PERCOBAAN: PERCEPATAN GRAVITASI (BANDUL GHS)\n\n`;
      text += `I. KONFIGURASI PENDULUM & TEORI SFERIS:\n`;
      text += `   - Panjang Kawat/Tali l   : ${gravitasiL.toFixed(2)} cm (${(gravitasiL / 100).toFixed(4)} m)\n`;
      text += `   - Jejari Bola Bandul r   : ${gravitasiR.toFixed(1)} mm (${(gravitasiR / 1000).toFixed(4)} m)\n`;
      
      const lMeter = gravitasiL / 100;
      const gammaVal = gravitasiR / 1000;
      const sumLGP = lMeter + gammaVal;
      const K_correction = sumLGP + (2 * gammaVal * gammaVal) / (5 * sumLGP);
      text += `   - Panjang Efektif L      : ${sumLGP.toFixed(4)} m\n`;
      text += `   - Faktor Koreksi Sferis K: ${K_correction.toFixed(6)} m\n\n`;

      text += `II. DATA OBSERVASI GHS:\n`;
      const validRows = gravitasiRows.filter(r => (r.noPeriode1 === 0 ? r.t1 >= 0 : r.t1 > 0) && r.t2 > r.t1);
      gravitasiRows.forEach((r, idx) => {
        const hasT1 = r.noPeriode1 === 0 ? r.t1 >= 0 : r.t1 > 0;
        const deltaT = hasT1 && r.t2 > r.t1 ? r.t2 - r.t1 : 0;
        const T = deltaT / 100;
        const gIndiv = T > 0 ? (4 * Math.PI * Math.PI * K_correction) / (T * T) : 0;
        text += `   - Row ${idx+1}: Periode ${r.noPeriode1} to ${r.noPeriode2} | t1 = ${hasT1 ? r.t1 : '-'} s, t2 = ${r.t2 ? r.t2 : '-'} s -> 100T = ${deltaT ? deltaT.toFixed(2) : '-'} s -> T = ${T > 0 ? T.toFixed(4) : '-'} s -> g = ${gIndiv ? gIndiv.toFixed(4) : '-'} m/s²\n`;
      });

      const deltaTVals = validRows.map(r => r.t2 - r.t1);
      const avg100T = deltaTVals.length > 0 ? deltaTVals.reduce((a, b) => a + b, 0) / deltaTVals.length : 0;
      text += `\n   - (100T) rerata          : ${avg100T > 0 ? avg100T.toFixed(2) : '-'} s\n`;

      // Mean T & Delta T Calculations
      const validPeriods = validRows.map(r => (r.t2 - r.t1) / 100);
      const n = validPeriods.length;
      let avgT = 0;
      let deltaPeriod = 0;
      if (n > 0) {
        avgT = validPeriods.reduce((sum, t) => sum + t, 0) / n;
        if (n > 1) {
          const sumTSq = validPeriods.reduce((sum, t) => sum + t * t, 0);
          const valInside = (sumTSq - n * avgT * avgT) / (n * (n - 1));
          deltaPeriod = valInside > 0 ? Math.sqrt(valInside) : 0;
        }
      }

      // gBar and Delta g Calculations
      let gBar = 0;
      let deltaG = 0;
      const deltaLConst = 0.0005; // 0.05 cm
      const deltaGammaConst = 0.00005; // 0.05 mm

      if (avgT > 0) {
        gBar = (4 * Math.PI * Math.PI / (avgT * avgT)) * K_correction;
        const dG_dT = -2 * gBar / avgT;
        const dG_dl = (4 * Math.PI * Math.PI / (avgT * avgT)) * (1 - (2 * gammaVal * gammaVal) / (5 * sumLGP * sumLGP));
        const dG_dgamma = (4 * Math.PI * Math.PI / (avgT * avgT)) * (1 + (4 * lMeter * gammaVal + 2 * gammaVal * gammaVal) / (5 * sumLGP * sumLGP));
        deltaG = Math.abs(dG_dT) * deltaPeriod + Math.abs(dG_dl) * deltaLConst + Math.abs(dG_dgamma) * deltaGammaConst;
      }

      // Literature error relative to 9.8 m/s^2
      const gLitError = gBar > 0 ? (Math.abs(gBar - 9.8) / 9.8) * 100 : 0;

      // Stats
      const validGVec = validRows.map(r => {
        const T = (r.t2 - r.t1) / 100;
        return (4 * Math.PI * Math.PI * K_correction) / (T * T);
      });
      const stats = calculateStats(validGVec);

      // Regression of t vs N
      const regPoints: { x: number; y: number }[] = [];
      gravitasiRows.forEach(r => {
        const isValid = (r.noPeriode1 === 0 ? r.t1 >= 0 : r.t1 > 0) && r.t2 > r.t1;
        if (isValid) {
          regPoints.push({ x: r.noPeriode1, y: r.t1 });
          regPoints.push({ x: r.noPeriode2, y: r.t2 });
        }
      });
      const regX = regPoints.map(p => p.x);
      const regY = regPoints.map(p => p.y);
      const reg = calculateLinearRegression(regX, regY);
      const T_reg = reg.slope;
      const gReg = T_reg > 0 ? (4 * Math.PI * Math.PI * K_correction) / (T_reg * T_reg) : 0;

      text += `\nIII. HASIL ANALISIS REGRESI LINIER (No. Periode [N] vs Waktu [t]):\n`;
      text += `   - Persamaan Garis Linier : t = T * N + t0\n`;
      text += `   - Periode Regresi (T)    : ${T_reg.toFixed(5)} sekon\n`;
      text += `   - Intersep Sumbu Y (t0)  : ${reg.intercept.toFixed(5)} sekon\n`;
      text += `   - Koefisien Korelasi (R²): ${reg.rSquared.toFixed(6)}\n`;
      text += `   - Gravitasi Regresi (g)  : ${gReg > 0 ? gReg.toFixed(4) : '-'} m/s²\n`;

      text += `\nIV. HASIL ANALISIS STATISTIK & RALAT DIFERENSIAL SFERIS:\n`;
      text += `   - Rerata Periode (T̄)     : ${avgT > 0 ? avgT.toFixed(5) : '-'} sekon\n`;
      text += `   - Ralat Mutlak Periode (ΔT): ${avgT > 0 ? `± ${deltaPeriod.toFixed(5)}` : '-'} sekon\n`;
      text += `   - Rerata Gravitasi (ḡ)   : ${gBar > 0 ? gBar.toFixed(5) : '-'} m/s²\n`;
      text += `   - Ralat Diferensial (Δg) : ${gBar > 0 ? `± ${deltaG.toFixed(5)}` : '-'} m/s²\n`;
      text += `   - Ralat Relatif (δg)     : ${gBar > 0 && deltaG > 0 ? `${((deltaG / gBar) * 100).toFixed(3)}` : '-'}%\n`;
      text += `   - Kesalahan Lit. (vs 9.8): ${gBar > 0 ? `${gLitError.toFixed(3)}` : '-'}%\n`;
      text += `   - Penulisan Ralat        : g = (${gBar > 0 ? gBar.toFixed(3) : '-'} ± ${gBar > 0 ? deltaG.toFixed(3) : '-'}) m/s²\n`;

      text += `\nV. KESIMPULAN INTEGRAL:\n`;
      text += `   Berdasarkan pengujian metode selisih waktu 100 getaran dengan L_efektif = ${sumLGP.toFixed(4)} m,\n`;
      text += `   diperoleh percepatan gravitasi fisis-sferis g = ${gBar > 0 ? gBar.toFixed(5) : '-'} m/s² dengan ralat ± ${gBar > 0 ? deltaG.toFixed(5) : '-'} m/s².\n`;
      text += `   Persentase ralat relatif presisi sebesar ${gBar > 0 && deltaG > 0 ? ((deltaG / gBar) * 100).toFixed(3) : '-'}% dan kesalahan literatur terhadap 9.8 m/s² sebesar ${gBar > 0 ? gLitError.toFixed(3) : '-'}%.\n`;
    }

    else if (activeTab === 'pegas') {
      text += `PERCOBAAN: TETAPAN PEGAS (KONSTANTA PEGAS K)\n\n`;
      text += `I. KONFIGURASI DAN PARAMETER KONSTAND:\n`;
      text += `   - Massa Pegas (m_p)         : ${pegasMp} g\n`;
      text += `   - Massa Hanger/Wadah (m_t)  : ${pegasMt} g\n`;
      text += `   - Posisi Awal (Posisi-1)    : ${pegasPosisi1} mm\n`;
      text += `   - Gravitasi (g)             : ${pegasG} m/s²\n\n`;

      text += `[A] METODE STATIS (HUKUM HOOKE):\n`;
      const validStatisRows = pegasUnifiedRows.filter(r => r.massaBeban > 0 && r.posisi2 > pegasPosisi1);
      validStatisRows.forEach((r, idx) => {
        const mKg = r.massaBeban / 1000;
        const F = mKg * pegasG;
        const dx = (r.posisi2 - pegasPosisi1) / 1000;
        const k = dx > 0 ? F / dx : 0;
        text += `   - Trial ${idx+1}: m_b = ${r.massaBeban} g, Posisi-2 = ${r.posisi2} mm -> Δx = ${(r.posisi2 - pegasPosisi1).toFixed(1)} mm (${dx.toFixed(4)} m), F = ${F.toFixed(3)} N -> k = ${k.toFixed(3)} N/m\n`;
      });
      const staticK = validStatisRows.map(r => {
        const dx = (r.posisi2 - pegasPosisi1) / 1000;
        return dx > 0 ? ((r.massaBeban / 1000) * pegasG) / dx : 0;
      }).filter(k => k > 0 && isFinite(k));
      const sStats = calculateStats(staticK);
      const stsPtsX = validStatisRows.map(r => (r.posisi2 - pegasPosisi1) / 1000);
      const stsPtsY = validStatisRows.map(r => (r.massaBeban / 1000) * pegasG);
      const sReg = calculateLinearRegression(stsPtsX, stsPtsY);

      text += `   - Konstanta Pegas Slope (k) : ${sReg.slope > 0 ? sReg.slope.toFixed(3) : '-'} N/m\n`;
      text += `   - Rerata Statistik (k̄)      : ${sStats.mean > 0 ? sStats.mean.toFixed(3) : '-'} N/m\n`;
      text += `   - Ketelitian Metode Statis  : ${sStats.mean > 0 ? sStats.precision.toFixed(2) : '-'}%\n`;

      text += `\n[B] METODE DINAMIS (GETARAN HARMONIK):\n`;
      const validDinamisRows = pegasUnifiedRows.filter(r => r.massaBeban > 0 && r.waktu10T > 0);
      validDinamisRows.forEach((r, idx) => {
        const T = r.waktu10T / 10;
        const mTotKg = (r.massaBeban + pegasMt + pegasMp/3) / 1000;
        const kInd = T > 0 ? (4 * Math.PI * Math.PI * mTotKg) / (T * T) : 0;
        text += `   - Trial ${idx+1}: m_b = ${r.massaBeban} g, 10T = ${r.waktu10T} s -> T = ${T.toFixed(3)} s (T² = ${(T*T).toFixed(4)} s²) -> k = ${kInd.toFixed(2)} N/m\n`;
      });
      const dynK = validDinamisRows.map(r => {
        const T = r.waktu10T / 10;
        const mTotKg = (r.massaBeban + pegasMt + pegasMp/3) / 1000;
        return T > 0 ? (4 * Math.PI * Math.PI * mTotKg) / (T*T) : 0;
      }).filter(k => k > 0 && isFinite(k));
      const dStats = calculateStats(dynK);
      const dynPtsX = validDinamisRows.map(r => (r.massaBeban + pegasMt) / 1000);
      const dynPtsY = validDinamisRows.map(r => {
        const T = r.waktu10T / 10;
        return T * T;
      });
      const dReg = calculateLinearRegression(dynPtsX, dynPtsY);
      const kDyn = dReg.slope > 0 ? (4 * Math.PI * Math.PI) / dReg.slope : 0;

      text += `   - Konstanta Pegas Slope (k) : ${kDyn > 0 ? kDyn.toFixed(3) : '-'} N/m\n`;
      text += `   - Rerata Statistik (k̄)      : ${dStats.mean > 0 ? dStats.mean.toFixed(3) : '-'} N/m\n`;
      text += `   - Ketelitian Metode Dinamis : ${dStats.mean > 0 ? dStats.precision.toFixed(2) : '-'}%\n`;

      text += `\nIII. ANALISIS PERBANDINGAN:\n`;
      text += `   Konstanta mekanis pegas terbukti konsisten di antara kedua metode:\n`;
      text += `   Statis = ${sReg.slope > 0 ? sReg.slope.toFixed(3) : '-'} N/m vs Dinamis = ${kDyn > 0 ? kDyn.toFixed(3) : '-'} N/m.\n`;
    }

    else if (activeTab === 'bunyi') {
      text += `PERCOBAAN: GELOMBANG BUNYI (RESONANSI TABUNG KOLOM UDARA)\n\n`;
      text += `I. KONFIGURASI DAN PARAMETER RELEVAN:\n`;
      text += `   - Frekuensi 1 (f1)            : ${bunyiF1} Hz\n`;
      text += `   - Frekuensi 2 (f2)            : ${bunyiF2} Hz\n`;
      text += `   - Suhu Ruangan (T)            : ${bunyiTemp} °C\n`;
      text += `   - Laju Bunyi Literatur (v_ref): ${bunyiVRef} m/s\n\n`;
      text += `   Tabel Data Resonansi Kolom Udara:\n`;

      const getAvg = (vals: number[]) => {
        const acts = vals.filter(v => v > 0);
        return acts.length > 0 ? acts.reduce((a, b) => a + b, 0) / acts.length : 0;
      };

      bunyiRows.forEach((r) => {
        const avg1 = getAvg([r.f1_t1, r.f1_t2, r.f1_t3]);
        const avg2 = getAvg([r.f2_t1, r.f2_t2, r.f2_t3]);
        text += `   - Resonansi ke-${r.resonansiKe} (orde m = ${r.m}):\n`;
        text += `     * Pada f = ${bunyiF1} Hz : [${r.f1_t1 || '-'}, ${r.f1_t2 || '-'}, ${r.f1_t3 || '-'}] cm | Rerata = ${avg1 > 0 ? avg1.toFixed(2) + ' cm' : '-'}\n`;
        text += `     * Pada f = ${bunyiF2} Hz : [${r.f2_t1 || '-'}, ${r.f2_t2 || '-'}, ${r.f2_t3 || '-'}] cm | Rerata = ${avg2 > 0 ? avg2.toFixed(2) + ' cm' : '-'}\n`;
      });

      // Regression coordinates
      const f1_ptsX: number[] = [];
      const f1_ptsY: number[] = [];
      const f2_ptsX: number[] = [];
      const f2_ptsY: number[] = [];

      bunyiRows.forEach(r => {
        const avg1 = getAvg([r.f1_t1, r.f1_t2, r.f1_t3]);
        if (avg1 > 0) {
          f1_ptsX.push(r.m);
          f1_ptsY.push(avg1 / 100);
        }
        const avg2 = getAvg([r.f2_t1, r.f2_t2, r.f2_t3]);
        if (avg2 > 0) {
          f2_ptsX.push(r.m);
          f2_ptsY.push(avg2 / 100);
        }
      });

      const f1Reg = calculateLinearRegression(f1_ptsX, f1_ptsY);
      const f2Reg = calculateLinearRegression(f2_ptsX, f2_ptsY);

      // L = (v / 2f) * m + (v / 4f) + e => slope = v / 2f => v = 2f * slope
      // intercept = v / 4f + e => e = intercept - v / 4f = intercept - slope / 2
      const e1Slope = f1Reg.slope > 0 ? f1Reg.intercept - (f1Reg.slope / 2) : 0;
      const e2Slope = f2Reg.slope > 0 ? f2Reg.intercept - (f2Reg.slope / 2) : 0;

      // e_lit (Sesuai rumus foto: e = intercept - vRef/(4f))
      const e1Lit = (f1Reg.slope > 0 && bunyiF1 > 0) ? (f1Reg.intercept - (bunyiVRef / (4 * bunyiF1))) : 0;
      const e2Lit = (f2Reg.slope > 0 && bunyiF2 > 0) ? (f2Reg.intercept - (bunyiVRef / (4 * bunyiF2))) : 0;

      // Uncertanties delta v = 2 * f * slopeError
      const errDeltaV1 = 2 * bunyiF1 * f1Reg.slopeError;
      const errDeltaV2 = 2 * bunyiF2 * f2Reg.slopeError;

      const v1FromSlope = 2 * bunyiF1 * f1Reg.slope;
      const v2FromSlope = 2 * bunyiF2 * f2Reg.slope;

      // Percentage errors relative to literature speed of sound (v_ref)
      const errPercSlope1 = v1FromSlope > 0 && bunyiVRef > 0 ? (Math.abs(v1FromSlope - bunyiVRef) / bunyiVRef) * 100 : 0;
      const errPercSlope2 = v2FromSlope > 0 && bunyiVRef > 0 ? (Math.abs(v2FromSlope - bunyiVRef) / bunyiVRef) * 100 : 0;

      // Precisions
      const v1SlopePrec = v1FromSlope > 0 && errDeltaV1 > 0 ? Math.max(0, 100 - (errDeltaV1 / v1FromSlope) * 100) : 100;
      const v2SlopePrec = v2FromSlope > 0 && errDeltaV2 > 0 ? Math.max(0, 100 - (errDeltaV2 / v2FromSlope) * 100) : 100;

      // Individual corrected speed values using their OWN individual correction factor (e1Slope / e2Slope)
      const v1_vals: number[] = [];
      const v2_vals: number[] = [];

      bunyiRows.forEach(r => {
        const avg1 = getAvg([r.f1_t1, r.f1_t2, r.f1_t3]);
        if (avg1 > 0 && bunyiF1 > 0) {
          const L_eff_m = (avg1 / 100) - e1Slope;
          const lambda = (4 * L_eff_m) / (2 * r.m + 1);
          v1_vals.push(bunyiF1 * lambda);
        }
        const avg2 = getAvg([r.f2_t1, r.f2_t2, r.f2_t3]);
        if (avg2 > 0 && bunyiF2 > 0) {
          const L_eff_m = (avg2 / 100) - e2Slope;
          const lambda = (4 * L_eff_m) / (2 * r.m + 1);
          v2_vals.push(bunyiF2 * lambda);
        }
      });

      const stats1 = calculateStats(v1_vals);
      const stats2 = calculateStats(v2_vals);

      text += `\nII. ANALISIS REGRESI LINIER & FAKTOR KOREKSI MANDIRI:\n`;
      text += `   Rumus Resonansi Udara : L' = (v / 2f) · m + v / 4f + e\n`;
      text += `   * Pada Frekuensi f1 = ${bunyiF1} Hz:\n`;
      text += `     - Slope (v/2f)            : ${f1Reg.slope > 0 ? f1Reg.slope.toFixed(5) + ' m' : '-'}\n`;
      text += `     - Intercept (v/4f + e)    : ${f1Reg.slope > 0 ? f1Reg.intercept.toFixed(5) + ' m' : '-'}\n`;
      text += `     - Ralat Koreksi e1 (Slope): ${f1Reg.slope > 0 ? (e1Slope * 100).toFixed(2) + ' cm' : '-'}\n`;
      text += `     - Ralat Koreksi e1 (Foto) : ${f1Reg.slope > 0 ? (e1Lit * 100).toFixed(2) + ' cm' : '-'}\n`;
      text += `     - Cepat Rambat (slope v)  : ${v1FromSlope > 0 ? v1FromSlope.toFixed(2) + ' m/s' : '-'}\n`;
      text += `   * Pada Frekuensi f2 = ${bunyiF2} Hz:\n`;
      text += `     - Slope (v/2f)            : ${f2Reg.slope > 0 ? f2Reg.slope.toFixed(5) + ' m' : '-'}\n`;
      text += `     - Intercept (v/4f + e)    : ${f2Reg.slope > 0 ? f2Reg.intercept.toFixed(5) + ' m' : '-'}\n`;
      text += `     - Ralat Koreksi e2 (Slope): ${f2Reg.slope > 0 ? (e2Slope * 100).toFixed(2) + ' cm' : '-'}\n`;
      text += `     - Ralat Koreksi e2 (Foto) : ${f2Reg.slope > 0 ? (e2Lit * 100).toFixed(2) + ' cm' : '-'}\n`;
      text += `     - Cepat Rambat (slope v)  : ${v2FromSlope > 0 ? v2FromSlope.toFixed(2) + ' m/s' : '-'}\n`;

      text += `\nIII. HASIL ANALISIS KECEPATAN & PERSENTASE KESALAHAN LITERATUR:\n`;
      text += `   * Pada Frekuensi f1 = ${bunyiF1} Hz:\n`;
      text += `     - Cepat Rambat (v_slope)  : ${v1FromSlope > 0 ? v1FromSlope.toFixed(2) + ' m/s' : '-'}\n`;
      text += `     - Ralat Mutlak (Δv_slope) : ${v1FromSlope > 0 ? '± ' + errDeltaV1.toFixed(2) + ' m/s' : '-'}\n`;
      text += `     - Ketelitian Regresi      : ${v1FromSlope > 0 ? v1SlopePrec.toFixed(2) + '%' : '-'}\n`;
      text += `     - Persentase Kesalahan Lit: ${v1FromSlope > 0 && bunyiVRef > 0 ? errPercSlope1.toFixed(2) + '%' : '-'}\n`;
      text += `   * Pada Frekuensi f2 = ${bunyiF2} Hz:\n`;
      text += `     - Cepat Rambat (v_slope)  : ${v2FromSlope > 0 ? v2FromSlope.toFixed(2) + ' m/s' : '-'}\n`;
      text += `     - Ralat Mutlak (Δv_slope) : ${v2FromSlope > 0 ? '± ' + errDeltaV2.toFixed(2) + ' m/s' : '-'}\n`;
      text += `     - Ketelitian Regresi      : ${v2FromSlope > 0 ? v2SlopePrec.toFixed(2) + '%' : '-'}\n`;
      text += `     - Persentase Kesalahan Lit: ${v2FromSlope > 0 && bunyiVRef > 0 ? errPercSlope2.toFixed(2) + '%' : '-'}\n`;
    }

    else if (activeTab === 'tegangan') {
      const sampleStats = calculateTeganganMediumStats(teganganRows[0]?.trials || [], teganganParams);
      const calculatedK = sampleStats.kPegas;

      text += `PERCOBAAN: TEGANGAN PERMUKAAN (METODE PEGAS JOLLY)\n\n`;
      text += `I. PARAMETER GLOBAL ALAT & KALIBRASI:\n`;
      text += `   - Skala Awal Kosong (x0)       : ${teganganParams.x0.toFixed(2)} ± ${teganganParams.delta_x0.toFixed(2)} Skala\n`;
      text += `   - Skala Pelat Kering (x1)       : ${teganganParams.x1.toFixed(2)} ± ${teganganParams.delta_x1.toFixed(2)} Skala\n`;
      text += `   - Panjang Pelat (p)             : ${teganganParams.p.toFixed(2)} ± ${teganganParams.delta_p.toFixed(2)} mm\n`;
      text += `   - Tebal Pelat (t)               : ${teganganParams.t.toFixed(2)} ± ${teganganParams.delta_t.toFixed(2)} mm\n`;
      text += `   - Massa Beban (m)               : ${teganganParams.mBeban.toFixed(2)} ± ${teganganParams.delta_mBeban.toFixed(2)} g\n`;
      text += `   - Gravitasi (g)                 : ${teganganParams.g.toFixed(2)} ± ${teganganParams.delta_g.toFixed(2)} m/s²\n`;
      text += `   - Kesetaraan Skala (k)          : ${calculatedK.toFixed(8)} N/Skala\n\n`;

      text += `II. DATA PENGAMATAN & ANALISIS LEVEL MEDIUM:\n`;
      
      teganganRows.forEach((r) => {
        const stats = calculateTeganganMediumStats(r.trials, teganganParams);
        const trialsStr = r.trials.map(t => t.toFixed(2)).join(', ');
        
        text += `   * Medium: ${r.cairan} (Suhu: ${r.suhu}°C)\n`;
        text += `     - Data X2 (Skala)        : [${trialsStr}]\n`;
        text += `     - X2 Rerata              : ${stats.meanX2.toFixed(3)} Skala\n`;
        text += `     - Gaya Pemulih (F)       : ${stats.F.toFixed(6)} N (ΔF: ± ${stats.delta_F.toFixed(6)} N)\n`;
        const ralatRelatValue = stats.gamma > 0 ? (stats.delta_gamma / stats.gamma) * 100 : 0;
        const ralatLitNm = Math.abs(stats.gamma - r.literatureVal);
        text += `     - Tegangan Permukaan (γ) : ${stats.gamma.toFixed(6)} N/m (Δγ: ± ${stats.delta_gamma.toFixed(6)} N/m)\n`;
        text += `       * Ralat Relatif        : ${ralatRelatValue.toFixed(2)}%\n`;
        text += `     - Setara Satuan Lab      : ${(stats.gamma * 1000).toFixed(2)} dyne/cm (mN/m)\n`;
        text += `     - Nilai Literatur        : ${r.literatureVal.toFixed(4)} N/m\n`;
        
        const errorPct = r.literatureVal > 0 ? (Math.abs(stats.gamma - r.literatureVal) / r.literatureVal) * 100 : 0;
        text += `     - Persentase Kesalahan   : ${errorPct.toFixed(2)}%\n\n`;
      });
    }

    text += divider;
    text += `Laporan digenerate secara otomatis oleh Physics Lab.`;
    return text;
  }, [activeTab, gravitasiRows, pegasUnifiedRows, pegasMp, pegasMt, pegasPosisi1, pegasG, bunyiRows, teganganRows, teganganParams]);

  // Copy live report to clipboard
  const handleCopyReport = () => {
    navigator.clipboard.writeText(liveReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (activeTab === 'welcome') {
    return (
      <WelcomePortal
        onSelectExperiment={(experiment) => {
          setActiveTab(experiment);
          setShowReport(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 font-sans text-slate-800 md:h-screen md:overflow-hidden">
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 shadow-md flex items-center justify-between px-5 py-3 text-white">
        <div className="flex items-center gap-2.5">
          {activeTab !== 'welcome' && (
            <button
              onClick={() => {
                setActiveTab('welcome');
                setShowReport(false);
                setIsMobileMenuOpen(false);
              }}
              className="p-1 px-2 py-1 bg-white/15 hover:bg-white/25 active:scale-95 rounded-lg border border-white/10 transition-all flex items-center gap-1 mr-1 text-[11px] font-bold text-white"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          )}
          <div className="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center shadow-xs">
            <Atom className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider uppercase font-display text-white">
              Physics <span className="text-blue-100 font-semibold">Lab</span>
            </h1>
            <span className="text-[8px] text-indigo-100/90 uppercase tracking-widest font-bold -mt-0.5 block">by Lailatul M</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 bg-white text-blue-600 hover:bg-blue-50 active:scale-95 rounded-lg shadow-sm border border-blue-100/20 transition-all flex items-center justify-center"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-blue-750" /> : <Menu className="w-5 h-5 text-blue-750" />}
        </button>
      </div>

      {/* Backdrop for mobile drawer */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 md:hidden z-30 animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white flex flex-col border-r border-slate-200 flex-shrink-0 transition-transform duration-300 z-40
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0 h-full
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 bg-slate-50/20">
          <span className="text-[8.5px] font-black tracking-widest text-indigo-600 block mb-2">SMART LAB AUTOMATION SYSTEM</span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
              <Atom className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 tracking-widest leading-none uppercase font-display">
                Physics <span className="text-indigo-600 font-extrabold">Lab</span>
              </h1>
              <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Analisis Data PFD Ruang A</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-650 mt-2.5 italic font-bold">by Lailatul Mufidah</p>
        </div>

        {/* Navigation Selector */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto bg-slate-50/50">
          <button
            onClick={() => { setActiveTab('welcome'); setShowReport(false); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left border border-indigo-100 bg-indigo-50/45 text-indigo-700 hover:bg-indigo-100/50 hover:text-indigo-800 font-bold shadow-xs mb-4"
          >
            <div className="flex items-center gap-3">
              <Atom className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span className="text-xs">Beranda (Menu Utama)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2 font-display">
            MENU PERCOBAAN
          </div>
          
          <button
            onClick={() => { setActiveTab('gravitasi'); setShowReport(false); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left border ${
              activeTab === 'gravitasi'
                ? 'bg-blue-50/70 text-blue-700 border-blue-200/80 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="text-xs">Percepatan Gravitasi</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => { setActiveTab('pegas'); setShowReport(false); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left border ${
              activeTab === 'pegas'
                ? 'bg-blue-50/70 text-blue-700 border-blue-200/80 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="text-xs">Tetapan Pegas</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => { setActiveTab('bunyi'); setShowReport(false); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left border ${
              activeTab === 'bunyi'
                ? 'bg-blue-50/70 text-blue-700 border-blue-200/80 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Music className="w-4 h-4 text-blue-500" />
              <span className="text-xs">Gelombang Bunyi</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => { setActiveTab('tegangan'); setShowReport(false); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left border ${
              activeTab === 'tegangan'
                ? 'bg-blue-50/70 text-blue-700 border-blue-200/80 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className="text-xs">Tegangan Permukaan</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <div className="pt-4 border-t border-slate-250/50 mt-4 space-y-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 font-display">
              ALAT PENDUKUNG
            </div>
            <button
              onClick={() => { setShowReport(prev => !prev); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition border ${
                showReport 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-extrabold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-201/50 hover:text-slate-900 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Salin Lapor Praktikum</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer System status */}
        <div className="p-4 bg-slate-100/70 border-t border-slate-200 flex-shrink-0">
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-display">
              <span>SISTEM ANALISIS</span>
              <span className="text-emerald-600 font-extrabold animate-pulse">AKTIF</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
              <div className="w-full h-full bg-emerald-500 transition-all duration-500 animate-pulse"></div>
            </div>
            <span className="text-[9px] text-slate-400 font-mono block mt-2 text-right">Ralat Terhitung Instan</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
        
        {/* Top Header Navigation Bar */}
        <header className="min-h-16 py-3 px-4 sm:px-8 bg-white border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {activeTab !== 'welcome' && (
              <button
                onClick={() => {
                  setActiveTab('welcome');
                  setShowReport(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-all text-[11px] font-bold mr-2 cursor-pointer"
                title="Kembali ke Beranda"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            )}
            <span className="text-slate-400 font-bold uppercase tracking-wider font-display">Praktikum</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
            <span className="font-bold text-slate-700 tracking-tight">{getExperimentTitle()}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearCurrent}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 bg-red-50/50 rounded-lg hover:bg-red-50 transition shadow-sm"
              title="Kosongkan nilai data untuk penginputan manual beruntun"
            >
              Kosongkan Input
            </button>
            <button
              onClick={handleResetCurrent}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-semibold text-slate-650 border border-slate-300 rounded-lg hover:bg-slate-50 transition bg-white shadow-sm font-sans"
            >
              Uji Coba Data
            </button>
            <button
              onClick={() => setShowReport(prev => !prev)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-600/10 text-center"
              id="report-toggle-btn"
            >
              {showReport ? 'Tampilkan Pengolah' : 'Salin Draft Laporan'}
            </button>
          </div>
        </header>

        {/* Nested active module displays */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto min-h-0 relative">
          
          {/* Slider Report Panel Overlaid or Inline */}
          {showReport ? (
            <div className="absolute inset-0 bg-white p-4 sm:p-8 flex flex-col gap-5 z-20 overflow-y-auto animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Draft Lapor Praktikum Otomatis (Format Universitas)
                  </h3>
                  <p className="text-xs text-slate-550 mt-1">
                    Salin rancangan data di bawah sebagai bahan rujukan instan pada draf penulisan laporan praktikum fisika Anda.
                  </p>
                </div>
                <button
                  onClick={handleCopyReport}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-lg transition-all shadow-md ${
                    copied 
                      ? 'bg-emerald-600 shadow-emerald-600/10' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  }`}
                  id="copy-text-btn"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                  <span>{copied ? 'Teks Berhasil Disalin!' : 'Salin Isi Laporan'}</span>
                </button>
              </div>

              <div className="flex-1 bg-slate-900 text-slate-200 p-6 rounded-xl font-mono text-xs border border-slate-800 leading-relaxed overflow-auto shadow-inner select-all">
                <pre className="whitespace-pre-wrap font-sans">{liveReportText}</pre>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex gap-2.5">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="leading-relaxed">
                  <strong>Pemberitahuan Akademik:</strong> Gunakan draft data dan ralat hasil regresi ini secara bijak. Pastikan pembulatan ralat sesuai dengan rujukan instruktur laboratorium fisik Anda (biasanya 2 atau 3 angka desimal di belakang koma).
                </p>
              </div>
            </div>
          ) : null}

          {/* Module switches */}
          <div className={showReport ? 'hidden' : 'h-full'}>
            {activeTab === 'gravitasi' && (
              <GravitasiExperiment
                rows={gravitasiRows}
                setRows={setGravitasiRows}
                l={gravitasiL}
                setL={setGravitasiL}
                r={gravitasiR}
                setR={setGravitasiR}
                onReset={() => {
                  setGravitasiRows(SAMPLE_DATA.gravitasi);
                  setGravitasiL(31.2); // cm
                  setGravitasiR(10.0);
                }}
              />
            )}

            {activeTab === 'pegas' && (
              <PegasExperiment
                rows={pegasUnifiedRows}
                setRows={setPegasUnifiedRows}
                mp={pegasMp}
                setMp={setPegasMp}
                mt={pegasMt}
                setMt={setPegasMt}
                posisi1={pegasPosisi1}
                setPosisi1={setPegasPosisi1}
                g={pegasG}
                setG={setPegasG}
                onReset={() => {
                  setPegasUnifiedRows(SAMPLE_DATA.pegasUnified);
                  setPegasMp(15.0);
                  setPegasMt(50.0);
                  setPegasPosisi1(120.0);
                  setPegasG(10.0);
                }}
              />
            )}

            {activeTab === 'bunyi' && (
              <GelombangBunyiExperiment
                rows={bunyiRows}
                setRows={setBunyiRows}
                f1={bunyiF1}
                setF1={setBunyiF1}
                f2={bunyiF2}
                setF2={setBunyiF2}
                temp={bunyiTemp}
                setTemp={(val) => {
                  setBunyiTemp(val);
                  // Update vRef estimate from temperature using v = 331 * sqrt(1 + T/273)
                  setBunyiVRef(parseFloat((331 * Math.sqrt(1 + val / 273)).toFixed(2)));
                }}
                vRef={bunyiVRef}
                setVRef={setBunyiVRef}
                onReset={() => {
                  setBunyiRows(SAMPLE_DATA.bunyi);
                  setBunyiF1(4000);
                  setBunyiF2(5000);
                  setBunyiTemp(27);
                  setBunyiVRef(346.98);
                }}
              />
            )}

            {activeTab === 'tegangan' && (
              <TeganganPermukaanExperiment
                rows={teganganRows}
                setRows={setTeganganRows}
                params={teganganParams}
                setParams={setTeganganParams}
                onReset={() => {
                  setTeganganRows(SAMPLE_DATA.tegangan);
                  setTeganganParams({
                    x0: 1.2,
                    delta_x0: 0.5,
                    x1: 1.8,
                    delta_x1: 0.5,
                    p: 36.05,
                    delta_p: 0.05,
                    t: 1.2,
                    delta_t: 0.05,
                    kPegas: 0.00393,
                  });
                }}
              />
            )}
          </div>
        </div>

        {/* Outer subtle branding margin label */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-8 py-3 text-slate-400 text-[10px] flex flex-col sm:flex-row justify-between items-center gap-2 flex-shrink-0 text-center sm:text-left">
          <span>© 12902 Physics Lab Dev - Departemen Fisika Dasar</span>
          <span className="font-mono text-slate-350">RST-3000 Active Container Platform</span>
        </div>
      </main>
    </div>
  );
}
