import type { ReactElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import { BASE_CLASS_PREFIX } from '@fibrae/semi-foundation/base/constants';
import { AutoComplete, Cascader, Checkbox, ColorPicker, Cropper, DatePicker, Form, PinCode, Radio, Rating, Select, Slider, Switch, TagInput, TimePicker, Transfer, TreeSelect, Upload } from '@fibrae/semi-ui-react';

// Literal JSX attributes on purpose: spread props skip the excess-property check (F6 type half); runtime checks F2.
const onKeyDown = vi.fn<() => void>();
const cases: [string, () => ReactElement, string][] = [
    ['AutoComplete', () => <AutoComplete id="probe" data-probe="" title="t" onKeyUp={onKeyDown} />, 'autocomplete'],
    ['Cascader', () => <Cascader id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'cascader'],
    ['Checkbox', () => <Checkbox id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'checkbox'],
    ['Checkbox.Group', () => <Checkbox.Group id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'checkboxGroup'],
    ['ColorPicker', () => <ColorPicker id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'colorPicker'],
    ['Cropper', () => <Cropper id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'cropper'],
    ['DatePicker', () => <DatePicker id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'datepicker'],
    ['PinCode', () => <PinCode id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'pincode-wrapper'],
    ['Radio', () => <Radio id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'radio'],
    ['Radio.Group', () => <Radio.Group id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'radioGroup'],
    ['Rating', () => <Rating id="probe" data-probe="" title="t" onKeyUp={onKeyDown} />, 'rating'],
    ['Select', () => <Select id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'select'],
    ['Switch', () => <Switch id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'switch'],
    ['TagInput', () => <TagInput id="probe" data-probe="" title="t" onKeyUp={onKeyDown} />, 'tagInput'],
    ['Transfer', () => <Transfer id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'transfer'],
    ['TreeSelect', () => <TreeSelect id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'tree-select'],
    ['Upload', () => <Upload id="probe" data-probe="" title="t" action="/upload" onKeyDown={onKeyDown} />, 'upload'],
    ['Slider', () => <Slider id="probe" data-probe="" title="t" onKeyUp={onKeyDown} />, 'slider-wrapper'],
    ['Form.Slot', () => <Form.Slot id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'form-slot'],
    ['Form.Label', () => <Form.Label id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'form-field-label'],
    ['Form.Section', () => <Form.Section id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />, 'form-section'],
    ['Form.ErrorMessage', () => <Form.ErrorMessage id="probe" data-probe="" title="t" error="e" onKeyDown={onKeyDown} />, 'form-field-error-message'],
    ['Select.OptGroup', () => <Select.OptGroup id="probe" data-probe="" title="t" label="g" onKeyDown={onKeyDown} />, 'select-group'],
];

// A declared `id` goes to the focusable control inside, not the element receiving the rest
const idOnInnerControl = new Set(['AutoComplete', 'Checkbox', 'PinCode', 'Radio', 'Switch', 'TagInput', 'Slider']);
// onKeyDown does not run on the root here (a declared prop, or Slider's handle input); keyUp stands in
const ownsKeyDown = new Set(['AutoComplete', 'Rating', 'TagInput', 'Slider']);

describe('未声明属性落在接收它的元素上，且 Props 类型接受', () => {
    it.each(cases)('%s', (name, renderElement, cls) => {
        onKeyDown.mockClear();
        const { container } = render(renderElement());
        const target = container.querySelector<HTMLElement>('[data-probe]');
        expect(target).toHaveClass(`${BASE_CLASS_PREFIX}-${cls}`);
        expect(document.getElementById('probe')).not.toBeNull();
        expect(target.id === 'probe').toBe(!idOnInnerControl.has(name));
        fireEvent[ownsKeyDown.has(name) ? 'keyUp' : 'keyDown'](target, { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });

    it('TimePicker', () => {
        onKeyDown.mockClear();
        const { container } = render(<TimePicker id="probe" data-probe="" title="t" onKeyDown={onKeyDown} />);
        const input = container.querySelector<HTMLInputElement>('[data-probe]');
        expect(input?.tagName).toBe('INPUT');
        expect(input).toHaveAttribute('id', 'probe');
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
});
