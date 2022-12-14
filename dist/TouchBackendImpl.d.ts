import type { Backend, DragDropManager, Identifier, Unsubscribe } from 'dnd-core';
import type { TouchBackendContext, TouchBackendOptions } from './interfaces.js';
export declare class TouchBackendImpl implements Backend {
    private options;
    private actions;
    private monitor;
    private registry;
    private static isSetUp;
    sourceNodes: Map<Identifier, HTMLElement>;
    sourcePreviewNodes: Map<string, HTMLElement>;
    sourcePreviewNodeOptions: Map<string, any>;
    targetNodes: Map<string, HTMLElement>;
    private _mouseClientOffset;
    private _isScrolling;
    private listenerTypes;
    private moveStartSourceIds;
    private waitingForDelay;
    private timeout;
    private dragOverTargetIds;
    private draggedSourceNode;
    private draggedSourceNodeRemovalObserver;
    private lastTargetTouchFallback;
    constructor(manager: DragDropManager, context: TouchBackendContext, options: Partial<TouchBackendOptions>);
    /**
     * Generate profiling statistics for the HTML5Backend.
     */
    profile(): Record<string, number>;
    get document(): Document | undefined;
    setup(): void;
    teardown(): void;
    private addEventListener;
    private removeEventListener;
    connectDragSource(sourceId: string, node: HTMLElement): Unsubscribe;
    connectDragPreview(sourceId: string, node: HTMLElement, options: unknown): Unsubscribe;
    connectDropTarget(targetId: string, node: HTMLElement): Unsubscribe;
    private getSourceClientOffset;
    handleTopMoveStartCapture: (e: Event) => void;
    handleMoveStart: (sourceId: string) => void;
    private getTopMoveStartHandler;
    handleTopMoveStart: (e: MouseEvent | TouchEvent) => void;
    handleTopMoveStartDelay: (e: Event) => void;
    handleTopMoveCapture: () => void;
    handleMove: (_evt: MouseEvent | TouchEvent, targetId: string) => void;
    handleTopMove: (e: TouchEvent | MouseEvent) => void;
    /**
     *
     * visible for testing
     */
    _getDropTargetId: (node: Element) => Identifier | undefined;
    handleTopMoveEndCapture: (e: Event) => void;
    handleCancelOnEscape: (e: KeyboardEvent) => void;
    private installSourceNodeRemovalObserver;
    private resurrectSourceNode;
    private uninstallSourceNodeRemovalObserver;
}
