import type { HeroCopy, Locale } from '../i18n/copy'
import { LangToggle } from './LangToggle'
import { OktoRive } from './OktoRive'
import { PhoneMockup } from './PhoneMockup'
import { motion, useScroll, useTransform } from 'motion/react'

export function Hero({
  copy,
  locale,
  onLocaleChange,
}: {
  copy: HeroCopy
  locale: Locale
  onLocaleChange: (locale: Locale) => void
}) {
  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, 900], [1, 0.7])
  const x = useTransform(scrollY, [0, 900], [0, 110])

  return (
    <section
      className="hero"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      aria-labelledby="hero-title"
    >
      <header className="hero__topbar">
        <a className="hero__wordmark" href="#top" aria-label="Okto home">
          okto
        </a>
        <LangToggle locale={locale} onChange={onLocaleChange} />
      </header>

      <div className="hero__content" id="top">
        <div className="hero__copy">
          <p className="hero__eyebrow">{copy.eyebrow}</p>
          <h1 className="hero__title" id="hero-title">
            <span>{copy.titleLead}</span>{' '}
            <span className="hero__title-accent">{copy.titleAccent}</span>
          </h1>
          <p className="hero__description">{copy.description}</p>
          <div className="hero__actions">
            <a className="hero__cta hero__cta--primary" href="#get-the-app">
              {copy.primaryCta}
            </a>
            <a className="hero__cta hero__cta--secondary" href="#jar-rush">
              {copy.secondaryCta}
            </a>
          </div>
          <ul className="hero__trust">
            {copy.trust.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <motion.div
          className="hero__visual"
          style={{ scale, x }}
          aria-label="Okto and a lesson preview"
        >
          <span className="hero__coin hero__coin--one" aria-hidden="true">
            o
          </span>
          <span className="hero__coin hero__coin--two" aria-hidden="true">
            o
          </span>
          <OktoRive className="hero__okto" />
          <PhoneMockup className="hero__phone" alt={copy.phoneAlt} />
        </motion.div>
      </div>

      <span className="hero__scroll-cue">
        <b>↓</b>
        {copy.scrollCue}
        <i />
        <i />
        <i />
      </span>
    </section>
  )
}
