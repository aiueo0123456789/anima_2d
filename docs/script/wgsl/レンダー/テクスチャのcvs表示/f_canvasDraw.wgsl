@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;

@fragment
fn main(
    @location(0) texCoord: vec2<f32>
) -> @location(0) vec4<f32> {
    // 4つの隣接ピクセルを取得
    let color = textureSample(inputTexture, mySampler, texCoord); // 色
    // let color = vec4<f32>(0.0,0.0,0.0,1.0); // 色
    return color;
}