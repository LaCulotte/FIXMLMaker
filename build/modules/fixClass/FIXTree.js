var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getFirstChildByTagName, elemToMinimalStr } from "../XmlHelper.js";
import { BaseGroup, Message, Component } from "./Group.js";
import { Field } from "./Field.js";
import { ParsingConfig } from "./FIXElem.js";
export class BeingParsedError extends Error {
}
/**
 * Represents a FIXTree object that handles FIXML documents.
 */
export class FIXTree {
    /**
     * Constructs a new FIXTree object.
     * @param fixmlDocument - The FIXML document.
     * @throws Throws an error if the <fields> element is missing in the <fix> element.
     */
    constructor(major, minor, servicepack, type) {
        this._parsed = false;
        this._alreadyParsed = false;
        this._type = "";
        // _fieldsMap = new Map<string, Field>();
        // _messagesMap = new Map<string, Message>();
        this._fieldsMap = new Map();
        this._messagesMap = new Map();
        this._componentsMap = new Map();
        this._header = new BaseGroup();
        this._trailer = new BaseGroup();
        this._fieldsParsingErrors = new Map();
        this._messagesParsingErrors = new Map();
        this._componentsParsingErrors = new Map();
        this._major = major;
        this._minor = minor;
        this._servicepack = servicepack;
        this._type = type;
    }
    parse(fixmlDocument, parsingConfig = new ParsingConfig()) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._alreadyParsed && !this._parsed)
                throw new BeingParsedError("FIXTree is already being parsed.");
            this._parsed = false;
            try {
                this._fixmlDocument = fixmlDocument;
                let fixElem = getFirstChildByTagName(this._fixmlDocument, "fix");
                if (fixElem === undefined)
                    throw new Error("Invalid FIXML : missing root element <fix>");
                if (!this._alreadyParsed) {
                    this._major = fixElem.getAttribute("major");
                    this._minor = fixElem.getAttribute("minor");
                    this._servicepack = fixElem.getAttribute("servicepack");
                    this._type = fixElem.getAttribute("type");
                }
                this._major = fixElem.getAttribute("major");
                this._alreadyParsed = true;
                yield this.loadFields(fixElem, parsingConfig);
                yield this.loadMessages(fixElem, parsingConfig);
                yield this.loadComponents(fixElem, parsingConfig);
                yield this.loadHeaderAndTrailer(fixElem, parsingConfig);
                return this;
            }
            finally {
                this._parsed = true;
            }
        });
    }
    /**
     * Loads fields from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load fields from.
     */
    loadFields(fixElem, parsingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let fieldElem = getFirstChildByTagName(fixElem, "fields");
            if (fieldElem === undefined)
                return;
            for (let child of fieldElem.children) {
                let field = new Field();
                if (yield field.parse(child, parsingConfig))
                    this._fieldsMap.set(field.name, field);
                else
                    this._fieldsParsingErrors.set(`Invalid field ${elemToMinimalStr(child)} in ${elemToMinimalStr(fieldElem)}`, field._parsingErrors);
            }
        });
    }
    /**
     * Loads messages from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load messages from.
     */
    loadMessages(fixElem, parsingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let messagesElem = getFirstChildByTagName(fixElem, "messages");
            if (messagesElem === undefined)
                return;
            for (let child of messagesElem.children) {
                let message = new Message();
                if (yield message.parse(child, parsingConfig))
                    this._messagesMap.set(message.name, message);
                else
                    this._messagesParsingErrors.set(`Invalid message ${elemToMinimalStr(child)} in ${elemToMinimalStr(messagesElem)}`, message._parsingErrors);
            }
        });
    }
    /**
     * Loads components from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load components from.
     */
    loadComponents(fixElem, parsingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let componentsElem = getFirstChildByTagName(fixElem, "components");
            if (componentsElem === undefined)
                return;
            for (let child of componentsElem.children) {
                let component = new Component();
                if (yield component.parse(child, parsingConfig))
                    this._componentsMap.set(component.name, component);
                else
                    this._componentsParsingErrors.set(`Invalid component ${elemToMinimalStr(child)} in ${elemToMinimalStr(componentsElem)}`, component._parsingErrors);
            }
        });
    }
    /**
     * Loads the header and trailer from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load the header and trailer from.
     */
    loadHeaderAndTrailer(fixElem, parsingConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            let headerElem = getFirstChildByTagName(fixElem, "header");
            if (headerElem !== undefined)
                yield this._header.parse(headerElem, parsingConfig);
            let trailerElem = getFirstChildByTagName(fixElem, "trailer");
            if (trailerElem !== undefined)
                yield this._trailer.parse(trailerElem, parsingConfig);
        });
    }
    /**
     * Serializes the FIXTree object to xml.
     *
     * @returns {string} The serialized XML representation of the FIXTree.
     */
    serialize(metadata) {
        let document = new DOMParser().parseFromString("<fix></fix>", "application/xml");
        let fixElem = getFirstChildByTagName(document, "fix");
        this._header.serialize(document, fixElem, metadata);
        let messagesElem = document.createElement("messages");
        for (let message of this._messagesMap) {
            message[1].serialize(document, messagesElem, metadata);
        }
        fixElem.appendChild(messagesElem);
        this._trailer.serialize(document, fixElem, metadata);
        let componentsElem = document.createElement("components");
        for (let component of this._componentsMap) {
            component[1].serialize(document, componentsElem, metadata);
        }
        fixElem.appendChild(componentsElem);
        let fieldsElem = document.createElement("fields");
        for (let field of this._fieldsMap) {
            field[1].serialize(document, fieldsElem, metadata);
        }
        fixElem.appendChild(fieldsElem);
        fixElem.setAttribute("type", this._type);
        fixElem.setAttribute("major", this._major);
        fixElem.setAttribute("minor", this._minor);
        fixElem.setAttribute("servicepack", this._servicepack);
        return new XMLSerializer().serializeToString(document);
    }
}
//# sourceMappingURL=FIXTree.js.map