import React, { type KeyboardEvent, type MouseEvent } from 'react';
import { DragMove } from '@fibrae/semi-ui-react';

export default function DragMoveDemo() {
    const container = React.useRef<HTMLDivElement>(null);
    const startPoint = React.useRef<{ x: number; y: number } | null>(null);

    const customMove = (element: HTMLElement, top: number, left: number) => {
        const bounds = container.current;
        if (bounds && left + 100 > bounds.offsetWidth) {
            element.style.right = `${bounds.offsetWidth - left - element.offsetWidth}px`;
            element.style.left = 'auto';
        } else {
            element.style.left = left + 'px';
        }
        element.style.top = top + 'px';
    };

    const toggleWidth = (element: HTMLElement) => {
        element.style.width = element.style.width === '60px' ? '100px' : '60px';
    };

    const onMouseDown = (e: MouseEvent<HTMLElement>) => {
        startPoint.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = (e: MouseEvent<HTMLElement>) => {
        const start = startPoint.current;
        if (start && Math.abs(e.clientX - start.x) < 5 && Math.abs(e.clientY - start.y) < 5) {
            toggleWidth(e.currentTarget);
        }
        startPoint.current = null;
    };

    const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') {
            toggleWidth(e.currentTarget);
        }
    };

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
                ref={container}
            >
                <span style={{ color: 'var(--semi-color-text-0)' }}>Constrainer</span>
                <DragMove constrainer={() => container.current} customMove={customMove}>
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
                    >
                        Drag me
                    </button>
                </DragMove>
            </div>
        </>
    );
}
