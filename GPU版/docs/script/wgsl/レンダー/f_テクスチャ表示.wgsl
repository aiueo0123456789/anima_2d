@group(0) @binding(2) var mySampler: sampler;
@group(2) @binding(1) var myTexture: texture_2d<f32>;
@group(3) @binding(0) var<uniform> color: vec4<f32>;

struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
    @location(0) uv: vec2<f32>,
) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = select(color, vec4<f32>(0.0), textureSample(myTexture, mySampler, uv).a < 0.5);
    return output;
}