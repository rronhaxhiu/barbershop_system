import os

class Settings:
    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./barbershop.db")

    # Email
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "test@example.com")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "test-password")
    from_email: str = os.getenv("FROM_EMAIL", "test@example.com")

    # Application
    secret_key: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:8000")

settings = Settings()
