import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowDown, ArrowRight, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { LearnExperience } from './LearnExperience'
import { HabitExperience } from './HabitExperience'
import { IPhoneFrame } from './IPhoneFrame'

const scenes = { en: [['LEARN', 'Follow the money.', 'Watch one coin travel through a real story.'], ['HABIT', 'Three minutes, every day.', 'A little streak becomes a bigger confidence.'], ['SAVE', 'Feel the goal get closer.', 'Every coin has a job.'], ['SOUQ', 'Spend or save?', 'Your choice changes what happens next.'], ['PARENTS', 'Clear. Calm. In control.', 'Progress for kids. Peace of mind for parents.']], ar: [['اكتشف', 'الفلوس بتروح فين؟', 'امشي مع عملة واحدة في حكاية من الحياة بجد.'], ['عادات', '3 دقايق كل يوم.', 'خطوة صغيرة بتعمل ثقة كبيرة.'], ['تحويش', 'حس إن هدفك بيقرب.', 'كل عملة ليها شغلة.'], ['السوق', 'تصرف ولا تحوّش؟', 'إنت اللي بتختار إيه يحصل بعد كده.'], ['للكبار', 'مغامرته. وراحة بالك.', 'تابع التقدّم وسيبه يكتشف.']] }

const moneySkills = { en: [['Earning', 'Learn money comes from work.'], ['Saving', 'Wait now, get more later.'], ['Spending smart', 'Needs first, wants second.'], ['Budgeting', 'Give every coin a job.'], ['Investing', 'Let money grow slowly.'], ['Entrepreneurship', 'Turn an idea into income.']], ar: [['الكسب', 'الفلوس بتيجي من الشغل.'], ['التحويش', 'استنى دلوقتي وخد أكتر بعدين.'], ['الصرف بذكاء', 'الأساسيات الأول والرغبات بعدين.'], ['الميزانية', 'كل عملة ليها شغلة.'], ['الاستثمار', 'خلّي فلوسك تكبر بالراحة.'], ['ريادة الأعمال', 'حوّل فكرتك لدخل.']] }

const heroCopy = { en: { eyebrow: 'THE MONEY ADVENTURE · AGES 6–17', lineOne: 'A little coin.', lineTwo: 'A big world.', body: 'Kids learn money by making it move through stories, choices, and tiny wins.', primary: 'Start the adventure', secondary: 'See it in action', trust: 'Playful for kids. Clear for parents.', kids: 'For kids', parents: 'For parents', noteOne: <>Tiny wins,<br /><b>every day.</b></>, noteTwo: 'coins earned', noteTwoSub: 'Confidence unlocked.', armsKicker: '02 / ROOM TO GROW', armsTitle: 'Six arms, six money skills.', armsBody: 'Six little adventures for a more confident tomorrow.', ctaTitle: 'Ready to make every coin count?', ctaBody: 'Start small. Grow one money skill every day.', ctaSmall: 'Okto · Arabic & English · Parent-safe' }, ar: { eyebrow: 'مغامرة الفلوس · من 6 لـ 17 سنة', lineOne: 'عملة صغيرة.', lineTwo: 'عالم كبير.', body: 'طفلك يتعلّم الفلوس وهو بيشوفها بتتحرك وسط حكايات واختيارات ومكافآت صغيرة.', primary: 'ابدأ المغامرة', secondary: 'شوفها بتشتغل', trust: 'ممتع للأطفال. ومطمّن للأهل.', kids: 'للأطفال', parents: 'لأولياء الأمور', noteOne: <>خطوات صغيرة,<br /><b>كل يوم.</b></>, noteTwo: 'عملة اتجمعت', noteTwoSub: 'وثقة بتكبر.', armsKicker: '02 / مساحة تكبر فيها', armsTitle: '6 دراعات، 6 مهارات فلوس.', armsBody: '6 مغامرات صغيرة لطفل واثق أكتر كل يوم.', ctaTitle: 'جاهز تخلي كل عملة تفرق؟', ctaBody: 'ابدأ صغير. وكبّر مهارة فلوس كل يوم.', ctaSmall: 'أوكتو · عربي وإنجليزي · آمن للأهل' } }

const asset = {
  start: 'https://framerusercontent.com/images/B4RhtbZMNvptGRWwlPmgCP9xE.png?width=5250&height=2226&kb=1218',
  learn: 'https://framerusercontent.com/images/qxJmIUYaPOSupucRNWoReMRmyI4.png?width=5720&height=2366&kb=1439',
}

const ease = [.16, 1, .3, 1] as const

function Crop({ src, x, y, w, h, width, height, label }: { src: string; x: number; y: number; w: number; h: number; width: number; height: number; label: string }) {
  return <svg viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}><image href={src} width={width} height={height} /></svg>
}

/* Buttons that lean toward the cursor. */
function Magnetic({ children, strength = .32 }: { children: ReactNode; strength?: number }) {
  const reduced = useReducedMotion()
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: .5 }), sy = useSpring(y, { stiffness: 220, damping: 16, mass: .5 })
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    if (reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * strength)
    y.set((e.clientY - r.top - r.height / 2) * strength)
  }
  return <motion.span className="magnetic" style={{ x: sx, y: sy }} onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0) }} whileTap={{ scale: .94 }}>{children}</motion.span>
}

/* Number that counts up when it scrolls into view. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration: 2.2, ease: 'easeOut', delay: .9, onUpdate: v => setN(Math.round(v)) })
    return () => c.stop()
  }, [inView, to])
  return <b ref={ref}>+{n}</b>
}

export function CinematicLanding() {
  const ref = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const [lang, setLang] = useState<'en' | 'ar'>('en')
  const copy = heroCopy[lang]
  const selectedScenes = scenes[lang]
  const selectedSkills = moneySkills[lang]
  const reducedMotion = useReducedMotion()

  // Smoothed scroll: everything below follows this spring, so motion never feels jerky.
  const { scrollYProgress: rawPage } = useScroll()
  const page = useSpring(rawPage, { stiffness: 90, damping: 26, mass: .4 })
  const { scrollYProgress: rawHero } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const heroP = useSpring(rawHero, { stiffness: 90, damping: 26, mass: .4 })
  const y = useTransform(heroP, [0, .18], [0, -90])
  const scale = useTransform(heroP, [0, .2], [1, .68])

  // Pointer tilt for the hero stage, with each layer at a different depth.
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 18 }), sy = useSpring(my, { stiffness: 80, damping: 18 })
  const rotY = useTransform(sx, [-.5, .5], [-9, 9]), rotX = useTransform(sy, [-.5, .5], [7, -7])
  const phoneX = useTransform(sx, [-.5, .5], [22, -22]), oktoX = useTransform(sx, [-.5, .5], [-34, 34])
  const oktoY = useTransform(sy, [-.5, .5], [-14, 14]), coinX = useTransform(sx, [-.5, .5], [46, -46])
  const glowX = useTransform(sx, [-.5, .5], ['35%', '65%']), glowY = useTransform(sy, [-.5, .5], ['35%', '65%'])
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (reducedMotion) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - .5); my.set((e.clientY - r.top) / r.height - .5)
  }
  const onLeave = () => { mx.set(0); my.set(0) }

  // A single, scoped timeline keeps the opening calm and intentional: copy arrives
  // first, then the tactile stage settles into place. It is reverted on unmount.
  useLayoutEffect(() => {
    if (reducedMotion || !heroRef.current) return
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
      timeline
        .fromTo('.hero-nav', { y: -18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55 })
        .fromTo('.cinema-hero__copy > p, .cinema-hero__copy > h1, .cinema-hero__copy > span, .cinema-hero__copy > div, .cinema-hero__copy > small', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .66, stagger: .09 }, '-=.2')
        .fromTo('.hero-stage', { y: 28, scale: .92, rotate: 3, autoAlpha: 0 }, { y: 0, scale: 1, rotate: 0, autoAlpha: 1, duration: 1.05, ease: 'elastic.out(1, .72)' }, '-=.62')
      gsap.to('.hero-orbit--two', { rotate: 360, duration: 28, repeat: -1, ease: 'none' })
    }, heroRef)
    return () => context.revert()
  }, [reducedMotion])

  // Coin that dives down the page and spins as you scroll.
  const trackerTop = useTransform(page, [0, 1], ['14%', '80%'])
  const trackerSpin = useTransform(page, [0, 1], [0, 1800])

  return <main ref={ref} className="cinema" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
    <motion.div className="scroll-progress" style={{ scaleX: page }} aria-hidden="true" />
    <motion.div className="coin-tracker" style={{ top: trackerTop, rotateY: trackerSpin }} aria-hidden="true"><img src="/icon.svg" alt="" /></motion.div>

    <section ref={heroRef} id="top" className="cinema-hero cinema-hero--lesson" onPointerMove={onMove} onPointerLeave={onLeave}>
      <nav className="hero-nav" aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
        <strong>okto<span>•</span></strong>
        <div><a href="#learn">{copy.kids}</a><a href="#parents">{copy.parents}</a></div>
        <button aria-label="Change language" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{lang === 'en' ? 'EN / ع' : 'ع / EN'}</button>
      </nav>
      <div className="hero-orbit hero-orbit--one" />
      <div className="hero-orbit hero-orbit--two" />
      <Sparkles className="hero-spark hero-spark--one" aria-hidden="true" />
      <Sparkles className="hero-spark hero-spark--two" aria-hidden="true" />
      <motion.div className="cinema-hero__copy" initial={reducedMotion ? false : { opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease }}>
        <p>{copy.eyebrow}</p>
        <h1><span className="mask"><motion.span initial={reducedMotion ? false : { y: '115%', rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: .9, delay: .08, ease }}>{copy.lineOne}</motion.span></span><span className="mask"><motion.em initial={reducedMotion ? false : { y: '115%', rotate: 4 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: .9, delay: .2, ease }}>{copy.lineTwo}</motion.em></span></h1>
        <motion.span initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .45, ease }}>{copy.body}</motion.span>
        <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .6, ease }}>
          <Magnetic><a className="hero-cta hero-cta--primary" href="#learn">{copy.primary} <ArrowDown size={16} strokeWidth={2.8} aria-hidden="true" /></a></Magnetic>
          <Magnetic><a className="hero-cta hero-cta--secondary" href="#arms">{copy.secondary} <ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" /></a></Magnetic>
        </motion.div>
        <motion.small initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .9 }}><i /> {copy.trust}</motion.small>
      </motion.div>

      <motion.div className="hero-stage" style={{ y, scale, rotateX: rotX, rotateY: rotY, transformPerspective: 1000 }} initial={reducedMotion ? false : { opacity: 0, scale: .85, rotate: 5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 18, delay: .16 }}>
        <motion.div className="hero-stage__glow" style={{ left: glowX, top: glowY }} />
        <div className="hero-stage__orbit" />
        <motion.div className="hero-stage__layer" style={{ x: phoneX }}>
          <motion.div animate={reducedMotion ? undefined : { y: [0, -14, 0], rotate: [8, 10, 8] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
            <IPhoneFrame className="hero-stage__phone hero-iphone" screenshot={asset.learn} viewBox="80 234 390 844" imageWidth={5720} imageHeight={2366} label="Okto Follow the Money lesson" />
          </motion.div>
        </motion.div>
        <motion.div className="hero-stage__layer" style={{ x: oktoX, y: oktoY }}>
          <motion.div className="hero-stage__okto" animate={reducedMotion ? undefined : { y: [0, -12, 0], rotate: [-8, -4, -8] }} transition={{ duration: 4.7, repeat: Infinity, ease: 'easeInOut' }} whileHover={{ scale: 1.08, rotate: -12 }}>
            <Crop src={asset.start} x={170} y={330} w={230} h={255} width={5250} height={2226} label="Okto" />
          </motion.div>
        </motion.div>
        <motion.div className="hero-stage__note hero-stage__note--top" animate={reducedMotion ? undefined : { y: [0, -7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>{copy.noteOne}</motion.div>
        <motion.div className="hero-stage__note hero-stage__note--bottom" animate={reducedMotion ? undefined : { y: [0, 8, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: .5 }}><CountUp to={65} /> {copy.noteTwo}<br />{copy.noteTwoSub}</motion.div>
        <motion.div className="hero-stage__layer" style={{ x: coinX }}>
          <motion.span className="hero-stage__coin hero-stage__coin--one" aria-hidden="true" animate={reducedMotion ? undefined : { y: [0, -18, 0], rotateY: [0, 360] }} transition={{ y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }, rotateY: { duration: 6, repeat: Infinity, ease: 'linear' } }}><img src="/icon.svg" alt="" /></motion.span>
          <motion.span className="hero-stage__coin hero-stage__coin--two" aria-hidden="true" animate={reducedMotion ? undefined : { y: [0, 14, 0], rotateY: [360, 0] }} transition={{ y: { duration: 4.4, repeat: Infinity, ease: 'easeInOut' }, rotateY: { duration: 7, repeat: Infinity, ease: 'linear' } }}><img src="/icon.svg" alt="" /></motion.span>
        </motion.div>
      </motion.div>
    </section>

    <Marquee items={selectedSkills.map(s => s[0])} />
    <LearnExperience lang={lang} />
    <ArmsChapter copy={copy} skills={selectedSkills} />
    <HabitExperience lang={lang} />
    {selectedScenes.slice(2).map(([eyebrow, title, body], index) => <Scene id={eyebrow === selectedScenes[selectedScenes.length - 1][0] ? 'parents' : undefined} key={title} index={index + 2} eyebrow={eyebrow} title={title} body={body} />)}
    <FinalCta copy={copy} />
  </main>
}

function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items]
  return <div className="skill-marquee" aria-hidden="true"><div className="skill-marquee__track">{[0, 1].map(k => <div className="skill-marquee__row" key={k}>{row.map((t, i) => <span key={t + i}>{t}<i>✦</i></span>)}</div>)}</div></div>
}

function ArmsChapter({ copy, skills }: { copy: (typeof heroCopy)[keyof typeof heroCopy]; skills: string[][] }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [activeCount, setActiveCount] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', value => setActiveCount(Math.min(skills.length, Math.floor(value * 7.2))))
  return <section ref={ref} id="arms" className="arms-html">
    <div className="arms-html__sticky">
      <div className="arms-html__world" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="arms-html__wrap">
        <header className="arms-html__header"><div><p>{copy.armsKicker}</p><h2>{copy.armsTitle}</h2><span>{copy.armsBody}</span></div><aside><b>{String(Math.max(1, activeCount)).padStart(2, '0')}</b><span>/ 06</span><i>{skills.map((skill, index) => <em className={index < activeCount ? 'on' : ''} key={skill[0]} />)}</i></aside></header>
        <div className="arms-html__grid">{skills.map(([title, body], index) => <motion.article animate={{ y: index < activeCount ? -8 : 0, rotate: index < activeCount ? -1.2 : 0, scale: index < activeCount ? 1.02 : .985 }} transition={{ type: 'spring', stiffness: 180, damping: 17 }} className={`arms-html__card ${index < activeCount ? 'on' : ''}`} key={title}><b>0{index + 1}</b><SkillGlyph index={index} /><h3>{title}</h3><p>{body}</p><i aria-hidden="true" /></motion.article>)}</div>
      </div>
    </div>
  </section>
}

function SkillGlyph({ index }: { index: number }) {
  const paths = [
    <><path d="M8 28c9-1 13-9 13-19 8 7 8 20-2 26-8 5-17 1-19-7 2 0 4 0 8 0Z" /><path d="M8 28c4-6 9-11 16-15" /></>,
    <><path d="M8 14h16v17H8z" /><path d="M11 14V9h10v5M12 23h8" /></>,
    <><path d="M7 25c4 4 14 4 18 0" /><path d="M9 25V12h14v13M12 12V8h8v4" /></>,
    <><path d="M9 7h14v22H9z" /><path d="m12 14 2 2 5-5M12 22h8" /></>,
    <><path d="M8 25 15 18l4 3 7-10" /><path d="M20 11h6v6" /></>,
    <><path d="M16 7c6 4 9 9 9 17-7 0-12-3-17-9 2-4 4-6 8-8Z" /><path d="M10 21 6 26M9 13l-4-1" /></>,
  ]
  return <svg className="arms-html__glyph" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[index]}</svg>
}

function Scene({ id, index, eyebrow, title, body }: { id?: string; index: number; eyebrow: string; title: string; body: string }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: .4 })
  const dir = index % 2 ? -1 : 1
  const x = useTransform(p, [0, .5, 1], [150 * dir, 0, -150 * dir])
  const r = useTransform(p, [0, 1], [-10, 10])
  const s = useTransform(p, [0, .5, 1], [.75, 1, .85])
  const dotY = useTransform(p, [0, 1], [60, -60])
  return <section id={id} ref={ref} className={`cinema-scene cinema-scene--${index}`}>
    <motion.div className="cinema-scene__object" style={{ x, rotate: r, scale: s }}><span>{index + 1}</span><motion.i style={{ y: dotY }} /></motion.div>
    <motion.div className="cinema-scene__copy" initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ amount: .5, once: true }} transition={{ duration: .8, ease }}>
      <p>{eyebrow}</p><h2>{title}</h2><b>{body}</b>
    </motion.div>
  </section>
}

function FinalCta({ copy }: { copy: (typeof heroCopy)[keyof typeof heroCopy] }) {
  return <footer className="final-cta" id="get-the-app">
    <motion.div className="final-cta__inner" initial={{ opacity: 0, y: 60, scale: .94 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .9, ease }}>
      <h2>{copy.ctaTitle}</h2>
      <p>{copy.ctaBody}</p>
      <div><Magnetic strength={.4}><a className="hero-cta hero-cta--secondary" href="#top">App Store</a></Magnetic><Magnetic strength={.4}><a className="hero-cta hero-cta--primary" href="#top">Google Play</a></Magnetic></div>
      <small>{copy.ctaSmall}</small>
    </motion.div>
  </footer>
}
