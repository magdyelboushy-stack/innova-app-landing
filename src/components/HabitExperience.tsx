import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import TechText from './TechText'
import { IPhoneFrame } from './IPhoneFrame'
import dailyHabitScreen from '../../design-refs/3 · Daily habit.png'

gsap.registerPlugin(ScrollTrigger)

type Language = 'en' | 'ar'

const TOTAL = 3 // عدد خطوات المهمة (1 / 3 ... 3 / 3)

const copy = {
  en: { eyebrow: 'HABIT', first: 'Three minutes,', second: 'every day.', body: 'One small money move a day builds a habit that sticks.', today: 'TODAY’S MINI-MISSION', mission: 'Split 30 coins', streak: 'DAY STREAK', pending: 'Finish all 3 steps to keep your streak.', done: 'You showed up today.' },
  ar: { eyebrow: 'عادات', first: '3 دقايق،', second: 'كل يوم.', body: 'خطوة فلوس صغيرة كل يوم بتعمل عادة بتكمل.', today: 'مهمة النهارده', mission: 'قسّم 30 عملة', streak: 'أيام متتالية', pending: 'خلّص الـ 3 خطوات عشان تحافظ على عادتك.', done: 'إنت كملت النهارده.' },
}

export function HabitExperience({ lang }: { lang: Language }) {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const [done, setDone] = useState(reducedMotion ? TOTAL : 0)
  const t = copy[lang]
  const align = lang === 'ar' ? 'right' : 'left'
  const finished = done >= TOTAL
  const screenViewBox = finished ? '80 235 390 844' : '550 235 390 844'

  // Desktop -> section is PINNED: text grows, card appears, then the ring fills
  //            1/3 -> 2/3 -> 3/3 and today's day turns green. The page moves on only after that.
  // Mobile  -> no pin (stacked layout is taller than the screen), same animation on normal scroll.
  useLayoutEffect(() => {
    const section = ref.current
    if (reducedMotion || !section) return

    const q = gsap.utils.selector(section)
    const origin = lang === 'ar' ? 'right center' : 'left center'
    const mm = gsap.matchMedia()

    const reveal = (tl: gsap.core.Timeline) => {
      // The app screen is the visual anchor of this section; never leave an empty right side
      // while the type reveal is still progressing.
      gsap.set(q('.habit-phone'), { autoAlpha: 1, y: 0, rotate: 0 })
      tl.fromTo(
        q('.habit-experience__copy > *'),
        { autoAlpha: 0, y: 28, scale: 0.3, transformOrigin: origin },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1, stagger: 0.22, ease: 'power2.out' },
      )
    }

    mm.add('(min-width: 761px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=420%',       // طول الـ scroll كله: زوّده لو عاوز أبطأ
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: () => {
            const local = tl.time() - stepsStart
            const n = Math.max(0, Math.min(TOTAL, Math.floor(local)))
            setDone((prev) => (prev === n ? prev : n))
          },
        },
      })

      reveal(tl)
      const stepsStart = tl.duration() + 0.2
      tl.to({}, { duration: TOTAL }, stepsStart)
      tl.to({}, { duration: 0.6 }, stepsStart + TOTAL) // وقفة قصيرة على 3/3 قبل ما يتفك الـ pin
    })

    mm.add('(max-width: 760px)', () => {
      const intro = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 25%', scrub: 0.7 } })
      reveal(intro)

      ScrollTrigger.create({
        trigger: section,
        start: 'top 45%',
        end: 'bottom 75%',
        onUpdate: (self) => {
          const n = Math.min(TOTAL, Math.floor(self.progress * TOTAL + 0.001))
          setDone((prev) => (prev === n ? prev : n))
        },
      })
    })

    return () => mm.revert()
  }, [reducedMotion, lang])

  // Small pop when the mission gets completed.
  useLayoutEffect(() => {
    if (reducedMotion || !ref.current || done < TOTAL) return
    const context = gsap.context(() => {
      const frame = ref.current?.querySelector('.habit-phone .iphone-frame')
      if (frame) gsap.fromTo(frame, { scale: .94 }, { scale: 1, duration: .5, ease: 'back.out(2)' })
    }, ref)
    return () => context.revert()
  }, [done, reducedMotion])

  return <section ref={ref} className="habit-experience habit-baloo" aria-labelledby="habit-title">
    <div className="habit-experience__glow" aria-hidden="true" />
    <div className="habit-experience__copy">
      {lang === 'ar' ? <div className="habit-arabic-copy">
        <p>{t.eyebrow}</p>
        <h2 id="habit-title"><span>{t.first}</span><em>{t.second}</em></h2>
        <b>{t.body}</b>
      </div> : <>
        <div className="sr-only"><p>{t.eyebrow}</p><h2 id="habit-title">{t.first} {t.second}</h2><p>{t.body}</p></div>
        <div className="habit-tech habit-tech--eyebrow" aria-hidden="true"><TechText key={`e-${lang}`} text={t.eyebrow} fontWeight={800} fontSize={40} color="#12424c" accentColor="#fb7b64" reveal="letter" intro="none" align={align} guides={false} labels={false} selection={false} draggable={false} sweep={false} /></div>
        <div className="habit-tech habit-tech--title" aria-hidden="true"><TechText key={`f-${lang}`} text={t.first} fontWeight={800} fontSize={104} color="#12424c" accentColor="#fb7b64" reveal="letter" intro="none" align={align} clickKick draggable sweep /></div>
        <div className="habit-tech habit-tech--title" aria-hidden="true"><TechText key={`s-${lang}`} text={t.second} fontWeight={800} fontSize={104} color="#fb7b64" accentColor="#12424c" reveal="letter" intro="none" align={align} clickKick draggable sweep /></div>
        <p className="habit-experience__body">{t.body}</p>
      </>}
    </div>

    <div className="habit-phone" aria-live="polite">
      <IPhoneFrame screenshot={dailyHabitScreen} viewBox={screenViewBox} label={lang === 'en' ? 'Okto daily habit app screen' : 'شاشة العادة اليومية في أوكتو'} />
    </div>
  </section>
}
