import { invariant } from '@react-dnd/invariant';
import { ListenerType } from './interfaces.js';
import { OptionsReader } from './OptionsReader.js';
import { distance, inAngleRanges } from './utils/math.js';
import { getEventClientOffset, getNodeClientOffset } from './utils/offsets.js';
import { eventShouldEndDrag, eventShouldStartDrag, isTouchEvent } from './utils/predicates.js';
import { supportsPassive } from './utils/supportsPassive.js';
const eventNames = {
    [ListenerType.mouse]: {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup',
        contextmenu: 'contextmenu'
    },
    [ListenerType.touch]: {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
    },
    [ListenerType.keyboard]: {
        keydown: 'keydown'
    }
};
export class TouchBackendImpl {
    /**
	 * Generate profiling statistics for the HTML5Backend.
	 */ profile() {
        var _this_dragOverTargetIds;
        return {
            sourceNodes: this.sourceNodes.size,
            sourcePreviewNodes: this.sourcePreviewNodes.size,
            sourcePreviewNodeOptions: this.sourcePreviewNodeOptions.size,
            targetNodes: this.targetNodes.size,
            dragOverTargetIds: ((_this_dragOverTargetIds = this.dragOverTargetIds) === null || _this_dragOverTargetIds === void 0 ? void 0 : _this_dragOverTargetIds.length) || 0
        };
    }
    // public for test
    get document() {
        return this.options.document;
    }
    setup() {
        const root = this.options.rootElement;
        if (!root) {
            return;
        }
        invariant(!TouchBackendImpl.isSetUp, 'Cannot have two Touch backends at the same time.');
        TouchBackendImpl.isSetUp = true;
        this.addEventListener(root, 'start', this.getTopMoveStartHandler());
        this.addEventListener(root, 'start', this.handleTopMoveStartCapture, true);
        this.addEventListener(root, 'move', this.handleTopMove);
        this.addEventListener(root, 'move', this.handleTopMoveCapture, true);
        this.addEventListener(root, 'end', this.handleTopMoveEndCapture, true);
        if (this.options.enableMouseEvents && !this.options.ignoreContextMenu) {
            this.addEventListener(root, 'contextmenu', this.handleTopMoveEndCapture);
        }
        if (this.options.enableKeyboardEvents) {
            this.addEventListener(root, 'keydown', this.handleCancelOnEscape, true);
        }
    }
    teardown() {
        const root = this.options.rootElement;
        if (!root) {
            return;
        }
        TouchBackendImpl.isSetUp = false;
        this._mouseClientOffset = {};
        this.removeEventListener(root, 'start', this.handleTopMoveStartCapture, true);
        this.removeEventListener(root, 'start', this.handleTopMoveStart);
        this.removeEventListener(root, 'move', this.handleTopMoveCapture, true);
        this.removeEventListener(root, 'move', this.handleTopMove);
        this.removeEventListener(root, 'end', this.handleTopMoveEndCapture, true);
        if (this.options.enableMouseEvents && !this.options.ignoreContextMenu) {
            this.removeEventListener(root, 'contextmenu', this.handleTopMoveEndCapture);
        }
        if (this.options.enableKeyboardEvents) {
            this.removeEventListener(root, 'keydown', this.handleCancelOnEscape, true);
        }
        this.uninstallSourceNodeRemovalObserver();
    }
    addEventListener(subject, event, handler, capture = false) {
        const options = supportsPassive ? {
            capture,
            passive: false
        } : capture;
        this.listenerTypes.forEach(function(listenerType) {
            const evt = eventNames[listenerType][event];
            if (evt) {
                subject.addEventListener(evt, handler, options);
            }
        });
    }
    removeEventListener(subject, event, handler, capture = false) {
        const options = supportsPassive ? {
            capture,
            passive: false
        } : capture;
        this.listenerTypes.forEach(function(listenerType) {
            const evt = eventNames[listenerType][event];
            if (evt) {
                subject.removeEventListener(evt, handler, options);
            }
        });
    }
    connectDragSource(sourceId, node) {
        const handleMoveStart = this.handleMoveStart.bind(this, sourceId);
        this.sourceNodes.set(sourceId, node);
        this.addEventListener(node, 'start', handleMoveStart);
        return ()=>{
            this.sourceNodes.delete(sourceId);
            this.removeEventListener(node, 'start', handleMoveStart);
        };
    }
    connectDragPreview(sourceId, node, options) {
        this.sourcePreviewNodeOptions.set(sourceId, options);
        this.sourcePreviewNodes.set(sourceId, node);
        return ()=>{
            this.sourcePreviewNodes.delete(sourceId);
            this.sourcePreviewNodeOptions.delete(sourceId);
        };
    }
    connectDropTarget(targetId, node) {
        const root = this.options.rootElement;
        if (!this.document || !root) {
            return ()=>{
            /* noop */ };
        }
        const handleMove = (e)=>{
            if (!this.document || !root || !this.monitor.isDragging()) {
                return;
            }
            let coords;
            /**
			 * Grab the coordinates for the current mouse/touch position
			 */ switch(e.type){
                case eventNames.mouse.move:
                    coords = {
                        x: e.clientX,
                        y: e.clientY
                    };
                    break;
                case eventNames.touch.move:
                    var _e_touches_, _e_touches_1;
                    coords = {
                        x: ((_e_touches_ = e.touches[0]) === null || _e_touches_ === void 0 ? void 0 : _e_touches_.clientX) || 0,
                        y: ((_e_touches_1 = e.touches[0]) === null || _e_touches_1 === void 0 ? void 0 : _e_touches_1.clientY) || 0
                    };
                    break;
            }
            /**
			 * Use the coordinates to grab the element the drag ended on.
			 * If the element is the same as the target node (or any of it's children) then we have hit a drop target and can handle the move.
			 */ const droppedOn = coords != null ? this.document.elementFromPoint(coords.x, coords.y) : undefined;
            const childMatch = droppedOn && node.contains(droppedOn);
            if (droppedOn === node || childMatch) {
                return this.handleMove(e, targetId);
            }
        };
        /**
		 * Attaching the event listener to the body so that touchmove will work while dragging over multiple target elements.
		 */ this.addEventListener(this.document.body, 'move', handleMove);
        this.targetNodes.set(targetId, node);
        return ()=>{
            if (this.document) {
                this.targetNodes.delete(targetId);
                this.removeEventListener(this.document.body, 'move', handleMove);
            }
        };
    }
    getTopMoveStartHandler() {
        if (!this.options.delayTouchStart && !this.options.delayMouseStart) {
            return this.handleTopMoveStart;
        }
        return this.handleTopMoveStartDelay;
    }
    installSourceNodeRemovalObserver(node) {
        this.uninstallSourceNodeRemovalObserver();
        this.draggedSourceNode = node;
        this.draggedSourceNodeRemovalObserver = new MutationObserver(()=>{
            if (node && !node.parentElement) {
                this.resurrectSourceNode();
                this.uninstallSourceNodeRemovalObserver();
            }
        });
        if (!node || !node.parentElement) {
            return;
        }
        this.draggedSourceNodeRemovalObserver.observe(node.parentElement, {
            childList: true
        });
    }
    resurrectSourceNode() {
        if (this.document && this.draggedSourceNode) {
            this.draggedSourceNode.style.display = 'none';
            this.draggedSourceNode.removeAttribute('data-reactid');
            this.document.body.appendChild(this.draggedSourceNode);
        }
    }
    uninstallSourceNodeRemovalObserver() {
        if (this.draggedSourceNodeRemovalObserver) {
            this.draggedSourceNodeRemovalObserver.disconnect();
        }
        this.draggedSourceNodeRemovalObserver = undefined;
        this.draggedSourceNode = undefined;
    }
    constructor(manager, context, options){
        this.getSourceClientOffset = (sourceId)=>{
            const element = this.sourceNodes.get(sourceId);
            return element && getNodeClientOffset(element);
        };
        this.handleTopMoveStartCapture = (e)=>{
            if (!eventShouldStartDrag(e)) {
                return;
            }
            this.moveStartSourceIds = [];
        };
        this.handleMoveStart = (sourceId)=>{
            // Just because we received an event doesn't necessarily mean we need to collect drag sources.
            // We only collect start collecting drag sources on touch and left mouse events.
            if (Array.isArray(this.moveStartSourceIds)) {
                this.moveStartSourceIds.unshift(sourceId);
            }
        };
        this.handleTopMoveStart = (e)=>{
            if (!eventShouldStartDrag(e)) {
                return;
            }
            // Don't prematurely preventDefault() here since it might:
            // 1. Mess up scrolling
            // 2. Mess up long tap (which brings up context menu)
            // 3. If there's an anchor link as a child, tap won't be triggered on link
            const clientOffset = getEventClientOffset(e);
            if (clientOffset) {
                if (isTouchEvent(e)) {
                    this.lastTargetTouchFallback = e.targetTouches[0];
                }
                this._mouseClientOffset = clientOffset;
            }
            this.waitingForDelay = false;
        };
        this.handleTopMoveStartDelay = (e)=>{
            if (!eventShouldStartDrag(e)) {
                return;
            }
            const delay = e.type === eventNames.touch.start ? this.options.delayTouchStart : this.options.delayMouseStart;
            this.timeout = setTimeout(this.handleTopMoveStart.bind(this, e), delay);
            this.waitingForDelay = true;
        };
        this.handleTopMoveCapture = ()=>{
            this.dragOverTargetIds = [];
        };
        this.handleMove = (_evt, targetId)=>{
            if (this.dragOverTargetIds) {
                this.dragOverTargetIds.unshift(targetId);
            }
        };
        this.handleTopMove = (e)=>{
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            if (!this.document || this.waitingForDelay) {
                return;
            }
            const { moveStartSourceIds , dragOverTargetIds  } = this;
            const enableHoverOutsideTarget = this.options.enableHoverOutsideTarget;
            const clientOffset = getEventClientOffset(e, this.lastTargetTouchFallback);
            if (!clientOffset) {
                return;
            }
            // If the touch move started as a scroll, or is is between the scroll angles
            let angleRanges;
            if (this.options.scrollAngleRanges instanceof Function && moveStartSourceIds) {
                const sourceTypes = moveStartSourceIds.map((source)=>this.registry.getSourceType(source));
                angleRanges = this.options.scrollAngleRanges(sourceTypes);
            } else if (!(this.options.scrollAngleRanges instanceof Function)) {
                angleRanges = this.options.scrollAngleRanges;
            }
            if (this._isScrolling || !this.monitor.isDragging() && inAngleRanges(this._mouseClientOffset.x || 0, this._mouseClientOffset.y || 0, clientOffset.x, clientOffset.y, angleRanges)) {
                this._isScrolling = true;
                return;
            }
            // If we're not dragging and we've moved a little, that counts as a drag start
            if (!this.monitor.isDragging() && // eslint-disable-next-line no-prototype-builtins
            this._mouseClientOffset.hasOwnProperty('x') && moveStartSourceIds && distance(this._mouseClientOffset.x || 0, this._mouseClientOffset.y || 0, clientOffset.x, clientOffset.y) > (this.options.touchSlop ? this.options.touchSlop : 0)) {
                this.moveStartSourceIds = undefined;
                this.actions.beginDrag(moveStartSourceIds, {
                    clientOffset: this._mouseClientOffset,
                    getSourceClientOffset: this.getSourceClientOffset,
                    publishSource: false
                });
            }
            if (!this.monitor.isDragging()) {
                return;
            }
            const sourceNode = this.sourceNodes.get(this.monitor.getSourceId());
            this.installSourceNodeRemovalObserver(sourceNode);
            this.actions.publishDragSource();
            if (e.cancelable) e.preventDefault();
            // Get the node elements of the hovered DropTargets
            const dragOverTargetNodes = (dragOverTargetIds || []).map((key)=>this.targetNodes.get(key)).filter((e)=>!!e);
            // Get the a ordered list of nodes that are touched by
            const elementsAtPoint = this.options.getDropTargetElementsAtPoint ? this.options.getDropTargetElementsAtPoint(clientOffset.x, clientOffset.y, dragOverTargetNodes) : this.document.elementsFromPoint(clientOffset.x, clientOffset.y);
            // Extend list with parents that are not receiving elementsFromPoint events (size 0 elements and svg groups)
            const elementsAtPointExtended = [];
            for(const nodeId in elementsAtPoint){
                // eslint-disable-next-line no-prototype-builtins
                if (!elementsAtPoint.hasOwnProperty(nodeId)) {
                    continue;
                }
                let currentNode = elementsAtPoint[nodeId];
                if (currentNode != null) {
                    elementsAtPointExtended.push(currentNode);
                }
                while(currentNode){
                    currentNode = currentNode.parentElement;
                    if (currentNode && elementsAtPointExtended.indexOf(currentNode) === -1) {
                        elementsAtPointExtended.push(currentNode);
                    }
                }
            }
            const orderedDragOverTargetIds = elementsAtPointExtended// Filter off nodes that arent a hovered DropTargets nodes
            .filter((node)=>dragOverTargetNodes.indexOf(node) > -1)// Map back the nodes elements to targetIds
            .map((node)=>this._getDropTargetId(node))// Filter off possible null rows
            .filter((node)=>!!node).filter((id, index, ids)=>ids.indexOf(id) === index);
            // Invoke hover for drop targets when source node is still over and pointer is outside
            if (enableHoverOutsideTarget) {
                for(const targetId in this.targetNodes){
                    const targetNode = this.targetNodes.get(targetId);
                    if (sourceNode && targetNode && targetNode.contains(sourceNode) && orderedDragOverTargetIds.indexOf(targetId) === -1) {
                        orderedDragOverTargetIds.unshift(targetId);
                        break;
                    }
                }
            }
            // Reverse order because dnd-core reverse it before calling the DropTarget drop methods
            orderedDragOverTargetIds.reverse();
            this.actions.hover(orderedDragOverTargetIds, {
                clientOffset: clientOffset
            });
        };
        /**
	 *
	 * visible for testing
	 */ this._getDropTargetId = (node)=>{
            const keys = this.targetNodes.keys();
            let next = keys.next();
            while(next.done === false){
                const targetId = next.value;
                if (node === this.targetNodes.get(targetId)) {
                    return targetId;
                } else {
                    next = keys.next();
                }
            }
            return undefined;
        };
        this.handleTopMoveEndCapture = (e)=>{
            this._isScrolling = false;
            this.lastTargetTouchFallback = undefined;
            if (!eventShouldEndDrag(e)) {
                return;
            }
            if (!this.monitor.isDragging() || this.monitor.didDrop()) {
                this.moveStartSourceIds = undefined;
                return;
            }
            if (e.cancelable) e.preventDefault();
            this._mouseClientOffset = {};
            this.uninstallSourceNodeRemovalObserver();
            this.actions.drop();
            this.actions.endDrag();
        };
        this.handleCancelOnEscape = (e)=>{
            if (e.key === 'Escape' && this.monitor.isDragging()) {
                this._mouseClientOffset = {};
                this.uninstallSourceNodeRemovalObserver();
                this.actions.endDrag();
            }
        };
        this.options = new OptionsReader(options, context);
        this.actions = manager.getActions();
        this.monitor = manager.getMonitor();
        this.registry = manager.getRegistry();
        this.sourceNodes = new Map();
        this.sourcePreviewNodes = new Map();
        this.sourcePreviewNodeOptions = new Map();
        this.targetNodes = new Map();
        this.listenerTypes = [];
        this._mouseClientOffset = {};
        this._isScrolling = false;
        if (this.options.enableMouseEvents) {
            this.listenerTypes.push(ListenerType.mouse);
        }
        if (this.options.enableTouchEvents) {
            this.listenerTypes.push(ListenerType.touch);
        }
        if (this.options.enableKeyboardEvents) {
            this.listenerTypes.push(ListenerType.keyboard);
        }
    }
}

//# sourceMappingURL=TouchBackendImpl.js.map