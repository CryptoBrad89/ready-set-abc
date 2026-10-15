from PIL import Image,ImageDraw
from pathlib import Path
for folder in Path('out').glob('v*'):
 for kind,sizes in [('landscape',['1920x1080','1366x768','1180x820','844x390']),('portrait',['820x1180','390x844'])]:
  cw=350 if kind=='landscape' else 440
  rows=[]
  for state in ['home','listen','match','celebrate']:
   tiles=[]
   for size in sizes:
    file=folder/'stills'/f'{state}-{size}-fullpage.png'
    if not file.exists():file=folder/'stills'/f'{state}-{size}.png'
    im=Image.open(file);im.thumbnail((cw,720))
    tile=Image.new('RGB',(cw,im.height+28),'#ddd');tile.paste(im,((cw-im.width)//2,28));ImageDraw.Draw(tile).text((8,6),f'{state} {size}',fill='black');tiles.append(tile)
   row=Image.new('RGB',(cw*len(sizes),max(t.height for t in tiles)),'#ddd')
   for i,tile in enumerate(tiles):row.paste(tile,(i*cw,0))
   rows.append(row)
  sheet=Image.new('RGB',(cw*len(sizes),sum(r.height for r in rows)),'white');y=0
  for row in rows:sheet.paste(row,(0,y));y+=row.height
  sheet.save(Path('out/_qa')/f'{folder.name}-{kind}.jpg')
 imgs=[]
 for theme in range(3):
  im=Image.open(folder/'stills'/f'theme-{theme}-home.png');im.thumbnail((650,650));imgs.append(im)
 sheet=Image.new('RGB',(650*3,max(im.height for im in imgs)),'#ddd')
 for i,im in enumerate(imgs):sheet.paste(im,(i*650,0))
 sheet.save(Path('out/_qa')/f'{folder.name}-themes.jpg')
