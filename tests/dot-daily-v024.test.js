// Grid Club v0.9.24 · Dot Trails Daily and shared vault contract checks.
// Run: node tests/dot-daily-v024.test.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const load=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const html=load('index.html'),game=load('game.js'),vault=load('vault-reward.js');
const stats=html.substring(html.indexOf('<section id="statsScreen"'),html.indexOf('</section>',html.indexOf('<section id="statsScreen"')));
const daily=html.substring(html.indexOf('<section id="dotDailyScreen"'),html.indexOf('</section>',html.indexOf('<section id="dotDailyScreen"')));
assert(daily.includes('Global leaderboard'));
for(const id of ['dotDailyPlay','dotDailyBack','dotDailyRank','dotDailyEntries','dotDailyRefresh','dotDailyResultNote']){
 assert(daily.includes('id="'+id+'"'),'Missing daily '+id);
 assert(game.includes("'"+id+"'"),'Unwired daily '+id);
}
assert(!stats.includes('Global leaderboard'),'Public leaderboard must not appear on Your stats');
assert(!stats.includes('communitySummary'),'Public community stats must be separate');
assert(game.includes('showPage(\'daily\');renderDailyPage()'));
assert(game.includes("mode==='practice'?null:savedGame(mode,size)"));
assert(game.includes("if(mode==='practice')return true; // Daily practice never overwrites ranked progress."));
assert(game.includes("if(mode==='practice')return {attemptId:game.attemptId"));
assert(game.includes("globalThis.GridDotTrailsApp={openDaily:showDailyScreen"));
assert(vault.includes('DURATION_MS=1250'));
assert(vault.includes("status.textContent='Credit balance'"));
assert(vault.includes("const button=create('button','vaultHold','Fill vault')"));
assert(!vault.includes('All credits safely banked'));
new Function(game);new Function(vault);new Function(load('pipe-shift.js'));
console.log('Dot Trails Daily UI and vault contract checks passed');
