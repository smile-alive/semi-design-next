import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import ts from 'typescript';
import { createCheckerByJson, type ComponentMeta, type ExposeMeta, TypeMeta } from 'vue-component-meta';
import { apiFiles, apiType, type Description, type Locale, locales, renderTable, root, runCli, website, writeFragments } from './api-table.ts';

type Group = 'props' | 'events' | 'slots' | 'exposed';
export interface ApiDescription {
    source: string;
    props: Record<string, Description>;
    events: Record<string, Description>;
    slots: Record<string, Description>;
    exposed: Record<string, Description>;
}
export type VueApi = Pick<ComponentMeta, 'props' | 'events' | 'slots'> & { exposed: Pick<ExposeMeta, 'name' | 'type'>[] };

const groups: Group[] = ['props', 'events', 'slots', 'exposed'];
const titles = ['Props', 'Events', 'Slots', 'Exposes'];
const headings: Record<Locale, string[][]> = {
    'zh-CN': [
        ['属性', '说明', '类型', '默认值'],
        ['事件', '说明', '回调参数'],
        ['插槽', '说明', '作用域参数'],
        ['名称', '说明', '类型'],
    ],
    'en-US': [
        ['Property', 'Description', 'Type', 'Default'],
        ['Event', 'Description', 'Callback parameters'],
        ['Slot', 'Description', 'Scope parameters'],
        ['Name', 'Description', 'Type'],
    ],
};

// semiDefault(component, prop, fallback) reads the global default first; the table documents the fallback
function defaultValue(member: object) {
    const value = 'default' in member && typeof member.default === 'string' ? member.default : 'undefined';
    return /^semiDefault\(\s*"[^"]*",\s*"[^"]*",\s*([\s\S]*)\)(?: as [\s\S]+)?$/.exec(value)?.[1] ?? value;
}

export function renderApi(meta: VueApi, description: ApiDescription, locale: Locale) {
    return (
        groups
            .map((group, index) => {
                const members = group === 'props' ? ownProps(meta) : meta[group];
                const rows = members.map((member) => {
                    const cells = [apiType(member.type, 'required' in member && !member.required)];
                    if (group === 'props') cells.push(apiType(defaultValue(member)));
                    return { name: member.name, cells };
                });
                return renderTable(group, titles[index], headings[locale][index], rows, description[group], locale);
            })
            .join('\n\n') + '\n'
    );
}

export function extractApi(source: string): VueApi {
    if (!existsSync(source)) throw new Error(`组件源文件不存在：${source}`);
    const config = ts.findConfigFile(dirname(source), existsSync);
    if (!config) throw new Error(`组件缺少 tsconfig.json：${source}`);
    const parsed = ts.readConfigFile(config, (path) => ts.sys.readFile(path));
    if (parsed.error) throw new Error(ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n'));
    // One checker per component: a shared checker prints union members in the order earlier components created
    // them, so a page's table would change whenever another page is added.
    const checker = createCheckerByJson(dirname(config), parsed.config, { schema: false });
    const meta = checker.getComponentMeta(source);
    const { props, events, slots } = meta;
    const program = checker.getProgram();
    return { props, events, slots, exposed: meta.type === TypeMeta.Function && program ? functionExposed(program, source, props) : meta.exposed };
}

// vue-component-meta 3.3.13 reads defineExpose only from an expose parameter that has call signatures, but generic
// (`generic=`) components type it as `((exposed) => void) | undefined`, so it would report no members.
function functionExposed(program: ts.Program, source: string, props: ComponentMeta['props']) {
    const checker = program.getTypeChecker();
    const file = program.getSourceFile(source);
    const module = file && checker.getSymbolAtLocation(file);
    const component = module && checker.getExportsOfModule(module).find((symbol) => symbol.name === 'default');
    if (!component) throw new Error(`组件缺少默认导出：${source}`);
    const expose = checker.getTypeOfSymbol(component).getCallSignatures()[0]?.parameters[2];
    const exposed = expose && checker.getNonNullableType(checker.getTypeOfSymbol(expose)).getCallSignatures()[0]?.parameters[0];
    if (!exposed) return [];
    const propNames = new Set(props.map((prop) => prop.name));
    // Same filter as vue-component-meta: exposed members come from a mapped type, so they have no valueDeclaration.
    return checker
        .getTypeOfSymbol(exposed)
        .getProperties()
        .filter((member) => member.declarations?.length && !member.valueDeclaration && !propNames.has(member.name) && member.name !== '$slots')
        .map((member) => ({
            name: member.name,
            type: checker.typeToString(checker.getTypeOfSymbol(member), undefined, ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.NoTruncation).replace(/import\(.*?\)\./g, ''),
        }));
}

// Native attrs typed through ElementProps are valid at call sites, but only the component's own props belong in the API
// table. element-props declares the attrs it rewrites (autocomplete) and the emit handlers, so its file counts as native.
export function ownProps(meta: Pick<ComponentMeta, 'props'>) {
    return meta.props.filter((prop) => !prop.global && !prop.getDeclarations().every((declaration) => declaration.file.includes('/@vue/runtime-dom/') || declaration.file.includes('/base/element-props.')));
}

export function generateApis(check: boolean, pages: string[]) {
    const fragments: { path: string; body: string }[] = [];
    for (const file of apiFiles('vue', pages)) {
        const json = join(website, file);
        const components = JSON.parse(readFileSync(json, 'utf8')) as Record<string, ApiDescription>;
        for (const [name, description] of Object.entries(components)) {
            if (!/^[a-z][a-z0-9-]*$/.test(name) || typeof description.source !== 'string') throw new Error(`无效组件配置：${json} ${name}`);
            const meta = extractApi(resolve(root, description.source));
            for (const locale of locales) {
                fragments.push({ path: join(dirname(json), 'api', `${name}.vue.${locale}.mdx`), body: renderApi(meta, description, locale) });
            }
        }
    }
    writeFragments(fragments, check, 'Vue');
}

if (import.meta.main) {
    runCli(generateApis);
}
