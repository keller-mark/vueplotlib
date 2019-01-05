import HistoryEvent from './HistoryEvent.js';

const VDP_COMPUTED_PARAM = "$vdp_vfg";
const GETTER_FUNCTION_KEY = "gfk";
const GETTER_PARAMS = "gp";

/**
 * Returns an object that represents a "computed" history event parameter.
 * @param {int} getterFunctionKey Key of function to be called (match to getterFunctionMapping passed to HistoryStack).
 * @param {array} getterParams Params passed to the function to be called.
 * @returns {object} Returns an object with an identifier signifying that this parameter should be computed.
 */
export const computedParam = (getterFunctionKey, getterParams) => {
    return {
        [VDP_COMPUTED_PARAM]: true,
        [GETTER_FUNCTION_KEY]: getterFunctionKey,
        [GETTER_PARAMS]: getterParams
    };
};

/**
 * Represents a history of all application interaction events,
 * which can be used for forward(redo)/backward(undo) navigation.
 */
export default class HistoryStack {

    /**
     * Create a new history stack.
     * @param {object} getterFunctionMapping Mapping from event type (int) -> getter function (function).
     * @param {object} resetFunctionNameMapping Mapping from event subtype (int) -> reset function name (string).
     */
    constructor(getterFunctionMapping, resetFunctionNameMapping) {
        this._getters = getterFunctionMapping;
        this._resetters = resetFunctionNameMapping;
        this._stack = []; // user-event stack
        this._pointer = undefined; // user-event stack pointer
    }

    /**
     * Push an event onto the stack.
     * @param {HistoryEvent} event The event to push.
     */
    push(event) {
        if(this.canGoForward()) {
            this.prune();
        }
        this._stack.push(event);
        this.incrementPointer();
    }

    /**
     * Pop an event from the top of the stack.
     * @returns {HistoryStack} The last event.
     */
    pop() {
        this.decrementPointer();
        return this._stack.pop();
    }

    /**
     * Prune the stack, 
     * removing any events "above" the current pointer
     */
    prune() {
        if(this._pointer === undefined) {
            // clear the stack
            while(this._stack.length) {
                this._stack.pop();
            }
        } else {
            // remove all events above the pointer
            while(this._pointer < (this._stack.length-1)) {
                this._stack.pop();
            }
        }
    }

    /**
     * Find the most recent "related" event. 
     * Dips into the "initial" events if needed.
     * @param {HistoryEvent} event The event to reference.
     * @returns {HistoryEvent} A "related", but previous event.
     */
    getPrevRelated(event, pointer) {
        for(let i = pointer - 1; i >= 0; i--) {
            if(this._stack[i].isRelated(event)) {
                return this._stack[i];
            }
        }
        return new HistoryEvent(event.type, event.subtype, event.id, this._resetters[event.subtype]);
    }

    /**
     * @returns {boolean}
     */
    canGoBack() {
        return (this._pointer !== undefined);
    }

    /**
     * Goes back by executing the most recent "related" event,
     * in relation to the currently-pointed-to event.
     * Decrements the stack pointer.
     */
    goBack() {
        if(this.canGoBack()) {
            // get the current event
            let curr = this._stack[this._pointer];
            // get the most recent "related" event
            let prev = this.getPrevRelated(curr, this._pointer);
            this.decrementPointer();
            
            // Execute "prev" event
            this.execute(prev);
        }
    }

    /**
     * @returns {boolean}
     */
    canGoForward() {
        return (!this.isEmpty() && (this._pointer < (this._stack.length - 1) || this._pointer === undefined));
    }

    /**
     * Goes forward by executing the next event.
     * Increments the stack pointer.
     */
    goForward() {
        if(this.canGoForward()) {
            // get the next event
            this.incrementPointer();
            let next = this._stack[this._pointer];
            
            // Execute "next" event
            this.execute(next);
        }
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return (this._stack.length === 0);
    }

    /**
     * Decrements the stack pointer, or sets to undefined.
     */
    decrementPointer() {
        this._pointer = (this._pointer === 0 ? undefined : this._pointer - 1);
    }

    /**
     * Increments the stack pointer, or sets to zero.
     */
    incrementPointer() {
        this._pointer = (this._pointer === undefined ? 0 : this._pointer + 1);
    }

    /**
     * Parse parameters to check for the need to call a getter function.
     * @param {array} params The serialized parameter array.
     * @returns {array} Parsed params, replacing with calls to getter functions if necessary.
     */
    parseParams(params) {
        return params.map((p) => {
            if(p !== null && p !== undefined && typeof p === "object") {
                if(p.hasOwnProperty(VDP_COMPUTED_PARAM)) {
                    // can assume that this object represents a call to a "getter": getScale, getStack, etc...
                    console.assert(typeof p[GETTER_FUNCTION_KEY] === "number");
                    console.assert(this._getters.hasOwnProperty(p[GETTER_FUNCTION_KEY]));
                    let getterFunction = this._getters[p[GETTER_FUNCTION_KEY]];
                    console.assert(Array.isArray(p[GETTER_PARAMS]));
                    let getterParams = p[GETTER_PARAMS];
                    
                    return getterFunction( ...getterParams );
                }
            }
            return p;
        });
    }

    /**
     * Execute a provided event.
     * @param {HistoryEvent} event 
     */
    execute(event) {

        if(event === undefined) {
            console.error("Error: the event passed to HistoryStack.execute is undefined");
            return;
        }

        let getTargetFunc = this._getters[event.type];

        if(getTargetFunc !== undefined) {
            let target = getTargetFunc(event.id);
            let parsedParams = this.parseParams(event.params)
            target[event.action]( ...parsedParams );
        } else {
            console.error("Error: the target function specified by the HistoryEvent type is undefined");
        }
    }

    /**
     * Get the complete history stack as an array.
     * Prunes the stack if necessary.
     * @returns {array} The current stack as an array.
     */
    export() {
        if(this.canGoForward()) {
            this.prune();
        }
        
        return this._stack.map(el => el.toJson());
    }

    /**
     * Set the history stack array, but do not increment the pointer.
     * Assumes the history stack is empty.
     * @param {array} stack The array of events to set as the stack.
     */
    import(stack) {
        console.assert(this._pointer === undefined);
        console.assert(this._stack.length === 0);
        for(let event of stack) {
            console.assert(event.hasOwnProperty("type"))
            console.assert(event.hasOwnProperty("subtype"))
            console.assert(event.hasOwnProperty("id"))
            console.assert(event.hasOwnProperty("action"))
            console.assert(event.hasOwnProperty("params"))
            this._stack.push(new HistoryEvent(event.type, event.subtype, event.id, event.action, event.params));
        }
    }

}