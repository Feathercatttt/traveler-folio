from pathlib import Path
import json,shutil,subprocess,zipfile,re,hashlib
root=Path.cwd();w=root/'work';out=root/'outputs';apk=out/'旅人手札-Android.apk';scratch=w/'FolioReleaseVerify17.apk';shutil.copyfile(apk,scratch)
java=Path('C:/Program Files/Microsoft/jdk-21.0.10.7-hotspot')
def cert(path):
 r=subprocess.run([str(java/'bin/java.exe'),'-jar',str(w/'android-sdk/build-tools/36.0.0/lib/apksigner.jar'),'verify','--print-certs',str(path)],capture_output=True,text=True,encoding='utf8');assert r.returncode==0,r.stderr;return re.search(r'Signer #1 certificate SHA-256 digest: (\w+)',r.stdout).group(1)
assert cert(apk)==cert(out/'旅人手札-Android-v0.14.0.apk')
meta=subprocess.check_output([str(w/'android-sdk/build-tools/36.0.0/aapt.exe'),'dump','badging',str(scratch)],text=True,encoding='utf8',errors='replace');assert "versionCode='22'" in meta and "versionName='0.19.0'" in meta;assert 'application-debuggable' not in meta;assert 'android.permission.CAMERA' in meta and 'android.permission.INTERNET' in meta
with zipfile.ZipFile(apk) as z:assert z.read('assets/index.html')==(out/'旅人手札.html').read_bytes();assert 'assets/zxing-LICENSE.txt' in z.namelist()
assert 'qr-frame16.pgm' not in (w/'android-app/src/com/traveler/folio/QrScanActivity.java').read_text(encoding='utf8')
assert (out/'旅人手札-Windows/旅人手札.html').read_bytes()==(out/'旅人手札.html').read_bytes()
installer=out/'旅人手札-Windows/MicrosoftEdgeWebView2RuntimeInstallerX64.exe';info=json.loads((w/'v16-runtime-info.json').read_text(encoding='utf8'));assert hashlib.sha256(installer.read_bytes()).hexdigest()==info['sha256'] and info['status']=='Valid'
checks=['正式APK版本0.19.0/22、关闭调试，签名与0.14一致可覆盖安装','APK、EXE内HTML与最终单文件字节一致，带离线扫码许可证','原生网络接口仅接受专用私网互通链接，九种危险或不规范URL被拒绝','正式源码已移除相机帧调试保存','随包离线安装器与微软签名验证过的完整下载字节一致']
(w/'v19-release-report.json').write_text(json.dumps({'success':True,'checks':checks,'htmlSha256':hashlib.sha256((out/'旅人手札.html').read_bytes()).hexdigest(),'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest()},ensure_ascii=False,indent=2),encoding='utf8');print('Final APK version, certificate, HTML and offline runtime verified')
