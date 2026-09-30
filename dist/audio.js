/* Trilha e efeitos originais sintetizados no navegador; sem downloads ou samples externos. */
(function(root) {
  'use strict';
  const NORMAL_BPM = 100, AURA_BPM = 146;
  const melody = [72,null,76,79,null,76,74,null,72,null,69,72,null,74,76,null,79,null,81,79,null,76,74,null,72,74,76,null,79,76,74,null];
  const chords = [[48,60,64,67],[45,57,60,64],[41,53,57,60],[43,55,59,62]];
  const effects = {
    click:[[79,0,.035]], purchase:[[64,0,.08],[67,.07,.08],[72,.14,.13]],
    upgrade:[[72,0,.09],[76,.08,.09],[79,.16,.09],[84,.24,.2]],
    achievement:[[72,0,.12],[76,.12,.12],[79,.24,.12],[84,.36,.3]],
    event:[[79,0,.1],[84,.1,.1],[88,.2,.2]], aura:[[60,0,.12],[64,.08,.12],[67,.16,.12],[72,.24,.12],[79,.32,.24]],
    rebirth:[[48,0,.25],[55,.12,.25],[60,.24,.25],[64,.36,.25],[67,.48,.25],[72,.6,.25],[79,.72,.25],[84,.9,.5]],
    mission:[[67,0,.12],[72,.1,.12],[76,.2,.22]], sticker:[[76,0,.12],[81,.1,.2]]
  };
  function score(step, aura) {
    const chord=chords[Math.floor(step/16)%4], n=step%32, notes=[];
    if(melody[n]!==null) notes.push({midi:melody[n],length:.1,volume:.075,type:'triangle'});
    if(step%4===0 || aura && step%4===2) notes.push({midi:chord[0],length:.19,volume:.16,type:'sine'});
    if(step%8===0) for(const midi of chord.slice(1)) notes.push({midi,length:.23,volume:.022,type:'triangle'});
    if(aura && step%2===1) notes.push({midi:chord[1+(step%3)]+12,length:.065,volume:.035,type:'triangle'});
    if(step%4===0 || aura && step%8===6) notes.push({drum:'kick',volume:.25});
    if(step%8===4) notes.push({drum:'clap',volume:.08});
    if(step%(aura?1:2)===0) notes.push({drum:'hat',volume:aura?.055:.04});
    return notes;
  }
  function create(options={}) {
    const env=options.env||root;
    let ctx, master, music, sfx, timer, unlocked=false, aura=false, next=0, step=0, voices=0;
    let clickAt=-Infinity;
    const lastEffect=new Map(), buffers={};
    let settings={muted:false,music:.3,sfx:.55};
    try { const saved=JSON.parse(env.localStorage?.getItem('caju-audio-v1')||'null');
      if(saved) settings={muted:saved.muted===true,music:clamp(saved.music,.3),sfx:clamp(saved.sfx,.55)};
    } catch(_) {}
    function clamp(n,fallback){return Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;}
    function status(){return {unlocked,muted:settings.muted,music:settings.music,sfx:settings.sfx,aura,bpm:aura?AURA_BPM:NORMAL_BPM,state:ctx?.state||'waiting',voices};}
    function changed(){options.onChange?.(status());}
    function persist(){try{env.localStorage?.setItem('caju-audio-v1',JSON.stringify(settings));}catch(_) {}}
    function makeBuffer(name,length,sample) {
      const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*length),ctx.sampleRate), data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=sample(i/ctx.sampleRate,i/data.length);
      buffers[name]=buffer;
    }
    function build() {
      const Constructor=env.AudioContext||env.webkitAudioContext;
      if(!Constructor)return false;
      try {
        ctx=new Constructor();master=ctx.createGain();music=ctx.createGain();sfx=ctx.createGain();
        const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-16;compressor.ratio.value=4;compressor.attack.value=.006;compressor.release.value=.2;
        music.connect(master);sfx.connect(master);master.connect(compressor);compressor.connect(ctx.destination);
        makeBuffer('click',.045,(t,x)=>Math.sin(2*Math.PI*(900*t+1400*t*t))*Math.sin(Math.PI*x)*Math.exp(-x*5)*.5);
        makeBuffer('kick',.17,(t,x)=>Math.sin(2*Math.PI*(48*t+80*.03*(1-Math.exp(-t/.03))))*Math.exp(-x*8));
        makeBuffer('hat',.045,(_,x)=>(Math.random()*2-1)*Math.exp(-x*12));
        makeBuffer('clap',.12,(_,x)=>(Math.random()*2-1)*Math.exp(-x*9)*.5);
        ctx.onstatechange=changed;volumes();return true;
      }catch(_){ctx=null;return false;}
    }
    function volumes(){if(!ctx)return;const t=ctx.currentTime;master.gain.setTargetAtTime(settings.muted?0:.7,t,.025);music.gain.setTargetAtTime(settings.music,t,.025);sfx.gain.setTargetAtTime(settings.sfx,t,.015);}
    function finish(source,gain){voices++;source.onended=()=>{source.disconnect();gain.disconnect();voices=Math.max(0,voices-1);};}
    function sample(name,at,volume,bus){if(voices>=36)return;const source=ctx.createBufferSource(), gain=ctx.createGain();source.buffer=buffers[name];gain.gain.value=volume;source.connect(gain);gain.connect(bus);finish(source,gain);source.start(at);}
    function tone(midi,at,length,volume,bus,type='triangle') {
      if(voices>=36)return;
      const source=ctx.createOscillator(), gain=ctx.createGain();source.type=type;source.frequency.value=440*2**((midi-69)/12);
      gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
      source.connect(gain);gain.connect(bus);finish(source,gain);source.start(at);source.stop(at+length+.015);
    }
    function pump(){
      if(!ctx||ctx.state!=='running'||settings.muted||env.document?.hidden)return;
      const now=ctx.currentTime;
      if(next<now-.1)next=now+.02;
      while(next<now+.15){
        if(settings.music>0)for(const note of score(step,aura)) {
          if(note.drum)sample(note.drum,next,note.volume,music);
          else tone(note.midi,next,note.length,note.volume,music,note.type);
        }
        step=(step+1)%64;next+=60/(aura?AURA_BPM:NORMAL_BPM)/4;
      }
    }
    function run(){if(!timer)timer=env.setInterval(pump,60);}
    function pause(){if(timer){env.clearInterval(timer);timer=null;}if(ctx?.state==='running')ctx.suspend().catch(()=>{});}
    async function unlock(){
      if(!ctx&&!build()){changed();return;}
      unlocked=true;
      if(!settings.muted&&!env.document?.hidden){try{const restart=ctx.state!=='running'||!timer;await ctx.resume();if(restart){next=ctx.currentTime+.02;run();pump();}}catch(_) {}}
      changed();
    }
    function play(name,monotonic=env.performance.now()) {
      if(!ctx||!unlocked||settings.muted||settings.sfx===0||env.document?.hidden)return;
      if(name==='click'){
        if(monotonic-clickAt<65)return;clickAt=monotonic;
        sample('click',ctx.currentTime,.4,sfx);return;
      }
      if(monotonic-(lastEffect.get(name)??-Infinity)<180)return;
      lastEffect.set(name,monotonic);
      for(const [midi,delay,length]of effects[name]||[])tone(midi,ctx.currentTime+delay,length,.14,sfx);
    }
    function setAura(active){if(aura===!!active)return;aura=!!active;changed();}
    function configure(patch){settings={muted:patch.muted??settings.muted,music:clamp(patch.music,settings.music),sfx:clamp(patch.sfx,settings.sfx)};volumes();persist();if(settings.muted)pause();else if(unlocked)unlock();changed();}
    function visibility(){if(env.document?.hidden)pause();else if(unlocked&&!settings.muted)unlock();}
    function dispose(){pause();ctx?.close().catch(()=>{});}
    return {unlock,play,setAura,configure,status,visibility,dispose};
  }
  const api={create,score,effects,NORMAL_BPM,AURA_BPM};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CajuAudio=api;
})(typeof window!=='undefined'?window:globalThis);
