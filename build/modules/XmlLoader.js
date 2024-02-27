var parser = new DOMParser();
export function loadXmlInput() {
    let elem = document.getElementById("xml-input");
    var file = elem === null || elem === void 0 ? void 0 : elem.files[0];
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
export function loadRemoteXmlFile(path) {
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
export function loadFIXTree(xmlString) {
    let document = parser.parseFromString(xmlString, "text/xml");
    window.fixTree.parse(document);
    return window.fixTree;
}
//# sourceMappingURL=XmlLoader.js.map