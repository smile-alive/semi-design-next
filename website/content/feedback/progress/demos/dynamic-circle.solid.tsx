import { createSignal } from 'solid-js';
import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-solid';
import { Progress, Button } from '@fibrae/semi-ui-solid';

export default function ProgressDemo() {
    const [cirPerc, setCirPerc] = createSignal(40);
    return (
        <div>
            <div>
                <Progress percent={cirPerc()} type="circle" aria-label="disk usage" />
            </div>
            <Button aria-label="减少" icon={<IconChevronLeft />} theme="light" onClick={() => setCirPerc(cirPerc() - 10)} disabled={cirPerc() === 0} />
            <Button aria-label="增加" icon={<IconChevronRight />} theme="light" onClick={() => setCirPerc(cirPerc() + 10)} disabled={cirPerc() >= 100} />
        </div>
    );
}
