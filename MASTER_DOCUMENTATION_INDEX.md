# 📚 MASTER DOCUMENTATION INDEX
*Complete Infrastructure & Application Documentation Hub*

## 🎯 Quick Navigation

| **Documentation Type** | **Primary File** | **Purpose** | **Audience** |
|------------------------|------------------|-------------|--------------|
| 🚀 **Quick Start** | [QUICK_REFERENCE_COMMANDS.md](./QUICK_REFERENCE_COMMANDS.md) | Daily commands & shortcuts | All Users |
| 🖥️ **Server Management** | [00_MASTER_SERVER_MANAGEMENT_GUIDE.md](./00_MASTER_SERVER_MANAGEMENT_GUIDE.md) | General VPS management | System Admins |
| 🏥 **KITMED Platform** | [01_KITMED_COMPLETE_GUIDE.md](./01_KITMED_COMPLETE_GUIDE.md) | KITMED-specific operations | KITMED Team |
| 🏗️ **Infrastructure** | [CLEAN_INFRASTRUCTURE_DOCS/README.md](./CLEAN_INFRASTRUCTURE_DOCS/README.md) | Complete system architecture | Technical Staff |

---

## 📖 DOCUMENTATION CATEGORIES

### 🚀 **Quick Reference & Operations**

#### **Daily Operations**
- [QUICK_REFERENCE_COMMANDS.md](./QUICK_REFERENCE_COMMANDS.md) - Essential commands for daily use
- [OPERATIONS_MANUAL.md](./OPERATIONS_MANUAL.md) - KITMED operations procedures
- [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md) - Access credentials and accounts

#### **Emergency Procedures**
- [NGINX_DOMAIN_ISOLATION_TROUBLESHOOTING_GUIDE.md](./NGINX_DOMAIN_ISOLATION_TROUBLESHOOTING_GUIDE.md) - Domain bleeding fixes
- [NGINX_DOMAIN_ISOLATION_FIX.md](./NGINX_DOMAIN_ISOLATION_FIX.md) - Technical fix documentation
- [SECURITY_AUDIT_CHECKLIST.md](./SECURITY_AUDIT_CHECKLIST.md) - Security incident response

---

### 🖥️ **Server & Infrastructure Management**

#### **General Server Management**
- [00_MASTER_SERVER_MANAGEMENT_GUIDE.md](./00_MASTER_SERVER_MANAGEMENT_GUIDE.md) - **Complete VPS management guide**
  - Server setup & hardening procedures
  - Application deployment workflows
  - Security management standards
  - Monitoring & maintenance procedures
  - Emergency response protocols

#### **Infrastructure Architecture**
- [CLEAN_INFRASTRUCTURE_DOCS/](./CLEAN_INFRASTRUCTURE_DOCS/)
  - [01_INFRASTRUCTURE/OVERVIEW.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/OVERVIEW.md) - Complete system overview
  - [01_INFRASTRUCTURE/SECURITY.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/SECURITY.md) - Security hardening guide
  - [01_INFRASTRUCTURE/NETWORKING.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/NETWORKING.md) - Network & Docker architecture
  - [01_INFRASTRUCTURE/APPLICATIONS.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/APPLICATIONS.md) - Application ecosystem
  - [01_INFRASTRUCTURE/PERFORMANCE.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/PERFORMANCE.md) - Performance optimization
  - [01_INFRASTRUCTURE/FUTURE_SCALING.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/FUTURE_SCALING.md) - Scaling roadmap

---

### 💾 **Backup & Recovery System**

#### **Enterprise Backup Architecture**
- [CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/](./CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/)
  - [OVERVIEW.md](./CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/OVERVIEW.md) - **3-tier backup strategy**
    - Local + Cloud backup (Backblaze B2)
    - Twice daily automated backups
    - 15-day cloud retention + 3-day local
    - Point-in-time recovery capabilities
  - [OPERATIONS.md](./CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/OPERATIONS.md) - Daily backup operations
  - [RECOVERY.md](./CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/RECOVERY.md) - Disaster recovery procedures
  - [MONITORING.md](./CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/MONITORING.md) - Backup monitoring & alerts

#### **Key Backup Features:**
```
💾 Enterprise Backup System:
├── 🏠 Local: 3-day rolling backups (~900MB daily)
├── ☁️ Cloud: 15-day retention on Backblaze B2 (EU)
├── 🔐 Security: End-to-end encryption
├── ⏰ Schedule: 6 AM + 6 PM automated
├── 📊 Coverage: WordPress sites + databases + SSL + configs
├── 🚨 Monitoring: Grafana dashboards + email alerts
└── ⚡ Recovery: 15min-4hrs depending on scope
```

---

### 🏥 **KITMED Platform Management**

#### **KITMED-Specific Documentation**
- [01_KITMED_COMPLETE_GUIDE.md](./01_KITMED_COMPLETE_GUIDE.md) - **Complete KITMED platform guide**
  - Production status & deployment details
  - Daily operations & maintenance procedures
  - Development workflow & testing
  - API documentation & credentials
  - Emergency procedures & troubleshooting

#### **KITMED Architecture**
```
🏥 KITMED Platform:
├── 🌐 Production: https://kitmed.ma (Docker port 3001)
├── 🧪 Staging: https://staging.kitmed.ma (Docker port 3002)
├── 📱 Tech Stack: Next.js 14 + TypeScript + Prisma + SQLite
├── 🌍 Multi-language: French/Arabic (next-intl)
├── 🔐 Authentication: NextAuth.js with role-based access
├── 👥 User Types: Suppliers, Buyers, Admins
└── 📊 Features: Product management, quote requests, admin dashboard
```

#### **KITMED Operations**
- **Login**: admin@kitmed.ma / admin123
- **Admin Panel**: https://kitmed.ma/admin
- **Maintenance Mode**: Environment variable toggle
- **Database**: SQLite with Prisma ORM
- **File Uploads**: Local filesystem storage

---

### 🛠️ **Development & Deployment**

#### **Development Tools & CI/CD**
- [CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/](./CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/)
  - [OVERVIEW.md](./CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/OVERVIEW.md) - Developer tools overview
  - [GITHUB_CICD.md](./CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/GITHUB_CICD.md) - CI/CD templates & workflows
  - [DEPLOYMENT.md](./CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/DEPLOYMENT.md) - Secure deployment procedures
  - [DOCKER_BEST_PRACTICES.md](./CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/DOCKER_BEST_PRACTICES.md) - **Enterprise Docker containerization guide**
  - [MONITORING.md](./CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/MONITORING.md) - Development monitoring

#### **Deployment Guides**
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - KITMED deployment procedures
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - Docker containerization guide
- [SERVER_ONBOARDING_CHECKLIST.md](./SERVER_ONBOARDING_CHECKLIST.md) - New application deployment checklist

---

### 🔒 **Security & Compliance**

#### **Security Management**
- [SECURITY_AUDIT_CHECKLIST.md](./SECURITY_AUDIT_CHECKLIST.md) - **Comprehensive security audit procedures**
  - Critical security tasks with timelines
  - SSH hardening & firewall configuration
  - SSL/TLS security headers
  - Incident response procedures
  - Security monitoring & alerting

#### **Security Architecture**
```
🔒 Security Implementation:
├── 🚪 SSH: Key-based auth on port 2222 (not default 22)
├── 🛡️ Firewall: UFW with minimal port exposure
├── 🔐 SSL/TLS: Let's Encrypt A+ grade certificates
├── 📦 Containers: Isolated Docker networks
├── 🚨 Monitoring: Fail2Ban + automated alerts
├── 🔄 Updates: Automated security patch management
└── 📊 Compliance: Security audit procedures
```

---

### 📊 **Monitoring & Performance**

#### **System Monitoring**
- **Grafana**: https://grafana.zonemation.cloud
- **n8n Automation**: https://n8n.zonemation.cloud
- **Health Checks**: Automated container & service monitoring
- **Performance**: Response time & resource usage tracking
- **Alerts**: Email notifications for critical issues

#### **Current System Status**
```
📊 Infrastructure Health:
├── 🛒 WordPress Sites: 3 active (airarom.ma, yvesmorel.ma, electroromanos.ma)
├── 🏥 KITMED Platform: Production + Staging environments
├── 🤖 Automation: n8n + aminen8n instances
├── 📈 Monitoring: Grafana dashboards
├── 💾 Backup: 100% success rate (2x daily)
├── 🔒 Security: A+ SSL, hardened infrastructure
└── ⚡ Performance: <2s response times
```

---

## 🎯 **GETTING STARTED GUIDES**

### **For New Team Members**
1. **Read**: [01_KITMED_COMPLETE_GUIDE.md](./01_KITMED_COMPLETE_GUIDE.md) for KITMED platform overview
2. **Access**: Use credentials in [LOGIN_CREDENTIALS.md](./LOGIN_CREDENTIALS.md)
3. **Daily Commands**: Reference [QUICK_REFERENCE_COMMANDS.md](./QUICK_REFERENCE_COMMANDS.md)
4. **Emergency**: Bookmark [NGINX_DOMAIN_ISOLATION_TROUBLESHOOTING_GUIDE.md](./NGINX_DOMAIN_ISOLATION_TROUBLESHOOTING_GUIDE.md)

### **For System Administrators**
1. **Start**: [00_MASTER_SERVER_MANAGEMENT_GUIDE.md](./00_MASTER_SERVER_MANAGEMENT_GUIDE.md) for complete server management
2. **Architecture**: [CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/OVERVIEW.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/OVERVIEW.md)
3. **Security**: [CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/SECURITY.md](./CLEAN_INFRASTRUCTURE_DOCS/01_INFRASTRUCTURE/SECURITY.md)
4. **Backup**: [CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/OVERVIEW.md](./CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/OVERVIEW.md)

### **For Developers**
1. **Development**: [CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/OVERVIEW.md](./CLEAN_INFRASTRUCTURE_DOCS/03_DEVELOPMENT_TOOLS/OVERVIEW.md)
2. **Deployment**: [SERVER_ONBOARDING_CHECKLIST.md](./SERVER_ONBOARDING_CHECKLIST.md)
3. **KITMED Development**: [01_KITMED_COMPLETE_GUIDE.md](./01_KITMED_COMPLETE_GUIDE.md) → Development section
4. **Testing**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## 📞 **EMERGENCY REFERENCE**

### **Quick Emergency Actions**
| **Issue** | **Immediate Action** | **Documentation** |
|-----------|---------------------|-------------------|
| 🚨 **Platform Down** | `docker ps` → `docker restart kitmed-prod` | [01_KITMED_COMPLETE_GUIDE.md](./01_KITMED_COMPLETE_GUIDE.md) |
| 🌐 **Domain Issues** | Check default server block | [NGINX_DOMAIN_ISOLATION_TROUBLESHOOTING_GUIDE.md](./NGINX_DOMAIN_ISOLATION_TROUBLESHOOTING_GUIDE.md) |
| 🔒 **Security Breach** | Follow incident response | [SECURITY_AUDIT_CHECKLIST.md](./SECURITY_AUDIT_CHECKLIST.md) |
| 💾 **Data Loss** | Check backup system | [CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/RECOVERY.md](./CLEAN_INFRASTRUCTURE_DOCS/02_BACKUP_SYSTEM/RECOVERY.md) |
| 🔧 **Server Access** | `ssh vps` (key-based) | [00_MASTER_SERVER_MANAGEMENT_GUIDE.md](./00_MASTER_SERVER_MANAGEMENT_GUIDE.md) |

### **Critical System Information**
```
🖥️ Server: 72.61.107.43 (Hostinger VPS)
🔐 SSH: ssh vps (port 22, key-based)
🌐 Production: https://kitmed.ma
🧪 Staging: https://staging.kitmed.ma
📊 Monitoring: https://grafana.zonemation.cloud
🤖 Automation: https://n8n.zonemation.cloud
💾 Backup: Backblaze B2 (automated 2x daily)
```

---

## 📋 **MAINTENANCE SCHEDULES**

### **Daily Tasks**
- [ ] Check platform status: `curl -I https://kitmed.ma`
- [ ] Verify containers: `docker ps | grep kitmed`
- [ ] Review monitoring: Check Grafana dashboards
- [ ] Backup validation: Automatic with alerts

### **Weekly Tasks**
- [ ] Security audit: Run security checks
- [ ] Performance review: Analyze response times
- [ ] Backup testing: Verify recovery procedures
- [ ] Documentation updates: Keep guides current

### **Monthly Tasks**
- [ ] System updates: `apt update && apt upgrade`
- [ ] SSL certificate check: `certbot certificates`
- [ ] Backup system review: Cost and performance analysis
- [ ] Security compliance: Full audit using checklists

---

## 🏆 **DOCUMENTATION QUALITY STANDARDS**

### **What Makes This Documentation Special**
- ✅ **Complete Coverage**: Every system component documented
- ✅ **Emergency Ready**: Quick-access troubleshooting guides
- ✅ **Enterprise Grade**: Production-ready procedures
- ✅ **Developer Friendly**: Clear setup and deployment guides
- ✅ **Future Proof**: Scaling and integration roadmaps
- ✅ **Backup Protected**: 3-tier backup strategy documented
- ✅ **Security Hardened**: Comprehensive security procedures

### **Maintenance Standards**
- **Updated**: After any infrastructure change
- **Tested**: Procedures verified in staging
- **Accessible**: Clear navigation and quick reference
- **Comprehensive**: Complete procedures, not just overviews

---

**🎯 Your complete infrastructure and application documentation ecosystem is ready for production use, emergency response, and future scaling.**

**Status: ✅ Complete | 🔒 Secure | 📊 Monitored | 🚀 Scalable | 💾 Protected**

---

*📅 Last Updated: November 17, 2025*  
*🔄 Review and update monthly or after major infrastructure changes*