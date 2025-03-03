@group(0) @binding(2) var mySampler: sampler;
@group(1) @binding(2) var myTexture: texture_2d<f32>;
@group(1) @binding(3) var maskTexture: texture_2d<f32>;
@group(1) @binding(4) var<uniform> maskType: f32;

struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
    @location(0) uv: vec2<f32>,
    @location(1) uvForMask: vec2<f32>,
) -> FragmentOutput {
    var output: FragmentOutput;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        discard ;
    }
    let value = textureSample(maskTexture, mySampler, uvForMask).r;
    let maskValue = select(1.0 - value, value, maskType == 0.0);
    // output.color = textureSample(myTexture, mySampler, uv).bgra * maskValue;
    output.color = textureSample(myTexture, mySampler, uv) * maskValue;
    // output.color = vec4<f32>(maskValue, 0.0, 0.0, 1.0);
    return output;
}