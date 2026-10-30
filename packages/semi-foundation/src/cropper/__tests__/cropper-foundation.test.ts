import { describe, expect, it } from 'vite-plus/test';
import { MIN_BOX_SIZE, type CornerDir } from '../constants';
import CropperFoundation, { type CropperFoundationProps, type CropperState } from '../foundation';

// Container 200x100 at the viewport origin; a 400x200 image fits it at scale 0.5
function setup(props: CropperFoundationProps = {}) {
    const container = { clientWidth: 200, clientHeight: 100, clientLeft: 0, clientTop: 0 };
    let state = {} as CropperState;
    const adapter = {
        getContainer: () => ({
            ...container,
            getBoundingClientRect: () => new DOMRect(0, 0, container.clientWidth, container.clientHeight),
        }),
        getProps: () => ({ defaultAspectRatio: 1, ...props }),
        getStates: () => state,
        setState: (s: Partial<CropperState>) => {
            state = { ...state, ...s };
        },
        getImg: () => document.createElement('img'),
        notifyZoomChange: () => {},
    };
    const foundation = new CropperFoundation(adapter as never);
    foundation.init();
    foundation.handleImageLoad({ target: Object.defineProperties(new Image(), { naturalWidth: { value: 400 }, naturalHeight: { value: 200 } }) });
    return {
        foundation,
        container,
        getState: () => state,
        setBox: (width: number, height: number, x: number, y: number) => adapter.setState({ cropperBox: { width, height, centerPoint: { x, y } } }),
    };
}

function press(foundation: CropperFoundation, dir: CornerDir, init: { pointerType?: string; button?: number } = {}) {
    const corner = Object.assign(document.createElement('div'), { setPointerCapture: () => {} });
    corner.dataset.dir = dir;
    foundation.handleCornerPointerDown({
        currentTarget: corner,
        pointerId: 1,
        button: init.button ?? 0,
        preventDefault: () => {},
    });
}

function move(foundation: CropperFoundation, clientX: number, clientY: number) {
    foundation.handleCornerPointerMove({ clientX, clientY, preventDefault: () => {} });
}

describe('CropperFoundation 布局', () => {
    it('图片按容器等比缩放，默认裁剪框按 defaultAspectRatio 填满容器', () => {
        const { getState } = setup();
        expect(getState().imgData).toEqual({ width: 200, height: 100, centerPoint: { x: 100, y: 50 } });
        expect(getState().cropperBox).toEqual({ width: 100, height: 100, centerPoint: { x: 100, y: 50 } });
        expect(getState().loaded).toBe(true);
    });
});

describe('CropperFoundation 容器尺寸变化', () => {
    it('等比缩小容器时图片与裁剪框按同一比例缩放', () => {
        const { foundation, container, getState } = setup();
        container.clientWidth = 100;
        container.clientHeight = 50;
        foundation.handleResize();
        expect(getState().imgData).toEqual({ width: 100, height: 50, centerPoint: { x: 50, y: 25 } });
        expect(getState().cropperBox).toEqual({ width: 50, height: 50, centerPoint: { x: 50, y: 25 } });
    });

    it('缩放后超出右边界的裁剪框被夹回容器内，尺寸不变', () => {
        const { foundation, container, getState, setBox } = setup();
        setBox(100, 50, 190, 50);
        container.clientWidth = 100;
        container.clientHeight = 50;
        foundation.handleResize();
        expect(getState().cropperBox).toEqual({ width: 50, height: 25, centerPoint: { x: 75, y: 25 } });
    });

    it('固定宽高比时被夹小的宽度会同步修正高度', () => {
        const { foundation, container, getState, setBox } = setup({ aspectRatio: 2 });
        setBox(100, 50, 190, 50);
        container.clientWidth = 40;
        container.clientHeight = 50;
        foundation.handleResize();
        expect(getState().cropperBox).toEqual({ width: 20, height: 10, centerPoint: { x: 30, y: 10 } });
    });

    it('容器尺寸为 0 或未变化时保持原布局', () => {
        const { foundation, container, getState } = setup();
        const before = getState().cropperBox;
        foundation.handleResize();
        container.clientWidth = 0;
        foundation.handleResize();
        expect(getState().cropperBox).toBe(before);
    });
});

describe('CropperFoundation 自由比例拖拽角点', () => {
    it('拖动 br 只改变右下边，对边固定', () => {
        const { foundation, getState } = setup();
        press(foundation, 'br');
        move(foundation, 180, 100);
        expect(getState().cropperBox).toEqual({ width: 130, height: 100, centerPoint: { x: 115, y: 50 } });
    });

    it.each([
        ['mouse', 2],
        ['pen', 2],
        ['pen', 5],
    ])('%s 的非主键 %i 按下角点不开始缩放', (pointerType, button) => {
        const { foundation, getState } = setup();
        const before = getState().cropperBox;
        press(foundation, 'br', { pointerType, button });
        move(foundation, 180, 100);
        expect(getState().cropperBox).toEqual(before);
    });

    it('拖出容器时位置被夹在容器内', () => {
        const { foundation, getState } = setup();
        press(foundation, 'br');
        move(foundation, 500, 500);
        expect(getState().cropperBox).toEqual({ width: 150, height: 100, centerPoint: { x: 125, y: 50 } });
    });

    it('边中点只改变一个方向', () => {
        const { foundation, getState } = setup();
        press(foundation, 'mr');
        move(foundation, 180, 5);
        expect(getState().cropperBox).toEqual({ width: 130, height: 100, centerPoint: { x: 115, y: 50 } });
    });

    it('越过对边时翻转方向并保持新的宽度', () => {
        const { foundation, getState } = setup();
        press(foundation, 'tl');
        move(foundation, 170, 0);
        // the fixed right edge is x=150; the pointer passed it, so the box now grows to the right
        expect(getState().cropperBox.width).toBe(20);
        expect(getState().cropperBox.centerPoint.x).toBe(160);
    });

    it('宽度不会小于 MIN_BOX_SIZE', () => {
        const { foundation, getState } = setup();
        press(foundation, 'tl');
        move(foundation, 150, 0);
        expect(getState().cropperBox.width).toBe(MIN_BOX_SIZE);
        expect(getState().cropperBox.centerPoint.x).toBe(145);
    });

    it('没有按下角点时移动指针不改变裁剪框', () => {
        const { foundation, getState } = setup();
        const before = getState().cropperBox;
        move(foundation, 10, 10);
        expect(getState().cropperBox).toBe(before);
    });

    it('松开后不再跟随指针', () => {
        const { foundation, getState } = setup();
        press(foundation, 'br');
        foundation.handleCornerLostPointerCapture();
        const before = getState().cropperBox;
        move(foundation, 190, 90);
        expect(getState().cropperBox).toBe(before);
    });
});

describe('CropperFoundation 固定比例拖拽角点', () => {
    it('拖动 br 时高度跟随指针，宽度按比例联动', () => {
        const { foundation, getState } = setup({ aspectRatio: 2 });
        press(foundation, 'br');
        move(foundation, 10, 60);
        expect(getState().cropperBox).toEqual({ width: 120, height: 60, centerPoint: { x: 60, y: 30 } });
    });

    it('拖动 tl 时右下角固定', () => {
        const { foundation, getState, setBox } = setup({ aspectRatio: 2 });
        setBox(120, 60, 60, 30);
        press(foundation, 'tl');
        move(foundation, 0, 30);
        expect(getState().cropperBox).toEqual({ width: 60, height: 30, centerPoint: { x: 90, y: 45 } });
    });

    it('指针越界时被夹在按比例允许的范围内', () => {
        const { foundation, getState } = setup({ aspectRatio: 2 });
        press(foundation, 'br');
        move(foundation, 900, 900);
        expect(getState().cropperBox).toEqual({ width: 200, height: 100, centerPoint: { x: 100, y: 50 } });
    });

    it('缩到最小后越过对边会翻转到对角方向继续', () => {
        const { foundation, getState, setBox } = setup({ aspectRatio: 2 });
        setBox(120, 60, 60, 30);
        press(foundation, 'tl');
        move(foundation, 0, 60);
        expect(getState().cropperBox).toEqual({ width: 20, height: 10, centerPoint: { x: 110, y: 55 } });
        move(foundation, 0, 80);
        // the dragged corner is now br: the range is measured from the collapsed box at (100, 50)
        expect(getState().cropperBox).toEqual({ width: 60, height: 30, centerPoint: { x: 130, y: 65 } });
    });
});
