function clamp(min,max,value) {
    if (value > max) {
        return max;
    }
    if (value < min) {
        return min;
    }
    return value;
}

export class ResizerForDOM {
    constructor(t, axis, min = 0, max = 10000) {
        /** @type {HTMLElement} */
        this.DOM = t;
        this.DOM.style.position = "relative";
        this.axis = axis;
        this.min = min;
        this.max = max;

        const resizerDiv = document.createElement("div");
        resizerDiv.className = axis === "w" ? "resizer-w" : "resizer-h";
        this.DOM.append(resizerDiv);

        if (axis === "w") {
            resizerDiv.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.isResizing = true;
                // マウス座標を記録
                const startWidth = this.DOM.offsetWidth;
                const startX = e.clientX;
                const onMouseMove = (e) => {
                    // サイズを計算して適用
                    const newWidth = clamp(this.min, this.max, startWidth + (e.clientX - startX));
                    this.DOM.style.width = `${newWidth}px`;
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
            resizerDiv.addEventListener("mousedown", (e) => {
                e.stopPropagation();
                this.isResizing = true;
                // マウス座標を記録
                const startHeight = this.DOM.offsetHeight;
                const startY = e.clientY;
                const onMouseMove = (e) => {
                    // サイズを計算して適用
                    const newHeight = clamp(this.min, this.max, startHeight + (e.clientY - startY));

                    this.DOM.style.height = `${newHeight}px`;
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
    }
}