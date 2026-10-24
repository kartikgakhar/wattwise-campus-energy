(()=>{
  try{const reports=JSON.parse(localStorage.getItem('wattwise-reports')||'null');if(Array.isArray(reports)){const open=reports.filter(r=>r.status==='open').length,resolved=reports.filter(r=>r.status==='done').length;const openCount=document.querySelector('#previewOpen'),resolvedCount=document.querySelector('#previewResolved');if(openCount)openCount.textContent=String(open).padStart(2,'0');if(resolvedCount)resolvedCount.textContent=String(resolved).padStart(2,'0')}}catch{}
  document.querySelectorAll('[data-open-auth]').forEach(button=>button.addEventListener('click',()=>{
    const mode=button.dataset.openAuth;
    document.dispatchEvent(new CustomEvent('wattwise:open-auth',{detail:{mode:mode==='register'?'register':'login'}}));
  }));
  document.querySelectorAll('.landing-nav a,.hero-secondary').forEach(link=>link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href'));
    if(target){event.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',link.getAttribute('href'))}
  }));
})();
