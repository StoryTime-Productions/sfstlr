param(
    [string]$ZipPath,
    [string]$OutDir,
    [string]$MinecraftJar = "$env:APPDATA\.minecraft\versions\26.1.2\26.1.2.jar"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not (Test-Path $ZipPath)) {
    Write-Error "ZIP not found: $ZipPath"
    exit 1
}

Write-Host "Opening ZIP: $ZipPath"
$zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
$index = @{}
$frametimes = @{}  # key → frametime in ticks (default 1)
$count = 0

# First pass: collect all entries by full name for mcmeta lookup
$entryMap = @{}
foreach ($entry in $zip.Entries) {
    $entryMap[$entry.FullName] = $entry
}

foreach ($entry in $zip.Entries) {
    if ($entry.FullName -match '\.png$' -and $entry.Name -ne '') {
        # Strip leading "assets/" for the web path
        $relative = $entry.FullName -replace '^assets/', ''
        $webPath = '/textures/' + $relative
        $outPath = Join-Path $OutDir $relative
        $outFolder = Split-Path $outPath -Parent

        if (-not (Test-Path $outFolder)) {
            New-Item -ItemType Directory -Force -Path $outFolder | Out-Null
        }

        $stream = $entry.Open()
        $fs = [System.IO.File]::Create($outPath)
        $stream.CopyTo($fs)
        $fs.Close()
        $stream.Close()

        # Index: lowercase filename without extension → web path
        # First writer wins (higher-priority namespaces listed first in ZIP)
        $key = [System.IO.Path]::GetFileNameWithoutExtension($entry.Name).ToLower()
        if (-not $index.ContainsKey($key)) {
            $index[$key] = $webPath

            # Check for companion .mcmeta with animation frametime
            $mcmetaName = $entry.FullName + '.mcmeta'
            if ($entryMap.ContainsKey($mcmetaName)) {
                $ms = $entryMap[$mcmetaName].Open()
                $sr = New-Object System.IO.StreamReader($ms)
                $mcmetaJson = $sr.ReadToEnd()
                $sr.Close()
                $ms.Close()
                try {
                    $mcmeta = $mcmetaJson | ConvertFrom-Json
                    if ($mcmeta.animation -and $mcmeta.animation.frametime) {
                        $frametimes[$key] = [int]$mcmeta.animation.frametime
                    }
                } catch {}
            }
        }
        $count++
    }
}

$zip.Dispose()

# ── Vanilla Minecraft textures (item + block) ───────────────────────────────
if (Test-Path $MinecraftJar) {
    Write-Host "Extracting vanilla textures from: $MinecraftJar"
    $mcZip = [System.IO.Compression.ZipFile]::OpenRead($MinecraftJar)
    $mcEntryMap = @{}
    foreach ($entry in $mcZip.Entries) { $mcEntryMap[$entry.FullName] = $entry }
    $vanillaCount = 0
    foreach ($entry in $mcZip.Entries) {
        $isItem  = $entry.FullName -like "assets/minecraft/textures/item/*.png"
        $isBlock = $entry.FullName -like "assets/minecraft/textures/block/*.png"
        if (($isItem -or $isBlock) -and $entry.Name -ne '') {
            $subPath = $entry.FullName -replace '^assets/', ''  # minecraft/textures/item/coal.png
            $webPath = '/textures/' + $subPath
            $outPath = Join-Path $OutDir $subPath
            $outFolder = Split-Path $outPath -Parent
            if (-not (Test-Path $outFolder)) {
                New-Item -ItemType Directory -Force -Path $outFolder | Out-Null
            }
            $stream = $entry.Open()
            $fs = [System.IO.File]::Create($outPath)
            $stream.CopyTo($fs)
            $fs.Close()
            $stream.Close()
            # Item textures take priority over block textures.
            # JAR entries are alphabetical so block/ comes before item/ — items must overwrite.
            $key = [System.IO.Path]::GetFileNameWithoutExtension($entry.Name).ToLower()
            if ($isItem -or -not $index.ContainsKey($key)) {
                $index[$key] = $webPath

                # mcmeta frametime for vanilla animated textures
                $mcmetaName = $entry.FullName + '.mcmeta'
                if ($mcEntryMap.ContainsKey($mcmetaName)) {
                    $ms = $mcEntryMap[$mcmetaName].Open()
                    $sr = New-Object System.IO.StreamReader($ms)
                    $mcmetaJson = $sr.ReadToEnd()
                    $sr.Close()
                    $ms.Close()
                    try {
                        $mcmeta = $mcmetaJson | ConvertFrom-Json
                        if ($mcmeta.animation -and $mcmeta.animation.frametime) {
                            $frametimes[$key] = [int]$mcmeta.animation.frametime
                        }
                    } catch {}
                }
            }
            $vanillaCount++
        }
    }
    $mcZip.Dispose()
    Write-Host "Extracted $vanillaCount vanilla textures"

    # Aliases for ingredient names that differ from texture filenames
    $aliases = @{
        "redstone_dust" = "redstone"
    }
    foreach ($alias in $aliases.GetEnumerator()) {
        if (-not $index.ContainsKey($alias.Key) -and $index.ContainsKey($alias.Value)) {
            $index[$alias.Key] = $index[$alias.Value]
        }
    }
} else {
    Write-Warning "Minecraft JAR not found at $MinecraftJar — vanilla textures skipped"
}

$indexPath = Join-Path $OutDir 'index.json'
$index | ConvertTo-Json -Depth 2 | Set-Content -Path $indexPath -Encoding UTF8

$frametimesPath = Join-Path (Split-Path (Split-Path $OutDir -Parent) -Parent) 'src/lib/sprite_frametimes.json'
$frametimes | ConvertTo-Json -Depth 2 | Set-Content -Path $frametimesPath -Encoding UTF8

Write-Host "Extracted $count SF textures"
Write-Host "Index: $indexPath ($($index.Count) entries)"
Write-Host "Frametimes: $frametimesPath ($($frametimes.Count) animated textures)"
