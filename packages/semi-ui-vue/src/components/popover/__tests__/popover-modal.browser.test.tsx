/** @jsxImportSource vue */
import { defineComponent, ref } from 'vue';
import { screen } from '@testing-library/vue';
import { describe, expect, it } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from '@test/utils/vue';
import Modal from '../../modal/modal.vue';
import Popover from '../popover.vue';

const ModalInPopover = defineComponent({
    setup() {
        const open = ref(false);
        return () => (
            <Popover trigger="click" motion={false} ariaLabel="Details">
                {{
                    default: () => <button type="button">trigger</button>,
                    content: () => (
                        <>
                            <button type="button" onClick={() => (open.value = true)}>
                                open modal
                            </button>
                            <Modal visible={open.value} motion={false} title="Inner" onUpdate:visible={(value: boolean) => (open.value = value)}>
                                {() => <p>modal body</p>}
                            </Modal>
                        </>
                    ),
                }}
            </Popover>
        );
    },
});

describe('Popover 内的 Modal', () => {
    it('trigger=click 的 Popover 内打开 Modal 后，在 Modal 内按下鼠标不关闭 Popover 和 Modal', async () => {
        render(ModalInPopover);
        await userEvent.click(screen.getByRole('button', { name: 'trigger' }));
        await userEvent.click(await screen.findByRole('button', { name: 'open modal' }));
        const body = await screen.findByText('modal body');
        await userEvent.click(body);
        expect(screen.getByText('open modal')).toBeInTheDocument();
        expect(screen.getByText('modal body')).toBeInTheDocument();
    });
});
