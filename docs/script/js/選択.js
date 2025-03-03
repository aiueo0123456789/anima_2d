import { GPU } from "./webGPU.js";
import { c_srw_u,circleSelectVerticesPipeline,boxSelectVerticesPipeline, collisionMeshPipeline, collisionBonePipeline } from "./GPUObject.js";
import { vec2 } from "./ベクトル計算.js";

export class Select {
    constructor(convertCoordinate) {
        this.convertCoordinate = convertCoordinate;
    }

    async selectBone(object, point) {
        const resultBuffer = GPU.createStorageBuffer(object.verticesNum * (1) * 4, undefined, ["f32"]);
        const pointBuffer = GPU.createUniformBuffer(2 * 4, point, ["f32","f32"]);
        const collisionVerticesGroup = GPU.createGroup(c_srw_u, [{item: resultBuffer, type: "b"},{item: pointBuffer, type: "b"}]);

        GPU.runComputeShader(circleSelectVerticesPipeline, [collisionVerticesGroup, object.collisionVerticesGroup], Math.ceil(object.verticesNum / 64));

        const distances = await GPU.getF32BufferData(resultBuffer, resultBuffer.size);
        let minIndex = 0;
        let minDist = Infinity;
        for (let i = 0; i < distances.length; i ++) {
            const dist = distances[i];
            if (dist < minDist) {
                minIndex = i;
                minDist = dist;
            }
        }

        return Math.floor(minIndex / 2);
    }

    async circleSelectVertices(object, point, radius) {
        radius = this.convertCoordinate.GPUSizeFromCPU(radius);
        const resultBuffer = GPU.createStorageBuffer(object.verticesNum * (1) * 4, undefined, ["f32"]);
        const pointBuffer = GPU.createUniformBuffer(2 * 4, point, ["f32","f32"]);
        const collisionGroup = GPU.createGroup(c_srw_u, [{item: resultBuffer, type: "b"},{item: pointBuffer, type: "b"}]);

        GPU.runComputeShader(circleSelectVerticesPipeline, [collisionGroup, object.collisionVerticesGroup], Math.ceil(object.verticesNum / 64));

        const collisionResult = await GPU.getF32BufferData(resultBuffer, resultBuffer.size);

        const result = [];
        for (let i = 0; i < collisionResult.length; i ++) {
            const dist = collisionResult[i];
            if (dist < radius) {
                result.push(i);
            }
        }

        return result;
    }

    async selectSilhouette(object, point, errorRange = 50) {
        if (object.BBoxArray[0] < point[0] + errorRange && object.BBoxArray[1] < point[1] + errorRange &&
            object.BBoxArray[2] > point[0] - errorRange && object.BBoxArray[3] > point[1] - errorRange
        ) {
            if (object.type == "グラフィックメッシュ") {
                const resultBuffer = GPU.createStorageBuffer(object.meshesNum * (1) * 4, undefined, ["f32"]);
                const pointBuffer = GPU.createUniformBuffer(2 * 4, point, ["f32","f32"]);
                const collisionGroup = GPU.createGroup(c_srw_u, [resultBuffer, pointBuffer]);

                GPU.runComputeShader(collisionMeshPipeline, [collisionGroup, object.collisionMeshGroup], Math.ceil(object.meshesNum / 64));

                const collisionResult = await GPU.getF32BufferData(resultBuffer, resultBuffer.size);

                for (let i = 0; i < collisionResult.length; i ++) {
                    const dist = collisionResult[i];
                    if (dist > 50) {
                        return true;
                    }
                }
            } else if (object.type == "ボーンモディファイア") {
                const resultBuffer = GPU.createStorageBuffer(object.boneNum * (1) * 4, undefined, ["f32"]);
                const pointBuffer = GPU.createUniformBuffer(2 * 4, point, ["f32","f32"]);
                const collisionGroup = GPU.createGroup(c_srw_u, [resultBuffer, pointBuffer]);

                GPU.runComputeShader(collisionBonePipeline, [collisionGroup, object.collisionBoneGroup], Math.ceil(object.boneNum / 64));

                const collisionResult = await GPU.getF32BufferData(resultBuffer, resultBuffer.size);

                for (let i = 0; i < collisionResult.length; i ++) {
                    const dist = collisionResult[i];
                    if (dist > 50) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    async selectMesh(object, point) {
        const resultBuffer = GPU.createStorageBuffer(object.meshesNum * (1) * 4, undefined, ["f32"]);
        const pointBuffer = GPU.createUniformBuffer(2 * 4, point, ["f32","f32"]);
        const collisionGroup = GPU.createGroup(c_srw_u, [resultBuffer, pointBuffer]);

        GPU.runComputeShader(collisionMeshPipeline, [collisionGroup, object.collisionMeshGroup], Math.ceil(object.meshesNum / 64));

        const collisionResult = await GPU.getF32BufferData(resultBuffer, resultBuffer.size);

        const result = [];
        for (let i = 0; i < collisionResult.length; i ++) {
            const dist = collisionResult[i];
            if (dist > 50) {
                result.push(i);
            }
        }

        return result;
    }

    async pointToVerticesDistance(object, point) {
        const resultBuffer = GPU.createStorageBuffer(object.verticesNum * (1) * 4, undefined, ["f32"]);
        const pointBuffer = GPU.createUniformBuffer(2 * 4, point, ["f32","f32"]);
        const collisionVerticesGroup = GPU.createGroup(c_srw_u, [{item: resultBuffer, type: "b"},{item: pointBuffer, type: "b"}]);

        GPU.runComputeShader(circleSelectVerticesPipeline, [collisionVerticesGroup, object.collisionVerticesGroup], Math.ceil(object.verticesNum / 64));

        const distances = await GPU.getF32BufferData(resultBuffer, resultBuffer.size);

        return distances;
    }

    async boxSelectVertices(object, boundingBox) {
        const resultBuffer = GPU.createStorageBuffer(object.verticesNum * (1) * 4, undefined, ["f32"]);
        const pointBuffer = GPU.createUniformBuffer(4 * 4, boundingBox.max.concat(boundingBox.min), ["f32","f32"]);
        const collisionBoxGroup = GPU.createGroup(c_srw_u, [{item: resultBuffer, type: "b"},{item: pointBuffer, type: "b"}]);

        GPU.runComputeShader(boxSelectVerticesPipeline, [collisionBoxGroup, object.collisionVerticesGroup], Math.ceil(object.verticesNum / 64));

        const collisionResult = await GPU.getF32BufferData(resultBuffer, resultBuffer.size);

        const result = [];
        for (let i = 0; i < collisionResult.length; i ++) {
            const dist = collisionResult[i];
            if (dist > 50) {
                result.push(i);
            }
        }

        return result;
    }

    async BBoxSelect(object, point, radius) {
        radius = this.convertCoordinate.GPUSizeFromCPU(radius);
        if (!object.BBoxBuffer) return ;
        const data = await GPU.getF32BufferData(object.BBoxBuffer);
        if (!data) return false;
        const min = [data[0], data[1]];
        const max = [data[2], data[3]];

        const collisionBBox = () => {
            return vec2.distanceR(max, point) < radius ||
                   vec2.distanceR(min, point) < radius ||
                   vec2.distanceR([max[0], min[1]], point) < radius ||
                   vec2.distanceR([min[0], max[1]], point) < radius;
        }

        return collisionBBox();
    }
}