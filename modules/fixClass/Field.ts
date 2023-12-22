import { elemToMinimalStr } from "../XmlHelper.js";

/**
 * Represents a field's enum in a FIXML message.
 */
type FieldEnumValue = { enum: string; description: string; uncommon: boolean };


export class Field {
    // The name of the field.
    private _name: string;
    // The number of the field.
    private _number: number;
    // The type of the field.
    private _type: string;
    // The values associated with the field.
    private _values: Array<FieldEnumValue>;
    // Whether the field is uncommon.
    private _uncommon: boolean;

    /**
     * Creates a new instance of the Field class.
     * @param fieldElement The XML element representing the field.
     * @throws Throws an error if the field element is invalid.
     */
    constructor(fieldElement: Element) {
        this._name = fieldElement.getAttribute("name");
        const numberAttribute = fieldElement.getAttribute("number");
        this._number = numberAttribute ? parseInt(numberAttribute) : undefined;
        this._type = fieldElement.getAttribute("type");
        this._values = [];
        this._uncommon = fieldElement.hasAttribute("uncommon");

        if (!this._number || isNaN(this._number) || !Number.isInteger(this._number))
            throw new Error(`Invalid FIXML: missing or invalid attribute 'number' in ${elemToMinimalStr(fieldElement)}`);
        if (!this._type)
            throw new Error(`Invalid FIXML: missing attribute 'type' in ${elemToMinimalStr(fieldElement)}`);

        const valueElements = fieldElement.getElementsByTagName("value");
        for (const valueElement of valueElements) {
            const enumValue = valueElement.getAttribute("enum");
            const description = valueElement.getAttribute("description");
            const uncommon = valueElement.hasAttribute("uncommon");

            if (!enumValue)
                throw new Error(`Invalid FIXML: missing attribute 'enum' in ${elemToMinimalStr(valueElement)} of ${elemToMinimalStr(fieldElement)}`);
            if (!description)
                throw new Error(`Invalid FIXML: missing attribute 'description' in ${elemToMinimalStr(valueElement)} of ${elemToMinimalStr(fieldElement)}`);

            this._values.push({ enum: enumValue, description, uncommon });
        }

        if (!this._name)
            throw new Error(`Invalid FIXML: missing attribute 'name' in ${elemToMinimalStr(fieldElement)}`);
        if (!this._type)
            throw new Error(`Invalid FIXML: missing attribute 'type' in ${elemToMinimalStr(fieldElement)}`);

        FieldTypeSingleton.getInstance().addType(this._type);
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

    get values(): Array<FieldEnumValue> {
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
    serialize(document: Document, parentNode: Element, metadata: boolean): void {
        const fieldElement = document.createElement("field");
        fieldElement.setAttribute("name", this._name);
        fieldElement.setAttribute("number", this._number.toString());
        fieldElement.setAttribute("type", this._type);

        if (metadata && this._uncommon)
            fieldElement.setAttribute("uncommon", "true");

        for (const value of this._values) {
            const valueElement = document.createElement("value");
            valueElement.setAttribute("enum", value.enum.toString());
            valueElement.setAttribute("description", value.description);

            if (metadata && value.uncommon)
                valueElement.setAttribute("uncommon", "true");

            fieldElement.appendChild(valueElement);
        }

        parentNode.appendChild(fieldElement);
    }
}

export class Reference {
    private _tagName: string;
    private _name: string;
    private _required: boolean;

    constructor(referenceElement: Element) {
        const tagName = referenceElement.tagName;
        const name = referenceElement.getAttribute("name");
        const required = referenceElement.getAttribute("required");

        if (!name)
            throw new Error(`Invalid FIXML: missing attribute 'name' in ${elemToMinimalStr(referenceElement)}`);

        if (!required)
            throw new Error(`Invalid FIXML: missing attribute 'required' in ${elemToMinimalStr(referenceElement)}`);

        this._tagName = tagName;
        this._name = name;
        this._required = required === "Y";
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

    /**
     * Serializes the reference to an XML document.
     * @param document The XML document to serialize to.
     * @param parentNode The parent node to append the serialized reference to.
     */
    serialize(document: Document, parentNode: Element): void {
        const referenceElement = document.createElement(this._tagName);
        referenceElement.setAttribute("name", this._name);
        referenceElement.setAttribute("required", this._required ? "Y" : "N");

        parentNode.appendChild(referenceElement);
    }
}

export class FieldTypeSingleton {
    private static instance: FieldTypeSingleton;
    private types: Set<string>;

    private constructor() {
        this.types = new Set<string>();
    }

    public static getInstance(): FieldTypeSingleton {
        if (!FieldTypeSingleton.instance) {
            FieldTypeSingleton.instance = new FieldTypeSingleton();
        }
        return FieldTypeSingleton.instance;
    }

    public addType(type: string): void {
        this.types.add(type.toUpperCase());
    }

    public getTypes(): string[] {
        return Array.from(this.types);
    }
}