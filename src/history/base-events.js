/**
 * Enum of the base event types.
 */
export const EVENT_TYPES = Object.freeze({ 
    SCALE: 1,
    DATA: 2
});

/**
 * Enum of the base event subtypes.
 */
export const EVENT_SUBTYPES = Object.freeze({ 
    SCALE_DOMAIN_FILTER: 1,
    SCALE_DOMAIN_SORT: 2,
    SCALE_COLOR_SCALE: 3,
    SCALE_COLOR_OVERRIDE: 4 
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

