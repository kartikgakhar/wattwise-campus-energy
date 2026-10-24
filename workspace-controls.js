/* Keep the primary workspace controls responsive even if page data refreshes. */
(()=>{
  const $=selector=>document.querySelector(selector);
  const closeReport=()=>{
    const backdrop=$('#modalBackdrop');
    if(!backdrop)return;
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  };
  const openReport=building=>{
    const backdrop=$('#modalBackdrop');
    if(!backdrop)return;
    if(building&&$('#building'))$('#building').value=building;
    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    window.setTimeout(()=>$('#room')?.focus(),100);
  };
  const showView=name=>{
    const pages={Overview:'overviewView',Reports:'myReportsView',Buildings:'buildingsView',Leaderboard:'communityView'};
    const pageId=pages[name],page=pageId&&document.getElementById(pageId);
    if(!page)return;
    document.querySelectorAll('.nav button[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===name));
    document.querySelectorAll('.workspace-view').forEach(view=>{view.hidden=view!==page});
    const crumb=$('#crumbView');if(crumb)crumb.textContent=name==='Reports'?'My reports':name;
    window.scrollTo({top:0,behavior:'smooth'});
    window.wattwiseRefresh?.();
  };
  let challengeToastTimer;
  const showToast=(message,success=false)=>{const toast=$('#toast');if(!toast)return;toast.textContent=message;toast.classList.toggle('top',success);toast.classList.add('show');clearTimeout(challengeToastTimer);challengeToastTimer=window.setTimeout(()=>toast.classList.remove('show'),4500)};
  const recordRoomCheck=()=>{
    let user=null;try{user=JSON.parse(sessionStorage.getItem('wattwise-user-session')||'null')}catch{}
    if(!user?.email){showToast('Sign in to record your room check.');return}
    const monday=new Date();monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
    const date=`${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
    let state={date,participants:[]};try{const saved=JSON.parse(localStorage.getItem('wattwise-challenge')||'null');if(saved?.date===date&&Array.isArray(saved.participants))state={date,participants:[...new Set(saved.participants.filter(value=>typeof value==='string'))]}}catch{}
    const joined=state.participants.includes(user.email);state.participants=joined?state.participants.filter(email=>email!==user.email):[...state.participants,user.email];
    try{localStorage.setItem('wattwise-challenge',JSON.stringify(state))}catch{}
    const count=state.participants.length,percent=Math.min(100,Math.round(count/25*100)),text=joined?'✓ You joined today':'I checked my room';
    const setText=(selector,html)=>{const el=$(selector);if(el)el.innerHTML=html};
    setText('#challengeProgressText',`${count} ${count===1?'person':'people'} joined`);setText('#challengePercent',`${percent}%`);if($('#challengeProgressBar'))$('#challengeProgressBar').style.width=`${percent}%`;
    if($('#overviewChallengeBar'))$('#overviewChallengeBar').style.width=`${percent}%`;setText('#overviewChallengePercent',`${percent}%`);setText('#overviewChallengeCount',`${count} demo ${count===1?'action':'actions'}`);
    setText('#challengeBtn',text);setText('#communityChallengeBtn',`${text} <span>→</span>`);
    ['#challengeBtn','#communityChallengeBtn'].forEach(selector=>$(selector)?.classList.toggle('joined',!joined));
    showToast(joined?'Room check removed.':'Room check recorded. Thanks for taking part!');
  };
  const compressPhoto=file=>new Promise((resolve,reject)=>{const image=new Image(),url=URL.createObjectURL(file);image.onload=()=>{const scale=Math.min(1,1000/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const context=canvas.getContext('2d');if(!context){URL.revokeObjectURL(url);reject(new Error('Image compression unavailable'));return}context.drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);resolve(canvas.toDataURL('image/jpeg',.68))};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read the image'))};image.src=url});
  const submitReport=async form=>{
    if(!form.reportValidity())return;
    const submit=form.querySelector('[type="submit"]'),file=$('#photo')?.files?.[0];if(file&&file.size>5*1024*1024){showToast('Choose an image under 5 MB.');return}
    if(submit)submit.disabled=true;
    try{
      const photo=file?await compressPhoto(file):null;
      const response=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({building:$('#building').value,room:$('#room').value.trim(),issue:$('#issue').value,details:$('#details').value.trim(),photo})});
      const result=await response.json().catch(()=>({}));if(!response.ok){showToast(result.error||`Report could not be saved (HTTP ${response.status}).`);return}
      const session=(()=>{try{return JSON.parse(sessionStorage.getItem('wattwise-user-session')||'null')}catch{return null}})(),now=new Date();
      try{window.wattwiseReportSubmitted?.({id:Number(result.id),building:$('#building').value,room:$('#room').value.trim(),issue:$('#issue').value,details:$('#details').value.trim(),photoData:photo||'',status:'open',response:null,reporterEmail:session?.email,reporterName:session?.name,createdAt:now.toISOString(),updatedAt:null,time:new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(now),pin:'p1'})}catch{}
      form.reset();if($('#photoName'))$('#photoName').textContent='';if($('#photoPreview')){$('#photoPreview').hidden=true;$('#photoPreview').removeAttribute('src')}
      closeReport();try{await window.wattwiseRefresh?.()}catch{}
      showToast('Successfully updated',true);
    }catch(error){showToast(error?.message==='Could not read the image'?'Could not read that photo. Try another image.':'Could not reach the WattWise server. Open http://127.0.0.1:3000 and make sure Flask is running.')}
    finally{if(submit)submit.disabled=false}
  };
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    const challenge=target.closest('#challengeBtn,#communityChallengeBtn');
    if(challenge){event.preventDefault();event.stopImmediatePropagation();recordRoomCheck();return}
    const nav=target.closest('.nav button[data-view]');
    if(nav){event.preventDefault();event.stopImmediatePropagation();showView(nav.dataset.view);return}
    const report=target.closest('#reportOpen,#pulseReport,[data-open-report],[data-report-building]');
    if(report){event.preventDefault();event.stopImmediatePropagation();openReport(report.dataset.reportBuilding||'');return}
    const profile=target.closest('#profileButton');
    if(profile){event.preventDefault();event.stopImmediatePropagation();const menu=$('#profileMenu'),open=menu?.hidden;if(menu)menu.hidden=!open;profile.setAttribute('aria-expanded',String(Boolean(open)));return}
    const profileExit=target.closest('#profileSignOut');
    if(profileExit){event.preventDefault();event.stopImmediatePropagation();$('#signOut')?.click();return}
    const close=target.closest('#closeModal,#cancelModal');
    if(close){event.preventDefault();event.stopImmediatePropagation();closeReport();return}
    const backdrop=$('#modalBackdrop');
    if(backdrop&&target===backdrop){closeReport();return}
    if(!target.closest('.profile-wrap')){const menu=$('#profileMenu'),button=$('#profileButton');if(menu)menu.hidden=true;if(button)button.setAttribute('aria-expanded','false')}
  },true);
  document.addEventListener('submit',event=>{if(event.target instanceof HTMLFormElement&&event.target.id==='reportForm'){event.preventDefault();event.stopImmediatePropagation();submitReport(event.target)}},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeReport();const menu=$('#profileMenu'),button=$('#profileButton');if(menu)menu.hidden=true;if(button)button.setAttribute('aria-expanded','false')}});
})();
