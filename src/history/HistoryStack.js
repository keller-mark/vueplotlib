import HistoryEvent from './HistoryEvent.js';

const VDP_COMPUTED_PARAM = "$vdp_val_from_getter";

/**
 * Returns an object that represents a "computed" history event parameter.
 * @param {string} getterFunction Name of function to be called
 * @param {array} getterParams Params passed to the function to be called.
 * @returns {object} Returns an object with an identifier signifying that this parameter should be computed.
 */
export const computedParam = (getterFunction, getterParams) => {
    return {
        [VDP_COMPUTED_PARAM]: true,
        "getterFunction": getterFunction,
        "getterParams": getterParams
    };
};

/**
 * Represents a history of all application interaction events,
 * which can be used for forward(redo)/backward(undo) navigation.
 */
export default class HistoryStack {

    /**
     * Create a new history stack.
     * @param {function} getScale Function that returns a scale object for a provided string key.
     * @param {function} getData Function that returns a data container object for a provided string key.
     */
    constructor(getScale, getData) {
        this._getScale = getScale;
        this._getData = getData;
        this._initial = []; // initial stack
        this._stack = []; // user-event stack
        this._pointer = undefined; // user-event stack pointer
    }

    /**
     * Push an event onto the stack.
     * @param {HistoryEvent} event The event to push.
     * @param {boolean} initial Whether this event is an initialization event.
     */
    push(event, initial) {
        if(initial === undefined || initial === false) {
            if(this.canGoForward()) {
                this.prune();
            }
            this._stack.push(event);
            this.incrementPointer();
        } else {
            this._initial.push(event);
        }
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
        return this._initial.find((el) => event.isRelated(el));
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
            if(typeof p === "object") {
                if(p.hasOwnProperty(VDP_COMPUTED_PARAM)) {
                    // can assume that this object represents a call to a "getter": getScale, getStack, etc...
                    console.assert(typeof p.getterFunction === "string");
                    console.assert(p.getterFunction.substring(0, 3) === "get");
                    let getterFunction = this[("_" + p.getterFunction)];
                    console.assert(Array.isArray(p.getterParams));
                    let getterParams = p.getterParams;
                    
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

        let getTargetFunc;

        switch(event.type) {
            case HistoryEvent.types.SCALE:
                getTargetFunc = this._getScale;
                break;
            default:
                getTargetFunc = undefined;
        }

        if(getTargetFunc !== undefined) {
            let target = getTargetFunc(event.id);
            
            let parsedParams = this.parseParams(event.params)
            target[event.action]( ...parsedParams );
        } else {
            console.error("Error: the target function specified by the HistoryEvent type is undefined");
        }
    }

}