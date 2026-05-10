import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import yaml from "js-yaml";
import type { KuraConfig } from "../schemas/config.ts";
import { DEFAULT_CONFIG } from "../schemas/config.ts";
import { createExpertiseFile } from "./expertise.ts";

const KURA_DIR = ".kura";
const CONFIG_FILE = "kura.config.yaml";
const EXPERTISE_DIR = "expertise";

export const GITATTRIBUTES_LINE = ".kura/expertise/*.jsonl merge=union";

export const KURA_README = `# .kura/

This directory is managed by [kura](https://github.com/jayminwest/kura) — a structured expertise layer for coding agents.

## Key Commands

- \`kura init\`      — Initialize a .kura directory
- \`kura add\`       — Add a new domain
- \`kura record\`    — Record an expertise record
- \`kura edit\`      — Edit an existing record
- \`kura query\`     — Query expertise records
- \`kura prime [domain]\` — Output a priming prompt (optionally scoped to one domain)
- \`kura search\`   — Search records across domains
- \`kura status\`    — Show domain statistics
- \`kura validate\`  — Validate all records against the schema
- \`kura prune\`     — Remove expired records

## Structure

- \`kura.config.yaml\` — Configuration file
- \`expertise/\`        — JSONL files, one per domain
`;

export function getKuraDir(cwd: string = process.cwd()): string {
  return join(cwd, KURA_DIR);
}

export function getConfigPath(cwd: string = process.cwd()): string {
  return join(getKuraDir(cwd), CONFIG_FILE);
}

export function getExpertiseDir(cwd: string = process.cwd()): string {
  return join(getKuraDir(cwd), EXPERTISE_DIR);
}

export function validateDomainName(domain: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(domain)) {
    throw new Error(
      `Invalid domain name: "${domain}". Only alphanumeric characters, hyphens, and underscores are allowed.`,
    );
  }
}

export function getExpertisePath(
  domain: string,
  cwd: string = process.cwd(),
): string {
  validateDomainName(domain);
  return join(getExpertiseDir(cwd), `${domain}.jsonl`);
}

export async function readConfig(
  cwd: string = process.cwd(),
): Promise<KuraConfig> {
  const configPath = getConfigPath(cwd);
  let content: string;
  try {
    content = await readFile(configPath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        "No .kura/ directory found. Run `kura init` to set up this project.",
      );
    }
    throw err;
  }
  return yaml.load(content) as KuraConfig;
}

export async function addDomain(
  domain: string,
  cwd: string = process.cwd(),
): Promise<void> {
  validateDomainName(domain);
  const config = await readConfig(cwd);
  if (!config.domains.includes(domain)) {
    config.domains.push(domain);
    await writeConfig(config, cwd);
  }
  const filePath = getExpertisePath(domain, cwd);
  if (!existsSync(filePath)) {
    await createExpertiseFile(filePath);
  }
}

export async function removeDomain(
  domain: string,
  cwd: string = process.cwd(),
): Promise<void> {
  validateDomainName(domain);
  const config = await readConfig(cwd);
  const index = config.domains.indexOf(domain);
  if (index === -1) {
    throw new Error(`Domain "${domain}" not found in config.`);
  }
  config.domains.splice(index, 1);
  await writeConfig(config, cwd);
  const filePath = getExpertisePath(domain, cwd);
  if (existsSync(filePath)) {
    await rm(filePath);
  }
}

export async function writeConfig(
  config: KuraConfig,
  cwd: string = process.cwd(),
): Promise<void> {
  const configPath = getConfigPath(cwd);
  const content = yaml.dump(config, { lineWidth: -1 });
  await writeFile(configPath, content, "utf-8");
}

export async function initKuraDir(cwd: string = process.cwd()): Promise<void> {
  const kuraDir = getKuraDir(cwd);
  const expertiseDir = getExpertiseDir(cwd);
  await mkdir(kuraDir, { recursive: true });
  await mkdir(expertiseDir, { recursive: true });

  // Only write default config if none exists — preserve user customizations
  const configPath = getConfigPath(cwd);
  if (!existsSync(configPath)) {
    await writeConfig({ ...DEFAULT_CONFIG }, cwd);
  }

  // Create or append .gitattributes with merge=union for JSONL files
  const gitattributesPath = join(cwd, ".gitattributes");
  let existing = "";
  try {
    existing = await readFile(gitattributesPath, "utf-8");
  } catch {
    // File doesn't exist yet — will create it
  }
  if (!existing.includes(GITATTRIBUTES_LINE)) {
    const separator =
      existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
    await writeFile(
      gitattributesPath,
      `${existing + separator + GITATTRIBUTES_LINE}\n`,
      "utf-8",
    );
  }

  // Create .kura/README.md if missing
  const readmePath = join(kuraDir, "README.md");
  if (!existsSync(readmePath)) {
    await writeFile(readmePath, KURA_README, "utf-8");
  }
}
