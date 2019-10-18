/**
 * Enum of the base event types.
 */
export const EVENT_TYPES = Object.freeze({ 
    SCALE: "SCALE",
    DATA: "DATA"
});

/**
 * Enum of the base event subtypes.
 */
export const EVENT_SUBTYPES = Object.freeze({ 
    SCALE_DOMAIN_FILTER: "FILTER",
    SCALE_DOMAIN_SORT: "SORT",
    SCALE_COLOR_SCALE: "COLOR_SCALE",
    SCALE_COLOR_OVERRIDE: "COLOR_OVERRIDE" 
});

/**
 * Enum of the base event subtype resets.
 */
export const EVENT_SUBTYPE_RESETS = Object.freeze({ 
    [EVENT_SUBTYPES.SCALE_DOMAIN_FILTER]: "resetFilter",
    [EVENT_SUBTYPES.SCALE_DOMAIN_SORT]: "resetSort",
    [EVENT_SUBTYPES.SCALE_COLOR_SCALE]: "resetColorScale",
    [EVENT_SUBTYPES.SCALE_COLOR_OVERRIDE]: "resetColorOverride",
});

