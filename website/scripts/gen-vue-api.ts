// Generates the Vue API tables (api/<component>.vue.<locale>.mdx) from vue-component-meta and api.vue.json descriptions.
// Usage: node scripts/gen-vue-api.ts [--check] [<category>/<page>...]   (run in website/; without pages, every page)
// Output: one MDX fragment per component and locale, exit code 1 on --check when a fragment is stale or missing
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { createCheckerByJson, type ComponentMeta, type ExposeMeta, TypeMeta } from 'vue-component-meta';
import { apiFragments, apiType, byName, type Description, type Locale, readApiEntries, renderTable, root, runCli, writeFragments } from './lib/api-table.ts';
import { exportedSymbol, findTsConfig, readTsConfig } from './lib/ts-api.ts';

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
                const rows = members
                    .map((member) => {
                        const cells = [apiType(member.type, 'required' in member && !member.required)];
                        if (group === 'props') cells.push(apiType(defaultValue(member)));
                        return { name: member.name, cells };
                    })
                    .toSorted(byName);
                return renderTable(group, titles[index], headings[locale][index], rows, description[group], locale);
            })
            .join('\n\n') + '\n'
    );
}

const checkers = new Map<string, ReturnType<typeof createCheckerByJson>>();

// One checker per tsconfig serves every component under it, as one program per tsconfig does for the other frameworks
function checkerOf(config: string) {
    return checkers.getOrInsertComputed(config, () => {
        const json = readTsConfig(config);
        // Same reason as programOptions in lib/ts-api.ts: union order would otherwise follow unrelated source files
        return createCheckerByJson(dirname(config), { ...json, compilerOptions: { ...json.compilerOptions, stableTypeOrdering: true } }, { schema: false });
    });
}

export function extractApi(source: string): VueApi {
    const checker = checkerOf(findTsConfig(source));
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
    const component = file && exportedSymbol(checker, file, 'default');
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

export async function generateApis(check: boolean, pages: string[]) {
    const entries = readApiEntries<ApiDescription>('vue', pages);
    const fragments = entries.flatMap((entry) => {
        const meta = extractApi(resolve(root, entry.description.source));
        return apiFragments(entry, 'vue', (locale) => renderApi(meta, entry.description, locale));
    });
    await writeFragments(fragments, check, 'Vue');
}

if (import.meta.main) {
    await runCli(generateApis);
}
