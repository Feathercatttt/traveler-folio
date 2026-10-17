from pathlib import Path
import subprocess,zipfile,json
R=Path(__file__).resolve().parent.parent;W=R/'work';O=R/'outputs';apk=O/'旅人手札-Android.apk';tools=W/'android-sdk/build-tools/36.0.0'
def run(args):
 r=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf8',errors='replace');assert r.returncode==0,r.stderr;return r.stdout
badging=run([tools/'aapt2.exe','dump','badging',apk]);assert "versionCode='33'" in badging and "versionName='0.27.2'" in badging
with zipfile.ZipFile(apk) as z:assert z.read('assets/index.html')==(O/'旅人手札.html').read_bytes()
def cert(p):return next(x for x in run([tools/'apksigner.bat','verify','--print-certs',p]).splitlines() if 'certificate SHA-256 digest:' in x)
assert cert(apk)==cert(O/'旅人手札-Android-v0.20.0.apk')
report={'success':True,'version':'0.27.2','checks':['APK versionCode 33 / versionName 0.27.2','APK embeds byte-identical current HTML','APK signature validates and matches previous release signer'],'limits':['No physical Android device end-to-end test in this run']}
(W/'v272-android-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');print(json.dumps(report,ensure_ascii=False))
