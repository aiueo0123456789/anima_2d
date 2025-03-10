import { GPU,device } from "./webGPU.js";
import { c_srw,c_srw_sr,adaptAllAnimationToVerticesPipeline,modifierTransformPipeline,rotateModifierTransformPipeline,lineModifierTransformPipeline, v_sr_sr_sr, c_sr, baseTransformPipeline, setModifierWeightToGraphicMeshPipeline, v_u_f_ts, sampler, renderPipeline, setLineModifierWeightToGraphicMeshPipeline, updateCenterPositionPipeline, c_u, calculateBoneModifierLocalMatrixPipeline, calculateBoneModifierMatrixPropagatePipeline, calculateBoneModifierWeightToVerticesPipeline, adaptBoneModifierToVerticesPipeline, calculateBoneVerticesPipeline, v_sr_sr } from "./GPUObject.js";
import { calculateAllBBox } from "./BBox.js";
import { vec2 } from "./ベクトル計算.js";
import { managerForDOMs, updateDataForUI } from "./グリッド/制御.js";

export function updateObject(object) {
    if (!object.isInit) return ;
    if (object.type == "回転モディファイア") {
        object.rotateData = [...object.baseData];
        for (const animation of object.animationBlock.animationBlock) {
            if (animation.beforeWeight != animation.weight) {
                object.isChange = true;
                animation.beforeWeight = animation.weight;
            }
            vec2.add(object.rotateData, object.rotateData, vec2.scaleR(animation.transformData, animation.weight));
            object.rotateData[2] += animation.transformData[2] * animation.weight;
            object.rotateData[3] += animation.transformData[3] * animation.weight;
        }
        if (object.isChange) {
            object.BBoxArray = [object.rotateData[0],object.rotateData[1],object.rotateData[0],object.rotateData[1]];
            GPU.writeBuffer(object.rotateDataBuffer, new Float32Array(object.rotateData));
        }
    } else if (object.type == "ボーンモディファイア") {
        if (object.parent.isChange) object.isChange = true;
        object.animationBlock.animationBlock.forEach(animation => {
            if (animation.beforeWeight != animation.weight) {
                object.isChange = true;
                GPU.writeBuffer(animation.u_animationWeightBuffer, new Float32Array([animation.weight]));
                animation.beforeWeight = animation.weight;
            }
        });

        if (object.isChange) {
            // コマンドエンコーダを作成
            const computeCommandEncoder = device.createCommandEncoder();

            // レンダリング頂点の初期位置をベース頂点にセット
            computeCommandEncoder.copyBufferToBuffer(
                object.baseBoneBuffer,  // コピー元
                0,        // コピー元のオフセット
                object.boneBuffer,  // コピー先
                0,        // コピー先のオフセット
                object.baseBoneBuffer.size  // コピーするバイト数
            );

            const computePassEncoder = computeCommandEncoder.beginComputePass();
            // アニメーションの適応
            computePassEncoder.setBindGroup(0, object.adaptAnimationGroup1);
            computePassEncoder.setPipeline(adaptAllAnimationToVerticesPipeline);
            object.animationBlock.animationBlock.forEach(animation => {
                computePassEncoder.setBindGroup(1, animation.adaptAnimationGroup2);
                computePassEncoder.dispatchWorkgroups(Math.ceil(object.boneNum * 2 / 64), 1, 1); // ワークグループ数をディスパッチ
            });

            // ローカル行列の作成
            computePassEncoder.setPipeline(calculateBoneModifierLocalMatrixPipeline);
            computePassEncoder.setBindGroup(0, object.calculateLocalMatrixGroup);
            computePassEncoder.dispatchWorkgroups(Math.ceil(object.boneNum / 64), 1, 1); // ワークグループ数をディスパッチ
            // ワールド行列に変換
            computePassEncoder.setPipeline(calculateBoneModifierMatrixPropagatePipeline);
            for (const relationshipBuffer of object.propagateBuffers) {
                const group2 = GPU.createGroup(c_srw_sr, [{item: object.boneMatrixBuffer, type: "b"}, {item: relationshipBuffer.buffer, type: "b"}]);
                computePassEncoder.setBindGroup(0, group2);
                computePassEncoder.dispatchWorkgroups(Math.ceil(relationshipBuffer.boneNum / 64), 1, 1); // ワークグループ数をディスパッ
            }
            computePassEncoder.setPipeline(calculateBoneVerticesPipeline);
            computePassEncoder.setBindGroup(0, object.calculateBoneVerticesGroup);
            computePassEncoder.dispatchWorkgroups(Math.ceil(object.boneNum / 64), 1, 1); // ワークグループ数をディスパッ

            computePassEncoder.end();
            device.queue.submit([computeCommandEncoder.finish()]);

            // バウンディングボックス
            calculateAllBBox(object.calculateAllBBoxGroup, object.verticesNum);
            GPU.copyBufferToArray(object.BBoxBuffer,object.BBoxArray);
        }
    } else {
        if (object.parent.isChange) object.isChange = true;
        object.animationBlock.animationBlock.forEach(animation => {
            if (animation.beforeWeight != animation.weight) {
                object.isChange = true;
                GPU.writeBuffer(animation.u_animationWeightBuffer, new Float32Array([animation.weight]));
                animation.beforeWeight = animation.weight;
            }
        });

        if (object.isChange) {
            // コマンドエンコーダを作成
            const computeCommandEncoder = device.createCommandEncoder();

            // レンダリング頂点の初期位置をベース頂点にセット
            computeCommandEncoder.copyBufferToBuffer(
                object.s_baseVerticesPositionBuffer,  // コピー元
                0,        // コピー元のオフセット
                object.RVrt_coBuffer,  // コピー先
                0,        // コピー先のオフセット
                object.s_baseVerticesPositionBuffer.size  // コピーするバイト数
            );

            const computePassEncoder = computeCommandEncoder.beginComputePass();
            // アニメーションの適応
            computePassEncoder.setBindGroup(0, object.adaptAnimationGroup1);
            computePassEncoder.setPipeline(adaptAllAnimationToVerticesPipeline);
            object.animationBlock.animationBlock.forEach(animation => {
                computePassEncoder.setBindGroup(1, animation.adaptAnimationGroup2);
                computePassEncoder.dispatchWorkgroups(Math.ceil(object.verticesNum / 64), 1, 1); // ワークグループ数をディスパッチ
            });
            // モディファイアの適応
            if (object.parent != "") {
                computePassEncoder.setBindGroup(1, object.parent.modifierTransformDataGroup);
                if (object.parent.type == "モディファイア") {
                    computePassEncoder.setBindGroup(0, object.modifierTransformGroup);
                    computePassEncoder.setPipeline(modifierTransformPipeline);
                } else if (object.parent.type == "回転モディファイア") {
                    // computePassEncoder.setBindGroup(0, object.adaptAnimationGroup1);
                    computePassEncoder.setPipeline(rotateModifierTransformPipeline);
                } else if (object.parent.type == "ベジェモディファイア") {
                    computePassEncoder.setBindGroup(0, object.modifierTransformGroup);
                    computePassEncoder.setPipeline(lineModifierTransformPipeline);
                } else if (object.parent.type == "ボーンモディファイア") {
                    computePassEncoder.setBindGroup(0, object.modifierTransformGroup);
                    computePassEncoder.setPipeline(adaptBoneModifierToVerticesPipeline);
                }
                computePassEncoder.dispatchWorkgroups(Math.ceil(object.verticesNum / 64), 1, 1); // ワークグループ数をディスパッチ
            }

            computePassEncoder.end();
            device.queue.submit([computeCommandEncoder.finish()]);

            // バウンディングボックス
            calculateAllBBox(object.calculateAllBBoxGroup, object.verticesNum);
            GPU.copyBufferToArray(object.BBoxBuffer,object.BBoxArray);
        }
    }
}

export function updateObjectFromAnimation(object, animation) { // 特定のアニメーションだけを適応する
    if (!object.isInit) return ;
    if (object.type == "回転モディファイア") {
        object.rotateData = [...object.baseData];
        if (animation.beforeWeight != animation.weight) {
            object.isChange = true;
            animation.beforeWeight = animation.weight;
        }
        vec2.add(object.rotateData, object.rotateData, vec2.scaleR(animation.transformData, animation.weight));
        object.rotateData[2] += animation.transformData[2] * animation.weight;
        object.rotateData[3] += animation.transformData[3] * animation.weight;
        if (object.isChange) {
            object.BBoxArray = [object.rotateData[0],object.rotateData[1],object.rotateData[0],object.rotateData[1]];
            GPU.writeBuffer(object.rotateDataBuffer, new Float32Array(object.rotateData));
        }
    } else if (object.type == "ボーンモディファイア") {
        GPU.writeBuffer(animation.u_animationWeightBuffer, new Float32Array([1]));
        animation.beforeWeight = 1;

        if (object.isChange) {
            // コマンドエンコーダを作成
            const computeCommandEncoder = device.createCommandEncoder();

            // レンダリング頂点の初期位置をベース頂点にセット
            computeCommandEncoder.copyBufferToBuffer(
                object.baseBoneBuffer,  // コピー元
                0,        // コピー元のオフセット
                object.boneBuffer,  // コピー先
                0,        // コピー先のオフセット
                object.baseBoneBuffer.size  // コピーするバイト数
            );

            const computePassEncoder = computeCommandEncoder.beginComputePass();
            // アニメーションの適応
            computePassEncoder.setBindGroup(0, object.adaptAnimationGroup1);
            computePassEncoder.setPipeline(adaptAllAnimationToVerticesPipeline);
            computePassEncoder.setBindGroup(1, animation.adaptAnimationGroup2);
            computePassEncoder.dispatchWorkgroups(Math.ceil(object.boneNum * 2 / 64), 1, 1); // ワークグループ数をディスパッ

            // ローカル行列の作成
            computePassEncoder.setPipeline(calculateBoneModifierLocalMatrixPipeline);
            computePassEncoder.setBindGroup(0, object.calculateLocalMatrixGroup);
            computePassEncoder.dispatchWorkgroups(Math.ceil(object.boneNum / 64), 1, 1); // ワークグループ数をディスパッ
            // ワールド行列に変換
            computePassEncoder.setPipeline(calculateBoneModifierMatrixPropagatePipeline);
            for (const relationshipBuffer of object.propagateBuffers) {
                const group2 = GPU.createGroup(c_srw_sr, [{item: object.boneMatrixBuffer, type: "b"}, {item: relationshipBuffer.buffer, type: "b"}]);
                computePassEncoder.setBindGroup(0, group2);
                computePassEncoder.dispatchWorkgroups(Math.ceil(relationshipBuffer.boneNum / 64), 1, 1); // ワークグループ数をディスパッ
            }
            computePassEncoder.setPipeline(calculateBoneVerticesPipeline);
            computePassEncoder.setBindGroup(0, object.calculateBoneVerticesGroup);
            computePassEncoder.dispatchWorkgroups(Math.ceil(object.boneNum / 64), 1, 1); // ワークグループ数をディスパッ

            computePassEncoder.end();
            device.queue.submit([computeCommandEncoder.finish()]);

            // バウンディングボックス
            calculateAllBBox(object.calculateAllBBoxGroup, object.verticesNum);
            GPU.copyBufferToArray(object.BBoxBuffer,object.BBoxArray);
        }
    } else {
        GPU.writeBuffer(animation.u_animationWeightBuffer, new Float32Array([1]));
        animation.beforeWeight = 1;

        if (object.isChange) {
            // コマンドエンコーダを作成
            const computeCommandEncoder = device.createCommandEncoder();

            // レンダリング頂点の初期位置をベース頂点にセット
            computeCommandEncoder.copyBufferToBuffer(
                object.s_baseVerticesPositionBuffer,  // コピー元
                0,        // コピー元のオフセット
                object.RVrt_coBuffer,  // コピー先
                0,        // コピー先のオフセット
                object.s_baseVerticesPositionBuffer.size  // コピーするバイト数
            );

            const computePassEncoder = computeCommandEncoder.beginComputePass();
            // アニメーションの適応
            computePassEncoder.setBindGroup(0, object.adaptAnimationGroup1);
            computePassEncoder.setPipeline(adaptAllAnimationToVerticesPipeline);

            computePassEncoder.setBindGroup(1, animation.adaptAnimationGroup2);
            computePassEncoder.dispatchWorkgroups(Math.ceil(object.verticesNum / 64), 1, 1); // ワークグループ数をディスパッ

            computePassEncoder.end();
            device.queue.submit([computeCommandEncoder.finish()]);

            // バウンディングボックス
            calculateAllBBox(object.calculateAllBBoxGroup, object.verticesNum);
            GPU.copyBufferToArray(object.BBoxBuffer,object.BBoxArray);
        }
    }
}

export function setParentModifierWeight(object) {
    if (object.parent != "") {
        object.isChange = true;
        if (object.parent.type == "モディファイア") {
            object.parentWeightBuffer = GPU.createStorageBuffer(object.verticesNum * (4 + 4) * 4, undefined, ["f32"]);
            const setParentModifierWeightGroup = GPU.createGroup(c_srw_sr, [{item: object.parentWeightBuffer, type: 'b'}, {item: object.s_baseVerticesPositionBuffer, type: 'b'}]);
            GPU.runComputeShader(setModifierWeightToGraphicMeshPipeline, [setParentModifierWeightGroup, object.parent.modifierDataGroup], Math.ceil(object.verticesNum / 64));
        } else if (object.parent.type == "ベジェモディファイア") {
            object.parentWeightBuffer = GPU.createStorageBuffer(object.verticesNum * (1 + 1) * 4, undefined, ["f32"]);
            const setParentModifierWeightGroup = GPU.createGroup(c_srw_sr, [{item: object.parentWeightBuffer, type: 'b'}, {item: object.s_baseVerticesPositionBuffer, type: 'b'}]);
            GPU.runComputeShader(setLineModifierWeightToGraphicMeshPipeline, [setParentModifierWeightGroup, object.parent.modifierDataGroup], Math.ceil(object.verticesNum / 64));
        } else if (object.parent.type == "ボーンモディファイア") {
            object.parentWeightBuffer = GPU.createStorageBuffer(object.verticesNum * (4 + 4) * 4, undefined, ["f32"]);
            const setParentModifierWeightGroup = GPU.createGroup(c_srw_sr, [{item: object.parentWeightBuffer, type: 'b'}, {item: object.s_baseVerticesPositionBuffer, type: 'b'}]);
            GPU.runComputeShader(calculateBoneModifierWeightToVerticesPipeline, [setParentModifierWeightGroup, object.parent.modifierDataGroup], Math.ceil(object.verticesNum / 64));
        }
        object.renderWegihtGroup = GPU.createGroup(v_sr_sr, [{item: object.RVrt_coBuffer, type: 'b'}, {item: object.parentWeightBuffer, type: 'b'}]);
        object.modifierTransformGroup = GPU.createGroup(c_srw_sr, [{item: object.RVrt_coBuffer, type: 'b'}, {item: object.parentWeightBuffer, type: 'b'}]);
    }
}

export function setBaseBBox(object) {
    calculateAllBBox(object.calculateAllBaseBBoxGroup, object.verticesNum);
    GPU.copyBufferToArray(object.baseBBoxBuffer,object.baseBBoxArray);
}

export function baseTransform(object, transformDataGroup) {
    if (object.baseTransformIsLock) return ;
    object.isChange = true;
    if (object.type == "回転モディファイア") {
        object.updateBaseData(transformDataGroup);
        setParentModifierWeight(object);
    } else {
        const baseTransformGroup1 = GPU.createGroup(c_srw, [{item: object.s_baseVerticesPositionBuffer, type: 'b'}]);
        GPU.runComputeShader(baseTransformPipeline, [baseTransformGroup1, transformDataGroup], Math.ceil(object.verticesNum / 64));

        if (object.type == "ボーンモディファイア") {
            object.calculateBaseBoneData();
        }
        setBaseBBox(object);
        setParentModifierWeight(object);
    }
}

const centerPositionBuffer = GPU.createUniformBuffer(2 * 4, undefined, ["f32"]);
const updateCenterPositionGroup2 = GPU.createGroup(c_u, [{item: centerPositionBuffer, type: 'b'}]);
export function updateCenterPosition(object, centerPosition) {
    if (object.type == "回転モディファイア") {
        object.updateBaseData([...centerPosition,1,0]);
    } else {
        GPU.writeBuffer(centerPositionBuffer, new Float32Array(centerPosition));
        const baseTransformGroup1 = GPU.createGroup(c_srw_sr, [{item: object.s_baseVerticesPositionBuffer, type: 'b'}, {item: object.baseBBoxBuffer, type: 'b'}]);
        GPU.runComputeShader(updateCenterPositionPipeline, [baseTransformGroup1, updateCenterPositionGroup2], Math.ceil(object.verticesNum / 64));
        setBaseBBox(object);
        setParentModifierWeight(object);
    }
    object.isChange = true;
}

export function searchAnimation(object, animationName) {
    for (const animation of object.animationBlock.animationBlock) {
        if (animation.name == animationName) return animation;
    }
    return null;
}

export function appendAnimationToObject(object, name) {
    updateDataForUI["アニメーション"] = true;
    object.animationBlock.appendAnimation(name);
    managerForDOMs.update(object.animationBlock);
}

export function deleteAnimationToObject(object, animation) {
    updateDataForUI["アニメーション"] = true;
    object.animationBlock.deleteAnimation(animation);
    // managerForDOMs.update(object.animationBlock);
}

export function sharedDestroy(object) {
    managerForDOMs.deleteObject(object);
    object.animationBlock.destroy();
}