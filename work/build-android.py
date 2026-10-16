from pathlib import Path
import subprocess,os,json,secrets,shutil,zipfile,sys
root=Path(__file__).resolve().parent.parent;project=root/'work/android-app';sdk=root/'work/android-sdk';tools=sdk/'build-tools/36.0.0';platform=sdk/'platforms/android-36/android.jar';build=root/'work/android-build';build.mkdir(exist_ok=True);out=root/'outputs';qa='--qa' in sys.argv
java=Path('C:/Program Files/Microsoft/jdk-21.0.10.7-hotspot');env=os.environ.copy();env['JAVA_HOME']=str(java);signing=root/'work/android-signing';signing.mkdir(exist_ok=True);credentials=signing/'credentials.json'
if not credentials.exists():credentials.write_text(json.dumps({'password':secrets.token_urlsafe(28)}),encoding='utf8')
env['FOLIO_KS_PASSWORD']=json.loads(credentials.read_text(encoding='utf8'))['password'];key=signing/'folio-release.p12'
def run(args):
 r=subprocess.run([str(x) for x in args],env=env,cwd=root,text=True,encoding='utf8',errors='replace',capture_output=True)
 if r.returncode:print(r.stdout);print(r.stderr);raise SystemExit(r.returncode)
 if r.stdout.strip():print(r.stdout.strip())
for p in (project/'src').rglob('*.java'):p.write_text(p.read_text(encoding='utf-8-sig'),encoding='utf8')
shutil.copyfile(out/'旅人手札.html',project/'assets/index.html');shutil.copyfile(root/'work/fflate-LICENSE.txt',project/'assets/fflate-LICENSE.txt')
shutil.copyfile(out/'qrcodegen-LICENSE.txt',project/'assets/qrcodegen-LICENSE.txt')
shutil.copyfile(root/'work/android-deps/zxing-LICENSE.txt',project/'assets/zxing-LICENSE.txt')
if not key.exists():run([java/'bin/keytool.exe','-genkeypair','-keystore',key,'-storetype','PKCS12','-storepass:env','FOLIO_KS_PASSWORD','-alias','folio','-keyalg','RSA','-keysize','3072','-validity','10950','-dname','CN=Traveler Folio Local, O=Traveler Folio, C=CN'])
run([tools/'aapt2.exe','compile','--dir',project/'res','-o',build/'resources.zip'])
args=[tools/'aapt2.exe','link','-o',build/'resources.apk','-I',platform,'--manifest',project/'AndroidManifest.xml','-A',project/'assets',build/'resources.zip','--min-sdk-version','26','--target-sdk-version','36']
if qa:args+=['--debug-mode']
run(args);classes=build/'classes';classes.mkdir(exist_ok=True);dex=build/'dex';dex.mkdir(exist_ok=True)
run([java/'bin/javac.exe','-J-Duser.language=en','-J-Duser.country=US','-encoding','UTF-8','-source','8','-target','8','-classpath',str(platform)+os.pathsep+str(root/'work/android-deps/zxing-core-3.5.3.jar'),'-d',classes,*sorted((project/'src').rglob('*.java'))])
run([tools/'d8.bat','--lib',platform,'--min-api','26','--output',dex,*sorted(classes.rglob('*.class')),root/'work/android-deps/zxing-core-3.5.3.jar'])
shutil.copyfile(build/'resources.apk',build/'unsigned.apk')
with zipfile.ZipFile(build/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
run([tools/'zipalign.exe','-f','-P','16','4',build/'unsigned.apk',build/'aligned.apk'])
dest=root/'work/Folio-QA.apk' if qa else out/'旅人手札-Android.apk'
run([tools/'apksigner.bat','sign','--ks',key,'--ks-key-alias','folio','--ks-pass','env:FOLIO_KS_PASSWORD','--out',dest,build/'aligned.apk'])
run([tools/'apksigner.bat','verify','--verbose',dest]);print('Built '+str(dest)+' '+str(dest.stat().st_size)+' bytes')
