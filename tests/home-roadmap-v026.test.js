// Grid Club v0.9.26 · home roadmap / navigation regression.
// Run: node tests/home-roadmap-v026.test.js
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const load=name=>fs.readFileSync(path.resolve(__dirname,'..',name),'utf8');
const html=load('index.html'),sw=load('sw.js'),css=load('home-roadmap.css');
const home=html.slice(html.indexOf('<section id="home">'),html.indexOf('</section>',html.indexOf('<section id="home">')));
assert(home.includes('PUZZLE DECK'));
assert(home.includes('ARCADE'));
assert(home.indexOf('PUZZLE DECK')<home.indexOf('ARCADE'));
for(const id of ['freeStart','pipeShiftEntry'])
 assert(home.includes('id="'+id+'"'),'Playable game missing: '+id);
for(const title of ['Block Shift','Grid Flip','Words Down','Starting Grid','Towers'])
 assert(home.includes('<strong>'+title+'</strong>'),'Planned title missing: '+title);
const planned=home.match(/<article class="roadmapCard"/g)||[];
assert.equal(planned.length,5);
assert(!home.includes('<button class="roadmapCard"'),'Planned games must be nonclickable');
assert(!home.includes('tabindex="0"'),'Planned games must not be keyboard actions');
assert(home.indexOf('Connection diagnostics (beta)')>home.indexOf('Towers'),'Diagnostics must be last');
assert(home.includes('A pocketful of challenges.'));
assert(html.includes('id="homeVersion">v0.9.26'));
assert(html.includes('home-roadmap.css?v=0.9.26'));
assert(sw.includes('gridclub-pwa-v0.9.26')&&sw.includes('./home-roadmap.css?v=0.9.26'));
assert(css.includes('.roadmapGrid'));
console.log('Grid Club home roadmap checks passed: 2 playable, 5 planned, separate arcade, diagnostics last');
