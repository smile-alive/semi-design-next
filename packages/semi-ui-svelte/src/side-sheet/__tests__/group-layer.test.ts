import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vite-plus/test';
import GroupLayer from './group-layer.svelte';

describe('Svelte SideSheet 与 ButtonGroup', () => {
    it('放在 ButtonGroup 内时，抽屉中的 Button 不继承组的配置', async () => {
        render(GroupLayer);
        const button = await screen.findByRole('button', { name: 'in sheet' });
        expect(button).toBeEnabled();
        expect(button).toHaveClass('semi-button-primary');
    });
});
