import { elemToMinimalStr } from "../XmlHelper.js";
import { FieldVue } from "./Field.js";
import { ParsingConfig, FIXElem, ParsingError, IFIXTree } from "./FIXElem.js";
import { FilterVue, InputVue } from "../Utils.js";

import { ref, watch, reactive, computed } from 'vue';

export class BaseGroup extends FIXElem {
    protected _tagName: string;

    protected _references: Map<string, FIXElem> = new Map();

    constructor(fixTree: IFIXTree, tagName?: string) {
        super(fixTree);
        this._tagName = tagName;
    }

    async parse(groupElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = true;
        this._tagName = groupElement.tagName;

        if (this.canHaveChildren) {
            let additionalReferences = new Map<string, FIXElem>();
            for (let child of groupElement.children) {
                if (child.tagName === "component" || child.tagName === "field" || child.tagName === "group") {
                    let reference = reactive(new Reference(this.fixTree));

                    if (await reference.parse(child, parsingConfig))
                        additionalReferences.set(reference.name, reference);
                    else
                        this._parsingErrors.set(`Invalid ${this._tagName}: invalid reference ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, reference._parsingErrors);
                // } else if (child.tagName === "group") {
                //     let group = reactive(new Group());
                    
                //     if (await group.parse(child, parsingConfig))
                //         this._references.set(group.name, group);
                //     else 
                //         this._parsingErrors.set(`Invalid ${this._tagName}: invalid group ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)}`, group._parsingErrors);
                } else {
                    this._parsingErrors.set(`Invalid ${this._tagName}: invalid elem ${elemToMinimalStr(child)} in ${elemToMinimalStr(groupElement)} : elem tagname should be either component, group or field`, undefined);
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

    get tagName(): string {
        return this._tagName;
    }

    get references(): Map<string, FIXElem> {
        return this._references;
    }

    get canHaveChildren(): boolean {
        return true;
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = document.createElement(this._tagName);

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

    constructor(fixTree: IFIXTree, name?: string) {
        super(fixTree);
        this.name = name;
    }

    async parse(groupElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = await super.parse(groupElement, parsingConfig);
        this.name = groupElement.getAttribute("name");

        if (this.name === null) {
            parsingOk = false;
            this._parsingErrors.set(`Invalid ${this._tagName}: missing attribute 'name' in ${elemToMinimalStr(groupElement)}`, undefined);
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
    private _required: boolean;

    constructor(fixTree: IFIXTree, uncommon?: boolean, required?: boolean) {
        super(fixTree);
        this._uncommon = uncommon;
        this._required = required;
    }

    async parse(groupElement: Element, parsingConfig: ParsingConfig): Promise<boolean> {
        let parsingOk = await super.parse(groupElement, parsingConfig);
        
        const requiredAttribute = groupElement.getAttribute("required");
        this._required = requiredAttribute !== null ? requiredAttribute === "Y" : null;
        this._uncommon = groupElement.hasAttribute("uncommon");

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

    get canHaveChildren(): boolean {
        return this.tagName === "group";
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        let elem = super.serialize(document, parentNode, metadata);
        elem.setAttribute("required", this._required ? "Y" : "N");
        
        if (metadata && this._uncommon)
            elem.setAttribute("uncommon", "true");
     
        return elem;
    }
}

export const ReferenceVue = {

}

export class Component extends CommonGroup {
    test: boolean = false;

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

export const ComponentVue = {
    props : {
        component: Component
    },
    components: {
        FieldVue,
        FilterVue,
        InputVue
    },
    setup(props: {component: Component}) {
        const dataBsTarget = computed(() => `#collapseComp${props.component.name}`);
        const id = computed(() => `itemComp${props.component.name}`);
        const collapseId = computed(() => `collapseComp${props.component.name}`);
        const checkboxId = computed(() => `checkboxComp${props.component.name}`);
        const textInputId = computed(() => `textInputComp${props.component.name}`);
        const submitInputId = computed(() => `submitInputComp${props.component.name}`);
        const component = props.component;

        const filterReferencesStruct = {
            filterString: ref("")
        }
        const filteredReferences = computed(() => {
            let filtered = new Map<string, FIXElem>();
            for (let [key, value] of component.references) {
                if (key.toLowerCase().includes(filterReferencesStruct.filterString.value.toLowerCase()))
                    filtered.set(key, value);
            }
            return filtered;
        });
        // for (let [key, value] of component.references) {
        //     filteredReferences.value.set(key, value);
        // }

        //     elements: component.references,
        //     filteredElements: filteredReferences
        // }

        const textInputName = ref(component.name);
        const textInputStruct = {
            input: textInputName,
            isValid: (textInput) => {
                return textInput.length > 0 && (textInput == component.name || !component.fixTree._componentsMap.has(textInput));
            },
            placeholder: "Component name"

        };

        // const textInputValidClass = computed(() => isTextInputNameValid() ? "" : " is-invalid");
        // let isTextInputNameValid = 

        const onFocusOut = () => {
            if (component.name == textInputName.value)
                return;

            if (textInputStruct.isValid(textInputName.value)) {
                let newMap = new Map<string, Component>();
                for (let [key, value] of component.fixTree._componentsMap) {
                    if (key == component.name)
                        newMap.set(textInputName.value, component);
                    else
                        newMap.set(key, value as Component);
                }

                // TODO : painfully slow but necesasry. Find another way ?
                component.fixTree._componentsMap.clear()
                for (let [key, value] of newMap) {
                    component.fixTree._componentsMap.set(key, value);
                }
                component.name = textInputName.value;
            }
            else {
                textInputName.value = component.name;
            }
        }

        // const onConfirm = () => {
        //     document.getElementById(textInputId.value)?.blur();
        // }

        // const onKeyDown = (evt) => {
        //     if(evt?.keyCode === 27) {
        //         textInputName.value = component.name;
        //         document.getElementById(textInputId.value)?.blur();
        //         console.log(`escape ${evt}`);
        //     }
        // }

        const onDelete = () => {
            component.fixTree._componentsMap.delete(component.name);
        }

        return {
            dataBsTarget,
            id,
            collapseId,
            checkboxId,
            textInputId,
            submitInputId,
            textInputStruct,
            // textInputValidClass,
            component,
            onFocusOut,
            onDelete,
            // onKeyDown,
            // onConfirm,
            filteredReferences,
            filterReferencesStruct
        };
    },
    template: `
        <div class="accordion-item d-flex flex-column flex-shrink" :id="id">
            <h2 class="accordion-header">
                <div class="btn-group w-100 d-flex" role="group">
                    <!--input class="btn-check" v-model="component.used" type="checkbox" :id="checkboxId"/>
                    <label class="btn" :for="checkboxId">{{ component.used ? "✅":"❌" }}</label-->
                    <button class="btn btn-danger me-2 p-0" @click="onDelete" style="flex 1">🗑️</button>
                    <!--span class="input-group" style="flex: 10">
                        <form style="display: inline-block; margin:0" action="javascript:;" autocomplete="off">
                            <input :class="'form-control' + textInputValidClass" :id="textInputId" placeholder="Component Name" v-model="textInputName" @inputdone="onFocusOut" @keydown="onKeyDown"></input>
                            <input type="submit" hidden @click="onConfirm"></input>
                        </form>
                    </span-->
                    <input-vue :inputStruct="textInputStruct" @focusout="onFocusOut"></input-vue>
                    <button class="accordion-button collapsed flex-grow" type="button" data-bs-toggle="collapse" :data-bs-target="dataBsTarget" style="flex: 30">
                    </button>
                </div>
            </h2>
            <div class="accordion-collapse collapse" :id="collapseId" data-bs-parent="components-accordion" aria-expanded="false">
                <div class="accordion-body d-flex flex-column">
                    <filter-vue :filterStruct="filterReferencesStruct"></filter-vue>
                    <div class="overflow-y-auto flex-contain d-flex flex-column">
                        <div class="flex-contain">
                            <field-vue v-for="reference of filteredReferences" :field="reference[1]" :id="reference[0]" :key="reference[0]"></field-vue>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `
    ,
}

export class Message extends CommonGroup {
    private _msgtype: string;
    private _msgcat: string;

    constructor(fixTree: IFIXTree, msgtype?: string, msgcat?: string) {
        super(fixTree);
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