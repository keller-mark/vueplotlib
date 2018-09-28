import HistoryEvent from './HistoryEvent.js';

/**
 * Represents a history of all application interaction events,
 * which can be used for forward(redo)/backward(undo) navigation.
 */
export default class HistoryStack {

    /**
     * Create a new history stack.
     * @param {function} getScale Function that returns a scale object for a provided string key.
     */
    constructor(getScale) {
        this._getScale = getScale;
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
            this._stack = [];
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
        let prev = this._stack.find((el, i) => (event.isRelated(el) && i < pointer));
        if(prev !== undefined) {
            return prev;
        } else {
            return this._initial.find((el) => event.isRelated(el));
        }
    }

    /**
     * @returns {boolean}
     */
    canGoBack() {
        return (!this.isEmpty());
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
        return (!this.isEmpty() && (this._pointer < (this._stack.length - 1)));
    }

    /**
     * Goes forward by executing the next event.
     * Increments the stack pointer.
     */
    goForward() {
        if(this.canGoForward()) {
            // get the next event
            let next = this._stack[this._pointer + 1];
            this.incrementPointer();
            
            // Execute "next" event
            this.execute(next);
        }
    }

    /**
     * @returns {boolean}
     */
    isEmpty() {
        return (this._pointer === undefined);
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
     * Execute a provided event.
     * @param {HistoryEvent} event 
     */
    execute(event) {

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
            /*
            TODO: parse event.params to search for symbols?
                For example, if one wanted to use a specific dataset as a param, 
                could encode as the string "{data:myDatasetKey}" or something...
            */
            target[event.action]( ...event.params );
        }
    }

}