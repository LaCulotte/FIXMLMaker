// import {createApp, ref} from 'vue/dist/vue.esm-browser.js'
import { createApp, ref, reactive, computed, onMounted } from 'vue';
import { loadXmlInput, loadRemoteXmlFile } from "./modules/XmlLoader.js";
import { FIXTree, FixTreeVue } from "./modules/fixClass/FIXTree.js";
import { FieldVue } from "./modules/fixClass/Field.js";
import { FilterVue } from "./modules/Utils.js";
import { ComponentVue } from "./modules/fixClass/Group.js";
function init() {
    loadRemoteXmlFile("FIXML_templates/FIXT11.xml").then((res) => {
        console.log(res);
    });
}
// const a = reactive(new FIXTree());
window.fixTree = reactive(new FIXTree());
console.log(window.fixTree._messagesMap);
console.log(window.fixTree._fieldsMap);
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
        const filteredComponents = computed(() => {
            let filtered = new Map();
            for (let [key, value] of fixTree._componentsMap) {
                if (key.toLowerCase().includes(filterComponentsStruct.filterString.value.toLowerCase()))
                    filtered.set(key, value);
            }
            return filtered;
        });
        return {
            fixTree,
            filteredComponents,
            filterComponentsStruct,
            type: window.fixTree._type,
            messages: window.fixTree._messagesMap,
            fields: window.fixTree._fieldsMap,
        };
    },
    components: {
        FieldVue,
        ComponentVue,
        FilterVue,
        FixTreeVue,
    },
    template: `
    <div>
        <div class="text-xl translate-x-80">Number of fields : {{ fixTree._fieldsMap.size }}</div>
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
                        <button class="btn fs-4" style="padding-top: 0; padding-bottom: 0">+</button>
                    </h2>
                </div>
                <div class="overflow-y-auto">
                    <div class="accordion d-flex flex-column flex-contain fix-accordion" id="components-accordion">
                        <component-vue v-for="component in filteredComponents" :component="component[1]" :key="component[0]"></field-vue>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-column flex-contain" id="messages-panel">
                <h2 class="border">
                    Messages
                </h2>
                <div class="overflow-y-auto">
                    <div>
                        <field-vue v-for="field of fixTree._fieldsMap" :field="field[1]" :id="field[0]" :key="field[0]"></field-vue>
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex flex-column flex-contain" id="middle-panel">
            <div class="d-flex flex-column flex-contain" id="header-panel">
                <div id="header-header">
                    <h2 class="border">
                        Header
                    </h2>
                </div>
                <div class="overflow-y-auto">
                    <div class="" id="">
                        <field-vue v-for="reference of fixTree._header.references" :field="reference[1]"></field-vue>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-column flex-contain" id="trailer-panel">
                <h2 class="border">
                    Trailer
                </h2>
                <div class="overflow-y-auto">
                    <div class="">
                        <field-vue v-for="reference of fixTree._trailer.references" :field="reference[1]"></field-vue>
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex flex-column" id="right-panel">
            <div class="border">
                <h2>Fields (frfr) </h2>
            </div>
            <div class="d-flex flex-column overflow-y-auto"  style="">
                <field-vue v-for="field of fixTree._fieldsMap" :field="field[1]" :id="field[0]"></field-vue>
            </div>
        </div>
        <!-- <div id="main-accordion" style="height: 100%; width: 100%;">
        </div>
        <div id="other" style="height: 100%; width: 100%;">
        </div> -->
    </div>
    `
}).mount('#app');
//# sourceMappingURL=index.js.map