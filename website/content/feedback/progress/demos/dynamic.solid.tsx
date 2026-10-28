import { createSignal } from 'solid-js';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import { Progress, Button } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    const [percent, setPercent] = createSignal(40);
    return (
        <div>
            <Progress percent={percent()} showInfo aria-label="disk usage" />
            <Button aria-label="减少" icon={<IconChevronLeft />} theme="light" onClick={() => setPercent(percent() - 10)} disabled={percent() === 0} />
            <Button aria-label="增加" icon={<IconChevronRight />} theme="light" onClick={() => setPercent(percent() + 10)} disabled={percent() >= 100} />
        </div>
    );
}
