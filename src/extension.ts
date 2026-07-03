import * as vscode from 'vscode';
import { CleanupService } from './core/cleanup';
import { InventoryService, type InventoryIo } from './core/inventory';
import { createNodeCliRunner, MutationService } from './core/mutations';
import { findCli, resolvePaths, type Platform } from './core/paths';
import { MatrixPanel } from './panel/matrixPanel';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('visex.showMatrix', async () => {
      const setup = await buildServices(context);
      if ('error' in setup) {
        void vscode.window.showErrorMessage(
          `Profile Extension Manager can't manage profiles in this environment: ${setup.error}`,
        );
        return;
      }
      MatrixPanel.show(context, setup);
      await MatrixPanel.current?.refresh();
      watchForChanges(context, setup.watched);
    }),
  );
}

export function deactivate(): void {}

type Services = {
  inventory: InventoryService;
  mutations: MutationService;
  cleanup: CleanupService;
  watched: string[];
};

async function buildServices(context: vscode.ExtensionContext): Promise<Services | { error: string }> {
  if (vscode.env.remoteName !== undefined) return { error: 'remote workspaces are not supported.' };

  const fs = await import('node:fs');
  const fsp = await import('node:fs/promises');
  const path = await import('node:path');

  const paths = resolvePaths({
    globalStorageFsPath: context.globalStorageUri.fsPath,
    extensionFsPath: context.extensionUri.fsPath,
    platform: process.platform as Platform,
  });
  if (!fs.existsSync(paths.storageJson)) {
    return { error: `profile registry not found at ${paths.storageJson}.` };
  }
  const cliPath = findCli(vscode.env.appRoot, process.platform as Platform, (p) => fs.existsSync(p));
  if (!cliPath) return { error: `the "code" CLI was not found near ${vscode.env.appRoot}.` };

  const io: InventoryIo = {
    readFile: async (p) => {
      try {
        return await fsp.readFile(p, 'utf8');
      } catch {
        return undefined;
      }
    },
    listDirs: async (p) => {
      try {
        return (await fsp.readdir(p, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
      } catch {
        return [];
      }
    },
    readDisplayName: async (folder) => {
      try {
        const pkg = JSON.parse(await fsp.readFile(path.join(folder, 'package.json'), 'utf8')) as {
          displayName?: unknown;
        };
        return typeof pkg.displayName === 'string' && !pkg.displayName.startsWith('%') ? pkg.displayName : undefined;
      } catch {
        return undefined;
      }
    },
  };

  const inventory = new InventoryService(paths, io);
  const mutations = new MutationService({
    cliPath,
    extraArgs: ['--user-data-dir', paths.userDataDir, '--extensions-dir', paths.extensionsDir],
    run: createNodeCliRunner(),
  });
  const cleanup = new CleanupService((fsPath) =>
    Promise.resolve(vscode.workspace.fs.delete(vscode.Uri.file(fsPath), { recursive: true, useTrash: true })),
  );
  return { inventory, mutations, cleanup, watched: inventory.watchedFiles() };
}

let watchersInstalled = false;
function watchForChanges(context: vscode.ExtensionContext, watched: string[]): void {
  if (watchersInstalled) return;
  watchersInstalled = true;
  let timer: NodeJS.Timeout | undefined;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void MatrixPanel.current?.refresh(), 300);
  };
  for (const p of watched) {
    const pattern = new vscode.RelativePattern(vscode.Uri.file(p).with({ path: dirOf(p) }), '**');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange(refresh);
    watcher.onDidCreate(refresh);
    watcher.onDidDelete(refresh);
    context.subscriptions.push(watcher);
  }
}

function dirOf(p: string): string {
  const norm = p.replaceAll('\\', '/');
  return norm.endsWith('.json') || norm.endsWith('.obsolete') ? norm.slice(0, norm.lastIndexOf('/')) : norm;
}
