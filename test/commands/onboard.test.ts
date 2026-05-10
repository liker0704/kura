import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VERSION_MARKER, runOnboard } from "../../src/commands/onboard.ts";
import { MARKER_END, MARKER_START } from "../../src/utils/markers.ts";

describe("onboard command", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "kura-onboard-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Basic creation ────────────────────────────────────────

  it("creates AGENTS.md by default when no agent file exists", async () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    try {
      await runOnboard({ cwd: tmpDir });

      expect(existsSync(join(tmpDir, "AGENTS.md"))).toBe(true);
      const content = await readFile(join(tmpDir, "AGENTS.md"), "utf-8");
      expect(content).toContain("## Project Expertise (Kura)");
      expect(content).toContain("kura prime");
      expect(content).toContain("kura record");
      expect(content).toContain("kura status");
      expect(content).toContain(MARKER_START);
      expect(content).toContain(MARKER_END);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("writes to CLAUDE.md if it already exists", async () => {
    await writeFile(join(tmpDir, "CLAUDE.md"), "# Existing content\n", "utf-8");
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    try {
      await runOnboard({ cwd: tmpDir });

      expect(existsSync(join(tmpDir, "CLAUDE.md"))).toBe(true);
      expect(existsSync(join(tmpDir, "AGENTS.md"))).toBe(false);

      const content = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
      expect(content).toContain("# Existing content");
      expect(content).toContain("## Project Expertise (Kura)");
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("appends to existing file without overwriting", async () => {
    const existingContent = "# My Project\n\nSome important info.\n";
    await writeFile(join(tmpDir, "AGENTS.md"), existingContent, "utf-8");
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    try {
      await runOnboard({ cwd: tmpDir });

      const content = await readFile(join(tmpDir, "AGENTS.md"), "utf-8");
      expect(content).toContain("# My Project");
      expect(content).toContain("Some important info.");
      expect(content).toContain("## Project Expertise (Kura)");
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("does not duplicate snippet if already present", async () => {
    const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
    try {
      // Run onboard twice
      await runOnboard({ cwd: tmpDir });
      await runOnboard({ cwd: tmpDir });

      const content = await readFile(join(tmpDir, "AGENTS.md"), "utf-8");
      const matches = content.match(/## Project Expertise \(Kura\)/g);
      expect(matches).toHaveLength(1);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  // ── Stdout mode ───────────────────────────────────────────

  it("prints to stdout with --stdout flag", async () => {
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      await runOnboard({ stdout: true, cwd: tmpDir });

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining("## Project Expertise (Kura)"),
      );
      expect(existsSync(join(tmpDir, "AGENTS.md"))).toBe(false);
      expect(existsSync(join(tmpDir, "CLAUDE.md"))).toBe(false);
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("stdout output includes markers", async () => {
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      await runOnboard({ stdout: true, cwd: tmpDir });

      const output = (stdoutSpy.mock.calls[0] as string[])[0];
      expect(output).toContain(MARKER_START);
      expect(output).toContain(MARKER_END);
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  // ── Provider snippets ─────────────────────────────────────

  it("generates claude-specific snippet with --provider claude", async () => {
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      await runOnboard({ stdout: true, provider: "claude", cwd: tmpDir });

      const output = (stdoutSpy.mock.calls[0] as string[])[0];
      expect(output).toContain("At the start of every session");
      expect(output).toContain("kura prime");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("uses default snippet for unknown provider", async () => {
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      await runOnboard({
        stdout: true,
        provider: "unknown-provider",
        cwd: tmpDir,
      });

      const output = (stdoutSpy.mock.calls[0] as string[])[0];
      expect(output).toContain("At the start of every session");
      expect(output).toContain("kura prime");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  // ── Snippet content ───────────────────────────────────────

  it("snippet includes before-you-finish checklist", async () => {
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      await runOnboard({ stdout: true, cwd: tmpDir });

      const output = (stdoutSpy.mock.calls[0] as string[])[0];
      expect(output).toContain("Before You Finish");
      expect(output).toContain("kura learn");
      expect(output).toContain("kura sync");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("claude snippet includes before-you-finish checklist", async () => {
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      await runOnboard({ stdout: true, provider: "claude", cwd: tmpDir });

      const output = (stdoutSpy.mock.calls[0] as string[])[0];
      expect(output).toContain("Before You Finish");
      expect(output).toContain("kura learn");
      expect(output).toContain("kura sync");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  it("snippet contains all essential commands", async () => {
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
      () => true,
    );
    try {
      await runOnboard({ stdout: true, cwd: tmpDir });

      const output = (stdoutSpy.mock.calls[0] as string[])[0];
      expect(output).toContain("kura prime");
      expect(output).toContain("kura record");
      expect(output).toContain("kura status");
    } finally {
      stdoutSpy.mockRestore();
    }
  });

  // ── Marker-based update ───────────────────────────────────

  describe("marker-based update", () => {
    it("updates an existing marker-wrapped snippet when content changes", async () => {
      const oldSnippet = `${MARKER_START}\n## Project Expertise (Kura)\n\nOld content here.\n${MARKER_END}`;
      await writeFile(
        join(tmpDir, "CLAUDE.md"),
        `# My Project\n\n${oldSnippet}\n`,
        "utf-8",
      );

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
        expect(content).toContain("kura prime");
        expect(content).toContain(MARKER_START);
        expect(content).toContain(MARKER_END);
        expect(content).not.toContain("Old content here.");
        expect(content).toContain("# My Project");
        // Only one marker pair
        const markerMatches = content.match(/<!-- kura:start -->/g);
        expect(markerMatches).toHaveLength(1);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("reports up_to_date when snippet matches current version", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir }); // creates with current content
        await runOnboard({ cwd: tmpDir }); // should report up_to_date

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("up to date"),
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("reports updated action in JSON mode", async () => {
      const oldSnippet = `${MARKER_START}\nOld content.\n${MARKER_END}`;
      await writeFile(join(tmpDir, "CLAUDE.md"), oldSnippet, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, jsonMode: true });

        const output = JSON.parse((consoleSpy.mock.calls[0] as string[])[0]);
        expect(output.action).toBe("updated");
        expect(output.file).toBe("CLAUDE.md");
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("preserves surrounding content when updating", async () => {
      const oldSnippet = `${MARKER_START}\nOld.\n${MARKER_END}`;
      const fileContent = `# Header\n\nSome intro text.\n\n${oldSnippet}\n\n## Other Section\n\nMore content.\n`;
      await writeFile(join(tmpDir, "CLAUDE.md"), fileContent, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
        expect(content).toContain("# Header");
        expect(content).toContain("Some intro text.");
        expect(content).toContain("## Other Section");
        expect(content).toContain("More content.");
        expect(content).toContain("kura prime");
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  // ── Version marker ──────────────────────────────────────

  describe("version marker", () => {
    it("includes version marker in created file", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(join(tmpDir, "AGENTS.md"), "utf-8");
        expect(content).toContain(VERSION_MARKER);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("includes version marker in stdout output", async () => {
      const stdoutSpy = spyOn(process.stdout, "write").mockImplementation(
        () => true,
      );
      try {
        await runOnboard({ stdout: true, cwd: tmpDir });

        const output = (stdoutSpy.mock.calls[0] as string[])[0];
        expect(output).toContain(VERSION_MARKER);
      } finally {
        stdoutSpy.mockRestore();
      }
    });

    it("updates outdated section when version changes", async () => {
      const oldContent = `# Project\n\n${MARKER_START}\n## Project Expertise (Kura)\n<!-- kura-onboard-v:0 -->\nold content\n${MARKER_END}\n`;
      await writeFile(join(tmpDir, "CLAUDE.md"), oldContent, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
        expect(content).toContain("# Project");
        expect(content).toContain(VERSION_MARKER);
        expect(content).not.toContain("kura-onboard-v:0");
        expect(content).not.toContain("old content");
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("--check reports outdated for old version marker", async () => {
      const oldContent = `${MARKER_START}\n## Project Expertise (Kura)\n<!-- kura-onboard-v:0 -->\nold\n${MARKER_END}`;
      await writeFile(join(tmpDir, "AGENTS.md"), oldContent, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, check: true });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("outdated"),
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  // ── Legacy migration ──────────────────────────────────────

  describe("legacy migration", () => {
    const LEGACY_SNIPPET = `## Project Expertise (Kura)

This project uses [Kura](https://github.com/jayminwest/kura) for structured expertise management.

**At the start of every session**, run:
\`\`\`bash
kura prime
\`\`\`

This injects project-specific conventions, patterns, decisions, and other learnings into your context.

**Before completing your task**, review your work for insights worth preserving — conventions discovered,
patterns applied, failures encountered, or decisions made — and record them:
\`\`\`bash
kura record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
\`\`\`

Run \`kura status\` to check domain health and entry counts.
Run \`kura --help\` for full usage.

### Before You Finish

1. Store insights from this work session:
   \`\`\`bash
   kura record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
   \`\`\`
2. Validate and commit:
   \`\`\`bash
   kura validate && git add .kura/ && git commit -m "kura: record learnings"
   \`\`\`
`;

    it("migrates a legacy snippet to marker-wrapped version", async () => {
      const fileContent = `# My Project\n\n${LEGACY_SNIPPET}`;
      await writeFile(join(tmpDir, "CLAUDE.md"), fileContent, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
        expect(content).toContain(MARKER_START);
        expect(content).toContain(MARKER_END);
        expect(content).toContain("# My Project");
        // Only one header
        const headers = content.match(/## Project Expertise \(Kura\)/g);
        expect(headers).toHaveLength(1);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("reports migrated action in JSON mode", async () => {
      await writeFile(
        join(tmpDir, "CLAUDE.md"),
        `# Project\n\n${LEGACY_SNIPPET}`,
        "utf-8",
      );

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, jsonMode: true });

        const output = JSON.parse((consoleSpy.mock.calls[0] as string[])[0]);
        expect(output.action).toBe("migrated");
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("handles edited legacy snippet (falls back to header-to-EOF)", async () => {
      const editedLegacy =
        "# My Project\n\n## Project Expertise (Kura)\n\nSome custom text the user wrote.\n";
      await writeFile(join(tmpDir, "CLAUDE.md"), editedLegacy, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
        expect(content).toContain(MARKER_START);
        expect(content).toContain("# My Project");
        expect(content).not.toContain("Some custom text");
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("preserves content before legacy snippet", async () => {
      const fileContent = `# My Project\n\nImportant setup info.\n\n${LEGACY_SNIPPET}`;
      await writeFile(join(tmpDir, "CLAUDE.md"), fileContent, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
        expect(content).toContain("# My Project");
        expect(content).toContain("Important setup info.");
        expect(content).toContain(MARKER_START);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  // ── Multi-location detection ──────────────────────────────

  describe("multi-location detection", () => {
    it("detects snippet in .claude/CLAUDE.md and updates there", async () => {
      await mkdir(join(tmpDir, ".claude"), { recursive: true });
      const oldSnippet = `${MARKER_START}\nOld.\n${MARKER_END}`;
      await writeFile(
        join(tmpDir, ".claude", "CLAUDE.md"),
        oldSnippet,
        "utf-8",
      );

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(
          join(tmpDir, ".claude", "CLAUDE.md"),
          "utf-8",
        );
        expect(content).toContain("kura prime");
        // Should NOT create root files
        expect(existsSync(join(tmpDir, "CLAUDE.md"))).toBe(false);
        expect(existsSync(join(tmpDir, "AGENTS.md"))).toBe(false);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("prefers root CLAUDE.md over .claude/CLAUDE.md when both have snippets", async () => {
      const snippet = `${MARKER_START}\nOld.\n${MARKER_END}`;
      await writeFile(
        join(tmpDir, "CLAUDE.md"),
        `# Root\n\n${snippet}\n`,
        "utf-8",
      );
      await mkdir(join(tmpDir, ".claude"), { recursive: true });
      await writeFile(join(tmpDir, ".claude", "CLAUDE.md"), snippet, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        // Root should be updated
        const rootContent = await readFile(join(tmpDir, "CLAUDE.md"), "utf-8");
        expect(rootContent).toContain("kura prime");
        // Should warn about duplicate
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("also found in"),
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("does not create duplicates when snippet exists in AGENTS.md", async () => {
      // CLAUDE.md exists (no snippet), AGENTS.md has the snippet
      await writeFile(join(tmpDir, "CLAUDE.md"), "# Project\n", "utf-8");
      const snippet = `${MARKER_START}\nOld.\n${MARKER_END}`;
      await writeFile(join(tmpDir, "AGENTS.md"), snippet, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        // Should update AGENTS.md, not add to CLAUDE.md
        const agentsContent = await readFile(
          join(tmpDir, "AGENTS.md"),
          "utf-8",
        );
        expect(agentsContent).toContain("kura prime");
        const claudeContent = await readFile(
          join(tmpDir, "CLAUDE.md"),
          "utf-8",
        );
        expect(claudeContent).not.toContain("kura");
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("detects legacy snippet in .claude/CLAUDE.md", async () => {
      await mkdir(join(tmpDir, ".claude"), { recursive: true });
      await writeFile(
        join(tmpDir, ".claude", "CLAUDE.md"),
        "# Config\n\n## Project Expertise (Kura)\n\nOld text.\n",
        "utf-8",
      );

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir });

        const content = await readFile(
          join(tmpDir, ".claude", "CLAUDE.md"),
          "utf-8",
        );
        expect(content).toContain(MARKER_START);
        expect(content).toContain("kura prime");
        expect(existsSync(join(tmpDir, "CLAUDE.md"))).toBe(false);
        expect(existsSync(join(tmpDir, "AGENTS.md"))).toBe(false);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  // ── --check flag ──────────────────────────────────────────

  describe("--check flag", () => {
    it("reports not installed when no snippet exists", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, check: true });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("not installed"),
        );
        // Should not create any files
        expect(existsSync(join(tmpDir, "AGENTS.md"))).toBe(false);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("reports up to date when current version is installed", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir }); // install first
        await runOnboard({ cwd: tmpDir, check: true });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("up to date"),
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("reports outdated when an old snippet is present", async () => {
      const oldSnippet = `${MARKER_START}\nOld content.\n${MARKER_END}`;
      await writeFile(join(tmpDir, "AGENTS.md"), oldSnippet, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, check: true });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("outdated"),
        );
        // Should NOT modify the file
        const content = await readFile(join(tmpDir, "AGENTS.md"), "utf-8");
        expect(content).toContain("Old content.");
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("reports legacy when snippet has no markers", async () => {
      await writeFile(
        join(tmpDir, "CLAUDE.md"),
        "## Project Expertise (Kura)\n\nOld text.\n",
        "utf-8",
      );

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, check: true });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("legacy"),
        );
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("--check does not modify files", async () => {
      const oldSnippet = `${MARKER_START}\nOld.\n${MARKER_END}`;
      await writeFile(join(tmpDir, "AGENTS.md"), oldSnippet, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, check: true });

        const content = await readFile(join(tmpDir, "AGENTS.md"), "utf-8");
        expect(content).toBe(oldSnippet);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it("--check works in JSON mode", async () => {
      const oldSnippet = `${MARKER_START}\nOld.\n${MARKER_END}`;
      await writeFile(join(tmpDir, "AGENTS.md"), oldSnippet, "utf-8");

      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      try {
        await runOnboard({ cwd: tmpDir, check: true, jsonMode: true });

        const output = JSON.parse((consoleSpy.mock.calls[0] as string[])[0]);
        expect(output.command).toBe("onboard");
        expect(output.action).toBe("outdated");
        expect(output.file).toBe("AGENTS.md");
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});
