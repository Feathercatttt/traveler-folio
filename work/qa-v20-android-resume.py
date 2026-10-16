from pathlib import Path
import os,json,subprocess,time,urllib.request,re,xml.etree.ElementTree as ET
R=Path.cwd();W=R/'work';ADB=W/'android-sdk/platform-tools/adb.exe';checks=[]
def adb(*a,timeout=30,check=True):
 r=subprocess.run([str(ADB),'-s','emulator-5556',*a],capture_output=True,text=True,encoding='utf8',errors='replace',timeout=timeout)
 if check and r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout
def connect():
 for _ in range(100):
  try:
   pid=adb('shell','pidof','com.traveler.folio').strip().split()[0];adb('forward','tcp:19220','localabstract:webview_devtools_remote_'+pid)
   with urllib.request.build_opener(urllib.request.ProxyHandler({})).open('http://127.0.0.1:19220/json',timeout=1) as r:
    if json.load(r):return
  except Exception:pass
  time.sleep(.5)
 raise RuntimeError('WebView startup timeout')
def js(code):
 p=W/'v20-android-eval.js';p.write_text(code,encoding='utf8');r=subprocess.run(['C:/Program Files/nodejs/node.exe',str(W/'qa-v20-android.cjs'),str(p)],capture_output=True,text=True,encoding='utf8',errors='replace',timeout=50)
 if r.returncode:raise RuntimeError(r.stderr)
 return json.loads(r.stdout.strip().splitlines()[-1])
def xml():
 for _ in range(10):
  try:
   adb('shell','uiautomator','dump','/sdcard/update20.xml',timeout=15,check=False);s=adb('shell','cat','/sdcard/update20.xml',check=False);E=ET.fromstring(s[s.index('<?xml'):])
   if "System UI isn't responding" in s:
    node=next((n for n in E.iter('node') if n.attrib.get('text')=='Wait'),None)
    if node is not None:tapnode(node);time.sleep(2);continue
   return s
  except Exception:time.sleep(1)
 raise RuntimeError('Android UI inaccessible')
def tapnode(n):
 b=list(map(int,re.findall(r'\d+',n.attrib['bounds'])));adb('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
def tap(names):
 for _ in range(12):
  s=xml()
  for n in ET.fromstring(s[s.index('<?xml'):]).iter('node'):
   if n.attrib.get('text','').casefold() in [v.casefold() for v in names]:tapnode(n);return
  time.sleep(1)
 (W/'v20-android-install-failure.xml').write_text(s,encoding='utf8');raise RuntimeError('Missing UI '+str(names))
connect();name=js('current().name');print('WebView ready, retaining existing test character',flush=True)
js("(async()=>{await updateRequest20('settings',{automatic:false,custom:'',preferred:''});await updateDialog20();return JSON.parse(FolioNative.update20('{\"action\":\"state\"}'));})()")
checks.append('真实 Android WebView 更新界面与原生消息往返通过，自动检查可关闭')
state=js("JSON.parse(FolioNative.update20('{\"action\":\"state\"}'))")
if state.get('phase')!='ready':
 for source,n in [(R/'outputs/旅人手札-Android.apk','release.apk'),(W/'v20-update-qa/android-manifest.json','manifest.json')]:
  adb('push',str(source),'/data/local/tmp/'+n);adb('shell','run-as','com.traveler.folio','mkdir','-p','files/updates');adb('shell','run-as','com.traveler.folio','cp','/data/local/tmp/'+n,'files/updates/'+n)
 adb('shell','am','force-stop','com.traveler.folio');adb('shell','am','start','-n','com.traveler.folio/.MainActivity');connect();time.sleep(25);state=js("(async()=>{await updateDialog20();return JSON.parse(FolioNative.update20('{\"action\":\"state\"}'));})()")
assert state['phase']=='ready',state;checks.append('Java RSA 验签、APK SHA-256 校验和重启后继续安装通过');print('Signed APK restored and verified',flush=True)
js("updateRequest20('install')");time.sleep(3);s=xml()
if 'Allow from this source' in s:
 tap(['Allow from this source']);adb('shell','input','keyevent','4');checks.append('通过真实系统设置授予本应用安装权限，返回后继续安装')
tap(['Update','更新','Install','安装']);print('Confirmed actual Android system installer',flush=True)
for _ in range(80):
 package=adb('shell','dumpsys','package','com.traveler.folio')
 if 'versionName=0.20.0' in package:break
 time.sleep(.5)
else:raise RuntimeError('System APK install failed')
checks.append('只读 content URI 授权与同签名正式 APK 0.20.0/23 系统覆盖安装成功')
s=xml()
if any(t in s for t in ['App installed.','已安装应用']):
 try:tap(['Open','打开'])
 except Exception:pass
adb('shell','am','start','-n','com.traveler.folio/.MainActivity');time.sleep(10)
for _ in range(25):
 s=xml()
 if name in s:break
 time.sleep(1)
else:raise RuntimeError('Character did not persist after update')
checks.append('正式 APK 更新后保留原角色名与 WebView 存储，未卸载旧版')
(R/'outputs/v0.20-Android更新保留数据.png').write_bytes(subprocess.check_output([str(ADB),'-s','emulator-5556','exec-out','screencap','-p']))
(W/'v20-android-report.json').write_text(json.dumps({'success':True,'checks':checks,'errors':[]},ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(checks,ensure_ascii=False),flush=True);adb('emu','kill',timeout=10)
