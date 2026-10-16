# Fails (exit 1) if any trimmed clip's STT starts with "is"/"it's", or any name trim has a leading s/z leak.
import json,re,subprocess,sys,numpy as np
from faster_whisper import WhisperModel
P='/workspace/rsabc-full-sentence-trim/'
m=WhisperModel("small.en",compute_type="int8")
pcm=lambda f:np.frombuffer(subprocess.run(['ffmpeg','-loglevel','quiet','-i',f,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout,np.float32)
z=np.zeros(8000,np.float32)
IS=re.compile(r"^\W*(is|it'?s|its|his|this)\b",re.I); S=re.compile(r"^\W*[sz](?!ee|ea)",re.I)
d=json.load(open(P+'clips.json')); bad=0; seen=set()
for it in d['items']:
  if it['trimmed'] in seen: continue
  seen.add(it['trimmed'])
  t=' '.join(s.text.strip() for s in m.transcribe(np.concatenate([z,pcm(P+it['trimmed']),z]),language='en',condition_on_previous_text=False)[0]) or '(nothing)'
  fail=bool(IS.match(t)) or (it['kind']=='name' and it['letter'] not in 'CSZX' and bool(S.match(t)))
  bad+=fail; print('FAIL' if fail else 'ok  ',it['id'],repr(t))
print(f'{len(seen)} clips, {bad} failed'); sys.exit(1 if bad else 0)
