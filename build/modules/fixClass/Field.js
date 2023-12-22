import { elemToMinimalStr } from "../XmlHelper.js";
export class Field {
    /**
     * Creates a new instance of the Field class.
     * @param fieldElement The XML element representing the field.
     * @throws Throws an error if the field element is invalid.
     */
    constructor(fieldElement) {
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
    get name() {
        return this._name;
    }
    get number() {
        return this._number;
    }
    get type() {
        return this._type;
    }
    get values() {
        return this._values;
    }
    get uncommon() {
        return this._uncommon;
    }
    /**
     * Serializes the field to an XML document.
     * @param document The XML document to serialize to.
     * @param parentNode The parent node to append the serialized field to.
     */
    serialize(document, parentNode, metadata) {
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
    constructor(referenceElement) {
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
    get tagName() {
        return this._tagName;
    }
    get name() {
        return this._name;
    }
    get required() {
        return this._required;
    }
    /**
     * Serializes the reference to an XML document.
     * @param document The XML document to serialize to.
     * @param parentNode The parent node to append the serialized reference to.
     */
    serialize(document, parentNode) {
        const referenceElement = document.createElement(this._tagName);
        referenceElement.setAttribute("name", this._name);
        referenceElement.setAttribute("required", this._required ? "Y" : "N");
        parentNode.appendChild(referenceElement);
    }
}
export class FieldTypeSingleton {
    constructor() {
        this.types = new Set();
    }
    static getInstance() {
        if (!FieldTypeSingleton.instance) {
            FieldTypeSingleton.instance = new FieldTypeSingleton();
        }
        return FieldTypeSingleton.instance;
    }
    addType(type) {
        this.types.add(type.toUpperCase());
    }
    getTypes() {
        return Array.from(this.types);
    }
}
//# sourceMappingURL=Field.js.map