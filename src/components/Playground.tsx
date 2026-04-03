// SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Bar, Line,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'
import { DATASETS } from '../utils/datasets'
import { fitPCA } from '../utils/pca'

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4']

const DS_LABELS: Record<string, string> = {
  blobs2d: 'Blobs 2D',
  correlated4d: 'Correlated 4D',
  hd10d: 'High-Dim 10D',
  anomaly3d: 'Anomaly 3D',
}

// Color scale for loadings heatmap
function loadingColor(v: number): string {
  const abs = Math.min(Math.abs(v), 1)
  if (v > 0) return `rgba(16, 185, 129, ${0.2 + abs * 0.7})`
  return `rgba(239, 68, 68, ${0.2 + abs * 0.7})`
}

export default function Playground() {
  const { t } = useLanguage()
  const [dsId, setDsId] = useState('hd10d')
  const [k, setK] = useState(3)
  const [scale, setScale] = useState(true)

  const ds = DATASETS.find(d => d.id === dsId) ?? DATASETS[0]
  const X = useMemo(() => ds.points.map(p => p.features), [dsId])  // eslint-disable-line react-hooks/exhaustive-deps

  const pca = useMemo(() => fitPCA(X, scale), [X, scale])
  const maxK = pca.totalComponents
  const safeK = Math.min(k, maxK)

  const screeData = pca.explainedVarianceRatio.slice(0, maxK).map((v, i) => ({
    name: `PC${i + 1}`,
    individual: +(v * 100).toFixed(1),
    cumulative: +(pca.cumulativeVariance[i] * 100).toFixed(1),
  }))

  const scatterPts = useMemo(() =>
    pca.scores.map((row, i) => ({ x: row[0], y: row[1], label: ds.points[i].label })),
    [pca])  // eslint-disable-line react-hooks/exhaustive-deps

  const cumVariance = ((pca.cumulativeVariance[safeK - 1] ?? 0) * 100).toFixed(1)

  // Loadings table: show first min(safeK, 4) components × all features
  const displayK = Math.min(safeK, 4)

  return (
    <section id="playground" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-zinc-100 mb-3">{t('playgroundTitle')}</h2>
        <p className="text-zinc-400 mb-8 max-w-3xl">{t('playgroundSubtitle')}</p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 mb-8 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{t('playgroundDataset')}:</span>
            <div className="flex gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
              {DATASETS.map(d => (
                <button key={d.id} onClick={() => { setDsId(d.id); setK(2) }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    dsId === d.id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}>
                  {DS_LABELS[d.id]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{t('playgroundComponents')}:</span>
            <input type="range" min={1} max={maxK} value={safeK}
              onChange={e => setK(Number(e.target.value))}
              className="w-28 accent-emerald-500" />
            <span className="text-emerald-400 font-mono font-bold w-6">{safeK}</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={scale} onChange={e => setScale(e.target.checked)}
              className="accent-emerald-500 w-4 h-4" />
            <span className="text-sm text-zinc-300">{t('playgroundScale')}</span>
          </label>
        </div>

        {/* Variance badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-8">
          <span className="font-mono text-lg font-bold">{cumVariance}%</span>
          <span className="text-zinc-400">{t('playgroundVariance')}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 2D Scatter */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">{t('playgroundScatter2D')}</p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="x" type="number" tick={{ fill: '#71717a', fontSize: 10 }}
                  label={{ value: 'PC1', position: 'insideBottom', offset: -2, fill: '#71717a', fontSize: 11 }} />
                <YAxis dataKey="y" type="number" tick={{ fill: '#71717a', fontSize: 10 }}
                  label={{ value: 'PC2', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }}
                  formatter={(v: number) => v.toFixed(3)} />
                {ds.classes.map((cls, ci) => (
                  <Scatter key={cls} name={cls}
                    data={scatterPts.filter(p => p.label === ci)}
                    fill={COLORS[ci % COLORS.length]} fillOpacity={0.75} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Scree */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">Scree Plot</p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={screeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis yAxisId="l" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
                <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 12 }}
                  formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar yAxisId="l" dataKey="individual" fill="#6366f1" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Line yAxisId="r" type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loadings heatmap */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <p className="text-sm font-medium text-zinc-300 mb-2">{t('playgroundLoadings')}</p>
          <p className="text-xs text-zinc-500 mb-4">{t('playgroundLoadingsDesc')}</p>
          <div className="overflow-x-auto">
            <table className="text-xs min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-zinc-400 py-1 pr-4 font-medium">{t('playgroundFeature')}</th>
                  {Array.from({ length: displayK }, (_, i) => (
                    <th key={i} className="text-center text-zinc-300 py-1 px-3 font-mono">PC{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ds.featureNames.map((feat, fi) => (
                  <tr key={feat} className="border-t border-zinc-800/50">
                    <td className="text-zinc-400 py-1.5 pr-4 font-mono">{feat}</td>
                    {Array.from({ length: displayK }, (_, ci) => {
                      const v = pca.components[ci]?.[fi] ?? 0
                      return (
                        <td key={ci} className="text-center py-1.5 px-3 font-mono font-medium rounded"
                          style={{ background: loadingColor(v), color: Math.abs(v) > 0.4 ? '#f4f4f5' : '#a1a1aa' }}>
                          {v.toFixed(3)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
