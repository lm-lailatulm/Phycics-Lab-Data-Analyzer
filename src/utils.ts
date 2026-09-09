/**
 * Math and Statistical Utilities for Physics Laboratory Data Analysis
 */

import { TeganganGlobalParams } from './types';

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  sumX: number;
  sumY: number;
  sumXY: number;
  sumXSq: number;
  sumYSq: number;
  slopeError: number;
  interceptError: number;
  sy: number;
}

/**
 * Calculates the standard linear regression y = mx + c using the least squares method.
 */
export function calculateLinearRegression(X: number[], Y: number[]): RegressionResult {
  const N = X.length;
  if (N <= 1) {
    return { slope: 0, intercept: 0, rSquared: 0, sumX: 0, sumY: 0, sumXY: 0, sumXSq: 0, sumYSq: 0, slopeError: 0, interceptError: 0, sy: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXSq = 0;
  let sumYSq = 0;

  for (let i = 0; i < N; i++) {
    const x = X[i];
    const y = Y[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXSq += x * x;
    sumYSq += y * y;
  }

  const denominator = N * sumXSq - sumX * sumX;
  
  // Guard against division by zero (e.g. all X values are identical)
  if (Math.abs(denominator) < 1e-12) {
    return { slope: 0, intercept: 0, rSquared: 0, sumX, sumY, sumXY, sumXSq, sumYSq, slopeError: 0, interceptError: 0, sy: 0 };
  }

  const slope = (N * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / N;

  // Calculate R-squared (Coefficient of Determination) & residual errors
  const meanY = sumY / N;
  let ssResult = 0;
  let ssTotal = 0;

  for (let i = 0; i < N; i++) {
    const y = Y[i];
    const yPred = slope * X[i] + intercept;
    ssResult += (y - yPred) * (y - yPred);
    ssTotal += (y - meanY) * (y - meanY);
  }

  const rSquared = ssTotal === 0 ? 1 : 1 - (ssResult / ssTotal);

  // Standard error of slope and intercept
  let slopeError = 0;
  let interceptError = 0;
  let sy = 0;
  if (N > 2) {
    const meanX = sumX / N;
    let sumDiffXSq = 0;
    for (let i = 0; i < N; i++) {
      sumDiffXSq += (X[i] - meanX) * (X[i] - meanX);
    }
    const sSq = ssResult / (N - 2);
    sy = Math.sqrt(sSq);
    if (sumDiffXSq > 0) {
      slopeError = Math.sqrt(sSq / sumDiffXSq);
      interceptError = Math.sqrt(sSq * (1 / N + (meanX * meanX) / sumDiffXSq));
    }
  } else if (N === 2) {
    // If exactly 2 data points, standard statistical error estimate has 0 degrees of freedom.
    // We can fallback to 0 or a very minimal numerical default.
    slopeError = 0;
    interceptError = 0;
    sy = Math.sqrt(ssResult);
  }

  return {
    slope,
    intercept,
    rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp to [0, 1]
    sumX,
    sumY,
    sumXY,
    sumXSq,
    sumYSq,
    slopeError,
    interceptError,
    sy
  };
}

export interface StatsResult {
  mean: number;
  stdError: number; // Ralat mutlak (standard error of the mean)
  relativeError: number; // Ralat relatif (%)
  precision: number; // Ketelitian (%)
}

/**
 * Calculates basic statistics including mean, standard error, relative error and precision.
 * Formula for Ralat Mutlak (standard error of the mean):
 * delta_x = S_bar = sqrt( sum(x_i - mean)^2 / (N * (N - 1)) )
 */
export function calculateStats(values: number[]): StatsResult {
  const N = values.length;
  if (N === 0) {
    return { mean: 0, stdError: 0, relativeError: 0, precision: 100 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / N;
  if (N <= 1) {
    return { mean, stdError: 0, relativeError: 0, precision: 100 };
  }

  const varianceSum = values.reduce((sum, v) => sum + (v - mean) * (v - mean), 0);
  
  // Standard error of the mean: S_bar = sqrt( varianceSum / (N * (N - 1)) )
  const stdError = Math.sqrt(varianceSum / (N * (N - 1)));
  
  // Relative error: delta_r = (stdError / mean) * 100%
  const relativeError = mean === 0 ? 0 : (stdError / Math.abs(mean)) * 100;
  
  // Precision: 100% - relativeError
  const precision = Math.max(0, 100 - relativeError);

  return {
    mean,
    stdError,
    relativeError,
    precision
  };
}

/**
 * Calculates surface tension, restoring force, and propagation error for a medium.
 */
export function calculateTeganganMediumStats(
  trials: number[],
  params: TeganganGlobalParams
) {
  const x0 = typeof params.x0 === 'number' && !isNaN(params.x0) ? params.x0 : 0;
  const delta_x0 = typeof params.delta_x0 === 'number' && !isNaN(params.delta_x0) ? params.delta_x0 : 0;
  const x1 = typeof params.x1 === 'number' && !isNaN(params.x1) ? params.x1 : 0;
  const delta_x1 = typeof params.delta_x1 === 'number' && !isNaN(params.delta_x1) ? params.delta_x1 : 0;
  const p = typeof params.p === 'number' && !isNaN(params.p) ? params.p : 0;
  const t = typeof params.t === 'number' && !isNaN(params.t) ? params.t : 0;
  const delta_p = typeof params.delta_p === 'number' && !isNaN(params.delta_p) ? params.delta_p : 0;
  const delta_t = typeof params.delta_t === 'number' && !isNaN(params.delta_t) ? params.delta_t : 0;
  const mBeban = typeof params.mBeban === 'number' && !isNaN(params.mBeban) ? params.mBeban : 1.0;
  const delta_mBeban = typeof params.delta_mBeban === 'number' && !isNaN(params.delta_mBeban) ? params.delta_mBeban : 0.0;
  const g = typeof params.g === 'number' && !isNaN(params.g) ? params.g : 9.81;
  const delta_g = typeof params.delta_g === 'number' && !isNaN(params.delta_g) ? params.delta_g : 0.0;

  const validTrials = trials.filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
  const n = validTrials.length;
  if (n === 0) {
    return {
      meanX2: 0,
      stdErrX2: 0,
      F: 0,
      delta_F: 0,
      gamma: 0,
      delta_gamma: 0,
      kPegas: 0,
    };
  }

  const meanX2 = validTrials.reduce((sum, v) => sum + v, 0) / n;

  // std error of the mean of X2
  let stdErrX2 = 0;
  if (n > 1) {
    const varianceSum = validTrials.reduce((sum, v) => sum + (v - meanX2) * (v - meanX2), 0);
    stdErrX2 = Math.sqrt(varianceSum / (n * (n - 1)));
  }

  // Calculate Equivalence kPegas in N/Skala:
  // kPegas = (mBeban * 10^-3 * g) / (x1 - x0)
  const diffX1X0 = x1 - x0;
  const mBebanKg = mBeban / 1000;
  const delta_mBebanKg = delta_mBeban / 1000;

  const kPegas = diffX1X0 > 0 ? (mBebanKg * g) / diffX1X0 : 0;

  // F = (meanX2 - x0) * (m_kg * g) / (x1 - x0) = (meanX2 - x0) * kPegas
  const F = kPegas * (meanX2 - x0);

  // Partial derivatives for delta_F propagation:
  // F = (x2 - x0) * m_kg * g / (x1 - x0)
  let delta_F = 0;
  if (diffX1X0 > 0) {
    const dF_dm = Math.abs((meanX2 - x0) * g / diffX1X0); // with respect to m in kg
    const dF_dg = Math.abs((meanX2 - x0) * mBebanKg / diffX1X0);
    const dF_dx0 = Math.abs((mBebanKg * g * (meanX2 - x1)) / (diffX1X0 * diffX1X0));
    const dF_dx1 = Math.abs(-(mBebanKg * g * (meanX2 - x0)) / (diffX1X0 * diffX1X0));
    const dF_dx2 = Math.abs((mBebanKg * g) / diffX1X0);

    delta_F = dF_dm * delta_mBebanKg +
              dF_dg * delta_g +
              dF_dx0 * delta_x0 +
              dF_dx1 * delta_x1 +
              dF_dx2 * stdErrX2;
  }

  // gamma = F / (2 * (p/1000 + t/1000)) -> converting plate dimensions from mm to meters
  const pMeter = p / 1000;
  const tMeter = t / 1000;
  const L = 2 * (pMeter + tMeter);

  const gamma = L > 0 ? F / L : 0;

  // Partial derivatives for delta_gamma:
  // gamma = F / (2 * (p_meter + t_meter))
  const delta_p_meter = delta_p / 1000;
  const delta_t_meter = delta_t / 1000;
  let delta_gamma = 0;
  if (pMeter + tMeter > 0) {
    const dgamma_dF = 1 / (2 * (pMeter + tMeter));
    const dgamma_dp = Math.abs(-F / (2 * (pMeter + tMeter) * (pMeter + tMeter)));
    const dgamma_dt = Math.abs(-F / (2 * (pMeter + tMeter) * (pMeter + tMeter)));

    delta_gamma = dgamma_dF * delta_F + dgamma_dp * delta_p_meter + dgamma_dt * delta_t_meter;
  }

  return {
    meanX2,
    stdErrX2,
    F,
    delta_F,
    gamma,
    delta_gamma,
    kPegas,
  };
}

/**
 * Generates initial mock data rows for better onboarding.
 */
export const SAMPLE_DATA = {
  gravitasi: [
    { id: '1', noPeriode1: 0, t1: 0, noPeriode2: 100, t2: 118 },
    { id: '2', noPeriode1: 10, t1: 11, noPeriode2: 110, t2: 130 },
    { id: '3', noPeriode1: 20, t1: 23, noPeriode2: 120, t2: 142 },
    { id: '4', noPeriode1: 30, t1: 35, noPeriode2: 130, t2: 154 },
    { id: '5', noPeriode1: 40, t1: 47, noPeriode2: 140, t2: 166 },
    { id: '6', noPeriode1: 50, t1: 59, noPeriode2: 150, t2: 178 },
    { id: '7', noPeriode1: 60, t1: 71, noPeriode2: 160, t2: 190 },
    { id: '8', noPeriode1: 70, t1: 83, noPeriode2: 170, t2: 202 },
    { id: '9', noPeriode1: 80, t1: 95, noPeriode2: 180, t2: 214 },
    { id: '10', noPeriode1: 90, t1: 107, noPeriode2: 190, t2: 226 },
  ],
  pegasUnified: [
    { id: '1', massaBeban: 50, posisi2: 145.0, waktu10T: 4.55 },
    { id: '2', massaBeban: 100, posisi2: 170.0, waktu10T: 5.53 },
    { id: '3', massaBeban: 150, posisi2: 195.0, waktu10T: 6.36 },
    { id: '4', massaBeban: 200, posisi2: 220.0, waktu10T: 7.09 },
    { id: '5', massaBeban: 250, posisi2: 245.0, waktu10T: 7.76 },
    { id: '6', massaBeban: 300, posisi2: 270.0, waktu10T: 8.38 },
    { id: '7', massaBeban: 350, posisi2: 295.0, waktu10T: 8.96 },
    { id: '8', massaBeban: 400, posisi2: 320.0, waktu10T: 9.51 },
    { id: '9', massaBeban: 450, posisi2: 345.0, waktu10T: 10.04 },
    { id: '10', massaBeban: 500, posisi2: 370.0, waktu10T: 10.55 },
  ],
  bunyi: [
    { id: '1', resonansiKe: 1, m: 0, f1_t1: 2.1, f1_t2: 2.2, f1_t3: 2.0, f2_t1: 1.7, f2_t2: 1.8, f2_t3: 1.6 },
    { id: '2', resonansiKe: 2, m: 1, f1_t1: 6.4, f1_t2: 6.3, f1_t3: 6.5, f2_t1: 5.1, f2_t2: 5.0, f2_t3: 5.2 },
    { id: '3', resonansiKe: 3, m: 2, f1_t1: 10.6, f1_t2: 10.7, f1_t3: 10.5, f2_t1: 8.5, f2_t2: 8.6, f2_t3: 8.4 },
    { id: '4', resonansiKe: 4, m: 3, f1_t1: 14.9, f1_t2: 14.8, f1_t3: 15.0, f2_t1: 11.9, f2_t2: 12.0, f2_t3: 11.8 },
  ],
  tegangan: [
    { id: 'air', cairan: 'Air', trials: [1.1, 1.2, 1.2, 1.0, 1.1], suhu: 25, literatureVal: 0.0720 },
    { id: 'alkohol', cairan: 'Alkohol', trials: [0.5, 0.4, 0.3, 0.6, 0.6], suhu: 24, literatureVal: 0.0220 },
    { id: 'spiritus', cairan: 'Spiritus', trials: [0.7, 0.8, 0.8, 0.8, 0.7], suhu: 24, literatureVal: 0.0240 },
  ],
};

/**
 * Generates empty starting data rows for true lab entry.
 */
export const EMPTY_DATA = {
  gravitasi: [
    { id: '1', noPeriode1: 0, t1: 0, noPeriode2: 100, t2: 0 },
    { id: '2', noPeriode1: 10, t1: 0, noPeriode2: 110, t2: 0 },
    { id: '3', noPeriode1: 20, t1: 0, noPeriode2: 120, t2: 0 },
    { id: '4', noPeriode1: 30, t1: 0, noPeriode2: 130, t2: 0 },
    { id: '5', noPeriode1: 40, t1: 0, noPeriode2: 140, t2: 0 },
    { id: '6', noPeriode1: 50, t1: 0, noPeriode2: 150, t2: 0 },
    { id: '7', noPeriode1: 60, t1: 0, noPeriode2: 160, t2: 0 },
    { id: '8', noPeriode1: 70, t1: 0, noPeriode2: 170, t2: 0 },
    { id: '9', noPeriode1: 80, t1: 0, noPeriode2: 180, t2: 0 },
    { id: '10', noPeriode1: 90, t1: 0, noPeriode2: 190, t2: 0 },
  ],
  pegasUnified: [
    { id: '1', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '2', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '3', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '4', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '5', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '6', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '7', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '8', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '9', massaBeban: 0, posisi2: 0, waktu10T: 0 },
    { id: '10', massaBeban: 0, posisi2: 0, waktu10T: 0 },
  ],
  bunyi: [
    { id: '1', resonansiKe: 1, m: 0, f1_t1: 0, f1_t2: 0, f1_t3: 0, f2_t1: 0, f2_t2: 0, f2_t3: 0 },
    { id: '2', resonansiKe: 2, m: 1, f1_t1: 0, f1_t2: 0, f1_t3: 0, f2_t1: 0, f2_t2: 0, f2_t3: 0 },
    { id: '3', resonansiKe: 3, m: 2, f1_t1: 0, f1_t2: 0, f1_t3: 0, f2_t1: 0, f2_t2: 0, f2_t3: 0 },
    { id: '4', resonansiKe: 4, m: 3, f1_t1: 0, f1_t2: 0, f1_t3: 0, f2_t1: 0, f2_t2: 0, f2_t3: 0 },
  ],
  tegangan: [
    { id: 'air', cairan: 'Air', trials: [0, 0, 0, 0, 0], suhu: 0, literatureVal: 0.0720 },
    { id: 'alkohol', cairan: 'Alkohol', trials: [0, 0, 0, 0, 0], suhu: 0, literatureVal: 0.0220 },
    { id: 'spiritus', cairan: 'Spiritus', trials: [0, 0, 0, 0, 0], suhu: 0, literatureVal: 0.0240 },
  ],
};
