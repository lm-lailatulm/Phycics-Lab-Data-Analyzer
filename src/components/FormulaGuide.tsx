import React from 'react';

interface FormulaGuideProps {
  type: 'gravitasi' | 'pegas' | 'bunyi' | 'tegangan';
}

export default function FormulaGuide({ type }: FormulaGuideProps) {
  if (type === 'gravitasi') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 shadow-sm">
        <h4 className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-2">
          TEORI & ANALISIS RALAT GHS (BANDUL)
        </h4>
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Periode ayunan matematis memenuhi persamaan: 
            <span className="inline-block bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-serif mx-1 font-bold">
              T = 2π √(L / g)
            </span>, atau jika dikuadratkan: 
            <span className="inline-block bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-serif mx-1 font-bold">
              g = 4π² L / T²
            </span>.
          </p>
          <p>
            Panjang efektif pendulum didefinisikan sebagai jumlah dari panjang kawat <span className="font-serif italic font-bold text-slate-800">l</span> (meter) dan jejari bola bandul <span className="font-serif italic font-bold text-slate-800">r</span> (meter):
            <span className="block text-center text-xs font-mono text-blue-700 bg-blue-50/50 border border-blue-100/60 rounded py-1.5 my-1.5 font-bold">
              L_eff = l + (r / 1000)
            </span>
          </p>
          <p>
            Dalam percobaan, periode ditentukan dengan metode selisih waktu 100 getaran:
            <span className="block text-center text-xs font-mono text-blue-700 bg-blue-50/50 border border-blue-100/60 rounded py-1.5 my-1.5 font-bold">
              100T = t2 - t1 =&gt; T = (t2 - t1) / 100
            </span>
          </p>
          <p className="border-t border-slate-200 pt-2.5 font-light">
            Selain ralat rerata statistik, kami juga merancang fitting regresi linear dari kurva hubungan <span className="font-bold text-slate-800">N</span> (Jumlah Getaran) vs <span className="font-bold text-slate-800">t</span> (Waktu):
            <span className="block text-center text-sm font-serif text-teal-800 bg-teal-50/60 border border-teal-100/80 rounded py-1.5 my-1.5 font-bold">
              t = T &middot; N + to
            </span>
            Kemiringan kurva (slope) menyatakan nilai Periode getaran <span className="font-semibold text-slate-800">T</span> terbaik. Selanjutnya, gravitasi regresi diturunkan melalui persamaan tersebut.
          </p>
        </div>
      </div>
    );
  }

  if (type === 'pegas') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 shadow-sm">
        <h4 className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-2">
          Teori & Regresi Kuadrat Terkecil (Tetapan Pegas)
        </h4>
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            <strong>Metode Statis (Hukum Hooke):</strong> 
            Menyatakan gaya pemulih pegas sebanding dengan pertambahan panjangnya: 
            <span className="inline-block bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-serif mx-1 font-bold">
              F = k · Δx
            </span>.
            Memenuhi persamaan linier <span className="font-serif italic text-slate-800">y = m · x</span> di mana 
            <span className="font-serif text-slate-800">y = F (Newton)</span>, <span className="font-serif text-slate-800">x = Δx (meter)</span>, dan slope adalah tetapan pegas 
            <span className="font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 border border-teal-200/60 rounded font-bold">k = m</span>.
          </p>
          <p>
            <strong>Metode Dinamis (Getaran Harmonik):</strong>
            Periode getaran pegas bermassa memenuhi: 
            <span className="inline-block bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-serif mx-1 font-bold">
              T = 2π √(m_beban / k)
            </span>, atau kuadratnya: 
            <span className="inline-block bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-serif mx-1 font-bold">
              T² = (4π² / k) · m
            </span>.
          </p>
          <p className="border-t border-slate-200 pt-2.5">
            Dengan merincikan <span className="font-serif text-slate-800">y = T²</span> dan <span className="font-serif text-slate-800">x = m</span>, kemiringan kurva adalah 
            <span className="font-serif text-slate-800">slope = 4π² / k</span>. Maka konstanta pegas pegas dinamis:
            <span className="block text-center text-sm font-serif text-blue-700 bg-blue-50/50 border border-blue-100/60 rounded py-1.5 my-1.5 font-bold">
              k = 4π² / slope
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (type === 'bunyi') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 shadow-sm">
        <h4 className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-2">
          Teori Resonansi & Faktor Koreksi (Gelombang Bunyi)
        </h4>
        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <p>
            Tinggi kolom udara resonansi ke-<span className="italic">N</span> (orde <span className="font-mono italic">m = N - 1</span>) dihitung dengan formula linier:
            <span className="block text-center text-sm font-serif text-amber-800 bg-amber-50/70 border border-amber-200/60 p-2 my-2 rounded font-bold">
              L' = (v / 2f) · m + v / 4f + e
            </span>
          </p>
          <p>
            Persamaan di atas dianalogikan sebagai bentuk persamaan garis:
            <span className="block text-center text-xs font-mono text-blue-700 bg-blue-50/50 border border-blue-100 rounded py-1.5 my-1.5 font-bold">
              y = m_slope · x + n_intercept
            </span>
            di mana <span className="font-mono text-slate-700">y = L'</span> adalah tinggi uji (meter), dan <span className="font-mono text-slate-700">x = m</span> adalah orde getaran (0, 1, 2, ...).
          </p>
          <div className="bg-white p-2.5 rounded text-blue-700 border border-slate-200 space-y-1 font-mono text-[11px] leading-relaxed shadow-xs">
            <div>• Slope (kemiringan) &rArr; <span className="text-teal-700 font-extrabold">m_slope = v / 2f</span></div>
            <div>• Intersept &rArr; <span className="text-teal-700 font-extrabold">n_intercept = v / 4f + e</span></div>
          </div>
          <p className="border-t border-slate-200 pt-2.5 font-light">
            Sehingga cepat rambat gelombang bunyi (<span className="italic font-serif">v̄</span>) dan tambahan ralat diferensialnya (<span className="font-serif text-slate-800">Δv</span>) diperoleh melalui kemiringan kurva:
            <span className="block text-center text-xs font-mono text-teal-800 bg-teal-50/50 p-2 my-2 rounded border border-teal-200/60 font-bold">
              v̄ = m_slope · 2f &nbsp;&nbsp;|&nbsp;&nbsp; Δv = 2f &middot; Δm
            </span>
            di mana <span className="font-mono text-slate-800">Δm</span> adalah kesalahan deviasi standar dari slope. Nilai faktor koreksi ujung pipa (<span className="italic font-serif text-slate-800">e</span>) diperoleh teliti melalui intercept:
            <span className="block text-center text-xs font-mono text-teal-800 bg-teal-50/50 p-2 my-1.5 rounded border border-teal-200/60 font-bold">
              e = n_intercept - (v̄ / 4f)
            </span>
          </p>
        </div>
      </div>
    );
  }

  // surface tension
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 shadow-sm">
      <h4 className="text-[10px] text-blue-600 uppercase font-black tracking-wider mb-2">
        Teori Kenaikan Kapiler (Tegangan Permukaan)
      </h4>
      <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
        <p>
          Tegangan permukaan zat cair (<span className="font-serif">γ</span>) menggunakan pipa kapiler dihitung berdasarkan keseimbangan antara gaya tarik vertikal (tegangan permukaan) dengan gaya berat kolom zat cair yang naik:
        </p>
        <span className="block text-center text-sm font-serif text-emerald-800 bg-emerald-50/50 border border-emerald-200/65 py-2 my-2.5 rounded font-bold">
          γ = (r · h · ρ · g) / (2 · cos θ)
        </span>
        <div className="bg-white p-2.5 rounded text-slate-700 border border-slate-200 space-y-1 font-mono text-[11px] leading-relaxed shadow-xs">
          <div>• <span className="text-slate-800 font-serif">r</span> : Jari-jari pipa kapiler (meter)</div>
          <div>• <span className="text-slate-800 font-serif">h</span> : Tinggi kenaikan zat cair (meter)</div>
          <div>• <span className="text-slate-800 font-serif">ρ</span> : Massa jenis zat cair (kg/m³)</div>
          <div>• <span className="text-slate-800 font-serif">g</span> : Percepatan gravitasi (9.80665 m/s²)</div>
          <div>• <span className="text-slate-800 font-serif">θ</span> : Sudut kontak (biasanya 0° untuk air, cos 0° = 1)</div>
        </div>
        <p className="border-t border-slate-200 pt-2.5 text-[11px] font-light text-slate-500">
          Satuan Standar Internasional (SI) untuk tegangan permukaan adalah 
          <span className="font-semibold text-teal-700"> N/m</span> (Newton per meter), atau setara dengan 
          <span className="font-semibold text-teal-700"> J/m²</span>.
        </p>
      </div>
    </div>
  );
}
