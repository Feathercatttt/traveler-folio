from pathlib import Path
import hashlib,json,shutil,zipfile

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'outputs'
WORK=ROOT/'work'
WIN=OUT/'旅人手札-Windows'
VERSION='0.19.0'
def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    return h.hexdigest()
report_names=['v19-main-report.json','v19-web-report.json','v19-bestiary-report.json','v19-tools-report.json','v19-roll-flow-report.json','v19-backend-report.json','v17-marked-report.json','v17-mobile-report.json','v19-panel-touch-report.json','v17-performance-report.json','v19-android-report.json','v19-windows-report.json','v19-release-report.json','v131-touch-web-report.json','v132-formula-web-report.json','v134-integration-report.json']
checks={}
for name in report_names:
    data=json.loads((WORK/name).read_text(encoding='utf-8-sig'))
    assert data['success'] is True and not data.get('errors'),name
    checks[name]=len(data['checks'])
html=OUT/'旅人手札.html'
apk=OUT/'旅人手札-Android.apk'
assert digest(html)==digest(WIN/html.name)
with zipfile.ZipFile(apk) as z:assert z.read('assets/index.html')==html.read_bytes()
assert digest(apk)==json.loads((WORK/'v19-release-report.json').read_text(encoding='utf8'))['apkSha256']
installer='MicrosoftEdgeWebView2RuntimeInstallerX64.exe'
assert digest(WIN/installer)==json.loads((WORK/'v16-runtime-info.json').read_text(encoding='utf8'))['sha256']

# Archive only declared public build inputs; never traverse signing or user profiles.
def allowed(p):
    return p.is_file() and not any(x in ['__pycache__','user-data','node_modules','.git','android-signing'] for x in p.parts) and p.suffix not in ['.snapshot','.pyc','.p12','.jks','.keystore']
def tree(folder):return [p for p in sorted(folder.rglob('*')) if allowed(p)]
def archive(dest,entries):
    entries=list(entries)
    assert len({name for _,name in entries})==len(entries)
    tmp=dest.with_suffix('.zip.tmp')
    with zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for path,name in entries:
            assert allowed(path),path
            assert 'credentials' not in name.lower(),name
            assert '..' not in Path(name).parts,name
            z.write(path,name)
    with zipfile.ZipFile(tmp) as z:
        assert z.testzip() is None
        for path,name in entries:
            with z.open(name) as f:
                h=hashlib.sha256()
                for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
            assert h.hexdigest()==digest(path),name
    tmp.replace(dest)
    result={'file':dest.name,'files':len(entries),'bytes':dest.stat().st_size,'sha256':digest(dest),'verified':True}
    print(json.dumps(result,ensure_ascii=False),flush=True)
    return result

windows_entries=[(p,'旅人手札-Windows/'+p.relative_to(WIN).as_posix()) for p in tree(WIN) if p.suffix.lower()!='.txt' or 'LICENSE' in p.name.upper() or p.name in ['使用说明.txt','手机与电脑使用说明.txt','枭熊联动说明.txt','v0.19更新与使用说明.txt']]
full=archive(OUT/f'旅人手札-Windows-v{VERSION}-完整包.zip',windows_entries)
lite=archive(OUT/f'旅人手札-Windows-v{VERSION}-轻量包.zip',[(p,n) for p,n in windows_entries if p.name!=installer])
for alias in ['旅人手札-Windows.zip','旅人手札-桌面版.zip']:
    shutil.copyfile(OUT/full['file'],OUT/alias)
    assert digest(OUT/alias)==full['sha256']
versioned_apk=OUT/f'旅人手札-Android-v{VERSION}.apk'
shutil.copyfile(apk,versioned_apk)
assert digest(versioned_apk)==digest(apk)

legacy_names=['旅人手札.html','v0.19更新与使用说明.txt','手机与电脑使用说明.txt','开启枭熊联动.cmd','关闭枭熊联动.cmd','开启桌面模式.cmd','folio-desktop.ps1','fflate-LICENSE.txt','qrcodegen-LICENSE.txt','v0.19-跑团工具-470.png','v0.19-怪物图鉴-390.png']
legacy_paths=[OUT/n for n in legacy_names]+tree(OUT/'owlbear')
legacy=archive(OUT/'旅人手札-枭熊联动包.zip',[(p,'旅人手札/'+p.relative_to(OUT).as_posix()) for p in legacy_paths])

readme=WORK/'native-source-README-v17.txt'
readme.write_text('''旅人手札 v0.19.0 应用源码（数据版本10）

保留原 work/ 与 outputs/ 路径结构。所有命令从解压后的“源码”目录执行。
现成 HTML 可以直接本地打开；APK/Windows包见独立交付文件，运行不需源码环境。

HTML：python work/assemble-v13.py
构建器使用不可变的 work/prototype-v012.html，依次加入 v13、v134、v14、v16、v17、v18、v19 模块。
请修改对应模块，勿直接修改生成的HTML。assemble同时从obr-roll-core生成共用骰子解析器。

枭熊：在 outputs/owlbear/src 执行 npm install --ignore-scripts，然后 npm run build。
SDK版本由package.json固定；普通使用不需npm。服务器仅用Python标准库。
obr-token-sync.mjs为本项目实现的Stat Bubbles适配器。src/vendor/suite19 为改编自 FullPeople/obr-suite 的GPL骰子动画及音效代码，保留对应源码和许可证。

Android：需要JDK21及Android SDK36；按实际电脑调整build-android.py的JDK路径。
python work/setup-android-sdk.py 准备官方SDK；固定ZXing3.5.3的jar和许可证已在work/android-deps。
python work/build-android.py 构建正式APK；默认会新建属于你自己的发布密钥。
原签名私钥、口令不随源码分发，新密钥生成的APK不能覆盖本项目旧签名APK。
相机权限在用户点扫码后申请；扫码和私网传输使用原生接口，无需Google服务。

Windows：需要.NET Framework C#编译器、Pillow和WebView2 SDK DLL，以及可携Python。
python work/setup-windows-deps.py 获取官方依赖（此脚本默认查当时稳定版本）。
本次已验证的依赖版本和URL见work/windows-deps/dependency-versions.json。
python work/build-windows.py 构建64位Windows桌面程序。
完整版的WebView2官方离线安装器体积约204MiB，不放入源码包。
如需构建完整版，从交付的Windows完整版复制安装器到
work/windows-deps/WebView2Installer/MicrosoftEdgeWebView2RuntimeInstallerX64-complete.exe。
哈希必须与work/v16-runtime-info.json一致，否则构建器拒绝附带；不复制则为轻量版。
官方重新下载地址：https://go.microsoft.com/fwlink/?linkid=2124701
微软后续替换下载文件时应重新校验Microsoft Authenticode并更新本地元数据，不能跳过校验。
应用只在用户点击安装按钮后运行经过Microsoft签名验证的安装器。

测试：work/qa-v19-*.cjs、*.py和verify-v19.py；当前回归报告附在work/。
部分测试路径指向本机Edge、Playwright、Android模拟器，需按自己环境调整。
Android扫码已用最终正式APK在Android15模拟器的真实Camera2画面验证。
枭熊以SDK模拟房间验证；尚未验收实体手机及已登录的真实多人枭熊房间。
扫码为一次性数据快照：电脑出示二维码，APK扫码后应用内预览确认；不是持续后台同步。
棋子同步以角色卡为来源，绑定后单向更新HP、最大HP、临时HP与AC。

不含：签名私钥、口令、浏览器/应用数据、测试角色记录、SDK/模拟器大文件及研究缓存。
第三方许可证保留于outputs/及work/android-deps等对应目录。
''',encoding='utf-8-sig')
work_names=['prototype-v012.html','assemble-v13.py','patch_touch_v131.py','folio-dice14.js','fflate-0.8.2.js','fflate-LICENSE.txt','qrcodegen-1.8.0.js','qrcodegen-1.8.0.ts','v13-transfer.js','v13-mobile.js','v13.css','v13-formulas.js','v13-formulas.css','v13-card-details.js','v13-card-details.css','v13-touch.css','v134-rest.js','v134-summon-actions.js','v134.css','v14-cards-rolls.js','v14-transfer.js','v14.css','v16-performance.js','v16-transfer.js','v16-owl.js','v16.css','v17-health.js','v17-bonus.js','v17-transfer.js','v17-search.js','v17-persistence.js','v17.css','v18-effects.js','v18-rolls.js','v18.css','v19-bestiary.js','v19-bestiary.css','v14-benchmark.html','v13-android-code.txt','build-android.py','build-windows.py','build-obr.cjs','setup-android-sdk.py','android-repository.xml','setup-windows-deps.py','v16-runtime-info.json','NativeContract16.java','verify-v19.py','package-v19.py','qa-v131-touch.cjs','qa-v132-formulas.cjs','qa-v133-card-details.cjs','qa-v134-rest.cjs','qa-v134-actions.cjs','qa-v134-integration.cjs','qa-v14-extra.cjs']
source_paths=[WORK/n for n in work_names]+[WORK/n for n in report_names]+list(WORK.glob('qa-v19-*.cjs'))+list(WORK.glob('qa-v19-*.py'))
source_paths+=[p for p in tree(WORK/'android-app') if 'assets' not in p.parts]
source_paths+=tree(WORK/'windows-app')
source_paths+=[WORK/'android-deps/zxing-core-3.5.3.jar',WORK/'android-deps/zxing-LICENSE.txt',WORK/'windows-deps/dependency-versions.json']
source_paths+=[OUT/n for n in ['旅人手札.html','fflate-LICENSE.txt','qrcodegen-LICENSE.txt','v0.19更新与使用说明.txt','手机与电脑使用说明.txt','开启枭熊联动.cmd','关闭枭熊联动.cmd','开启桌面模式.cmd','folio-desktop.ps1']]+tree(OUT/'owlbear')
source_paths=sorted(set(source_paths))
source=archive(OUT/'旅人手札-应用源码.zip',[(readme,'源码/README.txt')]+[(p,'源码/'+p.relative_to(ROOT).as_posix()) for p in source_paths])
shutil.copyfile(OUT/'旅人手札-应用源码.zip',OUT/f'旅人手札-应用源码-v{VERSION}.zip')
shutil.copyfile(OUT/'旅人手札-枭熊联动包.zip',OUT/f'旅人手札-枭熊联动包-v{VERSION}.zip')
report={'success':True,'version':VERSION,'schema':10,'html':{'file':html.name,'sha256':digest(html),'bytes':html.stat().st_size},'apk':{'file':versioned_apk.name,'sha256':digest(apk),'bytes':apk.stat().st_size,'releaseSigned':True,'embeddedHtmlMatch':True},'windowsFull':full,'windowsLight':lite,'owlbearBundle':legacy,'source':source,'checkCount':sum(checks.values()),'reports':checks,'limits':['Android camera verified with final release APK and emulator Camera2; physical phone not tested','Owlbear SDK/room integration mocked; authenticated multiplayer room not tested','Token values and Marked-compatible status labels flow from the character card to the map only','QR is reviewed snapshot transfer on the same LAN, not continuous background sync']}
(WORK/'v19-delivery-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
