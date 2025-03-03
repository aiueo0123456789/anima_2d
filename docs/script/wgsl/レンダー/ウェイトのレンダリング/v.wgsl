struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

struct AnimationData {
    index: vec4<u32>,
    weight: vec4<f32>,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(1) @binding(0) var<storage, read> verticesPosition: array<vec2<f32>>;
@group(1) @binding(1) var<storage, read> verticesIndexAndWeight: array<AnimationData>;
@group(2) @binding(0) var<storage, read> targetIndex: u32;

struct VertexOutput {
    @builtin(position) position: vec4<f32>, // クリッピング座標系での頂点位置
    @location(0) color: vec4<f32>,
}

// バーテックスシェーダー
@vertex
fn main(
    // @builtin(vertex_index) vertexIndex: u32
    @location(0) index: u32,
    ) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f((verticesPosition[index] - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    let data = verticesIndexAndWeight[index];
    let indexs = data.index;
    let weights = data.weight;
    var weight = 0.0;
    for (var i = 0u; i < 4u; i ++) {
        if (indexs[i] == targetIndex) {
            weight = weights[i];
            break ;
        }
    }
    output.color = vec4<f32>(weight, weight, weight, 1.0);
    return output;
}