import { DragMove } from '@fibrae/semi-ui-solid';

export default function DragMoveDemo() {
    let containerRef: HTMLDivElement | undefined;
    let elementRef: HTMLButtonElement | undefined;
    let startPoint: { x: number; y: number } | null = null;

    const customMove = (element: HTMLElement, top: number, left: number) => {
        const container = containerRef;
        if (container && left + 100 > container.offsetWidth) {
            element.style.right = `${container.offsetWidth - left - element.offsetWidth}px`;
            element.style.left = 'auto';
        } else {
            element.style.left = left + 'px';
        }
        element.style.top = top + 'px';
    };

    const onMouseDown = (e: MouseEvent) => {
        startPoint = {
            x: e.clientX,
            y: e.clientY,
        };
    };

    const toggleWidth = () => {
        if (!elementRef) return;
        elementRef.style.width = elementRef.style.width === '60px' ? '100px' : '60px';
    };

    const onMouseUp = (e: MouseEvent) => {
        if (startPoint) {
            const { x, y } = startPoint;
            if (Math.abs(e.clientX - x) < 5 && Math.abs(e.clientY - y) < 5) {
                toggleWidth();
            }
        }
        startPoint = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            toggleWidth();
        }
    };

    return (
        <>
            <span>蓝色色块点击可改变宽度，改变前后蓝色色块均不会超出范围限制 </span>
            <br />
            <br />
            <div
                ref={(element) => (containerRef = element)}
                style={{
                    'background-color': 'var(--semi-grey-2)',
                    width: '300px',
                    height: '300px',
                    position: 'relative',
                    padding: '10px',
                    color: 'var(--semi-white)',
                    'font-weight': '500',
                }}
            >
                <span style={{ color: 'var(--semi-color-text-0)' }}>Constrainer</span>
                <DragMove constrainer={() => containerRef ?? null} customMove={customMove}>
                    <button
                        type="button"
                        style={{
                            'background-color': 'var(--semi-color-primary)',
                            'box-sizing': 'content-box',
                            width: '60px',
                            height: '50px',
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'center',
                            position: 'absolute',
                            top: '50px',
                            left: '50px',
                            border: 'none',
                            'border-radius': '10px',
                            padding: '5px',
                            color: 'inherit',
                            font: 'inherit',
                        }}
                        onMouseDown={onMouseDown}
                        onMouseUp={onMouseUp}
                        onKeyDown={onKeyDown}
                        ref={(element) => (elementRef = element)}
                    >
                        Drag me
                    </button>
                </DragMove>
            </div>
        </>
    );
}
