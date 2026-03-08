# Semantic Release Configuration

This document explains how semantic-release is configured for this project to automate version management, changelog generation, and releases.

## Overview

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for fully automated version management and package publishing. The release process is triggered automatically when commits are pushed to the `main` or `master` branch.

## Features

- **Automatic Version Determination**: Version numbers (major/minor/patch) are automatically determined based on commit messages
- **Conventional Commits**: Uses the [Conventional Commits](https://www.conventionalcommits.org/) specification
- **Automated Git Tags**: Git tags are created automatically for each release
- **GitHub Releases**: Release notes are automatically published to GitHub
- **Automated CHANGELOG**: `CHANGELOG.md` is automatically generated and updated

## Commit Message Convention

This project follows the **Conventional Commits** specification. Each commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types and Version Impact

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | **Minor** (0.x.0) | `feat: add user authentication` |
| `fix` | Bug fix | **Patch** (0.0.x) | `fix: resolve login timeout issue` |
| `perf` | Performance improvement | **Patch** (0.0.x) | `perf: optimize database queries` |
| `docs` | Documentation changes | **Patch** (0.0.x) | `docs: update API documentation` |
| `style` | Code style changes | **Patch** (0.0.x) | `style: format code with prettier` |
| `refactor` | Code refactoring | **Patch** (0.0.x) | `refactor: simplify auth logic` |
| `test` | Test additions/updates | **Patch** (0.0.x) | `test: add unit tests for API` |
| `build` | Build system changes | **Patch** (0.0.x) | `build: update dependencies` |
| `ci` | CI/CD configuration | **Patch** (0.0.x) | `ci: update GitHub Actions workflow` |
| `chore` | Other changes | **No release** | `chore: update .gitignore` |
| `revert` | Revert previous commit | **Patch** (0.0.x) | `revert: revert "feat: add feature"` |

### Breaking Changes (Major Version)

To trigger a **major** version bump (x.0.0), add `BREAKING CHANGE:` in the commit footer or use `!` after the type:

```bash
# Method 1: Using footer
feat: redesign user API

BREAKING CHANGE: The user API endpoints have been completely redesigned

# Method 2: Using ! indicator
feat!: redesign user API
```

### Commit Message Examples

**Good Examples:**

```bash
# Feature addition (minor version bump)
feat: add dark mode support
feat(ui): implement responsive navigation menu

# Bug fix (patch version bump)
fix: resolve memory leak in image processing
fix(api): correct validation error message

# Breaking change (major version bump)
feat!: migrate to Node.js 20
refactor!: change configuration file format

BREAKING CHANGE: Configuration files must now use YAML format instead of JSON

# Documentation (patch version bump)
docs: add installation instructions
docs(readme): update API usage examples

# No release triggered
chore: update development dependencies
ci: add code coverage reporting
```

**Bad Examples:**

```bash
# ❌ Too vague
Update stuff
Fixed bug

# ❌ No type prefix
Added new feature to the dashboard
Corrected the login form validation

# ❌ Not descriptive
fix: fix
feat: changes
```

## Configuration Files

### `.releaserc.json`

The semantic-release configuration is stored in `.releaserc.json`:

- **Branches**: Releases are triggered on `main` and `master` branches
- **Plugins**:
  - `@semantic-release/commit-analyzer`: Analyzes commits to determine version bump
  - `@semantic-release/release-notes-generator`: Generates release notes
  - `@semantic-release/changelog`: Updates `CHANGELOG.md`
  - `@semantic-release/npm`: Updates `package.json` version
  - `@semantic-release/git`: Commits version and changelog changes
  - `@semantic-release/github`: Creates GitHub releases

### `.github/workflows/release.yml`

The GitHub Actions workflow that runs semantic-release:

- **Trigger**: Automatically runs on push to `main` or `master` branches
- **Steps**:
  1. Checkout code with full git history
  2. Setup Node.js environment
  3. Install dependencies
  4. Verify package integrity
  5. Run tests
  6. Execute semantic-release

## How It Works

### Release Process

1. **Developer** pushes commits to `main` or `master` branch
2. **GitHub Actions** workflow is triggered
3. **semantic-release** analyzes commit messages since the last release
4. **Version** is determined based on commit types
5. **CHANGELOG.md** is updated with release notes
6. **package.json** version is bumped
7. **Git tag** is created (e.g., `v4.4.0`)
8. **GitHub Release** is published with release notes
9. **Changes** are committed back to the repository with `[skip ci]`

### Example Workflow

```bash
# Current version: 4.3.0

# Developer makes commits
git commit -m "fix: resolve API timeout issue"
git commit -m "feat: add export functionality"
git commit -m "docs: update README"

# Push to main branch
git push origin main

# semantic-release automatically:
# - Analyzes commits (1 fix + 1 feat + 1 docs)
# - Determines version bump: MINOR (feat > fix/docs)
# - Bumps version to 4.4.0
# - Updates CHANGELOG.md
# - Creates git tag v4.4.0
# - Publishes GitHub Release with notes
# - Commits changes with "chore(release): 4.4.0 [skip ci]"
```

## Environment Variables

The release workflow requires the following GitHub secrets:

- **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions (no setup needed)
- **`NPM_TOKEN`**: Required if publishing to npm registry (optional for this project)

## Manual Release

While releases are fully automated, you can manually trigger a release:

```bash
# Run semantic-release locally (requires GITHUB_TOKEN)
npx semantic-release --dry-run  # Test without making changes
npx semantic-release            # Perform actual release
```

## Skipping Releases

To prevent a release from being triggered, include `[skip release]` or `[skip ci]` in the commit message:

```bash
git commit -m "chore: update dependencies [skip ci]"
```

## Best Practices

1. **Write Clear Commit Messages**: Use descriptive commit messages following the convention
2. **Atomic Commits**: Make small, focused commits rather than large ones
3. **Review Before Merge**: Review commits in PRs to ensure proper commit message format
4. **Use PR Squash with Conventional Format**: When squashing PRs, use conventional commit format for the squash message
5. **Breaking Changes**: Clearly document breaking changes in commit messages
6. **Test Locally**: Run tests before pushing to ensure CI passes

## Troubleshooting

### Release Not Triggered

- Check if commits follow Conventional Commits format
- Ensure commits are pushed to `main` or `master` branch
- Verify GitHub Actions workflow is enabled
- Check workflow logs in GitHub Actions tab

### Version Not Bumped as Expected

- Review commit messages for correct type prefixes
- Remember: `chore` commits don't trigger releases
- Use `feat` for new features (minor bump)
- Use `fix` for bug fixes (patch bump)
- Add `BREAKING CHANGE` footer for major bumps

### CI Workflow Fails

- Check GitHub Actions logs for specific error
- Ensure all tests pass locally
- Verify dependencies are correctly installed
- Check for permission issues with `GITHUB_TOKEN`

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [semantic-release Documentation](https://semantic-release.gitbook.io/)
- [Commit Message Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)
- [semver (Semantic Versioning)](https://semver.org/)

## Version History

Version history and release notes are available in:
- `CHANGELOG.md` - Generated automatically by semantic-release
- [GitHub Releases](https://github.com/KAN-H/PromptCraft/releases) - Published automatically
