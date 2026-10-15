from pathlib import Path
import shutil, subprocess, json
root=Path('/tmp/rsabc-reinvent')
out=root/'out'
configs=[('v1-letter-post','post',"Lucy’s Letter Post",['Air mail','Candy post','Dark']),('v2-sound-garden','garden',"Lucy’s Sound Garden",['Daylight','Peach grove','Dark']),('v3-moonboat','space',"Lucy’s Moonboat",['Dark','Cloud day','Plum dusk'])]
for slug,kind,title,themes in configs:
 d=out/slug; (d/'assets').mkdir(parents=True,exist_ok=True); (d/'stills').mkdir(exist_ok=True)
 for fn in ['NunitoSans-Black.woff2','NunitoSans-Bold.woff2','Comfortaa-Bold.woff2','NunitoSans-OFL.txt','Comfortaa-OFL.txt']:
  shutil.copy(root/'ref/main/app/fonts'/fn,d/'assets'/fn)
 for mood in ['default','specs','celebrate']:
  shutil.copy(root/f'ref/phase2/design/assets/lucy-{mood}.jpg',d/'assets'/f'lucy-{mood}.jpg')
 audio=['lucy-cheer-1.mp3','lucy-cheer-2.mp3','lucy-nudge-1.mp3']
 for l,w in [('s','sun'),('a','apple'),('t','tiger'),('p','pig'),('i','insect'),('m','moon')]:
  audio += [f'lucy-name-{l}.mp3',f'lucy-phoneme-{l}.mp3',f'lucy-word-{l}-{w}.mp3']
 for fn in audio:
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(root/'ref/main/app/audio'/fn),'-af','alimiter=limit=0.89','-codec:a','libmp3lame','-b:a','96k',str(d/'assets'/fn)],check=True)
 shutil.copy(root/'ref/main/app/audio/LICENSES.md',d/'assets/SOURCE-AUDIO-NOTES.md')
 (d/'config.js').write_text('window.CONCEPT = '+json.dumps(dict(kind=kind,title=title,themes=themes,slug=slug))+';\n')
 (d/'index.html').write_text(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#faf5e8"><title>{title} · Little Woof</title><link rel="stylesheet" href="base.css"><link rel="stylesheet" href="style.css"><script src="config.js" defer></script><script src="art.js" defer></script><script src="app.js" defer></script></head>
<body class="{kind}"><a class="skip" href="#main">Skip to play</a><div class="world" aria-hidden="true"></div><div class="app"><header id="header"></header><main id="main" tabindex="-1"></main><footer id="footer"></footer></div><div id="announcer" class="sr-only" role="status" aria-live="polite"></div><div id="confetti" aria-hidden="true"></div><noscript>This little game needs JavaScript enabled in your browser.</noscript></body></html>''')
print('Created three standalone folders and copied local assets.')
