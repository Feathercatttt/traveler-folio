from pathlib import Path
import os,sys,subprocess,json,urllib.request,time,base64,gzip,xml.etree.ElementTree as ET,re
from PIL import Image,ImageDraw
root=Path.cwd();w=root/'work';adb=w/'android-sdk/platform-tools/adb.exe';sid='emulator-5556';checks=[];startup=subprocess.STARTUPINFO();startup.dwFlags|=subprocess.STARTF_USESHOWWINDOW;startup.wShowWindow=0
server=subprocess.Popen([sys.executable,str(root/'outputs/owlbear/server.py'),'--port','17770','--data-dir',str(w/'v19-android-bridge')],stdout=subprocess.DEVNULL,stderr=(w/'v19-android-bridge.log').open('w'),startupinfo=startup);emulator=None

def adbcall(*args,timeout=25,check=True):
 r=subprocess.run([str(adb),'-s',sid,*args],capture_output=True,timeout=timeout,text=True,encoding='utf8',errors='replace');
 if check and r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout

def xml():
 
 for _ in range(6):
  adbcall('shell','uiautomator','dump','/sdcard/folio16-ui.xml',check=False);value=adbcall('shell','cat','/sdcard/folio16-ui.xml',check=False)
  if '<?xml' in value:return value
  time.sleep(1)
 raise RuntimeError('Android UI automation did not obtain the current view')

def tap(text):
 for _ in range(15):
  data=xml()
  for node in ET.fromstring(data[data.index('<?xml'):]).iter('node'):
   if node.attrib.get('text')==text or node.attrib.get('content-desc')==text:
    nums=list(map(int,re.findall(r'\d+',node.attrib['bounds'])));
    if len(nums)!=4 or nums[2]<=nums[0] or nums[3]<=nums[1]:continue
    adbcall('shell','input','tap',str((nums[0]+nums[2])//2),str((nums[1]+nums[3])//2));return
  time.sleep(.6)
 (w/'v19-tap-failure.xml').write_text(data,encoding='utf8')
 (w/'v19-tap-failure.png').write_bytes(subprocess.check_output([str(adb),'-s',sid,'exec-out','screencap','-p']))
 raise RuntimeError('UI text not found: '+text+' '+data[:1800])
try:
 for _ in range(60):
  try:
   with urllib.request.urlopen('http://127.0.0.1:17770/api/session',timeout=1) as r:token=json.load(r)['token']
   break
  except OSError:time.sleep(.1)
 code=(w/'v13-android-code.txt').read_text(encoding='utf-8-sig').strip();req=urllib.request.Request('http://127.0.0.1:17770/api/transfer/start',data=json.dumps({'code':code}).encode(),headers={'X-Folio-Token':token,'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=5) as r:status=json.load(r)
 from urllib.parse import urlparse
 url='http://10.0.2.2:17771'+urlparse(status['urls'][0]).path
 js="const fs=require('fs'),vm=require('vm');let ctx={};vm.runInNewContext(fs.readFileSync('work/qrcodegen-1.8.0.js','utf8'),ctx);const q=ctx.qrcodegen.QrCode.encodeText(process.argv[1],ctx.qrcodegen.QrCode.Ecc.MEDIUM);console.log(JSON.stringify(Array.from({length:q.size},(_,y)=>Array.from({length:q.size},(_,x)=>q.getModule(x,y)?1:0))));"
 matrix=json.loads(subprocess.check_output(['C:/Program Files/nodejs/node.exe','-e',js,url],text=True));n=len(matrix);scale=5;qr=Image.new('RGB',(640,480),'white');draw=ImageDraw.Draw(qr);left=(640-n*scale)//2-140;top=(480-n*scale)//2
 for y,row in enumerate(matrix):
  for x,on in enumerate(row):
   if on:draw.rectangle((left+x*scale,top+y*scale,left+(x+1)*scale-1,top+(y+1)*scale-1),fill='black')
 fixture=w/'v19-camera-frame.png';qr.save(fixture)
 env=os.environ.copy();env['ANDROID_AVD_HOME']=str(w/'avd');log=(w/'v19-emulator.log').open('w',encoding='utf8')
 emulator=subprocess.Popen([str(w/'android-sdk/emulator/emulator.exe'),'-avd','Folio13','-no-window','-no-audio','-no-boot-anim','-no-snapshot-load','-no-snapshot-save','-gpu','swiftshader_indirect','-camera-back','imagefile:'+str(fixture),'-ports','5556,5557'],env=env,stdout=log,stderr=subprocess.STDOUT,startupinfo=startup)
 print('Android emulator starting with QR camera fixture',flush=True)
 for _ in range(100):
  if emulator.poll() is not None:raise RuntimeError('Emulator exited; inspect v19-emulator.log')
  try:
   if '1' in adbcall('shell','getprop','sys.boot_completed',timeout=3,check=False):break
  except subprocess.TimeoutExpired:pass
  time.sleep(1)
 else:raise RuntimeError('Emulator boot timed out')
 print('Android boot complete',flush=True);adbcall('shell','input','keyevent','224');adbcall('shell','wm','dismiss-keyguard',check=False);
 for setting in ['window_animation_scale','transition_animation_scale','animator_duration_scale']:adbcall('shell','settings','put','global',setting,'0')
 adbcall('install','-r',str(w/'Folio-QA.apk') if os.environ.get('FOLIO_CAMERA_QA17')=='1' else str(root/'outputs/旅人手札-Android.apk'),timeout=45);adbcall('shell','pm','grant','com.traveler.folio','android.permission.CAMERA');adbcall('shell','am','start','-n','com.traveler.folio/.MainActivity');time.sleep(3)
 tap('互通');tap('整卡互通 / 接收导入');tap('扫描并接收电脑数据');print('Native camera scanner launched',flush=True)
 for _ in range(15):
  data=xml()
  if '预览互通数据' in data:break
  if '相机无法' in data or '相机配置失败' in data:raise RuntimeError('Camera initialization failed: '+data[:2500])
  time.sleep(.5)
 else:
  (w/'v19-camera-last-ui.xml').write_text(data,encoding='utf8');probe=subprocess.run([str(adb),'-s',sid,'exec-out','run-as','com.traveler.folio','cat','cache/qr-frame16.pgm'],capture_output=True);
  if probe.returncode==0:Image.open(__import__('io').BytesIO(probe.stdout)).save(w/'v19-camera-raw.png')
  (w/'v19-camera-last-screen.png').write_bytes(subprocess.check_output([str(adb),'-s',sid,'exec-out','screencap','-p']));(w/'v19-camera-dumpsys.txt').write_text(adbcall('shell','dumpsys','media.camera',check=False),encoding='utf8');raise RuntimeError('Camera did not decode QR or LAN did not return preview')
 checks.append('Android 15实际Camera2相机画面识别二维码，并用APK原生网络请求收到电脑数据');tap('确认导入');time.sleep(2);data=xml();raw=gzip.decompress(base64.urlsafe_b64decode(code.split('.')[3]+'='*(-len(code.split('.')[3])%4)));payload=json.loads(raw);name=next(c['name'] for c in payload['data']['characters'] if c['id']==payload['data']['activeId']);assert name in data
 checks.append('APK内预览后确认导入，实际角色名称与传入数据一致，无外部浏览器或下载步骤');screen=subprocess.check_output([str(adb),'-s',sid,'exec-out','screencap','-p']);(root/'outputs/APK原生扫码验证.png').write_bytes(screen)
 appPid=adbcall('shell','pidof','com.traveler.folio').strip();logs=adbcall('logcat','-d','--pid='+appPid,'-s','FolioWeb:E','AndroidRuntime:E',timeout=10);assert 'FATAL EXCEPTION' not in logs;checks.append('APK启动与扫码导入无WebView脚本错误或原生崩溃');(w/'v19-android-report.json').write_text(json.dumps({'success':True,'checks':checks},ensure_ascii=False,indent=2),encoding='utf8');print('\n'.join('PASS '+x for x in checks),flush=True)
finally:
 if emulator:
  try:(w/'v19-android-last-logcat.txt').write_text(adbcall('logcat','-d','-s','FolioWeb:E','FolioQr:V','AndroidRuntime:E',check=False),encoding='utf8')
  except Exception:pass
  try:adbcall('emu','kill',timeout=5,check=False)
  except Exception:emulator.terminate()
 server.terminate();server.wait(timeout=5)
