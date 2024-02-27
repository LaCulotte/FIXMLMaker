import { getFirstChildByTagName, elemToMinimalStr } from "../XmlHelper.js";
import { BaseGroup, Message, Component } from "./Group.js";
import { Field } from "./Field.js";
import { ParsingConfig, FIXElem, ParsingError, IFIXTree } from "./FIXElem.js";

import { reactive } from 'vue';

export class BeingParsedError extends Error {}

/**
 * Represents a FIXTree object that handles FIXML documents.
 */
export class FIXTree implements IFIXTree {
    _parsed = false;
    _alreadyParsed = false;

    _major: string;
    _minor: string;
    _servicepack: string;

    _type: string = "";
    // _type: string;

    _fixmlDocument: Document;

    // _fieldsMap = new Map<string, Field>();
    // _messagesMap = new Map<string, Message>();
    _fieldsMap: Map<string, Field> = new Map<string, Field>();
    _messagesMap: Map<string, Message> = new Map<string, Message>();
    _componentsMap: Map<string, Component> = new Map<string, Component>();
    _header: BaseGroup = new BaseGroup(this);
    _trailer: BaseGroup = new BaseGroup(this);

    _fieldsParsingErrors: ParsingError = new Map<string, ParsingError>();
    _messagesParsingErrors: ParsingError = new Map<string, ParsingError>();
    _componentsParsingErrors: ParsingError = new Map<string, ParsingError>();

    /**
     * Constructs a new FIXTree object.
     * @param fixmlDocument - The FIXML document.
     * @throws Throws an error if the <fields> element is missing in the <fix> element.
     */
    constructor(major?: string, minor?: string, servicepack?: string, type?: string) {
        this._major = major;
        this._minor = minor;
        this._servicepack = servicepack;
        this._type = type;
    }

    parse(fixmlDocument: Document, parsingConfig: ParsingConfig = new ParsingConfig()): FIXTree {
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
        } finally {
            this._parsed = true;
        }
    }

    /**
     * Loads fields from the specified FIXML element.
     * 
     * @param fixElem - The FIXML element to load fields from.
     */
    loadFields(fixElem: Element, parsingConfig: ParsingConfig) {
        let fieldElem = getFirstChildByTagName(fixElem, "fields");
        if (fieldElem === undefined)
            return;

        let additionalFields = new Map<string, Field>();
        for (let child of fieldElem.children) {
            let field = reactive(new Field(this)) as Field;
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
    loadMessages(fixElem: Element, parsingConfig: ParsingConfig) {
        let messagesElem = getFirstChildByTagName(fixElem, "messages");
        if (messagesElem === undefined)
            return;

        let additionalMessages = new Map<string, Message>();
        for (let child of messagesElem.children) {
            let message = reactive(new Message(this)) as Message;
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
    loadComponents(fixElem: Element, parsingConfig: ParsingConfig) {
        let componentsElem = getFirstChildByTagName(fixElem, "components");
        if (componentsElem === undefined)
            return;

        let additionalComponents = new Map<string, Component>();
        for (let child of componentsElem.children) {
            let component = reactive(new Component(this)) as Component;
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
    loadHeaderAndTrailer(fixElem: Element, parsingConfig: ParsingConfig) {
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
    serialize(metadata: boolean): string {
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

type FixTreeVueProps = {
    fixTree: FIXTree
}

export const FixTreeVue = {
    props: {
        fixTree: FIXTree
    },
    setup(props: FixTreeVueProps) {
        // props.fixTree
        console.log("slkdjqs")
        console.log(props.fixTree);
        console.log("slkdjqs")
    },
    template: ` 
        <h1>FIXTree</h1>
    `
}