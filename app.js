/* Linux Drill — vanilla JavaScript, local-only state, no external services. */
(() => {
  'use strict';
  const COMMANDS = window.LINUX_COMMANDS || [];
  const COMMAND_BY_ID = new Map(COMMANDS.map(command => [command.id, command]));
  const KEY = 'linux-drill-state-v1';
  const LEVELS = ['beginner', 'intermediate', 'advanced'];
  const ICONS = {
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    left:'<path d="m15 18-6-6 6-6"/>',
    close:'<path d="M18 6 6 18M6 6l12 12"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    xCircle:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/>',
    chart:'<path d="M3 3v18h18"/><path d="M7 16v-4m5 4V7m5 9v-6"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    terminal:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3m6 0h4"/>',
    flame:'<path d="M12 22c4.6 0 8-3 8-7.8 0-3.7-2-6.6-5.4-9-.2 2.1-1.2 3.4-2.3 4.1-.2-2.8-2-5.5-4.1-7.3.2 3.8-1.4 5.7-2.6 7.4C4.3 11 4 12.4 4 14.2 4 19 7.4 22 12 22Z"/>',
    sliders:'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    light:'<path d="M9 18h6m-5 4h4M9 15c-1.8-1.1-3-2.9-3-5a6 6 0 1 1 12 0c0 2.1-1.2 3.9-3 5-.7.5-1 1.1-1 2H10c0-.9-.3-1.5-1-2Z"/>',
    refresh:'<path d="M20 11a8 8 0 0 0-14.1-4.9L4 8m0-5v5h5M4 13a8 8 0 0 0 14.1 4.9L20 16m-5 0h5v5"/>',
    bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/>',
    trophy:'<path d="M8 21h8m-4-4v4M6 4h12v6a6 6 0 0 1-12 0V4Zm0 2H3v3a4 4 0 0 0 4 4m11-7h3v3a4 4 0 0 1-4 4"/>',
    layers:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
    shield:'<path d="m12 22 8-4V6l-8-4-8 4v12l8 4Z"/><path d="m9 12 2 2 4-4"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    play:'<path d="m8 5 11 7-11 7V5Z"/>',
    pause:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
  };
  const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.terminal}</svg>`;
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const shuffle = list => { const array = [...list]; for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];} return array; };
  const defaultSettings = {level:'intermediate',count:10,type:'mixed'};
  const defaultData = () => ({settings:{...defaultSettings},history:[],stats:{},active:null});
  function loadData(){
    try{
      const saved = JSON.parse(localStorage.getItem(KEY));
      if(!saved || typeof saved!=='object') return defaultData();
      return {
        settings:{...defaultSettings,...(saved.settings || {})},
        history:Array.isArray(saved.history)?saved.history:[],
        stats:saved.stats && typeof saved.stats==='object'?saved.stats:{},
        active:saved.active && typeof saved.active==='object'?saved.active:null
      };
    }catch(_){return defaultData();}
  }
  let data = loadData();
  let view = data.active ? (data.active.stage==='results' ? 'results' : data.active.stage==='complete' ? 'complete' : data.active.phase==='feedback' ? 'feedback' : 'quiz') : 'home';
  let detailReturn = 'library';
  let selectedDetail = '';
  let searchText = '';
  let libraryLevel = 'all';
  let pendingInstall = null;
  let toastTimer = null;
  const screen = document.getElementById('screen');
  const headerAction = document.getElementById('header-action');
  const nav = document.getElementById('bottom-nav');
  const toastNode = document.getElementById('toast');

  function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(err){console.warn('Progress could not be saved:',err);}}
  function toast(message){toastNode.textContent=message;toastNode.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastNode.classList.remove('show'),2800);}
  function currentSession(){return data.active;}
  function currentQuestion(){const s=currentSession();return !s?null:s.stage==='training'?s.queue?.[0]?.question:s.questions?.[s.index];}
  function activeOptions(){return currentQuestion()?.options || [];}
  function commandFor(question){return COMMAND_BY_ID.get(question.commandId);}
  function formattedLevel(level){return level==='mixed'?'Mixed levels':(level[0].toUpperCase()+level.slice(1));}
  function timeString(date){try{return new Date(date).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}catch(_){return 'Recent';}}
  function scrollTop(){window.scrollTo({top:0,behavior:'instant'});}
  function navigate(target){view=target;render();scrollTop();}
  function primary(text,action,extra=''){return `<button class="primary-button" data-action="${action}" ${extra}>${escapeHTML(text)} ${icon('arrow')}</button>`;}
  function secondary(text,action,extra=''){return `<button class="secondary-button" data-action="${action}" ${extra}>${escapeHTML(text)}</button>`;}
  function makeQuestion(command,type){
    let choices;
    if(type==='meaning'){
      const sameGroup = shuffle(COMMANDS.filter(d=>d.id!==command.id && d.group===command.group && d.level===command.level && d.meaning!==command.meaning));
      const broader = shuffle(COMMANDS.filter(d=>d.id!==command.id && d.level===command.level && !sameGroup.includes(d) && d.meaning!==command.meaning));
      const distractors = [...sameGroup,...broader].slice(0,3).map(d=>d.meaning);
      choices=[command.meaning,...distractors];
    }else{
      choices=[command.answer,...command.wrong];
    }
    const unique=[...new Set(choices)];
    const options=shuffle(unique.map(text=>({text,isCorrect:text===choices[0]})));
    return {commandId:command.id,type,options};
  }
  function startSession(ids=null){
    const unfinished=data.active && ['initial','training'].includes(data.active.stage);
    if(unfinished && !window.confirm('Start a new session? Your unfinished session will be replaced.'))return;
    let pool = ids ? ids.map(id=>COMMAND_BY_ID.get(id)).filter(Boolean) : COMMANDS.filter(c=>c.level===data.settings.level);
    pool=shuffle(pool);
    const amount=ids?Math.min(10,pool.length):Math.min(Number(data.settings.count)||10,pool.length);
    if(!amount){toast('No commands to practice yet.');return;}
    const questions=pool.slice(0,amount).map((command,index)=>{
      const type=data.settings.type==='mixed' ? (index%2===0?'meaning':'task') : data.settings.type;
      return makeQuestion(command,type);
    });
    data.active={id:`session-${Date.now()}-${Math.floor(Math.random()*10000)}`,level:ids?'mixed':data.settings.level,total:questions.length,started:Date.now(),questions,index:0,phase:'question',stage:'initial',selected:null,last:null,answers:[],queue:[],mastered:[],trainingAttempts:0,trainingTotal:0};
    save();navigate('quiz');
  }
  function setSetting(name,value){
    if(name==='level' && !LEVELS.includes(value))return;
    if(name==='count' && ![5,10,20,30].includes(Number(value)))return;
    if(name==='type' && !['mixed','meaning','task'].includes(value))return;
    data.settings[name]=name==='count'?Number(value):value;save();render();
  }
  function selectAnswer(index){
    const s=currentSession();if(!s || s.phase!=='question')return;
    if(!Number.isInteger(index) || index<0 || index>=activeOptions().length)return;
    s.selected=index;save();
    screen.querySelectorAll('.answer-button').forEach((button,i)=>{
      const chosen=i===index;button.classList.toggle('is-selected',chosen);
      button.setAttribute('aria-pressed',String(chosen));
    });
    const submit=screen.querySelector('[data-action="submit"]');if(submit)submit.disabled=false;
  }
  function trackAttempt(id,correct,isTraining){
    const item=data.stats[id] || {attempts:0,correct:0,misses:0,trainingCorrect:0};
    item.attempts++;if(correct)item.correct++;else item.misses++;
    if(isTraining && correct)item.trainingCorrect++;
    item.lastSeen=Date.now();item.lastCorrect=correct;data.stats[id]=item;
  }
  function submitAnswer(){
    const s=currentSession();if(!s || s.phase!=='question' || s.selected==null)return;
    const q=currentQuestion();if(!q)return;
    const picked=q.options[s.selected];
    const correct=Boolean(picked?.isCorrect);
    s.last={commandId:q.commandId,type:q.type,selectedText:picked.text,correct};
    s.phase='feedback';trackAttempt(q.commandId,correct,s.stage==='training');
    if(s.stage==='initial')s.answers.push({...s.last});
    else s.trainingAttempts++;
    save();navigate('feedback');
  }
  function finishInitial(){
    const s=currentSession();if(!s)return;
    s.stage='results';s.phase='question';s.selected=null;
    const correct=s.answers.filter(x=>x.correct).length;
    if(!data.history.some(record=>record.id===s.id)){
      data.history.unshift({id:s.id,date:Date.now(),level:s.level,total:s.total,correct,missed:[...new Set(s.answers.filter(x=>!x.correct).map(x=>x.commandId))],trained:false,trainingAttempts:0});
      data.history=data.history.slice(0,100);
    }
    save();navigate('results');
  }
  function finishTraining(){
    const s=currentSession();if(!s)return;
    s.stage='complete';s.phase='question';s.selected=null;
    const record=data.history.find(h=>h.id===s.id);
    if(record){record.trained=true;record.trainingAttempts=s.trainingAttempts;}
    save();navigate('complete');
  }
  function advance(){
    const s=currentSession();if(!s || s.phase!=='feedback' || !s.last)return;
    if(s.stage==='initial'){
      s.index++;
      s.selected=null;s.last=null;s.phase='question';
      if(s.index>=s.questions.length)finishInitial();else{save();navigate('quiz');}
    }else if(s.stage==='training'){
      const attempted=s.queue.shift();
      if(s.last.correct){if(!s.mastered.includes(attempted.commandId))s.mastered.push(attempted.commandId);}
      else{
        const d=COMMAND_BY_ID.get(attempted.commandId);
        const nextType=attempted.question.type==='meaning'?'task':'meaning';
        s.queue.push({commandId:d.id,question:makeQuestion(d,nextType)});
      }
      s.selected=null;s.last=null;s.phase='question';
      if(s.queue.length===0)finishTraining();else{save();navigate('quiz');}
    }
  }
  function startTraining(){
    const s=currentSession();if(!s || s.stage!=='results')return;
    const missed=s.answers.filter(x=>!x.correct);
    if(!missed.length){toast('Perfect score — no mistakes to revisit!');return;}
    s.queue=shuffle(missed).map(x=>{
      const command=COMMAND_BY_ID.get(x.commandId);
      return {commandId:x.commandId,question:makeQuestion(command,x.type==='meaning'?'task':'meaning')};
    });
    s.trainingTotal=s.queue.length;s.trainingAttempts=0;s.mastered=[];s.stage='training';s.phase='question';s.last=null;s.selected=null;
    save();navigate('quiz');
  }
  function abandonToHome(){navigate('home');toast('Session saved. You can resume it anytime.');}
  function exitToHome(){data.active=null;save();navigate('home');}
  function headerNav(){
    const hideNav=['quiz','feedback','results','complete','detail'].includes(view);
    nav.hidden=hideNav;
    if(!hideNav){
      nav.querySelectorAll('.nav-item').forEach(button=>{
        const active=button.dataset.nav===view;
        button.classList.toggle('is-active',active);
        button.setAttribute('aria-current',active?'page':'false');
        button.innerHTML=icon(button.dataset.nav==='home'?'home':button.dataset.nav==='library'?'book':'chart')+`<span>${button.dataset.nav==='home'?'Practice':button.dataset.nav==='library'?'Commands':'Progress'}</span>`;
      });
    }
    headerAction.hidden=false;
    if(view==='home'){
      if(pendingInstall){headerAction.innerHTML=icon('download')+' Install app';headerAction.dataset.action='install';}
      else{headerAction.innerHTML=icon('layers')+` ${COMMANDS.length} commands`;headerAction.dataset.action='library';}
    }else if(view==='quiz'||view==='feedback'){
      headerAction.innerHTML=icon('pause')+' Save & exit';headerAction.dataset.action='pause';
    }else if(view==='detail'){
      headerAction.innerHTML=icon('close')+' Close';headerAction.dataset.action='back-detail';
    }else if(view==='results'||view==='complete'){
      headerAction.innerHTML=icon('close')+' Home';headerAction.dataset.action='finish';
    }else{headerAction.innerHTML=icon('home')+' Practice';headerAction.dataset.action='home';}
    headerAction.querySelector('svg')?.setAttribute('style','width:14px;height:14px');
  }
  function renderHome(){
    const s=data.settings;
    const active=data.active && ['initial','training'].includes(data.active.stage);
    const countSessions=data.history.length;
    screen.innerHTML=`
      <div class="eyebrow">YOUR TERMINAL JOURNEY STARTS HERE</div>
      <h1 class="hero-title">Small quizzes.<br><span class="accent">Big skills.</span></h1>
      <p class="description">Learn real Linux commands, understand every answer, and train your mistakes until they stick.</p>
      <div class="hero-graphic" aria-label="Terminal illustration"><div class="terminal-chrome"><i></i><i></i><i></i><span>your terminal</span></div><div class="hero-code"><span>$</span> grep -n "success" progress.log<br><span class="comment"># practice makes progress</span><br><span>$</span> <span style="display:inline-block;width:7px;height:13px;background:#b7f56d;vertical-align:-2px;animation:blink 1.3s step-end infinite"></span></div></div>
      ${active?`<button class="outline-button" data-action="resume" style="margin-top:16px">${icon('play')} Resume ${data.active.stage==='training'?'retraining':'your session'} ${icon('arrow')}</button>`:''}
      <div class="section-title">Choose difficulty <small>30 commands per level</small></div>
      <div class="level-grid">
        ${LEVELS.map((level,i)=>`<button class="level-button ${s.level===level?'is-selected':''}" data-setting="level" data-value="${level}" aria-pressed="${s.level===level}">${icon(i===0?'book':i===1?'terminal':'bolt')}<strong>${formattedLevel(level)}</strong><small>${['Core commands','Everyday tools','Power user'][i]}</small></button>`).join('')}
      </div>
      <div class="section-title">Questions per session</div>
      <div class="count-grid">${[5,10,20,30].map(n=>`<button class="count-button ${s.count===n?'is-selected':''}" data-setting="count" data-value="${n}" aria-pressed="${s.count===n}">${n}</button>`).join('')}</div>
      <div class="section-title">Question format</div>
      <div class="mode-group" role="group" aria-label="Question format">${[['mixed','⇄ Mixed'],['meaning','→ Meaning'],['task','→ Command']].map(([value,label])=>`<button class="mode-option ${s.type===value?'is-selected':''}" data-setting="type" data-value="${value}" aria-pressed="${s.type===value}">${label}</button>`).join('')}</div>
      <div class="button-stack bottom-action">${primary(`Start ${s.count}-question session`,'start')}<p class="helper">No account required · Saves on this device · Works offline after installation</p></div>
      <div class="mini-stats"><span>${icon('layers')} ${COMMANDS.length} commands</span><span>${icon('trophy')} ${countSessions} completed ${countSessions===1?'session':'sessions'}</span></div>
    `;
  }
  function renderQuiz(){
    const s=currentSession();const q=currentQuestion();if(!s||!q){navigate('home');return;}
    const retrain=s.stage==='training';
    const current=retrain?s.mastered.length+1:s.index+1;
    const total=retrain?s.trainingTotal:s.total;
    const percent=retrain?Math.round(s.mastered.length/Math.max(1,s.trainingTotal)*100):Math.round(s.index/s.total*100);
    screen.innerHTML=`
      <div class="quiz-top"><button class="back-button" data-action="pause">${icon('left')} Save & exit</button><span class="pill ${retrain?'training':s.level==='beginner'?'beginner':s.level==='advanced'?'advanced':''}">${retrain?'FOCUS TRAINING':formattedLevel(s.level)}</span></div>
      <div class="progress-labels"><span>${retrain?`${s.queue.length} ${s.queue.length===1?'command':'commands'} left to master`:`Question ${current} of ${total}`}</span><span>${percent}%</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
      <div class="quiz-type">${icon(retrain?'refresh':'bolt')} ${retrain?'MASTER YOUR MISTAKES':q.type==='meaning'?'COMMAND → MEANING':'TASK → COMMAND'}</div>
      <h1 class="quiz-question">${q.type==='meaning'?'What does this command do?':'Which command would you use?'}</h1>
      ${q.type==='meaning'?`<div class="command-box"><div class="terminal-chrome"><i></i><i></i><i></i><span>terminal</span></div><pre><span class="prompt-sign">$ </span>${escapeHTML(commandFor(q).demo)}</pre></div>`:`<div class="task-card"><div class="task-icon">${icon('terminal')}</div>${escapeHTML(commandFor(q).task)}</div>`}
      <div class="answers" role="group" aria-label="Answer choices">${q.options.map((option,i)=>`<button class="answer-button ${q.type==='task'?'is-code':''} ${s.selected===i?'is-selected':''}" data-answer="${i}" aria-pressed="${s.selected===i}"><span class="answer-letter">${'ABCD'[i]}</span><span class="answer-text">${escapeHTML(option.text)}</span></button>`).join('')}</div>
      <div class="button-stack bottom-action">${primary('Check answer','submit',s.selected==null?'disabled':'')}<p class="helper">Choose one answer. Every question has a detailed explanation.</p></div>
    `;
  }
  function renderFeedback(){
    const s=currentSession();if(!s?.last){navigate('quiz');return;}
    const last=s.last;const d=COMMAND_BY_ID.get(last.commandId);
    const correctAnswer=last.type==='meaning'?d.meaning:d.answer;
    const training=s.stage==='training';
    const nextIsEnd=training?(s.queue.length===1 && last.correct):(s.index+1>=s.questions.length);
    const examples=[[d.demo,d.meaning],...d.examples];
    screen.innerHTML=`
      <div class="quiz-top"><button class="back-button" data-action="pause">${icon('left')} Save & exit</button><span class="pill ${training?'training':''}">${training?'RETRAINING':'EXPLANATION'}</span></div>
      <div class="feedback-symbol ${last.correct?'':'wrong'}">${icon(last.correct?'checkCircle':'light')}</div>
      <h1 class="feedback-title">${last.correct?'Exactly right!':'Not quite. Let’s learn.'}</h1>
      <p class="feedback-subtitle">${last.correct?'Great answer. Here’s why it works and where you can use it.':training?'Review the explanation. This command will return until you answer it correctly.':'Read the explanation, then practice this command again after the session.'}</p>
      <div class="answer-reveal"><div class="micro-heading">CORRECT ANSWER</div><code>${escapeHTML(correctAnswer)}</code></div>
      ${last.correct?'':`<p class="your-answer"><strong>Your answer:</strong> <code>${escapeHTML(last.selectedText)}</code></p>`}
      <div class="info-card"><h3>${icon('book')} How ${escapeHTML(d.id)} works</h3><p>${escapeHTML(d.about)}</p></div>
      <div class="info-card"><h3>${icon('terminal')} Syntax</h3><code>${escapeHTML(d.syntax)}</code></div>
      <div class="info-card"><h3>${icon('layers')} Practical examples</h3><div class="examples-list">${examples.map(([code,meaning])=>`<div class="example-row"><code>$ ${escapeHTML(code)}</code><p>${escapeHTML(meaning)}</p></div>`).join('')}</div></div>
      <div class="tip-card"><strong>💡 Remember:</strong> ${escapeHTML(d.tip)}</div>
      <div class="button-stack bottom-action">${primary(training?(nextIsEnd?'Finish training':'Continue training'):nextIsEnd?'See session results':'Next question','next')}</div>
    `;
  }
  function renderResults(){
    const s=currentSession();if(!s){navigate('home');return;}
    const correct=s.answers.filter(a=>a.correct).length;
    const misses=s.answers.filter(a=>!a.correct);
    const score=Math.round(correct/s.total*100);
    const title=score===100?'Perfect session!':score>=80?'Great job!':score>=60?'Nice progress!':'Keep building!';
    screen.innerHTML=`
      <div class="result-heading"><div class="eyebrow">SESSION FINISHED</div><h1>${title}</h1><p>${escapeHTML(formattedLevel(s.level))} · ${s.total} questions completed</p></div>
      <div class="score-donut" style="--score:${score}%"><div class="score-center"><strong>${score}%</strong><small>YOUR SCORE</small></div></div>
      <div class="summary-grid"><div class="summary-cell"><strong class="green">${correct}</strong><small>Correct answers</small></div><div class="summary-cell"><strong class="orange">${misses.length}</strong><small>Need practice</small></div></div>
      ${misses.length?`<div class="section-title">Commands to strengthen <small>Tap to study</small></div><div class="command-list">${misses.map(a=>commandCard(COMMAND_BY_ID.get(a.commandId))).join('')}</div>`:`<div class="notice"><strong>All correct!</strong> You can start a fresh session or explore the command reference library.</div>`}
      <div class="button-stack bottom-action">${misses.length?primary(`Train ${misses.length} missed ${misses.length===1?'question':'questions'}`,'train'):primary('Start another session','finish')}${misses.length?secondary('Start a new session','finish'):secondary('Browse commands','library')}</div>
    `;
  }
  function renderComplete(){
    const s=currentSession();if(!s){navigate('home');return;}
    screen.innerHTML=`
      <div class="eyebrow" style="text-align:center;margin-top:29px">RETRAINING COMPLETE</div>
      <div class="complete-illustration">${icon('trophy')}</div>
      <h1 class="complete-title">Mistakes mastered.</h1>
      <p class="complete-desc">You revisited every missed question and answered each command correctly. That’s how skills get stronger.</p>
      <div class="complete-stat"><strong>${s.mastered.length} / ${s.trainingTotal}</strong><small>Previously missed commands mastered</small></div>
      <div class="summary-grid"><div class="summary-cell"><strong class="green">${s.trainingAttempts}</strong><small>Retraining answers</small></div><div class="summary-cell"><strong>${Math.round(s.answers.filter(x=>x.correct).length/s.total*100)}%</strong><small>Original session score</small></div></div>
      <div class="button-stack bottom-action">${primary('Start a new session','finish')}${secondary('See learning progress','progress')}</div>
    `;
  }
  function commandCard(d){
    if(!d)return '';
    return `<button class="review-card" data-detail="${escapeHTML(d.id)}"><span class="review-icon">${icon('terminal')}</span><span class="review-main"><strong>${escapeHTML(d.id)}</strong><small>${escapeHTML(d.about)}</small></span>${icon('chevron','chevron')}</button>`;
  }
  function renderLibrary(){
    screen.innerHTML=`
      <div class="eyebrow">YOUR COMMAND REFERENCE</div><h1 class="page-title">Command library</h1>
      <p class="page-subtitle">Browse all ${COMMANDS.length} commands. Open any one for syntax, examples, and a practical explanation.</p>
      <div class="search-wrap">${icon('search')}<input class="search-input" id="library-search" type="search" placeholder="Search commands or descriptions" autocomplete="off" value="${escapeHTML(searchText)}" aria-label="Search commands"></div>
      <div class="filter-row" role="group" aria-label="Filter commands by difficulty">${['all',...LEVELS].map(level=>`<button class="filter-chip ${libraryLevel===level?'is-active':''}" data-library-level="${level}" aria-pressed="${libraryLevel===level}">${level==='all'?'All (90)':formattedLevel(level)}</button>`).join('')}</div>
      <p id="library-count" class="library-count"></p>
      <div class="library-list" id="library-list">${COMMANDS.filter(d=>libraryLevel==='all'||d.level===libraryLevel).map(d=>`<button class="library-item" data-detail="${escapeHTML(d.id)}" data-search="${escapeHTML((d.id+' '+d.about+' '+d.group+' '+d.syntax).toLowerCase())}"><span class="library-symbol">$_</span><span class="library-item-body"><strong>${escapeHTML(d.id)}</strong><small>${escapeHTML(d.about)}</small></span>${icon('chevron')}</button>`).join('')}</div>
      <div id="library-empty" class="empty-state" hidden>No commands match your search. Try another keyword.</div>
    `;
    filterLibrary();
  }
  function filterLibrary(){
    if(view!=='library')return;
    const term=searchText.trim().toLowerCase();let visible=0;
    screen.querySelectorAll('.library-item').forEach(el=>{const match=el.dataset.search.includes(term);el.hidden=!match;if(match)visible++;});
    const count=screen.querySelector('#library-count');if(count)count.textContent=`${visible} ${visible===1?'command':'commands'} found`;
    const empty=screen.querySelector('#library-empty');if(empty)empty.hidden=visible!==0;
  }
  function openDetail(id){if(!COMMAND_BY_ID.has(id))return;selectedDetail=id;detailReturn=view;navigate('detail');}
  function renderDetail(){
    const d=COMMAND_BY_ID.get(selectedDetail);if(!d){navigate('library');return;}
    const examples=[[d.demo,d.meaning],...d.examples];
    screen.innerHTML=`
      <button class="back-button" data-action="back-detail">${icon('left')} Back to ${escapeHTML(detailReturn==='results'?'results':detailReturn==='progress'?'progress':'commands')}</button>
      <div class="detail-head"><span class="pill ${d.level==='beginner'?'beginner':d.level==='advanced'?'advanced':''}">${escapeHTML(d.level)}</span><span class="pill">${escapeHTML(d.group)}</span></div>
      <h1 class="detail-command">${escapeHTML(d.id)}</h1><p class="detail-about">${escapeHTML(d.about)}</p>
      <div class="micro-heading">Syntax</div><pre class="syntax-block">$ ${escapeHTML(d.syntax)}</pre>
      <div class="micro-heading">Example commands</div>
      <div class="info-card">${examples.map(([code,meaning])=>`<div class="detail-example"><code>$ ${escapeHTML(code)}</code><p>${escapeHTML(meaning)}</p></div>`).join('')}</div>
      <div class="notice"><strong>Remember:</strong> ${escapeHTML(d.tip)}</div>
      <div class="button-stack bottom-action">${primary('Practice this command','practice-single')}</div>
    `;
  }
  function progressLevel(level){
    const cmds=COMMANDS.filter(c=>c.level===level);
    const studied=cmds.filter(c=>(data.stats[c.id]?.attempts||0)>0).length;
    return {total:cmds.length,studied,percent:Math.round(100*studied/cmds.length)};
  }
  function weakCommands(){
    return COMMANDS.filter(c=>{
      const st=data.stats[c.id];return st && st.misses>0 && st.lastCorrect===false;
    }).sort((a,b)=>{
      const sa=data.stats[a.id],sb=data.stats[b.id];
      return ((sb.misses/(sb.attempts||1))-(sa.misses/(sa.attempts||1)))||(sb.lastSeen-sa.lastSeen);
    });
  }
  function renderProgress(){
    const h=data.history;
    const stats=Object.values(data.stats);
    const studied=stats.filter(x=>x.attempts>0).length;
    const totalAnswered=stats.reduce((sum,x)=>sum+x.attempts,0);
    const avg=h.length?Math.round(h.reduce((sum,x)=>sum+x.correct/x.total,0)/h.length*100):0;
    const mastered=h.reduce((sum,x)=>sum+(x.trained?x.missed.length:0),0);
    const weak=weakCommands().slice(0,5);
    screen.innerHTML=`
      <div class="eyebrow">EVERY SESSION COUNTS</div><h1 class="page-title">Your progress</h1>
      <p class="page-subtitle">Your learning history stays on this device, including your reviewed commands and session scores.</p>
      <div class="stats-grid">
        <div class="stat-card">${icon('trophy')}<strong>${h.length}</strong><small>Sessions completed</small></div>
        <div class="stat-card">${icon('chart')}<strong>${avg}%</strong><small>Average first-try score</small></div>
        <div class="stat-card">${icon('book')}<strong>${studied} <span style="font-size:14px;color:var(--muted)">/ ${COMMANDS.length}</span></strong><small>Commands practiced</small></div>
        <div class="stat-card">${icon('refresh')}<strong>${mastered}</strong><small>Mistakes retrained</small></div>
      </div>
      <div class="section-title">Command coverage <small>${totalAnswered} total answers</small></div>
      <div class="level-progress">${LEVELS.map(level=>{const p=progressLevel(level);return `<div class="level-line"><span>${formattedLevel(level)}</span><strong>${p.studied}/${p.total}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${p.percent}%"></div></div>`;}).join('')}</div>
      <div class="section-title">Commands to revisit</div>
      ${weak.length?`<div class="command-list">${weak.map(commandCard).join('')}</div><div class="button-stack">${secondary('Practice weak commands','practice-weak')}</div>`:`<div class="notice">${stats.some(x=>x.misses>0)?'No outstanding mistakes right now. Keep practicing to strengthen your recall.':'Once you answer some questions incorrectly, those commands will appear here for extra practice.'}</div>`}
      <div class="section-title">Recent sessions</div>
      ${h.length?`<div class="info-card" style="padding:6px 14px">${h.slice(0,8).map(s=>`<div class="history-item"><div class="history-number">${Math.round(s.correct/s.total*100)}%</div><div class="history-main"><strong>${escapeHTML(formattedLevel(s.level))} · ${s.total} questions</strong><small>${escapeHTML(timeString(s.date))} · ${s.missed.length} missed ${s.trained?'· reviewed':''}</small></div><span class="pill ${s.trained?'training':''}">${s.trained?'Reviewed':'Complete'}</span></div>`).join('')}</div>`:'<div class="empty-state">No completed sessions yet. Your first quiz is the perfect place to start.</div>'}
      <p class="helper" style="margin-top:22px">Stored locally in this browser. Clearing browser data may remove your progress.</p>
    `;
  }
  function render(){
    headerNav();
    switch(view){
      case 'home':renderHome();break;
      case 'quiz':renderQuiz();break;
      case 'feedback':renderFeedback();break;
      case 'results':renderResults();break;
      case 'complete':renderComplete();break;
      case 'library':renderLibrary();break;
      case 'detail':renderDetail();break;
      case 'progress':renderProgress();break;
      default:view='home';renderHome();
    }
  }
  function action(name){
    switch(name){
      case 'start':startSession();break;
      case 'submit':submitAnswer();break;
      case 'next':advance();break;
      case 'pause':abandonToHome();break;
      case 'resume':{
        const s=currentSession();if(!s)return;
        navigate(s.stage==='results'?'results':s.stage==='complete'?'complete':s.phase==='feedback'?'feedback':'quiz');break;
      }
      case 'train':startTraining();break;
      case 'finish':exitToHome();break;
      case 'home':navigate('home');break;
      case 'library':navigate('library');break;
      case 'progress':navigate('progress');break;
      case 'back-detail':navigate(detailReturn);break;
      case 'practice-single':startSession([selectedDetail]);break;
      case 'practice-weak':startSession(weakCommands().slice(0,10).map(c=>c.id));break;
      case 'install':if(pendingInstall){pendingInstall.prompt();pendingInstall=null;render();}break;
    }
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button || button.disabled)return;
    if(button.dataset.answer!==undefined){selectAnswer(Number(button.dataset.answer));return;}
    if(button.dataset.setting){setSetting(button.dataset.setting,button.dataset.value);return;}
    if(button.dataset.libraryLevel){libraryLevel=button.dataset.libraryLevel;renderLibrary();return;}
    if(button.dataset.detail){openDetail(button.dataset.detail);return;}
    if(button.dataset.nav){navigate(button.dataset.nav);return;}
    if(button.dataset.action){action(button.dataset.action);return;}
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='library-search'){searchText=event.target.value;filterLibrary();}
  });
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();pendingInstall=event;if(view==='home')headerNav();
  });
  window.addEventListener('appinstalled',()=>{pendingInstall=null;toast('Linux Drill installed!');render();});
  if('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Offline support not available:',err)));
  }
  render();
})();
