import { Activity } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import Button from '@fibrae/semi-ui-react/button';
import Dropdown from '../index';

const menu = (
    <Dropdown.Menu>
        <Dropdown.Item>first</Dropdown.Item>
        <Dropdown.Item>second</Dropdown.Item>
    </Dropdown.Menu>
);

describe('Activity 隐藏打开中的 Dropdown', () => {
    it('非受控时重新显示后菜单关闭，触发器复位 aria-expanded，ArrowDown 能再次打开', async () => {
        const view = (mode: 'visible' | 'hidden') => (
            <Activity mode={mode}>
                <Dropdown motion={false} render={menu} trigger="click">
                    <Button>trigger</Button>
                </Dropdown>
            </Activity>
        );
        const { rerender } = render(view('visible'));
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await waitFor(() => expect(screen.getByRole('menu')).toBeVisible());

        rerender(view('hidden'));
        rerender(view('visible'));
        await act(async () => {});
        const trigger = screen.getByRole('button', { name: 'trigger' });
        expect(screen.queryByRole('menu')).toBeNull();
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).not.toHaveClass(`${BASE_CLASS_PREFIX}-dropdown-showing`);

        trigger.focus();
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(() => expect(screen.getByRole('menuitem', { name: 'first' })).toHaveFocus());
    });
});
