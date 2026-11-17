import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './paths.ts';

/** Tracked and untracked non-ignored files matching the pathspecs (all when none), relative to the repo root */
export function gitFiles(...pathspecs: string[]) {
    return (
        execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...pathspecs], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
            .split('\n')
            // --cached still lists files deleted in the worktree but not yet staged
            .filter((file) => file && fs.existsSync(path.join(root, file)))
    );
}
