import { describe, expect, it } from 'vite-plus/test';
import { getCurrentTrack } from '../utils';

describe('getCurrentTrack', () => {
    it('字符串曲目转成 { src }，对象曲目原样返回', () => {
        expect(getCurrentTrack('a.mp3', 0)).toEqual({ src: 'a.mp3' });
        expect(getCurrentTrack({ src: 'a.mp3', title: 'A' }, 0)).toEqual({ src: 'a.mp3', title: 'A' });
    });

    it('列表按索引取曲目，索引越界时取最后一首', () => {
        const list = ['a.mp3', { src: 'b.mp3', title: 'B' }];
        expect(getCurrentTrack(list, 1)).toEqual({ src: 'b.mp3', title: 'B' });
        expect(getCurrentTrack(list, 5)).toEqual({ src: 'b.mp3', title: 'B' });
    });

    it('空列表没有曲目', () => {
        expect(getCurrentTrack([], 0)).toBeUndefined();
    });
});
