import { existsSync } from "node:fs";
import type { Command } from "commander";
import { getKuraDir, initKuraDir } from "../utils/config.ts";
import { outputJson } from "../utils/json-output.ts";
import { brand, isQuiet } from "../utils/palette.ts";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize .kura/ in the current project")
    .action(async () => {
      const jsonMode = program.opts().json === true;
      const kuraDir = getKuraDir();
      const alreadyExists = existsSync(kuraDir);

      await initKuraDir();

      if (jsonMode) {
        outputJson({
          success: true,
          command: "init",
          created: !alreadyExists,
          path: kuraDir,
        });
      } else if (alreadyExists) {
        if (!isQuiet())
          console.log(
            brand("Updated .kura/ — filled in any missing artifacts."),
          );
      } else {
        if (!isQuiet())
          console.log(brand(`Initialized .kura/ in ${process.cwd()}`));
      }
    });
}
