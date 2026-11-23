/* Shared Gallery/Lab controls: labels above the preview, compact vertical actions while reading. */
function previewTools(dialog,prefix){
  var tools=dialog.querySelector('.preview-tools'),share=document.getElementById(prefix+'Share'),tip=document.getElementById(prefix+'ShareTip'),timer,frame=0,compact=false;
  var close=document.getElementById(prefix+'Close'),site=tools.querySelector('.preview-primary'),source=tools.querySelector('.preview-source');
  function layout(){frame=0;if(!dialog.open)return;
    var gap=innerWidth<=760?6:8,right=0,top=0,pad=innerWidth<=360?8:innerWidth<=760?10:16;
    [close,share,source,site].forEach(function(control){if(control.hidden)return;
      var label=control.querySelector(':scope > span:not(.gal-share-tip)');
      if(label){var full=control.getAttribute('aria-label')||label.textContent,short=full.replace(/^(View|Get|Open) /,'');label.textContent=innerWidth<=360?short.charAt(0).toUpperCase()+short.slice(1):full}
      var width=compact||!label?44:Math.ceil(label.scrollWidth)+18+8+pad*2;
      control.style.setProperty('--tool-w',width+'px');control.style.setProperty('--tool-x',-right+'px');control.style.setProperty('--tool-y',top+'px');
      if(compact)top+=44+gap;else right+=width+gap;
    });
    tools.classList.add('preview-measured');
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(layout)}
  function scroll(){var next=compact?dialog.scrollTop>24:dialog.scrollTop>72;if(next===compact)return;
    compact=next;dialog.classList.toggle('preview-scrolled',compact);schedule()}
  dialog.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',schedule);
  if(document.fonts)document.fonts.ready.then(schedule);
  share.onclick=async function(){var url=location.href,title=document.getElementById(prefix+'Title').textContent;
    if(navigator.share&&matchMedia('(pointer:coarse)').matches){try{await navigator.share({title:title,url:url})}catch(e){}return}
    try{await navigator.clipboard.writeText(url);tip.textContent='Link copied'}catch(e){window.prompt('Copy this link',url);return}
    tip.classList.add('on');clearTimeout(timer);timer=setTimeout(function(){tip.classList.remove('on')},1600)};
  return function(){dialog.scrollTop=0;compact=false;dialog.classList.remove('preview-scrolled');tools.classList.remove('preview-measured');tip.classList.remove('on');clearTimeout(timer);schedule()}
}

/* Keep a readable first view; reveal longer descriptions and instructions on request. */
function previewSummary(dialog,prefix){
  var description=document.getElementById(prefix+'Description'),button=document.getElementById(prefix+'ReadMore'),instructions=document.getElementById(prefix+'Instructions'),hasInstructions=false;
  function measure(){if(!dialog.open||dialog.classList.contains('summary-expanded'))return;button.hidden=!(hasInstructions||description.scrollHeight>description.clientHeight+1)}
  if('ResizeObserver' in window)new ResizeObserver(function(){if(!dialog.classList.contains('summary-expanded'))measure()}).observe(description);
  button.onclick=function(){var expanded=button.getAttribute('aria-expanded')!=='true';dialog.classList.toggle('summary-expanded',expanded);button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'Show less':'Show more';if(instructions)instructions.hidden=!expanded||!hasInstructions};
  window.addEventListener('resize',function(){if(!dialog.classList.contains('summary-expanded'))measure()});
  if(document.fonts)document.fonts.ready.then(measure);
  return function(showInstructions){hasInstructions=!!showInstructions;dialog.classList.remove('summary-expanded');button.hidden=true;button.setAttribute('aria-expanded','false');button.textContent='Show more';if(instructions)instructions.hidden=true;requestAnimationFrame(measure)}
}

function portfolioImage(){var image=document.createElement("img");image.loading="lazy";image.decoding="async";return image}


/* Mount the same embedded logo set in both locations before measuring the page. */
(function(){var template=document.getElementById('brandCreditsTemplate');
 document.querySelectorAll('[data-brand-credits]').forEach(function(host){
  var fragment=template.content.cloneNode(true);
  /* Mobile keeps the full wordmarks at a shared optical height; compact marks made the ticker feel too sparse. */
  fragment.querySelectorAll('source[media]').forEach(function(source){source.media='not all'});
  host.appendChild(fragment);
  var row=host.querySelector('.brand-row'),windowEl=document.createElement('div'),track=document.createElement('div');
  windowEl.className='brand-window';windowEl.tabIndex=0;windowEl.setAttribute('aria-label','Brands I have worked with');track.className='brand-track';row.replaceWith(windowEl);windowEl.appendChild(track);track.appendChild(row);
  var copy=row.cloneNode(true);copy.setAttribute('aria-hidden','true');track.appendChild(copy);
  var heading=host.querySelector('.brand-heading');
  heading.querySelector('.brand-title').innerHTML='Brands I have<br>worked with';
  heading.insertAdjacentHTML('beforeend','<svg class="brand-arrow" viewBox="0 0 86 68" aria-hidden="true"><path d="M8 57C30 65 66 48 67 10"/><path d="M57 20L67 10 76 22"/></svg>');
 })})();

/* ---------- real URLs (SEO): routes are paths (/work, /work/alter), not #/work. Google ignores anything after #,
   so hash routes meant only the home page was ever indexed. Vercel rewrites every path to this one file
   (vercel.json). The rest of the script still thinks in "#/work" form: HASH() gives the current route that way,
   goHash() navigates with a real path and fires the same hashchange event every module already listens for. */
function HASH(){if(/^#\//.test(location.hash))return location.hash;
  if(location.protocol==="file:")return location.hash||"#/";
  var p=location.pathname.replace(/\/index\.html$/,"/").replace(/\/+$/,"")||"/";return "#"+p}
function goHash(h){h=String(h||"/");if(h.charAt(0)==="#")h=h.slice(1);if(h.charAt(0)!=="/")h="/"+h;
  if(location.protocol==="file:"){location.hash="#"+h;return}
  if(h!==location.pathname+location.search||location.hash)history.pushState(null,"",h);
  window.dispatchEvent(new HashChangeEvent("hashchange"))}
/* one shared "the page is scrolling" flag. Hover effects that change layout or pop a big focus (the deck cards, the
   services rows) wait until the scroll stops: as content slides under a resting cursor the browser moves :hover from
   element to element every frame, and each of those opened, closed, measured and relaid something mid scroll */
var SCROLLING=false,scrollEndT=0,scrollEndFns=[];
/* SY: the scroll position, read once per queued scroll/resize/route frame by frame() (reading scrollY forces a style and layout pass whenever
   anything is dirty, and five modules each reading it in their own frame callback forced five). VH and DOCH: the
   viewport and page heights, kept current by resize and a ResizeObserver instead of being read every frame */
var SY=window.pageYOffset||0,VH=window.innerHeight,DOCH=0,scrollDirty=true,queueFrame;
window.addEventListener("resize",function(){VH=window.innerHeight},{passive:true});
if("ResizeObserver" in window)new ResizeObserver(function(){DOCH=document.documentElement.scrollHeight}).observe(document.documentElement);
window.addEventListener("scroll",function(){scrollDirty=true;queueFrame();SCROLLING=true;clearTimeout(scrollEndT);
  scrollEndT=setTimeout(function(){SCROLLING=false;for(var i=0;i<scrollEndFns.length;i++)scrollEndFns[i]()},160)},{passive:true});
function onScrollEnd(f){scrollEndFns.push(f)}
/* old #/ links (bookmarks, shared links) land on the real path */
if(/^#\//.test(location.hash)&&location.protocol!=="file:")history.replaceState(null,"",location.hash.slice(1));
window.addEventListener("popstate",function(){window.dispatchEvent(new HashChangeEvent("hashchange"))});
window.addEventListener("hashchange",function(){if(/^#\//.test(location.hash)&&location.protocol!=="file:")history.replaceState(null,"",location.hash.slice(1))});
/* internal links navigate in place (no reload); new tab, modifier keys and downloads behave normally */
document.addEventListener("click",function(e){if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target||a.hasAttribute("download"))return;
  var h=a.getAttribute("href");if(!/^\/(?!\/)/.test(h)||/\.[a-z0-9]+$/i.test(h))return;
  e.preventDefault();goHash(h)});


/* splash headline: each line scrambles through symbols, then settles into the real letters left to right */
function scram(){
  var G="#@!$%&*?/<>+=",NS="http://www.w3.org/2000/svg",lines=[].slice.call(document.querySelectorAll("#splash .scr text"));
  lines.forEach(function(t,li){
    var full=t.getAttribute("data-t")||t.textContent,xs=[],y=t.getAttribute("y"),anchor=t.getAttribute("text-anchor")||"start";t.setAttribute("data-t",full);
    /* pin every letter to the x it has in the finished line, so symbols swap in place and nothing slides */
    for(var i=0;i<full.length;i++){try{xs.push(t.getStartPositionOfChar(i).x)}catch(e){xs.push(null)}}
    if(xs.some(function(v){return v===null}))return t.classList.add("on");
    t.removeAttribute("text-anchor");t.textContent="";
    var sp=full.split("").map(function(c,i){var s=document.createElementNS(NS,"tspan");s.setAttribute("x",xs[i]);s.setAttribute("y",y);s.textContent=" ";t.appendChild(s);return s});
    var start=400+li*450,dur=1100,t0=null;
    setTimeout(function(){t.classList.add("on");requestAnimationFrame(function step(now){
      if(t0===null)t0=now;var k=Math.min(1,(now-t0)/dur);
      for(var i=0;i<full.length;i++){var c=full[i],at=i/full.length;
        /* a letter locks once the sweep passes it; just ahead it flickers through symbols; further ahead it's blank */
        sp[i].textContent=c===" "?" ":k>=at*.75+.25?c:k>=at*.75-.15?G[(Math.random()*G.length)|0]:" "}
      if(k<1)requestAnimationFrame(step);
      else{
        // Font swaps can change glyph widths after the scramble measured them. Restore native layout.
        t.textContent=full;t.setAttribute("text-anchor",anchor)
      }})},start)})}

(function(){
"use strict";
var ARW='<svg class="ic ar r" viewBox="0 0 24 24" aria-hidden="true"><use href="#ar"/></svg>';
var UPR='<svg class="ic ar" viewBox="0 0 24 24" aria-hidden="true"><use href="#ar"/></svg>';
var USR='<svg class="ic" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

var P=[
 {id:"track-it",n:"Track It",t:"Expense tracker",s:"#B4F6B8",tint:"#E0FBE1",
  g:"Voice, receipt scan, and a home-screen widget you can log from without opening the app. Built because every tracker asks you to stop mid-purchase and file paperwork for a ₹40 chai.",
  k:["Android","Widget","Voice input","Live"],
  shots:["Widget\nlogging","Voice\ncapture","Receipt\nscan","Monthly\nanalysis","Budget\nsetup","CSV\nexport"],
  a:'<rect x="14" y="26" width="72" height="52" rx="7" fill="#131316" opacity=".88"/><rect x="24" y="38" width="34" height="5" rx="2.5" fill="#FFD44E"/><rect x="24" y="50" width="52" height="4" rx="2" fill="#FAFAF8" opacity=".5"/><rect x="24" y="60" width="40" height="4" rx="2" fill="#FAFAF8" opacity=".3"/>',
  st:[["The problem","Every expense app I tried wanted <b>six taps and a category dropdown</b> to log a ₹40 chai. Friction was the product killer, not the feature gap."],["How I got there","I read a year of one-star reviews across the top trackers in India. The complaint was never features. It was always <b>\"I stopped logging after a week.\"</b>"],["The key decision","Logging had to happen <b>without opening the app</b>. That made the home-screen widget the product, and the app the place you go to look back."],["What I'd fix","No onboarding yet, tags are still preset-only. Bank sync was deferred on purpose: <b>trust first, automation later</b>."]]},
 {id:"alter",n:"Alter",t:"AI companion · Android",s:"#FFD44E",tint:"#FFF3C4",
  g:"A personal AI assistant that works like a friend with a good memory. Say a thought, share a screenshot, scan a page, and Alter sorts it into notes, memories and to-dos. Native Android, local-first, powered by Gemini.",
  k:["Android","Kotlin + Compose","Latest Gemini"],
  shots:["Home","Alter AI","Memories","Upcoming","Notes","Canvas"],
  a:'<circle cx="50" cy="50" r="27" fill="#131316" opacity=".88"/><circle cx="41" cy="45" r="4.5" fill="#FFD44E"/><circle cx="59" cy="45" r="4.5" fill="#FFD44E"/><path d="M38 60c7 7 17 7 24 0" stroke="#FAFAF8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>',
  st:[["The problem","A new AI tool shows up every week and each one does one thing. Notes here, transcription there, chat somewhere else. <b>You end up remembering which tool holds which thought</b>, and none of them remember you."],["How I got there","I sketched every screen on paper, then <b>built the whole component library in Figma</b>, micro-interactions included. Google AI Studio turned that design into native Kotlin and Jetpack Compose."],["The key decision","<b>One place to put anything.</b> Voice, screenshot, scan, text, PDF: Alter works out what it is and files it as a note, a memory or a task."],["What I'd fix","It does a lot, and an all-in-one app can quietly become all-in-one for its maker. <b>Next is testing it with people who aren't me.</b>"]]},
 {id:"focus",n:"Focus",t:"Timer + streak grid",s:"#B4F6B8",tint:"#E0FBE1",
  g:"A focus timer whose widget is a contribution grid. One tap starts, one pauses, double ends. The grid is the whole product. The timer is just how you fill it.",
  k:["Widget","Habit loop","Shipped"],
  shots:["Grid\nwidget","Session\nrunning","Monthly\nview","Depth\nscale","Tap\nstates","Recovery"],
  a:'<g fill="#131316"><rect x="20" y="30" width="9" height="9" rx="2" opacity=".18"/><rect x="33" y="30" width="9" height="9" rx="2" opacity=".5"/><rect x="46" y="30" width="9" height="9" rx="2" opacity=".85"/><rect x="59" y="30" width="9" height="9" rx="2" opacity=".3"/><rect x="72" y="30" width="9" height="9" rx="2" opacity=".62"/><rect x="20" y="43" width="9" height="9" rx="2" opacity=".72"/><rect x="33" y="43" width="9" height="9" rx="2" opacity=".9"/><rect x="46" y="43" width="9" height="9" rx="2" opacity=".22"/><rect x="59" y="43" width="9" height="9" rx="2" opacity=".55"/><rect x="72" y="43" width="9" height="9" rx="2" opacity=".85"/><rect x="20" y="56" width="9" height="9" rx="2" opacity=".4"/><rect x="33" y="56" width="9" height="9" rx="2" opacity=".68"/><rect x="46" y="56" width="9" height="9" rx="2" opacity=".92"/><rect x="59" y="56" width="9" height="9" rx="2" opacity=".15"/><rect x="72" y="56" width="9" height="9" rx="2" opacity=".48"/></g>',
  st:[["The problem","Focus timers ask you to <b>care about the current session</b>. Nobody does. People care about the streak."],["How I got there","I'd been staring at my own contribution grid for years. <b>That grid is the motivation</b>; the commits just fill it."],["The key decision","The grid lives <b>on the home screen</b>, not inside the app. Colour depth reads as time spent."],["What I'd fix","A missed day looks like failure. I want a <b>recovery state</b> that reads as \"pick it back up\"."]]},
 {id:"laundry",n:"Laundry",t:"Service app concept",s:"#A9DEFF",tint:"#E0F3FF",
  g:"A concept, and I'll say so up front. Pickup scheduling for a service where the real problem isn't the app. It's that nobody trusts a stranger with their clothes.",
  k:["Concept","Service design","Full UI"],
  shots:["Pickup\nproof","Item\ncount","Handler\nnamed","Schedule","Tracking","Return"],
  a:'<rect x="24" y="22" width="52" height="58" rx="9" fill="#131316" opacity=".88"/><circle cx="50" cy="55" r="16" fill="none" stroke="#9BC6EA" stroke-width="3.5"/><circle cx="50" cy="55" r="7" fill="#9BC6EA" opacity=".55"/><circle cx="37" cy="33" r="3" fill="#FAFAF8" opacity=".6"/>',
  st:[["The problem","Laundry apps solve scheduling. The thing that stops people is <b>handing a stranger a bag of your clothes</b> and hoping."],["How I got there","I talked to people in my building who'd tried one and quit. Not one mentioned the app. They mentioned <b>a lost shirt</b>."],["The key decision","Built around <b>proof at every handoff</b>: photographed pickup, itemised count, named handler."],["Being honest","This one is a concept. Never tested with a real service, and I'd be <b>guessing about the operations</b>."]]}
];

/* =================== Aditya: project list (content swapped) =================== */
(function(){
  var sync={id:"sync-drive",n:"Sync-Drive",t:"Android cloud sync engine",s:"#B4F6B8",tint:"#E0FBE1",
    g:"An Android app that mirrors device folders to Google Drive with resumable chunked uploads, parallel workers, and integrity checks for reliable background sync.",
    k:["Kotlin","Android","Google Drive API","WorkManager","Material Design"],
    shots:["Folder\nmirror","Resumable\nuploads","Parallel\nworkers","Auto-sync","Integrity","Recovery"],
    a:'<rect x="16" y="22" width="68" height="56" rx="8" fill="#131316" opacity=".9"/><path d="M30 52c2-10 18-12 22-2 10-2 14 8 8 14H30c-8 0-10-8 0-12z" fill="#B4F6B8"/><path d="M50 34v14" stroke="#FFD44E" stroke-width="4" stroke-linecap="round"/><path d="M44 42l6-8 6 8" stroke="#FFD44E" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    st:[["The problem","Backing up folders reliably on mobile is hard: flaky networks, interruptions, duplicates, and battery constraints break naive sync."],["How I got there","Built a native Android sync engine focused on correctness and resilience — resumable chunked transfers, parallelism, and background scheduling."],["The key decision","Favor <b>integrity and recoverability</b>: SHA-256/byte-level checks, smart deduplication, and exponential-backoff retries so sync can resume safely."],["What it delivers","Autonomous, battery-aware folder mirroring to Google Drive with 4 parallel workers and WorkManager-driven auto-sync."]]};
  var job={id:"job-automation",n:"Automated Job Application System",t:"Full-stack browser automation",s:"#A9DEFF",tint:"#E0F3FF",
    g:"A full-stack Chrome extension that turns unstructured résumé PDFs into editable profiles and completes applications across job portals.",
    k:["React","Node.js","Express","MongoDB","JWT","Chrome Extension"],
    shots:["PDF\nimport","Profile\nreview","Autofill","APIs","Schema","Portal flow"],
    a:'<rect x="18" y="22" width="64" height="56" rx="8" fill="#131316" opacity=".88"/><rect x="28" y="34" width="28" height="4" rx="2" fill="#A9DEFF"/><rect x="28" y="44" width="40" height="3" rx="1.5" fill="#FAFAF8" opacity=".55"/><rect x="28" y="52" width="34" height="3" rx="1.5" fill="#FAFAF8" opacity=".35"/><path d="M30 66h40" stroke="#FFD44E" stroke-width="4" stroke-linecap="round"/>',
    st:[["The problem","Job applications repeat the same data entry across portals. <b>Résumés are unstructured, but forms demand structure.</b>"],["How I got there","Built an extension + app stack to parse PDFs, let users review extracted fields, and drive autofill through secured APIs."],["The key decision","Keep profile data <b>editable and modular</b> (JWT-secured, scalable schema) so parsing errors never become permanent."],["What I'd ship next","Broader portal adapters and stronger field-mapping confidence signals for messy résumés."]]};
  var uni={id:"uniblogic",n:"UniBLOGic",t:"College community platform",s:"#E7BBFF",tint:"#F5E3FF",
    g:"A scalable college community platform with a React frontend, Node.js/PostgreSQL backend, real-time WebSocket messaging, and a video-streaming service (in progress).",
    k:["TypeScript","React","Node.js","PostgreSQL","WebSockets"],
    shots:["Community","Realtime\nchat","Backend","Database","Video","Scale"],
    a:'<rect x="16" y="24" width="68" height="50" rx="8" fill="#131316" opacity=".9"/><rect x="24" y="32" width="24" height="6" rx="3" fill="#E7BBFF"/><rect x="24" y="42" width="40" height="4" rx="2" fill="#FAFAF8" opacity=".5"/><rect x="24" y="50" width="32" height="4" rx="2" fill="#FAFAF8" opacity=".35"/><circle cx="68" cy="58" r="10" fill="#A9DEFF" opacity=".9"/><path d="M65 58l6 0M68 55l0 6" stroke="#131316" stroke-width="2" stroke-linecap="round"/>',
    st:[["The problem","Campus communication and content are fragmented across channels, making community, updates, and collaboration harder than they need to be."],["How I got there","Designed a platform with a typed React frontend and a Node.js/PostgreSQL backend, adding real-time messaging over WebSockets."],["The key decision","Treat it as a <b>scalable system</b> (services, real-time channels, structured data) rather than a single monolithic app surface."],["Status","Core platform and messaging in place; video-streaming service and further scale work are in progress."]]};
  var gnn={id:"node-classifier",n:"Graph Node Classification",t:"Graph machine learning",s:"#FFD44E",tint:"#FFF3C4",
    g:"A GCN-based node classifier with two-hop neighborhood aggregation and weighted loss for the imbalanced CORA citation dataset.",
    k:["Python","TensorFlow","Keras","GCN","CORA"],
    shots:["Graph\ninput","2-hop\nagg","GCN","Weighted\nloss","Eval","Results"],
    a:'<circle cx="32" cy="38" r="8" fill="#131316" opacity=".88"/><circle cx="68" cy="34" r="8" fill="#131316" opacity=".88"/><circle cx="50" cy="66" r="8" fill="#131316" opacity=".88"/><path d="M38 42l8 18M62 38l-8 22M40 38h20" stroke="#131316" stroke-width="3" opacity=".5"/><circle cx="32" cy="38" r="3" fill="#FFD44E"/><circle cx="68" cy="34" r="3" fill="#FFD44E"/><circle cx="50" cy="66" r="3" fill="#B4F6B8"/>',
    st:[["The problem","Dense baselines underused citation structure, and class imbalance hurt convergence on CORA."],["How I got there","Implemented a GCN with <b>two-hop neighborhood aggregation</b> to capture richer graph context."],["The key decision","Pair representation learning with a <b>weighted loss</b> and balancing so minority classes learn reliably."],["Result","+15% accuracy over dense-network baselines on the classification task."]]};
  var pyos={id:"pyos",n:"PyOS",t:"Systems simulation",s:"#A9DEFF",tint:"#E0F3FF",
    g:"A modular terminal operating-system simulation with authentication, concurrent command execution, process scheduling, and an extensible shell.",
    k:["Python","CLI","Multithreading","OOP"],
    shots:["Auth","Shell","Scheduler","Processes","Modules","Commands"],
    a:'<rect x="16" y="24" width="68" height="52" rx="6" fill="#131316" opacity=".9"/><rect x="22" y="32" width="10" height="3" rx="1.5" fill="#A9DEFF"/><rect x="22" y="40" width="42" height="3" rx="1.5" fill="#FAFAF8" opacity=".5"/><rect x="22" y="48" width="30" height="3" rx="1.5" fill="#FAFAF8" opacity=".35"/><rect x="22" y="58" width="6" height="6" rx="1" fill="#B4F6B8"/>',
    st:[["The problem","A hands-on way to practice OS-shaped concerns: auth, scheduling, concurrency, and clean module boundaries."],["How I got there","Built a custom CLI with secure auth and multithreading, structured around object-oriented modules."],["The key decision","Make the shell <b>extensible</b> — new commands ship in fewer than 10 lines without touching core logic."],["What I'd explore next","Richer process primitives and persistence to push it closer to a teaching-grade simulation."]]};
  P.length=0;P.push(sync,job,uni,gnn,pyos);
})();

var OFFER=[
 {id:"backend",h:"Backend &amp; API engineering",p:"Production APIs and services designed for reliability, observability, and scale — from schema to deploy.",
  inc:["REST APIs","Auth &amp; data models","Service design","Monitoring","Docs"],pc:"#A9DEFF",tool:0,lbl:"Backend"},
 {id:"ai",h:"AI automation &amp; agents",p:"Agentic workflows, RCA, and human-in-the-loop automation that reduce toil and resolve failures in production.",
  inc:["Agent workflows","RCA &amp; feedback loops","Integrations","Guardrails","Cost/latency"],pc:"#E7BBFF",tool:3,lbl:"AI systems"},
 {id:"platform",h:"Platform &amp; reliability",p:"Pipelines and operational glue across queues, observability, and CI/CD so systems stay healthy under load.",
  inc:["Observability","AWS SQS &amp; pipelines","Incident response","Dashboards","Runbooks"],pc:"#FFD44E",tool:1,lbl:"Reliability"},
 {id:"fullstack",h:"Full-stack products",p:"End-to-end features and tools — from React UIs to Node/Express services and databases — shipped with care.",
  inc:["React/TypeScript","Node.js/Express","MongoDB/MySQL","Auth","Delivery"],pc:"#B4F6B8",tool:1,lbl:"Full-stack"},
 {id:"ml",h:"Data &amp; ML experimentation",p:"Applied ML and quantitative research: models, backtesting, and learning systems grounded in real evaluation.",
  inc:["Modeling","TensorFlow/Keras","Backtesting","Analysis","Iteration"],pc:"#A9DEFF",tool:2,lbl:"ML &amp; data"}
];

var SECTIONS=[
 {t:"Branding & Identity",d:"Snip & Style, Velossalabs, Piyo aur Peene Do",cv:"#F2D045",tint:"#FCEFB4",w:520,h:400,x:0,y:0,items:["Snip & Style\nmarks","Colour\nsystem","Velossalabs\nlogotype","Chai brand\norigin","Type\nscale","Packaging\nfaces","Stationery","Brand\nbook"]},
 {t:"Campaign & Motion",d:"Statics, GIFs and loops, made at volume",cv:"#9BC6EA",tint:"#D6E9F8",w:560,h:380,x:600,y:70,items:["Sale\nGIF","Festive\nstatics","Banner\nsystem","Motion\nloops","Category\ntiles","App\nbanners","Seasonal\nset","Variants"]},
 {t:"Graphics & Carousels",d:"Nerdy Designer, 33 posts and counting",cv:"#C6A9E3",tint:"#E7D9F5",w:480,h:420,x:40,y:470,items:["AI Playbook\n01","AI Playbook\n02","Hierarchy\npost","Type\nteardown","Peak-End\nrule","Grid\nbasics","Colour\npost","Spacing"]},
 {t:"Packaging",d:"Structure, faces, and the things that print badly",cv:"#A9D6A0",tint:"#D8EED4",w:440,h:340,x:580,y:510,items:["Box\nnet","Label\nfaces","Dieline","Mockups","Print\nproofs","Finish\ntests"]},
 {t:"Logos & Marks",d:"The ones that survived, and a few that didn't",cv:"#F2A65A",tint:"#FBDFC0",w:500,h:300,x:1090,y:200,items:["Mark 01","Mark 02","Mark 03","Mark 04","Mark 05","Mark 06","Mark 07","Mark 08"]}
];

/* stick figures for the scroll story — each does something on reveal */
/* ---------- bean people ----------
   Our own characters (style cue: the chubby ink-outlined people on dontlookup.app):
   a round head, one soft body, stubby legs, a thick ink outline, flat palette fill,
   two dot eyes that blink, and a shadow so each one stands on the page.
   Each one does the thing the words next to it say. */
var BEAN=(function(){
  var INK="#131316",calm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var Y="#FFD44E",G="#B4F6B8",B="#A9DEFF",V="#E7BBFF",O="#F2A65A",R="#F2545B",W="#FAFAF8";
  function cap(d,fill,w){w=w||11;
    return '<path d="'+d+'" stroke="'+INK+'" stroke-width="'+(w+5.5)+'" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'+
           '<path d="'+d+'" stroke="'+fill+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'}
  function rot(cx,cy,deg,dur,delay){return calm?'':'<animateTransform attributeName="transform" type="rotate" values="0 '+cx+' '+cy+';'+deg+' '+cx+' '+cy+';0 '+cx+' '+cy+'" dur="'+dur+'s" begin="'+(delay||0)+'s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>'}
  function mov(dx,dy,dur,delay){return calm?'':'<animateTransform attributeName="transform" type="translate" values="0 0;'+dx+' '+dy+';0 0" dur="'+dur+'s" begin="'+(delay||0)+'s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>'}
  function bean(o){
    var c=o.c,eyes=o.eyes||[0,0],s='';
    s+='<ellipse cx="'+(64+(o.sx||0))+'" cy="109" rx="'+(o.srx||27)+'" ry="5.5" fill="'+INK+'" opacity=".12"/>';
    (o.legs||["M53 92 L50 105","M67 92 L70 105"]).forEach(function(d){s+=cap(d,c,10)});
    s+='<g transform="rotate('+(o.lean||0)+' 60 100)">';
    if(o.back)s+=cap(o.back,c,9);
    s+='<path d="M47 52C38 58 36 73 38 86C39 96 47 101 59 101C72 101 81 96 82 85C84 71 81 57 72 51C66 48 53 48 47 52Z" fill="'+c+'" stroke="'+INK+'" stroke-width="3.2" stroke-linejoin="round"/>';
    s+='<circle cx="59.5" cy="36" r="15.5" fill="'+c+'" stroke="'+INK+'" stroke-width="3.2"/>';
    s+='<g class="blink" style="animation-delay:'+(o.bd||0)+'s"><circle cx="'+(54.5+eyes[0])+'" cy="'+(34+eyes[1])+'" r="1.9" fill="'+INK+'"/><circle cx="'+(63+eyes[0])+'" cy="'+(34+eyes[1])+'" r="1.9" fill="'+INK+'"/></g>';
    if(o.extra)s+=o.extra;
    if(o.front)s+='<g>'+cap(o.front,c,9)+(o.hold||'')+(o.anim||'')+'</g>';
    return s+'</g>'}
  var S={
    /* designs: drags a giant pencil and leaves a line on the page */
    pencil:{vb:"-6 0 150 120",svg:
      '<path class="trail" pathLength="1" d="M4 108C20 103 32 111 48 106" stroke="'+INK+'" stroke-width="2.6" stroke-linecap="round" fill="none"/>'+
      bean({c:Y,lean:-4,sx:6,eyes:[-2,1],bd:.4,back:"M73 60 L86 72",front:"M48 60 L36 76",anim:rot(48,60,-6,1.1),
        hold:'<g transform="rotate(-38 30 86)"><rect x="24" y="44" width="13" height="44" rx="2" fill="'+O+'" stroke="'+INK+'" stroke-width="3"/><path d="M24 88 L30.5 102 L37 88Z" fill="#F4E4C8" stroke="'+INK+'" stroke-width="3" stroke-linejoin="round"/><path d="M28.4 97.5 L30.5 102 L32.6 97.5Z" fill="'+INK+'"/><rect x="24" y="38" width="13" height="8" rx="2.5" fill="'+R+'" stroke="'+INK+'" stroke-width="3"/></g>'})},
    /* builds: holds up a phone it made, screen on */
    phone:{vb:"0 -14 124 134",svg:
      bean({c:B,sx:4,eyes:[1,-2.5],bd:1.6,back:"M73 58 L84 38",front:"M47 58 L40 38",
        extra:'<g>'+mov(0,-3,1.6)+'<rect x="30" y="-6" width="60" height="40" rx="8" fill="'+INK+'"/><rect x="35" y="-1" width="50" height="30" rx="4.5" fill="'+W+'"/><rect x="40" y="5" width="22" height="4.5" rx="2.2" fill="'+Y+'"/><rect x="40" y="13" width="34" height="3.4" rx="1.7" fill="'+INK+'" opacity=".22"/><rect x="40" y="19" width="26" height="3.4" rx="1.7" fill="'+INK+'" opacity=".22"/></g>'})},
    /* sweats the details: down on one knee, magnifier over a single red pixel, sweating */
    magnify:{vb:"-10 0 140 120",svg:
      '<rect x="4" y="98" width="9" height="9" fill="'+R+'" stroke="'+INK+'" stroke-width="2"/>'+
      bean({c:V,lean:-14,sx:-6,eyes:[-3,2],bd:.9,legs:["M52 93 L44 104","M68 93 L76 101"],back:"M74 60 L82 76",
        front:"M47 62 L30 80",anim:rot(47,62,5,1.8),
        hold:'<path d="M30 80 L22 90" stroke="'+INK+'" stroke-width="6" stroke-linecap="round"/><circle cx="16" cy="96" r="11" fill="rgba(155,198,234,.35)" stroke="'+INK+'" stroke-width="3.2"/><path d="M11 92q3-3 7-2" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
        extra:'<path class="drip" d="M78 22c-3 5-3 8 0 9.5 3-1.5 3-4.5 0-9.5z" fill="'+B+'" stroke="'+INK+'" stroke-width="2.2" stroke-linejoin="round"/>'})},
    /* argues with the constraints: leans into a block and shoves it */
    push:{vb:"-2 0 140 120",svg:
      '<g>'+mov(3,0,.7)+'<rect x="84" y="62" width="44" height="44" rx="5" fill="'+G+'" stroke="'+INK+'" stroke-width="3.2"/><path d="M92 72h28M92 80h20" stroke="'+INK+'" stroke-width="2.6" stroke-linecap="round" opacity=".5"/></g>'+
      bean({c:O,lean:14,sx:-4,eyes:[3,0],bd:2.2,legs:["M50 93 L40 105","M66 93 L62 105"],back:"M72 60 L86 70",front:"M72 70 L86 80",anim:mov(3,0,.7)})},
    /* ships: holds up a ticked note */
    tick:{vb:"0 0 136 120",svg:
      bean({c:G,sx:2,eyes:[3,-2],bd:1.2,back:"M47 60 L38 74",front:"M73 58 L92 42",anim:rot(73,58,-7,1.3),
        hold:'<g transform="rotate(8 104 36)"><rect x="90" y="18" width="34" height="32" rx="4" fill="'+Y+'" stroke="'+INK+'" stroke-width="3"/><path d="M98 34l6 6 12-13" stroke="'+INK+'" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>'})}
  };
  return function(name){var x=S[name];return '<svg class="bean" viewBox="'+x.vb+'" aria-hidden="true" focusable="false">'+x.svg+'</svg>'};
})();


Array.prototype.forEach.call(document.querySelectorAll(".doo[data-bean],.perch .pb[data-bean]"),function(d){d.innerHTML=BEAN(d.dataset.bean)});
/* doodles: scattered at random on each visit, and the visitor can pick them up and move them */
(function(){
  var box=document.getElementById("heroIn"); if(!box)return;
  var ds=[].slice.call(box.querySelectorAll(".doo"));
  /* loose slots down both edges, kept off the centre column where the text lives */
  /* random spots, checked so no doodle lands on the text or on another doodle */
  function place(){
    if(box.closest(".hero-editorial"))return;
    var B=box.getBoundingClientRect();
    var txt=[].slice.call(box.querySelectorAll(".hi,.framed,.avail,.claim")).map(function(e){return e.getBoundingClientRect()});
    var T={l:Math.min.apply(0,txt.map(function(r){return r.left}))-40,r:Math.max.apply(0,txt.map(function(r){return r.right}))+40,
           t:Math.min.apply(0,txt.map(function(r){return r.top}))-30,b:Math.max.apply(0,txt.map(function(r){return r.bottom}))+30};
    var taken=[T];
    function hit(q){var a=0;taken.forEach(function(o){var w=Math.min(q.r,o.r)-Math.max(q.l,o.l),h=Math.min(q.b,o.b)-Math.max(q.t,o.t);if(w>0&&h>0)a+=w*h});return a}
    var order=ds.slice().sort(function(a,b){return b.offsetWidth*b.offsetHeight-a.offsetWidth*a.offsetHeight});
    var side=Math.random()<.5?0:1;
    order.forEach(function(d,k){
      var w=d.offsetWidth,h=d.offsetHeight,q,best=null;
      var bestA=1e12;
      for(var n=0;n<400;n++){
        var left=(k+side)%2===0; /* alternate sides so neither edge gets crowded */
        var x=left?Math.random()*Math.max(0,T.l-B.left-w):T.r-B.left+Math.random()*Math.max(0,B.right-T.r-w);
        var y=Math.random()*(B.height-h);
        q={l:B.left+x-18,r:B.left+x+w+18,t:B.top+y-18,b:B.top+y+h+18};
        var a=hit(q);if(a<bestA){bestA=a;best=[x,y]}if(!a)break}
      taken.push({l:B.left+best[0]-18,r:B.left+best[0]+w+18,t:B.top+best[1]-18,b:B.top+best[1]+h+18});
      d.style.left=best[0]+"px";d.style.top=best[1]+"px";d.style.right="auto";d.style.bottom="auto";
      d.style.setProperty("--r",((Math.random()-.5)*12).toFixed(1)+"deg")});
  }
  if(document.readyState==="complete")place();else window.addEventListener("load",place);
  ds.forEach(function(d){
    var sx,sy,ox=0,oy=0,on=false,moved=false;
    d.addEventListener("pointerdown",function(e){if(e.button>0)return;on=true;moved=false;sx=e.clientX-ox;sy=e.clientY-oy;
      d.setPointerCapture(e.pointerId);d.classList.add("drag");e.preventDefault()});
    d.addEventListener("pointermove",function(e){if(!on)return;
      var hb=document.getElementById("hero").getBoundingClientRect(),b={left:hb.left+8,right:hb.right-8,top:hb.top+96,bottom:hb.bottom-8},r=d.getBoundingClientRect();
      var nx=e.clientX-sx,ny=e.clientY-sy;
      /* keep it inside the hero */
      var minx=ox-(r.left-b.left),maxx=ox+(b.right-r.right),miny=oy-(r.top-b.top),maxy=oy+(b.bottom-r.bottom);
      ox=Math.min(maxx,Math.max(minx,nx));oy=Math.min(maxy,Math.max(miny,ny));moved=true;
      d.style.translate=ox+"px "+oy+"px"});
    function up(){if(!on)return;on=false;d.classList.remove("drag")}
    d.addEventListener("pointerup",up);d.addEventListener("pointercancel",up);
  });
})();


var STORY=[
 {t:"I design products,"},{cd:1},{t:"then I"},{t:"build them",a:1},{t:"myself."},{f:"phone"},{br:1},
 {t:"Commerce degree, no design school."},{t:"I learned it on real clients,",a:1},{t:"with real deadlines."},{f:"pencil"},{br:1},
 {t:"I argue with constraints"},{t:"instead of drawing around them,"},{f:"push"},{br:1},
 {t:"sweat the states"},{t:"everyone skips,",a:1},{ms:1},{t:"and never hand over"},{t:"anything I wouldn't use myself."}
];

/* booking link for every "Schedule a call" button; empty falls back to an email */
var CAL_URL="";
var CALL=CAL_URL||"mailto:adi.workspace76865@gmail.com";
if(CAL_URL){[].forEach.call(document.querySelectorAll(".nav .cta,.hcta"),function(a){a.href=CAL_URL;a.target="_blank";a.rel="noopener"})}
/* Shared footer contact copy and real destinations. */
var MAIL="adi.workspace76865@gmail.com";
var SOC=[["GitHub","adityakumar027","https://github.com/adityakumar027","#B4F6B8"],
         ["LinkedIn","adicrzz","https://www.linkedin.com/in/adicrzz/","#A9DEFF"],
         ["Email","adi.workspace76865@gmail.com","mailto:adi.workspace76865@gmail.com","#FFD44E"],
         ["Résumé","PDF","/Aditya_Kumar_Resume.pdf","#E7BBFF"]];
var CX={
 home:["Get in touch","Have a system to build or scale?","I'm open to software engineering roles. Tell me about the problem, the stack, and what reliability looks like for you."],
 work:["Seen enough?","Let's make yours next.","If one of these felt close to what you need, a 30 minute call is the quickest way to find out if I'm the right person for it."],
 case:["Liked how this one went?","Same process. Your problem.","Walk me through what you're building and who it's for. I'll tell you honestly where I'd start."],
 about:["Now you know me","Tell me about you.","Who uses it, what gets in their way, what you'd love it to feel like. That's where I like to start."],
 offer:["Know what you need?","Let's scope it together.","Tell me the problem and the shape you think it takes. If it's a fit, I'll say where I'd begin. If it isn't, I'll say that too."],
 svc:["Sounds like your problem?","Let's talk it through.","A call is the fastest way to see if this is the right service, or if you need something slightly different."],
 canvas:["Something caught your eye?","Let's make something like it.","Branding, packaging, carousels, websites. Tell me what you're making and we'll figure out the rest on a call."],
 lab:["Have an experiment in mind?","Let’s make it work.","A component, an interaction or a new idea. Tell me what you want to explore."],
 gallery:["Something caught your eye?","Let's make something like it.","Branding, packaging, carousels, websites. Tell me what you're making and we'll figure out the rest on a call."],
 contact:["Say hi","Let's give your idea a clear direction.","Tell me what you want to create and who it's for. We'll talk through what it needs and where to begin."]};
function updateFooter(k){var c=CX[k]||CX.home;
  document.getElementById("footer-heading").textContent=c[1];
  document.getElementById("footer-description").textContent=c[2]}
var footerCall=document.getElementById("footer-call");footerCall.href=CALL;
if(CAL_URL){footerCall.target="_blank";footerCall.rel="noopener"}
/* the footer calendar: pick a day (today to two months out) and the booking link opens on it; times are chosen on
   the booking page, so nothing here pretends to know availability. Arrow keys move through the days. */
(function(){var grid=document.querySelector(".foot-book .cal-grid");if(!grid)return;
  var head=document.getElementById("cal-month"),pick=document.getElementById("cal-pick"),navs=document.querySelectorAll(".foot-book .cal-nav");
  var now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),view=0,sel=null;
  var MON=["January","February","March","April","May","June","July","August","September","October","November","December"],DAY=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
  function draw(focus){var first=new Date(today.getFullYear(),today.getMonth()+view,1),n=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),lead=(first.getDay()+6)%7,h="";
    head.textContent=MON[first.getMonth()]+" "+first.getFullYear();navs[0].disabled=view<=0;navs[1].disabled=view>=2;
    for(var i=0;i<lead;i++)h+="<span></span>";
    var tab=null;for(var d=1;d<=n;d++){var day=new Date(first.getFullYear(),first.getMonth(),d),past=day<today,on=sel&&+day===+sel;
      if(!past&&(on||tab===null&&!sel))tab=d;
      h+='<button type="button" data-d="'+d+'"'+(past?" disabled":"")+(+day===+today?' class="today"':"")+' aria-pressed="'+(on?"true":"false")+'" aria-label="'+DAY[day.getDay()]+" "+d+" "+MON[day.getMonth()]+'" tabindex="-1">'+d+"</button>"}
    grid.innerHTML=h;var t=grid.querySelector('[data-d="'+(tab||1)+'"]:not(:disabled)')||grid.querySelector("button:not(:disabled)");if(t){t.tabIndex=0;if(focus)t.focus()}}
  function choose(day){sel=day;var u=new URL(CAL_URL);u.searchParams.set("month",iso(day).slice(0,7));u.searchParams.set("date",iso(day));footerCall.href=u.toString();
    pick.innerHTML="<b>"+DAY[day.getDay()]+" "+day.getDate()+" "+MON[day.getMonth()].slice(0,3)+"</b> · pick a time next";draw(true)}
  grid.addEventListener("click",function(e){var b=e.target.closest("button");if(!b||b.disabled||!CAL_URL)return;choose(new Date(today.getFullYear(),today.getMonth()+view,+b.dataset.d))});
  grid.addEventListener("keydown",function(e){var b=e.target.closest("button"),k={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];if(!b||!k)return;e.preventDefault();
    var bs=Array.prototype.slice.call(grid.querySelectorAll("button:not(:disabled)")),i=bs.indexOf(b),t=bs[Math.max(0,Math.min(bs.length-1,i+k))];if(t){b.tabIndex=-1;t.tabIndex=0;t.focus()}});
  navs.forEach(function(n){n.addEventListener("click",function(){view=Math.max(0,Math.min(2,view+ +n.dataset.step));draw(false)})});
  draw(false)})();
document.getElementById("footer-socials").innerHTML=SOC.map(function(s){return '<a class="cx-s" href="'+s[2]+'" target="_blank" rel="noopener" style="--sc:'+s[3]+'"><b>'+s[0]+'</b><small>'+s[1]+'</small>'+UPR+'</a>'}).join("")+
  '<button type="button" class="cx-s cx-mail" style="--sc:#E7BBFF" aria-label="Copy email address"><b>Email</b><small>'+MAIL+'</small><span class="visually-hidden" role="status" aria-live="polite"></span></button>';
document.querySelector(".cx-mail").onclick=async function(){var b=this,cp=b.querySelector('[role="status"]');
  try{await navigator.clipboard.writeText(MAIL);b.classList.add("done");cp.textContent="Email address copied"}catch(e){cp.textContent="Could not copy email address"}
  clearTimeout(b._t);b._t=setTimeout(function(){b.classList.remove("done");cp.textContent=""},1600)};

function offerRow(o,i){
  return '<a class="srow" href="/offer/'+o.id+'" data-s="'+o.id+'" style="--pc:'+o.pc+'">'+
    '<div class="shead"><span class="sn">0'+(i+1)+'</span><h3><span class="sw2">'+o.h+'</span></h3>'+
    '<svg class="ic ar r" viewBox="0 0 24 24" aria-hidden="true"><use href="#ar"/></svg></div>'+
    '<div class="sbody"><div><p>'+o.p+'</p><p class="sinc">'+o.inc.join(" · ")+'</p></div></div></a>'}

document.getElementById("offerGrid").innerHTML=OFFER.map(offerRow).join("");
document.getElementById("offerFull").innerHTML=OFFER.map(offerRow).join("");

document.getElementById("wgrid").innerHTML=P.map(function(p){
  return '<a class="wcard'+(p.small?' small':'')+(p.id==="hourbit"?' wide':'')+'" href="/work/'+p.id+'" style="--swatch:'+p.s+'">'+
   '<span class="top"><svg viewBox="0 0 100 100" aria-hidden="true">'+p.a+'</svg></span>'+
   '<span class="bd"><span class="sub">'+p.t+'</span><h3>'+p.n+'</h3><p>'+p.g+'</p><span class="go">Read the case <svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#ar"/></svg></span></span></a>'}).join("");

(function(){
  var host=document.getElementById("storyText"),n=0;if(host.closest("[hidden]"))return;
  STORY.forEach(function(tok){
    if(tok.br){var b=document.createElement("span");b.className="brk";host.appendChild(b);return}
    function glue(el){var prev=host.lastChild;if(prev&&prev.classList&&prev.classList.contains("sw")){var g=document.createElement("span");g.className="glue";
      host.replaceChild(g,prev);g.appendChild(prev);g.appendChild(el)}else host.appendChild(el)}
    /* canvas drop marker: three card edges; the pieces themselves live in a layer on the section (see below) */
    if(tok.cd){var m=document.createElement("span");m.className="cd";m.dataset.i=n++;m.tabIndex=0;m.setAttribute("role","button");
      m.setAttribute("aria-label","Two of my websites and three pieces of app work");m.innerHTML="<i></i><i></i><i></i>";glue(m);setTimeout(function(){var is=m.children;try{is[0].style.setProperty("--img","url(\""+ALT.fxkit.u+"\")");is[1].style.setProperty("--img","url(\""+ALT.wf_home.u+"\")");is[2].style.setProperty("--img","url(\""+svgURI(pcSvg("listen"))+"\")")}catch(e){}},0);return}
    /* three live micro interactions from the apps, stacked at rest, a row on hover */
    if(tok.ms){var ms=document.createElement("span");ms.className="ms";ms.dataset.i=n++;ms.tabIndex=0;ms.setAttribute("role","button");
      ms.setAttribute("aria-label","Hourbit's heatmap filling in, Washio's View bag, Parchi listening");
      var cells="",r,c,sd=7;for(r=0;r<4;r++)for(c=0;c<13;c++){sd=(sd*9301+49297)%233280;var q=sd/233280,o=q<.22?0:q<.5?.3:q<.8?.62:1;
        cells+=o?'<s style="--o:'+o+';--d:'+(c*.2+r*.06).toFixed(2)+'s"></s>':"<s></s>"}
      ms.innerHTML='<span class="ms-c ms-pc" style="--k:2"><span class="ms-in"><span class="ms-rec"><i class="w1"></i><i class="w2"></i><b></b></span><em>Listening…</em></span></span>'+
        '<span class="ms-c ms-hb" style="--k:0"><span class="ms-in"><span class="ms-t">This week<b>6h <i>40m</i></b></span><span class="ms-hm">'+cells+'</span></span></span>'+
        '<span class="ms-c ms-ws" style="--k:1"><span class="ms-in"><span class="ms-row"><span>Shirts<small>Wash &amp; Fold</small></span><span class="ms-st"><i>−</i><output>1</output><u>+</u></span></span>'+
        '<span class="ms-bar"><span><output>1</output> pcs<small>Wash &amp; Fold</small></span><span class="ms-vb">View bag</span></span></span></span>';
      glue(ms);return}
    if(tok.f){var f=document.createElement("span");f.className="fig";f.dataset.i=n++;f.dataset.k=tok.f;
      f.innerHTML=({pencil:'<svg class="dd " style="--w:294;--h:330" viewBox="0 0 294 330" aria-hidden="true"><use href="#dd-sketch" width="294" height="330"/></svg>',phone:'<svg class="dd " style="--w:303;--h:330" viewBox="0 0 303 330" aria-hidden="true"><use href="#dd-laptop" width="303" height="330"/></svg>',push:'<svg class="dd " style="--w:411;--h:293" viewBox="0 0 411 293" aria-hidden="true"><use href="#dd-push" width="411" height="293"/></svg>',magnify:'<svg class="dd " style="--w:151;--h:394" viewBox="0 0 151 394" aria-hidden="true"><use href="#dd-mag" width="151" height="394"/></svg>'})[tok.f]||BEAN(tok.f);glue(f);return}
    tok.t.split(/\s+/).forEach(function(word){
      var s=document.createElement("span");
      s.className="sw"+(tok.a?" accent":"");s.dataset.i=n++;s.textContent=word;host.appendChild(s)})})
})();
var storyUnits=Array.prototype.slice.call(document.querySelectorAll("#storyText .sw,#storyText .fig,#storyText .cd,#storyText .ms"));
/* ---------- story: canvas drop + micro states ---------- */
(function(){
  var mk=document.querySelector("#storyText .cd"),sec=document.getElementById("story"),txt=document.getElementById("storyText");
  if(!mk||!sec)return;
  var fine=matchMedia("(hover:hover) and (pointer:fine)");
  /* w is the width at a 1440px section; side/at is where it wants to land relative to the text block */
  var PCS=[
    {t:"site",src:"fxkit",url:"fxkit.vercel.app",lab:"1502 × 774",w:260,r:-4,side:-1,at:.08},
    {t:"phone",src:"vid",w:104,r:5,side:1,at:.02},
    {t:"comp",src:"wk_bagbtn",w:150,r:-5,side:-1,at:1},
    {t:"site",src:"mistline",url:"mountains-playlist.vercel.app",lab:"1526 × 777",w:260,r:3.5,side:1,at:.92},
    {t:"phone",src:"x_home",w:100,r:-6,side:-1,at:.5}];
  /* phones: a designed collage in a band under the text. x, y and w are fractions of the band width */
  var PH=[[.01,.03,.52],[.59,0,.17],[.03,.5,.3],[.38,.48,.56],[.815,.1,.165]];
  var L=document.createElement("div");L.className="cd-layer";L.setAttribute("aria-hidden","true");sec.appendChild(L);
  var pad=null,els=PCS.map(function(p,k){
    var d=document.createElement("div");d.className="cd-p cd-"+p.t;d.style.setProperty("--k",k);d.style.setProperty("--j",PCS.length-1-k);
    d.innerHTML='<span class="cd-q"><span class="cd-card">'+(p.t==="site"?'<span class="cd-bar"><i></i><i></i><i></i><span>'+p.url+'</span></span><span class="cd-shot" style="display:block"></span>':"")+
      '</span><span class="cd-sel"><b></b><b></b><b></b><b></b></span><span class="cd-lab">'+(p.lab||"")+'</span></span>';
    L.appendChild(d);return d});
  var vid=null,filled=false;
  function fill(){if(filled)return;filled=true;
    els.forEach(function(d,k){var p=PCS[k],box=d.querySelector(p.t==="site"?".cd-shot":".cd-card"),lab=d.querySelector(".cd-lab");
      try{if(p.src==="vid"){box.innerHTML='<video muted loop playsinline preload="none"><source src="'+ALT.wv_home_w.u+'" type="video/webm"><source src="'+ALT.wv_home.u+'" type="video/mp4"></video>';
          vid=box.firstChild;vid.addEventListener("loadedmetadata",function(){lab.textContent=vid.videoWidth+" × "+vid.videoHeight})}
        else{var a=ALT[p.src];box.innerHTML='<img alt="" draggable="false" src="'+a.u+'">';if(!p.lab&&a.w)lab.textContent=a.w+" × "+a.h}}catch(e){}})}
  setTimeout(fill,0);
  var open=false,placed=0,shut=0,phone=false;
  function R(r,o,p){return {l:r.left-o.left-p,t:r.top-o.top-p,r:r.right-o.left+p,b:r.bottom-o.top+p}}
  function hit(a,b){return a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t}
  /* measure once per open: every word, figure and the heading is an obstacle; each piece takes the
     free spot nearest to where it wants to be, never over text or another piece */
  function placeDesk(){
    var S=sec.getBoundingClientRect(),sc=Math.max(.62,Math.min(1,S.width/1440)),obs=[],x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
    Array.prototype.forEach.call(sec.querySelectorAll("h2,:scope>.ftag,#storyText .sw,#storyText .fig,#storyText .cd,#storyText .ms"),function(e){
      var r=e.getBoundingClientRect();if(!r.width)return;var o=R(r,S,e.tagName==="H2"?20:14);obs.push(o);
      if(e.tagName==="SPAN"){x0=Math.min(x0,o.l);x1=Math.max(x1,o.r);y0=Math.min(y0,o.t);y1=Math.max(y1,o.b)}});
    var hd=sec.querySelector("h2").getBoundingClientRect(),top=Math.max(12,hd.top-S.top-24),m=mk.getBoundingClientRect(),mx=m.left+m.width/2-S.left,my=m.top+m.height/2-S.top,got=[];
    els.forEach(function(d,k){var p=PCS[k],best=null;
      for(var f=1;f>.55&&!best;f-=.12){
        var w=p.w*sc*f,h=p.t==="site"?w*462/900+18:p.t==="phone"?w*1039/480:w*254/300+18,pd=10+Math.abs(p.r)*.012*h,
            px=p.side<0?x0-26-w/2:x1+26+w/2,py=y0+p.at*(y1-y0),bd=1e18;
        for(var y=top+h/2;y<S.height-12-h/2-14;y+=9)for(var x=16+w/2;x<S.width-16-w/2;x+=9){
          var dd=(x-px)*(x-px)+(y-py)*(y-py)*1.4;if(dd>=bd)continue;
          var b={l:x-w/2-pd,t:y-h/2-pd,r:x+w/2+pd,b:y+h/2+pd+16},ok=true;
          for(var i=0;i<obs.length&&ok;i++)if(hit(b,obs[i]))ok=false;
          for(i=0;i<got.length&&ok;i++)if(hit(b,got[i]))ok=false;
          if(ok){bd=dd;best={x:x,y:y,w:w,h:h,b:b}}}}
      d.style.display=best?"":"none";if(!best)return;got.push(best.b);
      d.style.width=best.w+"px";
      d.style.setProperty("--x",(best.x-best.w/2)+"px");d.style.setProperty("--y",(best.y-best.h/2)+"px");d.style.setProperty("--r",p.r+"deg");
      d.style.setProperty("--hx",(mx-best.w/2)+"px");d.style.setProperty("--hy",(my-best.h/2)+"px")});
    L.classList.toggle("sm",sc<.8);placed=S.width+"x"+S.height}
  function placePhone(){
    if(!pad){pad=document.createElement("div");pad.className="cd-pad";txt.parentNode.appendChild(pad);pad.appendChild(L)}
    var W=pad.getBoundingClientRect().width,H=0;L.classList.add("sm");
    els.forEach(function(d,k){var p=PCS[k],s=PH[k],w=s[2]*W,h=p.t==="site"?w*462/900+12:p.t==="phone"?w*1039/480:w*254/300+10;
      d.style.width=w+"px";d.style.setProperty("--x",s[0]*W+"px");d.style.setProperty("--y",s[1]*W+"px");d.style.setProperty("--r",p.r*.8+"deg");H=Math.max(H,s[1]*W+h)});
    pad.style.height=Math.ceil(H+12)+"px";pad.classList.add("on");
    var P=pad.getBoundingClientRect(),m=mk.getBoundingClientRect();
    els.forEach(function(d,k){var w=parseFloat(d.style.width);
      d.style.setProperty("--hx",(m.left+m.width/2-P.left-w/2)+"px");d.style.setProperty("--hy",(m.top-P.top)+"px")});placed="phone"}
  function play(on){if(!vid)return;if(on){var pr=vid.play();if(pr&&pr.catch)pr.catch(function(){})}else vid.pause()}
  function show(){clearTimeout(shut);if(open||!mk.classList.contains("on"))return;fill();
    if(placed!==sec.offsetWidth+"x"+sec.offsetHeight&&!phone)placeDesk();
    open=true;L.classList.add("open","fine");mk.classList.add("lit");play(true)}
  function hide(){clearTimeout(shut);shut=setTimeout(function(){if(drag)return;open=false;L.classList.remove("open");mk.classList.remove("lit");play(false)},260)}
  mk.addEventListener("mouseenter",function(){if(fine.matches)show()});
  mk.addEventListener("mouseleave",function(){if(fine.matches)hide()});
  mk.addEventListener("focus",function(){if(!phone)show()});mk.addEventListener("blur",function(){if(!phone)hide()});
  L.addEventListener("mouseover",function(){if(open&&fine.matches)clearTimeout(shut)});
  L.addEventListener("mouseout",function(e){if(open&&fine.matches&&!(e.relatedTarget&&L.contains(e.relatedTarget)))hide()});
  /* a nudge while it's out: drag a piece a little */
  var drag=null;
  L.addEventListener("pointerdown",function(e){var d=e.target.closest(".cd-p");if(!d||!open||phone)return;e.preventDefault();
    drag={d:d,x:e.clientX,y:e.clientY,ox:parseFloat(d.style.getPropertyValue("--x")),oy:parseFloat(d.style.getPropertyValue("--y"))};d.classList.add("drag");d.setPointerCapture(e.pointerId)});
  L.addEventListener("pointermove",function(e){if(!drag)return;
    drag.d.style.setProperty("--x",drag.ox+e.clientX-drag.x+"px");drag.d.style.setProperty("--y",drag.oy+e.clientY-drag.y+"px")});
  L.addEventListener("pointerup",function(e){if(!drag)return;drag.d.classList.remove("drag");drag=null;
    if(!L.contains(document.elementFromPoint(e.clientX,e.clientY))&&!mk.matches(":hover"))hide()});
  window.addEventListener("resize",function(){if(open&&!phone){placeDesk()}else if(!phone)placed=0},{passive:true});
  /* phones: once the line is read, the marker wiggles and throws the pieces into a band under the text, and they stay */
  if(!fine.matches){var done=false,
    /* fires when the marker is actually on screen (the story text is visible at once on phones, so the reveal class
       can't be the trigger: it would pop the collage while still off screen) */
    fire=function(){if(done)return;done=true;if(io)io.disconnect();
      phone=true;fill();mk.classList.add("wig");
      setTimeout(function(){mk.classList.remove("wig");placePhone();void L.offsetWidth;L.classList.add("open");open=true;
        if(vid&&"IntersectionObserver" in window)new IntersectionObserver(function(es){play(es[0].isIntersecting)}).observe(vid)},matchMedia("(prefers-reduced-motion: reduce)").matches?0:950)},
    io="IntersectionObserver" in window?new IntersectionObserver(function(es){if(es[0].isIntersecting)fire()},{rootMargin:"0px 0px -25% 0px"}):null;
    if(io)io.observe(mk);else fire();
    /* the band takes its final height while the story is still well below the screen. It used to appear only when the
       marker was reached (plus a 950ms wiggle): by then a quick scroller was reading the services below, and 277px of
       new band above them shoved the page down (a 0.33 layout shift on phones). The pieces still fly in on cue. */
    var rsv=false,rio="IntersectionObserver" in window?new IntersectionObserver(function(es){if(!es[0].isIntersecting||rsv||!sec.getBoundingClientRect().width)return;
      rsv=true;rio.disconnect();phone=true;placePhone()},{rootMargin:"1600px 0px 1600px 0px"}):null;
    if(rio)rio.observe(sec);
    window.addEventListener("resize",function(){if(phone&&pad)placePhone()},{passive:true})}

  /* micro states: hover opens the row (tap on phones); loops only run while on screen */
  var ms=document.querySelector("#storyText .ms");if(!ms)return;
  ms.addEventListener("mouseenter",function(){if(fine.matches)ms.classList.add("open")});
  ms.addEventListener("mouseleave",function(){if(fine.matches)ms.classList.remove("open")});
  ms.addEventListener("focus",function(){if(fine.matches)ms.classList.add("open")});ms.addEventListener("blur",function(){ms.classList.remove("open")});
  ms.addEventListener("click",function(){if(!fine.matches)ms.classList.toggle("open")});
  var outs=ms.querySelectorAll(".ms-ws output"),plus=ms.querySelector(".ms-st u"),vb=ms.querySelector(".ms-vb"),cnt=1,tick=0,iv=0;
  function bump(el){el.classList.remove("bump");void el.offsetWidth;el.classList.add("bump")}
  function step(){tick++;
    if(tick%4===0){vb.classList.add("tap");setTimeout(function(){vb.classList.remove("tap")},200);return}
    if(tick%4===1&&cnt>=3)cnt=0;
    plus.classList.add("tap");setTimeout(function(){plus.classList.remove("tap")},160);cnt++;
    Array.prototype.forEach.call(outs,function(o){o.textContent=cnt;bump(o)})}
  var calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function run(on){ms.classList.toggle("run",on);clearInterval(iv);if(on&&!calm)iv=setInterval(function(){if(!document.hidden)step()},900)}
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){run(es[0].isIntersecting)}).observe(ms);else run(true);
})();

/* ---------- deck ---------- */
var rail=document.getElementById("deckRail"),deck=document.getElementById("deck"),navSlot=document.getElementById("navSlot"),
    caseSlot=document.getElementById("caseSlot");
/* the tagline cut down for the small cards on phones, so every name bar is the same two lines */
var SHORT_T={"alter":"AI companion","track-it":"Expense tracker","washio":"Laundry app","parchi":"Voice billing","hourbit":"Focus timer"};
var cards=P.slice(0,4).map(function(p){
  var a=document.createElement("a");
  a.className="card";a.href="/work/"+p.id;a.style.setProperty("--swatch",p.s);
  a.setAttribute("aria-label",p.n+" — "+p.t);
  /* a project with no real screens yet (p.stub) gets the same grounded launcher-tile
     treatment the other cards only wear briefly before their cover peels away — a black
     squircle badge with its own drop shadow. Without that shadow the bare icon has no
     depth cue under the stool's 3D tilt and reads as floating above the table rather than
     sitting on it. This is permanent for a stub, not a pre-reveal state: no fake screen
     underneath to peel back to. */
  var art=p.stub
    ?'<span class="cc-t cc-stub"><svg viewBox="0 0 100 100" aria-hidden="true">'+p.a+'</svg></span>'
    :'<svg viewBox="0 0 100 100" aria-hidden="true">'+p.a+'</svg>';
  a.innerHTML='<span class="card-top"><span class="card-art">'+art+'</span></span>'+
   '<span class="card-meta"><b>'+p.n+'</b><i><span class="tl">'+p.t+'</span><span class="ts">'+(SHORT_T[p.id]||p.t)+'</span></i></span>';
  deck.appendChild(a);return a});

var CW=230,CH=300,narrow=false,NW=36,NGAP=-9,NOV=10;
function measure(){narrow=window.innerWidth<820;NOV=0;CW=narrow?132:230;CH=narrow?172:300;
  NW=window.innerWidth<520?15:narrow?17:20; NGAP=narrow?-11:-12;   /* negative gap: the cards overlap, a small fan inside the Work tab */
  cards.forEach(function(c){c.style.width=CW+"px";c.style.height=CH+"px"});
  var rows=narrow?2:1;
  caseSlot.style.height=(rows*CH+(rows-1)*12)+"px"}

/* A: docked inside the nav, right after Work
   r is navSlot's rect, read once per frame in render() — not per card — so writing
   each card's transform in the same frame never forces a fresh layout read for the next one */
function docked(i,r){
  var s=NW/CW, h=CH*s;
  /* overlapping fan, each card tipped a little so the stack reads as a hand */
  return{x:r.left-NOV+i*(NW+NGAP)+NW/2-CW/2, y:r.top+(r.height-h)/2+(CH*s)/2-CH/2,
         s:s, r:-7+i*4.5, rx:0}}
var stoolEl=document.getElementById("stool");
var dropEl=document.getElementById("drop");

/* B: fallen on the table. r is the stool's rect, read once per frame — same reasoning as docked() */
function fallen(i,r){
  var jog=[5,-8,7,-5][i];
  var scx,scy,halfW;
  if(r){
    scx=r.left+r.width*0.475;     /* seat centre x, measured from the alpha channel */
    /* the seat's TOP FACE runs from the back rim (0.006) to the front highlight (0.113);
       below that is the side of the seat, not the surface. The hand of cards is sized and
       placed so its outline spans 0.02 → 0.10 of the photo's height, inside that face. */
    scy=r.top +r.height*0.067;
    halfW=r.width*0.435;          /* seat half-width */
  }else{
    scx=window.innerWidth/2; scy=window.innerHeight-260; halfW=200;
  }
  var sp=halfW*0.23, sc=(halfW*2)/CW*0.19;
  var t=(i-1.5);
  /* outer cards sit further BACK — the seat is round, so its edges recede */
  return{x:scx-CW/2+t*sp, y:scy-CH/2-Math.abs(t)*3+jog*.18,
         s:sc, r:t*10+jog*.5, rx:67}}
/* C: risen, laid out horizontally. r is caseSlot's rect, read once per frame — same reasoning */
function laid(i,r){
  var cols=narrow?2:4,gap=narrow?12:22,col=i%cols,row=Math.floor(i/cols),rowW=cols*CW+(cols-1)*gap;
  return{x:r.left+(r.width-rowW)/2+col*(CW+gap),y:r.top+row*(CH+gap),s:1,r:0,rx:0,ry:0}}

function lerp(a,b,t){return a+(b-a)*t}
/* a rect re-expressed relative to an origin rect (deck space, or the stool stage) */
/* the stool's rect in deck space. Down the page it is measured against the stage (constant however you scroll);
   across the page it is measured against the deck, because the stage starts at the page gutter (20px) and the deck at 0:
   using the stage for x put the whole hand of cards 20px left of the seat */
function stoolSeat(deckR){var s=stoolEl.getBoundingClientRect(),o=loc(s,stageEl.getBoundingClientRect());
  o.left=s.left-deckR.left;o.right=s.right-deckR.left;return o}
function loc(r,o){return{left:r.left-o.left,top:r.top-o.top,width:r.width,height:r.height,right:r.right-o.left,bottom:r.bottom-o.top}}
var stageEl=document.querySelector(".drop-stage"),lastOwn=[];
/* the scroll position where the stool's stage (and with it the card deck) lets go of the screen */
function deckUnpin(){return Math.max(0,dropEl?dropEl.offsetTop+dropEl.offsetHeight-svh():0)}
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
/* The rise's easing, exactly the browser's own (cubic-bezier(.65,0,.35,1), what #deck.scrub .card animates with). The script
   and the browser both place a card at every scroll position, and hand it back and forth (a hover mid-rise). With ease()
   above they disagreed by up to 1% of the travel, so the card jumped up to 7px at that handoff. Same curve, no jump. */
var BZ=(function(){var x1=.65,y1=0,x2=.35,y2=1,cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
  function X(t){return((ax*t+bx)*t+cx)*t}function Y(t){return((ay*t+by)*t+cy)*t}function dX(t){return(3*ax*t+2*bx)*t+cx}
  return function(x){if(x<=0)return 0;if(x>=1)return 1;var t=x,i,e,d;
    for(i=0;i<8;i++){e=X(t)-x;if(Math.abs(e)<1e-7)return Y(t);d=dX(t);if(Math.abs(d)<1e-6)break;t-=e/d}
    var lo=0,hi=1;t=x;for(i=0;i<40;i++){e=X(t);if(Math.abs(e-x)<1e-7)break;if(x>e)lo=t;else hi=t;t=(lo+hi)/2}return Y(t)}})();
function clamp(v){return v<0?0:v>1?1:v}
var lastTf=[],lastSh=[],lastZ=[],lastOp=[],lastVo="",lastPeel="",lastPd=null,lastNav="",lastHint="",lastBar=null;
function tfOf(st){var rx=st.rx||0,ry=st.ry||0;if(Math.abs(rx)<.05)rx=.05;
  return "translate3d("+st.x.toFixed(1)+"px,"+st.y.toFixed(1)+"px,0) perspective(820px) "+
    "rotateX("+rx.toFixed(2)+"deg) rotateY("+ry.toFixed(2)+"deg) rotateZ("+st.r.toFixed(2)+"deg) scale("+st.s.toFixed(4)+")"}
/* the rise runs as a CSS scroll-driven animation where the browser has them (compositor, no lag); elsewhere the script scrubs it */
var SDA=!!(window.CSS&&CSS.supports&&CSS.supports("animation-timeline","scroll()")),lastT0=[],lastT1=[],lastRng="";
function apply(i,st,hov){
  var rx=st.rx||0;
  /* never exactly flat. While a card still has any 3D tilt Chrome treats it as a 3D layer: rastered once,
     then only scaled by the compositor, so hover is smooth. The moment rotateX hits 0 it becomes a flat
     2D layer and Chrome re-rasters it (screens, Washio's video and all) at every new hover scale, which is
     the lag Aditya saw only once the cards were 100% laid. 0.05deg is invisible (about 0.25px on the edge). */
  var tf=tfOf(st);
  if(tf!==lastTf[i]){cards[i].style.transform=tf;lastTf[i]=tf}
  /* at a steep tilt the card is nearly flat on the seat, so the shadow tightens
     into a contact line rather than a soft drop; a focused card gets a glass rim and a lift */
  /* the shadow is painted into the card's layer, so every change re-rasters the whole card (screen and all).
     It moves in 12deg steps, not every frame: five repaints for the whole fall instead of one per frame */
  var rq=Math.round(rx/12)*12;
  var sh = rx>6
    ? "0 "+(2+rq*0.10).toFixed(0)+"px "+(4+rq*0.16).toFixed(0)+"px -3px rgba(19,19,22,"+(0.16+rq*0.0040).toFixed(3)+")"
    : hov>.01
    ? "0 0 0 "+(9*hov).toFixed(1)+"px rgba(168,160,156,"+(.34*hov).toFixed(3)+"),0 "+(40*hov).toFixed(0)+"px "+(70*hov).toFixed(0)+"px -26px rgba(19,19,22,"+(.42*hov).toFixed(3)+")"
    : "";
  if(sh!==lastSh[i]){cards[i].style.boxShadow=sh;lastSh[i]=sh} }

var smooth=0,target=0,marks={},onHome=true;
/* One stable screen height for every scroll mark. On phones innerHeight grows and shrinks as the address bar
   hides and shows mid-scroll, which moved every mark and made the cards jump on the stool. This reads a real
   100svh element (the stool stage is 100svh too), so it only changes when the width does (rotation). */
var SVH=0,svhW=0;
function svh(){if(!SVH||svhW!==window.innerWidth){var pr=document.createElement("div");
  pr.style.cssText="position:absolute;top:0;left:0;width:1px;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(pr);SVH=pr.offsetHeight||window.innerHeight;pr.remove();svhW=window.innerWidth}return SVH}
function remark(){
  spyTops=null;spyKey="";
  var drop=document.getElementById("drop"),cs=document.getElementById("cases"),st=document.getElementById("story");
  if(!drop||!cs||!st)return;
  var vh=svh();
  /* fall: starts just before the stage pins, lands while heading + table share the screen */
  /* the whole fall happens while the stage is pinned: the nav and the stool both stand still on screen, so
     the cards (placed by script, a frame behind the browser's own scrolling) never chase a moving target.
     Before this the fall began while the stool was still scrolling up, and on real hardware the cards
     trailed it and stuttered */
  /* the rail the card deck is pinned in ends exactly where the stool's stage lets go */
  if(onHome&&drop.offsetHeight)rail.style.height=deckUnpin()+"px";
  marks.f0=drop.offsetTop;
  marks.f1=drop.offsetTop+vh*.45;
  /* hold on the table, then rise into the case studies */
  marks.l0=drop.offsetTop+vh*.92;
  marks.l1=cs.offsetTop+(cs.offsetHeight-vh)/2;
  /* phones (Oct 23, Aditya: the cards went up with the table, then came back down into the row): there the stool's
     stage lets go of the screen before the rise was due, so the cards rode the table up the screen first. The rise now
     starts the moment the stage lets go, and runs at an even pace, so the cards only ever move one way: up into the row. */
  var un=deckUnpin();marks.lin=un>marks.f1&&un<marks.l0;if(marks.lin)marks.l0=un;
  if(deck)deck.classList.toggle("lin",!!marks.lin);
  /* the story paragraph reads in from the bottom of the screen and is fully dark by the time it sits in the middle */
  var stx=document.getElementById("storyText");
  if(stx&&stx.offsetHeight){var str=stx.getBoundingClientRect(),sty=str.top+(window.pageYOffset||0);marks.s0=sty-vh*.9;marks.s1=sty+str.height-vh*.6}
  else{marks.s0=st.offsetTop-vh*.62;marks.s1=st.offsetTop+st.offsetHeight*.8-vh*.42}
  if(marks.s1<=marks.s0)marks.s1=marks.s0+1;
  storyRanges();
  litCount=-1;
  marks.bar=cs.offsetTop+cs.offsetHeight-svh()*1.3;
  if(marks.f1<=marks.f0)marks.f1=marks.f0+1;
  if(marks.l1<=marks.l0)marks.l1=marks.l0+1;
  if(marks.s1<=marks.s0)marks.s1=marks.s0+1}

var hint=document.getElementById("hint"),litCount=-1,moreBar=document.getElementById("moreBar");
/* story reveal: units are words plus the little pictures, in reading order. Each gets a scroll range: words a soft
   STW-unit window, pictures a wider one centred on their place so they grow in instead of popping. */
var STW=8,storyTxt=document.getElementById("storyText");
function storyRanges(){
  for(var k=0;k<storyUnits.length;k++){storyUnits[k]._on=undefined;storyUnits[k]._q=undefined}
  var on=SDA&&!window.__noSDA&&!calm&&innerWidth>760&&onHome&&storyTxt&&storyTxt.offsetHeight>0;
  if(storyTxt)storyTxt.classList.toggle("wscrub",!!on);
  if(!on)return;
  var M=storyUnits.length,T=M+STW+8,span=marks.s1-marks.s0;
  for(var j=0;j<M;j++){var u=storyUnits[j];if(u._w===undefined)u._w=u.classList.contains("sw");
    var a=u._w?j:j-4,b=u._w?j+STW:j+8,a0=Math.round(marks.s0+span*Math.max(0,a)/T)+"px",a1=Math.round(marks.s0+span*Math.min(T,b)/T)+"px";
    if(u._a0!==a0){u._a0=a0;u.style.setProperty("--a0",a0)}if(u._a1!==a1){u._a1=a1;u.style.setProperty("--a1",a1)}}}

/* ---------- focus on a risen card: the card comes forward, the page goes soft behind it,
   and its features float out beside it as glass chips ---------- */
var FEAT={
 "washio":[["Garment care first","grid"],["Fill a bag","layers"],["Pick a slot","timer"],["Track every stage","pin"]],
 "parchi":[["Speak the order","mic"],["Receipt from speech","grid"],["Hindi or English","chat"],["Print or share","camera"]],
 "hourbit":[["Grid widget","grid"],["Session running","timer"],["Depth scale","layers"],["Tap states","hand"]],
 "track-it":[["Widget logging","grid"],["Voice capture","mic"],["Receipt scan","scan"],["Monthly analysis","chart"]],
 "alter":[["Voice thought dump","mic"],["Screenshot to task","scan"],["Chat that remembers","chat"],["Task widget","grid"]],
 "focus":[["Grid widget","grid"],["Session running","timer"],["Depth scale","layers"],["Tap states","hand"]],
 "laundry":[["Pickup proof","camera"],["Item count","hash"],["Handler named","user"],["Live tracking","pin"]]};
var FI={
 grid:'<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
 mic:'<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
 scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
 chart:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
 spark:'<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
 chat:'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
 mark:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
 smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
 timer:'<path d="M10 2h4"/><path d="m12 14 3-3"/><circle cx="12" cy="14" r="8"/>',
 layers:'<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
 hand:'<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
 camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
 hash:'<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3l-2 18"/>',
 user:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
 pin:'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'};
var veil=document.createElement("div");veil.className="focus-veil";veil.setAttribute("aria-hidden","true");
veil.innerHTML='<div class="book"></div>';if(rail&&rail.parentNode){rail.parentNode.insertBefore(veil,rail)}else{document.body.appendChild(veil)}
var book=veil.firstChild;
/* The "book" is real writing, not filler: it opens on the hovered project's own write-up —
   the gist and every case-study beat — and runs on into the other projects, like a page
   of the same book. Set as two justified columns. */
function bookFor(p){
  var order=[p].concat(P.filter(function(q){return q!==p})),out=[];
  order.forEach(function(q){out=out.concat([q.g],q.st.map(function(x){return x[1]}))});
  out=out.concat(out);
  return out.map(function(t){return "<p>"+t.replace(/<[^>]+>/g,"")+"</p>"}).join("")}
var feats=document.createElement("div");feats.className="feats";feats.setAttribute("aria-hidden","true");deck.appendChild(feats);
var canHover=window.matchMedia&&window.matchMedia("(hover:hover) and (pointer:fine)").matches;
var calm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
var hotI=-1,lastHot=-1,hv=[0,0,0,0],vf=0,settled=false,featTimer=0,leaveT=0;
/* A loose pen loop around a w×h box: an ellipse that wobbles, starts anywhere and overshoots
   its own start, the way a hand circles something. Returns an SVG path in the box's frame. */
function loopPath(w,h){
  var cx=w/2,cy=h/2,rx=w/2+13,ry=h/2+11,a0=Math.random()*Math.PI*2,turn=1.1+Math.random()*.12,n=22,pts=[];
  for(var k=0;k<=n;k++){var t=a0+turn*Math.PI*2*k/n,wob=1+(Math.random()-.5)*.07+(k/n)*.05;
    pts.push([cx+Math.cos(t)*rx*wob,cy+Math.sin(t)*ry*wob])}
  var d="M"+pts[0][0].toFixed(1)+" "+pts[0][1].toFixed(1);
  for(var j=1;j<pts.length-1;j++){var m=[(pts[j][0]+pts[j+1][0])/2,(pts[j][1]+pts[j+1][1])/2];
    d+="Q"+pts[j][0].toFixed(1)+" "+pts[j][1].toFixed(1)+" "+m[0].toFixed(1)+" "+m[1].toFixed(1)}
  return d}
/* A hand-drawn arrow from a to b: a bowed shaft and a one-stroke head, like the site's arrow. */
function scrawlArrow(ax,ay,bx,by,bend){
  var mx=(ax+bx)/2,my=(ay+by)/2,dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1,
      cx=mx-dy/len*bend,cy=my+dx/len*bend,
      ang=Math.atan2(by-cy,bx-cx),hl=11,
      h1=[bx-Math.cos(ang-.5)*hl,by-Math.sin(ang-.5)*hl],h2=[bx-Math.cos(ang+.55)*hl*.85,by-Math.sin(ang+.55)*hl*.85];
  return "M"+ax.toFixed(1)+" "+ay.toFixed(1)+"Q"+cx.toFixed(1)+" "+cy.toFixed(1)+" "+bx.toFixed(1)+" "+by.toFixed(1)+
         "M"+h1[0].toFixed(1)+" "+h1[1].toFixed(1)+"L"+bx.toFixed(1)+" "+by.toFixed(1)+"L"+h2[0].toFixed(1)+" "+h2[1].toFixed(1)}
/* where the chips may land around a card: spots all round it, four picked at random per hover */
var SPOTS=[[-.18,-.08],[1.2,-.02],[1.34,.42],[1.18,.9],[-.34,.4],[-.2,.92],[.62,1.12],[.3,-.16],[-.3,.12],[1.3,.2]];
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
var inkLayer=document.createElementNS("http://www.w3.org/2000/svg","svg");
inkLayer.setAttribute("class","ink-layer");inkLayer.setAttribute("aria-hidden","true");

function setHot(i){
  if(i===hotI)return;
  hotI=i;queueFrame();
  /* a faded card behind the focused one doesn't need its video decoding and repainting */
  for(var q=0;q<cards.length;q++){var vs=cards[q].querySelectorAll("video");for(var z=0;z<vs.length;z++){var v=vs[z];
    if(i>=0&&q!==i){if(!v.paused){v.pause();v.dataset.hp="1"}}else if(v.dataset.hp){delete v.dataset.hp;var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}}}
  clearTimeout(featTimer);
  if(i<0){feats.classList.remove("in");featTimer=setTimeout(function(){if(hotI<0)feats.innerHTML=""},320);return}
  lastHot=i;
  book.innerHTML=bookFor(P[i]);
  feats.className="feats";
  /* only spots on sides of the card that have room for a chip */
  var cr=cards[i].getBoundingClientRect(),vw=window.innerWidth,room=230;
  var spots=shuffle(SPOTS.filter(function(sp){
    if(sp[0]>1&&cr.right+room>vw)return false;
    if(sp[0]<0&&cr.left-room<0)return false;
    return true}));
  feats.innerHTML=(FEAT[P[i].id]||[]).map(function(f,k){
    var sp=spots[k],rot=(Math.random()*12-6).toFixed(1);
    return '<span class="chip" data-sx="'+sp[0]+'" data-sy="'+sp[1]+'" data-jx="'+(Math.random()*24-12).toFixed(0)+'" data-jy="'+(Math.random()*20-10).toFixed(0)+'"'+
      ' style="--rot:'+rot+'deg;--d:'+(90+k*120)+'ms;--hl:'+P[i].s+'">'+
      '<svg class="mark" aria-hidden="true"><path pathLength="1"/></svg><span class="t">'+f[0]+'</span>'+
      '<svg class="loop" aria-hidden="true"><path pathLength="1"/></svg></span>'}).join("");
  /* size the marker swash and the pen loop to each word once it has a width */
  Array.prototype.forEach.call(feats.querySelectorAll(".chip"),function(c){
    var w=c.offsetWidth,h=c.offsetHeight,lp=c.querySelector(".loop"),mk=c.querySelector(".mark");c.dataset.w=w;c.dataset.h=h;
    lp.setAttribute("viewBox",(-20)+" "+(-18)+" "+(w+40)+" "+(h+36));
    lp.style.left="-20px";lp.style.top="-18px";lp.style.width=(w+40)+"px";lp.style.height=(h+36)+"px";
    lp.firstChild.setAttribute("d",loopPath(w,h));
    mk.setAttribute("viewBox","0 0 "+w+" "+h);mk.style.width=w+"px";mk.style.height=h+"px";
    var y0=h*.6+(Math.random()*4-2),y1=h*.62+(Math.random()*4-2);
    mk.firstChild.setAttribute("d","M6 "+y0.toFixed(1)+"Q"+(w/2).toFixed(1)+" "+(h*.5).toFixed(1)+" "+(w-6).toFixed(1)+" "+y1.toFixed(1));
    mk.firstChild.setAttribute("stroke-width",(h*.5).toFixed(1))});
  requestAnimationFrame(function(){requestAnimationFrame(function(){if(hotI===i)feats.classList.add("in")})});
}
cards.forEach(function(c,i){
  c.addEventListener("mouseenter",function(){clearTimeout(leaveT)});
  c.addEventListener("mousemove",function(e){if(canHover&&settled&&!narrow&&!SCROLLING&&(e.movementX||e.movementY)&&hotI!==i){clearTimeout(leaveT);setHot(i)}});
  /* crossing the gap between two cards shouldn't drop the focus for a frame */
  c.addEventListener("mouseleave",function(){if(hotI!==i)return;clearTimeout(leaveT);leaveT=setTimeout(function(){if(hotI===i)setHot(-1)},140)});
});
/* r is read at the top of render() with the other rects, never after the card writes */
function placeFeats(r){
  if(lastHot<0||!feats.firstChild||!r)return;
  var chips=feats.querySelectorAll(".chip"),arrows=inkLayer.childNodes;
  veil.style.setProperty("--cx",(r.left+r.width/2).toFixed(0)+"px");
  veil.style.setProperty("--cy",(r.top+r.height*.35).toFixed(0)+"px");
  var vw=window.innerWidth,vh=window.innerHeight;
  for(var k=0;k<chips.length;k++){
    var c=chips[k],w=+c.dataset.w||c.offsetWidth,h=+c.dataset.h||c.offsetHeight;
    var cx=r.left+r.width*(+c.dataset.sx)+(+c.dataset.jx),cy=r.top+r.height*(+c.dataset.sy)+(+c.dataset.jy);
    /* never sit on the card: push each chip clear of it on the side its spot is on */
    var sx=+c.dataset.sx,sy=+c.dataset.sy,gap=36;
    if(sx<0)cx=Math.min(cx,r.left-gap-w/2); else if(sx>1)cx=Math.max(cx,r.right+gap+w/2);
    else if(sy<0)cy=Math.min(cy,r.top-gap-h/2); else if(sy>1)cy=Math.max(cy,r.bottom+gap+h/2);
    cx=Math.max(w/2+26,Math.min(vw-w/2-26,cx)); cy=Math.max(h/2+84,Math.min(vh-h/2-26,cy));
    c.style.left=(cx-w/2).toFixed(1)+"px"; c.style.top=(cy-h/2).toFixed(1)+"px";
    /* the arrow leaves the chip's loop on the card side and lands just inside the card's edge */
    var tx=Math.max(r.left+18,Math.min(r.right-18,cx)),ty=Math.max(r.top+18,Math.min(r.bottom-18,cy));
    var dx=tx-cx,dy=ty-cy,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
    var ex=w/2+16,ey=h/2+13,t=1/Math.sqrt((ux*ux)/(ex*ex)+(uy*uy)/(ey*ey));
    var ax=cx+ux*(t+5),ay=cy+uy*(t+5),bx=tx-ux*6,by=ty-uy*6;
    if(arrows[k]){
      if(Math.hypot(bx-ax,by-ay)<16)arrows[k].setAttribute("d","");
      else arrows[k].setAttribute("d",scrawlArrow(ax,ay,bx,by,+arrows[k].dataset.bend))}
  }
}

function render(){
  if(!onHome)return;
  spy();
  var p1=ease(clamp((smooth-marks.f0)/(marks.f1-marks.f0)));
  /* nav slot opens while docked, closes as they leave. It goes FIRST, before any rect is read: the nav bar is centred, so
     changing the slot's width moves the slot itself, and the cards are placed from the slot's rect. Written after the read
     (as it used to be) every card was placed against last frame's nav, and a scroll that stopped mid-fall stayed off by up
     to 3.5px until the 500ms idle tick corrected it. The layout this forces is the one the browser would run anyway.
     Only write what changed: every style write here costs a style pass, and some (the nav slot) a layout */
  var nz=p1>.3?"68":"80",nw=((1-p1)*(NW*4+NGAP*3-NOV+3)).toFixed(1)+"px"+(p1<1?"4px":"0px")+nz;
  if(nw!==lastNav){lastNav=nw;deck.style.zIndex=nz;navSlot.style.width=((1-p1)*(NW*4+NGAP*3-NOV+3)).toFixed(1)+"px";navSlot.style.marginLeft=p1<1?"4px":"0px"}
  /* read every rect this frame needs ONCE, before any write below: a getBoundingClientRect()
     after a style write forces the browser to redo layout mid-frame */
  var sy=target,
      deckR=deck.getBoundingClientRect(),
      navR=loc(navSlot.getBoundingClientRect(),deckR),
      /* the stool is measured against its own stage, not the screen: that offset never changes, however the page
         is scrolled, so the seat the cards sit on is a constant, not something read a frame late */
      stoolR=stoolEl&&stageEl?stoolSeat(deckR):null,
      slotR=loc(caseSlot.getBoundingClientRect(),deckR),
      p2=(marks.lin?clamp:BZ)(clamp((smooth-marks.l0)/(marks.l1-marks.l0))),
      hotR=(lastHot>=0&&feats.firstChild)?cards[lastHot].getBoundingClientRect():null,
      U=deckUnpin();
  /* phones (and any browser with scroll-driven animations): the browser itself moves the cards from the seat to the
     row in step with the scroll. Both ends are constants in deck space, so this needs no script per frame */
  /* it takes over once the cards have landed (script owns the fall from the nav) and holds the seat until its range
     starts, so a stale script transform can never show while scrolling back up through the start of the rise */
  var scrub=SDA&&!window.__noSDA&&smooth>=marks.f1;deck.classList.toggle("scrub",scrub);
  var sda=SDA&&!window.__noSDA;
  if(sda){var rng=Math.round(marks.l0)+"px "+Math.round(marks.l1)+"px";if(rng!==lastRng){lastRng=rng;deck.style.setProperty("--rr0",Math.round(marks.l0)+"px");deck.style.setProperty("--rr1",Math.round(marks.l1)+"px")}}
  var peel=clamp(p2*1.7),ps=peel.toFixed(3);if(ps!==lastPeel){lastPeel=ps;deck.style.setProperty("--peel",ps)}
  var pd=peel>.97;if(pd!==lastPd){lastPd=pd;deck.classList.toggle("peeled",pd);
    /* nothing inside a card animates while it flies: its pulse and video only start once it has landed */
    Array.prototype.forEach.call(deck.querySelectorAll("video"),function(v){if(pd&&v.dataset.vis&&!v.dataset.hp){var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}else if(!pd)v.pause()})}
  /* hover opens as soon as the cards have left the table and are heading into the row,
     not only when they are pixel-perfect: people stop scrolling wherever they like */
  settled=p2>=.55;
  if(!settled&&hotI>=0)setHot(-1);
  /* the veil and the fade follow the strongest focus of any card, so sliding from one card to
     the next hands the focus over instead of dropping the dim to zero and fading it back in */
  for(var i=0;i<cards.length;i++){hv[i]+=((i===hotI?1:0)-hv[i])*.16;if(hv[i]<.001)hv[i]=0;if(hv[i]>.999)hv[i]=1}
  /* the dim has its own focus value: it only cares whether ANY card is focused, so a hand-over
     between two cards keeps it fully up while the cards themselves cross-fade */
  vf+=((hotI>=0?1:0)-vf)*.16;if(vf<.001)vf=0;if(vf>.999)vf=1;var hvHot=vf;
  var vo=hvHot.toFixed(3);if(vo!==lastVo){lastVo=vo;veil.style.opacity=vo;veil.style.visibility=hvHot>.01?"visible":"hidden"}
  for(var i=0;i<cards.length;i++){
    var A=docked(i,navR),B=fallen(i,stoolR),C=laid(i,slotR);
    var m={x:lerp(A.x,B.x,p1),y:lerp(A.y,B.y,p1),s:lerp(A.s,B.s,p1),r:lerp(A.r,B.r,p1),
           rx:lerp(A.rx||0,B.rx||0,p1),ry:0};
    if(p2>0)m={x:lerp(m.x,C.x,p2),y:lerp(m.y,C.y,p2),s:lerp(m.s,C.s,p2),r:lerp(m.r,C.r,p2),
               rx:lerp(m.rx,C.rx||0,p2),ry:lerp(0,C.ry||0,p2)};
    /* the focused card comes forward, straight on */
    if(!narrow&&p2>0){m.s*=1+.08*hv[i]; m.y-=12*hv[i]}
    /* while a card is focused the script owns its transform (it carries the lift and scale); the rest of the time the
       browser's scroll animation does. Both agree on the row, so handing over at rest is invisible */
    var own=hv[i]>0||i===hotI;if(lastOwn[i]!==own){lastOwn[i]=own;cards[i].classList.toggle("own",own)}
    var zi=String(i===hotI&&hv[i]>.01?20:hv[i]>.01?19:(i+1));if(lastZ[i]!==zi){lastZ[i]=zi;cards[i].style.zIndex=zi}
    /* everything else leaves the stage, so the card sits alone on the page of text */
    var op;if(vf>0){var base=(1-vf*(1-(i===hotI?1:hv[i])));if(i!==hotI)base=Math.max(0.32,base);op=base.toFixed(3)}else op=(innerWidth<=600&&p1<.2&&p2<=0?(p1/.2).toFixed(3):"");if(lastOp[i]!==op){lastOp[i]=op;cards[i].style.opacity=op}
    if(sda){
      /* the two ends of the flight, both constants in deck space: the seat (as the fall left it) and the row as it
         will sit once the deck has let go of the screen (page position of the slot minus where the deck unpins) */
      var t0=tfOf({x:B.x,y:B.y,s:B.s,r:B.r,rx:B.rx||0,ry:0}),
          t1=tfOf(laid(i,{left:slotR.left,top:slotR.top+deckR.top+sy-U,width:slotR.width,height:slotR.height}));
      if(t0!==lastT0[i]){lastT0[i]=t0;cards[i].style.setProperty("--t0",t0)}
      if(t1!==lastT1[i]){lastT1[i]=t1;cards[i].style.setProperty("--t1",t1)}}
    apply(i,m,hv[i])}
  placeFeats(hotR);
  var sp=clamp((smooth-marks.s0)/(marks.s1-marks.s0));
  /* the pictures in the paragraph need .on (their hover) once the reading edge has reached them; the words' colour is
     either the CSS scroll animation (.wscrub) or, in browsers without one, set here for the words that changed */
  var phR=innerWidth<=760||calm,rk=phR?1:sp;
  if(Math.abs(rk-litCount)>.0004||(rk>=1)!==(litCount>=1)||(rk<=0)!==(litCount<=0)){litCount=rk;
    var M=storyUnits.length,edge=rk*(M+STW+8),css=storyTxt.classList.contains("wscrub");
    for(var j=0;j<M;j++){var u=storyUnits[j];if(u._w===undefined)u._w=u.classList.contains("sw");
      if(u._w){if(css)continue;
        var q=phR?24:Math.round(24*clamp((edge-j)/STW));
        if(q!==u._q){u._q=q;u.style.color=q>=24?"":"rgba(19,19,22,"+(.17+.83*q/24).toFixed(3)+")"}}
      else{var on=phR||edge>j+2;
        if(u._on!==on){u._on=on;u.classList.toggle("on",on);if(!css)u.classList.toggle("uoff",!on&&!phR)}}}}
  var ho=(1-clamp(smooth/240)).toFixed(2);if(ho!==lastHint){lastHint=ho;hint.style.opacity=ho}
  var show=p2>.9;
  if(show!==lastBar){lastBar=show;moreBar.style.opacity=show?"1":"0";moreBar.style.transform="translateY("+(show?0:26)+"px)"}}
function navDividers(){Array.prototype.forEach.call(document.querySelectorAll(".nav a[data-r]"),function(a){var next=a.nextElementSibling;a.classList.toggle("before-selected",!!next&&next.matches("a[data-r].here"))})}
var activeNavKey="/",activeNavContext="page";
function selectNav(key,context){activeNavKey=key;activeNavContext=context||"page";
  Array.prototype.forEach.call(document.querySelectorAll(".nav a[data-r],.navmenu a[data-r]"),function(a){
    var selected=a.getAttribute("data-r")===key;a.classList.toggle("here",selected);
    if(selected)a.setAttribute("aria-current",activeNavContext);else a.removeAttribute("aria-current")});navDividers()}
/* Home keeps its section highlight; tabs still navigate to their full pages. No Gallery/Lab section is invented. */
var SPY=[["hero","/"],["drop","/work"],["cases","/work"],["offerHome","/offer"],["proofHome","/about"]],spyKey="",spyTops=null,spyH=-1,spyW=-1;
function spy(){
  if(!spyTops||spyH!==DOCH||spyW!==innerWidth){spyH=DOCH;spyW=innerWidth;
    spyTops=SPY.map(function(c){var el=document.getElementById(c[0]);return el&&el.offsetHeight?el.getBoundingClientRect().top+SY:Infinity})}
  var mid=SY+VH*.45,key="/";
  for(var k=0;k<SPY.length;k++)if(spyTops[k]<=mid)key=SPY[k][1];
  if(key===spyKey)return;spyKey=key;selectNav(key,"location")}
var frameRaf=0,frameTimer=0;
queueFrame=function(){clearTimeout(frameTimer);frameTimer=0;if(!frameRaf)frameRaf=requestAnimationFrame(frame)};
function frame(){
  frameRaf=0;
  /* Read scroll only after a scroll/resize/route event. Reading it while idle forced layout for unrelated SVG animations. */
  if(scrollDirty||dirtyR){target=SY=window.pageYOffset||0;scrollDirty=false}
  /* progress follows the real scroll everywhere. The old .14 glide during the fall lagged behind a quick
     scroll and then snapped to catch up where the stage unpins: the card landed, jumped, and landed again.
     The browser's own smooth wheel scrolling already eases it. */
  smooth=target;
  /* at rest there is nothing to do: same scroll, focus settled, no resize. Skipping those frames keeps the
     main thread free, so the first frame of the next scroll starts on time. A slow tick (every 500ms)
     still catches late layout shifts (fonts, images) */
  var now=performance.now(),still=target===lastT&&now-lastR<500&&!dirtyR;
  if(still)for(var q=0;q<hv.length;q++){if(hv[q]!==(q===hotI?1:0)){still=false;break}}
  if(still&&vf!==(hotI>=0?1:0))still=false;
  if(!still){lastT=target;lastR=now;dirtyR=false;render()}
  /* Hover easing needs consecutive frames. Otherwise only home keeps a slow late-layout check; other pages rest. */
  if(onHome){var moving=vf!==(hotI>=0?1:0);
    for(var q=0;q<hv.length&&!moving;q++)moving=hv[q]!==(q===hotI?1:0);
    if(moving)queueFrame();else frameTimer=setTimeout(queueFrame,500)}}
var lastT=-1,lastR=0,dirtyR=true;
window.addEventListener("resize",function(){if(matchMedia("(pointer:coarse)").matches&&window.innerWidth===rzW)return;dirtyR=true;queueFrame()});window.addEventListener("hashchange",function(){dirtyR=scrollDirty=true;queueFrame()});

/* the divider is drawn by hand: a pencil comes in, lays down a line, goes back over part of it,
   adds a flick, and leaves. The strokes stay until the page is reloaded. */
(function(){var d=document.getElementById("divider");if(!d)return;
  var paths=[].slice.call(d.querySelectorAll(".dv")),pen=d.querySelector(".dv-pen"),
      calm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  paths.forEach(function(p){var L=p.getTotalLength();p._L=L;p.style.strokeDasharray=L;p.style.strokeDashoffset=L;p.style.visibility="visible"});
  function done(){paths.forEach(function(p){p.style.strokeDashoffset=0})}
  function ease(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
  function at(x,y){pen.setAttribute("transform","translate("+x.toFixed(1)+" "+y.toFixed(1)+")")}
  function tween(dur,fn,next){var t0=0;function f(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/dur);fn(k);if(k<1)requestAnimationFrame(f);else next&&next()}requestAnimationFrame(f)}
  function run(){
    var i=0,pos={x:-60,y:-10};at(pos.x,pos.y);pen.style.transition="opacity .25s";pen.setAttribute("opacity","1");
    (function nextStroke(){
      if(i>=paths.length){var sx=pos.x,sy=pos.y;
        tween(520,function(k){var e=ease(k);at(sx+(1180-sx)*e,sy-50*e);pen.setAttribute("opacity",(1-k).toFixed(2))});return}
      var p=paths[i++],L=p._L,a=p.getPointAtLength(0),sx=pos.x,sy=pos.y;
      /* lift, travel to the start of the next stroke, put the tip down */
      tween(260,function(k){var e=ease(k);at(sx+(a.x-sx)*e,sy+(a.y-sy)*e-14*Math.sin(Math.PI*k))},function(){
        tween(+p.dataset.dur,function(k){var e=ease(k),q=p.getPointAtLength(L*e);p.style.strokeDashoffset=(L*(1-e)).toFixed(2);at(q.x,q.y);pos={x:q.x,y:q.y}},nextStroke)})
    })()}
  if(calm||!("IntersectionObserver" in window)){done();return}
  new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){o.disconnect();run()}})},{threshold:.7}).observe(d)})();

/* Only the greeting and name/frame respond to pointer depth. */
(function(){
  var hero=document.getElementById('hero'),name=hero&&hero.querySelector('.myname'),inverse=document.getElementById('negName');
  if(!name||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var hi=hero.querySelector('.hi'),nameFrame=hero.querySelector('.framed');
  var targetX=0,targetY=0,x=0,y=0,raf=0,last=0,rect=null;
  window.addEventListener('scroll',function(){rect=null},{passive:true});
  window.addEventListener('resize',function(){rect=null});
  function place(el,dx,dy){if(!el)return;el.style.setProperty('--react-x',dx.toFixed(2)+'px');el.style.setProperty('--react-y',dy.toFixed(2)+'px')}
  function frame(now){raf=0;var dt=last?Math.min(64,now-last):16;last=now;
    var ease=1-Math.exp(-dt/85);x+=(targetX-x)*ease;y+=(targetY-y)*ease;
    if(Math.abs(targetX-x)<.02)x=targetX;if(Math.abs(targetY-y)<.02)y=targetY;
    name.style.setProperty('--face-x',(x*5).toFixed(2)+'px');
    name.style.setProperty('--face-y',(y*3).toFixed(2)+'px');
    if(inverse)inverse.style.transform='translate3d('+(x*5).toFixed(2)+'px,'+(y*3).toFixed(2)+'px,0)';
    place(hi,-x*6,-y*4);place(nameFrame,x*3,y*2);
    if(x!==targetX||y!==targetY)raf=requestAnimationFrame(frame);else last=0
  }
  function kick(){if(!raf)raf=requestAnimationFrame(frame)}
  hero.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;
    var r=rect||(rect=name.getBoundingClientRect());targetX=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width/2)/(r.width*.48)));
    targetY=Math.max(-1,Math.min(1,(e.clientY-r.top-r.height/2)/(r.height*.9)));kick()},{passive:true});
  hero.addEventListener('pointerleave',function(){rect=null;targetX=targetY=0;kick()});
})();

/* ---------- the cursor game on the name ---------- */
var framed=document.getElementById("framed");
setTimeout(function(){framed.classList.add("lit")},650);

var heroIn=document.getElementById("heroIn"),negName=document.getElementById("negName"),BS=88;

/* mirror every hero element into the negative layer, pixel for pixel */
/* Positions come from LAYOUT (offsetLeft/offsetTop up to heroIn), not getBoundingClientRect.
   A bounding rect includes transforms, so measuring while the hero's entrance "rise" animation
   is still running (it is, whenever the page loads in the background) put the whole negative
   copy 16px low: shifted letters, and the copied frame showing as a blue line inside the square.
   Layout boxes ignore transforms, so the copy lands exactly on the settled originals. */
function rising(el){
  if(!document.getAnimations)return true;
  return document.getAnimations().some(function(a){var t=a.effect&&a.effect.target;
    return a.playState!=="finished"&&t&&t.nodeType===1&&t.contains(el)})}
function lbox(el,layoutOnly){
  /* settled and untransformed: the bounding rect is exact to the sub-pixel */
  if(!layoutOnly&&!rising(el)){var r=el.getBoundingClientRect(),h=heroIn.getBoundingClientRect();
    return{left:r.left-h.left,top:r.top-h.top,width:r.width,height:r.height}}
  /* mid-animation, or rotated on purpose (the pill): use the layout box */
  var x=0,y=0,e=el;
  while(e&&e!==heroIn){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}
  if(e!==heroIn){var q=el.getBoundingClientRect(),g=heroIn.getBoundingClientRect();
    return{left:q.left-g.left,top:q.top-g.top,width:q.width,height:q.height}}
  return{left:x,top:y,width:el.offsetWidth,height:el.offsetHeight}}
function placeNeg(){
  if(!framed||!heroIn||!negName)return;
  function put(el,src,extra){
    if(!el||!src)return;
    var r=lbox(src,extra==="layout"),cs=getComputedStyle(src);
    el.style.left=r.left+"px";
    el.style.top=r.top+"px";
    if(extra==="size"){el.style.width=r.width+"px";el.style.height=r.height+"px"}
    if(extra==="font"){el.style.fontSize=cs.fontSize}
    if(extra==="both"){el.style.width=r.width+"px";el.style.fontSize=cs.fontSize}
  }
  var nameEl=framed.querySelector(".myname"), fr=lbox(framed), hr={left:0,top:0};
  put(negName,nameEl,"font");
  put(document.getElementById("nHi"),document.querySelector("#hero .hi"),"font");
  put(document.getElementById("nPill"),document.querySelector(".avail"),"layout");
  var claimEl=document.querySelector("#hero .claim"),nc=document.getElementById("nClaim");
  if(claimEl&&nc&&!claimEl.classList.contains("hero-manifesto")){
    put(nc,claimEl,"both");
    nc.style.lineHeight=getComputedStyle(claimEl).lineHeight;
    nc.innerHTML=claimEl.innerHTML;
  }
  var nfr=document.getElementById("nFr");
  nfr.style.left=(fr.left-hr.left)+"px"; nfr.style.top=(fr.top-hr.top)+"px";
  nfr.style.width=fr.width+"px"; nfr.style.height=fr.height+"px";
  [["nHd1",-5,-5],["nHd2",fr.width-6,-5],["nHd3",-5,fr.height-6],["nHd4",fr.width-6,fr.height-6]]
    .forEach(function(h){
      var e=document.getElementById(h[0]);
      e.style.left=(fr.left-hr.left+h[1])+"px"; e.style.top=(fr.top-hr.top+h[2])+"px";
    });
}
window.addEventListener("resize",placeNeg);
window.addEventListener("load",placeNeg);
setTimeout(placeNeg,300); setTimeout(placeNeg,1200);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(placeNeg);
heroIn.addEventListener("animationend",placeNeg);
if(window.ResizeObserver)new ResizeObserver(placeNeg).observe(heroIn);

var selbox=document.createElement("span");
selbox.className="selbox";
selbox.innerHTML='<i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i>';
document.body.appendChild(selbox);

var youCur=document.createElement("div");
youCur.className="youcur";
youCur.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+
  '<path d="M3 2l7 18 2.5-7.5L20 10z" fill="#131316" stroke="#FAFAF8" stroke-width="1.4" stroke-linejoin="round"/></svg>'+
  '<b>YOU</b>';
document.body.appendChild(youCur);

var cx=0,cy=0,tx=0,ty=0,curOn=false;
/* the arrow sits exactly on the pointer (no easing: your own pointer should never lag). Only the "YOU" tag trails,
   eased in time (not per frame), so it feels the same on 60Hz and 120Hz screens, Mac or Windows. The loop runs only
   while the tag is catching up; at rest it stops and costs nothing. */
var curRaf=0,curT=0,youTag=youCur.querySelector("b"),TAG_MS=55;
function moveCur(now){curRaf=0;
  var dt=curT?Math.min(64,now-curT):16;curT=now;
  var k=1-Math.exp(-dt/TAG_MS);
  cx+=(tx-cx)*k; cy+=(ty-cy)*k;
  if(Math.abs(tx-cx)<.1&&Math.abs(ty-cy)<.1){cx=tx;cy=ty}
  if(youTag)youTag.style.transform="translate3d("+(cx-tx).toFixed(1)+"px,"+(cy-ty).toFixed(1)+"px,0)";
  if(cx!==tx||cy!==ty)curRaf=requestAnimationFrame(moveCur);else curT=0;
}
function kickCur(){youCur.style.transform="translate3d("+tx+"px,"+ty+"px,0)";if(!curRaf)curRaf=requestAnimationFrame(moveCur)}

var heroEl=document.getElementById("hero"),boxOn=false;
function setBox(px){
  selbox.style.setProperty("--sb",px+"px");
  heroIn.style.setProperty("--bs",px+"px");
}
window.addEventListener("pointermove",function(e){
  tx=e.clientX; ty=e.clientY;kickCur();
  var hr=heroEl.getBoundingClientRect();
  var inHero = onHome && e.clientY>hr.top && e.clientY<hr.bottom;
  /* the YOU cursor follows you across the whole site now, not just the hero */
  if(!curOn){curOn=true;cx=tx;cy=ty;youCur.classList.add("on")}
  youCur.classList.toggle("link",!!(e.target.closest&&e.target.closest("a,button,[role=button],.srow,.card,.doo,input,label")));

  /* the negative square exists only while the cursor is inside the blue bounding box */
  var fr=framed.getBoundingClientRect();
  var near = inHero &&
    e.clientX>=fr.left && e.clientX<=fr.right &&
    e.clientY>=fr.top  && e.clientY<=fr.bottom;
  if(near!==boxOn){
    boxOn=near;
    if(near)placeNeg();
    selbox.classList.toggle("on",near);
    heroIn.classList.toggle("live",near);
    setBox(near?BS:0);
  }
  if(!near) return;
  var ir=heroIn.getBoundingClientRect();
  heroIn.style.setProperty("--mx",(e.clientX-ir.left).toFixed(0)+"px");
  heroIn.style.setProperty("--my",(e.clientY-ir.top).toFixed(0)+"px");
  selbox.style.transform="translate3d("+e.clientX+"px,"+e.clientY+"px,0)";
},{passive:true});
window.addEventListener("pointerdown",function(){youCur.classList.add("down")});
window.addEventListener("pointerup",function(){youCur.classList.remove("down")});
document.addEventListener("mouseleave",function(){curOn=false;youCur.classList.remove("on")});
window.addEventListener("pointerleave",function(){
  curOn=false;boxOn=false;
  youCur.classList.remove("on");selbox.classList.remove("on");
  heroIn.classList.remove("live");setBox(0);
});

/* ---------- canvas ---------- */
var stage=document.getElementById("stage"),surface=document.getElementById("surface"),
    zm=document.getElementById("zm"),view={x:0,y:0,k:1},built=false;
function build(){
  if(built)return;built=true;
  SECTIONS.forEach(function(s){
    var f=document.createElement("div");f.className="frame";
    f.style.cssText="left:"+s.x+"px;top:"+s.y+"px;width:"+s.w+"px;height:"+s.h+"px";
    f.innerHTML='<span class="frame-label"><i style="background:'+s.cv+'"></i>'+s.t+' · '+s.items.length+' items</span>'+
     '<div class="frame-body">'+s.items.map(function(it){return '<div class="thumb" style="--tint:'+s.tint+'">'+it.replace(/\n/g,"<br>")+'</div>'}).join("")+'</div>'+
     '<div class="cover" style="--cv:'+s.cv+'" role="button" tabindex="0" aria-label="Tear open '+s.t+'">'+
     '<span class="half L"></span><span class="half R"></span>'+
     '<span class="peel">tear to open<svg class="ic" viewBox="0 0 24 24" style="width:12px;height:12px"><path d="M12 3v18M3 12h18"/></svg></span>'+
     '<span class="cover-face"><h4>'+s.t+'</h4><p>'+s.d+'</p></span></div>';
    surface.appendChild(f);
    var cv=f.querySelector(".cover");
    function tear(){cv.classList.add("torn")}
    cv.addEventListener("click",tear);
    cv.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();tear()}})})}
/* zoomable canvases: will-change:transform only while moving. Left on permanently, Chrome rasters the
   layer once at the zoom it had then and only stretches that bitmap, so images and type go soft when you
   zoom in. Dropping it 200ms after the last move lets Chrome re-raster sharp at the final zoom */
function liveZoom(el){if(!el)return;if(el._lz)clearTimeout(el._lz);else el.style.willChange="transform";
  el._lz=setTimeout(function(){el._lz=0;el.style.willChange=""},200)}
window.liveZoom=liveZoom;
function push(){liveZoom(surface);surface.style.transform="translate("+view.x+"px,"+view.y+"px) scale("+view.k+")";zm.textContent=Math.round(view.k*100)+"%"}
function bounds(){var a=1e9,b=1e9,c=-1e9,d=-1e9;
  SECTIONS.forEach(function(s){a=Math.min(a,s.x);b=Math.min(b,s.y-30);c=Math.max(c,s.x+s.w);d=Math.max(d,s.y+s.h)});
  return{minX:a,minY:b,w:c-a,h:d-b}}
function fitAll(){build();var t=bounds(),p=60,W=stage.clientWidth,H=stage.clientHeight,
  k=Math.min((W-p*2)/t.w,(H-p*2-50)/t.h,1);
  view.k=k;view.x=(W-t.w*k)/2-t.minX*k;view.y=(H-50-t.h*k)/2-t.minY*k;push()}
function goTo(i){build();var s=SECTIONS[i],W=stage.clientWidth,H=stage.clientHeight,
  k=Math.min((W-90)/s.w,(H-140)/s.h,1.2);
  view.k=k;view.x=(W-s.w*k)/2-s.x*k;view.y=(H-50-s.h*k)/2-s.y*k;push()}
document.getElementById("fit").addEventListener("click",fitAll);
Array.prototype.forEach.call(document.querySelectorAll("[data-go]"),function(b){
  b.addEventListener("click",function(){goTo(+b.getAttribute("data-go"))})});
var dragging=false,sx=0,sy=0,ox=0,oy=0;
stage.addEventListener("pointerdown",function(e){
  if(e.target.closest(".canvas-bar")||e.target.closest(".cover"))return;
  dragging=true;sx=e.clientX;sy=e.clientY;ox=view.x;oy=view.y;
  stage.classList.add("drag");stage.setPointerCapture(e.pointerId)});
stage.addEventListener("pointermove",function(e){if(!dragging)return;view.x=ox+(e.clientX-sx);view.y=oy+(e.clientY-sy);push()});
function stopDrag(){dragging=false;stage.classList.remove("drag")}
stage.addEventListener("pointerup",stopDrag);stage.addEventListener("pointercancel",stopDrag);
stage.addEventListener("wheel",function(e){e.preventDefault();
  var r=stage.getBoundingClientRect(),cx=e.clientX-r.left,cy=e.clientY-r.top;
  var k2=Math.min(2.4,Math.max(.18,view.k*(e.deltaY>0?.92:1.08))),ra=k2/view.k;
  view.x=cx-(cx-view.x)*ra;view.y=cy-(cy-view.y)*ra;view.k=k2;push()},{passive:false});
/* =================== ROUND 10: rich case studies =================== */
var CS={alter:{
  meta:[["Role","Solo: research, design, build"],["Made with","Designed in Figma, built in Kotlin + Jetpack Compose for Android"],["AI","Latest Gemini model"],["Data","On the phone. Room/SQLite, no cloud"],["Status","Built, installable APK"]],
  quote:"A friend who chats like a poet, plans like a PA, and remembers like a journal.",
  secs:[
   {h:"Too many tools, no memory.",b:["A new model shows up every week, and each tool around it does one job. One takes notes, one transcribes, one chats, one makes images, and one takes your plan and never reminds you to act on it.","So you carry the map in your head: which tool had that idea, which one made that image, where you left that link. And none of them know you. Every conversation starts from zero."]},
   {h:"Four people I designed for.",personas:[
     ["Riya","21 · UI/UX student, Pune","Loses ideas in the noise between Notion, Keep and WhatsApp.","Sometimes I just want to say something out loud, and have it saved beautifully somewhere.","#E7BBFF"],
     ["Arjun","27 · remote developer, Bangalore","Forgets which tool he used for what. To-do apps overwhelm him.","I want a system that gets me even when I don't have the energy to explain.","#A9DEFF"],
     ["Meera","33 · solo creator and coach, Delhi","Switches tools all day and misses her own ideas from weeks ago.","I wish I had a co-creator that feels like a friend and remembers my best thoughts.","#FFD44E"],
     ["Tanishq","17 · student, Jaipur","Drowning in YouTube, Reddit and AI tools. Can't find his own ideas later.","If I could just have an AI that sorts my brain for me, I'd feel like a superhero.","#B4F6B8"]]},
   {h:"It started on paper.",b:["Every screen was sketched before anything else: onboarding, home, upcoming, memory, notes, the Alter AI page, and the chat history sidebar. The nav bar got its own page of thinking. Tap any sketch to see it up close."],
    sketches:[["onboarding","Onboarding"],["home","Home"],["navbar","What the nav bar holds"],["upcoming","Upcoming"],["memory","Memory"],["alterai","Alter AI"],["sidebar","Chat history sidebar"]],
    pipe:[["Paper","Every screen sketched by hand"],["Figma","Component sets, variants and every micro-interaction"],["Google AI Studio","The design goes in, Kotlin and Jetpack Compose come out"],["GitHub","The code is public, the APK is installable"]]},
   {h:"Versions that didn’t ship, but led somewhere.",b:["The first pass lived in Figma. None of these made it as they were, and each one taught the final screen something. Left is the Figma version, right is what the code draws now."],
    iters:[["f_home","x_home","Home","The first home used the ALTER wordmark as its header and a four tab pill. The shipped one tells you where you are, splits cards into two lanes under date headers, and gives Alter AI its own tab."],
      ["f_add","x_addtray","The add tray","Five ways in floated above the nav. The shipped tray dims everything behind it and adds a sixth: Canvas."],
      ["f_on","x_onboarding","Onboarding","An illustrated welcome with a single Explore button. It became a plain choice instead: sign in with Google, or keep everything on the phone."],
      ["f_chat","x_chat","Alter AI","An empty page asking for messy thoughts. Now the chat answers from your own cards and links straight back to them."]]},
   {h:"Built as components first.",b:["Before a single line of code, every piece lived in Figma as a component set: the nav bar in all four states, the add button and its tray, one capture card per input type, the memory and notes widgets. The motion was designed there too.","These three are rebuilt here, live. Play with them."],comps:1},
   {h:"The final screens, in the order you meet them.",b:["Home, the add tray, Notes, a card up close, the canvas board, Alter AI, Upcoming, Memories, and the widget on your home screen. Every one is rebuilt straight from the Kotlin. Tap any screen to see it big."],
    stage:1,screens:[]},
   {h:"One place to put anything.",b:["The whole product rests on one rule: you never decide where something goes. You drop it in, and Alter decides.","Alter is built to use the latest Gemini model, so it gets smarter without a redesign. Right now it runs on Gemini 3.8 Flash."],
    flow:[["Voice","Scan","Screenshot","Text","Image","PDF"],"Alter reads it with Gemini",["Summary","To-dos","Reminders","Memories"]]},
   {h:"How it moves.",steps:[
     ["Dump a thought","Tap the mic, talk, hit Stop & Process. Gemini returns a transcript, a markdown summary and checkboxes for anything that sounds like a task. The card lands on Home instantly."],
     ["Share a screenshot","From any app, share into Alter. A staging banner appears, you can add a line of context, then Synthesize. Gemini Vision reads it and pulls out takeaways and tasks."],
     ["Set a reminder","Write a time into a task and Alter sets the reminder itself, or tap the clock and pick one. It's a real OS alarm, exact to the minute. The clock turns yellow, and the notification opens straight to that task."],
     ["Tick it off","Tap the checkbox: a haptic, then the task breaks apart into particles in about 420 ms and drops into Completed."]]},
   {h:"Pitch black, one warm accent.",b:["Flat, no heavy shadows. Depth comes from surface contrast and half-pixel borders. Yellow only ever means one thing: AI is working, or something is active."],
    sys:{colors:[["#000000","Background"],["#18181B","Cards"],["#27272A","Borders"],["#FFBD00","AI + active"],["#FFFFFF","Text"],["#A1A1AA","Muted"],["#FF3B30","Danger"]],
         specs:[["Grid padding","16 px"],["Card gutters","12 px"],["Card radius","16 to 18 px"],["Body","14 / 20 px"],["Badges","10 to 11 px caps, 1 px tracking"],["AI status","Monospace 11 to 12 px"]],
         type:[["Aa","System sans","The phone's own font. On most Androids it reads close to Satoshi: clean, round, quiet.","sans-serif"],["Aa","System mono","Only for AI status lines, so you can tell the machine is talking.","ui-monospace,monospace"]]}},
   {h:"The calls that mattered.",decisions:[
     ["Local-first, on purpose","Everything lives in a database on the phone. No account, no cloud. Your thoughts, notes and passwords don't have to leave your hand, and it keeps working offline."],
     ["The widget is the front door","Capture by voice or text and tick off tasks straight from the home screen. The fastest way to use Alter is to not open it."],
     ["An add button that changes","Six options on Home, two on Notes. Fewer choices at the moment you're trying to catch a thought."],
     ["One moment of delight","The particle dissolve on a finished task is the reward. It plays in the app and on the widget, and it's the only place the app shows off."]]},
   {h:"What I'd do differently.",b:["It does a lot. Notes, chat, memories, reminders, canvas, widget. The risk with an all-in-one app is that it becomes all-in-one for the person who built it.","Next, I'd put it in front of the four kinds of people I designed for, and watch which parts they never touch. Those are the parts to cut."]}
  ],
  cta:["Want to try it?","It's an Android APK. Ask and I'll send it over.","#apk","Ask for the APK"],
  links:[["Figma file","https://www.figma.com/design/KGUEuAUV1CCkdlvItwgQDd/Portfolio?node-id=0-1","fig"],["Code on GitHub","https://github.com/User01005/alter-ai","gh"],["Full doc on Notion","https://jealous-ghost-a9e.notion.site/Alter-20d7ea0aa244806e96a9f2c7c04aebb7?source=copy_link","no"]]
}};

/* =================== ROUND 14: Track It case study =================== */
CS["track-it"]={
  meta:[["Role","Solo: research, design, build"],["Made with","Designed in Figma, built in Kotlin + Jetpack Compose"],["AI","Gemini, for receipt OCR"],["Data","On the phone. Room/SQLite, no cloud, no login"],["Status","Live, in daily use for 3 to 4 months"]],
  quote:"The friction isn't in tracking spending. It's every step a tracker adds after the money's already spent.",
  secs:[
   {h:"When does anyone actually want to log an expense?",b:["Almost never, mid-transaction. Open the app, tap add, type the amount, pick a category, pick an account, hit save: four or five decisions for something that should take four or five seconds. If I just paid cash, I'm not pulling my phone out. If I paid by UPI, the transaction already happened, and the last thing I want is manual data entry to catch up with it.","Most trackers also misread what people want. They build a detailed ledger: which account, which card, running balances. People already have bank statements for that. What they actually want is simpler: <b>did I stay inside my budget this month or not.</b>"]},
   {h:"Three people I built it around.",b:["Not formal interviews. Direct observation of my own spending and the people around me, used as a reasoning tool for every decision, not as a research deliverable."],
    personas:[
     ["Ankit","26 · hybrid job, Bangalore","Pays cash for chai, autos and the corner shop. Deleted three trackers within a week.","By the time I've unlocked my phone and opened the app, the moment's gone.","#ABD8FF"],
     ["Priya","29 · fully cashless, UPI for everything","Every payment already has a digital trail. Re-entering it feels redundant.","I don't need another place to retype what my bank already knows.","#93E2FF"],
     ["Rohan","24 · wants a signal, not a ledger","Doesn't care which card. Wants one glance to know how much is left this month.","Just tell me if I'm still inside budget. I don't need bookkeeping software.","#CFE6FF"]]},
   {h:"Every screen, down to its bones.",b:["Each screen stripped back to structure: what's on it, where the thumb lands, what the eye should catch first. Tap any one to see it up close."],
    sketches:[["tw_home","Home"],["tw_add","Add a transaction"],["tw_voice","Voice entry"],["tw_scan","Scan a receipt"],["tw_analysis","Analysis"],["tw_settings","Settings"],["tw_widget","The widget"]],
    pipe:[["Wireframes","Every screen as structure first"],["Figma","Screens, component sets, the dock and the sheets"],["Google AI Studio","The design goes in, Kotlin and Jetpack Compose come out"],["GitHub","The code is public"]]},
   {h:"The pieces it's built from.",b:["The dock, the menu, the date picker, the widget and the voice prompt live in Figma as component sets. Under them, three interactions rebuilt live from the Kotlin: the same sizes, the same spring, the same parser. Play with them."],tcomps:1},
   {h:"The final screens, in the order you meet them.",b:["Home, a swipe, the add sheet, voice, the receipt scanner, the calendar, analysis, settings, and the widget on your home screen. Tap any screen to see it big."],board:1},
   {h:"Three ways in, one number out.",b:["Whatever you give it, it ends up in the same two places: today's total and what's left of the month. Voice is parsed on the phone, offline. Receipts go to Gemini."],
    flow:[["Voice","Receipt","Manual","Widget"],"Parsed, categorised, saved",["Logged","Categorised","Budget updated","Widget refreshed"]]},
   {h:"How it moves.",steps:[
     ["Log it","From the dock or straight from the home-screen widget. Say it, scan it, or type it."],
     ["It logs itself","The sentence splits on \"and\", amounts and merchants come out, each one gets a category and is saved. No review screen."],
     ["The widget moves","Spent today and left this month update on the home screen right away. You never opened the app."],
     ["The app keeps score","The ledger, a donut by category, a budget bar. A heads-up at 80% of the budget, and the bar turns red past 100%."]]},
   {h:"Money is the only thing that should draw your eye.",b:["The day's spend is set at 72sp semibold with tightened tracking, far larger than anything else on screen. Labels sit small and muted. There's no middle size in the scale, on purpose: glance at Home for under a second and know exactly one thing, how much you've spent today.","Swipe right to delete, swipe left to edit, no menus. Haptics fire on taps, saves and swipe thresholds instead of a toast or a spinner: you feel it happen rather than wait for it. Dialogs rise as spring-animated bottom sheets."],
    sys:{colors:[["#000000","Background"],["#1C1C1E","Card surfaces"],["#FFFFFF","Text primary"],["#9CA3AF","Text secondary"],["#ABD8FF","Accent"],["#007AFF","Cursor + selection"],["#FF453A","Over budget"],["#1DB954","Success"]],
         specs:[["Day's spend","72sp semibold, -3.6sp tracking"],["Labels","16sp, muted grey"],["Dock","80dp tall, 24dp radius"],["Dock buttons","50 / 56 / 50dp, 14dp radius"],["Press","Scales to 0.88, bouncy spring"],["Swipe","Right deletes, left edits"]],
         type:[["Aa","The day's number","Set once, large, and left alone. Everything else is secondary by design.","system-ui,sans-serif"],["Aa","Everything else","16sp muted labels. No middle size in the scale, on purpose.","system-ui,sans-serif"]]}},
   {h:"What I built, and why.",b:["Every call traces back to one bet: friction is the enemy, not missing features."],decisions:[
     ["Voice logging","Say \"paid 450 on Zomato and 150 for coffee\" and close the app. The clause parser splits the sentence, pulls amounts and merchants, and categorises in the background."],
     ["Receipt OCR","Snap a photo and Gemini reads the amount, description and category. For the moments voice isn't practical and typing still isn't the answer."],
     ["The widget is the front door","Today's spend and what's left, without opening the app. Mic and plus, right there on the home screen."],
     ["Six preset categories","Every extra decision point is friction. Six presets cover daily spending without asking anyone to think."],
     ["No accounts, no bank sync","Not a missing feature, a removed one. People already know which card they used. Track It is a budget reference, not a ledger."],
     ["Subscriptions that repeat themselves","Wasn't in the original scope. Netflix, Spotify, Airtel aren't a new decision every month. Say one once, and it logs itself on the same date every month after."]]},
   {h:"What I cut.",b:["Early versions explored cloud sync: Google Drive storage, login options, cross-device access. All of it got dropped. A login screen is a wall between someone and the thing they came to do. Finance apps like to \"know you\", but the real use case here is someone who wants a fast number, not a relationship with an app. Cutting login removed a whole category of friction, forgotten passwords, sync conflicts, account setup, before it could exist."]},
   {h:"What I'd do differently.",b:["So far the only people using it are me and two or three family members, for three to four months. That's real use, but by people who already know how it works. There's no onboarding yet because nobody using it has ever been a stranger to it.","Next I'd hand it to people outside that circle, watch them open it cold, and build the first run from what they get wrong. And the honest open question: Priya still has to say out loud what her UPI app already knows. Closing that gap without adding back the friction I cut is the next hard problem."]}
  ],
  cta:["Want to see it running?","It's an Android APK, not on the Play Store yet. Ask and I'll send it over.","#apk","Ask for the APK"],
  links:[["Code on GitHub","https://github.com/User01005/Trackit","gh"],["Full doc on Notion","https://jealous-ghost-a9e.notion.site/Trackit-3e57ea0aa244803e9ad7c01421466caa?source=copy_link","no"]]
};

/* =================== ROUND 16: Washio case study =================== */
CS.washio={
  meta:[["Role","Solo: research, UX, UI, design system"],["Made with","Paper, Figma, then a clickable prototype"],["Type","Consumer app: find, order, track"],["Screens","60+ iterations, 10 final"],["Status","Designed, not built"]],
  quote:"Not “does this screen look good?” but “does this make the next decision easier?”",
  secs:[
   {h:"A routine chore that feels like an errand.",b:["Getting clothes cleaned means absorbing a lot of small frictions. Finding a provider you can trust. Working out what services even exist for a garment. Comparing one vendor against another, guessing what it will cost, explaining pickup and delivery, and then losing sight of your clothes the moment they leave your hands.","None of these is fatal on its own. Stacked together, they turn a routine chore into something you have to manage. The app has to answer four questions fast: <b>what's available, which vendor is right, what will it cost and how long, and where is my laundry right now.</b>"]},
   {h:"It looks like food delivery. It isn't.",b:["Delivery apps are the obvious reference, and the patterns are proven. But the object model is different. You don't choose a place and then a thing. You choose a treatment, then what it applies to. And it's a round trip that takes days, with your belongings inside it."],
    reframe:[["Food delivery",["Restaurant","Food","Cart","Delivery"]],["Laundry",["Service","Garment","Vendor","*Pickup","*Processing","Delivery"],1]],
    rfnote:"Two extra stages, a much longer wait, and a trust problem food never has. So: borrow the patterns people already know, and rebuild the hierarchy around what laundry needs."},
   {h:"It started on paper.",b:["Login, profile, the vendor page, search, booking, payment, and then home, again and again. The early pages even list their own problems: icons aren't good, the location icon is too big, the book now button is too big. Tap any sketch to see it up close. Five of nineteen are here, the ones that changed something. The rest, and every one of the sixty-plus Figma iterations, live in the Figma file."],
    sketches:[["ws_07","Home, with its own bug list"],["ws_10","A new direction for home"],["ws_18","Vendor card, labelled"],["ws_05","Booking and schedule"],["ws_16","The screens to design"]],
    pipe:[["Paper","Every screen sketched, with notes on what's wrong"],["Wireframes","A site map, then grey boxes in Figma"],["Figma","60+ iterations, a component library, the final screens"],["Prototype","A clickable build of the flow, to test the motion"]]},
   {h:"Structure before style.",b:["Before any colour: a site map of every page and where it leads, then lo-fi wireframes straight off the sketches. Most of these grey screens didn't survive, but the order of things did. Tap to see any of them big."],
    fig:["w_ia","Site map: welcome, then home, then everything else branches from it"],
    strip:[["wl_0","Welcome"],["wl_1","Login"],["wl_2","Register"],["wl_3","Home"],["wl_4","Profile"],["wl_5","Vendor"],["wl_6","Search"],["wl_7","Fill the bundle"],["wl_8","Payment"]]},
   {h:"Versions that didn't make it, but led somewhere.",b:["Over sixty frames sit in the Figma file. Left is the first version in Figma, right is where it ended up."],
    tags:["v1 · Figma","Final","first version in Figma","final"],
    iters:[["wi_greet","wf_home","Home","The early home opened with a greeting. It said nothing you could act on. The final header spends that space on where you are and one clear action: Book Now."],
      ["wi_outdel","wf_homeorder","An order in progress","A full blue card took over home while an order was live. It shrank to one compact card: order number, status and a progress bar, so the services still fit above the fold."],
      ["wi_vendor","wf_vendor","The vendor page","Photos of the shop led, services came second. Flipped: you pick a treatment before a place, so the services and their price per kg or per piece lead, and the vendor stays secondary."],
      ["wi_pay","wf_checkout","Checkout","Your bag and Pickup & Payment were two screens. They became one scroll: address, bag, pickup slot, how fast it comes back, and payment, with the total always in the bar."],
      ["wi_map","wf_track","Tracking","The first tracker was a live map, straight from food delivery. But laundry spends days at a facility, so the map became a list of stages you can actually read."]]},
   {h:"The pieces it's built from.",b:["The nav bar, the search bar, the view bag button, the steppers, the address picker, delivery back and payment all live in Figma as component sets, next to the 3D asset family. Under them, three interactions rebuilt live from the final screens, with the prototype's motion. Play with them."],wcomps:1},
   {h:"The final screens, in the order you meet them.",b:["Home, search, results, a vendor, their garment list, checkout, booked, tracking, home with an order in progress, and your profile. Tap any screen to see it big."],wboard:1},
   {h:"Select, schedule, track, receive.",b:["That's the whole mental model. Whatever the entry point, garment care, a nearby vendor or search, it ends in the same place: a bag with a pickup slot on it, and a clear view of where that bag is."],
    flow:[["Garment care","Nearby vendors","Search"],"Fill a bag, pick a slot",["Picked up","Processed","Delivered back"]]},
   {h:"How it moves.",steps:[
     ["Pick the care","Wash & fold, dry cleaning, wash & iron, press & fold. Six cards, horizontal, so more of them fit on one screen."],
     ["Fill the bag","From a vendor, by the kilo or by the piece. Add turns into a stepper and the bag bar slides up with a running total."],
     ["Choose a slot","Pickup day and time, then how fast it comes back: 48 hours free, 24 hours or same day for a fee. Pay in the same scroll."],
     ["Watch it come back","Placed, picked up, sorting and wash, press and pack, out for delivery. The pickup partner and the day it's back, always in view."]]},
   {h:"Blue for care, not red for appetite.",b:["Every big delivery brand has claimed a hot colour, Zomato red, Swiggy orange. Those sell urgency and appetite. Laundry sells care and cleanliness, so the brand is blue, green is kept for status only, and yellow barely shows up at all.","Type is Inclusive Sans: titles at 24px medium with tight tracking, headings at 20px, body at 16px. Cards are white on a warm off-white page, 20px radius, so every screen reads as a stack of things you can tap."],
    sys:{colors:[["#185FA5","Brand, CTA"],["#378ADD","Icons, accent"],["#E6F1FB","Selection tint"],["#0C447C","Pressed"],["#639922","Status only"],["#F5F5F2","Page"],["#2C2C2A","Primary text"],["#E24B4A","Error, cancel"]],
         specs:[["Title","24px medium, -2.5%"],["Heading","20px medium, -1%"],["Body","16px regular, 150% line"],["Cards","White, 20px radius"],["Secondary text","#888780"],["Error background","#FCEBEB"]],
         type:[["Aa","Inclusive Sans","Friendly and round, easy to scan at a glance. Titles run tight, body runs open.","'Inclusive Sans',system-ui,sans-serif"],["Aa","One accent","Blue carries every action. Green only ever means done or in progress.","system-ui,sans-serif"]]}},
   {h:"The calls that mattered.",decisions:[
     ["Horizontal cards, on purpose","Vertical cards look richer. But two compact horizontal cards take about the same space as one vertical one. It was never a rich card against a poor one: it was one option shown well against two."],
     ["Location, not a greeting","Location decides whether a vendor can serve you at all. A greeting spends the most valuable space on the screen to say nothing you can act on."],
     ["Copy must be true","One promo line read Get Your First Wash Done. It sounds good, and it quietly promises a free wash the business may not offer. Every offer on screen has to map to a real rule."],
     ["Its own 3D family","3D assets help you recognise a service faster than words. Small enough to act as icons, consistent across every card, and never borrowed from another company's visual language."],
     ["Vendors visible, not loud","Laundry is about trust, so the vendor's name and rating are always there. But they stay secondary. The rating is a trust signal, never the button."],
     ["Stages, not a map","Food is a trip across town in minutes. Laundry is a round trip over days. What you need to know is the stage it's at and the day it's back."]]},
   {h:"What I turned down.",b:["Copying delivery apps wholesale. Huge flat lists of every service a laundry offers. Promo sections that exist because every other app has one. Decoration that doesn't help you recognise anything. Marketing lines that don't match a real offer. A greeting in the header. And any 3D asset that imitates someone else's.","More was never better. Each of these would have made a screen look fuller and the next decision harder."]},
   {h:"What I'd do differently.",b:["The screens are designed, but the product isn't built, and the business questions underneath it are still open. Service first or vendor first? Priced per kilo, per piece, or after inspection? A marketplace of vendors, or one operator? Each answer reshapes the home screen and the order flow.","Next is the part that doesn't photograph well: the full flow end to end, then every edge case. No vendors nearby, a failed pickup, a payment that doesn't go through, a garment that doesn't match the service, an order changed halfway. Some of the screens that look right today will have to change once they meet those."]}
  ],
  cta:["Want the full walkthrough?","Everything here is a gist. Open the prototype and click through it yourself, or open the file and see every one of the sixty-plus frames.","https://www.figma.com/proto/m3SUyrHxJpr0Kd4u7X1NS3/Portfolio?node-id=1-11475&viewport=-114018%2C2820%2C1&t=atcKJfUxhiDERAnD-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=1%3A11475&show-proto-sidebar=1&page-id=0%3A1","Open the prototype"],
  links:[["Figma prototype","https://www.figma.com/proto/m3SUyrHxJpr0Kd4u7X1NS3/Portfolio?node-id=1-11475&viewport=-114018%2C2820%2C1&t=atcKJfUxhiDERAnD-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=1%3A11475&show-proto-sidebar=1&page-id=0%3A1","fig"],
   ["Figma file","https://www.figma.com/design/m3SUyrHxJpr0Kd4u7X1NS3/Portfolio?node-id=1-35294&t=0ph4ZnQHoDeBoTTq-11","fig"],
   ["Full doc on Notion","https://jealous-ghost-a9e.notion.site/Laundry-App-Product-UX-UI-Design-3c87ea0aa24480f8b54ff007f0655dcb?source=copy_link","no"]]
};
var CSK={"onboarding": "/assets/media/bd1983c82409a710.jpg", "sidebar": "/assets/media/30d0e66cb0ab63c2.jpg", "web": "/assets/media/df6cc50a096f0cf4.jpg", "web2": "/assets/media/aa3f16d8b40e88f1.jpg", "home": "/assets/media/30a02ef9ff7e3352.jpg", "navbar": "/assets/media/5825ea443359ab43.jpg", "upcoming": "/assets/media/0dc1cbd50013fbdd.jpg", "memory": "/assets/media/8f2f634086018c64.jpg", "alterai": "/assets/media/84386495fb7ef53b.jpg"};
function renderRich(p,c){
  var H='<div class="cs-meta">'+c.meta.map(function(m){return '<div><span>'+m[0]+'</span><b>'+m[1]+'</b></div>'}).join("")+'</div>';
  if(c.links)H+='<div class="cs-links">'+c.links.map(function(l){return '<a href="'+l[1]+'" target="_blank" rel="noopener" class="cs-link lk-'+l[2]+'">'+(LICO[l[2]]||"")+'<span>'+l[0]+'</span><svg class="ne" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>'}).join("")+'</div>';
  if(c.quote)H+='<p class="cs-quote">'+c.quote+'</p>';
  c.secs.forEach(function(x,i){
    H+='<section class="cs-sec'+(x.draft?' draft':'')+'"><span class="cs-n">'+("0"+(i+1)).slice(-2)+'</span><h2>'+x.h+'</h2>';
    if(x.b)H+=x.b.map(function(t){return '<p class="cs-p">'+t+'</p>'}).join("");
    if(x.personas)H+='<div class="cs-people" style="--n:'+x.personas.length+'">'+x.personas.map(function(q){return '<div class="cs-person" style="--pc:'+q[4]+'"><i>'+q[0].charAt(0)+'</i><b>'+q[0]+'</b><span>'+q[1]+'</span><p>'+q[2]+'</p><q>'+q[3]+'</q></div>'}).join("")+'</div>';
    if(x.sketches)H+='<div class="cs-sketches">'+x.sketches.map(function(k,j){return '<figure style="--r:'+[-2.5,1.8,-1.2,2.4,-1.8,1.2,-2.2,1.6][j%8]+'deg"><img loading="lazy" alt="Sketch: '+k[1]+'" src="'+CSK[k[0]]+'"><figcaption>'+k[1]+'</figcaption></figure>'}).join("")+'</div>';
    if(x.pipe)H+='<ol class="cs-pipe">'+x.pipe.map(function(t,j){return '<li style="--pc:'+["#FFD44E","#E7BBFF","#A9DEFF","#B4F6B8"][j%4]+'"><b>'+t[0]+'</b><span>'+t[1]+'</span></li>'}).join("")+'</ol>';
    if(x.flow)H+='<div class="cs-flow"><div class="ins">'+x.flow[0].map(function(t){return '<span>'+t+'</span>'}).join("")+'</div><div class="mid"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg><b>'+x.flow[1]+'</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div><div class="outs">'+x.flow[2].map(function(t){return '<span>'+t+'</span>'}).join("")+'</div></div>';
    if(x.steps)H+='<ol class="cs-steps">'+x.steps.map(function(t){return '<li><b>'+t[0]+'</b><p>'+t[1]+'</p></li>'}).join("")+'</ol>';
    if(x.iters)H+=itersHTML(x.iters,x.tags);
    if(x.shots)H+='<div class="cs-screens cs-shots">'+x.shots.map(function(t){var a=TRK[t[0]];return '<figure><div class="ph rl" style="aspect-ratio:'+a.w+'/'+a.h+'"><img loading="lazy" alt="'+t[1]+'" src="'+a.u+'"></div><figcaption><b>'+t[1]+'</b>'+t[2]+'</figcaption></figure>'}).join("")+'</div>';
    if(x.stage)H+=stageHTML();else if(x.screens)H+='<div class="cs-screens">'+x.screens.map(function(t){return '<figure><div class="ph"><span>'+t[0]+'</span><small>screen coming from Figma</small></div><figcaption><b>'+t[0]+'</b>'+t[1]+'</figcaption></figure>'}).join("")+'</div>';
    if(x.reframe)H+='<div class="cs-rf">'+x.reframe.map(function(r){return '<div class="cs-rf-row'+(r[2]?' on':'')+'"><span class="cs-rf-l">'+r[0]+'</span><div class="cs-rf-c">'+r[1].map(function(t,j){var xx=t.charAt(0)==="*";return (j?'<i aria-hidden="true">›</i>':'')+'<b'+(xx?' class="x"':'')+'>'+(xx?t.slice(1):t)+'</b>'}).join("")+'</div></div>'}).join("")+(x.rfnote?'<p class="cs-rf-n">'+x.rfnote+'</p>':'')+'</div>';
    if(x.fig)H+='<figure class="cs-fig" tabindex="0" data-cap="'+x.fig[1]+'"><div><img loading="lazy" alt="'+x.fig[1]+'" src="'+ALT[x.fig[0]].u+'"></div><figcaption>'+x.fig[1]+'</figcaption></figure>';
    if(x.strip)H+='<div class="cs-strip">'+x.strip.map(function(t){var a=ALT[t[0]];return '<figure tabindex="0" data-cap="'+t[1]+'"><img loading="lazy" alt="'+t[1]+'" src="'+a.u+'"><figcaption>'+t[1]+'</figcaption></figure>'}).join("")+'</div>';
    if(x.wcomps)H+=wshCompsHTML();
    if(x.wboard)H+=wshStageHTML();
    if(x.tcomps)H+=trkCompsHTML();
    if(x.board)H+=trkStageHTML();
    if(x.hcomps)H+=hbCompsHTML();
    if(x.hboard)H+=hbStageHTML();
    if(x.pwire)H+=pcWireHTML();
    if(x.pcomps)H+=pcCompsHTML();
    if(x.pboard)H+=pcStageHTML();
    if(x.comps)H+=compsHTML();
    if(x.sys)H+='<div class="cs-sys"><div class="swc">'+x.sys.colors.map(function(k){return '<div><i style="background:'+k[0]+'"></i><b>'+k[1]+'</b><code>'+k[0]+'</code></div>'}).join("")+'</div><dl>'+x.sys.specs.map(function(k){return '<div><dt>'+k[0]+'</dt><dd>'+k[1]+'</dd></div>'}).join("")+'</dl></div>'+(x.sys.type?'<div class="cs-type">'+x.sys.type.map(function(t){return '<div><i style="font-family:'+t[3]+'">'+t[0]+'</i><b>'+t[1]+'</b><p>'+t[2]+'</p></div>'}).join("")+'</div>':'');
    if(x.decisions)H+='<div class="cs-dec">'+x.decisions.map(function(t,j){return '<div style="--dc:'+["#A9DEFF","#B4F6B8","#FFD44E","#E7BBFF"][j%4]+'"><b>'+t[0]+'</b><p>'+t[1]+'</p></div>'}).join("")+'</div>';
    H+='</section>'});
  if(c.cta)H+='<div class="cs-cta"><div><h3>'+c.cta[0]+'</h3><p>'+c.cta[1]+'</p></div>'+(c.cta[2]==="#apk"?'<button type="button" class="btn" data-apk>'+c.cta[3]+' '+ARW+'</button>':'<a class="btn" href="'+c.cta[2]+'"'+(/^https?:/.test(c.cta[2])?' target="_blank" rel="noopener"':'')+'>'+c.cta[3]+' '+ARW+'</a>')+'</div>';
  return H}
/* =================== ROUND 11: Alter assets, cover canvas, stage, components =================== */
var ALT={"nav": {"u": "/assets/media/8e23061832b53824.webp", "w": 420, "h": 444}, "fab": {"u": "/assets/media/e5231e32f5925651.webp", "w": 440, "h": 192}, "inp": {"u": "/assets/media/048581c7e73b2a83.webp", "w": 420, "h": 384}, "cNote": {"u": "/assets/media/9ef191907ecb1db5.webp", "w": 480, "h": 172}, "face": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 491.8 466\" fill=\"currentColor\"><path d=\"M 180.2 307.0 C 181.3 303.8 181.1 300.3 179.6 297.2 C 178.2 294.2 175.6 291.8 172.4 290.6 C 169.3 289.5 165.8 289.6 162.7 291.0 C 159.6 292.4 157.2 294.9 156.0 298.1 C 154.6 301.6 153.2 305.2 151.8 308.7 C 138.6 344.3 126.4 380.6 123.1 420.9 C 122.4 430.3 123.5 444.6 135.1 454.9 C 146.5 464.4 158.4 464.8 167.6 465.0 C 186.4 464.6 201.8 460.2 216.8 456.5 C 220.5 455.6 224.1 454.6 227.5 453.8 C 232.1 452.7 236.0 449.9 238.4 445.8 C 240.8 441.8 241.4 436.8 240.2 432.2 C 239.0 427.5 236.0 423.5 232.0 421.1 C 227.9 418.7 223.1 418.1 218.6 419.4 C 214.7 420.5 211.0 421.6 207.4 422.7 C 193.0 427.0 178.8 431.2 166.8 431.9 C 161.0 432.3 156.4 431.0 156.0 430.5 C 155.7 430.3 155.4 430.2 154.9 428.8 C 154.4 427.5 154.1 425.2 154.1 422.5 C 155.4 388.1 165.3 352.3 176.7 317.6 C 177.8 314.0 179.0 310.5 180.2 307.0 Z M 180.2 307.0  M 384.8 217.7 C 379.6 238.5 358.5 251.1 337.7 245.8 C 316.9 240.6 304.4 219.5 309.6 198.7 C 314.8 178.0 335.9 165.4 356.7 170.6 C 377.5 175.9 390.0 197 384.8 217.7 Z M 384.8 217.7  M 122.6 170.3 C 117.4 191.0 96.3 203.6 75.6 198.4 C 54.8 193.1 42.2 172.1 47.4 151.3 C 52.7 130.5 73.8 117.9 94.5 123.2 C 115.3 128.4 127.9 149.5 122.6 170.3 Z M 122.6 170.3  M 184.5 232.6 C 183.5 235.8 183.8 239.2 185.3 242.3 C 186.8 245.3 189.4 247.6 192.5 248.7 C 195.7 249.8 199.1 249.6 202.2 248.2 C 205.2 246.8 207.7 244.3 208.9 241.2 C 210.7 236.5 212.9 231.7 215.3 227.0 C 257.0 140.6 357.4 90.1 443.0 127.2 C 447.8 129.0 452.4 130.9 457.1 133.0 C 463.0 135.6 469.6 135.7 475.5 133.1 C 481.5 130.6 486.2 125.6 488.6 119.5 C 491.1 113.3 491.1 106.4 488.5 100.5 C 486.0 94.6 481.2 90.1 475.1 88.0 C 469.2 85.8 463.6 84.0 457.7 82.2 C 348.7 43.1 227.9 117.8 190.7 215.8 C 188.4 221.3 186.3 227.0 184.5 232.6 Z M 184.5 232.6  M 218.8 182.6 C 220.0 185.7 222.4 188.2 225.5 189.7 C 228.5 191.1 232.0 191.3 235.2 190.2 C 238.3 189.1 240.9 186.8 242.4 183.8 C 243.9 180.8 244.3 177.3 243.3 174.1 C 241.8 169.4 240.2 164.6 238.5 159.8 C 223.1 117.6 203.3 75.3 167.5 41.7 C 133.2 5.4 66.3 0 24.6 26.2 C 19.6 28.8 15.2 31.5 10.4 34.5 C 5.7 37.5 2.5 42.2 1.4 47.7 C 0.4 53.1 1.6 58.9 4.8 63.6 C 8.0 68.4 12.9 71.7 18.4 72.8 C 23.8 73.8 29.4 72.6 34 69.3 C 37.6 66.6 41.1 64.4 44.8 62.1 C 113.4 11.6 184.5 92.8 213.6 169.4 C 215.4 173.8 217.2 178.2 218.8 182.6 Z M 218.8 182.6 \"/></svg>", "word": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 135 63.2\" fill=\"currentColor\"><path d=\"M -3.0 62.3 Z M 8.7 62.3 L 0.3 62.3 L 0.3 10.6 C 0.3 3.5 3.7 0 10.3 0 L 16.6 0 C 23.2 0 26.6 3.5 26.6 10.6 L 26.6 62.3 L 18.2 62.3 L 18.2 39.5 L 8.7 39.5 Z M 18.2 31.9 L 18.2 11.1 C 18.2 8.7 17.0 7.5 14.6 7.5 L 12.3 7.5 C 9.9 7.5 8.7 8.7 8.7 11.1 L 8.7 31.9 Z M 30.0 62.3 Z M 53.7 62.3 L 33.9 62.3 L 33.9 0 L 42.3 0 L 42.3 54.7 L 53.7 54.7 Z M 50.3 62.3 Z M 67.5 7.5 L 67.5 62.3 L 59.1 62.3 L 59.1 7.5 L 51.1 7.5 L 51.1 0 L 75.5 0 L 75.5 7.5 Z M 76.3 62.3 Z M 80.2 62.3 L 80.2 0 L 100.9 0 L 100.9 7.5 L 88.5 7.5 L 88.5 26.4 L 99.5 26.4 L 99.5 34.0 L 88.5 34.0 L 88.5 54.7 L 100.9 54.7 L 100.9 62.3 Z M 102.9 62.3 Z M 106.8 0 L 123.2 0 C 129.5 0 132.7 3.5 132.7 10.6 L 132.7 26.0 C 132.7 31.4 131.1 34.9 127.8 36.3 L 133.6 62.3 L 125.7 62.3 L 120.2 37.1 L 115.2 37.1 L 115.2 62.3 L 106.8 62.3 Z M 115.2 30.0 L 120.6 30.0 C 123.1 30.0 124.4 28.5 124.4 25.5 L 124.4 12.0 C 124.4 9.0 123.1 7.5 120.6 7.5 L 115.2 7.5 Z M 115.2 30.0 \"/></svg>", "x_home": {"u": "/assets/media/30a9cc71222c7a20.webp", "w": 480, "h": 1039}, "x_addtray": {"u": "/assets/media/ec3edaee26df8201.webp", "w": 480, "h": 1039}, "x_upcoming": {"u": "/assets/media/822be115253b63cd.webp", "w": 480, "h": 1039}, "x_memories": {"u": "/assets/media/5555deb1436c7f6d.webp", "w": 480, "h": 1039}, "x_notes": {"u": "/assets/media/ec0856e27a18c078.webp", "w": 480, "h": 1039}, "x_chat": {"u": "/assets/media/0bb31a6bcb0b5182.webp", "w": 480, "h": 1039}, "x_detail": {"u": "/assets/media/0e3506a72b05576d.webp", "w": 480, "h": 1039}, "x_onboarding": {"u": "/assets/media/67dee8ef8c7142ad.webp", "w": 480, "h": 1039}, "x_canvas": {"u": "/assets/media/68d0218ae0ba0173.webp", "w": 480, "h": 1039}, "x_widget": {"u": "/assets/media/5d9ce2d003858ca4.webp", "w": 480, "h": 320}, "f_home": {"u": "/assets/media/39c806acf8854d16.webp", "w": 480, "h": 1088}, "f_add": {"u": "/assets/media/e23b1ea35b787f57.webp", "w": 480, "h": 1088}, "f_on": {"u": "/assets/media/6d78e688f3d48e7d.webp", "w": 480, "h": 853}, "f_chat": {"u": "/assets/media/c911b629e3157f79.webp", "w": 480, "h": 1088}, "t_settings": {"u": "/assets/media/531b1c6d61e39278.webp", "w": 480, "h": 1068}, "t_calendar": {"u": "/assets/media/53c00ec7d4a42f30.webp", "w": 480, "h": 1067}, "t_dictate": {"u": "/assets/media/2b8d744e96bbf51d.webp", "w": 480, "h": 96}, "t_scan": {"u": "/assets/media/90144190372747a0.webp", "w": 480, "h": 1059}, "t_home": {"u": "/assets/media/0884909972d2a093.webp", "w": 480, "h": 1059}, "t_add": {"u": "/assets/media/73e2c92642ffc29c.webp", "w": 480, "h": 1067}, "t_voice": {"u": "/assets/media/5db52a0796f70ca1.webp", "w": 480, "h": 1059}, "t_analysis": {"u": "/assets/media/04032d59afd898d9.webp", "w": 480, "h": 1067}, "t_swipe": {"u": "/assets/media/c6531375527fb003.webp", "w": 480, "h": 1067}, "t_widget": {"u": "/assets/media/6e62a1c8e30cc34f.webp", "w": 480, "h": 480}, "tw_home": {"u": "/assets/media/0681748ee916ee61.webp", "w": 480, "h": 1039}, "tw_add": {"u": "/assets/media/b72096dddd1fb2fc.webp", "w": 480, "h": 1039}, "tw_voice": {"u": "/assets/media/1d33260e260eae1c.webp", "w": 480, "h": 1039}, "tw_scan": {"u": "/assets/media/f0132a6263a92ff8.webp", "w": 480, "h": 1039}, "tw_analysis": {"u": "/assets/media/b4dc6a3255b28f71.webp", "w": 480, "h": 1039}, "tw_settings": {"u": "/assets/media/bf82e59dddb4fc67.webp", "w": 480, "h": 1039}, "tw_widget": {"u": "/assets/media/9ea125045eba208b.webp", "w": 480, "h": 1039}, "tk_dock": {"u": "/assets/media/f90ff05aae27522a.webp", "w": 700, "h": 216}, "tk_menu": {"u": "/assets/media/f892483762cc5dd3.webp", "w": 360, "h": 458}, "tk_cal": {"u": "/assets/media/91cbdfa9df384fda.webp", "w": 520, "h": 620}, "t_icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"148 134 229 262\"><g transform=\"translate(256 256) scale(0.6) translate(-256 -256)\"><path fill=\"#EEEEEE\" d=\"M198.0,150.6C197.2,151.6 196.3,152.5 195.4,153.5C198.7,156.7 201.5,160.4 204.2,164.2C227.0,199.6 237.0,241.9 244.2,283.4C251.1,325.3 253.8,367.8 254.4,410.5C254.4,415.2 254.4,419.9 254.4,424.8C255.7,424.8 257.0,424.9 258.3,425C258.8,420.1 259.1,415.4 259.5,410.7C262.4,367.8 261.5,324.4 254.4,281.7C247.1,239.3 235.1,196.1 208.3,161.1C205.2,157.3 201.9,153.7 198.0,150.6Z\"/><path fill=\"#EEEEEE\" d=\"M182.0,289.0C181.1,289.9 180.2,290.8 179.3,291.8C181.1,293.4 182.2,293.7 183.5,294.5C195.1,299.7 206.6,302.9 218.3,305.9C230.0,308.9 241.7,311.2 253.4,313.8C254.7,314.1 256.1,314.4 257.4,314.7C257.9,313.5 258.4,312.3 258.9,311.1C257.7,310.4 256.5,309.7 255.3,309.1C244.4,303.0 232.7,298.9 220.9,295.9C209.1,292.8 196.8,291.3 185.1,289.6C185.0,289.6 184.8,289.5 184.7,289.5C184.5,289.5 184.3,289.5 184.2,289.4C183.8,289.4 183.6,289.3 183.3,289.3C182.7,289.2 182.1,288.9 182.0,289.0Z\"/><path fill=\"#EEEEEE\" d=\"M326.5,279.2C327.4,280.1 328.3,281.1 329.2,282.0C327.4,283.7 326.1,284.2 324.7,285.0C311.7,291.3 298.6,295.5 285.4,299.5C272.2,303.5 258.9,306.9 245.6,310.6C244.1,311.0 242.6,311.4 241.2,311.8C240.6,310.6 240.1,309.4 239.6,308.3C240.9,307.4 242.3,306.6 243.6,305.8C255.9,298.8 269.1,293.6 282.4,289.6C295.7,285.5 309.5,282.9 322.9,280.2C323.1,280.2 323.2,280.1 323.4,280.1C323.6,280.0 323.8,280.0 323.9,280C324.3,279.9 324.6,279.8 325.0,279.7C325.6,279.5 326.4,279.2 326.5,279.2Z\"/><path fill=\"#EEEEEE\" d=\"M225.8,205.2C225.7,206.5 225.5,207.8 225.4,209.1C225.8,209.2 226.2,209.1 226.5,209.1C226.7,209.1 226.9,209.0 227.1,208.9C227.3,208.9 227.4,208.8 227.6,208.8C227.7,208.7 227.9,208.7 228.0,208.6C228.5,208.4 229.0,208.2 229.4,207.9C236.9,203.8 242.6,198.7 248.1,193.4C253.7,188.0 258.6,182.3 263.7,176.6C264.3,176.0 264.9,175.4 265.5,174.8C264.8,173.7 264.1,172.6 263.4,171.5C262.6,171.7 261.7,172.1 260.8,172.4C253.2,175.6 246.6,180.4 240.9,185.9C235.2,191.4 230.5,197.9 226.2,204.0C226.0,204.3 225.8,204.6 225.6,204.8C225.5,204.9 225.4,205.0 225.3,205.1C225.3,205.2 225.3,205.2 225.8,205.2Z\"/><path fill=\"none\" stroke=\"#EEEEEE\" stroke-width=\"10.3\" d=\"M269.0,403.1C282.3,403.5 294.7,405.8 303.8,409.4C312.9,413.0 318.2,417.7 318.5,422.6C318.8,427.5 314.2,432.4 305.6,436.1C296.9,439.9 284.8,442.3 271.6,443.0C258.4,443.7 244.9,442.5 233.9,439.8C222.8,437.0 214.8,432.9 211.5,428.1C208.2,423.3 209.8,418.3 215.9,413.9C222.0,409.5 232.3,406.1 244.8,404.3\"/><path fill=\"#93E2FF\" d=\"M137.4,242.1C139.3,242.4 142.6,244.0 144.4,244.9C144.4,244.9 144.5,244.9 144.5,244.9C144.9,245.1 145.4,245.3 145.8,245.5C147.0,246.0 148.6,246.7 151.7,248.3C152.7,248.7 153.6,249.1 154.6,249.5C163.8,253.3 172.8,257.5 181.9,261.6C184.3,262.7 186.1,265.1 186.4,267.7C186.4,268.0 186.4,268.4 186.4,268.7C186.4,269.6 186.2,270.6 185.8,271.6C184.9,273.9 184.3,275.9 183.0,278.1C181.8,280.6 180.9,282.2 180.2,283.6C176.4,291.6 172.7,299.7 169.2,307.8C169.2,307.8 169.2,307.8 169.2,307.8C167.9,310.9 164.0,312.4 161.0,311.1C160.2,310.7 159.3,310.3 158.4,310.0C156.0,309.0 153.7,308.0 151.3,307.0C149.9,306.5 148.5,306.1 147.3,305.6C145.5,305.0 144.0,304.5 142.7,304.0C139.7,302.8 136.3,301.3 133.8,300.1C133.4,299.9 133.0,299.7 132.6,299.6C130.6,298.8 128.6,298.0 126.5,297.2C126.4,297.1 126.3,297.0 126.2,296.9C124.6,295.8 122.5,294.9 119.2,293.5C117.7,292.9 116.0,292.2 114.1,291.3C112.8,290.7 112.2,290.3 111.7,289.9C111.6,289.8 111.5,289.7 111.3,289.7C110.8,289.3 110.3,289.2 109.6,289.1C108.7,288.9 107.6,288.7 106.4,287.9C102.4,285.6 100.4,285.2 98.9,284.9C98.4,284.8 98.0,284.8 97.6,284.7C97.6,284.6 97.5,284.6 97.4,284.6C95.0,283.8 93.1,280.4 93.7,278.0C93.8,277.5 93.9,276.9 94.2,276.3C94.7,275.2 95.2,273.6 95.6,272.4C95.7,271.7 96.1,270.9 96.5,270.0C96.9,269.0 97.4,267.8 97.8,266.6C98.9,263.4 99.5,261.7 100.0,260.3C100.1,259.9 100.3,259.6 100.4,259.2C100.8,258.1 101.3,256.7 101.8,255.2C102.5,253.5 103.1,251.8 103.6,250.5C105.1,247.2 106.6,243.9 108.1,240.6C108.4,240.1 108.6,239.6 108.9,239.2C110.1,236.8 112.5,235.8 114.2,235.9C116.6,236.2 117.2,237.7 116.8,238.4C116.5,239.2 115.5,239.7 115.1,240.5C114.8,241.0 114.8,241.4 114.9,241.7C114.8,242.2 114.6,242.7 114.4,243.2C113.1,246.7 111.7,250.2 110.4,253.7C108.7,258.0 107.0,262.3 105.3,266.5C104.0,269.4 102.7,272.4 101.5,275.3C101.3,275.6 101.2,275.9 101.1,276.2C100.8,277.1 100.5,278 100.2,278.8C100.4,278.7 100.4,278.3 100.3,278.1C100.2,278.1 100.2,278.1 100.1,278.0C101.2,278.5 102.0,278.9 102.7,279.3C103.3,279.6 103.8,279.9 104.3,280.1C104.6,280.2 105.1,280.4 105.6,280.6C107.6,281.4 111.0,282.7 114.0,284.2C115.4,284.9 116.9,285.7 118.4,286.5C120.5,287.6 122.4,288.7 123.5,289.1C125.3,289.7 127.3,290.7 129.1,291.6C130.8,292.4 132.3,293.1 133.2,293.3C134.3,293.6 135.2,294.0 136.5,294.7C137.4,295.1 138.4,295.7 139.9,296.3C141.7,297.1 142.9,297.8 143.9,298.3C145.3,299.1 146.4,299.6 148.1,300.1C150.1,300.7 152.1,301.4 153.6,302.1C154.2,302.4 155.0,302.8 155.9,303.1C157.0,303.5 158.1,304.0 159.1,304.5C160.0,305.0 160.6,305.4 161.2,305.8C161.4,305.9 161.6,306.1 161.7,306.2C162.1,306.3 162.5,306.5 162.9,306.7C163.0,306.7 163.1,306.7 163.3,306.8C163.3,306.7 163.4,306.7 163.4,306.7C163.7,306.5 163.9,306.3 164.0,306.0C164.0,305.9 164.1,305.8 164.1,305.7C164.5,304.8 164.9,304.0 165.4,303.1C165.9,302.0 166.4,301.0 166.9,299.7C167.3,298.8 167.6,297.8 168.0,296.8C168.5,295.3 169.0,293.8 169.5,292.9C169.7,292.5 169.9,292.2 170.1,291.9C170.1,291.9 170.1,291.9 170.1,291.9C170.2,291.9 170.2,291.9 170.2,291.9C171.1,289.4 172.1,286.9 173.0,284.5C173.1,284.3 173.2,284.0 173.2,283.8C173.5,282.7 173.8,281.7 174.0,281.0C174.1,280.2 174.7,278.4 175.4,276.5C175.9,275.2 176.3,273.9 176.7,272.8C176.9,272.2 177.2,271.7 177.5,271.1C177.9,270.6 178.2,270.1 178.4,269.4C178.5,269.2 178.6,268.9 178.7,268.6C178.7,268.6 178.7,268.6 178.7,268.6C178.7,268.6 178.6,268.6 178.6,268.6C178.5,268.7 178.6,268.8 178.7,268.8C178.8,268.8 178.9,268.8 178.9,268.7C178.9,268.7 178.9,268.7 178.9,268.7C177.0,268.0 175.2,267.3 173.4,266.6C173.0,266.6 172.6,266.5 172.3,266.6C172.1,266.6 171.9,266.7 171.6,266.7C171.3,266.8 171.0,266.9 170.7,266.9C170.4,266.9 170.1,266.8 169.9,266.7C169.8,266.6 169.8,266.6 169.7,266.5C169.7,266.4 169.6,266.4 169.5,266.3C169.5,266.3 169.4,266.3 169.3,266.3C169.2,266.3 169.0,266.3 168.8,266.2C167.9,265.9 166.9,265.5 166.0,265.0C165,264.6 163.9,264.1 163.1,263.8C162.2,263.4 160.9,262.8 159.6,262.1C158.7,261.6 157.8,261.2 157.1,260.8C156.3,260.4 155.5,260.2 154.7,259.9C153.7,259.6 152.8,259.3 152.0,259.3C151.9,258.8 151.8,258.6 151.6,258.3C151.5,258.1 151.3,257.9 151.1,257.7C150.2,257.3 149.2,256.9 148.2,256.5C148.2,256.5 148.1,256.5 148.1,256.5Z\"/><path fill=\"#EEEEEE\" d=\"M141.3,283.6C146.3,282.4 149.3,277.4 148.1,272.5C146.9,267.5 141.9,264.5 137.0,265.7C132.0,266.9 129.0,271.9 130.2,276.8C131.4,281.8 136.4,284.8 141.3,283.6Z\"/><path fill=\"#93E2FF\" d=\"M274.4,129.6C275.8,128.2 278.9,126.2 280.6,125.2C280.6,125.1 280.6,125.1 280.7,125.1C281.1,124.9 281.4,124.6 281.9,124.3C282.9,123.6 284.3,122.7 287.4,120.9C288.3,120.3 289.1,119.7 290.0,119.1C298.2,113.5 306.5,108.0 314.9,102.7C317.1,101.2 320.1,101.0 322.5,102.2C322.7,102.4 323.0,102.5 323.3,102.7C324.1,103.2 324.8,103.9 325.4,104.7C326.9,106.8 328.4,109.0 329.4,110.6C330.8,113.0 331.7,114.6 332.5,116.0C337.2,123.5 342.0,131.0 346.9,138.3C346.9,138.3 346.9,138.3 346.9,138.3C348.8,141.0 348.0,145.1 345.3,146.9C344.5,147.5 343.7,148.0 342.9,148.6C340.8,150.0 338.7,151.5 336.6,152.9C335.4,153.9 334.3,154.7 333.3,155.6C331.8,156.7 330.5,157.8 329.4,158.6C326.8,160.5 323.7,162.5 321.3,163.9C320.9,164.2 320.6,164.4 320.2,164.6C318.5,165.9 316.7,167.2 314.9,168.5C314.8,168.5 314.7,168.6 314.5,168.6C312.7,169.3 310.8,170.6 307.9,172.7C306.6,173.6 305.1,174.6 303.3,175.8C302.1,176.6 301.4,176.8 300.9,177.0C300.7,177.1 300.6,177.2 300.4,177.2C299.9,177.4 299.5,177.9 299.0,178.4C298.3,179.0 297.6,179.8 296.3,180.5C292.2,182.5 290.8,184.0 289.7,185.1C289.4,185.5 289.1,185.8 288.8,186.0C288.7,186.1 288.7,186.1 288.6,186.2C286.7,187.9 282.8,187.6 281.1,185.8C280.7,185.4 280.3,185.0 279.9,184.4C279.2,183.4 278.2,182.1 277.3,181.1C276.9,180.7 276.4,179.9 275.8,179.1C275.2,178.2 274.5,177.2 273.7,176.1C271.6,173.5 270.5,172.0 269.6,170.9C269.3,170.6 268.9,170.0 268.9,170.0C268.1,169.0 267.2,167.8 266.3,166.6C265.2,165.2 264.1,163.7 263.2,162.6C261.3,159.5 259.3,156.5 257.4,153.4C257.1,152.9 256.8,152.5 256.6,152.0C255.2,149.7 255.7,147.1 256.7,145.8C258.3,143.9 259.9,144.2 260.2,144.9C260.7,145.6 260.6,146.7 261.0,147.5C261.3,148.0 261.7,148.3 262.0,148.3C262.3,148.7 262.7,149.1 263.0,149.5C265.2,152.6 267.5,155.6 269.7,158.6C272.4,162.3 275.0,166.0 277.6,169.8C279.4,172.5 281.2,175.1 283.0,177.8C283.2,178.0 283.4,178.3 283.6,178.6C284.1,179.3 284.7,180.0 285.3,180.7C285.3,180.7 285.0,180.2 284.7,180.3C284.7,180.3 284.6,180.3 284.6,180.4C285.5,179.7 286.3,179.3 287.0,178.9C287.6,178.6 288.1,178.3 288.6,177.9C288.9,177.7 289.2,177.5 289.7,177.2C291.4,175.9 294.4,173.7 297.3,172.0C298.6,171.2 300.1,170.4 301.6,169.6C303.6,168.4 305.6,167.4 306.5,166.7C308.0,165.5 309.9,164.3 311.6,163.3C313.2,162.3 314.6,161.4 315.3,160.7C316.2,160.0 317.0,159.5 318.2,158.8C319.1,158.2 320.1,157.6 321.5,156.7C323.1,155.7 324.3,155.0 325.3,154.5C326.7,153.7 327.7,153.1 329.1,151.9C330.6,150.6 332.3,149.3 333.7,148.4C334.3,148.0 335.0,147.5 335.8,147.0C336.7,146.3 337.8,145.6 338.7,145.0C339.6,144.5 340.3,144.2 340.9,144.0C341.1,143.9 341.3,143.8 341.5,143.7C341.9,143.5 342.2,143.2 342.6,143.0C342.7,142.9 342.8,142.8 342.9,142.7C342.9,142.7 342.9,142.6 342.9,142.6C342.9,142.3 342.8,142.0 342.6,141.7C342.6,141.6 342.5,141.5 342.4,141.4C341.9,140.6 341.4,139.8 340.9,139.0C340.3,138.0 339.7,136.9 338.9,135.8C338.3,135.0 337.7,134.2 337.0,133.4C336.0,132.1 335.1,130.9 334.5,130.0C334.3,129.6 334.2,129.3 334.1,128.9C334.1,128.9 334.1,128.9 334.1,128.9C332.5,126.7 330.9,124.6 329.4,122.5C329.2,122.3 329.1,122.1 328.9,122.0C328.2,121.1 327.5,120.3 326.9,119.8C326.3,119.3 325.1,117.8 323.9,116.1C323.1,115.1 322.2,114.0 321.5,113.1C321.1,112.6 320.8,112.0 320.5,111.5C320.3,110.9 320.0,110.3 319.6,109.8C319.5,109.6 319.3,109.3 319.0,109.1C319.0,109.1 319.0,109.1 319.0,109.1C319.0,109.2 319.0,109.2 319.0,109.3C319.0,109.3 319.2,109.3 319.2,109.2C319.3,109.2 319.3,109.1 319.3,109.1C319.3,109.1 319.3,109.1 319.3,109.1C317.7,110.2 316.1,111.4 314.5,112.5C314.3,112.8 313.9,113.4 313.9,113.4C313.8,113.6 313.7,113.8 313.7,114.1C313.6,114.4 313.5,114.7 313.3,115.0C313.1,115.2 312.9,115.4 312.7,115.5C312.6,115.6 312.5,115.6 312.4,115.6C312.4,115.6 312.3,115.6 312.2,115.6C312.2,115.7 312.1,115.7 312.1,115.8C312.0,115.9 311.9,116.1 311.7,116.2C311.0,116.8 310.1,117.3 309.2,117.9C308.2,118.5 307.3,119.1 306.6,119.7C305.8,120.3 304.5,121.0 303.3,121.7C302.4,122.2 301.5,122.7 300.8,123.1C300.1,123.6 299.4,124.1 298.8,124.7C298.0,125.3 297.2,125.9 296.5,126.3C296.3,126.4 296.1,126.4 295.7,126.4C295.5,126.4 295.3,126.4 295.0,126.5C294.1,127.1 293.3,127.7 292.4,128.2C292.4,128.3 292.3,128.3 292.3,128.4C292.3,128.4 292.3,128.4 292.3,128.4C291.8,129.2 291.2,130.3 289.6,131.0C289.2,131.2 288.9,131.2 288.6,131.2C288.4,131.2 288.1,131.2 287.8,131.4C287.5,131.6 287.2,131.9 286.9,132.2C286.5,132.7 286.0,133.2 285.3,133.5C285.3,133.5 285.2,133.5 285.2,133.5C284.7,133.8 284.0,134.1 283.2,134.3C281.3,135.5 279.4,136.7 277.4,137.9C274.3,139.9 271.1,141.8 267.8,143.8C266.3,144.8 264.6,145.4 263.2,145.7C261.8,145.9 260.7,145.6 260.2,144.9C259.8,144.2 259.9,143.1 260.6,141.9C261.3,140.6 262.5,139.3 264.0,138.2C266.4,136.4 268.8,134.6 271.1,132.8C271.3,132.7 271.4,132.6 271.5,132.5C272.4,131.7 273.1,130.9 273.9,130.1C274.1,129.9 274.2,129.8 274.4,129.6Z\"/><path fill=\"#EEEEEE\" d=\"M311.5,148.7C313.2,143.9 310.6,138.6 305.8,137.0C301.0,135.3 295.7,137.9 294.1,142.7C292.4,147.5 295.0,152.8 299.8,154.4C304.6,156.1 309.9,153.5 311.5,148.7Z\"/><path fill=\"#93E2FF\" d=\"M152.5,147.5C150.9,146.4 148.5,143.7 147.2,142.2C147.1,142.2 147.1,142.1 147.1,142.1C146.8,141.7 146.5,141.4 146.1,141.0C145.2,140.1 144.1,138.9 141.8,136.1C141.1,135.4 140.3,134.7 139.6,133.9C132.7,126.8 126.0,119.4 119.3,112.0C117.5,110.1 116.8,107.1 117.6,104.6C117.7,104.3 117.8,104.0 117.9,103.7C118.3,102.9 118.9,102.0 119.6,101.3C121.4,99.5 123.4,97.6 124.8,96.4C126.9,94.7 128.4,93.5 129.6,92.5C136.2,86.6 142.8,80.6 149.2,74.6C149.2,74.6 149.2,74.6 149.2,74.6C151.6,72.2 155.8,72.3 158.0,74.8C158.7,75.5 159.3,76.2 160.0,76.9C161.8,78.7 163.6,80.5 165.3,82.4C166.4,83.4 167.5,84.3 168.5,85.2C169.9,86.4 171.1,87.5 172.1,88.5C174.4,90.8 176.9,93.5 178.7,95.6C179.0,95.9 179.3,96.3 179.5,96.6C181.1,98.1 182.7,99.6 184.2,101.2C184.3,101.3 184.4,101.4 184.5,101.6C185.4,103.2 187.0,104.9 189.5,107.5C190.6,108.6 191.9,109.9 193.4,111.5C194.3,112.5 194.7,113.1 195.0,113.6C195.1,113.8 195.2,113.9 195.2,114.1C195.5,114.5 196.0,114.9 196.6,115.3C197.4,115.8 198.3,116.4 199.1,117.6C201.8,121.3 203.5,122.4 204.8,123.3C205.2,123.5 205.5,123.8 205.8,124.0C205.9,124.1 206.0,124.2 206.0,124.2C208.0,125.8 208.4,129.7 206.9,131.7C206.6,132.1 206.2,132.6 205.7,133.1C204.8,133.9 203.7,135.1 202.9,136.2C202.5,136.7 201.9,137.3 201.1,138.0C200.3,138.7 199.4,139.6 198.5,140.6C196.3,143.1 195.1,144.4 194.1,145.5C193.8,145.8 193.5,146.1 193.3,146.4C192.5,147.2 191.4,148.3 190.4,149.4C189.1,150.7 187.9,152.1 186.9,153.1C184.2,155.6 181.5,158.0 178.8,160.4C178.4,160.8 178.0,161.1 177.6,161.4C175.6,163.1 172.9,163.1 171.4,162.3C169.3,161.1 169.4,159.5 170.0,159.0C170.6,158.4 171.7,158.3 172.4,157.8C172.9,157.4 173.0,157.0 173.0,156.7C173.4,156.3 173.7,155.9 174.1,155.5C176.7,152.8 179.3,150.1 182.0,147.4C185.2,144.2 188.4,140.9 191.7,137.7C194.0,135.5 196.3,133.3 198.6,131.1C198.9,130.9 199.1,130.7 199.4,130.4C200.0,129.7 200.6,129.1 201.2,128.4C200.9,128.5 200.8,128.8 200.9,129.0C200.9,129.1 200.9,129.1 200.9,129.1C200.2,128.3 199.6,127.6 199.1,127.0C198.7,126.5 198.3,126.0 197.9,125.6C197.7,125.3 197.3,125.0 197.0,124.7C195.4,123.1 192.8,120.6 190.6,118.0C189.6,116.9 188.5,115.5 187.5,114.2C186.1,112.3 184.7,110.6 183.9,109.8C182.4,108.5 180.9,106.8 179.6,105.3C178.4,103.9 177.3,102.6 176.5,102.0C175.6,101.4 175.0,100.6 174.1,99.5C173.5,98.8 172.7,97.8 171.6,96.6C170.3,95.2 169.4,94.2 168.7,93.3C167.7,92.0 166.9,91.1 165.5,89.9C164.0,88.6 162.4,87.2 161.3,86.0C160.8,85.4 160.2,84.8 159.6,84.1C158.8,83.3 157.9,82.4 157.2,81.5C156.6,80.8 156.1,80.1 155.8,79.5C155.6,79.4 155.5,79.2 155.4,79.0C155.1,78.7 154.8,78.4 154.5,78.1C154.4,78.0 154.3,77.9 154.2,77.9C154.2,77.9 154.1,77.9 154.1,77.9C153.8,77.9 153.5,78.1 153.3,78.2C153.2,78.3 153.1,78.4 153.0,78.5C152.3,79.2 151.6,79.8 150.9,80.4C150.0,81.2 149.0,81.9 148.1,82.9C147.4,83.6 146.7,84.4 146.0,85.2C144.9,86.3 143.8,87.5 143.0,88.2C142.7,88.5 142.4,88.6 142.1,88.8C142.1,88.8 142.1,88.8 142.1,88.8C142.0,88.8 142.0,88.8 142.0,88.8C140.2,90.7 138.3,92.6 136.5,94.5C136.3,94.7 136.2,94.8 136.0,95.0C135.3,95.9 134.6,96.7 134.2,97.4C133.8,98.0 132.5,99.4 131.1,100.9C130.2,101.9 129.3,102.9 128.6,103.8C128.1,104.3 127.6,104.6 127.1,105.0C126.6,105.3 126.0,105.7 125.6,106.2C125.4,106.4 125.2,106.6 125.0,106.9C125.0,106.9 125.0,106.9 125.0,106.9C125.0,106.9 125.1,106.9 125.1,106.9C125.2,106.8 125.2,106.7 125.1,106.7C125.0,106.6 124.9,106.6 124.9,106.6C124.9,106.7 124.9,106.7 124.9,106.7C126.3,108.0 127.7,109.4 129.1,110.7C129.5,111.0 129.8,111.1 130.1,111.2C130.3,111.3 130.5,111.3 130.8,111.4C131.1,111.4 131.4,111.4 131.7,111.6C132.0,111.7 132.2,111.9 132.4,112.1C132.4,112.2 132.4,112.2 132.4,112.3C132.5,112.4 132.5,112.5 132.5,112.5C132.6,112.6 132.7,112.6 132.7,112.6C132.9,112.7 133.0,112.8 133.2,112.9C133.9,113.6 134.6,114.4 135.3,115.1C136.1,116.0 136.8,116.8 137.5,117.4C138.2,118.1 139.1,119.2 140.0,120.4C140.6,121.1 141.2,121.9 141.8,122.5C142.4,123.2 143.0,123.8 143.7,124.3C144.4,125.0 145.2,125.7 145.7,126.3C145.7,126.3 145.9,127.0 145.9,127.0C145.9,127.2 146.0,127.5 146.1,127.7C146.8,128.5 147.5,129.2 148.3,130.0C148.3,130.0 148.3,130.0 148.4,130.1C148.4,130.1 148.4,130.1 148.4,130.1C149.3,130.4 150.5,130.9 151.4,132.3C151.7,132.7 151.7,133.0 151.8,133.2C151.9,133.5 151.9,133.7 152.1,134.0C152.3,134.3 152.7,134.5 153.1,134.8C153.6,135.1 154.2,135.5 154.6,136.1C154.6,136.2 154.6,136.2 154.7,136.3C155.0,136.7 155.4,137.4 155.7,138.1C157.2,139.8 158.7,141.5 160.2,143.2C162.7,146.0 165.2,148.8 167.6,151.7C168.9,153.0 169.8,154.6 170.2,155.9C170.7,157.3 170.6,158.4 170.0,159.0C169.4,159.6 168.3,159.6 166.9,159.1C165.6,158.6 164.1,157.6 162.8,156.4C160.6,154.3 158.4,152.3 156.2,150.2C156.1,150.1 156.0,150.0 155.9,149.9C155.0,149.2 154.1,148.6 153.1,147.9C152.9,147.8 152.7,147.7 152.5,147.5Z\"/><path fill=\"#EEEEEE\" d=\"M165.3,107.8C160.3,107 155.5,110.3 154.7,115.4C153.8,120.4 157.2,125.1 162.2,126.0C167.3,126.8 172.0,123.4 172.8,118.4C173.7,113.4 170.3,108.6 165.3,107.8Z\"/><path fill=\"#93E2FF\" d=\"M345.7,239.4C347.3,238.3 350.8,237.1 352.7,236.4C352.7,236.4 352.7,236.3 352.8,236.3C353.2,236.2 353.6,236.0 354.1,235.8C355.3,235.3 356.9,234.7 360.3,233.6C361.2,233.2 362.2,232.8 363.1,232.4C372.3,228.6 381.6,225.1 391.0,221.6C393.4,220.6 396.4,221.1 398.4,222.7C398.7,222.9 398.9,223.1 399.1,223.3C399.8,224.0 400.4,224.8 400.8,225.8C401.8,228.1 402.9,230.6 403.4,232.4C404.3,235.0 404.9,236.8 405.3,238.3C408.4,246.6 411.5,254.9 414.8,263.2L414.8,263.2C416.1,266.2 414.5,270.0 411.4,271.2C410.5,271.6 409.6,271.9 408.7,272.3C406.3,273.3 404.0,274.3 401.6,275.3C400.3,275.9 399.0,276.6 397.8,277.1C396.2,278.0 394.7,278.7 393.5,279.3C390.5,280.6 387.0,281.9 384.4,282.8C384.0,283.0 383.6,283.1 383.2,283.3C381.2,284.1 379.2,285.0 377.2,285.9C377.1,285.9 376.9,286.0 376.8,286.0C374.9,286.3 372.7,287.2 369.4,288.5C367.9,289.2 366.3,289.9 364.3,290.6C363.0,291.1 362.2,291.3 361.7,291.3C361.5,291.4 361.3,291.4 361.2,291.4C360.6,291.5 360.1,291.9 359.5,292.3C358.8,292.8 357.8,293.4 356.5,293.7C352.0,294.9 350.3,296.0 349.1,296.9C348.7,297.2 348.3,297.4 348.0,297.6C347.9,297.7 347.8,297.7 347.7,297.7C345.5,298.9 341.8,297.9 340.5,295.7C340.2,295.3 339.9,294.8 339.6,294.1C339.2,293.0 338.4,291.6 337.8,290.4C337.5,289.9 337.1,289.0 336.7,288.1C336.3,287.1 335.8,285.9 335.3,284.7C333.8,281.7 333.0,280.1 332.4,278.8C332.2,278.4 332.0,278.1 331.8,277.7C331.3,276.6 330.7,275.3 330.1,273.9C329.3,272.3 328.5,270.6 327.9,269.3C326.6,265.9 325.3,262.5 324.1,259.1C324.1,259.1 323.7,258.1 323.6,257.6C322.7,255.1 323.7,252.6 325.0,251.6C326.9,250.0 328.4,250.7 328.7,251.4C329.0,252.2 328.6,253.3 328.9,254.1C329.0,254.7 329.4,255.0 329.6,255.1C329.9,255.6 330.1,256.0 330.4,256.5C331.9,259.9 333.5,263.4 335.0,266.8C336.9,271.0 338.7,275.2 340.4,279.4C341.7,282.4 342.9,285.4 344.1,288.3C344.2,288.6 344.3,288.9 344.4,289.2C344.8,290.1 345.2,290.9 345.6,291.6C345.7,291.6 345.4,291.2 345.2,291.2C345.1,291.2 345.1,291.2 345.0,291.2C346.1,290.7 347.0,290.5 347.7,290.3C348.4,290.1 348.9,289.9 349.5,289.7C349.8,289.5 350.2,289.3 350.7,289.1C352.7,288.2 356.0,286.7 359.2,285.7C360.6,285.7 362.3,284.7 363.9,284.2C366.2,283.5 368.3,282.9 369.3,282.4C371.1,281.5 373.2,280.8 375.0,280.1C376.8,279.5 378.4,278.9 379.2,278.4C380.2,277.8 381.1,277.5 382.4,277.1C383.4,276.8 384.5,276.4 386.1,275.8C387.9,275.1 389.1,274.7 390.2,274.4C391.8,273.9 392.9,273.5 394.5,272.7C396.3,271.7 398.2,270.8 399.8,270.2C400.5,269.9 401.3,269.6 402.1,269.3C403.2,268.8 404.3,268.3 405.4,268.0C406.3,267.7 407.1,267.5 407.8,267.4C408.0,267.4 408.2,267.3 408.4,267.3C408.8,267.1 409.2,266.9 409.6,266.8C409.7,266.7 409.8,266.7 409.9,266.6C409.9,266.5 409.9,266.5 409.9,266.4C410.0,266.1 410.0,265.8 409.9,265.6C409.8,265.4 409.8,265.3 409.8,265.2C409.4,264.3 409.1,263.4 408.8,262.5C408.4,261.4 408.0,260.3 407.5,259.0C407.1,258.1 406.6,257.2 406.1,256.2C405.4,254.8 404.8,253.4 404.4,252.4C404.3,252.0 404.2,251.6 404.2,251.3C404.2,251.3 404.2,251.3 404.2,251.3C404.2,251.2 404.2,251.2 404.2,251.2C403.1,248.8 402.0,246.4 400.9,244.0C400.8,243.8 400.7,243.6 400.6,243.4C400.1,242.4 399.5,241.4 399.1,240.8C398.6,240.2 397.8,238.5 396.9,236.6C396.3,235.4 395.7,234.2 395.2,233.2C394.9,232.6 394.8,232.0 394.6,231.3C394.5,230.8 394.4,230.1 394.1,229.5C394.0,229.3 393.8,229.0 393.7,228.7C393.7,228.7 393.7,228.7 393.6,228.7C393.6,228.8 393.6,228.8 393.6,228.9C393.6,228.9 393.7,228.9 393.8,228.9C393.9,228.8 393.9,228.8 393.9,228.7C393.9,228.7 393.9,228.7 393.9,228.7C392.1,229.5 390.3,230.3 388.5,231.1C388.2,231.4 387.9,231.6 387.7,231.9C387.6,232.1 387.5,232.3 387.4,232.5C387.2,232.7 387.1,233.0 386.8,233.3C386.6,233.5 386.3,233.6 386.1,233.7C386.0,233.7 385.9,233.7 385.8,233.7C385.8,233.7 385.7,233.6 385.6,233.7C385.5,233.7 385.5,233.8 385.4,233.8C385.3,233.9 385.2,234.1 385.0,234.2C384.1,234.5 383.2,234.9 382.2,235.3C381.1,235.7 380.1,236.1 379.3,236.4C378.3,236.9 377.0,237.3 375.6,237.7C374.7,238.0 373.7,238.3 372.9,238.6C372.1,238.9 371.3,239.3 370.6,239.7C369.7,240.1 368.8,240.6 368.0,240.8C367.8,240.9 367.6,240.8 367.3,240.8C367.0,240.7 366.8,240.7 366.5,240.7C365.5,241.1 364.6,241.5 363.6,241.9C363.6,241.9 363.5,241.9 363.5,242.0L363.5,242.0C362.9,242.7 362.0,243.6 360.3,244.0C359.9,244.0 359.6,244.0 359.3,244.0C359.0,243.9 358.8,243.9 358.5,244.0C358.1,244.1 357.8,244.3 357.4,244.6C356.9,244.9 356.3,245.4 355.6,245.5C355.5,245.5 355.5,245.5 355.4,245.5C354.9,245.6 354.1,245.8 353.3,245.8C351.2,246.6 349.1,247.4 347.0,248.1C343.4,249.4 339.9,250.7 336.3,251.9C334.6,252.6 332.8,252.9 331.4,252.8C330.0,252.7 329.0,252.2 328.7,251.4C328.3,250.7 328.7,249.6 329.7,248.6C330.6,247.5 332.1,246.4 333.7,245.7C336.4,244.4 339.1,243.1 341.8,241.9C342.0,241.8 342.1,241.7 342.3,241.6C343.3,241.1 344.2,240.5 345.1,239.8C345.3,239.7 345.5,239.5 345.7,239.4Z\"/><path fill=\"#EEEEEE\" d=\"M378.0,265.9C380.6,261.5 379.2,255.8 374.9,253.2C370.5,250.6 364.8,252.0 362.2,256.3C359.6,260.7 361.0,266.4 365.3,269.0C369.7,271.6 375.4,270.2 378.0,265.9Z\"/></g></svg>"};
var LICO={fig:'<svg class="lg" viewBox="0 0 38 57" aria-hidden="true"><path fill="#1ABCFE" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/><path fill="#0ACF83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/><path fill="#FF7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/><path fill="#F24E1E" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/><path fill="#A259FF" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/></svg>',
  gh:'<svg class="lg" viewBox="0 0 24 24" aria-hidden="true"><path fill="#131316" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8 0 3.2.9.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1 .9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"/></svg>',
  no:'<svg class="lg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="4" fill="#fff" stroke="#131316" stroke-width="1.8"/><path d="M8.5 16.8V7.2l7 9.6V7.2" fill="none" stroke="#131316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
/* every frame on the cover canvas: key, Figma layer name, x, y, width (world px) */
/* the canvas reads top to bottom like the story: cover, iterations, components, final screens */
var ACVS=[["01  Cover",0,0,1000,580],["02  Iterations: versions that evolved",1080,0,1340,820],["03  Components",0,660,1000,1520],["04  Final screens",1080,900,1340,1280]];
var ACVF=[
  ["f_on","Onboarding v1",1120,110,300],["f_home","Home v1",1445,110,300],["f_add","Add tray v1",1770,110,300],["f_chat","Alter AI v1",2095,110,300],
  ["nav","Nav bar / 4 states",60,770,380],["fab","Add button / tray",500,770,440],["cNote","Card / Note",500,1000,440],["inp","Input / Spill thoughts",500,1200,440],
  ["x_home","Home",1120,1010,230],["x_addtray","Home / Add open",1382,1010,230],["x_notes","Notes",1644,1010,230],["x_detail","Card detail",1906,1010,230],["x_canvas","Canvas board",2168,1010,230],
  ["x_chat","Alter AI",1120,1600,230],["x_upcoming","Upcoming",1382,1600,230],["x_memories","Memories",1644,1600,230],["x_widget","Widget",1906,1600,420]];
var ACV={alter:{html:function(p){
  var w=ACVS.map(function(s){return '<div class="asec" style="left:'+s[1]+'px;top:'+s[2]+'px;width:'+s[3]+'px;height:'+s[4]+'px"><span class="asn">'+s[0]+'</span></div>'}).join("");
  w+='<div class="acv-logo af" data-n="Cover" style="left:70px;top:100px;width:860px;height:380px"><span class="an">Cover</span>'+
    '<span class="acv-face">'+ALT.face+'</span><span class="acv-word">'+ALT.word+'</span></div>';
  ACVF.forEach(function(f,i){var a=ALT[f[0]],h=Math.round(f[4]*a.h/a.w);
    w+='<div class="af" data-n="'+f[1]+'" data-wh="'+a.w+'×'+a.h+'" style="left:'+f[2]+'px;top:'+f[3]+'px;width:'+f[4]+'px;height:'+h+'px;--i:'+i+'"><span class="an">'+f[1]+'</span><img alt="'+f[1]+'" draggable="false" src="'+a.u+'"></div>'});
  return '<div class="acv" id="acv" tabindex="0" aria-label="Alter design canvas. Drag to move around, use the zoom buttons or ctrl and scroll to zoom.">'+
    '<div class="acv-top"><span class="acv-file"><i>'+ALT.face+'</i>Alter canvas</span><span class="acv-tip">Designed in Figma · Built in Kotlin + Compose</span></div>'+
    '<div class="acv-world">'+w+'</div>'+
    '<div class="acv-bar"><button type="button" data-z="-" aria-label="Zoom out">&minus;</button><span class="acv-pct">100%</span><button type="button" data-z="+" aria-label="Zoom in">+</button><button type="button" data-z="fit" class="zfit">Fit all</button></div>'+
    '<p class="acv-hint"><span class="fine">Drag to move · scroll to zoom · click a frame</span><span class="touch">Tap to explore</span></p>'+
    '<button type="button" class="acv-done">Done</button></div>'}}};

/* the screens section: everything scattered on one table, with depth */

/* =================== ROUND 14: Track It canvas, board and components =================== */
var TRK=ALT; /* Track It's assets ride in the same embedded file: t_ screens, tw_ wireframes, tk_ component sets */
["home","add","voice","scan","analysis","settings","widget"].forEach(function(k){CSK["tw_"+k]=TRK["tw_"+k].u});
ACV["track-it"]={html:function(p){
  var SEC=[["01  Cover",0,0,1000,640],["02  Wireframes",1080,0,1340,640],["03  Components",0,720,1000,800],["04  Final screens",1080,720,1340,1360]];
  var FR=[["tw_home","Home",1128,170,164],["tw_add","Add",1308,170,164],["tw_voice","Voice",1488,170,164],["tw_scan","Scan",1668,170,164],["tw_analysis","Analysis",1848,170,164],["tw_settings","Settings",2028,170,164],["tw_widget","Widget",2208,170,164],
    ["tk_dock","Dock",60,890,420],["t_dictate","Tap to dictate",520,913,420],["tk_menu","Menu",60,1100,190],["tk_cal","Date picker",290,1100,290],["t_widget","Widget",620,1100,290],
    ["t_home","Home",1120,890,230],["t_swipe","Swipe",1382,890,230],["t_add","Add",1644,890,230],["t_voice","Voice",1906,890,230],["t_scan","Scan",2168,890,230],
    ["t_calendar","Calendar",1120,1480,230],["t_analysis","Analysis",1382,1480,230],["t_settings","Settings",1644,1480,230],["t_widget","Widget",1906,1480,300]];
  var w=SEC.map(function(s){return '<div class="asec" style="left:'+s[1]+'px;top:'+s[2]+'px;width:'+s[3]+'px;height:'+s[4]+'px"><span class="asn">'+s[0]+'</span></div>'}).join("");
  w+='<div class="acv-logo af trk-cover" data-n="Cover" style="left:70px;top:150px;width:860px;height:380px"><span class="an">Cover</span>'+
    '<span class="trk-cvi">'+TRK.t_icon+'</span><span class="trk-cvt"><b>Track It</b><em>Keep your <i>Expenses</i> on Track.</em></span></div>';
  FR.forEach(function(f,i){var a=TRK[f[0]],h=Math.round(f[4]*a.h/a.w);
    w+='<div class="af" data-n="'+f[1]+'" data-wh="'+a.w+'×'+a.h+'" style="left:'+f[2]+'px;top:'+f[3]+'px;width:'+f[4]+'px;height:'+h+'px;--i:'+i+'"><span class="an">'+f[1]+'</span><img alt="'+f[1]+'" draggable="false" src="'+a.u+'"></div>'});
  return '<div class="acv" id="acv" tabindex="0" aria-label="Track It design canvas. Drag to move around, use the zoom buttons or ctrl and scroll to zoom.">'+
    '<div class="acv-top"><span class="acv-file"><i>'+TRK.t_icon+'</i>Track It canvas</span><span class="acv-tip">Designed in Figma · Built in Kotlin + Compose</span></div>'+
    '<div class="acv-world">'+w+'</div>'+
    '<div class="acv-bar"><button type="button" data-z="-" aria-label="Zoom out">&minus;</button><span class="acv-pct">100%</span><button type="button" data-z="+" aria-label="Zoom in">+</button><button type="button" data-z="fit" class="zfit">Fit all</button></div>'+
    '<p class="acv-hint"><span class="fine">Drag to move · scroll to zoom · click a frame</span><span class="touch">Tap to explore</span></p>'+
    '<button type="button" class="acv-done">Done</button></div>'}};

/* the final screens board: same table, same depth, same lightbox as Alter's */
var TSTG=[["t_home","Home"],["t_swipe","Swipe to act"],["t_add","Add a transaction"],["t_voice","Voice entry"],["t_scan","Scan a receipt"],["t_calendar","Pick a day"],["t_analysis","Analysis"],["t_settings","Settings"]].map(function(t,i){
    var mc=i%2,mr=Math.floor(i/2);
    return [t[0],t[1],.8+i*12.35,i%2?15:8,12.6,[-3,2.5,-1.5,3,-2.5,1.5,-3,2][i],  mc?52:3,3+mr*25,45]});
TSTG.push(["t_widget","The widget",44.5,71,11,-2,  0,0,0]);
function trkStageHTML(){
  var h='<div class="stg" id="stg"><div class="stg-in">';
  TSTG.forEach(function(t,i){var a=TRK[t[0]];
    h+='<figure class="stp'+(t[8]?'':' dh')+'" data-k="'+t[0]+'" data-cap="'+t[1]+'" tabindex="0" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--w:'+t[4]+'%;--r:'+t[5]+'deg;--mx:'+t[6]+'%;--my:'+t[7]+'%;--mw:'+t[8]+'%;--ar:'+a.w+'/'+a.h+';--i:'+i+'">'+
      '<img loading="lazy" alt="'+t[1]+'" draggable="false" src="'+a.u+'"></figure>'+
      '<span class="slab'+(t[8]?'':' dh')+'" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--mx:'+t[6]+'%;--my:'+t[7]+'%;--i:'+i+'"><b>'+("0"+(i+1)).slice(-2)+'</b>'+t[1]+'</span>'});
  return h+'</div></div>'}

/* ---- components: the Figma sets, then three interactions rebuilt from the Kotlin ---- */
var TIC={scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8h8M7 12h10M7 16h6"/>',
  plus:'<path d="M5 12h14M12 5v14"/>',mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  pen:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',rep:'<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/>',
  cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  Food:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/>',
  Transport:'<path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 12h14"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
  Shopping:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/>',
  Bills:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM16 8h-6M16 12H8M13 16H8"/>',
  Entertainment:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2ZM13 5v2M13 17v2M13 11v2"/>',
  Other:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>'};
/* category colours straight from ExpenseCategory in MainActivity.kt */
var TCAT={Food:"#BF5AF2",Transport:"#2563EB",Shopping:"#FF9F0A",Bills:"#FF453A",Entertainment:"#FF5EA2",Other:"#8E8E93"};
function ti(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+TIC[k]+'</svg>'}
function inr(n){return "₹"+Math.round(n).toLocaleString("en-IN")}
function trkRow(d,cat,amt,sub,rep){var c=TCAT[cat];
  return '<span class="trk-av" style="--cc:'+c+'">'+ti(cat)+'</span><span class="trk-rt"><b>'+d+(rep?' <i class="trk-rep">'+ti("rep")+'</i>':'')+'</b><small>'+sub+'</small></span><span class="trk-amt">-'+inr(amt)+'</span>'}
function trkCompsHTML(){
  var sets=[["tk_dock","Action dock","scan, add, voice",3],["t_dictate","Tap to dictate","voice prompt",3],["tk_menu","Menu","closed, open",2],["tk_cal","Date picker","month grid",2],["t_widget","Home widget","2×2",2]];
  var h='<div class="trk-sets">'+sets.map(function(t){var a=TRK[t[0]];return '<figure class="cset" data-k="'+t[0]+'" data-cap="'+t[1]+'" tabindex="0" style="grid-column:span '+t[3]+'"><span class="cset-n"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l2.2 2.2L6 5.4 3.8 3.2zM6 6.6l2.2 2.2L6 11 3.8 8.8zM1 6l2.2-2.2L5.4 6 3.2 8.2zM6.6 6l2.2-2.2L11 6 8.8 8.2z"/></svg>'+t[1]+'<small>'+t[2]+'</small></span><div class="cset-b"><img loading="lazy" alt="'+t[1]+' component set" src="'+a.u+'"></div></figure>'}).join("")+'</div>';
  h+='<div class="trk-wrap">';
  /* 1. the dock and the add sheet */
  var chips=[["Food","Food"],["Travel","Transport"],["Shopping","Shopping"],["Bills","Bills"],["Entertain","Entertainment"],["Other","Other"]];
  h+='<div class="trk-demo"><div class="trk-ds trk-dk" data-spent="18414" data-today="1240" data-left="31586">'+
    '<div class="trk-hd"><span>Expenses for <i>Today</i></span><b class="trk-big"><sup>₹</sup><em>1,240</em></b><span class="trk-pills"><i>Spent: <em class="trk-sp">₹18,414</em></i><i>Left: <em class="trk-lf">₹31,586</em></i></span></div>'+
    '<div class="trk-dock"><button type="button" class="trk-db" aria-label="Scan receipt">'+ti("scan")+'</button><button type="button" class="trk-db trk-add" aria-label="Add manually" aria-expanded="false">'+ti("plus")+'</button><button type="button" class="trk-db" aria-label="Voice command">'+ti("mic")+'</button></div>'+
    '<div class="trk-dim"></div><div class="trk-sheet" role="dialog" aria-label="Add Transaction"><div class="trk-sh-h"><b>'+ti("cash")+'Add Transaction</b><button type="button" class="trk-x" aria-label="Close">'+ti("x")+'</button></div>'+
    '<div class="trk-chips">'+chips.map(function(c,i){return '<button type="button" class="trk-chip'+(i?'':' on')+'" data-c="'+c[1]+'" style="--cc:'+TCAT[c[1]]+'">'+c[0]+'</button>'}).join("")+'</div>'+
    '<div class="trk-in"><input class="trk-d" value="Chai" aria-label="What was it for?" placeholder="What was it for?"><input class="trk-a" value="40" inputmode="numeric" aria-label="How much you spent?" placeholder="How much?"></div>'+
    '<button type="button" class="trk-save">Save Expense</button></div></div>'+
    '<p><b>The dock and the add sheet</b>Three buttons, and the middle one opens the sheet. Pick a category, set the amount, save. Watch the day’s number move.</p></div>';
  /* 2. swipe to act */
  h+='<div class="trk-demo"><div class="trk-ds trk-sw"><span class="trk-lbl">Recent Activity</span><ul class="trk-list">'+
    [["Lunch at Mama's","Food",320,"1:30 PM • Food"],["Uber to Office","Transport",150,"9:15 AM • Transport"],["Netflix","Entertainment",199,"Yesterday • Entertainment",1]].map(function(r){
      return '<li><span class="trk-act"><i class="trk-del">'+ti("trash")+'</i><i class="trk-edt">'+ti("pen")+'</i></span><div class="trk-card" tabindex="0">'+trkRow(r[0],r[1],r[2],r[3],r[4])+'</div></li>'}).join("")+
    '</ul><span class="trk-tip">Drag a card left or right</span><button type="button" class="trk-re">Bring them back</button></div>'+
    '<p><b>Swipe to act</b>Right to delete, left to edit. The two things you do most to an expense, one gesture each, no menus.</p></div>';
  /* 3. say it once: the real clause parser, ported */
  h+='<div class="trk-demo"><div class="trk-ds trk-vo"><span class="trk-vh"><i></i>Voice Entry</span>'+
    '<button type="button" class="trk-mic" aria-label="Start listening">'+ti("mic")+'</button><span class="trk-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>'+
    '<span class="trk-st">Tap the mic</span><span class="trk-tx"></span><ul class="trk-res"></ul>'+
    '<label class="trk-say"><span>Try your own</span><input value="paid 450 on zomato and 150 for coffee" aria-label="What you would say"></label></div>'+
    '<p><b>Say it once</b>The clause parser from the app, ported line for line. It splits on and, also, then, finds the amount, and guesses the category. Try your own sentence.</p></div>';
  return h+'</div>'}

/* =================== ROUND 16: Washio assets, canvas, board, components =================== */
var WSH={"wf_home": {"u": "/assets/media/170706fc3cb1e9e1.webp", "w": 480, "h": 1004}, "wf_search": {"u": "/assets/media/1e182d282d489f17.webp", "w": 480, "h": 1004}, "wf_results": {"u": "/assets/media/8e4770a13b353fec.webp", "w": 480, "h": 1004}, "wf_vendor": {"u": "/assets/media/fec98280e7dba919.webp", "w": 480, "h": 1004}, "wf_items": {"u": "/assets/media/f606c99a5e86cf0d.webp", "w": 480, "h": 1004}, "wf_checkout": {"u": "/assets/media/a73dc595eee4a712.webp", "w": 480, "h": 1007}, "wf_booked": {"u": "/assets/media/e52a59d452d6126e.webp", "w": 480, "h": 1007}, "wf_track": {"u": "/assets/media/bba6f0b800c60e69.webp", "w": 480, "h": 1007}, "wf_homeorder": {"u": "/assets/media/5d80be8a231e63aa.webp", "w": 480, "h": 1007}, "wf_profile": {"u": "/assets/media/b021e7f0f09fb171.webp", "w": 480, "h": 1007}, "wi_greet": {"u": "/assets/media/21b13c61d68133d6.webp", "w": 360, "h": 802}, "wi_outdel": {"u": "/assets/media/2ff6426e697b604b.webp", "w": 360, "h": 802}, "wi_vendor": {"u": "/assets/media/eb6c58fea02383b3.webp", "w": 360, "h": 753}, "wi_pay": {"u": "/assets/media/b70cd80abdab100a.webp", "w": 360, "h": 753}, "wi_map": {"u": "/assets/media/4d1e5f857c26b5b3.webp", "w": 360, "h": 724}, "wk_icons": {"u": "/assets/media/a65eca6181bb0392.webp", "w": 700, "h": 91}, "wk_bagbtn": {"u": "/assets/media/2f2ca247217ffdb7.webp", "w": 300, "h": 254}, "wk_kg": {"u": "/assets/media/9c978a011706cb14.webp", "w": 200, "h": 320}, "wk_pcs": {"u": "/assets/media/3c8ed4b8ee97c4ab.webp", "w": 180, "h": 342}, "wk_back": {"u": "/assets/media/69ac74c363dfe09d.webp", "w": 400, "h": 492}, "wk_3d": {"u": "/assets/media/dcc710bba0a45b62.webp", "w": 520, "h": 400}, "wl_0": {"u": "/assets/media/73b786e79d3c448e.webp", "w": 300, "h": 654}, "wl_1": {"u": "/assets/media/4906ead12797af31.webp", "w": 300, "h": 652}, "wl_2": {"u": "/assets/media/7428c17271c74085.webp", "w": 300, "h": 761}, "wl_3": {"u": "/assets/media/cd75d3d001bfdaf2.webp", "w": 300, "h": 651}, "wl_4": {"u": "/assets/media/6f68d4e9975a5172.webp", "w": 300, "h": 650}, "wl_5": {"u": "/assets/media/29c499968b57580c.webp", "w": 300, "h": 783}, "wl_6": {"u": "/assets/media/3f582f36cd2f2d99.webp", "w": 300, "h": 784}, "wl_7": {"u": "/assets/media/bd587bb57a877369.webp", "w": 300, "h": 907}, "wl_8": {"u": "/assets/media/d30d4d9ece0f9aa2.webp", "w": 300, "h": 651}, "ws_07": {"u": "/assets/media/99891306202e7aea.webp", "w": 480, "h": 681}, "ws_10": {"u": "/assets/media/07aabb81e86086ca.webp", "w": 480, "h": 675}, "ws_18": {"u": "/assets/media/8c579e2c71e42531.webp", "w": 443, "h": 695}, "ws_05": {"u": "/assets/media/385fbb2a5087e17d.webp", "w": 480, "h": 692}, "ws_16": {"u": "/assets/media/f20509a9f29314f1.webp", "w": 480, "h": 670}, "w_ia": {"u": "/assets/media/02a14dbc85129014.webp", "w": 1700, "h": 507}, "wa_item_shirt": {"u": "/assets/media/6f4dcc3d6c64518b.webp", "w": 140, "h": 140}, "wa_item_tshirt": {"u": "/assets/media/030e0b1c08244d19.webp", "w": 140, "h": 140}, "wa_item_jeans": {"u": "/assets/media/63311bb2d692897d.webp", "w": 140, "h": 140}, "wa_item_trousers": {"u": "/assets/media/5b8292f673e965d4.webp", "w": 140, "h": 140}, "wa_item_kurta": {"u": "/assets/media/34d2937a48c27548.webp", "w": 140, "h": 168}};
var SITESHOT={"fxkit":{"u":"/assets/media/2e615ded45405f7a.webp","w":900,"h":464},"mistline":{"u":"/assets/media/a282272f7a8cf5fa.webp","w":900,"h":456}};
Object.assign(ALT,SITESHOT); /* Aditya's two website screenshots, for the story canvas drop */
Object.assign(ALT,WSH); /* one asset table: iterations, component sets and the board all read from ALT */
["ws_07","ws_10","ws_18","ws_05","ws_16"].forEach(function(k){CSK[k]=WSH[k].u});
ACV.washio={html:function(p){
  /* the canvas shows what earns its place: wireframes (the structure), the evolution, the
     components that are actually live, the final screens. The paper sketches and the site map
     stay on the page itself; sixty-plus Figma frames stay in the Figma file, one click away. */
  var SEC=[["01  Cover",0,0,1000,640],["02  Wireframes",1080,0,1340,620],["03  Iterations: versions that evolved",0,720,1000,960],["04  Components",0,1760,1000,1120],["05  Final screens",1080,700,1340,1360]];
  var FR=[
    ["wl_0","Welcome",1112,170,124],["wl_1","Login",1256,170,124],["wl_2","Register",1400,170,124],["wl_3","Home",1544,170,124],["wl_4","Profile",1688,170,124],["wl_5","Vendor",1832,170,124],["wl_6","Search",1976,170,124],["wl_7","Bundle",2120,170,124],["wl_8","Payment",2264,170,124],
    ["wi_greet","Greeting",30,890,145],["wi_outdel","Order card",190,890,145],
    ["wi_vendor","Vendor",30,1290,145],["wi_pay","Pickup & pay",190,1290,145],["wi_map","Map tracking",350,1290,145],
    ["wk_bagbtn","View bag",40,1930,220],["wk_back","Delivery back / 4",300,1930,260],["wk_kg","Stepper / kg",600,1930,90],["wk_pcs","Stepper / pcs",730,1930,80],
    ["wk_3d","3D assets",40,2230,260],["wk_icons","Icons",340,2230,260],
    ["wf_home","Home",1120,870,230],["wf_search","Search",1382,870,230],["wf_results","Results",1644,870,230],["wf_vendor","Vendor",1906,870,230],["wf_items","Garments",2168,870,230],
    ["wf_checkout","Checkout",1120,1470,230],["wf_booked","Booked",1382,1470,230],["wf_track","Tracking",1644,1470,230],["wf_homeorder","Home, order live",1906,1470,230],["wf_profile","Profile",2168,1470,230]];
  var w=SEC.map(function(s){return '<div class="asec" style="left:'+s[1]+'px;top:'+s[2]+'px;width:'+s[3]+'px;height:'+s[4]+'px"><span class="asn">'+s[0]+'</span></div>'}).join("");
  w+='<div class="af wsh-cover" data-n="Cover" data-wh="860×380" style="left:70px;top:150px;width:860px;height:380px"><span class="an">Cover</span>'+
    '<span class="wsh-cvt"><b class="wsh-word wsh-wordbig">washio</b><em>Laundry, minus the effort.</em><small>UX · UI · Design system</small></span></div>';
  FR.forEach(function(f,i){var a=ALT[f[0]],h=Math.round(f[4]*a.h/a.w);
    w+='<div class="af'+(f[0].charAt(1)==="k"?' wsh-lt':'')+'" data-n="'+f[1]+'" data-wh="'+a.w+'×'+a.h+'" style="left:'+f[2]+'px;top:'+f[3]+'px;width:'+f[4]+'px;height:'+h+'px;--i:'+i+'"><span class="an">'+f[1]+'</span><img alt="'+f[1]+'" draggable="false" src="'+a.u+'"></div>'});
  return '<div class="acv" id="acv" tabindex="0" aria-label="Washio design canvas. Drag to move around, use the zoom buttons or ctrl and scroll to zoom.">'+
    '<div class="acv-top"><span class="acv-file"><b class="wsh-word">washio</b>canvas</span><span class="acv-tip">Wireframes · Iterations · Prototype</span></div>'+
    '<div class="acv-world">'+w+'</div>'+
    '<div class="acv-bar"><button type="button" data-z="-" aria-label="Zoom out">&minus;</button><span class="acv-pct">100%</span><button type="button" data-z="+" aria-label="Zoom in">+</button><button type="button" data-z="fit" class="zfit">Fit all</button></div>'+
    '<p class="acv-hint"><span class="fine">Drag to move · scroll to zoom · click a frame</span><span class="touch">Tap to explore</span></p>'+
    '<button type="button" class="acv-done">Done</button></div>'}};

/* the final screens board: two rows of five on the same table as Alter's */
var WSTG=[["wf_home","Home"],["wf_search","Search"],["wf_results","Results"],["wf_vendor","A vendor"],["wf_items","Their garments"],["wf_checkout","Checkout"],["wf_booked","Booked"],["wf_track","Tracking"],["wf_homeorder","Home, order live"],["wf_profile","Profile"]].map(function(t,i){
  var mc=i%2,mr=Math.floor(i/2);
  return [t[0],t[1],1.6+(i%5)*19.6,i<5?6.5:53.5,16.4,[-2.5,2,-1.5,2.5,-2,1.5,-2.5,2,-1.5,2.5][i],  mc?52:3,2+mr*19.6,45]});
function wshStageHTML(){
  var h='<div class="stg wsh" id="stg"><div class="stg-in">';
  WSTG.forEach(function(t,i){var a=ALT[t[0]];
    h+='<figure class="stp" data-k="'+t[0]+'" data-cap="'+t[1]+'" tabindex="0" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--w:'+t[4]+'%;--r:'+t[5]+'deg;--mx:'+t[6]+'%;--my:'+t[7]+'%;--mw:'+t[8]+'%;--ar:'+a.w+'/'+a.h+';--i:'+i+'">'+
      '<img loading="lazy" alt="'+t[1]+'" draggable="false" src="'+a.u+'"></figure>'+
      '<span class="slab" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--mx:'+t[6]+'%;--my:'+t[7]+'%;--i:'+i+'"><b>'+("0"+(i+1)).slice(-2)+'</b>'+t[1]+'</span>'});
  return h+'</div></div>'}

/* ---- components: the Figma sets, then three interactions rebuilt from the final screens ---- */
var WIC={arr:'<path d="M7 17 17 7M9 7h8v8"/>',back:'<path d="M19 12H5M11 5l-7 7 7 7"/>',chev:'<path d="m6 9 6 6 6-6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  van:'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',call:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  chk:'<path d="M5 12.5l4.5 4.5L19 7"/>'};
function wi(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+WIC[k]+'</svg>'}
function wshCompsHTML(){
  var sets=[["wk_bagbtn","View bag","default, pressed",2],["wk_back","Delivery back","4 states",2],
    ["wk_kg","Stepper","by the kilo",1],["wk_pcs","Stepper","by the piece",1],["wk_3d","3D assets","one family",2],["wk_icons","Icons","line, 1.5px",2]];
  var h='<div class="trk-sets wsh-sets">'+sets.map(function(t){var a=ALT[t[0]];return '<figure class="cset" data-k="'+t[0]+'" data-cap="'+t[1]+'" tabindex="0" style="grid-column:span '+t[3]+'"><span class="cset-n"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l2.2 2.2L6 5.4 3.8 3.2zM6 6.6l2.2 2.2L6 11 3.8 8.8zM1 6l2.2-2.2L5.4 6 3.2 8.2zM6.6 6l2.2-2.2L11 6 8.8 8.2z"/></svg>'+t[1]+'<small>'+t[2]+'</small></span><div class="cset-b"><img loading="lazy" alt="'+t[1]+' component set" src="'+a.u+'"></div></figure>'}).join("")+'</div>';
  h+='<div class="wsh-wrap">';
  /* 1. fill the bag */
  var items=[["shirt","Shirt","Formal shirt, casual shirt, linen"],["tshirt","T-Shirt / Top","Polo, tank top, crop top"],["jeans","Jeans","Denim jeans, denim trousers"],["kurta","Kurta / Kurti","Kurti, casual kurta"]];
  h+='<div class="wsh-demo"><div class="wsh-ds wsh-bag" data-n="0"><span class="wsh-sh">Wash &amp; Fold '+wi("chev")+'</span><ul class="wsh-items">'+items.map(function(t){
      return '<li><img alt="" src="'+ALT["wa_item_"+t[0]].u+'"><span class="wsh-it"><b>'+t[1]+' <i>'+wi("info")+'</i></b><small>'+t[2]+'</small><em>₹7/pcs</em></span>'+
        '<span class="wsh-add"><button type="button" class="wsh-a">Add +</button><span class="wsh-st"><button type="button" class="wsh-m" aria-label="One less">−</button><output>1</output><button type="button" class="wsh-p" aria-label="One more">+</button></span></span></li>'}).join("")+
    '</ul><div class="wsh-bar"><span><b class="wsh-tot">₹0</b><small class="wsh-cnt">0 pcs · Wash &amp; Fold</small></span><button type="button" class="wsh-vb">View bag '+wi("arr")+'</button></div></div>'+
    '<p><b>Fill the bag</b>Add turns into a stepper, and the bag bar rises from the bottom with a running total. Take everything out and it slides away again.</p></div>';
  /* 2. pickup slot + delivery back */
  h+='<div class="wsh-demo"><div class="wsh-ds wsh-slot" data-d="0" data-t="1" data-b="0"><span class="wsh-lb">Pickup slot</span>'+
    '<div class="wsh-days">'+[["Today",14],["Tomorrow",15],["Tuesday",16]].map(function(d,i){return '<button type="button" data-i="'+i+'" class="'+(i?'':'on')+'"><b>'+d[0]+'</b><small>'+d[1]+' Sep</small></button>'}).join("")+'</div>'+
    '<div class="wsh-times">'+["8 - 10 AM","10 - 12 PM","2 - 4 PM","6 - 8 PM"].map(function(t,i){return '<button type="button" data-i="'+i+'">'+t.replace(" - "," to ")+'</button>'}).join("")+'</div>'+
    '<span class="wsh-lb">Delivery back</span><div class="wsh-back">'+[["48 hours",2,"Free",0],["24 hours",1,"+₹60",60],["Same day",0,"+₹140",140]].map(function(b,i){return '<button type="button" data-i="'+i+'" data-f="'+b[3]+'" data-o="'+b[1]+'" class="'+(i?'':'on')+'"><b>'+b[0]+'</b><small class="wsh-bd"></small><em>'+b[2]+'</em></button>'}).join("")+'</div>'+
    '<div class="wsh-bar on"><span><b class="wsh-pt">₹108</b><small class="wsh-ps">6 pcs + 1kg · Wash &amp; Fold</small></span><button type="button" class="wsh-vb">Pay '+wi("arr")+'</button></div></div>'+
    '<p><b>Pick a slot</b>Slots that have already passed today are dashed out. Choose how fast it comes back and the total in the bar changes with it.</p></div>';
  /* 3. tracking */
  var stg=[["Order placed","We have your order and the vendor is notified."],["Picked up","Ramesh collected 1 bag from your address."],["Sorting & wash","Garments sorted by colour and fabric."],["Press & pack","Pressed, folded and packed for delivery."],["Out for delivery","On the way back to House no. 28."]];
  h+='<div class="wsh-demo"><div class="wsh-ds wsh-trk" data-s="0"><span class="wsh-lb">Arriving back</span><b class="wsh-when">16 Sep · by 8 PM</b><ol class="wsh-tl">'+stg.map(function(t,i){return '<li data-i="'+i+'"><i>'+wi("chk")+'</i><b>'+t[0]+'</b><small>'+t[1]+'</small></li>'}).join("")+'</ol>'+
    '<div class="wsh-pp"><span class="wsh-pi">'+wi("van")+'</span><span><b>Ramesh · Pickup partner</b><small>Rated 4.9 · 1,240 pickups</small></span><button type="button" class="wsh-call" aria-label="Call">'+wi("call")+'</button></div>'+
    '<button type="button" class="wsh-next">Next stage</button></div>'+
    '<p><b>Where’s my laundry</b>Five stages, one answer. The current one pulses; everything before it is ticked. Tap next stage to move the order along.</p></div>';
  return h+'</div>'}
var STG=[/* key, caption, x%, y%, w%, rot | mobile x, y, w (w=0 hides on phones) */
  ["x_home","Home"],["x_addtray","The add tray"],["x_notes","Notes"],["x_detail","A card up close"],
  ["x_canvas","Canvas board"],["x_chat","Alter AI"],["x_upcoming","Upcoming"],["x_memories","Memories"]].map(function(t,i){
    var mc=i%2,mr=Math.floor(i/2);
    return [t[0],t[1],.8+i*12.35,i%2?15:8,12.6,[-3,2.5,-1.5,3,-2.5,1.5,-3,2][i],  mc?52:3,3+mr*25,45]});
STG.push(["x_widget","The widget",40.5,72,19,-2,  0,0,0]);
function stageHTML(){
  var h='<div class="stg" id="stg"><div class="stg-in">';
  STG.forEach(function(t,i){var a=ALT[t[0]];
    h+='<figure class="stp'+(t[8]?'':' dh')+'" data-k="'+t[0]+'" data-cap="'+t[1]+'" tabindex="0" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--w:'+t[4]+'%;--r:'+t[5]+'deg;--mx:'+t[6]+'%;--my:'+t[7]+'%;--mw:'+t[8]+'%;--ar:'+a.w+'/'+a.h+';--i:'+i+'">'+
      '<img loading="lazy" alt="'+t[1]+'" draggable="false" src="'+a.u+'"></figure>'+
      '<span class="slab'+(t[8]?'':' dh')+'" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--mx:'+t[6]+'%;--my:'+t[7]+'%;--i:'+i+'"><b>'+("0"+(i+1)).slice(-2)+'</b>'+t[1]+'</span>'});
  return h+'</div></div>'}
function itersHTML(list,tg){tg=tg||["v1 · Figma","Shipped","first version in Figma","shipped"];
  return '<div class="itr">'+list.map(function(t){var a=ALT[t[0]],b=ALT[t[1]];
    return '<div class="itr-row"><div class="itr-pair"><figure class="itr-f v1" data-cap="'+t[2]+', '+tg[2]+'" tabindex="0"><span class="itr-tag">'+tg[0]+'</span><img loading="lazy" alt="'+t[2]+', first version" src="'+a.u+'"></figure>'+
      '<svg class="itr-ar" viewBox="0 0 40 24" aria-hidden="true"><path d="M3 12h32M27 5l8 7-8 7"/></svg>'+
      '<figure class="itr-f v2" data-cap="'+t[2]+', '+tg[3]+'" tabindex="0"><span class="itr-tag y">'+tg[1]+'</span><img loading="lazy" alt="'+t[2]+', shipped" src="'+b.u+'"></figure></div>'+
      '<div class="itr-t"><b>'+t[2]+'</b><p>'+t[3]+'</p></div></div>'}).join("")+'</div>'}

/* components: the real Figma sets, then three rebuilt live */
var IC={home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  mem:'<path d="M5 4h3v16H5zM10 4h3v16h-3zM15.2 5.1l2.9-.8 3.9 15-2.9.8z"/>',
  up:'<path d="M6 3h12M6 21h12M7 3v2c0 3 5 5 5 7s-5 4-5 7v2M17 3v2c0 3-5 5-5 7s5 4 5 7v2"/>',
  note:'<path d="M6 3h9l4 4v14H6zM9 10h7M9 14h7M9 18h4"/>',
  mic:'<path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/>',
  scan:'<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 9h6v6H9z"/>',
  att:'<path d="M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>'};
function ic(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>'}
function compsHTML(){
  var sets=[["nav","Nav bar","4 variants"],["fab","Add button","closed, open"],["cNote","Capture card","one per input type"],["inp","Spill thoughts","input + tray"]];
  var h='<div class="cmp-sets">'+sets.map(function(t){var a=ALT[t[0]];return '<figure class="cset" data-k="'+t[0]+'" data-cap="'+t[1]+'" tabindex="0"><span class="cset-n"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1l2.2 2.2L6 5.4 3.8 3.2zM6 6.6l2.2 2.2L6 11 3.8 8.8zM1 6l2.2-2.2L5.4 6 3.2 8.2zM6.6 6l2.2-2.2L11 6 8.8 8.2z"/></svg>'+t[1]+'<small>'+t[2]+'</small></span><div class="cset-b"><img loading="lazy" alt="'+t[1]+' component set" src="'+a.u+'"></div></figure>'}).join("")+'</div>';
  h+='<div class="cmp-live">';
  /* 1. nav pill */
  h+='<div class="demo"><div class="demo-s"><div class="np" role="tablist" aria-label="Alter nav bar demo">'+
    [["home","Home"],["mem","Memories"],["up","Upcoming"],["note","Notes"]].map(function(t,i){return '<button type="button" role="tab" aria-selected="'+(i?'false':'true')+'" class="'+(i?'':'act')+'">'+ic(t[0])+'<span class="lb">'+t[1]+'</span></button>'}).join("")+
    '</div></div><p><b>The pill nav</b>Only the tab you are on gets a name and the yellow. The rest stay quiet.</p></div>';
  /* 2. add tray */
  h+='<div class="demo"><div class="demo-s"><div class="tray"><div class="tray-o">'+
    [["Aa","Text"],["mic","Audio"],["scan","Scan"],["att","Attach"],["note","Note"]].map(function(t,i){return '<button type="button" style="--k:'+i+'" tabindex="-1">'+(t[0]==="Aa"?'<i class="aa">Aa</i>':ic(t[0]))+'<span>'+t[1]+'</span></button>'}).join("")+
    '</div><button type="button" class="dfab" aria-label="Open the add tray" aria-expanded="false">'+ic("plus")+'</button></div></div><p><b>The add button</b>Tap it: the plus turns into a yellow close, and the ways in unfold from it.</p></div>';
  /* 3. tick off */
  h+='<div class="demo"><div class="demo-s"><div class="atk"><span class="atk-h">Upcoming</span><ul class="atk-l">'+
    ["Research on an animal species","Search about Figma’s makeathon","Finish the widget states"].map(function(t){return '<li><button type="button" class="cb" aria-label="Mark done: '+t+'"></button><span>'+t+'</span></li>'}).join("")+
    '</ul><span class="atk-done">Completed <b>0</b></span><button type="button" class="atk-re">Bring them back</button></div></div><p><b>Ticking it off</b>A small buzz, then the task breaks into dust in about 420 ms. The one moment the app shows off.</p></div>';
  return h+'</div>'}
function renderCase(p){var _vc=document.getElementById("v-case");if(_vc)_vc.dataset.case=p.id;
  var idx=P.indexOf(p),next=P[(idx+1)%P.length];
  document.getElementById("caseHead").innerHTML=
   '<h1 class="big">'+p.n+'</h1>'+
   (typeof ACV!=="undefined"&&ACV[p.id]?ACV[p.id].html(p):'<div class="pg-hero" style="--swatch:'+p.s+'"><span class="tg">'+p.k.join(" · ")+'</span>'+
   '<svg viewBox="0 0 100 100" aria-hidden="true">'+p.a+'</svg></div>')+
   '<p class="lede" style="max-width:62ch">'+p.g+'</p>';
  if(typeof CS!=="undefined"&&CS[p.id]){document.getElementById("caseBody").innerHTML=renderRich(p,CS[p.id])+
   '<div class="nextup"><span style="font:500 14px/1 var(--body);color:var(--ink-soft)">Next up</span><a class="btn ghost" href="/work/'+next.id+'">'+next.n+' '+ARW+'</a></div>';
   if(window.caseWire)caseWire(p);return}
  document.getElementById("caseBody").innerHTML=
   '<div style="margin-top:36px">'+p.st.map(function(s){
     return '<div class="step"><h4>'+s[0]+'</h4><p>'+s[1]+'</p></div>'}).join("")+'</div>'+
   '<div class="shots">'+
   p.shots.map(function(s){return '<div class="shot" style="--tint:'+p.tint+'">'+s.replace(/\n/g,"<br>")+'</div>'}).join("")+'</div>'+
   '<div class="nextup"><span style="font:500 14px/1 var(--body);color:var(--ink-soft)">Next up</span>'+
   '<a class="btn ghost" href="/work/'+next.id+'">'+next.n+' '+ARW+'</a></div>'}

var VIEWS={home:"v-home",about:"v-about",offer:"v-offer",work:"v-work","case":"v-case",svc:"v-svc",canvas:"v-canvas",gallery:"v-gallery",lab:"v-lab",contact:"v-contact",testimonial:"v-testimonial"};
function show(key){Object.keys(VIEWS).forEach(function(k){
  var el=document.getElementById(VIEWS[k]);if(el)el.classList.toggle("on",k===key)})}
/* every section heading gets a marker stroke under it, drawn the first time you reach it */
var UL=[["M8 5C46 2 105 6 181 3","M27 12C76 9 128 11 166 9"],["M17 4C69 7 125 2 189 5","M6 11C58 9 113 13 154 10"],["M5 6C55 3 112 7 172 4","M34 12C75 9 120 13 182 10"]];
var ULC=[["#A9DEFF","#A9DEFF"],["#B4F6B8","#B4F6B8"],["#E7BBFF","#E7BBFF"],["#FFD44E","#FFD44E"]];
var ulSeen=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){
  if(e.isIntersecting){e.target.classList.add("seen");ulSeen.unobserve(e.target)}})},{threshold:.7}):null;
function underline(){
  Array.prototype.forEach.call(document.querySelectorAll("main h2:not([data-ul])"),function(h,k){
    h.setAttribute("data-ul","1");
    var u=UL[k%UL.length];
    var c=ULC[k%4];
    h.innerHTML='<span class="hl" style="--u1:'+c[0]+';--u2:'+c[1]+'">'+h.innerHTML+'<svg class="ul-draw u1" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="'+u[0]+'"/></svg><svg class="ul-draw u2" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path d="'+u[1]+'"/></svg></span>';
    if(ulSeen)ulSeen.observe(h);else h.classList.add("seen")})}
window.decorateSectionHeadings=underline;
var rvIO=("IntersectionObserver" in window)?new IntersectionObserver(function(es){es.forEach(function(e){
  if(e.isIntersecting){e.target.classList.add("in");rvIO.unobserve(e.target)}})},{threshold:.2}):null;
function reveal(){
  Array.prototype.forEach.call(document.querySelectorAll("main h2:not(.rv):not(.brand-title),main h1.big:not(.rv),main .lede:not(.rv),main .srow:not(.rv),main .more-bar strong:not(.rv),main .step:not(.rv),main .abeat:not(.rv),main .job:not(.rv)"),function(el){
    el.classList.add("rv");if(/^H[12]$/.test(el.tagName)&&window.SPLITCH)window.SPLITCH(el);if(/^H[12]$/.test(el.tagName)||el.matches(".srow,.step,.abeat,.job"))el.classList.add("nz");if(rvIO)rvIO.observe(el);else el.classList.add("in")})}
(function(){var el=document.getElementById("tgrid"),x=0,v=.5,tv=.5,last=0,drag=null,hov=false;if(!el)return;
  var box=el.parentNode;box.addEventListener("mouseenter",function(){hov=true;tv=0});box.addEventListener("mouseleave",function(){hov=false;tv=.5});
  box.addEventListener("pointerdown",function(e){if(e.button>0)return;drag={x:e.clientX,x0:x,t:performance.now(),lx:e.clientX,v:0};box.setPointerCapture(e.pointerId);box.classList.add("grab")});
  box.addEventListener("pointermove",function(e){if(!drag)return;var now=performance.now(),dt=Math.max(1,now-drag.t);
    drag.v=-(e.clientX-drag.lx)/dt*16;drag.lx=e.clientX;drag.t=now;x=drag.x0+(e.clientX-drag.x)});
  function up(){if(!drag)return;v=drag.v;drag=null;box.classList.remove("grab")}
  box.addEventListener("pointerup",up);box.addEventListener("pointercancel",up);
  var calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  /* runs only while the strip is on screen (the section is hidden right now); its width is read once, not per frame */
  var on=false,raf=0,half=0;
  function f(t){raf=0;if(!on)return;var dt=last?Math.min(50,t-last):16;last=t;
    if(!drag){if(calm&&!hov)tv=0;v+=(tv-v)*.035;x-=v*dt/16}
    if(half){while(-x>=half)x+=half;while(x>0)x-=half}
    el.style.transform="translateX("+x.toFixed(2)+"px)";raf=requestAnimationFrame(f)}
  function go(v2){on=v2;if(on){half=el.scrollWidth/2;last=0;if(!raf)raf=requestAnimationFrame(f)}}
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){go(es[0].isIntersecting)}).observe(box);else go(true);
  window.addEventListener("resize",function(){if(on)half=el.scrollWidth/2})})();

(function(){
  var d=document.querySelector('.doo[data-dd=plane]');if(!d)return;
  var a=d.querySelector('.plfly'),busy=false;
  d.addEventListener('mouseenter',function(){if(busy||!a||!a.beginElement)return;busy=true;d.classList.add('flying');
    try{a.beginElement()}catch(e){}setTimeout(function(){busy=false;d.classList.remove('flying')},2650)});
})();
(function(){
  var notes={pencil:"sketch it first",phone:"then build it",push:"push back, once",magnify:"check it twice"};
  Array.prototype.forEach.call(document.querySelectorAll('#storyText .fig'),function(f,i){
    if(!f.dataset.k)f.dataset.k=["pencil","phone","push","magnify"][i]});
})();
/* =================== CANVAS MODE =================== */
(function(){
  var hero=document.getElementById("hero"),hin=document.getElementById("heroIn");if(!hero||!hin)return;
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches,calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var PIL=[[124,196,242],[142,219,148],[242,194,48],[211,155,240]];
  /* One grid owns both the paper squares and their bulge. Scroll phase never eases. */
  var softQuery=matchMedia("(max-width:820px), (pointer:coarse)"),softGrid=softQuery.matches;
  var cv=document.getElementById("dotgrid"),cx=cv.getContext("2d"),W=0,H=0,dpr=1,G=26;
  var mx=-9999,my=-9999,sx=-9999,sy=-9999,rip=[],raf=0;
  function size(){softGrid=softQuery.matches;dpr=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;
    cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+"px";cv.style.height=H+"px";
    cx.setTransform(dpr,0,0,dpr,0,0);kick()}
  function draw(){raf=0;
    var sc=window.pageYOffset,now=performance.now(),R=150;
    sx+=(mx-sx)*.18;sy+=(my-sy)*.18;
    var busy=Math.abs(mx-sx)+Math.abs(my-sy)>.5;
    cx.clearRect(0,0,W,H);rip=rip.filter(function(r){return now-r.t<1400});
    for(var y=G/2+.5-(sc%G)-G;y<H+G;y+=G){for(var x=G/2+.5;x<W+G;x+=G){
      var dx=x-sx,dy=y-sy,d=Math.hypot(dx,dy),k=calm?0:Math.max(0,1-d/R),rad=1.5+k*k*2.2,col=null;
      for(var i=0;i<rip.length;i++){var r=rip[i],age=(now-r.t)/1400,rr=age*560,dd=Math.hypot(x-r.x,y-(r.y-sc)),w=Math.max(0,1-Math.abs(dd-rr)/34)*(1-age);
        if(w>0){rad+=w*2.6;k=Math.max(k,w);col=r.c}}
      if(k<=.02){cx.fillStyle=softGrid?"rgba(19,19,22,.11)":"rgba(19,19,22,.15)"}
      else{var q=col||PIL[((Math.atan2(dy,dx)+Math.PI)/(Math.PI/2)|0)%4];
        cx.fillStyle="rgba("+q[0]+","+q[1]+","+q[2]+","+(softGrid ? .32+k*.38 : .42+k*.5).toFixed(2)+")"}
      if(softGrid)rad*=.85;
      cx.fillRect(x-rad,y-rad,rad*2,rad*2)}}
    if(busy||rip.length)kick()}
  function kick(){if(!raf)raf=requestAnimationFrame(draw)}
  window.CV_RIPPLE=function(x,y){if(calm)return;rip.push({x:x,y:y+window.pageYOffset,t:performance.now(),c:PIL[rip.length%4]});kick()};
  window.addEventListener("resize",size);window.addEventListener("scroll",kick,{passive:true});size();setTimeout(size,300);
  /* the grid stays calm while you're busy with a doodle: the doodle is the thing to look at */
  var xy=document.getElementById("cvXY"),xyb=xy?xy.querySelectorAll("b"):[];
  window.addEventListener("pointermove",function(e){if(e.pointerType==="touch")return;
    var t=e.target,quiet=t&&t.closest&&t.closest(".doo,.fig,.cnote");if(quiet){mx=my=-9999}else{mx=e.clientX;my=e.clientY}kick();
    if(xyb.length&&hero.offsetParent){var hr=hero.getBoundingClientRect();if(e.clientY<hr.bottom){xyb[0].textContent=Math.round(e.clientX-hr.left);xyb[1].textContent=Math.round(e.clientY-hr.top)}}},{passive:true});
  /* Keep the original ambient motion on phones, with smaller and softer squares. */
  if(!fine&&!calm){var T0=performance.now();
    (function wander(){setTimeout(wander,50);if(document.hidden)return;var k=(performance.now()-T0)/1000;
      mx=W*(.5+.36*Math.sin(k*.23)+.08*Math.sin(k*.71+1.3));my=H*(.5+.34*Math.sin(k*.17+2)+.1*Math.cos(k*.53));kick()})()}
  document.addEventListener("mouseleave",function(){mx=my=-9999;kick()});
  /* ---- the name layer: live size tag, and the corner handles really resize it ---- */
  var fr=document.getElementById("framed");function tag(){}
  if(fr){
    Array.prototype.forEach.call(fr.querySelectorAll(".hd"),function(hd){
      var sgx=hd.classList.contains("a")||hd.classList.contains("c")?-1:1,sgy=hd.classList.contains("a")||hd.classList.contains("b")?-1:1,st=null;
      hd.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();hd.setPointerCapture(e.pointerId);
        st={x:e.clientX,y:e.clientY,w:fr.offsetWidth,h:fr.offsetHeight};hin.classList.add("scaling");document.body.classList.add("cv-scaling");fr.classList.add("lit")});
      hd.addEventListener("pointermove",function(e){if(!st)return;
        var a=Math.max(.55,Math.min(1.7,1+sgx*2*(e.clientX-st.x)/st.w)),b=Math.max(.55,Math.min(1.9,1+sgy*2*(e.clientY-st.y)/st.h));
        if(e.shiftKey){var m=Math.max(a,b);a=b=m}
        fr.style.scale=a.toFixed(3)+" "+b.toFixed(3);tag([a,b])});
      function up(){if(!st)return;st=null;hin.classList.remove("scaling");document.body.classList.remove("cv-scaling");
        fr.style.scale="";setTimeout(function(){tag()},650)}
      hd.addEventListener("pointerup",up);hd.addEventListener("pointercancel",up)})}

})();

/* =================== SITE-WIDE CANVAS INTERACTIONS =================== */
(function(){
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches,calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var PC=["#A9DEFF","#B4F6B8","#FFD44E","#E7BBFF"];
  /* ---- frames: every section is a frame, named, selected as it arrives ---- */
  var NAMES={story:"The person",drop:"The proof",offerHome:"For you",proofHome:"Others say",hero:"Hello"};
  var ICON='<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M3.5 1v10M8.5 1v10M1 3.5h10M1 8.5h10"/></svg>';
  var frames=[];
  function nameFor(sec,k){if(NAMES[sec.id])return NAMES[sec.id];if(sec.classList.contains("contact"))return sec.closest("#v-home")?"Your turn":null;
    var v=sec.closest(".view"),vn=v?(v.id||"").replace("v-",""):"";vn=vn.charAt(0).toUpperCase()+vn.slice(1);
    if(sec.classList.contains("page-head"))return vn==="Offer"?"Services":vn==="Svc"?"Service":vn;
    return null}
  Array.prototype.forEach.call(document.querySelectorAll("main section"),function(sec,k){
    if(sec.id==="hero"||sec.id==="canvasView")return;
    var host=sec.id==="drop"?sec.querySelector(".drop-stage"):sec;if(!host)return;
    host.classList.add("frm");host.style.setProperty("--fc",PC[frames.length%4]);
    var name=nameFor(sec,k);if(!name)return;host.dataset.fname=name;
    var t=document.createElement("div");t.className="ftag";t.innerHTML=ICON+"<b>"+name+"</b>";host.appendChild(t);
    frames.push(host)});
  /* ---- click bare canvas anywhere: a colour ripple runs through the grid ---- */
  document.addEventListener("pointerdown",function(e){if(!fine||e.pointerType==="touch"||e.button>0||document.body.classList.contains("pen")||!window.CV_RIPPLE)return;
    if(e.target.closest("a,button,input,textarea,.doo,.framed,.avail,.card,.srow,.tick,.tcard,.c-stage,.cnote,p,h1,h2,h3,li,.wcard,.offer,.job,.abeat,.hi,.claim,img,svg,.nav"))return;
    window.CV_RIPPLE(e.clientX,e.clientY)});
  if(!fine)return;
  /* ---- magnetic buttons ---- */


  /* magnetic buttons removed in round 11: buttons stay where they are */
  /* ---- the YOU cursor says what a thing does ---- */
  var yc=document.querySelector(".youcur"),yb=yc&&yc.querySelector("b");
  /* services: the cursor turns into the tool you'd use for that kind of work */
  var TI=function(d){return '<svg class="tl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>'};
  var TOOLS=[[TI('<path d="M7 3v18M17 3v18M3 7h18M3 17h18"/>'),'FRAME'],
             [TI('<path d="M12 19l7-7-3-3-7 7-1 4z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><circle cx="11" cy="11" r="2"/>'),'PEN'],
             [TI('<path d="M4 20C10 20 8 4 20 4"/><circle cx="4" cy="20" r="1.6"/><circle cx="20" cy="4" r="1.6"/><path d="M4 20l6-2M20 4l-6 2"/>'),'EASE'],
             [TI('<path d="M12 2l3 3-3 3-3-3zM19 9l3 3-3 3-3-3zM5 9l3 3-3 3-3-3zM12 16l3 3-3 3-3-3z"/>'),'COMPONENT']];
  /* the hidden system cursor lives on the hovered row only; moving between rows just moves the class */
  var toolEl=null;function toolRow(r){if(r===toolEl)return;if(toolEl)toolEl.classList.remove("cur-tool");toolEl=r;if(r)r.classList.add("cur-tool")}
  if(yb){var lastV="YOU";
    window.addEventListener("pointerover",function(e){var t=e.target,v="YOU";
      if(document.body.classList.contains("pen")&&t.closest("#hero"))v="DRAW";
      else if(t.closest(".framed .hd"))v="STRETCH";
      else if(t.closest("#deck .card"))v="OPEN CASE";
      else if(t.closest(".doo"))v="DRAG ME";
      else if(t.closest(".tick"))v="DRAG";
      else if(t.closest(".icv-pct,.icv-bar,.icv-ed"))v="CLICK";
      else if(t.closest(".icv .cover"))v="OPEN";
      else if(t.closest(".icv .it"))v="DRAG";
      else if(t.closest(".icv"))v="PAN";
      else if(t.closest(".wcard"))v="HOLD TO X-RAY";
      else if(t.closest(".srow")){var sr=t.closest(".srow");v="TOOL"+Array.prototype.indexOf.call(sr.parentNode.querySelectorAll(".srow"),sr)}
      else if(t.closest(".socials a[data-copy]"))v="COPY";
      else if(t.closest(".pin"))v="READ";
      else if(t.closest(".cnote"))v="DRAG";
      else if(t.closest(".sky")&&!t.closest(".foot-contact,.foot-socials"))v="LAUNCH";
      else if(t.closest("a,button"))v="CLICK";
      if(v!==lastV){lastV=v;if(v.indexOf("TOOL")===0){var oo=(typeof OFFER!=="undefined"&&OFFER[+v.slice(4)]),tt=TOOLS[oo?oo.tool:0],ti=yc.querySelector(".tlico");if(!ti){ti=document.createElement("i");ti.className="tlico";yc.appendChild(ti)}ti.innerHTML=tt[0];yb.textContent=tt[1];yc.setAttribute("data-v","tool");toolRow(t.closest(".srow"))}else{yb.textContent=v;yc.setAttribute("data-v",v.toLowerCase());toolRow(null)}}},{passive:true})}
  /* ---- services: a preview card trails the cursor, tilting with your speed ---- */
  var sp=document.getElementById("sprev"),px=0,py=0,tx=0,ty=0,spRaf=0,spTime=0;
  function spLoop(now){spRaf=0;var dt=spTime?Math.max(1,Math.min(64,now-spTime)):1000/60;spTime=now;
    var k=calm?1:1-Math.pow(.84,dt/(1000/60)),dx=(tx-px)*k;
    px+=dx;py+=(ty-py)*k;
    var busy=Math.abs(tx-px)>.05||Math.abs(ty-py)>.05,tilt=calm?0:Math.max(-12,Math.min(12,dx*(1000/60)/dt*.9));
    if(!busy){px=tx;py=ty;tilt=0}
    sp.style.transform="translate("+(px+22).toFixed(1)+"px,"+(py+18).toFixed(1)+"px) rotate("+tilt.toFixed(2)+"deg)";
    if(busy)spRaf=requestAnimationFrame(spLoop);else spTime=0}
  /* rows open with the pointer, not with the scroll: as the list slid under a resting cursor, :hover moved from row to row
     and each one animated its height open and shut, relaying the whole list every frame (and Google counted the shoves as
     layout shifts). Hover changes that arrive mid scroll are settled once it stops */
  var openRow=null,overRow=null,prevRow=null;
  function moved(e){return e.movementX!==0||e.movementY!==0}
  function setOpen(r){if(r===openRow)return;if(openRow)openRow.classList.remove("open");openRow=r;if(r)r.classList.add("open")}
  function preview(row,x,y){var o=row._o;if(!o||!sp)return;if(prevRow!==row){prevRow=row;if(window.svpFill)window.svpFill(sp,o);else sp.innerHTML="<span>"+o.lbl+"</span>";sp.style.background=o.pc;tx=px=x;ty=py=y}
    sp.classList.add("on");if(!spRaf)spRaf=requestAnimationFrame(spLoop)}
  function unpreview(){cancelAnimationFrame(spRaf);spRaf=spTime=0;prevRow=null;if(sp){sp.classList.remove("on");
    Array.prototype.forEach.call(sp.querySelectorAll("video"),function(v){v.pause()})}}
  window.addEventListener("hashchange",unpreview);
  document.addEventListener("visibilitychange",function(){if(document.hidden)unpreview()});
  function bindRows(){Array.prototype.forEach.call(document.querySelectorAll(".srow:not([data-pv])"),function(row,i){row.dataset.pv=1;
    var list=row.parentNode.querySelectorAll(".srow"),idx=Array.prototype.indexOf.call(list,row);row._o=(typeof OFFER!=="undefined"&&OFFER[idx])||null;
    row.addEventListener("pointerenter",function(){overRow=row});
    row.addEventListener("pointermove",function(e){overRow=row;if(SCROLLING||!moved(e))return;setOpen(row);preview(row,e.clientX,e.clientY);tx=e.clientX;ty=e.clientY});
    row.addEventListener("pointerleave",function(){if(overRow===row)overRow=null;unpreview();if(!SCROLLING&&openRow===row)setOpen(null)})})}
  bindRows();
  /* when the scroll stops, a row the pointer has left closes; nothing opens until the mouse itself moves (a row opening
     under a resting cursor still shoves the list, and counts as a layout shift) */
  onScrollEnd(function(){if(openRow&&!openRow.matches(":hover")){setOpen(null);unpreview()}});
  /* smart spacing guides on the landed cards: removed, measurements live in the hero only */
  /* ---- copy email, with a toast ---- */
  var toast=document.getElementById("toast"),tt=0;
  function bindCopy(){Array.prototype.forEach.call(document.querySelectorAll(".socials a"),function(a){if(!/Email/.test(a.textContent)||a.dataset.copy)return;
    a.dataset.copy="1";a.setAttribute("href","mailto:adi.workspace76865@gmail.com");
    a.addEventListener("click",function(e){e.preventDefault();var m="adi.workspace76865@gmail.com";
      (navigator.clipboard?navigator.clipboard.writeText(m):Promise.reject()).catch(function(){}).then(function(){});
      clearTimeout(tt);toast.classList.add("on");tt=setTimeout(function(){toast.classList.remove("on")},1800);
      var r=a.getBoundingClientRect();if(window.CV_RIPPLE)window.CV_RIPPLE(r.left+r.width/2,r.top+r.height/2)})})}
  bindCopy();window.addEventListener("hashchange",function(){setTimeout(bindCopy,100)});
  /* ---- headings: hover the underline and it redraws ---- */
  document.addEventListener("pointerover",function(e){var h=e.target.closest&&e.target.closest("h2.seen");if(!h||h.dataset.busy)return;
    h.dataset.busy=1;h.classList.add("redraw");h.offsetWidth;h.classList.remove("redraw");setTimeout(function(){delete h.dataset.busy},1400)});
  /* ---- about page: the timeline fills as you read it ---- */
  var jobs=document.querySelector(".jobs");
  if(jobs){var rail=document.createElement("span");rail.className="rail";jobs.insertBefore(rail,jobs.firstChild);
    var jv=jobs.closest(".view"),jr=0;
    /* geometry is measured when the layout changes; a scroll frame only compares numbers (it used to read every job's
       rect every frame, between class writes) */
    var jg=null,jgH=-1,jlast="";
    function jmeasure(){var r=jobs.getBoundingClientRect();jg={top:r.top+SY,h:r.height||1,rows:Array.prototype.map.call(jobs.querySelectorAll(".job"),function(j){return {el:j,off:j.getBoundingClientRect().top-r.top}})};jgH=DOCH}
    function jp(){if(jv&&!jv.classList.contains("on"))return;if(!jg||jgH!==DOCH)jmeasure();
      var top=jg.top-SY,p=Math.max(0,Math.min(1,(VH*.6-top)/jg.h)),ps=p.toFixed(3);if(ps===jlast)return;jlast=ps;
      jobs.style.setProperty("--jp",ps);
      for(var i=0;i<jg.rows.length;i++){var o=jg.rows[i];o.el.classList.toggle("lit",o.off+26<p*jg.h)}}
    window.addEventListener("scroll",function(){if(!jr&&(!jv||jv.classList.contains("on")))jr=requestAnimationFrame(function(){jr=0;jp()})},{passive:true});
    window.addEventListener("hashchange",function(){jg=null;jlast="";setTimeout(jp,80)});window.addEventListener("resize",function(){jg=null;jlast=""},{passive:true});jp()}
  /* ---- work page: cards tilt toward the cursor with a glare ---- */
  function bindTilt(){Array.prototype.forEach.call(document.querySelectorAll(".wcard:not([data-t])"),function(c){c.dataset.t=1;
    var g=document.createElement("span");g.className="glare";c.appendChild(g);
    /* measured once on entry, never while tilted: reading the rect of an already-tilted card fed the
       tilt back into itself and made it wobble. One eased write per frame, not one per mouse event. */
    var r0=null,tx=.5,ty=.5,cx=.5,cy=.5,raf=0,on=false;
    function step(){raf=0;cx+=(tx-cx)*.2;cy+=(ty-cy)*.2;
      c.style.transform="perspective(900px) rotateX("+((.5-cy)*9).toFixed(2)+"deg) rotateY("+((cx-.5)*11).toFixed(2)+"deg) translateY(-4px)";
      if(r0)g.style.transform="translate3d("+(cx*r0.width).toFixed(1)+"px,"+(cy*r0.height).toFixed(1)+"px,0)";
      if(on&&(Math.abs(tx-cx)>.002||Math.abs(ty-cy)>.002))raf=requestAnimationFrame(step)}
    c.addEventListener("pointerenter",function(){c.style.transform="";r0=c.getBoundingClientRect();cx=tx=.5;cy=ty=.5;on=true;c.classList.add("tilt")});
    c.addEventListener("pointermove",function(e){if(!r0)r0=c.getBoundingClientRect();tx=Math.min(1,Math.max(0,(e.clientX-r0.left)/r0.width));ty=Math.min(1,Math.max(0,(e.clientY-r0.top)/r0.height));
      if(!raf)raf=requestAnimationFrame(step)});
    c.addEventListener("pointerleave",function(){on=false;r0=null;cancelAnimationFrame(raf);raf=0;c.classList.remove("tilt");c.style.transform=""})})}
  bindTilt();
})();

/* =================== ROUND 3 INTERACTIONS =================== */
(function(){
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches,calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var PC=["#A9DEFF","#B4F6B8","#FFD44E","#E7BBFF"];
  function $(q,r){return (r||document).querySelector(q)}function $$(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))}

  /* ---- stool: click to shuffle the hand ---- */
  var stool=$("#stool");
  if(stool)stool.addEventListener("click",function(){$$("#deck .card").forEach(function(c,k){
    c.style.setProperty("--k",k);c.style.setProperty("--sx",(k-1.5)*46);c.style.setProperty("--sr",(k-1.5)*14);
    c.classList.remove("shuf");void c.offsetWidth;c.classList.add("shuf");setTimeout(function(){c.classList.remove("shuf")},1100)});
    });

  /* ---- services: live loops in the preview, and the motion row misbehaves on purpose ---- */
  /* the preview card content lives in svpFill (ROUND 20: service pages) */
  function motionRow(){$$(".srows").forEach(function(list){var r=$('.srow[data-s="motion"]',list);if(!r||r.classList.contains("wob"))return;r.classList.add("wob");
    var t=$(".sw2",r);if(!t)return;var txt=t.textContent;t.innerHTML=txt.split("").map(function(ch,i){return ch===" "?" ":'<span class="ch" style="--c:'+i+'">'+ch+"</span>"}).join("")})}
  motionRow();

  /* ---- easter eggs: type "aditya" / press Ctrl+Z ---- */
  var buf="";
  document.addEventListener("keydown",function(e){if(/input|textarea/i.test(e.target.tagName||""))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){var pl=$('.doo[data-dd=plane]');var a=pl&&$(".plfly",pl);
      if(a&&a.beginElement){a.setAttribute("keyPoints","1;0");a.setAttribute("keyTimes","0;1");try{a.beginElement()}catch(err){}setTimeout(function(){a.removeAttribute("keyPoints")},2700)}return}
    if(e.key.length!==1)return;buf=(buf+e.key.toLowerCase()).slice(-6);
    if(buf==="aditya"){buf="";document.body.classList.add("wave");setTimeout(function(){document.body.classList.remove("wave")},2200);
      for(var i=0;i<60;i++)(function(i){var c=document.createElement("div");c.className="confetti";c.style.background=PC[i%4];document.body.appendChild(c);
        var x=innerWidth/2,y=innerHeight*.35,vx=(Math.random()-.5)*16,vy=-Math.random()*14-4,r=Math.random()*360,t0=performance.now();
        (function st(t){var k=(t-t0)/16;var px=x+vx*k,py=y+vy*k+.35*k*k;c.style.transform="translate("+px+"px,"+py+"px) rotate("+(r+k*9)+"deg)";
          if(py<innerHeight+40)requestAnimationFrame(st);else c.remove()})(t0)})(i)}});

  /* ---- case study: before/after scrubber, inspector, version strip ---- */
  function caseKit(){var body=$("#caseBody");if(!body||body.dataset.kit===body.innerHTML.length+"")return;
    if(!$(".step",body)||$(".ba",body))return;
    var tint=getComputedStyle($(".shot",body)||body).getPropertyValue("--tint")||"#B4F6B8";
    var kit=document.createElement("div");
    kit.innerHTML='<div class="ba" style="--tint:'+tint+'"><div class="pane after">Shipped screen goes here</div><div class="pane before">First draft goes here</div>'+
      '<span class="tagx l">v1 · first draft</span><span class="tagx r">Shipped</span><div class="knife"></div>'+
      '<span class="hs" style="left:66%;top:30%;--ow:190px;--oh:90px">1<span class="ol"></span><span class="box">[ Decision note: what changed here, and why. ]</span></span>'+
      '<span class="hs" style="left:78%;top:68%;--ow:140px;--oh:60px">2<span class="ol"></span><span class="box">[ Decision note: the detail most people miss. ]</span></span></div>'+
      '<div class="vers"><span>Versions</span><button type="button" data-v="10">v1</button><button type="button" data-v="40">v2</button><button type="button" data-v="70">v3</button><button type="button" class="on" data-v="100">Shipped</button></div>';
    var steps=$(".step",body).parentNode;steps.parentNode.insertBefore(kit,steps.nextSibling);
    var ba=$(".ba",kit),drag=false;function set(p){ba.style.setProperty("--ba",Math.max(0,Math.min(100,p))+"%")}
    function at(e){var r=ba.getBoundingClientRect();set((e.clientX-r.left)/r.width*100)}
    ba.addEventListener("pointerdown",function(e){if(e.target.closest(".hs"))return;drag=true;ba.setPointerCapture(e.pointerId);at(e)});
    ba.addEventListener("pointermove",function(e){if(drag)at(e)});ba.addEventListener("pointerup",function(){drag=false});
    $$(".vers button",kit).forEach(function(b){b.addEventListener("click",function(){$$(".vers button",kit).forEach(function(x){x.classList.toggle("on",x===b)});
      var v=+b.dataset.v;ba.style.transition="none";set(100-v);$(".tagx.l",ba).textContent=b.textContent==="Shipped"?"v1 · first draft":b.textContent})});
    body.dataset.kit=body.innerHTML.length+""}
  var cb=$("#caseBody");if(cb&&"MutationObserver" in window)new MutationObserver(function(){setTimeout(caseKit,30)}).observe(cb,{childList:true});caseKit();


})();

/* =================== ROUND 5 =================== */
(function(){
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches,calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var PC=["#A9DEFF","#B4F6B8","#FFD44E","#E7BBFF"];
  function $(q,r){return (r||document).querySelector(q)}function $$(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))}
  /* The reading hairline follows the current page, including Home's complete overview. */
  var navLinks=$$(".nav a[data-r]");
  function prog(){var max=(DOCH||document.documentElement.scrollHeight)-VH,p=max>0?Math.min(1,SY/max):0;
    navLinks.forEach(function(a){var v=a.classList.contains("here")?p.toFixed(3):"0";
      if(a._cp!==v){a._cp=v;a.style.setProperty("--cp",v)}})}
  var pr=0;window.addEventListener("scroll",function(){if(!pr)pr=requestAnimationFrame(function(){pr=0;prog()})},{passive:true});
  window.addEventListener("hashchange",function(){setTimeout(prog,80)});setTimeout(prog,600);

  document.addEventListener("click",function(e){if(!e.target.closest(".pin"))$$(".pin.open").forEach(function(p){p.classList.remove("open")})});
})();
/* =================== ROUND 6 =================== */
(function(){
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches,calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var PC=["#A9DEFF","#B4F6B8","#FFD44E","#E7BBFF"];
  function $(q,r){return (r||document).querySelector(q)}function $$(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}

  document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href^='#/']");if(!a||e.metaKey||e.ctrlKey||e.shiftKey)return;
    if(!a.closest(".nav,.foot,.gobar,.navmenu"))return;e.preventDefault();goHash(a.getAttribute("href"))},true);

  /* ============ 2. the canvas ============ */
  var DEF=[{t:"text",x:-10,y:-170,w:980,h:70,r:0,fs:64,txt:"Everything else I've made."}];
  var SPOTS=[[0,0,-2.5],[650,-30,2],[30,520,1.6],[640,470,-3],[1210,250,2.8]];
  (typeof SECTIONS!=="undefined"?SECTIONS:[]).forEach(function(sct,i){var p=SPOTS[i%SPOTS.length];DEF.push({t:"set",s:i,x:p[0],y:p[1],w:sct.w,h:sct.h,r:p[2]})});
  DEF.push({t:"note",x:1290,y:-150,w:210,h:180,r:4,c:"#FFD44E",txt:"Tap a cover to open it. Drag anything around."});
  DEF.push({t:"note",x:1230,y:660,w:200,h:170,r:-3.5,c:"#B4F6B8",txt:"More gets pinned here as it ships."});
  /* Aditya: design the canvas at #/canvas/edit, hit Export, and send me the file. It gets baked in here. */
  /* baked from Aditya's canvas-layout_3.json (27 Sep): VANORGO, Carousel & Graphics, Archived websites, Asian Cadet Cup 2025 */
  var LAYOUT=[{"t":"text","x":-10,"y":-170,"w":980,"h":70,"r":0,"fs":64,"txt":"Everything else I've made."},{"t":"image","id":"vanorgo","label":"VANORGO","w":1024,"h":904,"r":0,"src":"/assets/media/0ddbd085e1f42fd5.webp","x":-1327,"y":95},{"t":"frame","w":1228,"h":1044,"r":0,"c":"#FFD44E","txt":"VANORGO","x":-1431,"y":48},{"t":"frame","w":1225,"h":1052,"r":0,"c":"#A9DEFF","txt":"Carousel & Graphics","x":-1419,"y":1381},{"t":"frame","w":1644,"h":2147,"r":0,"c":"#E7BBFF","txt":"Archived websites","x":245,"y":168},{"t":"image","id":"carousel-graphics","label":"Carousel & Graphics","w":1075,"h":953,"r":0,"src":"/assets/media/9939692f50a6f651.webp","x":-1354,"y":1425},{"t":"image","id":"archived-websites","label":"Archived websites","w":1793,"h":1899,"r":0,"src":"/assets/media/2cb2afc8c2c5b8c5.webp","x":80,"y":184},{"t":"frame","w":812,"h":478,"r":0,"c":"#B4F6B8","txt":"Asian Cadet Cup, 2025","x":1995,"y":161},{"t":"text","w":676,"h":40,"r":0,"fs":32,"txt":"Designed the Logo of the main event and Invitation Pdf which was sent to all the participating countries. ","x":2046,"y":214},{"t":"image","id":"asian-cadet-cup-2025","label":"Asian Cadet Cup, 2025","w":719,"h":236,"r":0,"src":"/assets/media/992e56fc72fbee5e.webp","x":2039,"y":332}],COVER=[["#FFD44E","#FFF3C4"],["#A9DEFF","#E3F4FF"],["#E7BBFF","#F6E9FF"],["#B4F6B8","#E5FBE6"],["#FFFFFF","#F1F0EC"]];
  /* the service pages borrow the canvas boards (no second copy): images whose centre sits inside the frame named n */
  window.CVBOARD=function(n){var L=LAYOUT||[],f=null;L.forEach(function(x){if(x.t==="frame"&&(x.txt||"").toLowerCase().indexOf(n.toLowerCase())===0)f=x});if(!f)return [];
    return L.filter(function(x){if(x.t!=="image")return false;var cx=x.x+x.w/2,cy=x.y+x.h/2;return cx>f.x&&cx<f.x+f.w&&cy>f.y&&cy<f.y+f.h})};
  /* Existing embedded art remains a single copy. The CMS (cms.adityaraj.dev) edits the Gallery; gallery.json is the fallback. */
  (function gallery(){
    var archive=LAYOUT.filter(function(x){return x.t==="image"});
    var grid=document.getElementById("galleryGrid"),filters=document.getElementById("galleryFilters"),message=document.getElementById("galleryMessage"),more=document.getElementById("galleryMore");
    var dialog=document.getElementById("galleryViewer"),stage=document.getElementById("galleryStage"),strip=document.getElementById("galleryTrack"),dots=document.getElementById("galleryDots"),title=document.getElementById("galleryTitle"),description=document.getElementById("galleryDescription");
    var prev=document.getElementById("galleryPrev"),next=document.getElementById("galleryNext"),position=document.getElementById("galleryPosition");
    var site=document.getElementById("gallerySite"),scroller=document.getElementById("gsScroll"),pageImg=document.getElementById("gsPage"),map=document.getElementById("gsMap"),mini=document.getElementById("gsMini"),miniImg=document.getElementById("gsMapImg"),win=document.getElementById("gsWin"),visit=document.getElementById("galleryVisit"),resource=document.getElementById("galleryResource"),actions=document.getElementById("galleryActions");
    var resetTools=previewTools(dialog,"gallery"),resetSummary=previewSummary(dialog,"gallery");
    var loaded=false,entries=[],category="All",loading=false,current=null,slide=0,originButton=null,pushed=false,slides=[];
    /* the Gallery's content lives in the CMS (Oct 23); gallery.json stays as the copy shipped with the site, used when the CMS can't be reached */
    var CMS_FEED="/gallery.json",KINDS=["Logo","Branding","Packaging","Graphics","Campaigns","Websites","Apps"];
    function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n}
    function source(media){if(typeof media!=="string"||!media)return "";try{var u=new URL(media,location.origin);return /^https?:$/.test(u.protocol)?u.href:""}catch(e){return ""}}
    function normalize(d){
      if(!d||!d.slug||!d.title||d.published!==true)return null;
      var slides=(Array.isArray(d.slides)?d.slides:[]).map(function(s){return {src:source(s.image),alt:s.alt||d.title,video:s.video===true}}).filter(function(s){return s.src});
      var old=archive.find(function(a){return a.id===d.legacyImage});if(!slides.length&&old)slides=[{src:old.src,alt:old.label}];
      var web=d.presentation==="website"&&d.page&&source(d.page.image)?{src:source(d.page.image),w:+d.page.width||0,h:+d.page.height||0}:null;
      if(web)slides=[{src:web.src,alt:d.title}];
      if(!slides.length)return null;
      if(d.presentation==="single")slides=slides.slice(0,1);
      var cats=(Array.isArray(d.categories)&&d.categories.length?d.categories:[d.category||"Graphics"]).map(String);
      return {slug:String(d.slug),title:String(d.title),description:d.description||"",category:cats[0],categories:cats,slides:slides,site:web,siteUrl:source(d.siteUrl),resourceUrl:source(d.resourceUrl),width:old&&!d.slides?.length&&!web?old.w:0,height:old&&!d.slides?.length&&!web?old.h:0,cover:source(d.cover)||slides[0].src,coverVideo:source(d.cover)?d.coverVideo===true:!!slides[0].video};
    }
    /* a card (Oct 26, Aditya: no turn, no motion trail, no back): the picture with its caption under it. A click or a tap
       opens the viewer; with a mouse or trackpad it tilts under the pointer (see .gal-tilt). */
    var fine=matchMedia("(hover:hover) and (pointer:fine)"),still=matchMedia("(prefers-reduced-motion:reduce)");
    function card(d){var b=el("article","gal-card"),front=el("button","gal-tilt gal-open"),kind=d.site?"website":d.slides.length>1?"carousel":"image";
      b.dataset.slug=d.slug;front.type="button";front.setAttribute("aria-label","Open "+d.title+", "+kind);
      var thumb=el("span","gal-thumb"),im=el(d.coverVideo?"video":"img");
      /* a video cover plays muted on a loop, like a moving thumbnail */
      if(d.coverVideo){im.muted=true;im.loop=true;im.autoplay=true;im.playsInline=true;im.preload="metadata";im.setAttribute("aria-label",d.slides[0].alt)}
      else{im.alt=d.slides[0].alt;im.loading="lazy";im.decoding="async"}
      im.src=d.cover||d.slides[0].src;if(d.width){im.width=d.width;im.height=d.height}thumb.appendChild(im);
      /* its real height is known once it loads: the masonry re-plans then */
      im.addEventListener(d.coverVideo?"loadedmetadata":"load",repour);
      if(d.site)thumb.classList.add("web");
      if(d.site)thumb.appendChild(el("span","gal-count","Website"));else if(d.slides.length>1)thumb.appendChild(el("span","gal-count",d.slides.length+" slides"));
      front.appendChild(thumb);b.appendChild(front);
      /* a small caption under the picture, like a pin */
      var cap=el("div","gal-cap");cap.append(el("b","",d.title),el("span","",d.categories.join(" · ")));b.appendChild(cap);
      if(d.width&&d.height)b.galH=260*d.height/d.width+40;
      /* Gentle tilt up to 4 degrees; tint is uniform, with no pointer-following light. */
      var tf=0,tx=.5,ty=.5;
      function tilt(){tf=0;front.style.setProperty("--ry",((tx-.5)*8).toFixed(2)+"deg");front.style.setProperty("--rx",((.5-ty)*8).toFixed(2)+"deg")}
      front.addEventListener("pointermove",function(e){if(e.pointerType==="touch"||!fine.matches||still.matches)return;var r=front.getBoundingClientRect();
        tx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));ty=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));b.classList.add("tilting");if(!tf)tf=requestAnimationFrame(tilt)});
      front.addEventListener("pointerleave",function(){if(tf){cancelAnimationFrame(tf);tf=0}b.classList.remove("tilting");front.style.setProperty("--rx","0deg");front.style.setProperty("--ry","0deg")});
      front.onclick=function(){originButton=front;pushed=true;var u=new URL(location.href);u.pathname="/gallery";u.search="?image="+encodeURIComponent(d.slug);u.hash="";history.pushState(null,"",u);open(d,0)};
      return b;
    }
    /* Pinterest-style masonry (Oct 25, Aditya): as many ~260px columns as fit (two on a phone, up to five), and each
       design, in order, drops into whichever column is shortest, so the wall fills left to right with no gaps */
    var made=Object.create(null),shown=[],cols=0;
    function columns(){var w=grid.clientWidth-(parseFloat(getComputedStyle(grid).paddingLeft)||0)*2;return Math.max(2,Math.min(5,Math.floor((w+16)/(260+16))))}
    /* plan the columns from each card's height (measured where it stands once its picture has loaded), then move cards
       only if the plan differs from what is on the page; moved cover videos are set playing again */
    function pour(){var n=columns(),hs=[],plan=[],i;for(i=0;i<n;i++){hs.push(0);plan.push([])}
      shown.forEach(function(b){var k=hs.indexOf(Math.min.apply(null,hs));plan[k].push(b);hs[k]+=(b.isConnected&&b.offsetHeight)||b.galH||300});
      var same=grid.children.length===n&&plan.every(function(col,k){var c=grid.children[k].children;return c.length===col.length&&col.every(function(b,j){return c[j]===b})});
      if(same)return;cols=n;grid.replaceChildren.apply(grid,plan.map(function(col){var c=el("div","gal-col");c.append.apply(c,col);return c}));
      Array.prototype.forEach.call(grid.querySelectorAll(".gal-thumb video"),function(v){if(v.paused&&v.play)v.play().catch(function(){})})}
    var rp=0;function repour(){clearTimeout(rp);rp=setTimeout(function(){if(shown.length)pour()},120)}
    var pt=0;addEventListener("resize",function(){clearTimeout(pt);pt=setTimeout(function(){if(shown.length&&columns()!==cols)pour()},150)});
    function render(reset){shown=entries.filter(function(d){return category==="All"||d.categories.indexOf(category)>=0}).map(function(d){return made[d.slug]||(made[d.slug]=card(d))});pour();
      more.hidden=true;message.textContent=!shown.length&&!loading?"More work is on the way.":"";
    }
    function urlForSlide(){var u=new URL(location.href);u.searchParams.set("image",current.slug);if(slide)u.searchParams.set("slide",String(slide+1));else u.searchParams.delete("slide");history.replaceState(null,"",u)}
    /* the page map: the full page shrunk to the map's height, and a lit frame over the part on screen */
    function fitMap(){if(!current||!current.site)return;var r=(pageImg.naturalHeight||current.site.h||1)/(pageImg.naturalWidth||current.site.w||1),H=map.clientHeight,W=map.clientWidth,w=Math.min(W,H/r),h=w*r;
      mini.style.width=w+"px";mini.style.height=h+"px";win.style.backgroundImage="url(\""+current.site.src+"\")";win.style.backgroundSize=w+"px "+h+"px";track()}
    function track(){if(!current||!current.site)return;var h=mini.clientHeight,full=scroller.scrollHeight||1,top=scroller.scrollTop/full*h,size=Math.max(10,scroller.clientHeight/full*h);
      win.style.top=top+"px";win.style.height=Math.min(size,h)+"px";win.style.backgroundPosition="-2px "+(-top-2)+"px"}
    function jump(e){var b=mini.getBoundingClientRect(),y=(e.clientY-b.top)/(b.height||1);scroller.scrollTop=y*scroller.scrollHeight-scroller.clientHeight/2}
    scroller.addEventListener("scroll",track,{passive:true});pageImg.addEventListener("load",fitMap);addEventListener("resize",fitMap);
    map.addEventListener("pointerdown",function(e){map.setPointerCapture(e.pointerId);jump(e);map.onpointermove=jump});
    map.addEventListener("pointerup",function(){map.onpointermove=null});map.addEventListener("pointercancel",function(){map.onpointermove=null});
    /* the carousel: build the slides once per design, load the one in view and its neighbours, and read the slide in view
       back from the track's scroll position, so a swipe, a trackpad flick, an arrow and a key all land the same way */
    function media(n){var f=slides[n];if(!f||f.done)return;f.done=true;var sl=current.slides[n],m;
      if(sl.video){m=document.createElement("video");m.controls=true;m.playsInline=true;m.preload="metadata";m.setAttribute("aria-label",sl.alt);m.src=sl.src}
      else{m=portfolioImage();m.alt=sl.alt;m.decoding="async";m.draggable=false;m.src=sl.src;
        if(n===0)m.addEventListener("load",function(){if(m.naturalWidth&&m.naturalHeight){stage.parentNode.style.setProperty("--ar",(m.naturalWidth/m.naturalHeight).toFixed(4));strip.scrollLeft=slide*strip.clientWidth}})}
      f.appendChild(m)}
    function build(){stage.parentNode.style.removeProperty("--ar");strip.replaceChildren();dots.replaceChildren();slides=current.site?[]:current.slides.map(function(sl,n){var f=el("figure","gal-slide");
        f.setAttribute("role","group");f.setAttribute("aria-roledescription","slide");f.setAttribute("aria-label",(n+1)+" of "+current.slides.length);strip.appendChild(f);
        if(current.slides.length>1)dots.appendChild(el("i"));return f});
      dots.hidden=current.slides.length<2}
    function paint(){var s=current.slides[slide],web=!!current.site;dialog.classList.toggle("site",web);dialog.classList.toggle("website-preview",web||current.categories.indexOf("Websites")>=0);site.hidden=!web;stage.hidden=web;visit.hidden=!current.siteUrl;resource.hidden=!current.resourceUrl;actions.hidden=!(current.siteUrl||current.resourceUrl);visit.removeAttribute("href");resource.removeAttribute("href");if(current.siteUrl)visit.href=current.siteUrl;if(current.resourceUrl)resource.href=current.resourceUrl;
      if(web){if(pageImg.getAttribute("src")!==current.site.src){pageImg.src=miniImg.src=current.site.src;scroller.scrollTop=0}pageImg.alt=current.title+", the full website";requestAnimationFrame(fitMap)}
      else{[slide-1,slide,slide+1].forEach(media);
        slides.forEach(function(f,n){f.classList.toggle("on",n===slide);f.inert=n!==slide;var v=f.querySelector("video");if(v&&n!==slide&&!v.paused)v.pause()});
        Array.prototype.forEach.call(dots.children,function(d,n){d.classList.toggle("on",n===slide)})}
      title.textContent=current.title;description.textContent=current.description;
      var many=!web&&current.slides.length>1;position.textContent=many?(slide+1)+" / "+current.slides.length:"";
      prev.hidden=!many||slide===0;next.hidden=!many||slide===current.slides.length-1;
    }
    function goTo(n,smooth){n=Math.max(0,Math.min(current.slides.length-1,n));var w=strip.clientWidth;
      if(w)strip.scrollTo({left:n*w,behavior:smooth&&!still.matches?"smooth":"auto"});if(n!==slide||!smooth){slide=n;paint()}}
    function open(d,n){var fresh=current!==d;current=d;slide=Math.max(0,Math.min(d.slides.length-1,Number.isFinite(n)?n:0));if(fresh||!slides.length)build();paint();
      if(!dialog.open){resetTools();dialog.showModal();document.body.classList.add("gallery-open");document.getElementById("galleryClose").focus({preventScroll:true})}
      if(fresh)resetSummary(false);
      requestAnimationFrame(function(){if(current===d&&!d.site)strip.scrollLeft=slide*strip.clientWidth})}
    function dismiss(back){if(dialog.open)dialog.close();document.body.classList.remove("gallery-open");current=null;slides=[];strip.replaceChildren();dots.replaceChildren();dialog.classList.remove("site");site.hidden=true;stage.hidden=false;pageImg.removeAttribute("src");miniImg.removeAttribute("src");
      if(back&&pushed){pushed=false;history.back()}else if(back){var u=new URL(location.href);u.searchParams.delete("image");u.searchParams.delete("slide");history.replaceState(null,"",u)}
      if(originButton&&originButton.isConnected)originButton.focus({preventScroll:true});
    }
    function change(n){if(!current||current.site)return;goTo(slide+n,true);urlForSlide()}
    /* a swipe settles on a slide: the one nearest the middle is the one in view */
    var st=0;strip.addEventListener("scroll",function(){if(!current||current.site)return;var w=strip.clientWidth||1,n=Math.round(strip.scrollLeft/w);
      if(n!==slide&&n>=0&&n<current.slides.length){slide=n;paint()}clearTimeout(st);st=setTimeout(function(){if(current&&!current.site)urlForSlide()},160)},{passive:true});
    addEventListener("resize",function(){if(current&&!current.site)strip.scrollLeft=slide*strip.clientWidth});
    async function linked(){var slug=new URLSearchParams(location.search).get("image");if(!slug){if(dialog.open)dismiss(false);return}
      var d=entries.find(function(x){return x.slug===slug});
      if(HASH()!=="#/gallery"&&HASH()!=="#/canvas")return;if(d)open(d,(parseInt(new URLSearchParams(location.search).get("slide"),10)||1)-1);else message.textContent="This design is not available. Browse the gallery below.";
    }
    async function loadEntries(){if(loading)return;loading=true;more.hidden=true;more.disabled=true;message.textContent="Loading designs…";
      async function get(url,ms){var ctl=new AbortController(),t=setTimeout(function(){ctl.abort()},ms);try{var r=await fetch(url,{cache:"no-cache",signal:ctl.signal});if(!r.ok)throw Error("Gallery request failed");var data=await r.json();if(!Array.isArray(data.entries))throw Error("Invalid gallery");return data}finally{clearTimeout(t)}}
      try{
        var data=await get(CMS_FEED,8000);
        var seen=new Set();entries=data.entries.map(normalize).filter(function(d){if(!d||seen.has(d.slug))return false;seen.add(d.slug);return true});loaded=true;loading=false;filterBar();render(true);await linked();
      }catch(e){loading=false;message.textContent="The gallery could not load. Please try again.";more.textContent="Try again";more.hidden=false}finally{more.disabled=false}
    }
    /* a filter for each category that has work in it, in a fixed order */
    function filterBar(){var used=["All"].concat(KINDS.filter(function(k){return entries.some(function(d){return d.categories.indexOf(k)>=0})}));if(used.indexOf(category)<0)category="All";filters.replaceChildren();
      used.forEach(function(c){var b=el("button","",c);b.type="button";b.setAttribute("aria-pressed",String(c===category));b.onclick=function(){category=c;Array.from(filters.children).forEach(function(n){n.setAttribute("aria-pressed",String(n===b))});render(true)};filters.appendChild(b)})}
    async function sync(){var on=/^#\/gallery(?:\/admin)?$/.test(HASH())||HASH()==="#/canvas";if(!on){if(dialog.open)dismiss(false);pushed=false;return}
      if(location.pathname==="/gallery/admin"){location.replace("/gallery");return}
      if(!loaded)await loadEntries();else await linked();
    }
    document.getElementById("galleryClose").onclick=function(){dismiss(true)};
    dialog.addEventListener("click",function(e){if(e.target===dialog||e.target.classList.contains("gal-view")||e.target.classList.contains("gal-slide"))dismiss(true)});
    dialog.addEventListener("cancel",function(e){e.preventDefault();dismiss(true)});
    dialog.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){e.preventDefault();change(1)}if(e.key==="ArrowLeft"){e.preventDefault();change(-1)}});
    prev.onclick=function(){change(-1)};next.onclick=function(){change(1)};more.onclick=loadEntries;
    window.addEventListener("hashchange",sync);setTimeout(sync,0);
  })();
  var stage=$("#icv"),world=$("#icvWorld"),pctEl=$("#icvPct"),bar=$("#icvBar"),hint=$("#icvHint"),toast=$("#icvToast");
  if(stage){
  var V={x:0,y:0,k:1},items=[],editing=false,selIt=null,built=false,viewRaf=0,NC=["#FFD44E","#B4F6B8","#A9DEFF","#E7BBFF","#F3F3F1","#FFFFFF","#131316"];
  var DDVB={laptop:["159 159 1817 1979","Laptop"],think:["159 159 1985 1775","Think"],pixel:["159 159 1583 1991","Pixel"],plane:["159 159 1601 2093","Plane"],
    chai:["159 159 1523 1991","Chai"],read:["159 159 965 2489","Read"],sketch:["159 159 1763 1979","Sketch"],push:["159 159 2465 1757","Push"],mag:["159 159 905 2363","Mag"],cards:["159 159 1223 2357","Cards"]};
  function say(t){toast.textContent=t;toast.classList.add("on");clearTimeout(say.t);say.t=setTimeout(function(){toast.classList.remove("on")},1800)}
  function load(){var L=null;if(editing){try{L=JSON.parse(localStorage.getItem("icv-draft")||"null")}catch(e){}}
    return JSON.parse(JSON.stringify(L||LAYOUT||DEF))}
  function save(){if(!editing)return;try{localStorage.setItem("icv-draft",JSON.stringify(items.map(function(o){return o.d})))}catch(e){say("Too big for browser storage. Hit Export now so nothing is lost.")}}
  function apply(){liveZoom(world);world.style.transform="translate("+V.x.toFixed(1)+"px,"+V.y.toFixed(1)+"px) scale("+V.k.toFixed(4)+")";world.style.setProperty("--k",V.k.toFixed(4));
    var g=26*V.k;while(g<13)g*=2;stage.style.backgroundSize=g+"px "+g+"px";stage.style.backgroundPosition=V.x.toFixed(1)+"px "+V.y.toFixed(1)+"px";
    pctEl.textContent=Math.round(V.k*100)+"%"}
  /* the selected frame's eight handles (Figma's corners and edges), in a layer above every item */
  var fhEl=null;
  function fhSync(){var o=selIt;if(!editing||!o||o.d.t!=="frame"){if(fhEl&&fhEl.parentNode)fhEl.remove();return}
    if(!fhEl){fhEl=document.createElement("div");fhEl.className="fhov";fhEl.innerHTML=["nw","n","ne","e","se","s","sw","w"].map(function(k){return '<span class="hdl fh" data-h="'+k+'"></span>'}).join("")}
    if(fhEl.parentNode!==world||world.lastChild!==fhEl)world.appendChild(fhEl);
    var d=o.d;fhEl.style.left=d.x+"px";fhEl.style.top=d.y+"px";fhEl.style.width=d.w+"px";fhEl.style.height=d.h+"px";fhEl.style.rotate=(d.r||0)+"deg"}
  function place(o){var d=o.d,e=o.el;e.style.left=d.x+"px";e.style.top=d.y+"px";e.style.width=d.w+"px";e.style.height=d.h+"px";e.style.rotate=(d.r||0)+"deg";
    if(d.t==="text")e.style.setProperty("--fs",(d.fs||56)+"px");
    if(o===selIt&&d.t==="frame")fhSync()}
  function esc(t){return (t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;")}
  function make(d){var e=document.createElement("div");e.className="it "+d.t;var h="";
    if(d.t==="set"){var sc=SECTIONS[d.s],cc=COVER[d.s%COVER.length];e.style.setProperty("--cv",cc[0]);sc={t:sc.t,d:sc.d,items:sc.items,tint:cc[1],cv:cc[0]};
      h='<div class="lab"><i></i>'+sc.t+' · '+sc.items.length+' items</div><div class="body"><div class="grid">'+sc.items.map(function(x){return '<div class="th" style="--tint:'+sc.tint+'">'+esc(x).replace(/\n/g,"<br>")+'</div>'}).join("")+
        '</div><div class="cover'+(cc[0]==="#FFFFFF"?" light":"")+'" role="button" tabindex="0" aria-label="Open '+sc.t+'"><span class="tap">Tap to open</span><h4>'+sc.t+'</h4><p>'+sc.d+'</p></div></div>'}
    else if(d.t==="note"){e.style.setProperty("--nc",d.c||"#FFD44E");h='<div class="body"><div class="tx">'+esc(d.txt)+'</div></div>'}
    else if(d.t==="text"){h='<div class="body"><div class="tx">'+esc(d.txt)+'</div></div>'}
    else if(d.t==="image"){h='<div class="body"><img alt="" decoding="async" src="'+d.src+'"></div>'}
    else if(d.t==="frame"){e.style.setProperty("--nc",d.c||"#F3F3F1");h='<div class="body"></div><div class="lab2">'+esc(d.txt||"Frame")+'</div>'}
    else if(d.t==="doodle"){var v=DDVB[d.k]?DDVB[d.k][0]:"0 0 100 100";e.style.setProperty("--nc",d.c||"#131316");
      h='<div class="body"><svg viewBox="'+v+'" aria-hidden="true" style="color:'+(d.c||"#131316")+'"><use href="#dd-'+d.k+'"/></svg></div>'}
    /* frames get Figma's eight handles (corners and edges), each resizing from its own side */
    /* frames sit behind everything, so their handles live in their own layer on top (fhSync) */
    e.innerHTML=h+(d.t==="frame"?"":'<span class="hdl rs"></span><span class="hdl rt"></span>');
    if(d.t==="frame")world.insertBefore(e,world.firstChild);else world.appendChild(e);
    var o={d:d,el:e};place(o);
    if(d.t==="image"){
      $("img",e).alt=d.label||"Canvas image";
      if(d.id){e.dataset.image=d.id;e.tabIndex=0;e.setAttribute("role","button");e.setAttribute("aria-label","Select "+(d.label||"canvas image"));
        e.addEventListener("keydown",function(ev){if(ev.key!=="Enter"&&ev.key!==" ")return;ev.preventDefault();select(o);
          if(!editing){frameTo(bounds([o]),true);var b=$(".copy-link",ctx);if(b)b.focus({preventScroll:true})}})}
    }
    var cv=$(".cover",e);if(cv)cv.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();reveal(cv,cv.offsetWidth/2,cv.offsetHeight/2)}});
    if(d.t==="text"&&d.c)e.style.color=d.c;
    return o}
  function build(){world.innerHTML="";items=load().map(make);stackFrames();selIt=null;ctxShow();
    bar.innerHTML='<button type="button" data-fit="1">Fit all</button><span class="sep"></span>'+items.filter(function(o){return o.d.t==="set"}).map(function(o){var sc=SECTIONS[o.d.s];
      return '<button type="button" data-set="'+o.d.s+'" style="--c:'+COVER[o.d.s%COVER.length][0]+'"><i></i>'+sc.t.split(" ")[0]+'</button>'}).join("");built=true}
  function bounds(list){var a=1e9,b=1e9,c=-1e9,d=-1e9;list.forEach(function(o){a=Math.min(a,o.d.x);b=Math.min(b,o.d.y-36);c=Math.max(c,o.d.x+o.d.w);d=Math.max(d,o.d.y+o.d.h)});return{x:a,y:b,w:c-a,h:d-b}}
  function stopView(){cancelAnimationFrame(viewRaf);viewRaf=0}
  function frameTo(bx,anim){stopView();var W=innerWidth,H=innerHeight,top=W<760?120:96,bot=selIt&&selIt.d.t==="image"?150:90,pad=W<760?20:60,
      k=clamp(Math.min((W-pad*2)/bx.w,(H-top-bot)/bx.h),.12,1.4),t={k:k,x:(W-bx.w*k)/2-bx.x*k,y:top+(H-top-bot-bx.h*k)/2-bx.y*k};
    if(!anim||matchMedia("(prefers-reduced-motion:reduce)").matches){V=t;apply();return}var f={x:V.x,y:V.y,k:V.k},t0=performance.now();
    (function st(n){viewRaf=0;var p=Math.min(1,(n-t0)/520),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;V.x=f.x+(t.x-f.x)*e;V.y=f.y+(t.y-f.y)*e;V.k=f.k+(t.k-f.k)*e;apply();if(p<1)viewRaf=requestAnimationFrame(st)})(t0)}
  function fit(anim){if(items.length)frameTo(bounds(items),anim)}
  function zoomAt(cx,cy,f){stopView();var k=clamp(V.k*f,.12,4);V.x=cx-(cx-V.x)*(k/V.k);V.y=cy-(cy-V.y)*(k/V.k);V.k=k;apply()}
  function linkedImage(){if(editing||HASH()!=="#/canvas")return null;var id=new URLSearchParams(location.search).get("image");
    return items.find(function(o){return o.d.t==="image"&&o.d.id===id})}
  function sync(){stopView();var on=/^#\/canvas\/edit/.test(HASH()||"");document.body.classList.toggle("cvmode",on);document.documentElement.classList.toggle("cvmode",on);
    if(!on)return;
    var ed=on&&/^#\/canvas\/edit/.test(HASH());if(ed!==editing||!built){editing=ed;document.body.classList.toggle("icv-editing",ed);build()}
    if(on)requestAnimationFrame(function(){if(!document.body.classList.contains("cvmode"))return;
      select(null);if(innerWidth<760&&items.length>2){var two=items.filter(function(o){return o.d.t!=="note"}).slice(0,2);frameTo(bounds(two),false)}else fit(false);
      var o=linkedImage();if(o){select(o);frameTo(bounds([o]),true)}
      else if(!editing&&new URLSearchParams(location.search).has("image"))say("This image isn't available. Showing the canvas.")})}
  window.addEventListener("hashchange",sync);sync();window.addEventListener("resize",function(){if(document.body.classList.contains("cvmode")){var o=linkedImage();if(o)frameTo(bounds([o]),false);else fit(false)}});

  /* the cover: it breaks into pixels (the same square pixels as the type), rippling out from where you tapped */
  function reveal(cov,px,py){if(cov.dataset.gone)return;cov.dataset.gone=1;var w=cov.offsetWidth,h=cov.offsetHeight,dpr=Math.min(2,devicePixelRatio||1)*Math.min(2,Math.max(1,V.k));
    var S=document.createElement("canvas");S.width=w*dpr;S.height=h*dpr;var sx=S.getContext("2d");sx.scale(dpr,dpr);
    var cs=getComputedStyle(cov);sx.fillStyle=cs.backgroundColor;sx.fillRect(0,0,w,h);
    $$("h4,p,.tap",cov).forEach(function(el){var st=getComputedStyle(el),r=el.getBoundingClientRect(),cr=cov.getBoundingClientRect(),sc=w/cr.width;
      var lx=(r.left-cr.left)*sc,ly=(r.top-cr.top)*sc,lw=r.width*sc;
      if(el.classList.contains("tap")){sx.fillStyle="rgba(255,255,255,.7)";sx.fillRect(lx,ly,lw,r.height*sc)}
      sx.font=st.fontWeight+" "+st.fontSize+" "+st.fontFamily;sx.fillStyle=st.color;sx.textBaseline="top";
      var words=el.textContent.split(" "),line="",lh=parseFloat(st.lineHeight)||parseFloat(st.fontSize)*1.2,yy=ly+(el.classList.contains("tap")?8:0),xx=lx+(el.classList.contains("tap")?24:0);
      words.forEach(function(wd){var t=line?line+" "+wd:wd;if(sx.measureText(t).width>lw&&line){sx.fillText(line,xx,yy);yy+=lh;line=wd}else line=t});sx.fillText(line,xx,yy)});
    var c=document.createElement("canvas");c.width=S.width;c.height=S.height;c.style.cssText="position:absolute;inset:0;width:100%;height:100%;z-index:6;pointer-events:none;border-radius:34px";
    cov.parentNode.appendChild(c);cov.style.visibility="hidden";var x=c.getContext("2d"),C=w>360?16:12,cells=[],md=Math.hypot(Math.max(px,w-px),Math.max(py,h-py));
    for(var yy=0;yy<h;yy+=C)for(var xx=0;xx<w;xx+=C){var d=Math.hypot(xx+C/2-px,yy+C/2-py);cells.push([xx,yy,d/md*520+Math.random()*140,(Math.random()-.5)*60,Math.random()*40])}
    var t0=performance.now(),D=420;
    (function st(t){var el=t-t0,alive=false;x.clearRect(0,0,c.width,c.height);
      for(var i=0;i<cells.length;i++){var q=cells[i],p=(el-q[2])/D;if(p>=1)continue;alive=true;
        if(p<=0){x.drawImage(S,q[0]*dpr,q[1]*dpr,C*dpr,C*dpr,q[0]*dpr,q[1]*dpr,C*dpr,C*dpr);continue}
        var e=p*p,sz=C*(1-e),ox=q[3]*e,oy=-q[4]*p+e*90;x.globalAlpha=1-e;
        x.drawImage(S,q[0]*dpr,q[1]*dpr,C*dpr,C*dpr,(q[0]+(C-sz)/2+ox)*dpr,(q[1]+(C-sz)/2+oy)*dpr,sz*dpr,sz*dpr);x.globalAlpha=1}
      if(alive)requestAnimationFrame(st);else{c.remove();cov.remove()}})(t0)}

  /* pointers: pan the canvas, pick things up, pinch to zoom */
  var P=new Map(),mode=null,st0=null,pinch=null,moved=0;
  function world2(e){return{x:(e.clientX-V.x)/V.k,y:(e.clientY-V.y)/V.k}}
  function select(o){if(selIt)selIt.el.classList.remove("sel","picked");selIt=o;if(o)o.el.classList.add(editing?"sel":"picked");ctxShow();fhSync()}
  function inside(q,f){var cx=q.d.x+q.d.w/2,cy=q.d.y+q.d.h/2;return cx>f.d.x&&cx<f.d.x+f.d.w&&cy>f.d.y&&cy<f.d.y+f.d.h}
  stage.addEventListener("pointerdown",function(e){if(e.target.closest(".icv-pct,.icv-bar,.icv-ed,.icv-dd,.icv-ctx")||e.target.isContentEditable)return;
    stopView();
    P.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);if(hint)hint.classList.add("gone");
    if(P.size===2){var a=Array.from(P.values());pinch={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),k:V.k,x:V.x,y:V.y,cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2};mode="pinch";
      if(st0&&st0.o)st0.o.el.classList.remove("lift");return}
    moved=0;var itEl=e.target.closest(".it"),o=itEl&&items.find(function(q){return q.el===itEl});
    if(editing&&selIt&&e.target.classList.contains("fh")){o=selIt;mode="fresize";st0={o:o,x:e.clientX,y:e.clientY,h:e.target.dataset.h,d:{x:o.d.x,y:o.d.y,w:o.d.w,h:o.d.h}};return}
    if(o&&editing&&e.target.classList.contains("rs")){mode="resize";st0={o:o,x:e.clientX,y:e.clientY,w:o.d.w,h:o.d.h};return}
    if(o&&editing&&e.target.classList.contains("rt")){mode="rotate";var r=o.el.getBoundingClientRect();st0={o:o,cx:r.left+r.width/2,cy:r.top+r.height/2};return}
    /* touch: a drag on an item pans the canvas unless that item was tapped first (Aditya: trying to move around the
       canvas on a phone kept moving the pictures instead). Tap selects it; the next drag on it moves it. */
    if(o&&e.pointerType==="touch"&&selIt!==o){moved=0;mode="pan";st0={x:e.clientX,y:e.clientY,vx:V.x,vy:V.y,tap:o,cov:e.target.closest(".cover")};return}
    if(o){mode="item";var kids=o.d.t==="frame"?items.filter(function(q){return q!==o&&(q.d.t!=="frame"||q.d.w*q.d.h<o.d.w*o.d.h)&&inside(q,o)}).map(function(q){return{q:q,x:q.d.x,y:q.d.y}}):[];
      st0={o:o,x:e.clientX,y:e.clientY,dx:o.d.x,dy:o.d.y,cov:e.target.closest(".cover"),kids:kids};select(o);if(!editing&&e.pointerType==="touch")o.el.classList.add("picked");return}
    select(null);mode="pan";st0={x:e.clientX,y:e.clientY,vx:V.x,vy:V.y}});
  stage.addEventListener("pointermove",function(e){if(!P.has(e.pointerId))return;P.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(mode==="pinch"&&P.size>=2){var a=Array.from(P.values()),d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2,k=clamp(pinch.k*d/pinch.d,.12,4);
      V.k=k;V.x=cx-(pinch.cx-pinch.x)*(k/pinch.k);V.y=cy-(pinch.cy-pinch.y)*(k/pinch.k);apply();return}
    if(!st0)return;
    if(mode==="pan"){moved=Math.max(moved,Math.hypot(e.clientX-st0.x,e.clientY-st0.y));V.x=st0.vx+e.clientX-st0.x;V.y=st0.vy+e.clientY-st0.y;apply()}
    else if(mode==="item"){var dx=e.clientX-st0.x,dy=e.clientY-st0.y;moved=Math.max(moved,Math.hypot(dx,dy));if(moved<5)return;
      if(!st0.up){st0.up=1;if(st0.o.d.t!=="frame"){world.appendChild(st0.o.el);items.splice(items.indexOf(st0.o),1);items.push(st0.o)}}
      st0.o.el.classList.add("lift");st0.o.d.x=st0.dx+dx/V.k;st0.o.d.y=st0.dy+dy/V.k;place(st0.o);
      st0.kids.forEach(function(k){k.q.d.x=k.x+dx/V.k;k.q.d.y=k.y+dy/V.k;place(k.q)})}
    else if(mode==="resize"){var o=st0.o;o.d.w=Math.max(60,st0.w+(e.clientX-st0.x)/V.k);o.d.h=Math.max(40,st0.h+(e.clientY-st0.y)/V.k);
      if(o.d.t==="image"){o.d.h=Math.round(o.d.w*st0.h/st0.w)}
      if(o.d.t==="text")o.d.fs=Math.max(14,Math.round(o.d.h*.8));place(o)}
    else if(mode==="fresize"){var o=st0.o,h=st0.h,a=st0.d,dx=(e.clientX-st0.x)/V.k,dy=(e.clientY-st0.y)/V.k,MW=80,MH=60;
      var x=a.x,y=a.y,w=a.w,hh=a.h;
      if(h.indexOf("e")>=0)w=Math.max(MW,a.w+dx);
      if(h.indexOf("w")>=0){w=Math.max(MW,a.w-dx);x=a.x+a.w-w}
      if(h.indexOf("s")>=0)hh=Math.max(MH,a.h+dy);
      if(h.indexOf("n")>=0){hh=Math.max(MH,a.h-dy);y=a.y+a.h-hh}
      /* shift keeps the frame's proportions */
      if(e.shiftKey&&h.length===2){var r=a.w/a.h;if(w/hh>r)hh=w/r;else w=hh*r;if(h.indexOf("w")>=0)x=a.x+a.w-w;if(h.indexOf("n")>=0)y=a.y+a.h-hh}
      o.d.x=Math.round(x);o.d.y=Math.round(y);o.d.w=Math.round(w);o.d.h=Math.round(hh);place(o)}
    else if(mode==="rotate"){var o=st0.o,ang=Math.atan2(e.clientY-st0.cy,e.clientX-st0.cx)*180/Math.PI+90;if(!e.shiftKey)ang=Math.round(ang);else ang=Math.round(ang/15)*15;o.d.r=ang;place(o)}});
  function up(e){if(!P.has(e.pointerId))return;P.delete(e.pointerId);
    if(mode==="item"&&st0){st0.o.el.classList.remove("lift");if(moved<5&&st0.cov&&!editing){var r=st0.cov.getBoundingClientRect(),sc=st0.cov.offsetWidth/r.width;reveal(st0.cov,(e.clientX-r.left)*sc,(e.clientY-r.top)*sc)}}
    if(mode==="pan"&&st0&&st0.tap&&moved<8){select(st0.tap);if(!editing)st0.tap.el.classList.add("picked");if(st0.cov&&!editing){var r2=st0.cov.getBoundingClientRect(),sc2=st0.cov.offsetWidth/r2.width;reveal(st0.cov,(e.clientX-r2.left)*sc2,(e.clientY-r2.top)*sc2)}}
    if(mode==="fresize")stackFrames();
    if(mode&&mode!=="pan")save();
    if(P.size===0){mode=null;st0=null;pinch=null}else if(mode==="pinch"&&P.size===1){var a=Array.from(P.values())[0];mode="pan";st0={x:a.x,y:a.y,vx:V.x,vy:V.y}}}
  stage.addEventListener("pointerup",up);stage.addEventListener("pointercancel",up);
  stage.addEventListener("wheel",function(e){if(e.target.closest(".icv-bar,.icv-ctx"))return;e.preventDefault();if(hint)hint.classList.add("gone");
    stopView();
    if(e.ctrlKey||e.metaKey)zoomAt(e.clientX,e.clientY,Math.exp(-e.deltaY*.0085));else{V.x-=e.deltaX;V.y-=e.deltaY;apply()}},{passive:false});
  $$(".icv-pct button").forEach(function(b){b.addEventListener("click",function(){zoomAt(innerWidth/2,innerHeight/2,b.dataset.z==="+"?1.25:.8)})});
  bar.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;if(b.dataset.fit)return fit(true);
    var o=items.find(function(q){return q.d.t==="set"&&q.d.s===+b.dataset.set});if(o)frameTo({x:o.d.x-20,y:o.d.y-36,w:o.d.w+40,h:o.d.h+56},true)});

  /* ---- the editor (#/canvas/edit) ---- */
  /* new things land in the selected frame (sized to fit it), otherwise mid-screen */
  function add(d,at){var W=innerWidth,H=innerHeight,c=at||world2({clientX:W/2,clientY:H/2}),f=selIt&&selIt.d.t==="frame"?selIt:null;
    if(f&&!at){var mw=f.d.w-48;if(d.w>mw){d.h=Math.round(d.h*mw/d.w);d.w=Math.round(mw)}if(d.h>f.d.h-72){d.w=Math.round(d.w*(f.d.h-72)/d.h);d.h=f.d.h-72}c={x:f.d.x+f.d.w/2,y:f.d.y+f.d.h/2+12}}
    d.x=Math.round(c.x-d.w/2);d.y=Math.round(c.y-d.h/2);var o=make(d);items.push(o);stackFrames();select(o);save();return o}
  /* frames can nest: bigger frames sit further back, so a frame inside a frame always shows on top of it */
  function stackFrames(){items.filter(function(q){return q.d.t==="frame"}).sort(function(a,b){return a.d.w*a.d.h-b.d.w*b.d.h})
    .forEach(function(q){world.insertBefore(q.el,world.firstChild)})}
  function pick(accept,cb,multi){var i=document.createElement("input");i.type="file";i.accept=accept;if(multi)i.multiple=true;i.style.cssText="position:fixed;left:-9999px;opacity:0";document.body.appendChild(i);
    i.onchange=function(){var fs=Array.prototype.slice.call(i.files||[]);i.remove();fs.forEach(function(f,n){cb(f,n)})};i.click()}
  /* images go in exactly as they are: the original file's bytes, format and pixel size, no re-encode, no
     downscale. It lands at its own pixel size on the canvas; resize it there */
  function addImage(f,at){if(!f||!/^image\//.test(f.type))return;var rd=new FileReader();rd.onload=function(){var src=rd.result,im=new Image();
      im.onload=function(){var w=im.naturalWidth||520,h=im.naturalHeight||Math.round(w*.75);
        /* only the size it's shown at: at most 60% of the view, so its handles are on screen. The file is the original */
        var mw=innerWidth*.6/V.k,mh=innerHeight*.6/V.k,f=Math.min(1,mw/w,mh/h);add({t:"image",w:Math.round(w*f),h:Math.round(h*f),r:0,src:src},at)};im.src=src};rd.readAsDataURL(f)}
  var ctx=$("#icvCtx");
  function dflt(t){return t==="frame"?"#F3F3F1":t==="note"?"#FFD44E":"#131316"}
  function publishedImage(o){return o&&o.d.t==="image"&&o.d.id&&LAYOUT.some(function(d){return d.t==="image"&&d.id===o.d.id})}
  async function copyImageLink(o,button){var u=new URL(location.href);if(u.protocol!=="file:")u.pathname="/canvas";
    u.search="?image="+encodeURIComponent(o.d.id);u.hash=u.protocol==="file:"?"#/canvas":"";
    try{await navigator.clipboard.writeText(u.href);say("Image link copied");
      var label=button.querySelector("span");label.textContent="Copied";clearTimeout(button._copyTimer);
      button._copyTimer=setTimeout(function(){label.textContent="Copy"},1600)}
    catch(e){window.prompt("Copy this canvas link:",u.href)}}
  function ctxShow(){if(!ctx)return;var o=selIt;if(!o||(!editing&&!publishedImage(o))){ctx.classList.remove("on");return}var t=o.d.t,h="";
    if(!editing){ctx.innerHTML='<span class="tip">'+esc(o.d.label||"Selected image")+'</span><button type="button" class="copy-link" aria-label="Copy image link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/></svg><span>Copy</span></button>';ctx.classList.add("on");return}
    if(t==="frame")h+='<input type="text" class="nm" value="'+esc(o.d.txt||"Frame").replace(/"/g,"&quot;")+'" aria-label="Frame name" spellcheck="false">';
    if(t==="note"||t==="frame"||t==="doodle"||t==="text")h+='<span class="csw">'+NC.map(function(c){return '<button type="button" data-c="'+c+'" style="background:'+c+'" class="'+(c===(o.d.c||dflt(t))?"on":"")+'" aria-label="Colour '+c+'"></button>'}).join("")+'</span>';
    if(t==="frame")h+='<span class="tip">Select it, then add. Things on it move with it.</span>';
    if(publishedImage(o))h+='<button type="button" class="copy-link" aria-label="Copy image link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/></svg><span>Copy</span></button>';
    h+='<button type="button" class="del">Delete</button>';ctx.innerHTML=h;ctx.classList.add("on")}
  function recolor(o){var d=o.d,e=o.el;if(d.t==="note"||d.t==="frame")e.style.setProperty("--nc",d.c);if(d.t==="doodle"){var sv=$("svg",e);if(sv)sv.style.color=d.c}if(d.t==="text")e.style.color=d.c}
  function remove(o){o.el.remove();items.splice(items.indexOf(o),1);if(selIt===o){selIt=null;ctxShow()}save()}
  if(ctx){ctx.addEventListener("input",function(e){if(!e.target.classList.contains("nm")||!selIt)return;selIt.d.txt=e.target.value;var l=$(".lab2",selIt.el);if(l)l.textContent=e.target.value||"Frame";save()});
    ctx.addEventListener("keydown",function(e){if(e.target.classList.contains("nm")&&(e.key==="Enter"||e.key==="Escape"))e.target.blur()});
    ctx.addEventListener("click",function(e){var b=e.target.closest("button");if(!b||!selIt)return;
      if(b.classList.contains("copy-link")){copyImageLink(selIt,b);return}
      if(b.dataset.c){selIt.d.c=b.dataset.c;recolor(selIt);$$(".csw button",ctx).forEach(function(x){x.classList.toggle("on",x===b)});save()}
      if(b.classList.contains("del"))remove(selIt)})}
  /* images: the button, drag and drop from the desktop, or paste */
  stage.addEventListener("dragover",function(e){if(!editing)return;e.preventDefault();stage.classList.add("drop")});
  stage.addEventListener("dragleave",function(e){if(e.target===stage)stage.classList.remove("drop")});
  stage.addEventListener("drop",function(e){if(!editing)return;e.preventDefault();stage.classList.remove("drop");var p=world2(e);
    Array.prototype.slice.call(e.dataTransfer.files||[]).forEach(function(f,n){addImage(f,{x:p.x+n*30,y:p.y+n*30})})});
  document.addEventListener("paste",function(e){if(!editing||/input|textarea/i.test((document.activeElement||{}).tagName||"")||(document.activeElement||{}).isContentEditable)return;
    Array.prototype.slice.call((e.clipboardData||{}).items||[]).forEach(function(it){if(it.kind==="file")addImage(it.getAsFile())})});
  var ddPop=$("#icvDD");
  if(ddPop)ddPop.innerHTML=Object.keys(DDVB).map(function(k){var v=DDVB[k];return '<button type="button" data-k="'+k+'"><svg viewBox="'+v[0]+'" aria-hidden="true"><use href="#dd-'+k+'"/></svg><span>'+v[1]+'</span></button>'}).join("");
  if(ddPop)ddPop.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var vb=DDVB[b.dataset.k][0].split(" ").map(Number);
    add({t:"doodle",k:b.dataset.k,w:180,h:Math.round(180*vb[3]/vb[2]),r:0,c:"#131316"});ddPop.classList.remove("on")});
  $$("#icvEd button").forEach(function(b){b.addEventListener("click",function(){var a=b.dataset.a;
    if(a!=="doodle"&&ddPop)ddPop.classList.remove("on");
    if(a==="note")add({t:"note",w:210,h:180,r:(Math.random()-.5)*8,c:NC[items.length%4],txt:"Double-click to write"});
    if(a==="text")add({t:"text",w:520,h:70,r:0,fs:56,txt:"A heading"});
    if(a==="frame")add({t:"frame",w:520,h:380,r:0,c:"#F3F3F1",txt:"Frame"});
    if(a==="doodle"&&ddPop){ddPop.classList.toggle("on");return}
    if(a==="image")pick("image/*",function(f){addImage(f)},true);
    /* the draft keeps originals untouched; the export is what gets baked into the site, so each image is
       sized there to 4x the size it's shown on the canvas (sharp at full zoom) and saved as WebP q.9 (keeps
       transparency). A 20MB board export becomes well under 1MB, small enough to send */
    if(a==="export"){say("Preparing export…");var ds=items.map(function(o){return JSON.parse(JSON.stringify(o.d))});
      Promise.all(ds.map(function(d){if(d.t!=="image"||!d.src)return null;return new Promise(function(res){var im=new Image();im.onload=function(){
        var sc=Math.min(1,d.w*4/im.naturalWidth,4096/Math.max(im.naturalWidth,im.naturalHeight)),tw=Math.max(1,Math.round(im.naturalWidth*sc)),th=Math.max(1,Math.round(im.naturalHeight*sc));
        var c=document.createElement("canvas");c.width=tw;c.height=th;c.getContext("2d").drawImage(im,0,0,tw,th);
        var out=c.toDataURL("image/webp",.9);if(out.indexOf("data:image/webp")===0&&out.length<d.src.length)d.src=out;res()};im.onerror=function(){res()};im.src=d.src})})).then(function(){
        var js=JSON.stringify(ds);var bl=new Blob([js],{type:"application/json"}),u=URL.createObjectURL(bl),l=document.createElement("a");
        l.href=u;l.download="canvas-layout.json";document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(u)},2000);
        try{var cp=navigator.clipboard&&navigator.clipboard.writeText(js);if(cp&&cp.catch)cp.catch(function(){})}catch(e){}say("Exported ("+(bl.size/1048576).toFixed(1)+" MB). Send canvas-layout.json to Claude.")})}
    if(a==="import")pick("application/json,.json",function(f){f.text().then(function(t){try{localStorage.setItem("icv-draft",JSON.stringify(JSON.parse(t)))}catch(e){}build();fit(true);say("Imported")})});
    if(a==="reset"){try{localStorage.removeItem("icv-draft")}catch(e){}build();fit(true);say("Back to the default layout")}
    if(a==="exit")goHash("#/canvas")})});
  /* the stage captures the pointer on press, so dblclick lands on the stage itself: look up what's actually under the pointer */
  stage.addEventListener("dblclick",function(e){if(!editing)return;var hit=document.elementFromPoint(e.clientX,e.clientY),tx=hit&&hit.closest(".tx,.lab2");if(!tx||!world.contains(tx))return;tx.contentEditable="true";tx.focus();
    var rg=document.createRange();rg.selectNodeContents(tx);var sl=getSelection();sl.removeAllRanges();sl.addRange(rg);
    tx.onkeydown=function(k){if(k.key==="Enter"&&tx.classList.contains("lab2")){k.preventDefault();tx.blur()}};
    var o=items.find(function(q){return q.el.contains(tx)});tx.onblur=function(){tx.contentEditable="false";if(o){o.d.txt=tx.innerText;save();if(o===selIt)ctxShow()}}});
  document.addEventListener("keydown",function(e){var ae=document.activeElement;if(!editing||!selIt||ae&&(ae.isContentEditable||/input|textarea/i.test(ae.tagName)))return;
    if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();remove(selIt)}
    var n=e.shiftKey?10:1,m={ArrowLeft:[-n,0],ArrowRight:[n,0],ArrowUp:[0,-n],ArrowDown:[0,n]}[e.key];
    if(m){e.preventDefault();selIt.d.x+=m[0];selIt.d.y+=m[1];place(selIt);save()}
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="d"){e.preventDefault();var d=JSON.parse(JSON.stringify(selIt.d));delete d.id;d.x+=30;d.y+=30;var o=make(d);items.push(o);select(o);save()}});
  }

  /* ============ 3. about: the timeline as a git graph ============ */

  /* the git graph was tried and cut */

  /* ============ 4. work: press and hold a card and it x-rays into its wireframe ============ */
  function xray(){$$(".wcard:not([data-x])").forEach(function(c){c.dataset.x=1;var tm=0,on=false,sx=0,sy=0;
    var sc=document.createElement("span");sc.className="xscan";c.appendChild(sc);
    function labels(){$$(".xl",c).forEach(function(l){l.remove()});var cr=c.getBoundingClientRect();
      $$(".top,h3,p",c).forEach(function(el,i){var r=el.getBoundingClientRect(),l=document.createElement("span");l.className="xl";
        l.textContent=Math.round(r.width)+" × "+Math.round(r.height);l.style.left=(r.left-cr.left+6)+"px";l.style.top=(r.top-cr.top+(i?-8:8))+"px";c.appendChild(l)})}
    c.addEventListener("pointerdown",function(e){if(e.button>0)return;sx=e.clientX;sy=e.clientY;tm=setTimeout(function(){on=true;labels();c.classList.add("xray");
      if(navigator.vibrate)try{navigator.vibrate(8)}catch(er){}},260)});
    c.addEventListener("pointermove",function(e){if(tm&&!on&&Math.hypot(e.clientX-sx,e.clientY-sy)>8){clearTimeout(tm);tm=0}});
    function off(){clearTimeout(tm);tm=0;if(on){c.classList.remove("xray");setTimeout(function(){on=false},0)}}
    c.addEventListener("pointerup",off);c.addEventListener("pointerleave",off);c.addEventListener("pointercancel",off);
    c.addEventListener("contextmenu",function(e){e.preventDefault()});
    c.addEventListener("click",function(e){if(on||c.classList.contains("xray")){e.preventDefault();e.stopPropagation()}},true)})}
  xray();window.addEventListener("hashchange",function(){setTimeout(xray,120)});setTimeout(xray,600);

  /* ============ 5. easter egg: type "aditya" and the doodles say hi ============ */
  var buf="",HEY=["hey!","oh hi","hi hi","yo!","hello!","sup"];
  document.addEventListener("keydown",function(e){if(e.key.length!==1||/input|textarea/i.test(e.target.tagName||"")||e.target.isContentEditable)return;buf=(buf+e.key.toLowerCase()).slice(-6);
    if(buf!=="aditya")return;buf="";$$(".view.on .doo").forEach(function(d,i){var r=d.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
      setTimeout(function(){var h=document.createElement("span");h.className="hey";h.textContent=HEY[i%HEY.length];d.appendChild(h);setTimeout(function(){h.remove()},2400)},i*120)})});
})();
/* =================== ROUND 7 =================== */
(function(){
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches;
  function $(q,r){return (r||document).querySelector(q)}function $$(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))}

  /* ---- hero: the doodles land where they look best; after that they're yours to move ---- */
  /* the hero reads like a story, left to right, top to bottom: he thinks, he builds ("cooking something crazy"),
     he checks every pixel, he ships. The screenshot-approved default positions are fixed on every visit and
     nothing ever sits on the words. Anchors come from Aditya's reference screenshot, as fractions of the screen. */
  var STORY=[["think",.165,.22,"L"],["laptop",.75,.26,"R"],["pixel",.088,.665,"L"],["plane",.864,.65,"R"]];
  var box=$("#heroIn");
  function curate(){if(!box||box.closest(".hero-editorial")||innerWidth<760)return;var hero=$("#hero");if(!hero||!hero.offsetParent)return;
    var B=box.getBoundingClientRect(),hr=hero.getBoundingClientRect(),W=innerWidth,H=Math.min(innerHeight,hr.height);if(!B.width)return;
    var pad=22,keep=$$(".hi,.framed,.avail,.claim",box).map(function(e){var r=e.getBoundingClientRect();return{l:r.left-pad,r:r.right+pad,t:r.top-hr.top-pad,b:r.bottom-hr.top+pad}});
    var credits=$(".brand-credits",hero).getBoundingClientRect();
    keep.push({l:credits.left-pad,r:credits.right+pad,t:credits.top-hr.top-pad,b:credits.bottom-hr.top+pad});
    keep.push({l:0,r:W,t:0,b:118});
    function hit(q){return keep.some(function(k){return q.l<k.r&&q.r>k.l&&q.t<k.b&&q.b>k.t})}
    STORY.forEach(function(p){var d=$('.doo[data-dd="'+p[0]+'"]',box);if(!d||d.dataset.moved)return;
      var sc=parseFloat(d.style.scale)||1,w=d.offsetWidth*sc,h=d.offsetHeight*sc,x=p[1]*W,y=p[2]*H,dir=p[3]==="L"?-1:1,n=0;
      /* The thinker SVG reserves 640 viewBox units above his head for question marks. Anchor the figure, not that empty space. */
      if(p[0]==="think")y-=h*640/2415;
      x=Math.max(12,Math.min(W-w-12,x));y=Math.max(120,Math.min(H-h-12,y));
      var q=function(){return{l:x,r:x+w,t:y,b:y+h}};
      /* slide outward, away from the words, until it's clear; if the screen is too tight, slide down instead */
      while(hit(q())&&n<200){n++;var nx=x+dir*8;if(nx<12||nx+w>W-12){y=Math.min(H-h-12,y+8)}else x=nx}
      keep.push({l:x-14,r:x+w+14,t:y-14,b:y+h+14});
      d.style.left=(x-B.left).toFixed(0)+"px";d.style.top=(y-(B.top-hr.top)).toFixed(0)+"px";d.style.right="auto";d.style.bottom="auto";d.style.setProperty("--r","0deg")})}
  if(document.readyState==="complete")setTimeout(curate,0);else window.addEventListener("load",function(){setTimeout(curate,0)});
  window.addEventListener("resize",curate);window.addEventListener("hashchange",function(){setTimeout(curate,60)});
  if(box)box.addEventListener("pointerdown",function(e){var d=e.target.closest(".doo");if(d)d.dataset.moved=1});

  /* ---- a doodle or two on every page, each one placed on purpose ---- */
  var VB={read:"159 159 965 2489",sketch:"159 159 1763 1979",push:"159 159 2465 1757",mag:"159 159 905 2363"};
  function make(k){var src=$('#heroIn .doo[data-dd="'+k+'"]')||$('.doo[data-dd="'+k+'"]');var d;
    if(src){d=src.cloneNode(true);d.className="doo pgd";d.removeAttribute("style")}
    else{var v=VB[k].split(" ").map(Number);d=document.createElement("span");d.className="doo pgd";d.dataset.dd=k;
      d.innerHTML='<svg class="dd" style="--w:'+Math.round(v[2]/6)+';--h:'+Math.round(v[3]/6)+'" viewBox="'+VB[k]+'" aria-hidden="true"><use href="#dd-'+k+'" x="'+v[0]+'" y="'+v[1]+'" width="'+v[2]+'" height="'+v[3]+'"/></svg>'}
    d.setAttribute("aria-hidden","true");return d}
  /* [doodle, side, distance from the edge, top, tilt] */
  /* About: the reader, because everything here was self-taught, by reading and doing.
     Services: the phone and magnifying glass, next to "Pick the shape of the problem".
     Contact: the paper plane, the same plane that carries the brief when you hit send.
     Work: none. The four project cards are the picture there. */
  var PLAN={about:[["read","L",.05,130,-4]],offer:[["mag","L",.04,150,-2]],contact:[["plane","L",.05,110,-5]]};
  Object.keys(PLAN).forEach(function(k){var head=$("#v-"+k+" > section");if(!head)return;
    PLAN[k].forEach(function(p,i){var d=make(p[0]);d.style.top=p[3]+"px";d.style[p[1]==="L"?"left":"right"]="max(2%, calc(50% - 640px + "+(p[2]*100)+"px))";
      d.style.setProperty("--r",p[4]+"deg");d.style.animationDelay=(.3+i*.15)+"s";head.appendChild(d);drag(d,head)})});
  function drag(d,host){var st=null,ox=0,oy=0;
    d.addEventListener("pointerdown",function(e){if(e.button>0||e.target.classList.contains("rz"))return;e.preventDefault();d.setPointerCapture(e.pointerId);
      st={x:e.clientX-ox,y:e.clientY-oy};d.classList.add("drag")});
    d.addEventListener("pointermove",function(e){if(!st)return;var hb=host.getBoundingClientRect(),r=d.getBoundingClientRect(),nx=e.clientX-st.x,ny=e.clientY-st.y;
      ox=Math.min(ox+(hb.right-r.right),Math.max(ox-(r.left-hb.left),nx));oy=Math.min(oy+(hb.bottom-r.bottom),Math.max(oy-(r.top-hb.top-70),ny));d.style.translate=ox+"px "+oy+"px"});
    function up(){st=null;d.classList.remove("drag")}d.addEventListener("pointerup",up);d.addEventListener("pointercancel",up)}

  /* ---- resize any doodle from its corner ---- */
  function sizers(){$$(".doo,.fig").forEach(function(d){if(d.querySelector(":scope > .rz"))return;var h=document.createElement("i");h.className="rz";d.appendChild(h);
    var st=null;h.addEventListener("pointerdown",function(e){if(!d.classList.contains("sel"))return;e.preventDefault();e.stopPropagation();h.setPointerCapture(e.pointerId);var r=d.getBoundingClientRect();
      st={x:e.clientX,y:e.clientY,s:parseFloat(d.style.scale)||1,w:r.width+r.height};d.classList.add("sizing")});
    h.addEventListener("pointermove",function(e){if(!st)return;e.stopPropagation();var k=1+((e.clientX-st.x)+(e.clientY-st.y))/st.w;d.style.scale=Math.max(.5,Math.min(2.2,st.s*k)).toFixed(3)});
    function up(e){if(!st)return;st=null;d.classList.remove("sizing")}h.addEventListener("pointerup",up);h.addEventListener("pointercancel",up)})}
  sizers();

  /* ---- phone menu ---- */
  (function(){var nav=$(".nav"),chrome=$(".chrome");if(!nav||!chrome)return;
    var b=document.createElement("button");b.type="button";b.className="burger";b.setAttribute("aria-label","Menu");b.setAttribute("aria-expanded","false");
    b.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path class="k1" d="M5 9h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/><path class="k2" d="M5 15h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
    nav.appendChild(b);
    var mm=document.createElement("div");mm.className="navmenu";mm.setAttribute("role","menu");
    $$(".nav a[data-r]:not(.cta)").forEach(function(a){var c=a.cloneNode(true);c.removeAttribute("id");Array.prototype.forEach.call(c.querySelectorAll("[id]"),function(n){n.remove()});c.setAttribute("role","menuitem");mm.appendChild(c)});
    var ft=document.createElement("div");ft.className="foot2";
    ft.innerHTML='<span class="avl"><i></i>Available for projects</span><a class="navbook" href="/contact" role="menuitem">Book a call <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>';
    var book=ft.querySelector(".navbook");book.href=CALL;book.target="_blank";book.rel="noopener";
    mm.appendChild(ft);chrome.appendChild(mm);
    function set(on){mm.classList.toggle("on",on);b.classList.toggle("open",on);b.setAttribute("aria-expanded",on);
      if(on)selectNav(activeNavKey,activeNavContext)}
    b.addEventListener("click",function(e){e.stopPropagation();set(!mm.classList.contains("on"))});
    mm.addEventListener("click",function(){setTimeout(function(){set(false)},60)});
    document.addEventListener("pointerdown",function(e){if(!e.target.closest(".navmenu,.burger"))set(false)});
    window.addEventListener("hashchange",function(){set(false)});
  })();
  /* the handle shows only after a double-click or double-tap; a click anywhere else puts it away */
  var lastTap={t:0,d:null};
  function pick(d){$$(".doo.sel,.fig.sel").forEach(function(x){if(x!==d)x.classList.remove("sel")});if(d)d.classList.add("sel")}
  document.addEventListener("keydown",function(e){if(e.key==="Escape")pick(null)});
  document.addEventListener("dblclick",function(e){var d=e.target.closest&&e.target.closest(".doo,.fig");if(d){e.preventDefault();pick(d)}});
  document.addEventListener("pointerup",function(e){if(e.pointerType!=="touch")return;var d=e.target.closest&&e.target.closest(".doo,.fig"),now=performance.now();
    if(d&&lastTap.d===d&&now-lastTap.t<320)pick(d);lastTap={t:now,d:d}});
  document.addEventListener("pointerdown",function(e){if(e.target.closest&&e.target.closest(".doo.sel,.fig.sel"))return;pick(null)});
})();

/* =================== ROUND 8: free doodles =================== */
(function(){
  function lift(d){if(d.classList.contains("lifted"))return true;
    var view=d.closest(".view");if(!view)return false;
    var L=view.querySelector(":scope > .doolayer");if(!L){L=document.createElement("div");L.className="doolayer";view.appendChild(L)}
    var cs=getComputedStyle(d),r0=d.getBoundingClientRect(),tf=cs.transform,fs=cs.fontSize;
    /* inline and flex doodles leave a spacer behind, so the sentence or the table doesn't jump */
    if(cs.position!=="absolute"){var ph=d.cloneNode(true);ph.classList.add("ghostph");ph.removeAttribute("data-dd");ph.setAttribute("aria-hidden","true");
      Array.prototype.forEach.call(ph.querySelectorAll("[id]"),function(n){n.removeAttribute("id")});d.parentNode.insertBefore(ph,d)}
    if(d.closest("#hero"))d.dataset.home="hero";
    d.dataset.moved=1;L.appendChild(d);d.classList.add("lifted");
    d.style.left="0px";d.style.top="0px";d.style.right="auto";d.style.bottom="auto";d.style.translate="0px 0px";
    d.style.transform=tf==="none"?"none":tf;d.style.fontSize=fs;
    var r1=d.getBoundingClientRect();d.style.left=(r0.left-r1.left).toFixed(1)+"px";d.style.top=(r0.top-r1.top).toFixed(1)+"px";return true}
  var st=null;
  document.addEventListener("pointerdown",function(e){if(e.button>0)return;var t=e.target;
    if(!t.closest||t.closest(".rz,.icv,.ghostph"))return;var d=t.closest(".doo,.fig");if(!d)return;
    e.stopPropagation();e.preventDefault();if(!lift(d))return;
    st={d:d,x:e.clientX,y:e.clientY,l:parseFloat(d.style.left)||0,t:parseFloat(d.style.top)||0,home:null};
    /* hero illustrations stay in the hero: they can be moved around it but not into the sections below */
    if(d.dataset.home==="hero"){var hh=document.getElementById("hero"),h0=hh.getBoundingClientRect(),r0=d.getBoundingClientRect();
      st.home=hh;st.gap=Math.min(96,r0.top-h0.top)}
    try{d.setPointerCapture(e.pointerId)}catch(er){}d.classList.add("drag")},true);
  document.addEventListener("pointermove",function(e){if(!st)return;
    var l=st.l+e.clientX-st.x,t=st.t+e.clientY-st.y;st.d.style.left=l.toFixed(1)+"px";st.d.style.top=t.toFixed(1)+"px";
    if(st.home){var hb=st.home.getBoundingClientRect(),r=st.d.getBoundingClientRect(),ox=0,oy=0;
      if(r.left<hb.left+8)ox=hb.left+8-r.left;else if(r.right>hb.right-8)ox=hb.right-8-r.right;
      if(r.top<hb.top+st.gap)oy=hb.top+st.gap-r.top;else if(r.bottom>hb.bottom-8)oy=hb.bottom-8-r.bottom;
      if(ox||oy){st.d.style.left=(l+ox).toFixed(1)+"px";st.d.style.top=(t+oy).toFixed(1)+"px"}}},true);
  function up(){if(!st)return;st.d.classList.remove("drag");st=null}
  document.addEventListener("pointerup",up,true);document.addEventListener("pointercancel",up,true);
})();

(function(){
  window.SPLITCH=function(h){if(h.dataset.ch)return;h.dataset.ch=1;var host=h.querySelector(".hl")||h,i=0;
    var walk=function(n){Array.prototype.slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3){var frag=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;
          if(/^\s+$/.test(w)){frag.appendChild(document.createTextNode(w));return}
          var cw=document.createElement("span");cw.className="cw";
          Array.from(w).forEach(function(ch){var x=document.createElement("span");x.className="cx";x.style.setProperty("--i",i++);x.textContent=ch;cw.appendChild(x)});frag.appendChild(cw)});
        c.parentNode.replaceChild(frag,c)}
      else if(c.nodeType===1&&c.tagName.toLowerCase()!=="svg"&&!c.classList.contains("cx"))walk(c)})};
    walk(host);h.classList.add("chs")}
})();

/* =================== ROUND 9: work cards hover like the home cards =================== */
(function(){
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches;if(!fine)return;
  var view=document.getElementById("v-work"),grid=document.getElementById("wgrid");if(!view||!grid||typeof P==="undefined")return;
  var wv=document.createElement("div");wv.className="wveil";wv.setAttribute("aria-hidden","true");wv.innerHTML='<div class="book"></div>';
  var bk=wv.firstChild,wf=document.createElement("div");wf.className="feats wfeats";wf.setAttribute("aria-hidden","true");
  view.appendChild(wv);view.appendChild(wf);
  var hot=null,tm=0;
  function idx(c){var id=(c.getAttribute("href")||"").split("/").pop();for(var i=0;i<P.length;i++)if(P[i].id===id)return i;return -1}
  function place(c){var r=c.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;
    wv.style.setProperty("--cx",(r.left+r.width/2).toFixed(0)+"px");wv.style.setProperty("--cy",(r.top+r.height*.35).toFixed(0)+"px");
    Array.prototype.forEach.call(wf.querySelectorAll(".chip"),function(ch){var w=ch.offsetWidth,h=ch.offsetHeight,sx=+ch.dataset.sx,sy=+ch.dataset.sy,gap=36;
      var cx=r.left+r.width*sx+(+ch.dataset.jx),cy=r.top+r.height*sy+(+ch.dataset.jy);
      if(sy<0)cy=Math.min(cy,r.top-gap-h/2);else if(sy>1)cy=Math.max(cy,r.bottom+gap+h/2);
      cx=Math.max(w/2+26,Math.min(vw-w/2-26,cx));cy=Math.max(h/2+100,Math.min(vh-h/2-26,cy));
      ch.style.left=(cx-w/2).toFixed(1)+"px";ch.style.top=(cy-h/2).toFixed(1)+"px"})}
  function on(c){var i=idx(c);if(i<0||c.classList.contains("xray"))return;if(hot===c)return;off(true);hot=c;clearTimeout(tm);
    var p=P[i];bk.innerHTML=bookFor(p);c.classList.add("hot");grid.classList.add("hot");wv.classList.add("on");
    var cr=c.getBoundingClientRect(),vw=innerWidth,room=230;
    /* the cards stand shoulder to shoulder here, so the notes go above and below the card, never onto a neighbour */
    var spots=[[.1,-.12],[.9,1.12],[.95,-.1],[.08,1.1],[.5,-.24],[.5,1.26]];
    wf.className="feats wfeats";
    wf.innerHTML=(FEAT[p.id]||[]).map(function(f,k){var sp=spots[k%spots.length],rot=(Math.random()*12-6).toFixed(1);
      return '<span class="chip" data-sx="'+sp[0]+'" data-sy="'+sp[1]+'" data-jx="'+(Math.random()*24-12).toFixed(0)+'" data-jy="'+(Math.random()*20-10).toFixed(0)+'"'+
        ' style="--rot:'+rot+'deg;--d:'+(90+k*120)+'ms;--hl:'+p.s+'"><svg class="mark" aria-hidden="true"><path pathLength="1"/></svg><span class="t">'+f[0]+'</span>'+
        '<svg class="loop" aria-hidden="true"><path pathLength="1"/></svg></span>'}).join("");
    Array.prototype.forEach.call(wf.querySelectorAll(".chip"),function(ch){var w=ch.offsetWidth,h=ch.offsetHeight,lp=ch.querySelector(".loop"),mk=ch.querySelector(".mark");
      lp.setAttribute("viewBox","-20 -18 "+(w+40)+" "+(h+36));lp.style.left="-20px";lp.style.top="-18px";lp.style.width=(w+40)+"px";lp.style.height=(h+36)+"px";lp.firstChild.setAttribute("d",loopPath(w,h));
      mk.setAttribute("viewBox","0 0 "+w+" "+h);mk.style.width=w+"px";mk.style.height=h+"px";
      var y0=h*.6+(Math.random()*4-2),y1=h*.62+(Math.random()*4-2);
      mk.firstChild.setAttribute("d","M6 "+y0.toFixed(1)+"Q"+(w/2).toFixed(1)+" "+(h*.5).toFixed(1)+" "+(w-6).toFixed(1)+" "+y1.toFixed(1));mk.firstChild.setAttribute("stroke-width",(h*.5).toFixed(1))});
    place(c);requestAnimationFrame(function(){requestAnimationFrame(function(){if(hot===c)wf.classList.add("in")})})}
  function off(now){if(!hot)return;var c=hot;hot=null;c.classList.remove("hot");grid.classList.remove("hot");wv.classList.remove("on");wf.classList.remove("in");
    clearTimeout(tm);tm=setTimeout(function(){if(!hot)wf.innerHTML=""},now?0:320)}
  function bind(){Array.prototype.forEach.call(grid.querySelectorAll(".wcard:not([data-bk])"),function(c){c.dataset.bk=1;
    /* focus on a real mouse move, never on the browser's hover update as the grid scrolls under a resting cursor */
    c.addEventListener("mousemove",function(e){if(hot!==c&&!SCROLLING&&(e.movementX||e.movementY))on(c)});c.addEventListener("mouseleave",function(){if(hot===c)off()});
    c.addEventListener("pointerdown",function(){if(hot===c)off(true)})})}
  bind();setTimeout(bind,500);
  /* a card scrolled out from under a still cursor never gets mouseleave, so the focus used to stick:
     on scroll, check the last pointer position against the card and let go if it's no longer over it */
  var px=-1,py=-1,sr=0;window.addEventListener("pointermove",function(e){px=e.clientX;py=e.clientY},{passive:true});
  window.addEventListener("scroll",function(){if(!hot||sr)return;sr=requestAnimationFrame(function(){sr=0;if(!hot)return;
    var r=hot.getBoundingClientRect();if(px<r.left||px>r.right||py<r.top||py>r.bottom){off(true);return}place(hot)})},{passive:true});
  window.addEventListener("hashchange",function(){off(true);setTimeout(bind,150)});
})();
/* =================== ROUND 11: behaviour =================== */
/* ---- lightbox: blurred grainy page behind, arrows, swipe, keys ---- */
var LBX=(function(){
  var el=document.createElement("div");el.className="lbx";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","Image viewer");
  el.innerHTML='<div class="lbx-bg"></div><figure class="lbx-fig"><img alt=""><figcaption></figcaption></figure>'+
    '<button type="button" class="lbx-x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'+
    '<button type="button" class="lbx-a lbx-prev" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>'+
    '<button type="button" class="lbx-a lbx-next" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button><span class="lbx-c"></span>';
  document.body.appendChild(el);
  var img=el.querySelector("img"),cap=el.querySelector("figcaption"),fig=el.querySelector(".lbx-fig"),cnt=el.querySelector(".lbx-c"),
      pv=el.querySelector(".lbx-prev"),nx=el.querySelector(".lbx-next"),items=[],i=0,back=null,dark=false;
  function paint(dir){var it=items[i];cap.textContent=it.cap||"";cnt.textContent=(i+1)+" / "+items.length;
    pv.hidden=i===0;nx.hidden=i===items.length-1;
    if(dir){img.animate([{opacity:0,transform:"translateX("+(dir*60)+"px) scale(.97)"},{opacity:1,transform:"none"}],{duration:380,easing:"cubic-bezier(.22,1,.36,1)"})}
    img.src=it.src;img.alt=it.cap||""}
  function open(list,k,from){items=list;i=k;back=document.activeElement;paint(0);el.classList.add("is-open");document.documentElement.classList.add("lbx-lock");
    if(from&&from.getBoundingClientRect){var a=from.getBoundingClientRect();requestAnimationFrame(function(){var b=img.getBoundingClientRect();if(!b.width)return;
      img.animate([{transform:"translate("+(a.left+a.width/2-b.left-b.width/2)+"px,"+(a.top+a.height/2-b.top-b.height/2)+"px) scale("+(a.width/b.width)+")",opacity:.4},{transform:"none",opacity:1}],{duration:460,easing:"cubic-bezier(.22,1,.36,1)"})})}
    setTimeout(function(){el.querySelector(".lbx-x").focus({preventScroll:true})},30)}
  function close(){if(!el.classList.contains("is-open"))return;el.classList.remove("is-open");document.documentElement.classList.remove("lbx-lock");if(back&&back.focus)back.focus({preventScroll:true})}
  function go(d){var j=i+d;if(j<0||j>=items.length)return;i=j;paint(d)}
  el.querySelector(".lbx-bg").addEventListener("click",close);el.querySelector(".lbx-x").addEventListener("click",close);
  pv.addEventListener("click",function(){go(-1)});nx.addEventListener("click",function(){go(1)});
  fig.addEventListener("click",function(e){if(e.target===fig)close()});
  document.addEventListener("keydown",function(e){if(!el.classList.contains("is-open"))return;
    if(e.key==="Escape")close();else if(e.key==="ArrowRight")go(1);else if(e.key==="ArrowLeft")go(-1)});
  var sx=null,sy=0;
  fig.addEventListener("pointerdown",function(e){sx=e.clientX;sy=e.clientY});
  fig.addEventListener("pointerup",function(e){if(sx===null)return;var dx=e.clientX-sx,dy=e.clientY-sy;sx=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))go(dx<0?1:-1)});
  fig.addEventListener("touchmove",function(e){e.preventDefault()},{passive:false});
  return {open:open,close:close}})();

/* ---- APK request popup ---- */
var APK=(function(){
  var el=document.createElement("div");el.className="apkm";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-labelledby","apkT");
  el.innerHTML='<div class="lbx-bg"></div><form class="apk-card" novalidate>'+
    '<button type="button" class="apk-x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>'+
    '<span class="apk-ic">'+ALT.face+'</span><h3 id="apkT">Get the Alter APK</h3>'+
    '<p class="apk-lede">It’s Android only for now. Leave your details and I’ll send the file to you myself.</p>'+
    '<label><span>Your name</span><input name="n" autocomplete="name" required></label>'+
    '<label><span>Email</span><input name="e" type="email" autocomplete="email" required></label>'+
    '<label><span>Your phone <em>optional</em></span><input name="d" placeholder="Pixel 8, Galaxy S23, OnePlus 12"></label>'+
    '<label><span>What you want to use it for <em>optional</em></span><textarea name="w" rows="3"></textarea></label>'+
    '<p class="apk-err" role="alert"></p>'+
    '<button type="submit" class="btn apk-go">Request the APK '+ARW+'</button>'+
    '<div class="apk-ok"><span class="apk-tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span><h3>Your request is ready</h3>'+
    '<p>Your mail app should be open with everything filled in. Hit send there and I’ll reply with the APK.</p>'+
    '<p class="apk-small">Mail app didn’t open? Write to <a href="mailto:adi.workspace76865@gmail.com?subject=Alter%20APK%20request">adi.workspace76865@gmail.com</a></p>'+
    '<button type="button" class="btn ghost apk-close">Close</button></div></form>';
  document.body.appendChild(el);
  var f=el.querySelector("form"),err=el.querySelector(".apk-err"),back=null;
  function open(){back=document.activeElement;f.classList.remove("sent");err.textContent="";el.classList.add("is-open");document.documentElement.classList.add("lbx-lock");
    setTimeout(function(){f.elements.n.focus({preventScroll:true})},60)}
  function close(){el.classList.remove("is-open");document.documentElement.classList.remove("lbx-lock");if(back&&back.focus)back.focus({preventScroll:true})}
  el.querySelector(".lbx-bg").addEventListener("click",close);el.querySelector(".apk-x").addEventListener("click",close);el.querySelector(".apk-close").addEventListener("click",close);
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&el.classList.contains("is-open"))close()});
  f.addEventListener("submit",function(e){e.preventDefault();var n=f.elements.n.value.trim(),m=f.elements.e.value.trim();
    if(!n){err.textContent="Add your name so I know who’s asking.";f.elements.n.focus();return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)){err.textContent="That email doesn’t look right.";f.elements.e.focus();return}
    err.textContent="";
    var body="Hi Aditya,\n\nI'd like to try "+(window.APKAPP||"Alter")+".\n\nName: "+n+"\nEmail: "+m+(f.elements.d.value.trim()?"\nPhone: "+f.elements.d.value.trim():"")+(f.elements.w.value.trim()?"\n\nWhat I want to use it for:\n"+f.elements.w.value.trim():"");
    location.href="mailto:adi.workspace76865@gmail.com?subject="+encodeURIComponent((window.APKAPP||"Alter")+" APK request from "+n)+"&body="+encodeURIComponent(body);
    f.classList.add("sent")});
  document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-apk]");if(b){e.preventDefault();open()}});
  return {open:open}})();

/* ---- the cover canvas ---- */
function acvWire(root){if(!root||root.dataset.w)return;root.dataset.w=1;
  var world=root.querySelector(".acv-world"),pct=root.querySelector(".acv-pct"),fr=root.querySelectorAll(".af,.asec");
  var st={x:0,y:0,z:1},ptr={},live=false,moved=false,sel=null;
  var B={l:1e9,t:1e9,r:-1e9,b:-1e9};Array.prototype.forEach.call(fr,function(f){var l=parseFloat(f.style.left),t=parseFloat(f.style.top),w=parseFloat(f.style.width),h=parseFloat(f.style.height);
    B.l=Math.min(B.l,l);B.t=Math.min(B.t,t);B.r=Math.max(B.r,l+w);B.b=Math.max(B.b,t+h)});
  function clamp(){var W=root.clientWidth,H=root.clientHeight,m=80;
    st.x=Math.min(W-m-B.l*st.z,Math.max(m-B.r*st.z,st.x));st.y=Math.min(H-m-B.t*st.z,Math.max(m-B.b*st.z,st.y))}
  function apply(){clamp();liveZoom(world);world.style.transform="translate("+st.x.toFixed(1)+"px,"+st.y.toFixed(1)+"px) scale("+st.z.toFixed(4)+")";
    root.style.setProperty("--iz",(1/st.z).toFixed(4));var g=24*st.z;
    root.style.backgroundSize=g+"px "+g+"px";root.style.backgroundPosition=(st.x%g)+"px "+(st.y%g)+"px";pct.textContent=Math.round(st.z*100)+"%"}
  function zoomAt(z,cx,cy){touchedCv=true;z=Math.max(.12,Math.min(3,z));var k=z/st.z;st.x=cx-(cx-st.x)*k;st.y=cy-(cy-st.y)*k;st.z=z;apply()}
  function fitTo(l,t,r,b,anim){var W=root.clientWidth,H=root.clientHeight;if(!W||!H)return;var pad=W<600?18:40,top=40,bot=58,z=Math.min((W-pad*2)/(r-l),(H-top-bot-pad)/(b-t));
    var tx=W/2-(l+r)/2*z,ty=top+(H-top-bot)/2-(t+b)/2*z;
    if(anim){var s0={x:st.x,y:st.y,z:st.z},t0=performance.now();(function f(n){var p=Math.min(1,(n-t0)/520),e=1-Math.pow(1-p,3);
      st.x=s0.x+(tx-s0.x)*e;st.y=s0.y+(ty-s0.y)*e;st.z=s0.z+(z-s0.z)*e;apply();if(p<1)requestAnimationFrame(f)})(t0)}
    else{st.x=tx;st.y=ty;st.z=z;apply()}}
  function home(anim){var W=root.clientWidth,hb=root.getAttribute(W<600&&root.dataset.homem?"data-homem":"data-home");
    if(hb){var q=hb.split(",").map(Number);fitTo(q[0],q[1],q[2],q[3],anim);return}
    if(W<600)fitTo(0,0,1000,1000,anim);else fitTo(0,0,2420,1300,anim)}
  var touchedCv=false;
  function home2(){if(root.clientWidth>0&&root.clientHeight>0&&!touchedCv)home(false)}
  if("ResizeObserver" in window)new ResizeObserver(home2).observe(root);else setTimeout(home2,300);
  function rel(e){var r=root.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]}
  function setLive(v){live=v;root.classList.toggle("acv-live",v)}
  var touchy=matchMedia("(hover:none)").matches,lit=false;
  /* click to activate: until then the wheel and a finger scroll the page, never the canvas */
  var fine=root.querySelector(".acv-hint .fine");if(fine&&!root.querySelector(".acv-hint .off")){var off=document.createElement("span");off.className="off";off.textContent="Click to explore the canvas";fine.parentNode.insertBefore(off,fine)}
  root.addEventListener("pointerdown",function(e){if(e.target.closest("button"))return;
    if(e.pointerType==="touch"&&!live){return}
    lit=!live;if(!live)setLive(true);
    ptr[e.pointerId]=rel(e);moved=false;touchedCv=true;root.classList.add("acv-grab");try{root.setPointerCapture(e.pointerId)}catch(er){}});
  root.addEventListener("pointermove",function(e){if(!ptr[e.pointerId])return;var p=rel(e),ids=Object.keys(ptr);
    if(ids.length===1){var o=ptr[e.pointerId];if(Math.abs(p[0]-o[0])+Math.abs(p[1]-o[1])>2)moved=true;st.x+=p[0]-o[0];st.y+=p[1]-o[1];ptr[e.pointerId]=p;apply()}
    else if(ids.length===2){var a=ptr[ids[0]],b=ptr[ids[1]],d0=Math.hypot(a[0]-b[0],a[1]-b[1]);ptr[e.pointerId]=p;a=ptr[ids[0]];b=ptr[ids[1]];
      var d1=Math.hypot(a[0]-b[0],a[1]-b[1]),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;moved=true;if(d0>0)zoomAt(st.z*d1/d0,mx,my)}});
  function up(e){delete ptr[e.pointerId];if(!Object.keys(ptr).length)root.classList.remove("acv-grab")}
  root.addEventListener("pointerup",up);root.addEventListener("pointercancel",up);
  root.addEventListener("click",function(e){if(e.target.closest("button"))return;
    if(!live){setLive(true);return}
    if(lit){lit=false;return}
    if(moved)return;var f=e.target.closest(".af");if(sel)sel.classList.remove("afsel");sel=f&&f!==sel?f:null;if(sel)sel.classList.add("afsel")});
  /* once live, the wheel zooms. At the zoom limits the page scrolls on as normal. */
  root.addEventListener("wheel",function(e){if(!live)return;var p=rel(e),pinch=e.ctrlKey||e.metaKey,d=e.deltaY*(e.deltaMode===1?16:1);
    if(!pinch&&Math.abs(e.deltaX)>Math.abs(d)){e.preventDefault();st.x-=e.deltaX;apply();return}
    if((d>0&&st.z<=.121)||(d<0&&st.z>=2.99))return;
    e.preventDefault();zoomAt(st.z*Math.exp(-d*(pinch?.01:.0016)),p[0],p[1])},{passive:false});
  document.addEventListener("keydown",function(e){if(live&&e.key==="Escape")setLive(false)});
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){if(!es[0].isIntersecting&&live)setLive(false)},{threshold:0}).observe(root);
  root.querySelector(".acv-done").addEventListener("click",function(){setLive(false);home(true)});
  document.addEventListener("pointerdown",function(e){if(live&&!root.contains(e.target))setLive(false)});
  root.querySelector(".acv-bar").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var W=root.clientWidth,H=root.clientHeight;
    if(b.dataset.z==="fit")fitTo(B.l,B.t,B.r,B.b,true);else zoomAt(st.z*(b.dataset.z==="+"?1.25:.8),W/2,H/2)});
  root.addEventListener("keydown",function(e){var W=root.clientWidth,H=root.clientHeight,k=e.key;
    if(k==="+"||k==="=")zoomAt(st.z*1.25,W/2,H/2);else if(k==="-")zoomAt(st.z*.8,W/2,H/2);else if(k==="0")home(true);
    else if(/^Arrow/.test(k)){e.preventDefault();st.x+=k==="ArrowLeft"?60:k==="ArrowRight"?-60:0;st.y+=k==="ArrowUp"?60:k==="ArrowDown"?-60:0;apply()}});

  var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){root.classList.add("isin");io.disconnect()}},{threshold:.25});io.observe(root)}

/* ---- the stage: depth on scroll, pick up on hover, open big on tap ---- */
function stgWire(){var g=document.getElementById("stg");if(!g||g.dataset.w)return;g.dataset.w=1;
  Array.prototype.forEach.call(document.querySelectorAll(".itr-f:not([data-w])"),function(f){f.dataset.w=1;f.addEventListener("click",function(){
    var all=Array.prototype.slice.call(document.querySelectorAll(".itr-f"));
    LBX.open(all.map(function(x){return {src:x.querySelector("img").src,cap:x.dataset.cap}}),all.indexOf(f),f.querySelector("img"))});
    f.addEventListener("keydown",function(e){if(e.key==="Enter")f.click()})});
  var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){g.classList.add("isin");io.disconnect()}},{threshold:.2});io.observe(g);
  g.addEventListener("click",function(e){var f=e.target.closest(".stp");if(!f)return;
    var vis=Array.prototype.filter.call(g.querySelectorAll(".stp"),function(x){return getComputedStyle(x).display!=="none"});
    LBX.open(vis.map(function(x){return {src:x.querySelector("img").src,cap:x.dataset.cap}}),vis.indexOf(f),f.querySelector("img"))});
  g.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.classList.contains("stp"))e.target.click()})}

/* ---- live components ---- */
function compWire(){
  Array.prototype.forEach.call(document.querySelectorAll(".np:not([data-w])"),function(np){np.dataset.w=1;var bs=np.querySelectorAll("button"),auto=0,k=0,touched=false;
    function pick(i){Array.prototype.forEach.call(bs,function(b,j){b.classList.toggle("act",i===j);b.setAttribute("aria-selected",i===j?"true":"false")})}
    Array.prototype.forEach.call(bs,function(b,i){b.addEventListener("click",function(){touched=true;clearInterval(auto);pick(i)})});
    var io=new IntersectionObserver(function(es){clearInterval(auto);if(es[0].isIntersecting&&!touched)auto=setInterval(function(){k=(k+1)%bs.length;pick(k)},1600)});io.observe(np)});
  Array.prototype.forEach.call(document.querySelectorAll(".tray:not([data-w])"),function(t){t.dataset.w=1;var f=t.querySelector(".dfab");
    f.addEventListener("click",function(){var o=!t.classList.contains("is-open");t.classList.toggle("is-open",o);f.setAttribute("aria-expanded",o);f.setAttribute("aria-label",o?"Close the add tray":"Open the add tray");
      Array.prototype.forEach.call(t.querySelectorAll(".tray-o button"),function(b){b.tabIndex=o?0:-1})})});
  Array.prototype.forEach.call(document.querySelectorAll(".atk:not([data-w])"),function(tk){tk.dataset.w=1;var ul=tk.querySelector(".atk-l"),dn=tk.querySelector(".atk-done b"),orig=ul.innerHTML,done=0;
    function bind(){Array.prototype.forEach.call(ul.querySelectorAll(".cb"),function(cb){cb.addEventListener("click",function(){var li=cb.parentNode;if(li.classList.contains("tkgo"))return;
      li.classList.add("tkgo");if(navigator.vibrate)try{navigator.vibrate(12)}catch(e){}
      setTimeout(function(){dust(li)},160)})})}
    function dust(li){var r=li.getBoundingClientRect(),tr=tk.getBoundingClientRect(),sp=li.querySelector("span");
      for(var i=0;i<46;i++){var d=document.createElement("i");d.className="dust";var x=Math.random()*r.width,y=Math.random()*r.height;
        d.style.left=(r.left-tr.left+x)+"px";d.style.top=(r.top-tr.top+y)+"px";if(Math.random()<.3)d.style.background="#FFCC00";tk.appendChild(d);
        d.animate([{transform:"translate(0,0) scale(1)",opacity:1},{transform:"translate("+(30+Math.random()*90)+"px,"+(-40+Math.random()*50)+"px) scale(.2)",opacity:0}],
          {duration:420+Math.random()*260,easing:"cubic-bezier(.2,.7,.3,1)",delay:x/r.width*140}).onfinish=function(){this.effect.target.remove()}}
      sp.animate([{opacity:1,filter:"blur(0)"},{opacity:0,filter:"blur(6px)"}],{duration:300,fill:"forwards"});
      li.animate([{height:r.height+"px"},{height:"0px",paddingTop:"0px",paddingBottom:"0px"}],{duration:320,delay:260,easing:"ease",fill:"forwards"}).onfinish=function(){li.remove();done++;dn.textContent=done;
        dn.parentNode.animate([{transform:"scale(1.15)"},{transform:"scale(1)"}],{duration:300});if(!ul.children.length)tk.classList.add("atk-empty")}}
    tk.querySelector(".atk-re").addEventListener("click",function(){ul.innerHTML=orig;done=0;dn.textContent=0;tk.classList.remove("atk-empty");bind()});
    bind()});
  Array.prototype.forEach.call(document.querySelectorAll(".cset:not([data-w])"),function(c){c.dataset.w=1;c.addEventListener("click",function(){var all=Array.prototype.slice.call(document.querySelectorAll(".cset"));
    LBX.open(all.map(function(x){return {src:x.querySelector("img").src,cap:x.dataset.cap+" component set"}}),all.indexOf(c),c.querySelector("img"))})})}

window.caseWire=function(p){
  acvWire(document.getElementById("acv"));stgWire();compWire();
  var sk=Array.prototype.slice.call(document.querySelectorAll(".cs-sketches figure"));
  sk.forEach(function(f,i){if(f.dataset.w)return;f.dataset.w=1;f.tabIndex=0;f.setAttribute("role","button");f.setAttribute("aria-label","Open sketch: "+f.querySelector("figcaption").textContent);
    function op(){LBX.open(sk.map(function(x){return {src:x.querySelector("img").src,cap:x.querySelector("figcaption").textContent}}),i,f.querySelector("img"))}
    f.addEventListener("click",op);f.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();op()}})})};


/* =================== ROUND 14: Track It behaviour =================== */
function trkParse(t){var l=t.toLowerCase(),out=[];
  function guess(d){d=d.toLowerCase();function has(a){return a.some(function(w){return d.indexOf(w)>-1})}
    if(has(["zomato","swiggy","coffee","food","lunch","dinner","groceries","restaurant","cafe","pizza","eat","burger","juice","tea","milk","drink","snack","fruit","momo","chai","maggi","grocery","sweet","bakery"]))return "Food";
    if(has(["uber","ola","rapido","metro","petrol","fuel","ticket","train","bus","flight","cab","auto"]))return "Transport";
    if(has(["amazon","flipkart","clothes","shoes","myntra","zara","mall","buy","purchase","gift"]))return "Shopping";
    if(has(["rent","electricity","wifi","bill","recharge","jio","airtel","electric","gas","water"]))return "Bills";
    if(has(["movie","netflix","spotify","game","club","party","pub","concert"]))return "Entertainment";
    return "Other"}
  l.split(/\band\b|\balso\b|\bthen\b|,|;|\+/).forEach(function(c){c=c.trim();if(!c)return;var m=c.match(/\d+(?:\.\d+)?/g);if(!m)return;
    var a=Math.max.apply(null,m.map(Number)),d=c.split(String(a)).join("").replace(/\b(ispent|spent|rupees|rs|on|for|bought|paid|of|a|an|the|i|we|my|had)\b/gi,"").replace(/₹/g,"").replace(/\s+/g," ").trim().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi,"");
    if(!d)d="Voice entry";d=d.charAt(0).toUpperCase()+d.slice(1);
    var sub=/netflix|spotify|youtube|prime|hotstar|airtel|jio|icloud|google one/i.test(d);out.push([d,a,guess(d),sub])});
  return out}
function trkWire(){
  /* 1. dock + sheet */
  Array.prototype.forEach.call(document.querySelectorAll(".trk-dk:not([data-w])"),function(g){g.dataset.w=1;
    var add=g.querySelector(".trk-add"),big=g.querySelector(".trk-big em"),sp=g.querySelector(".trk-sp"),lf=g.querySelector(".trk-lf"),cat="Food";
    function open(o){g.classList.toggle("open",o);add.setAttribute("aria-expanded",o?"true":"false");if(o)setTimeout(function(){g.querySelector(".trk-a").focus({preventScroll:true})},380)}
    Array.prototype.forEach.call(g.querySelectorAll(".trk-db"),function(b){b.addEventListener("pointerdown",function(){b.classList.add("pr")});["pointerup","pointerleave","pointercancel"].forEach(function(t){b.addEventListener(t,function(){b.classList.remove("pr")})})});
    add.addEventListener("click",function(){open(true)});
    g.querySelector(".trk-x").addEventListener("click",function(){open(false)});g.querySelector(".trk-dim").addEventListener("click",function(){open(false)});
    Array.prototype.forEach.call(g.querySelectorAll(".trk-chip"),function(c){c.addEventListener("click",function(){Array.prototype.forEach.call(g.querySelectorAll(".trk-chip"),function(x){x.classList.toggle("on",x===c)});cat=c.dataset.c})});
    function tick(el,from,to){var t0=performance.now();(function f(n){var p=Math.min(1,(n-t0)/650),e=1-Math.pow(1-p,3);el.textContent=Math.round(from+(to-from)*e).toLocaleString("en-IN");if(p<1)requestAnimationFrame(f)})(t0)}
    g.querySelector(".trk-save").addEventListener("click",function(){var a=parseFloat(g.querySelector(".trk-a").value.replace(/[^\d.]/g,""));
      if(!(a>0)){g.querySelector(".trk-a").focus();g.querySelector(".trk-in").animate([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],{duration:260});return}
      var t=+g.dataset.today,s2=+g.dataset.spent,l2=+g.dataset.left;g.dataset.today=t+a;g.dataset.spent=s2+a;g.dataset.left=l2-a;open(false);
      setTimeout(function(){tick(big,t,t+a);sp.textContent=inr(s2+a);lf.textContent=inr(l2-a);big.parentNode.animate([{transform:"scale(1)"},{transform:"scale(1.06)"},{transform:"scale(1)"}],{duration:420,easing:"cubic-bezier(.34,1.56,.64,1)"})},260)});
    g.querySelector(".trk-a").addEventListener("keydown",function(e){if(e.key==="Enter")g.querySelector(".trk-save").click()})});
  /* 2. swipe */
  Array.prototype.forEach.call(document.querySelectorAll(".trk-sw:not([data-w])"),function(g){g.dataset.w=1;var ul=g.querySelector(".trk-list"),orig=ul.innerHTML;
    function bind(){Array.prototype.forEach.call(ul.querySelectorAll("li"),function(li){var c=li.querySelector(".trk-card"),x0=null,dx=0,w=1;
      c.addEventListener("pointerdown",function(e){x0=e.clientX;dx=0;w=c.offsetWidth;c.style.transition="none";try{c.setPointerCapture(e.pointerId)}catch(er){}});
      c.addEventListener("pointermove",function(e){if(x0===null)return;dx=e.clientX-x0;c.style.transform="translateX("+dx+"px)";li.classList.toggle("r",dx>0);li.classList.toggle("l",dx<0);li.classList.toggle("go",Math.abs(dx)>w*.35)});
      function end(){if(x0===null)return;x0=null;c.style.transition="";
        if(dx>w*.35){c.style.transform="translateX(110%)";setTimeout(function(){li.style.height=li.offsetHeight+"px";requestAnimationFrame(function(){li.classList.add("gone")});setTimeout(function(){li.remove();g.classList.toggle("some",true)},320)},200)}
        else if(dx<-w*.35){c.style.transform="";li.classList.remove("l","r","go");c.classList.add("ed");setTimeout(function(){c.classList.remove("ed")},900)}
        else{c.style.transform="";setTimeout(function(){li.classList.remove("l","r","go")},300)}}
      c.addEventListener("pointerup",end);c.addEventListener("pointercancel",end)})}
    g.querySelector(".trk-re").addEventListener("click",function(){ul.innerHTML=orig;g.classList.remove("some");bind()});bind()});
  /* 3. voice */
  Array.prototype.forEach.call(document.querySelectorAll(".trk-vo:not([data-w])"),function(g){g.dataset.w=1;var mic=g.querySelector(".trk-mic"),st=g.querySelector(".trk-st"),tx=g.querySelector(".trk-tx"),res=g.querySelector(".trk-res"),inp=g.querySelector(".trk-say input"),busy=false;
    function go(){if(busy)return;busy=true;var t=inp.value.trim()||"spent 350 rupees on movies";res.innerHTML="";tx.textContent="";g.classList.remove("done");g.classList.add("on");st.textContent="Listening...";
      var i=0,iv=setInterval(function(){i+=2;tx.textContent="“"+t.slice(0,i)+(i<t.length?"":"”");if(i>=t.length){clearInterval(iv);
        setTimeout(function(){g.classList.remove("on");var r=trkParse(t);
          if(!r.length){st.textContent="Could not find an amount in that";busy=false;return}
          st.textContent="Added "+r.length+" via voice";g.classList.add("done");
          r.forEach(function(x,k){var li=document.createElement("li");li.style.setProperty("--k",k);li.innerHTML=trkRow(x[0],x[2],x[1],x[2]+(x[3]?" • every month":""),x[3]);res.appendChild(li)});busy=false},420)}},45)}
    mic.addEventListener("click",go);inp.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();go()}})})}
(function(){var cw=window.caseWire;window.caseWire=function(p){if(cw)cw(p);if(p&&p.id==="track-it")trkWire()}})();

/* ---- the Track It card: the app's own dock. Its + opens the add sheet, like in the app ---- */
(function(){
  var cv='<span class="ccv trk-ccv"><span class="cph"><img class="c1" alt="" draggable="false" src="'+TRK.t_home.u+'"><img class="c2" alt="" draggable="false" src="'+TRK.t_add.u+'">'+
    '<span class="trk-hot trk-plus" role="button" tabindex="0" aria-label="Add a transaction"></span><span class="trk-hot trk-sv" role="button" tabindex="-1" aria-label="Save expense"></span></span></span>';
  Array.prototype.forEach.call(document.querySelectorAll('#deck .card[href="/work/track-it"] .card-art,#wgrid .wcard[href="/work/track-it"] .top'),function(n){n.innerHTML=cv;n.classList.add("hascv");
    var c=n.querySelector(".ccv"),pl=n.querySelector(".trk-plus"),sv=n.querySelector(".trk-sv");
    [pl,sv].forEach(function(f){["pointerdown","mousedown","touchstart","pointerup"].forEach(function(t){f.addEventListener(t,function(e){e.stopPropagation()},{passive:true})})});
    function set(o,e){if(e){e.preventDefault();e.stopPropagation()}c.classList.toggle("open",o);pl.tabIndex=o?-1:0;sv.tabIndex=o?0:-1}
    pl.addEventListener("click",function(e){set(true,e)});sv.addEventListener("click",function(e){set(false,e)});
    [pl,sv].forEach(function(f){f.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")f.click()})});
    var card=n.closest("a");if(card)card.addEventListener("mouseleave",function(){set(false)})})})();

/* ---- the APK popup names the app you are reading about ---- */
(function(){var def=null;
  document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-apk]");if(!b)return;var m=document.querySelector(".apkm");if(!m)return;
    var ic=m.querySelector(".apk-ic"),tt=m.querySelector("#apkT");if(!def)def=[ic.innerHTML,tt.textContent];
    var trk=/track-it/.test(HASH()),hb=/hourbit/.test(HASH());window.APKAPP=trk?"Track It":hb?"Hourbit":"Alter";
    ic.innerHTML=trk?TRK.t_icon:hb?'<svg viewBox="0 0 24 24" style="fill:#98FF53;background:#121212;border-radius:22%;padding:18%;box-sizing:border-box;width:100%;height:100%"><path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z"/></svg>':def[0];
    tt.textContent=trk?"Get the Track It APK":hb?"Get the Hourbit APK":def[1];m.classList.toggle("trk-apk",trk)},true)})();
/* ---- the Alter card on home and work wears its real screens ---- */
(function(){
  /* one phone, showing Home. The + on it is real: tap it and the add tray opens out of it, like in the app. */
  var cv='<span class="ccv"><span class="cph"><img class="c1" alt="" draggable="false" src="'+ALT.x_home.u+'"><img class="c2" alt="" draggable="false" src="'+ALT.x_addtray.u+'">'+
    '<span class="cfab" role="button" tabindex="0" aria-label="Open the add menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span></span></span>';
  Array.prototype.forEach.call(document.querySelectorAll('#deck .card[href="/work/alter"] .card-art,#wgrid .wcard[href="/work/alter"] .top'),function(n){n.innerHTML=cv;n.classList.add("hascv");
    var c=n.querySelector(".ccv"),f=n.querySelector(".cfab");
    function stop(e){e.preventDefault();e.stopPropagation()}
    ["pointerdown","mousedown","touchstart","pointerup"].forEach(function(t){f.addEventListener(t,function(e){e.stopPropagation()},{passive:true})});
    function tog(e){stop(e);var o=!c.classList.contains("open");c.classList.toggle("open",o);f.setAttribute("aria-label",o?"Close the add menu":"Open the add menu")}
    f.addEventListener("click",tog);f.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")tog(e)});
    var card=n.closest("a");if(card)card.addEventListener("mouseleave",function(){c.classList.remove("open")})})})();



/* =================== ROUND 16: Washio behaviour =================== */
function wshWire(){
  /* lightbox for the site map and the wireframe strip */
  Array.prototype.forEach.call(document.querySelectorAll(".cs-fig:not([data-w]),.cs-strip figure:not([data-w])"),function(f){f.dataset.w=1;
    f.addEventListener("click",function(){var all=Array.prototype.slice.call(document.querySelectorAll(".cs-fig,.cs-strip figure"));
      LBX.open(all.map(function(x){return {src:x.querySelector("img").src,cap:x.dataset.cap}}),all.indexOf(f),f.querySelector("img"))});
    f.addEventListener("keydown",function(e){if(e.key==="Enter")f.click()})});
  /* 1. bag */
  Array.prototype.forEach.call(document.querySelectorAll(".wsh-bag:not([data-w])"),function(g){g.dataset.w=1;var q=[0,0,0,0];
    function paint(){var n=q.reduce(function(a,b){return a+b},0);g.dataset.n=n;g.classList.toggle("has",n>0);
      g.querySelector(".wsh-tot").textContent="₹"+(n*7);g.querySelector(".wsh-cnt").textContent=n+(n===1?" pc":" pcs")+" · Wash & Fold";
      Array.prototype.forEach.call(g.querySelectorAll(".wsh-items li"),function(li,i){li.classList.toggle("in",q[i]>0);li.querySelector("output").textContent=q[i]})}
    Array.prototype.forEach.call(g.querySelectorAll(".wsh-items li"),function(li,i){
      li.querySelector(".wsh-a").addEventListener("click",function(){q[i]=1;paint();li.querySelector(".wsh-st").animate([{transform:"scale(.86)",opacity:0},{transform:"scale(1.04)",offset:.6},{transform:"scale(1)",opacity:1}],{duration:320,easing:"ease-out"})});
      li.querySelector(".wsh-p").addEventListener("click",function(){q[i]++;paint();li.querySelector("output").animate([{transform:"translateY(-6px)",opacity:0},{transform:"none",opacity:1}],{duration:220})});
      li.querySelector(".wsh-m").addEventListener("click",function(){q[i]=Math.max(0,q[i]-1);paint()})});
    g.querySelector(".wsh-vb").addEventListener("click",function(e){e.currentTarget.animate([{transform:"scale(1)"},{transform:"scale(.92)"},{transform:"scale(1)"}],{duration:260,easing:"cubic-bezier(.34,1.56,.64,1)"})});
    paint()});
  /* 2. slot */
  Array.prototype.forEach.call(document.querySelectorAll(".wsh-slot:not([data-w])"),function(g){g.dataset.w=1;var d=0,t=1,b=0;
    function paint(){Array.prototype.forEach.call(g.querySelectorAll(".wsh-days button"),function(x,i){x.classList.toggle("on",i===d)});
      Array.prototype.forEach.call(g.querySelectorAll(".wsh-times button"),function(x,i){var past=d===0&&i<1;x.disabled=past;x.classList.toggle("past",past);x.classList.toggle("on",i===t)});
      Array.prototype.forEach.call(g.querySelectorAll(".wsh-back button"),function(x,i){x.classList.toggle("on",i===b);x.querySelector(".wsh-bd").textContent=(14+d+(+x.dataset.o))+" Sep"});
      var fee=+g.querySelectorAll(".wsh-back button")[b].dataset.f,pt=g.querySelector(".wsh-pt");pt.textContent="₹"+(108+fee);pt.animate([{transform:"translateY(-5px)",opacity:.3},{transform:"none",opacity:1}],{duration:240})}
    Array.prototype.forEach.call(g.querySelectorAll(".wsh-days button"),function(x,i){x.addEventListener("click",function(){d=i;if(d===0&&t<1)t=1;paint()})});
    Array.prototype.forEach.call(g.querySelectorAll(".wsh-times button"),function(x,i){x.addEventListener("click",function(){if(!x.disabled){t=i;paint()}})});
    Array.prototype.forEach.call(g.querySelectorAll(".wsh-back button"),function(x,i){x.addEventListener("click",function(){b=i;paint()})});
    g.querySelector(".wsh-vb").addEventListener("click",function(e){e.currentTarget.animate([{transform:"scale(1)"},{transform:"scale(.92)"},{transform:"scale(1)"}],{duration:260,easing:"cubic-bezier(.34,1.56,.64,1)"})});
    paint()});
  /* 3. tracking */
  Array.prototype.forEach.call(document.querySelectorAll(".wsh-trk:not([data-w])"),function(g){g.dataset.w=1;var st=0,auto=0,touched=false,lis=g.querySelectorAll(".wsh-tl li"),nx=g.querySelector(".wsh-next");
    function paint(){Array.prototype.forEach.call(lis,function(li,i){li.classList.toggle("done",i<st);li.classList.toggle("now",i===st)});nx.textContent=st>=lis.length-1?"Start again":"Next stage"}
    function step(){st=st>=lis.length-1?0:st+1;paint()}
    nx.addEventListener("click",function(){touched=true;clearInterval(auto);step()});
    var io=new IntersectionObserver(function(es){clearInterval(auto);if(es[0].isIntersecting&&!touched)auto=setInterval(step,1700)});io.observe(g);paint()})}
window.wshWire=wshWire;
(function(){var cw=window.caseWire;window.caseWire=function(p){if(cw)cw(p);if(p&&p.id==="washio")wshWire()}})();

/* ---- the Washio card: its real home screen, playing. Book Now opens the vendor page ---- */
(function(){
  if (!ALT.wv_home_w || !ALT.wv_home || !ALT.wf_vendor) return;
  var cv='<span class="ccv wsh-ccv"><span class="cph"><video class="c1" muted loop playsinline preload="metadata" aria-hidden="true"><source src="'+ALT.wv_home_w.u+'" type="video/webm"><source src="'+ALT.wv_home.u+'" type="video/mp4"></video><img class="c2" alt="" draggable="false" src="'+ALT.wf_vendor.u+'">'+
    '<span class="trk-hot wsh-book" role="button" tabindex="0" aria-label="Book now"></span><span class="trk-hot wsh-bk" role="button" tabindex="-1" aria-label="Back to home"></span></span></span>';
  Array.prototype.forEach.call(document.querySelectorAll('#deck .card[href="/work/washio"] .card-art,#wgrid .wcard[href="/work/washio"] .top'),function(n){n.innerHTML=cv;n.classList.add("hascv");
    var c=n.querySelector(".ccv"),a=n.querySelector(".wsh-book"),b=n.querySelector(".wsh-bk");
    [a,b].forEach(function(f){["pointerdown","mousedown","touchstart","pointerup"].forEach(function(t){f.addEventListener(t,function(e){e.stopPropagation()},{passive:true})})});
    function set(o,e){if(e){e.preventDefault();e.stopPropagation()}c.classList.toggle("open",o);a.tabIndex=o?-1:0;b.tabIndex=o?0:-1}
    a.addEventListener("click",function(e){set(true,e)});b.addEventListener("click",function(e){set(false,e)});
    [a,b].forEach(function(f){f.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")f.click()})});
    var card=n.closest("a");if(card)card.addEventListener("mouseleave",function(){set(false)})})})();

/* =================== ROUND 18: gate the one remaining video on visibility =================== */
(function(){
  function gate(){
    var vids=Array.prototype.slice.call(document.querySelectorAll(".wsh-ccv video:not([data-vg])"));
    if(!vids.length)return;
    vids.forEach(function(v){v.dataset.vg=1;v.pause()});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      var v=e.target;v.dataset.vis=e.isIntersecting?"1":"";
      /* a deck card's video waits until the card has landed in the row (render() starts it) */
      var d=v.closest("#deck");if(e.isIntersecting&&(!d||d.classList.contains("peeled"))){v.play().catch(function(){})}else{v.pause()}})},{threshold:.15});
    vids.forEach(function(v){io.observe(v)})}
  gate();
  window.addEventListener("hashchange",function(){setTimeout(gate,200)});
  new MutationObserver(function(){gate()}).observe(document.body,{childList:true,subtree:true});
})();
/* ---- progressive blur on the bottom edge ---- */
(function(){var b=document.createElement("div");b.className="eblur";b.setAttribute("aria-hidden","true");b.innerHTML="<i></i><i></i><i></i><i></i><i></i>";document.body.appendChild(b);
  /* once the footer is reached there is nothing left to scroll under the edge: the blur would only smear the last lines */
  var t=0;function chk(){t=0;var h=DOCH||document.documentElement.scrollHeight;b.classList.toggle("off",SY+VH>=h-160)}
  function q(){if(!t)t=requestAnimationFrame(chk)}
  window.addEventListener("scroll",q,{passive:true});window.addEventListener("resize",q);window.addEventListener("hashchange",function(){setTimeout(chk,80)});chk()})();
/* =================== ROUND 19: Hourbit =================== */
/* assets: hb_ screens rebuilt from the Compose source (Neon Green, sample data), hb_v1 = screenshots of
   the first build on Aditya's phone, hb_widget = screenshot of the real widget, hbw_ = wireframes (SVG) */
var HBT={"hb_home":{"u":"/assets/media/84d8b5b1b6362e2a.webp","w":480,"h":1039},"hb_homerun":{"u":"/assets/media/7d8381d7174aab24.webp","w":480,"h":1039},"hb_themes":{"u":"/assets/media/b1c45f2659e608c7.webp","w":480,"h":1039},"hb_day":{"u":"/assets/media/c5cefb1fdf3f8b85.webp","w":480,"h":1039},"hb_focus":{"u":"/assets/media/864404a0aff006ca.webp","w":480,"h":1039},"hb_paused":{"u":"/assets/media/f361e9bd0787f0cb.webp","w":480,"h":1039},"hb_v1home":{"u":"/assets/media/d505dcdb5641a10d.webp","w":480,"h":987},"hb_v1focus":{"u":"/assets/media/cba92cb2901e08a1.webp","w":480,"h":987},"hb_v1theme":{"u":"/assets/media/d88d5ff119aaf579.webp","w":480,"h":987},"hb_widget":{"u":"/assets/media/279f66bdd7c333a6.webp","w":360,"h":360},"hbw_home":{"u":"/assets/media/30be2a5283d4d246.svg","w":240,"h":520},"hbw_timer":{"u":"/assets/media/7652fce3bb676f83.svg","w":240,"h":520},"hbw_themes":{"u":"/assets/media/bdb4e2b8a53a9570.svg","w":240,"h":520},"hbw_day":{"u":"/assets/media/d34c001c9bab7e53.svg","w":240,"h":520},"hbw_widget":{"u":"/assets/media/8b4265f305590cfc.svg","w":240,"h":270}};
Object.assign(ALT,HBT);
["hbw_home","hbw_timer","hbw_themes","hbw_day","hbw_widget"].forEach(function(k){CSK[k]=HBT[k].u});


/* the hourglass, ported from SmoothPixelHourglass.kt: same proportions, same sqrt volume, same falling grain */
function hbDraw(c,W,H,progress,phase,running,sand,rot){
  var cx=W/2,tc=H*.055,bc=H*.89,ch=H*.065,ci=W*.055,L=W*.15,R=W*.85,tY=tc+ch*.62,bY=bc+ch*.38,nY=H*.5,nH=W*.04,fr="#E6E6E6";
  c.clearRect(0,0,W,H);c.save();if(rot){c.translate(cx,H/2);c.rotate(rot*Math.PI/180);c.translate(-cx,-H/2)}
  function top(){c.beginPath();c.moveTo(L,tY);c.lineTo(R,tY);c.lineTo(cx+nH,nY);c.lineTo(cx-nH,nY);c.closePath()}
  function bot(){c.beginPath();c.moveTo(cx-nH,nY);c.lineTo(cx+nH,nY);c.lineTo(R,bY);c.lineTo(L,bY);c.closePath()}
  var rem=1-progress,uY=nY-(nY-tY)*Math.sqrt(rem),lY=nY+(bY-nY)*Math.sqrt(rem);c.fillStyle=sand;
  if(progress<1){c.save();top();c.clip();c.fillRect(0,uY,W,nY-uY);c.restore()}
  if(progress>0){c.save();bot();c.clip();c.fillRect(0,lY,W,bY-lY);var mw=W*(.06+progress*.18),mh=H*(.008+progress*.025);
    c.beginPath();c.moveTo(cx-mw,lY+mh);c.quadraticCurveTo(cx,lY-mh,cx+mw,lY+mh);c.lineTo(cx+mw,lY+mh*1.5);c.lineTo(cx-mw,lY+mh*1.5);c.closePath();c.fill();
    if(running&&progress>.001&&progress<.999){var ps=W*.045,sY=nY+ps*.25,land=lY-ps;
      if(land>sY+ps){var tp=Math.min(1,phase/.82),y=sY+(land-sY)*tp*tp,st=phase>.82?(phase-.82)/.18:0,iw=ps*(1+st*.55),ih=ps*(1-st*.45);
        c.globalAlpha=st?1-st:1;c.fillRect(cx-iw/2,y+ps-ih,iw,ih);c.globalAlpha=1}}
    c.restore()}
  c.lineJoin="round";c.lineCap="round";c.strokeStyle=fr;c.lineWidth=W*.034;top();c.stroke();bot();c.stroke();
  c.strokeStyle="rgba(255,255,255,.15)";c.lineWidth=W*.012;top();c.stroke();bot();c.stroke();
  c.fillStyle=fr;[tc,bc].forEach(function(y){var r=ch/2;c.beginPath();c.moveTo(ci+r,y);c.lineTo(W-ci-r,y);c.arc(W-ci-r,y+r,r,-Math.PI/2,Math.PI/2);c.lineTo(ci+r,y+ch);c.arc(ci+r,y+r,r,Math.PI/2,Math.PI*1.5);c.fill()});
  c.restore()}

/* real values: HeatmapClassifier.kt thresholds, ThemeColorScheme.kt hex (Neon Green's alphas written out) */
var HBTH=[["Crimson Red",["#441D1D","#7A2020","#B81B1B","#FF1414"]],["Amber Gold",["#3D3119","#684B17","#866115","#FFAF0E"]],
  ["Electric Blue",["#2F3B49","#374A5E","#445B76","#83BAFA"]],["Forest Green",["#284022","#3C6033","#508043","#A0FF86"]],
  ["Neon Green",["rgba(152,255,83,.2)","rgba(152,255,83,.4)","rgba(152,255,83,.61)","#98FF53"]]];
function hbLvl(m){return m<=0?0:m<=50?1:m<=124?2:m<=200?3:4}
function hbMins(n){var r=Math.sin(n*12.9898)*43758.5453;r=r-Math.floor(r);if(r<.42)return 0;return [25,40,55,80,100,130,160,210][Math.floor(Math.pow((r-.42)/.58,1.4)*8)]}
function hbDur(m){var h=Math.floor(m/60),x=m%60;return h?h+"h "+("0"+x).slice(-2)+"m":x+"m"}
var HBIC={play:"M8 5v14l11-7z",pause:"M6 19h4V5H6v14zm8-14v14h4V5h-4z",check:"M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"};
function hbi(k){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+HBIC[k]+'"/></svg>'}

function hbCompsHTML(){
  var h='<div class="trk-wrap hb-wrap">';
  /* 1. the hourglass */
  h+='<div class="trk-demo"><div class="hb-ds hb-tm"><span class="hb-pill"><i></i><b>CYCLE 1 IN PROGRESS</b></span>'+
    '<canvas class="hb-cv" width="150" height="190" role="button" tabindex="0" aria-label="Hourglass. Tap to pause or resume, double tap to finish."></canvas>'+
    '<span class="hb-time">00:00</span><span class="hb-pg"><i></i></span><small class="hb-pct">0% of 25m cycle</small>'+
    '<span class="hb-dock"><button type="button" class="hb-pp" aria-label="Pause">'+hbi("pause")+'</button><button type="button" class="hb-fin">'+hbi("check")+'FINISH</button></span>'+
    '<span class="hb-note">Running at 150× so a cycle takes 10 seconds</span></div>'+
    '<p><b>The hourglass</b>Ported from the Kotlin: the sand drains by volume, a grain falls with gravity, and at 25 minutes it flips and keeps going. Tap it to pause, double tap to finish.</p></div>';
  /* 2. the year grid */
  h+='<div class="trk-demo"><div class="hb-ds hb-hm"><span class="hb-lb">365-DAY HEATMAP</span><div class="hb-grid"></div>'+
    '<div class="hb-leg"><span>LESS</span>'+["0m","1-50m","51-124m","125-200m",">200m"].map(function(t,i){return '<em><i class="l'+i+'"></i>'+t+'</em>'}).join("")+'<span>MORE</span></div>'+
    '<div class="hb-day"><b class="hb-dd">Tap a day</b><span class="hb-dm"></span><span class="hb-bm"><i></i></span><small class="hb-bp">Daily benchmark: 2h</small></div></div>'+
    '<p><b>A year you can see</b>Every day is one cell, coloured by the real thresholds: up to 50 minutes, 124, 200, and more. Tap any day for its total against the two-hour benchmark.</p></div>';
  /* 3. themes */
  h+='<div class="trk-demo"><div class="hb-ds hb-th"><span class="hb-lb">COLOR THEME</span><div class="hb-opts">'+HBTH.map(function(t,i){
      return '<button type="button" class="hb-op'+(i===4?' on':'')+'" data-i="'+i+'" style="--vh:'+t[1][3]+'"><span>'+t[1].map(function(c){return '<i style="background:'+c+'"></i>'}).join("")+'</span>'+t[0]+'</button>'}).join("")+
    '</div><div class="hb-wg"></div></div>'+
    '<p><b>One colour, everywhere</b>Five themes, straight from the source. Pick one and the grid, the sand and the widget all change with it. This is the widget’s month, redrawn.</p></div>';
  return h+'</div>'}

/* wiring, once the case page is in the DOM */
function hbWire(){
  var root=document.querySelector(".hb-wrap");if(!root)return;
  /* 1 */
  var tm=root.querySelector(".hb-tm"),cv=tm.querySelector(".hb-cv"),dpr=Math.min(3,window.devicePixelRatio||1),ctx=cv.getContext("2d");
  cv.width=150*dpr;cv.height=190*dpr;ctx.scale(dpr,dpr);
  var CYC=25*60*1000,SPD=150,el=0,run=true,last=0,cyc=0,flip=null,done=0;hbWire.sand="#98FF53";
  function fmt(ms){var s=Math.floor(ms/1000),m=Math.floor(s/60)%60,hr=Math.floor(s/3600);return (hr?("0"+hr).slice(-2)+":":"")+("0"+m).slice(-2)+":"+("0"+s%60).slice(-2)}
  function ui(){tm.classList.toggle("paused",!run);tm.querySelector(".hb-pill b").textContent=done?"SESSION SAVED":run?"CYCLE "+(cyc+1)+" IN PROGRESS":"SESSION PAUSED";
    var pp=tm.querySelector(".hb-pp");pp.innerHTML=hbi(run?"pause":"play");pp.setAttribute("aria-label",run?"Pause":"Resume")}
  /* the hourglass only runs while it is on screen: it used to draw every frame for as long as the case page existed,
     scrolled away or not (the Hourbit page sat at ~420ms of main thread per second doing nothing) */
  var vis=true,looping=false,tEl=tm.querySelector(".hb-time"),pgEl=tm.querySelector(".hb-pg i"),pcEl=tm.querySelector(".hb-pct"),lastT="",lastP="";
  function loop(){if(!looping){looping=true;last=0;requestAnimationFrame(frame)}}
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)loop()}).observe(cv);
  function frame(t){if(!document.body.contains(cv)||!vis){looping=false;return}var dt=last?Math.min(64,t-last):16;last=t;
    if(run&&!done)el+=dt*SPD;var ci=Math.floor(el/CYC);
    if(ci>cyc){cyc=ci;flip=t;ui()}
    var rot=0,prog=(el%CYC)/CYC;
    if(flip!==null){var k=Math.min(1,(t-flip)/520);if(k<1){var e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;rot=180*e;prog=1}else flip=null}
    hbDraw(ctx,150,190,prog,(el%460)/460*(SPD>1?1:1),run&&!done&&flip===null,hbWire.sand,rot);
    /* text only when it changes; the bar is a scale (no layout) */
    var ft=fmt(el),pt=Math.floor(prog*100)+"% of 25m cycle";if(ft!==lastT){lastT=ft;tEl.textContent=ft}if(pt!==lastP){lastP=pt;pcEl.textContent=pt}
    pgEl.style.transform="scaleX("+prog.toFixed(4)+")";
    requestAnimationFrame(frame)}
  function toggle(){if(done){done=0;el=0;cyc=0;run=true}else run=!run;ui()}
  function finish(){if(done)return;done=1;run=false;ui();setTimeout(function(){if(done){done=0;el=0;cyc=0;run=true;ui()}},2200)}
  var tapT=null;cv.addEventListener("click",function(){if(tapT){clearTimeout(tapT);tapT=null;finish();return}tapT=setTimeout(function(){tapT=null;toggle()},260)});
  cv.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle()}});
  tm.querySelector(".hb-pp").addEventListener("click",toggle);tm.querySelector(".hb-fin").addEventListener("click",finish);
  ui();loop();
  /* 2 */
  var hm=root.querySelector(".hb-hm"),g=hm.querySelector(".hb-grid"),today=new Date(),base=Math.floor(today.getTime()/864e5),dow=(today.getDay()+6)%7,W=15,cells=[];
  for(var w=0;w<W;w++){var col=document.createElement("div");
    for(var d=0;d<7;d++){var ago=(W-1-w)*7+(dow-d),b=document.createElement("button");b.type="button";
      if(ago<0){b.className="c void";b.disabled=true;b.setAttribute("aria-hidden","true")}
      else{var m=ago===0?125:hbMins(base-ago),dt=new Date(today.getTime()-ago*864e5);b.className="c l"+hbLvl(m)+(ago===0?" tdy":"");b.dataset.m=m;
        b.dataset.d=ago===0?"Today":ago===1?"Yesterday":dt.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
        b.setAttribute("aria-label",b.dataset.d+", "+m+" focused minutes");cells.push(b)}
      col.appendChild(b)}
    g.appendChild(col)}
  var NAMES=["No focus","Light day","Steady day","Busy day","Deep day"];
  function pick(b){cells.forEach(function(x){x.classList.toggle("sel",x===b)});var m=+b.dataset.m,p=Math.min(1,m/120);
    hm.querySelector(".hb-dd").textContent=b.dataset.d;hm.querySelector(".hb-dm").textContent=m?hbDur(m)+" · "+NAMES[hbLvl(m)]:"No focus logged";
    hm.querySelector(".hb-bm i").style.width=(p*100)+"%";hm.querySelector(".hb-bp").textContent="Daily benchmark: "+Math.round(p*100)+"% of 2h"}
  g.addEventListener("click",function(e){var b=e.target.closest(".c");if(b&&!b.disabled)pick(b)});
  pick(cells[cells.length-1]);
  /* 3 */
  var th=root.querySelector(".hb-th"),wg=th.querySelector(".hb-wg"),wc="";
  for(var i=0;i<35;i++){var n=base-34+i;wc+='<i class="l'+(i>33?0:hbLvl(hbMins(n*3+7)))+'"></i>'}wg.innerHTML=wc;
  function setT(i){var t=HBTH[i][1];hbWire.sand=t[3];[th,hm,tm].forEach(function(el){el.style.setProperty("--l1",t[0]);el.style.setProperty("--l2",t[1]);el.style.setProperty("--l3",t[2]);el.style.setProperty("--l4",t[3])});
    th.querySelectorAll(".hb-op").forEach(function(o){o.classList.toggle("on",+o.dataset.i===i)})}
  th.addEventListener("click",function(e){var o=e.target.closest(".hb-op");if(o)setT(+o.dataset.i)});
  setT(4)}
(function(){var cw=window.caseWire;window.caseWire=function(p){if(cw)cw(p);if(p&&p.id==="hourbit")hbWire()}})();

/* the cover canvas */
ACV.hourbit={html:function(p){
  var SEC=[["01  Cover",0,0,1000,680],["02  Wireframes",1080,0,1340,680],["03  Iterations: first build to now",0,760,1000,700],["04  Final screens",1080,760,1340,700]];
  var FR=[["hbw_home","Home",1130,220,190],["hbw_timer","Timer",1350,220,190],["hbw_themes","Themes",1570,220,190],["hbw_day","A day",1790,220,190],["hbw_widget","Widget",2010,220,230],
    ["hb_v1home","Home v1",40,980,200],["hb_home","Home now",270,980,200],["hb_v1focus","Timer v1",530,980,200],["hb_focus","Timer now",760,980,200],
    ["hb_home","Home",1120,980,200],["hb_focus","Timer",1350,980,200],["hb_paused","Paused",1580,980,200],["hb_themes","Themes",1810,980,200],["hb_widget","Widget",2040,980,260]];
  var w=SEC.map(function(s){return '<div class="asec" style="left:'+s[1]+'px;top:'+s[2]+'px;width:'+s[3]+'px;height:'+s[4]+'px"><span class="asn">'+s[0]+'</span></div>'}).join("");
  w+='<div class="af hb-cover" data-n="Cover" data-wh="860×380" style="left:70px;top:150px;width:860px;height:380px"><span class="an">Cover</span>'+
    '<span class="hb-cvi"><canvas width="150" height="190" aria-hidden="true"></canvas></span><span class="hb-cvt"><b>HOURBIT</b><em>Makes your focus visible.</em><small>Android · Kotlin + Compose · Widget</small></span></div>';
  FR.forEach(function(f,i){var a=ALT[f[0]],h=Math.round(f[4]*a.h/a.w);
    w+='<div class="af" data-n="'+f[1]+'" data-wh="'+a.w+'×'+a.h+'" style="left:'+f[2]+'px;top:'+f[3]+'px;width:'+f[4]+'px;height:'+h+'px;--i:'+i+'"><span class="an">'+f[1]+'</span><img alt="'+f[1]+'" draggable="false" src="'+a.u+'"></div>'});
  return '<div class="acv" id="acv" tabindex="0" aria-label="Hourbit canvas. Drag to move around, use the zoom buttons or ctrl and scroll to zoom.">'+
    '<div class="acv-top"><span class="acv-file"><b class="hb-word">HOURBIT</b>canvas</span><span class="acv-tip">Built in Kotlin + Compose · No Figma file</span></div>'+
    '<div class="acv-world">'+w+'</div>'+
    '<div class="acv-bar"><button type="button" data-z="-" aria-label="Zoom out">&minus;</button><span class="acv-pct">100%</span><button type="button" data-z="+" aria-label="Zoom in">+</button><button type="button" data-z="fit" class="zfit">Fit all</button></div>'+
    '<p class="acv-hint"><span class="fine">Drag to move · scroll to zoom · click a frame</span><span class="touch">Tap to explore</span></p>'+
    '<button type="button" class="acv-done">Done</button></div>'}};
/* the cover's hourglass: a still frame, two thirds through a cycle */
(function(){var cw=window.caseWire;window.caseWire=function(p){if(cw)cw(p);if(!p||p.id!=="hourbit")return;
  var c=document.querySelector(".hb-cvi canvas");if(!c)return;var d=2;c.width=150*d;c.height=190*d;var x=c.getContext("2d");x.scale(d,d);hbDraw(x,150,190,.62,.5,true,"#98FF53",0)}})();

/* the final screens board */
var HSTG=[["hb_home","Home"],["hb_homerun","Home, session running"],["hb_focus","The timer"],["hb_paused","Paused"],["hb_themes","Themes"],["hb_day","A day, up close"]].map(function(t,i){
  var mc=i%2,mr=Math.floor(i/2);
  return [t[0],t[1],1.5+i*13.6,i%2?12:5,12.8,[-2.5,2,-1.5,2.5,-2,1.5][i],  mc?52:3,2+mr*30,45]});
HSTG.push(["hb_widget","The widget",82,20,16,2.5,  0,0,0]);
function hbStageHTML(){
  var h='<div class="stg hb" id="stg"><div class="stg-in">';
  HSTG.forEach(function(t,i){var a=ALT[t[0]];
    h+='<figure class="stp'+(t[8]?'':' dh')+'" data-k="'+t[0]+'" data-cap="'+t[1]+'" tabindex="0" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--w:'+t[4]+'%;--r:'+t[5]+'deg;--mx:'+t[6]+'%;--my:'+t[7]+'%;--mw:'+t[8]+'%;--ar:'+a.w+'/'+a.h+';--i:'+i+'">'+
      '<img loading="lazy" alt="'+t[1]+'" draggable="false" src="'+a.u+'"></figure>'+
      '<span class="slab'+(t[8]?'':' dh')+'" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--mx:'+t[6]+'%;--my:'+t[7]+'%;--i:'+i+'"><b>'+("0"+(i+1)).slice(-2)+'</b>'+t[1]+'</span>'});
  return h+'</div></div>'}

CS.hourbit={
  meta:[["Role","Solo: idea, design, build"],["Made with","Google AI Studio, Kotlin + Jetpack Compose"],["Data","On the phone. Room + DataStore, no account"],["Platform","Android, with a home-screen widget"],["Status","In daily use"]],
  quote:"Hourbit makes your focus visible. Sand while you work, a lit cell once you’re done.",
  secs:[
   {h:"What does an hour of focus look like?",b:["Most focus timers reduce deep work to a countdown, then tell you to stop. The session should run as long as you do, and the thing worth seeing is how it adds up over weeks, not the next ten minutes.","Hourbit is for anyone doing long stretches of desk work: students, young professionals, freelancers. It shows the work two ways. Falling sand makes the session in front of you feel real. A 365-day heatmap, a streak and a weekly total make the consistency visible. The widget keeps all of it on your home screen, so you see it without opening the app."]},
   {h:"Every screen, down to its bones.",b:["Four screens and a widget, stripped back to structure. These were drawn from the finished app to show what each screen is for. Hourbit itself went straight from idea to code, with no Figma file in between. Tap any one to see it up close."],
    sketches:[["hbw_home","Home"],["hbw_timer","The timer"],["hbw_themes","Themes"],["hbw_day","A day, up close"],["hbw_widget","The widget"]],
    pipe:[["Idea","A timer I wanted for my own deep work"],["Google AI Studio","The idea goes in, Kotlin and Jetpack Compose come out"],["My phone","A first build, used daily, then a better one"],["GitHub","The code is public"]]},
   {h:"The first build, and the one now.",b:["The version on my phone came first. The current build keeps the idea and fixes what daily use showed up. The first-build screens are screenshots from my phone; the current ones are rebuilt from the Compose source, with sample data."],
    iters:[["hb_v1home","hb_home","Home","The grid used to be a calendar year, so by September a third of it was empty months still to come. Now it’s a rolling 365 days that ends today. The start card got a real button instead of an icon, and a FOCUSING chip in the header takes you back to a running timer."],
      ["hb_v1focus","hb_focus","The timer","The first timer was gestures only: tap to pause, double tap to finish, and a line of text explaining it. The gestures still work, but now there’s a pause button, a FINISH button, the cycle you’re on, and how far through the 25 minutes you are."],
      ["hb_v1theme","hb_themes","Themes","Same five themes. The picker used to say it coloured the heatmap and widget. It always coloured the sand and the buttons too, so now it says the app and the widget."]],
    tags:["v1 · my phone","Now","the first build, on my phone","the current build"]},
   {h:"Three pieces, rebuilt from the Kotlin.",b:["There’s no Figma file behind this one, so no component sets. Instead, the three parts that make Hourbit what it is, ported from the source: the same geometry, the same thresholds, the same colours. Play with them."],hcomps:1},
   {h:"The screens, in the order you meet them.",b:["Home, the timer running and paused, the theme picker, a day up close, and the widget on the home screen. The widget is a screenshot from my phone; the rest are rebuilt from the Compose source. Tap any one to see it big."],hboard:1},
   {h:"Three taps in, one grid out.",b:["Whatever you do on the timer ends up in the same place: a day total, a cell on the grid, and the widget."],
    flow:[["Start","Pause","Finish"],"Timestamps, split at midnight",["Session saved","Day total","Grid cell lit","Widget redrawn"]]},
   {h:"How it moves.",steps:[
     ["Start a cycle","One tap on the home card. The timer opens and the sand starts to fall."],
     ["Work","The sand drains over 25 minutes. Tap the hourglass to pause, tap again to carry on."],
     ["It flips","At 25 minutes the hourglass turns over and cycle two begins. The session doesn’t end until you say so."],
     ["Finish","Double tap, or hit FINISH. The session is saved, today’s cell gets brighter, and the widget redraws."]]},
   {h:"Near black, and one colour.",b:["Everything sits on near black so the colour you picked is the only thing that glows: the sand, the busy days, the start button. Numbers are set in monospace, so the timer’s digits never shift sideways as they change."],
    sys:{colors:[["#121212","Background"],["#1B1B1B","Cards"],["#232323","Raised"],["#323232","Empty day"],["#F4F4F4","Text"],["#8A8A8A","Secondary text"],["#E6E6E6","Hourglass frame"],["#98FF53","Neon Green"]],
         specs:[["Cards","14, 16 and 18dp radius, 1dp #262626 border"],["Stat cards","136 × 112dp"],["Hourglass","150 × 190dp, flips in 520ms"],["Timer","46sp light monospace"],["Grid cell","12dp, 3dp gap, 2.5dp radius"],["Heat levels","1 to 50, 51 to 124, 125 to 200, over 200 minutes"]],
         type:[["Aa","Numbers and labels","Monospace. Bold for labels, light for the timer.","'Roboto Mono',ui-monospace,monospace"],["Aa","Sentences","Sans serif, 13 to 15sp, muted grey.","Roboto,system-ui,sans-serif"]]}},
   {h:"What I built, and why.",b:["Six principles held every call: visual first, minimal interaction, offline first, state that survives anything, the app and the widget always agreeing, and nothing that distracts."],decisions:[
     ["Sessions don’t end on their own","25 minutes is a cycle, not a limit. The hourglass flips and keeps going, so a good run never gets cut off by an alarm."],
     ["Sand by volume, not height","A triangle’s area shrinks with the square of its height, so lowering the sand at a steady rate makes it look like it vanishes at the end. The level follows a square root instead, and the sand runs out at an even pace."],
     ["Drawn every frame","The hourglass reads the elapsed time once per screen refresh, not once a second. No ticking, no jumps."],
     ["Time comes from timestamps","The timer stores when you started and when you paused, never a running counter. Close the app or restart the phone and the time is still right."],
     ["Midnight splits the session","Start at 23:40, stop at 00:30, and 20 minutes go to one day and 30 to the next. The grid stays honest."],
     ["The widget is a picture","Home-screen widgets are limited in what they can draw, so Hourbit renders the month as a text-free image in your theme and hands that over."]]},
   {h:"What I left out.",b:["No account, no sync, no server, no network at all. Everything lives on the phone in a small database. A focus timer that needs a login has already broken your focus.","No reminders or notifications either. The idea started out as a companion app with notes, chat, voice and mood tracking. All of that went, and what was left is one job done well: a place to put your focus and watch it add up."]},
   {h:"What I’d do differently.",b:["Every session has a notes field in the database, and nothing in the app lets you fill it. Tagging a session as reading or coding is half built.","The cycle is fixed at 25 minutes. Some work wants 45 or 60, and right now the only answer is to let it flip.","My own history has a 9h 37m session that ran from 23:29 to 09:14. Nothing asks whether you’re still there, so a timer left running overnight counts as focus. It needs a check-in after a long stretch.","The test folder still holds tests from the project template, pointing at names that no longer exist. They should be real tests of the timer and the midnight split, the two things most likely to break quietly."]}
  ],
  cta:["Want it on your phone?","It’s an Android APK with the widget included, not on the Play Store. Ask and I’ll send it over.","#apk","Ask for the APK"],
  links:[["Code on GitHub","https://github.com/User01005/Hourbit","gh"],["Full doc on Notion","https://jealous-ghost-a9e.notion.site/Hourbit-Product-Technical-BRD-3e67ea0aa24481a99070fa98d29a6297?source=copy_link","no"]]
};

/* ---- the Hourbit card on work wears its real home screen; START FOCUS opens the timer ---- */
(function(){
  var cv='<span class="ccv hb-ccv"><span class="cph"><img class="c1" alt="" draggable="false" src="'+HBT.hb_home.u+'"><img class="c2" alt="" draggable="false" src="'+HBT.hb_focus.u+'"><img class="c2 c3" alt="" draggable="false" src="'+HBT.hb_paused.u+'">'+
    '<span class="trk-hot hb-go" role="button" tabindex="0" aria-label="Start a focus cycle"></span><span class="trk-hot hb-bk" role="button" tabindex="-1" aria-label="Tap the hourglass to pause or resume"></span></span></span>';
  Array.prototype.forEach.call(document.querySelectorAll('#wgrid .wcard[href="/work/hourbit"] .top,#deck .card[href="/work/hourbit"] .card-art'),function(n){n.innerHTML=cv;n.classList.add("hascv");
    var c=n.querySelector(".ccv"),go=n.querySelector(".hb-go"),bk=n.querySelector(".hb-bk");
    [go,bk].forEach(function(f){["pointerdown","mousedown","touchstart","pointerup"].forEach(function(t){f.addEventListener(t,function(e){e.stopPropagation()},{passive:true})});
      f.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")f.click()})});
    function set(o,e){if(e){e.preventDefault();e.stopPropagation()}c.classList.toggle("open",o);if(!o)c.classList.remove("paused");go.tabIndex=o?-1:0;bk.tabIndex=o?0:-1}
    go.addEventListener("click",function(e){set(true,e)});bk.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();c.classList.toggle("paused")});
    var card=n.closest("a");if(card)card.addEventListener("mouseleave",function(){set(false)})})})();
/* About: the dock. Desktop magnifies under the cursor: icon centres are measured once per hover (scaling never moves
   the layout), each frame eases every icon toward its target scale and shifts its neighbours by half the extra width,
   and the shelf stretches with one scaleX. Clicking an app (any device) opens one shared card saying how Aditya uses it:
   below the icon on desktop, as a full grid row in its place on phones, where the other icons glide to their new
   spots (FLIP, transform only). Escape, the close button or a click outside closes it. */
(function(){var d=document.querySelector(".dock");if(!d)return;
  var DATA={"chatgpt": {"n": "ChatGPT", "r": "Thinking out loud", "u": "Where I think out loud. I drop in a messy idea and push back on it until the real problem shows up."}, "claude": {"n": "Claude", "r": "Writing and code", "u": "My writing partner and the one I pair program with. Most of the code behind my apps started as a conversation here."}, "gemini": {"n": "Gemini", "r": "Images, video, research", "u": "Images and video when a project needs visuals, and Deep Research when I need to properly learn a topic before I design for it."}, "aistudio": {"n": "Google AI Studio", "r": "App building", "u": "Where I try an app idea against Gemini fast, before it earns real code."}, "figma": {"n": "Figma", "r": "Design", "u": "Every screen starts here. Flows, components, and the empty and error states nobody remembers to draw."}, "framer": {"n": "Framer", "r": "Websites", "u": "For sites that need to go live quickly and still move well."}, "vscode": {"n": "VS Code", "r": "Editing", "u": "For the small, careful edits where I want to read every line myself."}, "github": {"n": "GitHub", "r": "Every version", "u": "Every version of every project, so nothing I make is ever lost."}, "vercel": {"n": "Vercel", "r": "Shipping", "u": "Push, and it is live. This site runs on it."}, "notion": {"n": "Notion", "r": "Notes and plans", "u": "Briefs, research and half ideas. Everything lands here before it goes anywhere else."}, "alter": {"n": "Alter", "r": "My own app", "u": "My personal AI assistant for Android. I designed it, built it in real code, and it is the app I open most in a day."}};
  var fine=matchMedia("(hover:hover) and (pointer:fine)").matches&&!matchMedia("(prefers-reduced-motion:reduce)").matches,
      grid=function(){return matchMedia("(hover:none),(max-width:760px)").matches},calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var apps=[].slice.call(d.querySelectorAll(".dk-app")),shelf=d.querySelector(".dk-shelf"),open=null;
  var card=document.createElement("div");card.className="dk-card";card.setAttribute("role","region");card.setAttribute("aria-live","polite");
  function fill(a){var k=a.dataset.k,t=DATA[k];
    card.innerHTML='<div class="dk-ch"><span class="dk-ic'+(k==="alter"?' dk-alter-ic':'')+'"'+(k==="alter"?' style="background:#FFD44E"':'')+'>'+a.querySelector(".dk-ic").innerHTML+'</span>'
      +'<span><b></b><small></small></span><button type="button" class="dk-x" aria-label="Close">×</button></div><p></p>'
      +(k==="alter"?'<a class="dk-cs" href="/work/alter">View case study <span aria-hidden="true">→</span></a>':'');
    card.querySelector("b").textContent=t.n;card.querySelector("small").textContent=t.r;card.querySelector("p").textContent=t.u;
    if(k==="alter"){var sv=card.querySelector(".dk-ic svg");sv.style.width=sv.style.height="46%"}
    card.querySelector(".dk-x").addEventListener("click",function(e){e.stopPropagation();close()})}
  function rects(){var m=new Map();apps.forEach(function(a){if(a.offsetParent)m.set(a,a.getBoundingClientRect())});return m}
  function flip(before){if(calm||!Element.prototype.animate)return;
    apps.forEach(function(a){var o=before.get(a);if(!o||!a.offsetParent)return;var n=a.getBoundingClientRect(),dx=o.left-n.left,dy=o.top-n.top;
      if(dx||dy)a.animate([{transform:"translate("+dx+"px,"+dy+"px)"},{transform:"none"}],{duration:380,easing:"cubic-bezier(.22,1,.36,1)"})});
    if(card.classList.contains("on"))card.animate([{opacity:0,transform:"scale(.96)"},{opacity:1,transform:"none"}],{duration:300,easing:"cubic-bezier(.22,1,.36,1)"})}
  function show(a){var g=grid(),before=g?rects():null;
    if(open)open.setAttribute("aria-expanded","false");open=a;a.setAttribute("aria-expanded","true");fill(a);
    if(g){a.after(card);card.classList.add("on");flip(before)}
    else{d.appendChild(card);d.classList.add("popping");
      var dr=d.getBoundingClientRect(),ar=a.getBoundingClientRect(),cx=ar.left+ar.width/2-dr.left,w=320,
          min=w/2-dr.left+12,max=window.innerWidth-dr.left-w/2-12,x=Math.max(min,Math.min(max,cx));
      card.style.left=x+"px";card.style.setProperty("--ax",(w/2+cx-x)+"px");
      card.classList.remove("on");void card.offsetWidth;card.classList.add("on")}}
  function close(){if(!open)return;var g=grid(),before=g?rects():null,a=open;open=null;a.setAttribute("aria-expanded","false");
    card.classList.remove("on");d.classList.remove("popping");if(g){card.remove();flip(before)}a.focus({preventScroll:true})}
  apps.forEach(function(a){a.addEventListener("click",function(e){e.stopPropagation();if(open===a)close();else show(a)})});
  document.addEventListener("click",function(e){if(open&&!(e.target.closest&&e.target.closest(".dk-card")))close()});
  card.addEventListener("click",function(e){if(e.target.closest(".dk-cs"))setTimeout(close,0)});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&open)close()});
  window.addEventListener("resize",function(){if(open)close()});
  if(!fine)return;
  function tipOn(a){apps.forEach(function(x){x.classList.toggle("tip",x===a)})}
  var BASE=58,MAX=.85,R=150,cx=null,cur=apps.map(function(){return 1}),xs=[],items=[],raf=0,dw=0;
  function measure(){var r=d.getBoundingClientRect();dw=r.width;
    items=apps.slice();xs=items.map(function(e){var q=e.getBoundingClientRect();return q.left+q.width/2})}
  function step(){raf=0;var moving=false,near=-1,best=1e9;if(grid()){apps.forEach(function(e){e.style.transform=""});shelf.style.transform="";return}
    for(var i=0;i<apps.length;i++){var c=xs[i],t=1;
      if(cx!==null){var dd=Math.abs(cx-c);if(dd<best){best=dd;near=i}t=1+MAX*Math.pow(Math.max(0,Math.cos(Math.min(1,dd/R)*Math.PI/2)),2)}
      cur[i]+=(t-cur[i])*.28;if(Math.abs(t-cur[i])>.002)moving=true;else cur[i]=t}
    /* extra width per item, then each item moves by half of everything that grew on its left minus on its right */
    var extra=cur.map(function(v){return (v-1)*BASE}),tot=extra.reduce(function(a,b){return a+b},0),acc=0;
    items.forEach(function(e,j){var sh=acc+extra[j]/2-tot/2;acc+=extra[j];e.style.transform="translateX("+sh.toFixed(2)+"px) scale("+cur[j].toFixed(4)+")"});
    shelf.style.transform="scaleX("+((dw+tot)/dw).toFixed(4)+")";
    tipOn(cx!==null&&best<BASE*.75?apps[near]:null);
    if(moving)raf=requestAnimationFrame(step)}
  function kick(){if(!raf)raf=requestAnimationFrame(step)}
  d.addEventListener("pointerenter",function(e){if(e.target.closest&&e.target.closest(".dk-card"))return;measure();cx=e.clientX;kick()});
  d.addEventListener("pointermove",function(e){if(e.target.closest(".dk-card")){if(cx!==null){cx=null;kick()}return}if(!xs.length)measure();cx=e.clientX;kick()},{passive:true});
  d.addEventListener("pointerleave",function(){cx=null;kick()});
  window.addEventListener("scroll",function(){if(cx!==null){cx=null;kick()}},{passive:true});
  apps.forEach(function(a){a.addEventListener("focus",function(){if(!a.matches(":focus-visible"))return;measure();cx=xs[apps.indexOf(a)];kick()});
    a.addEventListener("blur",function(){cx=null;kick()})});
})();
/* testimonials (Oct 23): one card builder shared by the home section and the form's preview */
var TW_COLORS={yellow:"#FFD44E",blue:"#A9DEFF",green:"#B4F6B8",violet:"#E7BBFF"},TW_ORDER=["green","blue","violet","yellow"];
function twFace(t){var face=document.createElement("button");face.type="button";face.className="tw-face";
  if(t.photo){var im=portfolioImage();im.alt="";im.src=t.photo;im.loading="lazy";im.decoding="async";face.appendChild(im)}
  else face.textContent=(t.name||"?").trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0).toUpperCase()}).join("");
  return face}
/* Read more opens the whole testimonial; the card itself keeps its shape */
function twRead(t,color){var d=document.getElementById("twDlg");
  if(!d){d=document.createElement("dialog");d.id="twDlg";d.className="tw-dlg";document.body.appendChild(d);
    d.addEventListener("click",function(e){if(e.target===d)d.close()})}
  d.style.setProperty("--c",color);d.setAttribute("aria-label","What "+(t.name||"they")+" said");d.replaceChildren();
  var tag=document.createElement("i"),inn=document.createElement("div"),face=twFace(t),head=document.createElement("div"),h=document.createElement("h3"),who=document.createElement("p"),q=document.createElement("blockquote"),x=document.createElement("button");
  tag.className="tw-tag";inn.className="tw-dlg-in";face.tabIndex=-1;face.setAttribute("aria-hidden","true");
  h.textContent=t.name||"";who.className="tw-who";who.textContent=[t.role,t.company].filter(Boolean).join(" · ");q.textContent=t.quote||"";
  /* with a LinkedIn profile (Oct 23): the photo and a small LinkedIn tag at the bottom both open it */
  if(t.linkedin){var a=document.createElement("a");a.className="tw-face tw-face-link";a.href=t.linkedin;a.target="_blank";a.rel="noopener";a.setAttribute("aria-label",(t.name||"Their")+" on LinkedIn");
    a.append.apply(a,Array.prototype.slice.call(face.childNodes));face=a}
  x.type="button";x.className="tw-dlg-x";x.textContent="×";x.setAttribute("aria-label","Close");x.onclick=function(){d.close()};
  head.append(h,who);inn.append(face,head,q,x);
  if(t.linkedin){var li=document.createElement("a");li.className="tw-li";li.href=t.linkedin;li.target="_blank";li.rel="noopener";
    li.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3v-11zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.15-.02-2.64-1.6-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4v-11z"/></svg>LinkedIn <span aria-hidden="true">↗</span>';inn.append(li)}
  d.append(tag,inn);d.showModal();x.focus()}
function twCard(t,i){
  var color=TW_COLORS[t.color]||TW_COLORS[TW_ORDER[(i||0)%4]];
  var card=document.createElement("div"),face=twFace(t),body=document.createElement("div"),top=document.createElement("div"),nm=document.createElement("b"),rl=document.createElement("span"),co=document.createElement("span"),q=document.createElement("blockquote"),more=document.createElement("button"),tag=document.createElement("i"),qw=document.createElement("div");
  card.className="tw-card";card.setAttribute("role","listitem");card.style.setProperty("--c",color);
  tag.className="tw-tag";tag.setAttribute("aria-hidden","true");
  body.className="tw-body";top.className="tw-top";qw.className="tw-qw";rl.className="tw-rl";co.className="tw-co";
  more.type="button";more.className="tw-more";more.textContent="Read more";
  var full=(t.name||"Your name").trim(),first=full.split(/\s+/)[0];
  nm.textContent=full;rl.textContent=t.role||"";co.textContent=t.company||"";q.textContent=t.quote||"";
  face.setAttribute("aria-label",full+[t.role,t.company].filter(Boolean).map(function(v){return ", "+v}).join(""));
  top.append(nm);if(t.role)top.append(rl);if(t.company)top.append(co);qw.append(q,more);body.append(top,qw);card.append(tag,face,body);
  /* the top line keeps all three when they fit; otherwise the first name only, then role and company trim with "…".
     Their words: four lines (fewer only if a small card has no room), "Read more" when there is more to read. */
  function cut(){return Array.prototype.some.call(top.children,function(c){return c.scrollWidth>c.clientWidth+1})||top.scrollWidth>top.clientWidth+1}
  function fit(){nm.textContent=full;if(full!==first&&cut())nm.textContent=first;
    var lh=parseFloat(getComputedStyle(q).lineHeight)||17,room=body.clientHeight-top.offsetHeight-parseFloat(getComputedStyle(qw).paddingTop),lines=Math.max(2,Math.min(4,Math.floor(room/lh)));
    card.style.setProperty("--lines",lines);more.hidden=q.scrollHeight<=q.clientHeight+1&&!t.linkedin}
  card.twFit=fit;card.addEventListener("transitionend",function(e){if(e.target===card&&e.propertyName==="width"&&card.classList.contains("open"))fit()});
  more.addEventListener("click",function(e){e.stopPropagation();twRead(t,color)});
  return card}
(function(){
  var sec=document.getElementById("proofHome"),stage=document.getElementById("twStage");if(!sec||!stage)return;
  var CMS="",cards=[],items=[];
  /* Oct 23, Aditya: most people are shown open, as cards; only once there are many do the rest fold down to their
     photo tile, which opens in place when tapped. November 4: small desktop sets use readable rows and phones use an aligned column. Larger desktop sets
     stay scattered, and visitors can still pick up and drag any card. Nothing ever
     overlaps: after a drag, an open or a fold, the others are nudged out of the way (left/top animate). */
  var ROWS=3,PHONE_OPEN=4,seed=Math.floor(Math.random()*1e9),lastW=0,G={};
  function rng(k){var v=Math.sin(seed*.0001+k*12.9898)*43758.5453;return v-Math.floor(v)}
  function sizes(){var pad=parseFloat(getComputedStyle(stage).paddingLeft)||0,W=stage.clientWidth-pad*2,phone=W<560,n=cards.length;
    /* fewer people, bigger cards; more people, smaller ones, never below a readable size (words never under 11px) */
    var s=phone?Math.max(.58,Math.min(.66,1-.02*(n+13))):Math.max(.82,Math.min(1,1-.02*(n-6))),T=156*s,tag=18*s,
      text=Math.max(phone?168:250,314*s),w=Math.min(T+16*s+text,W-tag),cols=phone?1:Math.max(1,Math.floor((W-tag+28*s)/(w+28*s)));
    if(!phone&&n<=3&&W>=800)w=Math.min(w,(W-tag-32)/2);
    G={pad:pad,W:W,phone:phone,s:s,T:T,tag:tag,w:w,g:12*s+6,open:phone?PHONE_OPEN:cols*ROWS}}
  function cw(c){return c.classList.contains("open")?G.w:G.T}
  /* a card's footprint: its body plus the square tag off its top-left corner and a gap all round */
  function hit(c,x,y,o,ox,oy){var a=[x-G.tag-G.g,y-G.tag-G.g,x+cw(c)+G.g,y+G.T+G.g],b=[ox-G.tag,oy-G.tag,ox+cw(o),oy+G.T];
    return a[0]<b[2]&&b[0]<a[2]&&a[1]<b[3]&&b[1]<a[3]}
  function free(c,x,y,upto){for(var j=0;j<upto.length;j++)if(upto[j]!==c&&hit(c,x,y,upto[j],upto[j].px,upto[j].py))return false;return true}
  /* Initial layout: readable rows for a small desktop set; one ordered column on phones.
     Dragging still uses resolve(), so visitors can rearrange after the initial presentation. */
  function align(){var cols=G.phone||G.W<800?1:2,gap=32,rowGap=G.tag+G.g*2;
    for(var i=0;i<cards.length;i+=cols){var row=cards.slice(i,i+cols),total=row.reduce(function(n,c){return n+cw(c)},0)+gap*(row.length-1),x=G.tag+Math.max(0,(G.W-G.tag-total)/2);
      row.forEach(function(c){c.px=x;c.py=G.tag+Math.floor(i/cols)*(G.T+rowGap);x+=cw(c)+gap})}}
  /* scatter: each card tries random spots in a field sized to the cards (taller as more arrive) and takes the first
     free one; when none is free the field grows a little */
  function scatter(){var area=0;cards.forEach(function(c){area+=(cw(c)+G.tag+G.g*2)*(G.T+G.tag+G.g*2)});
    var H=Math.max(G.T*2.4,area*1.3/G.W),done=[];
    cards.forEach(function(c,i){var k=0,x,y;
      for(;;k++){x=rng(i*131+k*7+1)*Math.max(0,G.W-cw(c)-G.tag)+G.tag;y=rng(i*131+k*7+2)*Math.max(0,H-G.T-G.tag)+G.tag;
        if(free(c,x,y,done))break;if(k%40===39)H+=G.T*.4}
      c.px=x;c.py=y;done.push(c)})}
  /* make room: the card just dragged or toggled stays put; every other card, top to bottom, keeps its spot if it is
     free and otherwise moves to the nearest free spot (searched in widening rings, so it never fails: further down
     the field is always empty). Nothing can end up overlapping. */
  function resolve(still){var settled=[];
    cards.forEach(function(c){c.px=Math.max(G.tag,Math.min(c.px,G.W-cw(c)));c.py=Math.max(G.tag,c.py)});
    if(still)settled.push(still);
    cards.filter(function(c){return c!==still}).sort(function(p,q){return p.py-q.py||p.px-q.px}).forEach(function(c){
      if(!free(c,c.px,c.py,settled)){var step=Math.max(10,G.T/8),best=null;
        for(var r=1;r<400&&!best;r++)for(var k=0;k<r*8&&!best;k++){var t=k/(r*8)*Math.PI*2,x=c.px+Math.cos(t)*r*step,y=c.py+Math.sin(t)*r*step;
          x=Math.max(G.tag,Math.min(x,G.W-cw(c)));if(y<G.tag)continue;if(free(c,x,y,settled))best=[x,y]}
        if(best){c.px=best[0];c.py=best[1]}}
      settled.push(c)})}
  function place(){var bottom=0;cards.forEach(function(c){c.px=Math.max(G.tag,Math.min(c.px,G.W-cw(c)));c.py=Math.max(G.tag,c.py);
      c.style.setProperty("--s",G.s.toFixed(3));c.style.setProperty("--x",Math.round(G.pad+c.px)+"px");c.style.setProperty("--y",Math.round(c.py)+"px");
      c.style.setProperty("--w",Math.round(G.w)+"px");c.style.setProperty("--dx","0px");bottom=Math.max(bottom,c.py+G.T)});
    stage.style.height=Math.round(bottom+G.tag+8)+"px";cards.forEach(function(c){if(c.classList.contains("open"))c.twFit()})}
  function layout(){if(!cards.length)return;sizes();
    /* the first pass decides who starts open; after that, taps decide. A new width scatters again (same spread) */
    if(!started){cards.forEach(function(c,i){set(c,i<G.open)});started=true}
    if(G.W!==lastW){lastW=G.W;if(G.phone||cards.length<=3)align();else scatter()}else resolve(null);place()}
  var started=false;
  function set(c,on){c.classList.toggle("open",on);c.querySelector(".tw-face").setAttribute("aria-expanded",String(on));if(on)requestAnimationFrame(c.twFit)}
  function toggle(c,on){set(c,on);sizes();resolve(c);place()}
  /* drag: a mouse or pen picks a card up after a few pixels; a finger after holding still for a moment (a quick swipe
     still scrolls the page). A drag never counts as a tap. */
  var drag=null;
  function lift(d){d.live=true;d.c.classList.add("drag");if(navigator.vibrate)try{navigator.vibrate(8)}catch(e){}}
  stage.addEventListener("pointerdown",function(e){var c=e.target.closest(".tw-card");if(!c||e.button>0||e.target.closest(".tw-more"))return;
    drag={c:c,x:e.clientX,y:e.clientY,px:c.px,py:c.py,touch:e.pointerType==="touch",live:false,t:0};
    if(drag.touch){var d=drag;d.t=setTimeout(function(){if(drag===d)lift(d)},230)}});
  addEventListener("pointermove",function(e){var d=drag;if(!d)return;var dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(!d.live){if(Math.hypot(dx,dy)>(d.touch?9:5)){if(d.touch){clearTimeout(d.t);drag=null;return}lift(d)}else return}
    d.c.px=Math.max(G.tag,Math.min(d.px+dx,G.W-cw(d.c)));d.c.py=Math.max(G.tag,d.py+dy);
    d.c.style.setProperty("--x",Math.round(G.pad+d.c.px)+"px");d.c.style.setProperty("--y",Math.round(d.c.py)+"px");e.preventDefault()},{passive:false});
  stage.addEventListener("touchmove",function(e){if(drag&&drag.live)e.preventDefault()},{passive:false});
  function drop(){var d=drag;drag=null;if(!d)return;clearTimeout(d.t);if(!d.live)return;
    d.c.classList.remove("drag");d.c.dragged=Date.now();resolve(d.c);place()}
  addEventListener("pointerup",drop);addEventListener("pointercancel",drop);
  async function load(){try{var r=await fetch(CMS+"/api/testimonials?depth=1&limit=60&sort=order&where[status][equals]=approved",{cache:"no-cache"});if(!r.ok)return;var d=await r.json();
      items=(d.docs||[]).filter(function(t){return t&&t.name&&t.quote}).map(function(t){var ph=t.photo&&typeof t.photo==="object"?(t.photo.sizes&&t.photo.sizes.thumb&&t.photo.sizes.thumb.url)||t.photo.url:"";
        if(ph&&ph.charAt(0)==="/")ph=CMS+ph;return {name:t.name,role:t.role,company:t.company,quote:t.quote,color:t.color,photo:ph,linkedin:/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(t.linkedin||"")?t.linkedin:""}})}catch(e){return}
    if(!items.length)return;
    cards=items.map(function(t,i){var c=twCard(t,i),f=c.querySelector(".tw-face");f.setAttribute("aria-expanded","false");
      c.addEventListener("click",function(e){if(e.target.closest(".tw-more")||Date.now()-(c.dragged||0)<350)return;toggle(c,!c.classList.contains("open"))});return c});
    stage.replaceChildren.apply(stage,cards);sec.hidden=false;layout()}
  var rt=0;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(layout,120)});
  window.twDebug={state:function(){return cards.map(function(c){var r=c.getBoundingClientRect();return {open:c.classList.contains("open"),x:r.left,y:r.top,w:r.width,h:r.height,s:+c.style.getPropertyValue("--s")}})}};
  load()})();
/* the testimonial form (/testimonial?k=code, Oct 23). Aditya makes the link in the CMS and sends it; what people
   write goes to the CMS as Pending and only reaches the site once he approves it. */
(function(){
  var form=document.getElementById("tmForm");if(!form)return;
  var CMS="",msg=document.getElementById("tmMsg"),count=document.getElementById("tmCount"),send=document.getElementById("tmSend"),done=document.getElementById("tmDone"),
    quote=form.elements.quote,file=form.elements.file,preview=document.getElementById("tmPreview"),photoText=document.getElementById("tmPhotoText");
  function code(){return (new URLSearchParams(location.search).get("k")||"").trim()}
  function refresh(){drawPrev()}
  function say(t){msg.textContent=t||""}
  function check(){if(!/^#\/testimonial/.test(HASH()))return;var ok=!!code();form.classList.toggle("closed",!ok);say(ok?"":"This page opens from the link Aditya sends you. Ask him for yours and it will work from there.")}
  window.addEventListener("hashchange",check);check();
  function tally(){var n=quote.value.trim().length;count.textContent=n+" / 800";count.classList.toggle("short",n>0&&n<20)}
  /* the preview: their card, open, as it will sit on the site, redrawn as they type, pick a colour or add a photo */
  var prevBox=document.getElementById("tmPrev"),photoUrl="",pt=0;
  function drawPrev(){var v=function(n){return (form.elements[n].value||"").trim()},c=form.querySelector("input[name=color]:checked");
    var card=twCard({name:v("name")||"Your name",role:v("role"),company:v("company"),quote:v("quote")||"What you write shows up here, in your words.",color:c?c.value:"green",photo:photoUrl},0);
    var phone=prevBox.clientWidth<480,sc=phone?.7:.86;card.style.setProperty("--s",sc);card.style.setProperty("--w",Math.min(prevBox.clientWidth-18*sc,Math.round(156*sc+16*sc+330*sc))+"px");
    card.classList.add("open");card.querySelector(".tw-face").tabIndex=-1;card.querySelector(".tw-more").tabIndex=-1;card.twMoved=function(){};prevBox.replaceChildren(card);requestAnimationFrame(card.twFit)}
  form.addEventListener("input",function(){clearTimeout(pt);pt=setTimeout(drawPrev,80)});form.addEventListener("change",drawPrev);
  addEventListener("resize",function(){clearTimeout(pt);pt=setTimeout(drawPrev,120)});
  window.addEventListener("hashchange",function(){if(/^#\/testimonial/.test(HASH()))requestAnimationFrame(drawPrev)});requestAnimationFrame(drawPrev);
  quote.addEventListener("input",tally);tally();
  /* the photo is redrawn at most 1200px wide before it's sent (Oct 23): a phone photo of 5-10MB becomes ~200KB, so the
     send is quick on any connection and never meets Vercel's 4.5MB request limit. The card shows it at ~150px. */
  var photoFile=null;
  function shrink(f){return new Promise(function(done){if(!window.createImageBitmap){done(f);return}
    createImageBitmap(f).then(function(bm){var k=Math.min(1,1200/Math.max(bm.width,bm.height)),c=document.createElement("canvas");c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);
      var x=c.getContext("2d");x.drawImage(bm,0,0,c.width,c.height);bm.close&&bm.close();
      /* a photo with see-through parts (a cut-out, rounded corners) stays see-through: JPEG has no transparency and
         would fill them black, so those go out as WebP (or PNG where the browser can't write WebP) */
      var px=x.getImageData(0,0,c.width,c.height).data,clear=false;for(var i=3;i<px.length;i+=16)if(px[i]<250){clear=true;break}
      c.toBlob(function(b){var ext=b&&b.type==="image/webp"?".webp":b&&b.type==="image/png"?".png":".jpg";
        done(b&&b.size<f.size?new File([b],f.name.replace(/\.[a-z0-9]+$/i,"")+ext,{type:b.type}):f)},clear?"image/webp":"image/jpeg",.86)}).catch(function(){done(f)})})}
  function clearPhoto(msg){file.value="";photoFile=null;preview.hidden=true;photoText.textContent="Choose a photo";photoUrl="";refresh();if(msg)say(msg)}
  file.addEventListener("change",function(){var f=file.files[0];say("");
    if(!f){clearPhoto();return}
    if(!/^image\//.test(f.type)||f.size>30*1024*1024){clearPhoto("Please choose a photo (JPG, PNG, WebP or HEIC) under 30MB.");return}
    photoText.textContent="Preparing your photo…";
    shrink(f).then(function(small){if(file.files[0]!==f)return;
      if(small.size>4*1024*1024||!/^image\/(jpeg|png|webp|avif)$/.test(small.type)){clearPhoto("This photo couldn't be prepared. Try a JPG or PNG.");return}
      photoFile=small;preview.src=photoUrl=URL.createObjectURL(small);preview.hidden=false;photoText.textContent=f.name;refresh()})});
  Array.prototype.forEach.call(form.querySelectorAll("input,textarea"),function(i){i.addEventListener("input",function(){i.removeAttribute("aria-invalid")})});
  form.addEventListener("submit",async function(e){e.preventDefault();say("");
    var v=function(n){return (form.elements[n].value||"").trim()},bad=null;
    if(!v("name"))bad=form.elements.name;else if(v("quote").length<20)bad=quote;else if(v("linkedin")&&!/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(v("linkedin")))bad=form.elements.linkedin;
    if(bad){bad.setAttribute("aria-invalid","true");bad.focus();say(bad===form.elements.name?"Please add your name.":bad===quote?"A few more words, please (at least 20 characters).":"That doesn't look like a LinkedIn link. Leave it empty if you'd rather.");return}
    var fd=new FormData();fd.append("_payload",JSON.stringify({k:code(),name:v("name"),role:v("role"),company:v("company"),quote:v("quote"),linkedin:v("linkedin"),color:(form.querySelector("input[name=color]:checked")||{}).value||"green",website:v("website")}));
    if(photoFile)fd.append("file",photoFile,photoFile.name);
    send.disabled=true;var label=send.firstChild.textContent;send.firstChild.textContent="Sending… ";
    /* never spin forever: after 30s, stop and say so */
    var ctl=new AbortController(),tm=setTimeout(function(){ctl.abort()},30000);
    try{var r=await fetch(CMS+"/api/testimonials/submit",{method:"POST",body:fd,signal:ctl.signal}),j={};try{j=await r.json()}catch(x){}
      if(!r.ok)throw Error(j.error||"Something went wrong. Please try again in a minute.");
      form.hidden=true;document.getElementById("tmLede").hidden=true;done.hidden=false;done.focus()}
    catch(err){say(err.name==="AbortError"?"That's taking too long. Check your connection and press send again; nothing was lost.":err.name==="TypeError"?"Couldn't reach Aditya's studio. Check your connection and try again.":err.message)}
    finally{clearTimeout(tm);send.disabled=false;send.firstChild.textContent=label}});
})();
function route(){
  var h=(HASH()||"#/").replace(/^#/,""),parts=h.split("/").filter(Boolean);
  if(parts[0]==="canvas"&&parts[1]!=="edit"){history.replaceState(null,"","/gallery"+location.search);h="/gallery";parts=["gallery"]}
  /* Opening/closing a gallery image changes only the query; keep the visitor's scroll position. */
  if(parts[0]==="gallery"&&document.getElementById("v-gallery").classList.contains("on"))return;
  if(parts[0]==="lab"&&document.getElementById("v-lab").classList.contains("on"))return;
  /* off home the deck's rail collapses to nothing: at full height it would stretch every other page past its footer */
  onHome=false;rail.style.height="0px";deck.classList.remove("live");setHot(-1);veil.style.opacity="0";veil.style.visibility="hidden";hint.style.display="none";navSlot.style.width="0px";lastNav="";lastHint="";lastBar=null;lastTf=[];lastSh=[];
  var key="home",navKey="/";
  if(parts.length===0){key="home";navKey="/"}
  else if(parts[0]==="about"){key="about";navKey="/about"}
  else if(parts[0]==="offer"){navKey="/offer";key="offer";
    if(parts[1]&&window.renderSvc&&renderSvc(parts[1]))key="svc"}
  else if(parts[0]==="canvas"){key="canvas";navKey="/canvas"}
  else if(parts[0]==="gallery"){key="gallery";navKey="/gallery"}
  else if(parts[0]==="lab"){key="lab";navKey="/lab"}
  else if(parts[0]==="contact"){key="contact";navKey="/contact"}
  else if(parts[0]==="testimonial"){key="testimonial";navKey=""}
  else if(parts[0]==="work"){navKey="/work";
    if(parts[1]){var p=P.filter(function(x){return x.id===parts[1]})[0];
      if(p){renderCase(p);key="case"}else key="work"}else key="work"}
  show(key);updateFooter(key);underline();reveal();if(!document.body.classList.contains("routed"))document.body.classList.add("routed");
  selectNav(navKey,"page");
  /* instant: the page has scroll-behavior:smooth, so a plain scrollTo(0,0) glided up from wherever the last page had been
     scrolled (opening a case study from the deck showed it mid-page, then it slid to the top) */
  window.scrollTo({top:0,left:0,behavior:"instant"});smooth=0;target=SY=0;
  if(key==="home"){onHome=true;deck.classList.add("live");hint.style.display="";litCount=-1;
    requestAnimationFrame(function(){measure();remark();render()})}
  if(key==="canvas"){requestAnimationFrame(fitAll)}
  /* tab titles, Aditya's wording. Google only indexes the home URL (hash routes), so these are for tabs,
     bookmarks and history */
  var TT={home:"Aditya Kumar · AI & Backend Software Engineer",work:"Work · Aditya Kumar",about:"About · Aditya Kumar",
    offer:"Services · Aditya Kumar",canvas:"Canvas · Aditya Kumar",gallery:"Gallery · Aditya Kumar",lab:"Lab · Aditya Kumar",contact:"Contact · Aditya Kumar",testimonial:"Testimonial · Aditya Kumar"},tt=TT[key];
  if(key==="case"){var pc=P.filter(function(x){return x.id===parts[1]})[0];tt=(pc?pc.n+" · Aditya Kumar":"Work · Aditya Kumar")}
  if(key==="svc"){var so=(typeof OFFER!=="undefined"?OFFER:[]).filter(function(o){return o.id===parts[1]})[0];
    tt=(so?so.h.replace(/&amp;/g,"&")+" · Aditya Kumar":"Services · Aditya Kumar")}
  document.title=tt||TT.home;
  /* per page description and canonical: each path is its own page to Google now (real URLs, see HASH()) */
  var DD={home:"Aditya Kumar builds production AI, backend infrastructure, and reliable automation — systems engineered to scale, recover, and stay dependable.",
    work:"Selected projects by Aditya Kumar: Sync-Drive, Automated Job Application System, UniBLOGic, Graph Node Classification, and PyOS.",
    about:"Aditya Kumar is an AI & Backend Software Engineer (IIIT Gwalior) focused on production automation, backend systems, and reliable software.",
    offer:"Engineering services by Aditya Kumar: backend & API engineering, AI automation, platform reliability, full-stack development, and applied ML.",
    canvas:"Project and system explorations by Aditya Kumar.",
    gallery:"Gallery.",
    lab:"Experiments and prototypes.",
    contact:"Contact Aditya Kumar — AI & Backend Software Engineer. Open to software engineering roles.",
    "job-automation":"Automated Job Application System: a full-stack Chrome extension and API stack to parse résumés and automate job applications.",
    "node-classifier":"Graph Node Classification: a GCN-based classifier on CORA with two-hop aggregation and weighted loss.",
    pyos:"PyOS: a modular terminal operating-system simulation with auth, scheduling, and concurrency."},
    dd=key==="case"?DD[parts[1]]:key==="svc"?(tt+". "+DD.offer):DD[key],
    canon=""+(HASH().replace(/^#/,"")==="/"?"/":HASH().replace(/^#/,""));
  function meta(sel,attr,v){var m=document.head.querySelector(sel);if(m&&v)m.setAttribute(attr,v)}
  meta('meta[name="description"]',"content",dd||DD.home);meta('meta[property="og:description"]',"content",dd||DD.home);
  meta('meta[property="og:title"]',"content",document.title);meta('link[rel="canonical"]',"href",canon);meta('meta[property="og:url"]',"content",canon)
  /* the invite form is private: keep it out of search */
  var rb=document.head.querySelector('meta[name="robots"]');if(key==="testimonial"){if(!rb){rb=document.createElement("meta");rb.name="robots";document.head.appendChild(rb)}rb.content="noindex"}else if(rb)rb.remove()}
window.addEventListener("hashchange",route);
var rzW=window.innerWidth;
window.addEventListener("resize",function(){if(window.innerWidth===rzW&&matchMedia("(pointer:coarse)").matches)return;rzW=window.innerWidth;SVH=0;measure();remark();
  if(document.getElementById("v-canvas").classList.contains("on"))fitAll()});
window.addEventListener("load",function(){measure();remark();render()});
/* the story ranges are measured from the paragraph, and a late font changes its height */
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){measure();remark();render()});
measure();route();queueFrame();
/* ---------- splash: immediate scramble on the landing page, then a pixel shred ---------- */
(function(){
  var sp=document.getElementById("splash");
  if(!sp)return;
  /* A shared URL should reveal its destination immediately. The landing splash belongs only to a direct home visit. */
  if(HASH()!=="#/"){sp.classList.add("done");return}
  try{ if(sessionStorage.getItem("hg_seen")==="1"){sp.classList.add("done");return} }catch(e){}
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches){sp.classList.add("done");return}
  document.documentElement.style.overflow="hidden";
  var cv=sp.querySelector(".shred"),gone=false,ready=true;
  /* Scramble immediately; fonts and images can settle behind the splash without blocking the first interaction. */
  sp.classList.add("ready");scram();
  /* the shred: a grid of black pixels. Each one flashes a pillar colour and disappears; the wave runs from the centre
     to the edges, with enough jitter that it reads as pixels, not a circle */
  function shred(){
    if(gone)return;gone=true;
    document.documentElement.style.overflow="";
    try{sessionStorage.setItem("hg_seen","1")}catch(e){}
    var W=innerWidth,H=innerHeight,dpr=Math.min(2,devicePixelRatio||1),C=W<700?18:24;
    cv.width=W*dpr;cv.height=H*dpr;var x=cv.getContext("2d");x.scale(dpr,dpr);
    x.fillStyle="#0B0B0D";x.fillRect(0,0,W,H);sp.classList.add("shredding");
    var PC=["#FFD44E","#A9DEFF","#B4F6B8","#E7BBFF"],cols=Math.ceil(W/C),rows=Math.ceil(H/C),cx=W/2,cy=H/2,md=Math.hypot(cx,cy),cells=[];
    for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){var px=c*C,py=r*C,d=Math.hypot(px+C/2-cx,py+C/2-cy)/md;
      cells.push({x:px,y:py,t:d*760+Math.random()*260,col:PC[(Math.random()*4)|0],s:0})}
    var FL=110,start=performance.now();
    (function f(now){var el=now-start,left=0;
      for(var i=0;i<cells.length;i++){var q=cells[i];if(q.s===2)continue;left++;
        if(el>=q.t+FL){x.clearRect(q.x,q.y,C,C);q.s=2}
        else if(el>=q.t&&q.s===0){x.fillStyle=q.col;x.fillRect(q.x,q.y,C,C);q.s=1}}
      if(left)requestAnimationFrame(f);else sp.classList.add("done")})(start)}
  var go=document.getElementById("splashGo");
  go.addEventListener("click",function(e){e.stopPropagation();shred()});
  sp.addEventListener("click",function(){if(ready)shred()});
  window.addEventListener("keydown",function k(e){if(!ready)return;if(e.key==="Enter"||e.key===" "||e.key==="Escape"){window.removeEventListener("keydown",k);shred()}});
  window.addEventListener("wheel",function w(){if(!ready)return;window.removeEventListener("wheel",w);shred()},{passive:true});
})();
/* =================== ROUND 22: interactions (batch 1) ===================
   Ported from adityaraj-dev/portfolio (read-only reference), filtered to
   Aditya's keep list. Held back for follow-ups, not in this batch:
   - 20 slingshot: built, then removed entirely at Aditya's call (Sept 27). Don't bring it back.
   - 22 print CV: waiting on the new work timeline copy.
   - 27 Parchi live demo: waiting on Parchi's real screens/logic.
   - 2,5,8,12,13(tab title),15,18,21,25,28,29,30,31: cut, see CLAUDE.md. */
(function(){
  var fine=window.matchMedia&&matchMedia("(hover:hover) and (pointer:fine)").matches;
  var calm=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  var PC=["#FFD44E","#E7BBFF","#B4F6B8","#A9DEFF"];
  function $(q,r){return (r||document).querySelector(q)}
  function $$(q,r){return Array.prototype.slice.call((r||document).querySelectorAll(q))}
  function typing(e){var t=e.target;return !!t&&(/^(input|textarea|select)$/i.test(t.tagName||"")||t.isContentEditable)}
  function esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
  function pick(a){return a[Math.floor(Math.random()*a.length)]}

  /* ============ 0. the found counter ============ */
  var LIST=[
    ["present","Present a case study","Open any case study and press P, or hit Present this. It turns into a deck."],
    ["svg","Steal a doodle","Hover a doodle, press Cmd or Ctrl + C, then paste into Figma. Real vectors."],
    ["measure","Make the page measure itself","Hold Alt (Option on a Mac) and hover anything. Real px, like Figma."],
    ["layers","See the layers","Press L. The page lists its own layers. Hide some."],
    ["sleep","Let the doodles nap","Leave the page alone for half a minute, then move."],
    ["chat","Talk from your cursor","Press / anywhere, type, hit Enter. Type a page name and it takes you there."],
    ["tone","Ruin my About page","On About, drag the tone slider all the way right."],
    ["redact","Read the redacted bit","On About, scrub across the blacked out words."],
    ["track","Watch a title get edited","Open the Work page and look at the title."],
    ["lean","Make the letters look at you","Move your cursor slowly across a big page title."],
    ["fall","Knock the footer over","Click the last line in the footer."],
    ["name","Say my name","Type aditya anywhere on the page."],
    ["plane","Launch a paper plane","Click the sky in the footer. A plane takes off from there."]
  ];
  if(!fine)LIST=LIST.filter(function(x){return ["chat","lean","measure","layers","svg"].indexOf(x[0])<0});
  var got={};try{got=JSON.parse(localStorage.getItem("hg-found")||"{}")||{}}catch(e){got={}}
  function count(){return LIST.filter(function(x){return got[x[0]]}).length}
  var pill=document.createElement("button");pill.type="button";pill.className="hg-found";pill.setAttribute("aria-expanded","false");
  pill.setAttribute("aria-label","Things hidden on this site");
  var sheet=document.createElement("div");sheet.className="hg-sheet";sheet.setAttribute("role","dialog");sheet.setAttribute("aria-label","Things hidden on this site");
  var toastEl=document.createElement("div");toastEl.className="hg-toast";toastEl.setAttribute("role","status");toastEl.setAttribute("aria-live","polite");
  var fin=$(".foot-in"),fsp=fin&&$("span",fin);
  if(fsp){fsp.appendChild(document.createTextNode(" · "));fsp.appendChild(pill)}else document.body.appendChild(pill);
  document.body.appendChild(sheet);document.body.appendChild(toastEl);
  function paint(){pill.innerHTML='<b>'+count()+'/'+LIST.length+'</b><span>found</span>';
    sheet.innerHTML='<h4>This site has a few secrets.</h4><p>It is meant to be a working canvas, so most of it does something. Here is what is hidden, and how to find it.</p><ol>'+
      LIST.map(function(x){return '<li class="'+(got[x[0]]?'got':'')+'"><s>✓</s><span><b>'+x[1]+'</b><br>'+x[2]+'</span></li>'}).join("")+
      '</ol><button type="button" class="hg-x">Close</button>'}
  paint();
  function say(html,ms){toastEl.innerHTML=html;toastEl.classList.add("on");clearTimeout(say.t);say.t=setTimeout(function(){toastEl.classList.remove("on")},ms||2200)}
  function found(k){var it=LIST.filter(function(x){return x[0]===k})[0];if(!it||got[k])return;got[k]=1;
    try{localStorage.setItem("hg-found",JSON.stringify(got))}catch(e){}
    paint();pill.classList.remove("bump");void pill.offsetWidth;pill.classList.add("bump");
    var n=count();say('<em>found it</em>'+esc(it[1])+' · '+n+' of '+LIST.length,2600);
    try{document.dispatchEvent(new CustomEvent("hgfound",{detail:it[1]}))}catch(e){}}
  window.hgFound=found;
  function openSheet(on){if(on){var r=pill.getBoundingClientRect();sheet.style.left=Math.max(16,Math.min(innerWidth-sheet.offsetWidth-16,r.left))+"px";sheet.style.bottom=(innerHeight-r.top+12)+"px"}
    sheet.classList.toggle("on",on);pill.setAttribute("aria-expanded",on?"true":"false")}
  pill.addEventListener("click",function(e){e.stopPropagation();openSheet(!sheet.classList.contains("on"))});
  sheet.addEventListener("click",function(e){e.stopPropagation();if(e.target.closest(".hg-x"))openSheet(false)});
  document.addEventListener("click",function(){if(sheet.classList.contains("on"))openSheet(false)});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&sheet.classList.contains("on"))openSheet(false)});

  /* the "aditya" easter egg counts too */
  var nbuf="";document.addEventListener("keydown",function(e){if(e.key.length!==1||typing(e))return;nbuf=(nbuf+e.key.toLowerCase()).slice(-6);if(nbuf==="aditya")found("name")});

  /* ============ 1. cursor chat, like Figma's. Type a page name and it goes there ============ */
  var mx=innerWidth/2,my=innerHeight/2;
  window.addEventListener("pointermove",function(e){mx=e.clientX;my=e.clientY;if(chat.classList.contains("on"))placeChat()},{passive:true});
  var chat=document.createElement("div");chat.className="cchat";
  chat.innerHTML='<input type="text" maxlength="60" aria-label="Cursor chat" placeholder="Say something, or type work">';
  document.body.appendChild(chat);var ci=chat.firstChild;
  function placeChat(){var w=chat.offsetWidth||280,h=chat.offsetHeight||40;
    chat.style.transform="translate("+Math.min(mx+16,innerWidth-w-12)+"px,"+Math.min(my+18,innerHeight-h-12)+"px)"}
  var GO={home:"#/","/":"#/",work:"#/work",projects:"#/work",about:"#/about",me:"#/about",services:"#/offer",offer:"#/offer",canvas:"#/gallery",gallery:"#/gallery",lab:"#/lab",contact:"#/contact",hire:"#/contact",
    alter:"#/work/alter","track it":"#/work/track-it",trackit:"#/work/track-it",washio:"#/work/washio",parchi:"#/work/parchi",hourbit:"#/work/hourbit"};
  function openChat(){if(!fine)return;chat.classList.add("on");ci.value="";placeChat();ci.focus()}
  function closeChat(){chat.classList.remove("on");ci.blur()}
  document.addEventListener("keydown",function(e){if(e.key!=="/"||e.metaKey||e.ctrlKey||e.altKey||typing(e))return;e.preventDefault();openChat()});
  ci.addEventListener("keydown",function(e){e.stopPropagation();
    if(e.key==="Escape"){closeChat();return}
    if(e.key!=="Enter")return;var v=ci.value.trim(),k=v.toLowerCase().replace(/^(go to|open|take me to)\s+/,"");closeChat();if(!v)return;
    found("chat");
    if(k==="help"||k==="?"||k==="secrets"){openSheet(true);return}
    if(window.hgCmd&&hgCmd(k))return;
    var b=document.createElement("div");b.className="cbub";b.style.setProperty("--bc",pick(PC));b.textContent=v;
    b.style.left=Math.min(mx+16,innerWidth-300)+"px";b.style.top=Math.min(my+18,innerHeight-60)+"px";document.body.appendChild(b);
    setTimeout(function(){b.remove()},4300);
    if(GO[k]){setTimeout(function(){goHash(GO[k])},450)}});
  ci.addEventListener("blur",function(){setTimeout(function(){if(document.activeElement!==ci)chat.classList.remove("on")},80)});

  /* ============ 3. the Work title edits itself, tracked changes and all ============ */
  var tcDone=false;
  function trackTitle(){if(tcDone)return;var v=document.getElementById("v-work");if(!v||!v.classList.contains("on"))return;
    var h=$("h1.big",v);if(!h)return;
    var orig=h.innerHTML,words=h.textContent.replace(/\s+/g," ").trim();
    if(!/^Apps I designed and built\.$/.test(words)){return}
    if(calm){return}
    tcDone=true;h.classList.add("tc-wrap");
    h.innerHTML='Apps I <span class="tc-d">made</span><span class="tc-i"></span><span class="tc-caret"></span>.';
    var d=$(".tc-d",h),ins=$(".tc-i",h),car=$(".tc-caret",h);
    var steps=[
      [700,function(){d.classList.add("x");var c=document.createElement("span");c.className="tc-c";c.innerHTML='<i>H</i>‘made’ is vague. Say which part.';h.appendChild(c)}],
      [900,function(){d.classList.add("gone");h.insertBefore(car,ins.nextSibling);var s="designed and built",i=0;
        (function t(){ins.textContent=s.slice(0,++i);if(i<s.length)setTimeout(t,55+Math.random()*50);else next()})()}],
      [900,function(){car.remove();ins.classList.add("done");var c=$(".tc-c",h);if(c){c.innerHTML='<i>✓</i>Resolved';setTimeout(function(){c.classList.add("res")},900)}}],
      [1500,function(){h.innerHTML=orig;h.classList.remove("tc-wrap");found("track")}]];
    var k=0;function next(){var s=steps[k++];if(s)setTimeout(function(){if(!v.classList.contains("on")){h.innerHTML=orig;h.classList.remove("tc-wrap");tcDone=false;return}s[1]();if(k!==2)next()},s[0])}
    next()}
  window.addEventListener("hashchange",function(){setTimeout(trackTitle,500)});setTimeout(trackTitle,900);

  /* ============ 4. hero: the words in the claim change on their own ============
     No click, no hover colour (the pillar blue was too faint to read as text). Each phrase holds
     for HOLD ms, the swap itself takes .3s. Stops when the hero is off screen or the tab is hidden;
     reduced motion keeps the first phrase. */
  (function(){var c=$("#hero .claim");if(!c)return;var html=c.innerHTML,key="apps &amp; websites";if(html.indexOf(key)<0)return;
    var OPT=["apps &amp; websites","Android apps","home screen widgets","design systems","micro-interactions","scroll systems"],i=0,HOLD=2400;
    /* the phrase sits on its own line ("I design <phrase>" / "end to end, then build them in code"), in a slot
       as wide as the longest phrase, so nothing ever reflows or wraps differently. Line one is then slid
       sideways with a transform to stay centred on the phrase that's showing: compositor only, no layout */
    c.innerHTML=html.replace("I design "+key+" ",'<span class="cl1">I design <span class="wslot"><span>'+key+'</span></span></span><br>');
    if(calm)return;
    var b=$(".wslot",c),l1=$(".cl1",c),busy=false,seen=true,W=[],M=0;
    function place(){l1.style.transform="translateX("+((M-W[i])/2).toFixed(1)+"px)"}
    function fit(){var t=document.createElement("span");t.style.cssText="position:absolute;visibility:hidden;white-space:nowrap";b.appendChild(t);
      W=OPT.map(function(o){t.innerHTML=o;return t.getBoundingClientRect().width});t.remove();M=Math.max.apply(null,W);
      b.style.width=Math.ceil(M)+"px";l1.style.transition="none";place();void l1.offsetWidth;l1.style.transition=""}
    fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);window.addEventListener("resize",fit);
    function swap(){if(busy||!seen||document.hidden)return;busy=true;i=(i+1)%OPT.length;
      var old=b.firstChild,nw=document.createElement("span");nw.className="in";nw.innerHTML=OPT[i];b.appendChild(nw);
      void b.offsetWidth;requestAnimationFrame(function(){old.classList.add("out");nw.classList.remove("in");place()});
      setTimeout(function(){old.remove();busy=false},560)}
    if("IntersectionObserver" in window)new IntersectionObserver(function(es){seen=es[0].isIntersecting}).observe(c);
    setInterval(swap,HOLD)})();

  /* ============ 6. about: scrub the redacted words clean ============ */
  (function(){var p=$(".edu");if(!p)return;
    /* the site's own no-dashes rule: fixing this line's em dash while it's touched */
    p.innerHTML=p.innerHTML.replace("That's the whole list. The design is self-taught","That's the whole list. The design is self-taught");
    var P="which is either a red flag or the most interesting thing about me";
    var h=p.innerHTML;if(h.indexOf(P)<0)return;
    p.innerHTML=h.replace(P,'<span class="rd" aria-label="'+P+'">'+P.split(" ").map(function(w){return '<span class="rdw">'+w+'</span>'}).join(" ")+'</span>')+'<span class="rd-tip" aria-hidden="true">scrub the black bits</span>';
    var ws=$$(".rdw",p),left=ws.length,tip=$(".rd-tip",p);
    function clr(el){if(!el||!el.classList||!el.classList.contains("rdw")||el.classList.contains("clr"))return;el.classList.add("clr");
      if(--left===0){tip.textContent="well, now you know";found("redact")}}
    p.addEventListener("pointermove",function(e){clr(e.target)});
    p.addEventListener("pointerdown",function(e){clr(e.target)});
    p.addEventListener("touchmove",function(e){var t=e.touches[0];clr(document.elementFromPoint(t.clientX,t.clientY))},{passive:true})})();

  /* ============ 7. about: the tone slider, from how I write to how I refuse to ============ */
  (function(){var v=document.getElementById("v-about");if(!v)return;var h=$(".page-head h1.big",v),lede=$(".page-head .lede",v);if(!h||!lede)return;
    var T=[
      [null,"This is how I write."],
      ["I came from a commerce background and moved into designing products.","Still fine. A little stiff."],
      ["Leveraging a commerce background, I transitioned into crafting *user-centric* *solutions*.","Now it sounds like a LinkedIn post."],
      ["*Leveraging* a finance first *mindset*, I *pivoted* to delivering *best-in-class*, *seamless* digital *experiences* at *scale*.","I won't write this. Slide it back, please."]];
    var box=document.createElement("div");box.className="tone";
    box.innerHTML='<span>Plain</span><input type="range" min="0" max="3" step="1" value="0" aria-label="Tone of voice for this title"><span>Corporate</span><p class="tone-n ok" aria-live="polite">'+T[0][1]+'</p>';
    lede.parentNode.insertBefore(box,lede.nextSibling);
    var inp=$("input",box),n=$(".tone-n",box),orig=null,cur=0;
    inp.addEventListener("input",function(){var k=+inp.value;if(k===cur)return;cur=k;
      if(orig===null)orig=h.innerHTML;if(window.hgPenReset)hgPenReset(h);
      if(k===0){h.innerHTML=orig}
      else{var i=0;h.innerHTML=T[k][0].split(" ").map(function(w){var bz=/^\*.*\*[.,]?$/.test(w),clean=w.replace(/\*/g,"");
          return '<span class="tone-word'+(bz?' bz':'')+'" style="--i:'+(i++)+'">'+esc(clean)+'</span>'}).join(" ")}
      n.textContent=T[k][1];n.classList.toggle("ok",k<2);if(k===3)found("tone")})})();

  /* 9 (words ink in as you read) removed Sept 28 at Aditya's call: the grey to black fill read as jitter */

  /* ============ 11. the footer line falls over when you knock it ============ */
  (function(){var sp=$$(".foot-in > span").filter(function(s){return /Built in code/.test(s.textContent)})[0];if(!sp)return;
    var txt=sp.textContent;sp.classList.add("fall");sp.setAttribute("role","button");sp.setAttribute("tabindex","0");sp.setAttribute("aria-label",txt+" Click to knock it over.");
    sp.innerHTML=Array.from(txt).map(function(ch){return '<span class="fl" aria-hidden="true">'+(ch===" "?" ":esc(ch))+'</span>'}).join("");
    var L=$$(".fl",sp),down=false,raf=0,st=[];
    function knock(){if(raf)return;if(calm){return}
      if(!down){down=true;sp.classList.add("down");found("fall");
        st=L.map(function(l,i){var r=l.getBoundingClientRect();return {x:0,y:0,vx:(Math.random()-.5)*5,vy:-Math.random()*6-2,r:0,vr:(Math.random()-.5)*14,
          floor:innerHeight-40-r.bottom,lw:-r.left+6,rw:innerWidth-6-r.right,rest:0,delay:i*18}});
        var t0=performance.now();(function f(t){var alive=false;st.forEach(function(s,i){if(t-t0<s.delay){alive=true;return}
            if(s.rest>40)return;alive=true;s.vy+=.55;s.x+=s.vx;s.y+=s.vy;s.r+=s.vr;
            if(s.y>s.floor){s.y=s.floor;s.vy*=-.38;s.vx*=.82;s.vr*=.6;if(Math.abs(s.vy)<1)s.rest++}
            if(s.x<s.lw){s.x=s.lw;s.vx*=-.6}if(s.x>s.rw){s.x=s.rw;s.vx*=-.6}
            L[i].style.transform="translate("+s.x.toFixed(1)+"px,"+s.y.toFixed(1)+"px) rotate("+s.r.toFixed(1)+"deg)"});
          raf=alive?requestAnimationFrame(f):0})(t0)}
      else{down=false;sp.classList.remove("down");L.forEach(function(l,i){l.style.transition="transform .7s cubic-bezier(.34,1.4,.64,1) "+(i*12)+"ms";l.style.transform=""});
        setTimeout(function(){L.forEach(function(l){l.style.transition=""})},1300)}}
    sp.addEventListener("click",knock);sp.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();knock()}});
    window.addEventListener("hashchange",function(){if(down){cancelAnimationFrame(raf);raf=0;down=true;knock()}})})();

  /* ============ 13. big titles lean toward the cursor ============ */
  /* Eased in script, one write per letter per frame. It used to write a raw target every frame into letters that
     also carried a .25s CSS transform transition, so each frame restarted the transition and the letters dragged
     behind the cursor (the heavy, jittery feel). While a title is live: CSS transitions off, and the colour shadow is a fixed offset that only repaints when its colour changes */
  (function(){if(!fine||calm)return;var cur=null,cache=[],raf=0,px=-1e4,py=-1e4,moves=0;
    var WAVE=["#FFD44E","#A9DEFF","#B4F6B8","#E7BBFF"];
    function measure(h){cache=$$(".cx",h).map(function(c){var r=c.getBoundingClientRect(),t=c.style.transform;
      return {el:c,x:r.left+r.width/2,y:r.top+r.height/2,f:0,dx:0,dy:0,col:"",tf:""}})}
    function reset(){var h=cur;cur=null;cache.forEach(function(c){c.el.style.transform="";c.el.style.textShadow=""});cache=[];if(h)h.classList.remove("leaning")}
    function tick(){raf=0;if(!cur)return;var busy=false;
      var away=px<-9e3;
      cache.forEach(function(c){var dx=px-c.x,dy=py-c.y,d=Math.sqrt(dx*dx+dy*dy),t=away?0:Math.max(0,1-d/150);
        /* leaving: only the strength fades; the direction holds, so nothing gets flung toward the off-screen point */
        c.f+=(t-c.f)*.22;if(!away){c.dx+=(dx-c.dx)*.22;c.dy+=(dy-c.dy)*.22}if(Math.abs(t-c.f)>.002)busy=true;
        var f=c.f<.004?0:c.f,tf=f?"translate("+(c.dx*f*.12).toFixed(1)+"px,"+(-10*f+c.dy*f*.08).toFixed(1)+"px) scale("+(1+f*.18).toFixed(3)+")":"";
        if(tf!==c.tf){c.tf=tf;c.el.style.transform=tf}
        var col=f>.12?WAVE[Math.min(3,Math.floor((1-f)*4.6))]:"";
        if(col!==c.col){c.col=col;c.el.style.textShadow=col?"3px 3px 0 "+col:""}});
      if(busy)raf=requestAnimationFrame(tick)}
    document.addEventListener("pointermove",function(e){var h=e.target.closest&&e.target.closest("main h1.big");
      if(!h||h.classList.contains("penning")||!$(".cx",h)){if(cur){px=py=-1e4;if(!raf)raf=requestAnimationFrame(tick);setTimeout(function(){if(cur&&px<-9e3)reset()},600)}return}
      if(h!==cur){reset();cur=h;h.classList.add("leaning");measure(h)}px=e.clientX;py=e.clientY;if(++moves===40)found("lean");if(!raf)raf=requestAnimationFrame(tick)},{passive:true});
    window.addEventListener("scroll",function(){if(cur)reset()},{passive:true})})();

  /* ============ 16. hold Alt: the page measures itself, like Figma ============ */
  (function(){if(!fine)return;var ov=document.createElement("div");ov.className="msr";ov.setAttribute("aria-hidden","true");document.body.appendChild(ov);
    var OURS=".hg-found,.hg-sheet,.hg-toast,.cchat,.cbub,.msr,.lyr,.lyr-hl,.pz";
    var on=false,raf=0,lastEl=null,n=0;
    function pickEl(){var el=document.elementFromPoint(mx,my);if(!el||el===document.documentElement||el===document.body||el.closest(OURS))return null;
      if(el.tagName&&el.namespaceURI==="http://www.w3.org/2000/svg"&&el.ownerSVGElement)el=el.ownerSVGElement;return el}
    function parentOf(el,r){var p=el.parentElement;while(p&&p!==document.body){var q=p.getBoundingClientRect();if(Math.abs(q.width-r.width)>1||Math.abs(q.height-r.height)>1)return [p,q];p=p.parentElement}return null}
    function line(x,y,len,v,val){if(len<2)return "";var mid=v?[x,y+len/2]:[x+len/2,y];
      return '<span class="ln '+(v?'v':'h')+'" style="left:'+x+'px;top:'+y+'px;'+(v?'height':'width')+':'+len+'px"></span><span class="lb" style="left:'+(mid[0]+(v?14:0))+'px;top:'+(mid[1]+(v?0:-10))+'px">'+Math.round(val)+'</span>'}
    function paint(){raf=0;if(!on)return;var el=pickEl();if(!el){ov.innerHTML="";return}
      var r=el.getBoundingClientRect(),pp=parentOf(el,r),h='<span class="bx" style="left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px"></span>'+
        '<span class="sz" style="left:'+(r.left+r.width/2)+'px;top:'+(r.bottom+6)+'px">'+Math.round(r.width)+' × '+Math.round(r.height)+'</span>';
      if(pp){var q=pp[1],cx=r.left+r.width/2,cy=r.top+r.height/2;
        h+='<span class="pb" style="left:'+q.left+'px;top:'+q.top+'px;width:'+q.width+'px;height:'+q.height+'px"></span>';
        h+=line(cx,q.top,r.top-q.top,true,r.top-q.top)+line(cx,r.bottom,q.bottom-r.bottom,true,q.bottom-r.bottom)+line(q.left,cy,r.left-q.left,false,r.left-q.left)+line(r.right,cy,q.right-r.right,false,q.right-r.right)}
      ov.innerHTML=h;if(el!==lastEl){lastEl=el;if(++n===4)found("measure")}}
    function kick(){if(!raf)raf=requestAnimationFrame(paint)}
    document.addEventListener("keydown",function(e){if(e.key!=="Alt"||typing(e))return;e.preventDefault();if(!on){on=true;ov.classList.add("on");kick()}});
    function off(){on=false;ov.classList.remove("on");ov.innerHTML=""}
    document.addEventListener("keyup",function(e){if(e.key==="Alt"){e.preventDefault();off()}});
    window.addEventListener("blur",off);
    window.addEventListener("pointermove",function(){if(on)kick()},{passive:true});
    window.addEventListener("scroll",function(){if(on)kick()},{passive:true})})();

  /* ============ 17. press L: the page's own layers panel ============ */
  var layers=(function(){if(!fine)return null;
    var OURS=".hg-found,.hg-sheet,.hg-toast,.cchat,.cbub,.msr,.lyr,.lyr-hl,.pz";
    var lp=document.createElement("div");lp.className="lyr";lp.setAttribute("role","dialog");lp.setAttribute("aria-label","Layers");
    lp.innerHTML='<div class="lyr-h"><b>Layers</b><span></span><button type="button" aria-label="Close layers">×</button></div><div class="lyr-l" role="tree"></div><div class="lyr-f">This is the real page, not a picture of it. Hover a layer to find it, click to go there, use the eye to hide it. L to close.</div>';
    var hl=document.createElement("div");hl.className="lyr-hl";hl.innerHTML="<b></b>";
    document.body.appendChild(lp);document.body.appendChild(hl);
    var list=$(".lyr-l",lp),rows=[],hidden=[],sel=null,EYE='<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    var NAMES={"v-home":"Home","v-about":"About","v-offer":"Services","v-svc":"Service","v-work":"Work","v-case":"Case study","v-canvas":"Canvas editor","v-gallery":"Gallery","v-lab":"Lab","v-contact":"Contact"};
    function nm(el){var tg=el.tagName.toLowerCase(),txt=(el.children.length?"":(el.textContent||"")).replace(/\s+/g," ").trim();
      if(tg==="img")return ["▣","Image"+(el.alt?" · "+el.alt:""),0];
      if(tg==="svg")return ["✦","Vector",0];
      if(tg==="video")return ["▶","Video",0];
      if(/^h[1-6]$/.test(tg))return ["T",(el.textContent||"").replace(/\s+/g," ").trim().slice(0,40)||tg,0];
      if(tg==="a"||tg==="button")return ["◉",(tg==="a"?"Link · ":"Button · ")+((el.textContent||"").replace(/\s+/g," ").trim().slice(0,28)||el.getAttribute("aria-label")||""),0];
      if(txt&&(tg==="p"||tg==="span"||tg==="b"||tg==="li"||tg==="small"||tg==="q"))return ["T",txt.slice(0,40),0];
      var c=(el.id?el.id:(typeof el.className==="string"&&el.className.trim()?el.className.trim().split(/\s+/)[0]:tg));
      return ["#",(tg==="section"?"Section · ":"")+c,1]}
    function vis(el){if(el.closest(OURS))return false;var r=el.getBoundingClientRect();return r.width>1&&r.height>1}
    function build(){list.innerHTML="";rows=[];var root=$(".view.on");if(!root)return;$(".lyr-h span",lp).textContent=NAMES[root.id]||"Page";
      var html="",cnt=0;
      (function walk(el,d){if(cnt>420||d>6)return;Array.prototype.forEach.call(el.children,function(c){if(cnt>420)return;
          if(/^(script|style|template|defs|use)$/i.test(c.tagName)||!vis(c))return;var n=nm(c),i=rows.length;rows.push(c);cnt++;
          html+='<div class="lr" role="treeitem" style="--d:'+d+'" data-i="'+i+'"><i class="'+(n[2]?'f':'')+'">'+n[0]+'</i><span>'+esc(n[1])+'</span><button type="button" class="eye" aria-label="Hide layer">'+EYE+'</button></div>';
          if(c.tagName.toLowerCase()!=="svg"&&!/^(p|h[1-6]|a|button|img|video)$/i.test(c.tagName))walk(c,d+1)})})(root,0);
      list.innerHTML=html}
    function box(el,label){if(!el||!document.contains(el)){hl.classList.remove("on");return}var r=el.getBoundingClientRect();
      hl.style.left=r.left+"px";hl.style.top=r.top+"px";hl.style.width=r.width+"px";hl.style.height=r.height+"px";$("b",hl).textContent=label+"  "+Math.round(r.width)+" × "+Math.round(r.height);hl.classList.add("on")}
    function rowOf(e){var r=e.target.closest(".lr");return r?[r,rows[+r.dataset.i]]:null}
    list.addEventListener("pointerover",function(e){var o=rowOf(e);if(o)box(o[1],$("span",o[0]).textContent)});
    list.addEventListener("pointerleave",function(){if(sel)box(sel[1],$("span",sel[0]).textContent);else hl.classList.remove("on")});
    list.addEventListener("click",function(e){var o=rowOf(e);if(!o)return;
      if(e.target.closest(".eye")){var off=o[0].classList.toggle("off");o[1].style.visibility=off?"hidden":"";if(off)hidden.push(o[1]);$(".eye",o[0]).setAttribute("aria-label",off?"Show layer":"Hide layer");return}
      if(sel)sel[0].classList.remove("sel");sel=o;o[0].classList.add("sel");o[1].scrollIntoView({block:"center",behavior:calm?"auto":"smooth"});
      setTimeout(function(){box(o[1],$("span",o[0]).textContent)},calm?0:500)});
    window.addEventListener("scroll",function(){if(lp.classList.contains("on")&&sel)box(sel[1],$("span",sel[0]).textContent)},{passive:true});
    function open(on){lp.classList.toggle("on",on);hl.classList.remove("on");sel=null;
      if(on){build();found("layers")}else{hidden.forEach(function(el){el.style.visibility=""});hidden=[]}}
    $(".lyr-h button",lp).addEventListener("click",function(){open(false)});
    document.addEventListener("keydown",function(e){if(e.metaKey||e.ctrlKey||e.altKey||typing(e))return;var k=e.key.toLowerCase();
      if(k==="l"){open(!lp.classList.contains("on"))}else if(k==="escape"&&lp.classList.contains("on"))open(false)});
    window.addEventListener("hashchange",function(){if(lp.classList.contains("on")){hidden.forEach(function(el){el.style.visibility=""});hidden=[];setTimeout(build,400)}});
    return {toggle:function(){open(!lp.classList.contains("on"))}}})();

  /* cursor chat learns "layers" */
  window.hgCmd=function(k){if(k==="layers"&&layers){layers.toggle();return true}return false};

  /* ============ 19. favicon: static, the nav's own Nerdy Designer glasses mark ============
     Not the scroll-position minimap from the source repo — Aditya asked for a fixed icon,
     the same glasses SVG that's already in .nav .logo, redrawn onto a small canvas. */
  (function(){var link=document.querySelector("link[rel~='icon']");if(!link){link=document.createElement("link");link.rel="icon";document.head.appendChild(link)}
    var src=$(".nav .logo svg");if(!src)return;
    var svg=src.cloneNode(true);svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
    /* ink on a light tab strip, white on a dark one: the SVG follows the OS/browser colour scheme itself */
    Array.prototype.forEach.call(svg.querySelectorAll("[fill],[stroke]"),function(n){var c=[];
      if(n.getAttribute("fill")&&n.getAttribute("fill")!=="none")c.push("fi");if(n.getAttribute("stroke")&&n.getAttribute("stroke")!=="none")c.push("st");n.setAttribute("class",c.join(" "))});
    svg.insertAdjacentHTML("afterbegin","<style>.fi{fill:#131316}.st{stroke:#131316}@media (prefers-color-scheme:dark){.fi{fill:#fff}.st{stroke:#fff}}</style>");
    var xml='<?xml version="1.0" encoding="UTF-8"?>'+svg.outerHTML;
    link.href="data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(xml)))})();

  /* ============ 23. leave it alone and the doodles fall asleep ============ */
  (function(){var idle=0,asleep=false,T=30000;
    function sleep(){var ds=$$(".view.on .doo").filter(function(d){var r=d.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.width>0});
      if(!ds.length){idle=setTimeout(sleep,T);return}asleep=true;
      ds.forEach(function(d,i){setTimeout(function(){if(!asleep)return;var z=document.createElement("span");z.className="hey zz";z.textContent="z z z";d.appendChild(z)},i*400)})}
    function wake(){if(asleep){asleep=false;var zs=$$(".hey.zz");zs.forEach(function(z){var d=z.parentNode;z.remove();var h=document.createElement("span");h.className="hey";h.textContent=["oh!","huh?","i'm up","!!"][Math.floor(Math.random()*4)];d.appendChild(h);setTimeout(function(){h.remove()},2400)});
        if(zs.length)found("sleep")}
      clearTimeout(idle);idle=setTimeout(sleep,T)}
    ["pointermove","keydown","scroll","touchstart","wheel"].forEach(function(t){window.addEventListener(t,wake,{passive:true})});wake()})();

  /* ============ 24. copy a doodle, paste it into Figma as real vectors ============ */
  (function(){if(!fine)return;var hov=null;
    document.addEventListener("pointerover",function(e){var d=e.target.closest&&e.target.closest(".doo");hov=d||null},{passive:true});
    function svgOf(d){var live=$("svg.dd",d);if(!live)return null;var sv=live.cloneNode(true),vb=live.getAttribute("viewBox")||"0 0 100 100",v=vb.split(/\s+/).map(Number);
      var lu=$$("use",live);
      $$("use",sv).forEach(function(u,i){var id=(u.getAttribute("href")||u.getAttribute("xlink:href")||"").replace(/^#/,""),sym=document.getElementById(id);if(!sym)return;
        var sv2=(sym.getAttribute("viewBox")||"0 0 1 1").split(/\s+/).map(Number),x=+u.getAttribute("x")||0,y=+u.getAttribute("y")||0,w=+u.getAttribute("width")||sv2[2],h=+u.getAttribute("height")||sv2[3];
        var g=document.createElementNS("http://www.w3.org/2000/svg","g"),fill=lu[i]?getComputedStyle(lu[i]).fill:"#131316";
        g.setAttribute("transform","translate("+x+" "+y+") scale("+(w/sv2[2])+" "+(h/sv2[3])+") translate("+(-sv2[0])+" "+(-sv2[1])+")");
        g.setAttribute("fill",fill&&fill!=="none"?fill:"#131316");g.innerHTML=sym.innerHTML;u.parentNode.replaceChild(g,u)});
      $$("[class]",sv).forEach(function(n){n.removeAttribute("class")});$$("[style]",sv).forEach(function(n){n.removeAttribute("style")});
      $$("animate,animateTransform,animateMotion,set",sv).forEach(function(n){n.remove()});
      sv.removeAttribute("class");sv.removeAttribute("style");sv.removeAttribute("aria-hidden");
      sv.setAttribute("xmlns","http://www.w3.org/2000/svg");sv.setAttribute("width",Math.round(v[2]/4));sv.setAttribute("height",Math.round(v[3]/4));
      return '<?xml version="1.0" encoding="UTF-8"?>\n'+sv.outerHTML}
    function toast(msg){toastEl.textContent=msg;toastEl.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(function(){toastEl.classList.remove("on")},2600)}
    document.addEventListener("keydown",function(e){if(!(e.metaKey||e.ctrlKey)||e.key.toLowerCase()!=="c"||typing(e))return;
      var s=getSelection();if(s&&!s.isCollapsed&&s.toString().trim())return;
      var d=$(".doo.sel")||hov;if(!d||!d.offsetParent)return;var svg=svgOf(d);if(!svg)return;e.preventDefault();
      var done=function(){toast("Copied as SVG. Paste it into Figma, it's real vectors.");found("svg")};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(svg).then(done,function(){toast("Your browser blocked the clipboard. Try again.")});});
    window.hgDoodleSVG=function(el){return svgOf(el||$(".doo"))}})();

  /* ============ 26. present mode: any case study becomes a deck ============ */
  function projOf(){var m=(HASH()||"").match(/^#\/work\/([^\/?]+)/);if(!m||typeof P==="undefined")return null;for(var i=0;i<P.length;i++)if(P[i].id===m[1])return P[i];return null}
  var pz=(function(){var el=document.createElement("div");el.className="pz";el.setAttribute("role","dialog");el.setAttribute("aria-label","Presentation");
    el.innerHTML='<div class="pz-stage"><span class="pz-hint">← → to move · Esc to leave</span></div><div class="pz-bar"><button type="button" data-a="prev" aria-label="Previous slide">←</button><span class="ct"></span><button type="button" data-a="next" aria-label="Next slide">→</button><span class="tr"><i></i></span><button type="button" class="x" data-a="x">Done</button></div>';
    document.body.appendChild(el);var stage=$(".pz-stage",el),list=[],i=0,open=false,fs=false,tx=null;
    function clean(n){$$("[id]",n).forEach(function(x){x.removeAttribute("id")});n.removeAttribute&&n.removeAttribute("id");$$(".rv,.nz",n).forEach(function(x){x.classList.add("in")});return n}
    function build(){var p=projOf();list=[];if(!p)return;var body=$("#caseBody");
      var t=document.createElement("div");t.className="pz-title";t.innerHTML='<span class="k">'+esc(p.t)+'</span><h1>'+esc(p.n)+'</h1><p>'+esc(String(p.g).replace(/<[^>]+>/g,""))+'</p><p class="by">Aditya</p>';list.push(t);
      var secs=$$(".cs-sec",body);
      if(secs.length){secs.forEach(function(s){list.push(clean(s.cloneNode(true)))});var cta=$(".cs-cta",body);if(cta)list.push(clean(cta.cloneNode(true)))}
      else{$$(".step",body).forEach(function(s){list.push(clean(s.cloneNode(true)))})}
      var end=document.createElement("div");end.className="pz-title";end.innerHTML='<span class="k">Thanks</span><h1>Questions?</h1><p>adi.workspace76865@gmail.com</p>';list.push(end);
      el.style.setProperty("--pz",p.s)}
    function fit(s){var inn=s.firstChild;inn.style.transform="";var H=stage.clientHeight-40,h=inn.scrollHeight;if(h>H){var k=Math.max(.62,H/h);inn.style.transform="scale("+k+")";inn.style.marginBottom=(-(1-k)*h)+"px"}}
    function show(k,dir){if(!list.length)return;i=Math.max(0,Math.min(list.length-1,k));var old=$(".pz-s",stage);if(old)old.remove();
      var s=document.createElement("div");s.className="pz-s"+(dir<0?" back":"");var inn=document.createElement("div");inn.className="pz-in";inn.appendChild(list[i]);s.appendChild(inn);stage.appendChild(s);
      $(".ct",el).textContent=(i+1)+" / "+list.length;$(".tr i",el).style.width=((i+1)/list.length*100)+"%";requestAnimationFrame(function(){fit(s)})}
    function start(){build();if(!list.length)return;open=true;el.classList.add("on");document.body.classList.add("presenting");document.documentElement.style.overflow="hidden";show(0,1);found("present");
      var de=document.documentElement;if(de.requestFullscreen&&fine){de.requestFullscreen().then(function(){fs=true},function(){})}}
    function stop(){if(!open)return;open=false;el.classList.remove("on");document.body.classList.remove("presenting");document.documentElement.style.overflow="";stage.innerHTML='<span class="pz-hint">← → to move · Esc to leave</span>';
      if(fs&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){});fs=false}
    document.addEventListener("fullscreenchange",function(){if(!document.fullscreenElement&&fs){fs=false;stop()}});
    $(".pz-bar",el).addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var a=b.dataset.a;if(a==="prev")show(i-1,-1);else if(a==="next")show(i+1,1);else stop()});
    document.addEventListener("keydown",function(e){
      if(open){e.stopPropagation();var k=e.key;
        if(k==="ArrowRight"||k===" "||k==="PageDown"||k==="Enter"){e.preventDefault();show(i+1,1)}
        else if(k==="ArrowLeft"||k==="PageUp"){e.preventDefault();show(i-1,-1)}
        else if(k==="Home"){show(0,-1)}else if(k==="End"){show(list.length-1,1)}
        else if(k==="Escape"){e.preventDefault();stop()}return}
      if(e.key.toLowerCase()==="p"&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!typing(e)&&projOf()&&document.getElementById("v-case").classList.contains("on")){e.preventDefault();start()}},true);
    el.addEventListener("touchstart",function(e){tx=e.touches[0].clientX},{passive:true});
    el.addEventListener("touchend",function(e){if(tx===null)return;var dx=e.changedTouches[0].clientX-tx;tx=null;if(Math.abs(dx)>50)show(i+(dx<0?1:-1),dx<0?1:-1)},{passive:true});
    window.addEventListener("resize",function(){var s=$(".pz-s",stage);if(open&&s)fit(s)});
    function addBtn(){var h=$("#caseHead");if(!h||!projOf()||$(".pz-btn",h))return;var b=document.createElement("button");b.type="button";b.className="pz-btn";
      b.innerHTML='Present this'+(fine?' <kbd>P</kbd>':'');b.addEventListener("click",start);var t=$("h1.big",h);if(t&&t.nextSibling)h.insertBefore(b,t.nextSibling);else h.appendChild(b)}
    var ch=$("#caseHead");if(ch&&"MutationObserver" in window)new MutationObserver(function(){setTimeout(addBtn,0)}).observe(ch,{childList:true});addBtn();
    return {start:start}})();

})();

window.__ok=true;
/* =================== ROUND 20: Parchi =================== */
/* Every Parchi screen and demo here is rebuilt from the real Compose source (github.com/adityaraj-dev/portfolio):
   HomeScreen.kt (HomeTopBar, Receipts2ColumnGridContent, SwipeableReceiptGridCard, DailySalesTabContent,
   JupiterBulgeNavigationBar), ReceiptScreen.kt, ThermalPrinterSlot.kt, MinimalThermalReceiptContent.kt,
   ReceiptBottomBar.kt, RippleRecordButton.kt, OnboardingScreen.kt, AppLogo.kt, LucideIcons.kt, theme/Color.kt,
   parser/VoiceBillParser.kt. Frame is 390x844 with dp = px. Store name is the app's prefs default. */
var PCC={bg:"#FAF7FC",prim:"#E7BBFF",sup:"#A500FF",dark:"#3B0066",deep:"#1F0038",light:"#F7ECFF",cont:"#F0D6FF",surf:"#FBF8FE",paper:"#FFFDF9",ink:"#0F172A",mut:"#64748B",lgt:"#94A3B8",bd:"#E2E8F0"};
var PC_STORE="Manmohani Hatti";
/* LucideIcons.kt, path data verbatim */
var PC_ICO={mic:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3",pause:"M6 4h4v16H6z M14 4h4v16h-4z",
  receipt:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z M16 8H8 M16 12H8 M13 16H8",trend:"M22 7l-8.5 8.5-5-5L1 18 M16 7h6v6",
  search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",store:"M2 22h20 M20 7l-2-5H6L4 7 M4 7v13 M20 7v13 M9 22v-6h6v6",back:"M19 12H5 M12 19l-7-7 7-7",
  edit:"M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",print:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 9V3h12v6 M6 14h12v8H6z",
  share:"M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.59 13.51l6.83 3.98 M15.41 6.51l-6.82 3.98",
  close:"M18 6L6 18 M6 6l12 12",check:"M20 6L9 17l-5-5"};
/* AppLogo.kt: the receipt glyph, #E7BBFF fill + #A500FF 1.5 stroke */
var PC_LOGO_F="M4 2.99674C4 2.73153 4.10536 2.47717 4.29289 2.28964C4.48043 2.1021 4.73478 1.99674 5 1.99674C5.24762 1.99538 5.49048 2.06477 5.7 2.19674L6.633 2.79674C6.84204 2.93032 7.08493 3.0013 7.333 3.0013C7.58107 3.0013 7.82396 2.93032 8.033 2.79674L8.967 2.19674C9.17604 2.06317 9.41893 1.99219 9.667 1.99219C9.91507 1.99219 10.158 2.06317 10.367 2.19674L11.3 2.79674C11.509 2.93032 11.7519 3.0013 12 3.0013C12.2481 3.0013 12.491 2.93032 12.7 2.79674L13.633 2.19674C13.842 2.06317 14.0849 1.99219 14.333 1.99219C14.5811 1.99219 14.824 2.06317 15.033 2.19674L15.967 2.79674C16.176 2.93032 16.4189 3.0013 16.667 3.0013C16.9151 3.0013 17.158 2.93032 17.367 2.79674L18.3 2.19674C18.5095 2.06477 18.7524 1.99538 19 1.99674C19.2652 1.99674 19.5196 2.1021 19.7071 2.28964C19.8946 2.47717 20 2.73153 20 2.99674V20.9967C20 21.262 19.8946 21.5163 19.7071 21.7038C19.5196 21.8914 19.2652 21.9967 19 21.9967C18.7524 21.9981 18.5095 21.9287 18.3 21.7967L17.367 21.1967C17.158 21.0632 16.9151 20.9922 16.667 20.9922C16.4189 20.9922 16.176 21.0632 15.967 21.1967L15.033 21.7967C14.824 21.9303 14.5811 22.0013 14.333 22.0013C14.0849 22.0013 9.17604 21.9303 8.967 21.7967L8.033 21.1967C7.82396 21.0632 7.58107 20.9922 7.333 20.9922C7.08493 20.9922 6.84204 21.0632 6.633 21.1967L5.7 21.7967C5.49048 21.9287 5.24762 21.9981 5 21.9967C4.73478 21.9967 4.48043 21.8914 4.29289 21.7038C4.10536 21.5163 4 21.262 4 20.9967V2.99674Z",
    PC_LOGO_S="M13 16H8M14 8H8M16 12H8";
function svgURI(s){return "data:image/svg+xml;utf8,"+encodeURIComponent(s)}
function pcEsc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function pcRs(v){return (v%1===0?v:v.toFixed(2))+""}

/* ---- the offline parser, ported from VoiceBillParser.kt (subset of PHONETIC_KIRANA_MAP, same fraction + number rules,
   same clause splitting, same single-clause order: price-lead, explicit price, trailing bare price, unit, count, fallback) ---- */
var PC_MAP={aata:"Atta",ata:"Atta",atta:"Atta",aa:"Atta",tama:"Rajma",ragma:"Rajma",rajma:"Rajma",razma:"Rajma",ida:"Maida",maida:"Maida",meda:"Maida",
  sugar:"Sugar",cheeni:"Sugar",chini:"Sugar",shakar:"Sugar",sakkar:"Sugar",sooji:"Suji",suji:"Suji",rawa:"Suji",rava:"Suji",besan:"Besan",baisan:"Besan",
  chawal:"Rice",rice:"Rice",basmati:"Basmati Rice",poha:"Poha","moong dal":"Moong Dal","mung dal":"Moong Dal","toor dal":"Toor Dal","arhar dal":"Arhar Dal",
  "chana dal":"Chana Dal","urad dal":"Urad Dal","masoor dal":"Masoor Dal",daal:"Dal",dal:"Dal","sarson tel":"Mustard Oil","sarso tel":"Mustard Oil",
  "mustard oil":"Mustard Oil",sarson:"Mustard Oil",sarso:"Mustard Oil","refine oil":"Refined Oil","refined oil":"Refined Oil",refine:"Refined Oil",tel:"Oil",oil:"Oil",
  ghee:"Ghee","desi ghee":"Desi Ghee",namak:"Salt",salt:"Salt","tata namak":"Tata Salt",haldi:"Haldi",turmeric:"Haldi",mirch:"Mirch Powder",mirchi:"Mirch Powder",
  chilli:"Chilli Powder",dhaniya:"Dhaniya Powder",jeera:"Jeera",zeera:"Jeera","garam masala":"Garam Masala",masala:"Masala",sabun:"Soap",soap:"Soap",
  lux:"Lux Soap",surf:"Surf Excel","surf excel":"Surf Excel",vim:"Vim","vim bar":"Vim Bar",doodh:"Milk",milk:"Milk",dahi:"Curd",curd:"Curd",paneer:"Paneer",
  butter:"Butter",makhan:"Butter",chai:"Tea","chai patti":"Tea",tea:"Tea","red label":"Red Label Tea","tata tea":"Tata Tea",biscuit:"Biscuits",biscuits:"Biscuits",
  "parle g":"Parle-G","good day":"Good Day Biscuit",rusk:"Rusk",bread:"Bread",ande:"Eggs",eggs:"Eggs",egg:"Eggs",maggi:"Maggi"};
var PC_UNIT="(\\d+(?:\\.\\d+)?)\\s*(kg|kgs|kilo|kilos|kilogram|kilograms|gm|gms|gram|grams|g|litre|litres|liter|liters|lt|l|ml|packet|packets|pkt|pkts|pouch|pouches|pudhiya|piece|pieces|pc|pcs|nag|dane|dozen|dozens|darjan|bottle|bottles|botal|box|boxes|dabba|dibba|tin|tins|can|cans|bori|katta|bag|bags)\\b";
var PC_FILL={okay:1,ok:1,hmm:1,umm:1,wait:1,achha:1,acha:1,haan:1,bhaiya:1,bhai:1,suno:1,bas:1};
function pcStd(u){u=u.toLowerCase();return /^(kg|kgs|kilo|kilos|kilogram|kilograms)$/.test(u)?"kg":/^(gm|gms|gram|grams|g)$/.test(u)?"g":/^(litre|litres|liter|liters|lt|l)$/.test(u)?"L":
  u==="ml"?"ml":/^(packet|packets|pkt|pkts|pouch|pouches|pudhiya)$/.test(u)?"pkts":/^(piece|pieces|pc|pcs|nag|dane)$/.test(u)?"pcs":/^(dozen|dozens|darjan)$/.test(u)?"dozen":
  /^(bottle|bottles|botal)$/.test(u)?"bottles":/^(box|boxes|dabba|dibba)$/.test(u)?"boxes":/^(tin|tins|can|cans)$/.test(u)?"tins":/^(bori|katta|bag|bags)$/.test(u)?"bags":u}
function pcNorm(s){
  s=s.replace(/\b(?:half|aadha|adha)\s*(?:kg|kilo)\b/gi,"500 g").replace(/\b(?:half|aadha|adha)\s*(?:litre|liter|l)\b/gi,"500 ml")
   .replace(/\b(?:quarter|paav|pao|paw)\s*(?:kg|kilo)?\b/gi,"250 g").replace(/\b(?:one\s+and\s+a\s+half|dedh|derh)\s*(?:kg|kilo)\b/gi,"1.5 kg")
   .replace(/\b(?:one\s+and\s+a\s+half|dedh|derh)\s*(?:litre|liter|l)\b/gi,"1.5 L").replace(/\b(?:two\s+and\s+a\s+half|dhai)\s*(?:kg|kilo)\b/gi,"2.5 kg")
   .replace(/\b(?:dhai\s+sau|dhaisau)\s*(?:gram|gm|g)?\b/gi,"250 g").replace(/\b(?:saadhe\s+teen|sadhe\s+teen)\s*kg\b/gi,"3.5 kg")
   .replace(/\btwenty[\s\-]five\b/gi,"25").replace(/\btwenty[\s\-]two\b/gi,"22").replace(/\bthirty[\s\-]five\b/gi,"35");
  [["one",1],["ek",1],["two",2],["do",2],["three",3],["teen",3],["four",4],["chaar",4],["char",4],["five",5],["paanch",5],["panch",5],["six",6],["chhe",6],["che",6],
   ["seven",7],["saat",7],["eight",8],["aath",8],["nine",9],["nau",9],["ten",10],["das",10],["eleven",11],["gyarah",11],["twelve",12],["barah",12],["twenty",20],["bees",20],
   ["pachees",25],["thirty",30],["tees",30],["fifty",50],["pachaas",50],["hundred",100],["sau",100]].forEach(function(p){
    s=s.replace(new RegExp("\\b"+p[0]+"\\b(?=\\s+[a-zA-Z\\u20B9])","gi"),p[1])});
  return s}
function pcClean(raw){
  var c=raw.replace(/\b(of|ka|ki|ke|walay|wala|wali|wale|item|chahiye|de\s+do|dena|aur|and|core|piece|pieces|pc|pcs|second|seconds|minute|minutes|wait|ruko)\b/gi," ")
    .replace(/[^\w\s\-]/g," ").replace(/\s+/g," ").trim();
  if(!c)return "";var lc=c.toLowerCase();if(PC_MAP[lc])return PC_MAP[lc];
  var w=c.split(" ").filter(function(x){return !PC_FILL[x.toLowerCase()]});if(!w.length)return "";
  if(w.length===1&&PC_MAP[w[0].toLowerCase()])return PC_MAP[w[0].toLowerCase()];
  return w.map(function(x){var l=x.toLowerCase();return PC_MAP[l]||(/[a-z]/i.test(x)?l.charAt(0).toUpperCase()+l.slice(1):x)}).join(" ")}
function pcSeg(cl){
  cl=cl.trim();var um=[],re=new RegExp("(?:^|\\b)"+PC_UNIT,"gi"),m;while((m=re.exec(cl)))um.push(m);
  if(um.length<=1){var cm=[],cr=/(?:^|\s+)(\d+)\s+([a-zA-Z]+)/gi;while((m=cr.exec(cl)))cm.push(m);
    if(cm.length>1&&!um.length)return cm.map(function(x,i){return cl.slice(x.index,i+1<cm.length?cm[i+1].index:cl.length).trim()}).filter(Boolean);
    return [cl]}
  if(!/[a-z]/i.test(cl.slice(0,um[0].index)))return um.map(function(x,i){return cl.slice(x.index,i+1<um.length?um[i+1].index:cl.length).trim()}).filter(Boolean);
  var out=[],st=0;um.forEach(function(x){var end=x.index+x[0].length,rest=cl.slice(end),pm=/^\s*(\d+(?:\.\d+)?)\s*(?:rupaye|rupees|rs)?(?:\s+|$)/i.exec(rest);
    if(pm)end+=pm[0].length;var sub=cl.slice(st,end).trim();if(sub)out.push(sub);st=end});
  if(st<cl.length&&cl.slice(st).trim())out.push(cl.slice(st).trim());return out}
function pcItem(t){
  t=t.trim().replace(/^(?:okay|ok|wait|achha|acha|theek\s+hai|haan|hmm+|umm+|ek\s+second|bhaiya|suno)\s+/i,"").replace(/\s+(?:okay|ok|bas|ho\s+gaya|done|khatam|aur|and)$/i,"").trim();
  if(!t||PC_FILL[t.toLowerCase()])return null;
  var lead=/^(\d+(?:\.\d+)?)\s*(?:rupaye|rupee|rupees|rs|inr|₹)\s*(?:ka|ki|ke|wala|wali|wale)\s+(.+)$/i.exec(t);
  if(lead){var ln=pcClean(lead[2]);if(ln)return {n:ln,q:"1 item",p:+lead[1]}}
  var price=null,ex=/(?:(?:rs\.?|rupees|rupaye|inr|₹|price|rate|bhav)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:rs\.?|rupees|rupaye|inr|₹|ka|ki|\/-))\s*$/i.exec(t);
  if(ex){price=+(ex[1]||ex[2]);t=(t.slice(0,ex.index)+t.slice(ex.index+ex[0].length)).trim()}
  else{var tb=/\s+(\d+(?:\.\d+)?)\s*$/.exec(t);if(tb&&/[a-z]/i.test(t.slice(0,tb.index))){price=+tb[1];t=t.slice(0,tb.index).trim()}}
  var q="",n="",u=new RegExp("(?:^|\\b)"+PC_UNIT,"i").exec(t);
  if(u){q=u[1]+" "+pcStd(u[2]);n=pcClean((t.slice(0,u.index)+" "+t.slice(u.index+u[0].length)).trim())}
  else{var lc=/^(\d+)\s+([a-zA-Z\s\-]+)/.exec(t),tc=/^([a-zA-Z\s\-]+?)\s+(\d+)\s*(?:piece|pieces|pc|pcs|nag|dane)?$/i.exec(t);
    if(lc&&pcClean(lc[2])){q=lc[1]+" pcs";n=pcClean(lc[2])}else if(!lc&&tc&&pcClean(tc[1])){q=tc[2]+" pcs";n=pcClean(tc[1])}
    if(!n){n=pcClean(t);q="1 item"}}
  return n?{n:n,q:q||"1 item",p:price}:null}
function pcParse(tr){
  var s=pcNorm((tr||"").trim()).replace(/\b(?:bas\s+itna\s+hi|itna\s+hi|bas|ho\s+gaya|done|khatam|aur|and)\s*$/i,"").trim();if(!s)return [];
  var out=[];s.split(/,\s*|\n+|\s+and\s+|\s+aur\s+|\s+plus\s+|\s+then\s+|\s+phir\s+|\s+bhi\s+/i).map(function(x){return x.trim()}).filter(Boolean).forEach(function(c){
    pcSeg(c).forEach(function(x){var it=pcItem(x),l=out[out.length-1];if(it&&!(l&&l.n.toLowerCase()===it.n.toLowerCase()&&l.q===it.q))out.push(it)})});
  if(!out.length){var c=pcClean(s);if(c)out.push({n:c,q:"1 item",p:null})}
  return out}
function pcSum(items){return items.reduce(function(a,b){return a+(b.p||0)},0)}

/* sample data: one spoken sentence, and the bills it sits among */
var PC_SPEECH_PARTS=["10 kg atta 356","5 kg cheeni 280","2 kg moong dal","1 litre sarson tel 145"],PC_SPEECH=PC_SPEECH_PARTS.join(" ");
var PC_ITEMS=pcParse(PC_SPEECH);
var PC_BILLS=[
  {n:"4821",d:"27 Sep 2026",t:"06:42 PM",c:"Ramesh",i:PC_ITEMS.length,a:pcSum(PC_ITEMS),it:"atta sugar moong dal mustard oil"},
  {n:"3907",d:"27 Sep 2026",t:"05:15 PM",c:"",i:2,a:150,it:"parle-g maggi"},
  {n:"1186",d:"27 Sep 2026",t:"12:08 PM",c:"Sunita",i:5,a:1240,it:"basmati rice toor dal desi ghee jeera haldi"},
  {n:"0452",d:"27 Sep 2026",t:"10:31 AM",c:"",i:3,a:385,it:"milk curd bread"},
  {n:"7730",d:"26 Sep 2026",t:"08:20 PM",c:"Pooja",i:6,a:1432,it:"atta besan suji mustard oil tata salt tea"},
  {n:"2214",d:"26 Sep 2026",t:"07:02 PM",c:"",i:2,a:96,it:"eggs bread"},
  {n:"5069",d:"26 Sep 2026",t:"11:47 AM",c:"Arjun",i:3,a:420,it:"rice chana dal sugar"}];

/* ---- SVG primitives ---- */
var PC_FM="ui-monospace,SFMono-Regular,Menlo,Consolas,Liberation Mono,DejaVu Sans Mono,monospace",PC_FS="Roboto,system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif";
function pcR(x,y,w,h,rx,f,st,sw,ex){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(rx||0)+'" fill="'+f+'"'+(st?' stroke="'+st+'" stroke-width="'+(sw||1)+'"':'')+(ex||'')+'/>'}
function pcT(x,y,sz,f,txt,o){o=o||{};return '<text x="'+x+'" y="'+y+'" font-size="'+sz+'" fill="'+f+'"'+(o.a?' text-anchor="'+o.a+'"':'')+' font-weight="'+(o.w||400)+'" font-family="'+(o.m?PC_FM:PC_FS)+'"'+(o.ls?' letter-spacing="'+o.ls+'"':'')+'>'+pcEsc(txt)+'</text>'}
function pcI(k,x,y,s,c,sw){return '<path transform="translate('+x+' '+y+') scale('+(s/24)+')" d="'+PC_ICO[k]+'" fill="none" stroke="'+c+'" stroke-width="'+(sw||2)+'" stroke-linecap="round" stroke-linejoin="round"/>'}
function pcLogo(x,y,s){return '<g transform="translate('+x+' '+y+') scale('+(s/24)+')"><path d="'+PC_LOGO_F+'" fill="#E7BBFF"/><path d="'+PC_LOGO_S+'" fill="none" stroke="#A500FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>'}
var PC_DEFS='<defs><filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity=".08"/></filter>'+
  '<filter id="shp" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#A500FF" flood-opacity=".22"/></filter>'+
  '<filter id="shk" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity=".2"/></filter>'+
  '<linearGradient id="fab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A500FF"/><stop offset="1" stop-color="#8800D6"/></linearGradient>'+
  '<linearGradient id="slot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22242A"/><stop offset=".5" stop-color="#15161A"/><stop offset="1" stop-color="#0B0C0E"/></linearGradient>'+
  '<clipPath id="cc"><rect x="0" y="98" width="390" height="638"/></clipPath></defs>';
function pcStatus(){var c=PCC.ink;return pcT(26,22,13,c,"6:42",{w:600})+'<path d="M334 21 l9 -10 v10 z" fill="'+c+'"/>'+pcR(349.5,11.5,19,10,2.5,"none",c,1.2)+pcR(351.5,13.5,12,6,1,c)+pcR(369.5,14.5,1.6,4,.6,c)}

/* HomeTopBar: logo 28, store name 19sp Black mono uppercase, 42dp search toggle + 42dp store button, 14dp corners */
function pcHomeTop(){return pcLogo(18,51,28)+pcT(56,72,19,PCC.ink,PC_STORE.toUpperCase(),{w:900,m:1,ls:1.1})+
  pcR(280,44,42,42,14,"#fff",PCC.bd,1.2,' filter="url(#sh)"')+pcI("search",291,55,20,PCC.ink)+
  pcR(330,44,42,42,14,"#fff",PCC.bd,1.2,' filter="url(#sh)"')+pcI("store",341,55,20,PCC.sup)}
/* SwipeableReceiptGridCard: 130dp tall, 18dp corners, 12dp padding, SpaceBetween column */
function pcCard(b,x,y){var s=pcR(x,y,174,130,18,"#fff",PCC.bd,1.2,' filter="url(#sh)"')+pcT(x+12,y+26,13,PCC.ink,"#"+b.n,{w:900,m:1})+pcT(x+162,y+25,10,PCC.lgt,b.t,{a:"end",m:1});
  s+=b.c?pcT(x+12,y+60,12,PCC.dark,b.c,{w:700})+pcT(x+12,y+76,11,PCC.mut,b.i+" items"):pcT(x+12,y+68,11,PCC.mut,b.i+" items");
  return s+pcT(x+12,y+113,16,PCC.ink,"₹"+b.a,{w:900,m:1})}
function pcGrid(y){var s="",g={},order=[];PC_BILLS.forEach(function(b){if(!g[b.d]){g[b.d]=[];order.push(b.d)}g[b.d].push(b)});
  order.forEach(function(d){s+=pcT(16,y+22,12,PCC.mut,d,{w:700,m:1})+pcT(16+d.length*7.2+6,y+22,12,PCC.lgt,"•  "+g[d].length+" Bills",{w:500,m:1});y+=40;
    for(var i=0;i<g[d].length;i+=2){s+=pcCard(g[d][i],16,y);if(g[d][i+1])s+=pcCard(g[d][i+1],200,y);y+=140}});
  return s}
/* JupiterBulgeNavigationBar: 68dp white pill, tabs 48dp, 72dp gap, 64dp mic FAB raised 18dp with a 72dp halo */
function pcNav(tab){var a=tab!=="sales",s=pcR(20,750,350,68,34,"#fff","#F1F5F9",1.5,' filter="url(#shp)"');
  s+=(a?pcR(32,760,127,48,24,PCC.cont):"")+pcI("receipt",48,774,20,a?PCC.sup:PCC.mut)+pcT(76,789,14,a?PCC.dark:PCC.mut,"Receipts",{w:a?800:500});
  s+=(!a?pcR(231,760,127,48,24,PCC.cont):"")+pcI("trend",238,774,20,!a?PCC.sup:PCC.mut)+pcT(266,789,14,!a?PCC.dark:PCC.mut,"Daily Sales",{w:!a?800:500});
  return s+'<circle cx="195" cy="764" r="36" fill="#A500FF" fill-opacity=".15"/><circle cx="195" cy="764" r="31" fill="url(#fab)" stroke="#E7BBFF" stroke-width="2" filter="url(#shp)"/>'+pcI("mic",180,749,30,"#fff")}
/* ReceiptScreen top bar: 38dp back button, 22dp logo + PARCHI RECEIPT */
function pcRcTop(){return pcR(16,40,38,38,12,"#fff",PCC.bd,1,' filter="url(#sh)"')+pcI("back",26,50,18,PCC.ink)+pcLogo(123,48,22)+pcT(153,63,12,PCC.ink,"PARCHI RECEIPT",{w:700,m:1,ls:1})}
/* ThermalPrinterDispenser (94% slot, 34dp, near black) + 90% paper + MinimalThermalReceiptContent + 26-tooth tear strip */
function pcDash(y){return '<line x1="48.3" y1="'+y+'" x2="341.7" y2="'+y+'" stroke="#D4D4D8" stroke-width="1.2" stroke-dasharray="4 2"/>'}
function pcPaper(o){o=o||{};var it=o.items||[],x0=48.3,x1=341.7,cx=195,y=136,b="";
  b+=pcT(cx,y+14,14,"#18181B",PC_STORE.toUpperCase(),{a:"middle",w:900,m:1,ls:1.2});y+=22;
  b+=pcT(cx,y+12,11,"#27272A","27 SEP 2026 • 06:42 PM",{a:"middle",w:600,m:1,ls:.8});y+=15;
  if(o.cust){y+=8;b+=pcT(x0,y+12,11,"#18181B","Customer: "+o.cust,{w:700,m:1});y+=15}
  y+=12;b+=pcDash(y+7);y+=20;
  b+=pcT(x0,y+12,11,"#71717A","#",{w:700,m:1})+pcT(70.3,y+12,11,"#71717A","ITEM",{w:700,m:1})+pcT(234.8,y+12,11,"#71717A","QTY",{a:"middle",w:700,m:1})+pcT(x1,y+12,11,"#71717A","PRICE",{a:"end",w:700,m:1});y+=19;
  if(o.proc){y+=32;b+='<circle cx="'+cx+'" cy="'+(y+13)+'" r="11.75" fill="none" stroke="#18181B" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="52 30"/>';y+=38;
    b+=pcT(cx,y+13,12,"#18181B","CREATING RECEIPT...",{a:"middle",w:700,m:1,ls:1});y+=20;b+=pcT(cx,y+10,10,"#71717A","Structuring items & quantities...",{a:"middle",m:1});y+=46}
  else if(!it.length){y+=28;b+=pcT(cx,y+13,12,"#A1A1AA","READY FOR DICTATION",{a:"middle",w:700,m:1});y+=20;b+=pcT(cx,y+11,11,"#71717A","Speak items: e.g. Aata 10 kg, two brush",{a:"middle",m:1});y+=43}
  else it.forEach(function(r,i){if(i)y+=4;y+=4;var nm=r.n.length>14?r.n.slice(0,13)+"…":r.n;
    b+=pcT(x0,y+14,12,"#71717A",i+1,{m:1})+pcT(70.3,y+14,13,"#18181B",nm,{w:700,m:1})+pcT(234.8,y+14,12,"#27272A",r.q,{a:"middle",m:1})+(r.p!=null?pcT(x1,y+14,13,"#18181B","₹"+pcRs(r.p),{a:"end",w:700,m:1}):"");y+=22});
  y+=10;b+=pcDash(y+7);y+=22;var tot=pcSum(it);
  b+=pcT(x0,y+18,14,"#18181B","TOTAL",{w:800,m:1,ls:1})+pcT(x1,y+19,18,"#18181B",tot>0?"₹ "+pcRs(tot):"₹ _______",{a:"end",w:900,m:1});y+=38;
  var d="M"+x0+" "+y,tw=(x1-x0)/26;for(var k=0;k<26;k++)d+=" L"+(x0+tw*k+tw/2).toFixed(2)+" "+(y+12)+" L"+(x0+tw*(k+1)).toFixed(2)+" "+y;b+='<path d="'+d+' Z" fill="#F1F0EC"/>';y+=24;
  return pcR(23,94,344,34,16,"url(#slot)","#3B3E48",1.5,' filter="url(#shk)"')+pcR(43.6,106,302.8,10,5,"#050507","#27272A",1)+
    pcR(30.3,118,329.4,y-118,0,PCC.paper,"",0,' filter="url(#shk)"')+b}
/* RippleRecordButton: 68dp, #A500FF to #8800D6, 2dp lavender border (3dp listening), 4dp drop shadow; a still frame of the ripples */
function pcRec(listen,txt){var cy=(listen||txt)?749:771,s="";
  if(listen)s+='<circle cx="195" cy="'+cy+'" r="70" fill="#A500FF" fill-opacity=".07" stroke="#E7BBFF" stroke-opacity=".3" stroke-width="1.8"/><circle cx="195" cy="'+cy+'" r="50" fill="#A500FF" fill-opacity=".16" stroke="#E7BBFF" stroke-opacity=".55" stroke-width="2"/>';
  s+='<circle cx="195" cy="'+(cy+4)+'" r="34" fill="#000" fill-opacity=".2"/><circle cx="195" cy="'+cy+'" r="'+(listen?33.5:33)+'" fill="url(#fab)" stroke="#E7BBFF" stroke-width="'+(listen?3:2)+'"/>'+pcI(listen?"pause":"mic",180,cy-15,30,"#fff");
  if(txt)s+=pcT(195,cy+63,11.5,PCC.mut,txt,{a:"middle",w:700,ls:.6});return s}
/* ReceiptBottomBar, finished: EDIT / PRINT / SHARE pills, weights 1 / 1 / 1.1, 48dp, 16dp corners */
function pcPills(){var P=[["edit","EDIT",16,110.3,PCC.light,"rgba(165,0,255,.3)","#A500FF"],["print","PRINT",134.3,110.3,PCC.cont,"rgba(165,0,255,.3)","#A500FF"],["share","SHARE",252.6,121.4,"#D1FAE5","rgba(5,150,105,.5)","#059669"]];
  return P.map(function(p){var w=16+6+p[1].length*7.4,x=p[2]+(p[3]-w)/2;return pcR(p[2],772,p[3],48,16,p[4],p[5],1.2,' filter="url(#sh)"')+pcI(p[0],x,788,16,p[6])+pcT(x+22,801,11.5,p[6],p[1],{w:700,m:1})}).join("")}
/* DailySalesTabContent */
function pcDaily(){var tot=PC_BILLS.reduce(function(a,b){return a+b.a},0),n=PC_BILLS.reduce(function(a,b){return a+b.i},0),s="";
  s+=pcR(18,106,354,166,22,PCC.light,PCC.cont,1.2,' filter="url(#sh)"')+pcT(36,137,11,PCC.deep,"TOTAL STORE REVENUE",{w:700,m:1})+pcI("trend",334,122,20,PCC.sup);
  s+=pcT(36,183,28,PCC.ink,"₹ "+tot,{w:900,m:1});
  s+=pcR(36,200,154,54,14,"#fff")+pcT(46,219,9.5,PCC.mut,"BILLS ISSUED",{m:1})+pcT(46,243,16,PCC.ink,PC_BILLS.length,{w:700});
  s+=pcR(200,200,154,54,14,"#fff")+pcT(210,219,9.5,PCC.mut,"TOTAL ITEMS",{m:1})+pcT(210,243,16,PCC.ink,n,{w:700});
  s+=pcT(22,301,11,PCC.mut,"ALL TRANSACTIONS",{w:700,m:1});
  PC_BILLS.forEach(function(b,i){var y=309+i*64;s+=pcR(18,y,354,56,14,"#fff",PCC.bd,1,' filter="url(#sh)"')+pcT(30,y+25,13,PCC.ink,"#"+b.n,{w:700,m:1})+pcT(30,y+43,11,PCC.mut,b.i+" items • "+b.t)+pcT(360,y+33,15,PCC.ink,"₹"+b.a,{a:"end",w:900,m:1})});
  return s}
/* OnboardingScreen: logo badge, then step 0 (three tall feature cards) or step 1 (set up your business) */
function pcBadge(){return pcR(85,64,220,44,20,PCC.surf,PCC.cont,1.2,' filter="url(#sh)"')+pcLogo(101,72,28)+pcT(139,91,14,PCC.deep,"PARCHI  •  पर्ची",{w:900,m:1,ls:1})}
function pcCta(t){return pcR(20,751,350,56,20,PCC.sup,"",0,' filter="url(#shp)"')+pcT(195,784,15,"#fff",t,{a:"middle",w:900,m:1,ls:1})}
function pcFeat(y,ic,bg,ac,sub,tl,ds){var s=pcR(20,y,350,145,22,"#fff",PCC.bd,1.2,' filter="url(#sh)"')+pcR(38,y+18,48,48,16,bg)+pcI(ic,50,y+30,24,ac)+pcT(100,y+29,10,ac,sub,{w:700,m:1});
  tl.forEach(function(l,i){s+=pcT(100,y+49+i*20,15,PCC.ink,l,{w:800})});ds.forEach(function(l,i){s+=pcT(100,y+92+i*17,12,PCC.mut,l)});return s}
function pcOnboard(){var s=pcBadge()+pcT(195,160,24,PCC.ink,"Voice Billing for",{a:"middle",w:900})+pcT(195,192,24,PCC.ink,"Kirana & Retailers",{a:"middle",w:900})+
  pcT(195,218,13,PCC.mut,"Bol kar instant parchi banayein. Simple, fast,",{a:"middle"})+pcT(195,236,13,PCC.mut,"and completely offline.",{a:"middle"});
  s+=pcFeat(264,"mic",PCC.light,PCC.sup,"SMART AUDIO PARSER",["Voice Input & Kirana","Dictation"],["Speak items naturally in Hindi, Hinglish,","or English without pausing. Dictate full","grocery bills in seconds."]);
  s+=pcFeat(423,"receipt",PCC.cont,PCC.sup,"PHONETIC & FRACTION ENGINE",["Smart Items & Price","Extraction"],["Auto-detects items, weights (10 kg, 500 g,","2 pcs), and prices directly from speech","with zero manual entry."]);
  s+=pcFeat(582,"trend","#E8F5E9","#10B981","PRINT & DAILY SALES",["Thermal Receipts &","WhatsApp Share"],["Instant 3D thermal paper receipts. Print","or share directly on WhatsApp with your","shop logo and phone."]);
  return s+pcCta("GET STARTED")}
function pcSetup(){var s=pcBadge()+pcT(195,164,24,PCC.ink,"Set up your business",{a:"middle",w:900})+pcT(195,190,13,PCC.mut,"Enter your shop details to personalize your",{a:"middle"})+pcT(195,208,13,PCC.mut,"bills and receipts.",{a:"middle"});
  function lab(y,t){return pcT(24,y+12,11,PCC.mut,t,{w:700,m:1})}
  s+=lab(230,"SHOP / BUSINESS NAME *")+pcR(20,251,350,56,18,"#fff",PCC.bd,1,' filter="url(#sh)"')+pcI("store",34,267,24,PCC.sup)+pcT(70,284,16,PCC.ink,PC_STORE);
  s+=lab(325,"BUSINESS CATEGORY");["General Store","Dairy & Sweets","Fruits & Vegetables","Bakery & Snacks","Clothing & Retail"].forEach(function(c,i){var y=348+i*56,on=!i;
    s+=pcR(20,y,350,48,16,on?PCC.cont:"#fff",on?PCC.sup:PCC.bd,1.2)+pcT(36,y+29,14,on?PCC.dark:PCC.ink,c,{w:on?800:500})+(on?pcI("check",336,y+15,18,PCC.sup):"")});
  s+=lab(638,"STORE PHONE / WHATSAPP (OPTIONAL)")+pcR(20,659,350,56,18,"#fff",PCC.bd,1,' filter="url(#sh)"')+pcT(36,692,16,PCC.lgt,"e.g. 9876543210");
  return s+pcCta("START BILLING NOW")}
function pcSvg(kind){var b=pcStatus();
  if(kind==="home")b+=pcHomeTop()+'<g clip-path="url(#cc)">'+pcGrid(98)+'</g>'+pcNav("receipts");
  else if(kind==="daily")b+=pcHomeTop()+'<g clip-path="url(#cc)">'+pcDaily()+'</g>'+pcNav("sales");
  else if(kind==="ready")b+=pcRcTop()+pcPaper({})+pcRec(false);
  else if(kind==="listen")b+=pcRcTop()+pcPaper({})+pcRec(true,'Hearing: "10 kg atta 356 5 kg cheeni 280"');
  else if(kind==="receipt")b+=pcRcTop()+pcPaper({items:PC_ITEMS,cust:"Ramesh"})+pcPills();
  else if(kind==="onboarding")b+=pcOnboard();
  else if(kind==="setup")b+=pcSetup();
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844" width="390" height="844">'+PC_DEFS+pcR(0,0,390,844,0,PCC.bg)+b+'</svg>'}
var PC_URI={};
function pcImg(kind,cls,alt){if(!PC_URI[kind])PC_URI[kind]=svgURI(pcSvg(kind));return '<img loading="lazy" draggable="false" class="'+(cls||"")+'" alt="'+pcEsc(alt||kind)+'" src="'+PC_URI[kind]+'">'}

/* ---- wireframes: the same rebuilt screens, drawn plain (no Figma file, no paper sketches exist) ---- */
var PC_WF=[["onboarding","Onboarding"],["home","Home"],["ready","New receipt"],["receipt","Receipt"],["daily","Daily sales"]];
function pcWireHTML(){
  return '<div class="cs-sketches">'+PC_WF.map(function(k,j){return '<figure style="--r:'+[-2.5,1.8,-1.2,2.4,-1.8][j%5]+'deg">'+pcImg(k[0],"pc-wire","Wireframe: "+k[1])+'<figcaption>'+k[1]+'</figcaption></figure>'}).join("")+'</div>'}

/* ---- three live pieces, each one a real part of the app ---- */
function pcIco(k,cls){return '<svg viewBox="0 0 24 24" class="'+(cls||"")+'" aria-hidden="true"><path d="'+PC_ICO[k]+'"/></svg>'}
function pcBillCard(b){return '<div class="pcd-card" data-q="'+pcEsc((b.n+" "+b.c+" "+b.d+" "+b.it).toLowerCase())+'"><div class="pcd-r"><b>#'+b.n+'</b><small>'+b.t+'</small></div><div>'+(b.c?'<em>'+pcEsc(b.c)+'</em>':'')+'<span>'+b.i+' items</span></div><strong>₹'+b.a+'</strong></div>'}
function pcCompsHTML(){
  var logo='<svg viewBox="0 0 24 24" class="pcd-logo" aria-hidden="true"><path d="'+PC_LOGO_F+'" fill="#E7BBFF"/><path d="'+PC_LOGO_S+'" fill="none" stroke="#A500FF" stroke-width="1.5" stroke-linecap="round"/></svg>';
  var g={},order=[];PC_BILLS.forEach(function(b){if(!g[b.d]){g[b.d]=[];order.push(b.d)}g[b.d].push(b)});
  var h='<div class="trk-wrap pc-wrap">';
  /* 1: HomeTopBar search toggle + the filtered grid */
  h+='<div class="trk-demo"><div class="pcd"><div class="pcd-z pcd-home">'+
    '<div class="pcd-top">'+logo+'<b class="pcd-store">'+PC_STORE.toUpperCase()+'</b><button type="button" class="pcd-sq" data-s aria-label="Search bills" aria-expanded="false">'+pcIco("search")+'</button><span class="pcd-sq pcd-st">'+pcIco("store")+'</span></div>'+
    '<div class="pcd-sx"><div><label class="pcd-field">'+pcIco("search","pcd-lead")+'<input type="text" placeholder="Search by bill #, customer, item or date..." aria-label="Search receipts"><button type="button" class="pcd-x" aria-label="Clear search">'+pcIco("close")+'</button></label></div></div>'+
    '<div class="pcd-grid">'+order.map(function(d){return '<div class="pcd-gh" data-d="'+d+'"><b>'+d+'</b><span>•  <i>'+g[d].length+'</i> Bills</span></div><div class="pcd-gg">'+g[d].map(pcBillCard).join("")+'</div>'}).join("")+
    '<div class="pcd-empty"><span>'+pcIco("receipt")+'</span><b>No matching receipts</b><small>Try searching for a different item or customer name</small></div></div></div></div>'+
    '<p><b>Search stays out of the way</b>The top bar is the store’s name and two 42dp buttons. Tap search and a field opens under it, matching bill number, customer, item or date. The X clears the text first, then closes. Try “atta”, “Ramesh” or “26 Sep”.</p></div>';
  /* 2: ReceiptScreen: printer slot + paper, RippleRecordButton, then the EDIT / PRINT / SHARE bar */
  h+='<div class="trk-demo"><div class="pcd"><div class="pcd-z pcd-rc" data-st="idle">'+
    '<div class="pcd-rt"><span class="pcd-bk">'+pcIco("back")+'</span><span class="pcd-rtt">'+logo+'PARCHI RECEIPT</span><i></i></div>'+
    '<div class="pcd-disp"><span class="pcd-slot"><i></i></span><div class="pcd-paper"><b class="pcd-sn">'+PC_STORE.toUpperCase()+'</b><span class="pcd-dt">27 SEP 2026 • 06:42 PM</span>'+
      '<span class="pcd-dash"></span><div class="pcd-th"><i>#</i><b>ITEM</b><span>QTY</span><em>PRICE</em></div><div class="pcd-body"></div><span class="pcd-dash pcd-d2"></span>'+
      '<div class="pcd-tot"><b>TOTAL</b><strong>₹ _______</strong></div><span class="pcd-tear"></span></div></div>'+
    '<div class="pcd-bar"><div class="pcd-recw"><button type="button" class="pcd-rec" aria-label="Start voice dictation"><i class="pcd-w2"></i><i class="pcd-w1"></i><span class="pcd-shd"></span><span class="pcd-btn">'+pcIco("mic","pcd-mic")+pcIco("pause","pcd-pause")+'</span></button><p class="pcd-hear"></p></div>'+
    '<div class="pcd-pills"><span class="pl-e">'+pcIco("edit")+'EDIT</span><span class="pl-p">'+pcIco("print")+'PRINT</span><span class="pl-s">'+pcIco("share")+'SHARE</span></div></div></div></div>'+
    '<p><b>Tap, talk, tap</b>The receipt screen’s record button, with the app’s timing: rings out to 2.1× over 1400ms and 2.6× over 1800ms, the button breathing to 1.08× every 700ms, what it hears printed underneath. Tap again to stop, and the bill is built from what it heard. <button type="button" class="pcd-again">New bill</button></p></div>';
  /* 3: the offline parser */
  var EX=["10 kg atta 5 kg rajma 2 kg maida 3 kg sugar","aadha kilo cheeni, dedh kilo aata 60","50 rupaye ka dahi aur paav jeera","2 brush 3 sabun 5 bread"];
  h+='<div class="trk-demo"><div class="pcd"><div class="pcd-z pcd-ps">'+
    '<span class="pcd-lb">SAY IT, OR TYPE IT</span><input type="text" class="pcd-in" value="'+EX[0]+'" aria-label="An order, the way a shopkeeper would say it">'+
    '<div class="pcd-ex">'+EX.map(function(e,i){return '<button type="button" class="'+(i?"":"on")+'">'+pcEsc(e)+'</button>'}).join("")+'</div>'+
    '<span class="pcd-lb">NORMALIZED</span><code class="pcd-norm"></code>'+
    '<div class="pcd-mini"><div class="pcd-th"><i>#</i><b>ITEM</b><span>QTY</span><em>PRICE</em></div><div class="pcd-out"></div></div></div></div>'+
    '<p><b>The offline parser, running here</b>A JavaScript port of VoiceBillParser, the fallback when Gemini isn’t reachable: the fraction rules (aadha, paav, dedh, dhai), Hindi number words, the phonetic Kirana map, and how it splits one breath into lines. An item without a price stays blank, for a pen.</p></div>';
  return h+'</div>'}
function pcFit(root){var zs=root.querySelectorAll(".pcd");function fit(){zs.forEach(function(p){var z=p.firstElementChild;if(z)z.style.zoom=Math.max(.4,p.clientWidth/390)})}
  fit();if(window.ResizeObserver){var ro=new ResizeObserver(fit);zs.forEach(function(p){ro.observe(p)})}else window.addEventListener("resize",fit)}
function pcRowsHTML(items){return items.map(function(r,i){return '<div class="pcd-row" style="--k:'+i+'"><i>'+(i+1)+'</i><b>'+pcEsc(r.n)+'</b><span>'+pcEsc(r.q)+'</span><em>'+(r.p!=null?"₹"+pcRs(r.p):"")+'</em></div>'}).join("")}
function pcWire(){
  var root=document.querySelector(".pc-wrap");if(!root||root.dataset.on)return;root.dataset.on="1";pcFit(root);
  /* 1: search toggle, same filter fields as BillViewModel.filteredBills */
  var hm=root.querySelector(".pcd-home"),sb=hm.querySelector("[data-s]"),inp=hm.querySelector(".pcd-sx input"),x=hm.querySelector(".pcd-x");
  function filt(){var q=inp.value.trim().toLowerCase(),any=0;
    hm.querySelectorAll(".pcd-gg").forEach(function(gg){var n=0;gg.querySelectorAll(".pcd-card").forEach(function(c){var ok=!q||c.dataset.q.indexOf(q)>-1;c.hidden=!ok;if(ok)n++});
      var gh=gg.previousElementSibling;gh.hidden=gg.hidden=!n;gh.querySelector("i").textContent=n;any+=n});
    hm.classList.toggle("none",!any)}
  function tog(o){hm.classList.toggle("q",o);sb.setAttribute("aria-expanded",o?"true":"false");if(o)setTimeout(function(){try{inp.focus({preventScroll:true})}catch(e){}},200);else{inp.value="";filt()}}
  sb.addEventListener("click",function(){tog(!hm.classList.contains("q"))});
  x.addEventListener("click",function(e){e.preventDefault();if(inp.value){inp.value="";filt();inp.focus({preventScroll:true})}else tog(false)});
  inp.addEventListener("input",filt);
  /* 2: record -> listening (partial transcript) -> CREATING RECEIPT... -> lines + action pills */
  var rc=root.querySelector(".pcd-rc"),rb=rc.querySelector(".pcd-rec"),hear=rc.querySelector(".pcd-hear"),body=rc.querySelector(".pcd-body"),tot=rc.querySelector(".pcd-tot strong"),tm=[],said="";
  function clr(){tm.forEach(clearTimeout);tm=[]}
  function st(s){rc.dataset.st=s;rb.setAttribute("aria-label",s==="listen"?"Pause recording":"Start voice dictation")}
  function idle(){clr();said="";st("idle");hear.textContent="";tot.textContent="₹ _______";
    body.innerHTML='<div class="pcd-empty2"><b>READY FOR DICTATION</b><span>Speak items: e.g. Aata 10 kg, two brush</span></div>'}
  /* partial results arrive a phrase at a time, the way SpeechRecognizer hands them over */
  function listen(){clr();said="";st("listen");hear.textContent="TAP TO PAUSE";var w=PC_SPEECH_PARTS;
    w.forEach(function(_,i){tm.push(setTimeout(function(){said=w.slice(0,i+1).join(" ");hear.textContent='Hearing: "'+said+'"'},1000+i*900))})}
  function stop(){clr();if(!said){st("idle");hear.textContent="";return}
    st("proc");hear.textContent="CREATING RECEIPT...";
    body.innerHTML='<div class="pcd-empty2 pcd-proc"><i class="pcd-spin"></i><b>CREATING RECEIPT...</b><span>Structuring items &amp; quantities...</span></div>';
    tm.push(setTimeout(function(){var it=pcParse(said),t=pcSum(it);if(!it.length){idle();return}
      body.innerHTML=pcRowsHTML(it);tot.textContent=t>0?"₹ "+pcRs(t):"₹ _______";hear.textContent="";st("done")},1300))}
  rb.addEventListener("click",function(){var s=rc.dataset.st;if(s==="listen")stop();else if(s==="idle")listen()});
  root.querySelector(".pcd-again").addEventListener("click",idle);
  idle();
  /* 3: parser */
  var ps=root.querySelector(".pcd-ps"),pin=ps.querySelector(".pcd-in"),nrm=ps.querySelector(".pcd-norm"),out=ps.querySelector(".pcd-out");
  function run(){var v=pin.value,it=pcParse(v);nrm.textContent=pcNorm(v.trim())||" ";out.innerHTML=it.length?pcRowsHTML(it):'<div class="pcd-none">Nothing it can bill yet.</div>'}
  pin.addEventListener("input",function(){ps.querySelectorAll(".pcd-ex button").forEach(function(b){b.classList.toggle("on",b.textContent===pin.value)});run()});
  ps.querySelectorAll(".pcd-ex button").forEach(function(b){b.addEventListener("click",function(){pin.value=b.textContent;ps.querySelectorAll(".pcd-ex button").forEach(function(x){x.classList.toggle("on",x===b)});run()})});
  run()}
(function(){var cw=window.caseWire;window.caseWire=function(p){if(cw)cw(p);if(p&&p.id==="parchi")pcWire()}})();

/* ---- final screens board: six real screens in the order you meet them ----
   [kind, label, x%, y%, w%, rot, mobile x%, mobile y%, mobile w%]; desktop stage is 1200/560, so a 13.5% wide
   390x844 frame is 62.7% tall and every y below keeps it inside; phones use 2 columns on a 390/1360 stage */
var PSTG=[["onboarding","Onboarding",2.5,20,13.5,-1.6, 4,4,44],["setup","Set up your shop",18.8,12,13.5,1.2, 52,6,44],
  ["home","Home",35.1,22,13.5,-1, 4,35,44],["listen","Listening",51.4,13,13.5,1.4, 52,37,44],
  ["receipt","The receipt",67.7,21,13.5,-1.2, 4,66,44],["daily","Daily sales",84,14,13.5,1.6, 52,68,44]];
function pcStageHTML(){
  var h='<div class="stg pc" id="stg"><div class="stg-in">';
  PSTG.forEach(function(t,i){
    h+='<figure class="stp" data-k="pc_'+t[0]+'" data-cap="'+t[1]+'" tabindex="0" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--w:'+t[4]+'%;--r:'+t[5]+'deg;--mx:'+t[6]+'%;--my:'+t[7]+'%;--mw:'+t[8]+'%;--ar:390/844;--i:'+i+'">'+
      pcImg(t[0],"",t[1])+'</figure>'+
      '<span class="slab" style="--x:'+t[2]+'%;--y:'+t[3]+'%;--mx:'+t[6]+'%;--my:'+t[7]+'%;--i:'+i+'"><b>'+("0"+(i+1)).slice(-2)+'</b>'+t[1]+'</span>'});
  return h+'</div></div>'}

/* ---- the cover canvas: no Figma file, so the rebuilt screens stand in for design frames ---- */
ACV.parchi={html:function(p){
  /* cover + final screens only: the wireframes live further down the page, not on the canvas */
  var SEC=[["01  Cover",0,0,1000,680],["02  Final screens",1080,0,1580,680]];
  var w=SEC.map(function(s){return '<div class="asec" style="left:'+s[1]+'px;top:'+s[2]+'px;width:'+s[3]+'px;height:'+s[4]+'px"><span class="asn">'+s[0]+'</span></div>'}).join("");
  w+='<div class="af pc-cover" data-n="Cover" data-wh="860×380" style="left:70px;top:150px;width:860px;height:380px"><span class="an">Cover</span>'+
    '<span class="pc-cvi">'+pcImg("receipt","","Receipt")+'</span><span class="pc-cvt"><b>PARCHI</b><em>Your shop already has a language.</em><small>Android · Kotlin + Compose · Voice billing</small></span></div>';
  PSTG.forEach(function(f,i){var x=1120+i*250;
    w+='<div class="af" data-n="'+f[1]+'" data-wh="390×844" style="left:'+x+'px;top:170px;width:200px;height:432px;--i:'+i+'"><span class="an">'+f[1]+'</span>'+pcImg(f[0],"",f[1])+'</div>'});
  return '<div class="acv" id="acv" tabindex="0" aria-label="Parchi canvas. Drag to move around, use the zoom buttons or ctrl and scroll to zoom.">'+
    '<div class="acv-top"><span class="acv-file"><b>PARCHI</b>canvas</span><span class="acv-tip">Built in Kotlin + Compose · No Figma file</span></div>'+
    '<div class="acv-world">'+w+'</div>'+
    '<div class="acv-bar"><button type="button" data-z="-" aria-label="Zoom out">&minus;</button><span class="acv-pct">100%</span><button type="button" data-z="+" aria-label="Zoom in">+</button><button type="button" data-z="fit" class="zfit">Fit all</button></div>'+
    '<p class="acv-hint"><span class="fine">Drag to move · scroll to zoom · click a frame</span><span class="touch">Tap to explore</span></p>'+
    '<button type="button" class="acv-done">Done</button></div>'}};

CS.parchi={
  meta:[["Role","Solo: idea, design, build"],["Made with","Google AI Studio, Kotlin + Jetpack Compose"],["Data","On the phone. Room + SharedPreferences, no account"],["Platform","Android, works offline"],["Status","In daily use"]],
  quote:"Your shop already has a language. Parchi understands it.",
  secs:[
   {h:"The queue doesn’t wait for a bill.",b:["A shopkeeper already knows what was sold. Writing it by hand, or typing item by item into a POS menu, is the slow part, not the sale itself.","Parchi compresses that to: speak the sale, check what it heard, finish the receipt. Everything after the words is the app’s job, not the shopkeeper’s."]},
   {h:"Four people at the counter.",personas:[
     ["Ramesh","45 · general store owner, Hindi-first","Basic smartphone user. Wants Hindi and Hinglish billing, a simple receipt, and a way to share it on WhatsApp.","I don’t want to type. I want to talk and see the bill appear.","#E7BBFF"],
     ["Lakshmi","38 · tea and food retail, fast counter","Serves a moving queue. Needs the least possible interaction between a sale and a printed slip.","There’s no time to tap through menus while three people are waiting.","#A9DEFF"],
     ["Amit","32 · small distributor, wholesale","Handles bigger, more structured orders and repeat customers. Wants customer context saved with the bill.","Half my orders are the same shop, same items, different day.","#B4F6B8"],
     ["Priya","29 · apparel retailer, comfortable with tech","Fine with apps, wants the repetitive entry gone and eventually wants to see her sales, not just log them.","I don’t need it to be simple for me. I need it to be fast.","#FFD44E"]]},
   {h:"Every screen, down to its bones.",b:["Onboarding, home, a fresh receipt waiting for your voice, the finished receipt, and daily sales, drawn plain from the shipped app. There’s no Figma file behind Parchi and no paper sketches to show: it went from an idea, straight into Google AI Studio, straight into Kotlin. Tap any one to see it up close."],
    pwire:1,
    pipe:[["Idea","A voice-first bill for a Kirana counter"],["Google AI Studio","Direction and product decisions in, Kotlin and Jetpack Compose out"],["My testing","Built and reshaped across five versions"],["GitHub","The code is public"]]},
   {h:"Three pieces, ported from the Kotlin.",b:["No Figma file means no component sets to pull from. Instead, three real parts of the app, rebuilt with the values in the source: search on the home screen, the record button and the receipt it fills, and the offline parser underneath."],pcomps:1},
   {h:"The screens, in the order you meet them.",b:["Onboarding, setting up the shop, home, listening, the finished receipt, and daily sales. Rebuilt from the Compose source at 390×844 with sample bills. The name across the top is the store’s own, the app’s default until you change it."],pboard:1},
   {h:"Three ways in, one receipt out.",flow:[["Voice input","Gemini parsing","Offline phonetic fallback"],"Defensive validation, then the bill state",["Receipt saved to history","Printed or shared"]]},
   {h:"How it moves.",steps:[
     ["Tap the mic","The mic in the middle of the home bar opens a fresh receipt, bill number and time already printed on it. Tap the big mic under the paper to start listening, in Hindi, Hinglish or English."],
     ["Say the sale","What it hears shows up under the mic as you speak, while a 5 second watchdog keeps the recognizer from freezing mid sentence."],
     ["Tap again","Gemini turns the whole sentence into lines when there’s a network. Without one, the offline phonetic parser does it on the phone, so the counter never stalls."],
     ["Check the bill","Every line prints with its quantity. An item said without a price keeps its price blank, so it can be filled in with a pen."],
     ["Print or share","Print hands the receipt to Android’s print dialog, any printer service on the phone or a PDF. Share sends it as text through the system share sheet, WhatsApp included."],
     ["It’s already saved","The bill lands in Room the moment it’s built, searchable later by bill number, customer, phone, date or item."]]},
   {h:"Purple on near white, numbers in monospace.",b:["Parchi’s canvas stays close to white so the purple has somewhere to stand out: the mic, the primary buttons, the selected tab. Every price, timestamp and bill number is set in monospace so figures never shift as they update."],
    sys:{colors:[["#FAF7FC","Canvas background"],["#FFFFFF","Surface card"],["#E7BBFF","Purple primary"],["#A500FF","Purple supporting"],["#3B0066","Purple dark"],["#1F0038","Purple deep"],["#FFFDF9","Thermal paper white"],["#0F172A","Ink dark"],["#64748B","Ink muted"],["#10B981","Success green"],["#F59E0B","Warning amber"]],
      specs:[["Cards","White, 18dp corners, 1.2dp slate border on the lavender canvas"],["Receipt","Thermal paper white, a zigzag tear strip along the bottom"],["Printer slot","Near black gradient bar, 16dp corners, a darker slit"],["Mic button","64dp on home, 68dp on the receipt, #A500FF to #8800D6, lavender ring"],["Numbers","Monospace: store name, bill numbers, timestamps, prices, totals"],["Body text","Default sans for inputs, dialogs, everyday copy"]],
      type:[["Aa","Numbers","Monospace, for anything that has to line up: prices, totals, bill numbers.","'Roboto Mono',ui-monospace,monospace"],["Aa","Everything else","Default sans, for input fields, dialogs and sentences.","Inter,system-ui,sans-serif"]]}},
   {h:"What I built, and why.",b:["Every call traced back to one question: does this make the counter faster, or does it just make the app fancier."],decisions:[
     ["Gemini and a local fallback, not just one","Small shops don’t have dependable WiFi. GeminiBillParser handles the sentence when there’s a network; VoiceBillParser’s phonetic map takes over when there isn’t, so a bill never waits on a signal."],
     ["Items live as JSON inside the bill, not a normalized table","No separate Customer or Product Catalog tables. For an MVP that’s a voice POS and receipt history, not an ERP, a bill’s items only ever need to be read back with that one bill."],
     ["Android’s print dialog instead of raw ESC/POS","The receipt is laid out as a small web page and handed to Android’s PrintManager, which reaches whatever print service the phone has, or a PDF, without pairing to one thermal model. Direct Bluetooth printing is unshipped future work."],
     ["A defensive parser sits between the model and the bill","Gemini’s JSON is validated and sanitized before it ever reaches bill state, so a malformed response can’t corrupt a receipt."],
     ["Sharing goes through the system sheet","ACTION_SEND reaches WhatsApp, SMS or anything else installed, instead of committing to one messaging API before there was a reason to."]]},
   {h:"What I cut.",b:["Direct ESC/POS Bluetooth printing. Printing today goes through Android’s print dialog, not a raw socket to one paired thermal model.","Normalized Customer and Product Catalog tables. Customer details live per bill and items are a JSON blob inside it, on purpose, for what this needs to do right now.","A direct WhatsApp Business API integration. Sharing is the system share sheet, which happens to include WhatsApp, not a dedicated business integration.","This started as a wider “AI companion” concept with notes, chat, reminders and mood tracking. All of that was dropped. What shipped is one job: speak a sale, get a trustworthy receipt."]},
   {h:"What I’d do differently.",b:["Fixing a line comes first. The EDIT button is on the receipt and the edit dialogs are written, but in this build they aren’t connected to the receipt screen yet, so a wrong line means saying it again.","I’d watch a real shopkeeper use it through a busy evening before calling any version final; everything so far has been my own testing.","Correction rate isn’t measured yet. The real test of a voice POS is how often a shopkeeper has to fix what it heard, and that needs real counters, not me talking to my own phone."]}
  ],
  cta:["Want to try it on your phone?","It’s an Android APK, not on the Play Store. Ask and I’ll send it over.","mailto:adi.workspace76865@gmail.com?subject=Parchi%20APK","Ask for the APK"],
  links:[["Code on GitHub","https://github.com/adityaraj-dev/Parchi","gh"],["Full doc on Notion","https://jealous-ghost-a9e.notion.site/Parchi-Product-Story-PRD-Current-State-Audit-3e77ea0aa244817babbccb5af5d35ab6?source=copy_link","no"]]
};

/* ---- the Parchi card on Work and the deck: its real home screen, bottom anchored so the nav and mic sit in view.
   The mic FAB (JupiterBulgeNavigationBar, 64dp at 195,764 of 390x844) wipes open the new receipt it really opens;
   the receipt's own record button (68dp at 195,771, 195,749 while listening) toggles listening. */
(function(){
  var cv='<span class="ccv pc-ccv"><span class="cph">'+pcImg("home","c1","")+pcImg("ready","c2","")+pcImg("listen","c3","")+
    '<span class="trk-hot pc-go" role="button" tabindex="0" aria-label="Start a new receipt"></span><span class="trk-hot pc-rk" role="button" tabindex="-1" aria-label="Start listening"></span></span></span>';
  Array.prototype.forEach.call(document.querySelectorAll('#wgrid .wcard[href="/work/parchi"] .top,#deck .card[href="/work/parchi"] .card-art'),function(n){n.innerHTML=cv;n.classList.add("hascv");
    var c=n.querySelector(".ccv"),go=n.querySelector(".pc-go"),rk=n.querySelector(".pc-rk");
    [go,rk].forEach(function(f){["pointerdown","mousedown","touchstart","pointerup"].forEach(function(t){f.addEventListener(t,function(e){e.stopPropagation()},{passive:true})});
      f.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" ")f.click()})});
    function set(o,e){if(e){e.preventDefault();e.stopPropagation()}c.classList.toggle("open",o);if(!o)c.classList.remove("lst");go.tabIndex=o?-1:0;rk.tabIndex=o?0:-1}
    go.addEventListener("click",function(e){set(true,e)});
    rk.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();var l=!c.classList.contains("lst");c.classList.toggle("lst",l);rk.setAttribute("aria-label",l?"Pause recording":"Start listening")});
    var card=n.closest("a");if(card)card.addEventListener("mouseleave",function(){set(false)})})})();
/* CS.parchi is defined after the first route() ran, so a direct load of #/work/parchi rendered the bare stub: route again */
if(/^#\/work\/parchi/.test(HASH())&&typeof route==="function")route();

/* ---- home stool: a colour cover with the app icon, lifted off as the cards rise ----
   runs last (still inside the outer closure, so it can see ALT/TRK/cards/P), after
   every project's own wiring IIFE has had a chance to mark its .card-art as .hascv —
   Parchi's cover silently never applied when this used to run earlier in the file,
   before Parchi's own hascv class existed yet. */
(function(){var ICON={"alter":'<span class="cc-t cc-alter">'+ALT.face+'</span>',"track-it":'<span class="cc-t cc-trk">'+TRK.t_icon+'</span>',"washio":'<span class="cc-t cc-wsh"><b class="wsh-word">washio</b></span>',"parchi":'<span class="cc-t"><b style="font:800 26px/1 \'Roboto Mono\',ui-monospace,monospace;color:#131316;letter-spacing:.06em">PARCHI</b></span>'};
  cards.forEach(function(c,i){var p=P[i];if(!p)return;var art=c.querySelector(".card-art");if(!art||!art.classList.contains("hascv"))return;
    var cov=document.createElement("span");cov.className="card-cover";cov.style.background=p.s;cov.setAttribute("aria-hidden","true");
    cov.innerHTML=ICON[p.id]||'<svg viewBox="0 0 100 100" aria-hidden="true">'+p.a+'</svg>';
    c.querySelector(".card-top").appendChild(cov)})})();
/* =================== ROUND 20: service pages (#/offer/<id>) and the service previews ===================
   Every picture here is read from the case studies' own asset tables (ALT, which carries TRK, WSH and HBT)
   and Parchi's pcImg(). Nothing new is embedded. Graphic design and Brand identity wait for Aditya's imagery. */
(function(){
  var PJ={alter:["Alter","#FFD44E"],"track-it":["Track It","#B4F6B8"],washio:["Washio","#A9DEFF"],hourbit:["Hourbit","#98FF53"],parchi:["Parchi","#E7BBFF"]};
  function img(k,alt){var a=ALT[k];return '<img alt="'+alt+'" draggable="false" src="'+a.u+'">'}
  function sysOf(id){var c=CS[id];if(!c)return null;for(var i=0;i<c.secs.length;i++)if(c.secs[i].sys)return c.secs[i].sys;return null}
  function vid(){return '<video muted loop playsinline preload="metadata" aria-hidden="true"><source src="'+ALT.wv_home_w.u+'" type="video/webm"><source src="'+ALT.wv_home.u+'" type="video/mp4"></video>'}

  /* graphic design posts for the hover preview (560px WebP, ~190KB for all five) */
  var GFXP=[["/assets/media/c3383f9f36caedc7.webp", "Nerdy Designer \u00b7 brand post"], ["/assets/media/cce965642baeee47.webp", "Bisleri \u00b7 carousel"], ["/assets/media/e7aabd0462fd8758.webp", "Invisible structures \u00b7 carousel"], ["/assets/media/8b0e4d671f33f67f.webp", "Kinley \u00b7 carousel"], ["/assets/media/f7bf1e04323c67a9.webp", "Alter \u00b7 launch visual"]];
  /* ---- hover previews ---- */
  function layer(o){
    if(o.id==="uiux"){var F=[["x_home","Alter","#FFD44E"],["t_home","Track It","#B4F6B8"],["hb_home","Hourbit","#98FF53"],["pc","Parchi","#E7BBFF"]];
      return F.map(function(f,i){return '<span class="svp-f" style="--fb:'+f[2]+';--dur:'+(F.length*1.6)+'s;--dl:'+(i*1.6)+'s">'+(f[0]==="pc"?pcImg("home","",""):img(f[0],""))+'<em>'+f[1]+' · home screen</em></span>'}).join("")}
    if(o.id==="systems"){var sy=sysOf("alter");return '<span class="svp-sw">'+sy.colors.slice(0,8).map(function(c,k){return '<i style="background:'+c[0]+';--k:'+k+'"></i>'}).join("")+'</span><em>Alter · colour tokens</em>'}
    if(o.id==="motion")return vid()+'<em>Washio · prototype, home</em>';
    /* graphic design: Aditya's own posts, one at a time, as tilted cards like the UI/UX screens */
    if(o.id==="graphic")return GFXP.map(function(f,i){return '<span class="svp-f svp-p" style="--fb:'+o.pc+';--dur:'+(GFXP.length*1.6)+'s;--dl:'+(i*1.6)+'s"><img alt="" draggable="false" src="'+f[0]+'"><em>'+f[1]+'</em></span>'}).join("");
    var B=o.id==="brand"?[["VANORGO","VANORGO · identity"],["Asian Cadet Cup","Asian Cadet Cup · logo"]]:o.id==="graphic"?[["Carousel","Carousels & graphics"],["Asian Cadet Cup","Asian Cadet Cup 2025 · invitation"]]:[];
    var S=[];B.forEach(function(b){var im=window.CVBOARD?CVBOARD(b[0])[0]:null;if(im)S.push([im.src,b[1]])});
    /* the cycle shows each slide for a quarter of the loop, so fewer than four would leave gaps */
    while(S.length&&S.length<4)S=S.concat(S);
    if(S.length)return S.map(function(f,i){return '<span class="svp-f svp-p svp-w" style="--fb:'+o.pc+';--dur:'+(S.length*1.6)+'s;--dl:'+(i*1.6)+'s"><img alt="" draggable="false" src="'+f[0]+'"><em>'+f[1]+'</em></span>'}).join("");
    return '<span class="svp-soon">Work being added<small>'+o.lbl+'</small></span>'}
  /* The preview layers (pictures, a video, the colour chips) used to be built on the first row hover. Scrolling puts a
     row under a resting cursor, so that first build landed in the middle of a scroll. Now one layer is built per idle
     slot as the services list comes near, and the hover only fills in whatever is still missing. */
  function svpMake(sp,x){if(sp.querySelector('.svp-l[data-s="'+x.id+'"]'))return;
    var d=document.createElement("div");d.className="svp-l";d.dataset.s=x.id;d.innerHTML=layer(x);sp.appendChild(d);return d}
  function svpShow(sp,id){Array.prototype.forEach.call(sp.querySelectorAll(".svp-l"),function(l){var on=l.dataset.s===id;l.classList.toggle("on",on);
    var v=l.querySelector("video");if(v){if(on){try{v.currentTime=0;var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}catch(e){}}else v.pause()}})}
  window.svpFill=function(sp,o){sp._cur=o.id;OFFER.forEach(function(x){svpMake(sp,x)});svpShow(sp,o.id)};
  window.svpWarm=function(){var sp=document.getElementById("sprev");if(!sp||sp._warm)return;sp._warm=1;var i=0,idle=window.requestIdleCallback||function(f){return setTimeout(f,80)};
    (function next(){if(i>=OFFER.length)return;svpMake(sp,OFFER[i++]);idle(next,{timeout:500})})()};
  (function(){var rows=[document.getElementById("offerHome"),document.getElementById("v-offer")].filter(Boolean);
    if(!("IntersectionObserver" in window)){setTimeout(window.svpWarm,4000);return}
    var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting})){io.disconnect();window.svpWarm()}},{rootMargin:"1800px 0px"});
    rows.forEach(function(r){io.observe(r)})})();

  /* ---- canvas pieces ---- */
  function sec(t,x,y,w,h,go){return '<div class="asec" style="left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px"><span class="asn">'+t+'</span>'+
    (go?'<button type="button" class="svp-go" data-go="#/work/'+go+'">Open the case study →</button>':'')+'</div>'}
  var fi=0;
  function fr(k,n,x,y,w,cls){var a=ALT[k],h=Math.round(w*a.h/a.w);
    return '<div class="af'+(cls?' '+cls:'')+'" data-n="'+n+'" data-wh="'+a.w+'×'+a.h+'" style="left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;--i:'+(fi++)+'"><span class="an">'+n+'</span>'+img(k,n)+'</div>'}
  function pcf(k,n,x,y,w){var h=Math.round(w*844/390);
    return '<div class="af" data-n="'+n+'" data-wh="390×844" style="left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;--i:'+(fi++)+'"><span class="an">'+n+'</span>'+pcImg(k,"",n)+'</div>'}
  function sheet(id,x,y){var sy=sysOf(id);if(!sy)return "";var n=sy.colors.length,rows=Math.ceil(n/4),h=36+rows*108+(rows-1)*12;
    return '<div class="af svp-sheet" data-n="Colour" data-wh="'+PJ[id][0]+' colours" style="left:'+x+'px;top:'+y+'px;width:472px;height:'+h+'px;--i:'+(fi++)+'"><span class="an">'+PJ[id][0]+' · colour</span>'+
      sy.colors.map(function(c){return '<div><i style="background:'+c[0]+'"></i><b>'+c[1]+'</b><code>'+c[0]+'</code></div>'}).join("")+'</div>'}
  /* the group names sit above their boxes, so the starting view needs ~60 units of headroom */
  function pad(b){if(!b)return b;var q=String(b).split(",").map(Number);return [q[0],q[1]-60,q[2],q[3]+60].join(",")}
  function shell(title,w,home,homem){home=pad(home);homem=pad(homem);
    return '<div class="acv svp-acv" tabindex="0" data-home="'+home+'" data-homem="'+homem+'" aria-label="'+title+' canvas. Drag to move around, use the zoom buttons or ctrl and scroll to zoom.">'+
    '<div class="acv-top"><span class="acv-file"><b>Services</b>'+title+'</span><span class="acv-tip">Project highlights</span></div>'+
    '<div class="acv-world">'+w+'</div>'+
    '<div class="acv-bar"><button type="button" data-z="-" aria-label="Zoom out">&minus;</button><span class="acv-pct">100%</span><button type="button" data-z="+" aria-label="Zoom in">+</button><button type="button" data-z="fit" class="zfit">Fit all</button></div>'+
    '<p class="acv-hint"><span class="fine">Drag to move · scroll to zoom · click a frame</span><span class="touch">Tap to explore</span></p>'+
    '<button type="button" class="acv-done">Done</button></div>'}

  function bf(im,n,x,y,w){if(!im)return "";var h=Math.round(w*im.h/im.w);
    return '<div class="af svp-bd" data-n="'+n+'" style="left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+h+'px;--i:'+(fi++)+'"><span class="an">'+n+'</span><img alt="'+n+'" draggable="false" src="'+im.src+'"></div>'}
  function boards(title,list){fi=0;var w="",x=0,H=0;
    list.forEach(function(b){var im=window.CVBOARD?CVBOARD(b[0])[0]:null;if(!im)return;var bw=b[2],bh=Math.round(bw*im.h/im.w);
      w+=sec(b[1],x,0,bw+80,bh+130,null)+bf(im,"Board",x+40,90,bw);x+=bw+80+60;H=Math.max(H,bh+130)});
    return w?shell(title,w,"0,0,"+(x-60)+","+H,"0,0,"+Math.min(x-60,900)+","+H).replace("Project highlights","Pulled from the canvas"):""}
  function engCanvas(title,groups){fi=0;var w="",x=0,H=420,W=240,G=28;
    groups.forEach(function(g){var n=g.items.length,sw=Math.max(300,n*W+(n-1)*G+80);
      w+=sec(g.t,x,0,sw,H,g.id);
      g.items.forEach(function(it,i){var xx=x+40+i*(W+G);
        w+='<div class="af svp-bd" style="left:'+xx+'px;top:90px;width:'+W+'px;height:240px;--i:'+(fi++)+'"><span class="an">'+it[0]+'</span><div class="tm-block" style="height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:18px"><b style="font:700 22px/1.2 var(--body)">'+it[0]+'</b><span style="margin-top:8px;font:400 14px/1.45 var(--body);color:var(--ink-soft)">'+it[1]+'</span></div></div>'});
      x+=sw+60});
    return shell(title,w,"0,0,"+Math.max(1,x-60)+","+H,"0,0,"+Math.min(Math.max(1,x-60),900)+","+H)}
  var CV={
    backend:function(){return engCanvas("Backend &amp; API engineering",[
      {id:"apis",t:"APIs & services",items:[["REST APIs","Scalable, well-structured endpoints"],["Data models","Schemas designed for change"],["Reliability","Validation, auth, and monitoring"]]},
      {id:"prod",t:"Production delivery",items:[["CI/CD","Pipelines and safe releases"],["Observability","Logs, metrics, debugging signals"],["Performance","Efficient queries and services"]]}
    ])},
    ai:function(){return engCanvas("AI automation &amp; agents",[
      {id:"agents",t:"Agent workflows",items:[["Automation","Reduce manual operational toil"],["RCA","Root-cause analysis & feedback loops"],["Human-in-the-loop","Guardrails and review where needed"]]},
      {id:"quality",t:"Operational quality",items:[["Integrations","Connect tools and data sources"],["Evaluation","Measure outcomes and failures"],["Iteration","Improve with real signals"]]}
    ])},
    platform:function(){return engCanvas("Platform &amp; reliability",[
      {id:"reliability",t:"Reliability",items:[["Incidents","Faster detection and response"],["Queues & async","Resilient background processing"],["Runbooks","Clear operational playbooks"]]},
      {id:"ops",t:"Operations",items:[["Dashboards","Visibility into system health"],["Alerting","Actionable signals"],["Stability","Systems that recover gracefully"]]}
    ])},
    fullstack:function(){return engCanvas("Full-stack products",[
      {id:"frontend",t:"Product interfaces",items:[["React/TypeScript","Clear, maintainable UI"],["Integration","APIs, auth, and data flows"],["UX quality","Responsive and accessible"]]},
      {id:"backend",t:"End-to-end delivery",items:[["Node.js services","Robust application backends"],["Databases","MongoDB/MySQL modeling"],["Shipping","From idea to working product"]]}
    ])},
    ml:function(){return engCanvas("Data &amp; ML experimentation",[
      {id:"ml",t:"Modeling",items:[["GCN / ML","Graph and supervised learning"],["TensorFlow/Keras","Experimentation and training"],["Evaluation","Measure what matters"]]},
      {id:"research",t:"Research",items:[["Backtesting","Quantitative strategy evaluation"],["Analysis","Data-driven iteration"],["Rigor","Reproducible experiments"]]}
    ])}
  };

  var SEEN={
    backend:[["job-automation","Automated Job Application System","Full-stack automation with parsing, secured APIs, and browser workflows."],["uniblogic","UniBLOGic","Typed frontend + Node.js/PostgreSQL backend with real-time messaging."]],
    ai:[["job-automation","Automated Job Application System","Practical automation turning unstructured inputs into reliable actions."],["node-classifier","Graph Node Classification","Applied ML experimentation with measurable evaluation."]],
    platform:[["sync-drive","Sync-Drive","Resilient Android sync with background scheduling, retries, and integrity checks."],["uniblogic","UniBLOGic","Real-time WebSocket communication and service-oriented platform work."]],
    fullstack:[["job-automation","Automated Job Application System","React/Node/Express/MongoDB stack with extension-driven workflows."],["uniblogic","UniBLOGic","React, Node.js, PostgreSQL, and real-time features."]],
    ml:[["node-classifier","Graph Node Classification","GCN on CORA with two-hop aggregation and weighted loss (+15% over baselines)."]]
  };

  function renderSvc(id){var o=null,k=0;for(var i=0;i<OFFER.length;i++)if(OFFER[i].id===id){o=OFFER[i];k=i}
    if(!o)return false;
    var v=document.getElementById("v-svc");v.style.setProperty("--pc",o.pc);v.dataset.svc=id;
    var soon=!CV[id],nx=OFFER[(k+1)%OFFER.length];
    document.getElementById("svcHead").innerHTML='<a class="svp-back" href="/offer">'+ARW+'All services</a>'+
      '<span class="svp-num">Service 0'+(k+1)+' of 0'+OFFER.length+'</span>'+
      '<h1 class="big"><span class="svp-hl">'+o.h+'</span></h1>'+
      (soon?'<div class="svp-note"><div class="svp-card"><b>Work being added</b><p>The '+o.lbl.toLowerCase()+' work is being put together right now. What exists is in the gallery until then.</p><a class="btn" href="/gallery">Open the canvas '+ARW+'</a></div></div>':CV[id]())+
      '<p class="lede" style="max-width:62ch">'+o.p+'</p>';
    var H='<section class="cs-sec"><span class="cs-n">01</span><h2>What it covers.</h2><ul class="svp-inc">'+o.inc.map(function(t){return '<li>'+t+'</li>'}).join("")+'</ul></section>';
    if(SEEN[id]){H+='<section class="cs-sec"><span class="cs-n">02</span><h2>'+(id==="motion"?"Play with the real thing.":"Where you can see it.")+'</h2>'+
      (id==="motion"?'<p class="cs-p">Every case study has live parts, rebuilt from the product itself. Three of Washio’s are right here. The rest are one click away.</p>'+wshCompsHTML().split('<div class="wsh-wrap">')[1].replace(/^/,'<div class="wsh-wrap">'):'<p class="cs-p">Each group on the canvas above opens its case study. Or start here.</p>')+
      '<div class="svp-demos">'+SEEN[id].map(function(s){return '<a href="/work/'+s[0]+'"><b>'+s[1]+'</b><span>'+s[2]+'</span><small>Open the case study →</small></a>'}).join("")+'</div></section>'}
    else H+='<section class="cs-sec"><span class="cs-n">02</span><h2>See the rest.</h2><p class="cs-p">These are real client boards, not mockups. They sit in the gallery with everything else I have made, where you can zoom right into the details.</p><div class="svp-demos"><a href="/gallery"><b>Open the canvas</b><span>VANORGO, the carousels, the Asian Cadet Cup and the archived websites, all on one board.</span><small>Explore the gallery →</small></a></div></section>';
    H+='<div class="nextup"><a class="btn ghost" href="/offer">All services</a><span style="font:500 14px/1 var(--body);color:var(--ink-soft)">Next service</span><a class="btn ghost" href="/offer/'+nx.id+'">'+nx.h+' '+ARW+'</a></div>';
    document.getElementById("svcBody").innerHTML=H;
    var root=document.querySelector("#svcHead .acv");if(root)acvWire(root);
    if(id==="motion"&&window.wshWire)wshWire();
    var sv=document.querySelector("#svcHead .svp-vid video");
    if(sv&&"IntersectionObserver" in window){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){var pr=sv.play();if(pr&&pr.catch)pr.catch(function(){})}else sv.pause()},{threshold:.1});io.observe(sv)}
    return true}
  window.renderSvc=renderSvc;
  document.getElementById("svcHead").addEventListener("click",function(e){var b=e.target.closest("[data-go]");if(b){e.stopPropagation();goHash(b.getAttribute("data-go"))}});
  if(/^#\/offer\/./.test(HASH()))route();
})();
/* Hero project stacks: reuse embedded work and the case-study micro states. */
(function(){
 var hero=document.getElementById('hero'),root=document.getElementById('heroIn');if(!hero||!root)return;
 var calm=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 var entered=false;
 var core=document.createElement('div');core.className='hero-core';var identity=document.createElement('div');identity.className='hero-identity';
 root.insertBefore(core,root.querySelector('.hi'));core.appendChild(identity);identity.appendChild(root.querySelector('.hi'));identity.appendChild(root.querySelector('.framed'));identity.appendChild(root.querySelector('.hero-role'));core.appendChild(root.querySelector('.hero-manifesto'));var actions=document.createElement('div');actions.className='hero-actions rise';actions.style.animationDelay='.5s';core.appendChild(actions);var avail=root.querySelector('.avail');avail.classList.remove('rise');avail.href=CALL;actions.appendChild(avail);avail.setAttribute('aria-label','Schedule a call');
 function navSpace(){var nav=document.querySelector('.nav'),bottom=nav?nav.getBoundingClientRect().bottom:88;hero.style.setProperty('--hero-nav-bottom',Math.max(96,bottom+24)+'px')}
 navSpace();
 if(document.fonts)document.fonts.ready.then(function(){navSpace();if(active)layout()});

 var buttons=Array.from(root.querySelectorAll('.hero-stack')),layer=root.querySelector('.hero-spread'),active='',visible=false,intro=false,timer=0;
 layer.classList.add('cd-layer');layer.classList.toggle('fine',fine.matches);
 var groups={
  mixed:[['site','fxkit','FXKIT · interactive website','https://fxkit.vercel.app','FXKIT · website'],['app','wf_home','Washio · design prototype','/work/washio','Washio · design'],['comp','laptop','Doodle: working on the laptop','','Doodle · at the laptop'],['site','mistline','Mistline · web experience','https://mountains-playlist.vercel.app','Mistline · website'],['app','x_home','Alter · Android app','/work/alter','Alter · app'],['comp','plane','Doodle: throwing a paper plane','','Doodle · paper plane']]
 };
 function image(key,alt){var img=portfolioImage();img.loading="eager";img.src=key==='pc_listen'?svgURI(pcSvg('listen')):ALT[key].u;img.alt=alt||'';img.draggable=false;return img}
 buttons[0].appendChild(image('fxkit'));buttons[0].appendChild(image('mistline'));buttons[0].appendChild(image('x_home'));
 buttons.forEach(function(b){Array.from(b.children).forEach(function(el){el.classList.add('hero-thumb');el.setAttribute('aria-hidden','true')})});
 /* Design and Code: the sentence's claim as a two-state control. It flips itself while the hero is on screen until someone uses it. */
 var build=root.querySelector('.hero-build'),buildTouched=false;
 build.innerHTML='<button type="button" class="hb-toggle" aria-pressed="false" aria-label="Design or code: showing design"><span class="hb-sel" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="hb-opt hb-d" aria-hidden="true"><svg viewBox="8 12.75 16 16" aria-hidden="true"><path d="M16.5283 18.598L19.6568 19.8222C21.4613 20.5283 22.3635 20.8813 22.3336 21.4413C22.3036 22.0013 21.3621 22.2581 19.479 22.7717C18.9182 22.9247 18.6379 23.0011 18.4435 23.1955C18.2491 23.3899 18.1727 23.6702 18.0198 24.2309C17.5062 26.1141 17.2494 27.0556 16.6894 27.0855C16.1294 27.1155 15.7763 26.2133 15.0702 24.4088L13.846 21.2803C13.1068 19.3911 12.7372 18.4465 13.2159 17.9678C13.6946 17.4891 14.6392 17.8587 16.5283 18.598Z"/><path d="M11.0025 14.4189H10.3359C9.96767 14.4189 9.66919 14.7174 9.66919 15.0856V15.7523C9.66919 16.1205 9.96767 16.4189 10.3359 16.4189H11.0025C11.3707 16.4189 11.6692 16.1205 11.6692 15.7523V15.0856C11.6692 14.7174 11.3707 14.4189 11.0025 14.4189Z"/><path d="M11.0025 21.752H10.3359C9.96767 21.752 9.66919 22.0504 9.66919 22.4186V23.0853C9.66919 23.4535 9.96767 23.752 10.3359 23.752H11.0025C11.3707 23.752 11.6692 23.4535 11.6692 23.0853V22.4186C11.6692 22.0504 11.3707 21.752 11.0025 21.752Z"/><path d="M18.3343 14.4189H17.6676C17.2994 14.4189 17.001 14.7174 17.001 15.0856V15.7523C17.001 16.1205 17.2994 16.4189 17.6676 16.4189H18.3343C18.7025 16.4189 19.001 16.1205 19.001 15.7523V15.0856C19.001 14.7174 18.7025 14.4189 18.3343 14.4189Z"/><path d="M17.0023 15.418H11.6689M10.6689 16.418V21.7513"/></svg>Design</span><span class="hb-opt hb-c" aria-hidden="true"><svg viewBox="96.13 13 16 16" aria-hidden="true"><path d="M107.468 18.3369L108.694 19.5703C109.21 20.0888 109.468 20.3481 109.468 20.6702C109.468 20.9924 109.21 21.2516 108.694 21.7702L107.468 23.0036"/><path d="M100.802 18.3369L99.5752 19.5703C99.0596 20.0888 98.8018 20.3481 98.8018 20.6702C98.8018 20.9924 99.0596 21.2516 99.5752 21.7702L100.802 23.0036"/><path d="M105.801 15.6689L102.468 26.3356"/></svg>Code</span></button>';
 var hb=build.querySelector('.hb-toggle');
 function fit(){var on=build.classList.contains('code')?hb.querySelector('.hb-c'):hb.querySelector('.hb-d');hb.style.setProperty('--sx',on.offsetLeft+'px');hb.style.setProperty('--sw',on.offsetWidth+'px')}
 function flip(on){hb.setAttribute('aria-pressed',String(on));hb.setAttribute('aria-label','Design or code: showing '+(on?'code':'design'));build.classList.toggle('code',on);fit()}
 fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
 hb.addEventListener('click',function(){buildTouched=true;flip(hb.getAttribute('aria-pressed')!=='true')});
 function toggleStack(b,on){b.classList.toggle('expanded',on);b.setAttribute('aria-expanded',String(on))}
 buttons.forEach(function(b){b.addEventListener('pointerenter',function(){if(fine.matches)toggleStack(b,true)});b.addEventListener('focus',function(){toggleStack(b,true)});b.addEventListener('blur',function(){toggleStack(b,false)});b.addEventListener('click',function(){toggleStack(b,!b.classList.contains('pinned'));b.classList.toggle('pinned',b.classList.contains('expanded'))})});
 var brand=root.querySelector('.hero-logo'),logoSource=Array.from(document.getElementById('brandCreditsTemplate').content.querySelectorAll('.brand-row img')),brandIndex=0;
 var logos=logoSource.map(function(img,i){var logo=img.cloneNode();logo.className=i?'':'current';logo.removeAttribute('width');logo.removeAttribute('height');logo.setAttribute('aria-hidden','true');logo.alt='';logo.dataset.brand=img.alt;if(brand)brand.appendChild(logo);return logo});
 function media(){var play=visible&&entered&&!document.hidden&&!calm.matches;hero.classList.toggle('paused',!play)}
 function cw(d){return DOO[d[1]]?(innerWidth<=600?79:100):d[1]==='alter'?262:236}
 function layout(){
  var R=root.getBoundingClientRect(),L=layer.getBoundingClientRect(),P=root.querySelector('.hero-manifesto').getBoundingClientRect(),F=root.querySelector('.framed').getBoundingClientRect(),small=innerWidth<=1100,list=groups[active]||[],W=Math.min(450,L.width),offset=(L.width-W)/2,scale=innerWidth>=1680?Math.min(1.6,1+(innerWidth-1440)/1600):Math.min(1,R.width/1360);
  var secondRow=Math.max(210,Math.round(W*.21*1039/480+90)),lastRow=secondRow+Math.round(W*.21*1039/480)+60;layer.style.height=innerWidth<=600?(lastRow+190)+'px':'';
  var compact=[[.01,.03,.52],[.59,0,.17],[.0,.98,.58],[.38,.48,.56],[.815,.1,.165],[.46,1.2,.52]];
  Array.from(layer.children).forEach(function(el,i){var d=list[i],type=d[0],w=(type==='site'?196:type==='app'?80:type==='comp'?cw(d)/scale:144)*scale,x,y,rotation=[-4,4,-5,3,-4,4][i];
   if(innerWidth<=600&&list.length===6){var phoneSlots=[[.02,0,.60],[.73,38,.21],[.02,lastRow,.8],[.36,secondRow+15,.60],[.05,secondRow,.21],[.6,lastRow+24,.74]],pos=phoneSlots[i];w=type==='comp'?Math.min(pos[2]*W,cw(d)):pos[2]*W;x=offset+pos[0]*W;if(type==='comp')x=Math.max(4,Math.min(x,L.width-cw(d)-6));y=pos[1];rotation=[-3,3,-2,2,-3,3][i]}
   else if(small&&list.length===6){var pos=compact[i];w=type==='comp'?cw(d):pos[2]*W;x=offset+pos[0]*W;y=pos[1]*W}
   else if(small){w=Math.min(W*(type==='app'?.19:.28),type==='app'?84:144);var gap=W*.05,total=list.reduce(function(sum,item){return sum+Math.min(W*(item[0]==='app'?.19:.28),item[0]==='app'?84:144)},0)+gap*(list.length-1);x=offset+(W-total)/2;for(var j=0;j<i;j++)x+=Math.min(W*(list[j][0]==='app'?.19:.28),list[j][0]==='app'?84:144)+gap;y=30+i%2*24}
   else{/* Aditya's own arrangement (Oct 23): FXKIT left of the paragraph, Washio low right, the laptop doodle beside the name, Mistline high right, Alter top left, the paper plane under the paragraph */
    var slots=list.length===6?[[.031,P.top-R.top+1],[.838,P.bottom-R.top-53],[.646,F.top-R.top+37],[.803,F.top-R.top-30],[.18,19],[.276,P.bottom-R.top+10]]:[[.015,P.top-R.top-60],[.85,P.bottom-R.top-28],[.04,P.bottom-R.top-26]];x=R.width*slots[i][0];y=slots[i][1]}
   el.style.setProperty('--x',Math.round(x)+'px');el.style.setProperty('--y',Math.round(y)+'px');el.style.setProperty('--w',Math.round(w)+'px');el.style.setProperty('--r',rotation+'deg');
   var h=type==='app'?w*1039/480:type==='site'?w/1.94+14:type==='comp'?(DOO[d[1]]?w*1.1:60):w*2.9/4.6,origin=buttons.find(function(b){return b.dataset.group===active})||buttons[0],B=origin.getBoundingClientRect();
   el.style.setProperty('--seed',Math.min(1,48/w,30/h));el.style.setProperty('--hx',Math.round(B.left+B.width/2-L.left-w/2)+'px');el.style.setProperty('--hy',Math.round(B.top+B.height/2-L.top-h/2)+'px')});
 }
 /* Two of Aditya's doodles balance the spread (Oct 23; they replaced Alter's nav bar and Washio's add to bag, which he
    felt didn't belong). The Alter and Washio component code below stays for their case studies. */
 var DOO={laptop:root.querySelector('.doo[data-dd=laptop]'),plane:root.querySelector('.doo[data-dd=plane]')};
 function micro(kind){var box=document.createElement('div');box.className='hero-mi mi-'+kind;
  /* Aditya's own doodles (Oct 23): the one at the laptop and the one throwing a paper plane, with their own motion */
  if(DOO[kind]){var o=DOO[kind];o.classList.remove('d1','d4');o.removeAttribute('style');box.appendChild(o);return box}
  if(kind==='alter'){box.innerHTML='<div class="np" role="tablist" aria-label="Alter nav bar">'+[["home","Home"],["mem","Memories"],["up","Upcoming"],["note","Notes"]].map(function(t,i){return '<button type="button" role="tab" aria-selected="'+(i?'false':'true')+'" class="'+(i?'':'act')+'">'+ic(t[0])+'<span class="lb">'+t[1]+'</span></button>'}).join("")+'</div>'}
  else{var q=0;box.innerHTML='<ul class="wsh-items"><li><img alt="" src="'+ALT.wa_item_shirt.u+'"><span class="wsh-it"><b>Shirt</b><em>₹7/pcs</em></span><span class="wsh-add"><button type="button" class="wsh-a">Add +</button><span class="wsh-st"><button type="button" class="wsh-m" aria-label="One less">−</button><output>1</output><button type="button" class="wsh-p" aria-label="One more">+</button></span></span></li></ul>';
   var li=box.querySelector('li'),out=li.querySelector('output'),st=li.querySelector('.wsh-st');
   function paint(){li.classList.toggle('in',q>0);out.textContent=q}
   li.querySelector('.wsh-a').addEventListener('click',function(){q=1;paint();if(!calm.matches)st.animate([{transform:'scale(.86)',opacity:0},{transform:'scale(1.04)',offset:.6},{transform:'scale(1)',opacity:1}],{duration:320,easing:'ease-out'})});
   li.querySelector('.wsh-p').addEventListener('click',function(){q++;paint();if(!calm.matches)out.animate([{transform:'translateY(-6px)',opacity:0},{transform:'none',opacity:1}],{duration:220})});
   li.querySelector('.wsh-m').addEventListener('click',function(){q=Math.max(0,q-1);paint()})}
  return box}
 function show(group){clearTimeout(timer);if(!visible||!groups[group])return;if(active===group&&layer.classList.contains('open'))return;
  active=group;layer.classList.remove('open');layer.replaceChildren();groups[group].forEach(function(d,i){var fig=document.createElement('figure');fig.className='hero-preview cd-p '+d[0];fig.style.setProperty('--k',i);fig.style.setProperty('--j',groups[group].length-1-i);
   if(d[0]==='comp')fig.appendChild(micro(d[1]));else{var a=document.createElement('a');a.className='cd-card';a.href=d[3];if(d[3].startsWith('https:')){a.target='_blank';a.rel='noopener'}
    if(d[0]==='site'){var bar=document.createElement('span');bar.className='cd-bar';bar.innerHTML='<i></i><i></i><i></i><span>'+d[3].replace('https://','')+'</span>';a.appendChild(bar)}
    a.appendChild(image(d[1],d[2]));fig.appendChild(a)}
   /* the doodles sit bare on the canvas (Oct 23): no selection frame or frame name, just the drawing */
   if(d[0]==='comp'&&DOO[d[1]])fig.classList.add('bare');
   else{var selection=document.createElement('span');selection.className='cd-sel';selection.innerHTML='<b></b><b></b><b></b><b></b>';fig.appendChild(selection);
   var label=document.createElement('span');label.className='cd-lab';label.textContent=d[4]||d[2];fig.appendChild(label)}
   var flight=document.createElement('span');flight.className='cd-q';while(fig.firstChild)flight.appendChild(fig.firstChild);fig.appendChild(flight);
   fig.setAttribute('aria-label',d[2]);layer.appendChild(fig)});
  layout();if(typeof compWire==='function')compWire();layer.inert=false;layer.setAttribute('aria-hidden','false');void layer.offsetWidth;if(calm.matches)layer.classList.add('open');else requestAnimationFrame(function(){requestAnimationFrame(function(){layer.classList.add('open')})});
 }
 /* Keep the Person section's split-axis flight and landed drag behavior. Inline controls never reset it. */
 var drag=null,suppressClick=false;
 layer.addEventListener('dragstart',function(e){e.preventDefault()});
 layer.addEventListener('pointerdown',function(e){var card=e.target.closest('.hero-preview');if(!card||!fine.matches||e.button!==0||e.target.closest('button,input'))return;
  suppressClick=false;drag={card:card,id:e.pointerId,x:e.clientX,y:e.clientY,ox:parseFloat(card.style.getPropertyValue('--x')),oy:parseFloat(card.style.getPropertyValue('--y')),moved:false};
 });
 layer.addEventListener('pointermove',function(e){if(!drag||drag.id!==e.pointerId)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<5)return;
  if(!drag.moved){drag.moved=true;drag.card.classList.add('drag');drag.card.setPointerCapture(e.pointerId)}
  drag.card.style.setProperty('--x',drag.ox+dx+'px');drag.card.style.setProperty('--y',drag.oy+dy+'px');
 });
 function release(e){if(!drag||drag.id!==e.pointerId)return;suppressClick=drag.moved;drag.card.classList.remove('drag');drag=null}
 layer.addEventListener('pointerup',release);layer.addEventListener('pointercancel',release);
 window.addEventListener('pointerup',release);
 layer.addEventListener('click',function(e){if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false}},true);
 root.querySelector('.hero-manifesto').addEventListener('pointerleave',function(){buttons.forEach(function(b){if(!b.classList.contains('pinned')&&!b.contains(document.activeElement))toggleStack(b,false)})});
 root.addEventListener('keydown',function(e){if(e.key==='Escape'){buttons.forEach(function(b){toggleStack(b,false);b.classList.remove('pinned')})}});
 function watch(){var r=hero.getBoundingClientRect();visible=hero.closest('.view').classList.contains('on')&&r.bottom>80&&r.top<innerHeight;
  var splash=document.getElementById('splash'),covered=splash&&getComputedStyle(splash).visibility!=='hidden'&&getComputedStyle(splash).display!=='none';
  entered=!covered;media();
  if(visible&&!intro&&!covered){intro=true;if(calm.matches)show('mixed');else timer=setTimeout(function(){if(!visible)return;buttons[0].classList.add('nudge');timer=setTimeout(function(){buttons[0].classList.remove('nudge');if(visible&&!active)show('mixed')},700)},1000)}
 }
 new IntersectionObserver(watch,{threshold:[0,.15,.5]}).observe(hero);
 var splash=document.getElementById('splash');if(splash)new MutationObserver(watch).observe(splash,{attributes:true,attributeFilter:['class','style']});
 document.addEventListener('visibilitychange',watch);window.addEventListener('hashchange',watch);window.addEventListener('resize',function(){navSpace();if(active)layout();watch()},{passive:true});calm.addEventListener('change',watch);
 /* one brand at a time, flipped in place, so the sentence never ends on a half-visible logo */
 setInterval(function(){if(!visible||!entered||document.hidden||calm.matches)return;var old=logos[brandIndex];brandIndex=(brandIndex+1)%logos.length;old.classList.remove('current');old.classList.add('leaving');logos[brandIndex].classList.add('current');setTimeout(function(){old.classList.remove('leaving')},700)},2400);
 setInterval(function(){if(!visible||!entered||document.hidden||calm.matches||buildTouched)return;flip(hb.getAttribute('aria-pressed')!=='true')},2800);
 compWire();

 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(active)layout()});
 watch();
})();

})();
/* =================== FOOTER: the sky ===================
   An ASCII sky behind the contact panel (Oct 21, from Aditya's direction after the koi): a fine grid of square cells
   where clouds drift, paper planes fly and leave contrails, and his tools float past: laptops, </> brackets and pen
   nibs. Each object is a real icon outline drawn into a small offscreen canvas, two pixels per cell, and read back per
   cell: well covered cells become tiles in the object's colour (the four pillar colours) with a dense glyph, thin edges
   get a grey glyph, clouds are white tiles and soft glyphs, contrails fade behind the planes. Sections:
   - tuning (TUNE, PIL, glyph ramps, ICON drawings): the place to adjust counts, sizes, speeds and looks;
   - simulation: planes wander, keep apart, wrap round the edges (open sky); tools and clouds drift on the wind; an
     idle/gather/burst/recovery state machine on simulation time: hovering or focusing the call makes the planes
     circle the panel, pressing it sends everything outward, then it settles;
   - renderer: one canvas, light mode; interactions: click the sky to launch a plane, a moving cursor nudges things.
   Runs only while the footer is on screen and the tab is visible; reduced motion gets a still sky. */
(function(){
  var box=document.getElementById("sky");if(!box)return;
  var cv=box.querySelector(".sky-cv"),g=cv.getContext("2d"),calm=matchMedia("(prefers-reduced-motion:reduce)"),coarse=matchMedia("(pointer:coarse)");
  var call=document.getElementById("footer-call"),panel=box.querySelector(".foot-contact"),hint=box.querySelector(".sky-hint");

  /* ---- tuning (px and seconds) ---- */
  var TUNE={cell:7,cellPhone:6,planeSpeed:[120,165],planeSize:[70,90],toolSize:[74,104],wind:[28,52],maxTurn:1.3,sepR:140,
    wGather:2.2,burstMul:2.6,burstDur:.55,recoverDur:2.4,trailFade:.75,launchMax:6};
  var PIL=[[255,212,78],[231,187,255],[180,246,184],[169,222,255]],INK=[56,55,60],BG=[247,247,244];
  var DENSE="#%@8&XS$",MID="Sxo%*+=X",LIGHT="t;:.,o'`",CH=DENSE+MID+LIGHT,OM=8,OL=16;
  function rgb(c,a){return a==null?"rgb("+c+")":"rgba("+c+","+a+")"}
  function mix(c,d,t){return [c[0]+(d[0]-c[0])*t|0,c[1]+(d[1]-c[1])*t|0,c[2]+(d[2]-c[2])*t|0]}
  /* the drawings, in a 24-unit box centred on 12,12 (outlines after the Lucide set) */
  function poly(c,pts){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill()}
  var ICON={
    plane:function(c,col){c.fillStyle=rgb(col);poly(c,[[22,2],[15,22],[11,13],[2,9]]);c.strokeStyle=rgb(mix(col,INK,.45));c.lineWidth=1.5;c.beginPath();c.moveTo(22,2);c.lineTo(11,13);c.stroke()},
    laptop:function(c,col){c.fillStyle=rgb(col);c.beginPath();c.roundRect(3,3.5,18,13,1.6);c.fill();c.fillStyle=rgb(mix(col,[255,255,255],.6));c.fillRect(5,5.5,14,9);
      c.fillStyle=rgb(INK,.75);c.fillRect(6.5,7.2,5,1.3);c.fillRect(8.5,9.6,7,1.3);c.fillRect(6.5,12,4,1.3);c.fillStyle=rgb(col);poly(c,[[.5,17.5],[23.5,17.5],[21.8,20.8],[2.2,20.8]])},
    code:function(c,col){c.strokeStyle=rgb(col);c.lineWidth=3.2;c.lineCap="round";c.lineJoin="round";c.beginPath();c.moveTo(8,5.5);c.lineTo(2,12);c.lineTo(8,18.5);c.moveTo(16,5.5);c.lineTo(22,12);c.lineTo(16,18.5);c.moveTo(14.2,3.5);c.lineTo(9.8,20.5);c.stroke()},
    pen:function(c,col){c.fillStyle=rgb(col);poly(c,[[18,13],[16.5,5.5],[2,2],[5.5,16.5],[13,18]]);c.fillStyle=rgb(mix(col,INK,.3));poly(c,[[12,19],[19,12],[22.5,15.5],[15.5,22.5]]);
      c.strokeStyle=rgb(INK,.8);c.lineWidth=1.4;c.beginPath();c.moveTo(2.5,2.5);c.lineTo(9.6,9.6);c.stroke();c.fillStyle=rgb([255,255,255]);c.beginPath();c.arc(11,11,2,0,Math.PI*2);c.fill()}};
  var KINDS=["laptop","code","pen"];

  var CS=10,AS=10,S=2,cols=0,rows=0,W=0,H=0,dpr=1,T=0,run=0,last=0,seen=false,warm=false,atlas=null,taps=0;
  var planes=[],tools=[],clouds=[],rings=[],trail=null,cov=null,cr=null,cg=null,cb=null,cloud=null;
  var oc=document.createElement("canvas"),ox=oc.getContext("2d",{willReadFrequently:true}),kc=document.createElement("canvas"),kx=kc.getContext("2d",{willReadFrequently:true});
  var mode="idle",modeT=0,pull=0,hov=false,ptr={x:-1e4,y:-1e4,t:-9},centre={x:0,y:0,w:0,h:0};
  function hash(a,b){var h=Math.sin(a*127.1+b*311.7)*43758.5453;return h-Math.floor(h)}
  function rnd(a,b,i,j){return a+(b-a)*hash(i,j)}
  function wrap(o,m){if(o.x<-m)o.x+=W+2*m;else if(o.x>W+m)o.x-=W+2*m;if(o.y<-m)o.y+=H+2*m;else if(o.y>H+m)o.y-=H+2*m}

  /* ---- the cast ---- */
  function plane(i,x,y,a){var sz=rnd(TUNE.planeSize[0],TUNE.planeSize[1],i,3)*(W<=760?.8:1);
    return {x:x,y:y,a:a,v:rnd(TUNE.planeSpeed[0],TUNE.planeSpeed[1],i,5),base:0,sz:sz,col:PIL[i%4],ph:hash(i,7)*40,wf:.25+hash(i,9)*.3,launched:false}}
  function tool(i){var sz=rnd(TUNE.toolSize[0],TUNE.toolSize[1],i,13)*(W<=760?.75:1);
    var a=hash(i,21)*Math.PI*2,v=rnd(TUNE.wind[0],TUNE.wind[1],i,19);
    return {kind:KINDS[i%3],x:rnd(0,W,i,15),y:rnd(H*.05,H*.95,i,17),vx:Math.cos(a)*v,vy:Math.sin(a)*v,v:v,sz:sz,col:PIL[(i+1)%4],ph:hash(i,23)*40,hop:hash(i,25)*3}}
  function cloudOf(i){var w=rnd(.1,.2,i,31)*Math.max(W,600),bl=[];for(var k=0;k<6;k++)bl.push([rnd(-.42,.42,i,40+k)*w,rnd(-.08,.12,i,50+k)*w,rnd(.12,.22,i,60+k)*w]);
    var a=hash(i,39)*Math.PI*2,v=rnd(16,32,i,37);
    return {x:rnd(0,W,i,33),y:rnd(H*.08,H*.92,i,35),vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,v:v,w:w,bl:bl,hop:hash(i,41)*5}}
  function populate(){var small=W<=760,np=small?2:3,nt=small?6:15,nc=small?4:7,i;
    while(planes.length<np){i=planes.length;planes.push(plane(i,rnd(0,W,i,1),rnd(H*.1,H*.9,i,2),hash(i,4)*Math.PI*2))}
    while(tools.length<nt)tools.push(tool(tools.length));
    while(clouds.length<nc)clouds.push(cloudOf(clouds.length))}

  /* ---- simulation ---- */
  function step(dt){T+=dt;modeT+=dt;
    var lure=hov||document.activeElement===call;
    if(mode==="burst"&&modeT>=TUNE.burstDur){mode="recovery";modeT=0}
    if(mode==="recovery"&&modeT>=TUNE.recoverDur){mode=lure?"gather":"idle";modeT=0}
    else if(mode==="idle"||mode==="gather")mode=lure?"gather":"idle";
    pull+=((mode==="gather"?1:0)-pull)*Math.min(1,dt/.3);
    var smul=mode==="burst"?TUNE.burstMul:mode==="recovery"?1+(TUNE.burstMul-1)*Math.pow(1-modeT/TUNE.recoverDur,2):1+.25*pull;
    rings=rings.filter(function(r){r.age+=dt;return r.age<r.life});
    var k=Math.exp(-dt*TUNE.trailFade);for(var i=0;i<trail.length;i++)trail[i]*=k;
    planes.forEach(function(p,i){
      /* wander: a slow personal bank left and right */
      var turn=Math.sin(T*p.wf+p.ph)*.55+Math.sin(T*p.wf*2.3+p.ph*1.7)*.25;
      /* keep apart from the other planes */
      planes.forEach(function(q,j){if(j===i)return;var dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);if(d<TUNE.sepR&&d>0)turn+=angTo(p.a,Math.atan2(dy,dx))*1.6*(1-d/TUNE.sepR)});
      /* gather: circle the panel on an oval just outside it */
      if(pull>.01){var ux=(p.x-centre.x)/(centre.w/2+90),uy=(p.y-centre.y)/(centre.h/2+90),pd=Math.hypot(ux,uy)||1,rad=Math.max(-1,Math.min(1,1-pd)),tx=-uy/pd,ty=ux/pd;
        if(tx*Math.cos(p.a)+ty*Math.sin(p.a)<0){tx=-tx;ty=-ty}turn+=angTo(p.a,Math.atan2(ty+uy/pd*rad*2.2,tx+ux/pd*rad*2.2))*TUNE.wGather*pull}
      /* a moving cursor nearby makes them veer off */
      if(T-ptr.t<.35){var qx=p.x-ptr.x,qy=p.y-ptr.y,qd=Math.hypot(qx,qy);if(qd<110)turn+=angTo(p.a,Math.atan2(qy,qx))*2*(1-qd/110)}
      p.a+=Math.max(-TUNE.maxTurn,Math.min(TUNE.maxTurn,turn))*dt*(mode==="burst"?.3:1);p.bank=turn;
      var v=p.v*smul;p.x+=Math.cos(p.a)*v*dt;p.y+=Math.sin(p.a)*v*dt;
      /* the contrail, laid from just behind the tail */
      var tx2=(p.x-Math.cos(p.a)*p.sz*.42)/CS,ty2=(p.y-Math.sin(p.a)*p.sz*.42)/CS,cx=Math.floor(tx2),cy=Math.floor(ty2);
      if(cx>=0&&cy>=0&&cx<cols&&cy<rows)trail[cy*cols+cx]=Math.max(trail[cy*cols+cx],.85);
      wrap(p,p.sz)});
    /* tools hop about: every few seconds each one kicks off in a new direction, then glides back to its cruising
       speed; they push off each other (and off the planes) so no two drawings ever sit on top of one another */
    tools.forEach(function(t,i){var w=1+(smul-1)*.6;
      t.hop-=dt;if(t.hop<=0){var na=hash(t.ph,T)*Math.PI*2,kick=t.v*rnd(1.6,2.6,t.ph,T);t.vx=t.vx*.3+Math.cos(na)*kick;t.vy=t.vy*.3+Math.sin(na)*kick;t.hop=rnd(1.6,3.6,T,t.ph)}
      tools.concat(planes).forEach(function(q,j){if(q===t)return;var dx=t.x-q.x,dy=t.y-q.y,d=Math.hypot(dx,dy)||1,m=(t.sz+q.sz)*.62;
        if(d<m){var f=(1-d/m)*420*dt;t.vx+=dx/d*f;t.vy+=dy/d*f;if(j<tools.length&&d<m*.7){t.x+=dx/d*(m*.7-d)*.5;t.y+=dy/d*(m*.7-d)*.5}}});
      var sp=Math.hypot(t.vx,t.vy)||1,ease=1+(t.v/sp-1)*Math.min(1,dt*1.4);t.vx*=ease;t.vy*=ease;
      t.x+=t.vx*w*dt;t.y+=t.vy*w*dt;layTrail(t.x-t.vx/sp*t.sz*.45,t.y-t.vy/sp*t.sz*.45,.6);wrap(t,t.sz)});
    clouds.forEach(function(c){c.hop-=dt;if(c.hop<=0){var na=hash(c.w,T)*Math.PI*2;c.vx=c.vx*.4+Math.cos(na)*c.v*1.4;c.vy=c.vy*.4+Math.sin(na)*c.v*.9;c.hop=rnd(3,6,T,c.w)}
      var sp=Math.hypot(c.vx,c.vy)||1,ease=1+(c.v/sp-1)*Math.min(1,dt*.8);c.vx*=ease;c.vy*=ease;
      c.x+=c.vx*dt*(1+(smul-1)*.3);c.y+=c.vy*dt*(1+(smul-1)*.3);if(T-ptr.t<.35){var dy=c.y-ptr.y;if(Math.abs(c.x-ptr.x)<c.w*.5&&Math.abs(dy)<c.w*.25)c.y+=(dy<0?-1:1)*8*dt}
      layTrail(c.x-c.vx/sp*c.w*.55,c.y-c.vy/sp*c.w*.55+(hash(c.w,Math.floor(T*8))-.5)*c.w*.12,.45);wrap(c,c.w*.6)})}
  /* a fading trail cell, the same field the planes' contrails use */
  function layTrail(x,y,s){var cx=Math.floor(x/CS),cy=Math.floor(y/CS);if(cx>=0&&cy>=0&&cx<cols&&cy<rows)trail[cy*cols+cx]=Math.max(trail[cy*cols+cx],s)}
  function angTo(a,b){var d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d}
  function burst(){mode="burst";modeT=0;planes.forEach(function(p){p.a=Math.atan2(p.y-centre.y,p.x-centre.x)+(hash(p.ph,T)-.5)*.6});
    tools.forEach(function(t){var dx=t.x-centre.x,dy=t.y-centre.y,d=Math.hypot(dx,dy)||1;t.vx+=dx/d*90;t.vy+=dy/d*90});rings.push({x:centre.x,y:centre.y,age:0,life:1.3,v:600})}

  /* ---- drawing the objects into the cell buffer ---- */
  function stamp(kind,x,y,a,sz,col){var k=S/CS;ox.setTransform(1,0,0,1,0,0);ox.translate(x*k,y*k);ox.rotate(a);ox.scale(sz*k/24,sz*k/24);ox.translate(-12,-12);ICON[kind](ox,col)}
  function compose(){ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,oc.width,oc.height);
    tools.forEach(function(t){stamp(t.kind,t.x,t.y,Math.sin(T*.5+t.ph)*.22,t.sz,t.col)});
    /* the plane's nose leads: the drawing points up and right, so turn it a quarter less; a bank squeezes it a little */
    planes.forEach(function(p){stamp("plane",p.x,p.y,p.a+Math.PI/4,p.sz,p.col)});
    kx.setTransform(1,0,0,1,0,0);kx.clearRect(0,0,kc.width,kc.height);kx.setTransform(1/CS,0,0,1/CS,0,0);
    clouds.forEach(function(c){c.bl.forEach(function(b){var gr=kx.createRadialGradient(c.x+b[0],c.y+b[1],0,c.x+b[0],c.y+b[1],b[2]);gr.addColorStop(0,"rgba(0,0,0,1)");gr.addColorStop(.55,"rgba(0,0,0,.8)");gr.addColorStop(1,"rgba(0,0,0,0)");
      kx.fillStyle=gr;kx.beginPath();kx.arc(c.x+b[0],c.y+b[1],b[2],0,Math.PI*2);kx.fill()})})}

  /* ---- renderer ---- */
  function buildAtlas(){AS=Math.round(CS*dpr);atlas=document.createElement("canvas");atlas.width=AS*CH.length;atlas.height=AS*2;var c=atlas.getContext("2d");
    c.font="600 "+Math.round(CS*.78*dpr)+"px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";c.textAlign="center";c.textBaseline="middle";
    for(var r=0;r<2;r++){c.fillStyle=r?"#fff":"#000";for(var i=0;i<CH.length;i++)c.fillText(CH[i],i*AS+AS/2,r*AS+AS/2+.5*dpr)}}
  function glyph(i,row,al,x,y){g.globalAlpha=al;g.drawImage(atlas,i*AS,row*AS,AS,AS,x,y,CS,CS)}
  function render(){if(!cols||!atlas)return;var Wp=cols*S,od=ox.getImageData(0,0,Wp,rows*S).data,kd=kx.getImageData(0,0,cols,rows).data,nr=rings.length;
    g.globalAlpha=1;g.fillStyle=rgb(BG);g.fillRect(0,0,W,H);
    g.strokeStyle="rgba(19,19,22,.045)";g.lineWidth=1;g.beginPath();for(var x=0;x<=cols;x++){g.moveTo(x*CS+.5,0);g.lineTo(x*CS+.5,H)}for(var y=0;y<=rows;y++){g.moveTo(0,y*CS+.5);g.lineTo(W,y*CS+.5)}g.stroke();
    for(y=0;y<rows;y++)for(x=0;x<cols;x++){var A=0,R=0,G=0,B=0;
      for(var sy=0;sy<S;sy++)for(var sx=0;sx<S;sx++){var o=((y*S+sy)*Wp+x*S+sx)*4,al=od[o+3];A+=al;R+=od[o]*al;G+=od[o+1]*al;B+=od[o+2]*al}
      var a=A/(255*S*S),X0=x*CS,Y0=y*CS,hh=hash(x,y),i=y*cols+x;
      if(a>=.45){var r=R/A,gg=G/A,b=B/A,jt=1+(hh-.5)*.06;r=Math.min(255,r*jt);gg=Math.min(255,gg*jt);b=Math.min(255,b*jt);
        g.globalAlpha=1;g.fillStyle="rgb("+(r|0)+","+(gg|0)+","+(b|0)+")";g.fillRect(X0+1,Y0+1,CS-1,CS-1);
        var dark=(.299*r+.587*gg+.114*b)/255<.42;glyph(a>=.75?Math.floor(hh*8+a*3)%8:OM+Math.floor(hh*8)%8,dark?1:0,dark?.6:.45,X0,Y0);continue}
      if(a>=.12){glyph(OM+Math.floor(hh*8)%8,0,.4,X0,Y0);continue}
      var ring=0;for(var k=0;k<nr;k++){var rg=rings[k],e=Math.abs(Math.hypot(X0+CS/2-rg.x,Y0+CS/2-rg.y)-(8+rg.age*rg.v))/CS;if(e<.8)ring=Math.max(ring,(1-e/.8)*(1-rg.age/rg.life))}
      if(ring>.15){glyph(OL+Math.floor(hh*8)%8,0,Math.min(.6,ring*.8),X0,Y0);continue}
      /* clouds: white tiles in the thick of them, soft grey glyphs thinning out to the edge */
      var cd=kd[i*4+3]/255;
      if(cd>.5){g.globalAlpha=Math.min(1,(cd-.5)*2.6);g.fillStyle="#FFFFFF";g.fillRect(X0+1,Y0+1,CS-1,CS-1)}
      if(cd>.15&&hh<cd*.9){glyph(OL+Math.floor(hh*8+cd*3)%8,0,.1+cd*.16,X0,Y0);continue}
      var tw=trail[i];if(tw>.08)glyph(OL+Math.floor(hh*8+tw*2)%8,0,Math.min(.5,tw*.65),X0,Y0)}
    g.globalAlpha=1}

  /* ---- layout ---- */
  function measure(){var b=box.getBoundingClientRect(),r=panel.getBoundingClientRect();centre.x=r.left+r.width/2-b.left;centre.y=r.top+r.height/2-b.top;centre.w=r.width;centre.h=r.height}
  function size(){var w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
    var ncs=w<=760?TUNE.cellPhone:TUNE.cell;box.style.setProperty("--cs",ncs+"px");dpr=Math.min(2,window.devicePixelRatio||1);
    /* keep everything where it was in the sky, in proportion */
    if(W&&H)planes.concat(tools,clouds).forEach(function(o){o.x*=w/W;o.y*=h/H});
    CS=ncs;W=w;H=h;cols=Math.ceil(W/CS);rows=Math.ceil(H/CS);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);g.setTransform(dpr,0,0,dpr,0,0);
    oc.width=cols*S;oc.height=rows*S;kc.width=cols;kc.height=rows;trail=new Float32Array(cols*rows);
    populate();buildAtlas();measure();
    if(!warm){warm=true;for(var i=0;i<200;i++)step(1/60)}
    compose();render()}
  function frame(now){run=requestAnimationFrame(frame);if(last&&now-last<28)return;var dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;step(dt);compose();render()}
  function check(){var want=seen&&!document.hidden&&!calm.matches&&cols>0;
    if(want&&!run){last=0;run=requestAnimationFrame(frame)}else if(!want&&run){cancelAnimationFrame(run);run=0;compose();render()}}

  /* ---- interactions ---- */
  call.addEventListener("pointerenter",function(){hov=true});call.addEventListener("pointerleave",function(){hov=false});
  call.addEventListener("pointerdown",function(){if(!calm.matches)burst()});
  call.addEventListener("keydown",function(e){if(e.key==="Enter"&&!calm.matches)burst()});
  /* a click on open sky launches a new paper plane from there, heading away from the panel */
  box.addEventListener("pointerdown",function(e){if(calm.matches||e.button>0||e.target.closest("a,button,.foot-contact,.foot-in"))return;
    var b=box.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top,launched=planes.filter(function(p){return p.launched});
    if(launched.length>=TUNE.launchMax)planes.splice(planes.indexOf(launched[0]),1);
    var p=plane(planes.length+taps*7,x,y,Math.atan2(y-centre.y,x-centre.x));p.launched=true;planes.push(p);taps++;rings.push({x:x,y:y,age:0,life:1.2,v:110});
    if(window.hgFound)window.hgFound("plane")});
  box.addEventListener("pointermove",function(e){if(e.pointerType==="touch")return;var b=box.getBoundingClientRect();ptr.x=e.clientX-b.left;ptr.y=e.clientY-b.top;ptr.t=T},{passive:true});
  box.addEventListener("pointerleave",function(){ptr.t=Math.min(ptr.t,T-.2)});
  if(coarse.matches)hint.textContent="tap the sky to launch a plane";
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){seen=es[0].isIntersecting;check()}).observe(box);else seen=true;
  document.addEventListener("visibilitychange",check);calm.addEventListener("change",check);
  if(window.ResizeObserver)new ResizeObserver(function(){size();check()}).observe(box);else window.addEventListener("resize",function(){size();check()});
  size();check();
  /* test hooks: read the state, or run the simulation without waiting on frames */
  window.skyDebug={state:function(){return {planes:planes.length,tools:tools.length,clouds:clouds.length,taps:taps,rings:rings.length,mode:mode,pull:pull,running:!!run,cols:cols,rows:rows,W:W,H:H,cs:CS,
      centre:[centre.x,centre.y,centre.w,centre.h],heads:planes.map(function(p){return [p.x,p.y]}),speeds:planes.map(function(p){return p.v}),toolsAt:tools.map(function(t){return [t.x,t.y,t.sz]}),cloudsAt:clouds.map(function(c){return [c.x,c.y]}),trailCells:trail?Array.prototype.filter.call(trail,function(v){return v>.08}).length:0,
      bad:planes.concat(tools,clouds).some(function(o){return !isFinite(o.x)||!isFinite(o.y)}),T:T}},
    step:function(n,dt){for(var i=0;i<n;i++)step(dt||1/60);compose();render()},tune:TUNE};
})();

/* =================== perf: pause doodles that are off screen =================== */
(function(){if(!("IntersectionObserver" in window))return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle("offs",!e.isIntersecting)})},{rootMargin:"120px 0px"});
  function scan(){Array.prototype.forEach.call(document.querySelectorAll(".doo:not([data-io]),.fig:not([data-io]),.brand-window:not([data-io])"),function(d){d.dataset.io=1;io.observe(d)})}
  scan();setTimeout(scan,800);window.addEventListener("hashchange",function(){setTimeout(scan,300)})})();
/* Lab fetches only on /lab. Rows use still covers; videos load only in the open detail dialog. */
(function(){
  var root=document.getElementById('v-lab'),rows=document.getElementById('labRows'),message=document.getElementById('labMessage'),retry=document.getElementById('labRetry');
  var dialog=document.getElementById('labDialog'),close=document.getElementById('labClose'),media=document.getElementById('labMedia');
  var kinds=['Interactions','Components','Templates','Websites','Prompts','Skills'],entries=[],loaded=false,loading=false,current=null,opener=null,pushed=false;
  var calm=matchMedia('(prefers-reduced-motion:reduce)'),feed='/lab.json';
  function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n}
  function url(s){if(!s)return '';try{var u=new URL(s,location.origin);return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}}
  function normalize(d){if(!d||d.published!==true||!d.slug||!d.title||kinds.indexOf(d.category)<0||!url(d.cover))return null;
    return {slug:String(d.slug),title:String(d.title),category:d.category,description:String(d.description||''),tool:String(d.tool||''),cover:url(d.cover),alt:String(d.alt||d.title),video:url(d.video),link:url(d.link),repository:url(d.repositoryUrl),instructions:String(d.instructions||'')}}
  function onLab(){return HASH()==='#/lab'}
  var labels={Interactions:'Interactions',Components:'Components',Templates:'Templates',Websites:'Websites',Prompts:'Image prompts',Skills:'AI skills'};
  var resetTools=previewTools(dialog,'lab'),resetSummary=previewSummary(dialog,'lab');
  function card(d){var article=el('article','lab-card'),b=el('button'),preview=el('span','lab-card-preview'),img=portfolioImage();
    b.type='button';b.setAttribute('aria-label','Open '+d.title);img.src=d.cover;img.alt=d.alt;img.width=608;img.height=456;
    preview.append(img,el('span','lab-card-arrow','↗'));preview.lastChild.setAttribute('aria-hidden','true');b.append(preview,el('span','lab-card-name',d.title));article.appendChild(b);
    b.onclick=function(){opener=b;pushed=true;var u=new URL(location.href);u.search='?item='+encodeURIComponent(d.slug);u.hash='';history.pushState(null,'',u);open(d)};return article}
  function moving(){rows.querySelectorAll('.lab-row').forEach(function(row){row.classList.toggle('moving',!calm.matches&&row.firstGroup.scrollWidth>row.rail.clientWidth)})}
  var visibleRows='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('lab-offscreen',!e.isIntersecting)})},{rootMargin:'150px'}):null;
  var observer='ResizeObserver' in window?new ResizeObserver(moving):null;
  function draw(){if(observer)observer.disconnect();if(visibleRows)visibleRows.disconnect();rows.replaceChildren();
    kinds.forEach(function(k){var items=entries.filter(function(d){return d.category===k});if(!items.length)return;
      var row=el('section','lab-row'),head=el('h2','wrap',labels[k]),rail=el('div','lab-rail'),track=el('div','lab-track'),group=el('div','lab-group');
      row.id='lab-section-'+k.toLowerCase();head.id=row.id+'-title';row.setAttribute('aria-labelledby',head.id);rail.setAttribute('aria-label',k+' previews');rail.tabIndex=0;rail.addEventListener('pointerdown',function(e){if(e.pointerType==='touch'){row.classList.add('lab-manual')}});
      items.forEach(function(d){group.appendChild(card(d))});track.appendChild(group);var copy=group.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.inert=true;track.appendChild(copy);
      rail.appendChild(track);row.append(head,rail);row.firstGroup=group;row.rail=rail;row.style.setProperty('--lab-duration',Math.max(40,items.length*12)+'s');rows.appendChild(row);
      if(observer)observer.observe(rail);if(visibleRows)visibleRows.observe(row)});
    message.textContent=entries.length?'':'The first experiments are on their way. Come back to explore.';
    window.decorateSectionHeadings();requestAnimationFrame(moving)}
  calm.addEventListener('change',moving);
  function stopMedia(){media.querySelectorAll('video').forEach(function(v){v.pause();v.removeAttribute('src');v.load()});media.replaceChildren()}
  function open(d){current=d;stopMedia();resetTools();dialog.style.removeProperty('--lab-ar');var m=el(d.video?'video':'img');
    function fit(){if(current!==d)return;var w=m.videoWidth||m.naturalWidth,h=m.videoHeight||m.naturalHeight;if(w&&h)dialog.style.setProperty('--lab-ar',w/h)}
    m.addEventListener(d.video?'loadedmetadata':'load',fit);if(d.video){m.controls=true;m.playsInline=true;m.preload='metadata';m.poster=d.cover;m.src=d.video;m.setAttribute('aria-label',d.title+' preview')}else{m.src=d.cover;m.alt=d.alt}media.appendChild(m);
    document.getElementById('labTitle').textContent=d.title;document.getElementById('labMeta').textContent=[labels[d.category],d.tool].filter(Boolean).join(' · ');
    document.getElementById('labDescription').textContent=d.description;var link=document.getElementById('labLink');link.hidden=!d.link;link.removeAttribute('href');if(d.link)link.href=d.link;
    var linkLabel=d.category==='Components'?'Get component ↗':d.category==='Interactions'?'Open demo ↗':d.category==='Templates'?'Get template ↗':d.category==='Websites'?'View website':'Open resource';
    link.querySelector('span').textContent=linkLabel.replace(' ↗','');link.setAttribute('aria-label',linkLabel.replace(' ↗',''));link.title=linkLabel.replace(' ↗','');
    var source=document.getElementById('labSource');source.hidden=!d.repository;source.removeAttribute('href');if(d.repository)source.href=d.repository;document.getElementById('labActions').hidden=!(d.link||d.repository);
    document.getElementById('labInstructions').hidden=!d.instructions;document.getElementById('labInstructionsTitle').textContent=d.category==='Prompts'?'The prompt':'Try it yourself';
    document.getElementById('labText').textContent=d.instructions;document.getElementById('labCopyStatus').textContent='';
    if(!dialog.open){dialog.showModal();document.body.classList.add('lab-open')}resetSummary(!!d.instructions);dialog.scrollTop=0;close.focus({preventScroll:true})}
  function dismiss(back){if(dialog.open)dialog.close();stopMedia();current=null;document.body.classList.remove('lab-open');
    if(back&&pushed){pushed=false;history.back()}else if(back){var u=new URL(location.href);u.searchParams.delete('item');history.replaceState(null,'',u)}
    if(opener&&opener.isConnected)opener.focus({preventScroll:true})}
  close.onclick=function(){dismiss(true)};dialog.addEventListener('cancel',function(e){e.preventDefault();dismiss(true)});
  dialog.addEventListener('click',function(e){if(e.target===dialog)dismiss(true)});
  document.getElementById('labCopy').onclick=async function(){if(!current)return;var status=document.getElementById('labCopyStatus');try{await navigator.clipboard.writeText(current.instructions);status.textContent='Copied. Ready to paste.'}catch(e){status.textContent='Select the text below to copy it.';var range=document.createRange();range.selectNodeContents(document.getElementById('labText'));var s=getSelection();s.removeAllRanges();s.addRange(range)}};
  function linked(){var slug=new URLSearchParams(location.search).get('item');if(!slug){if(dialog.open)dismiss(false);return}var d=entries.find(function(e){return e.slug===slug});if(d){if(current!==d)open(d)}else{if(dialog.open)dismiss(false);message.textContent='This post is not available. Explore the other experiments below.'}}
  async function load(){if(loading)return;loading=true;retry.hidden=true;message.textContent='Loading the lab…';var ctl=new AbortController(),t=setTimeout(function(){ctl.abort()},8000);
    try{var res=await fetch(feed,{signal:ctl.signal});if(res.status===404){message.textContent='The lab is coming soon.';return}if(!res.ok)throw Error('Lab request failed');var data=await res.json();if(!Array.isArray(data.entries))throw Error('Invalid Lab feed');
      var seen=new Set();entries=data.entries.map(normalize).filter(function(d){if(!d||seen.has(d.slug))return false;seen.add(d.slug);return true});loaded=true;draw();if(onLab())linked()}
    catch(e){message.textContent='The lab could not load. Please try again.';retry.hidden=false}finally{clearTimeout(t);loading=false}}
  retry.onclick=load;
  function sync(){root.classList.toggle('lab-hidden',!onLab()||document.hidden);if(!onLab()){if(dialog.open)dismiss(false);pushed=false;rows.querySelectorAll('.lab-manual').forEach(function(row){row.classList.remove('lab-manual')});return}if(!loaded)load();else linked()}
  document.addEventListener('visibilitychange',sync);window.addEventListener('hashchange',sync);window.addEventListener('resize',moving);
  sync();
})();
