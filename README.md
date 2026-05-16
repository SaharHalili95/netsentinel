# NetSentinel

Production-grade network security monitoring platform with automated device discovery, live traffic capture, real-time alerts, and SOC 2 compliance tracking.

**[Live Demo](https://saharhalili95.github.io/netsentinel/)**

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-async-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## Features

- **Automated Device Discovery** - ARP + nmap scans with MAC address, IP, and vendor info
- **Port Scanning** - Detect open ports per device and flag high-risk services
- **Live Traffic Capture** - Scapy-powered packet capture with inbound/outbound logging per device
- **Anomaly Detection** - Flag suspicious ports, watchlist country connections, and traffic spikes
- **Real-Time Alerts** - WebSocket-powered alert feed with severity levels and full lifecycle: open -> acknowledged -> resolved
- **GeoIP World Map** - Visualize where network connections are originating from or going to
- **Network Topology Graph** - Visual map of device relationships on the network
- **SOC 2 Compliance Module** - Daily automated checks across CC7.1, CC7.2, CC7.3, CC6.1, and A1.1

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Next.js 14, Tailwind CSS |
| Backend | FastAPI (async), Python 3.12 |
| Database | PostgreSQL 16 + SQLAlchemy (async) |
| Cache | Redis |
| Task Queue | APScheduler |
| Real-Time | WebSocket (native FastAPI) |
| Infrastructure | Docker, Docker Compose |
| Network | Scapy, python-nmap, GeoIP2 |
| Testing | pytest |

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Linux or macOS (network scanning requires raw socket access)

### Run with Docker Compose

```bash
git clone https://github.com/SaharHalili95/netsentinel.git
cd netsentinel
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

> Note: Port scanning and ARP discovery require NET_RAW and NET_ADMIN capabilities (root or Docker with cap_add).

## Alert Lifecycle

```
open  ->  acknowledged  ->  resolved
```

Each alert carries a severity level (critical / high / medium / low) and is pushed in real time to all connected clients via WebSocket.

## Anomaly Detection Rules

| Rule | Severity | Description |
|------|----------|-------------|
| Suspicious port | High | Connection to known attack ports (445, 3389, 4444, 31337...) |
| Watchlist country | Medium | Traffic to/from Russia, China, North Korea, Iran |
| Traffic spike | Medium | Device with >1,000 connections in the last hour |

## SOC 2 Compliance Controls

| Control | Category | Description |
|---------|----------|-------------|
| CC6.1 | Logical Access | Access control and authentication checks |
| CC7.1 | System Monitoring | Continuous monitoring of system activity |
| CC7.2 | Anomaly Evaluation | Evaluation of detected anomalies |
| CC7.3 | Incident Response | Incident response readiness and logging |
| A1.1 | Availability | System availability and uptime tracking |

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
