"""Build v0.20 release artifacts from explicit public inputs, never private keys."""
from pathlib import Path
import hashlib,json,zipfile,shutil,subprocess,sys,importlib.util,datetime
R=Path(__file__).resolve().parent.parent;W=R/'work';O=R/'outputs';WIN=O/'旅人手札-Windows';REPO=W/'github-release19/repo';STAGE=W/'github-release20';ASSETS=STAGE/'release-assets';ASSETS.mkdir(parents=True,exist_ok=True)
VERSION='0.20.0'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def allowed(p):return p.is_file() and not any(s in p.parts for s in ['.git','user-data','__pycache__','node_modules','android-signing','update-signing']) and p.suffix.lower() not in ['.p12','.jks','.keystore','.pem','.pyc','.snapshot'] and 'credentials' not in p.name.lower()
def tree(folder):return [p for p in sorted(folder.rglob('*')) if allowed(p)]
def copy(src,dest):
    assert allowed(src),src;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest)
def archive(dest,entries):
    entries=list(entries);assert len({n for _,n in entries})==len(entries)
    with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p,n in entries:assert allowed(p),p;z.write(p,n)
    with zipfile.ZipFile(dest) as z:assert z.testzip() is None
    print(dest.name,dest.stat().st_size,flush=True)
reports=['v20-updater-report.json','v20-ui-report.json','v20-windows-report.json','v20-android-report.json','v20-main-report.json','v20-network-report.json'];checks=[]
for name in reports:
    row=json.loads((W/name).read_text(encoding='utf-8-sig'));assert row['success'] and not row.get('errors'),name;checks.extend(row['checks'])
assert (WIN/'FolioUpdater.exe').is_file();assert sha(O/'旅人手札.html')==sha(WIN/'旅人手札.html')
with zipfile.ZipFile(O/'旅人手札-Android.apk') as z:assert z.read('assets/index.html')==(O/'旅人手札.html').read_bytes()
signer=W/'android-sdk/build-tools/36.0.0/apksigner.bat'
def cert(p):
    result=subprocess.run([str(signer),'verify','--print-certs',str(p)],capture_output=True,text=True,encoding='utf8',errors='replace');assert result.returncode==0;return next(s for s in result.stdout.splitlines() if 'certificate SHA-256 digest:' in s)
assert cert(O/'旅人手札-Android.apk')==cert(O/'旅人手札-Android-v0.19.0.apk')

guide=(W/'v20-update-guide.md').read_text(encoding='utf8');(O/'v0.20更新与使用说明.txt').write_text(guide,encoding='utf-8-sig');(O/'手机与电脑使用说明.txt').write_text(guide,encoding='utf-8-sig')
for name in ['使用说明.txt','手机与电脑使用说明.txt','v0.20更新与使用说明.txt']:(WIN/name).write_text(guide,encoding='utf-8-sig')
files=[p for p in tree(WIN) if p.suffix.lower()!='.txt' or 'LICENSE' in p.name.upper() or p.name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.20更新与使用说明.txt']]
installer='MicrosoftEdgeWebView2RuntimeInstallerX64.exe';light=[p for p in files if p.name!=installer]
for kind,rows in [('Full',files),('Light',light),('Update',light)]:archive(ASSETS/f'TravelerFolio-Windows-{kind}.zip',[(p,('TravelerFolio-Update/' if kind=='Update' else '旅人手札-Windows/')+p.relative_to(WIN).as_posix()) for p in rows])
copy(O/'旅人手札-Android.apk',ASSETS/'TravelerFolio-Android.apk');copy(O/'旅人手札.html',ASSETS/'TravelerFolio.html')
archive(ASSETS/'TravelerFolio-Owlbear.zip',[(p,'旅人手札/'+p.relative_to(O).as_posix()) for p in [O/'旅人手札.html',O/'v0.20更新与使用说明.txt',O/'手机与电脑使用说明.txt',O/'开启枭熊联动.cmd',O/'关闭枭熊联动.cmd',O/'fflate-LICENSE.txt',O/'qrcodegen-LICENSE.txt',*tree(O/'owlbear')]])

# Refresh only tracked public source files plus the new declared updater inputs.
tracked=subprocess.check_output(['git','-c','safe.directory='+REPO.as_posix(),'-C',str(REPO),'ls-files','-z']).decode('utf8').split('\0')
for n in tracked:
    if n.startswith(('work/','outputs/')) and (R/n).is_file():copy(R/n,REPO/n)
new=['v20-updates.js','v20-updates.css','v20-update-guide.md','update-release20.py','update-public.json','qa-v20-updater.py','qa-v20-ui.cjs','qa-v20-windows.py','qa-v20-android.py','qa-v20-main.cjs','qa-v20-network.py','qa-v20-android.cjs','qa-v20-android-resume.py','package-v20.py','v20-mirror-probe.json',*reports]
for n in new:copy(W/n,REPO/'work'/n)
for folder in ['windows-app','android-app/src/com/traveler/folio']:
    for p in tree(W/folder):copy(p,REPO/'work'/folder/p.relative_to(W/folder))
for name in ['v0.20-更新-windows.png','v0.20-更新-android.png','v0.20-Android更新保留数据.png']:
    if (O/name).exists():copy(O/name,REPO/'docs/images'/name)
copy(W/'v20-update-guide.md',REPO/'docs/更新与镜像下载.md');copy(O/'v0.20更新与使用说明.txt',REPO/'outputs/v0.20更新与使用说明.txt');copy(O/'手机与电脑使用说明.txt',REPO/'outputs/手机与电脑使用说明.txt')
readme=REPO/'README.md';text=readme.read_text(encoding='utf8').replace('当前版本 **0.19.0**','当前版本 **0.20.0**')
text=text.replace('| TravelerFolio-Android.apk |','| TravelerFolio-Windows-Update.zip | 软件内使用的更新包；首次安装请用完整包或轻量包 |\n| TravelerFolio-Android.apk |',1) if '| TravelerFolio-Windows-Update.zip |' not in text else text
old='更新前导出一次备份，退出旧EXE和桥接，再解压新版。APK可以覆盖安装。'
newtext='v0.19及以前需先手动安装v0.20一次。之后EXE顶部“更新”、APK“更多 → 检查更新”可后台检查、镜像下载并确认安装。支持三条镜像、自动换线、签名校验和自定义镜像；公共服务不能保证所有国内网络永久可达。[更新步骤与线路设置](docs/更新与镜像下载.md)。\n\n更新前建议导出备份。APK使用原签名覆盖安装，不要卸载旧版。'
text=text.replace(old,newtext);text=text.replace('| 角色与职业 |','| 自动更新 | EXE顶部“更新”、APK“更多” | 启动后台检查、镜像换线、进度取消、签名核验，确认后安装 |\n| 角色与职业 |',1) if '| 自动更新 |' not in text else text
text=text if 'v0.20.0新增' in text else text.replace('## 验证边界','## 验证边界\n\nv0.20.0新增'+str(len(checks))+'项更新专项及回归检查，包含Windows实际替换/回滚、原生镜像下载、Android15系统覆盖安装与角色保留；验证报告在work/v20-*-report.json。');readme.write_text(text,encoding='utf8');(REPO/'VERSION').write_text(VERSION+'\n',encoding='utf8')
ignore=REPO/'.gitignore';text=ignore.read_text(encoding='utf8');
for line in ['**/update-signing/','**/*.pem','work/v20-update-qa/']:
    if line not in text:text+='\n'+line+'\n'
ignore.write_text(text,encoding='utf8')
notes='''# 旅人手札 v0.20.0

**AI 辅助生成和维护的代码。** 本次新增桌面和安卓应用内更新，保持角色数据格式10及原APK签名。

- 启动后后台自动检查，每6小时最多一次；可关闭或手动检查。
- 三条公共HTTPS镜像与GitHub直连自动换线，可设置优先线路或自定义镜像。
- 版本信息经过RSA-SHA256验签，安装包校验大小与SHA-256；APK核对原应用签名与版本。
- 下载进度、速度、取消和重试，重开应用可继续安装已下载包。
- Windows使用小型更新包，保存后重启；替换失败尝试回滚，保留原WebView2与角色数据。
- 安卓通过系统安装窗口覆盖更新，首次可能需要允许旅人手札安装应用，不绕过最终确认。
- EXE顶部/托盘“更新”；APK底部“更多 → 检查更新 / 下载设置”，底部仍为5个按钮。

**v0.19及以前必须先手动安装本版一次。** Windows先退出旧EXE与桥接后完整解压；APK直接覆盖安装，不要卸载。

已验证Windows原生启动、安装与失败回滚、签名/损坏文件/不安全ZIP拒绝、手机与电脑界面和原角色功能；Android15模拟器完成真实系统覆盖安装与数据保留。实体手机及全国各运营商网络尚未覆盖测试。公共镜像可能调整或限速，不承诺永久可用；可在设置中更换线路。

使用方法见 [更新与镜像下载](docs/更新与镜像下载.md)。枭熊安装地址仍为 `http://localhost:17632/manifest.json`，更新EXE后刷新枭熊页面。
'''
(REPO/'RELEASE-NOTES.md').write_text(notes,encoding='utf8');changelog=REPO/'CHANGELOG.md';oldlog=changelog.read_text(encoding='utf8');changelog.write_text(notes+'\n\n'+oldlog if not oldlog.startswith('# 旅人手札 v0.20.0') else oldlog,encoding='utf8')
doc=REPO/'docs/功能表与使用方法.md';text=doc.read_text(encoding='utf8');
if '[更新与镜像下载]' not in text:text='本版新增应用内更新，入口与设置见 [更新与镜像下载](更新与镜像下载.md)。\n\n'+text
doc.write_text(text,encoding='utf8')
sourceReadme=REPO/'README.txt';text=sourceReadme.read_text(encoding='utf-8-sig').replace('v0.19.0','v0.20.0').replace('v18、v19 模块','v18、v19、v20 模块');text+=('' if '更新器与镜像设置：' in text else '\n更新器与镜像设置：见 docs/更新与镜像下载.md。更新私钥不随源码提供。\n');sourceReadme.write_text(text,encoding='utf-8-sig')

payload={'app':'traveler-folio','schema':1,'version':VERSION,'published':datetime.datetime.now(datetime.timezone.utc).isoformat(),'notes':'新增 EXE / APK 应用内更新：后台检查、三路镜像与自动换线、进度取消、签名校验。Windows 保存并重启更新；安卓确认后覆盖安装，保留角色记录。'}
for kind,name in [('windows','TravelerFolio-Windows-Update.zip'),('android','TravelerFolio-Android.apk')]:
    p=ASSETS/name;payload[kind]={'url':'https://github.com/Feathercatttt/traveler-folio/releases/download/v'+VERSION+'/'+name,'size':p.stat().st_size,'sha256':sha(p)}
    if kind=='android':payload[kind].update(package='com.traveler.folio',versionCode=23)
spec=importlib.util.spec_from_file_location('update_release20',W/'update-release20.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);mod.sign(payload,REPO/'updates/stable.json');copy(REPO/'updates/stable.json',ASSETS/'TravelerFolio-Update.json')
(REPO/'updates/payload.example.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
archive(ASSETS/'TravelerFolio-Source.zip',[(p,'traveler-folio/'+p.relative_to(REPO).as_posix()) for p in tree(REPO)])
(ASSETS/'README-zh-CN.txt').write_text(notes+'\n\n'+guide,encoding='utf-8-sig')
(ASSETS/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(ASSETS.iterdir()) if p.is_file() and p.name!='SHA256SUMS.txt'),encoding='utf8')
for name,alias in [('TravelerFolio-Windows-Full.zip','旅人手札-Windows-v0.20.0-完整包.zip'),('TravelerFolio-Windows-Light.zip','旅人手札-Windows-v0.20.0-轻量包.zip'),('TravelerFolio-Windows-Update.zip','旅人手札-Windows-v0.20.0-更新包.zip'),('TravelerFolio-Android.apk','旅人手札-Android-v0.20.0.apk'),('TravelerFolio-Owlbear.zip','旅人手札-枭熊联动包-v0.20.0.zip'),('TravelerFolio-Source.zip','旅人手札-应用源码-v0.20.0.zip')]:copy(ASSETS/name,O/alias)
for name in ['旅人手札-Windows.zip','旅人手札-桌面版.zip']:copy(ASSETS/'TravelerFolio-Windows-Full.zip',O/name)
copy(ASSETS/'TravelerFolio-Owlbear.zip',O/'旅人手札-枭熊联动包.zip');copy(ASSETS/'TravelerFolio-Source.zip',O/'旅人手札-应用源码.zip')
report={'success':True,'version':VERSION,'checks':checks,'checkCount':len(checks),'assets':[{'name':p.name,'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(ASSETS.iterdir()) if p.is_file()],'limits':['Physical phone not tested','Mirror reachability measured on development PC, not all mainland carriers','Public mirror uptime cannot be guaranteed']}
(W/'v20-delivery-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print('Packaged',len(report['assets']),'assets;',len(checks),'checks',flush=True)
