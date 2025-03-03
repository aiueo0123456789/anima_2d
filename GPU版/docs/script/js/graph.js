export class GraphRender {
    constructor(cvs, managerObject) {
        if (!cvs || !(cvs instanceof HTMLCanvasElement)) {
            console.error("cvsを渡してください");
        }
        this.cvs = cvs;
        this.ctx = cvs.getContext("2d");
        this.managerObject = managerObject;
    }

    fixPosition(pos) {
        return [pos[0], this.cvs.height - pos[1]];
    }

    // UI
    colorS(r,g,b,a = 1) {
        return `rgb(${r},${g},${b},${a})`;
    }

    clear() {
        // this.ctx.clearRect(0, 0, this.cvs.width, this.cvs.height); // UI用のcanvasをクリア
        this.ctx.fillStyle = this.colorS(200,200,200); // クリアする色を指定
        this.ctx.fillRect(0, 0, this.cvs.width, this.cvs.height); // キャンバス全体を塗りつぶす
    }

    renderLine(pos1, pos2, width, col) {
        this.ctx.strokeStyle = this.colorS(...col);
        this.ctx.lineWidth = width;

        this.ctx.beginPath();
        this.ctx.moveTo(...this.fixPosition(pos1));
        this.ctx.lineTo(...this.fixPosition(pos2));
        this.ctx.stroke();
    }

    heightFromX(x) {
        if (this.managerObject.smoothType == "通常") {
            return [x * 100, 1 * 100];
        } else if (this.managerObject.smoothType == "1次関数") {
            return [x * 100, (1.0 - x) * 100];
        } else if (this.managerObject.smoothType == "2次関数") {
            return [x * 100, ((1.0 - (x)) ** 2) * 100];
        }
    }

    renderGraph() {
        this.clear();
        for (let x = 0; x < 1; x += 0.01) {
            this.renderLine([x * 100, 0],this.heightFromX(x),1,[90,90,90]);
        }
    }
}