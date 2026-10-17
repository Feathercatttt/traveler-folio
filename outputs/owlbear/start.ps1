$ErrorActionPreference='Stop'
$folioFolder=Split-Path -Parent $MyInvocation.MyCommand.Path
$folioBase='http://localhost:17632'
try {
  $folioRunning=$false
  $folioSession=$null
  try {$folioSession=Invoke-RestMethod -Uri "$folioBase/api/session" -TimeoutSec 2} catch {}
  if($folioSession -and $folioSession.app -eq 'adventurer-folio-owlbear') {
    if($folioSession.version -ne '0.27.2'){throw '旧版本地插件仍在运行，请关闭旧版手札和桥接后重开新版。'}
    $folioRunning=$true
  }
  if(-not $folioRunning) {
    $folioPython=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
    if(-not(Test-Path -LiteralPath $folioPython)) {
      $folioCandidate=Get-Command python.exe -ErrorAction SilentlyContinue
      if(-not $folioCandidate){$folioCandidate=Get-Command python3.exe -ErrorAction SilentlyContinue}
      if(-not $folioCandidate){throw '需要 Python 3；此桥接仅用标准库，不需要安装 npm。'}
      $folioPython=$folioCandidate.Source
    }
    $folioScript=Join-Path $folioFolder 'server.py'
    $folioLogs=Join-Path $folioFolder 'user-data'
    New-Item -ItemType Directory -Force -Path $folioLogs | Out-Null
    $folioProcess=Start-Process -FilePath $folioPython -ArgumentList @(('"' + $folioScript + '"'),'--port','17632') -WorkingDirectory $folioFolder -WindowStyle Hidden -RedirectStandardOutput (Join-Path $folioLogs 'server.log') -RedirectStandardError (Join-Path $folioLogs 'server-error.log') -PassThru
    $folioProcess.Id | Set-Content -LiteralPath (Join-Path $folioLogs 'server.pid') -Encoding ASCII
    for($folioAttempt=0;$folioAttempt -lt 30;$folioAttempt++){Start-Sleep -Milliseconds 200;try {$folioSession=Invoke-RestMethod -Uri "$folioBase/api/session" -TimeoutSec 1;if($folioSession.app -eq 'adventurer-folio-owlbear'){$folioRunning=$true;break}}catch{}}
    if(-not $folioRunning){throw '本机桥接无法启动。请查看 owlbear/user-data/server-error.log，或检查17632端口是否占用。'}
  }
  Start-Process "$folioBase/"
} catch {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show($_.Exception.Message,'旅人手札 · 枭熊联动') | Out-Null
}