@group(0) @binding(2) var mySampler: sampler;
@group(1) @binding(2) var myTexture: texture_2d<f32>;

struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
    @location(0) uv: vec2<f32>,
) -> FragmentOutput {
    var output: FragmentOutput;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        discard ;
    }

    let alpha = textureSample(myTexture, mySampler, uv).a;
    output.color = vec4<f32>(1.0,0.0,0.0,alpha);
    return output;
}