import { describe, expect, it } from 'vite-plus/test';
import OverlaySession from '../overlay-session';

describe('OverlaySession', () => {
    it('一次显示只开始一次、结束一次', () => {
        const session = new OverlaySession();

        expect(session.begin()).toBe(true);
        expect(session.begin()).toBe(false);
        expect(session.end()).toBe(true);
        expect(session.end()).toBe(false);
    });

    it('显示中销毁时结束显示，下次 init 再开始', () => {
        const session = new OverlaySession();

        expect(session.suspend()).toBe(false);
        expect(session.resume()).toBe(false);

        session.begin();
        expect(session.suspend()).toBe(true);
        expect(session.end()).toBe(false);
        session.suspend();
        expect(session.resume()).toBe(false);

        session.begin();
        session.suspend();
        expect(session.resume()).toBe(true);
        expect(session.resume()).toBe(false);
    });
});
