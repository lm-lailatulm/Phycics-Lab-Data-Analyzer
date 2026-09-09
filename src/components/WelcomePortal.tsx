import React from 'react';
import {
  Atom,
  Layers,
  Music,
  Droplet,
  ArrowRight,
  BookOpen,
  Compass,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { ActiveExperiment } from '../types';

interface WelcomePortalProps {
  onSelectExperiment: (experiment: ActiveExperiment) => void;
}

export default function WelcomePortal({ onSelectExperiment }: WelcomePortalProps) {
  const experiments = [
    {
      id: 'gravitasi' as ActiveExperiment,
      title: 'Percepatan Gravitasi',
      subtitle: 'Ayunan Matematis / Pendulum GHS',
      tag: 'GHS & Relativitas',
      desc: 'Menganalisis besar percepatan gravitasi bumi setempat menggunakan model ayunan mekanis sederhana dengan ralat diferensial sferis dan regresi linier.',
      icon: Compass,
      color: 'blue',
      bgGrad: 'from-blue-50 to-indigo-50/30 hover:border-blue-300',
      iconBg: 'bg-blue-600 shadow-blue-500/20 text-white',
      accentText: 'text-blue-700',
      features: ['Konfigurasi sferis pendulum', 'Fitting regresi linier periode', 'Ralat diferensial deviasi rata-rata'],
    },
    {
      id: 'pegas' as ActiveExperiment,
      title: 'Tetapan Pegas',
      subtitle: 'Hukum Hooke & Osilasi Getaran',
      tag: 'Elastisitas Mekanis',
      desc: 'Membandingkan pembuktian tetapan pegas k secara integratif menggunakan metode statis (Hukum Hooke) dan metode dinamis (getaran selisih waktu osilasi).',
      icon: Activity,
      color: 'sky',
      bgGrad: 'from-slate-50 to-sky-50/20 hover:border-sky-300',
      iconBg: 'bg-sky-600 shadow-sky-500/20 text-white',
      accentText: 'text-sky-700',
      features: ['Hukum Hooke linier dinamis', 'Analisis periode osilasi 10T', 'Regresi kuadrat terkecil k-metode'],
    },
    {
      id: 'bunyi' as ActiveExperiment,
      title: 'Gelombang Bunyi',
      subtitle: 'Resonansi Tabung Ujung Tertutup',
      tag: 'Gelombang Akustik',
      desc: 'Menghitung cepat rambat gelombang bunyi di udara bebas sekaligus menghitung faktor koreksi ujung tabung menggunakan metode resonansi bertingkat.',
      icon: Music,
      color: 'emerald',
      bgGrad: 'from-emerald-50/40 to-teal-50/10 hover:border-emerald-300',
      iconBg: 'bg-emerald-600 shadow-emerald-500/20 text-white',
      accentText: 'text-emerald-700',
      features: ['Metode resonansi multi-orde', 'Analisis frekuensi f₁ & f₂ paralel', 'Interactive scatter plot regresi'],
    },
    {
      id: 'tegangan' as ActiveExperiment,
      title: 'Tegangan Permukaan',
      subtitle: 'Kenaikan Kapiler Jolly Balance',
      tag: 'Fisika Fluida',
      desc: 'Menentukan nilai tegangan permukaan pada medium cairan murni dan alkohol dengan instrumen Jolly Balance, lengkap dengan komparasi data referensi.',
      icon: Droplet,
      color: 'violet',
      bgGrad: 'from-indigo-50/40 to-violet-50/20 hover:border-violet-300',
      iconBg: 'bg-violet-600 shadow-violet-500/20 text-white',
      accentText: 'text-violet-700',
      features: ['Kalibrasi Jolly Balance presisi', 'Komparasi alkohol vs air', 'Visualisasi korelasi relatif'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between overflow-y-auto w-full select-none">
      {/* Top beautiful border line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>

      {/* Main Hub Content wrapper */}
      <div className="max-w-6xl mx-auto px-6 py-12 sm:py-16 flex-1 flex flex-col justify-center w-full">
        {/* Welcome Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-250/60 rounded-full text-indigo-700 font-extrabold text-[11px] uppercase tracking-wider mb-4 shadow-mini">
            <Atom className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>SMART LAB AUTOMATION SYSTEM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 tracking-tight leading-none mb-4.5 font-display">
            PHYSICS LAB
          </h1>
          <p className="text-sm sm:text-base font-extrabold text-slate-500 uppercase tracking-widest mb-2.5 font-display">
            Analisis Data PFD Ruang A
          </p>
          <div className="h-0.5 w-16 bg-blue-500 mx-auto mb-4 rounded-full"></div>

          <p className="text-slate-500 text-[12px] font-bold">
            by <span className="text-slate-700 font-black border-b-2 border-indigo-300 pb-0.5">Lailatul Mufidah</span>
          </p>
        </div>

        {/* Experiment Grid Choose Option */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {experiments.map((exp) => {
            const IconComponent = exp.icon;
            return (
              <button
                key={exp.id}
                onClick={() => onSelectExperiment(exp.id)}
                className={`group text-left border border-slate-200 bg-white p-6 sm:p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md ${exp.bgGrad} flex flex-col justify-between h-full relative overflow-hidden`}
              >
                {/* Visual accent top edge glow */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
                  exp.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                  exp.color === 'sky' ? 'from-sky-500 to-blue-500' :
                  exp.color === 'emerald' ? 'from-emerald-500 to-teal-500' :
                  'from-violet-500 to-indigo-500'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-350`}></div>

                <div>
                  {/* Top line with Icon and badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exp.iconBg}`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
                      {exp.tag}
                    </span>
                  </div>

                  {/* Title & subtitle label */}
                  <h3 className="text-lg font-extrabold text-slate-950 leading-snug group-hover:text-blue-600 transition">
                    {exp.title}
                  </h3>
                  <span className="text-xs font-semibold text-slate-450 block mb-6">
                    {exp.subtitle}
                  </span>
                </div>

                {/* Bottom enter button decoration */}
                <div className={`w-full flex items-center justify-between group-hover:translate-x-1 transition duration-200 mt-auto pt-2 text-xs font-black uppercase tracking-wider ${exp.accentText}`}>
                  <span>Buka Modul Analisis</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Help Guide row */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 flex flex-col justify-center">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2 font-display">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Panduan Cepat
            </h4>
          </div>
          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-4.5">
            <div className="space-y-1">
              <div className="text-xs font-black text-blue-600 font-mono">STEP 1</div>
              <h5 className="text-[11px] font-bold text-slate-800">Pilih Percobaan</h5>
              <p className="text-[10px] text-slate-500 leading-normal font-light">Pilih salah satu dari empat modul percobaan fisika yang relevan di atas.</p>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-black text-blue-600 font-mono">STEP 2</div>
              <h5 className="text-[11px] font-bold text-slate-800">Isi / Uji Coba Data</h5>
              <p className="text-[10px] text-slate-500 leading-normal font-light">Masukkan hasil pengukuran manual Anda atau klik tombol "Isi Data Sampel".</p>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-black text-blue-600 font-mono">STEP 3</div>
              <h5 className="text-[11px] font-bold text-slate-800">Draf Laporan</h5>
              <p className="text-[10px] text-slate-500 leading-normal font-light">Buka bagian draf dan salin teks yang berisikan tabel data lengkap & ralat statistiknya.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding Info */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-slate-400 text-[10px] mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 12902 Physics Lab Dev - Departemen Fisika Dasar</span>
          <span className="font-mono text-slate-350">RST-3000 Active Container Platform</span>
        </div>
      </footer>
    </div>
  );
}
