# Deployment Notes

## Branch Management Protocol

### Important Reminder
**NEVER push directly to `main` without explicit confirmation of target branch**

### Standard Workflow
1. Always ask for clarification on target branch when user says "push to staging"
2. Default assumption: `staging` branch exists and should be used for staging deployments
3. `main` branch should only be used for production deployments
4. Create feature branches for development work before merging

### Branch Strategy
- `main` - Production ready code
- `staging` - Staging environment deployments  
- `feature/*` - Development branches
- `hotfix/*` - Emergency fixes

### Deployment Commands
```bash
# For staging
git push origin staging

# For production (main)
git push origin main

# Create staging branch if doesn't exist
git checkout -b staging
git push -u origin staging
```

## Mistake Record
- **2024-11-18**: Pushed directly to `main` when user requested "push to staging"
- **Lesson**: Always verify target branch before pushing