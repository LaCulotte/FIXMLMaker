import { FIXTree } from "./fixClass/FIXTree.js";

var parser = new DOMParser();

export function loadXmlInput(): Promise<FIXTree> {
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

export function loadRemoteXmlFile(path: string) : Promise<FIXTree> {
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


export function loadFIXTree(xmlString: string) : FIXTree {
    let document = parser.parseFromString(xmlString, "text/xml");
    window.fixTree.parse(document);

    return window.fixTree;
}