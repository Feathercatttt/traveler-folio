from pathlib import Path
import json,subprocess,time,urllib.request,base64,hashlib
R=Path(__file__).resolve().parent.parent;W=R/'work';result=json.loads((W/'github-release29/publish-result.json').read_text(encoding='utf8'));slug='Feathercatttt/traveler-folio';api='https://api.github.com/repos/'+slug
creds=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,check=True);token=dict(x.split('=',1) for x in creds.stdout.splitlines() if '=' in x)['password'];headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'TravelerFolio-verify23'}
def get(url,auth=False):
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers if auth else {'Cache-Control':'no-cache','User-Agent':'TravelerFolio-verify23'}),timeout=20) as r:return r.read()
release=json.loads(get(api+'/releases/tags/v0.29.0',True));assert not release['draft'] and len(release['assets'])==9
expected={a['name']:a for a in result['assets']}
for a in release['assets']:assert a['digest']==expected[a['name']]['digest'] and a['size']==expected[a['name']]['size']
local=(W/'github-release19/repo/updates/stable.json').read_bytes()
for attempt in range(30):
 stable=get('https://raw.githubusercontent.com/'+slug+'/main/updates/stable.json?t='+str(time.time_ns()))
 if stable==local:break
 if attempt==0:print('Waiting for raw main CDN cache to refresh',flush=True)
 time.sleep(6)
else:raise RuntimeError('Raw update manifest still cached')
assert json.loads(base64.b64decode(json.loads(stable)['payload']))['version']=='0.28.0'
print('Public release: 9 matching assets; raw automatic update manifest v0.29 verified',flush=True)
last=None
for attempt in range(36):
 runs=json.loads(get(api+'/actions/runs?head_sha='+result['commit']+'&per_page=10',True));run=next((x for x in runs['workflow_runs'] if x['name']=='Publish Owlbear extension'),None)
 state=(run['status'],run.get('conclusion')) if run else ('pending',None)
 if state!=last:print('Pages workflow:',state,flush=True);last=state
 if run and run['status']=='completed':
  assert run['conclusion']=='success',run['html_url'];break
 time.sleep(8)
else:raise RuntimeError('Pages deployment still pending')
base='https://feathercatttt.github.io/traveler-folio/'
for attempt in range(18):
 try:
  card=json.loads(get(base+'manifest.json?t='+str(time.time_ns())));tools=json.loads(get(base+'tools-manifest.json?t='+str(time.time_ns())))
  if card['version']==tools['version']=='0.28.0':break
 except Exception as e:print(type(e).__name__,str(e)[:160],flush=True)
 time.sleep(6)
else:raise RuntimeError('Pages manifest version not updated yet')
assert card['action']['popover']=='http://localhost:17632/panel.html?v=0.28.0'
report={'success':True,'version':'0.28.0','release':release['html_url'],'assets':9,'commit':result['commit'],'pagesWorkflow':run['html_url'],'pagesManifest':card,'toolsManifest':tools,'updateManifestVerified':True};(W/'v28-published-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print('Pages live: v0.29.0; native action mini and separate tools manifest verified',flush=True)

assert tools['action']['popover']=='http://localhost:17632/tools19.html?v=0.28.0'
