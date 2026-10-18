"""Publish finalized, hash-verified assets using the existing Git credential store."""
from pathlib import Path
import concurrent.futures,hashlib,json,subprocess,urllib.request,urllib.parse,urllib.error
R=Path(__file__).resolve().parent.parent;W=R/'work';REPO=W/'github-release19/repo';STAGE=W/'github-release291';ASSETS=STAGE/'release-assets';TAG='v0.29.1';SLUG='Feathercatttt/traveler-folio';API='https://api.github.com/repos/'+SLUG
credential=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,check=True);token=dict(x.split('=',1) for x in credential.stdout.splitlines() if '=' in x)['password']
headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'TravelerFolio-v0.27-release'}
def api(path,body=None,method=None):
 h=dict(headers);data=None
 if body is not None:h['Content-Type']='application/json';data=json.dumps(body).encode()
 request=urllib.request.Request(API+path,data=data,headers=h,method=method or ('POST' if body is not None else 'GET'))
 with urllib.request.urlopen(request,timeout=60) as response:return json.load(response)
def git(*args):
 p=subprocess.run(['git','-C',str(REPO),*args],capture_output=True,text=True,encoding='utf8',errors='replace');assert p.returncode==0,p.stderr;return p.stdout.strip()
assert git('remote','get-url','origin')=='https://github.com/'+SLUG+'.git'
assert api('')['private'] is False
try:release=api('/releases/tags/'+TAG)
except urllib.error.HTTPError as e:
 if e.code!=404:raise
 release=api('/releases',{'tag_name':TAG,'target_commitish':'main','name':'旅人手札 '+TAG+' · 绑定名称联动','body':(REPO/'RELEASE-NOTES.md').read_text(encoding='utf8'),'draft':True,'prerelease':False})
assert release['draft'],'Refusing to replace published release files'
rid=release['id'];existing={a['name']:a for a in release['assets']};files=[p for p in sorted(ASSETS.iterdir()) if p.is_file()]
def sha(p):return 'sha256:'+hashlib.sha256(p.read_bytes()).hexdigest()
def upload(p):
 if p.name in existing:
  a=existing[p.name];assert a['size']==p.stat().st_size and a['digest']==sha(p),'Existing asset differs: '+p.name;return {'name':p.name,'verified':True}
 h=dict(headers);h['Content-Type']='application/octet-stream';url='https://uploads.github.com/repos/'+SLUG+'/releases/'+str(rid)+'/assets?'+urllib.parse.urlencode({'name':p.name})
 req=urllib.request.Request(url,data=p.read_bytes(),headers=h,method='POST')
 with urllib.request.urlopen(req,timeout=1200) as response:a=json.load(response)
 assert a['size']==p.stat().st_size and a['digest']==sha(p),p.name
 return {'name':p.name,'size':a['size'],'verified':True}
print(json.dumps({'draftRelease':rid,'pending':len(files)},ensure_ascii=False),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for result in pool.map(upload,files):print(json.dumps(result,ensure_ascii=False),flush=True)
release=api('/releases/'+str(rid));remote={a['name']:a for a in release['assets']};assert len(remote)==len(files)
for p in files:assert remote[p.name]['size']==p.stat().st_size and remote[p.name]['digest']==sha(p),p.name
git('add','.')
if git('status','--porcelain'):git('commit','-m','Release v0.29.1: linked token names')
commit=git('rev-parse','HEAD');git('push','origin','main');release=api('/releases/'+str(rid),{'target_commitish':commit,'body':(REPO/'RELEASE-NOTES.md').read_text(encoding='utf8'),'draft':False,'make_latest':'true'},'PATCH');assert not release['draft']
result={'success':True,'version':TAG,'repository':'https://github.com/'+SLUG,'release':release['html_url'],'commit':commit,'releaseId':rid,'assets':[{'name':a['name'],'size':a['size'],'digest':a['digest'],'url':a['browser_download_url']} for a in release['assets']]};(STAGE/'publish-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps({'published':result['release'],'commit':commit,'assets':len(result['assets'])},ensure_ascii=False),flush=True)
