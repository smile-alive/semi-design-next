import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { isValidTimezoneIANAString, toIANA, utcToZonedTime, zonedTimeToUtc } from '../date-fns-extra';

// System zones with a 1-hour DST (both hemispheres), a 30-minute DST and none at all
const SYSTEM_ZONES = ['Asia/Shanghai', 'UTC', 'America/New_York', 'Europe/London', 'Australia/Lord_Howe'];

type WallTime = [year: number, monthIndex: number, day: number, hours: number, minutes: number];
type WallTimeCase = [timeZone: string, wall: WallTime, expected: string];

// [target zone, wall time [year, monthIndex, day, hours, minutes], expected instant]
const REPEATED_WALL_TIMES: WallTimeCase[] = [
    ['America/New_York', [2026, 10, 1, 1, 30], '2026-11-01T05:30:00.000Z'],
    ['Europe/London', [2026, 9, 25, 1, 30], '2026-10-25T00:30:00.000Z'],
    ['Australia/Lord_Howe', [2026, 3, 5, 1, 45], '2026-04-04T14:45:00.000Z'],
];
const GAP_WALL_TIMES: WallTimeCase[] = [
    // 02:30 EST does not exist, 03:30 EDT
    ['America/New_York', [2026, 2, 8, 2, 30], '2026-03-08T07:30:00.000Z'],
    // 01:30 GMT does not exist, 02:30 BST
    ['Europe/London', [2026, 2, 29, 1, 30], '2026-03-29T01:30:00.000Z'],
    // 02:15 +10:30 does not exist, 02:45 +11:00
    ['Australia/Lord_Howe', [2026, 9, 4, 2, 15], '2026-10-03T15:45:00.000Z'],
];

const wallOf = (date: Date) => [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()];

describe.each(SYSTEM_ZONES)('系统时区 %s 中 date-fns-extra 的 DST 处理', (systemZone) => {
    const originalTZ = process.env.TZ;
    beforeEach(() => {
        process.env.TZ = systemZone;
    });
    afterEach(() => {
        process.env.TZ = originalTZ;
    });

    it.each(REPEATED_WALL_TIMES)('zonedTimeToUtc 将重复的 %s 本地时间解析为较早的时刻', (timeZone, wall, expected) => {
        expect(zonedTimeToUtc(new Date(...wall), timeZone).toISOString()).toBe(expected);
    });

    // A system-local Date cannot hold a wall time inside the system zone's own gap
    it.each(GAP_WALL_TIMES.filter(([timeZone]) => timeZone !== systemZone))('zonedTimeToUtc 将落在间隙中的 %s 本地时间向后移动间隙长度', (timeZone, wall, expected) => {
        expect(zonedTimeToUtc(new Date(...wall), timeZone).toISOString()).toBe(expected);
    });

    it('utcToZonedTime 将重复小时的两个时刻显示为相同的本地时间', () => {
        expect(wallOf(utcToZonedTime('2026-11-01T05:30:00.000Z', 'America/New_York'))).toEqual([2026, 10, 1, 1, 30]);
        expect(wallOf(utcToZonedTime('2026-11-01T06:30:00.000Z', 'America/New_York'))).toEqual([2026, 10, 1, 1, 30]);
        expect(wallOf(utcToZonedTime('2026-04-04T14:45:00.000Z', 'Australia/Lord_Howe'))).toEqual([2026, 3, 5, 1, 45]);
        expect(wallOf(utcToZonedTime('2026-04-04T15:15:00.000Z', 'Australia/Lord_Howe'))).toEqual([2026, 3, 5, 1, 45]);
    });

    it.each(['America/New_York', 'Australia/Lord_Howe'])('utcToZonedTime 与 zonedTimeToUtc 在 %s 切换前后往返一致', (timeZone) => {
        // The later instant of a repeated hour is left out: its wall time resolves to the earlier one
        const instants = ['2026-03-08T06:59:59.999Z', '2026-03-08T07:00:00.000Z', '2026-11-01T05:30:00.000Z', '2026-10-03T15:30:00.000Z', '2026-04-04T14:45:00.000Z'];
        const roundTripped = instants.map((iso) => zonedTimeToUtc(utcToZonedTime(iso, timeZone), timeZone).toISOString());
        expect(roundTripped).toEqual(instants);
    });

    it('无 DST 时转换数字与偏移时区', () => {
        const wall: WallTime = [2026, 10, 1, 1, 30];
        expect(zonedTimeToUtc(new Date(...wall), -5).toISOString()).toBe('2026-11-01T06:30:00.000Z');
        expect(zonedTimeToUtc(new Date(...wall), 5.5).toISOString()).toBe('2026-10-31T20:00:00.000Z');
        expect(zonedTimeToUtc(new Date(...wall), 'GMT+08:00').toISOString()).toBe('2026-10-31T17:30:00.000Z');
        expect(zonedTimeToUtc(new Date(...wall), '+05:30').toISOString()).toBe('2026-10-31T20:00:00.000Z');
        expect(wallOf(utcToZonedTime('2026-11-01T06:30:00.000Z', -5))).toEqual(wall);
        expect(wallOf(utcToZonedTime('2026-10-31T17:30:00.000Z', 8))).toEqual(wall);
    });
});

describe('toIANA', () => {
    it('把小时偏移与 GMT 字符串转为固定偏移，其他字符串保持不变', () => {
        expect([8, -3.5, 13.75, 5.25, 0, -0].map(toIANA)).toEqual(['+08:00', '-03:30', '+13:45', '+05:15', '+00:00', '+00:00']);
        expect(['GMT-03:30', '+05:30', 'Asia/Shanghai', '+0800'].map(toIANA)).toEqual(['-03:30', '+05:30', 'Asia/Shanghai', '+0800']);
    });

    it('小数小时偏移在各季节保持固定', () => {
        const wall: WallTime = [2026, 0, 15, 12, 0];
        const summerWall: WallTime = [2026, 6, 15, 12, 0];
        expect(zonedTimeToUtc(new Date(...wall), -3.5).toISOString()).toBe('2026-01-15T15:30:00.000Z');
        expect(zonedTimeToUtc(new Date(...summerWall), -3.5).toISOString()).toBe('2026-07-15T15:30:00.000Z');
        expect(zonedTimeToUtc(new Date(...summerWall), 10.5).toISOString()).toBe('2026-07-15T01:30:00.000Z');
        expect(zonedTimeToUtc(new Date(...wall), 10.5).toISOString()).toBe('2026-01-15T01:30:00.000Z');
    });
});

describe('isValidTimezoneIANAString', () => {
    it('合法时区返回 true，重复调用结果不变', () => {
        expect(isValidTimezoneIANAString('Asia/Shanghai')).toBe(true);
        expect(isValidTimezoneIANAString('Asia/Shanghai')).toBe(true);
    });

    it('非法字符串和 Object.prototype 上的键返回 false', () => {
        expect(isValidTimezoneIANAString('Not/AZone')).toBe(false);
        expect(isValidTimezoneIANAString('constructor')).toBe(false);
        expect(isValidTimezoneIANAString('toString')).toBe(false);
    });
});

describe('系统时区含 DST 时的 utcToZonedTime', () => {
    const originalTZ = process.env.TZ;
    afterEach(() => {
        process.env.TZ = originalTZ;
    });

    it('将系统时区间隙内的本地时间按系统间隙向后移动', () => {
        process.env.TZ = 'America/New_York';
        expect(wallOf(utcToZonedTime('2026-03-08T02:30:00.000Z', 'UTC'))).toEqual([2026, 2, 8, 3, 30]);
    });
});

/**
 * Replay of the helpers DatePicker and TimePicker are built on. The snapshot pins their outputs so that a change of
 * the underlying date library is proven to keep the same results. It runs in the unit project's Asia/Shanghai, whose
 * 1986-1991 DST gaps the 1988 cases hit through the system-local Dates.
 */
describe('date-fns-extra 回放', () => {
    const TIME_ZONES = ['Asia/Shanghai', 'America/New_York', 'Europe/London', 'UTC', 'Asia/Kolkata', 'Pacific/Chatham', 8, -5, 0, 5.5, -9.5, 13.75, 5.25, 'GMT+08:00', 'GMT-03:30', '+05:30', '+0800', '+08', 'Z', 'Invalid/Zone'];

    const INSTANTS = [
        '2024-06-15T12:34:56.789Z',
        '2024-01-15T00:00:00.000Z',
        '2024-02-29T23:59:59.999Z',
        '2024-03-10T06:59:59.999Z',
        '2024-03-10T07:00:00.000Z',
        '2024-11-03T05:30:00.000Z',
        '2024-11-03T06:30:00.000Z',
        '2024-03-31T00:59:59.999Z',
        '2024-03-31T01:00:00.000Z',
        '2024-10-27T00:30:00.000Z',
        '2024-10-27T01:30:00.000Z',
        // Pacific/Chatham, a +12:45/+13:45 zone
        '2024-04-06T13:30:00.000Z',
        '2024-04-06T14:30:00.000Z',
        '2024-09-28T13:59:59.999Z',
        '2024-09-28T14:00:00.000Z',
        // Wall time 02:30 inside the 1988 Asia/Shanghai DST gap for UTC-like zones
        '1988-04-17T02:30:00.000Z',
        // Local mean time offsets with seconds
        '1900-01-01T00:00:00.000Z',
    ];

    // [year, monthIndex, day, hours, minutes, seconds, ms] read as system-local wall time
    const WALL_TIMES = [
        [2024, 5, 15, 12, 34, 56, 789],
        [2024, 0, 15, 0, 0, 0, 0],
        [2024, 2, 10, 2, 30, 0, 0],
        [2024, 10, 3, 1, 30, 0, 0],
        [2024, 2, 31, 1, 30, 0, 0],
        [2024, 9, 27, 1, 30, 0, 0],
        // Pacific/Chatham gap (02:45-03:45) and overlap
        [2024, 8, 29, 3, 0, 0, 0],
        [2024, 3, 7, 3, 0, 0, 0],
        // Asia/Shanghai 1988 gap in the system zone
        [1988, 3, 17, 2, 30, 0, 0],
        [1900, 0, 1, 0, 0, 0, 0],
    ];

    const ISO_STRINGS = ['2024-06-15T12:34:56', '2024-06-15', '2024-06-15T12:34:56Z', '2024-06-15T12:34:56+05:00'];

    const pad = (n: number, len = 2) => String(n).padStart(len, '0');

    // Library independent rendering: the system-local wall time plus the epoch, so both halves of a Date are pinned
    const describeDate = (d: unknown) => {
        if (!(d instanceof Date)) return `not a Date: ${String(d)}`;
        if (Number.isNaN(d.getTime())) return 'Invalid Date';
        const wall = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
        return `${wall} local, ${d.toISOString()}`;
    };

    const attempt = (fn: () => string) => {
        try {
            return fn();
        } catch (error) {
            return `throws ${(error as Error).name}`;
        }
    };

    const wallDate = (parts: number[]) => new Date(...(parts as [number, number, number, number, number, number, number]));

    it('utcToZonedTime', () => {
        const result: Record<string, string> = {};
        for (const timeZone of TIME_ZONES) {
            for (const iso of INSTANTS) {
                result[`${timeZone} @ ${iso}`] = attempt(() => describeDate(utcToZonedTime(new Date(iso), timeZone)));
            }
            const ms = Date.parse(INSTANTS[0]);
            result[`${timeZone} @ number ${ms}`] = attempt(() => describeDate(utcToZonedTime(ms, timeZone)));
            for (const str of ISO_STRINGS) {
                result[`${timeZone} @ string ${str}`] = attempt(() => describeDate(utcToZonedTime(str, timeZone)));
            }
        }
        expect(result).toMatchSnapshot();
    });

    it('zonedTimeToUtc', () => {
        const result: Record<string, string> = {};
        for (const timeZone of TIME_ZONES) {
            for (const parts of WALL_TIMES) {
                result[`${timeZone} @ ${parts.join(',')}`] = attempt(() => describeDate(zonedTimeToUtc(wallDate(parts), timeZone)));
            }
            const ms = wallDate(WALL_TIMES[0]).getTime();
            result[`${timeZone} @ number ${ms}`] = attempt(() => describeDate(zonedTimeToUtc(ms, timeZone)));
            for (const str of ISO_STRINGS) {
                result[`${timeZone} @ string ${str}`] = attempt(() => describeDate(zonedTimeToUtc(str, timeZone)));
            }
        }
        expect(result).toMatchSnapshot();
    });

    it('utcToZonedTime 与 zonedTimeToUtc 往返一致', () => {
        const result: Record<string, string> = {};
        for (const timeZone of TIME_ZONES) {
            for (const iso of INSTANTS) {
                result[`${timeZone} @ ${iso}`] = attempt(() => describeDate(zonedTimeToUtc(utcToZonedTime(new Date(iso), timeZone), timeZone)));
            }
        }
        expect(result).toMatchSnapshot();
    });
});
