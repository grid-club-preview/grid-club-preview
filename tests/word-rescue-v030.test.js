/* Word Rescue v0.9.30 regression: plurals, broad dictionary, waterline clock. */
'use strict';
const assert=require('node:assert/strict');
const e=require('../word-rescue-engine.js');
for(const w of ['CATS','DOGS','BOXES','BUSHES','CITIES','BABIES','LEAVES','SHARKS','TOWERS','PIPES']){
 assert(e.WORD_SET.has(w),'Common plural missing: '+w);
}
for(const w of ['THEMS','VERYERS','DOGSES','CATSES'])
 assert(!e.WORD_SET.has(w),'Made-up plural should not be accepted: '+w);
const sample='BEACH BEACHES WOLVES QUICKLY FELLING BEHAVES SAVING SAVED CLIMBS CLEANED'.toLowerCase();
const before=e.WORD_SET.size,stats=e.importDictionary(sample);
assert(stats.total>=before);
for(const w of sample.toUpperCase().split(' '))assert(e.WORD_SET.has(w),'Broad dictionary import missing '+w);
assert.equal(e.importDictionary(sample).added,0,'Import should be idempotent');
assert.equal(e.importDictionary('bad_♠_words').total>=before,true);
const s=e.create(13);s.started=true;
assert.equal(e.validState(s),true);
assert.equal(s.elapsedMs,0);
e.advance(s,10000);
assert.equal(s.elapsedMs,10000);
assert.equal(s.expired,false);
assert(e.waterHeight(s)<e.safeHeight(s));
e.advance(s,30000);
assert.equal(s.expired,true,'Drowning must be driven by the waterline');
assert(e.waterHeight(s)>=e.safeHeight(s));
assert.equal(e.validState(s),true);
const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','word-rescue-engine.js'),'utf8');
assert(!src.includes('s.elapsedMs>=DURATION_MS||waterHeight(s)'),
 'Hard time-out must be removed from failure logic');
console.log('Word Rescue v0.9.30: common plurals, extended dictionary and waterline-only failure passed');
