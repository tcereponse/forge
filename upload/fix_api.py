import os
from pathlib import Path

# Fix souverain : détection dynamique du dossier UI
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ui_dir = BASE_DIR / "app_ui"

print(f"🔧 Fix API : UI_DIR = {ui_dir}")

if not ui_dir.exists():
    os.makedirs(ui_dir, exist_ok=True)
