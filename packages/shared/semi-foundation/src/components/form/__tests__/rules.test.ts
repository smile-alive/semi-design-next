import { describe, expect, it, vi } from 'vite-plus/test';
import { isRequired, validateRules, type RuleItem, type RuleMessages } from '../rules';

const messages: RuleMessages = {
    required: 'required',
    invalid: 'invalid',
    stringLen: 'string len ${len}',
    stringMin: 'string min ${min}',
    stringMax: 'string max ${max}',
    numberLen: 'number len ${len}',
    numberMin: 'number min ${min}',
    numberMax: 'number max ${max}',
    arrayLen: 'array len ${len}',
    arrayMin: 'array min ${min}',
    arrayMax: 'array max ${max}',
};

const validate = (rules: RuleItem[], value: unknown, options: { first?: boolean } = {}, values: Record<string, unknown> = {}) => validateRules(rules, value, values, { messages, ...options });

describe('type', () => {
    it.each([
        ['string', 'a', 1],
        ['number', 1.5, Number.NaN],
        ['number', 0, '1'],
        ['integer', 2, 2.5],
        ['float', 2.5, 2],
        ['float', 2.5, Number.POSITIVE_INFINITY],
        ['boolean', false, 0],
        ['array', [1], { length: 1 }],
        ['object', { a: 1 }, [1]],
        ['object', {}, 'x'],
        ['date', new Date(), new Date('invalid')],
        ['date', new Date(0), '2020-01-01'],
        ['email', 'a@b.co', 'a@b'],
        ['url', 'https://semi.design/a?b=1', 'semi.design'],
        ['url', 'http://localhost:3000', 'ftp://semi.design'],
        ['regexp', /a/, '['],
        ['regexp', '^a+$', 1],
        ['method', () => 1, 'fn'],
    ] as const)('%s 接受 %o，拒绝 %o', async (type, valid, invalid) => {
        await expect(validate([{ type }], valid)).resolves.toBeUndefined();
        await expect(validate([{ type }], invalid)).resolves.toEqual(['invalid']);
    });

    it('布尔 false 与数字 0 不算空值', async () => {
        await expect(validate([{ required: true, type: 'boolean' }], false)).resolves.toBeUndefined();
        await expect(validate([{ required: true, type: 'number' }], 0)).resolves.toBeUndefined();
    });
});

describe('required 与空值', () => {
    it.each([
        ['undefined', undefined],
        ['null', null],
        ['空字符串', ''],
        ['空数组', []],
    ])('%s 违反 required', async (_, value) => {
        await expect(validate([{ required: true }], value)).resolves.toEqual(['required']);
    });

    it('纯空白字符串只有 whitespace: true 时算空', async () => {
        await expect(validate([{ required: true }], '  ')).resolves.toBeUndefined();
        await expect(validate([{ required: true, whitespace: true }], '  ')).resolves.toEqual(['required']);
    });

    it('非必填的空值跳过内置检查', async () => {
        const rule: RuleItem = { type: 'number', min: 1, len: 3, pattern: /x/, enum: ['x'] };
        for (const value of [undefined, null, '', []]) {
            await expect(validate([rule], value)).resolves.toBeUndefined();
        }
        await expect(validate([{ min: 3, whitespace: true }], '  ')).resolves.toBeUndefined();
    });

    it('非必填的空值仍执行 validator', async () => {
        const validator = vi.fn<NonNullable<RuleItem['validator']>>(() => 'from validator');
        await expect(validate([{ validator }], undefined, {}, { a: 1 })).resolves.toEqual(['from validator']);
        expect(validator).toHaveBeenCalledWith(undefined, { a: 1 });
    });

    it('必填的空值直接失败，不执行 validator', async () => {
        const validator = vi.fn<NonNullable<RuleItem['validator']>>();
        await expect(validate([{ required: true, validator }], '')).resolves.toEqual(['required']);
        expect(validator).not.toHaveBeenCalled();
    });
});

describe('len、min、max', () => {
    it('字符串按码点计数', async () => {
        await expect(validate([{ len: 2 }], '😀😀')).resolves.toBeUndefined();
        await expect(validate([{ len: 2 }], '😀')).resolves.toEqual(['string len 2']);
        await expect(validate([{ max: 2 }], '😀😀😀')).resolves.toEqual(['string max 2']);
        await expect(validate([{ min: 3 }], '😀😀')).resolves.toEqual(['string min 3']);
    });

    it('数组按元素个数，数字按值本身', async () => {
        await expect(validate([{ len: 2 }], [1])).resolves.toEqual(['array len 2']);
        await expect(validate([{ min: 2 }], [1])).resolves.toEqual(['array min 2']);
        await expect(validate([{ max: 1 }], [1, 2])).resolves.toEqual(['array max 1']);
        await expect(validate([{ len: 5 }], 4)).resolves.toEqual(['number len 5']);
        await expect(validate([{ min: 5 }], 4)).resolves.toEqual(['number min 5']);
        await expect(validate([{ max: 5 }], 6)).resolves.toEqual(['number max 5']);
        await expect(validate([{ min: 0, max: 5 }], 0)).resolves.toBeUndefined();
    });

    it('其他类型的值跳过', async () => {
        await expect(validate([{ len: 1, min: 5, max: 0 }], { a: 1 })).resolves.toBeUndefined();
        await expect(validate([{ min: 5 }], true)).resolves.toBeUndefined();
    });

    it('一条规则只报第一个失败的检查', async () => {
        await expect(validate([{ type: 'string', len: 5, min: 6 }], 'ab')).resolves.toEqual(['string len 5']);
        await expect(validate([{ type: 'string', min: 3 }], 12)).resolves.toEqual(['invalid']);
    });
});

describe('pattern', () => {
    it('字符串 pattern 编译成正则', async () => {
        await expect(validate([{ pattern: '^a+$' }], 'aaa')).resolves.toBeUndefined();
        await expect(validate([{ pattern: '^a+$' }], 'ab')).resolves.toEqual(['invalid']);
    });

    it('带 g 或 y 标志的正则连续调用结果一致', async () => {
        for (const flag of ['g', 'y']) {
            const rule: RuleItem = { pattern: new RegExp('a', flag) };
            await expect(validate([rule], 'a')).resolves.toBeUndefined();
            await expect(validate([rule], 'a')).resolves.toBeUndefined();
            await expect(validate([rule], 'b')).resolves.toEqual(['invalid']);
        }
    });

    it('只检查字符串', async () => {
        await expect(validate([{ pattern: /^x$/ }], 12)).resolves.toBeUndefined();
    });
});

describe('enum', () => {
    it('值不在列表中时失败', async () => {
        await expect(validate([{ enum: ['a', 'b'] }], 'a')).resolves.toBeUndefined();
        await expect(validate([{ enum: ['a', 'b'] }], 'c')).resolves.toEqual(['invalid']);
    });
});

describe('transform', () => {
    it('先变换再检查，validator 收到变换后的值', async () => {
        const validator = vi.fn<NonNullable<RuleItem['validator']>>();
        await expect(validate([{ required: true, type: 'number', transform: Number, validator }], '12')).resolves.toBeUndefined();
        expect(validator).toHaveBeenCalledWith(12, {});
        await expect(validate([{ required: true, transform: (value: string) => value.trim() }], '  ')).resolves.toEqual(['required']);
    });
});

describe('message', () => {
    it('替换所有内置检查的默认文案', async () => {
        await expect(validate([{ message: 'custom', required: true }], '')).resolves.toEqual(['custom']);
        await expect(validate([{ message: 'custom', type: 'number' }], 'a')).resolves.toEqual(['custom']);
        await expect(validate([{ message: 'custom', min: 3 }], 'a')).resolves.toEqual(['custom']);
        await expect(validate([{ message: 'custom', pattern: /x/ }], 'a')).resolves.toEqual(['custom']);
        await expect(validate([{ message: 'custom', enum: ['x'] }], 'a')).resolves.toEqual(['custom']);
    });

    it('message 为空字符串时失败但没有文案', async () => {
        await expect(validate([{ message: '', required: true }], '')).resolves.toEqual(['']);
        await expect(validate([{ message: '', max: 1 }], 'ab')).resolves.toEqual(['']);
    });
});

describe('validator', () => {
    it('返回 false 失败，文案取 message 或 invalid', async () => {
        await expect(validate([{ validator: () => false }], 'a')).resolves.toEqual(['invalid']);
        await expect(validate([{ message: 'no', validator: () => false }], 'a')).resolves.toEqual(['no']);
    });

    it('返回字符串或字符串数组时作为错误，空字符串视为通过', async () => {
        await expect(validate([{ validator: () => 'bad' }], 'a')).resolves.toEqual(['bad']);
        await expect(validate([{ validator: () => ['x', 'y'] }], 'a')).resolves.toEqual(['x', 'y']);
        await expect(validate([{ validator: () => '' }], 'a')).resolves.toBeUndefined();
        await expect(validate([{ validator: () => [] }], 'a')).resolves.toBeUndefined();
    });

    it('返回 true、undefined、null 通过', async () => {
        await expect(validate([{ validator: () => true }], 'a')).resolves.toBeUndefined();
        await expect(validate([{ validator: () => undefined }], 'a')).resolves.toBeUndefined();
        await expect(validate([{ validator: () => null }], 'a')).resolves.toBeUndefined();
    });

    it('抛错或 reject 时取错误文案，message 优先', async () => {
        await expect(
            validate(
                [
                    {
                        validator: () => {
                            throw new Error('thrown');
                        },
                    },
                ],
                'a'
            )
        ).resolves.toEqual(['thrown']);
        await expect(validate([{ validator: () => Promise.reject(new Error('rejected')) }], 'a')).resolves.toEqual(['rejected']);
        await expect(validate([{ validator: () => Promise.reject('plain') }], 'a')).resolves.toEqual(['plain']);
        await expect(validate([{ message: 'custom', validator: () => Promise.reject(new Error('rejected')) }], 'a')).resolves.toEqual(['custom']);
    });

    it('支持异步 validator，并收到整个表单的值', async () => {
        const validator = vi.fn<NonNullable<RuleItem['validator']>>(async (_, values) => (values.other === 1 ? 'async bad' : true));
        await expect(validate([{ validator }], 'a', {}, { other: 1 })).resolves.toEqual(['async bad']);
        await expect(validate([{ validator }], 'a', {}, { other: 2 })).resolves.toBeUndefined();
    });

    it('内置检查失败时不执行 validator', async () => {
        const validator = vi.fn<NonNullable<RuleItem['validator']>>();
        await expect(validate([{ type: 'number', validator }], 'a')).resolves.toEqual(['invalid']);
        expect(validator).not.toHaveBeenCalled();
    });
});

describe('多条规则', () => {
    it('没有规则或全部通过时得到 undefined', async () => {
        await expect(validate([], 'a')).resolves.toBeUndefined();
        await expect(validate([{ type: 'string' }, { min: 1 }], 'a')).resolves.toBeUndefined();
    });

    it('按规则顺序收集所有失败的消息', async () => {
        const slow = async () => {
            await new Promise((resolve) => setTimeout(resolve, 20));
            return 'slow';
        };
        await expect(validate([{ validator: slow }, { type: 'number' }, { min: 5 }, { validator: () => 'last' }], 'abc')).resolves.toEqual(['slow', 'invalid', 'string min 5', 'last']);
    });

    it('first 只返回第一条失败，之后的规则不执行', async () => {
        const second = vi.fn<NonNullable<RuleItem['validator']>>(() => 'second');
        const third = vi.fn<NonNullable<RuleItem['validator']>>(() => 'third');
        await expect(validate([{ min: 1 }, { type: 'number', message: 'first' }, { validator: second }, { validator: third }], 'abc', { first: true })).resolves.toEqual(['first']);
        expect(second).not.toHaveBeenCalled();
        expect(third).not.toHaveBeenCalled();
    });

    it('first 在全部通过时执行每条规则', async () => {
        const validator = vi.fn<NonNullable<RuleItem['validator']>>(() => true);
        await expect(validate([{ validator }, { validator }], 'a', { first: true })).resolves.toBeUndefined();
        expect(validator).toHaveBeenCalledTimes(2);
    });
});

describe('isRequired', () => {
    it('任一规则 required 为 true 即为 true', () => {
        expect(isRequired()).toBe(false);
        expect(isRequired([])).toBe(false);
        expect(isRequired([{ type: 'string' }, { required: false }])).toBe(false);
        expect(isRequired([{ type: 'string' }, { required: true }])).toBe(true);
    });
});
