/* Require a valid Flask session before revealing the reporter workspace. */
(()=>{
  let layer=null,mode='login',selectedRole='student';
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const backToLanding=()=>{if(!layer)return;layer.remove();layer=null;document.body.classList.remove('auth-required');document.body.classList.add('public-home')};
  document.addEventListener('keydown',event=>{if(event.key==='Escape')backToLanding()});
  const setMode=next=>{
    mode=next;
    layer.querySelector('#nameField').hidden=mode!=='register';
    layer.querySelector('#confirmPasswordField').hidden=mode!=='register';
    layer.querySelector('#confirmPassword').required=mode==='register';
    layer.querySelector('#passwordField').hidden=mode==='reset';
    layer.querySelector('#authPassword').required=mode!=='reset';
    layer.querySelector('#forgotPassword').hidden=mode!=='login';
    layer.querySelector('#resetBack').hidden=mode!=='reset';
    layer.querySelector('#authHeading').textContent=mode==='register'?'Join your campus':mode==='reset'?'Reset your password':'Welcome back';
    layer.querySelector('#authSubheading').textContent=mode==='register'?'Create your WattWise profile to get started.':mode==='reset'?'Enter your college email to request password reset instructions.':'Sign in to see what’s happening around campus.';
    layer.querySelector('#authSubmit').innerHTML=mode==='register'?'Create my account &nbsp; →':mode==='reset'?'Send reset instructions &nbsp; →':'Sign in &nbsp; →';
    const switchLine=layer.querySelector('#authSwitchLine');
    switchLine.hidden=mode==='reset';
    switchLine.innerHTML=mode==='register'?'Already have an account? <button type="button" id="authSwitchMode">Sign in</button>':'Don’t have an account? <button type="button" id="authSwitchMode">Create an account</button>';
    switchLine.querySelector('#authSwitchMode')?.addEventListener('click',()=>setMode(mode==='register'?'login':'register'));
    layer.querySelector('#authPassword').autocomplete=mode==='register'?'new-password':'current-password';
    layer.querySelector('.auth-role-picker').hidden=mode==='reset';
    layer.querySelector('#adminSignupNote').hidden=!(mode==='register'&&selectedRole==='admin');
    layer.querySelector('#adminKeyField').hidden=!(mode!=='reset'&&selectedRole==='admin');
    layer.querySelector('#authError').textContent='';layer.querySelector('#authError').classList.remove('success');
  };
  const setRole=role=>{
    selectedRole=role==='admin'?'admin':'student';
    layer.querySelectorAll('[data-auth-role]').forEach(button=>{const active=button.dataset.authRole===selectedRole;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
    layer.querySelector('#adminSignupNote').hidden=!(mode==='register'&&selectedRole==='admin');
    layer.querySelector('#adminKeyField').hidden=!(mode!=='reset'&&selectedRole==='admin');
    layer.querySelector('#authError').textContent='';
  };
  const resumeSession=session=>{
    if(session.role==='admin'&&!location.pathname.toLowerCase().endsWith('admin.html')){location.href='admin.html';return}
    layer?.remove();layer=null;
    document.body.classList.remove('auth-required','public-home');document.body.classList.add('app-active');document.body.classList.toggle('is-admin',session.role==='admin');
    const displayName=(session.name||session.email.split('@')[0]).trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
    document.querySelectorAll('.avatar').forEach(el=>el.textContent=displayName||'U');
    const userName=document.querySelector('.user b');if(userName)userName.textContent=session.name||'Campus reporter';
    const userRole=document.querySelector('.user small');if(userRole)userRole.textContent=session.role==='admin'?'Facilities administrator':'Campus reporter';
    const profileName=document.querySelector('#profileName');if(profileName)profileName.textContent=session.name||'Campus reporter';
    const profileEmail=document.querySelector('#profileEmail');if(profileEmail)profileEmail.textContent=session.email||'';
    const profileRole=document.querySelector('#profileRole');if(profileRole)profileRole.textContent=session.role==='admin'?'Facilities administrator':'Campus reporter';
    const title=document.querySelector('#pageTitle');if(title)title.innerHTML=session.role==='admin'?'Facilities response desk <span>✳</span>':`Welcome, ${escapeHtml(session.name||'campus reporter')} <span>✳</span>`;
    const subtitle=document.querySelector('#pageSub');if(subtitle&&session.role==='admin')subtitle.textContent='Review campus reports, update their status, and leave a resolution note.';
    const signOut=document.querySelector('#signOut');if(signOut)signOut.onclick=async()=>{try{await fetch('/api/auth/logout',{method:'POST'})}catch{}sessionStorage.removeItem('wattwise-user-session');location.reload()};
    if(window.wattwiseRefresh)window.wattwiseRefresh();
  };
  function openAuth(initialMode='login'){
    if(layer){setMode(initialMode);return}
    document.body.classList.remove('public-home','app-active');document.body.classList.add('auth-required');
    layer=document.createElement('section');layer.className='auth-screen';layer.id='authScreen';
    layer.innerHTML=`
      <div class="auth-story"><div class="auth-brand"><span class="auth-brand-mark">ϟ</span><span>watt<span>wise</span></span></div><div class="auth-art" aria-hidden="true"><div class="auth-art-bolt">ϟ</div></div><div class="auth-story-copy"><div class="auth-label">A little care goes a long way</div><h1>Make your campus<br><em>work smarter.</em></h1><p>Spot everyday energy waste, help your campus team fix it, and see small actions add up to a brighter place to learn.</p></div><div class="auth-proof"><span class="auth-proof-icon">✳</span><span><b>Built for campus, by campus.</b><br>Every report helps close the loop.</span></div></div>
      <div class="auth-form-side"><div class="auth-card"><button class="auth-back-home" id="backToLanding" type="button">← Back to WattWise</button><div class="auth-mobile-brand"><div class="auth-brand"><span class="auth-brand-mark">ϟ</span><span>watt<span>wise</span></span></div></div><div class="auth-welcome"><h2 id="authHeading">Welcome back</h2><p id="authSubheading">Sign in to see what’s happening around campus.</p></div><form id="authForm" novalidate><div class="auth-field" id="nameField" hidden><label for="authName">Your name</label><input id="authName" name="name" autocomplete="name" placeholder="e.g. Aanya Patel" maxlength="48"></div><div class="auth-field"><label for="authEmail">College email</label><input id="authEmail" name="email" type="email" autocomplete="email" placeholder="you@college.edu" required></div><div class="auth-field"><label for="authPassword">Password</label><input id="authPassword" name="password" type="password" autocomplete="current-password" placeholder="At least 8 characters" minlength="8" required></div><p class="auth-error" id="authError" aria-live="polite"></p><button class="auth-submit" id="authSubmit" type="submit">Sign in &nbsp; →</button></form><p class="auth-switch-line" id="authSwitchLine"></p><p class="auth-legal"><b>Hackathon prototype</b> · Sign in is required to submit reports and follow facilities updates.</p></div></div><div class="auth-foot">WattWise Campus · HackCult ’26</div>`;
    document.body.appendChild(layer);
    const rolePicker=document.createElement('div');rolePicker.className='auth-role-picker';rolePicker.setAttribute('role','group');rolePicker.setAttribute('aria-label','Account type');rolePicker.innerHTML='<span>CONTINUE AS</span><div><button type="button" class="auth-role-option active" data-auth-role="student" aria-pressed="true">Student</button><button type="button" class="auth-role-option" data-auth-role="admin" aria-pressed="false">Facilities admin</button></div>';
    const adminNote=document.createElement('div');adminNote.className='auth-admin-note';adminNote.id='adminSignupNote';adminNote.hidden=true;adminNote.textContent='Enter the private facilities access key provided by your university administrator.';
    const authForm=layer.querySelector('#authForm');authForm.before(rolePicker,adminNote);
    const form=layer.querySelector('#authForm'),passwordField=layer.querySelector('#authPassword').parentElement;passwordField.id='passwordField';const error=layer.querySelector('#authError');
    const confirmField=document.createElement('div');confirmField.className='auth-field';confirmField.id='confirmPasswordField';confirmField.hidden=true;confirmField.innerHTML='<label for="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" placeholder="Re-enter your password">';form.insertBefore(confirmField,error);
    const adminKeyField=document.createElement('div');adminKeyField.className='auth-field';adminKeyField.id='adminKeyField';adminKeyField.hidden=true;adminKeyField.innerHTML='<label for="adminSignupKey">Facilities access key</label><input id="adminSignupKey" name="adminKey" type="password" autocomplete="off" placeholder="Enter key provided by your university">';form.insertBefore(adminKeyField,error);
    const forgot=document.createElement('button');forgot.className='auth-forgot';forgot.id='forgotPassword';forgot.type='button';forgot.textContent='Forgot password?';form.insertBefore(forgot,error);
    const resetBack=document.createElement('button');resetBack.className='auth-reset-back';resetBack.id='resetBack';resetBack.type='button';resetBack.textContent='← Back to sign in';resetBack.hidden=true;form.after(resetBack);
    layer.querySelectorAll('[data-auth-role]').forEach(button=>button.addEventListener('click',()=>setRole(button.dataset.authRole)));
    forgot.addEventListener('click',()=>setMode('reset'));resetBack.addEventListener('click',()=>setMode('login'));
    layer.querySelector('#backToLanding').addEventListener('click',backToLanding);
    layer.querySelector('#authForm').addEventListener('submit',async event=>{
      event.preventDefault();const email=layer.querySelector('#authEmail').value.trim(),password=layer.querySelector('#authPassword').value,confirm=layer.querySelector('#confirmPassword').value,name=layer.querySelector('#authName').value.trim(),adminKey=layer.querySelector('#adminSignupKey').value,error=layer.querySelector('#authError');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){error.textContent='Enter a valid email address to continue.';return}
      if(mode==='reset'){error.classList.add('success');error.textContent='Password reset is not enabled yet. Please contact your campus administrator.';return}
      if(password.length<8){error.textContent='Use at least 8 characters for the password.';return}
      if(mode==='register'&&!name){error.textContent='Add your name to create your profile.';layer.querySelector('#authName').focus();return}
      if(mode==='register'&&password!==confirm){error.textContent='Your passwords do not match.';layer.querySelector('#confirmPassword').focus();return}
      if(selectedRole==='admin'&&!adminKey){error.textContent='Enter the facilities access key provided by your university.';layer.querySelector('#adminSignupKey').focus();return}
      const submit=layer.querySelector('#authSubmit');submit.disabled=true;
      try{
        const response=await fetch(`/api/auth/${mode==='register'?'register':'login'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password,role:selectedRole,adminKey})});
        const result=await response.json().catch(()=>({}));
        if(!response.ok){error.textContent=result.error||'Could not sign in. Check that the backend is running.';return}
        const user={...result.user,demo:false,startedAt:Date.now()};sessionStorage.setItem('wattwise-user-session',JSON.stringify(user));resumeSession(user);
      }catch{error.textContent='Could not reach WattWise. Start the Python server and try again.'}
      finally{if(layer)submit.disabled=false}
    });
    setMode(initialMode);
  }
  document.addEventListener('wattwise:open-auth',event=>openAuth(event.detail?.mode||'login'));
  const init=async()=>{try{const response=await fetch('/api/auth/me');if(response.ok){const result=await response.json();if(result.user){const user={...result.user,demo:false};sessionStorage.setItem('wattwise-user-session',JSON.stringify(user));resumeSession(user);return}}}catch{}sessionStorage.removeItem('wattwise-user-session');document.body.classList.add('public-home')};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
