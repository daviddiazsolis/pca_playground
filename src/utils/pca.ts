// SPDX-License-Identifier: Apache-2.0
// PCA implemented via SVD using ml-matrix
import { Matrix, SVD } from 'ml-matrix'

export interface PCAResult {
  /** Shape [n_components × n_features] — principal component directions (loadings) */
  components: number[][]
  /** Shape [n_samples × n_components] — projected data (scores) */
  scores: number[][]
  /** Per-component explained variance ratio */
  explainedVarianceRatio: number[]
  /** Cumulative explained variance ratio */
  cumulativeVariance: number[]
  /** Per-feature mean used for centering */
  mean: number[]
  /** Per-feature std used for scaling (1 if scale=false) */
  std: number[]
  /** Singular values */
  singularValues: number[]
  /** Total number of components = min(n_samples, n_features) */
  totalComponents: number
}

/** Center and optionally scale data. Returns z-scored matrix + stats. */
export function standardize(
  X: number[][],
  scale: boolean,
): { Xz: number[][]; mean: number[]; std: number[] } {
  const n = X.length
  const p = X[0].length
  const mean = Array.from({ length: p }, (_, j) =>
    X.reduce((s, row) => s + row[j], 0) / n,
  )
  const std = Array.from({ length: p }, (_, j) => {
    if (!scale) return 1
    const v = X.reduce((s, row) => s + (row[j] - mean[j]) ** 2, 0) / (n - 1)
    return Math.sqrt(v) || 1 // guard zero-variance features
  })
  const Xz = X.map(row => row.map((v, j) => (v - mean[j]) / std[j]))
  return { Xz, mean, std }
}

/**
 * Fit PCA on X via thin SVD. Returns ALL components so callers can slice.
 * Convention matches scikit-learn: components[k] is the k-th PC direction (unit vector).
 */
export function fitPCA(X: number[][], scale = true): PCAResult {
  const n = X.length
  const { Xz, mean, std } = standardize(X, scale)
  const M = new Matrix(Xz)

  // Thin SVD: M = U × S × V^T
  // ml-matrix SVD: M = U * diag(singularValues) * V^T
  const svd = new SVD(M, { autoTranspose: true })
  const singularValues: number[] = svd.diagonal as number[]

  // Explained variance: σ_i² / (n-1)
  const variances = singularValues.map(s => (s * s) / (n - 1))
  const totalVar = variances.reduce((a, b) => a + b, 0) || 1
  const explainedVarianceRatio = variances.map(v => v / totalVar)
  const cumulativeVariance = explainedVarianceRatio.reduce<number[]>((acc, v) => {
    acc.push((acc[acc.length - 1] ?? 0) + v)
    return acc
  }, [])

  // rightSingularVectors (V) columns are eigenvectors; rows of V^T are PC directions
  const V = svd.rightSingularVectors
  const components = V.transpose().to2DArray()

  // Scores = Xz × V  (project onto all PCs)
  const scores = M.mmul(V).to2DArray()

  return {
    components,
    scores,
    explainedVarianceRatio,
    cumulativeVariance,
    mean,
    std,
    singularValues,
    totalComponents: Math.min(n, X[0].length),
  }
}

/** Reconstruct X from k PCA components: X_hat = scores[:,:k] × components[:k,:] × std + mean */
export function reconstruct(
  scores: number[][],
  components: number[][],
  mean: number[],
  std: number[],
  nComponents: number,
): number[][] {
  const p = mean.length
  return scores.map(row => {
    const partial = row.slice(0, nComponents)
    return Array.from(
      { length: p },
      (_, j) => partial.reduce((s, score, k) => s + score * components[k][j], 0) * std[j] + mean[j],
    )
  })
}

/** Per-sample reconstruction error: ||x - x_hat||² */
export function reconstructionError(X: number[][], Xhat: number[][]): number[] {
  return X.map((row, i) => row.reduce((s, v, j) => s + (v - Xhat[i][j]) ** 2, 0))
}

/** Project new points using existing PCA parameters (for anomaly detection) */
export function transformNew(
  X: number[][],
  mean: number[],
  std: number[],
  components: number[][],
  nComponents?: number,
): number[][] {
  const k = nComponents ?? components.length
  const Xz = X.map(row => row.map((v, j) => (v - mean[j]) / std[j]))
  return Xz.map(row => components.slice(0, k).map(pc => row.reduce((s, v, j) => s + v * pc[j], 0)))
}

/** Compute covariance matrix of (centered) X — used in theory section */
export function covarianceMatrix(X: number[][]): number[][] {
  const n = X.length
  const { Xz } = standardize(X, false)
  const p = Xz[0].length
  return Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) =>
      Xz.reduce((s, row) => s + row[i] * row[j], 0) / (n - 1),
    ),
  )
}
