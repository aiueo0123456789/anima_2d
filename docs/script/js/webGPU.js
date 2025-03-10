export function IsString(value) {
    return typeof value === "string" || value instanceof String;
}

class WebGPU {
    constructor() {
        this.structures = new Map();
    }

    codeToStructures() {

    }

    setBaseStruct(code) {
        const allReplace = (strings, targetStrings, newStrings = "") => {
            let checkString = "";
            let result = "";
            for (const string of strings) {
                if (checkString.length >= targetStrings.length) {
                    if (checkString == targetStrings) {
                        result += newStrings;
                    } else {
                        result += checkString[0];
                    }
                    checkString = checkString.slice(1) + string;
                } else {
                    checkString += string;
                }
            }
            if (checkString != targetStrings) {
                result += checkString[0];
            }
            return result;
        }
        function extractBetween(text, start, end) {
            const regex = new RegExp(`${start}(.*?)${end}`, "g");
            return [...text.matchAll(regex)].map(match => match[1]);
        }
        const getStructNameFromString = (strings) => {
            return extractBetween(strings, "struct ", "{")[0];
        }
        let structures = code.split("struct "); // 型宣言で分割
        structures.splice(0,1); // 先頭の空文字を削除
        structures.forEach(text => {
            const startIndex = text.indexOf("{");
            const endIndex = text.indexOf("}");
            if (startIndex > endIndex) {
                console.warn("}が{の前にあります",text);
                return "";
            }
            text = allReplace(text,"\n");
            text = allReplace(text," ");
            text = "struct " + text;
            this.structures.set(getStructNameFromString(text), text);
        })
        console.log(this.structures);
    }

    // バッファの書き換え
    writeBuffer(target, data, offset = 0) {
        device.queue.writeBuffer(target, offset ,data);
    }

    // シェーダモデルの作成
    createShaderModule(code) {
        return device.createShaderModule({ code });
    }

    // ビットデータの作成
    createBitData(array, struct) {
        const bufferLength = array.length / struct.filter(x => x != "padding").length;
        const buffer = new ArrayBuffer(bufferLength * struct.length * 4);
        const view = new DataView(buffer);

        let offset = 0;
        let index = 0;
        for (let i = 0; i < bufferLength;i ++) {
            for (const bitType of struct) {
                if (bitType == "u8") {
                    view.setUint8(offset, array[index], true);
                    index ++;
                    offset ++;
                } else if (bitType == "u32") {
                    view.setUint32(offset, array[index], true);
                    index ++;
                    offset += 4;
                } else if (bitType == "f32") {
                    view.setFloat32(offset, array[index], true);
                    index ++;
                    offset += 4;
                } else if (bitType == "padding") {
                    view.setFloat32(offset, 1, true);
                    offset += 4;
                }
            }
        }

        return new Uint8Array(buffer);
    }

    // ユニフォームバッファの作成
    createUniformBuffer(size, data = undefined, struct = ["f32"]) {
        if (data) {
            const buffer = device.createBuffer({
                size: size,
                usage: GPUBufferUsage.UNIFORM,
                mappedAtCreation: true,
            });
            new Uint8Array(buffer.getMappedRange()).set(this.createBitData(data, struct));
            buffer.unmap();
            return buffer;
        } else {
            return device.createBuffer({
                size: size,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            });
        }
    }

    // ストレージバッファの作成
    createStorageBuffer(size, data = undefined, struct = ["f32"]) {
        if (data) {
            const buffer = device.createBuffer({
                size: size,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Uint8Array(buffer.getMappedRange()).set(this.createBitData(data, struct));
            buffer.unmap();
            return buffer;
        } else {
            return device.createBuffer({
                size: size,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            });
        }
    }

    // バーテックスバッファの作成
    createVertexBuffer(size, data = undefined, struct = ["f32"]) {
        if (data) {
            const buffer = device.createBuffer({
                size: size,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_SRC,
                mappedAtCreation: true,
            });
            new Uint8Array(buffer.getMappedRange()).set(this.createBitData(data, struct));
            buffer.unmap();
            return buffer;
        } else {
            return device.createBuffer({
                size: size,
                usage: GPUBufferUsage.VERTEX,
            });
        }
    }

    createTextureSampler() {
        return device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        });
    }

    createDepthTexture2D(size) {
        return device.createTexture({
            size: size,
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    createTexture2D(size, textureFormat = format) {
        return device.createTexture({
            size: size,
            format: textureFormat,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    createStorageTexture2D(size) {
        return device.createTexture({
            size: size,
            format: 'rgba8unorm',
            usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
        });
    }

    async imageToTexture2D(imagePath) {
        const image = new Image();
        const imagePromise = new Promise((resolve, reject) => {
            image.onload = () => resolve(image);
            image.onerror = (e) => reject(e);
        });
        image.src = imagePath;
        const img = await imagePromise;

        if (!(img instanceof HTMLImageElement)) {
            throw new TypeError('Loaded image is not an instance of HTMLImageElement.');
        }

        const resultTexture = this.createTexture2D([img.width,img.height,1],"rgba8unorm");

        device.queue.copyExternalImageToTexture(
            { source: img},
            { texture: resultTexture, origin: [0, 0, 0] },
            [img.width,img.height,1]
        );

        return resultTexture;
    }

    async imagesToSkyBoxTextures(imagePaths) {
        const promises = [
            "left+X.png",
            "right-X.png",
            "up+Y.png",
            "down-Y.png",
            "front+Z.png",
            "back-Z.png",
        ].map(async (src) => {
            const response = await fetch(imagePaths + src);
            return createImageBitmap(await response.blob());
        });
        const imageBitmaps = await Promise.all(promises);

        const cubemapTexture = device.createTexture({
            dimension: '2d',
            size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
            format: format,
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        for (let i = 0; i < imageBitmaps.length; i++) {
            const imageBitmap = imageBitmaps[i];
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap },
                { texture: cubemapTexture, origin: [0, 0, i] },
                [imageBitmap.width, imageBitmap.height, 1]
            );
        }

        return cubemapTexture;
    }

    // グループレイアウトの作成
    createGroupLayout(items) {
        function entrieFromType(type) {
            if (type == 'u') {
                return {
                    buffer: {
                        type: 'uniform', // 'read-only-storage'で読みだけ可能なストレージバッファにする
                    },
                };
            }
            if (type == 'srw') {
                return {
                    buffer: {
                        type: 'storage', // 'storage' を使って、ストレージバッファを指定
                        readOnly: false, // 読み書き可能に設定
                    },
                };
            }
            if (type == 'sr') {
                return {
                    buffer: {
                        type: 'read-only-storage', // 'read-only-storage'で読みだけ可能なストレージバッファにする
                    },
                };
            }
            if (type == 't') {
                return {
                    texture: {
                        sampleType: 'float'
                    },
                };
            }
            if (type == 'ct') {
                return {
                    texture: {
                        viewDimension: "cube",
                    },
                };
            }
            if (type == 'ts') {
                return {
                    sampler: {
                        type: 'filtering',
                    },
                };
            }
            if (type == "str") {
                return {
                    storageTexture: {
                        access: 'read-only',
                        format: 'rgba8unorm',
                        viewDimension: '2d',
                    },
                }
            }
            if (type == "stw") {
                return {
                    storageTexture: {
                        access: 'write-only',
                        format: 'rgba8unorm',
                        viewDimension: '2d',
                    },
                }
            }

            console.warn(`グループレイアウトのリソースの振り分けに問題がありました。\n無効なtype[${type}]`);
        }

        function stageFromType(useShaderTypes) {
            // GPUShaderStage のマッピング
            const shaderStageMap = {
                v: GPUShaderStage.VERTEX,    // vertex
                f: GPUShaderStage.FRAGMENT, // fragment
                c: GPUShaderStage.COMPUTE,  // compute
            };

            // 初期値は 0
            let visibility = 0;

            // 指定された配列をループしてビットマスクを生成
            for (const type of useShaderTypes) {
                if (shaderStageMap[type]) {
                    visibility |= shaderStageMap[type];
                } else {
                    console.warn(`グループレイアウトのシェーダーに可視性を示す値に問題がありました。\n無効なtype[${type}]`);
                }
            }

            return visibility;
        }

        return device.createBindGroupLayout({
            entries: items.map((x,i) => {
                return Object.assign({
                        binding: i, // インプットオブジェクトデータ
                        visibility: stageFromType(x.useShaderTypes)
                    },
                    entrieFromType(x.type)
                )
            })
        });
    }

    // グループの作成
    createGroup(groupLayout, items) {
        function entrieFromType(type, item) {
            if (!type) {
                if (item instanceof GPUBuffer) {
                    type = "b";
                } else if (item instanceof GPUTexture) {
                    type = "t";
                } else {
                    console.warn("無効",item);
                }
            }
            if (type == 'b') {
                return {
                    resource: {
                        buffer: item,
                    }
                };
            }
            if (type == 't') {
                return {
                    resource: item,
                };
            }
            if (type == 'ts') {
                return {
                    resource: item,
                };
            }
            if (type == 'ct') {
                return {
                    resource: item,
                };
            }
            console.warn(`グループのリソースの振り分けに問題がありました。\n無効なtype[${type}]関連付けられたitem[${item}]`);
        }

        return device.createBindGroup({
            layout: groupLayout,
            entries: items.map((x,i) => {
                let entrie;
                if (Array.isArray(x)) {
                    entrie = entrieFromType(x[1], x[0]);
                } else if (x.type) {
                    entrie = entrieFromType(x.type, x.item);
                } else {
                    entrie = entrieFromType(null, x);
                }
                return Object.assign({
                        binding: i, // インプットオブジェクトデータ
                    },
                    entrie
                )
            })
        });
    }

    // コンピューターパイプラインの作成
    createComputePipeline(groupLayouts, c) {
        if (IsString(c)) {
            c = this.createShaderModule(c);
        }
        return device.createComputePipeline({
            layout: device.createPipelineLayout({
                bindGroupLayouts: groupLayouts,
            }),
            compute: {
                module: c,
                entryPoint: 'main',
            },
        });
    }

    appendDataToBuffer(buffer, data) {
        const newBuffer = GPU.createStorageBuffer(buffer.size + (data.length * 4), undefined, ["f32"]);
        GPU.copyBuffer(buffer, newBuffer);
        GPU.writeBuffer(newBuffer, data, buffer.size);
        return newBuffer;
    }

    deleteIndexsToBuffer(buffer, indexs, structOffset) {
        const dataNum = buffer.size / structOffset;
        indexs.sort((a,b) => a - b);
        const startAndEndIndexs = [];
        let lastIndex = 0;
        for (const subIndex of indexs) {
            if (subIndex - lastIndex >= 1) {
                startAndEndIndexs.push([lastIndex,subIndex - 1]);
            }
            lastIndex = subIndex + 1;
        }
        if (lastIndex < dataNum) {
            startAndEndIndexs.push([lastIndex,dataNum - 1]);
        }
        GPU.consoleBufferData(buffer, ["f32"], "old");
        const newBuffer = GPU.createStorageBuffer((buffer.size - indexs.length * structOffset), undefined, ["f32"]);
        let offset = 0;
        console.log(startAndEndIndexs,dataNum)
        for (const rOffset of startAndEndIndexs) {
            console.log(rOffset[0] * structOffset, offset, (rOffset[1] - rOffset[0]) * structOffset)
            GPU.copyBuffer(buffer, newBuffer, rOffset[0] * structOffset, offset, (rOffset[1] - rOffset[0] + 1) * structOffset);
            offset += (rOffset[1] - rOffset[0] + 1) * structOffset;
        }
        GPU.consoleBufferData(newBuffer, ["f32"], "new");
        return newBuffer;
    }

    // レンダーパイプラインの作成
    createRenderPipeline(groupLayouts, v, f, vertexBufferStruct, option = "", topologyType = "t") {
        if (IsString(v)) {
            v = this.createShaderModule(v);
        }
        if (IsString(f)) {
            f = this.createShaderModule(f);
        }
        let shaderLocationOffset = 0;
        const createBuffers = (struct) => {
            const structSize = struct.map(x => {
                if (x == "u") {
                    return 4;
                }
                if (x == "f") {
                    return 4;
                }
                if (x == "f_2") {
                    return 8;
                }
                if (x == "f_3") {
                    return 12;
                }
            });
            let offset = 0;
            return {
                arrayStride: structSize.reduce((sum, x) => {
                    return sum + x;
                },0),
                attributes: struct.map((x, i) => {
                    shaderLocationOffset ++;
                    let format = "float32";
                    if (x == "u") {
                        format = "uint32";
                    }
                    if (x == "f") {
                        format = "float32";
                    }
                    if (x == "f_2") {
                        format = "float32x2";
                    }
                    if (x == "f_3") {
                        format = "float32x3";
                    }
                    offset += structSize[i];
                    return {
                        shaderLocation: shaderLocationOffset - 1,
                        format: format,
                        offset: offset - structSize[i],
                    };
                })
            };
        }
        const vertexBuffers = vertexBufferStruct.map((x) => {
            return createBuffers(x);
        });
        if (option == "2d") {
            return device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: groupLayouts,
                }),
                vertex: {
                    module: v,
                    entryPoint: 'main',
                    buffers: vertexBuffers,
                },
                fragment: {
                    module: f,
                    entryPoint: 'main',
                    targets: [
                        {
                            // format: 'bgra8unorm',
                            // format: fragmentOutputFormat,
                            format: format,
                            blend: {
                                color: {
                                    srcFactor: 'src-alpha', // ソースのアルファ値
                                    dstFactor: 'one-minus-src-alpha', // 1 - ソースのアルファ値
                                    operation: 'add', // 加算
                                },
                                alpha: {
                                    srcFactor: 'src-alpha',
                                    dstFactor: 'one-minus-src-alpha',
                                    operation: 'add',
                                }
                            }
                        }
                    ],
                },
                primitive: {
                    // topology: 'triangle-list',
                    topology: topologyType == "t" ? 'triangle-list' : 'triangle-strip',
                },
            });
        } else if (option == "mask") {
            return device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: groupLayouts,
                }),
                vertex: {
                    module: v,
                    entryPoint: 'main',
                    buffers: vertexBuffers,
                },
                fragment: {
                    module: f,
                    entryPoint: 'main',
                    targets: [
                        {
                            format: 'r8unorm', // 出力フォーマットをr8unormに設定
                            blend: {
                                color: {
                                    srcFactor: 'src-alpha', // ソースの透明度
                                    dstFactor: 'one-minus-src-alpha', // 背景の透明度
                                    operation: 'add',
                                },
                                alpha: {
                                    srcFactor: 'one',
                                    dstFactor: 'one-minus-src-alpha',
                                    operation: 'add',
                                },
                            },
                            writeMask: GPUColorWrite.RED, // 赤チャネルのみ書き込み
                        },
                    ],
                },
                primitive: {
                    // topology: 'triangle-list',
                    topology: topologyType == "t" ? 'triangle-list' : 'triangle-strip',
                },
            });
        }else if (option == "cvsCopy") {
            return device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: groupLayouts,
                }),
                vertex: {
                    module: v,
                    entryPoint: 'main',
                    buffers: [],
                },
                fragment: {
                    module: f,
                    entryPoint: 'main',
                    targets: [
                        {
                            format: format,
                            blend: {
                                color: {
                                    srcFactor: 'src-alpha', // ソースのアルファ値
                                    dstFactor: 'one-minus-src-alpha', // 1 - ソースのアルファ値
                                    operation: 'add', // 加算
                                },
                                alpha: {
                                    srcFactor: 'src-alpha',
                                    dstFactor: 'one-minus-src-alpha',
                                    operation: 'add',
                                }
                            }
                        },
                    ],
                },
                primitive: {
                    topology: 'triangle-strip',
                },
            });
        }
    }

    // バッファをバッファにコピー
    copyBuffer(resource, copyTarget, resourceOffset = 0, targetOffset = 0, copySize = resource.size) {
        const copyCommandEncoder = device.createCommandEncoder();

        copyCommandEncoder.copyBufferToBuffer(
            resource,  // コピー元
            resourceOffset,        // コピー元のオフセット
            copyTarget,  // コピー先
            targetOffset,        // コピー先のオフセット
            copySize  // コピーするバイト数
        );

        const copyCommandBuffer = copyCommandEncoder.finish();
        device.queue.submit([copyCommandBuffer]);
    }

    copyBufferToNewBuffer(resource) {
        const newBuffer = this.createStorageBuffer(resource.size, undefined, ["f32"]);
        const copyCommandEncoder = device.createCommandEncoder();

        copyCommandEncoder.copyBufferToBuffer(
            resource,  // コピー元
            0,        // コピー元のオフセット
            newBuffer,  // コピー先
            0,        // コピー先のオフセット
            resource.size  // コピーするバイト数
        );

        const copyCommandBuffer = copyCommandEncoder.finish();
        device.queue.submit([copyCommandBuffer]);

        return newBuffer;
    }

    // コンピューターシェーダーの実行
    runComputeShader(pipeline, groups, workNumX = 1, workNumY = 1,workNumZ = 1) {
        if (workNumX < 1 || workNumY < 1 || workNumZ < 1) return ;
        const computeCommandEncoder = device.createCommandEncoder();
        const computePassEncoder = computeCommandEncoder.beginComputePass();
        computePassEncoder.setPipeline(pipeline);
        for (let i = 0; i < groups.length; i ++) {
            computePassEncoder.setBindGroup(i, groups[i]);
        }
        computePassEncoder.dispatchWorkgroups(workNumX,workNumY,workNumZ); // ワークグループ数をディスパッチ
        computePassEncoder.end();
        device.queue.submit([computeCommandEncoder.finish()]);
    }

    async copyBufferToArray(buffer, array) {
        // 一時的な読み取り用バッファを作成 (MAP_READ を含む)
        const readBuffer = device.createBuffer({
            size: array.length * 4,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        // コピーコマンドを発行
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, array.length * 4);
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        // 一時バッファの内容をマップして表示
        await readBuffer.mapAsync(GPUMapMode.READ);
        const mappedRange = new Float32Array(readBuffer.getMappedRange());
        for (let i = 0; i < array.length; i ++) {
            array[i] = mappedRange[i];
        }
        readBuffer.unmap();
    }

    async getF32BufferPartsData(buffer, index, struct) {
        const size = struct * 4;
        // 一時的な読み取り用バッファを作成 (MAP_READ を含む)
        const readBuffer = device.createBuffer({
            size: size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        // コピーコマンドを発行
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, index * struct * 4, readBuffer, 0, size);
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        // 一時バッファの内容をマップして表示
        await readBuffer.mapAsync(GPUMapMode.READ);
        const mappedRange = readBuffer.getMappedRange();
        const dataArray = new Float32Array(mappedRange.slice(0));

        readBuffer.unmap();
        readBuffer.destroy();  // ← 追加
        return dataArray;
    }

    async getF32BufferData(buffer, size) {
        if (!size) {
            size = buffer.size;
        }
        // 一時的な読み取り用バッファを作成 (MAP_READ を含む)
        const readBuffer = device.createBuffer({
            size: size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        // コピーコマンドを発行
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, size);
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        // 一時バッファの内容をマップして表示
        await readBuffer.mapAsync(GPUMapMode.READ);
        const mappedRange = readBuffer.getMappedRange();
        const dataArray = new Float32Array(mappedRange.slice(0));

        readBuffer.unmap();
        readBuffer.destroy();  // ← 追加
        return dataArray;
    }

    async getU32BufferData(buffer, size) {
        if (!size) {
            size = buffer.size;
        }
        // 一時的な読み取り用バッファを作成 (MAP_READ を含む)
        const readBuffer = device.createBuffer({
            size: size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        // コピーコマンドを発行
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, size);
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        // 一時バッファの内容をマップして表示
        await readBuffer.mapAsync(GPUMapMode.READ);
        const mappedRange = readBuffer.getMappedRange();
        const dataArray = new Uint32Array(mappedRange.slice(0));

        readBuffer.unmap();
        return dataArray;
    }

    async getBufferDataAsStruct(buffer, size, struct) {
        if (!size) {
            size = buffer.size;
        }
        // 一時的な読み取り用バッファを作成
        const readBuffer = device.createBuffer({
            size: size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        // コピーコマンドを発行
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, size);
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        // 一時バッファの内容をマップ
        await readBuffer.mapAsync(GPUMapMode.READ);
        const mappedRange = readBuffer.getMappedRange();
        const rawData = new Uint8Array(mappedRange);

        // 構造体に基づいてデータを解析
        const dataView = new DataView(rawData.buffer);
        const structSize = struct.length * 4; // 各フィールドのサイズが 4 バイト固定 (u32, f32)
        const result = [];

        let offset = 0;
        for (let i = 0; i < size / structSize; i++) {
            for (const field of struct) {
                if (field === "u32") {
                    result.push(dataView.getUint32(offset, true));
                } else if (field === "f32") {
                    result.push(dataView.getFloat32(offset, true));
                }
                offset += 4; // フィールドのサイズを加算
            }
        }

        readBuffer.unmap();
        return result;
    }

    async consoleBufferData(buffer, struct, text = "") {
        // 一時的な読み取り用バッファを作成 (MAP_READ を含む)
        const readBuffer = device.createBuffer({
            size: buffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        // コピーコマンドを発行
        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, buffer.size);
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        // 一時バッファの内容をマップして表示
        await readBuffer.mapAsync(GPUMapMode.READ);
        const mappedRange = readBuffer.getMappedRange();
        const rawData = new Uint8Array(mappedRange);

        // 構造体に基づいてデータを解析
        const dataView = new DataView(rawData.buffer);
        const structSize = struct.length * 4; // 各フィールドのサイズが 4 バイト固定 (u32, f32)
        const result = [];

        let offset = 0;
        for (let i = 0; i < buffer.size / structSize; i++) {
            for (const field of struct) {
                if (field === "u32") {
                    result.push(dataView.getUint32(offset, true));
                } else if (field === "f32") {
                    result.push(dataView.getFloat32(offset, true));
                }
                offset += 4; // フィールドのサイズを加算
            }
        }

        readBuffer.unmap();
        console.log(text,result);
    }

    async createTextureAtlas(textures, textureSize) {
        // アトラステクスチャのサイズ計算
        const atlasRowCol = Math.ceil(Math.sqrt(textures.length));
        const atlasSize = atlasRowCol * textureSize;

        const atlasTexture = device.createTexture({
            size: [atlasSize, atlasSize],
            format: format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        // 各テクスチャをアトラスにコピー
        const commandEncoder = device.createCommandEncoder();
        textures.forEach((texture, index) => {
            const x = (index % atlasRowCol) * textureSize;
            const y = Math.floor(index / atlasRowCol) * textureSize;

            commandEncoder.copyTextureToTexture(
                { texture },
                { texture: atlasTexture, origin: { x, y } },
                [textureSize, textureSize, 1]
            );
        });

        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        return [atlasTexture, atlasRowCol];
    }

    decompression(data) {
        function base64ToUint8Array(base64) {
            // Base64文字列をデコードしてバイナリ文字列に変換
            const binaryString = atob(base64);
            // バイナリ文字列をUint8Arrayに変換
            const uint8Array = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
            }

            const dataView = new DataView(uint8Array.buffer);

            const zeroNum = dataView.getUint32(0, true);
            const result = new Uint8Array(zeroNum + dataView.byteLength - 4);
            for (let i = 0; i < zeroNum; i ++) {
                result[i] = 0;
            }
            for (let i = 0; i < dataView.byteLength - 4; i ++) {
                result[zeroNum + i] = dataView.getUint8(4 + i, true);
            }
            return result;
        }

        // Base64文字列をImageBitmapに変換
        const sectionData = data.split("_");
        const pixelData = [];
        for (const base64 of sectionData) {
            const uint8Array = base64ToUint8Array(base64);
            pixelData.push(uint8Array);
        }
        return pixelData;
    }

    compression(data) {
        function dataToBase64(data) {
            let strings = [];
            for (const bit of data) {
                let binaryString = "";
                for (let i = 0; i < bit.length; i++) {
                    binaryString += String.fromCharCode(bit[i]);
                }
                strings.push(btoa(binaryString));
            }
            return strings.join("_");
        }

        let b = data;
        // 圧縮1(前との差)
        // let b = new Uint8Array(data.length);
        // b[0] = data[0];
        // for (let i = 1; i < data.length; i ++) {
        //     b[i] = numberToUint8(data[i] - data[i - 1]);
        // }
        // return dataToBase64(data);

        let result = [];
        let count = 0;

        const appendBitData = (zeroNum, data) => {
            count += zeroNum + data.length;
            const buffer = new ArrayBuffer(4 + data.length); // u32, u8...
            const view = new DataView(buffer);
            view.setUint32(0, zeroNum, true);
            for (let i = 0; i < data.length; i ++) {
                view.setUint8(4 + i, data[i], true);
            }
            result.push(new Uint8Array(buffer));
        }

        let arrayData = [];

        let i = 0;
        while (i < b.length) {
            let zeroNum = 0;
            while (b[i] == 0 && i < b.length) {
                zeroNum ++;
                i ++;
            }
            const arrayData = [];
            while (b[i] != 0 && i < b.length) {
                arrayData.push(b[i]);
                i ++;
            }
            appendBitData(zeroNum,arrayData);
        }
        arrayData.length = 0;
        if (i != count) {
            throw Error(`ずれ発生${i},${count},[${result.length}]`);
        }
        return dataToBase64(result);
    }

    async textureToBase64(texture, option = true) {
        const alignedBytesPerRow = Math.ceil((texture.width * 4) / 256) * 256;
        const stagingBuffer = device.createBuffer({
            size: alignedBytesPerRow * texture.height,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyTextureToBuffer(
            { texture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
            { buffer: stagingBuffer, bytesPerRow: alignedBytesPerRow, rowsPerImage: texture.height },
            { width: texture.width, height: texture.height, depthOrArrayLayers: 1 }
        );
        device.queue.submit([commandEncoder.finish()]);

        await stagingBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = stagingBuffer.getMappedRange();
        const uint8Array = new Uint8Array(arrayBuffer);

        if (option) {
            for (let i = 0; i < uint8Array.length; i += 4) {
                if (uint8Array[i + 3] == 0) { // 透明度だった場合
                    for (let j = 0; j < 3; j ++) {
                        uint8Array[i + j] = 0;
                    }
                }
            }
        }

        const base64String = this.compression(uint8Array);
        stagingBuffer.unmap();

        // console.log("base64", base64String)
        return {data: base64String, width: texture.width, height: texture.height}; // "data:image/png;base64,..." の形式で返される
    }

    async copyBase64ToTexture(texture, base64String) {
        function base64ToUint8Array(base64) {
            // Base64文字列をデコードしてバイナリ文字列に変換
            const binaryString = atob(base64);
            // バイナリ文字列をUint8Arrayに変換
            const uint8Array = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                uint8Array[i] = binaryString.charCodeAt(i);
            }

            const dataView = new DataView(uint8Array.buffer);

            const zeroNum = dataView.getUint32(0, true);
            const result = new Uint8Array(zeroNum + dataView.byteLength - 4);
            for (let i = 0; i < zeroNum; i ++) {
                result[i] = 0;
            }
            for (let i = 0; i < dataView.byteLength - 4; i ++) {
                result[zeroNum + i] = dataView.getUint8(4 + i, true);
            }
            return result;
        }

        const alignedBytesPerRow = Math.ceil((texture.width * 4) / 256) * 256;

        // Base64文字列をImageBitmapに変換
        const sectionData = base64String.split("_");
        const pixelData = new Uint8Array(alignedBytesPerRow * texture.height);
        let offset = 0;
        for (const base64 of sectionData) {
            const uint8Array = base64ToUint8Array(base64);
            pixelData.set(uint8Array, offset);
            offset += uint8Array.byteLength;
        }
        if (offset != alignedBytesPerRow * texture.height) {
            console.warn("テクスチャデータの破損が見つかりました", offset, alignedBytesPerRow * texture.height);
        }

        // 2. GPUバッファを作成
        const buffer = device.createBuffer({
            size: alignedBytesPerRow * texture.height,
            usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
        // 3. バッファにUint8Arrayのデータをセット
        device.queue.writeBuffer(buffer, 0, pixelData);
        // 4. コマンドエンコーダーの作成
        const commandEncoder = device.createCommandEncoder();
        // 5. テクスチャへのコピーコマンド
        commandEncoder.copyBufferToTexture(
            {
                buffer: buffer,
                offset: 0,
                bytesPerRow: alignedBytesPerRow, // 1行あたりのバイト数
                rowsPerImage: texture.height,
            },
            {
                texture: texture,
                mipLevel: 0,
                origin: { x: 0, y: 0, z: 0 },
            },
            { width: texture.width, height: texture.height, depthOrArrayLayers: 1 }
        );
        // 6. コマンドの実行
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
    }

    async getTextureData(texture) {
        const alignedBytesPerRow = Math.ceil((texture.width * 4) / 256) * 256;
        const stagingBuffer = device.createBuffer({
            size: alignedBytesPerRow * texture.height,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const commandEncoder = device.createCommandEncoder();
        commandEncoder.copyTextureToBuffer(
            { texture, mipLevel: 0, origin: { x: 0, y: 0, z: 0 } },
            { buffer: stagingBuffer, bytesPerRow: alignedBytesPerRow, rowsPerImage: texture.height },
            { width: texture.width, height: texture.height, depthOrArrayLayers: 1 }
        );
        device.queue.submit([commandEncoder.finish()]);

        await stagingBuffer.mapAsync(GPUMapMode.READ);
        const arrayBuffer = stagingBuffer.getMappedRange();
        const uint8Array = new Uint8Array(arrayBuffer);

        const r = uint8Array.slice();
        stagingBuffer.unmap();
        return r;
    }

    async checkT(texture1, texture2) {
        const t1 = await this.getTextureData(texture1);
        const t2 = await this.getTextureData(texture2);

        for (let i = 0; i < t1.length; i += 4) {
            let c1 = [t1[i] * t1[i + 3], t1[i + 1] * t1[i + 3], t1[i + 2] * t1[i + 3]];
            let c2 = [t2[i] * t2[i + 3], t2[i + 1] * t2[i + 3], t2[i + 2] * t2[i + 3]];

            // for (let j = 0; j < 3; j ++) {
            //     if (c1[j] != c2[j]) {
            //         console.log(c1, c2, i)
            //         console.log(t1.slice(i - 12, i + 12));
            //         console.log(t2.slice(i - 12, i + 12));
            //         return false;
            //     }
            // }
            for (let j = 0; j < 3; j ++) {
                if (c1[j] != 0) {
                    console.log(c1, c2, i)
                    return false;
                }
            }
        }
        return true;
    }

    // async copyBase64ToTexture(texture, base64String) {
    //     if (!base64String.startsWith("data:image/")) {
    //         // プレフィックスを自動的に追加（例: PNG形式として処理）
    //         base64String = "data:image/png;base64," + base64String;
    //     }

    //     // Base64文字列をImageBitmapに変換
    //     const image = await createImageBitmap(await fetch(base64String).then(res => res.blob()));

    //     // ImageBitmapのサイズがテクスチャに合うか確認
    //     if (image.width !== texture.width || image.height !== texture.height) {
    //         throw new Error("Image size does not match the texture size.");
    //     }

    //     // コマンドエンコーダを作成してデータをコピー
    //     device.queue.copyExternalImageToTexture(
    //         { source: image },
    //         { texture: texture },
    //         {
    //             width: image.width,
    //             height: image.height,
    //             depthOrArrayLayers: 1,
    //         }
    //     );

    //     base64String = null;
    //     image.close();
    // }
}
const adapter = await navigator.gpu.requestAdapter();

export const device = await adapter.requestDevice();

export const format = navigator.gpu.getPreferredCanvasFormat();
console.log(format)

export const GPU = new WebGPU();

console.log(
    GPU.decompression(GPU.compression([
        0,0,0,0,255,255,255,255,
        0,0,200,200,150,150,150,
        255,0,200,200,150,150,150,
    ]))
)