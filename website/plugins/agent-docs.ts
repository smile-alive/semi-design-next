import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { siteDocs } from '../scripts/agent-docs.ts';

// Written after the build rather than served by an endpoint: the generator resolves content paths from its own module
// location, which a bundled prerender chunk would move
export default function agentDocs(): AstroIntegration {
    return {
        name: 'semi:agent-docs',
        hooks: {
            'astro:build:done': ({ dir, logger }) => {
                const out = fileURLToPath(dir);
                const files = siteDocs();
                for (const [file, content] of files) {
                    fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
                    fs.writeFileSync(path.join(out, file), content);
                }
                logger.info(`${files.size} agent docs written`);
            },
        },
    };
}
