"""Exercise the production signed APK via Android's accessibility UI. No phone writes."""
from pathlib import Path
import subprocess,os,time,json,re,xml.etree.ElementTree as ET
R=Path.cwd();W=R/'work';ADB=W/'android-sdk/platform-tools/adb.exe';SID='emulator-5580';checks=[]
env=os.environ.copy();env['ANDROID_AVD_HOME']=str(W/'avd');startup=subprocess.STARTUPINFO();startup.dwFlags|=subprocess.STARTF_USESHOWWINDOW;startup.wShowWindow=0
def adb(*args,check=True,timeout=25):
 p=subprocess.run([str(ADB),'-s',SID,*args],capture_output=True,timeout=timeout)
 text=p.stdout.decode('utf8','replace')
 if check and p.returncode:raise RuntimeError(text+p.stderr.decode('utf8','replace'))
 return text
def xml():
 for _ in range(4):
  adb('shell','uiautomator','dump','/sdcard/folio28.xml',check=False)
  s=adb('shell','cat','/sdcard/folio28.xml',check=False)
  if '<?xml' in s:return s
  time.sleep(.4)
 raise RuntimeError('No Android accessibility XML')
def tap(text,scroll=False):
 last=''
 for _ in range(7 if scroll else 3):
  last=xml()
  for n in ET.fromstring(last[last.index('<?xml'):]).iter('node'):
   if text not in [n.get('text'),n.get('content-desc')]:continue
   coords=list(map(int,re.findall(r'\d+',n.get('bounds',''))))
   if len(coords)==4 and coords[2]>coords[0] and coords[3]>coords[1]:
    adb('shell','input','tap',str((coords[0]+coords[2])//2),str((coords[1]+coords[3])//2));return
  if scroll:adb('shell','input','swipe','520','1800','520','700','300')
  time.sleep(.5)
 (W/'v28-emulator-failure.xml').write_text(last,encoding='utf8');raise RuntimeError('Visible Android control missing: '+text)
log=(W/'v28-emulator.log').open('w');emulator=subprocess.Popen([str(W/'android-sdk/emulator/emulator.exe'),'-avd','Folio13','-no-window','-no-audio','-no-boot-anim','-no-snapshot-load','-no-snapshot-save','-gpu','swiftshader_indirect','-ports','5580,5581'],env=env,stdout=log,stderr=subprocess.STDOUT,startupinfo=startup)
try:
 print('Booting isolated Android 15 emulator',flush=True)
 for n in range(120):
  if emulator.poll() is not None:raise RuntimeError('Emulator exited; inspect work/v28-emulator.log')
  try:
   if adb('shell','getprop','sys.boot_completed',check=False,timeout=3).strip()=='1':break
  except subprocess.TimeoutExpired:pass
  if n%15==0:print('Waiting for Android boot',n,flush=True)
  time.sleep(1)
 else:raise RuntimeError('Android boot timeout')
 adb('shell','input','keyevent','224');adb('shell','wm','dismiss-keyguard',check=False)
 for key in ['window_animation_scale','transition_animation_scale','animator_duration_scale']:adb('shell','settings','put','global',key,'0')
 print('Installing production signed APK',flush=True);adb('install','-r',str(R/'outputs/旅人手札-Android.apk'),timeout=65)
 assert 'versionName=0.28.0' in adb('shell','dumpsys','package','com.traveler.folio')
 adb('shell','am','force-stop','com.traveler.folio');adb('shell','am','start','-n','com.traveler.folio/.MainActivity');time.sleep(5)
 tap('设置',scroll=True);tap('检查更新',scroll=True);s=xml();assert '当前 v0.28.0' in s,s[:700]
 (R/'outputs/v0.28.0-Android实际更新页.png').write_bytes(subprocess.check_output([str(ADB),'-s',SID,'exec-out','screencap','-p']))
 checks.append('Production signed v0.28.0 APK installed on Android 15; Settings update button is visible and opens native updater')
 if '正在检查版本' in s:tap('取消')
 else:tap('检查更新');s=xml();assert any(t in s for t in ['正在检查版本','已是最新','可更新','暂时不可达','当前已是']),s[:700]
 checks.append('Real APK check button reaches Java updater and displays native status')
 adb('shell','input','keyevent','4');time.sleep(.6);tap('设置',scroll=True);tap('检查更新',scroll=True);assert '当前 v0.28.0' in xml();checks.append('Closing and reopening update page keeps entry usable')
 print(json.dumps({'success':True,'checks':checks},ensure_ascii=False),flush=True)
 (W/'v28-emulator-report.json').write_text(json.dumps({'success':True,'checks':checks,'limits':['Android emulator; no physical device validation']},ensure_ascii=False,indent=2),encoding='utf8')
finally:
 adb('emu','kill',check=False,timeout=8)
 try:emulator.wait(timeout=15)
 except subprocess.TimeoutExpired:emulator.terminate()
 log.close()
