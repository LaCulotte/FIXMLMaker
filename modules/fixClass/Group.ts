import { elemToMinimalStr } from "../XmlHelper.js";
import { FieldVue } from "./Field.js";
import { ParsingConfig, FIXElem, ParsingError, IFIXTree } from "./FIXElem.js";
import { FilterVue, InputVue, AccordionVue } from "../Utils.js";

import { ref, watch, reactive, computed, onMounted, capitalize } from 'vue';

export class BaseGroup extends FIXElem {
    tagName: string;

    _references: Map<string, FIXElem> = new Map();

    constructor(fixTree: IFIXTree, tagName?: string) {
        super(fixTree);
        this.tagName = tagName;
    }

    parse(groupElement: Element, parsingConfig: ParsingConfig): boolean {
        let parsingOk = true;
        this.tagName = groupElement.tagName;

        if (this.canHaveChildren) {
            let additionalReferences = new Map<string, FIXElem>();
            for (let child of groupElement.children) {
                if (child.tagName === "component" || child.tagName === "field" || child.tagName === "group") {
                    let reference = reactive(new Reference(this.fixTree, this));

                    if (reference.parse(child, parsingConfig))
                        additionalReferences.set(reference.name, reference);
                    else
                        this._parsingErrors.set(`Invalid ${this.tagName}: invalid reference ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, reference._parsingErrors);
                // } else if (child.tagName === "group") {
                //     let group = reactive(new Group());
                    
                //     if (group.parse(child, parsingConfig))
                //         this._references.set(group.name, group);
                //     else 
                //         this._parsingErrors.set(`Invalid ${this.tagName}: invalid group ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, group._parsingErrors);
                } else {
                    this._parsingErrors.set(`Invalid ${this.tagName}: invalid elem ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)} : elem tagname should be either component, group or field`, undefined);
                }
            }

            // for (let [key, value] of additionalReferences) {
            //     this._references.set(key, value);
            // }
            // this._references = {...this._references, ...additionalReferences};
            this._references = new Map([...this._references, ...additionalReferences]);
        }

        if(this.constructor.name == BaseGroup.name)
            this._parsed = true;
        return parsingOk;
    }

    get references(): Map<string, FIXElem> {
        return this._references;
    }

    get canHaveChildren(): boolean {
        return true;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = document.createElement(this.tagName);

        if (this.canHaveChildren) {
            for (let reference of this._references) {
                reference[1].serialize(document, elem, metadata);
            }
        }

        parentNode.appendChild(elem);
        return elem;
    }
}

export class CommonGroup extends BaseGroup {
    public name: string;

    constructor(fixTree: IFIXTree, name?: string, tagname?: string) {
        super(fixTree, tagname);
        this.name = name;
    }

    parse(groupElement: Element, parsingConfig: ParsingConfig): boolean {
        let parsingOk = super.parse(groupElement, parsingConfig);
        this.name = groupElement.getAttribute("name");

        if (this.name === null) {
            parsingOk = false;
            this._parsingErrors.set(`Invalid ${this.tagName}: missing attribute 'name' in ${elemToMinimalStr(groupElement)}`, undefined);
        }

        if(this.constructor.name == CommonGroup.name)
            this._parsed = true;
        return parsingOk;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("name", this.name);
        return elem;
    }
}

export class Reference extends CommonGroup {
    private _uncommon: boolean;
    required: boolean;
    parent: BaseGroup;

    constructor(fixTree: IFIXTree, parent: BaseGroup, uncommon?: boolean, required?: boolean, name?: string, tagname?: string ) {
        super(fixTree, name, tagname);
        this._uncommon = uncommon;
        this.required = required;
        this.parent = parent;
    }

    parse(groupElement: Element, parsingConfig: ParsingConfig): boolean {
        let parsingOk = super.parse(groupElement, parsingConfig);
        
        const requiredAttribute = groupElement.getAttribute("required");
        this.required = requiredAttribute !== null ? requiredAttribute === "Y" : null;
        this._uncommon = groupElement.hasAttribute("uncommon");

        if (this.required === null) {
            this.required = false;
            this._parsingErrors.set(`Invalid group: missing attribute 'required' in ${elemToMinimalStr(groupElement)}`, undefined);
        }

        this._parsed = true;
        return parsingOk;
    }

    get uncommon(): boolean {
        return this._uncommon;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("required", this.required ? "Y" : "N");
        
        if (metadata && this._uncommon)
            elem.setAttribute("uncommon", "true");
     
        return elem;
    }
}

export const ReferenceVue = {
    props : {
        reference: Reference
    },
    name: "reference-vue",
    components: {
        FilterVue,
        InputVue,
        AccordionVue,
    },
    setup(props: {reference: Reference}) {      
        const id = crypto.randomUUID();
        const checkboxId = crypto.randomUUID();
        const textInputId = crypto.randomUUID();
        const submitInputId = crypto.randomUUID();
        const reference = props.reference;
        const isGroup = computed(() => {return reference.tagName == "group"});

        const filterReferencesStruct = {
            filterString: ref("")
        }

        const textInputName = ref(reference.name);
        const textInputStruct = {
            input: textInputName,
            isValid: (textInput) => {
                if (textInput.length <= 0)
                    return false;

                if (textInput != reference.name && reference.parent.references.has(textInput))
                    return false;

                if (reference.tagName == "component")
                    return reference.fixTree._componentsMap.has(textInput);

                if (reference.tagName == "group" || reference.tagName == "field")
                    return reference.fixTree._fieldsMap.has(textInput);

                return false;
            },
            placeholder: "Reference name",
            focusOnCreate: false,
            // TODO : autocomplete
        };

        const onFocusOut = () => {
            if (reference._parsed && reference.name == textInputName.value)
                return;

            if (textInputStruct.isValid(textInputName.value)) {
                let newMap = new Map<string, Reference>();
                for (let [key, value] of reference.parent.references) {
                    if (key == reference.name)
                        newMap.set(textInputName.value, reference);
                    else
                        newMap.set(key, value as Reference);
                }

                // TODO : painfully slow but necesasry. Find another way ?
                reference.parent.references.clear()
                for (let [key, value] of newMap) {
                    reference.parent.references.set(key, value);
                }
                reference.name = textInputName.value;
                reference._parsed = true;
            }
            else {
                textInputName.value = reference.name;
            }
        }

        const onDelete = () => {
            reference.parent.references.delete(reference.name);
        }

        const addReference = () => {
            reference.references.set("", new Reference(reference.fixTree, reference, false, false, "", "field"));
        }

        const filterFunc = function(name: string, filterString: string) {
            return name.toLowerCase().includes(filterString.toLowerCase());
        }

        // if (!reference._parsed) {
        //     onMounted(() => {
        //         document.getElementById(id.value).focus();
        //     });
        // }
        return {
            isGroup,
            id,
            checkboxId,
            textInputId,
            submitInputId,
            textInputStruct,

            reference,
            onFocusOut,
            onDelete,

            filterReferencesStruct,
            filterFunc,

            addReference,
        };
    },
    template: `
        <accordion-vue :id="id" :withBody="isGroup" :defaultExpanded=true>
            <template v-slot:header>
                <button class="ref_delete btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
                <div class="ref_select">
                    <select class="form-select" v-model="reference.tagName">
                        <option value="field">field</option>
                        <option value="component">comp</option>
                        <option value="group">group</option>
                    </select>
                </div>

                <input-vue class="ref_input" :inputStruct="textInputStruct" @inputdone="onFocusOut"></input-vue>
                <div class="ref_req">
                    <input class="btn-check" v-model="reference.required" type="checkbox" :id="checkboxId"/>
                    <label class="btn ref_req_label" :for="checkboxId">Req: {{ reference.required ? "Y":"N" }}</label>
                </div>
            </template>
            <template v-slot:body>
                <h3 class="d-flex">
                    <filter-vue :filterStruct="filterReferencesStruct" class="flex-fill"></filter-vue>
                    <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addReference">+</button>
                </h3>
                <div class="overflow-y-auto flex-contain d-flex flex-column">
                    <div class="flex-contain">
                        <reference-vue v-for="referenceIt of reference.references" :reference="referenceIt[1]" :id="referenceIt[0]" :key="referenceIt[0]" v-show="filterFunc(referenceIt[0], filterReferencesStruct.filterString.value)"></reference-vue>
                    </div>
                </div>
            </template>
        </accordion-vue>
        `
    ,
}

export class Component extends CommonGroup {
    parse(componentElement: Element, parsingConfig: ParsingConfig): boolean {
        let parsingOk = super.parse(componentElement, parsingConfig);

        if (this.tagName !== "component") {
            parsingOk = false;
            this._parsingErrors.set(`Invalid component: invalid tag name '${this.tagName}' in ${elemToMinimalStr(componentElement)} Must be 'component'`, undefined);
        }

        this._parsed = true;
        return parsingOk;
    }
}

export const ComponentVue = {
    props : {
        component: Component
    },
    components: {
        FieldVue,
        ReferenceVue,
        FilterVue,
        InputVue,
        AccordionVue,
    },
    setup(props: {component: Component}) {
        // TODO : use uuids
        // const id = crypto.randomUUID();
        const checkboxId = crypto.randomUUID();
        const textInputId = crypto.randomUUID();
        const submitInputId = crypto.randomUUID();

        const id = computed(() => `itemComp${props.component.name}`);
        // const checkboxId = computed(() => `checkboxComp${props.component.name}`);
        // const textInputId = computed(() => `textInputComp${props.component.name}`);
        // const submitInputId = computed(() => `submitInputComp${props.component.name}`);
        const component = props.component;

        const filterReferencesStruct = {
            filterString: ref("")
        }

        const filterFunc = (key: string) => {
            return key.toLowerCase().includes(filterReferencesStruct.filterString.value.toLowerCase());
        };

        const textInputName = ref(component.name);
        const textInputStruct = {
            input: textInputName,
            isValid: (textInput) => {
                return textInput.length > 0 && (textInput == component.name || !component.fixTree._componentsMap.has(textInput));
            },
            placeholder: "Component name",
            focusOnCreate: !component._parsed
        };

        const onFocusOut = () => {
            if (component._parsed && component.name == textInputName.value)
                return;

            if (textInputStruct.isValid(textInputName.value)) {
                let newMap = new Map<string, Component>();
                for (let [key, value] of component.fixTree._componentsMap) {
                    if (key == component.name)
                        newMap.set(textInputName.value, component);
                    else
                        newMap.set(key, value as Component);
                }

                // TODO : painfully slow but necessary. Find another way ?
                component.fixTree._componentsMap.clear()
                for (let [key, value] of newMap) {
                    component.fixTree._componentsMap.set(key, value);
                }
                component.name = textInputName.value;
                component._parsed = true;
            }
            else {
                if (component._parsed) {
                    textInputName.value = component.name;
                }
                else {
                    component.fixTree._componentsMap.delete(component.name);
                }
            }
        }

        const onDelete = () => {
            component.fixTree._componentsMap.delete(component.name);
        }

        const addReference = () => {
            component.references.set("", new Reference(component.fixTree, component, false, false, "", ""));
        }

        return {
            id,
            checkboxId,
            textInputId,
            submitInputId,
            textInputStruct,
            component,
            onFocusOut,
            onDelete,

            filterFunc,
            filterReferencesStruct,

            addReference,
        };
    },
    template: `
        <accordion-vue :id="id" :withBody=true>
            <template v-slot:header>
                <!--input class="btn-check" v-model="component.used" type="checkbox" :id="checkboxId"/>
                <label class="btn" :for="checkboxId">{{ component.used ? "✅":"❌" }}</label-->

                <button class="btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
                <input-vue :inputStruct="textInputStruct" @inputdone="onFocusOut"></input-vue>
            </template>
            <template v-slot:body>
                <h2 class="d-flex">
                    <filter-vue :filterStruct="filterReferencesStruct" class="flex-fill"></filter-vue>
                    <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addReference">+</button>
                </h2>
                <div class="overflow-y-auto flex-contain d-flex flex-column">
                    <div class="flex-contain">
                        <reference-vue v-for="referenceIt of component.references" :reference="referenceIt[1]" :id="referenceIt[0]" :key="referenceIt[0]" v-show="filterFunc(referenceIt[0], filterReferencesStruct.filterString.value)"></reference-vue>
                    </div>
                </div>
            </template>
        </accordion-vue>
        `
    ,
}

export class Message extends CommonGroup {
    private _msgtype: string;
    private _msgcat: string;

    constructor(fixTree: IFIXTree, msgtype?: string, msgcat?: string, name?: string) {
        super(fixTree, name, "message");
        this._msgtype = msgtype;
        this._msgcat = msgcat;
    }

    parse(messageElement: Element, parsingConfig: ParsingConfig): boolean {
        let parsingOk = super.parse(messageElement, parsingConfig);
        this._msgtype = messageElement.getAttribute("msgtype");
        this._msgcat = messageElement.getAttribute("msgcat");

        if (this.tagName !== "message") {
            parsingOk = false;
            this._parsingErrors.set(`Invalid message: invalid tag name '${this.tagName}' in ${elemToMinimalStr(messageElement)} Must be 'message'`, undefined);
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

export const MessageVue = {
    props : {
        message: Message
    },
    components: {
        ReferenceVue,
        FilterVue,
        InputVue,
        AccordionVue,
    },
    setup(props: {message: Message}) {
        // TODO : use uuids
        // const id = crypto.randomUUID();
        const id = computed(() => `itemMessage${props.message.name}`);
        const checkboxId = crypto.randomUUID();

        const message = props.message;

        const filterReferencesStruct = {
            filterString: ref("")
        }

        const filterFunc = (key: string) => {
            return key.toLowerCase().includes(filterReferencesStruct.filterString.value.toLowerCase());
        };

        const textInputName = ref(message.name);
        const textInputNameStruct = {
            input: textInputName,
            isValid: (textInput) => {
                return textInput.length > 0 && (textInput == message.name || !message.fixTree._messagesMap.has(textInput));
            },
            placeholder: "Message name",
            focusOnCreate: !message._parsed
        };

        const onNameFocusOut = () => {
            if (message._parsed && message.name == textInputName.value)
                return;

            if (textInputNameStruct.isValid(textInputName.value)) {
                let newMap = new Map<string, Message>();
                for (let [key, value] of message.fixTree._messagesMap) {
                    if (key == message.name)
                        newMap.set(textInputName.value, message);
                    else
                        newMap.set(key, value as Message);
                }

                // TODO : painfully slow but necesasry. Find another way ?
                message.fixTree._messagesMap.clear()
                for (let [key, value] of newMap) {
                    message.fixTree._messagesMap.set(key, value);
                }
                message.name = textInputName.value;
                message._parsed = true;
            }
            else {
                if (message._parsed) {
                    textInputName.value = message.name;
                }
                else {
                    message.fixTree._messagesMap.delete(message.name);
                }
            }
        }

        const textInputMsgType = ref(message.msgtype);
        const textInputMsgTypeStruct = {
            input: textInputMsgType,
            isValid: (textInput) => {
                return textInput.length > 0;
            },
            placeholder: "Message type",
            focusOnCreate: false
        };

        const onMsgTypeFocusOut = () => {
            if (message.msgtype == textInputMsgType.value)
                return;

            if (textInputMsgTypeStruct.isValid(textInputMsgType.value)) {
                message.msgtype == textInputMsgType.value;
            }
            else {
                textInputMsgType.value = message.msgtype;
            }
        }

        const onDelete = () => {
            message.fixTree._messagesMap.delete(message.name);
        }

        const addReference = () => {
            message.references.set("", new Reference(message.fixTree, message, false, false, "", ""));
        }

        return {
            id,
            checkboxId,

            textInputNameStruct,
            onNameFocusOut,

            textInputMsgTypeStruct,
            onMsgTypeFocusOut,

            message,
            onDelete,

            filterFunc,
            filterReferencesStruct,

            addReference,
        };
    },
    template: `
        <accordion-vue :id="id" :withBody=true>
            <template v-slot:header>
                <button class="btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
                
                <input class="btn-check" v-model="message.used" type="checkbox" :id="checkboxId"/>
                <label class="btn" :for="checkboxId">{{ message.used ? "✅":"❌" }}</label>
                <input-vue :inputStruct="textInputNameStruct" @inputdone="onNameFocusOut"></input-vue>
                <input-vue :inputStruct="textInputMsgTypeStruct" @inputdone="onMsgTypeFocusOut"></input-vue>
                <div>
                    <select class="form-select" v-model="message.msgcat">
                        <option value="app">app</option>
                        <option value="admin">admin</option>
                    </select>
                </div>
            </template>
            <template v-slot:body>
                <h2 class="d-flex">
                    <filter-vue :filterStruct="filterReferencesStruct" class="flex-fill"></filter-vue>
                    <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addReference">+</button>
                </h2>
                <div class="overflow-y-auto flex-contain d-flex flex-column">
                    <div class="flex-contain">
                        <reference-vue v-for="referenceIt of message.references" :reference="referenceIt[1]" :id="referenceIt[0]" :key="referenceIt[0]" v-show="filterFunc(referenceIt[0])"></reference-vue>
                    </div>
                </div>
            </template>
        </accordion-vue>
        `
    ,
}