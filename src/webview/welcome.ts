import type { HostToWelcome, ParseWarning, WelcomeProfileVm, WelcomeToHost } from '../core/types';

declare function acquireVsCodeApi(): { postMessage(m: WelcomeToHost): void };
const vscode = acquireVsCodeApi();

let state: { profiles: WelcomeProfileVm[]; orphanCount: number; warnings: ParseWarning[] } | undefined;
let orphanSizeText = '';

document.getElementById('open')?.addEventListener('click', () => vscode.postMessage({ type: 'openMatrix' }));

window.addEventListener('message', (event: MessageEvent<HostToWelcome>) => {
  const m = event.data;
  switch (m.type) {
    case 'state':
      state = m;
      orphanSizeText = '';
      render();
      return;
    case 'orphanSize':
      orphanSizeText = formatBytes(m.totalSizeBytes);
      render();
      return;
    case 'unsupported': {
      state = undefined;
      const dashboard = document.getElementById('dashboard');
      if (!dashboard) return;
      dashboard.replaceChildren(el('p', '', m.reason));
      return;
    }
  }
});

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function render(): void {
  const list = document.getElementById('profiles');
  const extra = document.getElementById('extra');
  if (!list || !extra) return;
  list.replaceChildren();
  extra.replaceChildren();
  if (!state) return;

  for (const p of state.profiles) {
    const li = document.createElement('li');
    if (p.inheritsDefaultExtensions) {
      li.append(el('span', '', p.name), el('span', 'inherits', '(inherits Default)'));
    } else {
      const link = el('a', '', p.name) as HTMLAnchorElement;
      link.href = '#';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        vscode.postMessage({ type: 'openProfileReadOnly', profileId: p.id });
      });
      li.append(link);

      const edit = el('a', 'edit-icon', '✎') as HTMLAnchorElement;
      edit.href = '#';
      edit.tabIndex = 0;
      edit.title = 'Edit raw file — caution: VS Code owns this file';
      edit.setAttribute('role', 'button');
      edit.setAttribute('aria-label', `Edit raw file for ${p.name} — caution: VS Code owns this file`);
      const openEdit = (e: Event) => {
        e.preventDefault();
        vscode.postMessage({ type: 'editProfileFile', profileId: p.id });
      };
      edit.addEventListener('click', openEdit);
      edit.addEventListener('keydown', (e) => {
        const key = (e as KeyboardEvent).key;
        if (key === 'Enter' || key === ' ') openEdit(e);
      });
      li.append(edit);
    }
    li.append(el('span', 'counts', `(${p.direct} direct + ${p.shared} shared)`));
    list.append(li);
  }

  if (state.orphanCount > 0) {
    const line = el('p', '');
    const sizePart = orphanSizeText ? ` · ${orphanSizeText} reclaimable` : '';
    line.append(`${state.orphanCount} orphaned extension(s)${sizePart} — `);
    const link = el('a', '', 'Review…') as HTMLAnchorElement;
    link.href = '#';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      vscode.postMessage({ type: 'reviewOrphans' });
    });
    line.append(link);
    extra.append(line);
  }

  for (const w of state.warnings) {
    extra.append(el('p', 'warning-line', `⚠ ${w.file}: actions for affected profiles are disabled`));
  }
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

vscode.postMessage({ type: 'ready' });
