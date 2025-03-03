struct Output {
    position: vec2<f32>,
}

struct AnimationData {
    index: u32,
    t: f32,
}

struct BezierData {
    vertices: vec2<f32>,
    control1: vec2<f32>,
    control2: vec2<f32>,
}

@group(0) @binding(0) var<storage, read_write> outputData: array<Output>; // 出力
@group(0) @binding(1) var<storage, read> animationDatas: array<AnimationData>; // シェイプキーのデータ
@group(1) @binding(0) var<storage, read> baseBezierData: array<BezierData>; // シェイプキーのデータ
@group(1) @binding(1) var<storage, read> bezierData: array<BezierData>; // シェイプキーのデータ

fn mathBezier(p1: vec2<f32>, c1: vec2<f32>, c2: vec2<f32>, p2: vec2<f32>, t: f32) -> vec2<f32> {
    let u = 1.0 - t;
    return p1 * pow(u, 3.0) + c1 * 3.0 * pow(u, 2.0) * t + c2 * 3.0 * u * pow(t, 2.0) + p2 * pow(t, 3.0);
}

fn getBezierNormal(p1: vec2<f32>, c1: vec2<f32>, c2: vec2<f32>, p2: vec2<f32>, t: f32) -> vec2<f32> {
    let u = 1.0 - t;
    return normalize(3.0 * pow(u, 2.0) * (c1 - p1) + 6.0 * u * t * (c2 - c1) + 3.0 * pow(t, 2.0) * (p2 - c2));
}

fn calculateRotation(n1: vec2<f32>, n2: vec2<f32>) -> f32 {
    // 内積を使ってcosθを計算
    let dotProduct = dot(n1, n2);
    // 外積を使ってsinθを計算
    let crossProduct = n1.x * n2.y - n1.y * n2.x;

    // atan2を使用して角度を求める（ラジアン）
    let angle = atan2(crossProduct, dotProduct);

    return angle; // 回転量（ラジアン）
}

fn rotate2D(point: vec2<f32>, angle: f32) -> vec2<f32> {
    let cosTheta = cos(angle);
    let sinTheta = sin(angle);

    let xPrime = point.x * cosTheta - point.y * sinTheta;
    let yPrime = point.x * sinTheta + point.y * cosTheta;

    return vec2<f32>(xPrime, yPrime);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pointIndex = global_id.x;
    if (arrayLength(&outputData) <= pointIndex) {
        return;
    }

    let index = animationDatas[pointIndex].index;
    let t = animationDatas[pointIndex].t;
    let a1 = baseBezierData[index - 1];
    let a2 = baseBezierData[index];

    let b1 = bezierData[index - 1];
    let b2 = bezierData[index];

    let position1 = mathBezier(a1.vertices, a1.control2, a2.control1, a2.vertices, t);
    let position2 = mathBezier(b1.vertices, b1.control2, b2.control1, b2.vertices, t);

    let normal1 = getBezierNormal(a1.vertices, a1.control2, a2.control1, a2.vertices, t);
    let normal2 = getBezierNormal(b1.vertices, b1.control2, b2.control1, b2.vertices, t);

    let rotatePosition = rotate2D(outputData[pointIndex].position + (position2 - position1) - position2, calculateRotation(normal1, normal2));

    outputData[pointIndex].position = rotatePosition + position2;
}