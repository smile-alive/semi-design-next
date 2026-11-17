// Prints the GitHub Release body of one version, merged from every package's CHANGELOG.md.
// Usage: node scripts/release-notes.ts <version>
// Output: Markdown on stdout; the release workflow passes it to `gh release create --notes-file`.
import fs from 'node:fs';
import path from 'node:path';
import { gitFiles } from './lib/git-files.ts';
import { root } from './lib/paths.ts';

const HEADINGS = ['### Major Changes', '### Minor Changes', '### Patch Changes'];
// "Updated dependencies [hash]" with the bumped packages nested, or a bare `- @scope/name@version` when the bump has no commit
const dependencyEntry = /^- (?:Updated dependencies|@[\w-]+\/[\w.-]+@\S+$)/;

/** The body of one version's section in a Changesets CHANGELOG.md, without its `## <version>` line; '' when absent */
export function changelogSection(changelog: string, version: string) {
    const lines = changelog.split('\n');
    const start = lines.indexOf(`## ${version}`);
    if (start === -1) return '';
    const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
    return lines.slice(start + 1, end === -1 ? undefined : end).join('\n');
}

/**
 * Merges the per-package sections of one release into one body: `fixed` versioning copies every changeset into each
 * package it touches, so identical entries collapse, and the dependency entries drop out.
 */
export function mergeNotes(sections: string[]) {
    const groups = new Map(HEADINGS.map((heading) => [heading, new Set<string>()]));
    for (const section of sections) {
        let group: Set<string> | undefined;
        let entry: string[] = [];
        const flush = () => {
            const text = entry.join('\n').trimEnd();
            if (text && !dependencyEntry.test(text.split('\n', 1)[0])) group?.add(text);
            entry = [];
        };
        for (const line of section.split('\n')) {
            if (line.startsWith('### ')) {
                flush();
                group = groups.get(line.trim());
                if (!group) throw new Error(`Unknown changelog heading: ${line}`);
            } else if (line.startsWith('- ')) {
                flush();
                entry.push(line);
            } else if (entry.length) {
                entry.push(line);
            }
        }
        flush();
    }
    const body = [...groups]
        .filter(([, entries]) => entries.size)
        .map(([heading, entries]) => `${heading}\n\n${[...entries].join('\n\n')}`)
        .join('\n\n');
    if (!body) throw new Error('No changelog entries besides dependency updates');
    return `${body}\n`;
}

if (import.meta.main) {
    const version = process.argv[2];
    if (!version) throw new Error('Usage: node scripts/release-notes.ts <version>');
    const sections = gitFiles('packages/**/CHANGELOG.md').map((file) => changelogSection(fs.readFileSync(path.join(root, file), 'utf8'), version));
    process.stdout.write(mergeNotes(sections));
}
