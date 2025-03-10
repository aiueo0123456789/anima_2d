import { GPU, device, format } from '../webGPU.js';
import { graphicMeshsMeshRenderPipeline, modifierMeshRenderPipeline, renderPipeline,circlesFromAllVerticesRenderPipeline,circlesFromPartVerticesRenderPipeline,lineRenderPipeline,bezierRenderPipeline,BBoxRenderPipeline,sampler, v_u_u_f_ts, activeColorGroup, inactiveColorGroup, activeBBoxColorGroup, inactiveBBoxColorGroup, inactiveRotateModifierColorGroup, activeRotateModifierColorGroup, maskRenderPipeline, boneRenderPipeline, inactiveBoneRendringConfigGroup, activeBoneRendringConfigGroup, partBoneRenderPipeline, rotateModifierRenderPipeline, editRotateModifierColorGroup, v_sr_sr, v_sr, modifierFrameRenderPipeline, modifierFrame2RenderPipeline } from "../GPUObject.js";
import { hierarchy } from '../ヒエラルキー.js';
import { activeView, renderObjectManager, stateMachine, toolbar } from '../main.js';

const weigthRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr_sr, v_sr], `
struct Camera {
    position: vec2<f32>,
    zoom: f32,
    padding: f32,
}

struct AnimationData {
    index: vec4<u32>,
    weight: vec4<f32>,
}

@group(0) @binding(0) var<uniform> cvsAspect: vec2<f32>;
@group(0) @binding(1) var<uniform> camera: Camera;
@group(1) @binding(0) var<storage, read> verticesPosition: array<vec2<f32>>;
@group(1) @binding(1) var<storage, read> verticesIndexAndWeight: array<AnimationData>;
@group(2) @binding(0) var<storage, read> targetIndex: u32;

struct VertexOutput {
    @builtin(position) position: vec4<f32>, // クリッピング座標系での頂点位置
    @location(0) color: vec4<f32>,
}

// バーテックスシェーダー
@vertex
fn main(
    // @builtin(vertex_index) vertexIndex: u32
    @location(0) index: u32,
    ) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4f((verticesPosition[index] - camera.position) * camera.zoom * cvsAspect, 0, 1.0);
    let data = verticesIndexAndWeight[index];
    let indexs = data.index;
    let weights = data.weight;
    var weight = 0.0;
    for (var i = 0u; i < 4u; i ++) {
        if (indexs[i] == targetIndex) {
            weight = weights[i];
            break ;
        }
    }
    let color0 = vec4<f32>(0.0, 0.0, 1.0, 1.0);
    let color1 = vec4<f32>(0.0, 1.0, 0.0, 1.0);
    let color2 = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    output.color = select(mix(color0, color1, weight * 2.0), mix(color1, color2, (weight - 0.5) * 2.0), weight > 0.5);
    return output;
}
`,`
@group(0) @binding(2) var mySampler: sampler;

struct FragmentOutput {
    @location(0) color: vec4<f32>,   // カラーバッファ (通常は0番目の出力)
};

@fragment
fn main(
    @location(0) color: vec4<f32>,
) -> FragmentOutput {
    var output: FragmentOutput;
    output.color = color;
    return output;
}
`, [["u"]], "2d", "t");

export class Render {
    constructor(cvs, camera) {
        this.cvs = cvs;
        this.ctx = cvs.getContext('webgpu');
        this.ctx.configure({
            device: device,
            format: format
        });

        this.cvsAspectBuffer = GPU.createUniformBuffer(2 * 4, undefined, ["f32"]);
        this.resizeCVS();
        this.camera = camera;
        this.staticGroup = GPU.createGroup(v_u_u_f_ts, [{item: this.cvsAspectBuffer, type: 'b'}, {item: camera.cameraDataBuffer, type: 'b'}, {item: sampler, type: 'ts'}]);
    }

    resizeCVS() {
        GPU.writeBuffer(this.cvsAspectBuffer, new Float32Array([1 / this.cvs.width, 1 /  this.cvs.height]));
    }

    renderObjects() {
        const commandEncoder = device.createCommandEncoder();
        for (const value of renderObjectManager.maskTextures) {
            if (value.renderingObjects.length > 0 && value.name != "base") {
                const maskRenderPass = commandEncoder.beginRenderPass({
                    colorAttachments: [
                        {
                            view: value.textureView,
                            clearValue: { r: 0, g: 0, b: 0, a: 0 },
                            loadOp: 'clear',
                            storeOp: 'store',
                        },
                    ],
                });
                // オブジェクト表示
                maskRenderPass.setPipeline(maskRenderPipeline);
                maskRenderPass.setBindGroup(0, this.staticGroup);
                for (const graphicMesh of value.renderingObjects) {
                    maskRenderPass.setBindGroup(1, graphicMesh.maskRenderGroup);
                    maskRenderPass.setVertexBuffer(0, graphicMesh.v_meshIndexBuffer);
                    maskRenderPass.draw(graphicMesh.meshesNum * 3, 1, 0, 0);
                }
                // 処理の終了と送信
                maskRenderPass.end();
            }
        }
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.ctx.getCurrentTexture().createView(),
                    clearValue: renderObjectManager.backgroundColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        // オブジェクト表示
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, this.staticGroup);
        for (const graphicMesh of hierarchy.renderingOrder) {
            if (graphicMesh.isInit && graphicMesh.isHide) {
                renderPass.setBindGroup(1, graphicMesh.renderGroup);
                renderPass.setVertexBuffer(0, graphicMesh.v_meshIndexBuffer);
                renderPass.draw(graphicMesh.meshesNum * 3, 1, 0, 0);
            }
        }
        // 処理の終了と送信
        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
    }

    renderGUI() {
        const commandEncoder = device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.ctx.getCurrentTexture().createView(),
                    loadOp: 'load',
                    storeOp: 'store',
                },
            ],
        });
        // オブジェクト表示
        renderPass.setBindGroup(0, this.staticGroup);

        if (stateMachine.state.data.selectVerticesBBoxRenderGroup) {
            renderPass.setPipeline(BBoxRenderPipeline);
            renderPass.setBindGroup(1, stateMachine.state.data.selectVerticesBBoxRenderGroup);
            renderPass.setBindGroup(2, activeColorGroup);
            renderPass.draw(4, 1, 0, 0);
            renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
            renderPass.setBindGroup(1, stateMachine.state.data.referenceCoordinatesRenderGroup);
            // renderPass.setBindGroup(2, referenceCoordinatesColorGroup);
            renderPass.setBindGroup(2, toolbar.referenceCoordinatesGroup);
            renderPass.draw(4, 1, 0, 0);
        }

        if (true) {
            if (!stateMachine.state.data.IsHideForGUI && stateMachine.state.data.hoverObjects) {
                renderPass.setPipeline(rotateModifierRenderPipeline);
                renderPass.setBindGroup(2, inactiveRotateModifierColorGroup);
                for (const modifier of hierarchy.rotateModifiers) {
                    renderPass.setBindGroup(1, modifier.BBoxRenderGroup);
                    renderPass.draw(4, 1, 0, 0);
                }
                renderPass.setPipeline(boneRenderPipeline);
                renderPass.setBindGroup(2, inactiveBoneRendringConfigGroup);
                for (const modifier of hierarchy.boneModifiers) {
                    renderPass.setBindGroup(1, modifier.GUIrenderGroup);
                    renderPass.draw(4, modifier.boneNum, 0, 0);
                }
                renderPass.setPipeline(bezierRenderPipeline);
                renderPass.setBindGroup(2, toolbar.bezierGroup);
                for (const modifier of hierarchy.lineModifiers) {
                    renderPass.setBindGroup(1, modifier.GUIrenderGroup);
                    renderPass.draw(2 * 50, modifier.pointNum - 1, 0, 0);
                }
                renderPass.setPipeline(graphicMeshsMeshRenderPipeline);
                for (const graphicMesh of stateMachine.state.data.hoverObjects) {
                    if (graphicMesh.type == "グラフィックメッシュ") {
                        renderPass.setBindGroup(1, graphicMesh.GUIMeshRenderGroup);
                        renderPass.setBindGroup(2, toolbar.meshHoveredGroup);
                        renderPass.draw(3 * 4, graphicMesh.meshesNum, 0, 0); // (3 * 4) 3つの辺を4つの頂点を持つ四角形で表示する
                    }
                }
                renderPass.setPipeline(graphicMeshsMeshRenderPipeline);
                for (const boneModifier of stateMachine.state.data.hoverObjects) {
                    if (boneModifier.type == "ボーンモディファイア") {
                        renderPass.setBindGroup(1, boneModifier.GUIMeshRenderGroup);
                        renderPass.setBindGroup(2, toolbar.meshHoveredGroup);
                        renderPass.draw(3 * 4, boneModifier.meshesNum, 0, 0); // (3 * 4) 3つの辺を4つの頂点を持つ四角形で表示する
                    }
                }
                for (const modifier of stateMachine.state.data.hoverObjects) {
                    if (modifier.type == "モディファイア") {
                    }
                }
                // BBoxの表示
                renderPass.setBindGroup(2, inactiveBBoxColorGroup);
                for (const modifier of hierarchy.modifiers) {
                    renderPass.setBindGroup(1, modifier.GUIMeshRenderGroup);
                    renderPass.setPipeline(modifierFrameRenderPipeline);
                    renderPass.draw(4, (modifier.fineness[0] * 2) + (modifier.fineness[1] * 2), 0, 0); // (4 * 4) 4つの辺を4つの頂点を持つ四角形で表示する

                    renderPass.setPipeline(modifierFrame2RenderPipeline);
                    renderPass.draw(3, 4, 0, 0);
                }
                for (const modifier of hierarchy.lineModifiers) {
                    renderPass.setPipeline(BBoxRenderPipeline);

                    renderPass.setBindGroup(1, modifier.BBoxRenderGroup);
                    renderPass.draw(4, 1, 0, 0);
                }
                for (const modifier of hierarchy.boneModifiers) {
                    renderPass.setPipeline(BBoxRenderPipeline);

                    renderPass.setBindGroup(1, modifier.BBoxRenderGroup);
                    renderPass.draw(4, 1, 0, 0);
                }
            }
        }

        if (stateMachine.searchStringInNowState("グラフィックメッシュ")) {
            const graphicMesh = stateMachine.state.data.object;
            if (stateMachine.searchStringInNowState("選択") || stateMachine.searchStringInNowState("並行移動") || stateMachine.searchStringInNowState("リサイズ") || stateMachine.searchStringInNowState("回転") || stateMachine.searchStringInNowState("ウェイトペイント")) {
                if (stateMachine.searchStringInNowState("ウェイトペイント")) {
                    if (graphicMesh.parent.type == "ボーンモディファイア" || graphicMesh.parent.type == "モディファイア") {
                        if (graphicMesh.isInit && graphicMesh.isHide) {
                            renderPass.setPipeline(weigthRenderPipeline);
                            renderPass.setBindGroup(1, graphicMesh.renderWegihtGroup);
                            renderPass.setBindGroup(2, stateMachine.state.data.weightTargetGroup);
                            renderPass.setVertexBuffer(0, graphicMesh.v_meshIndexBuffer);
                            renderPass.draw(graphicMesh.meshesNum * 3, 1, 0, 0);
    
                            const modifier = graphicMesh.parent;
                            if (modifier.type == "ボーンモディファイア") {
                                renderPass.setPipeline(boneRenderPipeline);
                                renderPass.setBindGroup(1, modifier.GUIrenderGroup);
                                renderPass.setBindGroup(2, inactiveBoneRendringConfigGroup);
                                renderPass.draw(4, modifier.boneNum, 0, 0);
    
                                renderPass.setPipeline(partBoneRenderPipeline);
                                renderPass.setBindGroup(2, activeBoneRendringConfigGroup);
                                renderPass.setBindGroup(3, stateMachine.state.data.weightTargetGroup);
                                renderPass.draw(4, 1, 0, 0);
                            } else {
                                renderPass.setBindGroup(1, modifier.GUIMeshRenderGroup);
                                renderPass.setBindGroup(2, activeBBoxColorGroup);
                                renderPass.setPipeline(modifierMeshRenderPipeline);
                                renderPass.draw(4 * 4, modifier.meshesNum, 0, 0); // (4 * 4) 4つの辺を4つの頂点を持つ四角形で表示する
                                renderPass.setBindGroup(1, modifier.GUIVerticesRenderGroup);
                                renderPass.setBindGroup(2, inactiveColorGroup);
                                renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
                                renderPass.draw(4, modifier.verticesNum, 0, 0);
                            }
                        }
                    }
                } else {
                    renderPass.setBindGroup(1, graphicMesh.GUIMeshRenderGroup);
                    renderPass.setBindGroup(2, toolbar.meshHoveredGroup);
                    renderPass.setPipeline(graphicMeshsMeshRenderPipeline);
                    renderPass.draw(3 * 4, graphicMesh.meshesNum, 0, 0); // (3 * 4) 3つの辺を4つの頂点を持つ四角形で表示する
                    renderPass.setBindGroup(1, graphicMesh.GUIVerticesRenderGroup);
                    renderPass.setBindGroup(2, toolbar.verticesGroup);
                    renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
                    renderPass.draw(4, graphicMesh.verticesNum, 0, 0);
                    if (stateMachine.state.data.selectVerticesIndexs.length) {
                        renderPass.setPipeline(circlesFromPartVerticesRenderPipeline);
                        renderPass.setBindGroup(2, toolbar.activeVerticesGroup);
                        renderPass.setBindGroup(3, stateMachine.state.data.selectVerticesIndexsGroup);
                        renderPass.draw(4, stateMachine.state.data.selectVerticesIndexs.length, 0, 0);
                    }
                }
            } else {
                renderPass.setPipeline(graphicMeshsMeshRenderPipeline);
                renderPass.setBindGroup(1, graphicMesh.GUIMeshRenderGroup);
                renderPass.setBindGroup(2, toolbar.meshActiveGroup);
                renderPass.draw(3 * 4, graphicMesh.meshesNum, 0, 0); // (3 * 4) 3つの辺を4つの頂点を持つ四角形で表示する
            }
        } else if (stateMachine.searchStringInNowState("モディファイア")) {
            const modifier = stateMachine.state.data.object;
            if (stateMachine.searchStringInNowState("選択") || stateMachine.searchStringInNowState("並行移動") || stateMachine.searchStringInNowState("リサイズ") || stateMachine.searchStringInNowState("回転") || stateMachine.searchStringInNowState("ウェイトペイント")) {
                renderPass.setBindGroup(1, modifier.GUIMeshRenderGroup);
                renderPass.setBindGroup(2, activeBBoxColorGroup);
                renderPass.setPipeline(modifierMeshRenderPipeline);
                renderPass.draw(4 * 4, modifier.meshesNum, 0, 0); // (4 * 4) 4つの辺を4つの頂点を持つ四角形で表示する
                renderPass.setBindGroup(1, modifier.GUIVerticesRenderGroup);
                renderPass.setBindGroup(2, inactiveColorGroup);
                renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
                renderPass.draw(4, modifier.verticesNum, 0, 0);
                if (stateMachine.state.data.selectVerticesIndexs.length) {
                    renderPass.setPipeline(circlesFromPartVerticesRenderPipeline);
                    renderPass.setBindGroup(2, activeColorGroup);
                    renderPass.setBindGroup(3, stateMachine.state.data.selectVerticesIndexsGroup);
                    renderPass.draw(4, stateMachine.state.data.selectVerticesIndexs.length, 0, 0);
                }
            } else {
                renderPass.setPipeline(BBoxRenderPipeline);
                renderPass.setBindGroup(1, modifier.BBoxRenderGroup);
                renderPass.setBindGroup(2, activeBBoxColorGroup);
                renderPass.draw(4, 1, 0, 0);
            }
        } else if (stateMachine.searchStringInNowState("ベジェモディファイア")) {
            const modifier = stateMachine.state.data.object;
            if (stateMachine.searchStringInNowState("選択") || stateMachine.searchStringInNowState("並行移動") || stateMachine.searchStringInNowState("リサイズ") || stateMachine.searchStringInNowState("回転") || stateMachine.searchStringInNowState("ウェイトペイント")) {
                renderPass.setBindGroup(1, modifier.GUIrenderGroup);
                renderPass.setBindGroup(2, toolbar.bezierGroup);
                renderPass.setPipeline(bezierRenderPipeline);
                renderPass.draw(2 * 50, modifier.pointNum - 1, 0, 0);
                renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
                renderPass.setBindGroup(2, inactiveColorGroup);
                renderPass.draw(4, modifier.verticesNum, 0, 0);
                if (stateMachine.state.data.selectVerticesIndexs.length) {
                    renderPass.setPipeline(circlesFromPartVerticesRenderPipeline);
                    renderPass.setBindGroup(2, activeColorGroup);
                    renderPass.setBindGroup(3, stateMachine.state.data.selectVerticesIndexsGroup);
                    renderPass.draw(4, stateMachine.state.data.selectVerticesIndexs.length, 0, 0);
                }
            } else {
                renderPass.setBindGroup(1, modifier.GUIrenderGroup);
                renderPass.setBindGroup(2, toolbar.bezierGroup);
                renderPass.setPipeline(bezierRenderPipeline);
                renderPass.draw(2 * 50, modifier.pointNum - 1, 0, 0);
                renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
                renderPass.setBindGroup(2, inactiveColorGroup);
                renderPass.draw(4, modifier.verticesNum, 0, 0);
            }
        } else if (stateMachine.searchStringInNowState("回転モディファイア")) {
            const modifier = stateMachine.state.data.object;
            if (stateMachine.searchStringInNowState("選択") || stateMachine.searchStringInNowState("並行移動") || stateMachine.searchStringInNowState("リサイズ") || stateMachine.searchStringInNowState("回転") || stateMachine.searchStringInNowState("ウェイトペイント")) {
                renderPass.setPipeline(rotateModifierRenderPipeline);
                renderPass.setBindGroup(2, editRotateModifierColorGroup);
                renderPass.setBindGroup(1, modifier.BBoxRenderGroup);
                renderPass.draw(4, 1, 0, 0);
            } else {
                renderPass.setPipeline(rotateModifierRenderPipeline);
                renderPass.setBindGroup(2, activeRotateModifierColorGroup);
                renderPass.setBindGroup(1, modifier.BBoxRenderGroup);
                renderPass.draw(4, 1, 0, 0);
            }
        } else if (stateMachine.searchStringInNowState("ボーンモディファイア")) {
            const modifier = stateMachine.state.data.object;
            if (stateMachine.searchStringInNowState("選択") || stateMachine.searchStringInNowState("並行移動") || stateMachine.searchStringInNowState("リサイズ") || stateMachine.searchStringInNowState("回転") || stateMachine.searchStringInNowState("ウェイトペイント")) {
                renderPass.setPipeline(boneRenderPipeline);
                renderPass.setBindGroup(1, modifier.GUIrenderGroup);
                renderPass.setBindGroup(2, inactiveBoneRendringConfigGroup);
                renderPass.draw(4, modifier.boneNum, 0, 0);
                renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
                renderPass.setBindGroup(2, inactiveColorGroup);
                renderPass.draw(4, modifier.verticesNum, 0, 0);
                if (stateMachine.state.data.selectVerticesIndexs.length) {
                    renderPass.setPipeline(circlesFromPartVerticesRenderPipeline);
                    renderPass.setBindGroup(2, activeColorGroup);
                    renderPass.setBindGroup(3, stateMachine.state.data.selectVerticesIndexsGroup);
                    renderPass.draw(4, stateMachine.state.data.selectVerticesIndexs.length, 0, 0);
                }
            } else {
                renderPass.setPipeline(boneRenderPipeline);
                renderPass.setBindGroup(1, modifier.GUIrenderGroup);
                renderPass.setBindGroup(2, activeBoneRendringConfigGroup);
                renderPass.draw(4, modifier.boneNum, 0, 0);
                renderPass.setPipeline(BBoxRenderPipeline);
                renderPass.setBindGroup(1, modifier.BBoxRenderGroup);
                renderPass.setBindGroup(2, activeBBoxColorGroup);
                renderPass.draw(4, 1, 0, 0);
            }
        }
        renderPass.setPipeline(circlesFromAllVerticesRenderPipeline);
        renderPass.setBindGroup(1, stateMachine.mouseRenderGroup);
        renderPass.setBindGroup(2, stateMachine.mouseRenderConfigGroup);
        renderPass.draw(4, 1, 0, 0);
        renderPass.setBindGroup(2, stateMachine.smoothRadiusRenderConfig);
        renderPass.draw(4, 1, 0, 0);
        // 処理の終了と送信
        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
    }
}