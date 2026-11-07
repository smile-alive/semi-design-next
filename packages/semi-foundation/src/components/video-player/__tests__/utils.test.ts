import { describe, expect, it } from 'vite-plus/test';
import { formatTime, formatTimeText, getPointerRatio, ignoreExpectedMediaErrors } from '../utils';

describe('ignoreExpectedMediaErrors', () => {
    it.each(['AbortError', 'NotAllowedError', 'InvalidStateError', 'NotSupportedError'])('忽略 %s', async (name) => {
        await expect(ignoreExpectedMediaErrors(Promise.reject(new DOMException('', name)))).resolves.toBeUndefined();
    });

    it('其余拒绝原样保留', async () => {
        const typeError = new TypeError('not a function');
        await expect(ignoreExpectedMediaErrors(Promise.reject(typeError))).rejects.toBe(typeError);
        const quota = new DOMException('', 'QuotaExceededError');
        await expect(ignoreExpectedMediaErrors(Promise.reject(quota))).rejects.toBe(quota);
    });
});

describe('formatTime', () => {
    it('一小时内显示 mm:ss，超过一小时显示 h:mm:ss', () => {
        expect(formatTime(0)).toBe('00:00');
        expect(formatTime(75.9)).toBe('01:15');
        expect(formatTime(3599)).toBe('59:59');
        expect(formatTime(3725)).toBe('1:02:05');
        expect(formatTime(4500)).toBe('1:15:00');
    });

    it('非有限值显示 00:00', () => {
        expect(formatTime(NaN)).toBe('00:00');
        expect(formatTime(Infinity)).toBe('00:00');
        expect(formatTime(-Infinity)).toBe('00:00');
    });
});

describe('formatTimeText', () => {
    const texts = {
        timeHms: '${hours} h ${minutes} m ${seconds} s',
        timeMs: '${minutes} m ${seconds} s',
        timeS: '${seconds} s',
    };

    it('按时长选择模板，秒补零（有分钟时）', () => {
        expect(formatTimeText(5, texts)).toBe('5 s');
        expect(formatTimeText(65, texts)).toBe('1 m 05 s');
        expect(formatTimeText(3725, texts)).toBe('1 h 2 m 05 s');
    });

    it('非有限值按 0 秒处理', () => {
        expect(formatTimeText(NaN, texts)).toBe('0 s');
        expect(formatTimeText(Infinity, texts)).toBe('0 s');
    });
});

describe('getPointerRatio', () => {
    const rect = { left: 10, top: 20, right: 210, bottom: 120, width: 200, height: 100 };

    it('横向从左边缘起算', () => {
        expect(getPointerRatio(rect, { clientX: 60, clientY: 0 }, false)).toEqual({
            offset: 50,
            total: 200,
            ratio: 0.25,
        });
    });

    it('纵向从下边缘向上起算', () => {
        expect(getPointerRatio(rect, { clientX: 0, clientY: 70 }, true)).toEqual({
            offset: 50,
            total: 100,
            ratio: 0.5,
        });
    });

    it('越界时 offset 截断到轨道两端，ratio 截断到 0 到 1', () => {
        expect(getPointerRatio(rect, { clientX: -90, clientY: 0 }, false)).toEqual({
            offset: 0,
            total: 200,
            ratio: 0,
        });
        expect(getPointerRatio(rect, { clientX: 500, clientY: 0 }, false)).toEqual({
            offset: 200,
            total: 200,
            ratio: 1,
        });
        expect(getPointerRatio(rect, { clientX: 0, clientY: 0 }, true)).toEqual({
            offset: 100,
            total: 100,
            ratio: 1,
        });
    });
});
