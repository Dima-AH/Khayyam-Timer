import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import PDFDocument from 'pdfkit';

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
const sum = (es: Entry[]) => es.reduce((a, e) => a + (e.end - e.start), 0);

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
  reportItem.tooltip = 'Export work report';

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
  // Returns the duration (ms) that was actually saved (0 if nothing to save).
  const flush = (): number => {
    if (runningSince === undefined) return 0;
    const now = Date.now();
    let saved = 0;
    if (now - segStart >= 1000) {
      saved = now - segStart;
      const log = readLog();
      log.push({ project, branch, start: segStart, end: now });
      void context.globalState.update(LOG_KEY, log);
    }
    segStart = now;
    return saved;
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
  // When the branch changes while the timer is running, close out the segment
  // on the old branch and pop up a small notification: how long was just spent
  // on that branch, plus the running total for that branch so far.
  const refreshBranch = (repo: any) => {
    const b: string = repo?.state?.HEAD?.name ?? 'no-git';
    if (b === branch) return;
    const oldBranch = branch;
    const wasRunning = runningSince !== undefined;
    const savedMs = flush(); // closes the segment under oldBranch
    branch = b;
    render();

    if (wasRunning && savedMs > 0) {
      const log = readLog();
      const totalOnOldBranch = sum(log.filter((e) => e.project === project && e.branch === oldBranch));
      vscode.window.showInformationMessage(
        `Khayyam Timer: ${oldBranch} → +${fmt(savedMs)} (total on this branch: ${fmt(totalOnOldBranch)}). Switched to ${b}.`
      );
    }
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

  // ---------- Shared report data ----------
  // Precomputes the same groupings for all three export formats, so txt/csv/pdf
  // always agree with each other.
  function summarize(log: Entry[]) {
    const projects = [...new Set(log.map((e) => e.project))];
    const byProjectBranch = projects.map((p) => {
      const pe = log.filter((e) => e.project === p);
      const branches = [...new Set(pe.map((e) => e.branch))].map((b) => ({
        branch: b,
        totalMs: sum(pe.filter((e) => e.branch === b)),
      }));
      return { project: p, totalMs: sum(pe), branches };
    });

    const days = [...new Set(log.map((e) => fmtDay(e.start)))];
    const byDay = days.map((d) => {
      const de = log.filter((e) => fmtDay(e.start) === d);
      const keys = [...new Set(de.map((e) => `${e.project} / ${e.branch}`))].map((k) => ({
        key: k,
        totalMs: sum(de.filter((e) => `${e.project} / ${e.branch}` === k)),
      }));
      return { day: d, totalMs: sum(de), keys };
    });

    return { totalMs: sum(log), byProjectBranch, byDay };
  }

  // ---------- TXT ----------
  const buildTxt = (log: Entry[]): string => {
    const s = summarize(log);
    const lines: string[] = [];

    lines.push('KHAYYAM TIMER REPORT');
    lines.push(`Generated: ${fmtDateTime(Date.now())}`);
    lines.push('='.repeat(50));
    lines.push(`Total tracked: ${fmt(s.totalMs)}`);
    lines.push('');

    lines.push('BY PROJECT / BRANCH');
    lines.push('-'.repeat(50));
    for (const p of s.byProjectBranch) {
      lines.push(`${p.project}  (${fmt(p.totalMs)})`);
      for (const b of p.branches) {
        lines.push(`  - ${b.branch.padEnd(30)} ${fmt(b.totalMs)}`);
      }
    }
    lines.push('');

    lines.push('BY DAY');
    lines.push('-'.repeat(50));
    for (const d of s.byDay) {
      lines.push(`${d.day}  (${fmt(d.totalMs)})`);
      for (const k of d.keys) {
        lines.push(`  - ${k.key.padEnd(40)} ${fmt(k.totalMs)}`);
      }
    }
    lines.push('');

    lines.push('SESSIONS');
    lines.push('-'.repeat(50));
    for (const e of log) {
      lines.push(
        `${fmtDateTime(e.start)} -> ${fmtDateTime(e.end)}  ${fmt(e.end - e.start)}  ${e.project} / ${e.branch}`
      );
    }
    return lines.join('\n') + '\n';
  };

  // ---------- CSV (opens directly in Excel / Google Sheets) ----------
  const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csvRow = (vals: string[]) => vals.map(csvCell).join(',') + '\r\n';

  const buildCsv = (log: Entry[]): string => {
    const s = summarize(log);
    let out = '';
    out += csvRow(['Khayyam Timer report']);
    out += csvRow(['Generated', fmtDateTime(Date.now())]);
    out += csvRow(['Total tracked', fmt(s.totalMs)]);
    out += '\r\n';

    out += csvRow(['Summary by project / branch']);
    out += csvRow(['Project', 'Branch', 'Total time']);
    for (const p of s.byProjectBranch) {
      for (const b of p.branches) {
        out += csvRow([p.project, b.branch, fmt(b.totalMs)]);
      }
    }
    out += '\r\n';

    out += csvRow(['Summary by day']);
    out += csvRow(['Day', 'Project / Branch', 'Total time']);
    for (const d of s.byDay) {
      for (const k of d.keys) {
        out += csvRow([d.day, k.key, fmt(k.totalMs)]);
      }
    }
    out += '\r\n';

    out += csvRow(['Sessions']);
    out += csvRow(['Start', 'End', 'Duration', 'Project', 'Branch']);
    for (const e of log) {
      out += csvRow([fmtDateTime(e.start), fmtDateTime(e.end), fmt(e.end - e.start), e.project, e.branch]);
    }
    return out;
  };

  // ---------- PDF ----------
  // Uses pdfkit's built-in font, which only supports Latin/ASCII characters.
  // Project and branch names with Persian/Arabic script will not render
  // correctly here — use the TXT or CSV export for those instead.
  const buildPdf = (log: Entry[], targetPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const s = summarize(log);
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(targetPath);
      doc.pipe(stream);
      stream.on('finish', resolve);
      stream.on('error', reject);

      doc.fontSize(18).text('Khayyam Timer Report', { align: 'left' });
      doc.fontSize(10).fillColor('#555').text(`Generated: ${fmtDateTime(Date.now())}`);
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000').text(`Total tracked: ${fmt(s.totalMs)}`);
      doc.moveDown();

      doc.fontSize(14).text('By project / branch');
      doc.moveDown(0.3);
      doc.fontSize(10);
      for (const p of s.byProjectBranch) {
        doc.font('Helvetica-Bold').text(`${p.project}  (${fmt(p.totalMs)})`);
        doc.font('Helvetica');
        for (const b of p.branches) {
          doc.text(`   ${b.branch} — ${fmt(b.totalMs)}`);
        }
      }
      doc.moveDown();

      doc.fontSize(14).text('By day');
      doc.moveDown(0.3);
      doc.fontSize(10);
      for (const d of s.byDay) {
        doc.font('Helvetica-Bold').text(`${d.day}  (${fmt(d.totalMs)})`);
        doc.font('Helvetica');
        for (const k of d.keys) {
          doc.text(`   ${k.key} — ${fmt(k.totalMs)}`);
        }
      }
      doc.moveDown();

      doc.fontSize(14).text('Sessions');
      doc.moveDown(0.3);
      doc.fontSize(9);
      for (const e of log) {
        doc.text(`${fmtDateTime(e.start)} -> ${fmtDateTime(e.end)}   ${fmt(e.end - e.start)}   ${e.project} / ${e.branch}`);
      }

      doc.end();
    });
  };

  // ---------- Export (asks the user which format to use) ----------
  const exportReport = async () => {
    flush(); // include the segment that is currently running
    const log = readLog();
    if (log.length === 0) {
      vscode.window.showInformationMessage('Khayyam Timer: no time has been recorded yet.');
      return;
    }

    const choice = await vscode.window.showQuickPick(
      [
        { label: '$(file-text) Text (.txt)', value: 'txt' as const },
        { label: '$(table) Excel (.csv)', value: 'csv' as const },
        { label: '$(file-pdf) PDF (.pdf)', value: 'pdf' as const },
      ],
      { placeHolder: 'Choose a report format' }
    );
    if (!choice) return;

    const ext = choice.value;
    const filters: Record<string, string[]> =
      ext === 'txt' ? { 'Text file': ['txt'] } : ext === 'csv' ? { 'Excel / CSV': ['csv'] } : { 'PDF file': ['pdf'] };

    const target = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(path.join(os.homedir(), `khayyam-timer-report.${ext}`)),
      filters,
    });
    if (!target) return;

    if (ext === 'txt') {
      fs.writeFileSync(target.fsPath, buildTxt(log), 'utf8');
    } else if (ext === 'csv') {
      // BOM so Excel opens UTF-8 (non-Latin project/branch names) correctly.
      fs.writeFileSync(target.fsPath, '\uFEFF' + buildCsv(log), 'utf8');
    } else {
      await buildPdf(log, target.fsPath);
    }

    if (ext !== 'pdf') {
      const doc = await vscode.workspace.openTextDocument(target);
      await vscode.window.showTextDocument(doc);
    } else {
      await vscode.env.openExternal(target);
    }
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
