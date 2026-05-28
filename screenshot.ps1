Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = [System.Drawing.Bitmap]::new($bounds.Width, $bounds.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$path = "$env:TEMP\screenshot.png"
$bmp.Save($path)
$g.Dispose()
$bmp.Dispose()
Write-Host "Screenshot saved to $path"
