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

const pointData = array<vec4<f32>, 4>(
    vec4<f32>(-1.0, -1.0, 0.0, 1.0), // 左下
    vec4<f32>(-1.0,  1.0, 0.0, 0.0), // 左上
    vec4<f32>( 1.0, -1.0, 1.0, 1.0), // 右下
    vec4<f32>( 1.0,  1.0, 1.0, 0.0), // 右上
);

// バーテックスシェーダー
@vertex
fn main(
    @builtin(instance_index) instanceIndex: u32, // インスタンスのインデックス
    @builtin(vertex_index) vertexIndex: u32
    ) -> VertexOutput {
    // 頂点データを取得
    let mySection = instanceIndex / modifierFineness.x;

    var position1 = vec2<f32>(0.0);
    var position2 = vec2<f32>(0.0);
    // instanceIndexが横幅の２以上ある時はyの描画をする
    if (mySection >= 2u) {
        let index = instanceIndex - modifierFineness.x * 2u;
        let height = index % (modifierFineness.y) * modifierFineness.x;

        let w = select(modifierFineness.x, 0, index < modifierFineness.y);

        let k = height / modifierFineness.x;
        position1 = verticesPosition[height + k + w];
        position2 = verticesPosition[height + modifierFineness.x + k + 1 + w];
    } else {
        let height = modifierFineness.y * modifierFineness.x;
        let k = height / modifierFineness.x;
        let myIndex = instanceIndex % modifierFineness.x + select(height + k, 0, mySection < 1u);

        position1 = verticesPosition[myIndex];
        position2 = verticesPosition[myIndex + 1u];
    }

    let sub = position2 - position1;
    let normal = normalize(vec2<f32>(-sub.y, sub.x)); // 仮の法線
    var offset = vec2<f32>(0.0);
    if (vertexIndex % 4u == 0u) {
        offset = position1 - (normal * size) / camera.zoom;
    } else if (vertexIndex % 4u == 1u) {
        offset = position1 + (normal * size) / camera.zoom;
    } else if (vertexIndex % 4u == 2u) {
        offset = position2 - (normal * size) / camera.zoom;
    } else {
        offset = position2 + (normal * size) / camera.zoom;
    }

    var output: VertexOutput;
    output.position = vec4f((offset - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    return output;
}