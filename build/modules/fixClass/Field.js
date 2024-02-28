import { elemToMinimalStr } from "../XmlHelper.js";
import { FIXElem } from "./FIXElem.js";
import { InputVue, AccordionVue, FilterVue } from "../Utils.js";
import { ref, computed, reactive } from 'vue';
export const FieldEnumValueVue = {
    props: {
        fieldEnumValue: Object,
    },
    components: {
        InputVue,
    },
    setup(props) {
        const fieldEnumValue = props.fieldEnumValue;
        const textInputEnum = ref(fieldEnumValue.enum);
        const textInputEnumStruct = {
            input: textInputEnum,
            isValid: (textInput) => {
                return textInput.length > 0;
            },
            placeholder: "fieldEnumValue enum",
            focusOnCreate: !fieldEnumValue.parsed
        };
        const onEnumFocusOut = () => {
            if (fieldEnumValue.enum == textInputEnum.value)
                return;
            if (textInputEnumStruct.isValid(textInputEnum.value)) {
                let newMap = new Map();
                for (let [key, value] of fieldEnumValue.parent.values) {
                    if (key == fieldEnumValue.enum)
                        newMap.set(textInputEnum.value, fieldEnumValue);
                    else
                        newMap.set(key, value);
                }
                // TODO : painfully slow but necesasry. Find another way ?
                fieldEnumValue.parent.values.clear();
                for (let [key, value] of newMap) {
                    fieldEnumValue.parent.values.set(key, value);
                }
                fieldEnumValue.enum = textInputEnum.value;
                fieldEnumValue.parsed = true;
                // Prompt => change everywhere ?
            }
            else {
                if (fieldEnumValue.parsed)
                    textInputEnum.value = fieldEnumValue.enum;
                else
                    fieldEnumValue.parent.values.delete(fieldEnumValue.enum);
            }
        };
        const textInputDescription = ref(fieldEnumValue.description);
        const textInputDescriptionStruct = {
            input: textInputDescription,
            isValid: (textInput) => {
                return textInput.length > 0;
            },
            placeholder: "fieldEnumValue description",
            focusOnCreate: false
        };
        const onDescriptionFocusOut = () => {
            if (fieldEnumValue.description == textInputDescription.value)
                return;
            if (textInputDescriptionStruct.isValid(textInputDescription.value)) {
                fieldEnumValue.description = textInputDescription.value;
            }
            else {
                textInputDescription.value = fieldEnumValue.description;
            }
        };
        const onDelete = () => {
            fieldEnumValue.parent.values.delete(fieldEnumValue.enum);
        };
        return {
            textInputEnumStruct,
            onEnumFocusOut,
            textInputDescriptionStruct,
            onDescriptionFocusOut,
            fieldEnumValue,
            onDelete,
        };
    },
    template: `
    <div class="btn-group w-100 d-flex" role="group">
        <button class="btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
        <input-vue :inputStruct="textInputEnumStruct" @inputdone="onEnumFocusOut"></input-vue>
        <input-vue :inputStruct="textInputDescriptionStruct" @inputdone="onDescriptionFocusOut"></input-vue>
    </div>
    `
};
export class Field extends FIXElem {
    /**
     * Creates a new instance of the Field class.
     * @param fieldElement The XML element representing the field.
     * @throws Throws an error if the field element is invalid.
     */
    constructor(fixTree, name, number, type, values, uncommon) {
        super(fixTree);
        this.name = name;
        this.number = number;
        this.type = type;
        this.values = values;
        this.uncommon = uncommon;
    }
    parse(fieldElement, parsingConfig) {
        let parsingOk = true;
        this.name = fieldElement.getAttribute("name");
        const numberAttribute = fieldElement.getAttribute("number");
        this.number = numberAttribute !== null ? parseInt(numberAttribute) : null;
        this._type = fieldElement.getAttribute("type");
        this.values = new Map();
        this.uncommon = fieldElement.hasAttribute("uncommon");
        if (this.name === null) {
            parsingOk = false;
            this._parsingErrors.set(`Invalid field: missing attribute 'name' in ${elemToMinimalStr(fieldElement)}`, undefined);
        }
        if (this.number === null || isNaN(this.number) || !Number.isInteger(this.number)) {
            this.number = 0;
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
                this.values.set(enumValue, { parent: this, enum: enumValue, description, uncommon, parsed: true });
            }
            catch (error) {
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
    discard() {
        FieldTypeSingleton.getInstance().removeType(this._type);
    }
    get type() {
        return this._type;
    }
    set type(type) {
        if (this._type === type)
            return;
        FieldTypeSingleton.getInstance().addType(type);
        FieldTypeSingleton.getInstance().removeType(this._type);
        this._type = type;
    }
    /**
     * Serializes the field to an XML document.
     * @param document The XML document to serialize to.
     * @param parentNode The parent node to append the serialized field to.
     */
    serialize(document, parentNode, metadata) {
        const fieldElement = document.createElement("field");
        fieldElement.setAttribute("name", this.name);
        fieldElement.setAttribute("number", this.number.toString());
        fieldElement.setAttribute("type", this._type);
        if (metadata && this.uncommon)
            fieldElement.setAttribute("uncommon", "true");
        for (const [enumValue, value] of this.values) {
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
export const FieldVue = {
    props: {
        field: Field,
    },
    components: {
        InputVue,
        AccordionVue,
        FilterVue,
        FieldEnumValueVue,
    },
    setup(props) {
        const field = props.field;
        const id = computed(() => `itemField${props.field.name}`);
        const editing = ref(false);
        const filterValuesStruct = {
            filterString: ref("")
        };
        const filterFunc = (key) => {
            return key.toLowerCase().includes(filterValuesStruct.filterString.value.toLowerCase());
        };
        const textInputType = ref(field.type);
        const textInputTypeStruct = {
            input: textInputType,
            isValid: (textInput) => {
                return textInput.length > 0;
            },
            placeholder: "Field type",
            focusOnCreate: false
        };
        const onTypeFocusOut = () => {
            editing.value = false;
            if (field.type == textInputType.value)
                return;
            if (textInputTypeStruct.isValid(textInputType.value)) {
                field.type = textInputType.value;
            }
            else {
                textInputType.value = field.type;
            }
        };
        const textInputName = ref(field.name);
        const textInputNameStruct = {
            input: textInputName,
            isValid: (textInput) => {
                return textInput.length > 0 && (textInput == field.name || !field.fixTree._fieldsMap.has(textInput));
            },
            placeholder: "Field name",
            focusOnCreate: !field._parsed
        };
        const onNameFocusOut = () => {
            editing.value = false;
            if (field._parsed && field.name == textInputName.value)
                return;
            if (textInputNameStruct.isValid(textInputName.value)) {
                let newMap = new Map();
                for (let [key, value] of field.fixTree._fieldsMap) {
                    if (key == field.name)
                        newMap.set(textInputName.value, field);
                    else
                        newMap.set(key, value);
                }
                // TODO : painfully slow but necesasry. Find another way ?
                field.fixTree._fieldsMap.clear();
                for (let [key, value] of newMap) {
                    field.fixTree._fieldsMap.set(key, value);
                }
                field.name = textInputName.value;
                field._parsed = true;
                // field.fixTree._fieldsMap.delete(field.name);
                // field.fixTree._fieldsMap.set(textInputName.value, field);
                // field._parsed = true;
            }
            else {
                if (field._parsed) {
                    textInputName.value = field.name;
                }
                else {
                    field.fixTree._fieldsMap.delete(field.name);
                }
            }
        };
        const textInputNumber = ref(field.number.toString());
        const textInputNumberStruct = {
            input: textInputNumber,
            isValid: (textInput) => {
                return textInput.length > 0 && !isNaN(Number(textInput));
            },
            placeholder: "Field number",
            focusOnCreate: false
        };
        const onNumberFocusOut = () => {
            editing.value = false;
            const newNumber = Number(textInputNumber.value);
            if (field.number === newNumber)
                return;
            if (textInputNumberStruct.isValid(textInputNumber.value)) {
                field.number = newNumber;
            }
            else {
                textInputNumber.value = field.number.toString();
            }
        };
        const addEnumValue = () => {
            field.values.set("", { parent: field, enum: "", description: "", uncommon: false, parsed: false });
        };
        const onDelete = () => {
            field.fixTree._fieldsMap.delete(field.name);
        };
        // TODO : properly
        // watch(editing, (new_editing) => {
        //     if(new_editing)
        //         textInputNameStruct.focusOnCreate = true;
        // });
        // onUpdated(() => {
        //     if (editing.value)
        //         document.getElementById(textInputId.value).focus();
        // });
        return {
            id,
            field,
            editing,
            filterValuesStruct,
            filterFunc,
            textInputTypeStruct,
            onTypeFocusOut,
            textInputNameStruct,
            onNameFocusOut,
            textInputNumberStruct,
            onNumberFocusOut,
            addEnumValue,
            onDelete,
        };
    },
    template: `
        <accordion-vue :id="id" :withBody=true :defaultExpanded=false>
            <template v-slot:header> 
                <button class="field_delete" class="btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
                <input-vue class="field_input" :inputStruct="textInputTypeStruct" @inputdone="onTypeFocusOut"></input-vue>
                <input-vue class="field_input" :inputStruct="textInputNameStruct" @inputdone="onNameFocusOut"></input-vue>
                <input-vue class="field_number_input" :inputStruct="textInputNumberStruct" @inputdone="onNumberFocusOut"></input-vue>
            </template>
            <template v-slot:body>
                <h3 class="d-flex">
                    <filter-vue :filterStruct="filterValuesStruct" class="flex-fill"></filter-vue>
                    <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addEnumValue">+</button>
                </h3>
                <div class="overflow-y-auto flex-contain d-flex flex-column">
                    <div class="flex-contain">
                        <field-enum-value-vue v-for="valueIt of field.values" :fieldEnumValue="valueIt[1]" :id="valueIt[0]" :key="valueIt[0]" v-show="filterFunc(valueIt[1].description, filterValuesStruct.filterString.value)"></field-enum-value-vue>
                    </div>
                </div>
            </template>
        </accordion-vue>`,
    // <div class="btn-group w-100 d-flex" style="font-size:10px" role="group">
    //     <button class="field_delete" class="btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
    //     <input-vue class="field_input" :inputStruct="textInputTypeStruct" @inputdone="onTypeFocusOut"></input-vue>
    //     <input-vue class="field_input" :inputStruct="textInputNameStruct" @inputdone="onNameFocusOut"></input-vue>
    //     <input-vue class="field_number_input" :inputStruct="textInputNumberStruct" @inputdone="onNumberFocusOut"></input-vue>
    // </div>`,
    // <accordion-vue :id="id" :withBody=true :defaultExpanded=false>
    //     <template v-slot:header> 
    //         <!-- TODO : add a way to edit a field => field group ?-->
    //         <button class="btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
    //         <input-vue :inputStruct="textInputTypeStruct" @inputdone="onTypeFocusOut"></input-vue>
    //         <input-vue :inputStruct="textInputNameStruct" @inputdone="onNameFocusOut"></input-vue>
    //         <input-vue :inputStruct="textInputNumberStruct" @inputdone="onNumberFocusOut"></input-vue>
    //     </template>
    //     <template v-slot:body>
    //         <h3 class="d-flex">
    //             <filter-vue :filterStruct="filterValuesStruct" class="flex-fill"></filter-vue>
    //             <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addEnumValue">+</button>
    //         </h3>
    //         <div class="overflow-y-auto flex-contain d-flex flex-column">
    //             <div class="flex-contain">
    //                 <field-enum-value-vue v-for="valueIt of field.values" :fieldEnumValue="valueIt[1]" :id="valueIt[0]" :key="valueIt[0]" v-show="filterFunc(valueIt[1].description, filterValuesStruct.filterString.value)"></field-enum-value-vue>
    //             </div>
    //         </div>
    //     </template>
    // </accordion-vue>
};
export class FieldTypeSingleton {
    constructor() {
        this.types = new Map();
    }
    static getInstance() {
        if (!FieldTypeSingleton.instance) {
            FieldTypeSingleton.instance = reactive(new FieldTypeSingleton());
        }
        return FieldTypeSingleton.instance;
    }
    addType(type) {
        if (type === undefined)
            return;
        const counter = this.types.get(type) || 0;
        this.types.set(type, counter + 1);
    }
    removeType(type) {
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
    getTypes() {
        return Array.from(this.types.keys());
    }
}
//# sourceMappingURL=Field.js.map