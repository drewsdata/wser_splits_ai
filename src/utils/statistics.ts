/**
 * Statistical calculations: Summary stats, Histogram binning, LOESS smoothing, and KDE
 */

export function calculateStats(values: number[]): {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
} | null {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
  if (valid.length === 0) return null;

  valid.sort((a, b) => a - b);
  const count = valid.length;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  const mean = sum / count;
  const min = valid[0];
  const max = valid[valid.length - 1];

  let median = 0;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = (valid[mid - 1] + valid[mid]) / 2;
  } else {
    median = valid[mid];
  }

  return { count, mean, median, min, max };
}

/**
 * Computes histogram bins for numerical values
 */
export interface HistogramBin {
  x0: number; // bin start
  x1: number; // bin end
  xMid: number; // bin center
  count: number;
}

export function computeHistogram(
  values: number[],
  numBins: number = 30,
  minDomain?: number,
  maxDomain?: number
): HistogramBin[] {
  const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v) && isFinite(v));
  if (valid.length === 0) return [];

  const min = minDomain !== undefined ? minDomain : Math.min(...valid);
  const max = maxDomain !== undefined ? maxDomain : Math.max(...valid);
  
  if (min === max) {
    return [{ x0: min - 0.5, x1: max + 0.5, xMid: min, count: valid.length }];
  }

  const binWidth = (max - min) / numBins;
  const bins: HistogramBin[] = Array.from({ length: numBins }, (_, i) => {
    const x0 = min + i * binWidth;
    const x1 = x0 + binWidth;
    return {
      x0,
      x1,
      xMid: (x0 + x1) / 2,
      count: 0,
    };
  });

  for (const v of valid) {
    let index = Math.floor((v - min) / binWidth);
    if (index >= numBins) index = numBins - 1;
    if (index < 0) index = 0;
    bins[index].count++;
  }

  return bins;
}

/**
 * Locally Estimated Scatterplot Smoothing (LOESS / LOWESS)
 * Matches ggplot2 geom_smooth(method = "loess")
 * @param points Array of { x, y }
 * @param span Fraction of points to use in local neighborhood (default 0.7)
 * @param numOutputPoints Number of evaluation points along x domain
 */
export function calculateLoess(
  points: { x: number; y: number }[],
  span: number = 0.7,
  numOutputPoints: number = 40
): { x: number; y: number }[] {
  const valid = points
    .filter((p) => p.x !== null && p.y !== null && !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y))
    .sort((a, b) => a.x - b.x);

  const n = valid.length;
  if (n < 5) {
    return [];
  }

  const minX = valid[0].x;
  const maxX = valid[valid.length - 1].x;
  if (minX === maxX) return [];

  const k = Math.max(3, Math.floor(span * n));
  const step = (maxX - minX) / (numOutputPoints - 1);
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < numOutputPoints; i++) {
    const targetX = minX + i * step;

    // Distances to all points
    const withDist = valid.map((p) => ({
      x: p.x,
      y: p.y,
      dist: Math.abs(p.x - targetX),
    }));

    withDist.sort((a, b) => a.dist - b.dist);
    const neighbors = withDist.slice(0, k);
    const maxDist = neighbors[neighbors.length - 1].dist;

    if (maxDist === 0) {
      const avgY = neighbors.reduce((acc, p) => acc + p.y, 0) / k;
      result.push({ x: targetX, y: avgY });
      continue;
    }

    // Weighted linear regression with tricube weight kernel: (1 - (dist/maxDist)^3)^3
    let sumW = 0;
    let sumWX = 0;
    let sumWY = 0;
    let sumWXX = 0;
    let sumWXY = 0;

    for (const p of neighbors) {
      const u = p.dist / maxDist;
      const w = Math.pow(1 - Math.pow(u, 3), 3);
      if (w <= 0) continue;

      sumW += w;
      sumWX += w * p.x;
      sumWY += w * p.y;
      sumWXX += w * p.x * p.x;
      sumWXY += w * p.x * p.y;
    }

    if (sumW === 0) continue;

    const denom = sumW * sumWXX - sumWX * sumWX;
    if (Math.abs(denom) < 1e-12) {
      result.push({ x: targetX, y: sumWY / sumW });
    } else {
      const slope = (sumW * sumWXY - sumWX * sumWY) / denom;
      const intercept = (sumWY - slope * sumWX) / sumW;
      const yPred = intercept + slope * targetX;
      result.push({ x: targetX, y: yPred });
    }
  }

  return result;
}

/**
 * Gaussian Kernel Density Estimation (KDE)
 * For Ridge plots and continuous distribution visualization
 */
export function computeKDE(
  values: number[],
  domain: [number, number],
  numPoints: number = 60,
  bandwidthMultiplier: number = 1.0
): { x: number; density: number }[] {
  const valid = values.filter((v) => !isNaN(v) && isFinite(v));
  if (valid.length < 2) return [];

  const n = valid.length;
  // Silverman's rule of thumb for bandwidth: h = 1.06 * std * n^(-1/5)
  const mean = valid.reduce((a, b) => a + b, 0) / n;
  const variance = valid.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  const h = (1.06 * (std || 1) * Math.pow(n, -0.2)) * bandwidthMultiplier;

  const [minX, maxX] = domain;
  const step = (maxX - minX) / (numPoints - 1);
  const result: { x: number; density: number }[] = [];

  const invSqrt2Pi = 1 / Math.sqrt(2 * Math.PI);

  for (let i = 0; i < numPoints; i++) {
    const x = minX + i * step;
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const u = (x - valid[j]) / h;
      sum += invSqrt2Pi * Math.exp(-0.5 * u * u);
    }
    const density = sum / (n * h);
    result.push({ x, density });
  }

  return result;
}
