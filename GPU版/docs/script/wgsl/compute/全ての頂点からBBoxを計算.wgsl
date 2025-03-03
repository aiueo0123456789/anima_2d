@group(0) @binding(0) var<storage, read_write> minMaxBuffer: array<vec2<f32>, 2>;
@group(0) @binding(1) var<storage, read> vertices: array<vec2<f32>>;
@group(1) @binding(0) var<storage, read_write> aaa: array<atomic<i32>, 4>;

// スカラー型で共有メモリを定義
var<workgroup> sharedMinX: atomic<i32>;
var<workgroup> sharedMinY: atomic<i32>;
var<workgroup> sharedMaxX: atomic<i32>;
var<workgroup> sharedMaxY: atomic<i32>;

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
        atomicStore(&aaa[0], i32(1e10 * SCALE_FACTOR));
        atomicStore(&aaa[1], i32(1e10 * SCALE_FACTOR));
        atomicStore(&aaa[2], i32(-1e10 * SCALE_FACTOR));
        atomicStore(&aaa[3], i32(-1e10 * SCALE_FACTOR));
    }

    if (local_id.x == 0u) {
        atomicStore(&sharedMinX, i32(1e10 * SCALE_FACTOR));
        atomicStore(&sharedMinY, i32(1e10 * SCALE_FACTOR));
        atomicStore(&sharedMaxX, i32(-1e10 * SCALE_FACTOR));
        atomicStore(&sharedMaxY, i32(-1e10 * SCALE_FACTOR));
    }

    // 頂点配列の長さを取得
    let vertexCount = arrayLength(&vertices);

    workgroupBarrier();

    // アトミック操作
    if (index < vertexCount) {
        // 範囲外スレッドの値を安全に無効化
        var minValue = vec2<f32>(99999999.0);
        var maxValue = vec2<f32>(-99999999.0);
        for (var i = 0u; i < threadProcessNum; i ++) {
            if (index + i < vertexCount) {
                let position = vertices[index + i];
                minValue = min(minValue, position);
                maxValue = max(maxValue, position);
            }
        }
        // スケーリングして整数に変換
        let localMinX = f32_to_i32(minValue.x);
        let localMinY = f32_to_i32(minValue.y);
        let localMaxX = f32_to_i32(maxValue.x);
        let localMaxY = f32_to_i32(maxValue.y);
        // 範囲外スレッドの値を安全に無効化
        atomicMin(&sharedMinX, localMinX);
        atomicMin(&sharedMinY, localMinY);
        atomicMax(&sharedMaxX, localMaxX);
        atomicMax(&sharedMaxY, localMaxY);
    }

    workgroupBarrier();

    // ストレージバッファへの書き込みを安全に実行
    if (local_id.x == 0u) {
        let finalMinX = atomicLoad(&sharedMinX);
        let finalMinY = atomicLoad(&sharedMinY);
        let finalMaxX = atomicLoad(&sharedMaxX);
        let finalMaxY = atomicLoad(&sharedMaxY);

        atomicMin(&aaa[0], finalMinX);
        atomicMin(&aaa[1], finalMinY);
        atomicMax(&aaa[2], finalMaxX);
        atomicMax(&aaa[3], finalMaxY);
    }

    workgroupBarrier();

    if (index == 0u) {
        // 安全にストレージバッファに書き込み
        minMaxBuffer[0] = vec2<f32>(i32_to_f32(atomicLoad(&aaa[0])), i32_to_f32(atomicLoad(&aaa[1])));
        minMaxBuffer[1] = vec2<f32>(i32_to_f32(atomicLoad(&aaa[2])), i32_to_f32(atomicLoad(&aaa[3])));
    }
}