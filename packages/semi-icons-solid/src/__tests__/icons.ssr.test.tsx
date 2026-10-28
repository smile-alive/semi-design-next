import type { Component } from 'solid-js';
import { expect, it } from 'vite-plus/test';
import { renderServer } from '@test/solid/ssr.solid';
import * as icons from '..';

it('icons/全部导出', async () => {
    const named = Object.entries(icons).filter(([name]) => name !== 'default' && name !== 'IconSlotContext') as [string, Component][];
    expect(named.length).toBeGreaterThan(0);
    const failed: string[] = [];
    for (const [name, Icon] of named) {
        const { html, errors } = await renderServer({ render: () => <Icon /> });
        if (errors.length || !html.includes('<svg')) {
            failed.push(name);
        }
    }
    expect(failed).toEqual([]);
});
