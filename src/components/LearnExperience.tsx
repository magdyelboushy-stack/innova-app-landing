import { BriefcaseBusiness, Coins, ReceiptText, ShoppingBag } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import TechText from './TechText'
import { IPhoneFrame } from './IPhoneFrame'
import learnScreen from '../../design-refs/2 · Learn.png'

type Language = 'en' | 'ar'

type Stage = {
  label: string
  title: string
  note: string
  amount: string
  icon: typeof BriefcaseBusiness
}

const stages: Record<Language, Stage[]> = {
  en: [
    { label: 'EARN', title: 'Help at home', note: 'Coins earned', amount: '+ 20', icon: BriefcaseBusiness },
    { label: 'PLAN', title: 'Make a choice', note: 'Goal first', amount: '20', icon: ReceiptText },
    { label: 'SAVE', title: 'Keep it growing', note: 'Future fund', amount: '15', icon: Coins },
    { label: 'SPEND', title: 'Pick a treat', note: 'Joy budget', amount: '5', icon: ShoppingBag },
  ],
  ar: [
    { label: 'اكسب', title: 'ساعد في البيت', note: 'عملة اتجمعت', amount: '+ 20', icon: BriefcaseBusiness },
    { label: 'خطط', title: 'اختار بذكاء', note: 'الهدف الأول', amount: '20', icon: ReceiptText },
    { label: 'حوش', title: 'خلّيها تكبر', note: 'للمستقبل', amount: '15', icon: Coins },
    { label: 'اصرف', title: 'اختار مكافأتك', note: 'ميزانية فرحة', amount: '5', icon: ShoppingBag },
  ],
}

const copy = {
  en: {
    eyebrow: 'LEARN',
    title: ['Follow', 'the money.'],
    lead: 'Watch one coin travel through a real story.',
  },
  ar: {
    eyebrow: 'تعلّم',
    title: ['امشي مع', 'الفلوس.'],
    lead: 'شوف العملة وهي ماشية في حكاية من الحياة بجد.',
  },
}

gsap.registerPlugin(ScrollTrigger)

export function LearnExperience({ lang }: { lang: Language }) {
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const steps = stages[lang]
  const stage = steps[active]
  const StageIcon = stage.icon
  const t = copy[lang]
  const align = lang === 'ar' ? 'right' : 'left'
  const screenViewBox = lang === 'ar' ? '80 1419 390 844' : '80 235 390 844'

  // One scroll story:
  // desktop -> the section is PINNED. Text grows, then EARN -> PLAN -> SAVE -> SPEND,
  //            and the page only moves on after SPEND is done.
  // mobile  -> the stacked layout is taller than the screen, so no pin: normal scroll.
  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || reducedMotion) return

    const q = gsap.utils.selector(section)
    const origin = lang === 'ar' ? 'right center' : 'left center'
    const count = steps.length
    const mm = gsap.matchMedia()

    const revealTween = (tl: gsap.core.Timeline) => {
      tl.fromTo(
        q('.learn-experience__reveal > *'),
        { autoAlpha: 0, scale: 0.25, y: 40, transformOrigin: origin },
        { autoAlpha: 1, scale: 1, y: 0, duration: 1, stagger: 0.3, ease: 'power2.out' },
      ).fromTo(q('.learn-timeline'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=.5')
    }

    mm.add('(min-width: 761px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=450%',      // طول الـ scroll كله: زوّده لو عاوز أبطأ
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: () => {
            const local = tl.time() - stepsStart
            const i = Math.max(0, Math.min(count - 1, Math.floor(local)))
            setActive((prev) => (prev === i ? prev : i))
          },
        },
      })

      revealTween(tl)
      tl.fromTo(q('.learn-device'), { autoAlpha: 0, rotateY: -9, y: 24 }, { autoAlpha: 1, rotateY: 0, y: 0, duration: 0.9, ease: 'back.out(1.35)' }, 0.4)

      // After the intro, each stage owns 1 unit of scroll. SPEND is the last unit,
      // so the pin releases only once it is done.
      const stepsStart = tl.duration() + 0.2
      tl.to({}, { duration: count }, stepsStart)
      tl.eventCallback('onReverseComplete', () => setActive(0))
    })

    mm.add('(max-width: 760px)', () => {
      const reveal = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 15%', scrub: 0.8 },
      })
      revealTween(reveal)

      gsap.fromTo(q('.learn-device'), { autoAlpha: 0, y: 24 }, {
        autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 64%', toggleActions: 'play none none reverse' },
      })

      ScrollTrigger.create({
        trigger: section,
        start: 'top 68%',
        end: 'bottom 35%',
        onUpdate: (self) => setActive(Math.min(count - 1, Math.floor(self.progress * count))),
      })
    })

    return () => mm.revert()
  }, [reducedMotion, lang, steps.length])

  // Small pop on the card and coin every time the stage changes.
  useLayoutEffect(() => {
    if (reducedMotion || !sectionRef.current) return
    const context = gsap.context(() => {
      gsap.fromTo('.learn-iphone', { autoAlpha: 0, y: 12, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: 'power3.out' })
      gsap.fromTo('.learn-coin', { rotateY: -120, scale: 0.7 }, { rotateY: 0, scale: 1, duration: 0.55, ease: 'back.out(1.8)' })
    }, sectionRef)
    return () => context.revert()
  }, [active, reducedMotion])

  return <section ref={sectionRef} id="learn" className="learn-experience" aria-labelledby="learn-title">
    <div className="learn-experience__halo" aria-hidden="true" />
    <div className="learn-experience__intro">
      <div className="learn-experience__reveal">
        {lang === 'ar' ? <div className="learn-arabic-copy">
          <p>{t.eyebrow}</p>
          <h2 id="learn-title"><span>{t.title[0]}</span><em>{t.title[1]}</em></h2>
          <b>{t.lead}</b>
        </div> : <>
          {/* Real text for screen readers / SEO, because TechText is drawn on a canvas */}
          <div className="sr-only"><p>{t.eyebrow}</p><h2 id="learn-title">{t.title.join(' ')}</h2><p>{t.lead}</p></div>
          <div aria-hidden="true">
            <div className="learn-tech learn-tech--eyebrow"><TechText key={`eyebrow-${lang}`} text={t.eyebrow} fontSize={44} fontWeight={800} reveal="letter" intro="none" color="#d6fe51" accentColor="#d6fe51" letterSpacing={0.1} align={align} guides={false} labels={false} selection={false} draggable={false} sweep={false} /></div>
            {t.title.map((line) => <div className="learn-tech learn-tech--title" key={`${lang}-${line}`}><TechText text={line} fontSize={110} fontWeight={800} reveal="letter" intro="none" color="currentColor" accentColor="#d6fe51" letterSpacing={-0.05} align={align} guides={false} labels={false} clickKick draggable sweep /></div>)}
            <div className="learn-tech learn-tech--lead"><TechText key={`lead-${lang}`} text={t.lead} fontSize={34} fontWeight={700} reveal="letter" intro="none" color="currentColor" accentColor="#d6fe51" align={align} guides={false} labels={false} selection={false} draggable={false} sweep={false} /></div>
          </div>
        </>}
      </div>

      <div className="learn-timeline" aria-label={lang === 'en' ? 'Money journey stages' : 'مراحل رحلة الفلوس'}>
        {steps.map((item, index) => {
          const Icon = item.icon
          const selected = active === index
          return <div key={item.label} aria-current={selected ? 'step' : undefined} className={selected ? 'is-active' : ''}>
            <span><Icon size={16} strokeWidth={2.4} /></span><b>{item.label}</b>
          </div>
        })}
      </div>
    </div>

    <div className="learn-device learn-device--screen" aria-live="polite">
      <IPhoneFrame className="learn-iphone" screenshot={learnScreen} viewBox={screenViewBox} imageWidth={5720} imageHeight={2366} label={lang === 'en' ? 'Okto Learn app screen' : 'شاشة تعلّم أوكتو'} />
      <div className="learn-screen-status"><StageIcon size={16} /><span>{stage.label}</span><b>{active + 1} / {steps.length}</b></div>
      <div className="learn-coin" aria-hidden="true"><Coins size={31} strokeWidth={2.4} /><i /></div>
    </div>
  </section>
}
