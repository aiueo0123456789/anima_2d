struct Meshu {
    i1: u32,
    i2: u32,
    i3: u32,
    padding: u32,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<f32>; // 出力
@group(0) @binding(1) var<uniform> point: vec2<f32>; // 距離を計算する座標
@group(1) @binding(0) var<storage, read> vertices: array<vec2<f32>>; // 頂点
@group(1) @binding(1) var<storage, read> mesh: array<Meshu>; // メッシュを構成する頂点インデックス

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

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let meshIndex = global_id.x;
    if (arrayLength(&mesh) <= meshIndex) {
        return;
    }

    let indexs = mesh[meshIndex];
    if (hittestPointTriangle(vertices[indexs.i1],vertices[indexs.i2],vertices[indexs.i3],point)) {
        outputData[meshIndex] = 100.0;
    } else {
        outputData[meshIndex] = 0.0;
    }
}