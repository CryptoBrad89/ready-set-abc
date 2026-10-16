import json,re,subprocess,urllib.request,numpy as np
from faster_whisper import WhisperModel
P='/workspace/rsabc-full-sentence-trim/'
gens=[]
for f in ['29389fb0-e185-4cb2-abcc-acdfbe91ff9e','a9ee3d9f-5d0b-4976-8781-9e0854699956','5340294c-9db4-4685-85a4-a894f90b0c48']:
  s=open(f'/workspace/agent-tools/{f}.txt').read(); d=json.loads(s[s.index('{'):s.rindex('}')+1])
  assert d['all_completed'],f; gens+=d['generations']
ipa=dict(a='æ',b='b',c='k',d='d',e='ɛ',f='f',g='ɡ',h='h',i='ɪ',j='dʒ',k='k',l='l',m='m',n='n',o='ɑ',p='p',q='kw',r='ɹ',s='s',t='t',u='ʌ',v='v',w='w',x='ks',y='j',z='z')
items=[]
for L in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
  items.append(dict(id=f'{L.lower()}-name',letter=L,kind='name',intended=f'name {L}',text=f'The letter is "{L}".'))
  l=L.lower(); items.append(dict(id=f'{l}-sound',letter=L,kind='sound',intended=f'/{ipa[l]}/',text=f'The sound is "/{ipa[l]}/".'))
items.append(dict(id='i-long-extra',letter='I',kind='extra',intended='long I /aɪ/',text='The sound is "/aɪ/".'))
items.append(dict(id='g-soft-extra',letter='G',kind='extra',intended='soft G /dʒ/ (same clip as J sound)',text='The sound is "/dʒ/".',alias='j-sound'))
C_SESS='7gwv8kARAw0BF1IsT75I'
bytext={}
for g in gens:
  t=g['prompt']
  if t=='The sound is "/k/".': key='c-sound' if C_SESS in g['content_url'] else 'k-sound'
  else: key=t
  bytext[key]=g
print(len(gens))
m=WhisperModel("small.en",compute_type="int8")
pcm=lambda f:np.frombuffer(subprocess.run(['ffmpeg','-loglevel','quiet','-i',f,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout,np.float32)
z=np.zeros(8000,np.float32)
def stt(a,w=False):
  segs=list(m.transcribe(a,language='en',word_timestamps=w,condition_on_previous_text=False)[0])
  return ' '.join(s.text.strip() for s in segs) or '(nothing)',[x for s in segs for x in (s.words or [])]
STOPS=set('bdgkpt')
for it in items:
  if 'alias' in it: continue
  g=bytext.get(it['id']) or bytext[it['text']]
  full=f"audio/{it['id']}-full.mp3"; trim=f"audio/{it['id']}-trim.mp3"
  0 if __import__('os').path.exists(P+full) else urllib.request.urlretrieve(g['content_url'],P+full)
  a=pcm(P+full); dur=len(a)/16000
  it.update(full=full,trimmed=trim,model='eleven_v4',credits=round(g['price']['credits']),full_duration=g['duration_secs'])
  it['stt_full'],ws=stt(a,True)
  env=np.array([np.abs(a[i:i+160]).max() for i in range(0,len(a),160)])+1e-9
  db=20*np.log10(env/env.max())
  isw=[w for w in ws if w.word.strip().lower().strip('.,')=='is']
  lo=int((isw[0].start+0.12)*100) if isw else int(ws[-1].start*100)-20
  hi=int(ws[-1].end*100) if ws else len(db)
  low=db[lo:hi]<-32; best=(0,0); i=0
  while i<len(low):
    if low[i]:
      j=i
      while j<len(low) and low[j]: j+=1
      if j-i>=best[1]-best[0]: best=(i,j) if j-i>=3 else best
      i=j
    else: i+=1
  start=(lo+best[1])/100 if best[1] else (ws[-1].start if ws else dur-0.6)
  act=np.where(db>-45)[0]; end=(act[-1]+1)/100 if len(act) else dur
  stop=it['kind']=='sound' and it['letter'].lower() in STOPS
  e0=min(dur,end+(0.15 if stop else 0.06))
  cands=[start-0.04]+([ws[-1].start+d for d in (0,0.04,0.08,0.12)] if ws else [])
  if start>=e0-0.15 and ws: cands=cands[1:]
  for k,c0 in enumerate(cands):
    s0=max(0,c0); Ln=e0-s0
    subprocess.run(['ffmpeg','-y','-loglevel','quiet','-ss',f'{s0:.3f}','-t',f'{Ln:.3f}','-i',P+full,'-af',f'afade=t=in:d=0.015,afade=t=out:st={max(0,Ln-0.03):.3f}:d=0.03',P+trim])
    t=pcm(P+trim); it['stt_trim'],_=stt(np.concatenate([z,t,z]))
    if not re.match(r"\W*(is|it's|it is|the|sound|letter)\b",it['stt_trim'],re.I) and Ln<1.2: break
  it['trim_window']=[round(s0,3),round(e0,3)]; it['trim_duration']=round(len(t)/16000,2); it['trim_retries']=k
  it['slash_spoken']='slash' in (it['stt_full']+it['stt_trim']).lower()
for it in items:
  if 'alias' in it:
    src=next(x for x in items if x['id']==it['alias'])
    it.update({k:src[k] for k in ['full','trimmed','model','credits','full_duration','stt_full','trim_window','trim_duration','stt_trim','slash_spoken']}); it['credits']=0
  print(it['id'],'|',it['stt_full'],'|',it['stt_trim'],it['trim_duration'])
meta=dict(voice='Lucy FgiNpTIapnCbaD6xiqIo',model='eleven_v4',normalization='default (auto) — connector cannot set off',
 total_credits=sum(round(g['price']['credits']) for g in gens),generations=len(gens),
 trim_method='Whisper word timestamps + energy-envelope gap detection after "is" (-32 dB rel), end at last frame >-45 dB; pad 40 ms before, 60 ms after (150 ms for stop sounds b d g k p t); 15/30 ms fades',
 stt_note='Whisper small.en; trimmed clips padded with 0.5 s silence. STT cannot judge phoneme quality; short sounds often transcribe as a letter name or nothing.')
json.dump(dict(meta=meta,items=items),open(P+'clips.json','w'),ensure_ascii=False,indent=1)
print(meta['total_credits'])
