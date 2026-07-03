import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if ([".next", "node_modules"].includes(entry)) continue;
      walk(path, files);
    } else {
      files.push(path);
    }
  }
  return files;
}

const unlocs = read("app/_lib/unlocs.ts");
assert.match(unlocs, /Alvarães/);
assert.match(unlocs, /São Gabriel da Cachoeira/);
assert.doesNotMatch(unlocs, /Ã|Â|â€”/);

const login = read("app/(pages)/login/page.tsx");
assert.match(login, /\/recuperar-senha/);
assert.match(login, /Faça login para continuar/);

const senha = read("app/(pages)/senha/page.tsx");
assert.match(senha, /\/users\/me\/password/);

const recuperarSenha = read("app/(pages)/recuperar-senha/page.tsx");
assert.match(recuperarSenha, /\/auth\/password-reset\/confirm/);

const sourceFiles = walk(join(root, "app")).filter((path) => /\.(tsx?|jsx?)$/.test(path));
const consoleLeaks = sourceFiles
  .filter((path) => !path.endsWith(join("app", "_lib", "logger.ts")))
  .flatMap((path) => {
    const content = readFileSync(path, "utf8");
    return /console\.(error|warn|log|debug|info)/.test(content) ? [path] : [];
  });

assert.deepEqual(consoleLeaks, [], "Console calls devem ficar centralizadas em app/_lib/logger.ts");

console.log("Frontend smoke tests passed.");
