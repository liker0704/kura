# .kura/

This directory is managed by [kura](https://github.com/jayminwest/kura) — a structured expertise layer for coding agents.

## Key Commands

- `kura init`      — Initialize a .kura directory
- `kura add`       — Add a new domain
- `kura record`    — Record an expertise entry
- `kura query`     — Query expertise entries
- `kura prime [domain]` — Output a priming prompt (optionally scoped to one domain)
- `kura search`   — Search records across domains
- `kura status`    — Show domain statistics
- `kura validate`  — Validate all entries against the schema
- `kura prune`     — Remove expired entries

## Structure

- `kura.config.yaml` — Configuration file
- `expertise/`        — JSONL files, one per domain
