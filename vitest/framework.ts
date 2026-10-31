import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { TestProjectInlineConfiguration } from 'vite-plus';
import { defineBrowserCommand, playwright } from 'vite-plus/test/browser-playwright';
import { semiCssLayer, semiScssOptions } from '../vite.semi.ts';

// Real mouse input, one step per call so a test can assert mid-drag: userEvent only drags atomically and CDP is Chromium-only
const mouse = defineBrowserCommand<['move' | 'down' | 'up', number, number]>(async ({ page }, type, x, y) => {
    await page.mouse.move(x, y);
    if (type !== 'move') {
        await page.mouse[type]();
    }
});

interface Threshold {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
}

// The only shape a framework module hands to vitest/index.ts
export interface TestFramework {
    projects: TestProjectInlineConfiguration[];
    // A framework without a coverage gate leaves this out
    coverage?: { include: string[]; exclude: string[]; thresholds?: Record<string, Threshold> };
}

export const browserStyles = { preprocessorOptions: { scss: semiScssOptions }, postcss: { plugins: [semiCssLayer] } };

// Date expectations assume one zone
export const jsdomBase = {
    env: { TZ: 'Asia/Shanghai' },
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    exclude: ['**/node_modules/**', '**/*.browser.test.*', '**/*.ssr.test.*'],
    sequence: { groupOrder: 0 },
};

// Server rendering has no DOM globals, so neither jsdom nor vitest.setup.ts (which patches them) is loaded
export const nodeBase = {
    env: { TZ: 'Asia/Shanghai' },
    environment: 'node',
    exclude: ['**/node_modules/**'],
    sequence: { groupOrder: 0 },
};

const launchOptions = {
    // gc() lets tests assert that detached DOM is collected; the flag is V8's
    chromium: () => ({ args: ['--js-flags=--expose-gc'] }),
    // macOS 27 denies a terminal-launched Firefox its shared app-data dir and Firefox exits with "Could not find
    // profile folder" (https://github.com/microsoft/playwright/issues/42768); a private home avoids it.
    // Delete once Playwright ships Firefox 158, which has the upstream fix
    firefox: () => {
        const home = join(import.meta.dirname, '../tmp/vitest-firefox-home');
        mkdirSync(home, { recursive: true });
        return { env: { ...process.env, CFFIXED_USER_HOME: home } };
    },
    webkit: () => ({}),
};

// Returns a new object per call: vitest writes the project name into each instance object, so projects cannot share one
export function browserBase(browser: 'chromium' | 'firefox' | 'webkit' = 'chromium') {
    return {
        fileParallelism: false,
        browser: {
            enabled: true,
            provider: playwright({ launchOptions: launchOptions[browser]() }),
            headless: true,
            instances: [{ browser }],
            commands: { mouse },
            viewport: { width: 1000, height: 660 },
        },
        // Alongside instrumented jsdom workers (test:coverage) browser files time out
        sequence: { groupOrder: 1 },
    };
}

// A file belongs to a framework's tests by name: its package's __tests__, or a __tests__ file named <id>.* or *.<id>.*
function filesOfKind(id: string, kind: string) {
    return [`packages/semi-*-${id}/**/__tests__/**/*.${kind}.{ts,tsx}`, `packages/**/__tests__/**/{${id},*.${id}}.*${kind}.{ts,tsx}`];
}

export function testFiles(id: string, browser: boolean) {
    return filesOfKind(id, browser ? 'browser.test' : 'test');
}

export function ssrTestFiles(id: string) {
    return filesOfKind(id, 'ssr.test');
}

// Components with a fallback path for browsers below the latest Chrome (D15); on Firefox and Safari that path is the main one
const compatComponents = '{audio-player,checkbox,collapsible,dropdown,input,json-viewer,modal,navigation,notification,popconfirm,popover,scroll-list,select,side-sheet,slider,table,tabs,tag-input,toast,tooltip,video-player}';

/** Firefox and WebKit copies of a framework's browser project, limited to the components above; a factory, since plugin instances keep per-project state */
export function compatBrowserProjects(id: string, browserProject: () => TestProjectInlineConfiguration): TestProjectInlineConfiguration[] {
    return (['firefox', 'webkit'] as const).map((browser) => {
        const project = browserProject();
        return {
            ...project,
            test: {
                ...project.test,
                ...browserBase(browser),
                name: `${id}-${browser}-browser`,
                include: [`packages/semi-*-${id}/src/${compatComponents}/__tests__/**/*.browser.test.{ts,tsx}`],
                // gc() exists only under Chromium's --expose-gc
                exclude: ['**/node_modules/**', '**/*-gc.browser.test.*', '**/*.hydration.browser.test.*'],
            },
        };
    });
}
