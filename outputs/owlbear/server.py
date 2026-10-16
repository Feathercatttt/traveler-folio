"""Private loopback bridge for the offline Folio and Owlbear extension. Python 3 stdlib only."""
import argparse,json,secrets,threading,time,urllib.parse,mimetypes,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from transfer_service import TransferService
from once_service18 import OnceService18
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument('--port',type=int,default=17632)
 parser.add_argument('--data-dir',type=Path)
 args=parser.parse_args()
 handoff=TransferService(args.port+1)
 here=Path(__file__).resolve().parent;folder=here.parent;plugin=json.loads((here/'plugin-version.json').read_text(encoding='utf8'))
 data=(args.data_dir or here/'user-data').resolve();data.mkdir(parents=True,exist_ok=True)
 cache=data/'state.json';lock=threading.RLock();token=secrets.token_urlsafe(32)
 db={'revision':0,'raw':None,'view':None,'updated':0,'onceJournal18':{}};backgrounds={};last_main=[0];commands=[];jobs=[];results=[];seen={}
 if cache.exists():
  try:
   loaded=json.loads(cache.read_text(encoding='utf-8'));db.update({k:loaded[k] for k in db if k in loaded})
  except (OSError,ValueError):print('Previous bridge cache could not be read; keeping the file and using browser data.')
 once=OnceService18(db)
 paths={'/manifest.json':here/'manifest.json','/panel.html':here/'panel.html','/panel.js':here/'panel.js','/background.html':here/'background.html','/background.js':here/'background.js','/style.css':here/'style.css','/icon.svg':here/'icon.svg','/card.html':folder/'旅人手札.html','/':here/'install.html','/install.html':here/'install.html','/roll.html':here/'roll.html','/roll.js':here/'roll.js','/LICENSE-sdk.txt':here/'LICENSE-sdk.txt'}
 for name in ['tools-manifest.json','launcher21.html','launcher21.js','connect21.html','results21.html','results21.js','status18.html','status18.js','tools19.html','tools19.css','tools19.js','surface19.html','surface19.js','tools19.svg','heart19.svg','target19.svg','dice-effect19.html','dice-effect19.js','LICENSE-suite19.txt','THIRD-PARTY19.txt']:paths['/'+name]=here/name
 for name in ['d4.png','d6.png','d8.png','d10.png','d12.png','d20.png','d100.png','dice.mp3','cartoon.mp3']:paths['/suite19/'+name]=here/'suite19'/name
 # Serve every public root asset; new styles cannot be silently omitted from a manual list.
 for asset in here.iterdir():
  if asset.is_file() and asset.suffix in ('.html','.js','.css','.svg'):paths['/'+asset.name]=asset
 paths['/plugin-version.json']=here/'plugin-version.json'
 allowed={'null','https://feathercatttt.github.io','https://owlbear.app','https://www.owlbear.app','https://owlbear.rodeo','https://www.owlbear.rodeo',f'http://localhost:{args.port}',f'http://127.0.0.1:{args.port}'}
 def persist():
  temp=cache.with_suffix('.tmp');temp.write_text(json.dumps(db,ensure_ascii=False,separators=(',',':')),encoding='utf-8');temp.replace(cache)
 def live():return [v for v in backgrounds.values() if time.time()-v['time']<8]
 class Handler(BaseHTTPRequestHandler):
  def log_message(self,*a):pass
  def send(self,code,payload,kind='application/json; charset=utf-8'):
   body=payload if isinstance(payload,bytes) else json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode('utf-8')
   self.send_response(code);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('X-Folio-Version',plugin['version'])
   origin=self.headers.get('Origin')
   if origin in allowed:self.send_header('Access-Control-Allow-Origin',origin);self.send_header('Vary','Origin')
   self.send_header('Access-Control-Allow-Private-Network','true')
   self.end_headers()
   try:self.wfile.write(body)
   except (BrokenPipeError,ConnectionResetError):pass
  def valid_origin(self):return self.headers.get('Origin') is None or self.headers.get('Origin') in allowed
  def auth(self):
   if not self.valid_origin() or not secrets.compare_digest(self.headers.get('X-Folio-Token',''),token):
    self.send(403,{'error':'Connection not authorized'});return False
   return True
  def do_OPTIONS(self):
   if not self.valid_origin():self.send(403,{'error':'Origin not allowed'});return
   self.send_response(204);self.send_header('Access-Control-Allow-Origin',self.headers.get('Origin',''));self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type,X-Folio-Token');self.send_header('Access-Control-Allow-Private-Network','true');self.end_headers()
  def do_GET(self):
   parsed=urllib.parse.urlparse(self.path);p=parsed.path;q=urllib.parse.parse_qs(parsed.query)
   if p=='/api/session':
    if not self.valid_origin():self.send(403,{'error':'Origin not allowed'});return
    self.send(200,{'app':'adventurer-folio-owlbear','version':plugin['version'],'protocol':plugin['protocol'],'pluginVersion':plugin['version'],'token':token,'revision':db['revision']});return
   if p.startswith('/api/'):
    if not self.auth():return
    with lock:
     if p=='/api/transfer/status':self.send(200,handoff.status())
     elif p=='/api/transfer/receive':self.send(200,handoff.receive())
     elif p=='/api/state':self.send(200,db)
     elif p=='/api/bestiary21':self.send(200,{'monsters':(json.loads(db['raw']) if isinstance(db.get('raw'),str) else db.get('raw') or {}).get('bestiary19',[])})
     elif p=='/api/view':
      since=int(q.get('since',['-1'])[0]);self.send(200,{'revision':db['revision'],'view':db['view'] if since!=db['revision'] else None,'rooms':live(),'results':results[-40:],'mainOnline':time.time()-last_main[0]<8})
     elif p=='/api/inbox':
      last_main[0]=time.time();batch=commands[:]+once.inbox();commands.clear();self.send(200,{'revision':db['revision'],'commands':batch,'rooms':live(),'results':results[-15:]})
     elif p=='/api/draft':
      job=next((j for j in jobs if j['id']==q.get('id',[''])[0]),None)
      self.send(200,job) if job else self.send(404,{'error':'草稿已失效'})
     elif p=='/api/work':
      worker=q.get('worker',[''])[0];room=q.get('room',[''])[0];batch=[]
      if worker in backgrounds:
       for job in jobs:
        if not job.get('confirmed') and job['status'] in ('running','review') and not any(r['worker']==job.get('worker') for r in live()):job['status']='queued'
        if job.get('roomId')==room and job['status']=='queued':
         job['status']='running';job['worker']=worker;batch.append(job.copy())
      self.send(200,{'jobs':batch})
     else:self.send(404,{'error':'Unknown route'})
    return
   source=paths.get(p)
   if not source or not source.is_file():self.send(404,{'error':'File not found'});return
   kind=mimetypes.guess_type(source.name)[0] or 'application/octet-stream';self.send(200,source.read_bytes(),kind+('; charset=utf-8' if kind.startswith('text/') or kind in ('application/javascript','application/json','image/svg+xml') else ''))
  def do_POST(self):
   p=urllib.parse.urlparse(self.path).path
   if not self.auth():return
   try:
    size=int(self.headers.get('Content-Length','0'))
    if size<=0 or size>64*1024*1024:raise ValueError('Request size is invalid')
    payload=json.loads(self.rfile.read(size).decode('utf-8'))
    if not isinstance(payload,dict):raise ValueError('Object required')
   except (ValueError,UnicodeError):self.send(400,{'error':'Invalid request'});return
   with lock:
    if p.startswith('/api/transfer/'):
     try:
      result=handoff.start(payload.get('code')) if p=='/api/transfer/start' else handoff.stop() if p=='/api/transfer/stop' else handoff.acknowledge(payload.get('id')) if p=='/api/transfer/ack' else None
      if result is None:self.send(404,{'error':'Unknown transfer route'})
      else:self.send(200,result)
     except ValueError as error:self.send(400,{'error':str(error)})
     return
    elif p=='/api/state':
     if payload.get('revision')!=db['revision']:self.send(409,{'revision':db['revision']});return
     raw=payload.get('raw');view=payload.get('view')
     if not isinstance(raw,str) or not isinstance(view,dict):self.send(400,{'error':'Invalid state'});return
     try:
      decoded=json.loads(raw)
      if not isinstance(decoded.get('characters'),list) or decoded.get('version')!=10:raise ValueError()
     except (ValueError,AttributeError):self.send(400,{'error':'Invalid character data'});return
     db.update(revision=db['revision']+1,raw=raw,view=view,updated=time.time())
     once.acknowledge()
     try:persist()
     except OSError:self.send(500,{'error':'Local bridge could not save its cache'});return
     self.send(200,{'revision':db['revision']})
    elif p=='/api/heartbeat':
     worker=str(payload.get('worker',''))[:100];room=str(payload.get('roomId',''))[:100]
     if not worker or not room:self.send(400,{'error':'Missing room'});return
     backgrounds[worker]={'worker':worker,'roomId':room,'playerName':str(payload.get('playerName',''))[:120],'time':time.time(),'diceReady':bool(payload.get('diceReady'))}
     self.send(200,{'ok':True})
    elif p in ('/api/request','/api/command'):
     uid=str(payload.get('id',''))[:100]
     if not uid:self.send(400,{'error':'Missing request id'});return
     if uid in seen:self.send(200,{'id':uid,'duplicate':True});return
     if p=='/api/command':
      if time.time()-last_main[0]>8:self.send(409,{'error':'请先打开并连接完整角色卡，才能应用修改。'});return
      if len(commands)>=100:self.send(429,{'error':'Command queue full'});return
      if payload.get('type') not in ('select-character','option-toggle','status-toggle','trait-toggle','end-concentration','concentrate','summon-hp','health-change','focus-main','quick-bonus-set','rearm-dice18','milestone19'):
       self.send(400,{'error':'Unsupported command'});return
      if payload.get('type')=='quick-bonus-set':
       if not isinstance(payload.get('target'),str) or len(payload['target'])>180 or not isinstance(payload.get('expression'),str) or len(payload['expression'])>1000 or not isinstance(payload.get('reason',''),str) or len(payload.get('reason',''))>400:
        self.send(400,{'error':'Invalid temporary bonus'});return
      if payload.get('type')=='health-change':
       amount=payload.get('amount')
       if isinstance(amount,bool) or not isinstance(amount,(int,float)) or not 1<=amount<=999999 or int(amount)!=amount or payload.get('mode') not in ('damage','heal'):
        self.send(400,{'error':'请输入1～999999的整数，并选择伤害或恢复'});return
      seen[uid]=time.time();commands.append(payload);self.send(200,{'id':uid,'queued':True});return
     rooms=live();room=str(payload.get('roomId') or (rooms[-1]['roomId'] if rooms else ''))
     if not any(r['roomId']==room for r in rooms):self.send(409,{'error':'枭熊插件尚未连接到房间，请先在房间启用旅人手札扩展。'});return
     if payload.get('type') not in ('roll','open-panel','report'):self.send(400,{'error':'Unsupported request'});return
     if len(jobs)>=200:jobs[:]=[j for j in jobs if j['status'] in ('queued','running')][-100:]
     if len(jobs)>=200:self.send(429,{'error':'Too many pending rolls'});return
     job={k:payload[k] for k in ['id','type','notation','label','actorName','audience','engine','toolkitEntry19','combatId19','characterId','actorId','rollKind19'] if k in payload}
     try:once.prepare(payload,job)
     except ValueError as error:self.send(409,{'error':str(error)});return
     job.update(roomId=room,status='queued',created=time.time());seen[uid]=time.time();jobs.append(job);self.send(200,{'id':uid,'queued':True,'roomId':room})
    elif p=='/api/review-targets19':
     job=next((j for j in jobs if j['id']==payload.get('id') and j.get('worker')==payload.get('worker')),None)
     if not job or job.get('confirmed'):self.send(409,{'error':'草稿不可修改'});return
     rows=payload.get('targets19',[])
     job['targets19']=[{'id':str(r.get('id',''))[:100],'name':str(r.get('name','目标'))[:100]} for r in rows[:20] if isinstance(r,dict)] if isinstance(rows,list) else []
     self.send(200,{'ok':True});return
    elif p in ('/api/review-open','/api/confirm','/api/cancel'):
     job=next((j for j in jobs if j['id']==payload.get('id')),None)
     if not job:self.send(404,{'error':'草稿已失效'});return
     if p=='/api/cancel' and job['status']=='done' and not job.get('confirmed'):
      self.send(200,{'ok':True,'duplicate':True});return
     if p=='/api/review-open':
      if job.get('worker')!=payload.get('worker'):self.send(403,{'error':'Worker mismatch'});return
      if not job.get('confirmed') and job['status'] in ('running','review'):job['status']='review'
      self.send(200,{'ok':True});return
     if job['status'] not in ('running','review') or job.get('confirmed'):self.send(409,{'error':'此草稿已处理，不会重复掷骰。'});return
     if p=='/api/cancel':
      job['status']='done';results.append({'id':job['id'],'ok':True,'summary':'已取消草稿，未掷骰','label':job.get('label',''),'actorName':job.get('actorName',''),'engine':'取消','time':time.time(),'roomId':job['roomId']});self.send(200,{'ok':True});return
     if not any(r['roomId']==job['roomId'] for r in live()):self.send(409,{'error':'枭熊房间连接已中断，请重新连接后确认。'});return
     notation=payload.get('notation')
     if not isinstance(notation,str) or not notation.strip() or len(notation)>1000:self.send(400,{'error':'请填写有效公式'});return
     selected=set(payload.get('targets19',[]))
     job['selectedTargets19']=[r for r in job.get('targets19',[]) if r['id'] in selected]
     job['targetMode19']='separate' if payload.get('targetMode19')=='separate' else 'shared'
     other=payload.get('otherNotation19',notation)
     if not isinstance(other,str) or not other.strip() or len(other)>1000:self.send(400,{'error':'后续目标的公式无效'});return
     job['otherNotation19']=other
     try:once.confirm(payload,job)
     except ValueError as error:self.send(409,{'error':str(error)});return
     job.update(notation=notation,engine=payload.get('engine','auto'),audience=payload.get('audience','self'),confirmed=True,status='queued',type='report' if payload.get('report') else 'roll')
     self.send(200,{'ok':True})
    elif p=='/api/result':
     job=next((j for j in jobs if j['id']==payload.get('id') and j.get('worker')==payload.get('worker')),None)
     if not job:self.send(404,{'error':'Request not assigned to worker'});return
     if job['status']=='done':self.send(200,{'duplicate':True});return
     once.result(job,payload.get('ok') is True);persist()
     job['status']='done';result={k:payload.get(k) for k in ['id','ok','value','summary','error','engine']};result.update(label=job.get('label',''),actorName=job.get('actorName',''),time=time.time(),roomId=job['roomId']);results.append(result);results[:]=results[-80:];self.send(200,{'ok':True})
    else:self.send(404,{'error':'Unknown route'})
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
 print(f'Folio bridge: http://localhost:{args.port}/',flush=True)
 print('Install URLs: https://feathercatttt.github.io/traveler-folio/manifest.json ; https://feathercatttt.github.io/traveler-folio/tools-manifest.json',flush=True)
 try:server.serve_forever()
 except KeyboardInterrupt:pass
 finally:handoff.stop();server.server_close()
if __name__=='__main__':main()
