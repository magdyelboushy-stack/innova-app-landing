import {useCallback,useEffect,useRef,useState} from 'react'
import type {Locale} from '../../i18n/copy'

type Drop={x:number;y:number;speed:number;kind:'coin'|'shiny'|'spend';id:number}
type Particle={x:number;y:number;life:number}
const GAME_TIME=30
const GOAL=35
export function JarRush({locale}:{locale:Locale}){
 const ar=locale==='ar'
 const canvasRef=useRef<HTMLCanvasElement>(null)
 const state=useRef({drops:[] as Drop[],particles:[] as Particle[],jar:.5,score:0,combo:0,time:GAME_TIME,spawn:0,last:0,id:0,running:false,paused:false,keys:{left:false,right:false},sound:false})
 const raf=useRef(0)
 const [phase,setPhase]=useState<'ready'|'playing'|'ended'>('ready')
 const [score,setScore]=useState(0),[seconds,setSeconds]=useState(GAME_TIME),[best,setBest]=useState(0),[paused,setPaused]=useState(false),[sound,setSound]=useState(false)
 const audioCtx=useRef<AudioContext|null>(null)
 const playSound=useCallback(()=>{if(!state.current.sound)return;try{audioCtx.current??=new AudioContext();const ctx=audioCtx.current;const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(600,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(1000,ctx.currentTime+.08);g.gain.setValueAtTime(.055,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.13);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.14)}catch{/* optional audio */}},[])
 const reset=()=>{state.current={drops:[],particles:[],jar:.5,score:0,combo:0,time:GAME_TIME,spawn:0,last:0,id:0,running:true,paused:false,keys:{left:false,right:false},sound:state.current.sound};setScore(0);setSeconds(GAME_TIME);setPaused(false);setPhase('playing')}
 useEffect(()=>{state.current.sound=sound},[sound])
 useEffect(()=>{
  const c=canvasRef.current;if(!c)return;const ctx=c.getContext('2d');if(!ctx)return
  const W=380,H=460
  const draw=(time:number)=>{
   const s=state.current
   const dt=s.last?Math.min((time-s.last)/1000,.045):0;s.last=time
   if(s.running&&!s.paused){
    s.time=Math.max(0,s.time-dt)
    s.spawn+=dt
    if(s.keys.left)s.jar=Math.max(.095,s.jar-dt*.72)
    if(s.keys.right)s.jar=Math.min(.905,s.jar+dt*.72)
    if(s.spawn>.48){s.spawn=0;s.drops.push({id:s.id++,x:.08+Math.random()*.84,y:-25,speed:125+Math.random()*80,kind:Math.random()<.17?'spend':Math.random()<.23?'shiny':'coin'})}
    for(const d of s.drops){d.y+=d.speed*dt;if(d.y>H-75&&d.y<H-44&&Math.abs(d.x-s.jar)<.13){if(d.kind==='spend'){s.score=Math.max(0,s.score-3);s.combo=0}else{s.score+=d.kind==='shiny'?3:1;s.combo++;playSound()}s.particles.push({x:d.x*W,y:d.y,life:.5});d.y=H+90;setScore(s.score)}}
    s.drops=s.drops.filter(d=>d.y<H+35)
    s.particles.forEach(p=>p.life-=dt);s.particles=s.particles.filter(p=>p.life>0)
    const remaining=Math.ceil(s.time);setSeconds(old=>old===remaining?old:remaining)
    if(s.time===0){s.running=false;setBest(b=>Math.max(b,s.score));setPhase('ended')}
   }
   ctx.clearRect(0,0,W,H)
   const dark='#12424C',coral='#FB7B64',gold='#F1B232'
   // Hand-drawn lantern line and lanterns.
   ctx.strokeStyle='#D6FE51';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,20);ctx.quadraticCurveTo(W/2,60,W,20);ctx.stroke()
   for(let i=0;i<5;i++){const x=45+i*73;ctx.fillStyle='#FFC67A';ctx.fillRect(x-11,30+(i%2)*10,22,27);ctx.fillStyle='#E16640';ctx.fillRect(x-15,26+(i%2)*10,30,6);ctx.fillStyle=dark;ctx.fillRect(x-3,38+(i%2)*10,6,10)}
   for(const d of s.drops){const x=d.x*W,y=d.y;ctx.beginPath();ctx.arc(x,y,d.kind==='spend'?18:15,0,Math.PI*2);ctx.fillStyle=d.kind==='spend'?coral:d.kind==='shiny'?'#D6FE51':gold;ctx.fill();ctx.strokeStyle=d.kind==='spend'?'#D95A4B':'#DC8C20';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle=dark;ctx.font='bold 18px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(d.kind==='spend'?'×':d.kind==='shiny'?'3':'1',x,y+1)}
   for(const p of s.particles){ctx.globalAlpha=Math.max(0,p.life*2);ctx.strokeStyle='#D6FE51';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,27*(1-p.life),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
   const x=s.jar*W
   ctx.fillStyle='rgba(234,247,250,.45)';ctx.strokeStyle='#FFFBF5';ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(x-53,H-100,106,90,22);ctx.fill();ctx.stroke()
   ctx.fillStyle=gold;ctx.beginPath();ctx.roundRect(x-46,H-25-Math.min(s.score/GOAL,1)*58,92,Math.max(2,Math.min(s.score/GOAL,1)*58),10);ctx.fill()
   ctx.fillStyle=dark;ctx.font='bold 16px Arial';ctx.fillText(ar?'حصّالتي':'MY JAR',x,H-60)
   raf.current=requestAnimationFrame(draw)
  }
  raf.current=requestAnimationFrame(draw)
  return()=>cancelAnimationFrame(raf.current)
 },[ar,playSound])
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(!['ArrowLeft','ArrowRight',' '].includes(e.key))return;if(document.activeElement?.closest('#jar-rush')){e.preventDefault();if(e.key===' '&&phase==='playing'){state.current.paused=!state.current.paused;setPaused(state.current.paused)}else if(e.key==='ArrowLeft')state.current.keys.left=true;else if(e.key==='ArrowRight')state.current.keys.right=true}}
 const onUp=(e:KeyboardEvent)=>{if(e.key==='ArrowLeft')state.current.keys.left=false;if(e.key==='ArrowRight')state.current.keys.right=false};window.addEventListener('keydown',onKey);window.addEventListener('keyup',onUp);return()=>{window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onUp)}},[phase])
 const onPointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!state.current.running||state.current.paused)return;const r=e.currentTarget.getBoundingClientRect();const ratio=(e.clientX-r.left)/r.width;state.current.jar=Math.max(.095,Math.min(.905,ratio))}
 return <section className="jar-rush-section" id="jar-rush" tabIndex={0} aria-label={ar?'لعبة حصّالة أوكتو':'Jar Rush game'}>
 <div className="jar-rush-intro"><p className="section-kicker">07 / PLAY</p><h2>{ar?'جاهز تتحدى نفسك؟':'Ready for a little challenge?'}</h2><p>{ar?'30 ثانية. لمّ العملات وحوش عشان قبعة أوكتو. خلي بالك من المغريات!':'30 seconds. Catch coins, avoid tempting buys and save up for Okto’s hat.'}</p></div>
 <div className="game-shell"><div className="game-top"><strong>{ar?'سباق الحصّالة':'JAR RUSH'}</strong><span aria-live="polite">{seconds}s</span><button type="button" onClick={()=>setSound(!sound)} aria-pressed={sound}>{sound?'♪ ON':'♪ OFF'}</button></div>
 <div className="game-goal"><span>{ar?'قبعة المستكشف':'Explorer hat'}</span><b>{score} / {GOAL}</b><div className="game-meter"><i style={{width:`${Math.min(100,score/GOAL*100)}%`}}/></div></div>
 <div className="game-canvas-wrap"><canvas ref={canvasRef} width={380} height={460} onPointerMove={onPointer} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);onPointer(e)}} aria-label={ar?'حرّك الحصّالة يمين وشمال':'Move the jar left and right'} />
 {phase!=='playing'&&<div className="game-overlay"><h3>{phase==='ready'?(ar?'حصّلتك مستنياك!':'Your jar is waiting!'):(ar?'برافو عليك!':'Nice saving!')}</h3><p>{phase==='ended'?(ar?`حوّشت ${score} عملة. تصرفهم ولا تكمّل تحويش؟`:`You saved ${score} coins. Spend them or keep saving?`):(ar?'امسك العملات، وابعد عن فقاعات الصرف.':'Catch coins and avoid spend bubbles.')}</p><button className="game-main-button" onClick={reset}>{phase==='ready'?(ar?'العب دلوقتي':'Start playing'):(ar?'العب تاني':'Play again')}</button>{phase==='ended'&&<a className="game-followup" href="#get-the-app">{ar?'كمّل تحويش في التطبيق':'Keep saving in the app'}</a>}</div>}
 {phase==='playing'&&paused&&<div className="game-overlay"><h3>{ar?'اللعبة واقفة':'Paused'}</h3><button className="game-main-button" onClick={()=>{state.current.paused=false;setPaused(false)}}>{ar?'كمّل':'Resume'}</button></div>}</div>
 <div className="game-bottom"><span>{ar?'هدفك: حوّش عشان الحاجة اللي نفسك فيها.':'Save toward your goal.'}</span><button type="button" onClick={()=>{state.current.paused=!state.current.paused;setPaused(state.current.paused)}} disabled={phase!=='playing'}>{paused?(ar?'كمّل':'Resume'):(ar?'وقّف':'Pause')}</button></div><small>{ar?`أفضل نتيجة: ${best} · اتحكم باللمس أو الأسهم`:`Best: ${best} · Drag, touch or use arrow keys`}</small></div>
 </section>
}
