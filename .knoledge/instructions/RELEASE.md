# Release Process

## 🎯 Overview

Complete workflow for releasing VS Code extension updates to the marketplace, from development through production deployment.

## 📋 Pre-Release Checklist

### 1. Code Quality Validation

```bash
# Run comprehensive linting suite
npm run lint

# Execute full test suite
npm test

# Check for security vulnerabilities
npm audit
```

### 2. Git Status Verification

```bash
# Ensure clean working tree
git status

# Verify current branch
git branch --show-current
```

## 🔄 Release Workflow

### Phase 1: Development Branch Preparation

1. **Ensure on development branch:**

   ```bash
   git checkout development
   git pull origin development
   ```

2. **Version bump in package.json:**
   - Update `version` field following semantic versioning
   - Example: `1.1.0` → `1.2.0` for feature additions
   - Example: `1.1.0` → `1.1.1` for bug fixes

3. **Update CHANGELOG.md:**
   - Add new version section
   - Document user-facing changes
   - Use clear, non-technical language
   - Focus on benefits and fixes

4. **Commit version changes:**

   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to X.Y.Z"
   ```

### Phase 2: Git Release Management

1. **Create annotated release tag:**

   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z: Brief description"
   ```

2. **Push development with tags:**

   ```bash
   git push origin development --tags
   ```

3. **Switch to production branch:**

   ```bash
   git checkout production
   git pull origin production
   ```

4. **Merge development into production:**

   ```bash
   git merge development
   ```

5. **Push production branch:**

   ```bash
   git push origin production
   ```

### Phase 3: Marketplace Publishing

1. **Verify vsce installation:**

   ```bash
   npm list -g vsce || npm install -g vsce
   ```

2. **Login to publisher account:**

   ```bash
   vsce login [publisher-name]
   ```

   > **Note:** Requires Personal Access Token from VS Code marketplace

3. **Publish to marketplace:**

   ```bash
   vsce publish
   ```

## 🔍 Post-Release Verification

### 1. Git Repository Cleanup

```bash
# Verify all branches synchronized
git log --oneline --graph --all -10

# Confirm tags pushed
git tag -l
```
