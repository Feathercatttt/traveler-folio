"""Package verified local artifacts and prepare the existing public checkout."""
from pathlib import Path
import hashlib,json,zipfile,shutil,subprocess,importlib.util,datetime,re
R=Path(__file__).resolve().parent.parent;W=R/'work';O=R/'outputs';WIN=O/'旅人手札-Windows';REPO=W/'github-release19/repo';STAGE=W/'github-release23';ASSETS=STAGE/'release-assets';ASSETS.mkdir(parents=True,exist_ok=True)
VERSION='0.24.0'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def allowed(p):return p.is_file() and not any(s in p.parts for s in ['.git','user-data','__pycache__','node_modules','android-signing','update-signing']) and p.suffix.lower() not in ['.p12','.jks','.keystore','.pem','.pyc','.snapshot'] and 'credentials' not in p.name.lower()
def tree(folder):return [p for p in sorted(folder.rglob('*')) if allowed(p)]
def copy(src,dest):
 assert allowed(src),src
 dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest)
def archive(dest,entries):
 entries=list(entries);assert len({n for _,n in entries})==len(entries)
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p,n in entries:assert allowed(p),p;z.write(p,n)
 with zipfile.ZipFile(dest) as z:assert z.testzip() is None
 print(dest.name,dest.stat().st_size,flush=True)
reports=['v24-local-report.json','v24-rules-report.json','v24-lifecycle-report.json','v24-windows-report.json','v24-android-report.json','v23-bestiary-report.json'];checks=[]
for name in reports:
 row=json.loads((W/name).read_text(encoding='utf-8-sig'));assert row['success'] and not row.get('errors') and not row.get('pageErrors'),name;checks.extend(row['checks'])
assert sha(O/'旅人手札.html')==sha(WIN/'旅人手札.html')
for name in ['background.js','panel.js','roll.js','tools19.js','surface19.js','server.py']:
 assert sha(O/'owlbear'/name)==sha(WIN/'owlbear'/name),name
with zipfile.ZipFile(O/'旅人手札-Android.apk') as z:assert z.read('assets/index.html')==(O/'旅人手札.html').read_bytes()
guide=(W/'v24-guide.md').read_text(encoding='utf8')
for name in ['v0.24更新与使用说明.txt','手机与电脑使用说明.txt']:(O/name).write_text(guide,encoding='utf-8-sig')
for name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.24更新与使用说明.txt']:(WIN/name).write_text(guide,encoding='utf-8-sig')
files=[p for p in tree(WIN) if p.suffix.lower()!='.txt' or 'LICENSE' in p.name.upper() or p.name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.24更新与使用说明.txt','THIRD-PARTY19.txt']]
light=[p for p in files if p.name!='MicrosoftEdgeWebView2RuntimeInstallerX64.exe']
archive(O/'TravelerFolio-Windows-Full.zip',[(p,'旅人手札-Windows/'+p.relative_to(WIN).as_posix()) for p in files])
for kind,rows in [('Light',light),('Update',light)]:archive(ASSETS/f'TravelerFolio-Windows-{kind}.zip',[(p,('TravelerFolio-Update/' if kind=='Update' else '旅人手札-Windows/')+p.relative_to(WIN).as_posix()) for p in rows])
copy(O/'旅人手札-Android.apk',ASSETS/'TravelerFolio-Android.apk');copy(O/'旅人手札.html',ASSETS/'TravelerFolio.html')
archive(ASSETS/'TravelerFolio-Owlbear.zip',[(p,'旅人手札/'+p.relative_to(O).as_posix()) for p in [O/'旅人手札.html',O/'v0.24更新与使用说明.txt',O/'手机与电脑使用说明.txt',O/'开启枭熊联动.cmd',O/'关闭枭熊联动.cmd',O/'fflate-LICENSE.txt',O/'qrcodegen-LICENSE.txt',*tree(O/'owlbear')]])
tracked=subprocess.check_output(['git','-C',str(REPO),'ls-files','-z']).decode('utf8').split('\0')
for name in tracked:
 if name.startswith(('work/','outputs/')) and (R/name).is_file():copy(R/name,REPO/name)
for p in tree(O/'owlbear'):copy(p,REPO/'outputs/owlbear'/p.relative_to(O/'owlbear'))
new=['v23-bestiary.js','v23.css','v24-rules.js','v24.css','v24-guide.md','package-v24.py','build-pages24.py','qa-v24-local.cjs','qa-obr-host24.js','v24-tall.png','qa-v24-rules.cjs','qa-v24-lifecycle.py','BridgeLifecycleQA24.cs','qa-v24-windows.py','qa-v24-android.py',*reports]
for name in new:copy(W/name,REPO/'work'/name)
for folder in ['windows-app','android-app/src/com/traveler/folio']:
 for p in tree(W/folder):copy(p,REPO/'work'/folder/p.relative_to(W/folder))
for p in O.glob('v0.24-*.png'):copy(p,REPO/'docs/images'/p.name)
copy(W/'v24-guide.md',REPO/'docs/v0.24安装与使用方法.md')
notes='# 旅人手札 v0.24.0 · 统一本地插件与严重问题修复\n\n**AI 辅助生成和维护的代码。**\n\n- 所有枭熊功能统一到 EXE 附带的本地插件：小卡、动画骰、先攻、目标、演出、怪物图鉴和生命速调。两个 localhost 安装地址固定，应用更新同时更新插件。\n- 修复本地服务遗漏两份样式文件造成的黑底与头像失控；先攻画布背景完全透明，大头像在战斗开始后保持固定尺寸。\n- 演出控制条放进立绘同一交互层，解决无法切换差分、无法结束直播的遮挡。直播立绘直接拖动，支持缩放/重置/滚轮，位置和尺寸经授权同步。\n- 正式本地服务与真实 SDK 链路验证优势/劣势、内置动画、右下角摘要、历史与图鉴放置；不再使用另一套线上插件代码。\n- 本地服务版本核对、同目录旧桥接替换、静态资源版本参数与应用内更新包一致性校验，避免 EXE 更新而插件仍旧。\n- 完整手札去掉重复的枭熊小卡按钮；使用说明改为规则，支持独立村规条目的创建、编辑、分类搜索、删除与完整备份。\n\n本地正式资源与真实 SDK 在模拟宿主中验收，Windows 原生与 APK 校验通过。未登录真实枭熊多人房间，实体手机尚未验收。所有伤害仍只报结果、手动扣血。\n\n操作见 [v0.24安装与使用方法](docs/v0.24安装与使用方法.md)。\n'
(REPO/'RELEASE-NOTES.md').write_text(notes,encoding='utf8',newline='\n');ch=REPO/'CHANGELOG.md';old=ch.read_text(encoding='utf8');ch.write_text(notes+'\n\n'+old if not old.startswith('# 旅人手札 v0.24.0') else old,encoding='utf8',newline='\n')
p=REPO/'README.md';text=p.read_text(encoding='utf8').replace('当前版本 **0.23.0**','当前版本 **0.24.0**');a=text.index('## 枭熊安装');b=text.index('## 功能表',a);text=text[:a]+'''## 枭熊安装

[线上插件地址](https://feathercatttt.github.io/traveler-folio/) · [v0.24操作指南](docs/v0.24安装与使用方法.md)

| 独立按钮 | DM 添加的安装地址 |
| --- | --- |
| 角色速查（先开EXE） | http://localhost:17632/manifest.json |
| 跑团工具 | http://localhost:17632/tools-manifest.json |

每位玩家先打开自己的 EXE，再进入房间。小卡恢复枭熊原生窗口并自动连接；不再需要额外连接弹窗。所有功能均由 EXE 本地插件提供，随手札更新。请停用旧的线上插件。停用同类旧扩展后刷新房间，避免重复后台。角色资料不会存到 GitHub Pages。

'''+text[b:];text=text.replace('| 自动更新 |','| 规则记录 | 主界面“规则” | 独立村规条目、分类搜索、编辑删除与完整备份 |\n| 自动更新 |',1);p.write_text(text,encoding='utf8',newline='\n')
p=REPO/'docs/功能表与使用方法.md';text=p.read_text(encoding='utf8');text=re.sub(r'^当前操作以 .*?\n\n','',text,count=1,flags=re.S);p.write_text('当前操作以 [v0.24安装与使用方法](v0.24安装与使用方法.md) 为准：统一本地插件、透明先攻、同层演出缩放与规则条目。\n\n'+text,encoding='utf8',newline='\n')
(REPO/'VERSION').write_text(VERSION+'\n',encoding='utf8')
payload={'app':'traveler-folio','schema':1,'version':VERSION,'published':datetime.datetime.now(datetime.timezone.utc).isoformat(),'notes':'全部功能统一本地插件，随手札更新；修复本地先攻样式资源遗漏；演出同层控制、缩放与结束直播；本地动画骰/优劣势/历史；独立规则条目。'}
for kind,name in [('windows','TravelerFolio-Windows-Update.zip'),('android','TravelerFolio-Android.apk')]:
 p=ASSETS/name;payload[kind]={'url':'https://github.com/Feathercatttt/traveler-folio/releases/download/v'+VERSION+'/'+name,'size':p.stat().st_size,'sha256':sha(p)}
 if kind=='android':payload[kind].update(package='com.traveler.folio',versionCode=27)
spec=importlib.util.spec_from_file_location('update_release20',W/'update-release20.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);mod.sign(payload,REPO/'updates/stable.json');copy(REPO/'updates/stable.json',ASSETS/'TravelerFolio-Update.json');(REPO/'updates/payload.example.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
archive(ASSETS/'TravelerFolio-Source.zip',[(p,'traveler-folio/'+p.relative_to(REPO).as_posix()) for p in tree(REPO)])
(ASSETS/'README-zh-CN.txt').write_text(notes+'\n\n'+guide,encoding='utf-8-sig');(ASSETS/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(ASSETS.iterdir()) if p.is_file() and p.name!='SHA256SUMS.txt'),encoding='utf8')
for name,alias in [('TravelerFolio-Windows-Light.zip','旅人手札-Windows-v0.24.0-轻量包.zip'),('TravelerFolio-Windows-Update.zip','旅人手札-Windows-v0.24.0-更新包.zip'),('TravelerFolio-Android.apk','旅人手札-Android-v0.24.0.apk'),('TravelerFolio-Owlbear.zip','旅人手札-枭熊联动包-v0.24.0.zip'),('TravelerFolio-Source.zip','旅人手札-应用源码-v0.24.0.zip')]:copy(ASSETS/name,O/alias)
for name in ['旅人手札-Windows.zip','旅人手札-桌面版.zip']:copy(O/'TravelerFolio-Windows-Full.zip',O/name)
copy(ASSETS/'TravelerFolio-Owlbear.zip',O/'旅人手札-枭熊联动包.zip');copy(ASSETS/'TravelerFolio-Source.zip',O/'旅人手札-应用源码.zip')
report={'success':True,'version':VERSION,'checks':checks,'checkCount':len(checks),'assets':[{'name':p.name,'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(ASSETS.iterdir()) if p.is_file()],'limits':['Real Owlbear room not authenticated/tested','Physical Android not tested','Plugins require the local EXE; all functionality is bundled in that version']}
(W/'v24-delivery-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print('Packaged',len(report['assets']),'assets;',len(checks),'checks',flush=True)
