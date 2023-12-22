export function getChildrenByTagName(node: Node, tagName: string) : Array<Element> {
    let children: Array<Element> = [];
    for (let child of node.childNodes) {
        if (child.nodeName == tagName)
            children.push(child as Element);
    }

    return children;
}

export function getFirstChildByTagName(node: Node, tagName: string) : Element {
    for (let child of node.childNodes) {
        if (child.nodeName == tagName)
            return child as Element;
    }

    return undefined;
}

export function elemToMinimalStr(element: Element): string {
    const tagName = element.tagName;
    const attributes = Array.from(element.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
    return `<${tagName} ${attributes}>`;
}