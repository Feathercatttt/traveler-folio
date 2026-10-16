"""Package verified local artifacts and prepare the existing public checkout."""
from pathlib import Path
import hashlib,json,zipfile,shutil,subprocess,importlib.util,datetime,re
R=Path(__file__).resolve().parent.parent;W=R/'work';O=R/'outputs';WIN=O/'旅人手札-Windows';REPO=W/'github-release19/repo';STAGE=W/'github-release23';ASSETS=STAGE/'release-assets';ASSETS.mkdir(parents=True,exist_ok=True)
VERSION='0.23.0'
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
reports=['v23-bestiary-report.json','v23-mini-report.json','v23-tools-report.json','v23-roll-flow-report.json','v23-windows-report.json','v23-android-report.json'];checks=[]
for name in reports:
 row=json.loads((W/name).read_text(encoding='utf-8-sig'));assert row['success'] and not row.get('errors') and not row.get('pageErrors'),name;checks.extend(row['checks'])
assert sha(O/'旅人手札.html')==sha(WIN/'旅人手札.html')
for name in ['background.js','panel.js','roll.js','tools19.js','surface19.js','server.py']:
 assert sha(O/'owlbear'/name)==sha(WIN/'owlbear'/name),name
with zipfile.ZipFile(O/'旅人手札-Android.apk') as z:assert z.read('assets/index.html')==(O/'旅人手札.html').read_bytes()
guide=(W/'v23-guide.md').read_text(encoding='utf8')
for name in ['v0.23更新与使用说明.txt','手机与电脑使用说明.txt']:(O/name).write_text(guide,encoding='utf-8-sig')
for name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.23更新与使用说明.txt']:(WIN/name).write_text(guide,encoding='utf-8-sig')
files=[p for p in tree(WIN) if p.suffix.lower()!='.txt' or 'LICENSE' in p.name.upper() or p.name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.23更新与使用说明.txt','THIRD-PARTY19.txt']]
light=[p for p in files if p.name!='MicrosoftEdgeWebView2RuntimeInstallerX64.exe']
archive(O/'TravelerFolio-Windows-Full.zip',[(p,'旅人手札-Windows/'+p.relative_to(WIN).as_posix()) for p in files])
for kind,rows in [('Light',light),('Update',light)]:archive(ASSETS/f'TravelerFolio-Windows-{kind}.zip',[(p,('TravelerFolio-Update/' if kind=='Update' else '旅人手札-Windows/')+p.relative_to(WIN).as_posix()) for p in rows])
copy(O/'旅人手札-Android.apk',ASSETS/'TravelerFolio-Android.apk');copy(O/'旅人手札.html',ASSETS/'TravelerFolio.html')
archive(ASSETS/'TravelerFolio-Owlbear.zip',[(p,'旅人手札/'+p.relative_to(O).as_posix()) for p in [O/'旅人手札.html',O/'v0.23更新与使用说明.txt',O/'手机与电脑使用说明.txt',O/'开启枭熊联动.cmd',O/'关闭枭熊联动.cmd',O/'fflate-LICENSE.txt',O/'qrcodegen-LICENSE.txt',*tree(O/'owlbear')]])
tracked=subprocess.check_output(['git','-C',str(REPO),'ls-files','-z']).decode('utf8').split('\0')
for name in tracked:
 if name.startswith(('work/','outputs/')) and (R/name).is_file():copy(R/name,REPO/name)
for p in tree(O/'owlbear'):copy(p,REPO/'outputs/owlbear'/p.relative_to(O/'owlbear'))
new=['v23-bestiary.js','v23.css','v23-guide.md','package-v23.py','qa-v23-bestiary.cjs','qa-v23-mini.cjs','qa-v23-tools.cjs','qa-v23-roll-flow.cjs','qa-v23-windows.py','qa-v23-android.py',*reports]
for name in new:copy(W/name,REPO/'work'/name)
for folder in ['windows-app','android-app/src/com/traveler/folio']:
 for p in tree(W/folder):copy(p,REPO/'work'/folder/p.relative_to(W/folder))
for p in O.glob('v0.23-*.png'):copy(p,REPO/'docs/images'/p.name)
copy(W/'v23-guide.md',REPO/'docs/v0.23安装与使用方法.md')
notes='''# 旅人手札 v0.23.0 · 图鉴与枭熊修复

**AI 辅助生成和维护的代码。**

- 修复怪物仓库关闭后残留、返回失效与反复编辑后一次创建多条；新增独立物品/法术/特性收藏副本、完整怪物页签与副本公式编辑。
- 角色小卡恢复枭熊原生可固定窗口，支持缩放关闭；自动连接本机，不再打开额外连接弹窗。推荐本地角色速查安装地址 `http://localhost:17632/manifest.json`，跑团工具线上地址保持不变。
- 草稿加载失败可重试，断线时仍可立即关闭；修复重复取消触发全连接5秒退避，以及迟到消息重新激活已取消草稿的竞态。
- 先攻条仅按钮、状态标签和角色条目保留背景，其余完全透明；多人横向滚动，刷新保留位置。
- 直播立绘始终可直接拖动，DM/授权玩家的位置修改同步给所有人；按用户选择演出层接收地图点击。演出控制缩为半透明小条，保留结束直播。
- 原签名 APK、EXE、离线 HTML 与枭熊插件统一至 v0.23.0。所有目标和伤害掷骰均不自动扣血。

本地浏览器、真实本机桥接、Windows 原生及模拟多人回归通过；APK 签名与内嵌网页一致性通过。未登录真实枭熊多人房间，实体 Android 手机尚未验收。

操作见 [v0.23安装与使用方法](docs/v0.23安装与使用方法.md)。
'''
(REPO/'RELEASE-NOTES.md').write_text(notes,encoding='utf8',newline='\n');ch=REPO/'CHANGELOG.md';old=ch.read_text(encoding='utf8');ch.write_text(notes+'\n\n'+old if not old.startswith('# 旅人手札 v0.23.0') else old,encoding='utf8',newline='\n')
p=REPO/'README.md';text=p.read_text(encoding='utf8').replace('当前版本 **0.22.0**','当前版本 **0.23.0**');a=text.index('## 枭熊安装');b=text.index('## 功能表',a);text=text[:a]+'''## 枭熊安装

[线上插件地址](https://feathercatttt.github.io/traveler-folio/) · [v0.23操作指南](docs/v0.23安装与使用方法.md)

| 独立按钮 | DM 添加的安装地址 |
| --- | --- |
| 角色速查（本地推荐，先开EXE） | http://localhost:17632/manifest.json |
| 角色速查（线上备用） | https://feathercatttt.github.io/traveler-folio/manifest.json |
| 跑团工具 | https://feathercatttt.github.io/traveler-folio/tools-manifest.json |

每位玩家先打开自己的 EXE，再进入房间。小卡恢复枭熊原生窗口并自动连接；不再需要额外连接弹窗。线上小卡若被浏览器限制本机访问，请 DM 换用本地角色速查。停用同类旧扩展后刷新房间，避免重复后台。角色资料不会存到 GitHub Pages。

'''+text[b:];p.write_text(text,encoding='utf8',newline='\n')
p=REPO/'docs/功能表与使用方法.md';text=p.read_text(encoding='utf8');text=re.sub(r'^当前操作以 .*?\n\n','',text,count=1,flags=re.S);p.write_text('当前操作以 [v0.23安装与使用方法](v0.23安装与使用方法.md) 为准：图鉴副本、原生小卡、可靠取消、透明先攻与同步立绘拖动。\n\n'+text,encoding='utf8',newline='\n')
(REPO/'VERSION').write_text(VERSION+'\n',encoding='utf8')
payload={'app':'traveler-folio','schema':1,'version':VERSION,'published':datetime.datetime.now(datetime.timezone.utc).isoformat(),'notes':'修复怪物图鉴关闭/重复创建，新增物品法术副本；恢复原生小卡、自动连接与草稿关闭；透明横向先攻；直播立绘授权同步拖动和紧凑控制条。'}
for kind,name in [('windows','TravelerFolio-Windows-Update.zip'),('android','TravelerFolio-Android.apk')]:
 p=ASSETS/name;payload[kind]={'url':'https://github.com/Feathercatttt/traveler-folio/releases/download/v'+VERSION+'/'+name,'size':p.stat().st_size,'sha256':sha(p)}
 if kind=='android':payload[kind].update(package='com.traveler.folio',versionCode=26)
spec=importlib.util.spec_from_file_location('update_release20',W/'update-release20.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);mod.sign(payload,REPO/'updates/stable.json');copy(REPO/'updates/stable.json',ASSETS/'TravelerFolio-Update.json');(REPO/'updates/payload.example.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
archive(ASSETS/'TravelerFolio-Source.zip',[(p,'traveler-folio/'+p.relative_to(REPO).as_posix()) for p in tree(REPO)])
(ASSETS/'README-zh-CN.txt').write_text(notes+'\n\n'+guide,encoding='utf-8-sig');(ASSETS/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(ASSETS.iterdir()) if p.is_file() and p.name!='SHA256SUMS.txt'),encoding='utf8')
for name,alias in [('TravelerFolio-Windows-Light.zip','旅人手札-Windows-v0.23.0-轻量包.zip'),('TravelerFolio-Windows-Update.zip','旅人手札-Windows-v0.23.0-更新包.zip'),('TravelerFolio-Android.apk','旅人手札-Android-v0.23.0.apk'),('TravelerFolio-Owlbear.zip','旅人手札-枭熊联动包-v0.23.0.zip'),('TravelerFolio-Source.zip','旅人手札-应用源码-v0.23.0.zip')]:copy(ASSETS/name,O/alias)
for name in ['旅人手札-Windows.zip','旅人手札-桌面版.zip']:copy(O/'TravelerFolio-Windows-Full.zip',O/name)
copy(ASSETS/'TravelerFolio-Owlbear.zip',O/'旅人手札-枭熊联动包.zip');copy(ASSETS/'TravelerFolio-Source.zip',O/'旅人手札-应用源码.zip')
report={'success':True,'version':VERSION,'checks':checks,'checkCount':len(checks),'assets':[{'name':p.name,'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(ASSETS.iterdir()) if p.is_file()],'limits':['Real Owlbear room not authenticated/tested','Physical Android not tested','Hosted-local access depends on browser; local mini extension is recommended']}
(W/'v23-delivery-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print('Packaged',len(report['assets']),'assets;',len(checks),'checks',flush=True)
