// SPDX-License-Identifier: Apache-2.0
// Synthetic datasets for PCA Playground — pre-generated at module load with fixed seeds

export interface DataPoint {
  features: number[]
  label: number
  isAnomaly?: boolean
}

export interface Dataset {
  id: string
  nFeatures: number
  featureNames: string[]
  points: DataPoint[]
  classes: string[]
}

// ── Seeded PRNG (LCG) ────────────────────────────────────────────────────────
function lcg(seed: number) {
  let s = seed
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function normalRandom(rand: () => number): () => number {
  // Box-Muller transform
  return () => {
    const u = rand() || 1e-10
    const v = rand() || 1e-10
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}

// ── Dataset 1: Blobs 2D ───────────────────────────────────────────────────────
// 3 Gaussian clusters in 2D. PCA finds the inter-cluster spread axis.
function generateBlobs2D(): Dataset {
  const rand = normalRandom(lcg(42))
  const centers = [[-3, -2], [2, 3], [3, -2]] as const
  const sigma = 0.9
  const points: DataPoint[] = []
  for (let cls = 0; cls < 3; cls++) {
    for (let i = 0; i < 60; i++) {
      points.push({
        features: [centers[cls][0] + rand() * sigma, centers[cls][1] + rand() * sigma],
        label: cls,
      })
    }
  }
  return {
    id: 'blobs2d',
    nFeatures: 2,
    featureNames: ['Feature 1', 'Feature 2'],
    points,
    classes: ['Cluster A', 'Cluster B', 'Cluster C'],
  }
}

// ── Dataset 2: Correlated 4D ──────────────────────────────────────────────────
// 4 correlated features driven by 1 latent variable t.
// PC1 should explain ~80% variance, 2 PCs capture ~95%.
function generateCorrelated4D(): Dataset {
  const rand = normalRandom(lcg(123))
  const noise = normalRandom(lcg(456))
  const points: DataPoint[] = []
  for (let cls = 0; cls < 2; cls++) {
    const tMean = cls === 0 ? -2 : 2
    for (let i = 0; i < 100; i++) {
      const t = tMean + rand()
      points.push({
        features: [
          t + noise() * 0.3,
          t + noise() * 0.3,
          2 * t + noise() * 0.4,
          -t + noise() * 0.3,
        ],
        label: cls,
      })
    }
  }
  return {
    id: 'correlated4d',
    nFeatures: 4,
    featureNames: ['f1', 'f2', 'f3', 'f4'],
    points,
    classes: ['Class 0', 'Class 1'],
  }
}

// ── Dataset 3: High-Dimensional 10D ──────────────────────────────────────────
// 10 features: only first 3 carry class information, rest are noise.
// Scree plot shows elbow at component 3.
function generateHD10D(): Dataset {
  const signal = normalRandom(lcg(77))
  const noiseGen = normalRandom(lcg(88))
  const centers = [[-2, -2, 1], [2, 1, -2], [0, 3, 3]] as const
  const points: DataPoint[] = []
  for (let cls = 0; cls < 3; cls++) {
    for (let i = 0; i < 80; i++) {
      const informative = [
        centers[cls][0] + signal() * 0.8,
        centers[cls][1] + signal() * 0.8,
        centers[cls][2] + signal() * 0.8,
      ]
      const noise = Array.from({ length: 7 }, () => noiseGen())
      points.push({ features: [...informative, ...noise], label: cls })
    }
  }
  return {
    id: 'hd10d',
    nFeatures: 10,
    featureNames: ['info_1', 'info_2', 'info_3', 'noise_4', 'noise_5', 'noise_6', 'noise_7', 'noise_8', 'noise_9', 'noise_10'],
    points,
    classes: ['Class 0', 'Class 1', 'Class 2'],
  }
}

// ── Dataset 4: Anomaly 3D ─────────────────────────────────────────────────────
// Tight normal cluster + small anomaly cluster far away.
// Anomaly reconstruction error is clearly bimodal.
function generateAnomalyData(): Dataset {
  const normal = normalRandom(lcg(999))
  const anomaly = normalRandom(lcg(1234))
  const points: DataPoint[] = []

  // Normal points: N([0,0,0], I)
  for (let i = 0; i < 200; i++) {
    points.push({
      features: [normal() * 1.0, normal() * 1.0, normal() * 1.0],
      label: 0,
      isAnomaly: false,
    })
  }
  // Anomaly points: N([5,5,5], 0.3*I)
  for (let i = 0; i < 20; i++) {
    points.push({
      features: [5 + anomaly() * 0.4, 5 + anomaly() * 0.4, 5 + anomaly() * 0.4],
      label: 1,
      isAnomaly: true,
    })
  }
  return {
    id: 'anomaly3d',
    nFeatures: 3,
    featureNames: ['x', 'y', 'z'],
    points,
    classes: ['Normal', 'Anomaly'],
  }
}

// Pre-generate at module load (fixed seed → reproducible)
export const DATASETS: Dataset[] = [
  generateBlobs2D(),
  generateCorrelated4D(),
  generateHD10D(),
  generateAnomalyData(),
]

export const DATASET_MAP: Record<string, Dataset> = Object.fromEntries(
  DATASETS.map(d => [d.id, d]),
)
