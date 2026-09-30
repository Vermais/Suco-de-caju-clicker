const test=require('node:test');
const assert=require('node:assert/strict');
const {create,score,effects,NORMAL_BPM,AURA_BPM}=require('../dist/audio.js');
function setup(){
  const starts=[],timers=new Map(),storage=new Map();let hidden=false,intervals=0;
  const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Context{
    constructor(){this.sampleRate=8000;this.currentTime=0;this.state='suspended';this.destination={};Context.last=this;}
    createGain(){return{gain:param(),connect(){},disconnect(){}};}
    createDynamicsCompressor(){return{threshold:param(),ratio:param(),attack:param(),release:param(),connect(){}};}
    createBuffer(_,length){const data=new Float32Array(length);return{getChannelData:()=>data};}
    createBufferSource(){return{connect(){},disconnect(){},start(at){starts.push({type:'sample',at});},stop(){}};}
    createOscillator(){return{frequency:param(),connect(){},disconnect(){},start(at){starts.push({type:'tone',at});},stop(){}};}
    async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
  }
  const env={AudioContext:Context,document:{get hidden(){return hidden;}},performance:{now:()=>0},
    setInterval:fn=>{timers.set(++intervals,fn);return intervals;},clearInterval:id=>timers.delete(id),
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
  const sound=create({env});return{sound,starts,timers,storage,env,Context,hide:v=>{hidden=v;}};
}
test('trilha original muda de 100 para 146 BPM e adiciona ritmo na aura',()=>{
  const count=aura=>Array.from({length:64},(_,i)=>score(i,aura)).flat().length;
  assert.ok(AURA_BPM>NORMAL_BPM);
  assert.ok(count(true)>count(false));
  assert.ok(score(0,false).some(n=>n.midi));
  for(const name of ['click','purchase','upgrade','rebirth','event','achievement','aura','mission'])assert.ok(effects[name].length);
});
test('áudio só inicia após gesto e rajada de 1ms mantém efeito de clique limitado',async()=>{
  const {sound,starts}=setup();sound.play('click',0);assert.equal(starts.length,0);
  await sound.unlock();sound.configure({music:0});const before=starts.length;
  for(let ms=0;ms<1000;ms++)sound.play('click',ms);
  assert.equal(starts.length-before,16);
  assert.ok(sound.status().voices<=36);
  sound.dispose();
});
test('mute, volumes e aura persistem corretamente sem duplicar scheduler',async()=>{
  const {sound,timers,storage,env}=setup();await sound.unlock();assert.equal(timers.size,1);
  sound.configure({music:.2,sfx:.7});await Promise.resolve();assert.equal(timers.size,1);
  sound.setAura(true);assert.equal(sound.status().bpm,146);
  sound.configure({muted:true});assert.equal(timers.size,0);
  assert.equal(JSON.parse(storage.get('caju-audio-v1')).muted,true);
  const reloaded=create({env});assert.equal(reloaded.status().muted,true);assert.equal(reloaded.status().sfx,.7);
  sound.configure({muted:false});await Promise.resolve();assert.equal(timers.size,1);
  sound.setAura(false);assert.equal(sound.status().bpm,100);
  sound.dispose();
});
test('trocar de aba suspende e retoma música sem gerar loops adicionais',async()=>{
  const {sound,hide,timers,Context}=setup();await sound.unlock();hide(true);sound.visibility();assert.equal(timers.size,0);assert.equal(Context.last.state,'suspended');
  hide(false);sound.visibility();await Promise.resolve();assert.equal(timers.size,1);
  sound.dispose();
});
