type IPhoneTone = 'black' | 'white' | 'mist' | 'sage' | 'lavender' | 'red'

type IPhoneFrameProps = {
  screenshot: string
  viewBox: string
  label: string
  className?: string
  imageWidth?: number
  imageHeight?: number
  /** Frame colour. Default: black */
  tone?: IPhoneTone
}

/* iPhone 17: flat aluminium frame, thin even bezels, Dynamic Island,
   Action button + volume up/down on the left, side button + Camera Control on the right. */
export function IPhoneFrame({ screenshot, viewBox, label, className = '', imageWidth = 1490, imageHeight = 2366, tone = 'black' }: IPhoneFrameProps) {
  return <figure className={`iphone-frame iphone-frame--${tone} ${className}`.trim()}>
    <i className="iphone-frame__side iphone-frame__side--action" aria-hidden="true" />
    <i className="iphone-frame__side iphone-frame__side--volume-up" aria-hidden="true" />
    <i className="iphone-frame__side iphone-frame__side--volume-down" aria-hidden="true" />
    <i className="iphone-frame__side iphone-frame__side--power" aria-hidden="true" />
    <i className="iphone-frame__side iphone-frame__side--camera" aria-hidden="true" />
    <div className="iphone-frame__shell">
      <div className="iphone-frame__screen">
        <svg viewBox={viewBox} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice"><image href={screenshot} width={imageWidth} height={imageHeight} /></svg>
      </div>
      <span className="iphone-frame__island" aria-hidden="true"><i /></span>
      <span className="iphone-frame__reflection" aria-hidden="true" />
    </div>
  </figure>
}