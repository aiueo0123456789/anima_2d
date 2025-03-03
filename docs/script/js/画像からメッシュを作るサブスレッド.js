// vec2同士の足し算
function vecAdd(vec1, vec2) {
    return [vec1[0] + vec2[0], vec1[1] + vec2[1]];
}

const lineData = [
    [], // 0000
    [[[-0.5, 0],[0, -0.5]]], // 0001
    [[[0, -0.5],[0.5, 0]]], // 0010
    [[[-0.5, 0],[0.5, 0]]], // 0011
    [[[0, 0.5],[0.5, 0]]], // 0100
    [[[-0.5, 0],[0, 0.5]],[[0, -0.5],[0.5, 0]]], // 0101
    [[[0, 0.5],[0, -0.5]]], // 0110
    [[[-0.5, 0],[0, 0.5]]], // 0111
    [[[-0.5, 0],[0, 0.5]]], // 1000
    [[[0, 0.5],[0, -0.5]]], // 1001
    [[[0.5, 0],[0, 0.5]],[[0, -0.5],[-0.5, 0]]], // 1010
    [[[0.5, 0],[0, 0.5]]], // 1011
    [[[0.5, 0],[-0.5, 0]]], // 1100
    [[[0, -0.5],[0.5, 0]]], // 1101
    [[[0, -0.5],[-0.5, 0]]], // 1110
    [], // 1111
];

self.onmessage = function(event) {
    const e = event.data;
    const result = e.result;
    const imageBufferSize = e.imageBufferSize;
    const threadedIndex = e.threadedIndex;
    const collectedLines = [];
    let index = 0;
    for (let i = e.startIndex; i < e.endIndex; i ++) {
        if (i >= imageBufferSize[0] * imageBufferSize[1]) {
            break ;
        }
        const type = result[index];
        const lines = lineData[type];
        const [x,y] = [i % imageBufferSize[0], Math.floor(i / imageBufferSize[0])];
        for (const line of lines) {
            collectedLines.push([
                vecAdd([x, y], line[0]),
                vecAdd([x, y], line[1]),
            ]);
        }
        index ++;
    }

    self.postMessage({
        threadedIndex: threadedIndex,
        collectedLines: collectedLines,
    });
};