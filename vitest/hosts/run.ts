// Installs the packed Semi packages into real host apps (server-rendering frameworks and client-only bundlers) and
// checks dev and production the way a user would run them. Hosts are `vitest/<framework>/hosts/<host>/host.ts`.
// Usage: pnpm test:hosts [host...] [--full] [--keep]. Run after `pnpm build`; needs the network or a warm pnpm store.
// --keep leaves the work directory in place after a passing run, to start a host app by hand.
import assert from 'node:assert';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, stripVTControlCharacters } from 'node:util';
import { type Browser, chromium } from 'playwright';
import { consoleClean } from './checks.ts';
import type { Host, HostPage, ServerStep, Variant } from './types.ts';

type Status = 'PASS' | 'FAIL' | 'SKIP' | 'ENV' | 'XFAIL' | 'STALE';

interface Result {
    host: string;
    id: string;
    status: Status;
    detail: string;
    log?: string;
    issue?: string;
}

const rootDir = path.resolve(import.meta.dirname, '../..');
const COMMAND_TIMEOUT = 15 * 60_000;
const READY_TIMEOUT = 5 * 60_000;
const PAGE_TIMEOUT = 3 * 60_000;
const PROBE_TIMEOUT = 30_000;
const HYDRATION_TIMEOUT = 30_000;
const IDLE_TIMEOUT = 15_000;
const HYDRATION_WARNING = /hydrat|did not match|didn't match|server rendered|mismatch/i;
const LABELS: Record<Status, string> = { PASS: 'PASS', FAIL: 'FAIL', SKIP: 'SKIP', ENV: '环境', XFAIL: '预期失败', STALE: '清单过期' };

const { values: options, positionals: selected } = parseArgs({ allowPositionals: true, options: { full: { type: 'boolean', default: false }, keep: { type: 'boolean', default: false } } });

const discovered = fs
    .globSync('vitest/*/hosts/*/host.ts', { cwd: rootDir })
    .toSorted()
    .map((file) => {
        const [, framework, , name] = file.split(path.sep);
        return { file, framework, name };
    });
assert.ok(discovered.length > 0, 'no vitest/*/hosts/*/host.ts');
const duplicates = discovered.filter((entry, index) => discovered.findIndex(({ name }) => name === entry.name) !== index);
assert.deepEqual(duplicates, [], 'host names must be unique across frameworks');
const unknown = selected.filter((name) => !discovered.some((entry) => entry.name === name));
assert.deepEqual(unknown, [], `unknown hosts; known: ${discovered.map(({ name }) => name).join(', ')}`);
const targets = selected.length > 0 ? discovered.filter(({ name }) => selected.includes(name)) : discovered;

const packages = fs.readdirSync(path.join(rootDir, 'packages')).map((dir) => ({ dir, manifest: JSON.parse(fs.readFileSync(path.join(rootDir, 'packages', dir, 'package.json'), 'utf8')) as { name: string; private?: boolean } }));
const hasDist = (dir: string) => fs.existsSync(path.join(rootDir, 'packages', dir, 'dist'));
const unbuilt = packages.filter(({ dir, manifest }) => !manifest.private && !hasDist(dir));
// Private packages (the Solid ones, per X36) are not published yet but hosts install them; a private package without a
// dist is bundled into the packages that use it
const publishable = packages.filter(({ dir, manifest }) => !manifest.private || hasDist(dir));
if (unbuilt.length > 0) {
    console.error(`No dist/ in ${unbuilt.map(({ dir }) => dir).join(', ')}; run pnpm build first.`);
    process.exit(1);
}

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'semi-hosts-'));
const groups = new Set<number>();
function killGroups() {
    for (const pid of groups) {
        signalGroup(pid, 'SIGKILL');
    }
}
function signalGroup(pid: number, signal: NodeJS.Signals) {
    try {
        process.kill(-pid, signal);
    } catch (error) {
        // ESRCH: the group is gone; EPERM: macOS answers so for a group left with only zombies (all members are ours)
        if (!['ESRCH', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? '')) {
            throw error;
        }
    }
}
process.on('exit', killGroups);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(signal, () => {
        killGroups();
        console.log(`\n${signal}: 临时目录保留在 ${workDir}`);
        process.exit(128 + os.constants.signals[signal]);
    });
}

const tarballs: Record<string, string> = {};
for (const { dir, manifest } of publishable) {
    const destination = path.join(workDir, 'tarballs', dir);
    execFileSync('pnpm', ['pack', '--pack-destination', destination], { cwd: path.join(rootDir, 'packages', dir), stdio: ['ignore', 'ignore', 'inherit'] });
    tarballs[manifest.name] = `file:${path.join(destination, fs.readdirSync(destination)[0])}`;
}

function write(file: string, content: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function summary(error: unknown) {
    return (error instanceof Error ? error.message : String(error)).replaceAll(/\s+/g, ' ').slice(0, 600);
}

// A server-level failure only says "HTTP 500" or "exited with 1"; its cause is in the step's log
function failureText(detail: string, log?: string) {
    return stripVTControlCharacters(`${detail}\n${log == null ? '' : fs.readFileSync(log, 'utf8')}`);
}

interface Spawned {
    pid: number;
    exited: Promise<number | null>;
}

// Each command leads its own process group so dev servers' workers die with it
function start(command: string[], cwd: string, env: NodeJS.ProcessEnv, log: string): Spawned {
    const fd = fs.openSync(log, 'a');
    const child = spawn(command[0], command.slice(1), { cwd, env, detached: true, stdio: ['ignore', fd, fd] });
    fs.closeSync(fd);
    assert.ok(child.pid != null, `cannot spawn ${command[0]}`);
    const { pid } = child;
    groups.add(pid);
    const exited = new Promise<number | null>((resolve) => {
        child.on('exit', (code) => resolve(code));
        child.on('error', () => resolve(null));
    });
    return { pid, exited };
}

async function stop({ pid, exited }: Spawned) {
    signalGroup(pid, 'SIGTERM');
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 10_000))]);
    // Members that outlive the leader still share its group id
    signalGroup(pid, 'SIGKILL');
    groups.delete(pid);
}

async function exec(command: string[], cwd: string, env: NodeJS.ProcessEnv, log: string) {
    const spawned = start(command, cwd, env, log);
    let timedOut = false;
    const timer = setTimeout(() => {
        timedOut = true;
        signalGroup(spawned.pid, 'SIGKILL');
    }, COMMAND_TIMEOUT);
    const code = await spawned.exited;
    clearTimeout(timer);
    // Leftover members of the group, such as a build's worker pool
    signalGroup(spawned.pid, 'SIGKILL');
    groups.delete(spawned.pid);
    assert.ok(!timedOut, `${command.join(' ')} timed out after ${COMMAND_TIMEOUT / 60_000} min`);
    assert.equal(code, 0, `${command.join(' ')} exited with ${code}`);
}

function freePort() {
    return new Promise<number>((resolve, reject) => {
        const server = net.createServer();
        server.on('error', reject);
        server.listen(0, () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => resolve(port));
        });
    });
}

async function serve(step: ServerStep, cwd: string, env: NodeJS.ProcessEnv, log: string) {
    const port = await freePort();
    const baseUrl = `http://localhost:${port}`;
    const server = start(
        step.command.map((part) => part.replaceAll('{port}', String(port))),
        cwd,
        { ...env, PORT: String(port) },
        log
    );
    let exit: number | null | undefined;
    void server.exited.then((code) => (exit = code));
    const deadline = Date.now() + READY_TIMEOUT;
    // Readiness is any response on the first real page except 503, which is how a dev server says it is still
    // compiling; a 500 is a real answer and goes on to the page checks. Dev servers compile the page on this request
    while (true) {
        let ready = false;
        try {
            const response = await fetch(`${baseUrl}${step.pages[0]?.path ?? '/'}`, { signal: AbortSignal.timeout(PROBE_TIMEOUT) });
            await response.body?.cancel();
            ready = response.status !== 503;
        } catch {
            // not listening yet
        }
        // A strict-port server that lost the port exits; do not take the stranger that answered for it
        if (ready && exit === undefined) {
            return { server, baseUrl };
        }
        if (exit !== undefined || Date.now() > deadline) {
            await stop(server);
            throw new Error(exit === undefined ? `not ready after ${READY_TIMEOUT / 1000}s` : `exited with ${exit} before serving`);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
}

let browser: Browser | undefined;
// Printed by --keep: each variant's app directory and its dev command
const apps: string[] = [];

async function runHost({ file, framework, name }: (typeof targets)[number], results: Result[]) {
    const host = (await import(pathToFileURL(path.join(rootDir, file)).href)).default as Host;
    const variantNames = host.variants.map((variant) => variant.name);
    assert.ok(variantNames.length > 0 && new Set(variantNames).size === variantNames.length, `${file}: variant names must be present and unique`);
    const variants = options.full ? host.variants : host.variants.slice(0, 1);
    console.log(`\n${name} (${framework}): ${variants.map((variant) => variant.name).join(', ')}`);
    for (const variant of variants) {
        await runVariant(host, name, variant, results);
    }

    const ran = new Set(variants.map((variant) => variant.name));
    for (const entry of host.expectedFailures) {
        const variant = entry.check.split('/')[0];
        if ((ran.has(variant) || !variantNames.includes(variant)) && !results.some((result) => result.host === name && result.id === entry.check)) {
            const stale = { host: name, id: entry.check, status: 'STALE', detail: 'no such check', issue: entry.issue } as const;
            results.push(stale);
            console.log(`${pad(LABELS.STALE, 8)} ${name} ${stale.id}: ${stale.detail}`);
        }
    }
}

function serverIds(stepName: string, step: ServerStep) {
    return [stepName, ...step.pages.flatMap((page) => [`${stepName}/${page.name}`, ...[...page.checks, consoleClean].map((check) => `${stepName}/${page.name}/${check.name}`)]), ...(step.checks ?? []).map((check) => `${stepName}/${check.name}`)];
}

// CJK labels take two terminal columns each
function width(text: string) {
    return text.replaceAll(/[⺀-￿]/g, '  ').length;
}

function pad(text: string, columns: number) {
    return text + ' '.repeat(Math.max(columns - width(text), 0));
}

async function runVariant(host: Host, hostName: string, variant: Variant, results: Result[]) {
    const variantDir = path.join(workDir, hostName, variant.name);
    const appDir = path.join(variantDir, 'app');
    const envPrefix = Object.entries(variant.env ?? {}).map(([key, value]) => `${key}=${value} `);
    apps.push(`${hostName}/${variant.name}: ${appDir}${variant.dev ? `\n    ${envPrefix.join('')}${variant.dev.command.join(' ')}` : ''}`);
    const logDir = path.join(variantDir, 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const env = { ...process.env, ...variant.env, PATH: `${path.join(appDir, 'node_modules/.bin')}${path.delimiter}${process.env.PATH}` };
    const record = (id: string, status: Status, detail = '', log?: string) => {
        const fullId = `${variant.name}/${id}`;
        const entry = host.expectedFailures.find(({ check }) => check === fullId);
        const result: Result = { host: hostName, id: fullId, status, detail, log };
        if (entry != null && (status === 'FAIL' || status === 'PASS')) {
            result.issue = entry.issue;
            if (status === 'PASS') {
                result.status = 'STALE';
                result.detail = 'passes; remove it from expectedFailures';
            } else if (failureText(detail, log).includes(entry.evidence)) {
                result.status = 'XFAIL';
            } else {
                // A failure for another reason must not be filed under this entry's issue
                result.detail = `expected ${entry.issue} (${entry.evidence}) but it failed otherwise: ${detail}`;
            }
        }
        results.push(result);
        console.log(`${pad(LABELS[result.status], 8)} ${hostName} ${fullId}${result.detail && result.status !== 'SKIP' ? `: ${result.detail}` : ''}`);
    };
    const skip = (ids: string[], blocker: string) => {
        for (const id of ids) {
            record(id, 'SKIP', `blocked by ${variant.name}/${blocker}`);
        }
    };
    const check = async (id: string, log: string, run: () => Promise<void>) => {
        try {
            await run();
            record(id, 'PASS', '', log);
            return true;
        } catch (error) {
            record(id, 'FAIL', summary(error), log);
            return false;
        }
    };
    const devIds = variant.dev ? serverIds('dev', variant.dev) : [];
    const buildIds = variant.build ? ['build', ...(variant.build.checks ?? []).map((buildCheck) => `build/${buildCheck.name}`)] : [];
    const prodIds = variant.prod ? serverIds('prod', variant.prod) : [];
    const allIds = [...devIds, ...buildIds, ...prodIds];
    assert.equal(new Set(allIds).size, allIds.length, `${hostName}/${variant.name}: duplicate check ids: ${allIds.filter((id, index) => allIds.indexOf(id) !== index).join(', ')}`);

    const runPage = async (stepName: 'dev' | 'prod', page: HostPage, baseUrl: string, log: string) => {
        const pageId = `${stepName}/${page.name}`;
        const url = `${baseUrl}${page.path}`;
        browser ??= await chromium.launch({ headless: true });
        const context = await browser.newContext();
        try {
            const problems: string[] = [];
            const browserPage = await context.newPage();
            browserPage.on('console', (message) => {
                if (message.type() === 'error' || HYDRATION_WARNING.test(message.text())) {
                    problems.push(`[${message.type()}] ${message.text().slice(0, 400)}`);
                }
            });
            browserPage.on('pageerror', (error) => problems.push(`[pageerror] ${error.message.slice(0, 400)}`));
            let html: string;
            try {
                const response = await fetch(url, { signal: AbortSignal.timeout(PAGE_TIMEOUT) });
                html = await response.text();
                assert.ok(response.ok, `HTTP ${response.status}`);
                // Not networkidle: a worker loaded from a blob: URL stays an open request, so the network never idles
                await browserPage.goto(url, { waitUntil: 'load', timeout: PAGE_TIMEOUT });
                if (stepName === 'dev') {
                    // shortcut: a dev bundler's dependency optimizer may reload the page on the first visit, so dev pages
                    // are checked on a reload; drop it once a host's dev server stops discovering deps at runtime. Wait
                    // for the network first so the optimizer has seen the page's imports, but only briefly: blob: workers
                    // keep it from ever idling
                    await browserPage.waitForLoadState('networkidle', { timeout: IDLE_TIMEOUT }).catch((): void => undefined);
                    problems.length = 0;
                    await browserPage.reload({ waitUntil: 'load', timeout: PAGE_TIMEOUT });
                }
                await browserPage
                    .locator(page.ready)
                    .waitFor({ state: 'attached', timeout: HYDRATION_TIMEOUT })
                    .catch(() => assert.fail(`no ${page.ready} after ${HYDRATION_TIMEOUT / 1000}s, the page did not hydrate${problems.length > 0 ? `: ${problems.join('; ')}` : ''}`));
            } catch (error) {
                record(pageId, 'FAIL', summary(error), log);
                skip(
                    [...page.checks, consoleClean].map((pageCheck) => `${pageId}/${pageCheck.name}`),
                    pageId
                );
                return;
            }
            record(pageId, 'PASS', '', log);
            for (const pageCheck of [...page.checks, consoleClean]) {
                await check(`${pageId}/${pageCheck.name}`, log, () => pageCheck.run({ url, html, page: browserPage, problems }));
            }
        } finally {
            await context.close();
        }
    };

    const runServer = async (stepName: 'dev' | 'prod', step: ServerStep) => {
        const log = path.join(logDir, `${stepName}.log`);
        let served: Awaited<ReturnType<typeof serve>>;
        try {
            served = await serve(step, appDir, env, log);
            record(stepName, 'PASS', '', log);
        } catch (error) {
            record(stepName, 'FAIL', summary(error), log);
            skip(serverIds(stepName, step).slice(1), stepName);
            return;
        }
        try {
            for (const page of step.pages) {
                await runPage(stepName, page, served.baseUrl, log);
            }
            for (const serverCheck of step.checks ?? []) {
                await check(`${stepName}/${serverCheck.name}`, log, () => serverCheck.run({ appDir, baseUrl: served.baseUrl }));
            }
        } finally {
            await stop(served.server);
        }
    };

    const installLog = path.join(logDir, 'install.log');
    const deps = { ...host.deps, ...variant.deps };
    const missing = Object.keys(deps).filter((dep) => dep.startsWith('@fibrae/') && tarballs[dep] == null);
    if (missing.length > 0) {
        // The package under test is absent from the packed set: a product failure, not the environment's
        record('install', 'FAIL', `not in the packed packages: ${missing.join(', ')}`);
        skip([...devIds, ...buildIds, ...prodIds], 'install');
        return;
    }
    for (const [file, content] of Object.entries({ ...host.files, ...variant.files })) {
        write(path.join(appDir, file), content);
    }
    const dependencies = Object.fromEntries(Object.entries(deps).map(([dep, version]) => [dep, tarballs[dep] ?? version]));
    write(path.join(appDir, 'package.json'), JSON.stringify({ name: `semi-host-${hostName}`, private: true, type: 'module', dependencies }, null, 4));
    const allowBuilds = { esbuild: true, '@parcel/watcher': false, ...host.allowBuilds };
    write(
        path.join(appDir, 'pnpm-workspace.yaml'),
        [
            // The tarballs depend on each other by version; point those ranges at the local tarballs too
            'overrides:',
            ...Object.entries(tarballs).map(([dep, spec]) => `  '${dep}': '${spec}'`),
            'allowBuilds:',
            ...Object.entries(allowBuilds).map(([dep, allowed]) => `  '${dep}': ${allowed}`),
            '',
        ].join('\n')
    );
    try {
        await exec(['pnpm', 'install', '--prefer-offline'], appDir, env, installLog);
        record('install', 'PASS', '', installLog);
    } catch (error) {
        // Semi packages are checked above, so what is left is the registry, the network or the store. shortcut: a pinned
        // third-party version the registry lacks lands here too; split it out if hosts start hitting that
        record('install', 'ENV', summary(error), installLog);
        skip([...devIds, ...buildIds, ...prodIds], 'install');
        return;
    }

    if (variant.dev) {
        await runServer('dev', variant.dev);
    }
    let built = true;
    const { build } = variant;
    if (build) {
        const buildLog = path.join(logDir, 'build.log');
        built = await check('build', buildLog, () => exec(build.command, appDir, env, buildLog));
        if (built) {
            for (const buildCheck of build.checks ?? []) {
                await check(`build/${buildCheck.name}`, buildLog, () => buildCheck.run({ appDir }));
            }
        } else {
            skip(buildIds.slice(1), 'build');
        }
    }
    if (variant.prod) {
        if (built) {
            await runServer('prod', variant.prod);
        } else {
            skip(prodIds, 'build');
        }
    }
}

const results: Result[] = [];
let crashed = false;
try {
    for (const target of targets) {
        await runHost(target, results);
    }
} catch (error) {
    // Keep what already ran visible: the summary below still prints and the work directory stays
    crashed = true;
    console.error(error);
} finally {
    await browser?.close();
}

const rows = results.map((result) => {
    const [variant, ...rest] = result.id.split('/');
    return [result.host, variant, rest.join('/'), LABELS[result.status], result.issue ?? '', result.status === 'SKIP' ? result.detail : ''];
});
const header = ['宿主', '变体', '检查', '结果', '问题', '说明'];
const widths = header.map((title, column) => Math.max(width(title), ...rows.map((row) => width(row[column]))));
console.log(`\n${[header, ...rows].map((row) => row.map((cell, column) => pad(cell, widths[column])).join('  ')).join('\n')}`);

const broken = results.filter(({ status }) => status === 'FAIL' || status === 'STALE' || status === 'ENV');
if (broken.length > 0 || crashed) {
    console.log('\n未通过：');
    for (const result of broken) {
        console.log(`${LABELS[result.status]} ${result.host} ${result.id}: ${result.detail}${result.log ? `\n    日志 ${result.log}` : ''}`);
    }
    console.log(`\n临时目录保留在 ${workDir}`);
    process.exitCode = 1;
} else if (options.keep) {
    // Commands resolve against the app's node_modules/.bin and start with the variant's env; replace {port} with a free port
    console.log(`\n临时目录保留在 ${workDir}\n在 app 目录中把 node_modules/.bin 放进 PATH 后执行 dev 命令（{port} 换成空闲端口）：\n${apps.join('\n')}`);
} else {
    execFileSync('trash', [workDir]);
}
