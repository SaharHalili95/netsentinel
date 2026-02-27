from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://netsentinel:netsentinel_secret@localhost:5432/netsentinel"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # App
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    secret_key: str = "change-me-in-production"
    cors_origins: str = "http://localhost:3000"

    # Scanning
    scan_network: str = "192.168.1.0/24"
    discovery_interval_minutes: int = 5
    port_scan_interval_minutes: int = 60
    traffic_capture_enabled: bool = True

    # GeoIP
    geoip_db_path: str = "./data/GeoLite2-City.mmdb"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
