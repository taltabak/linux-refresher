/* Run with: node tests/smoke.cjs — no dependencies required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const store = new Map();
const elements = {
  'screen': {innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null},
  'app-header': {},
  'header-action': {hidden:false,innerHTML:'',dataset:{},querySelector:()=>null},
  'bottom-nav': {hidden:false,querySelectorAll:()=>['home','library','progress'].map(nav=>({dataset:{nav},classList:{toggle:()=>{}},setAttribute:()=>{},innerHTML:''}))},
  'toast': {textContent:'',classList:{add:()=>{},remove:()=>{}}}
};
const handlers = {};
const windowMock={LINUX_COMMANDS:[],confirm:()=>true,scrollTo:()=>{},addEventListener:()=>{},location:{protocol:'file:'}};
const context = vm.createContext({
  window:windowMock,
  document:{getElementById:id=>elements[id],addEventListener:(name,fn)=>handlers[name]=fn},
  localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},
  navigator:{},
  console,
  setTimeout:()=>1,
  clearTimeout:()=>{}
});
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),context);
const commands=windowMock.LINUX_COMMANDS;
assert.equal(commands.length,90);
for(const level of ['beginner','intermediate','advanced'])assert.equal(commands.filter(c=>c.level===level).length,30);
assert.equal(new Set(commands.map(c=>c.id)).size,90);
for(const c of commands){
  assert.equal(c.wrong.length,3,`${c.id} must have 3 distractors`);
  assert.equal(new Set([c.answer,...c.wrong]).size,4,`${c.id} must have 4 unique answers`);
  assert.ok(c.about&&c.meaning&&c.demo&&c.tip&&c.syntax);
  assert.ok(c.examples.length>=2);
}
function click(dataset){handlers.click({target:{closest:()=>({dataset,disabled:false})}});}
function state(){return JSON.parse(store.get('linux-drill-state-v1'));}
function current(){const s=state().active;return s.stage==='training'?s.queue[0].question:s.questions[s.index];}
function answer(correct){
  const q=current();
  const index=q.options.findIndex(x=>x.isCorrect===correct);
  assert.notEqual(index,-1);
  click({answer:String(index)});
  click({action:'submit'});
  const s=state().active;
  assert.equal(s.phase,'feedback');
  assert.equal(s.last.correct,correct);
  assert.ok(elements.screen.innerHTML.includes('Practical examples'));
  click({action:'next'});
}
click({setting:'level',value:'beginner'});
click({setting:'count',value:'5'});
click({setting:'type',value:'mixed'});
click({action:'start'});
assert.equal(state().active.total,5);
assert.equal(new Set(state().active.questions.map(q=>q.commandId)).size,5);
assert.ok(elements.screen.innerHTML.includes('Question 1 of 5'));
assert.deepEqual(Array.from(state().active.questions, q=>q.type),['meaning','task','meaning','task','meaning']);
answer(false);
for(let i=0;i<4;i++)answer(true);
assert.equal(state().active.stage,'results');
assert.equal(state().history[0].correct,4);
assert.ok(elements.screen.innerHTML.includes('80%'));
click({action:'train'});
assert.equal(state().active.trainingTotal,1);
answer(false);
assert.equal(state().active.stage,'training');
assert.equal(state().active.queue.length,1);
answer(true);
assert.equal(state().active.stage,'complete');
assert.equal(state().history[0].trained,true);
assert.equal(state().history[0].trainingAttempts,2);
click({action:'progress'});
assert.ok(elements.screen.innerHTML.includes('Your progress'));
click({action:'finish'});
assert.equal(state().active,null);
click({setting:'level',value:'advanced'});
click({setting:'count',value:'30'});
click({action:'start'});
assert.equal(state().active.total,30);
assert.equal(new Set(state().active.questions.map(q=>q.commandId)).size,30);
click({action:'pause'});
assert.ok(elements.screen.innerHTML.includes('Resume your session'));
click({action:'resume'});
assert.ok(elements.screen.innerHTML.includes('Question 1 of 30'));
console.log('PASS: 90 validated commands, 4-choice questions, 5- and 30-question sessions, correct/incorrect scoring, targeted retraining, repeat until mastered, progress, pause/resume.');
for(const level of ['beginner','intermediate','advanced']){
  for(const type of ['meaning','task']){
    click({action:'finish'});
    click({setting:'level',value:level});
    click({setting:'type',value:type});
    click({setting:'count',value:'30'});
    click({action:'start'});
    const qs=state().active.questions;
    assert.equal(qs.length,30);
    for(const q of qs){
      assert.equal(q.options.length,4,`${level}/${type}/${q.commandId}: exactly four options`);
      assert.equal(q.options.filter(x=>x.isCorrect).length,1,`${level}/${type}/${q.commandId}: exactly one correct option`);
      assert.equal(new Set(q.options.map(x=>x.text)).size,4,`${level}/${type}/${q.commandId}: distinct text options`);
    }
  }
}
console.log('PASS: all 180 command × question-type combinations have exactly 4 distinct options with 1 correct answer.');
