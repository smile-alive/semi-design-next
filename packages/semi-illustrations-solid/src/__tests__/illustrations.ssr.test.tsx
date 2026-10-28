import type { Component } from 'solid-js';
import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import * as illustrations from '..';

it('illustrations/全部导出', async () => {
    const named = Object.entries(illustrations) as [string, Component][];
    expect(named.length).toBeGreaterThan(0);
    const failed: string[] = [];
    for (const [name, Illustration] of named) {
        const { html, errors } = await renderServer({ render: () => <Illustration /> });
        if (errors.length || !html.includes('<svg')) {
            failed.push(name);
        }
    }
    expect(failed).toEqual([]);
});
