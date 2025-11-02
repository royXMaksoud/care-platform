# 📚 Help & Documentation Center | مركز المساعدة والتوثيق

Welcome to the Care Management System documentation hub. All project documentation and helper scripts are organized here.

---

## 📖 Quick Links | روابط سريعة

### 🚀 Getting Started
- **[How to Start Services](docs/README_START_SERVICES.md)** - Complete guide to running all services
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### 📋 Documentation
- **[Service Runbook](docs/SERVICE_RUNBOOK.md)** - Service operations manual
- **[Service Communication](docs/SERVICE_COMMUNICATION.md)** - Inter-service communication patterns
- **[Documentation Summary](docs/DOCUMENTATION_SUMMARY.md)** - Overview of all documentation
- **[Contributing Guide](docs/CONTRIBUTING.md)** - How to contribute to the project

### 🔧 Scripts
- **[Environment Setup](scripts/set-env.ps1)** - Configure environment variables
- **[Legacy Start Script](scripts/START_ALL_SERVICES.ps1)** - Old startup script (deprecated)

---

## 🗂️ Folder Structure | هيكل المجلدات

```
help/
├── README.md                          # This file - Documentation index
├── docs/                              # All documentation files
│   ├── README_START_SERVICES.md      # 🚀 Service startup guide
│   ├── SERVICE_RUNBOOK.md            # 📋 Operations manual
│   ├── DEPLOYMENT_GUIDE.md           # 🚢 Deployment guide
│   ├── TROUBLESHOOTING.md            # 🔧 Problem solving
│   ├── SERVICE_COMMUNICATION.md      # 🔗 Service integration
│   ├── DOCUMENTATION_SUMMARY.md      # 📚 Docs overview
│   └── CONTRIBUTING.md               # 👥 Contribution guide
└── scripts/                           # Helper PowerShell scripts
    ├── set-env.ps1                   # Environment setup
    └── START_ALL_SERVICES.ps1        # Legacy startup (old)
```

---

## 🚀 Quick Start Scripts (Root Directory)

These essential scripts are kept in the root directory for quick access:

### Main Scripts
```powershell
# In C:\Java\care\Code\

.\QUICK_START.ps1    # ⚡ Fast startup (recommended for development)
.\START_ALL.ps1      # 🏗️ Full microservices startup
.\STOP_ALL.ps1       # ❌ Stop all services
```

---

## 📖 Documentation Overview | نظرة عامة على التوثيق

### 1. [📘 README_START_SERVICES.md](docs/README_START_SERVICES.md)
**Complete guide for running services**
- ✅ Correct Maven commands
- 🎯 Three startup methods (Quick/Full/Manual)
- 🔍 Health checks
- 🐛 Troubleshooting common issues
- 📊 Port mapping

**Topics Covered:**
- How to run Spring Boot services
- Quick start vs full startup
- Service dependencies
- Port conflicts resolution

---

### 2. [📙 SERVICE_RUNBOOK.md](docs/SERVICE_RUNBOOK.md)
**Operations manual for all services**
- Service architecture overview
- Endpoint documentation
- Monitoring and health checks
- Operational procedures

**Use Cases:**
- Daily operations
- Service monitoring
- API reference
- Performance tuning

---

### 3. [📕 DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
**Production deployment instructions**
- Environment setup
- Docker deployment
- Kubernetes configuration
- Production best practices

**Environments:**
- Development
- Staging
- Production
- Docker/K8s

---

### 4. [📗 TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
**Common problems and solutions**
- Database connection issues
- Port conflicts
- Service startup failures
- Performance problems

**Problem Categories:**
- ❌ Startup errors
- 🗄️ Database issues
- 🌐 Network problems
- ⚡ Performance issues

---

### 5. [📓 SERVICE_COMMUNICATION.md](docs/SERVICE_COMMUNICATION.md)
**Inter-service communication patterns**
- REST API integration
- Resilience4j patterns
- Circuit breakers
- Service discovery

**Topics:**
- Synchronous communication
- Async messaging
- Error handling
- Retry strategies

---

### 6. [📔 DOCUMENTATION_SUMMARY.md](docs/DOCUMENTATION_SUMMARY.md)
**High-level documentation overview**
- Project structure
- Key components
- Architecture decisions
- Documentation index

---

### 7. [📒 CONTRIBUTING.md](docs/CONTRIBUTING.md)
**Contribution guidelines**
- Code standards
- Git workflow
- Pull request process
- Testing requirements

---

## 🔧 Available Scripts | السكربتات المتاحة

### Root Directory Scripts (Main)

#### ⚡ QUICK_START.ps1
**Fast development startup (Recommended)**
```powershell
.\QUICK_START.ps1
```
- Starts essential services only
- No Config Server or Eureka
- ~1 minute startup time
- Best for daily development

#### 🏗️ START_ALL.ps1
**Full microservices startup**
```powershell
.\START_ALL.ps1
```
- Starts all services including infrastructure
- Includes Config Server & Eureka
- ~2-3 minutes startup time
- Best for testing full architecture

#### ❌ STOP_ALL.ps1
**Stop all services**
```powershell
.\STOP_ALL.ps1
```
- Stops all Java services
- Stops React frontend
- Cleans up Maven processes
- Verifies ports are free

---

### Helper Scripts (help/scripts/)

#### ⚙️ set-env.ps1
**Environment variable setup**
```powershell
.\help\scripts\set-env.ps1
```
- Sets up database credentials
- Configures JWT secrets
- Sets service URLs

#### 🔄 START_ALL_SERVICES.ps1 (Deprecated)
**Legacy startup script**
- Old version, replaced by START_ALL.ps1
- Kept for reference only

---

## 🎯 Common Tasks | المهام الشائعة

### Starting the System
```powershell
# For daily development (fastest)
.\QUICK_START.ps1

# For full system testing
.\START_ALL.ps1
```

### Stopping Everything
```powershell
.\STOP_ALL.ps1
```

### Checking Service Health
```powershell
# Gateway
curl http://localhost:6060/actuator/health

# Auth Service
curl http://localhost:6061/actuator/health

# Access Management
curl http://localhost:6062/actuator/health
```

### Viewing Logs
Each service opens in its own PowerShell window - check the window for live logs.

---

## 📊 Service Ports | منافذ الخدمات

| Service | Port | Health Check |
|---------|------|--------------|
| 🌐 Frontend | 5173 | http://localhost:5173 |
| 🚪 Gateway | 6060 | http://localhost:6060/actuator/health |
| 🔐 Auth | 6061 | http://localhost:6061/actuator/health |
| 👥 Access Mgmt | 6062 | http://localhost:6062/actuator/health |
| 📚 Reference Data | 6063 | http://localhost:6063/management/health |
| 📡 Eureka | 8761 | http://localhost:8761 |
| 🔧 Config Server | 8888 | http://localhost:8888/actuator/health |
| 🗄️ PostgreSQL | 5432 | localhost:5432 |

---

## 🐛 Need Help? | تحتاج مساعدة؟

1. **Check [Troubleshooting Guide](docs/TROUBLESHOOTING.md)** for common issues
2. **Review [Service Startup Guide](docs/README_START_SERVICES.md)** for setup help
3. **Consult [Service Runbook](docs/SERVICE_RUNBOOK.md)** for operations
4. **Read [Contributing Guide](docs/CONTRIBUTING.md)** before making changes

---

## 📝 Documentation Standards

All documentation follows these standards:
- ✅ Bilingual (English / Arabic)
- ✅ Clear examples and code snippets
- ✅ Troubleshooting sections
- ✅ Visual diagrams where helpful
- ✅ Up-to-date with latest changes

---

## 🔄 Last Updated

This documentation index was last updated: **October 28, 2025**

For the latest updates, always check the individual documentation files.

---

**Ready to start? Run `.\QUICK_START.ps1` from the root directory! 🚀**
