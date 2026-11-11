import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root=process.cwd(),input=path.join(root,'design-refs'),output=path.join(root,'artifacts','phone-detection')
await fs.mkdir(output,{recursive:true})
const files=(await fs.readdir(input)).filter(file=>file.endsWith('.png')).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))
const reports=[]
for(const file of files){
 const full=path.join(input,file),image=sharp(full),meta=await image.metadata(),scale=Math.min(1,1600/meta.width),width=Math.round(meta.width*scale),height=Math.round(meta.height*scale)
 const {data}=await image.resize(width,height).removeAlpha().raw().toBuffer({resolveWithObject:true})
 const density=new Array(width).fill(0)
 for(let y=Math.round(height*.08);y<height;y++)for(let x=0;x<width;x++){const p=(y*width+x)*3,r=data[p],g=data[p+1],b=data[p+2];if(Math.max(r,g,b)-Math.min(r,g,b)>28||Math.min(r,g,b)<135)density[x]++}
 const threshold=Math.max(10,Math.round(height*.035));const runs=[];let start=-1
 for(let x=0;x<=width;x++){const hit=x<width&&density[x]>threshold;if(hit&&start<0)start=x;if(!hit&&start>=0){if(x-start>Math.max(35,width*.025))runs.push([start,x]);start=-1}}
 const boxes=runs.filter(([a,b])=>{const ratio=(b-a)/height;return ratio>.10&&ratio<.8}).map(([a,b],i)=>({id:i+1,x:Math.round(a/scale),y:Math.round(height*.08/scale),width:Math.round((b-a)/scale),height:Math.round(height*.84/scale),confidence:'heuristic'}))
 reports.push({file,width:meta.width,height:meta.height,boxes})
}
await fs.writeFile(path.join(output,'detected-phone-bounds.json'),JSON.stringify(reports,null,2))
const cards=[];for(const report of reports){const thumbW=300,thumbH=Math.round(report.height/report.width*thumbW),svg=`<svg width="${thumbW}" height="${thumbH}" xmlns="http://www.w3.org/2000/svg">${report.boxes.map(b=>`<rect x="${b.x/report.width*thumbW}" y="${b.y/report.height*thumbH}" width="${b.width/report.width*thumbW}" height="${b.height/report.height*thumbH}" fill="none" stroke="#FB7B64" stroke-width="3"/><text x="${b.x/report.width*thumbW+4}" y="${b.y/report.height*thumbH+16}" fill="#12424C" font-size="14" font-family="sans-serif">${b.id}</text>`).join('')}</svg>`;cards.push(await sharp(path.join(input,report.file)).resize({width:thumbW}).composite([{input:Buffer.from(svg),top:0,left:0}]).png().toBuffer())}
const columns=3,cellW=320,cellH=200,canvas=sharp({create:{width:columns*cellW,height:Math.ceil(cards.length/columns)*cellH,channels:4,background:'#FFFBF5'}})
await canvas.composite(cards.map((input,i)=>({input,left:(i%columns)*cellW+10,top:Math.floor(i/columns)*cellH+10}))).png().toFile(path.join(output,'contact-sheet.png'))
for(const report of reports)console.log(`${report.file}: ${report.boxes.length?report.boxes.map(b=>`#${b.id} x:${b.x} y:${b.y} w:${b.width} h:${b.height}`).join(' | '):'no confident candidates'}`)
console.log(`\nPreview: ${path.join(output,'contact-sheet.png')}`)
