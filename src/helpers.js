/**
 * Get the retina ratio to be able to scale up a canvas context.
 * @private
 * @param {context} c The canvas context.
 * @returns {float} The ratio.
 */
export const getRetinaRatio = function(c) {
    let devicePixelRatio = window.devicePixelRatio || 1;
    let backingStoreRatio = [
        c.webkitBackingStorePixelRatio,
        c.mozBackingStorePixelRatio,
        c.msBackingStorePixelRatio,
        c.oBackingStorePixelRatio,
        c.backingStorePixelRatio,
        1
    ].reduce(function(a, b) { return a || b });

    return devicePixelRatio / backingStoreRatio;
}

/**
 * Filters a hierarchy based on a scale's filtered domain values.
 * @private
 * @param {object} data The object containing the full hierarchy.
 * @param {CategoricalScale} scale The scale used to filter the nodes.
 * @returns {object} The filtered hierarchy object.
 */
export const filterHierarchy = (data, scale) => {
    const filterNode = (node) => {
        if(node.children.length === 0) {
            if(scale.domainFiltered.includes(node.name)) {
                return node;
            } else {
                return undefined;
            }
        } else {
            let newChildren = [];
            for(let child of node.children) {
                let newChild = filterNode(child);
                if(newChild !== undefined) {
                    newChildren.push(newChild);
                }
            }
            if(newChildren.length > 0) {
                return {name: node.name, children: newChildren};
            } else {
                return undefined;
            }
        }
    };
    return filterNode(data);
};
