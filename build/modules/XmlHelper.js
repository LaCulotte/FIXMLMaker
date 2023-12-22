export function getChildrenByTagName(node, tagName) {
    let children = [];
    for (let child of node.childNodes) {
        if (child.nodeName == tagName)
            children.push(child);
    }
    return children;
}
export function getFirstChildByTagName(node, tagName) {
    for (let child of node.childNodes) {
        if (child.nodeName == tagName)
            return child;
    }
    return undefined;
}
export function elemToMinimalStr(element) {
    const tagName = element.tagName;
    const attributes = Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
    return `<${tagName} ${attributes}>`;
}
//# sourceMappingURL=XmlHelper.js.map