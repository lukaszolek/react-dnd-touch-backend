export class OptionsReader {
    get delay() {
        var _this_args_delay;
        return (_this_args_delay = this.args.delay) !== null && _this_args_delay !== void 0 ? _this_args_delay : 0;
    }
    get scrollAngleRanges() {
        return this.args.scrollAngleRanges;
    }
    get getDropTargetElementsAtPoint() {
        return this.args.getDropTargetElementsAtPoint;
    }
    get ignoreContextMenu() {
        var _this_args_ignoreContextMenu;
        return (_this_args_ignoreContextMenu = this.args.ignoreContextMenu) !== null && _this_args_ignoreContextMenu !== void 0 ? _this_args_ignoreContextMenu : false;
    }
    get enableHoverOutsideTarget() {
        var _this_args_enableHoverOutsideTarget;
        return (_this_args_enableHoverOutsideTarget = this.args.enableHoverOutsideTarget) !== null && _this_args_enableHoverOutsideTarget !== void 0 ? _this_args_enableHoverOutsideTarget : false;
    }
    get enableKeyboardEvents() {
        var _this_args_enableKeyboardEvents;
        return (_this_args_enableKeyboardEvents = this.args.enableKeyboardEvents) !== null && _this_args_enableKeyboardEvents !== void 0 ? _this_args_enableKeyboardEvents : false;
    }
    get enableMouseEvents() {
        var _this_args_enableMouseEvents;
        return (_this_args_enableMouseEvents = this.args.enableMouseEvents) !== null && _this_args_enableMouseEvents !== void 0 ? _this_args_enableMouseEvents : false;
    }
    get enableTouchEvents() {
        var _this_args_enableTouchEvents;
        return (_this_args_enableTouchEvents = this.args.enableTouchEvents) !== null && _this_args_enableTouchEvents !== void 0 ? _this_args_enableTouchEvents : true;
    }
    get touchSlop() {
        return this.args.touchSlop || 0;
    }
    get delayTouchStart() {
        var _this_args, _this_args1;
        var _this_args_delayTouchStart, _ref;
        return (_ref = (_this_args_delayTouchStart = (_this_args = this.args) === null || _this_args === void 0 ? void 0 : _this_args.delayTouchStart) !== null && _this_args_delayTouchStart !== void 0 ? _this_args_delayTouchStart : (_this_args1 = this.args) === null || _this_args1 === void 0 ? void 0 : _this_args1.delay) !== null && _ref !== void 0 ? _ref : 0;
    }
    get delayMouseStart() {
        var _this_args, _this_args1;
        var _this_args_delayMouseStart, _ref;
        return (_ref = (_this_args_delayMouseStart = (_this_args = this.args) === null || _this_args === void 0 ? void 0 : _this_args.delayMouseStart) !== null && _this_args_delayMouseStart !== void 0 ? _this_args_delayMouseStart : (_this_args1 = this.args) === null || _this_args1 === void 0 ? void 0 : _this_args1.delay) !== null && _ref !== void 0 ? _ref : 0;
    }
    get window() {
        if (this.context && this.context.window) {
            return this.context.window;
        } else if (typeof window !== 'undefined') {
            return window;
        }
        return undefined;
    }
    get document() {
        var _this_context;
        if ((_this_context = this.context) === null || _this_context === void 0 ? void 0 : _this_context.document) {
            return this.context.document;
        }
        if (this.window) {
            return this.window.document;
        }
        return undefined;
    }
    get rootElement() {
        var _this_args;
        return ((_this_args = this.args) === null || _this_args === void 0 ? void 0 : _this_args.rootElement) || this.document;
    }
    constructor(args, context){
        this.args = args;
        this.context = context;
    }
}

//# sourceMappingURL=OptionsReader.js.map