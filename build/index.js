// import {createApp, ref} from 'vue/dist/vue.esm-browser.js'
import { createApp, ref, reactive, onMounted } from 'vue';
import { loadXmlInput, loadRemoteXmlFile } from "./modules/XmlLoader.js";
import { FIXTree, FixTreeVue } from "./modules/fixClass/FIXTree.js";
import { FieldVue, Field } from "./modules/fixClass/Field.js";
import { FilterVue } from "./modules/Utils.js";
import { ComponentVue, Component, ReferenceVue, Reference, MessageVue, Message } from "./modules/fixClass/Group.js";
function init() {
    loadRemoteXmlFile("FIXML_templates/FIXT11.xml").then((res) => {
        console.log(res);
    });
}
// const a = reactive(new FIXTree());
window.fixTree = reactive(new FIXTree());
window.load = function () {
    loadXmlInput().then(console.log);
};
window.serialize = () => {
    return window.fixTree.serialize(true);
};
window.show = ref(false);
init();
createApp({
    setup() {
        onMounted(() => {
            //@ts-ignore
            window.Split(['#components-panel', '#messages-panel'], {
                gutterSize: 5,
                direction: 'vertical',
            });
            window.Split(['#header-panel', '#trailer-panel'], {
                gutterSize: 5,
                direction: 'vertical',
            });
            window.Split(['#left-panel', '#middle-panel'], {
                gutterSize: 5,
                sizes: [100, 50],
            });
            window.Split(['#middle-panel', '#right-panel'], {
                gutterSize: 5,
            });
        });
        const fixTree = window.fixTree;
        const filterComponentsStruct = {
            filterString: ref(""),
        };
        const filterHeaderStruct = {
            filterString: ref(""),
        };
        const filterTrailerStruct = {
            filterString: ref(""),
        };
        const filterMessagesStruct = {
            filterString: ref(""),
        };
        const filterFieldsStruct = {
            filterString: ref(""),
        };
        const filterFunc = function (name, filterString) {
            return name.toLowerCase().includes(filterString.toLowerCase());
        };
        const addComponent = () => {
            fixTree._componentsMap.set("", new Component(fixTree, ""));
        };
        const addMessage = () => {
            fixTree._messagesMap.set("", new Message(fixTree, "", "app", ""));
        };
        const addHeaderField = () => {
            fixTree._header.references.set("", new Reference(fixTree, fixTree._header, false, false, "", "field"));
        };
        const addTrailerField = () => {
            fixTree._trailer.references.set("", new Reference(fixTree, fixTree._trailer, false, false, "", "field"));
        };
        const addField = () => {
            fixTree._fieldsMap.set("", new Field(fixTree, "", 0, "STRING", new Map(), false));
        };
        return {
            fixTree,
            // filteredComponents,
            filterComponentsStruct,
            addComponent,
            filterMessagesStruct,
            addMessage,
            filterHeaderStruct,
            addHeaderField,
            filterTrailerStruct,
            addTrailerField,
            filterFieldsStruct,
            addField,
            filterFunc,
            type: window.fixTree._type,
            messages: window.fixTree._messagesMap,
            fields: window.fixTree._fieldsMap,
        };
    },
    components: {
        FieldVue,
        ReferenceVue,
        ComponentVue,
        MessageVue,
        FilterVue,
        FixTreeVue,
    },
    template: `
    <div>
        <div class="text-xl translate-x-80">Number of fields : {{ fixTree._fieldsMap.size }} Number of components : {{ fixTree._componentsMap.size }} Number of messages : {{ fixTree._messagesMap.size }}</div>
        <a href="#DefaultApplExtID">DefaultApplExtID</a>
        <p>
            <div class="input-group mb-3">
                <label class="input-group-text">Add XML definitions : </label>
                <input type="file" id="xml-input" class="form-control"/>
            </div>
            <div><button value="salut" onclick="window.load();">salut</button></div>
        </p>
    </div>
    <div class="d-flex flex-row h-100 flex-contain">
        <div class="d-flex flex-column flex-contain" id="left-panel">
            <div class="d-flex flex-column flex-contain" id="components-panel">
                <div id="components-header">    
                    <h2 class="border d-flex">
                        <span class="flex-fill">Components</span>
                        <filter-vue :filterStruct="filterComponentsStruct" :key="'component-filter'"></filter-vue>
                        <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addComponent">+</button>
                    </h2>
                </div>
                <div class="overflow-y-auto">
                    <div class="accordion d-flex flex-column flex-contain fix-accordion">
                        <!--component-vue v-for="componentIt in fixTree._componentsMap" :component="componentIt[1]" :key="componentIt[0]" v-show="componentIt[0].toLowerCase().includes(filterComponentsStruct.filterString.value.toLowerCase())"></component-vue-->
                        <component-vue v-for="componentIt in fixTree._componentsMap" :component="componentIt[1]" :key="componentIt[0]" v-show="filterFunc(componentIt[0], filterComponentsStruct.filterString.value)"></component-vue>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-column flex-contain" id="messages-panel">
                <h2 class="border d-flex">
                    <span class="flex-fill">Messages</span>
                    <filter-vue :filterStruct="filterMessagesStruct" :key="'message-filter'"></filter-vue>
                    <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addMessage">+</button>
                </h2>
                <div class="overflow-y-auto">
                    <div class="accordion d-flex flex-column flex-contain fix-accordion">
                        <message-vue v-for="messageIt in fixTree._messagesMap" :message="messageIt[1]" :key="messageIt[0]" v-show="filterFunc(messageIt[0], filterMessagesStruct.filterString.value)"></message-vue>
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex flex-column flex-contain" id="middle-panel">
            <div class="d-flex flex-column flex-contain" id="header-panel">
                <div id="header-header">
                    <h2 class="border d-flex">
                        <span class="flex-fill">Header</span>
                        <filter-vue :filterStruct="filterHeaderStruct" :key="'header-filter'"></filter-vue>
                        <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addHeaderField">+</button>
                    </h2>
                </div>
                <div class="overflow-y-auto flex-contain d-flex flex-column">
                    <div class="accordion d-flex flex-column flex-contain fix-accordion">
                        <reference-vue v-for="referenceIt of fixTree._header.references" :reference="referenceIt[1]" :key="referenceIt[0]" v-show="filterFunc(referenceIt[0], filterHeaderStruct.filterString.value)"></reference-vue>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-column flex-contain" id="trailer-panel">
                <h2 class="border d-flex">
                    <span class="flex-fill">Trailer</span>
                    <filter-vue :filterStruct="filterTrailerStruct" :key="'trailer-filter'"></filter-vue>
                    <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addTrailerField">+</button>
                </h2>
                <div class="overflow-y-auto flex-contain d-flex flex-column">
                    <div class="accordion d-flex flex-column flex-contain fix-accordion">
                        <reference-vue v-for="referenceIt of fixTree._trailer.references" :reference="referenceIt[1]" :key="referenceIt[0]" v-show="filterFunc(referenceIt[0], filterTrailerStruct.filterString.value)"></reference-vue>
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex flex-column" id="right-panel">
            <h2 class="border d-flex">
                <span class="flex-fill">Fields</span>
                <filter-vue :filterStruct="filterFieldsStruct" :key="'fields-filter'"></filter-vue>
                <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0" @click="addField">+</button>
            </h2>
            <div class="overflow-y-auto flex-contain d-flex flex-column">
                <div class="accordion d-flex flex-column flex-contain fix-accordion">
                    <input/>
                    <field-vue v-for="fieldIt of fixTree._fieldsMap" :field="fieldIt[1]" :id="fieldIt[0]" :key="fieldIt[0]" v-show="filterFunc(fieldIt[0], filterFieldsStruct.filterString.value)"></field-vue>
                </div>
            </div>
        </div>
    </div>
    `
}).mount('#app');
//# sourceMappingURL=index.js.map