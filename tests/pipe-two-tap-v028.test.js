// Grid Club v0.9.28: one-tile tap and multi-tile tap semantics.
// Run node tests/pipe-two-tap-v028.test.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','pipe-shift.js'),'utf8');
const begin=source.indexOf('function clickCell(i){');
const end=source.indexOf('\nfunction undoMove()',begin);
assert(begin>=0&&end>begin,'clickCell source must be testable');
const clickSource=source.slice(begin,end);

function scenario(cells){
 const ctx={
   board:cells.map(kind=>({kind,fixed:kind==='wall'})),
   section:'game',won:false,expired:false,trialPending:false,
   dailyStartPending:false,hintSelection:null,hintPreviewActive:false,
   selected:null,moves:0,renders:0,
   render(){this.renders++;},
   slide(from,to){
     assert.equal(this.board[from]?.kind,'pipe');
     assert.equal(this.board[to]?.kind,'empty');
     this.board[to]=this.board[from];
     this.board[from]={kind:'empty',fixed:false};
     this.selected=null;
     this.moves++;
     return true;
   }
 };
 // The actual app click handler runs with state/methods supplied by the
 // isolated fake game, so this tests its behaviour, not a copy of its logic.
 vm.runInNewContext(clickSource+'\nthis.tap=clickCell;',ctx);
 return ctx;
}
for(const layout of [['pipe','empty','wall'],['pipe','empty','empty']]){
 const c=scenario(layout);
 c.tap(0);
 assert.equal(c.selected,0,'first tap must only select a pipe');
 assert.equal(c.moves,0,'first tap must NEVER move a pipe');
 assert.equal(c.board[0].kind,'pipe','selected pipe must stay put');
 c.tap(0);
 assert.equal(c.selected,null,'tapping selected pipe deselects it');
 assert.equal(c.moves,0,'deselection cannot consume moves');
 c.tap(0);c.tap(1);
 assert.equal(c.moves,1,'destination tap should move exactly once');
 assert.equal(c.board[1].kind,'pipe');
 assert.equal(c.selected,null,'successful move clears selection');
}
// A movable blank block follows exactly the same convention.
const block=scenario(['block','empty','wall']);
block.tap(0);
assert.equal(block.selected,0);assert.equal(block.moves,0);
// Selecting a pipe followed by a non-destination clears selection, no move.
const invalid=scenario(['pipe','empty','wall']);
invalid.tap(0);invalid.tap(2);
assert.equal(invalid.moves,0);
assert.equal(invalid.selected,null);
// Press-and-drag still commits one explicit movement gesture.
assert(source.includes('if(valid)slide(p.from,target);'),
 'Dragging should still be able to move in one gesture');
console.log('Pipe Shift one-option and multiple-option two-tap controls passed');
