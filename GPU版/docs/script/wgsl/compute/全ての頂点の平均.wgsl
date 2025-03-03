@group(0) @binding(0) var<storage, read_write> output: vec2<f32>;
@group(0) @binding(1) var<storage, read> vertices: array<vec2<f32>>;
@group(1) @binding(0) var<storage, read_write> aaa: array<atomic<i32>, 2>;

// スカラー型で共有メモリを定義
var<workgroup> sumX: atomic<i32>;
var<workgroup> sumY: atomic<i32>;

const SCALE_FACTOR: f32 = 1e5;
const threadProcessNum = 20u;

// ユーティリティ関数
fn f32_to_i32(value: f32) -> i32 {
    return i32(value * SCALE_FACTOR);
}

fn i32_to_f32(value: i32) -> f32 {
    return f32(value) / SCALE_FACTOR;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>, @builtin(local_invocation_id) local_id: vec3<u32>) {
    let index = global_id.x * threadProcessNum;

    // 初期化フェーズ
    if (index == 0u) {
        atomicStore(&aaa[0], 0);
        atomicStore(&aaa[1], 0);
    }

    if (local_id.x == 0u) {
        atomicStore(&sumX, 0);
        atomicStore(&sumY, 0);
    }

    // 頂点配列の長さを取得
    let vertexCount = arrayLength(&vertices);

    workgroupBarrier();

    // アトミック操作
    if (index < vertexCount) {
        var sum = vec2<f32>(0.0);
        for (var i = 0u; i < threadProcessNum; i ++) {
            // 範囲外スレッドの値を安全に無効化
            if (index + i < vertexCount) {
                let position = vertices[index + i];
                sum += position;
            }
        }
        atomicAdd(&sumX, f32_to_i32(sum.x));
        atomicAdd(&sumY, f32_to_i32(sum.y));
    }

    workgroupBarrier();

    // 全てのスレッドで統合
    if (local_id.x == 0u) {
        atomicAdd(&aaa[0], atomicLoad(&sumX));
        atomicAdd(&aaa[1], atomicLoad(&sumY));
    }

    workgroupBarrier();

    // 結果を一つのスレッドが書き込み
    if (index == 0u) {
        // 安全にストレージバッファに書き込み
        output = vec2<f32>(i32_to_f32(atomicLoad(&aaa[0])), i32_to_f32(atomicLoad(&aaa[1]))) / f32(vertexCount);
    }
}