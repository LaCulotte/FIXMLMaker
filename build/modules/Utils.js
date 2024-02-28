// export function generateFilter(stringFilter, 
import { ref, computed, onMounted } from "vue";
export const FilterVue = {
    props: {
        filterStruct: {
            filterString: String
        }
    },
    components: {},
    setup(props) {
        const inputTextUUID = ref(crypto.randomUUID());
        const onConfirm = () => {
            var _a;
            (_a = document.getElementById(inputTextUUID.value)) === null || _a === void 0 ? void 0 : _a.blur();
        };
        const onKeyDown = (evt) => {
            if ((evt === null || evt === void 0 ? void 0 : evt.keyCode) === 27) {
                props.filterStruct.filterString.value = "";
                onConfirm();
            }
        };
        return {
            filterStruct: props.filterStruct,
            inputTextUUID,
            onConfirm,
            onKeyDown,
        };
    },
    template: `
    <form style="display: inline-block; margin:0;" action="javascript:;" autocomplete="off">
        <input v-model="filterStruct.filterString.value" class="form-control" :id="inputTextUUID" placeholder="Search" @keydown="onKeyDown"></input>
        <input type="submit" hidden @click="onConfirm"></input>
    </form>
    `
    // <input type="submit" hidden @click="onConfirm"></input>
};
export const InputVue = {
    props: {
        inputStruct: {
            input: String,
            placeHolder: String,
            isValid: void (Boolean),
            focusOnCreate: Boolean,
            // autocomplete
        },
    },
    components: {},
    emits: ["inputdone"],
    setup(props, { emit }) {
        const textInput = props.inputStruct.input;
        const baseInput = props.inputStruct.input.value;
        const textInputId = ref(crypto.randomUUID());
        const textInputValidClass = computed(() => props.inputStruct.isValid(textInput.value) ? "" : " is-invalid");
        // const textInputValidClass = ref(props.inputStruct.isValid(textInput.value) ? "" : " is-invalid");
        const isEditing = ref(false);
        const onFocusOut = () => {
            // textInputValidClass.value = props.inputStruct.isValid(textInput.value) ? "" : " is-invalid";
            isEditing.value = false;
            emit("inputdone");
        };
        const onKeyDown = (evt) => {
            var _a;
            if ((evt === null || evt === void 0 ? void 0 : evt.keyCode) === 27 /*|| (evt?.keyCode === 90 && evt.ctrlKey)*/) {
                textInput.value = baseInput;
                (_a = document.getElementById(textInputId.value)) === null || _a === void 0 ? void 0 : _a.blur();
            }
        };
        const onConfirm = () => {
            var _a;
            (_a = document.getElementById(textInputId.value)) === null || _a === void 0 ? void 0 : _a.blur();
        };
        const onClick = () => {
            isEditing.value = true;
        };
        if (props.inputStruct.focusOnCreate) {
            onMounted(() => {
                var _a;
                (_a = document.getElementById(textInputId.value)) === null || _a === void 0 ? void 0 : _a.focus();
                props.inputStruct.focusOnCreate = false;
            });
        }
        return {
            textInput,
            textInputId,
            textInputValidClass,
            placeholder: props.placeHolder,
            isEditing,
            onFocusOut,
            onKeyDown,
            onConfirm,
            onClick
        };
    },
    template: `
        <span class="input-group" style="flex: 10">
            <form v-if="isEditing" style="display: inline-block; margin:0" action="javascript:;" autocomplete="off">
                <input :class="'form-control' + textInputValidClass" :id="textInputId" :placeholder="placeholder" v-model="textInput" @focusout="onFocusOut" @keydown="onKeyDown"></input>
                <input type="submit" hidden @click="onConfirm"></input>
            </form>
            <span v-else :class="'form-control' + textInputValidClass" :id="textInputId" @click="onClick">
                {{textInput}}
            </span>
        </span>
    `
    // <span class="input-group" style="flex: 10">
    //     <form style="display: inline-block; margin:0" action="javascript:;" autocomplete="off">
    //         <input :class="'form-control' + textInputValidClass" :id="textInputId" :placeholder="placeholder" v-model="textInput" @focusout="onFocusOut" @keydown="onKeyDown"></input>
    //         <input type="submit" hidden @click="onConfirm"></input>
    //     </form>
    // </span>
};
export const AccordionVue = {
    props: {
        withBody: Boolean,
        defaultExpanded: Boolean,
    },
    setup(props) {
        const collapseId = crypto.randomUUID();
        const collapsed = ref(!props.defaultExpanded);
        const expand = () => {
            // if(document.getElementById(collapseId).classList.contains("show"))
            //     document.getElementById(collapseId).classList.remove("show");
            // else 
            //     document.getElementById(collapseId).classList.add("show");
            collapsed.value = !collapsed.value;
        };
        // if (props.withBody === undefined)
        //     props
        // onMounted(() => {
        //     if(!collapsed)
        //         document.getElementById(collapseId)?.classList?.add("show");
        // });
        return {
            collapsed,
            collapseId,
            props,
            expand
        };
    },
    template: `
    <div class="accordion-item d-flex flex-column">
        <div class="accordion-header">
            <div class="btn-group w-100 d-flex" role="group">
                <slot name="header"></slot>

                <button v-if="props.withBody" class="accordion-button collapsed" type="button" @click="expand" style="flex: 1;">
                </button>
                <span v-if="!props.withBody" class="fake-accordion-button" style="flex: 1; width: 20px; padding: 0.4rem;">
                </span>
            </div>
        </div>
        <div v-if="!collapsed && props.withBody" class="accordion-collapse collapse show" :id="collapseId" aria-expanded="false">
            <div class="accordion-body d-flex flex-column">
                <slot name="body"></slot>
            </div>
        </div>
    </div>

    `
};
// export const ModalVue = {
//     props : {
//         id: String,
//         hint: String,
//         // inputStruct : {
//         //     input: String,
//         //     placeHolder: String,
//         //     isValid: void(Boolean),
//         //     // autocomplete
//         // },
//     },
//     emits: ["modaldone"],
//     setup(props, { emit }) {
//         const onConfirm = () => {
//             emit("modaldone");
//         };
//         const dismiss = () => {
//             console.log("dismissed");
//         };
//         // const textInputStruct = {
//         //     input: textInputName,
//         //     isValid: (textInput) => {
//         //         return textInput.length > 0 && (textInput == component.name || !component.fixTree._componentsMap.has(textInput));
//         //     },
//         //     placeholder: "Component name"
//         // };
//         return {
//             id: props.id,
//             onConfirm,
//             dismiss
//         }
//     },
//     components: {
//         InputVue,
//     },
//     // <div class="modal fade show" :id="id" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-modal="true" role="dialog" style="display: block;">
//     template: `
//     <div class="modal fade" :id="id" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
//         <div class="modal-dialog">
//             <div class="modal-content">
//                 <div class="modal-header">
//                 </div>
//                 <div class="modal-body">
//                     {{ hint }}
//                 </div>
//                 <div class="modal-footer">
//                     <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="dismiss">Close</button>
//                     <button type="button" class="btn btn-primary" data-bs-dismiss="modal" @click="onConfirm">Understood</button>
//                 </div>
//             </div>
//         </div>
//     </div>
//     `
// }
// <div class="modal fade show" id="componentsModal" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-modal="true" role="dialog" style="display: block;"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"></div><div class="modal-body"></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Understood</button></div></div></div></div>
export const TypedModalVue = {};
//# sourceMappingURL=Utils.js.map