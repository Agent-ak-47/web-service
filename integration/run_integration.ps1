param(
    [switch]$Required
)

$ErrorActionPreference = 'Stop'
$env:INTEGRATION_REQUIRED = if ($Required) { '1' } else { '0' }

py -m pytest -c "$PSScriptRoot\pytest.ini" "$PSScriptRoot" -v @args
exit $LASTEXITCODE
