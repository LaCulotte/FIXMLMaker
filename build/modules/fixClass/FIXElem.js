export class ParsingConfig {
    constructor() {
        this.lenient = false;
    }
}
;
;
;
;
export class FIXElem {
    constructor(fixTree) {
        this._parsingErrors = new Map();
        this._parsed = false;
        this.used = false;
        this.fixTree = fixTree;
    }
    parse(elem, parsingConfig) {
        throw new Error("Method parse not implemented. FIXElem was not meant to be instantiated.");
    }
    serialize(document, parentNode, metadata) {
        throw new Error("Method serialize not implemented. FIXElem was not meant to be instantiated.");
    }
    checkValid() {
        throw new Error("Method check not implemented. FIXElem was not meant to be instantiated.");
    }
    discard() {
    }
}
//# sourceMappingURL=FIXElem.js.map