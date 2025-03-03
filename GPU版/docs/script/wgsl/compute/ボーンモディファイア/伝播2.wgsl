struct Bone {
    position: vec2<f32>,
    scale: f32,
    angle: f32,
}

struct ParentAndDepth {
    parent: u32,
    depth: u32,
}

@group(0) @binding(0) var<storage, read_write> boneMatrix: array<mat3x3<f32>>; // 出力
@group(1) @binding(0) var<storage, read> relationships: array<ParentAndDepth>; // 親のindexと自分の深度
@group(1) @binding(1) var<uniform> maxDepth: u32; // 深度の最大値

fn extractRotation(matrix: mat3x3<f32>) -> mat3x3<f32> { // スケールの取り出し
    // 回転行列を抽出（スケールを無視）
    var rotation: mat3x3<f32>;
    rotation[0] = normalize(matrix[0]);
    rotation[1] = normalize(matrix[1]);
    rotation[2] = vec3<f32>(0.0, 0.0, 1.0); // 平行移動成分はそのまま
    return rotation;
}

fn extractTranslation(matrix: mat3x3<f32>) -> mat3x3<f32> { // 並行移動の取り出し
    // 平行移動成分を抽出
    var m: mat3x3<f32>;
    m[0] = vec3<f32>(1.0,0.0,0.0);
    m[1] = vec3<f32>(0.0,1.0,0.0);
    m[2] = matrix[2]; // 平行移動成分はそのまま
    return m;
}

fn extractScale(matrix: mat3x3<f32>) -> mat3x3<f32> {
    // スケール成分を抽出
    let sx = length(matrix[0]);
    let sy = length(matrix[1]);
    var m: mat3x3<f32>;
    m[0] = vec3<f32>(sx,0.0,0.0);
    m[1] = vec3<f32>(0.0,sy,0.0);
    m[2] = vec3<f32>(0.0,0.0,1.0); // 平行移動成分はそのまま
    return m;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let boneIndex = global_id.x;
    for (var depth = 1u; depth < maxDepth; depth ++) {
        if (arrayLength(&boneMatrix) > boneIndex) {
            let relationship = relationships[boneIndex];
            if (relationship.depth == depth) {
                boneMatrix[boneIndex] = boneMatrix[relationship.parent] * boneMatrix[boneIndex];
            }
        }
        workgroupBarrier();
    }
}