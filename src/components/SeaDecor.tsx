import { useReducedMotion } from 'motion/react'
import type { CSSProperties } from 'react'

type Place = 'tl' | 'tr' | 'bl' | 'br'
type Tone = 'dark' | 'teal' | 'green'

type SeaDecorProps = {
  /** الأركان اللي هيتحط فيها شعب/أعشاب. الافتراضي: تحت يمين وشمال */
  places?: Place[]
  /** عدد الفقاقيع */
  bubbles?: number
  /** أشعة الضوء من فوق */
  rays?: boolean
  /** يغيّر ألوان الشعب حسب لون خلفية الـ section */
  tone?: Tone
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function Branch() {
  return <svg viewBox="0 0 140 220" {...stroke} strokeWidth="15" aria-hidden="true">
    <path d="M70 220V120" />
    <path d="M70 152C50 147 34 128 28 100" />
    <path d="M70 130C92 120 104 100 108 72" />
    <path d="M28 100C20 92 16 82 16 68" />
    <path d="M108 72C112 62 118 56 128 52" />
    <path d="M52 143C44 139 38 141 31 148" />
  </svg>
}

function Kelp() {
  return <svg viewBox="0 0 120 260" {...stroke} strokeWidth="11" aria-hidden="true">
    <path d="M60 260C30 220 90 190 55 150C25 112 85 84 60 38" />
    <path d="M58 192C40 177 28 160 24 138" />
    <path d="M70 142C90 132 100 112 100 90" />
    <path d="M55 102C40 90 34 76 34 58" />
    <path d="M62 62C72 54 80 44 82 30" />
  </svg>
}

function Tube() {
  return <svg viewBox="0 0 130 170" fill="currentColor" aria-hidden="true">
    <rect x="10" y="70" width="28" height="100" rx="14" />
    <rect x="50" y="20" width="30" height="150" rx="15" />
    <rect x="92" y="60" width="28" height="110" rx="14" />
    <g fill="rgb(0 0 0 / .22)"><ellipse cx="24" cy="76" rx="8" ry="5" /><ellipse cx="65" cy="27" rx="9" ry="5.5" /><ellipse cx="106" cy="66" rx="8" ry="5" /></g>
  </svg>
}

const plants: Record<Place, { shape: 'branch' | 'kelp' | 'tube'; color: 'a' | 'b'; delay: number; dur: number }> = {
  bl: { shape: 'branch', color: 'a', delay: 0, dur: 6.5 },
  br: { shape: 'kelp', color: 'b', delay: -2, dur: 7.5 },
  tl: { shape: 'tube', color: 'a', delay: -1, dur: 8 },
  tr: { shape: 'kelp', color: 'b', delay: -3.5, dur: 7 },
}

const shapes = { branch: Branch, kelp: Kelp, tube: Tube }

// أرقام ثابتة (مش random) عشان الفقاقيع ما تتغيرش مع كل render
const rnd = (i: number, salt: number) => { const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return v - Math.floor(v) }

export function SeaDecor({ places = ['bl', 'br'], bubbles = 10, rays = true, tone = 'dark' }: SeaDecorProps) {
  const reduced = useReducedMotion()
  return <div className={`sea-decor sea-decor--${tone}`} aria-hidden="true">
    {rays && <><i className="sea-ray sea-ray--1" /><i className="sea-ray sea-ray--2" /><i className="sea-ray sea-ray--3" /></>}
    {places.map((place) => {
      const p = plants[place]
      const Shape = shapes[p.shape]
      return <span key={place} className={`sea-plant sea-plant--${place} sea-plant--${p.color}`} style={{ '--d': `${p.dur}s`, '--delay': `${p.delay}s` } as CSSProperties}><Shape /></span>
    })}
    {!reduced && Array.from({ length: bubbles }, (_, i) => <span
      key={i}
      className="sea-bubble"
      style={{
        '--x': `${4 + rnd(i, 1) * 92}%`,
        '--s': `${6 + rnd(i, 2) * 16}px`,
        '--t': `${9 + rnd(i, 3) * 10}s`,
        '--delay': `${-rnd(i, 4) * 14}s`,
      } as CSSProperties}
    />)}
  </div>
}