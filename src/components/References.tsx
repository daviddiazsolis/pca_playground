// SPDX-License-Identifier: Apache-2.0
import { useLanguage } from '../context/LanguageContext'

const LINKS = [
  { key: 'refLink1', href: 'https://scikit-learn.org/stable/modules/decomposition.html#pca' },
  { key: 'refLink2', href: 'https://www.youtube.com/watch?v=FgakZw6K1QQ' },
  { key: 'refLink3', href: 'https://towardsdatascience.com/understanding-pca-fae3e243731d' },
  { key: 'refLink4', href: 'https://setosa.io/ev/principal-component-analysis/' },
]

export default function References() {
  const { t } = useLanguage()

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto border-t border-zinc-800/50">
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">{t('refTitle')}</h2>
      <ul className="list-disc list-inside space-y-3 text-zinc-400 marker:text-zinc-600">
        <li>{t('refBook1')}</li>
        <li>{t('refBook2')}</li>
        {LINKS.map(({ key, href }) => (
          <li key={key}>
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-emerald-500 hover:text-emerald-400 transition-colors">
              {t(key)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
