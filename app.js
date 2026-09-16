const tabs=[...document.querySelectorAll('[role="tab"]')];
let bgReady=false,bgWanted=!matchMedia('(prefers-reduced-motion: reduce)').matches,bgIndex=0,bgTimer=null;
// Arbitrary preview selections, authorized by the owner; not visually reviewed highlights.
const bgClips=[
{id:'rzF0myPIKQY',start:182,label:'제4회 · 김신의 Gethsemane'},
{id:'u8jdomMXlRc',start:900,label:'제3회 · 기쁜 소식의 노래'},
{id:'gPMNHL3W1Zc',start:600,label:'제2회 · 한강문화축제'},
{id:'KJkGgpmM3WE',start:120,label:'제4회 · 뮤지컬 갈라 콘서트'},
{id:'u8jdomMXlRc',start:1800,label:'제3회 · 기쁜 소식의 노래'}
];
const decks=[{player:null,ready:false,clip:0,warmed:false},{player:null,ready:false,clip:1,warmed:false}];
let activeDeck=0,pendingDeck=null,hasStarted=false;
const hero=document.querySelector('.poster-hero'),bgButton=document.getElementById('background-toggle'),bgLabel=document.getElementById('background-label');
const webOrigin=/^https?:$/.test(location.protocol)?location.origin:null;
function sendPause(frame){if(frame.contentWindow)frame.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),'https://www.youtube-nocookie.com')}
function bgAllowed(){return bgWanted&&!document.hidden&&document.getElementById('history').hidden}
function refreshBg(){
 if(!bgReady)return;
 if(bgAllowed()){
  bgState(hasStarted);
  const d=decks[pendingDeck??activeDeck]; d.player.mute();d.player.playVideo();
  const other=decks[1-activeDeck];
  if(pendingDeck===null&&other.ready&&!other.warmed)other.player.playVideo();
 }else{decks.forEach(d=>{if(d.ready)d.player.pauseVideo()});bgState(false)}
}
function select(id,focus=false){if(id==="programs")id="history";const chosen=tabs.find(t=>t.getAttribute('aria-controls')===id)||tabs[0];tabs.forEach(t=>{const active=t===chosen;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;const panel=document.getElementById(t.getAttribute('aria-controls'));panel.hidden=!active;panel.querySelectorAll('iframe[data-src]').forEach(frame=>{if(active&&!frame.src){frame.src=frame.dataset.src+(webOrigin?'&origin='+encodeURIComponent(webOrigin):'')}else if(!active)sendPause(frame)})});if(focus)chosen.focus();refreshBg()}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>{const id=t.getAttribute('aria-controls');select(id);try{history.replaceState(null,'','#'+id)}catch{location.hash=id}});t.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();tabs[n].click();tabs[n].focus()})});window.addEventListener('hashchange',()=>select(location.hash.slice(1)));select('greeting');try{history.replaceState(null,'','#greeting')}catch{};
function bgState(active){hero.classList.toggle('video-playing',active);bgButton.textContent=active?'배경 영상 정지':'배경 영상 재생';bgButton.setAttribute('aria-pressed',String(active))}
function captionsOff(player){try{player.unloadModule('captions')}catch{}}
function prepare(slot,index){const d=decks[slot],clip=bgClips[index];d.clip=index;d.warmed=false;d.player.mute();
 const spec={videoId:clip.id,startSeconds:clip.start,endSeconds:clip.start+10};
 if(bgAllowed())d.player.loadVideoById(spec);else d.player.cueVideoById(spec);
}
function showDeck(slot){const old=activeDeck;activeDeck=slot;pendingDeck=null;hasStarted=true;bgIndex=decks[slot].clip;
 decks.forEach((d,i)=>d.player.getIframe().classList.toggle('is-active',i===slot));
 bgLabel.textContent=bgClips[bgIndex].label;bgState(true);
 if(old!==slot){decks[old].player.pauseVideo();setTimeout(()=>prepare(old,(bgIndex+1)%bgClips.length),350)}
}
function nextClip(){if(pendingDeck!==null||!bgAllowed())return;const slot=1-activeDeck;if(!decks[slot].ready)return;
 pendingDeck=slot;decks[activeDeck].player.pauseVideo();decks[slot].player.mute();decks[slot].player.playVideo();
}
function failBackground(){bgWanted=false;pendingDeck=null;bgState(false);decks.forEach(d=>{if(d.ready)d.player.pauseVideo()});bgLabel.textContent='연혁에서 공연 영상을 만나보세요'}
window.onYouTubeIframeAPIReady=function(){decks.forEach((d,slot)=>{
 d.player=new YT.Player('festival-background-'+slot,{host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',videoId:bgClips[d.clip].id,
 playerVars:{autoplay:0,start:bgClips[d.clip].start,controls:0,playsinline:1,disablekb:1,rel:0,cc_load_policy:0,...(webOrigin?{origin:webOrigin}:{})},events:{
 onApiChange(e){captionsOff(e.target)},
 onReady(e){d.ready=true;captionsOff(e.target);e.target.mute();const f=e.target.getIframe();f.tabIndex=-1;f.title='지난 한강문화축제 음소거 배경 영상';f.setAttribute('aria-hidden','true');
 if(decks.every(x=>x.ready)){bgReady=true;prepare(0,0);prepare(1,1);refreshBg();bgTimer=setInterval(()=>{if(!bgAllowed())return;const current=decks[activeDeck],clip=bgClips[current.clip];if(pendingDeck===null&&current.player.getCurrentTime()>=clip.start+9.9)nextClip()},50)}},
 onStateChange(e){if(e.data===1){captionsOff(e.target);if(!bgAllowed()){e.target.pauseVideo();return}
 if(slot===pendingDeck||(slot===activeDeck&&!hasStarted)){showDeck(slot)}
 else if(slot!==activeDeck){d.warmed=true;e.target.pauseVideo()}
 else bgState(true);
 }else if(e.data===0&&slot===activeDeck&&bgAllowed())nextClip()},
 onAutoplayBlocked(){failBackground()},onError(){failBackground()}
 }})})};
bgButton.addEventListener('click',()=>{if(!bgReady){bgLabel.textContent='연혁에서 공연 영상을 만나보세요';return}bgWanted=!hero.classList.contains('video-playing');if(bgWanted&&!document.getElementById('history').hidden){select('greeting');try{history.replaceState(null,'','#greeting')}catch{}}refreshBg()});
document.addEventListener('visibilitychange',refreshBg);
const youtubeScript=document.createElement('script');youtubeScript.src='https://www.youtube.com/iframe_api';youtubeScript.async=true;youtubeScript.onerror=()=>{bgState(false);bgLabel.textContent='연혁에서 공연 영상을 만나보세요'};document.head.appendChild(youtubeScript);
