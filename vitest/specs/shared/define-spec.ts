import { describe, it } from 'vite-plus/test';

/** What a framework fixture provides: mount the component with these props and keep a handle to drive it */
export type SpecMount<P> = (props: P) => SpecHandle<P> | Promise<SpecHandle<P>>;

export interface SpecHandle<P> {
    container: HTMLElement;
    /** Merges `props` into the current props (a key set to `undefined` is passed as `undefined`) and resolves after the framework has re-rendered */
    update(props: Partial<P>): Promise<void>;
    unmount(): void;
}

export interface SpecOptions {
    /** Titles of cases this framework still fails; they run as `it.fails` and must be removed once fixed */
    fails?: string[];
}

export type SpecTest = (title: string, body: () => void | Promise<void>) => void;

/** Declares a spec's cases under one `describe`; an unknown title in `fails` throws so the list cannot go stale */
export function defineSpec(name: string, { fails = [] }: SpecOptions, declare: (test: SpecTest) => void) {
    describe(name, () => {
        const titles: string[] = [];
        declare((title, body) => {
            titles.push(title);
            (fails.includes(title) ? it.fails : it)(title, body);
        });
        const unknown = fails.filter((title) => !titles.includes(title));
        if (unknown.length > 0) {
            throw new Error(`${name} 的 fails 里有不存在的用例：${unknown.join('、')}`);
        }
    });
}
