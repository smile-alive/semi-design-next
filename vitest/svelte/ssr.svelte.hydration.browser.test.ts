import { flushSync, hydrate, unmount } from 'svelte';
import { expect, inject, it, vi } from 'vite-plus/test';
import SsrRoot from './__probes__/ssr-root.svelte';

it('服务端 HTML 可无告警 hydrate；$props.id 两端一致；子项自注册在服务端首帧缺失、hydrate 后补上', async () => {
    const { body } = inject('svelteSsr');
    const target = document.createElement('div');
    target.innerHTML = body;
    document.body.append(target);

    const server = new DOMParser().parseFromString(body, 'text/html');
    const serverIds = [...server.querySelectorAll('[data-case="id"] input')].map((input) => input.id);
    const serverTabs = [...server.querySelectorAll('[data-case="tabs"] [role="tab"]')].map((tab) => tab.textContent);
    const tablist = server.querySelector('[role="tablist"]') as HTMLElement;

    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    const app = hydrate(SsrRoot, { target });
    flushSync();

    const clientIds = [...target.querySelectorAll('[data-case="id"] input')].map((input) => input.id);
    const clientTabs = [...target.querySelectorAll('[data-case="tabs"] [role="tab"]')].map((tab) => tab.textContent);

    // reported to the test log, so the summary shows what each side produced
    console.info(JSON.stringify({ serverIds, clientIds, serverTabs, clientTabs, snippetType: tablist.getAttribute('data-snippet-type'), snippetKeys: tablist.getAttribute('data-snippet-keys') }));

    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/hydration/i);
    expect(error).not.toHaveBeenCalled();
    expect(serverIds).toHaveLength(2);
    expect(new Set(serverIds).size).toBe(2);
    expect(clientIds).toEqual(serverIds);
    expect(tablist.getAttribute('data-snippet-type')).toBe('function');
    // the server snippet carries only a dev toString: nothing exposes the children's props
    expect(tablist.getAttribute('data-snippet-keys')).not.toMatch(/title|props|children/);
    expect(serverTabs).toEqual([]);
    expect(clientTabs).toEqual(['one', 'two']);
    await unmount(app);
});
