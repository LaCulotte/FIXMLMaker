export class ParsingConfig {
    lenient: boolean = false;
}

export type ParsingError = Map<string, ParsingError>;

declare class Field extends FIXElem {};
declare class Message extends FIXElem {};
declare class Component extends FIXElem {};
declare class BaseGroup extends FIXElem {};

export interface IFIXTree {
    _fieldsMap: Map<string, Field>;
    _messagesMap: Map<string, Message>;
    _componentsMap: Map<string, Component>;
    _header: BaseGroup;
    _trailer: BaseGroup;
}

export class FIXElem {
    fixTree: IFIXTree;

    _parsingErrors: ParsingError = new Map<string, ParsingError>();

    _parsed: boolean = false;

    used: boolean = false;

    constructor(fixTree: IFIXTree) {
        this.fixTree = fixTree;
    }

    parse(elem: Element, parsingConfig: ParsingConfig): boolean {
        throw new Error("Method parse not implemented. FIXElem was not meant to be instantiated.");
    }

    serialize(document: Document, parentNode: Element, metadata: boolean): Element {
        throw new Error("Method serialize not implemented. FIXElem was not meant to be instantiated.");
    }

    checkValid(): boolean {
        throw new Error("Method check not implemented. FIXElem was not meant to be instantiated.");
    }

    discard(): void {
    }

    // /**
    //  * Adds a parsing error to the member array based on the lenient boolean in parsingConfig.
    //  * @param error The error message to add.
    //  * @param parsingConfig The parsing configuration.
    //  */
    // addParsingError(error: string, parsingConfig: ParsingConfig): void {
    //     this._parsingErrors.push(error);
    // }
}
