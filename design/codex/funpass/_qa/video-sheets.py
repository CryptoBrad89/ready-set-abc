from PIL import Image,ImageDraw
from pathlib import Path
import subprocess
for d in ['v1-letter-post','v3-moonboat']:
 frames=[]
 for t in [1,3,6,8,10,12,14.5]:
  f=Path('out/_qa')/f'{d}-frame-{t}.jpg'
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(t),'-i',f'out/{d}/motion.mp4','-frames:v','1','-q:v','3',str(f)],check=True)
  im=Image.open(f);im.thumbnail((472,328));tile=Image.new('RGB',(472,356),'#ddd');tile.paste(im,(0,28));ImageDraw.Draw(tile).text((8,7),f'{t} seconds',fill='#111');frames.append(tile);im.close();f.unlink()
 sheet=Image.new('RGB',(472*4,356*2),'#ddd')
 for i,frame in enumerate(frames):sheet.paste(frame,((i%4)*472,(i//4)*356))
 sheet.save(f'out/_qa/{d}-video.jpg')
