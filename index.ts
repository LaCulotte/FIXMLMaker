import { 
    loadXmlInput,
    loadRemoteXmlFile
 } from "./modules/XmlLoader.js";
import { Field } from "./modules/fixClass/Field.js";

var FIXT11 = "";

function load()
{
    loadXmlInput().then(console.log);
}

function init()
{
    loadRemoteXmlFile("FIXML_templates/FIXT11.xml").then((res) => {
        FIXT11 = res;
    });
}

//@ts-ignore
window.load = load;

init();