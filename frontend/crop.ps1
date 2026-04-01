Add-Type -AssemblyName System.Drawing

function Crop-Image ($source, $target) {
    Write-Host "Processing $source"
    $img = [System.Drawing.Image]::FromFile($source)
    # The text/padding is at the bottom. Crop to the top 65% of the image.
    $cropHeight = [math]::Floor($img.Height * 0.65)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $img.Width, $cropHeight)
    
    # Ensure transparent background support
    $bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Clear background to transparent
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Saved to $target"
}

$dir = "C:\Users\hapat\.gemini\antigravity\brain\e3659b64-bdbb-46f8-a5ec-3b9d8f491308"
Crop-Image "$dir\media__1774899316454.png" "G:\ASU\ASU Classes\Spring Classes\573\clicklessAI-SWM\frontend\public\logo-1-cropped.png"
Crop-Image "$dir\media__1774899316506.png" "G:\ASU\ASU Classes\Spring Classes\573\clicklessAI-SWM\frontend\public\logo-2-cropped.png"
