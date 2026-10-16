import json,subprocess,tempfile,time,urllib.request,urllib.error
from pathlib import Path
root=Path(__file__).resolve().parent.parent
checks=[]
with tempfile.TemporaryDirectory(prefix='folio19-') as folder:
 proc=subprocess.Popen(['python',str(root/'outputs/owlbear/server.py'),'--port','17782','--data-dir',folder],stdout=subprocess.DEVNULL)
 try:
  base='http://localhost:17782';token=''
  for i in range(40):
   try:token=json.load(urllib.request.urlopen(base+'/api/session'))['token'];break
   except OSError:time.sleep(.1)
  def api(path,body=None,status=200):
   req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers={'X-Folio-Token':token,'Content-Type':'application/json'})
   try:
    with urllib.request.urlopen(req) as r:code=r.status;result=json.load(r)
   except urllib.error.HTTPError as e:code=e.code;result=json.load(e)
   assert code==status,(path,code,result)
   return result
  row={'key':'main|test','token':'0|-1d4','expression':'-1d4','target':'attack-all','label':'祸害'}
  raw={'version':10,'characters':[{'id':'c','spentDice18':{}}]};view={'characterId':'c','actors':[{'id':'main','pendingDice18':[row]}]}
  api('/api/state',{'revision':0,'raw':json.dumps(raw),'view':view});api('/api/inbox');api('/api/heartbeat',{'worker':'w','roomId':'r'})
  def draft(id):
   api('/api/request',{'id':id,'type':'roll','notation':'1d20+6','label':'攻击检定','roomId':'r','characterId':'c','actorId':'main','once18':[row]});api('/api/work?worker=w&room=r');return api('/api/draft?id='+id)
  a=draft('a');b=draft('b');assert a['notation']=='(1d20+6)+(-1d4)'
  api('/api/review-targets19',{'id':'a','worker':'w','targets19':[{'id':'t','name':'骷髅'}]})
  api('/api/confirm',{'id':'a','notation':a['notation'],'usedOnce18':[row['key']],'targets19':['t'],'targetMode19':'separate','otherNotation19':'1d20+6'})
  api('/api/confirm',{'id':'b','notation':b['notation'],'usedOnce18':[row['key']]},409)
  job=api('/api/work?worker=w&room=r')['jobs'][0];assert job['otherNotation19']=='1d20+6' and job['selectedTargets19'][0]['name']=='骷髅'
  api('/api/result',{'id':'a','worker':'w','ok':True,'value':9,'summary':'骷髅：9','engine':'手札动画骰'});assert api('/api/inbox')['commands'][0]['type']=='consume-dice18'
  api('/api/confirm',{'id':'b','notation':b['notation'],'usedOnce18':[row['key']]},409)
  raw['characters'][0]['spentDice18'][row['key']]=row['token'];api('/api/state',{'revision':1,'raw':json.dumps(raw),'view':{**view,'actors':[{'id':'main','pendingDice18':[]}]}});assert not api('/api/inbox')['commands']
  checks+=['基础公式含下一次骰子影响，确认前不消耗','两个同时打开的草稿不能重复使用同一影响','成功结果通过持久日志通知角色卡，确认保存后清除日志','目标确认与独立公式透传，未知目标不接受']
  for path in ['/tools19.html','/surface19.html','/dice-effect19.html','/suite19/d20.png','/status18.js','/tools19.js','/suite19/dice.mp3']:
   assert urllib.request.urlopen(base+path).status==200
  try:urllib.request.urlopen(base+'/suite19/../../server.py');assert False
  except urllib.error.HTTPError as e:assert e.code==404
  checks.append('新增页面与静态资源可访问，静态白名单阻止目录越界')
  (root/'work/v21-backend-report.json').write_text(json.dumps({'success':True,'checks':checks,'errors':[]},ensure_ascii=False,indent=2),encoding='utf8')
  print(json.dumps(checks,ensure_ascii=False))
 finally:proc.terminate();proc.wait(timeout=10)
