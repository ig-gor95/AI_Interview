#!/usr/bin/env python
"""
Script to apply Alembic migrations directly using Python API
Usage: python apply_migration.py
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command

def apply_migration():
    """Apply pending migrations"""
    # Get alembic.ini path
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "alembic.ini"))
    
    print("🔄 Применение миграций...")
    try:
        # Apply all pending migrations
        command.upgrade(alembic_cfg, "head")
        print("✅ Миграции успешно применены!")
        
        # Show current revision
        print("\n📋 Текущая версия базы данных:")
        command.current(alembic_cfg)
        
    except Exception as e:
        print(f"❌ Ошибка при применении миграции: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    apply_migration()
