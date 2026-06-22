import shutil
import os
from pathlib import Path

src = Path(r"C:\Eliteqod\apkbuilder\templates")
dst = Path(r"E:\qodmaxv2\apkbuilder\templates")

if src.exists():
    if dst.exists(): shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(f"✅ Templates copies vers {dst}")
else:
    print(f"❌ Source {src} introuvable")
