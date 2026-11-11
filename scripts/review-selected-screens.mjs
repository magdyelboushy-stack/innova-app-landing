import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root=process.cwd(),refs=path.join(root,'design-refs'),out=path.join(root,'artifacts','phone-detection')
await fs.mkdir(out,{recursive:true})
// Semi-manual map: each source uses a top EN row and a lower AR row. The per-image
// cells use the observed 470px horizontal rhythm; rows deliberately exclude headings/notes.
const grids={
 '1 · Start and sign-in.png':[11,2], '2 · Learn.png':[12,2], '3 · Daily habit.png':[3,2], '4 · Save.png':[6,2], '5 · Souq.png':[3,2], '6 · Me and Collection.png':[3,2], '7 · Parent starts and signs in.png':[15,2], '8 · Parent links to a child.png':[9,2], '9 · Parent home.png':[11,2], '10 · States and errors.png':[12,2], '11 · Parent gate.png':[8,2]
}
const requested=[
 ['2 · Learn.png',2,'F7.1b learn map · ages 6–8'],['2 · Learn.png',3,'F7.1b learn map · ages 12–14'],['2 · Learn.png',8,'F8.4 activity route'],
 ['3 · Daily habit.png',1,'F9.1 daily goal'],['3 · Daily habit.png',3,'F9.3 freeze bubble'],['4 · Save.png',2,'F11.2 jar'],['5 · Souq.png',1,'F11.3 souq'],['5 · Souq.png',2,'F11.4 item'],['6 · Me and Collection.png',1,'F7.3 collection'],['8 · Parent links to a child.png',2,'F4.2 show QR'],['9 · Parent home.png',1,'F6.1 parent home']
]
const boxFor=(width,height,columns,row,col)=>{const left=Math.round(width*.018),right=Math.round(width*.018),pitch=(width-left-right)/columns;const cellW=Math.round(pitch*.73);const x=Math.round(left+(col-1)*pitch);const header=Math.round(height*.08),gap=Math.round(height*.055),bottom=Math.round(height*.035);const cellH=Math.floor((height-header-gap-bottom)/2);const y=header+(row-1)*(cellH+gap);return{x,y,width:Math.min(cellW,width-x),height:cellH}}
const manifest=[]
for(const [file,[columns,rows]] of Object.entries(grids)){const meta=await sharp(path.join(refs,file)).metadata();const labels=[];for(let row=1;row<=rows;row++)for(let col=1;col<=columns;col++)labels.push(`${file.replace(/^\d+ · /,'').replace('.png','')} ${row===1?'EN':'AR'} col${col}`);manifest.push({file,size:`${meta.width}×${meta.height}`,grid:`${columns} columns × ${rows} rows`,labels})}
await fs.writeFile(path.join(out,'semi-manual-grid-map.json'),JSON.stringify(manifest,null,2))
const cardW=320,cardH=510,cards=[]
for(const [file,col,name] of requested){const meta=await sharp(path.join(refs,file)).metadata();for(const [row,language] of [[1,'EN'],[2,'AR']]){const {x,y,width,height}=boxFor(meta.width,meta.height,grids[file][0],row,col);const body=await sharp(path.join(refs,file)).extract({left:x,top:y,width,height}).resize({width:300,height:440,fit:'contain',background:'#FFFBF5'}).png().toBuffer();const label=`${name}\n${language} · col ${col}`;const svg=`<svg width="320" height="510" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="304" height="494" rx="12" fill="none" stroke="#FB7B64" stroke-width="3"/><text x="18" y="470" font-family="Arial" font-size="14" font-weight="700" fill="#12424C">${label.split('\n').map((line,i)=>`<tspan x="18" dy="${i?'18':'0'}">${line}</tspan>`).join('')}</text></svg>`;cards.push({body,svg,label})}}
const canvas=sharp({create:{width:cardW*4,height:Math.ceil(cards.length/4)*cardH,channels:4,background:'#EAF7FA'}})
await canvas.composite(cards.flatMap((card,index)=>{const left=(index%4)*cardW+10,top=Math.floor(index/4)*cardH+10;return[{input:card.body,left,top},{input:Buffer.from(card.svg),left:left-10,top:top-10}]})).png().toFile(path.join(out,'selected-screens-review.png'))
for(const item of manifest){console.log(`${item.file}: ${item.size}; ${item.grid}`);console.log(`  ${item.labels.join(' | ')}`)}
console.log(`\nReview sheet: ${path.join(out,'selected-screens-review.png')}`)
