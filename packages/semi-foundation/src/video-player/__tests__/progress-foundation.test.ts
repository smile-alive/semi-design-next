import { describe, expect, it, vi } from 'vite-plus/test';
import VideoProgressFoundation, { type VideoProgressAdapter } from '../progress-foundation';

const { getMarkersList, getValueWidth } = VideoProgressFoundation;

describe('VideoProgressFoundation.getMarkersList', () => {
    it('没有标记时返回一个占满宽度的项', () => {
        const full = [{ start: 0, end: 60, left: '0', title: '', width: '100%' }];
        expect(getMarkersList(undefined, 60)).toEqual(full);
        expect(getMarkersList([], 60)).toEqual(full);
    });

    it('每个标记排布到下一个标记为止，最后一个排布到 max', () => {
        expect(
            getMarkersList(
                [
                    { start: 0, title: 'A' },
                    { start: 15, title: 'B' },
                ],
                60
            )
        ).toEqual([
            { start: 0, end: 15, left: '0%', width: '25%', title: 'A' },
            { start: 15, end: 60, left: '25%', width: '75%', title: 'B' },
        ]);
    });

    it('丢弃起点不在 max 内的标记，延伸到 max 之外的标记截到 max', () => {
        const markers = [
            { start: 0, title: 'A' },
            { start: 30, title: 'B' },
            { start: 90, title: 'C' },
        ];
        expect(getMarkersList(markers, 60)).toEqual([
            { start: 0, end: 30, left: '0%', width: '50%', title: 'A' },
            { start: 30, end: 60, left: '50%', width: '50%', title: 'B' },
        ]);
        expect(getMarkersList(markers, 0)).toEqual([]);
    });
});

describe('VideoProgressFoundation.getMarkersList 的起点', () => {
    it('首个标记不从 0 开始时，补一个无标题的片段覆盖 [0, start)', () => {
        expect(getMarkersList([{ start: 15, title: 'A' }], 60)).toEqual([
            { start: 0, end: 15, left: '0', width: '25%', title: '' },
            { start: 15, end: 60, left: '25%', width: '75%', title: 'A' },
        ]);
    });

    it('未按起点排序的标记按起点排布，片段宽度不为负', () => {
        const list = getMarkersList(
            [
                { start: 30, title: 'B' },
                { start: 0, title: 'A' },
            ],
            60
        );
        expect(list.map((item) => item.title)).toEqual(['A', 'B']);
        expect(list.every((item) => item.end > item.start)).toBe(true);
    });
});

describe('VideoProgressFoundation 的按键过滤', () => {
    const setup = () => {
        const setIsDragging = vi.fn<VideoProgressAdapter['setIsDragging']>();
        const notifyChange = vi.fn<VideoProgressAdapter['notifyChange']>();
        const setMovingInfo = vi.fn<VideoProgressAdapter['setMovingInfo']>();
        const setPointerCapture = vi.fn<(pointerId: number) => void>();
        const slider = { getBoundingClientRect: () => ({ left: 0, bottom: 10, width: 100, height: 10 }) } as HTMLDivElement;
        const adapter = {
            getProps: () => ({ max: 60, value: 0, step: 5 }),
            getStates: () => ({ isDragging: false }),
            getSliderRef: () => slider,
            getMarkersList: () => [],
            setIsDragging,
            notifyChange,
            setMovingInfo,
        } as unknown as VideoProgressAdapter;
        return { foundation: new VideoProgressFoundation(adapter), setIsDragging, notifyChange, setMovingInfo, setPointerCapture };
    };
    const pointerDown = (button: number, setPointerCapture: (pointerId: number) => void) => ({ button, clientX: 50, clientY: 0, type: 'pointerdown', pointerId: 1, currentTarget: { setPointerCapture } as unknown as Element });

    it('只有主键按下才捕获指针并跳转', () => {
        const { foundation, setIsDragging, notifyChange, setPointerCapture } = setup();
        foundation.handlePointerDown(pointerDown(2, setPointerCapture));
        foundation.handlePointerDown(pointerDown(1, setPointerCapture));
        expect(setPointerCapture).not.toHaveBeenCalled();
        expect(setIsDragging).not.toHaveBeenCalled();
        expect(notifyChange).not.toHaveBeenCalled();
        foundation.handlePointerDown(pointerDown(0, setPointerCapture));
        expect(notifyChange).toHaveBeenCalledWith(30);
    });

    it('键盘操作清除悬停预览', () => {
        const { foundation, setMovingInfo } = setup();
        foundation.handleKeyDown({ key: 'ArrowRight', altKey: false, ctrlKey: false, metaKey: false, preventDefault: () => {} });
        expect(setMovingInfo).toHaveBeenCalledWith(null);
    });

    it('键盘聚焦清除悬停预览，鼠标聚焦不清除', () => {
        const { foundation, setMovingInfo } = setup();
        foundation.handleFocus({ currentTarget: { matches: () => false } as unknown as Element });
        expect(setMovingInfo).not.toHaveBeenCalled();
        foundation.handleFocus({ currentTarget: { matches: (selector: string) => selector === ':focus-visible' } as unknown as Element });
        expect(setMovingInfo).toHaveBeenCalledWith(null);
    });
});

describe('VideoProgressFoundation.getValueWidth', () => {
    const marker = { start: 10, end: 30, left: '0%', width: '50%', title: '' };

    it('覆盖标记中到 value 为止的部分', () => {
        expect(getValueWidth(marker, 5)).toBe('0%');
        expect(getValueWidth(marker, 15)).toBe('25%');
        expect(getValueWidth(marker, 40)).toBe('calc(100% - 2px)');
    });

    it('时长为 0 时宽度为 0%', () => {
        expect(getValueWidth({ start: 0, end: 0, left: '0', width: '100%', title: '' }, 0)).toBe('0%');
    });
});

describe('VideoProgressFoundation 标记命中与手柄位置', () => {
    const list = [
        { start: 0, end: 10, left: '0', width: '50%', title: '' },
        { start: 10, end: 20, left: '50%', width: '50%', title: 'chapter' },
    ];

    it('标记区间为开区间，边界值不属于任何一段', () => {
        expect(VideoProgressFoundation.isInMarker(list[1], 10)).toBe(false);
        expect(VideoProgressFoundation.isInMarker(list[1], 20)).toBe(false);
        expect(VideoProgressFoundation.isInMarker(list[1], 15)).toBe(true);
    });

    it('取命中标记的标题，引导段为空串，未命中为 undefined', () => {
        expect(VideoProgressFoundation.getMarkerTitle(list, 5)).toBe('');
        expect(VideoProgressFoundation.getMarkerTitle(list, 15)).toBe('chapter');
        expect(VideoProgressFoundation.getMarkerTitle(list, 10)).toBeUndefined();
    });

    it('手柄位置按比例减去半个手柄宽度，max 为 0 时在起点', () => {
        expect(VideoProgressFoundation.getHandleLeft(5, 20)).toBe('calc(25% - 8px)');
        expect(VideoProgressFoundation.getHandleLeft(5, 0)).toBe('calc(0% - 8px)');
    });
});
