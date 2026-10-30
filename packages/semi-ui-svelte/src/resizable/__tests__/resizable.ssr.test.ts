import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import Box from './box.svelte';
import Group from './group.svelte';

describe('Svelte Resizable 服务端渲染', () => {
    it('Resizable 首帧输出 defaultSize 的尺寸与八个手柄', () => {
        const { body } = render(Box, { props: { defaultSize: { width: 200, height: 100 } } });
        expect(body).toContain('width:200px');
        expect(body).toContain('height:100px');
        expect(body.match(/semi-resizable-resizableHandler-/g)).toHaveLength(8);
    });

    it('ResizeGroup 首帧输出各项与手柄', () => {
        const { body } = render(Group);
        expect(body).toContain('semi-resizable-group');
        expect(body.match(/semi-resizable-item/g)).toHaveLength(2);
        expect(body).toContain('role="separator"');
    });
});
