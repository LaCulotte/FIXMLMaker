var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { elemToMinimalStr } from "../XmlHelper.js";
import { Reference } from "./Field.js";
import { FIXElem } from "./FIXElem.js";
export class BaseGroup extends FIXElem {
    constructor(tagName) {
        super();
        this._references = new Map();
        this._tagName = tagName;
    }
    parse(groupElement, parsingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let parsingOk = true;
            this._tagName = groupElement.tagName;
            for (let child of groupElement.children) {
                if (child.tagName === "component" || child.tagName === "field") {
                    let reference = new Reference();
                    if (yield reference.parse(child, parsingConfig))
                        this._references.set(reference.name, reference);
                    else
                        this._parsingErrors.set(`Invalid ${this._tagName}: invalid reference ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, reference._parsingErrors);
                }
                else if (child.tagName === "group") {
                    let group = new Group();
                    if (yield group.parse(child, parsingConfig))
                        this._references.set(group.name, group);
                    else
                        this._parsingErrors.set(`Invalid ${this._tagName}: invalid group ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, group._parsingErrors);
                }
                else {
                    this._parsingErrors.set(`Invalid ${this._tagName}: invalid elem ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)} : elem tagname should be either component, group or field`, undefined);
                }
            }
            if (this.constructor.name == BaseGroup.name)
                this._parsed = true;
            return parsingOk;
        });
    }
    get tagName() {
        return this._tagName;
    }
    serialize(document, parentNode, metadata) {
        let elem = document.createElement(this._tagName);
        for (let reference of this._references) {
            reference[1].serialize(document, elem, metadata);
        }
        parentNode.appendChild(elem);
        return elem;
    }
}
export class CommonGroup extends BaseGroup {
    constructor(name) {
        super();
        this._name = name;
    }
    parse(groupElement, parsingConfig) {
        const _super = Object.create(null, {
            parse: { get: () => super.parse }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let parsingOk = yield _super.parse.call(this, groupElement, parsingConfig);
            this._name = groupElement.getAttribute("name");
            if (this._name === null) {
                parsingOk = false;
                this._parsingErrors.set(`Invalid ${this._tagName}: missing attribute 'name' in ${elemToMinimalStr(groupElement)}`, undefined);
            }
            if (this.constructor.name == CommonGroup.name)
                this._parsed = true;
            return parsingOk;
        });
    }
    get name() {
        return this._name;
    }
    serialize(document, parentNode, metadata) {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("name", this._name);
        return elem;
    }
}
export class Group extends CommonGroup {
    constructor(uncommon, required) {
        super();
        this._uncommon = uncommon;
        this._required = required;
    }
    parse(groupElement, parsingConfig) {
        const _super = Object.create(null, {
            parse: { get: () => super.parse }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let parsingOk = yield _super.parse.call(this, groupElement, parsingConfig);
            const requiredAttribute = groupElement.getAttribute("required");
            this._required = requiredAttribute !== null ? requiredAttribute === "Y" : null;
            this._uncommon = groupElement.hasAttribute("uncommon");
            if (this._tagName !== "group") {
                parsingOk = false;
                this._parsingErrors.set(`Invalid group: invalid tag name '${this._tagName}' in ${elemToMinimalStr(groupElement)} Must be 'group'`, undefined);
            }
            if (this._required === null) {
                this._required = false;
                this._parsingErrors.set(`Invalid group: missing attribute 'required' in ${elemToMinimalStr(groupElement)}`, undefined);
            }
            this._parsed = true;
            return parsingOk;
        });
    }
    get uncommon() {
        return this._uncommon;
    }
    get required() {
        return this._required;
    }
    serialize(document, parentNode, metadata) {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("required", this._required ? "Y" : "N");
        if (metadata && this._uncommon)
            elem.setAttribute("uncommon", "true");
        return elem;
    }
}
export class Component extends CommonGroup {
    parse(componentElement, parsingConfig) {
        const _super = Object.create(null, {
            parse: { get: () => super.parse }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let parsingOk = yield _super.parse.call(this, componentElement, parsingConfig);
            if (this._tagName !== "component") {
                parsingOk = false;
                this._parsingErrors.set(`Invalid component: invalid tag name '${this._tagName}' in ${elemToMinimalStr(componentElement)} Must be 'component'`, undefined);
            }
            this._parsed = true;
            return parsingOk;
        });
    }
}
export class Message extends CommonGroup {
    constructor(msgtype, msgcat) {
        super();
        this._msgtype = msgtype;
        this._msgcat = msgcat;
    }
    parse(messageElement, parsingConfig) {
        const _super = Object.create(null, {
            parse: { get: () => super.parse }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let parsingOk = yield _super.parse.call(this, messageElement, parsingConfig);
            this._msgtype = messageElement.getAttribute("msgtype");
            this._msgcat = messageElement.getAttribute("msgcat");
            if (this._tagName !== "message") {
                parsingOk = false;
                this._parsingErrors.set(`Invalid message: invalid tag name '${this._tagName}' in ${elemToMinimalStr(messageElement)} Must be 'message'`, undefined);
            }
            if (this._msgtype === null) {
                this._msgtype = "unknown";
                this._parsingErrors.set(`Invalid message: missing attribute 'msgtype' in ${elemToMinimalStr(messageElement)}`, undefined);
            }
            if (this._msgcat === null) {
                this._msgcat = "unknown";
                this._parsingErrors.set(`Invalid message: missing attribute 'msgcat' in ${elemToMinimalStr(messageElement)}`, undefined);
            }
            this._parsed = true;
            return parsingOk;
        });
    }
    get msgtype() {
        return this._msgtype;
    }
    get msgcat() {
        return this._msgcat;
    }
    serialize(document, parentNode, metadata) {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("msgtype", this._msgtype);
        elem.setAttribute("msgcat", this._msgcat);
        return elem;
    }
}
//# sourceMappingURL=Group.js.map