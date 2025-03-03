const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];

const mul = (a, v) => a.map(i => i * v);

const div = (a, v) => a.map(i => i / v);

const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

const norm_squared = a => dot(a, a);

const completion = (t, bz) => {
    const t_ = 1 - t;
     return add(add(add(mul(bz[0], t_ * t_ * t_),
                     mul(bz[1], 3 * t_ * t_ * t)),
                     mul(bz[2], 3 * t_ * t * t)),
                     mul(bz[3], t * t * t));
};

const split_bezier = bz => {
    const center = completion(0.5, bz);
    return [
        [
            bz[0],
            div(add(bz[0], bz[1]), 2),
            div(add(add(bz[0], mul(bz[1], 2)), bz[2]), 4),
            center
        ],
        [
            center,
            div(add(add(bz[1], mul(bz[2], 2)), bz[3]), 4),
            div(add(bz[2], bz[3]), 2),
            bz[3]
        ]
    ];
};

const diff2_to_line = (line, p) => {
    const ps = sub(line[0], p);
    const [a, b] = sub(line[1], line[0]);
    const n2 = norm_squared([a, b]);
    const tt = -(a * ps[0] + b * ps[1]);
    if (tt < 0)
        return norm_squared(ps);
    else if (tt > n2)
        return norm_squared(sub(line[1], p));
    const f1 = a * ps[1] - b * ps[0];
    return f1 * f1 / n2;
};

const diff2_to_polygon = (bz, p) => {
    return Math.min(
        diff2_to_line([bz[0], bz[1]], p),
        diff2_to_line([bz[1], bz[2]], p),
        diff2_to_line([bz[2], bz[3]], p),
        diff2_to_line([bz[3], bz[0]], p)
    );
};

const done_or_recursive = (bz, p, t0, t1) => {
    const n2 = norm_squared(sub(bz[3], bz[0]));
    if (n2 < 0.001) {
        const t = (t0 + t1) * 0.5; // 中央の t を求める
        const pointOnCurve = completion(t, bz); // ベジェ曲線上の点を取得
        const distanceSquared = norm_squared(sub(pointOnCurve, p)); // 距離の二乗を計算
        return { t, dist: Math.sqrt(distanceSquared) }; // t と距離を返す
    }
    return neighbor_bezier(bz, p, t0, t1);
};

export function neighbor_bezier(bz, p, t0, t1) {
    const splitbz = split_bezier(bz);
    const d0 = diff2_to_polygon(splitbz[0], p);
    const d1 = diff2_to_polygon(splitbz[1], p);
    const tcenter = (t0 + t1) * 0.5;
    return d0 < d1
        ? done_or_recursive(splitbz[0], p, t0, tcenter)
        : done_or_recursive(splitbz[1], p, tcenter, t1);
};

export function bezierNormal(bz, t) {
    return mul(sub(bz[1], bz[0]), -3 * (1 - t) ** 2) + mul(sub(bz[2], bz[1]), 6 * (1 - t) * t) + mul(sub(bz[3], bz[2]), 3 * t ** 2);
}