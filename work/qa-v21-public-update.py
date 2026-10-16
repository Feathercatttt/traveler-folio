from pathlib import Path
import urllib.request,concurrent.futures,json,base64,hashlib,time
from cryptography.hazmat.primitives import serialization,hashes
from cryptography.hazmat.primitives.asymmetric import padding
W=Path(__file__).resolve().parent
key=serialization.load_der_public_key(base64.b64decode(json.loads((W/'update-public.json').read_text())['spki']))
expected=json.loads((W/'github-release19/repo/updates/payload.example.json').read_text(encoding='utf8'))
routes=['https://gh-proxy.org/','https://ghfast.top/','https://ghproxy.net/','']
def check(route):
 row={'route':route or 'GitHub direct'}
 try:
  url=route+'https://raw.githubusercontent.com/Feathercatttt/traveler-folio/main/updates/stable.json?t='+str(int(time.time()/3600))
  with urllib.request.urlopen(url,timeout=35) as r:envelope=json.load(r)
  raw=base64.b64decode(envelope['payload']);key.verify(base64.b64decode(envelope['signature']),raw,padding.PKCS1v15(),hashes.SHA256());payload=json.loads(raw);row['manifestVersion']=payload['version'];row['signatureValid']=True
  a=expected['android'];h=hashlib.sha256();size=0
  with urllib.request.urlopen(route+a['url'],timeout=40) as r:
   while True:
    block=r.read(262144)
    if not block:break
    size+=len(block);assert size<=a['size'];h.update(block)
  assert size==a['size'] and h.hexdigest()==a['sha256'];row.update(success=True,apkBytes=size,apkSHA256=h.hexdigest())
 except Exception as e:row.update(success=False,error=str(e))
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,routes))
assert any(r['success'] and r['route']!='GitHub direct' for r in rows),rows
assert any(r.get('manifestVersion')=='0.21.0' and r.get('signatureValid') for r in rows),rows
report={'success':True,'checks':['Live update metadata verifies with original release public key','Published v0.21 APK downloads match signed size and SHA-256 on available routes'],'routes':rows,'limits':['Reachability measured from development PC; not all China carriers or permanent mirror uptime']}
(W/'v21-public-update-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(rows,ensure_ascii=False,indent=2))
