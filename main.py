"""
CardioVision AI — Root Launcher
Automatically runs the FastAPI backend using the project's virtual environment.
"""
import os
import sys
import subprocess

current_dir = os.path.dirname(os.path.abspath(__file__))

if os.path.exists(os.path.join(current_dir, 'Cardiovascular', 'backend')):
    backend_dir = os.path.join(current_dir, 'Cardiovascular', 'backend')
elif os.path.exists(os.path.join(current_dir, 'backend')):
    backend_dir = os.path.join(current_dir, 'backend')
else:
    backend_dir = current_dir

venv_python = os.path.join(backend_dir, 'venv', 'Scripts', 'python.exe')
backend_main = os.path.join(backend_dir, 'main.py')

print("=" * 60)
print("  Starting CardioVision AI Backend Server...")
print(f"  Backend Directory: {backend_dir}")
print("  URL: http://localhost:8000")
print("  API Docs: http://localhost:8000/docs")
print("=" * 60)

python_exe = venv_python if os.path.exists(venv_python) else sys.executable
cmd = [python_exe, backend_main]

try:
    subprocess.run(cmd, cwd=backend_dir, check=True)
except KeyboardInterrupt:
    print("\n[CardioVision AI] Backend server stopped.")
