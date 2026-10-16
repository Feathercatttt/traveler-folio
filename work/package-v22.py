"""Release v0.22: explicit source copies and original signing identities."""
from pathlib import Path
import hashlib,json,zipfile,shutil,subprocess,importlib.util,datetime,re
R=Path(__file__).resolve().parent.parent;W=R/'work';O=R/'outputs';WIN=O/'旅人手札-Windows';REPO=W/'github-release19/repo';STAGE=W/'github-release22';ASSETS=STAGE/'release-assets';ASSETS.mkdir(parents=True,exist_ok=True)
VERSION='0.22.0'
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
reports=['v22-tools-report.json','v22-bestiary-report.json','v22-windows-report.json','v22-android-report.json'];checks=[]
for name in reports:
 row=json.loads((W/name).read_text(encoding='utf-8-sig'));assert row['success'] and not row.get('errors') and not row.get('pageErrors'),name;checks.extend(row['checks'])
assert sha(O/'旅人手札.html')==sha(WIN/'旅人手札.html')
with zipfile.ZipFile(O/'旅人手札-Android.apk') as z:assert z.read('assets/index.html')==(O/'旅人手札.html').read_bytes()
def cert(p):
 run=subprocess.run([str(W/'android-sdk/build-tools/36.0.0/apksigner.bat'),'verify','--print-certs',str(p)],capture_output=True,text=True,encoding='utf8',errors='replace');assert run.returncode==0
 return next(s for s in run.stdout.splitlines() if 'certificate SHA-256 digest:' in s)
assert cert(O/'旅人手札-Android.apk')==cert(O/'旅人手札-Android-v0.20.0.apk')
guide=(W/'v22-guide.md').read_text(encoding='utf8')
for name in ['v0.22更新与使用说明.txt','手机与电脑使用说明.txt']:(O/name).write_text(guide,encoding='utf-8-sig')
for name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.22更新与使用说明.txt']:(WIN/name).write_text(guide,encoding='utf-8-sig')
files=[p for p in tree(WIN) if p.suffix.lower()!='.txt' or 'LICENSE' in p.name.upper() or p.name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.22更新与使用说明.txt','THIRD-PARTY19.txt']]
light=[p for p in files if p.name!='MicrosoftEdgeWebView2RuntimeInstallerX64.exe']
archive(O/'TravelerFolio-Windows-Full.zip',[(p,'旅人手札-Windows/'+p.relative_to(WIN).as_posix()) for p in files])
(ASSETS/'TravelerFolio-Windows-Full.zip').unlink(missing_ok=True)
for kind,rows in [('Light',light),('Update',light)]:archive(ASSETS/f'TravelerFolio-Windows-{kind}.zip',[(p,('TravelerFolio-Update/' if kind=='Update' else '旅人手札-Windows/')+p.relative_to(WIN).as_posix()) for p in rows])
copy(O/'旅人手札-Android.apk',ASSETS/'TravelerFolio-Android.apk');copy(O/'旅人手札.html',ASSETS/'TravelerFolio.html')
archive(ASSETS/'TravelerFolio-Owlbear.zip',[(p,'旅人手札/'+p.relative_to(O).as_posix()) for p in [O/'旅人手札.html',O/'v0.22更新与使用说明.txt',O/'手机与电脑使用说明.txt',O/'开启枭熊联动.cmd',O/'关闭枭熊联动.cmd',O/'fflate-LICENSE.txt',O/'qrcodegen-LICENSE.txt',*tree(O/'owlbear')]])
# Only already-public files plus declared v21 code and static extension source.
tracked=subprocess.check_output(['git','-c','safe.directory='+REPO.as_posix(),'-C',str(REPO),'ls-files','-z']).decode('utf8').split('\0')
for name in tracked:
 if name.startswith(('work/','outputs/')) and (R/name).is_file():copy(R/name,REPO/name)
for p in tree(O/'owlbear'):copy(p,REPO/'outputs/owlbear'/p.relative_to(O/'owlbear'))
new=['v22-guide.md','build-pages21.py','pages-workflow21.yml','package-v22.py','qa-v22-tools.cjs','qa-v22-bestiary.cjs','qa-v22-windows.py',*reports]
for name in new:copy(W/name,REPO/'work'/name)
for folder in ['windows-app','android-app/src/com/traveler/folio']:
 for p in tree(W/folder):copy(p,REPO/'work'/folder/p.relative_to(W/folder))
for p in O.glob('v0.22-*.png'):copy(p,REPO/'docs/images'/p.name)
copy(W/'v22-guide.md',REPO/'docs/v0.22安装与使用方法.md');copy(W/'pages-workflow21.yml',REPO/'.github/workflows/pages.yml')
notes='''# 旅人手札 v0.22.0 · 怪物图鉴与工具窗口更新

**AI 辅助生成和维护的代码。**

- 怪物图鉴替代左侧村规手册入口，以右侧仓库打开；支持物种、分类、等级、熟练加值筛选与搜索。
- 怪物卡分为基础属性、豁免、熟练加值、特性、动作、法术六区；可上传立绘、编辑并查看完整卡片，不可添加到玩家角色卡。
- 修复普通工具页先攻样式覆盖导航的问题；独立顶部横向先攻条与演出窗口保留原有交互。
- EXE、APK、离线 HTML 与两个枭熊插件统一为 v0.22.0；公开 Release 提供 Windows 轻量包与应用内更新包，缺少 WebView2 时显示官方安装或浏览器打开选项。大型离线安装器仅保留在本地完整包。
- 本地浏览器与模拟房间回归、Windows 原生检查通过。Android 模拟器 UiAutomation 在扫码步骤前故障；APK签名及嵌入网页已验证，本次未完成扫码端到端复测。真实枭熊登录房间和实体手机尚未覆盖。

具体操作见 [v0.22安装与使用方法](docs/v0.22安装与使用方法.md)。
'''
(REPO/'RELEASE-NOTES.md').write_text(notes,encoding='utf8')
changelog=REPO/'CHANGELOG.md';old=changelog.read_text(encoding='utf8');changelog.write_text(notes+'\n\n'+old if not old.startswith('# 旅人手札 v0.22.0') else old,encoding='utf8')
readme=REPO/'README.md';text=readme.read_text(encoding='utf8').replace('当前版本 **0.21.0**','当前版本 **0.22.0**').replace('v0.21','v0.22').replace('v0.21.0','v0.22.0')
a=text.index('## 枭熊安装');b=text.index('## 功能表',a)
text=text[:a]+'''## 枭熊安装

[线上安装说明与复制地址](https://feathercatttt.github.io/traveler-folio/) · [v0.22操作指南](docs/v0.22安装与使用方法.md)

| 独立按钮 | DM 添加的安装地址 |
| --- | --- |
| 角色速查 | https://feathercatttt.github.io/traveler-folio/manifest.json |
| 跑团工具 | https://feathercatttt.github.io/traveler-folio/tools-manifest.json |

停用旧 localhost 扩展并刷新房间。DM 换电脑仍使用相同地址。骰子、先攻、演出与场景工具独立运行；读取本地角色或怪物库时打开 EXE v0.22，在小卡点击“连接本机角色卡”，受浏览器限制时使用“连接窗口”。角色资料不会存到 GitHub Pages。

'''+text[b:]
text='\n'.join(line for line in text.splitlines() if '| 时停' not in line)+'\n'
text=re.sub(r'\| 立绘演出 \|[^\n]*', '| 立绘演出 | 跑团工具 → 演出 | 独立角色、差分上传、直播名单、上下场、玩家控制分享、原生地图滤镜 |',text)
text=re.sub(r'\| 怪物图鉴 \|[^\n]*', '| 怪物图鉴 | 主页面左栏 → 右侧仓库 | 按物种、分类、等级、熟练加值筛选；可打开完整卡，六区编辑，不添加到玩家角色卡 |', text)
readme.write_text(text,encoding='utf8');(REPO/'VERSION').write_text(VERSION+'\n',encoding='utf8')
source_readme=REPO/'README.txt';text=source_readme.read_text(encoding='utf-8-sig').replace('v0.21.0','v0.22.0').replace('v0.20.0','v0.22.0').replace('v18、v19、v20 模块','v18、v19、v20、v21、v22 模块').replace('v18、v19、v20、v21 模块','v18、v19、v20、v21、v22 模块')
if 'GitHub Pages自动发布' not in text:text+='\nGitHub Pages自动发布：main分支推送插件源码后，Actions按package-lock构建并发布静态白名单；两个安装地址保持不变。详见docs/v0.22安装与使用方法.md。\n'
source_readme.write_text(text,encoding='utf-8-sig')
doc=REPO/'docs/功能表与使用方法.md';text=doc.read_text(encoding='utf8');intro='当前操作以 [v0.22安装与使用方法](v0.22安装与使用方法.md) 为准：怪物图鉴仓库、分类筛选与完整卡编辑。以下保留原功能说明。'
while text.startswith('当前操作以 '):text=text.split('\n\n',1)[1] if '\n\n' in text else ''
text=intro+'\n\n'+text
doc.write_text(text,encoding='utf8')
ignore=REPO/'.gitignore';text=ignore.read_text(encoding='utf8')
for line in ['_site/','work/pages22/','work/v21-update-qa/']:
 if line not in text:text+='\n'+line+'\n'
ignore.write_text(text,encoding='utf8')
payload={'app':'traveler-folio','schema':1,'version':VERSION,'published':datetime.datetime.now(datetime.timezone.utc).isoformat(),'notes':'线上双插件；修复骰子摘要、优势/劣势与目标清除；工具浮窗可移动缩放；独立演出角色、怪物立绘库和新版先攻。'}
for kind,name in [('windows','TravelerFolio-Windows-Update.zip'),('android','TravelerFolio-Android.apk')]:
 p=ASSETS/name;payload[kind]={'url':'https://github.com/Feathercatttt/traveler-folio/releases/download/v'+VERSION+'/'+name,'size':p.stat().st_size,'sha256':sha(p)}
 if kind=='android':payload[kind].update(package='com.traveler.folio',versionCode=25)
spec=importlib.util.spec_from_file_location('update_release20',W/'update-release20.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);mod.sign(payload,REPO/'updates/stable.json');copy(REPO/'updates/stable.json',ASSETS/'TravelerFolio-Update.json')
(REPO/'updates/payload.example.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
archive(ASSETS/'TravelerFolio-Source.zip',[(p,'traveler-folio/'+p.relative_to(REPO).as_posix()) for p in tree(REPO)])
(ASSETS/'README-zh-CN.txt').write_text(notes+'\n\n'+guide,encoding='utf-8-sig')
(ASSETS/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(ASSETS.iterdir()) if p.is_file() and p.name!='SHA256SUMS.txt'),encoding='utf8')
for name,alias in [('TravelerFolio-Windows-Light.zip','旅人手札-Windows-v0.22.0-轻量包.zip'),('TravelerFolio-Windows-Update.zip','旅人手札-Windows-v0.22.0-更新包.zip'),('TravelerFolio-Android.apk','旅人手札-Android-v0.22.0.apk'),('TravelerFolio-Owlbear.zip','旅人手札-枭熊联动包-v0.22.0.zip'),('TravelerFolio-Source.zip','旅人手札-应用源码-v0.22.0.zip')]:copy(ASSETS/name,O/alias)
for name in ['旅人手札-Windows.zip','旅人手札-桌面版.zip']:copy(O/'TravelerFolio-Windows-Full.zip',O/name)
copy(ASSETS/'TravelerFolio-Owlbear.zip',O/'旅人手札-枭熊联动包.zip');copy(ASSETS/'TravelerFolio-Source.zip',O/'旅人手札-应用源码.zip')
report={'success':True,'version':VERSION,'checks':checks,'checkCount':len(checks),'assets':[{'name':p.name,'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(ASSETS.iterdir()) if p.is_file()],'limits':['Real Owlbear multiplayer room not authenticated/tested','Android emulator UiAutomation failed before camera scan; APK metadata, signature, and embedded HTML were verified','GPU/physical phone coverage incomplete','Public mirror and Pages availability varies by network']}
(W/'v22-delivery-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print('Packaged',len(report['assets']),'assets;',len(checks),'checks',flush=True)
