// SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'
import { DATASETS } from '../utils/datasets'
import { fitPCA } from '../utils/pca'

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4']

const DS_OPTIONS = DATASETS.filter(d => d.id !== 'anomaly3d')

export default function VarianceExplained() {
  const { t } = useLanguage()
  const [dsId, setDsId] = useState('correlated4d')
  const [k, setK] = useState(2)

  const ds = DATASETS.find(d => d.id === dsId) ?? DATASETS[0]
  const X = useMemo(() => ds.points.map(p => p.features), [dsId])  // eslint-disable-line react-hooks/exhaustive-deps

  const pca = useMemo(() => fitPCA(X, true), [X])

  const maxK = pca.totalComponents
  const safeK = Math.min(k, maxK)

  const screeData = pca.explainedVarianceRatio.slice(0, maxK).map((v, i) => ({
    name: `PC${i + 1}`,
    individual: +(v * 100).toFixed(1),
    cumulative: +(pca.cumulativeVariance[i] * 100).toFixed(1),
  }))

  const scatterPts = useMemo(() =>
    pca.scores.map((row, i) => ({
      x: row[0],
      y: row[1],
      label: ds.points[i].label,
    })), [pca])

  const cumExplained = ((pca.cumulativeVariance[safeK - 1] ?? 0) * 100).toFixed(1)

  return (
    <section id="variance" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-zinc-100 mb-3">{t('varianceTitle')}</h2>
        <p className="text-zinc-400 mb-8 max-w-3xl">{t('varianceSubtitle')}</p>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{t('varianceDataset')}:</span>
            <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
              {DS_OPTIONS.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setDsId(d.id); setK(2) }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    dsId === d.id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d.id === 'blobs2d' ? 'Blobs 2D' : d.id === 'correlated4d' ? 'Correlated 4D' : 'High-Dim 10D'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{t('varianceComponents')}:</span>
            <input
              type="range" min={1} max={maxK} value={safeK}
              onChange={e => setK(Number(e.target.value))}
              className="w-32 accent-emerald-500"
            />
            <span className="text-emerald-400 font-mono font-bold text-sm w-6">{safeK}</span>
          </div>
        </div>

        {/* Stat badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium mb-8">
          <span className="font-mono text-lg font-bold">{cumExplained}%</span>
          <span className="text-zinc-400">{t('varianceCaptured')} {safeK} {t('varianceComponents2')}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scree plot */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">{t('varianceScreeTitle')}</p>
            <p className="text-xs text-zinc-500 mb-3 italic">{t('varianceElbowHint')}</p>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={screeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis yAxisId="left" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name === 'individual' ? t('varianceIndLabel') : t('varianceCumLabel')]}
                />
                <Bar yAxisId="left" dataKey="individual" fill="#6366f1" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                {/* Mark chosen k */}
                <ReferenceLine yAxisId="left" x={`PC${safeK}`} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 2D projection */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-zinc-300 mb-4">
              {t('varianceProjection')}
              <span className="ml-2 text-xs text-zinc-500">
                (PC1: {(pca.explainedVarianceRatio[0] * 100).toFixed(1)}%, PC2: {(pca.explainedVarianceRatio[1] * 100).toFixed(1)}%)
              </span>
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="x" type="number" name={t('variancePC1')} tick={{ fill: '#71717a', fontSize: 10 }} label={{ value: t('variancePC1'), position: 'insideBottom', offset: -2, fill: '#71717a', fontSize: 11 }} />
                <YAxis dataKey="y" type="number" name={t('variancePC2')} tick={{ fill: '#71717a', fontSize: 10 }} label={{ value: t('variancePC2'), angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 11 }} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }}
                  formatter={(v: number) => v.toFixed(3)}
                />
                {ds.classes.map((cls, ci) => (
                  <Scatter
                    key={cls}
                    name={cls}
                    data={scatterPts.filter(p => p.label === ci)}
                    fill={COLORS[ci % COLORS.length]}
                    fillOpacity={0.75}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
