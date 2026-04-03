// SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'
import { DATASETS } from '../utils/datasets'
import { fitPCA, reconstruct, reconstructionError } from '../utils/pca'

const DS_OPTIONS = DATASETS.filter(d => d.id !== 'anomaly3d')
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4']

export default function Reconstruction() {
  const { t } = useLanguage()
  const [dsId, setDsId] = useState('correlated4d')
  const [k, setK] = useState(1)

  const ds = DATASETS.find(d => d.id === dsId) ?? DATASETS[1]
  const X = useMemo(() => ds.points.map(p => p.features), [dsId])  // eslint-disable-line react-hooks/exhaustive-deps

  const pca = useMemo(() => fitPCA(X, true), [X])
  const maxK = pca.totalComponents
  const safeK = Math.min(k, maxK)

  const { errors, scatterOrig, scatterRecon } = useMemo(() => {
    const Xrec = reconstruct(pca.scores, pca.components, pca.mean, pca.std, safeK)
    const errs = reconstructionError(X, Xrec)
    const sOrig = X.map((row, i) => ({ x: row[0], y: row[1], label: ds.points[i].label }))
    const sRecon = Xrec.map((row, i) => ({ x: row[0], y: row[1], label: ds.points[i].label }))
    return { errors: errs, scatterOrig: sOrig, scatterRecon: sRecon }
  }, [pca, safeK])  // eslint-disable-line react-hooks/exhaustive-deps

  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length
  const varianceKept = ((pca.cumulativeVariance[safeK - 1] ?? 0) * 100).toFixed(1)

  // Bar chart data: sample errors (first 60 for readability)
  const errorBarData = errors.slice(0, 60).map((e, i) => ({
    idx: i,
    error: +e.toFixed(4),
    fill: COLORS[ds.points[i].label % COLORS.length],
  }))

  return (
    <section id="reconstruction" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-zinc-100 mb-3">{t('reconTitle')}</h2>
        <p className="text-zinc-400 mb-8 max-w-3xl">{t('reconSubtitle')}</p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{t('reconDataset')}:</span>
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              {DS_OPTIONS.map(d => (
                <button key={d.id} onClick={() => { setDsId(d.id); setK(1) }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    dsId === d.id ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}>
                  {d.id === 'blobs2d' ? 'Blobs 2D' : d.id === 'correlated4d' ? 'Correlated 4D' : 'High-Dim 10D'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{t('reconComponents')} (k):</span>
            <input type="range" min={1} max={maxK} value={safeK}
              onChange={e => setK(Number(e.target.value))}
              className="w-32 accent-violet-500" />
            <span className="text-violet-400 font-mono font-bold text-sm w-6">{safeK}</span>
          </div>
        </div>

        {/* Stat badges */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm">
            {t('reconVarianceKept')}: <span className="font-mono font-bold">{varianceKept}%</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm">
            {t('reconAvgError')}: <span className="font-mono font-bold">{avgError.toFixed(4)}</span>
          </div>
        </div>

        <p className="text-sm text-zinc-400 italic border-l-2 border-violet-500/50 pl-4 mb-8">{t('reconNote')}</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Original vs Reconstructed scatter */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">{t('reconScatterTitle')}</p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="x" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis dataKey="y" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }}
                  formatter={(v: number) => v.toFixed(3)} />
                {ds.classes.map((cls, ci) => (
                  <Scatter key={`orig-${cls}`} name={`${t('reconOriginal')} ${cls}`}
                    data={scatterOrig.filter(p => p.label === ci)}
                    fill={COLORS[ci % COLORS.length]} fillOpacity={0.8} shape="circle" />
                ))}
                {ds.classes.map((cls, ci) => (
                  <Scatter key={`recon-${cls}`} name={`${t('reconReconstructed')} ${cls}`}
                    data={scatterRecon.filter(p => p.label === ci)}
                    fill={COLORS[ci % COLORS.length]} fillOpacity={0.35} shape="cross" />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-zinc-500 mt-2">● {t('reconOriginal')}  ✕ {t('reconReconstructed')}</p>
          </div>

          {/* Reconstruction error per sample */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">{t('reconErrorTitle')} (first 60)</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={errorBarData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="idx" tick={{ fill: '#71717a', fontSize: 9 }} label={{ value: t('reconSampleLabel'), position: 'insideBottom', offset: -1, fill: '#71717a', fontSize: 10 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} label={{ value: t('reconErrorLabel'), angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }}
                  formatter={(v: number) => v.toFixed(4)} />
                <Bar dataKey="error" radius={[2, 2, 0, 0]}>
                  {errorBarData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
