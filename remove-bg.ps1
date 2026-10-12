# remove-bg.ps1 — xóa background TRẮNG (#FFFFFF) của PNG thành transparent.
#
# Chỉ xóa đúng màu trắng R255 G255 B255 (không dò màu viền).
#
# Ví dụ:
#   .\remove-bg.ps1 -Path "asset\tank\warningtileoverlay.png"
#   .\remove-bg.ps1 -Path "asset" -Recurse            # quét cả thư mục
#   .\remove-bg.ps1 -Path "a.png" -Tolerance 10       # xóa cả trắng ngà (254, 253...)
#   .\remove-bg.ps1 -Path "a.png" -InPlace            # ghi đè (tự backup .bak)
param(
  [Parameter(Mandatory=$true)][string]$Path,
  [switch]$Recurse,
  [int]$Tolerance = 0,          # 0 = chỉ đúng #FFFFFF; >0 = cho lệch mỗi kênh R/G/B tối đa từng này.
  [string]$Suffix = "_nobg",    # hậu tố file output (khi không -InPlace).
  [switch]$InPlace              # ghi đè file gốc (backup file .bak).
)

Add-Type -AssemblyName System.Drawing

function Remove-Bg([string]$file) {
  # Đọc file vào RAM trước: FromFile+Clone giữ lock file (kể cả sau Dispose),
  # còn MemoryStream thì không bao giờ lock file gốc.
  $ms = [IO.MemoryStream]::new([IO.File]::ReadAllBytes($file))
  $bmp = [System.Drawing.Bitmap]::FromStream($ms)
  try {
    # Ép về 32bpp ARGB để có kênh alpha.
    if ($bmp.PixelFormat -ne [System.Drawing.Imaging.PixelFormat]::Format32bppArgb) {
      $c = $bmp.Clone(
        [System.Drawing.Rectangle]::FromLTRB(0, 0, $bmp.Width, $bmp.Height),
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $bmp.Dispose()
      $bmp = $c
    }
    # Chỉ xóa trắng #FFFFFF.
    $bg = @{ R = 255; G = 255; B = 255 }
    $code = "#FFFFFF"
    try {

    # LockBits: duyệt bytes BGRA, alpha=0 khi khớp màu trắng.
    $rect = [System.Drawing.Rectangle]::FromLTRB(0, 0, $bmp.Width, $bmp.Height)
    $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $n = $data.Stride * $data.Height
      $buf = New-Object byte[] $n
      [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $n)
      $changed = 0
      for ($i = 0; $i -lt $n; $i += 4) {
        $db = [Math]::Abs($buf[$i] - $bg.B)
        $dg = [Math]::Abs($buf[$i + 1] - $bg.G)
        $dr = [Math]::Abs($buf[$i + 2] - $bg.R)
        if ($dr -le $Tolerance -and $dg -le $Tolerance -and $db -le $Tolerance) {
          $buf[$i + 3] = 0
          $changed++
        }
      }
      [System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $n)
    } finally {
      $bmp.UnlockBits($data)
    }

    if ($InPlace) {
      Copy-Item -LiteralPath $file -Destination ($file + ".bak") -Force
      # GDI+ không save đè đúng path vừa load -> save tạm rồi move đè.
      $tmp = $file + ".tmp.png"
      $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
      [IO.File]::Copy($tmp, $file, $true)
      Remove-Item -LiteralPath $tmp -Force
      $out = $file
    } else {
      $dir = [IO.Path]::GetDirectoryName($file)
      $nm = [IO.Path]::GetFileNameWithoutExtension($file)
      $out = [IO.Path]::Combine($dir, ($nm + $Suffix + ".png"))
      $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    Write-Output ("OK  bg=" + $code + " tol=" + $Tolerance + " transparent=" + $changed +
      "/" + ($bmp.Width * $bmp.Height) + "  -> " + $out)
    } finally {
      $bmp.Dispose()
    }
  } finally {
    $ms.Dispose()
  }
}

$items = @()
if (Test-Path -LiteralPath $Path -PathType Container) {
  $items = Get-ChildItem -LiteralPath $Path -Filter *.png -Recurse:$Recurse |
    ForEach-Object { $_.FullName }
} elseif (Test-Path -LiteralPath $Path -PathType Leaf) {
  $items = @((Resolve-Path -LiteralPath $Path).Path)
} else {
  Write-Error ("Không tìm thấy: " + $Path); exit 1
}
if ($items.Count -eq 0) { Write-Output "Không có file .png nào."; exit 0 }
foreach ($f in $items) { Remove-Bg $f }
