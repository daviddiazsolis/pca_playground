// SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'
import { DATASETS } from '../utils/datasets'
import { fitPCA } from '../utils/pca'

// Only show 2D datasets in preprocessing (blobs2d and correlated4d projected to first 2 features)
const PREP_DATASETS = DATASETS.filter(d => d.id !== 'anomaly3d').map(d => ({
  id: d.id,
  label: d.id === 'blobs2d' ? 'Blobs 2D' : d.id === 'correlated4d' ? 'Correlated 4D' : 'High-Dim 10D',
  points: d.points,
  classes: d.classes,
}))

const COLORS = ['#10b981', '#6366f1', '#f59e0b']
const STEP_ICONS = ['①', '②', '③', '④']

const STEPS = [
  { titleKey: 'prepStepCenterTitle', descKey: 'prepStepCenterDesc' },
  { titleKey: 'prepStepScaleTitle',  descKey: 'prepStepScaleDesc' },
  { titleKey: 'prepStepCovTitle',    descKey: 'prepStepCovDesc' },
  { titleKey: 'prepStepSVDTitle',    descKey: 'prepStepSVDDesc' },
]

export default function PreprocessingSteps() {
  const { t } = useLanguage()
  const [dsId, setDsId] = useState('blobs2d')

  const ds = PREP_DATASETS.find(d => d.id === dsId) ?? PREP_DATASETS[0]
  const X = ds.points.map(p => p.features.slice(0, 2))
  const labels = ds.points.map(p => p.label)

  const { scaledPCA, unscaledPCA, scaledPts, unscaledPts } = useMemo(() => {
    const sPCA = fitPCA(X, true)
    const uPCA = fitPCA(X, false)
    const sPts = sPCA.scores.map((row, i) => ({ x: row[0], y: row[1], label: labels[i] }))
    const uPts = uPCA.scores.map((row, i) => ({ x: row[0], y: row[1], label: labels[i] }))
    return { scaledPCA: sPCA, unscaledPCA: uPCA, scaledPts: sPts, unscaledPts: uPts }
  }, [dsId])  // eslint-disable-line react-hooks/exhaustive-deps

  const pc1Slope = (components: number[][]) =>
    components[0][0] !== 0 ? components[0][1] / components[0][0] : 999

  return (
    <section id="preprocessing" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-zinc-100 mb-3">{t('prepTitle')}</h2>
        <p className="text-zinc-400 mb-8 max-w-3xl">{t('prepSubtitle')}</p>

        {/* Dataset picker */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-sm text-zinc-400">{t('prepDataset')}:</span>
          <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {PREP_DATASETS.map(d => (
              <button
                key={d.id}
                onClick={() => setDsId(d.id)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  dsId === d.id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Side-by-side scatter */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Unscaled */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-orange-400 mb-1">{t('prepBeforeTitle')}</p>
            <p className="text-xs text-zinc-500 mb-3">
              {t('prepPC1Label')} <span className="font-mono">{(unscaledPCA.explainedVarianceRatio[0] * 100).toFixed(1)}%</span>
              {'  ·  '}
              {t('prepPC2Label')} <span className="font-mono">{(unscaledPCA.explainedVarianceRatio[1] * 100).toFixed(1)}%</span>
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="x" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis dataKey="y" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }} />
                {ds.classes.map((cls, ci) => (
                  <Scatter
                    key={cls}
                    name={cls}
                    data={unscaledPts.filter(p => p.label === ci)}
                    fill={COLORS[ci % COLORS.length]}
                    fillOpacity={0.75}
                  />
                ))}
                <ReferenceLine stroke="#f59e0b" strokeWidth={2}
                  segment={[{ x: -6, y: -6 * pc1Slope(unscaledPCA.components) }, { x: 6, y: 6 * pc1Slope(unscaledPCA.components) }]}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Scaled */}
          <div className="rounded-2xl border border-emerald-800/40 bg-zinc-900/40 p-5">
            <p className="text-sm font-medium text-emerald-400 mb-1">{t('prepAfterTitle')}</p>
            <p className="text-xs text-zinc-500 mb-3">
              {t('prepPC1Label')} <span className="font-mono">{(scaledPCA.explainedVarianceRatio[0] * 100).toFixed(1)}%</span>
              {'  ·  '}
              {t('prepPC2Label')} <span className="font-mono">{(scaledPCA.explainedVarianceRatio[1] * 100).toFixed(1)}%</span>
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="x" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis dataKey="y" type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', fontSize: 11 }} />
                {ds.classes.map((cls, ci) => (
                  <Scatter
                    key={cls}
                    name={cls}
                    data={scaledPts.filter(p => p.label === ci)}
                    fill={COLORS[ci % COLORS.length]}
                    fillOpacity={0.75}
                  />
                ))}
                <ReferenceLine stroke="#10b981" strokeWidth={2}
                  segment={[{ x: -6, y: -6 * pc1Slope(scaledPCA.components) }, { x: 6, y: 6 * pc1Slope(scaledPCA.components) }]}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-sm text-zinc-400 italic border-l-2 border-emerald-500/50 pl-4 mb-10">{t('prepNote')}</p>

        {/* Pipeline steps */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <div className="text-2xl font-bold text-emerald-400/60 mb-3 font-mono">{STEP_ICONS[i]}</div>
              <h3 className="text-sm font-semibold text-zinc-100 mb-2">{t(step.titleKey)}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{t(step.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
