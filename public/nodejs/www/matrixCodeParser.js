export function parseMatrixCode(txt) {
    // 1. Parse viewBox or width/height to get dimensions
    let vbMatch = txt.match(/viewBox\s*=\s*"([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/i);
    let vw = 1, vh = 1;
    if (vbMatch) {
        vw = parseFloat(vbMatch[3]);
        vh = parseFloat(vbMatch[4]);
    } else {
        let wMatch = txt.match(/width\s*=\s*"([\d.]+)mm"/i);
        let hMatch = txt.match(/height\s*=\s*"([\d.]+)mm"/i);
        if (wMatch && hMatch) {
            vw = parseFloat(wMatch[1]);
            vh = parseFloat(hMatch[1]);
        }
    }

    // 2. Parse marker groups
    const groupRe = /<g[^>]*transform\s*=\s*"translate\(([\d.-]+)\s*,\s*([\d.-]+)\)"[^>]*>([\s\S]*?)<\/g>/gi;
    const rectRe = /<rect[^>]*x\s*=\s*"([\d.-]+)"[^>]*y\s*=\s*"([\d.-]+)"[^>]*width\s*=\s*"([\d.-]+)"[^>]*height\s*=\s*"([\d.-]+)"/i;
    const markerGroups = [];
    while ((m = groupRe.exec(txt))) {
        const gx = parseFloat(m[1]);
        const gy = parseFloat(m[2]);
        const r = rectRe.exec(m[3]);
        if (r) {
            const rw = parseFloat(r[3]), rh = parseFloat(r[4]);
            markerGroups.push({ cx: gx + parseFloat(r[1]) + rw / 2, cy: gy + parseFloat(r[2]) + rh / 2 });
        }
    }

    // 4. Sort and assign template markers
    let templateMarkers = null;
    if (markerGroups.length >= 6) {
        const sortedByY = markerGroups.slice().sort((a, b) => a.cy - b.cy);
        const top = sortedByY.slice(0, 3).sort((a, b) => a.cx - b.cx);
        const bottom = sortedByY.slice(-3).sort((a, b) => a.cx - b.cx);
        templateMarkers = [...top, ...bottom];
    }

    return {
        vw, vh, templateMarkers,
        cornerWeights: null // This feature is disabled for robustness.
    };
}
