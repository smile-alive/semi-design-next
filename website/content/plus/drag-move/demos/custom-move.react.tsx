import React, { useCallback, type KeyboardEvent, type MouseEvent } from 'react';
import { DragMove } from '@fibrae/semi-ui-react';

export default function DragMoveDemo() {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const elementRef = React.useRef<HTMLButtonElement>(null);
    const startPoint = React.useRef<{ x: number; y: number } | null>(null);

    const customMove = useCallback((element: HTMLElement, top: number, left: number) => {
        const container = containerRef.current;
        if (container && left + 100 > container.offsetWidth) {
            element.style.right = `${container.offsetWidth - left - element.offsetWidth}px`;
            element.style.left = 'auto';
        } else {
            element.style.left = left + 'px';
        }
        element.style.top = top + 'px';
    }, []);

    const onMouseDown = useCallback((e: MouseEvent) => {
        startPoint.current = {
            x: e.clientX,
            y: e.clientY,
        };
    }, []);

    const toggleWidth = useCallback(() => {
        const element = elementRef.current;
        if (!element) return;
        element.style.width = element.style.width === '60px' ? '100px' : '60px';
    }, []);

    const onMouseUp = useCallback(
        (e: MouseEvent) => {
            if (startPoint.current) {
                const { x, y } = startPoint.current;
                if (Math.abs(e.clientX - x) < 5 && Math.abs(e.clientY - y) < 5) {
                    toggleWidth();
                }
            }
            startPoint.current = null;
        },
        [toggleWidth]
    );

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                toggleWidth();
            }
        },
        [toggleWidth]
    );

    return (
        <>
            <span>蓝色色块点击可改变宽度，改变前后蓝色色块均不会超出范围限制 </span>
            <br />
            <br />
            <div
                style={{
                    backgroundColor: 'var(--semi-grey-2)',
                    width: 300,
                    height: 300,
                    position: 'relative',
                    padding: 10,
                    color: 'var(--semi-white)',
                    fontWeight: 500,
                }}
                ref={containerRef}
            >
                <span style={{ color: 'var(--semi-color-text-0)' }}>Constrainer</span>
                <DragMove constrainer={() => containerRef.current} customMove={customMove}>
                    <button
                        type="button"
                        style={{
                            backgroundColor: 'var(--semi-color-primary)',
                            boxSizing: 'content-box',
                            width: 60,
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'absolute',
                            top: 50,
                            left: 50,
                            border: 'none',
                            borderRadius: 10,
                            padding: 5,
                            color: 'inherit',
                            font: 'inherit',
                        }}
                        onMouseDown={onMouseDown}
                        onMouseUp={onMouseUp}
                        onKeyDown={onKeyDown}
                        ref={elementRef}
                    >
                        Drag me
                    </button>
                </DragMove>
            </div>
        </>
    );
}
