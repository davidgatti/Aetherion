# Release Checklist

This document provides a comprehensive checklist for releasing new versions of the Aetherion CPU Monitor VS Code extension.

## Pre-Release Requirements

### Development Standards

- [ ] **All tests must pass**: Run `npm run test` - ensure all 64+ tests pass
- [ ] **Linting must be clean**: Run `npm run lint` - fix all errors, warnings acceptable
- [ ] **Code follows repository standards**: Verify adherence to coding guidelines in `.github/copilot-instructions.md`

### Version Management

- [ ] **Update version in package.json**: Bump version following semantic versioning (major.minor.patch)
- [ ] **Update CHANGELOG.md**: Add comprehensive entry for new version with:
  - 🚀 Major Features
  - 🎨 UI/UX Improvements  
  - 🔧 Technical Improvements
  - 📚 Documentation updates
  - Date in format `[X.Y.Z] - YYYY-MM-DD`

### Documentation

- [ ] **README.md accuracy**: Ensure README reflects current functionality
- [ ] **Feature descriptions match implementation**: Verify all described features work as documented
- [ ] **Update timing/frequency information**: Confirm status bar update intervals, graph refresh rates
- [ ] **Screenshot/example updates**: Update any visual examples if UI changed

## Release Process

### 1. Code Quality Verification

```bash
# Run full test suite
npm run test

# Run linting (fix errors, warnings acceptable)
npm run lint

# Optional: Fix lint warnings
npm run lint:fix
```

### 2. Version and Documentation Updates

- [ ] **Version bump in package.json**
- [ ] **CHANGELOG.md entry added**
- [ ] **README.md updated if needed**
- [ ] **Any new features documented**

### 3. Git Management

```bash
# Commit all changes
git add .
git commit -m "chore: release vX.Y.Z with [brief description]"

# Create release tag
git tag vX.Y.Z

# Push changes and tags
git push origin development
git push origin --tags
```

### 4. Package Building

```bash
# Build extension package
npm run package
```

**Verify**: Check that `aetherion-cpu-monitor-X.Y.Z.vsix` appears in `.releases/` directory

### 5. Local Testing (Recommended)

```bash
# Install locally for testing
code --install-extension .releases/aetherion-cpu-monitor-X.Y.Z.vsix

# Test extension functionality:
# - Status bar displays correctly
# - Panel Area opens with all 6 views
# - Live graphs update properly
# - No console errors in VS Code Developer Tools
```

### 6. Marketplace Publishing

```bash
# Publish to VS Code Marketplace
npm run publish
```

**Verify**: Extension appears in marketplace within 5-10 minutes

## Post-Release Verification

### Marketplace Verification

- [ ] **Extension appears in search**: Search for "Aetherion CPU Monitor" in VS Code marketplace
- [ ] **Correct version number displayed**: Verify marketplace shows new version
- [ ] **Description and screenshots accurate**: Check marketplace listing matches current functionality
- [ ] **Installation works**: Test installing from marketplace on clean VS Code instance

### Functional Testing

- [ ] **Status bar integration**: Braille characters update every 200ms
- [ ] **Panel Area functionality**: All 6 views accessible and working:
  - System Monitor (static info)
  - CPU Live Graph
  - RAM Live Graph  
  - Swap Live Graph
  - Disk Space Live Graph
  - Disk I/O Mirror Graph
  - Network I/O Mirror Graph
- [ ] **Cross-platform compatibility**: Test on macOS, Linux, Windows if possible
- [ ] **Performance**: Extension doesn't significantly impact VS Code responsiveness

### Documentation Updates

- [ ] **GitHub release**: Create GitHub release with changelog content
- [ ] **Release notes**: Ensure release notes match CHANGELOG.md entry
- [ ] **Update any external documentation**: Blog posts, project websites, etc.

## Rollback Procedure

If issues are discovered post-release:

### Immediate Response

1. **Assess severity**: Critical bugs require immediate action
2. **Communication**: Update users via GitHub issues, marketplace reviews
3. **Quick fix vs rollback**: Determine if quick patch or rollback needed

### Rollback Steps

```bash
# Unpublish current version (if critical issue)
vsce unpublish

# Revert to previous version
git revert [commit-hash]
npm version [previous-version]

# Republish previous stable version
npm run package
npm run publish
```

## Release Types

### Patch Release (X.Y.Z)

- Bug fixes
- Documentation updates
- Performance improvements
- No new features

### Minor Release (X.Y.0)

- New features
- UI improvements
- Backward compatible changes
- New monitoring capabilities

### Major Release (X.0.0)

- Breaking changes
- Major architectural changes
- Removal of deprecated features
- Significant UI overhauls

## Emergency Release

For critical security or functionality issues:

1. **Skip non-critical checks**: Focus on fixing the issue
2. **Minimal testing**: Test core functionality only
3. **Clear communication**: Explain urgency in release notes
4. **Follow-up release**: Plan proper testing for next release

## Notes

- **Release frequency**: Aim for stable releases, avoid frequent releases
- **Testing**: More testing for minor/major releases, basic testing for patches
- **Communication**: Keep users informed of significant changes
- **Backup**: Always keep previous working version available for rollback

## Automation Opportunities

Consider automating in the future:

- Automated testing in CI/CD pipeline
- Automatic changelog generation from commits
- Automated marketplace publishing
- Cross-platform testing automation
