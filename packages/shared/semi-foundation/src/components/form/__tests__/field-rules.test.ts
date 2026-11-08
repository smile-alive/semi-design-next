import { describe, expect, it, vi } from 'vite-plus/test';
import FieldStore from '../field-store';
import { cloneFormValue, createFieldRegistration, getFieldAriaProps, isRequiredByRules, mergeFieldConfig, resolveFieldInitValue, resolveKeepState, type FieldAriaState, type FieldRegistrationView } from '../utils';

describe('resolveFieldInitValue', () => {
    it.each([
        ['没有 initValue 时取表单值', undefined, 'form', true, 'form'],
        ['ArrayField 之外 initValue 优先', 'own', 'form', true, 'own'],
        ['setValues 之后取表单值', 'own', 'form', false, 'form'],
        ['setValues 之后表单没有值时回退 initValue', 'own', undefined, false, 'own'],
    ])('%s', (_, initValue, valueInForm, shouldUseInitValue, expected) => {
        expect(resolveFieldInitValue(initValue, valueInForm, shouldUseInitValue)).toBe(expected);
    });
});

describe('mergeFieldConfig', () => {
    it('字段没有设置时取 Form 的值，extraTextPosition 默认 bottom，trigger 默认 change', () => {
        expect(mergeFieldConfig({}, {})).toEqual({
            labelPosition: undefined,
            labelWidth: undefined,
            labelAlign: undefined,
            labelCol: undefined,
            wrapperCol: undefined,
            extraTextPosition: 'bottom',
            stopValidateWithError: false,
            trigger: ['change'],
            allowEmpty: false,
        });
        const col = { span: 6 };
        expect(mergeFieldConfig({}, { labelPosition: 'left', labelWidth: 80, labelAlign: 'right', labelCol: col, wrapperCol: col, extraTextPosition: 'middle', stopValidateWithError: true, trigger: 'blur', allowEmpty: true })).toEqual({
            labelPosition: 'left',
            labelWidth: 80,
            labelAlign: 'right',
            labelCol: col,
            wrapperCol: col,
            extraTextPosition: 'middle',
            stopValidateWithError: true,
            trigger: ['blur'],
            allowEmpty: true,
        });
    });

    it('字段自身的设置优先，stopValidateWithError 为 false 也覆盖 Form', () => {
        const merged = mergeFieldConfig({ labelPosition: 'top', extraTextPosition: 'bottom', stopValidateWithError: false, trigger: ['blur', 'mount'] }, { labelPosition: 'left', extraTextPosition: 'middle', stopValidateWithError: true, trigger: 'change' });
        expect(merged).toMatchObject({ labelPosition: 'top', extraTextPosition: 'bottom', stopValidateWithError: false, trigger: ['blur', 'mount'] });
    });
});

describe('resolveKeepState', () => {
    it.each([
        [false, true, true, false],
        [undefined, false, true, false],
        [undefined, undefined, false, false],
        [undefined, undefined, undefined, true],
    ])('字段 %s、ArrayField %s、Form %s 时为 %s', (own, arrayField, form, expected) => {
        expect(resolveKeepState(own, arrayField, form)).toBe(expected);
    });
});

describe('createFieldRegistration', () => {
    const identity = { id: 'f', field: 'name', store: new FieldStore({}), inArrayField: false };

    it('每次读取都取最新的属性，字段自身的设置优先于 Form', () => {
        const view: FieldRegistrationView = { props: {}, formProps: { allowEmpty: true, stopValidateWithError: true, trigger: 'blur' }, arrayFieldKeepState: false };
        const registration = createFieldRegistration(identity, () => view);
        expect(registration.keepState).toBe(false);
        expect(registration.allowEmpty).toBe(true);
        expect(registration.getValidateOptions()).toMatchObject({ stopValidateWithError: true, trigger: ['blur'] });
        expect(registration.getChangeOptions()).toMatchObject({ allowEmpty: true, emptyValue: '' });

        view.props = { keepState: true, stopValidateWithError: false, trigger: ['change', 'mount'], emptyValue: null };
        view.formProps = {};
        expect(registration.keepState).toBe(true);
        expect(registration.allowEmpty).toBe(false);
        expect(registration.getValidateOptions()).toMatchObject({ stopValidateWithError: false, trigger: ['change', 'mount'] });
        expect(registration.getChangeOptions()).toMatchObject({ allowEmpty: false, emptyValue: null });
    });

    it('allowEmptyString 让注册时的空字符串留在表单值里', () => {
        expect(createFieldRegistration(identity, () => ({ props: { allowEmptyString: true }, formProps: {} })).allowEmpty).toBe(true);
    });
});

describe('isRequiredByRules', () => {
    const rules = [{ required: true }];
    const schema = { '~standard': { version: 1, vendor: 'test', validate: () => ({ value: {} }) } } as const;

    it('有 schema 且没有 Form validator 时规则不算必填', () => {
        expect(isRequiredByRules({}, rules)).toBe(true);
        expect(isRequiredByRules({}, [{ min: 1 }])).toBe(false);
        expect(isRequiredByRules({ schema }, rules)).toBe(false);
        expect(isRequiredByRules({ schema, validator: () => ({}) }, rules)).toBe(true);
    });
});

describe('getFieldAriaProps', () => {
    const base: FieldAriaState = {
        own: {},
        ids: { label: 'f-label', helpText: 'f-helpText', extraText: 'f-extraText', errorMessage: 'f-errormessage' },
        rulesRequired: false,
        labelPosition: 'top',
        inGroup: false,
        hasHelpText: false,
        hasExtraText: false,
        error: undefined,
        errorHasContent: false,
    };

    it('默认布局引用 label，没有错误时不带 aria-invalid、aria-errormessage', () => {
        expect(getFieldAriaProps(base)).toEqual({ 'aria-required': false, 'aria-labelledby': 'f-label', 'aria-describedby': undefined });
    });

    it('rules 或 label 的 required 使控件必填，label 同时 optional 时不必填，使用方的 aria-required 优先', () => {
        expect(getFieldAriaProps({ ...base, rulesRequired: true })['aria-required']).toBe(true);
        expect(getFieldAriaProps({ ...base, label: { required: true } })['aria-required']).toBe(true);
        expect(getFieldAriaProps({ ...base, label: { required: true, optional: true } })['aria-required']).toBe(false);
        expect(getFieldAriaProps({ ...base, rulesRequired: true, own: { 'aria-required': false } })['aria-required']).toBe(false);
    });

    it('使用方的 id 排在前面；noLabel 时不引用 label，pure 时只有 inset label 被引用', () => {
        expect(getFieldAriaProps({ ...base, own: { 'aria-labelledby': 'mine' } })['aria-labelledby']).toBe('mine f-label');
        expect(getFieldAriaProps({ ...base, noLabel: true })['aria-labelledby']).toBeUndefined();
        expect(getFieldAriaProps({ ...base, pure: true })['aria-labelledby']).toBeUndefined();
        expect(getFieldAriaProps({ ...base, pure: true, labelPosition: 'inset' })['aria-labelledby']).toBe('f-label');
    });

    it('helpText 只在没有错误且渲染 ErrorMessage 时描述控件，extraText 只在自身布局中描述控件', () => {
        const withTexts = { ...base, hasHelpText: true, hasExtraText: true, own: { 'aria-describedby': 'mine' } };
        expect(getFieldAriaProps(withTexts)['aria-describedby']).toBe('mine f-helpText f-extraText');
        expect(getFieldAriaProps({ ...withTexts, error: ['err'] })['aria-describedby']).toBe('mine f-extraText');
        expect(getFieldAriaProps({ ...withTexts, error: [''], shownStatus: 'error' })['aria-describedby']).toBe('mine f-extraText');
        expect(getFieldAriaProps({ ...withTexts, noErrorMessage: true })['aria-describedby']).toBe('mine f-extraText');
        expect(getFieldAriaProps({ ...withTexts, inGroup: true })['aria-describedby']).toBe('mine');
    });

    it('校验失败或 validateStatus 为 error 时带 aria-invalid；有内容的错误由自身 ErrorMessage 渲染时带 aria-errormessage', () => {
        const failed = { ...base, status: 'error', shownStatus: 'error', error: ['err'], errorHasContent: true };
        expect(getFieldAriaProps(failed)).toMatchObject({ 'aria-invalid': true, 'aria-errormessage': 'f-errormessage' });
        expect(getFieldAriaProps({ ...failed, shownStatus: 'warning' })).toMatchObject({ 'aria-invalid': true, 'aria-errormessage': 'f-errormessage' });
        expect(getFieldAriaProps({ ...base, shownStatus: 'error' })).toMatchObject({ 'aria-invalid': true });
        expect(getFieldAriaProps({ ...failed, noErrorMessage: true })).not.toHaveProperty('aria-errormessage');
        expect(getFieldAriaProps({ ...failed, errorHasContent: false })).not.toHaveProperty('aria-errormessage');
    });

    it('InputGroup 内有内容的错误保留组传入的 aria-errormessage，否则清除', () => {
        const inGroup = { ...base, inGroup: true };
        expect(getFieldAriaProps(inGroup)).toHaveProperty('aria-errormessage', undefined);
        expect(getFieldAriaProps({ ...inGroup, status: 'error', errorHasContent: true })).not.toHaveProperty('aria-errormessage');
    });
});

describe('cloneFormValue', () => {
    const node = { opaque: true };
    const isOpaque = (value: unknown) => value === node;

    it('函数、Error、框架节点按引用保留，其余深拷贝', () => {
        const fn = () => 1;
        const error = new TypeError('e');
        const value = { fn, error, node, nested: { list: [{ a: 1 }] } };
        const copy = cloneFormValue(value, isOpaque);
        expect(copy.fn).toBe(fn);
        expect(copy.error).toBe(error);
        expect(copy.node).toBe(node);
        expect(copy.nested).not.toBe(value.nested);
        expect(copy.nested.list[0]).not.toBe(value.nested.list[0]);
        expect(copy).toEqual(value);
    });

    it('DOMException 按引用保留', () => {
        // jsdom's DOMException does not extend Error; a browser's does and reports the tag [object DOMException]
        class AbortError extends Error {
            get [Symbol.toStringTag]() {
                return 'DOMException';
            }
        }
        const error = new AbortError('aborted');
        expect(cloneFormValue({ error }, isOpaque).error).toBe(error);
    });

    it('越界数组保留键并给出警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const outOfBounds: unknown[] = [];
        (outOfBounds as unknown as Record<string, unknown>)['4294967295'] = 'x';
        const copy = cloneFormValue({ outOfBounds }, isOpaque).outOfBounds as unknown as Record<string, unknown>;
        expect(copy).not.toBe(outOfBounds);
        expect(Array.isArray(copy)).toBe(true);
        expect(copy['4294967295']).toBe('x');
        expect(warn).toHaveBeenCalledOnce();
    });
});
