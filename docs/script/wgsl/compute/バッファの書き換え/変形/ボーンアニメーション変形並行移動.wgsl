struct Bone {
    position: vec2<f32>,
    scale: vec2<f32>,
    angle: f32,
    length: f32,
}

@group(0) @binding(0) var<storage, read_write> boneAnimation: array<Bone>;
@group(0) @binding(1) var<storage, read> originalBoneAnimation: array<Bone>;
@group(0) @binding(2) var<storage, read> boneMatrix: array<mat3x3>;
@group(0) @binding(3) var<storage, read> parents: array<u32>;
@group(0) @binding(4) var<storage, read> verticesIndexs: array<u32>;
@group(0) @binding(5) var<uniform> value: vec2<f32>;

fn inverseMat3x3(matrix: mat3x3<f32>) -> mat3x3<f32> {
    var inv: mat3x3<f32>;

    let a = matrix[0][0];
    let b = matrix[0][1];
    let c = matrix[0][2];
    let d = matrix[1][0];
    let e = matrix[1][1];
    let f = matrix[1][2];
    let g = matrix[2][0];
    let h = matrix[2][1];
    let i = matrix[2][2];

    let det = a * (e * i - f * h) -
              b * (d * i - f * g) +
              c * (d * h - e * g);

    if (det == 0.0) {
        // 行列が逆行列を持たない場合
        return mat3x3<f32>(0.0, 0.0, 0.0,
                           0.0, 0.0, 0.0,
                           0.0, 0.0, 0.0);
    }

    let invDet = 1.0 / det;

    inv[0][0] = (e * i - f * h) * invDet;
    inv[0][1] = (c * h - b * i) * invDet;
    inv[0][2] = (b * f - c * e) * invDet;
    inv[1][0] = (f * g - d * i) * invDet;
    inv[1][1] = (a * i - c * g) * invDet;
    inv[1][2] = (c * d - a * f) * invDet;
    inv[2][0] = 0.0;
    inv[2][1] = 0.0;
    inv[2][2] = 1.0;

    return inv;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (arrayLength(&verticesIndexs) <= index) {
        return;
    }
    let boneIndex = verticesIndexs[index];
    if () {
        
    }
    let parentMatrix = inverseMat3x3(boneMatrix[parents[boneIndex]]);
    boneAnimation[boneIndex].position = value * parentMatrix + originalBoneAnimation[boneIndex].position;
}