# Contributing Guide

Guidelines for developing, testing, and deploying changes to the CARE platform.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Git Workflow](#git-workflow)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Review Checklist](#code-review-checklist)
- [Deployment Checklist](#deployment-checklist)

---

## Getting Started

### Prerequisites

```bash
# Java 17
java -version
# openjdk version "17.x.x"

# Maven 3.8+
mvn -version
# Apache Maven 3.8.x

# Docker & Docker Compose
docker --version
docker-compose --version

# Node.js 18+ (for web portal)
node --version
npm --version

# Git
git --version
```

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/care-platform.git
cd care-platform

# 2. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start all services
docker-compose up -d

# 4. Verify setup
curl http://localhost:6060/actuator/health

# 5. Start web portal (in separate terminal)
cd web-portal
npm install
npm run dev

# Access at http://localhost:5173
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch first
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-user-management
# Or: bugfix/fix-login-issue
# Or: docs/update-readme

# Branch naming convention:
# feature/<description>   - New feature
# bugfix/<description>    - Bug fix
# docs/<description>      - Documentation
# refactor/<description>  - Code refactoring
# test/<description>      - Testing improvements
```

### 2. Make Changes

```bash
# Make your code changes
vim auth-service/src/main/java/com/care/auth/AuthController.java

# For multiple files
git status
git add file1.java file2.java
```

### 3. Build & Test Locally

#### **Java Services**
```bash
# Build and run tests
cd auth-service/auth-service
mvn clean test

# Build entire service
mvn clean install

# Run service locally
mvn spring-boot:run
```

#### **Web Portal**
```bash
cd web-portal
npm run lint        # Check code style
npm run test        # Run tests
npm run build       # Production build
npm run dev         # Development server
```

### 4. Commit Changes

```bash
# Review changes before committing
git diff

# Stage changes
git add .

# Commit with message (see format below)
git commit -m "feat(auth): add multi-factor authentication support"

# Or interactive commit
git add -A
git commit  # Opens editor
```

### 5. Push & Create PR

```bash
# Push to remote
git push origin feature/add-user-management

# Create PR on GitHub
# Go to: https://github.com/your-org/care-platform/pulls
# Click: New Pull Request
# Set: Base = main, Compare = feature/add-user-management
```

---

## Code Standards

### Java Code Style

#### **Naming Conventions**

```java
// Classes: PascalCase
public class UserManagementService { }

// Methods: camelCase
public void getUserPermissions() { }

// Constants: SNAKE_CASE
public static final int MAX_RETRIES = 3;

// Private fields: camelCase with optional leading underscore
private String userName;
private final UserRepository userRepository;

// Package structure
com.care.accessmanagement.application.service
com.care.accessmanagement.domain.model
com.care.accessmanagement.infrastructure.adapter
```

#### **Formatting**

```java
// Use 4 spaces for indentation
public class UserService {
    public void saveUser(User user) {
        if (user != null) {
            repository.save(user);
        }
    }
}

// Line length: Max 100-120 characters
// Break long lines:
List<User> users = userRepository.findByRoleAndOrganization(
    Role.ADMIN,
    organization,
    Sort.by("createdAt").descending()
);
```

#### **Imports**

```java
// Organized imports:
// 1. java.*
// 2. javax.*
// 3. org.springframework.*
// 4. com.* (your packages)

import java.util.*;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;

import com.care.accessmanagement.domain.model.User;
import com.care.accessmanagement.domain.ports.in.GetUserUseCase;
```

#### **Documentation**

```java
/**
 * Validates user permissions for a given action.
 *
 * @param userId the ID of the user
 * @param action the action to validate
 * @return true if user has permission, false otherwise
 * @throws NotFoundException if user doesn't exist
 */
public boolean validatePermission(UUID userId, String action) {
    // Implementation
}
```

### TypeScript/JavaScript Standards

#### **File Structure**
```typescript
// imports
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// types
interface User {
  id: string;
  name: string;
  email: string;
}

// component
export const UserList: React.FC = () => {
  return <div>{/* JSX */}</div>;
};

// exports
export default UserList;
```

#### **Naming**
```typescript
// Components: PascalCase
export const UserManagement = () => {}

// Functions: camelCase
export const fetchUserData = () => {}

// Constants: UPPER_SNAKE_CASE
export const MAX_FILE_SIZE = 1024 * 1024 * 200;

// Interfaces: PascalCase with I prefix (optional)
interface IUser {
  id: string;
  name: string;
}
```

### Configuration Files

```yaml
# application.yml: Alphabetically organized sections
server:
  port: 6061
  servlet:
    context-path: /auth

spring:
  application:
    name: auth-service
  datasource:
    url: jdbc:postgresql://localhost:5432/cms_db
    username: postgres
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
```

---

## Testing Requirements

### Unit Testing (Java)

```bash
# Run tests for a service
cd auth-service/auth-service
mvn test

# Run specific test
mvn test -Dtest=UserServiceTest

# Run with coverage
mvn test jacoco:report
```

#### **Test Structure**

```java
@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    public void testGetUserById_WhenUserExists_ReturnsUser() {
        // Arrange
        UUID userId = UUID.randomUUID();
        User expectedUser = new User(userId, "John");
        when(userRepository.findById(userId))
            .thenReturn(Optional.of(expectedUser));

        // Act
        Optional<User> result = userService.getUserById(userId);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("John", result.get().getName());
        verify(userRepository, times(1)).findById(userId);
    }

    @Test
    public void testGetUserById_WhenUserNotFound_ThrowsException() {
        // Arrange
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId))
            .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(NotFoundException.class,
            () -> userService.getUserById(userId));
    }
}
```

**Coverage Requirements:**
- ✅ **Minimum 70%** code coverage
- ✅ **100%** coverage for critical paths (auth, permissions)
- ✅ Test both success and failure cases
- ✅ Test edge cases (null, empty, boundary values)

### Integration Testing

```java
@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testGetUser_ReturnsOk() throws Exception {
        // Arrange
        User user = userRepository.save(new User("John", "john@example.com"));

        // Act & Assert
        mockMvc.perform(get("/api/users/" + user.getId())
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John"));
    }
}
```

### Frontend Testing (React)

```bash
# Run tests
cd web-portal
npm test

# Run with coverage
npm test -- --coverage
```

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './UserList';

describe('UserList Component', () => {
  it('should render user list', async () => {
    // Arrange & Act
    render(<UserList />);

    // Assert
    expect(screen.getByText(/Users/i)).toBeInTheDocument();
  });

  it('should handle user selection', async () => {
    // Arrange
    render(<UserList />);
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /Select/i });

    // Act
    await user.click(button);

    // Assert
    expect(screen.getByText(/Selected/i)).toBeInTheDocument();
  });
});
```

### Running Tests Before Commit

```bash
# Backend
mvn clean test

# Frontend
cd web-portal && npm test -- --passWithNoTests

# All together
./scripts/run-all-tests.sh
```

---

## Git Workflow

### Branch Protection Rules

The main branch has protections:
- ❌ Can't push directly to main
- ✅ Must use pull requests
- ✅ Requires code review
- ✅ Requires tests passing
- ✅ Requires status checks

### Keeping Branch Updated

```bash
# Fetch latest main
git fetch origin main

# Rebase your branch on main
git rebase origin/main

# Or merge main into your branch
git merge origin/main

# If conflicts occur, resolve them:
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git rebase --continue  # or git merge --continue
```

### Squashing Commits

```bash
# If you have 3 commits, squash into 1
git rebase -i HEAD~3

# Mark first as 'pick', others as 'squash'
pick 1a2b3c Implement feature
squash 4d5e6f Fix typo
squash 7g8h9i Add documentation

# Result: 1 clean commit with full history in message
```

---

## Commit Message Format

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, or tooling

### Scope

The scope specifies which service/component is affected:
```
auth            - Auth Service
access-mgmt     - Access Management Service
das             - Data Analysis Service
reference-data  - Reference Data Service
gateway         - API Gateway
ui              - Web Portal
api             - API/Controller changes
db              - Database schema changes
```

### Examples

```bash
# Feature
git commit -m "feat(auth): add multi-factor authentication"

# Bug fix with body
git commit -m "fix(access-mgmt): resolve permission cache expiration

Cache was expiring after 30 minutes instead of 900 seconds.
Updated TTL configuration and added refresh logic."

# Documentation
git commit -m "docs(api): update API endpoint documentation"

# Performance improvement
git commit -m "perf(db): add index to user_roles table

Reduced permission query time from 500ms to 50ms."

# Refactoring
git commit -m "refactor(ui): extract UserCard component"

# Breaking change (in footer)
git commit -m "feat(api): redesign permission endpoints

BREAKING CHANGE: /permissions moved to /access/permissions"
```

### Best Practices

- ✅ Use imperative mood ("add feature" not "added feature")
- ✅ Don't end commit message with period
- ✅ Limit subject to 50 characters
- ✅ Wrap body at 72 characters
- ✅ Explain **what** and **why**, not **how**
- ✅ Reference issues: "Fixes #123"

---

## Pull Request Process

### Before Creating PR

```bash
# 1. Ensure all tests pass
mvn clean test
cd web-portal && npm test

# 2. Update documentation if needed
# Add/update relevant .md files

# 3. Sync with main
git fetch origin main
git rebase origin/main

# 4. Force push if rebased
git push origin feature/your-feature --force-with-lease
```

### Creating PR

1. **Give it a descriptive title**
   ```
   ✅ Add user role management
   ❌ Update stuff
   ❌ WIP
   ```

2. **Fill in the template**
   ```markdown
   ## Description
   Add ability for admins to manage user roles in the system.

   ## Related Issue
   Fixes #123

   ## Type of Change
   - [ ] Bug fix
   - [x] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [x] Unit tests added/updated
   - [x] Integration tests added
   - [x] Manual testing completed

   ## Screenshots (if applicable)
   [Add UI changes screenshots]

   ## Checklist
   - [x] Code follows style guidelines
   - [x] Self-review completed
   - [x] Comments added for complex logic
   - [x] No new warnings generated
   - [x] Tests added for new functionality
   - [x] Tests passing locally
   ```

### Code Review

**Reviewers check for:**
- ✅ Code quality and style
- ✅ Test coverage
- ✅ Performance impact
- ✅ Security implications
- ✅ Breaking changes
- ✅ Documentation completeness

**Reviewer comments:**
```
// Good feedback
- This could be simplified using Stream API
+ Consider caching this result as it's called frequently

// Less helpful
- This is bad
+ Why did you do this?
```

### Addressing Feedback

```bash
# Make changes based on feedback
git add .
git commit -m "Address review feedback: simplify user lookup"

# Push changes (don't force on PR with reviews)
git push origin feature/your-feature
```

### Merging

- Use **Squash and merge** for small features
- Use **Rebase and merge** for large features
- Use **Create a merge commit** when merging dependent branches

```bash
# After PR is approved and merged
git checkout main
git pull origin main
git branch -d feature/your-feature
git push origin --delete feature/your-feature
```

---

## Code Review Checklist

Reviewers should verify:

### Functionality
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling present
- [ ] No breaking changes (or documented)

### Code Quality
- [ ] Follows naming conventions
- [ ] Functions are small and focused (< 50 lines)
- [ ] No code duplication
- [ ] Complex logic documented
- [ ] No commented code left behind

### Testing
- [ ] Tests added for new code
- [ ] Tests passing
- [ ] Coverage maintained (> 70%)
- [ ] Tests cover happy path and edge cases

### Security
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] Input validation present
- [ ] SQL injection prevention (use parameterized queries)
- [ ] CORS properly configured
- [ ] Authentication/authorization checks

### Performance
- [ ] No N+1 queries
- [ ] Appropriate indexing
- [ ] Caching used where beneficial
- [ ] No unnecessary network calls

### Documentation
- [ ] Code comments for complex logic
- [ ] JavaDoc for public methods
- [ ] README updated if needed
- [ ] API docs updated
- [ ] Breaking changes documented

---

## Deployment Checklist

Before deploying to production:

- [ ] Code reviewed and approved
- [ ] All tests passing (unit, integration, e2e)
- [ ] Test coverage >= 70%
- [ ] No security vulnerabilities (run security scan)
- [ ] No hardcoded secrets
- [ ] Database migrations work (if applicable)
- [ ] Deployment guide updated
- [ ] Rollback plan documented
- [ ] Monitoring/alerting configured
- [ ] Team notified
- [ ] Changelog updated
- [ ] Version bumped (if applicable)

---

## Common Development Tasks

### Adding a New API Endpoint

```java
// 1. Create DTO
@Data
@AllArgsConstructor
public class CreateUserRequest {
    @NotBlank
    private String username;

    @Email
    private String email;
}

// 2. Create Controller
@RestController
@RequestMapping("/api/users")
public class UserController {

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
}

// 3. Implement Service
@Service
public class UserService {
    public User createUser(CreateUserRequest request) {
        User user = new User(request.getUsername(), request.getEmail());
        return userRepository.save(user);
    }
}

// 4. Write Tests
@Test
public void testCreateUser_WithValidData_ReturnsCreatedUser() {
    CreateUserRequest request = new CreateUserRequest("john", "john@example.com");

    User result = userService.createUser(request);

    assertNotNull(result.getId());
    assertEquals("john", result.getUsername());
}
```

### Adding a New Database Table

```sql
-- 1. Create migration file: src/main/resources/db/migration/V2_1_0__create_audit_log.sql

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    changes JSONB,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);
```

```java
// 2. Create Entity
@Entity
@Table(name = "audit_log")
public class AuditLog {
    @Id
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "action")
    private String action;

    @Column(name = "resource_type")
    private String resourceType;
}

// 3. Create Repository
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByUserId(UUID userId);
}
```

### Updating Frontend Component

```typescript
// 1. Create component file
export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};

// 2. Write tests
describe('UserForm Component', () => {
  it('should submit form data', async () => {
    const onSubmit = jest.fn();
    render(<UserForm initialData={{}} onSubmit={onSubmit} />);

    // Fill form and submit
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalled();
  });
});

// 3. Integrate in parent component
const UserPage = () => {
  const mutation = useMutation({
    mutationFn: (data) => api.createUser(data)
  });

  return (
    <UserForm onSubmit={(data) => mutation.mutate(data)} />
  );
};
```

---

## Questions?

- 📧 Email: team@example.com
- 💬 Slack: #development
- 📖 Documentation: See [README.md](./README.md)
- 🐛 Issues: Open on GitHub

---

**Last updated:** 2025-10-28
