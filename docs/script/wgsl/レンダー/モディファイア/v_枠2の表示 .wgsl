struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(1) @binding(0) var<storage, read> verticesPosition: array<vec2<f32>>;
@group(1) @binding(1) var<uniform> modifierFineness: vec2<u32>; // モディファイアの分割数
@group(2) @binding(0) var<uniform> size: f32;

struct VertexOutput {
    @builtin(position) position: vec4<f32>, // クリッピング座標系での頂点位置
}

// バーテックスシェーダー
@vertex
fn main(
    @builtin(instance_index) instanceIndex: u32, // インスタンスのインデックス
    @builtin(vertex_index) vertexIndex: u32
    ) -> VertexOutput {
    // 4つかどのindexを求める
    let sectionX = instanceIndex % 2u;
    let sectionY = instanceIndex / 2u;
    let index = i32((sectionX * (modifierFineness.x)) + ((sectionY * modifierFineness.y) * modifierFineness.x));

    let xk = -(i32(sectionX) * 2 - 1);
    let yk = -(i32(sectionY) * 2 - 1);
    let height = select(0,i32(modifierFineness.y),sectionY == 1u);
    let top = index + height;
    let bottom = index + (i32(modifierFineness.x) * yk) + height + yk;
    // let indexs = vec4<i32>(top, top + xk, bottom, bottom + xk);
    let indexs = vec3<i32>(top, top + xk, bottom);

    var offset = vec2<f32>(0.0);
    if (vertexIndex % 3u == 0u) {
        offset = verticesPosition[indexs.x];
    } else if (vertexIndex % 3u == 1u) {
        offset = mix(verticesPosition[indexs.x], verticesPosition[indexs.y], 0.2);
    } else {
        offset = mix(verticesPosition[indexs.x], verticesPosition[indexs.z], 0.2);
    }

    var output: VertexOutput;
    output.position = vec4f((offset - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    return output;
}