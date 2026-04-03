// SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'
import { DATASET_MAP } from '../utils/datasets'
import { fitPCA, reconstruct, reconstructionError } from '../utils/pca'

const ANOMALY_DS = DATASET_MAP['anomaly3d']

export default function AnomalyDetection() {
  const { t } = useLanguage()
  const [k, setK] = useState(2)
  const [threshold, setThreshold] = useState(5)

  const X = useMemo(() => ANOMALY_DS.points.map(p => p.features), [])
  const normalX = useMemo(() => ANOMALY_DS.points.filter(p => !p.isAnomaly).map(p => p.features), [])

  // Fit PCA only on normal data
  const pca = useMemo(() => fitPCA(normalX, true), [normalX])
  const maxK = pca.totalComponents
  const safeK = Math.min(k, maxK)

  const { errors, flagged } = useMemo(() => {
    const Xhat = reconstruct(
      X.map(row => {
        const Xz = row.map((v, j) => (v - pca.mean[j]) / pca.std[j])
        return pca.components.map(pc => Xz.reduce((s, v, j) => s + v * pc[j], 0))
      }),
      pca.components,
      pca.mean,
      pca.std,
      safeK,
    )
    const errs = reconstructionError(X, Xhat)
    const fl = errs.map(e => e > threshold)
    return { errors: errs, flagged: fl }
  }, [pca, safeK, threshold])  // eslint-disable-line react-hooks/exhaustive-deps

  // Metrics
  const trueAnomalies = ANOMALY_DS.points.map(p => p.isAnomaly ?? false)
  const tp = flagged.filter((f, i) => f && trueAnomalies[i]).length
  const fp = flagged.filter((f, i) => f && !trueAnomalies[i]).length
  const fn = flagged.filter((f, i) => !f && trueAnomalies[i]).length
  const precision = tp + fp > 0 ? (tp / (tp + fp)) : 0
  const recall = tp + fn > 0 ? (tp / (tp + fn)) : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  // Scatter data (first 2 PCs)
  const pcaScores = useMemo(() => {
    const Xz = X.map(row => row.map((v, j) => (v - pca.mean[j]) / pca.std[j]))
    return Xz.map((row, i) => ({
      x: pca.components[0].reduce((s, v, j) => s + v * row[j], 0),
      y: pca.components[1].reduce((s, v, j) => s + v * row[j], 0),
      isAnomaly: trueAnomalies[i],
      isFlagged: flagged[i],
    }))
  }, [pca, flagged])  // eslint-disable-line react-hooks/exhaustive-deps

  // Histogram bins for reconstruction error
  const histData = useMemo(() => {
    const maxErr = Math.max(...errors)
    const bins = 20
    const binSize = maxErr / bins
    const counts = Array.from({ length: bins }, (_, i) => ({
      bin: +((i + 0.5) * binSize).toFixed(2),
      normal: 0,
      anomaly: 0,
    }))
    errors.forEach((e, i) => {
      const bi = Math.min(Math.floor(e / binSize), bins - 1)
      if (trueAnomalies[i]) counts[bi].anomaly++
      else counts[bi].normal++
    })
    return counts
  }, [errors])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section id="anomaly" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-zinc-100 mb-3">{t('anomalyTitle')}</h2>
        <p className="text-zinc-400 mb-4 max-w-3xl">{t('anomalySubtitle')}</p>
        <p className="text-sm text-orange-400 italic border-l-2 border-orange-500/50 pl-4 mb-8">{t('anomalyHint')}</p>

        {/* Controls */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="text-sm text-zinc-300 font-medium">
              {t('anomalyComponents')} (k): <span className="text-orange-400 font-mono">{safeK}</span>
            </label>
            <input type="range" min={1} max={maxK} value={safeK}
              onChange={e => setK(Number(e.target.value))}
              className="w-full mt-2 accent-orange-500" />
          </div>
          <div>
            <label className="text-sm text-zinc-300 font-medium">
              {t('anomalyThreshold')}: <span className="text-orange-400 font-mono">{threshold.toFixed(1)}</span>
            </label>
            <input type="range" min={0.5} max={30} step={0.5} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full mt-2 accent-orange-500" />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: t('anomalyTP'), value: tp, color: 'emerald' },
            { label: t('anomalyFP'), value: fp, color: 'orange' },
            { label: t('anomalyFN'), value: fn, color: 'red' },
            { label: t('anomalyPrecision'), value: `${(precision * 100).toFixed(0)}%`, color: 'blue' },
            { label: t('anomalyRecall'), value: `${(recall * 100).toFixed(0)}%`, color: 'violet' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border border-${color}-500/20 bg-${color}-500/10 p-3 text-center`}>
              <div className={`text-xl font-bold text-${color}-400 font-mono`}>{value}</div>
              <div className="text-xs text-zinc-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 px-4 py-2 inline-flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-sm text-zinc-400">{t('anomalyF1')}:</span>
          <span className={`text-lg font-bold font-mono ${f1 > 0.8 ? 'text-emerald-400' : f1 > 0.5 ? 'text-orange-400' : 'text-red-400'}`}>
            {f1.toFixed(3)}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Anomaly scatter */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">{t('anomalyScatterTitle')} (PC1 vs PC2)</p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="x" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis dataKey="y" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }}
                  formatter={(v: number) => v.toFixed(3)} />
                <Scatter name={t('anomalyNormal')}
                  data={pcaScores.filter(p => !p.isFlagged && !p.isAnomaly)}
                  fill="#10b981" fillOpacity={0.6} />
                <Scatter name={t('anomalyFlagged')}
                  data={pcaScores.filter(p => p.isFlagged)}
                  fill="#ef4444" fillOpacity={0.85} />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-xs text-zinc-500 mt-2">
              <span>● {t('anomalyNormal')}</span>
              <span className="text-red-400">● {t('anomalyFlagged')}</span>
            </div>
          </div>

          {/* Histogram */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">{t('anomalyHistTitle')}</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={histData} margin={{ top: 5, right: 5, bottom: 15, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="bin" tick={{ fill: '#71717a', fontSize: 9 }}
                  label={{ value: t('anomalyErrorLabel'), position: 'insideBottom', offset: -8, fill: '#71717a', fontSize: 10 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }}
                  label={{ value: t('anomalyCountLabel'), angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }} />
                <Bar dataKey="normal" name={t('anomalyNormal')} fill="#10b981" fillOpacity={0.75} stackId="a" />
                <Bar dataKey="anomaly" name={t('anomalyFlagged')} fill="#ef4444" fillOpacity={0.8} stackId="a" />
                <ReferenceLine x={threshold} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3"
                  label={{ value: `τ=${threshold}`, fill: '#f59e0b', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
