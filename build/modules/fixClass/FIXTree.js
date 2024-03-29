import { getFirstChildByTagName, elemToMinimalStr } from "../XmlHelper.js";
import { BaseGroup, Message, Component } from "./Group.js";
import { Field } from "./Field.js";
import { ParsingConfig } from "./FIXElem.js";
import { reactive } from 'vue';
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
        this._header = new BaseGroup(this);
        this._trailer = new BaseGroup(this);
        this._fieldsParsingErrors = new Map();
        this._messagesParsingErrors = new Map();
        this._componentsParsingErrors = new Map();
        this._major = major;
        this._minor = minor;
        this._servicepack = servicepack;
        this._type = type;
    }
    parse(fixmlDocument, parsingConfig = new ParsingConfig()) {
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
            this.loadFields(fixElem, parsingConfig);
            this.loadMessages(fixElem, parsingConfig);
            this.loadComponents(fixElem, parsingConfig);
            this.loadHeaderAndTrailer(fixElem, parsingConfig);
            return this;
        }
        finally {
            this._parsed = true;
        }
    }
    /**
     * Loads fields from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load fields from.
     */
    loadFields(fixElem, parsingConfig) {
        let fieldElem = getFirstChildByTagName(fixElem, "fields");
        if (fieldElem === undefined)
            return;
        let additionalFields = new Map();
        for (let child of fieldElem.children) {
            let field = reactive(new Field(this));
            if (field.parse(child, parsingConfig))
                additionalFields.set(field.name, field);
            else
                this._fieldsParsingErrors.set(`Invalid field ${elemToMinimalStr(child)} in ${elemToMinimalStr(fieldElem)}`, field._parsingErrors);
        }
        // Made this way to avoid too many updates on fieldsMap
        this._fieldsMap = new Map([...this._fieldsMap, ...additionalFields]);
    }
    /**
     * Loads messages from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load messages from.
     */
    loadMessages(fixElem, parsingConfig) {
        let messagesElem = getFirstChildByTagName(fixElem, "messages");
        if (messagesElem === undefined)
            return;
        let additionalMessages = new Map();
        for (let child of messagesElem.children) {
            let message = reactive(new Message(this));
            if (message.parse(child, parsingConfig))
                additionalMessages.set(message.name, message);
            else
                this._messagesParsingErrors.set(`Invalid message ${elemToMinimalStr(child)} in ${elemToMinimalStr(messagesElem)}`, message._parsingErrors);
        }
        // Made this way to avoid too many updates on messagesMap
        this._messagesMap = new Map([...this._messagesMap, ...additionalMessages]);
    }
    /**
     * Loads components from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load components from.
     */
    loadComponents(fixElem, parsingConfig) {
        let componentsElem = getFirstChildByTagName(fixElem, "components");
        if (componentsElem === undefined)
            return;
        let additionalComponents = new Map();
        for (let child of componentsElem.children) {
            let component = reactive(new Component(this));
            if (component.parse(child, parsingConfig))
                additionalComponents.set(component.name, component);
            else
                this._componentsParsingErrors.set(`Invalid component ${elemToMinimalStr(child)} in ${elemToMinimalStr(componentsElem)}`, component._parsingErrors);
        }
        // Made this way to avoid too many updates on componentsMap
        this._componentsMap = new Map([...this._componentsMap, ...additionalComponents]);
    }
    /**
     * Loads the header and trailer from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load the header and trailer from.
     */
    loadHeaderAndTrailer(fixElem, parsingConfig) {
        let headerElem = getFirstChildByTagName(fixElem, "header");
        if (headerElem !== undefined)
            this._header.parse(headerElem, parsingConfig);
        let trailerElem = getFirstChildByTagName(fixElem, "trailer");
        if (trailerElem !== undefined)
            this._trailer.parse(trailerElem, parsingConfig);
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
export const FixTreeVue = {
    props: {
        fixTree: FIXTree
    },
    setup(props) {
        // props.fixTree
        console.log("slkdjqs");
        console.log(props.fixTree);
        console.log("slkdjqs");
    },
    template: ` 
        <h1>FIXTree</h1>
    `
};
//# sourceMappingURL=FIXTree.js.map