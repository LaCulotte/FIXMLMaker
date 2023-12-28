import { FIXTree } from "./fixClass/FIXTree.js";

var parser = new DOMParser();

export async function loadXmlInput(): Promise<FIXTree> {
    let elem: HTMLInputElement = document.getElementById("xml-input") as HTMLInputElement;
    var file = elem?.files[0];
    if (!file) {
        throw undefined;
    }

    return file.text()
    .then((resText) => {
        return loadFIXTree(resText);
    })
    .catch((reason) => {
        throw `Cannot parse FIXML file ${file.name} : ${reason}`;
    });
}

export async function loadRemoteXmlFile(path: string) : Promise<FIXTree> {
    return fetch(path)
    .then((res) => {
        return res.text();
    })
    .then((resText) => {
        return loadFIXTree(resText);
    })
    .catch((reason) => {
        throw `Cannot parse FIXML file ${path} : ${reason}`;
    });
}


export async function loadFIXTree(xmlString: string) : Promise<FIXTree> {
    let document = parser.parseFromString(xmlString, "text/xml");
    await window.fixTree.parse(document);

    return window.fixTree;
}