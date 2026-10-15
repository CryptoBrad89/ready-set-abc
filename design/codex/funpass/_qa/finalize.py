from pathlib import Path
from PIL import Image
import json,struct,subprocess
root=Path('out');qa=root/'_qa'
read=lambda name:json.loads((qa/name).read_text())
layout=read('layout-report.json');edge=read('edge-report.json');fun=read('fun-report.json');functional=read('functional-report.json');contrast=read('contrast-report.json');videos=read('video-report.json')
layout_fail=[r for r in layout if r.get('overflow') or r.get('buttons') or r.get('errors')]
edge_fail=[r for r in edge if r.get('overflow') or r.get('hit') is False]
sizes=[(1920,1080),(1366,768),(820,1180),(1180,820),(390,844),(844,390)]
images=[];video_checks=[]
for d in ['v1-letter-post','v3-moonboat']:
 for w,h in sizes:
  for state in ['home','listen','match','celebrate']:
   p=root/d/'stills'/f'{state}-{w}x{h}.png';actual=Image.open(p).size;images.append({'path':str(p),'expected':[w,h],'actual':list(actual),'passed':actual==(w,h)})
 for t in range(3):assert (root/d/'stills'/f'theme-{t}-home.png').exists()
 for state in ['hint','collection','collection-full']:
  for size in ['1366x768','390x844']:assert (root/d/'stills'/f'{state}-{size}.png').exists()
 p=root/d/'motion.mp4';data=p.read_bytes();boxes=[];offset=0
 while offset+8<=len(data):
  size,kind=struct.unpack('>I4s',data[offset:offset+8]);boxes.append(kind.decode());
  if size<8:break
  offset+=size
 probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(p)]));stream=probe['streams'][0];duration=float(probe['format']['duration'])
 video_checks.append({'path':str(p),'duration':duration,'bytes':len(data),'codec':stream['codec_name'],'pixelFormat':stream['pix_fmt'],'faststart':boxes.index('moov')<boxes.index('mdat'),'passed':15<=duration<=20 and len(data)<5_000_000 and stream['codec_name']=='h264' and stream['pix_fmt']=='yuv420p' and boxes.index('moov')<boxes.index('mdat')})
files=[p for p in root.rglob('*') if p.is_file()];big=[{'path':str(p),'bytes':p.stat().st_size} for p in files if p.stat().st_size>=5_000_000]
report={'passed':not(layout_fail or edge_fail or contrast or big) and all(r.get('passed',True) for r in fun+functional) and all(r['passed'] for r in images+video_checks),'mainLayoutCases':sum('screen' in r for r in layout),'layoutFailures':layout_fail,'edgeCases':sum('state' in r for r in edge),'edgeFailures':edge_fail,'contrastCases':36,'contrastFailures':contrast,'funSafetyPassed':all(r['passed'] for r in fun),'functionalPassed':all(r.get('passed',True) for r in functional),'exactViewportStills':images,'videos':video_checks,'filesChecked':len(files),'oversizedFiles':big,'largestFile':{'path':str(max(files,key=lambda p:p.stat().st_size)),'bytes':max(p.stat().st_size for p in files)},'visualReview':{'inspected':['Both landscape contact sheets (all 4 requested wide sizes, all 4 screens)','Both portrait contact sheets (both requested portrait sizes, all 4 screens)','All six home theme compositions','Phone hint states','Both full six-item phone collections','Moonboat rim-star reward','Both video contact sheets at 1, 3, 6, 8, 10, 12, 14.5 seconds','280px Moonboat celebration'],'fixed':['Fast touch taps incorrectly suppressed by event.detail filtering','Reward stars crowding the Moonboat label','Rotated decorative reward ring producing scroll overflow at 280px']},'limits':['Chromium automated desktop browser; no physical-device, Safari/Firefox or screen-reader usability test','Hidden-tab event logic exercised by controlled document.hidden override and visibilitychange','Playwright recordVideo is silent; recorded MP3 completion and WebAudio starts/stops verified separately']}
(qa/'final-report.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['exactViewportStills','visualReview']},indent=2));assert report['passed']
