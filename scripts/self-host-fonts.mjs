import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
const families={alegreya:'Alegreya','atkinson-hyperlegible-next':'Atkinson Hyperlegible Next','courier-prime':'Courier Prime',caveat:'Caveat'};
await mkdir('public/fonts',{recursive:true});
let css='/* OFL fonts bundled from Fontsource; no runtime font service. */\n';
for(const [slug,family] of Object.entries(families)){
 const root=`node_modules/@fontsource/${slug}`;
 for(const file of await readdir(`${root}/files`)){
  if(!/-latin-(400|700|800)-(normal|italic)\.woff2$/.test(file))continue;
  const [,weight,style]=file.match(/-(400|700|800)-(normal|italic)\.woff2$/);
  await copyFile(`${root}/files/${file}`,`public/fonts/${file}`);
  css+=`@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:swap;src:url('./fonts/${file}') format('woff2')}\n`;
 }
 await copyFile(`${root}/LICENSE`,`public/fonts/${slug}-LICENSE.txt`);
}
await writeFile('public/fonts.css',css);
