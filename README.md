# NetSentinel

A full-stack network monitoring and intrusion detection platform. Scans your local network, detects suspicious activity in real time, and provides a SOC 2-aligned compliance dashboard.

## Features

- **Device Discovery** - ARP scan to find all devices on the network with MAC, IP, and vendor info
- **Port Scanning** - Detect open ports per device and flag high-risk services
- **Traffic Analysis** - Log and visualize inbound/outbound traffic per device
- **Anomaly Detection** - Automatically flag suspicious ports, watchlist country connections, and traffic spikes
- **Real-Time Alerts** - WebSocket-powered live alert feed with severity levels (critical / high / medium / low)
- **Network Topology Graph** - Visual map of device relationships on the network
- **SOC 2 Compliance Module** - Daily automated checks for access control, encryption, logging, and incident response
- **Device Detail Panel** - Slide-over panel with per-device traffic history and open ports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Next.js, Tailwind CSS |
| Backend | FastAPI (async), Python 3.12 |
| Database | PostgreSQL 16 + SQLAlchemy (async) |
| Task Queue | APScheduler |
| Real-Time | WebSocket (native FastAPI) |
| Infrastructure | Docker, Docker Compose |
| Network | Scapy, python-nmap, GeoIP2 |
| Migrations | Alembic |

## Architecture

```
┌──────────────────┐   WebSocket/REST   ┌──────────────────────────────┐
│   Next.js Frontend│ ◀────────────────▶ │       FastAPI Backend         │
│                  │                    │                              │
│  Dashboard       │                    │  /devices  - device registry │
│  Network Map     │                    │  /scans    - discovery scans  │
│  Alerts Feed     │                    │  /alerts   - alert management │
│  Device Detail   │                    │  /ws       - real-time feed   │
│  SOC2 Compliance │                    │  /compliance - SOC2 checks    │
└──────────────────┘                    └──────────┬───────────────────┘
                                                   │
                              ┌────────────────────┴──────────────────┐
                              │           PostgreSQL                   │
                              │  devices / scans / alerts /            │
                              │  traffic_logs / soc2_checks            │
                              └───────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Linux or macOS (network scanning requires raw socket access)

### Run with Docker Compose

```bash
git clone https://github.com/SaharHalili95/netsentinel.git
cd netsentinel
cp .env.example .env   # edit DB_PASSWORD and other vars
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

> Note: Port scanning and ARP discovery require `NET_RAW` and `NET_ADMIN` capabilities (root or Docker with `cap_add`).

## Anomaly Detection Rules

The anomaly detector (`services/anomaly_detector.py`) runs on a schedule and checks for:

| Rule | Severity | Description |
|------|----------|-------------|
| Suspicious port | High | Connection to known attack ports (445, 3389, 4444, 31337…) |
| Watchlist country | Medium | Traffic to/from Russia, China, North Korea, Iran |
| Traffic spike | Medium | Device with >1,000 connections in the last hour |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Stats, recent alerts, device summary |
| GET | `/api/devices` | All discovered devices |
| POST | `/api/scans` | Trigger a new discovery scan |
| GET | `/api/alerts` | List alerts (filterable by severity/status) |
| PATCH | `/api/alerts/{id}/acknowledge` | Acknowledge an alert |
| PATCH | `/api/alerts/{id}/resolve` | Resolve an alert |
| GET | `/api/compliance/status` | SOC 2 daily check status |
| WS | `/api/ws/alerts` | Real-time alert stream |

## Running Tests

```bash
cd backend
pytest tests/ -v
```

## License

MIT
