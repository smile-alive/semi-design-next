import { createEffect, createSignal, on, onCleanup } from 'solid-js';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import { Space, Progress, Button } from '@fibrae/semi-ui-solid';

const strokeArr = [
    { percent: 0, color: 'rgb(249, 57, 32)' },
    { percent: 50, color: '#46259E' },
    { percent: 100, color: 'hsla(125, 50%, 46%, 1)' },
];

const strokeArrReverse = [
    { percent: 0, color: 'hsla(125, 50%, 46%, 1)' },
    { percent: 50, color: '#46259E' },
    { percent: 100, color: 'rgb(249, 57, 32)' },
];

export default function ProgressDemo() {
    const [percent, setPercent] = createSignal(65);
    const [percentInterval, setPercentInterval] = createSignal(0);

    // Each value schedules the next one; restarting after 100 pauses longer.
    createEffect(
        on(percentInterval, (current) => {
            const timer = setTimeout(() => setPercentInterval(current > 100 ? 0 : current + 3), current === 0 || current > 100 ? 1200 : 290 - (current % 50) * 3);
            onCleanup(() => clearTimeout(timer));
        })
    );

    return (
        <>
            <Space spacing={20}>
                <div>
                    <Progress percent={percentInterval()} stroke={strokeArr} strokeGradient showInfo type="circle" width={100} aria-label="file download speed" />
                </div>
                <div>
                    <Progress percent={percentInterval()} stroke={strokeArrReverse} strokeGradient showInfo type="circle" width={100} aria-label="file download speed" />
                </div>
            </Space>
            <div style={{ width: '100%', margin: '20px 0 10px' }}>
                <Progress percent={percent()} stroke={strokeArr} strokeGradient showInfo size="large" aria-label="file download speed" />
            </div>
            <Button aria-label="Decrease" icon={<IconChevronLeft />} theme="light" onClick={() => setPercent(percent() - 5)} disabled={percent() === 0} />
            <Button aria-label="Increase" icon={<IconChevronRight />} theme="light" onClick={() => setPercent(percent() + 5)} disabled={percent() === 100} />
        </>
    );
}
