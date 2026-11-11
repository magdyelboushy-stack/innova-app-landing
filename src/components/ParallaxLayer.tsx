import{motion,useReducedMotion,useScroll,useTransform}from'motion/react'
import type{ReactNode}from'react'
export function ParallaxLayer({className='',children,to=-120,range=[0,1]}:{className?:string;children:ReactNode;to?:number;range?:[number,number]}){const{scrollYProgress}=useScroll();const reduced=useReducedMotion();const y=useTransform(scrollYProgress,range,[0,reduced?0:to]);return <motion.div className={className} style={{y}}>{children}</motion.div>}
