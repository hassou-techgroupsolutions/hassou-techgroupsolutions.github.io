(()=>{'use strict';
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
 const motionOK=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 const root=document.documentElement;
 try{const saved=localStorage.getItem('hassou-color-mode');if(saved==='dark'||saved==='light')root.dataset.theme=saved;}catch{}
 $$('[data-theme-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const next=root.dataset.theme==='light'?'dark':'light';root.dataset.theme=next;try{localStorage.setItem('hassou-color-mode',next);}catch{}}));
 
 const header=$('#siteHeader'),menu=$('.menu-toggle'),nav=$('#primaryNav');
 if(menu&&nav){
   const closeMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation menu');const span=menu.querySelector('span');if(span)span.textContent='☰';};
   menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');const span=menu.querySelector('span');if(span)span.textContent=open?'✕':'☰';});
   $$('a',nav).forEach(a=>a.addEventListener('click',closeMenu));
   document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
 }
 
 const sections=$$('main > section[id]');const railPrev=$('#scrollPrev'),railNext=$('#scrollNext'),railLabel=$('#railLabel');let current=0,lastScroll=scrollY;
 function updateActive(){
   const pos=scrollY+innerHeight*.42;let found=0;
   sections.forEach((s,i)=>{if(s.offsetTop<=pos)found=i;});current=found;
   $$('.main-nav a').forEach(a=>{const id=a.getAttribute('href').split('#').pop();a.classList.toggle('active',sections[found]&&id===sections[found].id)});
   if(railLabel)railLabel.textContent=String(found+1).padStart(2,'0')+'/'+String(sections.length).padStart(2,'0');
   if(railPrev)railPrev.disabled=found===0;if(railNext)railNext.disabled=found>=sections.length-1;
   if(header)header.classList.toggle('scrolled',scrollY>35);
   if(motionOK)document.body.classList.toggle('scroll-up',scrollY<lastScroll);
   lastScroll=scrollY;
 }
 if(sections.length){
   railPrev?.addEventListener('click',()=>sections[Math.max(0,current-1)].scrollIntoView({behavior:motionOK?'smooth':'auto'}));
   railNext?.addEventListener('click',()=>sections[Math.min(sections.length-1,current+1)].scrollIntoView({behavior:motionOK?'smooth':'auto'}));
   addEventListener('scroll',()=>requestAnimationFrame(updateActive),{passive:true});updateActive();
 }else{$$('.rail').forEach(x=>x.remove());}
 
 if(motionOK&&'IntersectionObserver'in window){
   document.body.classList.add('js-motion');
   const io=new IntersectionObserver(entries=>{entries.forEach((entry,index)=>{if(entry.isIntersecting){entry.target.style.transitionDelay=(index%5)*'.05'+'s';entry.target.classList.add('visible');io.unobserve(entry.target);}})},{threshold:.08,rootMargin:'0px 0px -22px 0px'});
   $$('.reveal').forEach(el=>io.observe(el));
 }
 
 // Service explorer
 const serviceData={
   webapp:{title:'Web & Application Development',lead:'Responsive websites, portals, web apps, role-based dashboards and workflow-focused interfaces.',includes:'Responsive websites, portals, web apps, role-based dashboards and workflow-focused interfaces.',bestfor:'Launching a new idea, turning a manual process into an online tool or improving a user-facing platform.',related:'Angono NHS Career Assessment · HowCan-i-Help · selected HASSOU interfaces'},
   systems:{title:'Custom Systems & Databases',lead:'Business logic, modules, records, role permissions, reporting, dashboards and structured data workflows.',includes:'Management systems, role-based records, dashboards, reports, scheduling, inventories and database-backed workflows.',bestfor:'Organizations that need organized records, clearer workflows and dependable data handling.',related:'RHU Morong Health System · Menguito Businesses MIS · RSST SHS Credentials'},
   uiux:{title:'UI/UX & Visual Identity',lead:'Interface refinement, responsive layouts, usability improvements, brand-aligned assets and experience polishing.',includes:'Responsive improvements, interface design, user-flow refinement, brand-aligned graphics and visual consistency.',bestfor:'Projects that already function but need clearer interaction, stronger presentation and a more consistent identity.',related:'Angono NHS Career Assessment · MBMIS interface refinement'},
   qa:{title:'Software Maintenance & QA',lead:'Bug review, QA passes, workflow checks, refinement requests and supported feature updates.',includes:'Feature review, debugging, QA passes, maintenance requests, validation and supported refinements.',bestfor:'Existing or unfinished systems that need fixes, stabilization or guided enhancement.',related:'RSST SHS Credentials · supported enhancement workflows'},
   support:{title:'IT Support & Troubleshooting',lead:'Configuration help, deployment guidance, issue diagnosis and practical technical support within the team\'s supported scope.',includes:'Troubleshooting, supported configuration help, deployment guidance and practical technical direction.',bestfor:'Teams or individuals who need technical direction before committing to a larger system project.',related:'Technical guidance and deployment support across project workflows'},
   capstone:{title:'Capstone & Thesis Support',lead:'Guided implementation help, documentation review, QA, demonstration preparation and technical consultation.',includes:'Guided development assistance, documentation review, QA, demo preparation and technical consultation.',bestfor:'Student projects that need structured support while preserving the student\'s own understanding and defense responsibility.',related:'RHU Morong thesis · Angono Career Assessment · RSST-related academic work'}
 };
 const serviceCards=$$('.service-card[data-service]');
 function selectService(id){
   const data=serviceData[id]||serviceData.webapp;
   serviceCards.forEach(card=>{const active=card.dataset.service===id;card.classList.toggle('active',active);const select=card.querySelector('.service-select');if(select)select.setAttribute('aria-pressed',String(active));});
   if($('#serviceExplorerTitle'))$('#serviceExplorerTitle').textContent=data.title;
   if($('#serviceExplorerLead'))$('#serviceExplorerLead').textContent=data.lead;
   if($('#serviceExplorerIncludes'))$('#serviceExplorerIncludes').textContent=data.includes;
   if($('#serviceExplorerBestFor'))$('#serviceExplorerBestFor').textContent=data.bestfor;
   if($('#serviceExplorerRelated'))$('#serviceExplorerRelated').textContent=data.related;
 }
 serviceCards.forEach(card=>{
   const select=card.querySelector('.service-select');
   select?.addEventListener('click',()=>selectService(card.dataset.service));
 });
 if(serviceCards.length)selectService(serviceCards[0].dataset.service);
 
 // Project filter with gentle animation
 const filters=$$('[data-project-filter]'), projectCards=$$('.project-card[data-filter]');
 const filterTimers=new WeakMap();
 filters.forEach(f=>f.addEventListener('click',()=>{
   filters.forEach(b=>{const active=b===f;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
   const match=f.dataset.projectFilter;
   projectCards.forEach(c=>{
     const previous=filterTimers.get(c);if(previous){clearTimeout(previous);filterTimers.delete(c);}
     const show=match==='all'||c.dataset.filter.includes(match);
     if(show){c.hidden=false;c.classList.remove('is-hiding');c.classList.add('is-showing');
       const t=setTimeout(()=>{c.classList.remove('is-showing');filterTimers.delete(c);},motionOK?460:0);filterTimers.set(c,t);
     }else{c.classList.remove('is-showing');c.classList.add('is-hiding');
       const t=setTimeout(()=>{c.hidden=true;c.classList.remove('is-hiding');filterTimers.delete(c);},motionOK?180:0);filterTimers.set(c,t);
     }
   });
 }));
 
 // Gallery dialog
 let projects=[];try{projects=JSON.parse($('#projectData')?.textContent||'[]')}catch{}
 const dlg=$('#galleryDialog'),img=$('#galleryImage'),title=$('#galleryTitle'),desc=$('#galleryCaption'),count=$('#galleryCount'),thumbs=$('#galleryThumbs');let selected=null,index=0,origin=null;
 function draw(){if(!selected||!dlg)return;const arr=selected.images;index=(index+arr.length)%arr.length;img.src=arr[index];img.alt=selected.captions?.[index]||('Actual screenshot '+(index+1)+' from '+selected.name);title.textContent=selected.name;desc.textContent=selected.captions?.[index]||'Actual system screenshot';count.textContent=(index+1)+' / '+arr.length;thumbs.replaceChildren(...arr.map((path,i)=>{const b=document.createElement('button');b.type='button';b.className=i===index?'active':'';b.setAttribute('aria-label','View screenshot '+(i+1));b.setAttribute('aria-pressed',String(i===index));const thumb=document.createElement('img');thumb.src=path;thumb.alt='';thumb.loading='lazy';b.append(thumb);b.addEventListener('click',()=>{index=i;draw()});return b;}));}
 function showGallery(slug,n=0,trigger=null){selected=projects.find(p=>p.slug===slug);if(!selected||!dlg)return;origin=trigger;index=n;draw();if(typeof dlg.showModal==='function')dlg.showModal();}
 $$('[data-gallery]').forEach(b=>b.addEventListener('click',()=>showGallery(b.dataset.gallery,Number(b.dataset.index||0),b)));
 const close=()=>{if(dlg?.open)dlg.close()};$('#galleryClose')?.addEventListener('click',close);$('#galleryNext')?.addEventListener('click',()=>{index++;draw()});$('#galleryPrev')?.addEventListener('click',()=>{index--;draw()});dlg?.addEventListener('click',e=>{if(e.target===dlg)close()});dlg?.addEventListener('close',()=>{origin?.focus();img?.removeAttribute('src')});document.addEventListener('keydown',e=>{if(!dlg?.open)return;if(e.key==='ArrowRight'){e.preventDefault();index++;draw()}else if(e.key==='ArrowLeft'){e.preventDefault();index--;draw()}else if(e.key==='Escape'){close();}});
 
 // Interactive process detail
 const processData={
   discover:{title:'01 / Discover',badge:'Discovery & initial assessment',lead:'We begin by understanding the users, the workflow, the existing pain points and the real objective of the project.',output:'Initial understanding of the workflow, problem statement, early scope direction and next-step recommendations.',list:['Current workflow and challenges','Main users and access levels','Required modules or features']},
   define:{title:'02 / Define',badge:'Scope & agreement direction',lead:'We clarify what the project should include, what the platform direction is and how the work can be structured into milestones.',output:'Scoped direction, key modules, likely deliverables, milestone structure and quotation basis.',list:['Scope boundaries and priorities','Preferred platform or deployment approach','Milestones, deliverables and revision expectations']},
   design:{title:'03 / Design',badge:'Structure & interface planning',lead:'Before deep implementation, we shape the flow, information structure, interface direction and review checkpoints.',output:'Wireframe-level direction, interaction patterns, page or module structure and review checkpoints.',list:['User journeys and task flows','Responsive layout and interface patterns','Brand or presentation considerations']},
   build:{title:'04 / Build & Test',badge:'Implementation & refinement',lead:'The approved direction is implemented, tested and refined according to the agreed scope.',output:'Working modules, testable features, revisions within scope and quality-review checkpoints.',list:['Functional implementation','QA and validation passes','Refinement of approved features']},
   handover:{title:'05 / Handover',badge:'Delivery & next-step support',lead:'We deliver the agreed output and discuss deployment, documentation and post-delivery support arrangements.',output:'Deployment or file handover, agreed documentation, credentials and support direction.',list:['Handover files and access','Documentation or walkthrough needs','Maintenance or support arrangements']}
 };
 const processCards=$$('.process-card[data-step]');
 function selectStep(id){
   const data=processData[id]||processData.discover;
   processCards.forEach(card=>{const active=card.dataset.step===id;card.classList.toggle('active',active);card.setAttribute('aria-pressed',String(active));});
   if($('#processDetailTitle'))$('#processDetailTitle').textContent=data.title;
   if($('#processDetailBadge'))$('#processDetailBadge').textContent=data.badge;
   if($('#processDetailLead'))$('#processDetailLead').textContent=data.lead;
   if($('#processDetailOutput'))$('#processDetailOutput').textContent=data.output;
   const list=$('#processDetailList');if(list){list.replaceChildren(...data.list.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}
 }
 processCards.forEach(card=>{card.addEventListener('click',()=>selectStep(card.dataset.step));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectStep(card.dataset.step)}})});
 if(processCards.length)selectStep(processCards[0].dataset.step);
 
 // Planner
 const plan=$('#plannerForm'),brief=$('#plannerBrief'),copy=$('#copyBrief'),use=$('#useBrief'),contactMessage=$('#contactMessage');
 function val(id){return $('#'+id)?.value.trim()||''}
 function buildBrief(){if(!plan)return'';const features=$$('input[name=features]:checked',plan).map(x=>x.value);return ['PROJECT BRIEF — PRELIMINARY','Type: '+val('planType'),'Stage: '+val('planStage'),'Platform: '+val('planPlatform'),'Possible features: '+(features.join(', ')||'To be discussed'),'Main goal: '+(val('planNotes')||'To be discussed'),'','This brief is for the free initial assessment, not a fixed quote.'].join('\n')}
 function updatePlannerProgress(){
   if(!plan)return;const checks=[!!val('planType'),!!val('planStage'),!!val('planPlatform'),$$('input[name=features]:checked',plan).length>0||!!val('planNotes')];
   const completed=checks.filter(Boolean).length,total=checks.length,pct=Math.round((completed/total)*100);
   const bar=$('#plannerProgressBar'),text=$('#plannerProgressText');
   if(bar)bar.style.width=pct+'%';
   if(text)text.textContent=`${completed} of ${total} steps complete`;
 }
 function refreshBrief(){if(brief)brief.textContent=buildBrief();updatePlannerProgress()}
 plan?.addEventListener('input',refreshBrief);plan?.addEventListener('change',refreshBrief);refreshBrief();
 copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(buildBrief());copy.textContent='Copied ✓';setTimeout(()=>{copy.textContent='Copy brief'},1800)}catch{copy.textContent='Select the brief above to copy';}});
 use?.addEventListener('click',()=>{if(contactMessage&&!contactMessage.value.trim())contactMessage.value=buildBrief()});
 
 const form=$('#contactForm'),status=$('#formStatus');
 form?.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const btn=$('.submit-button',form);btn.disabled=true;btn.textContent='Sending…';status.textContent='Sending your inquiry securely through the form provider…';try{const res=await fetch(form.action,{method:'POST',headers:{Accept:'application/json'},body:new FormData(form)});if(!res.ok)throw Error('Delivery was not confirmed');form.reset();refreshBrief();status.textContent='Your inquiry was submitted to the form provider. HASSOU will review the message using the contact information supplied.';}catch{status.textContent='Automatic delivery could not be confirmed. Please email your inquiry directly to tgroupsolutions.dev2026@gmail.com.'}finally{btn.disabled=false;btn.textContent='Send project inquiry ↗';}});
})();
