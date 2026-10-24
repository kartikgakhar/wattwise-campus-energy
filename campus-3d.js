(()=>{
  const buildings={
    library:{name:'Library',kicker:'OPEN REPORT · LIBRARY',title:'Lights left on in the reading room',text:'A student spotted an empty room with lights still on. A report helps campus facilities follow up.',status:'Needs attention',icon:'!',energy:82,scenario:'The Library: a light left on.',description:'An empty reading room is using power. Imagine the moment someone notices and reports it.'},
    science:{name:'Science Block',kicker:'RESOLVED · SCIENCE BLOCK',title:'Projector left on after class',text:'Facilities switched off the projector after a student report. The issue is marked resolved.',status:'Resolved',icon:'✓',energy:22,scenario:'Science Block: the projector is off.',description:'A report was followed by a facilities update. The room is back to a lower energy state.'},
    residence:{name:'Residence Hall',kicker:'BEING CHECKED · RESIDENCE HALL',title:'Air conditioning with a window open',text:'The facilities team is checking a report about cooling running while a window is open.',status:'Being checked',icon:'···',energy:66,scenario:'Residence Hall: cooling needs a check.',description:'A report is in the facilities queue. A quick check can prevent energy from escaping.'},
    centre:{name:'Student Centre',kicker:'CAMPUS SPOTLIGHT · STUDENT CENTRE',title:'No open energy reports',text:'This building has no issue shown in this concept preview. Keep an eye out for everyday waste.',status:'Looking good',icon:'✳',energy:34,scenario:'Student Centre: small habits add up.',description:'No active issue is shown here. Switch off lights and screens when shared spaces are empty.'}
  };
  const page=document.querySelector('.energy-page');
  const setBuilding=(key)=>{
    const info=buildings[key];if(!info)return;
    document.querySelectorAll('.building').forEach((button)=>button.classList.toggle('selected',button.dataset.building===key));
    document.querySelector('#detailIcon').textContent=info.icon;
    document.querySelector('#detailKicker').textContent=info.kicker;
    document.querySelector('#detailTitle').textContent=info.title;
    document.querySelector('#detailText').textContent=info.text;
    document.querySelector('#detailStatus').textContent=info.status;
    document.querySelector('#scenarioTitle').textContent=info.scenario;
    document.querySelector('#scenarioDescription').textContent=info.description;
    page.dataset.energy=String(info.energy);
    page.classList.remove('saving');
    document.querySelector('#saveToggle').setAttribute('aria-pressed','false');
    document.querySelector('#toggleTitle').textContent='Show the fix';
    document.querySelector('#toggleSub').textContent='Preview an energy-saving action';
    document.querySelector('#energyState').textContent=info.energy>70?'WASTING':info.energy>40?'IN USE':'LOW USE';
    document.querySelector('#meterFill').style.width=info.energy+'%';
  };
  document.querySelectorAll('.building').forEach((button)=>button.addEventListener('click',()=>setBuilding(button.dataset.building)));
  document.querySelector('#saveToggle').addEventListener('click',()=>{
    const saving=!page.classList.contains('saving');page.classList.toggle('saving',saving);
    document.querySelector('#saveToggle').setAttribute('aria-pressed',String(saving));
    document.querySelector('#toggleTitle').textContent=saving?'Show the waste':'Show the fix';
    document.querySelector('#toggleSub').textContent=saving?'Preview the lower-energy state':'Preview an energy-saving action';
    document.querySelector('#energyState').textContent=saving?'SAVED':'WASTING';
    document.querySelector('#meterFill').style.width=saving?'24%':(page.dataset.energy||'82')+'%';
  });
})();
