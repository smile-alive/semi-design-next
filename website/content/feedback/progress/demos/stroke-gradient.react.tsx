import { useEffect, useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-react';
import { Space, Progress, Button } from '@fibrae/semi-ui-react';

export default function ProgressDemo() {
    const [percent, setPercent] = useState(65);
    const [percentInterval, setPercentInterval] = useState(0);
    useEffect(() => {
        const timer = setTimeout(
            () => {
                setPercentInterval(percentInterval > 100 ? 0 : percentInterval + 3);
            },
            percentInterval === 0 || percentInterval > 100 ? 1200 : 290 - (percentInterval % 50) * 3
        );
        return () => clearTimeout(timer);
    }, [percentInterval]);
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
    return (
        <>
            <Space spacing={20}>
                <div>
                    <Progress percent={percentInterval} stroke={strokeArr} strokeGradient showInfo type="circle" width={100} aria-label="file download speed" />
                </div>
                <div>
                    <Progress percent={percentInterval} stroke={strokeArrReverse} strokeGradient showInfo type="circle" width={100} aria-label="file download speed" />
                </div>
            </Space>
            <div style={{ width: '100%', margin: '20px 0 10px' }}>
                <Progress percent={percent} stroke={strokeArr} strokeGradient showInfo size="large" aria-label="file download speed" />
            </div>
            <Button
                aria-label="Decrease"
                icon={<IconChevronLeft />}
                theme="light"
                onClick={() => {
                    setPercent(percent - 5);
                }}
                disabled={percent === 0}
            />
            <Button
                aria-label="Increase"
                icon={<IconChevronRight />}
                theme="light"
                onClick={() => {
                    setPercent(percent + 5);
                }}
                disabled={percent === 100}
            />
        </>
    );
}
