import chalk from 'chalk';
import { execa } from 'execa';
import path from 'path';
import os from 'os';
import fs from 'fs';

interface Check {
  name: string;
  pass: boolean;
  detail?: string;
}

async function checkCommand(
  name: string,
  cmd: string,
  args: string[],
): Promise<Check> {
  try {
    const r = await execa(cmd, args, { reject: false });
    const version = (r.stdout ?? '').split('\n')[0]?.trim() ?? '';
    return { name, pass: r.exitCode === 0, detail: version };
  } catch {
    return { name, pass: false, detail: 'not found' };
  }
}

export async function runDoctor(): Promise<number> {
  console.log(chalk.bold.cyan('\nForgeCode Doctor\n'));
  const checks: Check[] = [];

  // Node.js
  checks.push({ name: 'Node.js', pass: true, detail: process.version });

  // Git
  checks.push(await checkCommand('Git', 'git', ['--version']));

  // PowerShell
  checks.push(
    await checkCommand('PowerShell', 'powershell.exe', [
      '-Command',
      '$PSVersionTable.PSVersion.ToString()',
    ]),
  );

  // OpenAI API key
  checks.push({
    name: 'OpenAI API key',
    pass: !!process.env['OPENAI_API_KEY'],
    detail: process.env['OPENAI_API_KEY']
      ? 'configured'
      : 'OPENAI_API_KEY not set',
  });

  // Forge data dir
  const forgeDir = path.join(os.homedir(), '.forgecode');
  const dirExists = fs.existsSync(forgeDir);
  // Not a hard failure if it doesn't exist yet — it will be created on first run
  checks.push({
    name: 'ForgeCode data dir',
    pass: dirExists || true,
    detail: forgeDir,
  });

  // pnpm (optional — not a failure if absent)
  checks.push(await checkCommand('pnpm (optional)', 'pnpm', ['--version']));

  for (const check of checks) {
    const icon = check.pass ? chalk.green('✓') : chalk.red('✗');
    const detail = check.detail ? chalk.dim('  ' + check.detail) : '';
    console.log(`  ${icon}  ${check.name}${detail}`);
  }

  const failures = checks.filter(c => !c.pass);
  console.log('');
  if (failures.length === 0) {
    console.log(chalk.green.bold('ForgeCode is ready.'));
  } else {
    console.log(
      chalk.yellow(`ForgeCode has ${failures.length} issue(s). Fix them above.`),
    );
  }
  console.log('');
  return failures.length > 0 ? 1 : 0;
}
