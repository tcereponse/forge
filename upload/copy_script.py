import shutil
from pathlib import Path

src = Path("e:/qodmaxv2/apkbuilder/BUILD_QODMAX_SOUVERAIN.bat")
dest = Path("e:/qodmaxv2/apkbuilder/BUILD_qodmax_G8.bat")

if src.exists():
    shutil.copy2(src, dest)
    print(f"✅ Fichier copié vers {dest}")
else:
    print("❌ Source introuvable")
