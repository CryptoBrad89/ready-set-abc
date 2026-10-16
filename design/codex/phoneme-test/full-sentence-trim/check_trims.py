# Fails (exit 1) if any trimmed clip's STT starts with "is"/"it's", or any name trim has a leading s/z leak.
import json,re,subprocess,sys,numpy as np
from faster_whisper import WhisperModel
P='/workspace/rsabc-full-sentence-trim/'
m=WhisperModel("small.en",compute_type="int8")
pcm=lambda f:np.frombuffer(subprocess.run(['ffmpeg','-loglevel','quiet','-i',f,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout,np.float32)
z=np.zeros(8000,np.float32)
IS=re.compile(r"^\W*(is|it'?s|its|his|this)\b",re.I); S=re.compile(r"^\W*[sz](?!ee|ea)",re.I)
NAMES=dict(A='a|ay|eh|hey',B='b|bee|be',C='c|see|sea|she',D='d|dee',E='e|ee|he',F='f|ef|eff',G='g|gee|ji',H='h|aitch|age|each',I='i|eye|aye|hi',J='j|jay|j\\.?',K='k|kay|okay|ok',L='l|el|elle|ell',M='m|em|um',N='n|en|and|in',O='o|oh|owe',P='p|pee|pea|pe',Q='q|queue|cue|kyu',R='r|are|our|ar',S='s|ess|yes',T='t|tee|tea',U='u|you|yu|ew',V='v|vee|ve',W='w|double ?you|double u|dub',X='x|ex|axe|ax',Y='y|why|wy',Z='z|zee|zed')
def name_ok(t,L): return bool(re.fullmatch(r"\W*("+NAMES[L]+r")\W*",t,re.I))
d=json.load(open(P+'clips.json')); bad=0; seen=set()
for it in d['items']:
  if it['trimmed'] in seen: continue
  seen.add(it['trimmed'])
  t=' '.join(s.text.strip() for s in m.transcribe(np.concatenate([z,pcm(P+it['trimmed']),z]),language='en',condition_on_previous_text=False)[0]) or '(nothing)'
  fail=bool(IS.match(t)) or (it['kind']=='name' and it['letter'] not in 'CSZX' and bool(S.match(t)))
  if it['kind']=='name' and not name_ok(t,it['letter']): fail=True; t+='  [letter mismatch]'
  bad+=fail; print('FAIL' if fail else 'ok  ',it['id'],repr(t))
print(f'{len(seen)} clips, {bad} failed'); sys.exit(1 if bad else 0)
