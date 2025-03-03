struct Bone {
    position: vec2<f32>,
    scale: vec2<f32>,
    angle: f32,
    length: f32,
}

@group(0) @binding(0) var<storage, read_write> localBonewMatrix: array<mat3x3<f32>>; // 出力
@group(0) @binding(1) var<storage, read> localBoneDatas: array<Bone>;

// 2次元の回転、スケール、平行移動を表現する行列を作成する関数
fn createTransformMatrix(scale: vec2<f32>, angle: f32, translation: vec2<f32>) -> mat3x3<f32> {
    let cosTheta = cos(angle);
    let sinTheta = sin(angle);

    // スケールと回転を組み合わせた行列
    var matrix: mat3x3<f32>;
    matrix[0] = vec3<f32>(scale.x * cosTheta, -scale.y * sinTheta, 0.0);
    matrix[1] = vec3<f32>(scale.x * sinTheta, scale.y * cosTheta, 0.0);
    matrix[2] = vec3<f32>(translation.x, translation.y, 1.0);

    return matrix;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let boneIndex = global_id.x;
    if (boneIndex >= arrayLength(&localBoneDatas)) {
        return;
    }

    let localBoneData = localBoneDatas[boneIndex];
    localBonewMatrix[boneIndex] = createTransformMatrix(localBoneData.scale, localBoneData.angle, localBoneData.position);
}