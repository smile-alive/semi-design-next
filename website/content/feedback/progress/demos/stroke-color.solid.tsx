import { createSignal } from 'solid-js';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import { Progress, Button } from '@fibrae/semi-ui-solid';

const strokeArr = [
    { percent: 20, color: 'red' },
    { percent: 40, color: 'orange-9' },
    { percent: 60, color: 'light-green-8' },
    { percent: 80, color: 'hsla(125, 50%, 46%, 1)' },
];

export default function ProgressDemo() {
    const [percent, setPercent] = createSignal(10);
    return (
        <>
            <div>
                <Progress percent={percent()} stroke={strokeArr} showInfo type="circle" width={100} aria-label="disk usage" />
                <Progress percent={percent()} stroke={strokeArr} showInfo style={{ margin: '20px 0 10px' }} aria-label="disk usage" />
            </div>
            <Button aria-label="Decrease" icon={<IconChevronLeft />} theme="light" onClick={() => setPercent(percent() - 10)} disabled={percent() === 0} />
            <Button aria-label="Increase" icon={<IconChevronRight />} theme="light" onClick={() => setPercent(percent() + 10)} disabled={percent() === 100} />
        </>
    );
}
