// export function generateFilter(stringFilter, 

import { ref, Ref, computed, watch } from "vue";

export const FilterVue = {
    props : {
        filterStruct: {
            filterString: String
        }
    },
    components: {
    },
    setup(props) {
        const inputTextUUID = ref(crypto.randomUUID());

        const onConfirm = () => {   
            document.getElementById(inputTextUUID.value)?.blur();
        }

        const onKeyDown = (evt) => {
            if(evt?.keyCode === 27) {
                props.filterStruct.filterString.value = "";
                onConfirm();
            }
        }

        // watch(filterString, () => {
        //     props.filterStruct.filteredElements.value.clear();
        //     for (const [key, value] of props.filterStruct.elements.entries()) {
        //         if (key.toLowerCase().includes(filterString.value.toLowerCase())) {
        //             props.filterStruct.filteredElements.value.set(key, value);
        //         }
        //     }
        // });

        // watch(props.filterStruct.elements, () => {
        //     console.log("watch");
            // filterString.value = ""
        // });
            // props.filterStruct.filteredElements.value.clear();
            // for (const [key, value] of props.filterStruct.elements.entries()) {
            //     if (key.toLowerCase().includes(filterString.value.toLowerCase())) {
            //         props.filterStruct.filteredElements.value.set(key, value);
            //     }
            // }
        // });

        return {
            filterStruct: props.filterStruct,
            inputTextUUID,
            onConfirm,
            onKeyDown,
        }
    },
    template: `
    <form style="display: inline-block; margin:0" action="javascript:;" autocomplete="off">
        <input v-model="filterStruct.filterString.value" class="form-control" :id="inputTextUUID" placeholder="Search" @keydown="onKeyDown"></input>
        <input type="submit" hidden @click="onConfirm"></input>
    </form>
    `
}

export const InputVue = { 
    props : {
        inputStruct: {
            input: String,
            placeHolder: String,
            isValid: void(Boolean),
        },
    }, 
    components: {
    },
    emits: ["inputdone"],
    setup(props, { emit }) {
        const textInput = props.inputStruct.input;
        const baseInput = props.inputStruct.input.value;
        const textInputId = ref(crypto.randomUUID());
        const textInputValidClass = computed(() => props.inputStruct.isValid(textInput.value) ? "" : " is-invalid");

        const onFocusOut = () => {
            emit("inputdone");
        }

        const onKeyDown = (evt) => {
            if(evt?.keyCode === 27 /*|| (evt?.keyCode === 90 && evt.ctrlKey)*/) {
                textInput.value = baseInput;
                document.getElementById(textInputId.value)?.blur();
            }
        }

        const onConfirm = () => {
            document.getElementById(textInputId.value)?.blur();
        }

        return {
            textInput,
            textInputId,
            textInputValidClass,
            placeholder: props.placeHolder,
            onFocusOut,
            onKeyDown,
            onConfirm
        }
    },
    template: `
    <span class="input-group" style="flex: 10">
        <form style="display: inline-block; margin:0" action="javascript:;" autocomplete="off">
            <input :class="'form-control' + textInputValidClass" :id="textInputId" :placeholder="placeholder" v-model="textInput" @focusout="onFocusOut" @keydown="onKeyDown"></input>
            <input type="submit" hidden @click="onConfirm"></input>
        </form>
    </span>
    `

}