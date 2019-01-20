import { Delaunay } from 'd3-delaunay';

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
 * @param {array} domainFiltered The domain used to filter the nodes.
 * @returns {object} The filtered hierarchy object.
 */
export const filterHierarchy = (data, domainFiltered) => {
    const filterNode = (node) => {
        if(node.children.length === 0) {
            if(domainFiltered.includes(node.name)) {
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

/**
 * Returns a delaunay "implementation" that works around the
 * current bugs in the d3-delaunay package.
 * @private
 * @param {array} points array of xy points as arrays [[x,y], [x,y], ...]
 * @param {boolean} randomness Whether or not to inject randomness into points to work around d3-delaunay colinearity issue
 * @returns {object} The delaunay object with find(x,y) method
 */
export const getDelaunay = (points, randomness) => {
    if(randomness) {
        points = points.map((el) => [el[0] + Math.random()*0.0001, el[1] + Math.random()*0.0001]);
    }
    points = points.filter((el) => (!Number.isNaN(el[0]) && !Number.isNaN(el[1])));
    if(points.length > 2) {
        return Delaunay.from(points);
    } else if(points.length == 2) {
        return {
            find: (x, y) => {
                let d0 = Math.sqrt(Math.pow((points[0][0] - x), 2) + Math.pow((points[0][1] - y), 2));
                let d1 = Math.sqrt(Math.pow((points[1][0] - x), 2) + Math.pow((points[1][1] - y), 2));
                if(d0 < d1) {
                    return 0;
                } else {
                    return 1;
                }
            }
        }
    } else if(points.length == 1) {
        return {
            find: () => {
                return 0;
            }
        }
    } else {
        return {
            find: () => {
                return undefined;
            }
        }
    }

}

/**
 * Generate seeded random numbers, e.g. for jitter plot
 * @param {number} seed The seed.
 * @returns {function} The random number generator function.
 */
export const seededRandom = (seed) => {
    // Adapted from this StackOverflow answer https://stackoverflow.com/a/19303725
    // Note: not a high-quality random number generator, just a quick and dirty one
    let internalSeed = seed;
    return () => {
        var x = Math.sin(internalSeed++) * 10000;
        return x - Math.floor(x);
    }
}