#!/usr/bin/env python3
"""Rebuild deterministic PWA icons and precache after changing shipped files. Offline, stdlib only."""
import hashlib
import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def icon(size, maskable=False):
    # Code-native envelope logo. All meaningful pixels stay in the maskable safe zone.
    cream, coral, white = (249,232,201), (198,95,71), (255,250,242)
    def pixel(x,y):
        u,v=x/size,y/size
        if .19<u<.81 and .25<v<.76:
            if abs(v-(.49-abs(u-.5)*.67))<.015 and v<.49: return white
            # A clear letter A in the lower envelope.
            if .49<v<.69:
                dy=(v-.49)/.2
                if abs(u-(.5-dy*.075))<.012 or abs(u-(.5+dy*.075))<.012 or (.605<v<.625 and abs(u-.5)<.052):return white
            return coral
        return cream
    raw=b''.join(b'\0'+bytes(c for x in range(size) for c in pixel(x,y)) for y in range(size))
    def chunk(name, data):return struct.pack('!I',len(data))+name+data+struct.pack('!I',zlib.crc32(name+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')

def build():
    for filename,size in [('icon-192.png',192),('icon-512.png',512),('icon-maskable.png',512)]:
        (ROOT/'art'/filename).write_bytes(icon(size,'maskable' in filename))
    files=sorted(p for p in ROOT.rglob('*') if p.is_file() and not any(part in {'tests','tools','__pycache__'} for part in p.relative_to(ROOT).parts) and p.name!='sw.js')
    revision=hashlib.sha256(b''.join(p.relative_to(ROOT).as_posix().encode()+p.read_bytes() for p in files)).hexdigest()[:16]
    precache=['./']+[p.relative_to(ROOT).as_posix() for p in files]+['sw.js']
    needs=json.loads((ROOT/'needs/needs.json').read_text())
    optional=[v['file'] for group in needs.values() for v in group if not (ROOT/v['file']).is_file()]
    source=(ROOT/'tools/sw-template.js').read_text()
    source=source.replace('__REVISION__',revision).replace('__PRECACHE__',json.dumps(precache,indent=2)).replace('__OPTIONAL__',json.dumps(optional,indent=2))
    (ROOT/'sw.js').write_text(source)
    print(f'Built offline cache {revision}: {len(precache)} required URLs, {len(optional)} pending assets')

if __name__=='__main__':build()
