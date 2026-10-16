"""Draw original app icons using only Python's stdlib. Not Lucy artwork."""
from pathlib import Path
import struct,zlib,math
ROOT=Path(__file__).resolve().parents[1]
# A rounded sunny tile and a five-petal flower, matching icon.svg.
for size in (192,512):
 raw=bytearray()
 for y in range(size):
  raw.append(0)
  for x in range(size):
   px=(x+.5)*512/size;py=(y+.5)*512/size
   corner=max(0,abs(px-256)-144)**2+max(0,abs(py-256)-144)**2
   color=(255,184,0,255) if corner<=112**2 else (0,0,0,0)
   if color[3]:
    if 248<px<264 and 210<py<421:color=(69,153,106,255)
    if ((px-216)/46)**2+((py-329)/20)**2<1 or ((px-301)/43)**2+((py-288)/19)**2<1:color=(69,153,106,255)
    for cx,cy in [(256,151),(192,196),(218,268),(294,268),(320,196)]:
     dist=math.hypot(px-cx,py-cy)
     if dist<61:color=(103,69,50,255) if dist>49 else (255,248,245,255)
    dist=math.hypot(px-256,py-217)
    if dist<53:color=(103,69,50,255) if dist>41 else (255,184,0,255)
   raw.extend(color)
 def chunk(kind,data):return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
 output=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
 (ROOT/'art'/f'icon-{size}.png').write_bytes(output)
print('Drew 192px and 512px PWA icons')
