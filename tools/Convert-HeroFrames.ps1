# Optional offline export. Requires the cwebp encoder (Google WebP utilities) on PATH.
param(
    [string]$SourceRoot = (Join-Path $PSScriptRoot '../dist/assets/frames'),
    [string]$OutputRoot = (Join-Path $PSScriptRoot '../.local/webp-frames'),
    [ValidateRange(1,100)][int]$Quality = 78
)
$ErrorActionPreference = 'Stop'
$encoder = (Get-Command cwebp -CommandType Application -ErrorAction Stop).Source
foreach ($look in @('dark', 'white pic')) {
    $source = Join-Path $SourceRoot $look
    $destination = Join-Path $OutputRoot $look
    $frames = @(Get-ChildItem -LiteralPath $source -Filter 'ezgif-frame-*.jpg' -File | Sort-Object Name)
    if ($frames.Count -eq 0) { throw "No JPEG frames in $source" }
    [IO.Directory]::CreateDirectory($destination) | Out-Null
    foreach ($frame in $frames) {
        $output = Join-Path $destination ($frame.BaseName + '.webp')
        & $encoder -quiet -mt -q $Quality $frame.FullName -o $output
        if ($LASTEXITCODE -ne 0) { throw "Conversion failed for $($frame.FullName)" }
    }
    Write-Output "$($frames.Count) frames written to $destination"
}
