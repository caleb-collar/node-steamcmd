# BLUEPRINT.md

> **Implementation Roadmap for node-steamcmd Modernization**
>
> This document defines the phased approach to update and maintain this repository for publishing to npm.

---

## 🎯 Ultimate Goal

Transform this legacy Node.js wrapper for SteamCMD into a modern, well-tested, automatically maintained npm package that can be imported into other projects.

---

## 📋 Implementation Phases

### Phase 1: Foundation (Critical Path)

**Objective:** Get the package publishable and importable

| Task                                     | Priority | Status  | Notes                                   |
| ---------------------------------------- | -------- | ------- | --------------------------------------- |
| 1.1 Update `package.json` metadata       | HIGH     | ✅ DONE | Name, description, repository, keywords |
| 1.2 Set Node.js engine requirement       | HIGH     | ✅ DONE | `"engines": { "node": ">=18" }`         |
| 1.3 Add repository/bugs/homepage fields  | HIGH     | ✅ DONE | GitHub URLs                             |
| 1.4 Update version to `1.0.0-alpha.1`    | HIGH     | ✅ DONE | Semantic versioning start               |
| 1.5 Create `.npmignore` or `files` field | HIGH     | ✅ DONE | Control published files                 |
| 1.6 Create `LICENSE` file                | HIGH     | ✅ DONE | MIT license text                        |

### Phase 2: Security & Dependencies

**Objective:** Address security issues and update outdated packages

| Task                                      | Priority | Status  | Notes                      |
| ----------------------------------------- | -------- | ------- | -------------------------- |
| 2.1 Switch download URLs to HTTPS         | CRITICAL | ✅ DONE | Security fix               |
| 2.2 Replace `tarball-extract` with `tar`  | HIGH     | ✅ DONE | Maintained package         |
| 2.3 Replace `path-extra` with `env-paths` | HIGH     | ✅ DONE | Modern alternative         |
| 2.4 Update `commander` to v12+            | HIGH     | ✅ DONE | Breaking changes to handle |
| 2.5 Update `unzipper` to latest           | MEDIUM   | ✅ DONE |                            |
| 2.6 Update `standard` to v17+             | MEDIUM   | ✅ DONE | Dev dependency             |

### Phase 3: API Modernization

**Objective:** Support modern JavaScript patterns while maintaining backward compatibility

| Task                                     | Priority | Status  | Notes                      |
| ---------------------------------------- | -------- | ------- | -------------------------- |
| 3.1 Add Promise support to `install()`   | HIGH     | ✅ DONE | Keep callback support      |
| 3.2 Convert internal code to async/await | MEDIUM   | ✅ DONE | Clean up callback hell     |
| 3.3 Add proper error handling            | HIGH     | ✅ DONE | Descriptive error messages |
| 3.4 Add input validation                 | MEDIUM   | ✅ DONE | Validate options           |
| 3.5 Add progress events/callbacks        | LOW      | ✅ DONE | Download/install progress  |

### Phase 4: TypeScript Support

**Objective:** First-class TypeScript experience

| Task                                    | Priority | Status  | Notes                |
| --------------------------------------- | -------- | ------- | -------------------- |
| 4.1 Create `types/steamcmd.d.ts`        | HIGH     | ✅ DONE | Type definitions     |
| 4.2 Add `types` field to package.json   | HIGH     | ✅ DONE |                      |
| 4.3 Consider full TypeScript conversion | LOW      | ⬜ TODO | Future consideration |

### Phase 5: Testing

**Objective:** Comprehensive test coverage

| Task                                       | Priority | Status  | Notes                  |
| ------------------------------------------ | -------- | ------- | ---------------------- |
| 5.1 Set up Vitest testing framework        | HIGH     | ✅ DONE | v8 coverage            |
| 5.2 Write unit tests for `env.js`          | HIGH     | ✅ DONE | 13 tests, 86% coverage |
| 5.3 Write unit tests for `install.js` args | HIGH     | ✅ DONE | 42 tests               |
| 5.4 Write unit tests for `download.js`     | MEDIUM   | ✅ DONE | 14 tests               |
| 5.5 Write integration tests                | MEDIUM   | ✅ DONE | 23 tests               |
| 5.6 Add test coverage reporting            | LOW      | ✅ DONE | v8 coverage provider   |

### Phase 6: CI/CD Pipeline

**Objective:** Automated testing and publishing

| Task                                       | Priority | Status  | Notes                       |
| ------------------------------------------ | -------- | ------- | --------------------------- |
| 6.1 Create `.github/workflows/ci.yml`      | HIGH     | ✅ DONE | Test on push/PR             |
| 6.2 Test on multiple Node versions         | HIGH     | ✅ DONE | 18, 20, 22                  |
| 6.3 Test on multiple OS                    | MEDIUM   | ✅ DONE | Ubuntu, Windows, macOS      |
| 6.4 Create `.github/workflows/publish.yml` | HIGH     | ✅ DONE | Publish on release          |
| 6.5 Set up Dependabot                      | MEDIUM   | ✅ DONE | Auto dependency updates     |
| 6.6 Add branch protection rules            | LOW      | ✅ DONE | Require CI checks on master |

### Phase 7: Documentation

**Objective:** Clear, comprehensive documentation

| Task                                      | Priority | Status  | Notes                   |
| ----------------------------------------- | -------- | ------- | ----------------------- |
| 7.1 Update README.md with modern examples | HIGH     | ✅ DONE | async/await examples    |
| 7.2 Create CHANGELOG.md                   | HIGH     | ✅ DONE | Keep a changelog format |
| 7.3 Add CONTRIBUTING.md                   | LOW      | ✅ DONE | Contribution guidelines |
| 7.4 Add JSDoc comments to source          | MEDIUM   | ✅ DONE | API documentation       |

### Phase 8: Future Enhancements

**Objective:** Extended functionality (post-1.0)

| Task                                  | Priority | Status  | Notes                 |
| ------------------------------------- | -------- | ------- | --------------------- |
| 8.1 Add ESM module support            | MEDIUM   | ⬜ TODO | Dual CJS/ESM          |
| 8.2 Add `getInstalledApps()` function | LOW      | ⬜ TODO | List installed apps   |
| 8.3 Add `update()` function           | LOW      | ⬜ TODO | Update existing       |
| 8.4 Add `validate()` function         | LOW      | ⬜ TODO | Validate installation |
| 8.5 Add event emitter for progress    | LOW      | ⬜ TODO | Real-time progress    |

---

## 🚀 Quick Start Commands

### Initial Setup

```bash
# Clone and install
git clone https://github.com/YOUR_USERNAME/node-steamcmd.git
cd node-steamcmd
npm install

# Run linter
npm run lint

# Test locally
node bin/steamcmd 740 --path ./test-install
```

### Publishing

```bash
# Login to npm
npm login

# Publish (after completing Phase 1)
npm version 1.0.0-alpha.1
npm publish --tag alpha

# Publish stable
npm version 1.0.0
npm publish
```

---

## 📁 Target File Structure

```
node-steamcmd/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── publish.yml
│   └── dependabot.yml
├── .agents-docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── MODERNIZATION.md
├── bin/
│   └── steamcmd
├── src/
│   ├── download.js
│   ├── env.js
│   ├── install.js
│   └── steamcmd.js
├── tests/
│   ├── unit/
│   │   ├── env.test.js
│   │   ├── download.test.js
│   │   └── install.test.js
│   └── integration/
│       └── steamcmd.test.js
├── types/
│   └── steamcmd.d.ts
├── .gitignore
├── .npmignore
├── AGENTS.md
├── BLUEPRINT.md
├── CHANGELOG.md
├── LICENSE
├── package.json
└── README.md
```

---

## ✅ Definition of Done

The package is ready for v1.0.0 release when:

1. ✅ All Phase 1-6 tasks marked complete
2. ✅ CI passes on all supported platforms
3. ✅ Test coverage > 80%
4. ✅ TypeScript definitions work correctly
5. ✅ Can be installed: `npm install steamcmd`
6. ✅ Both CLI and module API work as documented
7. ✅ README has clear, working examples
8. ✅ CHANGELOG documents all changes from original

---

## 🔗 Resources

- [SteamCMD Wiki](https://developer.valvesoftware.com/wiki/SteamCMD)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

## 📝 Agent Instructions

When working on this repository:

1. **Always check this BLUEPRINT first** to understand current priorities
2. **Update task status** as you complete work
3. **Reference `.agents-docs/`** for detailed technical context
4. **Follow the phase order** - earlier phases are prerequisites
5. **Test changes locally** before committing
6. **Update CHANGELOG.md** for user-facing changes

---

_Last updated: 2026-01-31_
