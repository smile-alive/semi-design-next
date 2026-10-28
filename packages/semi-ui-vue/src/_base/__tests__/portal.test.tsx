/** @jsxImportSource vue */
import { KeepAlive, defineComponent, nextTick, shallowRef, type VNode } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from '@test/utils/vue';
import ButtonGroup from '../../button/button-group.vue';
import Button from '../../button/button.vue';
import ConfigProvider from '../../config-provider/config-provider.vue';
import Portal from '../portal.vue';

const portalOf = (text: string) => screen.getByText(text).closest<HTMLElement>('.semi-portal');

describe('Portal', () => {
    it('挂载后才渲染到 body，外层带 .semi-portal 与 zIndex，插槽收到 inBody', async () => {
        const slot = vi.fn<(props: { inBody: boolean }) => VNode>(() => <p>inside</p>);
        render(() => <Portal zIndex={1000}>{{ default: slot }}</Portal>);
        await nextTick();
        const portal = portalOf('inside');
        expect(portal?.parentElement).toBe(document.body);
        expect(portal?.style.zIndex).toBe('1000');
        expect(portal?.style.position).toBe('');
        expect(slot).toHaveBeenLastCalledWith({ inBody: true });
    });

    it('自定义容器时外层 position 为 static，插槽收到 inBody 为 false', async () => {
        const container = document.createElement('div');
        document.body.append(container);
        render(() => <Portal getPopupContainer={() => container}>{() => <p>custom</p>}</Portal>);
        await nextTick();
        expect(portalOf('custom')?.parentElement).toBe(container);
        expect(portalOf('custom')?.style.position).toBe('static');
        container.remove();
    });

    it('没有自身函数时用 ConfigProvider 的 getPopupContainer，并输出它的 dir', async () => {
        const container = document.createElement('div');
        document.body.append(container);
        render(() => (
            <ConfigProvider direction="rtl" getPopupContainer={() => container}>
                {() => <Portal>{() => <p>config</p>}</Portal>}
            </ConfigProvider>
        ));
        await nextTick();
        expect(portalOf('config')?.parentElement).toBe(container);
        expect(portalOf('config')).toHaveAttribute('dir', 'rtl');
        container.remove();
    });

    it('getPopupContainer 可以查询同一棵树里挂载后才在文档中的元素', async () => {
        render(() => (
            <div class="host">
                <Portal getPopupContainer={() => document.querySelector<HTMLElement>('.host')}>{() => <p>sibling</p>}</Portal>
            </div>
        ));
        await nextTick();
        expect(portalOf('sibling')?.parentElement).toHaveClass('host');
    });

    it('KeepAlive 失活时内容离开页面且保留状态，激活后回到容器', async () => {
        const Cached = defineComponent({
            name: 'Cached',
            setup: () => () => <Portal>{() => <input aria-label="kept" />}</Portal>,
        });
        const shown = shallowRef(true);
        render(() => (
            <KeepAlive>
                {{
                    default: () => [shown.value ? <Cached /> : <p>other</p>],
                }}
            </KeepAlive>
        ));
        await nextTick();
        const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'kept' });
        input.value = 'typed';
        shown.value = false;
        await nextTick();
        expect(input.isConnected).toBe(false);
        shown.value = true;
        await nextTick();
        expect(screen.getByRole('textbox', { name: 'kept' })).toBe(input);
        expect(input.value).toBe('typed');
        expect(input.closest('.semi-portal')?.parentElement).toBe(document.body);
    });

    it('弹层里的 Button 不继承包住 Portal 的 ButtonGroup 的值', async () => {
        render(() => (
            <ButtonGroup disabled type="danger">
                {() => <Portal>{() => <Button>{() => 'in portal'}</Button>}</Portal>}
            </ButtonGroup>
        ));
        await nextTick();
        const button = screen.getByRole('button', { name: 'in portal' });
        expect(button).toBeEnabled();
        expect(button).toHaveClass('semi-button-primary');
    });
});
