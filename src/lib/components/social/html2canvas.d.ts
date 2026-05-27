// Type declaration for html2canvas (no @types package available)
declare module 'html2canvas' {
    interface Options {
        scale?: number;
        useCORS?: boolean;
        backgroundColor?: string | null;
        logging?: boolean;
        width?: number;
        height?: number;
        windowWidth?: number;
        windowHeight?: number;
        x?: number;
        y?: number;
        scrollX?: number;
        scrollY?: number;
        allowTaint?: boolean;
        foreignObjectRendering?: boolean;
        imageTimeout?: number;
        ignoreElements?: (element: HTMLElement) => boolean;
        onclone?: (document: Document, element: HTMLElement) => void;
    }

    function html2canvas(element: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
    export = html2canvas;
}