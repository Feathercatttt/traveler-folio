"""Real Android installer smoke test, isolated emulator only; never installs on a phone."""
from pathlib import Path
import subprocess,os,sys,json,time,re,xml.etree.ElementTree as ET,urllib.request
ROOT=Path.cwd();W=ROOT/'work';SID='emulator-5556';ADB=W/'android-sdk/platform-tools/adb.exe';checks=[]
env=os.environ.copy();env['ANDROID_AVD_HOME']=str(W/'avd');env['PYTHONIOENCODING']='utf-8';startup=subprocess.STARTUPINFO();startup.dwFlags|=subprocess.STARTF_USESHOWWINDOW;startup.wShowWindow=0
def adb(*a,check=True,timeout=35):
    r=subprocess.run([str(ADB),'-s',SID,*a],capture_output=True,text=True,encoding='utf8',errors='replace',timeout=timeout)
    if check and r.returncode:raise RuntimeError(r.stdout+r.stderr)
    return r.stdout
def xml():
    for _ in range(5):
        adb('shell','uiautomator','dump','/sdcard/update20.xml',check=False)
        s=adb('shell','cat','/sdcard/update20.xml',check=False)
        if '<?xml' in s:return s
        time.sleep(.6)
    raise RuntimeError('No Android UI')
def tap(names,timeout=35):
    until=time.monotonic()+timeout
    while time.monotonic()<until:
        s=xml()
        for node in ET.fromstring(s[s.index('<?xml'):]).iter('node'):
            if node.attrib.get('text','').casefold() in [v.casefold() for v in names] or node.attrib.get('content-desc','').casefold() in [v.casefold() for v in names]:
                n=list(map(int,re.findall(r'\d+',node.attrib['bounds'])))
                if len(n)==4 and n[2]>n[0] and n[3]>n[1]:adb('shell','input','tap',str((n[0]+n[2])//2),str((n[1]+n[3])//2));return
        time.sleep(.8)
    (W/'v20-android-failure.xml').write_text(s,encoding='utf8');raise RuntimeError('Android UI text missing '+str(names))
def connect():
    pid=''
    for _ in range(40):
        rows=adb('shell','pidof','com.traveler.folio',check=False).strip().split()
        if rows:pid=rows[0];break
        time.sleep(.5)
    if not pid:raise RuntimeError('Android app is not running: '+adb('logcat','-d','-s','AndroidRuntime:E'))
    adb('forward','tcp:19220','localabstract:webview_devtools_remote_'+pid)
    for _ in range(40):
        try:
            if json.load(urllib.request.urlopen('http://127.0.0.1:19220/json',timeout=2)):return
        except Exception:pass
        time.sleep(.25)
    raise RuntimeError('WebView debug port unavailable')
def js(code):
    f=W/'v20-android-eval.js';f.write_text(code,encoding='utf8');r=subprocess.run(['C:/Program Files/nodejs/node.exe',str(W/'qa-v20-android.cjs'),str(f)],capture_output=True,text=True,encoding='utf8',errors='replace',timeout=35)
    if r.returncode:raise RuntimeError(r.stderr)
    return json.loads(r.stdout.strip().splitlines()[-1])
def seed(source,name):
    adb('push',str(source),'/data/local/tmp/'+name);adb('shell','run-as','com.traveler.folio','mkdir','-p','files/updates');adb('shell','run-as','com.traveler.folio','cp','/data/local/tmp/'+name,'files/updates/'+name)
protocol=W/'android-app/src/com/traveler/folio/UpdateProtocol.java';manifest=W/'android-app/AndroidManifest.xml';main=W/'android-app/src/com/traveler/folio/MainActivity.java';original={p:p.read_bytes() for p in [protocol,manifest,main]}
if os.environ.get('FOLIO_QA_REUSE20')!='1':
 try:
    t=main.read_text(encoding='utf8')
    for a,b in [('super.onCreate(saved);','super.onCreate(saved);android.util.Log.i("FolioStartup20","before updates");'),('updates=new Updates(this);','updates=new Updates(this);android.util.Log.i("FolioStartup20","after updates");'),('web=new WebView(this);','android.util.Log.i("FolioStartup20","before webview");web=new WebView(this);android.util.Log.i("FolioStartup20","after webview");'),('web.loadDataWithBaseURL(', 'android.util.Log.i("FolioStartup20","before load");web.loadDataWithBaseURL(')]:t=t.replace(a,b,1)
    main.write_text(t,encoding='utf8')
    protocol.write_text(protocol.read_text(encoding='utf8').replace('CURRENT="0.20.0"','CURRENT="0.19.1"'),encoding='utf8');manifest.write_text(manifest.read_text(encoding='utf8').replace('versionCode="23"','versionCode="22"').replace('versionName="0.20.0"','versionName="0.19.1"'),encoding='utf8');subprocess.run([sys.executable,str(W/'build-android.py'),'--qa'],check=True,env=env)
 finally:
    for p,b in original.items():p.write_bytes(b)
emulator=None
if os.environ.get('FOLIO_QA_REUSE20')!='1':
    emulator=subprocess.Popen([str(W/'android-sdk/emulator/emulator.exe'),'-avd','Folio13','-no-window','-no-audio','-no-boot-anim','-no-snapshot-load','-no-snapshot-save','-gpu','swiftshader_indirect','-ports','5556,5557'],env=env,stdout=(W/'v20-emulator.log').open('w'),stderr=subprocess.STDOUT,startupinfo=startup)
try:
    print('Starting isolated Android 15 emulator',flush=True)
    for _ in range(120):
        if emulator is not None and emulator.poll() is not None:raise RuntimeError('Emulator exited')
        try:
            if '1' in adb('shell','getprop','sys.boot_completed',check=False,timeout=3):break
        except subprocess.TimeoutExpired:pass
        time.sleep(1)
    else:raise RuntimeError('Emulator boot timeout')
    adb('shell','input','keyevent','224');adb('shell','wm','dismiss-keyguard',check=False)
    for key in ['window_animation_scale','transition_animation_scale','animator_duration_scale']:adb('shell','settings','put','global',key,'0')
    adb('install','-r',str(W/'Folio-QA.apk'),timeout=60);adb('shell','am','force-stop','com.traveler.folio')
    pref=W/'v20-update-qa/settings.xml';pref.write_text('<?xml version="1.0" encoding="utf-8"?><map><boolean name="automatic" value="false" /></map>',encoding='utf8')
    adb('push',str(pref),'/data/local/tmp/update20-prefs.xml');adb('shell','run-as','com.traveler.folio','mkdir','-p','shared_prefs');adb('shell','run-as','com.traveler.folio','cp','/data/local/tmp/update20-prefs.xml','shared_prefs/updates20.xml')
    adb('shell','am','start','-n','com.traveler.folio/.MainActivity');time.sleep(4)
    tap(['更多'],timeout=60);tap(['检查更新 / 下载设置']);s=xml();assert '当前 v0.19.1' in s,s[:1500];checks.append('真实 APK 更新页面与原生状态往返通过，测试宿主沿用同一包名与签名')
    adb('shell','input','keyevent','4');time.sleep(1)
    before=xml();(W/'v20-android-before.xml').write_text(before,encoding='utf8')
    import gzip,base64
    code=(W/'v13-android-code.txt').read_text(encoding='utf-8-sig').strip().split('.')[-1];snapshot=json.loads(gzip.decompress(base64.urlsafe_b64decode(code+'='*(-len(code)%4))))['data'];name=next(c['name'] for c in snapshot['characters'] if c['id']==snapshot['activeId']);assert name in before,'Previous emulator test character missing'
    seed(ROOT/'outputs/旅人手札-Android.apk','release.apk');seed(W/'v20-update-qa/android-manifest.json','manifest.json')
    adb('shell','am','force-stop','com.traveler.folio');adb('shell','am','start','-n','com.traveler.folio/.MainActivity');time.sleep(4);tap(['更多']);tap(['检查更新 / 下载设置']);tap(['打开系统安装确认']);checks.append('Java 原生 RSA 验签与 APK SHA-256 校验通过，重启后已下载更新可继续安装')
    time.sleep(2)
    s=xml()
    if 'Allow from this source' in s or '允许来自此来源' in s:
        tap(['Allow from this source','允许来自此来源']);adb('shell','input','keyevent','4');checks.append('真实系统未知来源权限页面可开启并返回继续更新')
    tap(['Update','更新','Install','安装']);print('Android system installer confirmed',flush=True)
    for _ in range(40):
        pkg=adb('shell','dumpsys','package','com.traveler.folio')
        if 'versionName=0.20.0' in pkg:break
        time.sleep(.5)
    else:raise RuntimeError('APK update did not finish')
    checks.append('通过 content URI 临时只读授权打开系统安装器，实际覆盖安装正式 APK 0.20.0/23 成功')
    adb('shell','am','start','-n','com.traveler.folio/.MainActivity');time.sleep(4);s=xml();assert name in s,s[:1200];checks.append('覆盖安装后 WebView 原站点角色数据保留；未卸载应用')
    (ROOT/'outputs/v0.20-Android更新保留数据.png').write_bytes(subprocess.check_output([str(ADB),'-s',SID,'exec-out','screencap','-p']))
    log=adb('logcat','-d','-s','AndroidRuntime:E','FolioWeb:E');(W/'v20-android-log.txt').write_text(log,encoding='utf8');assert 'FATAL EXCEPTION' not in log,log
    (W/'v20-android-report.json').write_text(json.dumps({'success':True,'checks':checks,'errors':[]},ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(checks,ensure_ascii=False),flush=True)
except Exception:
    (W/'v20-android-error-log.txt').write_text(adb('logcat','-d','-s','AndroidRuntime:E','FolioWeb:E','FolioStartup20:I','WebViewFactory:I',check=False),encoding='utf8')
    try:(W/'v20-android-failure.xml').write_text(xml(),encoding='utf8')
    except Exception:pass
    raise
finally:
    if os.environ.get('FOLIO_QA_KEEP20')=='1' and not (W/'v20-android-report.json').exists():
        print('Keeping test emulator alive for diagnosis',flush=True);sys.exit(1)
    adb('emu','kill',check=False,timeout=10)
    try:
        if emulator is not None:emulator.wait(timeout=12)
    except subprocess.TimeoutExpired:
        if emulator is not None:emulator.kill()
