#!/usr/bin/env node
/*  CLOI shell-RC bootstrap — idempotent & non-interactive capable  */
const fs        = require('fs');
const os        = require('os');
const path      = require('path');
const readline  = require('readline');
const { execSync } = require('child_process');

/* ---------- config ------------------------------------------------------ */
const SENTINEL = '# >>> CLOI_HISTORY_SETTINGS >>>';
const SNIPPET  = `
${SENTINEL}
setopt INC_APPEND_HISTORY
setopt SHARE_HISTORY
# <<< CLOI_HISTORY_SETTINGS <<<
`;
/* ----------------------------------------------------------------------- */

const argvHas = flag => process.argv.slice(2).includes(flag);
const interactive = !argvHas('--auto');

if (process.env.CLOI_SKIP_ZSHRC === '1') {
  console.log('ℹ︎ Skipping ~/.zshrc modification – CLOI_SKIP_ZSHRC=1');
  process.exit(0);
}

/* resolve correct home dir even when run under sudo */
const sudoUser = process.env.SUDO_USER;
let homeDir;
try {
  homeDir = sudoUser
    ? execSync(`eval echo "~${sudoUser}"`, { encoding: 'utf8' }).trim()
    : os.homedir();
} catch {
  homeDir = os.homedir();
}
const ZSHRC = path.join(homeDir, '.zshrc');

/* read existing file (if any) */
let content = fs.existsSync(ZSHRC) ? fs.readFileSync(ZSHRC, 'utf8') : '';

if (content.includes(SENTINEL)) {
  console.log('✅ CLOI history settings already present – nothing to do.');
  process.exit(0);
}

async function confirm(q) {
  return new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin,
                                          output: process.stdout });
    rl.question(q + ' (Y/n) ', a => {
      rl.close(); res(/^y(es)?$/i.test(a.trim() || 'y'));
    });
  });
}

(async () => {
  if (interactive) {
    const ok = await confirm(
      'CLOI will add history settings to your ~/.zshrc. Proceed?'
    );
    if (!ok) { console.log('Aborted.'); process.exit(0); }
  } else {
    console.log('ℹ︎ --auto mode: patching ~/.zshrc without prompt.');
  }

  /* ensure file exists, then append */
  if (!fs.existsSync(ZSHRC)) fs.writeFileSync(ZSHRC, '', 'utf8');
  fs.appendFileSync(ZSHRC, SNIPPET, 'utf8');
  console.log('✅ Added CLOI history settings to ~/.zshrc');
})().catch(err => {
  console.error('❌ Error updating ~/.zshrc:', err);
  process.exit(1);
});
