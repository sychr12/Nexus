param(
    [int]$Port = 8080,
    [switch]$Force
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
        $isBackendDev = $command -match "sicpr|backend|mvnw|spring-boot"

        if (-not $isBackendDev -and -not $Force) {
            Write-Warning "A porta $Port esta em uso por '$($process.ProcessName)' (PID $pidValue), mas nao parece ser o backend SICPR."
            Write-Warning "Use .\scripts\stop-dev.cmd -Port $Port -Force se tiver certeza."
            return
        }

        Write-Host "Parando processo '$($process.ProcessName)' na porta $Port (PID $pidValue)..."
        Stop-Process -Id $pidValue -Force
    }
