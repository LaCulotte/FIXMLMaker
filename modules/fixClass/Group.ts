import { elemToMinimalStr } from "../XmlHelper.js";
import { Reference } from "./Field.js";
import { ParsingConfig, FIXElem, ParsingError } from "./FIXElem.js";

export class BaseGroup extends FIXElem {
    protected _tagName: string;

    protected _references: Map<string, FIXElem> = new Map();

    constructor(tagName?: string) {
        super();
        this._tagName = tagName;
    }

    async parse(groupElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = true;
        this._tagName = groupElement.tagName;

        for (let child of groupElement.children) {
            if (child.tagName === "component" || child.tagName === "field") {
                let reference = new Reference();

                if (await reference.parse(child, parsingConfig))
                    this._references.set(reference.name, reference);
                else
                    this._parsingErrors.set(`Invalid ${this._tagName}: invalid reference ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, reference._parsingErrors);
            } else if (child.tagName === "group") {
                let group = new Group();
                
                if (await group.parse(child, parsingConfig))
                    this._references.set(group.name, group);
                else 
                    this._parsingErrors.set(`Invalid ${this._tagName}: invalid group ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, group._parsingErrors);
            } else {
                this._parsingErrors.set(`Invalid ${this._tagName}: invalid elem ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)} : elem tagname should be either component, group or field`, undefined);
            }
        }

        if(this.constructor.name == BaseGroup.name)
            this._parsed = true;
        return parsingOk;
    }

    get tagName(): string {
        return this._tagName;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = document.createElement(this._tagName);

        for (let reference of this._references) {
            reference[1].serialize(document, elem, metadata);
        }

        parentNode.appendChild(elem);
        return elem;
    }
}

export class CommonGroup extends BaseGroup {
    protected _name: string;

    constructor(name?: string) {
        super();
        this._name = name;
    }

    async parse(groupElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = await super.parse(groupElement, parsingConfig);
        this._name = groupElement.getAttribute("name");

        if (this._name === null) {
            parsingOk = false;
            this._parsingErrors.set(`Invalid ${this._tagName}: missing attribute 'name' in ${elemToMinimalStr(groupElement)}`, undefined);
        }

        if(this.constructor.name == CommonGroup.name)
            this._parsed = true;
        return parsingOk;
    }

    get name(): string {
        return this._name;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("name", this._name);
        return elem;
    }
}

export class Group extends CommonGroup {
    private _uncommon: boolean;
    private _required: boolean;

    constructor(uncommon?: boolean, required?: boolean) {
        super();
        this._uncommon = uncommon;
        this._required = required;
    }

    async parse(groupElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = await super.parse(groupElement, parsingConfig);
        
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
    }

    get uncommon(): boolean {
        return this._uncommon;
    }

    get required(): boolean {
        return this._required;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("required", this._required ? "Y" : "N");
        
        if (metadata && this._uncommon)
            elem.setAttribute("uncommon", "true");
     
        return elem;
    }   
}

export class Component extends CommonGroup {
    async parse(componentElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = await super.parse(componentElement, parsingConfig);

        if (this._tagName !== "component") {
            parsingOk = false;
            this._parsingErrors.set(`Invalid component: invalid tag name '${this._tagName}' in ${elemToMinimalStr(componentElement)} Must be 'component'`, undefined);
        }

        this._parsed = true;
        return parsingOk;
    }
}

export class Message extends CommonGroup {
    private _msgtype: string;
    private _msgcat: string;

    constructor(msgtype?: string, msgcat?: string) {
        super();
        this._msgtype = msgtype;
        this._msgcat = msgcat;
    }

    async parse(messageElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = await super.parse(messageElement, parsingConfig);
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
    }

    get msgtype(): string {
        return this._msgtype;
    }

    get msgcat(): string {
        return this._msgcat;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("msgtype", this._msgtype);
        elem.setAttribute("msgcat", this._msgcat);
        return elem;
    }
}