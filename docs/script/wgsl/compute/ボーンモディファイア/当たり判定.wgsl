struct BoneVertices {
    h: vec2<f32>,
    t: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> hitTestResult: array<f32>; // 出力
@group(0) @binding(1) var<uniform> point: vec2<f32>; // 距離を計算する座標
@group(1) @binding(0) var<storage, read> verticesPosition: array<BoneVertices>;

fn cross2D(a: vec2<f32>, b: vec2<f32>) -> f32 {
    return a.x * b.y - a.y * b.x;
}

fn hittestPointTriangle(a: vec2<f32>, b: vec2<f32>, c: vec2<f32>, p: vec2<f32>) -> bool {
    let ab = b - a;
    let bp = p - b;

    let bc = c - b;
    let cp = p - c;

    let ca = a - c;
    let ap = p - a;

    let c1 = cross2D(ab, bp);
    let c2 = cross2D(bc, cp);
    let c3 = cross2D(ca, ap);
    return (c1 > 0.0 && c2 > 0.0 && c3 > 0.0) || (c1 < 0.0 && c2 < 0.0 && c3 < 0.0);
}

const size = 0.1;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let boneIndex = global_id.x;
    if (arrayLength(&verticesPosition) <= boneIndex) {
        return;
    }

    // 頂点データを取得
    let position1 = verticesPosition[boneIndex].h;
    let position2 = verticesPosition[boneIndex].t;
    let sub = position2 - position1;
    let normal = normalize(vec2<f32>(-sub.y, sub.x)); // 仮の法線
    var offset = vec2<f32>(0.0);

    let v0 = position1 - (normal * size * length(sub));
    let v1 = position1 + (normal * size * length(sub));
    let v2 = position2;

    if (hittestPointTriangle(v0,v1,v2,point)) {
        hitTestResult[boneIndex] = 100.0;
    } else {
        hitTestResult[boneIndex] = 0.0;
    }
}