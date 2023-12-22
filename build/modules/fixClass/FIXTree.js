import { getFirstChildByTagName, elemToMinimalStr } from "../XmlHelper.js";
import { Field } from "./Field.js";
/**
 * Represents a FIXTree object that handles FIXML documents.
 */
export class FIXTree {
    /**
     * Constructs a new FIXTree object.
     * @param fixmlDocument - The FIXML document.
     * @throws Throws an error if the <fields> element is missing in the <fix> element.
     */
    constructor(fixmlDocument) {
        this._major = "";
        this._minor = "";
        this._servicepack = "";
        this._type = "";
        this._fieldsMap = new Map();
        this._fixmlDocument = fixmlDocument;
        let fixElem = getFirstChildByTagName(this._fixmlDocument, "fix");
        if (fixElem === undefined)
            throw "Invalid FIXML : missing root element <fix>";
        this._major = fixElem.getAttribute("major");
        this._minor = fixElem.getAttribute("minor");
        this._servicepack = fixElem.getAttribute("servicepack");
        this._type = fixElem.getAttribute("type");
        this.loadFields(fixElem);
    }
    /**
     * Loads fields from the specified FIXML element.
     *
     * @param fixElem - The FIXML element to load fields from.
     * @throws Throws an error if the <fields> element is missing in the <fix> element.
     */
    loadFields(fixElem) {
        let fieldElem = getFirstChildByTagName(fixElem, "fields");
        if (fieldElem === undefined)
            throw `Invalid FIXML: missing attribute 'type' in ${elemToMinimalStr(fieldElem)}`;
        for (let child of fieldElem.children) {
            let field = new Field(child);
            this._fieldsMap.set(field.name, field);
        }
    }
    /**
     * Serializes the FIXTree object to xml.
     *
     * @returns {string} The serialized XML representation of the FIXTree.
     */
    serialize() {
    }
}
//# sourceMappingURL=FIXTree.js.map