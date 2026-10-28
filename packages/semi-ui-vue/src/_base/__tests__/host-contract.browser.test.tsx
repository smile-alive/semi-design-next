/** @jsxImportSource vue */
import { createApp, defineComponent } from 'vue';
import { describe, expect, it } from 'vite-plus/test';
import { type ContractAdapter, type ContractProps, type ContractState, ContractFoundation, stateText } from '@test/utils/host-contract';
import useFoundation from '../use-foundation';

class StateWritingFoundation extends ContractFoundation {
    override init() {
        super.init();
        this.setState({ x: 1 });
    }
}

describe('Vue useFoundation 宿主契约（浏览器）', () => {
    it('提交 DOM 的同一任务结束前 init 已执行，首次绘制前 DOM 已显示 init 写入的 state', async () => {
        const log: string[] = [];
        const container = document.body.appendChild(document.createElement('div'));
        const { promise, resolve } = Promise.withResolvers<{ initedAtCommitTask: boolean; domAtFrame: string | null }>();
        let initedAtCommitTask = false;
        let queued = false;
        const onCommit = (el: unknown) => {
            if (!el || queued) {
                return;
            }
            queued = true;
            queueMicrotask(() => {
                initedAtCommitTask = log.some((entry) => entry.startsWith('init'));
            });
            requestAnimationFrame(() => resolve({ initedAtCommitTask, domAtFrame: stateText() }));
        };
        const Probe = defineComponent({
            setup() {
                const { state } = useFoundation<StateWritingFoundation, ContractAdapter, ContractProps, ContractState>(
                    StateWritingFoundation,
                    {},
                    () => ({ x: 0 }),
                    () => ({
                        log: (entry) => {
                            log.push(entry);
                        },
                        notifyChange: () => {},
                    })
                );
                return () => (
                    <span ref={onCommit} data-contract-state>
                        {state.value.x}
                    </span>
                );
            },
        });
        const app = createApp(Probe);
        app.mount(container);
        const seen = await promise;
        app.unmount();
        container.remove();
        expect(seen).toEqual({ initedAtCommitTask: true, domAtFrame: '1' });
    });
});
