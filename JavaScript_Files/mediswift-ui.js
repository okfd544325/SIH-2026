(function(){
'use strict';
const pages={
  home:{title:'MediSwift',sub:'Healthcare, connected end to end.'},
  medicines:{title:'Medicine Store',sub:'Browse the approved catalogue, review medicine information and manage your cart.',action:['Open cart','/cart.html']},
  appointments:{title:'Appointments',sub:'Find doctors, book consultations and keep your appointments in one place.',action:['My profile','#profile']},
  assistant:{title:'AI Assistant',sub:'A focused workspace for general medicine and healthcare information.',action:['Medicines','/medicines.html']},
  prescription:{title:'Prescription',sub:'Upload prescription details and continue your medicine workflow.',action:['Medicine store','/medicines.html']},
  cart:{title:'Your Cart',sub:'Review selected items before checkout.',action:['Checkout','/checkout.html']},
  checkout:{title:'Checkout',sub:'Confirm saved delivery details and place your order.',action:['Back to cart','/cart.html']},
  tracking:{title:'Order Tracking',sub:'Review the latest order status from your MediSwift account.',action:['My orders','#profile']}
};
const nav=[['Home','/','⌂','home'],['Medicines','/medicines.html','✚','medicines'],['Doctors','/appointments.html','◉','appointments'],['AI','/ai-assistant.html','✦','assistant'],['Rx','/prescription.html','▱','prescription'],['Cart','/cart.html','◫','cart']];
const current=()=>document.body.dataset.page||'home';
function injectShell(){
  document.body.insertAdjacentHTML('afterbegin','<div class="ms-toast-wrap" id="msToasts"></div>');
  document.body.insertAdjacentHTML('beforeend',`<div class="ms-status" id="msStatus"><span class="ms-status-dot"></span><span id="msStatusText">Connecting…</span></div>
  <nav class="ms-dock" aria-label="MediSwift quick navigation">${nav.map(x=>`<a href="${x[1]}" data-page="${x[3]}" title="${x[0]}"><span class="ms-dock-icon">${x[2]}</span><span class="ms-dock-label">${x[0]}</span></a>`).join('')}<button id="msCommandBtn" title="Quick actions"><span class="ms-dock-icon">⌘</span><span class="ms-dock-label">Quick</span></button><button id="msThemeBtn" title="Theme"><span class="ms-dock-icon">◐</span></button></nav>
  <div class="ms-command" id="msCommand"><div class="ms-command-box"><input class="ms-command-input" id="msCommandInput" placeholder="Jump to anything…  Ctrl/⌘ + K" autocomplete="off"><div class="ms-command-list" id="msCommandList"></div></div></div>`);
  document.querySelectorAll('.ms-dock [data-page]').forEach(a=>{if(a.dataset.page===current())a.classList.add('active')});
}
function enhanceHero(){
  if(current()!=='home')return;
  const badge=document.querySelector('.hero-badge'); if(badge)badge.innerHTML='*';
  const title=document.querySelector('.hero-title'); if(title)title.innerHTML='Medical <br>care to Your Dooestep. <span class="gradient-text"> With Live Docter Consultation</span>';
  // Preserve the original hero image already present in index.html; do not replace it with the Care Console.
}
function injectExperience(){
  if(current()!=='home')return;
  const anchor=document.getElementById('quickActions'); if(!anchor)return;
  const sec=document.createElement('section');sec.id='mediswiftDeck';sec.className='ms-experience';
  sec.innerHTML=`<div class="container"><div class="ms-experience-head"><div><div class="ms-eyebrow">Built around the patient journey</div><h2 class="section-title">Less hunting. More doing.</h2></div><p>MediSwift now behaves like a real product suite: every major task has its own page, persistent account data stays connected, and the interface keeps your next action obvious.</p></div><div class="ms-experience-grid">
    <a class="ms-exp-card large" href="/medicines.html"><span class="ms-exp-arrow">↗</span><div class="ms-exp-icon">✚</div><h3>Medicine discovery that feels instant</h3><p>Search the approved catalogue, add available products to your cart and continue checkout without jumping through a long landing page.</p><span class="ms-exp-number">01</span></a>
    <a class="ms-exp-card" href="/appointments.html"><span class="ms-exp-arrow">↗</span><div class="ms-exp-icon">◉</div><h3>Consultations</h3><p>Doctor discovery and appointment management in a dedicated workspace.</p><span class="ms-exp-number">02</span></a>
    <a class="ms-exp-card" href="/prescription.html"><span class="ms-exp-arrow">↗</span><div class="ms-exp-icon">▱</div><h3>Prescription flow</h3><p>A focused place for prescription uploads and review.</p><span class="ms-exp-number">03</span></a>
    <a class="ms-exp-card" href="/ai-assistant.html"><span class="ms-exp-arrow">↗</span><div class="ms-exp-icon">✦</div><h3>AI information</h3><p>General medicine and healthcare information, separated from ordering decisions.</p><span class="ms-exp-number">04</span></a>
    <a class="ms-exp-card" href="/tracking.html"><span class="ms-exp-arrow">↗</span><div class="ms-exp-icon">⌁</div><h3>Order visibility</h3><p>Tracking and order context stay accessible without returning to the homepage.</p><span class="ms-exp-number">05</span></a>
  </div></div>`;
  anchor.insertAdjacentElement('afterend',sec);
}
function injectPageHero(){
  if(current()==='home')return;
  const main=document.querySelector('main'); if(!main)return;
  const info=pages[current()]||pages.home;
  const sec=document.createElement('section'); sec.className='ms-page-hero';
  const action=info.action?`<a class="btn btn-secondary" href="${info.action[1]}">${info.action[0]} ↗</a>`:'';
  sec.innerHTML=`<div class="container"><div class="ms-page-shell"><div><div class="ms-eyebrow">MediSwift workspace</div><h1 class="ms-page-title">${info.title}</h1><p class="ms-page-copy">${info.sub}</p></div><div class="ms-page-actions">${action}<a class="btn btn-primary" href="/">Home</a></div></div></div>`;
  main.prepend(sec);
}
function commandItems(q=''){
  const extra=[['Checkout','/checkout.html','X'],['Tracking','/tracking.html','T']];
  return [...nav.map(x=>[x[0],x[1],x[2]]),...extra].filter(x=>x[0].toLowerCase().includes(q.toLowerCase())).map(x=>`<a class="ms-command-item" href="${x[1]}"><span>${x[2]} &nbsp; ${x[0]}</span><span class="ms-key">OPEN</span></a>`).join('');
}
function initCommand(){
  const modal=document.getElementById('msCommand'),input=document.getElementById('msCommandInput'),list=document.getElementById('msCommandList');
  const open=()=>{modal.classList.add('open');list.innerHTML=commandItems();setTimeout(()=>input.focus(),20)};const close=()=>modal.classList.remove('open');
  document.getElementById('msCommandBtn').onclick=open;input.addEventListener('input',()=>list.innerHTML=commandItems(input.value));modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()}if(e.key==='Escape')close()});
}
function toast(msg){const w=document.getElementById('msToasts');if(!w)return;const n=document.createElement('div');n.className='ms-toast';n.textContent=msg;w.appendChild(n);setTimeout(()=>n.remove(),2400)}
function initTheme(){const b=document.getElementById('msThemeBtn');if(localStorage.getItem('msTheme')==='dark')document.body.classList.add('ms-dark');b.onclick=()=>{document.body.classList.toggle('ms-dark');localStorage.setItem('msTheme',document.body.classList.contains('ms-dark')?'dark':'light');toast(document.body.classList.contains('ms-dark')?'Dark mode enabled':'Light mode enabled')}}
async function health(){const el=document.getElementById('msStatus'),txt=document.getElementById('msStatusText'),metric=document.getElementById('msBackendMetric');try{const r=await fetch(((window.location && window.location.protocol === 'file:') ? 'http://localhost:3000/api' : '/api'),{cache:'no-store'});if(!r.ok)throw new Error();el.classList.remove('bad');el.classList.add('ok');txt.textContent='Backend online';if(metric){metric.textContent='100%';metric.style.color='#10b981'}}catch(e){el.classList.add('bad');el.classList.remove('ok');txt.textContent='Backend unavailable';if(metric){metric.textContent='OFF';metric.style.color='#ef4444'}}}
function polish(){
  document.title=(current()==='home'?'MediSwift':(pages[current()]?.title||'MediSwift')+' — MediSwift');
  document.querySelectorAll('.logo-sub').forEach(e=>e.textContent='Nanded • connected healthcare');
  document.querySelectorAll('.logo-name').forEach(e=>{e.innerHTML='MediSwift'});
  setTimeout(()=>document.body.classList.add('ms-ready'),20);
}
document.addEventListener('DOMContentLoaded',()=>{polish();injectShell();enhanceHero();injectExperience();injectPageHero();initCommand();initTheme();health();setInterval(health,60000)});
})();
