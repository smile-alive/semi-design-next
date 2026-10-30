import { useState, type ReactNode } from 'react';
import { isEqual } from 'es-toolkit';
import { getTransitionNodes, sameKeys } from '@fibrae/semi-foundation/tree/shared';
import type { NodeListProps, NodeListState } from './interface';
import NodeCollapsible from './node-collapsible';

export default function NodeList({ flattenNodes = [], motionKeys, motionType, flattenList, searchTargetIsDeep, renderTreeNode }: NodeListProps): ReactNode {
    const [motion, setMotion] = useState<NodeListState>({ transitionNodes: [] });

    // derived in render: the animated group must replace the rows in the same commit
    let current = motion;

    if (motionKeys.size && (!isEqual(motion.cachedMotionKeys, motionKeys) || !sameKeys(motion.cachedData ?? [], flattenNodes))) {
        current = {
            transitionNodes: getTransitionNodes(flattenNodes, motionKeys, motionType, flattenList),
            cachedData: flattenNodes,
            cachedMotionKeys: motionKeys,
        };
        setMotion(current);
    }

    const { transitionNodes } = current;
    const mapData = transitionNodes.length && !searchTargetIsDeep ? transitionNodes : flattenNodes;

    const handleMotionEnd = () => {
        setMotion((prev) => ({ ...prev, transitionNodes: [] }));
    };

    return mapData.map((treeNode) => {
        if (!Array.isArray(treeNode)) {
            return renderTreeNode(treeNode);
        }
        if (!treeNode.length) {
            return null;
        }
        return (
            <NodeCollapsible key={`motion-${treeNode[0].key}`} duration={200} motion={Boolean(motionType)} open={motionType === 'hide'} onMotionEnd={handleMotionEnd}>
                {treeNode.map((node) => renderTreeNode(node))}
            </NodeCollapsible>
        );
    });
}
