// SPDX-License-Identifier: Apache-2.0
import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Grid2x2, ArrowRight, Layers, BarChart2 } from 'lucide-react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'
import { fitPCA } from '../utils/pca'

// Correlated 2D data for the rotation demo (fixed, seeded inline)
function genDemoData() {
  const pts: { x: number; y: number }[] = []
  // Simple LCG
  let s = 314159
  const r = () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0xffffffff }
  const n = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r())
  for (let i = 0; i < 80; i++) {
    const t = n() * 1.5
    pts.push({ x: t + n() * 0.4, y: 0.8 * t + n() * 0.4 })
  }
  return pts
}

const DEMO_PTS = genDemoData()

const THEORY_CARDS = [
  { key: 'theoryCov',    icon: Grid2x2,  color: 'text-emerald-400' },
  { key: 'theoryEigen',  icon: ArrowRight, color: 'text-blue-400' },
  { key: 'theoryEigenval', icon: Layers,  color: 'text-violet-400' },
  { key: 'theoryProject', icon: BarChart2, color: 'text-orange-400' },
] as const

export default function Theory() {
  const { t } = useLanguage()
  const [angle, setAngle] = useState(0)

  const pc1AngleDeg = useMemo(() => {
    const X = DEMO_PTS.map(p => [p.x, p.y])
    const pca = fitPCA(X, false)
    const [dx, dy] = pca.components[0]
    return (Math.atan2(dy, dx) * 180) / Math.PI
  }, [])

  const projectedVariance = useMemo(() => {
    const rad = (angle * Math.PI) / 180
    const projs = DEMO_PTS.map(p => p.x * Math.cos(rad) + p.y * Math.sin(rad))
    const mean = projs.reduce((a, b) => a + b, 0) / projs.length
    return projs.reduce((s, v) => s + (v - mean) ** 2, 0) / (projs.length - 1)
  }, [angle])

  const maxVariance = useMemo(() => {
    const rad = (pc1AngleDeg * Math.PI) / 180
    const projs = DEMO_PTS.map(p => p.x * Math.cos(rad) + p.y * Math.sin(rad))
    const mean = projs.reduce((a, b) => a + b, 0) / projs.length
    return projs.reduce((s, v) => s + (v - mean) ** 2, 0) / (projs.length - 1)
  }, [pc1AngleDeg])

  const atMax = Math.abs(angle - pc1AngleDeg) < 6 || Math.abs(angle - pc1AngleDeg - 180) < 6 || Math.abs(angle - pc1AngleDeg + 180) < 6

  const slope = Math.tan((angle * Math.PI) / 180)

  return (
    <section id="theory" className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50 scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-zinc-100 mb-3">{t('theoryTitle')}</h2>
        <p className="text-zinc-400 mb-10 max-w-3xl">{t('theorySubtitle')}</p>

        {/* Interactive rotation demo */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 mb-10">
          <p className="text-sm text-zinc-400 mb-4">{t('theoryHint')}</p>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* Scatter + axis line */}
            <div>
              <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wide">{t('theoryRotateLabel')}</p>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="x" type="number" domain={[-5, 5]} tick={{ fill: '#71717a', fontSize: 11 }} />
                  <YAxis dataKey="y" type="number" domain={[-4, 4]} tick={{ fill: '#71717a', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7' }} />
                  <Scatter data={DEMO_PTS} fill="#6d7ae2" fillOpacity={0.7} />
                  {/* User axis */}
                  <ReferenceLine
                    stroke={atMax ? '#10b981' : '#60a5fa'}
                    strokeWidth={2}
                    segment={[{ x: -5, y: -5 * slope }, { x: 5, y: 5 * slope }]}
                  />
                  {/* True PC1 */}
                  <ReferenceLine
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    segment={[
                      { x: -5, y: -5 * Math.tan((pc1AngleDeg * Math.PI) / 180) },
                      { x: 5, y: 5 * Math.tan((pc1AngleDeg * Math.PI) / 180) },
                    ]}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Controls + stats */}
            <div className="space-y-6">
              <div>
                <label className="text-sm text-zinc-300 font-medium">
                  {t('theoryAngle')}: <span className="text-emerald-400 font-mono">{angle}°</span>
                </label>
                <input
                  type="range" min={-90} max={90} value={angle}
                  onChange={e => setAngle(Number(e.target.value))}
                  className="w-full mt-2 accent-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">{t('theoryProjectedVar')}</span>
                  <span className={`font-mono font-bold ${atMax ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {projectedVariance.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">{t('theoryMaxVar')} ({pc1AngleDeg.toFixed(1)}°)</span>
                  <span className="font-mono font-bold text-emerald-400">{maxVariance.toFixed(3)}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${atMax ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (projectedVariance / maxVariance) * 100).toFixed(1)}%` }}
                  />
                </div>
                {atMax && (
                  <p className="text-emerald-400 text-xs font-medium">✓ Maximum variance captured!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Concept cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {THEORY_CARDS.map(({ key, icon: Icon, color }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
            >
              <Icon className={`w-5 h-5 ${color} mb-3`} />
              <h3 className="text-sm font-semibold text-zinc-100 mb-2">{t(`${key}Title`)}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{t(`${key}Desc`)}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
