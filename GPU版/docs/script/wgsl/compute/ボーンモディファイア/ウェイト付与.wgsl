struct Output {
    index: vec4<u32>,
    weight: vec4<f32>,
}

struct BoneVertices {
    h: vec2<f32>,
    t: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<Output>; // 出力
@group(0) @binding(1) var<storage, read> baseVertices: array<vec2<f32>>; // グラフィックメッシュの頂点位置
@group(1) @binding(0) var<storage, read> baseBone: array<BoneVertices>; // ベースボーンの行列
@group(1) @binding(1) var<uniform> effectMaxDist: f32; // ベースボーンのデータ

fn pointToLineDistance(point: vec2<f32>, lineStart: vec2<f32>, lineEnd: vec2<f32>) -> f32 {
    // 線分が点の場合
    if (all(lineStart == lineEnd)) {
        return distance(point, lineStart);
    }

    let lineDir = lineEnd - lineStart;
    let pointDir = point - lineStart;
    let t = dot(pointDir, lineDir) / dot(lineDir, lineDir);

    // 点が線分の外側にある場合
    if (t < 0.0) {
        return distance(point, lineStart);
    } else if (t > 1.0) {
        return distance(point, lineEnd);
    }

    // 点が線分の内側にある場合
    let projection = lineStart + t * lineDir;
    return distance(point, projection);
}

fn mathWeight(dist: f32) -> f32 {
    return pow(effectMaxDist, 2.0) - pow(dist, 2.0);
}

fn calculateWeight(position: vec2<f32>) -> Output {
    var output: Output;
    let inf = 99999999u;
    let maxValue = pow(effectMaxDist, 2.0);
    output.index = vec4<u32>(inf);
    output.weight = vec4<f32>(0.0);
    var maxWeight = -9999999.0;
    var maxWeightIndex = 0u;
    var hasFound = false;
    for (var boneIndex = 0u; boneIndex < arrayLength(&baseBone); boneIndex ++) {
        let bone = baseBone[boneIndex];
        let lineStart = bone.h;
        let lineEnd = bone.t;
        let dist = pointToLineDistance(position, lineStart, lineEnd);
        let weight = mathWeight(dist);
        if (maxWeight < weight) {
            maxWeight = weight;
            maxWeightIndex = boneIndex;
        }
        if (weight > 0.0) {
            var minIndex = 0u;
            var value = maxValue + 1.0;
            for (var i = 0u; i < 4u; i ++) {
                if (output.weight[i] < value) {
                    minIndex = i;
                    value = output.weight[i];
                }
            }
            if (weight > value) {
                output.index[minIndex] = boneIndex;
                output.weight[minIndex] = weight;
                hasFound = true;
            }
        }
    }
    if (hasFound) {
        // 見つからなかったものは無効にする
        var sumWeight = 0.0;
        for (var i = 0u; i < 4u; i ++) {
            if (inf == output.index[i]) {
                output.index[i] = 0u;
            } else {
                sumWeight += output.weight[i];
            }
        }
        output.weight /= sumWeight; // 正規化
    } else {
        output.index = vec4<u32>(maxWeightIndex, 0, 0, 0);
        output.weight = vec4<f32>(1.0, 0.0, 0.0, 0.0);
    }
    return output;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let verticesIndex = global_id.x;
    if (arrayLength(&baseVertices) <= verticesIndex) {
        return;
    }

    outputData[verticesIndex] = calculateWeight(baseVertices[verticesIndex]);
}