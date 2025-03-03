import { MarchingSquaresPipeline, c_srw_t } from "./GPUObject.js";
import { device,GPU } from "./webGPU.js";
import { vec2 } from './ベクトル計算.js';

const worker = new Worker('script/js/画像からメッシュを作るサブスレッド.js');

function delaunay(vertices, edge) {
    function areArraysEqual(arr1, arr2) {
        // 長さが異なる場合は false を返す
        if (arr1.length !== arr2.length) return false;

        // 配列をソートして要素を比較
        const sortedArr1 = [...arr1].sort();
        const sortedArr2 = [...arr2].sort();

        return sortedArr1.every((value, index) => value === sortedArr2[index]);
    }

    function getTriangleCenterPoint(p1,p2,p3) {
        const c = 2 * ((p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]));

        const a = (p2[0] * p2[0] - p1[0] * p1[0] + p2[1] * p2[1] - p1[1] * p1[1]);
        const b = (p3[0] * p3[0] - p1[0] * p1[0] + p3[1] * p3[1] - p1[1] * p1[1]);
        return [
            ((p3[1] - p1[1]) * a + (p1[1] - p2[1]) * b) / c,
            ((p1[0] - p3[0]) * a + (p2[0] - p1[0]) * b) / c
        ];
    }

    function countEdges(n) {
        if (n < 2) return 0; // 頂点が1つ以下ならエッジは作れない
        return (n * (n - 1)) / 2;
    }

    function getHash(a, b) {
        return (a * 10000000 + b); // 適当な係数を使ったハッシュ的計算
    }

    function uniqueEdgeSet(stack, edge) {
        // エッジをソートしてセットとして扱う
        const sortedEdge = edge[0] < edge[1] ? edge : [edge[1], edge[0]];
        const myHash = getHash(...sortedEdge);
        if (stack.length == 0) {
            stack.push({edge: sortedEdge, hash: myHash}); // エッジが存在しない場合のみ追加
            return ;
        }
        for (let i = 0; i < stack.length; i ++) {
            if (myHash == stack[i].hash) { // ハッシュの重複=重複するエッジがみつかった
                return ;
            }
            // } else if (myHash < stack[i].hash) {
            //     stack.splice(i, 0, {edge: sortedEdge, hash: myHash}); // エッジが存在しない場合のみ追加
            //     return ;
            // }
        }
        stack.push({edge: sortedEdge, hash: myHash}); // エッジが存在しない場合のみ追加
    }

    function isLineConstraint(index1,index2) {
        return index1 < edge.length && index2 < edge.length && index1 + 1 == index2;
    }

    function isSquareConvex(p1,p2,p3,p4) {
        // 四角形の各点で外積を計算
        const cross1 = vec2.cross3R(p1, p2, p3);
        const cross2 = vec2.cross3R(p2, p3, p4);
        const cross3 = vec2.cross3R(p3, p4, p1);
        const cross4 = vec2.cross3R(p4, p1, p2);

        // すべての外積の符号が同じかを確認
        const allPositive = cross1 > 0 && cross2 > 0 && cross3 > 0 && cross4 > 0;
        const allNegative = cross1 < 0 && cross2 < 0 && cross3 < 0 && cross4 < 0;

        return allPositive || allNegative;
    }

    // ドロネー三角形分割のメイン処理
    const verticesData = [[-100000,-100000],[0,100000],[100000,-10000]].concat(vertices);
    const mesh = [[0,1,2]];

    // メイン
    for (let i = 3; i < verticesData.length; i ++) {
        let stack = [];
        for (let j = mesh.length - 1; j >= 0; j --) {
            const i1 = mesh[j][0];
            const i2 = mesh[j][1];
            const i3 = mesh[j][2];
            const center = getTriangleCenterPoint(verticesData[i1],verticesData[i2],verticesData[i3]);

            const circleRadius = vec2.distanceR(center, verticesData[i1]);

            if (vec2.distanceR(center, verticesData[i]) < circleRadius) {
                uniqueEdgeSet(stack, [i1, i2]);
                uniqueEdgeSet(stack, [i2, i3]);
                uniqueEdgeSet(stack, [i3, i1]);
                mesh.splice(j,1);
                mesh.push([i1,i2,i]);
                mesh.push([i2,i3,i]);
                mesh.push([i3,i1,i]);
            }
        }
        while (stack.length != 0) {
            const edge = stack.pop().edge;

            const targetTriangles = [];
            const getIndex = [];

            for (let k = 0; k < mesh.length; k ++) {
                if (mesh[k].includes(edge[0]) && mesh[k].includes(edge[1])) {
                    targetTriangles.push(mesh[k]);
                    getIndex.push(k);
                }
            }

            if (targetTriangles.length < 2) {
                continue;
            }

            if (areArraysEqual(targetTriangles[0],targetTriangles[1])) {
                mesh.splice(getIndex[1],1);
                mesh.splice(getIndex[0],1);
                continue;
            }

            const c = targetTriangles[0].filter(value => !edge.includes(value));
            const d = targetTriangles[1].filter(value => !edge.includes(value));

            const center = getTriangleCenterPoint(verticesData[edge[0]],verticesData[edge[1]],verticesData[c]);

            const circleRadius = vec2.distanceR(center, verticesData[edge[0]]);

            if (isLineConstraint(edge[0],edge[1])) { // ABが線分制約
            } else if (isLineConstraint(c,d) && isSquareConvex(verticesData[edge[0]],verticesData[edge[1]],verticesData[c],verticesData[d])) { // cdが線分制約であり四角形ABCDが凸
                mesh.splice(getIndex[1],1);
                mesh.splice(getIndex[0],1);

                mesh.push([edge[0],c,d]);
                mesh.push([edge[1],c,d]);

                uniqueEdgeSet(stack, [edge[0], d]);
                uniqueEdgeSet(stack, [d, edge[1]]);
                uniqueEdgeSet(stack, [edge[1], c]);
                uniqueEdgeSet(stack, [c, edge[0]]);
                // uniqueEdgeSet(stack, [c, d]);
            } else if (vec2.distanceR(center, verticesData[d]) < circleRadius) {
                mesh.splice(getIndex[1],1);
                mesh.splice(getIndex[0],1);

                mesh.push([edge[0],c,d]);
                mesh.push([edge[1],c,d]);

                uniqueEdgeSet(stack, [edge[0], d]);
                uniqueEdgeSet(stack, [d, edge[1]]);
                uniqueEdgeSet(stack, [edge[1], c]);
                uniqueEdgeSet(stack, [c, edge[0]]);
            }
        }
    }

    // [[-10000,-10000],[0,10000],[10000,-10000]]のさくじょ
    verticesData.splice(0,1);
    verticesData.splice(0,1);
    verticesData.splice(0,1);

    // [[-10000,-10000],[0,10000],[10000,-10000]]を消した分のindexの調整
    for (let i = mesh.length - 1; i >= 0; i --) {
        mesh[i][0] -= 3;
        mesh[i][1] -= 3;
        mesh[i][2] -= 3;
        mesh[i] = mesh[i].sort(function(first, second){
            return first - second;
        });
        if (mesh[i][0] < 0 || mesh[i][1] < 0 || mesh[i][2] < 0) {
            mesh.splice(i,1);
        }
    }

    return mesh;
}

export async function createMeshFromTexture(texture, pixelScaling, fineness, scale, outLineWidth, option = "center") {
    const imageSize = [texture.width, texture.height];
    const validImageSize = vec2.reverseScaleR(imageSize, pixelScaling);
    const imageBufferSize = vec2.addR(imageSize, [1,1]);
    // ドロネー三角形分割
    const createMesh = (edge) => {
        // ドロネー三角形分割でつかうローカル関数
        // 線分ABと線分CDが交差するかどうかを判定
        function findSegmentIntersection(line1, line2) {
            const [[x1, y1], [x2, y2]] = line1;
            const [[x3, y3], [x4, y4]] = line2;
        
            // 直線の係数
            const A1 = y2 - y1, B1 = x1 - x2, C1 = A1 * x1 + B1 * y1;
            const A2 = y4 - y3, B2 = x3 - x4, C2 = A2 * x3 + B2 * y3;
        
            // 行列式
            const determinant = A1 * B2 - A2 * B1;
        
            if (determinant === 0) return null; // 平行または重なる場合
        
            // 交点
            const x = (B2 * C1 - B1 * C2) / determinant;
            const y = (A1 * C2 - A2 * C1) / determinant;
        
            // 線分内か確認
            const isOnSegment = (px, py, [sx1, sy1], [sx2, sy2]) =>
                Math.min(sx1, sx2) <= px && px <= Math.max(sx1, sx2) &&
                Math.min(sy1, sy2) <= py && py <= Math.max(sy1, sy2);

            if (
                isOnSegment(x, y, [x1, y1], [x2, y2]) &&
                isOnSegment(x, y, [x3, y3], [x4, y4])
            ) {
                return [ x, y ];
            }

            return null; // 線分上にない場合
        }

        // 点がポリゴン内にあるかを判定する関数
        function isPointInsidePolygon(point, polygon) {
            let vecCross3ings = 0;
            const x = point[0];
            const y = point[1];

            // ポリゴンの頂点を順番に処理
            let lastPos = polygon[polygon.length - 1];
            for (let i = 0; i < polygon.length; i++) {
                const p1 = polygon[i];

                // 点が辺の水平線と交差するかチェック
                if (y > Math.min(p1[1], lastPos[1]) && y <= Math.max(p1[1], lastPos[1])) {
                    // 交差する線分がある場合
                    const xIntersect = (y - p1[1]) * (lastPos[0] - p1[0]) / (lastPos[1] - p1[1]) + p1[0];
                    // const xIntersect = (p1[0] - lastPos[0]) / (p1[1] - lastPos[1]) * (y - lastPos[1]) + lastPos[0];

                    // 点が交差線より左にある場合に交差カウント
                    if (xIntersect > x) {
                        vecCross3ings++;
                    }
                }

                lastPos = p1;
            }

            // 交差回数が奇数なら内部、偶数なら外部
            return vecCross3ings % 2 === 1;
        }

        const outLine = [];
        let outLine2 = [];
        if (true) {
            let lastVec = vec2.subAndnormalizeR(edge[edge.length - 1], edge[0]);
            lastVec = [-lastVec[1], lastVec[0]];
            let lastPos = edge[edge.length - 1];
            for (let i = 0; i < edge.length; i ++) {
                const pos = edge[i];
                let vec = vec2.subAndnormalizeR(lastPos, pos);
                vec = [-vec[1], vec[0]];
                const normal = vec2.normalizeR(vec2.addR(vec, lastVec));
                outLine.push(vec2.addR(pos, vec2.scaleR(normal, scale)));
                outLine2.push(vec2.subR(pos, vec2.scaleR(normal, outLineWidth)));
                lastPos = pos;
                lastVec = vec;
            }
        }

        if (true) {
            function check(i, a,b) {
                let lastPos2 = outLine2[outLine2.length - 1];
                for (let j = 0; j < outLine2.length; j ++) {
                    const pos2 = outLine2[i];
                    if (i != j && i != j - 1 && j != i - 1) {
                        const data = findSegmentIntersection([a, b], [pos2, lastPos2])
                        if (data) {
                            console.log("削除")
                            const spliceData = outLine2.splice(i, j);
                            if (spliceData.length > outLine2.length) {
                                outLine2 = spliceData;
                            }
                            break ;
                        }
                    }
                    lastPos2 = pos2;
                }
            }
            let lastPos = outLine2[outLine2.length - 1];
            for (let i = 0; i < outLine2.length; i ++) {
                const pos = outLine2[i];
                check(i, pos, lastPos);
                lastPos = pos;
            }
        }

        const verticesData = [...outLine2];

        const boundingBox = vec2.createBBox(outLine2);
        let offset = 0;
        for (let y = boundingBox.min[1]; y < boundingBox.max[1]; y += fineness[0]) {
            offset ++;
            for (let x = boundingBox.min[0]; x < boundingBox.max[0]; x += fineness[1]) {
                const pos = [x + offset % 2 * fineness[0] / 2,y];
                if (isPointInsidePolygon(pos, outLine2)) {
                    verticesData.push(pos);
                }
            }
        }

        const mesh = delaunay(verticesData, outLine2);

        const aaaa = (indexs) => {
            const p0 = verticesData[indexs[0]];
            const p1 = verticesData[indexs[1]];
            const p2 = verticesData[indexs[2]];
            const point = vec2.scaleR(vec2.addR(p0, vec2.addR(p1, p2)), 1 / 3);
            if (!isPointInsidePolygon(point, outLine2)) {
                return true;
            }
            return false;
        }

        // 不要な面の削除
        for (let i = mesh.length - 1; i >= 0; i --) {
            const result = aaaa(mesh[i]);
            if (result) {
                mesh.splice(i, 1);
            }
        }

        function extractDuplicate(arr1, arr2) {
            for (const value of arr1) {
                if (arr2.includes(value)) return value;
            }
            return null;
        }

        if (true) {
            function fn1(i, i2) {
                const checkArray = [];
                for (const indexs of mesh) {
                    const b1 = indexs.includes(i);
                    const b2 = indexs.includes(i2);
                    if (b1 && b2) {
                        return null;
                    } else if (b1 || b2) {
                        checkArray.push(indexs);
                    }
                }
                return checkArray;
            }

            function fn2(index1,index2,array) {
                for (let i = 0; i < array.length; i ++) {
                    let value1 = array[i];
                    for (let j = i + 1; j < array.length; j ++) {
                        let value2 = array[j];
                        if ((value1.includes(index1) && value2.includes(index2)) || (value1.includes(index2) && value2.includes(index1))) {
                            const data = extractDuplicate(value1,value2);
                            if (data) {
                                return data;
                            }
                        }
                    }
                }
                return null;
            }

            let lastIndex = outLine2.length - 1;
            for (let i = 0; i < outLine2.length; i ++) {
                const data = fn1(i, lastIndex);
                if (data) { // 重複がない場合処理
                    const index = fn2(i, lastIndex, data);
                    console.log(index)
                    if (index) {
                        mesh.push([i,lastIndex,index]);
                    }
                }
                lastIndex = i;
            }
        }


        if (true) { // アウトライン同士の接続
            const startIndex = verticesData.length;
            verticesData.push(...outLine);
            let lastIndex = edge.length - 1;
            for (let i = 0; i < edge.length; i ++) {
                mesh.push([lastIndex, i, i + startIndex]);
                mesh.push([lastIndex, lastIndex + startIndex, i + startIndex]);
                lastIndex = i;
            }
        }

        const result = [[],[],[]];
        if (option == "center") {
            result[0] = verticesData.map(x => {
                const validPosition = vec2.mulR(vec2.mulR(x, [1 / imageSize[0], 1 / imageSize[1]]), validImageSize);
                return vec2.subR([validPosition[0], validImageSize[1] - validPosition[1]], vec2.scaleR(validImageSize, 0.5));
            });
        } else if (option == "bottomLeft") {
            result[0] = verticesData.map(x => {
                const validPosition = vec2.mulR(vec2.mulR(x, [1 / imageSize[0], 1 / imageSize[1]]), validImageSize);
                return [validPosition[0], validImageSize[1] - validPosition[1]];
            });
        }
        result[1] = verticesData.map(x => {
            const a = vec2.mulR(x, [1 / imageSize[0], 1 / imageSize[1]]);
            return [a[0], a[1]];
        });
        result[2] = mesh;
        return result;
    }

    function simplifyPolygon(points, epsilon, minInterval = 10) {
        function pointToLineDistance(point, lineStart, lineEnd) {
            const [x, y] = point;
            const [x1, y1] = lineStart
            const [x2, y2] = lineEnd;
        
            // 始点と終点が同じ場合は距離を 0 にする
            if (x1 === x2 && y1 === y2) {
                console.warn("Line start and end points are identical:", lineStart, lineEnd);
                return 0;
            }
        
            const num = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
            const den = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
            return num / den;
        }

        function filterByInterval(originalPoints, simplifiedPoints, minInterval) {
            const result = [simplifiedPoints[0]];
        
            for (let i = 1; i < originalPoints.length; i++) {
                const [x1, y1] = result[result.length - 1];
                const [x2, y2] = originalPoints[i];
        
                const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                if (dist >= minInterval) {
                    result.push([x2, y2]);
                }
            }
        
            // 終点を追加
            const lastPoint = simplifiedPoints[simplifiedPoints.length - 1];
            if (!vec2.same(result[result.length - 1],lastPoint)) {
                result.push(lastPoint);
            }
        
            return result;
        }

        // 始点と終点が同じ場合、終点を削除
        if (points[0][0] === points[points.length - 1][0] &&
            points[0][1] === points[points.length - 1][1]) {
            points.pop();
        }
    
        const dmax = points.reduce((max, p, i) => {
            if (i === 0 || i === points.length - 1) return max; // スキップ
    
            // 距離を計算
            const d = pointToLineDistance(p, points[0], points[points.length - 1]);
    
            // 最大距離を更新
            return Math.max(max, d);
        }, 0);
    
        if (dmax > epsilon) {
            // 最大距離の点を特定
            const index = points.findIndex((p, i) => {
                if (i === 0 || i === points.length - 1) return false; // スキップ
                return pointToLineDistance(p, points[0], points[points.length - 1]) === dmax;
            });
    
            // 再帰的に分割
            const firstHalf = simplifyPolygon(points.slice(0, index + 1), epsilon, minInterval);
            const secondHalf = simplifyPolygon(points.slice(index), epsilon, minInterval);
    
            // 結果を結合して返す
            return firstHalf.slice(0, -1).concat(secondHalf);
        } else {
            // 始点と終点をそのまま返す
            const simplified = [points[0], points[points.length - 1]];
    
            // 最小間隔を保つためにフィルタリング
            return filterByInterval(points, simplified, minInterval);
        }
    }
    
    // 並び替え
    function connectLines(lines) {
        const connectedLines = [];
    
        while (lines.length != 0) {
            // まだ処理されていない線分を探す
            const currentChain = [];
            let currentLine = lines[0];
            lines.splice(0, 1);
    
            // 連続する線分をつなげる
            currentChain.push(currentLine[0]);
            currentChain.push(currentLine[1]);

            let lastPosition = currentLine[1];
    
            // 前方向につなげる
            while (true) {
                let isFind = true;
                for (let i = 0; i < lines.length; i ++) {
                    const line = lines[i];
                    if (isPointsEqual(line[0], lastPosition)) {
                        currentChain.push(line[1]);
                        lastPosition = line[1];
                        lines.splice(i, 1);
                        isFind = false;
                        break ;
                    } else if (isPointsEqual(line[1], lastPosition)) {
                        currentChain.push(line[0]);
                        lastPosition = line[0];
                        lines.splice(i, 1);
                        isFind = false;
                        break ;
                    }
                }
                if (isFind) break; // 次が見つからなければ終了
            }

            // 後方向につなげる
            lastPosition = currentChain[0];
            while (true) {
                let isFind = true;
                for (let i = 0; i < lines.length; i ++) {
                    const line = lines[i];
                    if (isPointsEqual(line[0], lastPosition)) {
                        currentChain.unshift(line[1]);
                        lastPosition = line[1];
                        lines.splice(i, 1);
                        isFind = false;
                        break ;
                    } else if (isPointsEqual(line[1], lastPosition)) {
                        currentChain.unshift(line[0]);
                        lastPosition = line[0];
                        lines.splice(i, 1);
                        isFind = false;
                        break ;
                    }
                }
                if (isFind) break; // 次が見つからなければ終了
            }

            connectedLines.push(currentChain);
        }

        return connectedLines;
    }

    function isPointsEqual(p1, p2) {
        if (p1[0] != p2[0]) {
            return false;
        }
        if (p1[1] != p2[1]) {
            return false;
        }
        return true;
    }

    const resultbuffer = GPU.createStorageBuffer(imageBufferSize[0] * imageBufferSize[1] * 4, undefined, ["u32"]);

    const group = GPU.createGroup(c_srw_t, [{item: resultbuffer, type: "b"}, {item: texture.createView(), type: "t"}]);
    const computeCommandEncoder = device.createCommandEncoder();
    const computePassEncoder = computeCommandEncoder.beginComputePass();
    computePassEncoder.setBindGroup(0, group);
    computePassEncoder.setPipeline(MarchingSquaresPipeline);
    computePassEncoder.dispatchWorkgroups(Math.ceil(imageBufferSize[0] / 16), Math.ceil(imageBufferSize[1] / 16), 1); // ワークグループ数をディスパッチ
    computePassEncoder.end();
    device.queue.submit([computeCommandEncoder.finish()]);

    const result = await GPU.getU32BufferData(resultbuffer, resultbuffer.size);

    let collectedLines = [];

    const threadIsComplete = [];

    const threadProcessingNum = 50000;
    for (let i = 0; i < result.length; i += threadProcessingNum) {
        threadIsComplete.push(false);
        worker.postMessage({result: result.slice(i, i + threadProcessingNum), imageBufferSize: imageBufferSize, threadedIndex: i / threadProcessingNum, startIndex: i, endIndex: i + threadProcessingNum});
    }

    worker.onmessage = function(event) {
        const e = event.data;
        collectedLines = collectedLines.concat(e.collectedLines); // 65ミリ秒
        threadIsComplete[e.threadedIndex] = true;
    };

    async function checkThreadIsComplete() {
        return new Promise((resolve) => {
            function loop() {
                if (threadIsComplete.some(x => x === false)) {
                    requestAnimationFrame(loop); // 再帰的に呼び出す
                } else {
                    resolve(); // すべての要素がtrueになったらPromiseを解決
                }
            }
            loop(); // 初回呼び出し
        });
    }

    await checkThreadIsComplete();

    collectedLines = connectLines(collectedLines); // 辺のデータを修正

    collectedLines = collectedLines.map(x => {
        return simplifyPolygon(x, 1.5, vec2.max(imageBufferSize) / 10);
    });

    const resultData = [[],[],[]];
    let verticesNumOffset = 0;
    for (const data of collectedLines) {
        if (data.length < 3) break;
        const delaunayResult = createMesh(data);
        resultData[0].push(...delaunayResult[0]);
        resultData[1].push(...delaunayResult[1]);
        resultData[2].push(...delaunayResult[2].map(x => {
            return [x[0] + verticesNumOffset, x[1] + verticesNumOffset, x[2] + verticesNumOffset];
        }));
        verticesNumOffset += delaunayResult[0].length;
    }
    return resultData;
}