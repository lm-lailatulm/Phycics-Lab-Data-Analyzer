export interface TrialRowGravitasi {
  id: string;
  noPeriode1: number; // 0, 10, 20, ..., 90
  t1: number; // Waktu t1 in seconds
  noPeriode2: number; // 100, 110, 120, ..., 190
  t2: number; // Waktu t2 in seconds
}

export interface ResultGravitasi {
  rows: {
    id: string;
    panjangTali: number;
    waktu: number;
    period: number;
    periodSq: number;
    gIndividual: number;
  }[];
  meanG: number;
  stdErrorG: number;
  relativeErrorG: number; // in %
  precisionG: number; // in %
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
    gFromSlope: number;
  };
}

export interface TrialRowPegasUnified {
  id: string;
  massaBeban: number; // m_b in grams
  posisi2: number; // Posisi-2 in mm
  waktu10T: number; // 10T in seconds
}

export interface ResultPegasUnified {
  rows: {
    id: string;
    massaBeban: number;
    posisi2: number;
    waktu10T: number;
    deltaX: number; // mm
    deltaXMeter: number; // m
    force: number; // N
    period: number; // s
    periodSq: number; // s^2
    kStatisInd: number; // N/m
    kDinamisInd: number; // N/m
  }[];
  statisStats: {
    mean: number;
    stdError: number;
    relativeError: number;
    precision: number;
  };
  dinamisStats: {
    mean: number;
    stdError: number;
    relativeError: number;
    precision: number;
  };
  statisRegression: {
    slope: number;
    intercept: number;
    rSquared: number;
    slopeError: number;
  };
  dinamisRegression: {
    slope: number;
    intercept: number;
    rSquared: number;
    kFromSlope: number;
    slopeError: number;
  };
}

export interface TrialRowBunyi {
  id: string;
  resonansiKe: number; // 1, 2, 3, 4
  m: number; // 0, 1, 2, 3
  f1_t1: number; // Trial 1 (cm)
  f1_t2: number; // Trial 2 (cm)
  f1_t3: number; // Trial 3 (cm)
  f2_t1: number; // Trial 1 (cm)
  f2_t2: number; // Trial 2 (cm)
  f2_t3: number; // Trial 3 (cm)
}

export interface ResultBunyi {
  rows: {
    id: string;
    frekuensi: number;
    L1: number; // meters
    L2: number; // meters
    deltaL: number; // L2 - L1 in m
    wavelength: number; // 2 * deltaL or 4 * L1 in m
    vIndividual: number; // m/s
  }[];
  meanV: number;
  stdErrorV: number;
  relativeErrorV: number;
  precisionV: number;
}

export interface TrialRowTegangan {
  id: string;
  cairan: string;
  trials: number[]; // 5 trials of X2
  suhu: number; // in °C
  literatureVal: number; // in N/m
}

export interface TeganganGlobalParams {
  x0: number;
  delta_x0: number;
  x1: number;
  delta_x1: number;
  p: number; // in mm
  delta_p: number;
  t: number; // in mm
  delta_t: number;
  mBeban: number; // in grams
  delta_mBeban: number; // in grams
  g: number; // in m/s^2
  delta_g: number; // in m/s^2
}

export type ActiveExperiment = 'gravitasi' | 'pegas' | 'bunyi' | 'tegangan';
