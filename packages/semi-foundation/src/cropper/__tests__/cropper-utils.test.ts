import { describe, expect, it } from 'vite-plus/test';
import { getCropperGeometry } from '../utils';

describe('getCropperGeometry', () => {
    it('中心点换算成左上角，并给出图片相对裁剪框的偏移', () => {
        const imgData = { width: 200, height: 100, centerPoint: { x: 100, y: 50 } };
        const cropperBox = { width: 60, height: 40, centerPoint: { x: 90, y: 30 } };
        expect(getCropperGeometry(imgData, cropperBox)).toEqual({ imgX: 0, imgY: 0, boxX: 60, boxY: 10, viewX: -60, viewY: -10 });
    });
});
