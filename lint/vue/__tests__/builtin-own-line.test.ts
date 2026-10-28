import { RuleTester } from 'eslint';
import vue from 'eslint-plugin-vue';
import { describe, it } from 'vite-plus/test';
import { builtinOwnLine } from '../builtin-own-line.ts';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const parser = vue.configs['flat/base'].find((config) => config.languageOptions?.parser)?.languageOptions?.parser;
const tester = new RuleTester({ languageOptions: { parser, ecmaVersion: 'latest', sourceType: 'module' } });
const sfc = (...lines: string[]) => ['<template>', ...lines, '</template>'].join('\n');
const errors = (...names: string[]) => names.map((name) => ({ messageId: 'ownLine', data: { name } }));

tester.run('builtin-own-line', builtinOwnLine, {
    valid: [
        sfc('<Typography>', '    <template #title>{{ title }}</template>', '</Typography>'),
        sfc('<div>', '    <slot name="x">{{ fallback }}</slot>', '</div>'),
        // Glued to text, an interpolation or a space-separated sibling: every break there renders differently
        sfc('<p>Hello<slot />world</p>'),
        sfc('<div><i /> <slot /></div>'),
        sfc('<Comp><template #a>{{ a }}</template>{{ b }}<template #b>{{ b }}</template></Comp>'),
        // Neutral breaks the formatter would join again, as the children fit on one line
        sfc('<div>{{ a }}<slot /></div>'),
        sfc('<p>Hello <slot /> world</p>'),
        sfc('<Paragraph> ab<template v-if="done">!</template>{{ rest }} </Paragraph>'),
        // Opening the template would leave text against its tags, where the formatter hangs the brackets instead
        sfc('<Carousel>', '    <template #rightArrow>Forward <i /></template>', '</Carousel>'),
        sfc('<component :is="p">before <component :is="img" /> after</component>'),
        // Opening an element whose end tag is glued to text or an interpolation would make the formatter hang its bracket
        sfc('<p><template v-if="a"><i /><b /></template>tail</p>'),
        sfc('<p><template v-if="a"><i /><b /></template>{{ x }}</p>'),
        sfc('<div>', '    <Transition><span v-if="a" /><i v-else /></Transition>{{ x }}', '</div>'),
        sfc('<p><span><template v-if="a"><i /><b /></template></span>tail</p>'),
        // Opening the template would make the formatter wrap the space before it
        sfc('<Avatar>', '    <slot /> <template #mask><slot name="mask" /></template>', '</Avatar>'),
        // `&#32;` decodes to a space, which a line break would remove
        sfc('<Comp>', '    <i />&#32; <slot />', '</Comp>'),
        sfc('<pre><slot /></pre>'),
        sfc('<div v-pre><slot /></div>'),
    ],
    invalid: [
        {
            code: sfc('<Upload>', '    <template v-if="$slots.uploadTip" #uploadTip><slot name="uploadTip" /></template>', '</Upload>'),
            output: sfc('<Upload>', '    <template v-if="$slots.uploadTip" #uploadTip>', '<slot name="uploadTip" />', '</template>', '</Upload>'),
            errors: errors('template', 'slot'),
        },
        {
            code: sfc('<Tooltip><template #content>tip</template><Checkbox>label</Checkbox></Tooltip>'),
            output: sfc('<Tooltip>', '<template #content>tip</template>', '<Checkbox>label</Checkbox>', '</Tooltip>'),
            errors: errors('template'),
        },
        {
            code: sfc('<span class="a"><slot /></span>'),
            output: sfc('<span class="a">', '<slot />', '</span>'),
            errors: errors('slot'),
        },
        {
            code: sfc('<div>', '    <i /><slot /><b />', '</div>'),
            output: sfc('<div>', '    <i />', '<slot />', '<b />', '</div>'),
            errors: errors('slot'),
        },
        {
            code: sfc('<div><!-- note --><slot /></div>'),
            output: sfc('<div>', '<!-- note -->', '<slot />', '</div>'),
            errors: errors('slot'),
        },
        {
            code: sfc('<div><template', '    v-if="x">{{ y }}</template></div>'),
            output: sfc('<div>', '<template', '    v-if="x">{{ y }}</template>', '</div>'),
            errors: errors('template'),
        },
        {
            code: sfc('<template', '    v-if="x"><span /></template>'),
            output: sfc('<template', '    v-if="x">', '<span />', '</template>'),
            errors: errors('template'),
        },
        {
            code: sfc('<Comp><template #a><template v-if="x">A</template></template></Comp>'),
            output: sfc('<Comp>', '<template #a>', '<template v-if="x">A</template>', '</template>', '</Comp>'),
            errors: errors('template', 'template'),
        },
        {
            code: sfc('<Comp>{{ a }}<template #x>{{ b }}</template></Comp>'),
            output: sfc('<Comp>', '{{ a }}<template #x>{{ b }}</template>', '</Comp>'),
            errors: errors('template'),
        },
        {
            code: sfc('<Comp><template #a><IconA /><span>x</span></template></Comp>'),
            output: sfc('<Comp>', '<template #a>', '<IconA />', '<span>x</span>', '</template>', '</Comp>'),
            errors: errors('template'),
        },
        {
            code: sfc('<div>', '    <Transition><span v-if="a" /><i v-else /></Transition>', '</div>'),
            output: sfc('<div>', '    <Transition>', '<span v-if="a" />', '<i v-else />', '</Transition>', '</div>'),
            errors: errors('Transition'),
        },
        {
            code: sfc('<div>', '    <slot name="x"><i /><b /></slot>', '</div>'),
            output: sfc('<div>', '    <slot name="x">', '<i />', '<b />', '</slot>', '</div>'),
            errors: errors('slot'),
        },
        {
            code: sfc('<template v-if="x"><br /><br /></template>'),
            output: sfc('<template v-if="x">', '<br />', '<br />', '</template>'),
            errors: errors('template'),
        },
        {
            code: '<template><slot /></template>',
            output: sfc('<slot />'),
            errors: errors('slot'),
        },
        {
            code: sfc('<div>', '<Transition><span /></Transition>', '<KeepAlive><Comp /></KeepAlive>', '<transition-group><i /></transition-group>', '</div>'),
            output: sfc('<div>', '<Transition>', '<span />', '</Transition>', '<KeepAlive>', '<Comp />', '</KeepAlive>', '<transition-group>', '<i />', '</transition-group>', '</div>'),
            errors: errors('Transition', 'KeepAlive', 'transition-group'),
        },
    ],
});
