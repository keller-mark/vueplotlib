import { dispatch as d3_dispatch } from "d3-dispatch-nosplit";

const DISPATCH_EVENT_UPDATE = "update";
const DISPATCH_EVENT_HIGHLIGHT = "highlight";
const DISPATCH_EVENT_HIGHLIGHT_DESTROY = "highlight-destroy";


/**
 * Scale parent class to handle dispatching for highlights, updates.
 */
export default class AbstractScaleDispatcher {

    /**
     * Create a scale dispatcher.
     */
    constructor() {
        this._dispatch = d3_dispatch(
            DISPATCH_EVENT_UPDATE, 
            DISPATCH_EVENT_HIGHLIGHT, 
            DISPATCH_EVENT_HIGHLIGHT_DESTROY
        );
    }
    
    /**
     * Subscribe to highlight events.
     * @param {string} componentId 
     * @param {function} callback 
     */
    onHighlight(componentId, callback) {
        this._dispatch.on(DISPATCH_EVENT_HIGHLIGHT + "." + componentId, callback);
    }

    /**
     * Subscribe to highlight destroy events.
     * @param {string} componentId 
     * @param {function} callback 
     */
    onHighlightDestroy(componentId, callback) {
        this._dispatch.on(DISPATCH_EVENT_HIGHLIGHT_DESTROY + "." + componentId, callback);
    }

    /**
     * Subscribe to update events.
     * @param {string} componentId 
     * @param {function} callback 
     */
    onUpdate(componentId, callback) {
        this._dispatch.on(DISPATCH_EVENT_UPDATE + "." + componentId, callback);
    }

    /**
     * Emit the highlight event.
     */
    emitHighlight() {
        this._dispatch.call(DISPATCH_EVENT_HIGHLIGHT, null, ...arguments);
    }

    /**
     * Emit the highlight destroy event.
     */
    emitHighlightDestroy() {
        this._dispatch.call(DISPATCH_EVENT_HIGHLIGHT_DESTROY);
    }

    /**
     * Emit the update event.
     */
    emitUpdate() {
        this._dispatch.call(DISPATCH_EVENT_UPDATE);
    }
   
}