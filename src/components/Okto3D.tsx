import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useReducedMotion } from 'motion/react'

type Language = 'en' | 'ar'
type Prop = 'coin' | 'star' | 'piggy' | 'bag' | 'lock' | null

/* ───────── مسار Okto في الصفحة ─────────
   x / y = مكانه في الشاشة (0 → 1) ، s = الحجم ، prop = الحاجة اللي بيمسكها
   mode:'arms' = بيمد كل دراع ويمسك كارت مهارة مع كل scroll
   ink:false  = من غير حبر في الـ section دي
   (في العربي الـ x بيتعكس لوحده) */
type Stop = { sel: string; x: number; y: number; s: number; prop: Prop; mode?: 'arms'; ink?: boolean; msg?: Record<Language, string> }
const STOPS: Stop[] = [
  { sel: '#top', x: 0.93, y: 0.82, s: 0.5, prop: null },
  { sel: '#learn', x: 0.5, y: 0.8, s: 0.55, prop: 'coin', msg: { en: 'Follow this coin!', ar: 'امشي ورا العملة دي!' } },
  { sel: '#arms', x: 0.5, y: 0.2, s: 1.0, prop: null, mode: 'arms', ink: false, msg: { en: 'Six skills, six arms!', ar: '6 مهارات، 6 دراعات!' } },
  { sel: 'section[aria-labelledby="habit-title"]', x: 0.5, y: 0.8, s: 0.5, prop: 'star', msg: { en: 'Keep your streak!', ar: 'حافظ على عادتك!' } },
  { sel: '.app-story--save', x: 0.46, y: 0.8, s: 0.52, prop: 'piggy', msg: { en: 'Saving is my superpower.', ar: 'التحويش قوّتي الخارقة.' } },
  { sel: '.app-story--souq', x: 0.5, y: 0.8, s: 0.52, prop: 'bag', msg: { en: 'Spend or save?', ar: 'تصرف ولا تحوّش؟' } },
  { sel: '.app-story--parents', x: 0.46, y: 0.8, s: 0.52, prop: 'lock', msg: { en: 'Parent-safe. Locked tight!', ar: 'آمن للأهل. مقفول كويس!' } },
  { sel: '.final-cta', x: 0.14, y: 0.66, s: 0.85, prop: 'coin', msg: { en: 'Ready? Let’s go!', ar: 'جاهز؟ يلا بينا!' } },
]

/* ترتيب الأدرع اللي بتمسك الـ 6 كروت (من الشمال لليمين) */
const ARMS = [3, 4, 2, 1, 0, 7]

const lines: Record<Language, string[]> = {
  en: ['Hi! I’m Okto 👋', 'Every coin gets a job!', 'Psst… keep scrolling.', 'Tiny wins, every day.'],
  ar: ['أهلاً! أنا أوكتو 👋', 'كل عملة ليها شغلة!', 'كمّل scroll وهتشوف.', 'خطوات صغيرة كل يوم.'],
}

const SEG = 28
const RAD = 12
const COUNT = 8
const LEN = 2.0
const NS = 'http://www.w3.org/2000/svg'
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/* بقعة حبر غير منتظمة (منحنيات ناعمة) */
const blobPath = (cx: number, cy: number, r: number, n = 14) => {
  const p: [number, number][] = []
  for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, rr = r * (0.72 + Math.random() * 0.56); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]) }
  let d = `M${p[0][0]},${p[0][1]}`
  for (let k = 0; k < n; k++) {
    const p0 = p[(k - 1 + n) % n], p1 = p[k], p2 = p[(k + 1) % n], p3 = p[(k + 2) % n]
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`
  }
  return d + 'Z'
}

export function Okto3D({ lang, color = '#fb7b64', ink = true }: { lang: Language; color?: string; ink?: boolean }) {
  const reduced = useReducedMotion()
  const anchorRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inkRef = useRef<HTMLDivElement>(null)
  const kickRef = useRef<() => void>(() => {})
  const inkFnRef = useRef<() => void>(() => {})
  const idx = useRef(0)
  const clicks = useRef(0)
  const timer = useRef<number>(0)
  const [bubble, setBubble] = useState({ text: lines[lang][0], on: false })

  const say = (text: string, ms = 3200) => {
    window.clearTimeout(timer.current)
    setBubble({ text, on: true })
    timer.current = window.setTimeout(() => setBubble((b) => ({ ...b, on: false })), ms)
  }
  const sayRef = useRef(say); sayRef.current = say

  useEffect(() => {
    const id = window.setTimeout(() => sayRef.current(lines[lang][0], 3600), 1800)
    return () => { window.clearTimeout(id); window.clearTimeout(timer.current) }
  }, [lang])

  useEffect(() => {
    const canvas = canvasRef.current, anchor = anchorRef.current, body = bodyRef.current
    if (!canvas || !anchor || !body) return

    // canvas واحد بحجم الشاشة كلها، عشان الأدرع تقدر تمتد لأي مكان في الصفحة
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
    camera.position.set(0, 0, 9.2)
    const VISH = 2 * 9.2 * Math.tan(THREE.MathUtils.degToRad(17.5)) // ارتفاع اللي الكاميرا شايفه عند z=0

    scene.add(new THREE.HemisphereLight(0xffffff, 0x58b5c4, 1.5))
    const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(3, 4, 5); scene.add(key)
    const rim = new THREE.DirectionalLight(0xd6fe51, 1.8); rim.position.set(-4, 2, -3); scene.add(rim)

    const mats: THREE.Material[] = []
    const mat = <T extends THREE.Material>(m: T) => { mats.push(m); return m }
    const skin = mat(new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.25 }))
    const white = mat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }))
    const dark = mat(new THREE.MeshStandardMaterial({ color: 0x0b1f26, roughness: 0.15 }))
    const blush = mat(new THREE.MeshStandardMaterial({ color: 0xff9aa8, roughness: 0.6, transparent: true, opacity: 0.75 }))
    const gold = mat(new THREE.MeshStandardMaterial({ color: 0xffc93c, metalness: 0.55, roughness: 0.3 }))
    const goldDeep = mat(new THREE.MeshStandardMaterial({ color: 0xe39a1c, metalness: 0.55, roughness: 0.35 }))
    const lime = mat(new THREE.MeshStandardMaterial({ color: 0xd6fe51, roughness: 0.35 }))
    const pink = mat(new THREE.MeshStandardMaterial({ color: 0xff9fb0, roughness: 0.5 }))
    const teal = mat(new THREE.MeshStandardMaterial({ color: 0x3aa6a0, roughness: 0.45 }))
    const steel = mat(new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.7, roughness: 0.3 }))

    const root = new THREE.Group(); scene.add(root)
    const head = new THREE.Group(); root.add(head)

    const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), skin)
    bodyMesh.scale.set(1, 1.08, 1); bodyMesh.position.y = 0.35; head.add(bodyMesh)

    const eyes = [-1, 1].map((side) => {
      const g = new THREE.Group(); g.position.set(side * 0.42, 0.55, 0.96)
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 24), white))
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), dark); pupil.position.z = 0.17; g.add(pupil)
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), white); glint.position.set(0.05, 0.06, 0.3); pupil.add(glint)
      head.add(g)
      return { g, pupil }
    })
    ;[-1, 1].forEach((side) => {
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), blush)
      c.position.set(side * 0.72, 0.2, 0.8); c.scale.set(1, 0.7, 0.4); head.add(c)
    })
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 12, 28, Math.PI), dark)
    mouth.rotation.z = Math.PI; mouth.position.set(0, 0.12, 1.04); head.add(mouth)

    /* ───── الحاجات اللي بيمسكها ───── */
    const mk = (geo: THREE.BufferGeometry, m: THREE.Material, fn?: (o: THREE.Mesh) => void) => { const o = new THREE.Mesh(geo, m); fn?.(o); return o }
    const propMap: Record<Exclude<Prop, null>, THREE.Group> = { coin: new THREE.Group(), star: new THREE.Group(), piggy: new THREE.Group(), bag: new THREE.Group(), lock: new THREE.Group() }
    propMap.coin.add(
      mk(new THREE.CylinderGeometry(0.55, 0.55, 0.14, 40), gold, (o) => { o.rotation.x = Math.PI / 2 }),
      mk(new THREE.TorusGeometry(0.4, 0.04, 12, 40), goldDeep, (o) => { o.position.z = 0.08 }),
      mk(new THREE.TorusGeometry(0.4, 0.04, 12, 40), goldDeep, (o) => { o.position.z = -0.08 }),
    )
    const starShape = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.3 : 0.65, a = (i / 10) * Math.PI * 2 - Math.PI / 2
      i === 0 ? starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    starShape.closePath()
    const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.16, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 }); starGeo.center()
    propMap.star.add(mk(starGeo, lime))
    propMap.piggy.add(
      mk(new THREE.SphereGeometry(0.5, 28, 28), pink, (o) => { o.scale.set(1.15, 1, 1) }),
      mk(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 20), pink, (o) => { o.rotation.x = Math.PI / 2; o.position.set(0, -0.04, 0.52) }),
      mk(new THREE.ConeGeometry(0.12, 0.22, 16), pink, (o) => { o.position.set(-0.28, 0.5, 0.12); o.rotation.z = 0.35 }),
      mk(new THREE.ConeGeometry(0.12, 0.22, 16), pink, (o) => { o.position.set(0.28, 0.5, 0.12); o.rotation.z = -0.35 }),
      mk(new THREE.BoxGeometry(0.3, 0.05, 0.08), dark, (o) => { o.position.set(0, 0.5, 0) }),
    )
    propMap.bag.add(
      mk(new THREE.BoxGeometry(0.85, 0.95, 0.38), teal, (o) => { o.position.y = -0.1 }),
      mk(new THREE.TorusGeometry(0.22, 0.04, 12, 24, Math.PI), lime, (o) => { o.position.y = 0.38 }),
    )
    propMap.lock.add(
      mk(new THREE.BoxGeometry(0.85, 0.65, 0.34), lime, (o) => { o.position.y = -0.15 }),
      mk(new THREE.TorusGeometry(0.26, 0.06, 12, 28, Math.PI), steel, (o) => { o.position.y = 0.17 }),
      mk(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 16), dark, (o) => { o.rotation.x = Math.PI / 2; o.position.set(0, -0.15, 0.02) }),
    )
    Object.values(propMap).forEach((p) => { p.visible = false; root.add(p) })

    /* ───── الأدرع ───── */
    const cosA = Array.from({ length: RAD + 1 }, (_, k) => Math.cos((k / RAD) * Math.PI * 2))
    const sinA = Array.from({ length: RAD + 1 }, (_, k) => Math.sin((k / RAD) * Math.PI * 2))
    const indices: number[] = []
    for (let j = 0; j < SEG; j++) for (let k = 0; k < RAD; k++) {
      const a = j * (RAD + 1) + k, a1 = a + 1, b = a + RAD + 1, b1 = b + 1
      indices.push(a, a1, b, a1, b1, b)
    }
    const tentacles = Array.from({ length: COUNT }, (_, i) => {
      const phi = (i / COUNT) * Math.PI * 2 + Math.PI / COUNT
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array((SEG + 1) * (RAD + 1) * 3), nor = new Float32Array(pos.length)
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
      geo.setIndex(indices)
      const mesh = new THREE.Mesh(geo, skin); mesh.frustumCulled = false; root.add(mesh)
      const side = i === 1 ? 1 : i === 2 ? -1 : 0 // الدراعين الأماميين بيمسكوا الـ prop
      return { geo, pos, nor, phi, side, g: 0, thick: 1, tgt: new THREE.Vector3(), tip: new THREE.Vector3(), dir: new THREE.Vector3(Math.cos(phi), 0, Math.sin(phi)), perp: new THREE.Vector3(-Math.sin(phi), 0, Math.cos(phi)) }
    })
    const pts = Array.from({ length: SEG + 1 }, () => new THREE.Vector3())
    const T = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3()
    const base = new THREE.Vector3(), reach = new THREE.Vector3()

    // t.g = درجة الإمساك (0..1) ، t.tgt = المكان اللي الدراع رايحله (بإحداثيات الشخصية)
    const updateTentacle = (t: (typeof tentacles)[number], time: number, amp: number) => {
      for (let j = 0; j <= SEG; j++) {
        const s = j / SEG
        const out = LEN * 0.6 * Math.sin(s * 1.35) + 0.2 * s
        const w = Math.sin(s * 5 - time * 2.4 + t.phi * 1.9) * 0.2 * s * amp
        const w2 = Math.sin(s * 4 - time * 1.8 + t.phi) * 0.12 * s * amp
        const rad = 0.62 + out + w2
        pts[j].set(t.dir.x * rad + t.perp.x * w, -0.45 - LEN * 0.9 * Math.pow(s, 1.05), t.dir.z * rad + t.perp.z * w)
      }
      t.thick = 1
      if (t.g > 0.001) {
        base.copy(pts[0])
        const dist = base.distanceTo(t.tgt)
        t.thick = 1 + (clamp(1 + (dist / LEN - 1) * 0.35, 1, 1.8) - 1) * Math.min(1, t.g) // الدراع بيتخن شوية لما يتمدد
        const sx = Math.sign(t.dir.x) || 1
        for (let j = 0; j <= SEG; j++) {
          const s = j / SEG, wgt = Math.min(1, t.g * Math.pow(s, 1.1))
          reach.copy(base).lerp(t.tgt, s)
          reach.x += sx * Math.sin(Math.PI * s) * (0.1 + 0.1 * dist)
          reach.y += Math.sin(Math.PI * s) * (0.08 + 0.1 * dist)
          pts[j].lerp(reach, wgt)
        }
      }
      t.tip.copy(pts[SEG])
      for (let j = 0; j <= SEG; j++) {
        T.copy(pts[Math.min(j + 1, SEG)]).sub(pts[Math.max(j - 1, 0)]).normalize()
        U.crossVectors(T, t.perp).normalize()
        V.crossVectors(T, U).normalize()
        const r = (0.38 * Math.pow(1 - j / SEG, 0.9) + 0.045) * t.thick
        for (let k = 0; k <= RAD; k++) {
          const nx = cosA[k] * U.x + sinA[k] * V.x, ny = cosA[k] * U.y + sinA[k] * V.y, nz = cosA[k] * U.z + sinA[k] * V.z
          const o = (j * (RAD + 1) + k) * 3
          t.pos[o] = pts[j].x + nx * r; t.pos[o + 1] = pts[j].y + ny * r; t.pos[o + 2] = pts[j].z + nz * r
          t.nor[o] = nx; t.nor[o + 1] = ny; t.nor[o + 2] = nz
        }
      }
      t.geo.attributes.position.needsUpdate = true
      t.geo.attributes.normal.needsUpdate = true
    }

    /* ───── الحالة ───── */
    const st = { time: 0, lookX: 0, lookY: 0, ptx: 0, pty: 0, excited: 0, excitedT: 0, jumpY: 0, jumpV: 0, spin: 0, spinT: 0, happy: 0, vel: 0, lastY: window.scrollY, nextBlink: 2, blink: 0, grab: 0, prop: null as Prop, mode: 'prop' as 'prop' | 'arms', fly: 0, px: 0, py: 0, vx: 0, vy: 0, checkT: 0 }

    const baseSize = () => (window.innerWidth < 760 ? 200 : 300)
    let size = baseSize()
    anchor.style.setProperty('--okto-size', `${size}px`)
    const place = (stop: { x: number; y: number; s: number }) => {
      const half = (size * stop.s) / 2
      const fx = lang === 'ar' ? 1 - stop.x : stop.x
      return { x: clamp(fx * window.innerWidth, half, window.innerWidth - half), y: clamp(stop.y * window.innerHeight, half, window.innerHeight - half), s: stop.s }
    }

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false)
      camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix()
    }
    resize()

    /* ───── الحبر: Okto بيطير لنص الشاشة وبيطلّعه ───── */
    let inkBusy = false
    const inkVisual = (cx: number, cy: number) => {
      const layer = inkRef.current
      if (!layer) { inkBusy = false; return 0 }
      const vw = window.innerWidth, vh = window.innerHeight, diag = Math.hypot(vw, vh)
      const svg = document.createElementNS(NS, 'svg')
      svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`); svg.setAttribute('preserveAspectRatio', 'none')
      svg.innerHTML = '<defs><radialGradient id="okto-ink-g" cx="50%" cy="45%" r="65%"><stop offset="0%" stop-color="#0d2a35"/><stop offset="60%" stop-color="#061217"/><stop offset="100%" stop-color="#020608"/></radialGradient></defs>'
      layer.appendChild(svg)

      // رذاذ صغير بيطير من Okto قبل الموجة
      const drops = Array.from({ length: 28 }, () => {
        const c = document.createElementNS(NS, 'circle')
        c.setAttribute('cx', String(cx)); c.setAttribute('cy', String(cy)); c.setAttribute('r', String(3 + Math.random() * 9)); c.setAttribute('fill', '#06141a')
        svg.appendChild(c); return c
      })
      // بقع الحبر: الأولى كبيرة وبتضمن إن الشاشة كلها تتغطي
      const radii = [150, 130, 120, 110, 100, 95, 85]
      const blobs = radii.map((r) => {
        const p = document.createElementNS(NS, 'path')
        p.setAttribute('d', blobPath(cx + (Math.random() - 0.5) * 70, cy + (Math.random() - 0.5) * 70, r))
        p.setAttribute('fill', 'url(#okto-ink-g)'); p.setAttribute('stroke', 'rgba(130,205,225,.2)'); p.setAttribute('stroke-width', '2.5')
        svg.appendChild(p); return p
      })
      gsap.set(blobs, { svgOrigin: `${cx} ${cy}`, scale: 0.04, transformOrigin: undefined })

      const tl = gsap.timeline({ onComplete: () => { svg.remove(); inkBusy = false } })
      tl.fromTo(drops, { x: 0, y: 0, autoAlpha: 1 }, { x: () => (Math.random() - 0.5) * diag * 0.9, y: () => (Math.random() - 0.5) * diag * 0.7, duration: 0.7, ease: 'power3.out', stagger: 0.008 }, 0)
        .to(drops, { autoAlpha: 0, duration: 0.4 }, 0.5)
        .to(blobs, { scale: (i) => (i === 0 ? (diag * 0.85) / radii[0] : ((diag * 0.62) / radii[i]) * (0.85 + Math.random() * 0.3)), rotation: () => (Math.random() - 0.5) * 50, duration: 0.8, ease: 'power4.out', stagger: 0.05 }, 0.12)
        .to({}, { duration: 0.3 })
        .to([...blobs].reverse(), { scale: 0.02, rotation: '-=18', duration: 0.7, ease: 'power3.in', stagger: 0.05 })
      return tl.duration()
    }

    let cur = -1
    const inked = new Set<number>()
    let flight: gsap.core.Timeline | null = null
    let inkTl: gsap.core.Timeline | null = null
    let returnCall: gsap.core.Tween | null = null

    const playInk = (i: number) => {
      if (inkBusy || reduced || i < 0) return
      inkBusy = true; flight?.kill(); inkTl?.kill()
      const c = place({ x: 0.5, y: 0.5, s: 1.1 })
      inkTl = gsap.timeline()
        .to(st, { grab: 0, duration: 0.25, ease: 'power2.in' })
        .call(() => { st.fly = 1 })
        .to(anchor, { x: c.x, y: c.y, duration: 0.95, ease: 'power3.inOut' })
        .to(body, { scale: c.s, duration: 0.95, ease: 'power3.inOut' }, '<')
        .call(() => {
          st.fly = 0; st.happy = 1.6; st.jumpV = 3
          const d = inkVisual(c.x, c.y)
          returnCall?.kill()
          returnCall = gsap.delayedCall(Math.max(0, d - 0.9), () => { if (cur === i) go(i) }) // يرجع مكانه وهو الحبر بيختفي
        })
    }
    inkFnRef.current = () => playInk(cur)

    /* ───── الطيران بين الـ sections ───── */
    const go = (i: number, instant = false) => {
      const stop = STOPS[i], p = place(stop)
      cur = i; flight?.kill(); inkTl?.kill()
      st.mode = stop.mode ?? 'prop'
      if (instant || reduced) {
        gsap.set(anchor, { x: p.x, y: p.y }); gsap.set(body, { scale: p.s })
        st.prop = stop.prop; st.grab = stop.prop ? 1 : 0; st.fly = 0
        return
      }
      flight = gsap.timeline()
        .to(st, { grab: 0, duration: 0.25, ease: 'power2.in' })
        .call(() => { st.fly = 1 })
        .to(anchor, { x: p.x, y: p.y, duration: 1.15, ease: 'power3.inOut' })
        .to(body, { scale: p.s, duration: 1.15, ease: 'power3.inOut' }, '<')
        .call(() => { st.fly = 0; st.prop = stop.prop; if (stop.msg) sayRef.current(stop.msg[lang]) })
        .to(st, { grab: stop.prop ? 1 : 0, duration: 0.8, ease: 'back.out(1.6)' })
        .call(() => { if (ink && stop.ink !== false && i > 0 && !inked.has(i)) { inked.add(i); playInk(i) } }, [], '+=0.35')
    }

    const onMove = (e: PointerEvent) => {
      const r = body.getBoundingClientRect()
      st.ptx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.4), -1, 1)
      st.pty = clamp(-(e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.4), -1, 1)
    }
    const kick = () => { if (st.jumpY === 0) st.jumpV = 5.2; st.spinT += Math.PI * 2; st.happy = 1.1 }
    kickRef.current = kick
    const hit = body.querySelector('.okto3d__hit') as HTMLElement | null
    const enter = () => { st.excitedT = 1 }, leave = () => { st.excitedT = 0 }

    const propTgt = [new THREE.Vector3(0.5, -0.35, 1.75), new THREE.Vector3(-0.5, -0.35, 1.75)]

    const draw = (dt: number) => {
      st.time += dt
      const k = (n: number) => 1 - Math.exp(-dt * n)
      const vw = window.innerWidth, vh = window.innerHeight

      // مين الـ section اللي في نص الشاشة؟
      if (!reduced) {
        st.checkT -= dt
        if (st.checkT <= 0) {
          st.checkT = 0.12
          let found = -1
          STOPS.forEach((s, i) => {
            const el = document.querySelector(s.sel); if (!el) return
            const r = el.getBoundingClientRect()
            if (r.top <= vh * 0.5 && r.bottom > vh * 0.5) found = i
          })
          if (found >= 0 && found !== cur && !inkBusy) go(found, cur === -1)
        }
      }

      // سرعة الـ scroll وسرعة الطيران
      const y = window.scrollY
      st.vel += ((y - st.lastY) / Math.max(dt, 0.001) - st.vel) * k(8); st.lastY = y
      const boost = clamp(Math.abs(st.vel) / 1800, 0, 1), lean = clamp(st.vel / 3000, -1, 1)
      const ax = gsap.getProperty(anchor, 'x') as number, ay = gsap.getProperty(anchor, 'y') as number
      const bs = gsap.getProperty(body, 'scale') as number
      st.vx += ((ax - st.px) / Math.max(dt, 0.001) - st.vx) * k(10); st.vy += ((ay - st.py) / Math.max(dt, 0.001) - st.vy) * k(10)
      st.px = ax; st.py = ay
      const speed = clamp(Math.hypot(st.vx, st.vy) / 1500, 0, 1)
      anchor.style.setProperty('--r', `${(size * bs) / 2}px`)

      st.excited += (st.excitedT - st.excited) * k(8)
      st.happy = Math.max(0, st.happy - dt)
      st.jumpV -= 14 * dt; st.jumpY += st.jumpV * dt
      if (st.jumpY < 0) { st.jumpY = 0; st.jumpV = 0 }
      st.spin += (st.spinT - st.spin) * k(5)
      st.nextBlink -= dt
      if (st.nextBlink < 0) { st.blink = 0.14; st.nextBlink = 2 + Math.random() * 3 }
      st.blink = Math.max(0, st.blink - dt)
      const eyeY = st.happy > 0 ? 0.35 : st.blink > 0 ? 0.1 : 1 + st.excited * 0.15

      // مكان وحجم الشخصية في المشهد (من مكان الـ anchor على الشاشة)
      const Upx = VISH / vh, sc = (size * bs) / vh
      root.scale.setScalar(sc)
      root.position.set((ax - vw / 2) * Upx, -(ay - vh / 2) * Upx + (0.3 + Math.sin(st.time * 1.6) * 0.12 + st.jumpY) * sc, 0)

      // كروت المهارات: كل دراع بيمسك كارت لما الكارت يتفعّل (class "on")
      let lookTx = st.ptx, lookTy = st.pty
      const wantG = new Array<number>(COUNT).fill(0)
      const bodyR = body.getBoundingClientRect(), bcx = bodyR.left + bodyR.width / 2, bcy = bodyR.top + bodyR.height / 2
      if (st.mode === 'arms') {
        const cards = Array.from(document.querySelectorAll<HTMLElement>('.arms-html__card'))
        const items = cards.map((c, i) => { const r = c.getBoundingClientRect(); return { i, c, r, x: r.left + r.width / 2 } })
        const order = [...items].sort((a, b) => Math.round(a.x / 40) - Math.round(b.x / 40) || a.r.top - b.r.top)
        let lastOn: (typeof items)[number] | null = null
        order.forEach((it, rank) => {
          const ti = ARMS[rank]; if (ti === undefined) return
          const on = it.c.classList.contains('on')
          wantG[ti] = on ? 1 : 0
          if (on && (!lastOn || it.i > lastOn.i)) lastOn = it
          // الدراع بيروح لنص الحافة العليا للكارت
          const wx = (it.x - vw / 2) * Upx, wy = -(it.r.top + 18 - vh / 2) * Upx
          tentacles[ti].tgt.set((wx - root.position.x) / sc, (wy - root.position.y) / sc, 0.9)
        })
        if (lastOn) { const l = lastOn as (typeof items)[number]; lookTx = clamp((l.x - bcx) / (vw * 0.4), -1, 1); lookTy = clamp(-(l.r.top - bcy) / (vh * 0.4), -1, 1) }
      }
      tentacles.forEach((t, i) => {
        if (st.mode === 'arms') t.g += (wantG[i] - t.g) * k(4.5)
        else if (t.side !== 0) { t.g = st.grab; t.tgt.copy(propTgt[t.side === 1 ? 0 : 1]) }
        else t.g += (0 - t.g) * k(6)
        if (st.mode !== 'arms' && t.side !== 0) return
      })

      st.lookX += (lookTx - st.lookX) * k(6); st.lookY += (lookTy - st.lookY) * k(6)
      root.rotation.y = st.lookX * 0.4 + st.spin
      root.rotation.x = -st.lookY * 0.18 + clamp(st.vy / 3500, -0.35, 0.35)
      root.rotation.z = -lean * 0.18 - clamp(st.vx / 2500, -0.5, 0.5)
      head.scale.set(1 + boost * 0.04, 1 - boost * 0.05 - speed * 0.06 + (st.jumpV > 0 ? 0.05 : 0), 1 + boost * 0.04)
      mouth.scale.set(1 + st.excited * 0.25 + (st.happy > 0 ? 0.4 : 0), 1 + (st.happy > 0 ? 0.6 : 0), 1)
      eyes.forEach(({ g, pupil }) => { g.scale.y = eyeY; pupil.position.set(st.lookX * 0.09, st.lookY * 0.08, 0.17) })

      const amp = 1 + boost * 1.2 + speed * 1.4 + st.excited * 0.6 + (st.happy > 0 ? 0.8 : 0)
      tentacles.forEach((t) => updateTentacle(t, st.time * (1 + boost * 1.4 + speed), amp))

      // الحاجة اللي في إيده
      Object.values(propMap).forEach((p) => { p.visible = false })
      if (st.prop && st.grab > 0.02 && st.mode !== 'arms') {
        const p = propMap[st.prop], a = tentacles[1].tip, b = tentacles[2].tip
        p.visible = true
        p.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.05, (a.z + b.z) / 2 + 0.1)
        p.scale.setScalar(Math.max(0.001, st.grab))
        p.rotation.set(Math.sin(st.time * 1.1) * 0.12, Math.sin(st.time * 1.3) * 0.5, 0)
      }
      renderer.render(scene, camera)
    }

    let raf = 0, last = performance.now(), running = true
    const loop = (now: number) => {
      if (!running) return
      draw(Math.min((now - last) / 1000, 0.05)); last = now
      raf = requestAnimationFrame(loop)
    }

    const onResize = () => { size = baseSize(); anchor.style.setProperty('--okto-size', `${size}px`); resize(); go(cur >= 0 ? cur : 0, true) }
    go(0, true)
    if (reduced) {
      draw(0.016)
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('resize', onResize)
      hit?.addEventListener('pointerenter', enter); hit?.addEventListener('pointerleave', leave)
      raf = requestAnimationFrame(loop)
    }
    const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf) } else if (!reduced && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop) } }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      running = false; cancelAnimationFrame(raf); flight?.kill(); inkTl?.kill(); returnCall?.kill(); gsap.killTweensOf(st)
      window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', onResize)
      hit?.removeEventListener('pointerenter', enter); hit?.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', onVis)
      inkRef.current?.replaceChildren()
      scene.traverse((o) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose() })
      mats.forEach((m) => m.dispose())
      renderer.dispose()
    }
  }, [color, reduced, lang, ink])

  const poke = () => {
    kickRef.current()
    clicks.current += 1
    idx.current = (idx.current + 1) % lines[lang].length
    say(lines[lang][idx.current || 1])
    if (ink && clicks.current % 3 === 0) inkFnRef.current() // كل ضغطة تالتة: حبر!
  }
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke() } }

  return <>
    <div className="okto-ink" ref={inkRef} aria-hidden="true" />
    <canvas ref={canvasRef} className="okto3d__canvas" role="img" aria-label="Okto" />
    <div className="okto3d" ref={anchorRef}>
      <div className="okto3d__body" ref={bodyRef}>
        <div className="okto3d__hit" role="button" tabIndex={0} aria-label="Okto" onClick={poke} onKeyDown={onKey} />
      </div>
      <div className={`okto3d__bubble${bubble.on ? ' is-on' : ''}`} aria-live="polite">{bubble.text}</div>
    </div>
  </>
}