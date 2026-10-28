import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vite-plus/test';
import { ContractFoundation, stateText } from '@test/utils/host-contract';
import useFoundation from '../use-foundation';

class StateWritingFoundation extends ContractFoundation {
    override init() {
        super.init();
        this.setState({ x: 1 });
    }
}

function Probe({ onCommit, log }: { onCommit: (el: HTMLElement | null) => void; log: string[] }) {
    const [, state] = useFoundation(
        StateWritingFoundation,
        {},
        () => ({ x: 0 }),
        () => ({
            log: (entry: string) => {
                log.push(entry);
            },
            notifyChange: () => {},
        })
    );
    return (
        <span ref={onCommit} data-contract-state>
            {state.x}
        </span>
    );
}

describe('React useFoundation 宿主契约（浏览器）', () => {
    // No act(): act flushes passive effects and renders before the test looks, so a host that inits late would pass.
    it('提交 DOM 的同一任务结束前 init 已执行，首次绘制前 DOM 已显示 init 写入的 state', async () => {
        const log: string[] = [];
        const container = document.body.appendChild(document.createElement('div'));
        const root = createRoot(container);
        const seen = await new Promise<{ initedAtCommitTask: boolean; domAtFrame: string | null }>((resolve) => {
            let initedAtCommitTask = false;
            let queued = false;
            const onCommit = (el: HTMLElement | null) => {
                if (!el || queued) {
                    return;
                }
                queued = true;
                queueMicrotask(() => {
                    initedAtCommitTask = log.some((entry) => entry.startsWith('init'));
                });
                requestAnimationFrame(() => resolve({ initedAtCommitTask, domAtFrame: stateText() }));
            };
            root.render(<Probe log={log} onCommit={onCommit} />);
        });
        root.unmount();
        container.remove();
        expect(seen).toEqual({ initedAtCommitTask: true, domAtFrame: '1' });
    });
});
