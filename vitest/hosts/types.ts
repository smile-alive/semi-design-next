// Contract between the host runner (run.ts) and each `vitest/<framework>/hosts/<host>/host.ts`. A host's name and
// framework come from that path.
import type { Page } from 'playwright';

// File path relative to the host app directory -> file content
export type Files = Record<string, string>;

export interface BuildContext {
    appDir: string;
}

export interface ServerContext {
    appDir: string;
    // `http://localhost:<port>`, without a trailing slash
    baseUrl: string;
}

export interface PageContext {
    url: string;
    // The server response body, before any script runs
    html: string;
    // The hydrated page; checks run in list order on this one page
    page: Page;
    // Console errors, pageerrors and hydration warnings seen since the page loaded
    problems: string[];
}

// A check fails by throwing; its id is `<step id>/<name>`, so names are known before anything runs
export interface Check<Context> {
    name: string;
    run(context: Context): Promise<void>;
}

export type BuildCheck = Check<BuildContext>;
export type ServerCheck = Check<ServerContext>;
export type PageCheck = Check<PageContext>;

export interface HostPage {
    // Id segment of the page's checks; the path is not used there because it contains `/`
    name: string;
    path: string;
    // CSS selector of an element the app adds only after hydration (set it from an effect or mount hook). Checks start
    // once it is attached, so they never run against the unhydrated server markup
    ready: string;
    checks: PageCheck[];
}

export interface ServerStep {
    // `{port}` is replaced by a free port, which is also passed as the PORT environment variable. Commands resolve
    // against the app's node_modules/.bin. Pass the framework's strict-port flag: a server that silently picks another
    // port when this one is taken would leave the runner probing a stranger's server
    command: string[];
    pages: HostPage[];
    checks?: ServerCheck[];
}

export interface BuildStep {
    command: string[];
    checks?: BuildCheck[];
}

export interface Variant {
    name: string;
    // Added to, or replacing, the host's files
    files?: Files;
    env?: Record<string, string>;
    // Added to, or replacing, the host's deps
    deps?: Record<string, string>;
    dev?: ServerStep;
    build?: BuildStep;
    // Production server; runs only after `build` passes
    prod?: ServerStep;
}

export interface ExpectedFailure {
    // Full check id, `<variant>/<step>[/<page>][/<check>]`
    check: string;
    // Heading of the docs/component-issues.md section that records the issue, such as `Tooltip（及 Popover、Dropdown）`
    issue: string;
    // Text the failure message or the step's log must contain. Without it a failure whose cause changed (another
    // issue surfacing behind the recorded one) would still be filed under this entry
    evidence: string;
}

export interface Host {
    // Pinned dependency versions; `@fibrae/semi-*` entries are replaced by the packed tarballs, write them as `*`
    deps: Record<string, string>;
    // Dependencies whose install scripts pnpm may run, added to the defaults
    allowBuilds?: Record<string, boolean>;
    files: Files;
    // The first variant is the smoke run; `--full` runs all of them
    variants: Variant[];
    expectedFailures: ExpectedFailure[];
}
