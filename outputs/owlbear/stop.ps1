$ErrorActionPreference='Stop'
$folioFolder=Split-Path -Parent $MyInvocation.MyCommand.Path
$folioPidFile=Join-Path $folioFolder 'user-data/server.pid'
if(Test-Path -LiteralPath $folioPidFile) {
 $folioId=Get-Content -LiteralPath $folioPidFile | Select-Object -First 1
 $folioProcessInfo=Get-CimInstance Win32_Process -Filter "ProcessId = $folioId" -ErrorAction SilentlyContinue
 $folioExpected=Join-Path $folioFolder 'server.py'
 if($folioProcessInfo -and $folioProcessInfo.CommandLine.Contains($folioExpected) -and $folioProcessInfo.CommandLine.Contains('17632')){Stop-Process -Id ([int]$folioId)}
}