# SystemRole Implementation - Complete Documentation Index

## 📚 Documentation Overview

This directory contains **comprehensive documentation** for implementing a **Role-Based Access Control (RBAC) system** with hierarchical scoping in the Care Management System.

---

## 🎯 Quick Links

### Start Here First
👉 **[SYSTEMROLE_QUICK_START.md](SYSTEMROLE_QUICK_START.md)** - 10-15 minute overview
- What's completed
- Next steps in order
- Time estimates
- Success criteria

### Reference Architectures
📊 **[SYSTEMROLE_ARCHITECTURE_VISUAL.md](SYSTEMROLE_ARCHITECTURE_VISUAL.md)** - Complete visual guide
- System architecture diagram
- Data flow diagrams
- Database schema relationships
- Component interactions
- State management flows

### Detailed Implementation Plan
💻 **[SYSTEMROLE_IMPLEMENTATION_GUIDE.md](SYSTEMROLE_IMPLEMENTATION_GUIDE.md)** - In-depth guide
- Entity design details
- Architecture patterns
- Integration points
- API examples
- 5-phase roadmap

### Implementation Prompts (Most Important!)
🎯 **[SYSTEMROLE_CURSOR_PROMPTS.md](SYSTEMROLE_CURSOR_PROMPTS.md)** - **USE THIS FOR IMPLEMENTATION**
- **16 detailed cursor prompts** for each implementation file
- Backend prompts (Commands, Queries, Services, Validators, Mappers, Controllers)
- Frontend prompts (API Service, Components, Routing)
- Testing prompts
- **Copy-paste these prompts to your AI assistant for exact implementation**

### Database Migrations
📁 **[V104__Create_SystemRole_Tables.sql](access-management-service/src/main/resources/db/migration/V104__Create_SystemRole_Tables.sql)**
- 5 new tables fully designed
- 23 optimized indexes
- Complete with audit fields
- Ready to run

📁 **[V105__Insert_Sample_SystemRoles.sql](access-management-service/src/main/resources/db/migration/V105__Insert_Sample_SystemRoles.sql)**
- Optional sample data for testing
- Can be skipped in production

### Database Entities (Already Created)
- ✅ [SystemRoleEntity.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/entities/SystemRoleEntity.java)
- ✅ [SystemRoleActionEntity.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/entities/SystemRoleActionEntity.java)
- ✅ [SystemRoleActionScopeEntity.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/entities/SystemRoleActionScopeEntity.java)
- ✅ [UserSystemRoleEntity.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/entities/UserSystemRoleEntity.java)
- ✅ [UserRolePermissionNodeEntity.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/entities/UserRolePermissionNodeEntity.java)

### Repositories (Already Created)
- ✅ [SystemRoleRepository.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/repository/SystemRoleRepository.java)
- ✅ [SystemRoleActionRepository.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/repository/SystemRoleActionRepository.java)
- ✅ [SystemRoleActionScopeRepository.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/repository/SystemRoleActionScopeRepository.java)
- ✅ [UserSystemRoleRepository.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/repository/UserSystemRoleRepository.java)
- ✅ [UserRolePermissionNodeRepository.java](access-management-service/src/main/java/com/care/accessmanagement/infrastructure/db/repository/UserRolePermissionNodeRepository.java)

---

## 📖 How to Use These Documents

### For Project Managers
1. Read **SYSTEMROLE_QUICK_START.md** (5 min)
2. Review timeline: **10-15 days** total implementation
3. Check **Success Criteria** section for validation points

### For Architects
1. Read **SYSTEMROLE_IMPLEMENTATION_GUIDE.md** (15 min)
2. Review **SYSTEMROLE_ARCHITECTURE_VISUAL.md** (10 min)
3. Study database schema in V104 migration
4. Check existing pattern: `access-management-service/application/system/` module

### For Backend Developers
1. Check completed entities and repositories (already done ✅)
2. **Use SYSTEMROLE_CURSOR_PROMPTS.md** - Follow prompts exactly:
   - Prompt 1-2: Commands & Queries
   - Prompt 3: Services
   - Prompt 4-5: Mappers & Validators
   - Prompt 6: Domain Models
   - Prompt 7-8: Controllers
3. Reference the `system` module structure for patterns
4. Follow audit and validation patterns from existing code

### For Frontend Developers
1. **Use SYSTEMROLE_CURSOR_PROMPTS.md** - Follow prompts exactly:
   - Prompt 9: API Service
   - Prompt 10-14: React Components
   - Prompt 15-16: Routing & i18n
2. Use existing components as templates
3. Follow existing styling patterns
4. Ensure RTL support for Arabic

### For DevOps/DBA
1. Review V104 migration for table structure
2. Test migration in dev environment first
3. Verify all 23 indexes created
4. Backup before running in production
5. Monitor query performance

---

## 🔄 Implementation Workflow

```
START
  │
  ├─▶ [Phase 1: Backend Core] (1-2 days)
  │   ├─▶ Domain Model (Prompt 6)
  │   ├─▶ Commands & Queries (Prompts 1-2)
  │   ├─▶ Validators (Prompt 5)
  │   └─▶ Mappers (Prompt 4)
  │
  ├─▶ [Phase 2: Backend Services] (2-3 days)
  │   └─▶ Services (Prompt 3)
  │       ├─ SystemRoleServiceImpl
  │       ├─ RoleActionManagementService
  │       ├─ RolePermissionQueryService
  │       └─ UserRoleAssignmentService
  │
  ├─▶ [Phase 3: Backend API] (1-2 days)
  │   └─▶ Controllers (Prompts 7-8)
  │       ├─ SystemRoleController
  │       ├─ RoleActionController
  │       └─ UserRoleController
  │
  ├─▶ [Phase 4: Frontend API] (1 day)
  │   └─▶ API Service (Prompt 9)
  │       └─ systemRoleService.ts
  │
  ├─▶ [Phase 5: Frontend Components] (3-4 days)
  │   └─▶ React Components (Prompts 10-14)
  │       ├─ SystemRoleList.tsx
  │       ├─ SystemRoleFormModal.tsx
  │       ├─ RoleActionManager.tsx
  │       ├─ UserRoleAssignment.tsx
  │       └─ ScopeOverrideManager.tsx
  │
  ├─▶ [Phase 6: Integration] (2-3 days)
  │   ├─▶ Update Routing (Prompt 15)
  │   ├─▶ Add i18n Messages (Prompt 16)
  │   ├─▶ End-to-end testing
  │   └─▶ Performance optimization
  │
  └─▶ END (10-15 days total)
```

---

## 📊 Architecture at a Glance

### Database Design
```
5 New Tables:
1. system_roles - Reusable role definitions
2. system_role_actions - Map actions to roles
3. system_role_action_scopes - Define scope hierarchy
4. user_system_roles - Assign roles to users
5. user_role_permission_nodes - Scope-specific overrides

Total: 23 indexes, 9 unique constraints, full audit trail
```

### Backend Layers
```
Controllers (3)
    ↓
Services (4 services)
    ↓
Validators (3)
    ↓
Repositories (5)
    ↓
Database (5 tables)
```

### Frontend Structure
```
Components (6)
    ↓
API Service (systemRoleService.ts)
    ↓
Axios + React Query
    ↓
Backend APIs
```

---

## 🎯 Key Features

✅ **Role-Based CRUD Operations**
- Create/Update/Delete roles
- Add/Remove actions from roles
- Define scope hierarchy per action
- Full audit trail

✅ **User Role Assignment**
- Assign multiple roles to users
- Support multi-tenant scenarios
- Time-limited role assignments (optional expiration)
- Scope-specific permission overrides

✅ **Hierarchical Scoping**
- Different actions have different scope structures
- Example: Approve scoped by Country → City → Branch
- Example: View scoped by Country → Region only
- Fine-grained control at any hierarchy level

✅ **Backward Compatibility**
- Works alongside existing UserActionPermission
- Gradual migration path
- No breaking changes to existing code
- DENY overrides ALLOW (secure by default)

✅ **Security & Compliance**
- Complete audit trail with @Audited annotation
- Tenant-aware (multi-tenant isolation)
- Soft delete support
- Optimistic locking (rowVersion)
- Comprehensive validation

---

## 🔍 Module Structure Reference

The SystemRole module follows the exact pattern of the existing `system` module:

```
access-management-service/src/main/java/.../application/
├── system/                          (Existing - Use as Reference)
│   ├── command/
│   ├── query/
│   ├── service/
│   ├── mapper/
│   └── validation/
│
└── system_role/                     (To Create - Follow Same Pattern)
    ├── command/                     (Prompt 1)
    ├── query/                       (Prompt 2)
    ├── service/                     (Prompt 3)
    ├── mapper/                      (Prompt 4)
    └── validation/                  (Prompt 5)
```

---

## 💡 Common Questions

### Q: Where do I start?
**A**: Read SYSTEMROLE_QUICK_START.md, then follow the cursor prompts in order.

### Q: Can I skip creating the database migrations?
**A**: No, migrations are critical. Run V104 and V105 first.

### Q: Do I need to change existing code?
**A**: Minimal changes. Only update PermissionQueryService to check roles first, then fall back to direct permissions.

### Q: How do I test this?
**A**: Unit tests for services, integration tests for repositories, API tests for controllers, component tests for React.

### Q: What about performance?
**A**: 23 indexes optimize query performance. Monitor permission check queries in production.

### Q: Is this production-ready?
**A**: Yes, after proper testing. Architecture follows enterprise patterns.

---

## ✅ Completion Checklist

### Before Starting Implementation
- [ ] Read SYSTEMROLE_QUICK_START.md
- [ ] Review SYSTEMROLE_ARCHITECTURE_VISUAL.md
- [ ] Examine existing `system` module structure
- [ ] Run V104 and V105 migrations in dev
- [ ] Verify 5 tables created with correct schema

### During Implementation
- [ ] Follow each cursor prompt in order
- [ ] Reference existing patterns from `system` module
- [ ] Run unit tests after each component
- [ ] Commit frequently with descriptive messages

### Before Deployment
- [ ] All 20 backend files created and tested
- [ ] All 10 frontend files created and tested
- [ ] End-to-end tests pass
- [ ] API documentation generated
- [ ] i18n messages for both English and Arabic
- [ ] RTL layout tested for Arabic
- [ ] Performance tests pass
- [ ] Security review completed

---

## 📚 Additional Resources

### Existing Code References
- **System Module**: `access-management-service/.../application/system/`
- **User Action Permission**: `access-management-service/.../user_action_permission/`
- **Code Tables**: `access-management-service/.../code/`
- **Web Portal**: `web-portal/src/modules/cms/`

### Spring Boot & Spring Security
- CrudApplicationService pattern
- MapStruct for mapping
- Lombok for boilerplate
- @Audited annotation
- CurrentUserContext
- @Transactional for transactions

### React & Frontend
- Ant Design components
- TanStack Query (React Query)
- Axios for HTTP
- i18next for internationalization
- TypeScript for type safety

---

## 🎓 Learning Path

1. **Day 1**: Read documentation, understand architecture
2. **Day 2-3**: Create backend domain layer (commands, queries, domain models)
3. **Day 4-5**: Create validators, mappers, services
4. **Day 6-7**: Create REST controllers
5. **Day 8**: Create frontend API service
6. **Day 9-12**: Create React components
7. **Day 13-15**: Integration testing, optimization, deployment

---

## 📞 Support & Questions

When stuck:
1. Check the relevant cursor prompt in SYSTEMROLE_CURSOR_PROMPTS.md
2. Review the architecture diagram
3. Look at existing patterns in `system` module
4. Check SYSTEMROLE_IMPLEMENTATION_GUIDE.md for design rationale
5. Review error messages and validation requirements

---

## 🎉 Success Indicators

You'll know you're done when:
- ✅ Can create, edit, delete system roles
- ✅ Can add/remove actions from roles
- ✅ Can define scope hierarchies for actions
- ✅ Can assign roles to users
- ✅ Can set scope overrides for users
- ✅ Permission checks work correctly
- ✅ All tests pass
- ✅ API documentation complete
- ✅ UI works in English and Arabic
- ✅ RTL layout correct for Arabic

---

## 📝 Version Information

- **Created**: 2025-11-04
- **Status**: Phase 1 Complete, Ready for Phase 2-5 Implementation
- **Architecture**: Clean Architecture + CQRS Pattern
- **Framework**: Spring Boot 3.x + React 19.x
- **Database**: PostgreSQL 14+
- **Estimated Duration**: 10-15 days
- **Complexity**: Medium-High

---

## 🚀 Ready to Start?

1. **Read**: SYSTEMROLE_QUICK_START.md (5 min)
2. **Review**: SYSTEMROLE_ARCHITECTURE_VISUAL.md (10 min)
3. **Start Implementing**: Use SYSTEMROLE_CURSOR_PROMPTS.md
4. **Reference**: SYSTEMROLE_IMPLEMENTATION_GUIDE.md for design decisions

**Happy coding! 🎯**

---

**Last Updated**: 2025-11-04
**Maintainer**: Care Management System Team
