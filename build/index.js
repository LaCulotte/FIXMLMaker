// import {createApp, ref} from 'vue/dist/vue.esm-browser.js'
import { createApp, reactive } from 'vue';
import { loadXmlInput, loadRemoteXmlFile } from "./modules/XmlLoader.js";
import { FIXTree } from "./modules/fixClass/FIXTree.js";
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
init();
createApp({
    setup() {
        // const type = ref(window.fixTree._type);
        // watch(fixTree._messagesMap)
        // console.log(fixTree._messagesMap.size);
        // watch(fixTree._messagesMap)
        return {
            tree: window.fixTree,
            type: window.fixTree._type,
            messages: window.fixTree._messagesMap,
            fields: window.fixTree._fieldsMap,
        };
    }
}).mount('#app');
//# sourceMappingURL=index.js.map