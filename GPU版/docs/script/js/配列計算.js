class ArrayMath {
    constructor() {
    }

    add() {
        for (let i = 0; i < t.length; i ++) {
            t[i] = a[i] + b[i]
        }
    }

    sub(t,a,b) {
        for (let i = 0; i < t.length; i ++) {
            t[i] = a[i] - b[i]
        }
    }

    shuffleArray(array) {
        const result = [...array]; // 元の配列を破壊しないようにコピー
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1)); // ランダムなインデックスを選ぶ
          [result[i], result[j]] = [result[j], result[i]]; // 要素をスワップ
        }
        return result;
    }
}

class Mat3x3 {
    constructor() {
    }

    create() {
        return new Float32Array(9);
    }

    setMatrix(t, pos, scale, rot) {
        const cosR = Math.cos(rot);
        const sinR = Math.sin(rot);

        t[0] = scale[0] * cosR;
        t[1] = scale[0] * sinR;
        t[2] = 0;
        t[3] = scale[1] * sinR;
        t[4] = scale[1] * cosR;
        t[5] = 0;
        t[6] = pos[0];
        t[7] = pos[1];
        t[8] = 1;
    }

    setPos(t,pos) {
        t[6] = pos[0];
        t[7] = pos[1];
        t[8] = 1;
    }
}

export const arrayMath = new ArrayMath();

export const mat3x3 = new Mat3x3();