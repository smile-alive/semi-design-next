import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vite-plus/test';
import { Dropdown } from '@fibrae/semi-ui-react';

describe('Dropdown 按 elementType 识别 Dropdown.Item', () => {
    it('Dropdown.Item 的 elementType 为 Dropdown.Item', () => {
        expect(Dropdown.Item.elementType).toBe('Dropdown.Item');
    });

    it('声明 elementType 为 Dropdown.Item 的触发器带菜单按钮属性', () => {
        const MyItem = Object.assign((props: ComponentProps<'li'>) => <li {...props} role="menuitem" />, { elementType: 'Dropdown.Item' });
        render(
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>inner</Dropdown.Item>
                    </Dropdown.Menu>
                }
            >
                <MyItem>own item</MyItem>
            </Dropdown>
        );
        expect(screen.getByText('own item')).toHaveAttribute('aria-haspopup', 'menu');
        expect(screen.getByText('own item')).toHaveAttribute('aria-expanded', 'false');
    });

    it('声明 elementType 为 Dropdown.Item 的 disabled 触发器不打开子菜单', async () => {
        const MyItem = Object.assign(({ disabled, ...props }: ComponentProps<'li'> & { disabled?: boolean }) => <li {...props} aria-disabled={disabled} role="menuitem" />, { elementType: 'Dropdown.Item' });
        render(
            <Dropdown
                motion={false}
                render={
                    <Dropdown.Menu>
                        <Dropdown.Item>inner</Dropdown.Item>
                    </Dropdown.Menu>
                }
                trigger="click"
            >
                <MyItem disabled>disabled item</MyItem>
            </Dropdown>
        );
        await userEvent.setup({ pointerEventsCheck: 0 }).click(screen.getByText('disabled item'));
        expect(screen.queryByText('inner')).toBeNull();
    });
});
