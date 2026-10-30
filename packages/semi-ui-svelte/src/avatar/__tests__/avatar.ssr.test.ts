import { render } from 'svelte/server';
import { describe, expect, it } from 'vite-plus/test';
import GroupFixture from './group-fixture.svelte';

describe('Svelte Avatar 服务端首帧', () => {
    it('AvatarGroup 首帧带重叠类与按 maxCount 计算的 +N 头像', () => {
        const { body } = render(GroupFixture, { props: { store: { maxCount: 3 } } });
        expect(body).toContain('semi-avatar-item-start-2');
        expect(body).not.toContain('semi-avatar-item-start-4');
        expect(body).toContain('semi-avatar-item-more');
        expect(body).toContain('LL0');
        expect(body).toContain('+2');
        expect(body).toContain('另有 2 个头像: ZL,YZ');
    });
});
