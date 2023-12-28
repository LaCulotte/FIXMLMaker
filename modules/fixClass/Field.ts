import { elemToMinimalStr } from "../XmlHelper.js";
import { ParsingConfig, FIXElem, ParsingError } from "./FIXElem.js";

/**
 * Represents a field's enum in a FIXML message.
 */
type FieldEnumValue = { enum: string; description: string; uncommon: boolean };


export class Field extends FIXElem {
    // The name of the field.
    private _name: string;
    // The number of the field.
    private _number: number;
    // The type of the field.
    private _type: string;
    // The values associated with the field.
    private _values: Map<string, FieldEnumValue>;
    // Whether the field is uncommon.
    private _uncommon: boolean;

    /**
     * Creates a new instance of the Field class.
     * @param fieldElement The XML element representing the field.
     * @throws Throws an error if the field element is invalid.
     */
    constructor(name?: string, number?: number, type?: string, values?: Map<string, FieldEnumValue>, uncommon?: boolean) {
        super();
        this._name = name;
        this._number = number;
        this.type = type;
        this._values = values;
        this._uncommon = uncommon;
    }

    async parse(fieldElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = true;

        this._name = fieldElement.getAttribute("name");
        const numberAttribute = fieldElement.getAttribute("number");
        this._number = numberAttribute !== null ? parseInt(numberAttribute) : null;
        this._type = fieldElement.getAttribute("type");
        this._values = new Map<string, FieldEnumValue>();
        this._uncommon = fieldElement.hasAttribute("uncommon");

        if (this._name === null) {
            parsingOk = false;
            this._parsingErrors.set(`Invalid field: missing attribute 'name' in ${elemToMinimalStr(fieldElement)}`, undefined);
        }

        if (this._number === null || isNaN(this._number) || !Number.isInteger(this._number)) {
            this._number = 0;
            this._parsingErrors.set(`Invalid field: missing or invalid attribute 'number' in ${elemToMinimalStr(fieldElement)}`, undefined);
        }

        if (this._type === null) {
            this.type = "INT";
            this._parsingErrors.set(`Invalid field: missing attribute 'type' in ${elemToMinimalStr(fieldElement)}`, undefined);
        }

        const valueElements = fieldElement.getElementsByTagName("value");
        for (const valueElement of valueElements) {
            try {
                const enumValue = valueElement.getAttribute("enum");
                const description = valueElement.getAttribute("description");
                const uncommon = valueElement.hasAttribute("uncommon");

                if (enumValue === undefined)
                    throw new Error(`Invalid value: missing attribute 'enum' in ${elemToMinimalStr(valueElement)}`);
                if (description === undefined)
                    throw new Error(`Invalid value: missing attribute 'description' in ${elemToMinimalStr(valueElement)}`);

                this._values.set(enumValue, { enum: enumValue, description, uncommon });
            } catch (error) {
                // TODO : redo this ? Nested error container may not be a good idea
                let parentMsg = `Invalid value in field: ${elemToMinimalStr(fieldElement)}`;
                if (this._parsingErrors.get(parentMsg) === undefined)
                    this._parsingErrors.set(parentMsg, error.message);
                else if (this._parsingErrors.get(parentMsg).get(error.message) === undefined)
                    this._parsingErrors.get(parentMsg).set(error.message, undefined);
            }
        }

        FieldTypeSingleton.getInstance().addType(this._type);
        this._parsed = true;
        return parsingOk;
    }

    discard(): void {
        FieldTypeSingleton.getInstance().removeType(this._type);
    }

    get name(): string {
        return this._name;
    }

    get number(): number {
        return this._number;
    }

    get type(): string {
        return this._type;
    }

    set type(type: string) {
        if (this._type === type)
            return;

        FieldTypeSingleton.getInstance().addType(type);
        FieldTypeSingleton.getInstance().removeType(this._type);

        this._type = type;
    }

    get values(): Map<string, FieldEnumValue> {
        return this._values;
    }

    get uncommon(): boolean {
        return this._uncommon;
    }

    /**
     * Serializes the field to an XML document.
     * @param document The XML document to serialize to.
     * @param parentNode The parent node to append the serialized field to.
     */
    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        const fieldElement = document.createElement("field");
        fieldElement.setAttribute("name", this._name);
        fieldElement.setAttribute("number", this._number.toString());
        fieldElement.setAttribute("type", this._type);

        if (metadata && this._uncommon)
            fieldElement.setAttribute("uncommon", "true");

        for (const [enumValue, value] of this._values) {
            const valueElement = document.createElement("value");
            valueElement.setAttribute("enum", enumValue);
            valueElement.setAttribute("description", value.description);

            if (metadata && value.uncommon)
                valueElement.setAttribute("uncommon", "true");

            fieldElement.appendChild(valueElement);
        }

        parentNode.appendChild(fieldElement);
        return fieldElement;
    }
}

export class Reference extends FIXElem {
    
    private _tagName: string;
    private _name: string;
    private _required: boolean;
    private _uncommon: boolean;

    constructor(tagName?: string, name?: string, required?: boolean, uncommon?: boolean ) {
        super();
        this._tagName = tagName;
        this._name = name;
        this._required = required;
        this._uncommon = uncommon;
    }

    async parse(referenceElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = true;

        this._tagName = referenceElement.tagName;
        this._name = referenceElement.getAttribute("name");
        const requiredAttribute = referenceElement.getAttribute("required");
        this._required = requiredAttribute !== null ? requiredAttribute === "Y" : null;
        this._uncommon = referenceElement.hasAttribute("uncommon");

        if (this._tagName !== "component" && this._tagName !== "field") {
            parsingOk = false;
            this._parsingErrors.set(`Invalid field: invalid tag name '${this._tagName}' in ${elemToMinimalStr(referenceElement)} Must be 'component' or 'field'`, undefined);
        }

        if (this._name === null) {
            parsingOk = false;
            this._parsingErrors.set(`Invalid field: missing attribute 'name' in ${elemToMinimalStr(referenceElement)}`, undefined);
        }

        if (this._required === null) {
            this._required = false;
            this._parsingErrors.set(`Invalid field: missing attribute 'required' in ${elemToMinimalStr(referenceElement)}`, undefined);
        }

        this._parsed = true;
        return parsingOk;
    }

    get tagName(): string {
        return this._tagName;
    }

    get name(): string {
        return this._name;
    }

    get required(): boolean {
        return this._required;
    }

    get uncommon(): boolean {
        return this._uncommon;
    }

    /**
     * Serializes the reference to an XML document.
     * @param document The XML document to serialize to.
     * @param parentNode The parent node to append the serialized reference to.
     */
    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        const referenceElement = document.createElement(this._tagName);
        referenceElement.setAttribute("name", this._name);
        referenceElement.setAttribute("required", this._required ? "Y" : "N");
        if (metadata && this._uncommon)
            referenceElement.setAttribute("uncommon", "true");

        parentNode.appendChild(referenceElement);
        return referenceElement;
    }
}

export class FieldTypeSingleton {
    private static instance: FieldTypeSingleton;
    private types: Map<string, number>;

    private constructor() {
        this.types = new Map<string, number>();
    }

    public static getInstance(): FieldTypeSingleton {
        if (!FieldTypeSingleton.instance) {
            FieldTypeSingleton.instance = new FieldTypeSingleton();
        }
        return FieldTypeSingleton.instance;
    }

    public addType(type: string): void {
        if (type === undefined)
            return;
        
        const counter = this.types.get(type) || 0;
        this.types.set(type, counter + 1);
    }

    public removeType(type: string): void {
        if (type === undefined)
            return;

        const counter = this.types.get(type) || 0;
        if (counter > 0) {
            this.types.set(type, counter - 1);
            if (counter - 1 === 0) {
                this.types.delete(type);
            }
        }
    }

    public getTypes(): string[] {
        return Array.from(this.types.keys());
    }
}