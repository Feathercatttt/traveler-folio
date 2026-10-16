"""Release v0.21: explicit source copies and original signing identities."""
from pathlib import Path
import hashlib,json,zipfile,shutil,subprocess,importlib.util,datetime,re
R=Path(__file__).resolve().parent.parent;W=R/'work';O=R/'outputs';WIN=O/'旅人手札-Windows';REPO=W/'github-release19/repo';STAGE=W/'github-release21';ASSETS=STAGE/'release-assets';ASSETS.mkdir(parents=True,exist_ok=True)
VERSION='0.21.0'
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
reports=['v21-tools-report.json','v21-host-report.json','v21-bestiary-report.json','v21-main-report.json','v21-roll-flow-report.json','v21-backend-report.json','v21-windows-report.json','v21-updater-report.json','v21-android-report.json'];checks=[]
for name in reports:
 row=json.loads((W/name).read_text(encoding='utf-8-sig'));assert row['success'] and not row.get('errors'),name;checks.extend(row['checks'])
assert sha(O/'旅人手札.html')==sha(WIN/'旅人手札.html')
with zipfile.ZipFile(O/'旅人手札-Android.apk') as z:assert z.read('assets/index.html')==(O/'旅人手札.html').read_bytes()
def cert(p):
 run=subprocess.run([str(W/'android-sdk/build-tools/36.0.0/apksigner.bat'),'verify','--print-certs',str(p)],capture_output=True,text=True,encoding='utf8',errors='replace');assert run.returncode==0
 return next(s for s in run.stdout.splitlines() if 'certificate SHA-256 digest:' in s)
assert cert(O/'旅人手札-Android.apk')==cert(O/'旅人手札-Android-v0.20.0.apk')
guide=(W/'v21-guide.md').read_text(encoding='utf8')
for name in ['v0.21更新与使用说明.txt','手机与电脑使用说明.txt']:(O/name).write_text(guide,encoding='utf-8-sig')
for name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.21更新与使用说明.txt']:(WIN/name).write_text(guide,encoding='utf-8-sig')
files=[p for p in tree(WIN) if p.suffix.lower()!='.txt' or 'LICENSE' in p.name.upper() or p.name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.21更新与使用说明.txt','THIRD-PARTY19.txt']]
light=[p for p in files if p.name!='MicrosoftEdgeWebView2RuntimeInstallerX64.exe']
for kind,rows in [('Full',files),('Light',light),('Update',light)]:archive(ASSETS/f'TravelerFolio-Windows-{kind}.zip',[(p,('TravelerFolio-Update/' if kind=='Update' else '旅人手札-Windows/')+p.relative_to(WIN).as_posix()) for p in rows])
copy(O/'旅人手札-Android.apk',ASSETS/'TravelerFolio-Android.apk');copy(O/'旅人手札.html',ASSETS/'TravelerFolio.html')
archive(ASSETS/'TravelerFolio-Owlbear.zip',[(p,'旅人手札/'+p.relative_to(O).as_posix()) for p in [O/'旅人手札.html',O/'v0.21更新与使用说明.txt',O/'手机与电脑使用说明.txt',O/'开启枭熊联动.cmd',O/'关闭枭熊联动.cmd',O/'fflate-LICENSE.txt',O/'qrcodegen-LICENSE.txt',*tree(O/'owlbear')]])
# Only already-public files plus declared v21 code and static extension source.
tracked=subprocess.check_output(['git','-c','safe.directory='+REPO.as_posix(),'-C',str(REPO),'ls-files','-z']).decode('utf8').split('\0')
for name in tracked:
 if name.startswith(('work/','outputs/')) and (R/name).is_file():copy(R/name,REPO/name)
for p in tree(O/'owlbear'):copy(p,REPO/'outputs/owlbear'/p.relative_to(O/'owlbear'))
new=['v21-main.js','v21-guide.md','build-pages21.py','pages-workflow21.yml','package-v21.py','qa-v21-tools.cjs','qa-v21-tools-body.cjs','qa-v21-host.cjs','qa-v21-bestiary.cjs','qa-v21-main.cjs','qa-v21-roll-flow.cjs','qa-v21-backend.py','qa-v21-windows.py','qa-v21-updater.py','qa-v21-android.py',*reports]
for name in new:copy(W/name,REPO/'work'/name)
for folder in ['windows-app','android-app/src/com/traveler/folio']:
 for p in tree(W/folder):copy(p,REPO/'work'/folder/p.relative_to(W/folder))
for p in O.glob('v0.21-*.png'):copy(p,REPO/'docs/images'/p.name)
copy(W/'v21-guide.md',REPO/'docs/v0.21安装与使用方法.md');copy(W/'pages-workflow21.yml',REPO/'.github/workflows/pages.yml')
notes='''# 旅人手札 v0.21.0 · 线上枭熊插件与跑团工具修正

**AI 辅助生成和维护的代码。** 保持原角色数据格式及 APK 签名。

- 两个 GitHub Pages 扩展地址：角色速查与跑团工具各占一个按钮；自动部署更新。
- 独立工具不依赖 EXE；本机角色与怪物库通过受来源限制的本地连接窗口读取，不上传个人资料。
- 内置骰子右下角显示检定名、公式、明细与结果；确认页支持普通 / 优势 / 劣势。
- 成功投骰后清空全部目标；取消、失败保留。所有扣血仍手动。
- 工具、先攻、演出与生命窗可拖动、缩放、关闭。生命速调缩至 280×172，只跟随地图选择。
- 怪物图鉴支持上传立绘、复制、删除、多行动，从藏书架打开；插件读取本地库后可重复放置或拖入地图，各怪物的 Stat Bubbles 血量独立。
- 立绘改为独立演出角色，支持差分命名、玩家控制分享、直播勾选名单、左键上场 / 右键下场，关闭直播清理地图滤镜。
- 先攻采用 obr-suite 横向肖像、准备 / 战斗阶段、原骰和最终值显示、玩家结束回合、DM 前后回合与手动排序结构，保留手札确认投骰。
- 移除场景时停。保留镜头同步、传送门、原有 Stat Bubbles / Marked、角色卡与自动更新功能。

Windows v0.20可从应用内更新；旧版也可手动下载。APK直接覆盖安装，不要卸载。

DM 请停用旧 localhost 扩展，按 [线上安装说明](https://feathercatttt.github.io/traveler-folio/) 添加角色速查和跑团工具两个地址。读取本机角色需 EXE v0.21 或以上；独立房间工具不要求 EXE。

本机桥接、跨站 iframe、模拟多玩家、Windows 原生、Android 模拟器及回归检查通过。真实枭熊多人房间、各类 GPU 和实体手机尚未覆盖实测；官方图片选择器和原生地图滤镜仍需房间反馈。

完整操作见 [v0.21安装与使用方法](docs/v0.21安装与使用方法.md)。
'''
(REPO/'RELEASE-NOTES.md').write_text(notes,encoding='utf8')
changelog=REPO/'CHANGELOG.md';old=changelog.read_text(encoding='utf8');changelog.write_text(notes+'\n\n'+old if not old.startswith('# 旅人手札 v0.21.0') else old,encoding='utf8')
readme=REPO/'README.md';text=readme.read_text(encoding='utf8').replace('当前版本 **0.20.0**','当前版本 **0.21.0**')
a=text.index('## 枭熊安装');b=text.index('## 功能表',a)
text=text[:a]+'''## 枭熊安装

[线上安装说明与复制地址](https://feathercatttt.github.io/traveler-folio/) · [v0.21操作指南](docs/v0.21安装与使用方法.md)

| 独立按钮 | DM 添加的安装地址 |
| --- | --- |
| 角色速查 | https://feathercatttt.github.io/traveler-folio/manifest.json |
| 跑团工具 | https://feathercatttt.github.io/traveler-folio/tools-manifest.json |

停用旧 localhost 扩展并刷新房间。DM 换电脑仍使用相同地址。骰子、先攻、演出与场景工具独立运行；读取本地角色或怪物库时打开 EXE v0.21，在小卡点击“连接本机角色卡”，受浏览器限制时使用“连接窗口”。角色资料不会存到 GitHub Pages。

'''+text[b:]
text='\n'.join(line for line in text.splitlines() if '| 时停' not in line)+'\n'
text=re.sub(r'\| 立绘演出 \|[^\n]*', '| 立绘演出 | 跑团工具 → 演出 | 独立角色、差分上传、直播名单、上下场、玩家控制分享、原生地图滤镜 |',text)
readme.write_text(text,encoding='utf8');(REPO/'VERSION').write_text(VERSION+'\n',encoding='utf8')
source_readme=REPO/'README.txt';text=source_readme.read_text(encoding='utf-8-sig').replace('v0.20.0','v0.21.0').replace('v18、v19、v20 模块','v18、v19、v20、v21 模块')
if 'GitHub Pages自动发布' not in text:text+='\nGitHub Pages自动发布：main分支推送插件源码后，Actions按package-lock构建并发布静态白名单；两个安装地址保持不变。详见docs/v0.21安装与使用方法.md。\n'
source_readme.write_text(text,encoding='utf-8-sig')
doc=REPO/'docs/功能表与使用方法.md';text=doc.read_text(encoding='utf8');text='当前操作以 [v0.21安装与使用方法](v0.21安装与使用方法.md) 为准：线上双插件、窗口拖动与缩放、独立演出角色、怪物立绘库及新版先攻。以下保留原功能说明。\n\n'+text;doc.write_text(text,encoding='utf8')
ignore=REPO/'.gitignore';text=ignore.read_text(encoding='utf8')
for line in ['_site/','work/pages21/','work/v21-update-qa/']:
 if line not in text:text+='\n'+line+'\n'
ignore.write_text(text,encoding='utf8')
payload={'app':'traveler-folio','schema':1,'version':VERSION,'published':datetime.datetime.now(datetime.timezone.utc).isoformat(),'notes':'线上双插件；修复骰子摘要、优势/劣势与目标清除；工具浮窗可移动缩放；独立演出角色、怪物立绘库和新版先攻。'}
for kind,name in [('windows','TravelerFolio-Windows-Update.zip'),('android','TravelerFolio-Android.apk')]:
 p=ASSETS/name;payload[kind]={'url':'https://github.com/Feathercatttt/traveler-folio/releases/download/v'+VERSION+'/'+name,'size':p.stat().st_size,'sha256':sha(p)}
 if kind=='android':payload[kind].update(package='com.traveler.folio',versionCode=24)
spec=importlib.util.spec_from_file_location('update_release20',W/'update-release20.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);mod.sign(payload,REPO/'updates/stable.json');copy(REPO/'updates/stable.json',ASSETS/'TravelerFolio-Update.json')
(REPO/'updates/payload.example.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
archive(ASSETS/'TravelerFolio-Source.zip',[(p,'traveler-folio/'+p.relative_to(REPO).as_posix()) for p in tree(REPO)])
(ASSETS/'README-zh-CN.txt').write_text(notes+'\n\n'+guide,encoding='utf-8-sig')
(ASSETS/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(ASSETS.iterdir()) if p.is_file() and p.name!='SHA256SUMS.txt'),encoding='utf8')
for name,alias in [('TravelerFolio-Windows-Full.zip','旅人手札-Windows-v0.21.0-完整包.zip'),('TravelerFolio-Windows-Light.zip','旅人手札-Windows-v0.21.0-轻量包.zip'),('TravelerFolio-Windows-Update.zip','旅人手札-Windows-v0.21.0-更新包.zip'),('TravelerFolio-Android.apk','旅人手札-Android-v0.21.0.apk'),('TravelerFolio-Owlbear.zip','旅人手札-枭熊联动包-v0.21.0.zip'),('TravelerFolio-Source.zip','旅人手札-应用源码-v0.21.0.zip')]:copy(ASSETS/name,O/alias)
for name in ['旅人手札-Windows.zip','旅人手札-桌面版.zip']:copy(ASSETS/'TravelerFolio-Windows-Full.zip',O/name)
copy(ASSETS/'TravelerFolio-Owlbear.zip',O/'旅人手札-枭熊联动包.zip');copy(ASSETS/'TravelerFolio-Source.zip',O/'旅人手札-应用源码.zip')
report={'success':True,'version':VERSION,'checks':checks,'checkCount':len(checks),'assets':[{'name':p.name,'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(ASSETS.iterdir()) if p.is_file()],'limits':['Real Owlbear multiplayer room not authenticated/tested','GPU/physical phone coverage incomplete','Public mirror and Pages availability varies by network']}
(W/'v21-delivery-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print('Packaged',len(report['assets']),'assets;',len(checks),'checks',flush=True)
