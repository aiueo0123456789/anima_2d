export const connectingString = "><-/*+><";

function clamp(min,max,value) {
    if (value > max) {
        return max;
    }
    if (value < min) {
        return min;
    }
    return value;
}

const minGridSize = 50;

class Grid {
    constructor(id, type, initWidthOrHeight) {
        this.id = id;
        this.children =[];
        this.htmlElement = document.createElement("div");
        this.htmlElement.id = id;
        if (type) {
            this.htmlElement.className = type === "w" ? "grid-w" : "grid-h";

            const child1 = document.createElement("div");
            child1.className = type === "w" ? "grid-w-left" : "grid-h-top";
            child1.id = id + connectingString + "0";

            const resizerDiv = document.createElement("div");
            resizerDiv.className = type === "w" ? "grid-resizer-w" : "grid-resizer-h";

            const child2 = document.createElement("div");
            child2.className = type === "w" ? "grid-w-right" : "grid-h-bottom";
            child2.id = id + connectingString + "1";

            this.htmlElement.append(child1,resizerDiv,child2);

            if (type === "w") {
                if (initWidthOrHeight) {
                    this.htmlElement.style.gridTemplateColumns = `${initWidthOrHeight}px 4px 1fr`;
                }
                resizerDiv.addEventListener("mousedown", (e) => {
                    e.stopPropagation();
                    this.isResizing = true;
                    // マウス座標を記録
                    const startWidth = child1.offsetWidth;
                    const startX = e.clientX;
                    const onMouseMove = (e) => {
                        // サイズを計算して適用
                        const newWidth = clamp(minGridSize, this.htmlElement.offsetWidth - minGridSize, startWidth + (e.clientX - startX));
                        this.htmlElement.style.gridTemplateColumns = `${newWidth}px 4px 1fr`;
                    };
                    const onMouseUp = () => {
                        this.isResizing = false;
                        // イベントリスナーの解除
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                    };
                    // マウスイベントのリスナーを追加
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                });
            } else {
                if (initWidthOrHeight) {
                    this.htmlElement.style.gridTemplateRows = `${initWidthOrHeight}px 4px 1fr`;
                }
                resizerDiv.addEventListener("mousedown", (e) => {
                    e.stopPropagation();
                    this.isResizing = true;
                    // マウス座標を記録
                    const startHeight = child1.offsetHeight;
                    const startY = e.clientY;
                    const onMouseMove = (e) => {
                        // サイズを計算して適用
                        const newHeight = clamp(minGridSize, this.htmlElement.offsetHeight - minGridSize, startHeight + (e.clientY - startY));

                        this.htmlElement.style.gridTemplateRows = `${newHeight}px 4px 1fr`;
                    };
                    const onMouseUp = () => {
                        this.isResizing = false;
                        // イベントリスナーの解除
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                    };
                    // マウスイベントのリスナーを追加
                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                });
            }
        } else {
            this.htmlElement.className = "container";
        }
    }

    getchildrenTag() {
        return ;
    }
}

const gridsObject = [];
export function createGridsObject(parent,grid) {
    const object = new Grid(grid.id, grid.type, grid.widthOrHeight);
    gridsObject.push(object);
    if (parent) parent.children.push(object);
    if (grid.children.length == 0) return ;
    for (const child of grid.children) {
        createGridsObject(object, child);
    }
    return ;
}

export function appendObject(parent,grid) {
    const object = new Grid(grid.id, grid.type, grid.widthOrHeight);
    gridsObject.push(object);
    if (parent) parent.children.push(object);
    if (grid.children.length == 0) return ;
    for (const child of grid.children) {
        createGridsObject(object, child);
    }
    return ;
}

export function gridUpdate(appendDiv,parent) {
    if (!parent) {
        parent = gridsObject[0];
    }
    document.getElementById(appendDiv).append(parent.htmlElement);
    if (parent.children.length == 0) return ;
    for (let i = 0; i < parent.children.length; i ++) {
        const child = parent.children[i];
        gridUpdate(parent.id + connectingString + String(i), child);
    }
    return ;
}
