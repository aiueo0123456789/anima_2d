@group(1) @binding(0) var inputTexture: texture_storage_2d<rgba8unorm, read>;

@fragment
fn main(
    @location(0) texCoord: vec2<f32>
) -> @location(0) vec4<f32> {
    // テクスチャの整数座標と小数座標を計算
    // let texSize = textureDimensions(inputTexture);
    // let uv = texCoord * vec2<f32>(texSize); // テクスチャ空間の座標
    let base = vec2<u32>(texCoord); // 整数部分
    let frac = fract(texCoord);    // 小数部分

    // 4つの隣接ピクセルを取得
    let c00 = textureLoad(inputTexture, base);               // 左下
    let c10 = textureLoad(inputTexture, base + vec2<u32>(1, 0)); // 右下
    let c01 = textureLoad(inputTexture, base + vec2<u32>(0, 1)); // 左上
    let c11 = textureLoad(inputTexture, base + vec2<u32>(1, 1)); // 右上

    // バイリニア補間を実行
    let mixX0 = mix(c00, c10, frac.x); // 水平方向の補間 (下)
    let mixX1 = mix(c01, c11, frac.x); // 水平方向の補間 (上)
    let color = mix(mixX0, mixX1, frac.y); // 垂直方向の補間

    return color;
}
