"""
Legacy seed data script - now handled by init_db.py
This script is kept for backwards compatibility but delegates to init_db
"""
from app.init_db import init_db

def create_sample_data():
    """
    Create sample barbers and services for testing.
    This now delegates to the idempotent init_db function.
    """
    print("Running database initialization (idempotent)...")
    init_db(seed_sample_data=True)
    print("Database initialization complete!")

if __name__ == "__main__":
    create_sample_data()
