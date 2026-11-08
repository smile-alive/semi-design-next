// Semi's JS imports its compiled .css; the theme plugins point it back at the .scss source to recompile with the theme
export function cssImportToScss(source: string) {
    return source.replace(/(import\s+|require\s*\(\s*)['"]([^'"]+)(\.css)['"]/g, "$1'$2.scss'");
}

// Rewrites top-level constants such as `BASE_CLASS_PREFIX` in Semi's env.js; a one-liner, so a pattern suffices
export function replaceVariableValues(source: string, replacers: Record<string, string> = {}) {
    return Object.entries(replacers).reduce((code, [name, value]) => code.replace(new RegExp(`(\\b${name}\\s*[:=]\\s*['"])[^'"]*(['"])`, 'g'), (_, head, tail) => head + value + tail), source);
}

export function commentOutCssImports(source: string) {
    return source.replace(/(import\s+['"][^'"]+\.css['"])/g, '// $1').replace(/(require\(['"][^'"]+\.css['"]\))/g, '// $1');
}
