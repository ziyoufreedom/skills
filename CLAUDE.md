# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is Anthropic's Agent Skills repository — a collection of example and production skills for Claude. Skills are self-contained folders of instructions, scripts, and resources that Claude loads dynamically to perform specialized tasks. There is no traditional build system, test suite, or package manager.

## Repository Structure

- `skills/` — All skills, each in its own subdirectory (16 total)
  - **Document skills** (proprietary, source-available): `docx/`, `pdf/`, `pptx/`, `xlsx/`
  - **Example skills** (Apache 2.0): `algorithmic-art/`, `brand-guidelines/`, `canvas-design/`, `claude-api/`, `doc-coauthoring/`, `frontend-design/`, `internal-comms/`, `mcp-builder/`, `skill-creator/`, `slack-gif-creator/`, `theme-factory/`, `webapp-testing/`, `web-artifacts-builder/`
- `spec/` — Agent Skills specification (now at agentskills.io/specification)
- `template/` — Minimal SKILL.md template for new skills
- `.claude-plugin/marketplace.json` — Plugin marketplace config with 3 bundles: `document-skills`, `example-skills`, `claude-api`

## Skill Anatomy

Every skill requires a `SKILL.md` with YAML frontmatter:

```yaml
---
name: skill-identifier          # Required: lowercase, hyphens for spaces
description: >                  # Required: what it does + when to trigger
  Detailed description including
  triggering contexts.
license: "Apache 2.0"           # Optional
allowed-tools: [tool1, tool2]   # Optional
---
```

Optional subdirectories: `scripts/`, `references/`, `assets/`, `examples/`

## Key Conventions

- **Progressive disclosure**: Skills load in 3 levels — (1) metadata always in context, (2) SKILL.md body on trigger, (3) bundled resources on demand. Keep SKILL.md under 500 lines.
- **Scripts as black boxes**: Python scripts in `scripts/` should be run with `--help` first, not read wholesale. All use `#!/usr/bin/env python3` shebangs.
- **Description optimization**: Skill descriptions must be "pushy" and include explicit trigger contexts to combat undertriggering. The `skill-creator` skill has tooling for this (`improve_description.py`).
- **Frontmatter validation**: Only these properties are allowed: `name`, `description`, `license`, `allowed-tools`, `metadata`, `compatibility`. Validate with `skill-creator/scripts/quick_validate.py`.

## Skill Validation

```bash
python skills/skill-creator/scripts/quick_validate.py path/to/SKILL.md
```

## Skill Creator Workflow

The `skill-creator` skill contains tooling for developing and evaluating skills:

```bash
python skills/skill-creator/scripts/run_eval.py       # Run evaluations
python skills/skill-creator/scripts/run_loop.py       # Iterative development
python skills/skill-creator/scripts/generate_report.py # Generate eval reports
python skills/skill-creator/scripts/improve_description.py # Optimize triggering
python skills/skill-creator/scripts/package_skill.py   # Package for distribution
```

## Git Conventions

- PR-based workflow with issue numbers in commit messages (e.g., `#547`)
- Commit style: `skill-creator: drop ANTHROPIC_API_KEY requirement (#547)` or `Add claude-api skill (#515)` or `chore: export latest skills (#465)`
