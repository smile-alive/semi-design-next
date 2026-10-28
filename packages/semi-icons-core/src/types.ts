/** An SVG element: tag name, attributes under their DOM names (`fill-rule`, `class`), child elements */
export type IconNode = [tag: string, attrs: Record<string, string>, children?: IconNode[]];

export interface IconData {
    /** Icon type: the SVG file name, rendered in the `semi-icon-<name>` class */
    name: string;
    /** Attributes of the root svg element */
    attrs: Record<string, string>;
    children: IconNode[];
    /**
     * Multi-colour icons only: how many colours the `fill` prop supplies (see getFillColor); attribute values hold
     * the placeholders resolveValue fills in
     */
    fills?: number;
}
