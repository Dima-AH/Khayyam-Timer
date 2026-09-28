import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Entry {
  project: string;
  branch: string;
  start: number;
  end: number;
}

const LOG_KEY = 'khayyamTimer.log';
const ELAPSED_KEY = 'khayyamTimer.elapsedMs';

const pad = (n: number) => String(n).padStart(2, '0');

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

const fmtDateTime = (ms: number) => new Date(ms).toLocaleString('sv-SE');
const fmtDay = (ms: number) => new Date(ms).toLocaleDateString('sv-SE');

export async function activate(context: vscode.ExtensionContext) {
  const project = vscode.workspace.workspaceFolders?.[0]?.name ?? 'No project';

  // Timer state (per workspace)
  let elapsedMs = context.workspaceState.get<number>(ELAPSED_KEY, 0);
  let runningSince: number | undefined;
  let segStart = 0;
  let branch = 'no-git';

  // ---------- Status bar ----------
  const timerItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  const playItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  const resetItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  const reportItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);

  timerItem.command = 'khayyamTimer.toggle';
  playItem.command = 'khayyamTimer.toggle';
  resetItem.command = 'khayyamTimer.reset';
  resetItem.text = '$(refresh)';
  resetItem.tooltip = 'Reset timer';
  reportItem.command = 'khayyamTimer.report';
  reportItem.text = '$(file-text)';
  reportItem.tooltip = 'Export work report (txt)';

  [timerItem, playItem, resetItem, reportItem].forEach((i) => i.show());

  const total = () => elapsedMs + (runningSince !== undefined ? Date.now() - runningSince : 0);

  const render = () => {
    const running = runningSince !== undefined;
    timerItem.text = `$(clock) ${fmt(total())}`;
    timerItem.tooltip = `${project} • ${branch}`;
    playItem.text = running ? '$(debug-pause)' : '$(play)';
    playItem.tooltip = running ? 'Pause' : 'Start';
  };

  // ---------- Log ----------
  const readLog = () => context.globalState.get<Entry[]>(LOG_KEY, []);

  // Saves the current segment (time since segStart) under the current branch.
  const flush = () => {
    if (runningSince === undefined) return;
    const now = Date.now();
    if (now - segStart >= 1000) {
      const log = readLog();
      log.push({ project, branch, start: segStart, end: now });
      void context.globalState.update(LOG_KEY, log);
    }
    segStart = now;
  };

  // ---------- Timer actions ----------
  const start = () => {
    runningSince = Date.now();
    segStart = runningSince;
    render();
  };

  const pause = () => {
    if (runningSince === undefined) return;
    flush();
    elapsedMs += Date.now() - runningSince;
    runningSince = undefined;
    void context.workspaceState.update(ELAPSED_KEY, elapsedMs);
    render();
  };

  const reset = () => {
    if (runningSince !== undefined) flush();
    runningSince = undefined;
    elapsedMs = 0;
    void context.workspaceState.update(ELAPSED_KEY, 0);
    render();
  };

  // ---------- Git branch tracking ----------
  const refreshBranch = (repo: any) => {
    const b: string = repo?.state?.HEAD?.name ?? 'no-git';
    if (b === branch) return;
    flush(); // close the segment under the old branch
    branch = b;
    render();
  };

  try {
    const gitExt = vscode.extensions.getExtension('vscode.git');
    if (gitExt) {
      const exports = gitExt.isActive ? gitExt.exports : await gitExt.activate();
      const api = exports.getAPI(1);
      const attach = (repo: any) => {
        branch = repo?.state?.HEAD?.name ?? 'no-git';
        context.subscriptions.push(repo.state.onDidChange(() => refreshBranch(repo)));
        render();
      };
      if (api.repositories.length > 0) attach(api.repositories[0]);
      context.subscriptions.push(api.onDidOpenRepository((r: any) => {
        if (branch === 'no-git') attach(r);
      }));
    }
  } catch {
    // Git not available: everything is logged under "no-git"
  }

  // ---------- Report ----------
  const buildReport = (log: Entry[]): string => {
    const lines: string[] = [];
    const sum = (es: Entry[]) => es.reduce((a, e) => a + (e.end - e.start), 0);

    lines.push('Khayyam Timer REPORT');
    lines.push(`Generated: ${fmtDateTime(Date.now())}`);
    lines.push('='.repeat(50));
    lines.push(`Total tracked: ${fmt(sum(log))}`);
    lines.push('');

    // By project / branch
    lines.push('BY PROJECT / BRANCH');
    lines.push('-'.repeat(50));
    const projects = [...new Set(log.map((e) => e.project))];
    for (const p of projects) {
      const pe = log.filter((e) => e.project === p);
      lines.push(`${p}  (${fmt(sum(pe))})`);
      const branches = [...new Set(pe.map((e) => e.branch))];
      for (const b of branches) {
        lines.push(`  - ${b.padEnd(30)} ${fmt(sum(pe.filter((e) => e.branch === b)))}`);
      }
    }
    lines.push('');

    // By day
    lines.push('BY DAY');
    lines.push('-'.repeat(50));
    const days = [...new Set(log.map((e) => fmtDay(e.start)))];
    for (const d of days) {
      const de = log.filter((e) => fmtDay(e.start) === d);
      lines.push(`${d}  (${fmt(sum(de))})`);
      const keys = [...new Set(de.map((e) => `${e.project} / ${e.branch}`))];
      for (const k of keys) {
        const ke = de.filter((e) => `${e.project} / ${e.branch}` === k);
        lines.push(`  - ${k.padEnd(40)} ${fmt(sum(ke))}`);
      }
    }
    lines.push('');

    // Sessions
    lines.push('SESSIONS');
    lines.push('-'.repeat(50));
    for (const e of log) {
      lines.push(
        `${fmtDateTime(e.start)} -> ${fmtDateTime(e.end)}  ${fmt(e.end - e.start)}  ${e.project} / ${e.branch}`
      );
    }
    return lines.join('\n') + '\n';
  };

  const exportReport = async () => {
    flush(); // include the segment that is currently running
    const log = readLog();
    if (log.length === 0) {
      vscode.window.showInformationMessage('Khayyam Timer: no time has been recorded yet.');
      return;
    }
    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(os.homedir(), 'khayyam-timer-report.txt')),
      filters: { 'Text file': ['txt'] },
    });
    if (!target) return;
    fs.writeFileSync(target.fsPath, buildReport(log), 'utf8');
    const doc = await vscode.workspace.openTextDocument(target);
    await vscode.window.showTextDocument(doc);
  };

  const clearHistory = async () => {
    const answer = await vscode.window.showWarningMessage(
      'Delete all recorded work history?',
      { modal: true },
      'Delete'
    );
    if (answer === 'Delete') {
      await context.globalState.update(LOG_KEY, []);
      vscode.window.showInformationMessage('Khayyam Timer: history cleared.');
    }
  };

  // ---------- Wiring ----------
  context.subscriptions.push(
    vscode.commands.registerCommand('khayyamTimer.toggle', () => (runningSince === undefined ? start() : pause())),
    vscode.commands.registerCommand('khayyamTimer.reset', reset),
    vscode.commands.registerCommand('khayyamTimer.report', exportReport),
    vscode.commands.registerCommand('khayyamTimer.clearHistory', clearHistory),
    timerItem, playItem, resetItem, reportItem
  );

  const interval = setInterval(render, 1000);
  context.subscriptions.push({
    dispose: () => {
      clearInterval(interval);
      pause(); // save progress when VS Code closes
    },
  });

  render();
}

export function deactivate() {}
