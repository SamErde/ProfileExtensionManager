import * as vscode from 'vscode';

const SCHEME = 'pem-readonly';

/**
 * Serves a snapshot of a real on-disk file as a read-only virtual document. Registered once for
 * the whole extension; the fsPath to read is carried in each request's `query`, set via
 * `vscode.Uri.from` (not string-parsed), so it never needs manual percent-encoding.
 */
export class PemReadOnlyContentProvider implements vscode.TextDocumentContentProvider {
  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const bytes = await vscode.workspace.fs.readFile(vscode.Uri.file(uri.query));
    return Buffer.from(bytes).toString('utf8');
  }
}

export function registerPemReadOnlyProvider(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(SCHEME, new PemReadOnlyContentProvider()),
  );
}

/**
 * Opens `fsPath` as a read-only virtual document titled with `label` (expected to already make
 * the read-only nature obvious, e.g. "Blog — extensions.json (read-only)"). VS Code owns the real
 * file — this is a preview-only snapshot for browsing without risking an accidental edit. Never
 * throws: a read/open failure surfaces as an error toast instead.
 */
export async function openReadOnly(label: string, fsPath: string): Promise<void> {
  try {
    const uri = vscode.Uri.from({ scheme: SCHEME, path: `/${label}`, query: fsPath });
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, 'json').then(undefined, () => undefined);
    await vscode.window.showTextDocument(doc, { preview: true });
  } catch (e) {
    void vscode.window.showErrorMessage(
      `Profile Extension Manager: couldn't open "${label}" — ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
