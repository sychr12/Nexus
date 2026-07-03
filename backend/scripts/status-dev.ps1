param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $connections) {
    Write-Host "Nenhum processo escutando na porta $Port."
    exit 0
}

$connections |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object {
        $pidValue = $_
        $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
        $command = (Get-CimInstance Win32_Process -Filter "ProcessId = $pidValue" -ErrorAction SilentlyContinue).CommandLine

        [PSCustomObject]@{
            Port = $Port
            Pid = $pidValue
            Name = $process.ProcessName
            CommandLine = $command
        }
    } |
    Format-List
