## [Unreleased] — Renamed to kura

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ml delete-domain <domain>` — remove a domain from config and delete its expertise JSONL file; use `--yes` to skip confirmation prompt; `--dry-run` to preview without changes

## [0.6.3] - 2026-02-26

### Added

#### Bulk Delete
- `ml delete <domain> --records <ids>` — delete multiple records by comma-separated IDs in a single operation
- `ml delete <domain> --all-except <ids>` — delete all records except specified IDs (inverse selection)
- `--dry-run` flag for delete command — preview what would be deleted without making changes

#### Output Formatting
- `--format <markdown|compact|ids>` flag for `ml query` and `ml search` — choose output format (`ids` emits one record ID per line, useful for piping)
- `--verbose` promoted to global flag — available on all commands (previously `prime`-only `-v`/`--verbose`)

#### CLI Improvements
- Levenshtein-based typo suggestions for unknown commands (e.g., `ml recrod` → "Did you mean 'record'?")
- Per-type required fields table added to `ml prime` "Recording New Learnings" section
- Package metadata: `keywords`, `engines`, `homepage`, `bugs`, `repository`, and ecosystem footer added to package.json and README

### Changed

- `ml upgrade` uses `getCurrentVersion()` from `version.ts` instead of importing `VERSION` constant — improves testability
- Ecosystem footer added to README (os-eco branding)
- `showSuggestionAfterError(false)` disables Commander's built-in suggestions in favor of custom Levenshtein suggestions

### Fixed

- Biome formatting in timing test (`test/commands/timing.test.ts`)

### Testing

- 763 tests across 38 files, 1763 expect() calls
- New `test/suggestions.test.ts` (Levenshtein typo suggestions: matching, no-match, distance threshold, JSON mode)
- New `test/commands/sync.test.ts` (comprehensive sync command coverage: git init, validate, stage, commit)
- New `test/commands/upgrade.test.ts` (upgrade command: up-to-date, update available, --check, install flow)
- Expanded `test/commands/delete.test.ts` (bulk delete: --records, --all-except, --dry-run, flag combination errors, JSON mode)
- Expanded `test/commands/query.test.ts` (--format compact, --format ids, piping workflows)
- Expanded `test/commands/search.test.ts` (--format compact, --format ids, no-match ids output)
- Expanded `test/commands/prime.test.ts` (required fields table in prime output)

## [0.6.2] - 2026-02-25

### Added

- `kura completions <shell>` command — generates shell completion scripts for bash, zsh, and fish (supports both `kura` and `ml` aliases)
- `--timing` global flag — prints execution time to stderr (`Done in Xms`) for performance profiling
- Prioritize slash command (`.claude/commands/prioritize.md`) for Claude Code

### Changed

- `kura update` deprecated and hidden — prints a warning directing users to `kura upgrade`
- Command parsing switched from `program.parse()` to `program.parseAsync()` for proper async support
- Documentation updated to use `ml` short alias consistently throughout README and CLAUDE.md

### Testing

- 717 tests across 35 files, 1638 expect() calls
- New `test/commands/completions.test.ts` (completions command coverage for bash, zsh, fish, ml alias, hidden commands, error handling)
- New `test/commands/timing.test.ts` (--timing flag output on stderr, stdout isolation, opt-in behavior)
- Updated `test/commands/update.test.ts` for deprecated update command behavior

## [0.6.1] - 2026-02-25

### Added

#### New CLI Commands
- `kura outcome <domain> <id>` command — append outcomes to existing records (`--status success|failure|partial`, `--duration`, `--agent`, `--notes`, `--test-results`), or view existing outcomes when called without `--status`
- `kura upgrade` command — checks npm registry for newer versions and installs via `bun install -g` (`--check` for dry run); replaces the older `update` command approach

#### Developer Experience
- Auto-create domains: `kura record` now auto-creates missing domains instead of erroring, with a branded confirmation message
- Record validation hints: schema validation errors now include type-specific hints (e.g., "Hint: pattern records require: name, description")
- Domain-not-found hints in `query`, `search`, and `prime` commands — suggests `kura add <domain>` when a domain isn't found

#### Health Checks
- `kura doctor` legacy-outcome check — detects records with deprecated singular `outcome` field on disk
- `kura doctor --fix` migrates legacy `outcome` fields to `outcomes[]` array format
- `kura validate` warns (non-error) on records with legacy singular `outcome` field, suggests `kura doctor --fix`

#### Programmatic API
- `appendOutcome()` function exported from `@hana/kura-cli` — programmatic outcome recording with locking
- `OutcomeOptions` and `AppendOutcomeResult` types exported
- Full scoring module exported: `getSuccessCount`, `getFailureCount`, `getTotalApplications`, `getSuccessRate`, `computeConfirmationScore`, `applyConfirmationBoost`, `sortByConfirmationScore`

### Fixed
- ENOENT crash when `kura learn` runs in non-kura projects (now exits gracefully)
- Package name in version check — was using old `kura-cli` instead of `@hana/kura-cli`

### Testing
- 708 tests across 33 files, 1617 expect() calls
- New `test/commands/outcome.test.ts` (outcome command coverage)
- Expanded test suites: record (auto-create, validation hints), doctor (legacy-outcome), validate (legacy warnings), prime/query/search (domain-not-found hints), api (appendOutcome, scoring exports)

## [0.6.0] - 2026-02-24

### Added
- Branding system (`src/utils/palette.ts`) — brand color (brown/soil), accent (amber for IDs), muted (stone gray), status icons, and message formatters (`printSuccess`, `printError`, `printWarning`)
- `--quiet` / `-q` global option to suppress non-error output
- `-v` shorthand for `--version`
- `--version --json` outputs structured JSON (`name`, `version`, `runtime`, `platform`)
- `VERSION` constant exported from `src/cli.ts` for programmatic access
- Custom help screen formatting with branded colors and column layout
- `ml` binary alias for `kura`
- Release slash command (`.claude/commands/release.md`)

### Changed
- **BREAKING**: Package renamed from `kura-cli` to `@hana/kura-cli` (scoped under `@os-eco` npm org)
- **BREAKING**: Switched runtime from Node.js to Bun — `bun` is now required
- All commands updated to use shared palette utilities instead of inline chalk calls
- Replaced vitest with `bun:test` for all 675 tests across 32 files
- Replaced ESLint/Prettier with Biome for linting and formatting
- Source `.ts` files shipped directly (no build step needed)
- All import extensions changed from `.js` to `.ts` (145 in src/, 98 in test/)
- Simplified Ajv imports — Bun handles ESM/CJS interop natively (removed `_Ajv.default ?? _Ajv` shim)
- Simplified `src/utils/version.ts` — uses `import.meta.dir` instead of `fileURLToPath`/`dirname`
- CI workflows (`ci.yml`, `publish.yml`) now use `oven-sh/setup-bun@v2`
- Publish workflow updated for scoped package with provenance signing
- Onboard snippet now includes version marker (`kura-onboard-v:1`) for staleness detection
- Bumped `ajv` from 8.17.1 to 8.18.0

### Fixed
- Test pollution from shallow copy of `DEFAULT_CONFIG.governance` — now deep-cloned

### Removed
- `dist/` build output (Bun runs `.ts` directly)
- `vitest.config.ts` (using `bun:test`)
- `package-lock.json` (using `bun.lock`)
- `.beads/` directory (replaced by `.seeds/` for issue tracking)

### Testing
- 675 tests across 32 files, 1541 expect() calls

## [0.5.0] - 2026-02-20

### Added

#### Programmatic API
- High-level programmatic API (`src/api.ts`) — `recordExpertise()`, `searchExpertise()`, `queryDomain()`, `editRecord()` for use as a library, with full type exports via `src/index.ts`

#### Query Command Enhancements
- `--outcome-status <status>` filter for `kura query` — filter records by outcome status (success/failure)
- `--sort-by-score` flag for `kura query` — sort results by confirmation-frequency score (highest first)

### Changed

- **Breaking**: Migrated `BaseRecord.outcome` (singular `Outcome`) to `outcomes` (array `Outcome[]`) — existing records with `outcome` field should be migrated to `outcomes: [...]`
- Schema, scoring, format, search, query, edit, and record commands all updated for `outcomes[]` array

### Testing

- New `test/api.test.ts` with 26 tests for the programmatic API
- Expanded `test/commands/query.test.ts` from 6 to 31 tests (outcome-status filter, sort-by-score, JSON output mode)
- 671 tests across 32 test files

## [0.4.3] - 2026-02-20

### Added

- Confirmation-frequency scoring module (`src/utils/scoring.ts`) — tracks record application outcomes (success/failure/partial) and computes confirmation scores for prioritization
- Optional `outcome` field on all record types — agents can record whether applying a record's guidance succeeded or failed (`--outcome-status`, `--outcome-duration`, `--outcome-test-results`, `--outcome-agent`)
- `--sort-by-score` flag for `kura search` — orders results by confirmation-frequency score (most-confirmed records first)
- `--classification` filter for `kura search` and `kura query` — filter by foundational/tactical/observational
- `--file` filter for `kura search` and `kura query` — substring match on records with `files[]` field
- `filterByClassification()` and `filterByFile()` utilities in `src/utils/expertise.ts`

### Changed

- `kura prime` budget sorting now uses confirmation score as a third-level sort factor (after type and classification, before recency)
- `DomainRecords.records` widened from `ExpertiseRecord[]` to `ScoredRecord[]` to support outcomes

### Testing

- New `test/utils/scoring.test.ts` with 40 tests for the scoring module
- 625 tests across 31 test files

## [0.4.2] - 2026-02-17

### Fixed

- `compact --auto` now respects domain argument to filter compaction to specific domain
- `compact --analyze` now respects domain argument to filter analysis to specific domain
- `compact --auto --dry-run` shows detailed preview instead of terse summary
- `compact --analyze` output has better formatting with domain grouping and visual hierarchy
- `doctor` command now prints `check.details` for non-pass checks (e.g., governance threshold violations were silently hidden)

### Testing

- Added comprehensive domain filtering tests for compact command
- Added doctor governance threshold violation detection test
- 539 tests across 30 test files

## [0.4.1] - 2026-02-17

### Added

- Quick reference section in compact `kura prime` output — shows essential commands (`search`, `prime --files`, `prime --context`, `record`, `doctor`) so agents have a cheat sheet without switching to `--full` mode

### Testing

- 532 tests across 30 test files

## [0.4.0] - 2026-02-15

### Added

- BM25 search ranking algorithm — `kura search` now returns results ranked by relevance instead of raw order (`src/utils/bm25.ts`)
- `--dry-run` flag for `kura record` — preview what would be created/updated/skipped without writing to JSONL (works with `--batch` and `--stdin`)
- `--batch <file>` flag for `kura record` — read JSON records from a file (more discoverable alternative to `--stdin`)
- Cross-domain record references — `relates_to` and `supersedes` now accept `domain:mx-hash` format (e.g., `api:mx-abc123`) in addition to local `mx-hash`
- Required-fields-per-type table in `kura record --help` output
- Comprehensive tests for `src/index.ts` exports

### Changed

- `kura search` uses BM25 scoring for ranked results instead of simple substring matching
- README: added 'Batch recording' section documenting `--batch` and `--stdin` workflows
- `kura prime` verbose output updated to show `--batch` alongside `--stdin`

## [0.3.1] - 2026-02-15

### Changed

- `kura prime` full/verbose output now documents `kura learn`, `kura sync`, `kura diff`, `kura compact --auto`, `--files`/`--exclude-domain` flags, `--evidence-bead`/`--evidence-commit` evidence linking, and `--stdin` batch recording
- Session close protocol (all formats) streamlined from 4 steps to 3: `kura learn` → `kura record` → `kura sync` (replaces manual `kura validate` + `git add` + `git commit`)
- Onboard snippet (`CLAUDE.md`/`AGENTS.md`) updated with `kura prime --files` tip, evidence linking, and `kura learn`/`kura sync` workflow
- Provider setup recipes (Cursor, Codex, Gemini, Windsurf, Aider) updated with same session-end workflow

## [0.3.0] - 2026-02-13

### Added

- `kura diff` command — shows expertise changes between git refs (`kura diff HEAD~3`, `kura diff main..feature`)
- `--files` flag for `kura prime` — filter records by file paths (`kura prime --files src/utils/config.ts`)
- `--exclude-domain` flag for `kura prime` — exclude specific domains from output
- `--stdin` flag for `kura record` — batch-record from JSON on stdin (single object or array)
- `--evidence-bead` flag for `kura record` — link records to bead issue IDs
- `compact --auto` flag — deterministic auto-compaction that merges groups of same-type records without LLM
- `compact --auto` guardrails — `--min-group <n>`, `--max-records <n>`, and `--dry-run` flags to control compaction aggressiveness
- Health metrics in `status --json` — `governance_utilization`, `stale_count`, `staleness_ratio`, classification breakdowns per domain
- Functional API export (`src/index.ts`) — programmatic access to config, expertise, and schema utilities
- Optional `bead` field on Evidence type for linking records to issue trackers
- CONTRIBUTING.md with fork/branch workflow, ESM conventions, and test guidelines
- SECURITY.md with private vulnerability reporting via GitHub Security Advisories
- PR template and issue templates (bug report, feature request)
- Dependabot config for npm and GitHub Actions dependency updates
- FUNDING.yml for GitHub Sponsors
- README badges (npm version, CI status, license, node version)

### Changed

- `record --stdin` infers record type from JSON input when `--type` is omitted
- `record --stdin` defaults classification to `tactical` when not specified
- Auto-tag git releases in publish workflow on version bump
- Enabled auto-delete of merged PR branches
- Required CI status checks on main branch protection

### Fixed

- `--full` flag being ignored in `prime` command
- `--files` flag referencing undefined variable in `prime` command

### Security

- Hardened against command injection, path traversal, symlink attacks, and temp file races (thanks @burakseyman)

## [0.2.5] - 2026-02-12

### Added

- Session-end reminder section in `kura prime` output — reminds agents to record learnings before completing tasks (all non-MCP formats)
- Token budget for `kura prime` — `--budget <tokens>` (default 4000) caps output size with smart record prioritization (conventions first, then decisions, patterns, guides, failures, references)
- `--no-limit` flag to disable token budget

## [0.2.4] - 2026-02-12

### Added

- Advisory file locking (`withFileLock`) for safe concurrent writes across multiple agents
- Atomic JSONL writes via temp file + rename to prevent partial/corrupt files

### Fixed

- CI workflow now runs `build` before `test` so integration tests find `dist/cli.js`

## [0.2.3] - 2026-02-11

### Added

- `kura update` command — checks npm registry for newer versions and installs them (`--check` for dry run)
- Version check integrated into `kura doctor`
- `kura onboard` now uses `<!-- kura:start -->` / `<!-- kura:end -->` markers for idempotent updates

### Changed

- Record addressing switched from 1-based JSONL line indices to stable `mx-` prefix IDs

## [0.2.2] - 2026-02-11

### Changed

- Standardized on ID-based record addressing (replacing line-index addressing in `edit` and `delete`)

## [0.2.1] - 2026-02-10

### Changed

- Synced all user-facing messaging across onboard snippets, setup recipes, CLAUDE.md, and README
- Agent prompts now ask agents to "review your work for insights" before completing tasks

## [0.2.0] - 2026-02-10

### Added

- `reference` and `guide` record types
- Multi-domain scoping for `kura prime` (variadic args and `--domain` flag)
- `kura search` command with case-insensitive substring matching, `--domain` and `--type` filters
- `kura compact` command with `--analyze` mode for finding compaction candidates
- Record deduplication in `kura record` (upsert named types, skip exact-match unnamed types, `--force` override)
- Optional `tags` field on all record types
- Compact output as default for `kura prime` (`--full` for verbose)
- GitHub Actions CI workflow (lint, build, test)
- GitHub Actions publish workflow (auto-publish to npm on version bump)

### Fixed

- Flaky prune boundary test — `Math.floor` age-in-days so boundary records land on exact whole days

## [0.1.0] - 2026-02-10

### Added

- Initial release
- Core commands: `init`, `add`, `record`, `edit`, `query`, `prime`, `status`, `validate`
- Infrastructure commands: `setup`, `onboard`, `prune`, `doctor`
- JSONL storage in `.kura/expertise/<domain>.jsonl`
- YAML config at `.kura/kura.config.yaml`
- Six record types: `convention`, `pattern`, `failure`, `decision`, `reference`, `guide`
- Three classifications with shelf lives: `foundational` (permanent), `tactical` (14 days), `observational` (30 days)
- Provider setup recipes for Claude, Cursor, Codex, Gemini, Windsurf, and Aider
- Git merge strategy (`merge=union`) for JSONL via `.gitattributes`
- Schema validation with Ajv
- Prime output formats: `xml`, `plain`, `markdown`, `--mcp` (JSON)
- Context-aware prime via `--context` (filters by git changed files)

[Unreleased]: https://github.com/jayminwest/kura/compare/v0.6.3...HEAD
[0.6.3]: https://github.com/jayminwest/kura/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/jayminwest/kura/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/jayminwest/kura/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/jayminwest/kura/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/jayminwest/kura/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/jayminwest/kura/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/jayminwest/kura/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/jayminwest/kura/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jayminwest/kura/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/jayminwest/kura/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/jayminwest/kura/compare/v0.2.5...v0.3.0
[0.2.5]: https://github.com/jayminwest/kura/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/jayminwest/kura/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/jayminwest/kura/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/jayminwest/kura/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/jayminwest/kura/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jayminwest/kura/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jayminwest/kura/releases/tag/v0.1.0
