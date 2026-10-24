 (async()=>{
  const SESSION_KEY='wattwise-user-session';
  const $=selector=>document.querySelector(selector);
  const issueIcons={'Lights left on':'💡','Fans running in an empty room':'🌀','AC running with windows open':'❄️','Equipment left on standby':'🔌','Other energy waste':'⚡'};
  let session=null,reports=[],filter='all',selectedId=null;

  try{const response=await fetch('/api/auth/me');const result=await response.json();session=result.user||null}catch{}
  if(!session||session.role!=='admin'){sessionStorage.removeItem(SESSION_KEY);location.replace('index.html');return}
  sessionStorage.setItem(SESSION_KEY,JSON.stringify({...session,demo:false}));
  reports=[];

  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  async function refreshFromServer(){try{const response=await fetch('/api/reports');if(!response.ok)return;const data=await response.json();reports=(data.reports||[]).map(r=>({...r,id:Number(r.id),photoData:r.photo||'',time:r.createdAt?new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(new Date(r.createdAt)):'Recently',updatedAt:r.updatedAt?new Date(r.updatedAt).getTime():null}));render()}catch{toast('Could not refresh the report queue.')}}
  const statusName={open:'Open',check:'Checking',done:'Resolved'};
  const statusClass={open:'status-open',check:'status-check',done:'status-done'};
  function toast(message){const el=$('#adminToast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2500)}
  function counts(){return {open:reports.filter(r=>r.status==='open').length,check:reports.filter(r=>r.status==='check').length,done:reports.filter(r=>r.status==='done').length}}
  function render(){
    const c=counts();
    $('#openMetric').textContent=c.open;$('#checkMetric').textContent=c.check;$('#doneMetric').textContent=c.done;$('#totalMetric').textContent=reports.length;
    $('#navOpenCount').textContent=c.open;$('#openCount').textContent=c.open;$('#checkCount').textContent=c.check;$('#doneCount').textContent=c.done;$('#allCount').textContent=reports.length;
    const query=$('#searchInput').value.trim().toLowerCase();
    const rows=reports.slice().reverse().filter(r=>(filter==='all'||r.status===filter)&&(!query||[r.issue,r.building,r.room,r.reporterName,r.reporterEmail].some(v=>String(v||'').toLowerCase().includes(query))));
    $('#queueList').innerHTML=rows.length?rows.map(r=>`<button class="queue-row" type="button" data-report-id="${Number(r.id)}" aria-label="Open ${escapeHtml(r.issue)} report"><span class="queue-issue"><i class="issue-icon">${issueIcons[r.issue]||'⚡'}</i><span class="issue-copy"><b>${escapeHtml(r.issue)}</b><small>${escapeHtml(r.room||'Area not specified')}</small></span></span><span class="report-location"><b>${escapeHtml(r.building)}</b><small>${escapeHtml(r.reporterName||'Campus member')}</small></span><span class="status-badge ${statusClass[r.status]||statusClass.open}">${statusName[r.status]||'Open'}</span><span class="report-age">${escapeHtml(r.time||'Recently')}</span><span class="row-arrow">›</span></button>`).join(''):'<div class="empty-state"><span>✳</span>No reports match this view.</div>';
    $('#queueSummary').textContent=`Showing ${rows.length} of ${reports.length} reports`;
    renderBuildings();renderActivity();
    document.querySelectorAll('[data-report-id]').forEach(row=>row.addEventListener('click',()=>openReport(Number(row.dataset.reportId))));
  }
  function renderBuildings(){
    const names=['Library','Science Block','Student Centre','Residence Hall'];
    const buildingCounts=names.map(name=>({name,count:reports.filter(r=>r.building===name&&r.status!=='done').length}));
    const max=Math.max(1,...buildingCounts.map(b=>b.count));
    $('#buildingList').innerHTML=buildingCounts.map(b=>`<div class="building-item"><span class="building-name">${escapeHtml(b.name)}</span><span class="building-count">${b.count} open</span><div class="building-bar"><span style="width:${b.count?Math.max(9,b.count/max*100):0}%"></span></div></div>`).join('');
  }
  function renderActivity(){
    const changed=reports.filter(r=>r.updatedAt).sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,3);
    const items=changed.length?changed:reports.slice().reverse().slice(0,3);
    $('#activityFeed').innerHTML=items.length?items.map(r=>{const updated=Boolean(r.updatedAt);const action=updated?(r.status==='done'?'marked resolved':`moved to ${statusName[r.status].toLowerCase()}`):'reported an energy issue';const actor=updated?(r.updatedBy||'Facilities team'):(r.reporterName||'A campus member');return `<div class="feed-item"><span class="feed-icon">${updated&&r.status==='done'?'✓':'↗'}</span><p><b>${escapeHtml(actor)}</b> ${action} at <b>${escapeHtml(r.building)}</b><time>${updated?new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit'}).format(new Date(r.updatedAt)):(r.time||'Recently')}</time></p></div>`}).join(''):'<div class="empty-state">No activity yet.</div>';
  }
  function openReport(id){
    const r=reports.find(item=>Number(item.id)===id);if(!r)return;selectedId=id;
    $('#drawerTitle').textContent=r.issue;$('#drawerIcon').textContent=issueIcons[r.issue]||'⚡';$('#drawerLocation').textContent=`${r.building} · ${r.room||'Area not specified'}`;
    $('#drawerStatus').textContent=statusName[r.status]||'Open';$('#drawerStatus').className=`status-badge ${statusClass[r.status]||statusClass.open}`;
    $('#reporterName').textContent=r.reporterName||'Campus member';$('#reporterInitials').textContent=(r.reporterName||'CM').split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();$('#reportedTime').textContent=r.time||'Recently';
    $('#drawerDetails').textContent=r.details||r.issue;$('#statusSelect').value=r.status||'open';$('#responseInput').value=r.response||'';
    $('#attachmentBlock').hidden=!r.photoData;if(r.photoData)$('#reportPhoto').src=r.photoData;else $('#reportPhoto').removeAttribute('src');
    $('#resolutionBlock').hidden=!r.response;$('#drawerResponse').textContent=r.response||'';
    $('#drawerBackdrop').hidden=false;document.body.style.overflow='hidden';$('#statusSelect').focus();
  }
  function closeDrawer(){selectedId=null;$('#drawerBackdrop').hidden=true;document.body.style.overflow=''}
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(tab=>tab.classList.toggle('active',tab===button));render()}));
  $('#searchInput').addEventListener('input',render);$('#refreshBtn').addEventListener('click',async()=>{await refreshFromServer();toast('Report queue refreshed.')});
  $('#drawerClose').addEventListener('click',closeDrawer);$('#drawerCancel').addEventListener('click',closeDrawer);$('#drawerBackdrop').addEventListener('click',e=>{if(e.target===$('#drawerBackdrop'))closeDrawer()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
  $('#updateForm').addEventListener('submit',async event=>{event.preventDefault();const report=reports.find(r=>Number(r.id)===selectedId);if(!report)return;const next=$('#statusSelect').value,note=$('#responseInput').value.trim();if(next==='done'&&!note){$('#responseInput').focus();$('#responseInput').setCustomValidity('Add a short note before resolving this report.');$('#responseInput').reportValidity();$('#responseInput').addEventListener('input',()=>$('#responseInput').setCustomValidity(''),{once:true});return}try{const response=await fetch(`/api/reports/${selectedId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:next,response:note})});const result=await response.json().catch(()=>({}));if(!response.ok){toast(result.error||'Could not update this report.');return}await refreshFromServer()}catch{toast('Could not reach the server. The report was not updated.');return}closeDrawer();toast(next==='done'?'Report resolved and note shared.':'Report status updated.')});
  $('#signOut').addEventListener('click',async()=>{try{await fetch('/api/auth/logout',{method:'POST'})}catch{}sessionStorage.removeItem(SESSION_KEY);location.href='index.html'});
  document.querySelectorAll('.admin-nav a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.admin-nav a').forEach(a=>a.classList.remove('selected'));link.classList.add('selected')}));
  $('#welcomeName').textContent=(session.name||'team').split(' ')[0];$('#adminName').textContent=session.name||'Campus Facilities';
  $('#today').textContent=new Intl.DateTimeFormat('en-IN',{weekday:'short',day:'numeric',month:'short'}).format(new Date());
  render();refreshFromServer();setInterval(refreshFromServer,20000);
})();
