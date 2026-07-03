import { describe, expect, it } from 'vitest';
import { composeInventory } from '../../src/core/inventory';
import type { ManifestEntry, RawProfile } from '../../src/core/parsers';

const entry = (id: string, version: string, appScoped = false): ManifestEntry => ({
  id,
  version,
  relativeLocation: `${id}-${version}`,
  isApplicationScoped: appScoped,
});

const baseInput = () => ({
  rawProfiles: [
    { location: 'aaa', name: 'Work', inheritsDefaultExtensions: false },
    { location: 'builtin/agents', name: 'Agents', inheritsDefaultExtensions: true },
  ] as RawProfile[],
  defaultManifest: [entry('pub.everywhere', '1.0.0', true), entry('pub.default-only', '2.0.0')] as ManifestEntry[] | Error,
  profileManifests: new Map<string, ManifestEntry[] | Error>([['aaa', [entry('pub.work-only', '3.0.0')]]]),
  diskFolders: [
    'pub.everywhere-1.0.0',
    'pub.default-only-2.0.0',
    'pub.work-only-3.0.0',
    'pub.orphan-9.9.9',
  ],
  obsoleteFolderNames: [] as string[],
  displayNames: new Map<string, string>([['pub.everywhere', 'Everywhere!']]),
  extensionsDir: '/x',
});

describe('composeInventory', () => {
  it('lists default profile first, then registry profiles', () => {
    const inv = composeInventory(baseInput());
    expect(inv.profiles.map((p) => p.id)).toEqual(['default', 'aaa', 'builtin/agents']);
    expect(inv.profiles[0]?.isDefault).toBe(true);
    expect(inv.profiles[2]?.inheritsDefaultExtensions).toBe(true);
  });

  it('marks app-scoped extensions installed in every profile', () => {
    const inv = composeInventory(baseInput());
    const everywhere = inv.extensions.find((e) => e.id === 'pub.everywhere');
    expect(everywhere?.applyToAllProfiles).toBe(true);
    expect(everywhere?.installedIn).toEqual(['default', 'aaa', 'builtin/agents']);
    expect(everywhere?.displayName).toBe('Everywhere!');
  });

  it('propagates default membership to inheriting profiles', () => {
    const inv = composeInventory(baseInput());
    const defOnly = inv.extensions.find((e) => e.id === 'pub.default-only');
    expect(defOnly?.installedIn).toEqual(['default', 'builtin/agents']);
  });

  it('flags orphans: on disk, in no profile, not app-scoped', () => {
    const inv = composeInventory(baseInput());
    const orphan = inv.extensions.find((e) => e.id === 'pub.orphan');
    expect(orphan?.orphaned).toBe(true);
    expect(orphan?.installedIn).toEqual([]);
    expect(orphan?.versions).toEqual([
      { version: '9.9.9', folderName: 'pub.orphan-9.9.9', fsPath: '/x/pub.orphan-9.9.9' },
    ]);
    expect(inv.extensions.filter((e) => e.orphaned)).toHaveLength(1);
  });

  it('does not flag obsolete folders as orphans', () => {
    const input = baseInput();
    input.obsoleteFolderNames = ['pub.orphan-9.9.9'];
    const inv = composeInventory(input);
    expect(inv.extensions.find((e) => e.id === 'pub.orphan')).toBeUndefined();
  });

  it('turns a failed profile manifest into a warning and disables that profile', () => {
    const input = baseInput();
    input.profileManifests.set('aaa', new Error('boom'));
    const inv = composeInventory(input);
    expect(inv.warnings).toHaveLength(1);
    expect(inv.warnings[0]?.affectedProfileIds).toEqual(['aaa']);
    expect(inv.extensions.find((e) => e.id === 'pub.work-only')).toBeUndefined();
  });

  it('falls back to id as displayName', () => {
    const inv = composeInventory(baseInput());
    expect(inv.extensions.find((e) => e.id === 'pub.default-only')?.displayName).toBe('pub.default-only');
  });

  it('sorts extensions by displayName, case-insensitive', () => {
    const inv = composeInventory(baseInput());
    const names = inv.extensions.map((e) => e.displayName.toLowerCase());
    expect(names).toEqual([...names].sort());
  });
});
