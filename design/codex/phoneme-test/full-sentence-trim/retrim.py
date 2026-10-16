# Re-trim name clips that leaked "is"/"s" (K Q P U V D). No new generation: reuses audio/*-name-full.mp3.
# start = max(Whisper target-word start, end of last silence gap after "is") - up to 60 ms margin (kept inside the silence gap, so the stop burst is intact);
# if no gap (voiced z runs into U/V), fall back to max(energy minimum, end of z frication).
# Then STT-verify; if "is"/s leaks, push start +20 ms (max 6 tries). End unchanged (60 ms tail rule).
import json,re,subprocess,numpy as np
from faster_whisper import WhisperModel
P='/workspace/rsabc-full-sentence-trim/'
FIX='kqpuvd'
m=WhisperModel("small.en",compute_type="int8")
pcm=lambda f:np.frombuffer(subprocess.run(['ffmpeg','-loglevel','quiet','-i',f,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout,np.float32)
z=np.zeros(8000,np.float32)
def stt(a,w=False):
  segs=list(m.transcribe(a,language='en',word_timestamps=w,condition_on_previous_text=False)[0])
  return ' '.join(s.text.strip() for s in segs) or '(nothing)',[x for s in segs for x in (s.words or [])]
LEAK=re.compile(r"^\W*(is|it'?s|its|his|this|s|z|es|ez)\b|^\W*[sz](?!ee|ea)",re.I)
def leaked(t,letter): return bool(LEAK.match(t)) and not (letter in 'CSZ' and not re.match(r"^\W*(is|it'?s|its|his|this)\b",t,re.I))
d=json.load(open(P+'clips.json'))
for it in d['items']:
  if it['kind']!='name' or it['letter'].lower() not in FIX: continue
  a=pcm(P+it['full']); _,ws=stt(a,True)
  isw=next(w for w in ws if w.word.strip().lower().strip('.,')=='is'); tw=ws[-1]
  env=np.array([np.abs(a[i:i+160]).max() for i in range(0,len(a),160)])+1e-9; db=20*np.log10(env/env.max())
  hf=[]
  for i in range(len(db)):
    x=a[i*160:i*160+320]; x=x*np.hanning(len(x)) if len(x)>1 else x; S=np.abs(np.fft.rfft(x))**2; hf.append(S[60:].sum()/(S.sum()+1e-12))
  lo=max(int((isw.start+0.15)*100),int((tw.start-0.08)*100)); hi=int((tw.start+0.3)*100)
  gap_end=None; i=lo
  while i<hi:
    if db[i]<-30:
      j=i
      while j<hi and db[j]<-30: j+=1
      if j-i>=3: gap_start,gap_end=i/100,j/100
      i=j
    else: i+=1
  if gap_end: base=round(float(max(tw.start,gap_start,gap_end-0.06)),3); how='gap'
  else:
    wlo=int((tw.start-0.05)*100); whi=int((tw.start+0.18)*100)
    ei=wlo+int(np.argmin(db[wlo:whi])); emin=ei/100
    fr=[k for k in range(ei-3,ei+6) if hf[k]>0.15]; zend=(fr[-1]+1)/100 if fr else 0
    base=round(float(max(tw.start,emin,zend)),3); how='no-gap'
  old=dict(window=it['trim_window'],dur=it['trim_duration'],stt=it['stt_trim'])
  e0=it['trim_window'][1]
  for k in range(7):
    s0=round(base+0.02*k,3); Ln=e0-s0
    subprocess.run(['ffmpeg','-y','-loglevel','quiet','-ss',f'{s0:.3f}','-t',f'{Ln:.3f}','-i',P+it['full'],'-af',f'afade=t=in:d=0.020,afade=t=out:st={max(0,Ln-0.03):.3f}:d=0.03',P+it['trimmed']])
    t=pcm(P+it['trimmed']); s,_=stt(np.concatenate([z,t,z]))
    if not leaked(s,it['letter']) and s!='(nothing)': break
  it.update(trim_window=[s0,e0],trim_duration=round(len(t)/16000,2),stt_trim=s,retrim=dict(old=old,method=how,is_word=[round(isw.start,2),round(isw.end,2)],target_start=round(tw.start,2),gap_end=gap_end,nudges=k,fade_in_ms=20))
  print(it['id'],how,old,'->',it['trim_window'],it['trim_duration'],repr(s),'nudges',k)
d['meta']['retrim_note']='K Q P U V D names re-trimmed (retrim.py): start after "is" via silence gap / z-frication end, 10 ms margin, 20 ms fade-in, STT-verified. No new generation; 0 credits.'
json.dump(d,open(P+'clips.json','w'),ensure_ascii=False,indent=1)
