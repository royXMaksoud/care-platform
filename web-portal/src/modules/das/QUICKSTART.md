# 🚀 DAS Module - Quick Start Guide

## 📋 Prerequisites

1. ✅ Backend service running on port **6072**
2. ✅ Gateway configured to route `/das/*` → `6072`
3. ✅ PostgreSQL database set up
4. ✅ JWT authentication working

---

## ⚡ 5-Minute Quick Start

### Step 1: Start Backend Service
```bash
cd C:\Java\care\Code\data-analysis-service
.\mvnw.cmd spring-boot:run
```

Wait for: `Started DataAnalysisServiceApplication in X seconds`

### Step 2: Start Frontend
```bash
cd C:\Java\care\Code\web-portal
npm run dev
```

Open: `http://localhost:5173`

### Step 3: Login
Use your existing credentials (JWT will be auto-attached)

### Step 4: Navigate to DAS
Click **"Data Analysis Service"** in navigation, or go to: `http://localhost:5173/das`

### Step 5: Upload Your First File
1. Drag a CSV or Excel file to the upload panel
2. Click **"Upload & Register"**
3. Wait for ✅ success status
4. See dataset appear in table below

### Step 6: Explore Dataset
1. Click **👁️ View** on any dataset
2. Browse tabs:
   - **Profile**: See column types and statistics
   - **Charts**: Visualize data distribution
   - **Quality**: Validate data quality
   - **Join**: Merge with other datasets
   - **Pipelines**: Run automated workflows

---

## 🎯 Common Tasks

### Upload a File
```
1. Go to /das
2. Drag file to dropzone
3. Click "Upload & Register"
4. Done! ✅
```

### Explore a Column
```
1. Open dataset details
2. Go to "Profile" tab
3. Click "Explore" on any column
4. Drawer opens with charts & stats
5. Export JSON if needed
```

### Validate Data Quality
```
1. Go to "Quality" tab
2. Click "Add Rule"
3. Configure: column, type, min/max, etc.
4. Click "Validate Dataset"
5. Review violations report
6. Download violations.csv
```

### Join Two Datasets
```
1. Open dataset A
2. Go to "Join" tab
3. Select dataset B
4. Configure join keys
5. Click "Run Join"
6. Navigate to new dataset C
```

### Run a Pipeline
```
1. Go to "Pipelines" tab
2. Select a template
3. Click "Run"
4. View results
5. Navigate to generated datasets
```

---

## 🔧 Configuration

### Gateway Setup (Required)
Ensure your gateway routes DAS requests:

```yaml
# gateway-service/src/main/resources/application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: data-analysis-service
          uri: http://localhost:6072
          predicates:
            - Path=/das/**
```

### Environment Variables
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:6060

# Backend (application.yml or .env)
SERVER_PORT=6072
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/das
JWT_SECRET=YourSecretKeyHere
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution**: Check if data-analysis-service is running on port 6072
```bash
curl http://localhost:6072/actuator/health
```

### Issue: "401 Unauthorized"
**Solution**: Check JWT token in browser DevTools → Application → Storage
```javascript
localStorage.getItem('token') // Should exist
```

### Issue: "Upload fails"
**Solution**: Check file size limit (default 200MB)
```yaml
# Backend application.yml
spring.servlet.multipart.max-file-size: 200MB
```

### Issue: "Charts not rendering"
**Solution**: Check browser console for errors. Verify Recharts is installed:
```bash
npm list recharts
# Should show: recharts@3.2.1
```

### Issue: "Module not appearing in navigation"
**Solution**: 
1. Check `useMyModules` returns DAS system
2. Verify user has permission to access DAS
3. Check `module-routes.jsx` has DAS mapping

---

## 📚 API Examples

### Upload File
```javascript
const formData = new FormData();
formData.append('files', file);

const response = await api.post('/das/api/files/upload', formData);
// Returns: { success: true, data: [{ fileId, ... }] }
```

### Register Dataset
```javascript
const response = await api.post(
  `/das/api/datasets/from-file/${fileId}`,
  { name: 'My Dataset', description: 'Optional' }
);
// Returns: { success: true, data: { datasetId, ... } }
```

### Get Profile
```javascript
const response = await api.get(`/das/api/datasets/${datasetId}/profile`);
// Returns: { success: true, data: { columns: [...], totalRows, totalColumns } }
```

### Validate
```javascript
const rules = [
  { column: 'age', min: 0, max: 120 },
  { column: 'email', regex: '^[A-Za-z0-9+_.-]+@.*$' }
];

const response = await api.post(
  `/das/api/datasets/${datasetId}/validate`,
  rules
);
// Returns: { success: true, data: { totalViolations, ruleResults, ... } }
```

---

## 🎨 Customization

### Change Colors
Edit component files and update TailwindCSS classes:
```tsx
// Current: bg-primary
// Change to: bg-blue-600
```

### Add New Tab
```tsx
// pages/DatasetDetails.tsx
const TABS = [
  // ... existing tabs
  { id: 'myNewTab', label: 'My Tab', icon: MyIcon },
];
```

### Add New Chart Type
```tsx
// components/ChartsPanel.tsx
import { PieChart, Pie } from 'recharts';

// Add conditional rendering based on column type
```

---

## 📖 Further Reading

- [Main README](./README.md) - Full documentation
- [Implementation Status](./IMPLEMENTATION_STATUS.md) - Detailed status
- [Final Summary](./FINAL_SUMMARY.md) - Complete overview
- [Types Reference](./types.ts) - All TypeScript types

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] Backend service starts successfully
- [ ] Gateway routes `/das/*` correctly
- [ ] Can login and see DAS in navigation
- [ ] Can upload CSV file
- [ ] Can upload Excel file
- [ ] Dataset appears in table
- [ ] Can view dataset details
- [ ] All 6 tabs load without errors
- [ ] Charts render correctly
- [ ] Can download dataset
- [ ] Can delete dataset
- [ ] Pagination works
- [ ] Search in ProfileTable works
- [ ] Column drawer opens and shows stats
- [ ] Quality validation works
- [ ] Join creates new dataset
- [ ] Pipeline runs successfully

---

## 🆘 Support

### Common Questions

**Q: Where are uploaded files stored?**  
A: Backend stores them in `storage/` directory as CSV files

**Q: Can I upload files larger than 200MB?**  
A: Yes, update `spring.servlet.multipart.max-file-size` in backend config

**Q: How do I add more pipeline templates?**  
A: Add them in backend `PipelineTemplateService`

**Q: Can I customize column type inference?**  
A: Yes, modify `TypeInferenceService` in backend

**Q: How do I enable SSE for jobs?**  
A: It's already enabled! Just use `isAsync=true` when running pipelines

---

## 🎓 Learning Path

### For New Developers

1. **Read** `types.ts` - Understand data structures
2. **Study** `api/datasets.ts` - See how API calls work
3. **Explore** `hooks/useDatasets.ts` - Learn state management
4. **Review** `components/UploadPanel.tsx` - UI patterns
5. **Build** a new feature using existing patterns

### Key Patterns

- **API Call**: Hook → API Client → Backend
- **State Management**: useState + useEffect
- **Error Handling**: try-catch with user alerts
- **Navigation**: useNavigate from react-router
- **Type Safety**: TypeScript interfaces

---

**Happy Data Analysis! 🎉📊📈**

