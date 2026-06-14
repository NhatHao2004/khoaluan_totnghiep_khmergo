$files = Get-ChildItem -Path . -Include *.tsx,*.ts,*.js -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "fontWeight:\s*['\"](bold|600|700|800|900)['\"]") {
        $newContent = $content -replace "fontWeight:\s*['\"](bold|600|700|800|900)['\"]", "fontWeight: '400'"
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "Updated: $($file.FullName)"
    }
}
