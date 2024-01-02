var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method parse not implemented. FIXElem was not meant to be instantiated.");
        });
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