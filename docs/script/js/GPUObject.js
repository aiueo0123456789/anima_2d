import { GPU } from "./webGPU.js";

GPU.setBaseStruct(await fetch('./script/wgsl/baseStructes.wgsl').then(x => x.text()));

export const v_renderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/v_render.wgsl').then(x => x.text()));
export const f_renderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/f_render.wgsl').then(x => x.text()));
export const v_maskRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/マスク/v.wgsl').then(x => x.text()));
export const f_maskRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/マスク/f.wgsl').then(x => x.text()));
export const v_allSquareRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/v_全ての頂点を四角として表示.wgsl').then(x => x.text()));
export const f_textureRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/f_テクスチャ表示.wgsl').then(x => x.text()));
export const v_PSRSquareRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/v_座標・回転・スケールを四角として表示.wgsl').then(x => x.text()));
export const v_partSquareRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/v_限られた頂点を四角として表示.wgsl').then(x => x.text()));
export const f_squareRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/f_円塗りつぶし.wgsl').then(x => x.text()));
export const v_lineRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/v_線分.wgsl').then(x => x.text()));
export const v_modifierMeshRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/モディファイア/v_メッシュ.wgsl').then(x => x.text()));
export const v_modifierFrameRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/モディファイア/v_枠の表示.wgsl').then(x => x.text()));
export const v_modifierFrame2RenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/モディファイア/v_枠2の表示 .wgsl').then(x => x.text()));
export const v_graphicMeshsMeshRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/グラフィックメッシュ/v_メッシュ.wgsl').then(x => x.text()));
export const f_fillRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/f_単色塗りつぶし.wgsl').then(x => x.text()));
export const f_strokeRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/f_枠線.wgsl').then(x => x.text()));
export const v_BBoxRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/v_BBox.wgsl').then(x => x.text()));
export const v_bezierRenderShaderModule = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/v_ベジェ.wgsl').then(x => x.text()));
export const v_cvsDraw = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/テクスチャのcvs表示/v_canvasDraw.wgsl').then(x => x.text()));
export const f_cvsDraw = GPU.createShaderModule(await fetch('./script/wgsl/レンダー/テクスチャのcvs表示/f_canvasDraw.wgsl').then(x => x.text()));

const circleSelectVertices = GPU.createShaderModule(await fetch('./script/wgsl/compute/頂点の円選択.wgsl').then(x => x.text()));
const boxSelectVertices = GPU.createShaderModule(await fetch('./script/wgsl/compute/頂点のボックス選択.wgsl').then(x => x.text()));
const calculateAllBBox = GPU.createShaderModule(await fetch('./script/wgsl/compute/全ての頂点からBBoxを計算.wgsl').then(x => x.text()));
const calculateLimitBBox = GPU.createShaderModule(await fetch('./script/wgsl/compute/限られた頂点からBBoxを計算.wgsl.wgsl').then(x => x.text()));
const modifierTransform = GPU.createShaderModule(await fetch('./script/wgsl/compute/モディファイア/モディファイアの変形を適応.wgsl').then(x => x.text()));
const rotateModifierTransform = GPU.createShaderModule(await fetch('./script/wgsl/compute/回転モディファイアの変形を適応.wgsl').then(x => x.text()));
const lineModifierTransform = GPU.createShaderModule(await fetch('./script/wgsl/compute/ベジェモディファイア/ベジェモディファイアの変形を適応.wgsl').then(x => x.text()));
const adaptAllAnimationToVertices = GPU.createShaderModule(await fetch('./script/wgsl/compute/全ての頂点にアニメーションを適応.wgsl').then(x => x.text()));
const setModifierWeightToGraphicMesh = GPU.createShaderModule(await fetch('./script/wgsl/compute/モディファイア/頂点にモディファイアとの関係を作る.wgsl').then(x => x.text()));
const setLineModifierWeightToGraphicMesh = GPU.createShaderModule(await fetch('./script/wgsl/compute/ベジェモディファイア/頂点にベジェモディファイアとの関係を作る.wgsl').then(x => x.text()));
const animationTransform = GPU.createShaderModule(await fetch('./script/wgsl/compute/全てのアニメーション頂点データを更新.wgsl').then(x => x.text()));
const baseTransform = GPU.createShaderModule(await fetch('./script/wgsl/compute/全てのベース頂点データを更新.wgsl').then(x => x.text()));
const calculateAllAverage = GPU.createShaderModule(await fetch('./script/wgsl/compute/全ての頂点の平均.wgsl').then(x => x.text()));
const updateCenterPosition = GPU.createShaderModule(await fetch('./script/wgsl/compute/中心位置を変更.wgsl').then(x => x.text()));

// グループレイアウトの宣言
export const f_ts_t = GPU.createGroupLayout([{useShaderTypes: ['f'], type: 'ts'}, {useShaderTypes: ['f'], type: 't'}]);
export const v_u_f_t = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'u'}, {useShaderTypes: ['f'], type: 't'}]);
export const v_u_u_f_ts = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'u'}, {useShaderTypes: ['v'], type: 'u'}, {useShaderTypes: ['f'], type: 'ts'}]);
export const v_u_f_ts = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'u'}, {useShaderTypes: ['f'], type: 'ts'}]);
export const v_u = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'u'}]);
export const v_u_u = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'u'},{useShaderTypes: ['v'], type: 'u'}]);
export const v_u_f_u = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'u'},{useShaderTypes: ['f'], type: 'u'}]);
export const v_sr = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'}]);
export const v_sr_sr_u = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'},{useShaderTypes: ['v'], type: 'sr'},{useShaderTypes: ['v'], type: 'u'}]);
export const v_sr_sr_sr = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'},{useShaderTypes: ['v'], type: 'sr'},{useShaderTypes: ['v'], type: 'sr'}]);
export const v_sr_sr_f_t = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'}, {useShaderTypes: ['v'], type: 'sr'}, {useShaderTypes: ['f'], type: 't'}]);
export const v_sr_sr_f_t_t_u = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'}, {useShaderTypes: ['v'], type: 'sr'}, {useShaderTypes: ['f'], type: 't'}, {useShaderTypes: ['f'], type: 't'}, {useShaderTypes: ['f'], type: 'u'}]);
export const v_sr_sr = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'}, {useShaderTypes: ['v'], type: 'sr'}]);
export const v_sr_u = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'}, {useShaderTypes: ['v'], type: 'u'}]);
export const v_sr_u_u = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'},{useShaderTypes: ['v'], type: 'u'},{useShaderTypes: ['v'], type: 'u'}]);
export const v_sr_u_sr = GPU.createGroupLayout([{useShaderTypes: ['v'], type: 'sr'},{useShaderTypes: ['v'], type: 'u'},{useShaderTypes: ['v'], type: 'sr'}]);
export const c_srw_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'},{useShaderTypes: ['c'], type: 'u'}]);
export const c_srw_u_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'},{useShaderTypes: ['c'], type: 'u'},{useShaderTypes: ['c'], type: 'u'}]);
export const c_sr = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'sr'}]);
export const f_str = GPU.createGroupLayout([{useShaderTypes: ['f'], type: 'str'}]);
export const f_u = GPU.createGroupLayout([{useShaderTypes: ['f'], type: 'u'}]);
export const c_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'u'}]);
export const c_u_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'u'},{useShaderTypes: ['c'], type: 'u'}]);
export const c_sr_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'sr'},{useShaderTypes: ['c'], type: 'u'}]);
export const c_srw = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}]);
export const c_sr_sr = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'sr'},{useShaderTypes: ['c'], type: 'sr'}]);
export const c_sr_sr_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'sr'},{useShaderTypes: ['c'], type: 'sr'},{useShaderTypes: ['c'], type: 'u'}]);
export const c_srw_sr = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'},{useShaderTypes: ['c'], type: 'sr'}]);
export const c_srw_sr_sr = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}]);
export const c_srw_sr_sr_u_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'u'}]);
export const c_srw_sr_sr_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'u'}]);
export const c_srw_sr_sr_sr_sr_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'u'}]);
export const c_srw_sr_sr_sr_u_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'u'}]);
export const c_srw_srw_sr_sr = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}]);
export const c_srw_sr_sr_sr_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'u'}]);
export const c_srw_sr_u_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 'sr'}, {useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'u'}]);
export const c_u_u_u = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'u'}]);
export const c_u_u_sr = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'u'}, {useShaderTypes: ['c'], type: 'sr'}]);
export const c_srw_t = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'srw'}, {useShaderTypes: ['c'], type: 't'}]);
export const c_stw_t = GPU.createGroupLayout([{useShaderTypes: ['c'], type: 'stw'}, {useShaderTypes: ['c'], type: 't'}]);

export const collisionMeshPipeline = GPU.createComputePipeline([c_srw_u, c_sr_sr], await fetch('./script/wgsl/compute/選択/collisionMesh.wgsl').then(x => x.text()));
export const collisionBonePipeline = GPU.createComputePipeline([c_srw_u, c_sr], await fetch('./script/wgsl/compute/ボーンモディファイア/当たり判定.wgsl').then(x => x.text()));

export const calculateBoneModifierLocalMatrixPipeline = GPU.createComputePipeline([c_srw_sr], GPU.createShaderModule(await fetch('./script/wgsl/compute/ボーンモディファイア/適応.wgsl').then(x => x.text())));
export const calculateBoneModifierMatrixPropagatePipeline = GPU.createComputePipeline([c_srw_sr], GPU.createShaderModule(await fetch('./script/wgsl/compute/ボーンモディファイア/伝播.wgsl').then(x => x.text())));
export const calculateBoneModifierWeightToVerticesPipeline = GPU.createComputePipeline([c_srw_sr, c_sr_u], GPU.createShaderModule(await fetch('./script/wgsl/compute/ボーンモディファイア/ウェイト付与.wgsl').then(x => x.text())));
export const adaptBoneModifierToVerticesPipeline = GPU.createComputePipeline([c_srw_sr, c_sr_sr], GPU.createShaderModule(await fetch('./script/wgsl/compute/ボーンモディファイア/子の変形.wgsl').then(x => x.text())));
export const calculateBaseBoneDataPipeline = GPU.createComputePipeline([c_srw_srw_sr_sr], GPU.createShaderModule(await fetch('./script/wgsl/compute/ボーンモディファイア/ベースボーンのデータを作る.wgsl').then(x => x.text())));
export const calculateBoneVerticesPipeline = GPU.createComputePipeline([c_srw_sr_sr], GPU.createShaderModule(await fetch('./script/wgsl/compute/ボーンモディファイア/表示頂点を計算.wgsl').then(x => x.text())));

export const circleSelectVerticesPipeline = GPU.createComputePipeline([c_srw_u,c_sr], circleSelectVertices);
export const boxSelectVerticesPipeline = GPU.createComputePipeline([c_srw_u,c_sr], boxSelectVertices);
export const calculateAllBBoxPipeline = GPU.createComputePipeline([c_srw_sr,c_srw], calculateAllBBox);
export const calculateLimitBBoxPipeline = GPU.createComputePipeline([c_srw_sr,c_sr,c_srw], calculateLimitBBox);
export const modifierTransformPipeline = GPU.createComputePipeline([c_srw_sr, c_sr_sr], modifierTransform);
export const rotateModifierTransformPipeline = GPU.createComputePipeline([c_srw, c_u_u], rotateModifierTransform);
export const lineModifierTransformPipeline = GPU.createComputePipeline([c_srw_sr, c_sr_sr], lineModifierTransform);
export const adaptAllAnimationToVerticesPipeline = GPU.createComputePipeline([c_srw, c_sr_u], adaptAllAnimationToVertices);
export const setModifierWeightToGraphicMeshPipeline = GPU.createComputePipeline([c_srw_sr, c_u_u], setModifierWeightToGraphicMesh);
export const setLineModifierWeightToGraphicMeshPipeline = GPU.createComputePipeline([c_srw_sr, c_sr], setLineModifierWeightToGraphicMesh);
export const animationTransformPipeline = GPU.createComputePipeline([c_srw_sr,c_sr], animationTransform);
export const baseTransformPipeline = GPU.createComputePipeline([c_srw,c_sr], baseTransform);
export const calculateAllAveragePipeline = GPU.createComputePipeline([c_srw_sr,c_srw], calculateAllAverage);
export const MarchingSquaresPipeline = GPU.createComputePipeline([c_srw_t], GPU.createShaderModule(await fetch('script/wgsl/compute/MarchingSquares.wgsl').then(x => x.text())));
export const updateCenterPositionPipeline = GPU.createComputePipeline([c_srw_sr, c_u], updateCenterPosition);

// レンダーパイプライン
export const pipelineFortextureToCVS = GPU.createRenderPipeline([f_ts_t], v_cvsDraw, f_cvsDraw, [], "cvsCopy");
export const renderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr_sr_f_t_t_u], v_renderShaderModule, f_renderShaderModule, [["u"]], "2d", "t");
export const maskRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr_sr_f_t], v_maskRenderShaderModule, f_maskRenderShaderModule, [["u"]], "mask", "t");
export const circlesFromAllVerticesRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr, v_u_f_u], v_allSquareRenderShaderModule, f_squareRenderShaderModule, [], "2d", "s");
export const circlesFromPartVerticesRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr, v_u_f_u, v_sr], v_partSquareRenderShaderModule, f_squareRenderShaderModule, [], "2d", "s");
export const BBoxRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr, v_u_f_u], v_BBoxRenderShaderModule, f_strokeRenderShaderModule, [], "2d", "s");
export const lineRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr, v_u_f_u], v_lineRenderShaderModule, f_fillRenderShaderModule, [], "2d", "s");
export const graphicMeshsMeshRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr_sr, v_u_f_u], v_graphicMeshsMeshRenderShaderModule, f_fillRenderShaderModule, [], "2d", "s");
export const modifierMeshRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr_u, v_u_f_u], v_modifierMeshRenderShaderModule, f_fillRenderShaderModule, [], "2d", "s");
export const modifierFrameRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr_u, v_u_f_u], v_modifierFrameRenderShaderModule, f_fillRenderShaderModule, [], "2d", "s");
export const modifierFrame2RenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr_u, v_u_f_u], v_modifierFrame2RenderShaderModule, f_fillRenderShaderModule, [], "2d", "t");
export const bezierRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr, v_u_f_u], v_bezierRenderShaderModule, f_fillRenderShaderModule, [], "2d", "s");
export const textureRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_u, v_u_f_t, f_u], v_PSRSquareRenderShaderModule, f_textureRenderShaderModule, [], "2d", "s");
export const rotateModifierRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_u, v_u_f_u], await fetch('script/wgsl/レンダー/回転モディファイア/v_表示.wgsl').then(x => x.text()), f_fillRenderShaderModule, [], "2d", "s");
export const boneRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr, v_u_f_u], await fetch('script/wgsl/レンダー/ボーン/v_ボーンの表示.wgsl').then(x => x.text()), f_fillRenderShaderModule, [], "2d", "s");
export const partBoneRenderPipeline = GPU.createRenderPipeline([v_u_u_f_ts, v_sr, v_u_f_u, v_sr], await fetch('script/wgsl/レンダー/ボーン/v_特定のボーンの表示.wgsl').then(x => x.text()), f_fillRenderShaderModule, [], "2d", "s");

export const sampler = GPU.createTextureSampler();

export const activeColorBuffer = GPU.createUniformBuffer(4 * 4,[1,1,0,1],["f32"]);
export const referenceCoordinatesColorBuffer = GPU.createUniformBuffer(4 * 4,[1,0,1,1],["f32"]);
export const sizeBuffer = GPU.createUniformBuffer(4,[20],["f32"]);
export const inactiveColorBuffer = GPU.createUniformBuffer(4 * 4,[0,0,1,1],["f32"]);

export const boneSizeBuffer = GPU.createUniformBuffer(4,[0.1],["f32"]);
export const activeBoneRendringColorBuffer = GPU.createUniformBuffer(4 * 4,[0,0,0,1],["f32"]);
export const activeBoneRendringConfigGroup = GPU.createGroup(v_u_f_u,[{item: boneSizeBuffer, type: "b"},{item: activeBoneRendringColorBuffer, type: "b"}]);
export const inactiveBoneRendringColorBuffer = GPU.createUniformBuffer(4 * 4,[0,0,0,0.2],["f32"]);
export const inactiveBoneRendringConfigGroup = GPU.createGroup(v_u_f_u,[{item: boneSizeBuffer, type: "b"},{item: inactiveBoneRendringColorBuffer, type: "b"}]);

export const activeColorGroup = GPU.createGroup(v_u_f_u,[{item: sizeBuffer, type: "b"},{item: activeColorBuffer, type: "b"}]);
export const referenceCoordinatesColorGroup = GPU.createGroup(v_u_f_u,[{item: sizeBuffer, type: "b"},{item: referenceCoordinatesColorBuffer, type: "b"}]);
export const inactiveColorGroup = GPU.createGroup(v_u_f_u,[{item: sizeBuffer, type: "b"},{item: inactiveColorBuffer, type: "b"}]);

export const BBoxLineWidthSizeBuffer = GPU.createUniformBuffer(4,[5],["f32"]);
export const inactiveBBoxColorBuffer = GPU.createUniformBuffer(4 * 4,[0,0,0,0.1],["f32"]);
export const inactiveBBoxColorGroup = GPU.createGroup(v_u_f_u,[{item: BBoxLineWidthSizeBuffer, type: "b"},{item: inactiveBBoxColorBuffer, type: "b"}]);
export const activeBBoxColorBuffer = GPU.createUniformBuffer(4 * 4,[0,0,0,1],["f32"]);
export const activeBBoxColorGroup = GPU.createGroup(v_u_f_u,[{item: BBoxLineWidthSizeBuffer, type: "b"},{item: activeBBoxColorBuffer, type: "b"}]);

export const isNotTexture = await GPU.imageToTexture2D("config/画像データ/画像未設定.png");

export const rotateModifierSizeBuffer = GPU.createUniformBuffer(2 * 4,[20],["f32"]);
export const activeRotateModifierColorBuffer = GPU.createUniformBuffer(4 * 4,[1,0,0,1],["f32"]);
export const inactiveRotateModifierColorBuffer = GPU.createUniformBuffer(4 * 4,[1,0,0,0.2],["f32"]);
export const editRotateModifierColorBuffer = GPU.createUniformBuffer(4 * 4,[1,1,0,0.9],["f32"]);
export const editRotateModifierColorGroup = GPU.createGroup(v_u_f_u,[rotateModifierSizeBuffer, editRotateModifierColorBuffer]);
export const activeRotateModifierColorGroup = GPU.createGroup(v_u_f_u,[rotateModifierSizeBuffer, activeRotateModifierColorBuffer]);
export const inactiveRotateModifierColorGroup = GPU.createGroup(v_u_f_u,[rotateModifierSizeBuffer, inactiveRotateModifierColorBuffer]);