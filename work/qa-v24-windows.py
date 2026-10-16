from pathlib import Path
import subprocess,shutil,sys,json,zipfile,os,re,hashlib
root=Path.cwd();w=root/'work';out=root/'outputs';subprocess.run([sys.executable,'-X','utf8',str(w/'build-windows.py')],check=True);startup=subprocess.STARTUPINFO();startup.dwFlags|=subprocess.STARTF_USESHOWWINDOW;startup.wShowWindow=0
checks=[]
for flag,folder in [('--runtime-ui-test','windows-qa-v24-runtime-help'),('--self-test','windows-qa-v24-native')]:
 qa=w/folder;qa.mkdir(exist_ok=True);shutil.copyfile(w/'v13-android-code.txt',qa/'phone-code.txt')
 for name in ['native-error.txt','self-test-success.txt','runtime-help-test.txt']:(qa/name).unlink(missing_ok=True)
 process=subprocess.Popen([str(out/'旅人手札-Windows/旅人手札.exe'),flag,str(qa)],cwd=out/'旅人手札-Windows',startupinfo=startup)
 try:process.wait(timeout=80)
 except subprocess.TimeoutExpired:process.kill();raise
 assert not (qa/'native-error.txt').exists(),(qa/'native-error.txt').read_text(encoding='utf8') if (qa/'native-error.txt').exists() else ''
 if flag=='--runtime-ui-test':
  labels=json.loads((qa/'runtime-help-test.txt').read_text(encoding='utf8'));assert '安装随包附带的网页内核' in labels;assert '用浏览器打开本地卡片' in labels;checks.append('模拟缺少WebView2时显示可操作的离线安装/浏览器选项，无英文异常弹窗、无自动阻塞下载')
 else:
  assert (qa/'self-test-success.txt').exists();u=json.loads(json.loads((qa/'native-update20.json').read_text(encoding='utf8')));assert u['current']=='0.24.0' and u['settings'] and u['native']=='windows';checks.append('真实 WebView2 更新页面与原生状态消息往返通过');assert (qa/'installer-verified.txt').exists();dom=json.loads(json.loads((qa/'native-dom.json').read_text(encoding='utf8')));assert dom['connected'] and dom['platform']=='windows';checks.append('新版EXE原生启动、自动桥接、透明置顶浮窗、收起展开、互通与原生消息通过');checks.append('EXE自身验证随包微软安装器签名通过；测试未执行安装器或修改系统环境')
for x in checks:print('PASS '+x,flush=True)
(w/'v24-windows-report.json').write_text(json.dumps({'success':True,'checks':checks},ensure_ascii=False,indent=2),encoding='utf8')
