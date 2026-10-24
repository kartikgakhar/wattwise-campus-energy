(()=>{
  const key='wattwise-theme';
  const readTheme=()=>localStorage.getItem(key)==='light'?'light':'dark';
  const setTheme=theme=>{
    if(document.documentElement.dataset.theme!==theme)document.documentElement.dataset.theme=theme;
    localStorage.setItem(key,theme);
    const button=document.querySelector('.theme-toggle');
    if(button&&button.dataset.mode!==theme){
      button.innerHTML=theme==='dark'?'<span aria-hidden="true">☼</span><b>Light</b>':'<span aria-hidden="true">☾</span><b>Dark</b>';
      button.dataset.mode=theme;
      button.setAttribute('aria-label',`Switch to ${theme==='dark'?'light':'dark'} theme`);
      button.title=`Switch to ${theme==='dark'?'light':'dark'} theme`;
    }
  };
  const mount=()=>{
    let button=document.querySelector('.theme-toggle');
    if(!button){button=document.createElement('button');button.type='button';button.className='theme-toggle';button.addEventListener('click',()=>setTheme(readTheme()==='dark'?'light':'dark'));}
    const target=document.body.classList.contains('auth-required')?document.querySelector('.auth-form-side'):
      (document.body.classList.contains('admin-page')||document.querySelector('.admin-layout'))?document.querySelector('.top-right'):
      document.querySelector('.energy-header')||
      (!document.body.classList.contains('app-active')?document.querySelector('.landing-actions'):null)||
      document.querySelector('.top-actions');
    if(target&&button.parentElement!==target)target.append(button);
    else if(!target&&!button.isConnected)document.body.append(button);
    button.classList.toggle('theme-toggle-floating',!target);
    setTheme(readTheme());
  };
  setTheme(readTheme());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
  new MutationObserver(mount).observe(document.body,{childList:true,attributes:true,attributeFilter:['class']});
})();
