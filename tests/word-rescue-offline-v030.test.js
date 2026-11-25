/* Grid Club v0.9.30: bundled offline dictionary + visual/credit rules.
 * Run: node tests/word-rescue-offline-v030.test.js
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const get=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const lexicon=get('word-rescue-lexicon.js');
const engine=get('word-rescue-engine.js');
const ui=get('word-rescue.js'),html=get('index.html'),css=get('word-rescue.css');
const context=vm.createContext({});
vm.runInContext(lexicon,context);
assert(typeof context.GridClubWordRescueLexicon==='string');
vm.runInContext(engine,context);
const words=context.GridClubWordRescueEngine.WORD_SET;
assert(words.size>90000,'Full 3-7-letter word list must be available immediately');
for(const word of ['CATS','DOGS','SHARKS','BEACHES','HOUSES','WOLVES','FLOWERS','QUICKLY','WORDS','TOWERS','SAVING','JUMPING']){
 if(word.length>7)continue;
 assert(words.has(word),'Basic English word rejected: '+word);
}
assert.equal(typeof context.GridClubWordRescueLexicon,'undefined','Lexicon source should be released after import');
const scriptOrder=[html.indexOf('word-rescue-lexicon.js?v=0.9.30'),html.search(/word-rescue-engine\.js\?v=[\d.]+/),
 html.search(/word-rescue\.js\?v=[\d.]+/)];
assert(scriptOrder.every(i=>i>0)&&scriptOrder[0]<scriptOrder[1]&&scriptOrder[1]<scriptOrder[2],
 'Lexicon must load before engine and UI, in order');
assert(!/\bfetch\s*\(/.test(ui),'No network dependence for dictionary');
assert(!ui.includes('GridClubCredits?.award'),'Free Play must not award Club Credits');
assert(!html.includes('id="wrTime"'),'Live clock removed; hazards provide the deadline');
assert(html.includes('class="wrCharacter"'),'Visible custom animated explorer');
assert(css.includes('wrFlailLeft')&&css.includes('wrPanic')&&css.includes('height:clamp(340px,48svh,490px)'),
 'Enlarged scene and near-water panic animation must ship');
assert(html.includes('role="img" aria-label="Gridda builds an elevated escape tower'));
console.log('Offline 97k-word English dictionary, credits, waterline UI and animated character checks passed');
