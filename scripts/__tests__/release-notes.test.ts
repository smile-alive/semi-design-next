import { describe, expect, it } from 'vitest';
import { changelogSection, mergeNotes } from '../release-notes.ts';

const ui = `# @fibrae/semi-ui-react

## 0.2.0

### Minor Changes

- aaa: Adds X.

    - detail one

### Patch Changes

- bbb: Fixes Y.
- Updated dependencies [aaa]
    - @fibrae/semi-foundation@0.2.0

## 0.1.0

### Patch Changes

- ccc: Old.
`;

const foundation = `# @fibrae/semi-foundation

## 0.2.0

### Patch Changes

- ddd: Fixes Z.
- bbb: Fixes Y.
- @fibrae/semi-icons-core@0.2.0
`;

describe('release notes', () => {
    it('cuts one version section out of a changelog', () => {
        expect(changelogSection(ui, '0.1.0')).toBe('\n### Patch Changes\n\n- ccc: Old.\n');
        expect(changelogSection(ui, '9.9.9')).toBe('');
    });

    it('merges sections in Major, Minor, Patch order, dropping duplicates and dependency updates', () => {
        const merged = mergeNotes([changelogSection(foundation, '0.2.0'), changelogSection(ui, '0.2.0')]);
        expect(merged).toBe('### Minor Changes\n\n- aaa: Adds X.\n\n    - detail one\n\n### Patch Changes\n\n- ddd: Fixes Z.\n\n- bbb: Fixes Y.\n');
    });

    it('fails when only dependency updates remain', () => {
        expect(() => mergeNotes(['### Patch Changes\n\n- Updated dependencies [aaa]\n'])).toThrow('No changelog entries besides dependency updates');
    });
});
