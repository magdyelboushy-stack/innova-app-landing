import { ArrowUpRight, LockKeyhole, PiggyBank, ShoppingBag } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import TechText from './TechText'
import { IPhoneFrame } from './IPhoneFrame'
import { SeaDecor } from './SeaDecor'
import saveScreen from '../../design-refs/4 · Save.png'
import souqScreen from '../../design-refs/5 · Souq.png'
import parentScreen from '../../design-refs/9 · Parent home.png'

gsap.registerPlugin(ScrollTrigger)

type Language = 'en' | 'ar'
type StoryKind = 'save' | 'souq' | 'parents'

type Story = { kicker: string; title: string; accent: string; body: string; badge: string; icon: typeof PiggyBank; screen: string; imageWidth: number; imageHeight: number; viewBox: string }

const stories: Record<Language, Record<StoryKind, Story>> = {
  en: {
    save: { kicker: '03 / SAVE', title: 'Feel the goal', accent: 'get closer.', body: 'Every coin gets a job, and every small save makes tomorrow feel possible.', badge: 'Goal unlocked', icon: PiggyBank, screen: saveScreen, imageWidth: 2900, imageHeight: 2366, viewBox: '80 235 390 844' },
    souq: { kicker: '04 / SOUQ', title: 'Spend or', accent: 'save?', body: 'A real choice, a safe place to try it, and a story that changes with every decision.', badge: 'Your call', icon: ShoppingBag, screen: souqScreen, imageWidth: 1700, imageHeight: 2366, viewBox: '80 235 390 844' },
    parents: { kicker: '05 / PARENTS', title: 'Clear. Calm.', accent: 'In control.', body: 'See progress, celebrate habits, and keep every money moment parent-safe.', badge: 'Parent view', icon: LockKeyhole, screen: parentScreen, imageWidth: 5250, imageHeight: 2428, viewBox: '80 235 390 844' },
  },
  ar: {
    save: { kicker: '03 / تحويش', title: 'حس إن هدفك', accent: 'بيقرّب.', body: 'كل عملة ليها شغلة، وكل تحويشة صغيرة بتقرّبك من اللي نفسك فيه.', badge: 'هدف جديد', icon: PiggyBank, screen: saveScreen, imageWidth: 2900, imageHeight: 2366, viewBox: '80 1419 390 844' },
    souq: { kicker: '04 / السوق', title: 'تصرف ولا', accent: 'تحوّش؟', body: 'قرار حقيقي في مساحة آمنة، وحكاية بتتغير مع كل اختيار.', badge: 'اختيارك', icon: ShoppingBag, screen: souqScreen, imageWidth: 1700, imageHeight: 2366, viewBox: '80 1419 390 844' },
    parents: { kicker: '05 / للأهل', title: 'واضح. هادي.', accent: 'وتحت السيطرة.', body: 'تابع التقدّم، احتفل بالعادات، وخلي كل خطوة فلوس آمنة ومفهومة.', badge: 'لوحة الأهل', icon: LockKeyhole, screen: parentScreen, imageWidth: 5250, imageHeight: 2428, viewBox: '80 1419 390 844' },
  },
}

// ألوان الـ canvas (TechText مش بيفهم var(--...)) — نفس قيم الـ CSS variables
const PAPER = '#fffbf5'
const LIME = '#d6fe51'
const CORAL = '#fb7b64'
const accentColor: Record<StoryKind, string> = { save: CORAL, souq: CORAL, parents: LIME }

export function AppStorySection({ kind, lang }: { kind: StoryKind; lang: Language }) {
  const ref = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const story = stories[lang][kind]
  const Icon = story.icon
  const align = lang === 'ar' ? 'right' : 'left'
  const accent = accentColor[kind]

  // Desktop -> section is PINNED: text grows, orb + phone arrive, then the phone keeps
  //            drifting while you scroll. The page moves on only when the story is done.
  // Mobile  -> no pin (stacked layout is taller than the screen): same animation, normal scroll.
  useLayoutEffect(() => {
    const section = ref.current
    if (!section || reducedMotion) return

    const q = gsap.utils.selector(section)
    const origin = lang === 'ar' ? 'right center' : 'left center'
    const startRot = kind === 'souq' ? -10 : 10
    const finalRot = kind === 'souq' ? -3 : 3
    const mm = gsap.matchMedia()

    const intro = (tl: gsap.core.Timeline) => {
      tl.fromTo(
        q('.app-story__copy > *'),
        { autoAlpha: 0, y: 28, scale: 0.3, transformOrigin: origin },
        { autoAlpha: 1, y: 0, scale: 1, duration: 1, stagger: 0.22, ease: 'power2.out' },
      )
        .fromTo(q('.app-story__orb'), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 1.2, ease: 'power2.out' }, 0)
        .fromTo(q('.app-story__phone'), { autoAlpha: 0, y: 90, rotate: startRot }, { autoAlpha: 1, y: 0, rotate: finalRot, duration: 1.1, ease: 'back.out(1.35)' }, 0.4)
    }

    mm.add('(min-width: 761px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=260%',       // طول الـ scroll كله: زوّده لو عاوز أبطأ
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      intro(tl)
      // حركة تكمّل مع الـ scroll وإنت واقف في الـ section
      tl.to(q('.app-story__phone'), { y: -26, rotate: finalRot * 0.2, duration: 2, ease: 'none' }, '+=0.2')
        .to(q('.app-story__orb'), { scale: 1.12, duration: 2, ease: 'none' }, '<')
    })

    mm.add('(max-width: 760px)', () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 25%', scrub: 0.7 } })
      intro(tl)
    })

    return () => mm.revert()
  }, [kind, lang, reducedMotion])

  return <section ref={ref} id={kind === 'parents' ? 'parents' : undefined} className={`app-story app-story--${kind}`} aria-labelledby={`story-${kind}`}>
    <SeaDecor tone={kind === 'parents' ? 'green' : kind === 'save' ? 'teal' : 'dark'} places={kind === 'souq' ? ['br', 'tl'] : ['bl', 'tr']} />
    <div className="app-story__copy">
      {/* Real text for screen readers / SEO, because TechText is drawn on a canvas */}
      <div className="sr-only"><p>{story.kicker}</p><h2 id={`story-${kind}`}>{story.title} {story.accent}</h2><p>{story.body}</p></div>

      <div className="app-story-tech app-story-tech--eyebrow" aria-hidden="true">
        <TechText key={`k-${lang}-${kind}`} text={story.kicker} fontWeight={800} fontSize={40} color={LIME} accentColor={LIME} letterSpacing={0.1} reveal="letter" intro="none" align={align} guides={false} labels={false} selection={false} draggable={false} sweep={false} />
      </div>
      <div className="app-story-tech app-story-tech--title" aria-hidden="true">
        <TechText key={`t-${lang}-${kind}`} text={story.title} fontWeight={800} fontSize={96} color={PAPER} accentColor={accent} letterSpacing={-0.05} reveal="letter" intro="none" align={align} guides={false} labels={false} clickKick draggable sweep />
      </div>
      <div className="app-story-tech app-story-tech--title" aria-hidden="true">
        <TechText key={`a-${lang}-${kind}`} text={story.accent} fontWeight={800} fontSize={96} color={accent} accentColor={PAPER} letterSpacing={-0.05} reveal="letter" intro="none" align={align} guides={false} labels={false} clickKick draggable sweep />
      </div>

      <b>{story.body}</b>
      <div className="app-story__badge"><Icon size={18} /><span>{story.badge}</span><ArrowUpRight size={16} /></div>
    </div>
    <div className="app-story__visual">
      <div className="app-story__orb" aria-hidden="true" />
      <IPhoneFrame className="app-story__phone" screenshot={story.screen} imageWidth={story.imageWidth} imageHeight={story.imageHeight} viewBox={story.viewBox} label={story.badge} />
    </div>
  </section>
}