// SPDX-License-Identifier: Apache-2.0
import { motion } from 'motion/react'
import { TrendingDown, Eye, AlertTriangle, RefreshCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const TAGS = [
  { key: 'heroTag1', icon: TrendingDown, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  { key: 'heroTag2', icon: Eye,          color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  { key: 'heroTag3', icon: AlertTriangle, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  { key: 'heroTag4', icon: RefreshCw,    color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
] as const

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section className="relative py-20 px-6 overflow-hidden border-b border-zinc-800/50">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a22_1px,transparent_1px),linear-gradient(to_bottom,#27272a22_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-6">
            <TrendingDown className="w-3.5 h-3.5" />
            PCA · Principal Component Analysis
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-zinc-100 mb-4 leading-tight">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-emerald-400 font-medium mb-4">{t('heroSubtitle')}</p>
          <p className="text-zinc-400 max-w-2xl text-lg leading-relaxed mb-10">{t('heroDesc')}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            {TAGS.map(({ key, icon: Icon, color }) => (
              <span
                key={key}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(key)}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
