/*! Hanzi Writer v3.0.0 | MIT License | (c) 2014 David Chanin | https://github.com/chanind/hanzi-writer
 * 한자어 탐정단용으로 TypeScript 원본을 한 파일로 묶은 빌드 (내용 변경 없음) */
(function(){
var defs={},cache={};
function define(id,deps,fn){defs[id]={deps:deps,fn:fn};}
function resolve(base,id){
  if(id.charAt(0)!=='.') return id;
  var parts=base.split('/');parts.pop();
  id.split('/').forEach(function(p){if(p==='..')parts.pop();else if(p!=='.')parts.push(p);});
  return parts.join('/');
}
function req(id){
  if(!defs[id]&&defs[id+'/index']) id=id+'/index';
  if(cache[id]) return cache[id].exports;
  var d=defs[id]; if(!d) throw new Error('module not found: '+id);
  var m={exports:{}}; cache[id]=m;
  var args=d.deps.map(function(x){ if(x==='require') return function(y){return req(resolve(id,y));}; if(x==='exports') return m.exports; if(x==='module') return m; return req(resolve(id,x)); });
  var r=d.fn.apply(null,args); if(r!==undefined) m.exports=r;
  return m.exports;
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
define("src/renderers/RenderTargetBase", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RenderTargetBase {
        constructor(node) {
            this.node = node;
        }
        addPointerStartListener(callback) {
            this.node.addEventListener('mousedown', (evt) => {
                callback(this._eventify(evt, this._getMousePoint));
            });
            this.node.addEventListener('touchstart', (evt) => {
                callback(this._eventify(evt, this._getTouchPoint));
            });
        }
        addPointerMoveListener(callback) {
            this.node.addEventListener('mousemove', (evt) => {
                callback(this._eventify(evt, this._getMousePoint));
            });
            this.node.addEventListener('touchmove', (evt) => {
                callback(this._eventify(evt, this._getTouchPoint));
            });
        }
        addPointerEndListener(callback) {
            document.addEventListener('mouseup', callback);
            document.addEventListener('touchend', callback);
        }
        getBoundingClientRect() {
            return this.node.getBoundingClientRect();
        }
        updateDimensions(width, height) {
            this.node.setAttribute('width', `${width}`);
            this.node.setAttribute('height', `${height}`);
        }
        _eventify(evt, pointFunc) {
            return {
                getPoint: () => pointFunc.call(this, evt),
                preventDefault: () => evt.preventDefault(),
            };
        }
        _getMousePoint(evt) {
            const { left, top } = this.getBoundingClientRect();
            const x = evt.clientX - left;
            const y = evt.clientY - top;
            return { x, y };
        }
        _getTouchPoint(evt) {
            const { left, top } = this.getBoundingClientRect();
            const x = evt.touches[0].clientX - left;
            const y = evt.touches[0].clientY - top;
            return { x, y };
        }
    }
    exports.default = RenderTargetBase;
});
define("src/Positioner", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CHARACTER_BOUNDS = [
        { x: 0, y: -124 },
        { x: 1024, y: 900 },
    ];
    const [from, to] = CHARACTER_BOUNDS;
    const preScaledWidth = to.x - from.x;
    const preScaledHeight = to.y - from.y;
    class Positioner {
        constructor(options) {
            const { padding, width, height } = options;
            this.padding = padding;
            this.width = width;
            this.height = height;
            const effectiveWidth = width - 2 * padding;
            const effectiveHeight = height - 2 * padding;
            const scaleX = effectiveWidth / preScaledWidth;
            const scaleY = effectiveHeight / preScaledHeight;
            this.scale = Math.min(scaleX, scaleY);
            const xCenteringBuffer = padding + (effectiveWidth - this.scale * preScaledWidth) / 2;
            const yCenteringBuffer = padding + (effectiveHeight - this.scale * preScaledHeight) / 2;
            this.xOffset = -1 * from.x * this.scale + xCenteringBuffer;
            this.yOffset = -1 * from.y * this.scale + yCenteringBuffer;
        }
        convertExternalPoint(point) {
            const x = (point.x - this.xOffset) / this.scale;
            const y = (this.height - this.yOffset - point.y) / this.scale;
            return { x, y };
        }
    }
    exports.default = Positioner;
});
define("src/renderers/HanziWriterRendererBase", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/typings/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("src/utils", ["require", "exports"], function (require, exports) {
    "use strict";
    var _a, _b, _c;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.noop = exports.isMsBrowser = exports.trim = exports.selectIndex = exports.fixIndex = exports.assign = exports._assign = exports.cancelAnimationFrame = exports.requestAnimationFrame = exports.performanceNow = void 0;
    exports.arrLast = arrLast;
    exports.copyAndMergeDeep = copyAndMergeDeep;
    exports.inflate = inflate;
    exports.counter = counter;
    exports.average = average;
    exports.timeout = timeout;
    exports.colorStringToVals = colorStringToVals;
    exports.objRepeat = objRepeat;
    exports.objRepeatCb = objRepeatCb;
    const globalObj = typeof window === 'undefined' ? global : window;
    exports.performanceNow = (globalObj.performance && (() => globalObj.performance.now())) || (() => Date.now());
    exports.requestAnimationFrame = ((_a = globalObj.requestAnimationFrame) === null || _a === void 0 ? void 0 : _a.bind(globalObj)) ||
        ((callback) => setTimeout(() => callback((0, exports.performanceNow)()), 1000 / 60));
    exports.cancelAnimationFrame = ((_b = globalObj.cancelAnimationFrame) === null || _b === void 0 ? void 0 : _b.bind(globalObj)) || clearTimeout;
    const _assign = function (target, ...overrides) {
        const overrideTarget = Object(target);
        overrides.forEach((override) => {
            if (override != null) {
                for (const key in override) {
                    if (Object.prototype.hasOwnProperty.call(override, key)) {
                        overrideTarget[key] = override[key];
                    }
                }
            }
        });
        return overrideTarget;
    };
    exports._assign = _assign;
    exports.assign = Object.assign || exports._assign;
    function arrLast(arr) {
        return arr[arr.length - 1];
    }
    const fixIndex = (index, length) => {
        if (index < 0) {
            return length + index;
        }
        return index;
    };
    exports.fixIndex = fixIndex;
    const selectIndex = (arr, index) => {
        return arr[(0, exports.fixIndex)(index, arr.length)];
    };
    exports.selectIndex = selectIndex;
    function copyAndMergeDeep(base, override) {
        const output = Object.assign({}, base);
        for (const key in override) {
            const baseVal = base[key];
            const overrideVal = override[key];
            if (baseVal === overrideVal) {
                continue;
            }
            if (baseVal &&
                overrideVal &&
                typeof baseVal === 'object' &&
                typeof overrideVal === 'object' &&
                !Array.isArray(overrideVal)) {
                output[key] = copyAndMergeDeep(baseVal, overrideVal);
            }
            else {
                output[key] = overrideVal;
            }
        }
        return output;
    }
    function inflate(scope, obj) {
        const parts = scope.split('.');
        const final = {};
        let current = final;
        for (let i = 0; i < parts.length; i++) {
            const cap = i === parts.length - 1 ? obj : {};
            current[parts[i]] = cap;
            current = cap;
        }
        return final;
    }
    let count = 0;
    function counter() {
        count++;
        return count;
    }
    function average(arr) {
        const sum = arr.reduce((acc, val) => val + acc, 0);
        return sum / arr.length;
    }
    function timeout(duration = 0) {
        return new Promise((resolve) => setTimeout(resolve, duration));
    }
    function colorStringToVals(colorString) {
        const normalizedColor = colorString.toUpperCase().trim();
        if (/^#([A-F0-9]{3}){1,2}$/.test(normalizedColor)) {
            let hexParts = normalizedColor.substring(1).split('');
            if (hexParts.length === 3) {
                hexParts = [
                    hexParts[0],
                    hexParts[0],
                    hexParts[1],
                    hexParts[1],
                    hexParts[2],
                    hexParts[2],
                ];
            }
            const hexStr = `${hexParts.join('')}`;
            return {
                r: parseInt(hexStr.slice(0, 2), 16),
                g: parseInt(hexStr.slice(2, 4), 16),
                b: parseInt(hexStr.slice(4, 6), 16),
                a: 1,
            };
        }
        const rgbMatch = normalizedColor.match(/^RGBA?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d*\.?\d+))?\)$/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1], 10),
                g: parseInt(rgbMatch[2], 10),
                b: parseInt(rgbMatch[3], 10),
                a: parseFloat(rgbMatch[4] || 1, 10),
            };
        }
        throw new Error(`Invalid color: ${colorString}`);
    }
    const trim = (string) => string.replace(/^\s+/, '').replace(/\s+$/, '');
    exports.trim = trim;
    function objRepeat(item, times) {
        const obj = {};
        for (let i = 0; i < times; i++) {
            obj[i] = item;
        }
        return obj;
    }
    function objRepeatCb(times, cb) {
        const obj = {};
        for (let i = 0; i < times; i++) {
            obj[i] = cb(i);
        }
        return obj;
    }
    const ua = ((_c = globalObj.navigator) === null || _c === void 0 ? void 0 : _c.userAgent) || '';
    exports.isMsBrowser = ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0;
    const noop = () => { };
    exports.noop = noop;
});
define("src/geometry", ["require", "exports", "src/utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendStart = exports._filterParallelPoints = exports.rotate = exports.normalizeCurve = exports.outlineCurve = exports.subdivideCurve = exports.frechetDist = exports._extendPointOnLine = exports.cosineSimilarity = exports.length = exports.round = exports.equals = exports.distance = exports.magnitude = exports.subtract = void 0;
    exports.getPathString = getPathString;
    const subtract = (p1, p2) => ({ x: p1.x - p2.x, y: p1.y - p2.y });
    exports.subtract = subtract;
    const magnitude = (point) => Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.y, 2));
    exports.magnitude = magnitude;
    const distance = (point1, point2) => (0, exports.magnitude)((0, exports.subtract)(point1, point2));
    exports.distance = distance;
    const equals = (point1, point2) => point1.x === point2.x && point1.y === point2.y;
    exports.equals = equals;
    const round = (point, precision = 1) => {
        const multiplier = precision * 10;
        return {
            x: Math.round(multiplier * point.x) / multiplier,
            y: Math.round(multiplier * point.y) / multiplier,
        };
    };
    exports.round = round;
    const length = (points) => {
        let lastPoint = points[0];
        const pointsSansFirst = points.slice(1);
        return pointsSansFirst.reduce((acc, point) => {
            const dist = (0, exports.distance)(point, lastPoint);
            lastPoint = point;
            return acc + dist;
        }, 0);
    };
    exports.length = length;
    const cosineSimilarity = (point1, point2) => {
        const rawDotProduct = point1.x * point2.x + point1.y * point2.y;
        return rawDotProduct / (0, exports.magnitude)(point1) / (0, exports.magnitude)(point2);
    };
    exports.cosineSimilarity = cosineSimilarity;
    const _extendPointOnLine = (p1, p2, dist) => {
        const vect = (0, exports.subtract)(p2, p1);
        const norm = dist / (0, exports.magnitude)(vect);
        return { x: p2.x + norm * vect.x, y: p2.y + norm * vect.y };
    };
    exports._extendPointOnLine = _extendPointOnLine;
    const frechetDist = (curve1, curve2) => {
        const longCurve = curve1.length >= curve2.length ? curve1 : curve2;
        const shortCurve = curve1.length >= curve2.length ? curve2 : curve1;
        const calcVal = (i, j, prevResultsCol, curResultsCol) => {
            if (i === 0 && j === 0) {
                return (0, exports.distance)(longCurve[0], shortCurve[0]);
            }
            if (i > 0 && j === 0) {
                return Math.max(prevResultsCol[0], (0, exports.distance)(longCurve[i], shortCurve[0]));
            }
            const lastResult = curResultsCol[curResultsCol.length - 1];
            if (i === 0 && j > 0) {
                return Math.max(lastResult, (0, exports.distance)(longCurve[0], shortCurve[j]));
            }
            return Math.max(Math.min(prevResultsCol[j], prevResultsCol[j - 1], lastResult), (0, exports.distance)(longCurve[i], shortCurve[j]));
        };
        let prevResultsCol = [];
        for (let i = 0; i < longCurve.length; i++) {
            const curResultsCol = [];
            for (let j = 0; j < shortCurve.length; j++) {
                curResultsCol.push(calcVal(i, j, prevResultsCol, curResultsCol));
            }
            prevResultsCol = curResultsCol;
        }
        return prevResultsCol[shortCurve.length - 1];
    };
    exports.frechetDist = frechetDist;
    const subdivideCurve = (curve, maxLen = 0.05) => {
        const newCurve = curve.slice(0, 1);
        for (const point of curve.slice(1)) {
            const prevPoint = newCurve[newCurve.length - 1];
            const segLen = (0, exports.distance)(point, prevPoint);
            if (segLen > maxLen) {
                const numNewPoints = Math.ceil(segLen / maxLen);
                const newSegLen = segLen / numNewPoints;
                for (let i = 0; i < numNewPoints; i++) {
                    newCurve.push((0, exports._extendPointOnLine)(point, prevPoint, -1 * newSegLen * (i + 1)));
                }
            }
            else {
                newCurve.push(point);
            }
        }
        return newCurve;
    };
    exports.subdivideCurve = subdivideCurve;
    const outlineCurve = (curve, numPoints = 30) => {
        const curveLen = (0, exports.length)(curve);
        const segmentLen = curveLen / (numPoints - 1);
        const outlinePoints = [curve[0]];
        const endPoint = (0, utils_1.arrLast)(curve);
        const remainingCurvePoints = curve.slice(1);
        for (let i = 0; i < numPoints - 2; i++) {
            let lastPoint = (0, utils_1.arrLast)(outlinePoints);
            let remainingDist = segmentLen;
            let outlinePointFound = false;
            while (!outlinePointFound) {
                const nextPointDist = (0, exports.distance)(lastPoint, remainingCurvePoints[0]);
                if (nextPointDist < remainingDist) {
                    remainingDist -= nextPointDist;
                    lastPoint = remainingCurvePoints.shift();
                }
                else {
                    const nextPoint = (0, exports._extendPointOnLine)(lastPoint, remainingCurvePoints[0], remainingDist - nextPointDist);
                    outlinePoints.push(nextPoint);
                    outlinePointFound = true;
                }
            }
        }
        outlinePoints.push(endPoint);
        return outlinePoints;
    };
    exports.outlineCurve = outlineCurve;
    const normalizeCurve = (curve) => {
        const outlinedCurve = (0, exports.outlineCurve)(curve);
        const meanX = (0, utils_1.average)(outlinedCurve.map((point) => point.x));
        const meanY = (0, utils_1.average)(outlinedCurve.map((point) => point.y));
        const mean = { x: meanX, y: meanY };
        const translatedCurve = outlinedCurve.map((point) => (0, exports.subtract)(point, mean));
        const scale = Math.sqrt((0, utils_1.average)([
            Math.pow(translatedCurve[0].x, 2) + Math.pow(translatedCurve[0].y, 2),
            Math.pow((0, utils_1.arrLast)(translatedCurve).x, 2) + Math.pow((0, utils_1.arrLast)(translatedCurve).y, 2),
        ]));
        const scaledCurve = translatedCurve.map((point) => ({
            x: point.x / scale,
            y: point.y / scale,
        }));
        return (0, exports.subdivideCurve)(scaledCurve);
    };
    exports.normalizeCurve = normalizeCurve;
    const rotate = (curve, theta) => {
        return curve.map((point) => ({
            x: Math.cos(theta) * point.x - Math.sin(theta) * point.y,
            y: Math.sin(theta) * point.x + Math.cos(theta) * point.y,
        }));
    };
    exports.rotate = rotate;
    const _filterParallelPoints = (points) => {
        if (points.length < 3)
            return points;
        const filteredPoints = [points[0], points[1]];
        points.slice(2).forEach((point) => {
            const numFilteredPoints = filteredPoints.length;
            const curVect = (0, exports.subtract)(point, filteredPoints[numFilteredPoints - 1]);
            const prevVect = (0, exports.subtract)(filteredPoints[numFilteredPoints - 1], filteredPoints[numFilteredPoints - 2]);
            const isParallel = curVect.y * prevVect.x - curVect.x * prevVect.y === 0;
            if (isParallel) {
                filteredPoints.pop();
            }
            filteredPoints.push(point);
        });
        return filteredPoints;
    };
    exports._filterParallelPoints = _filterParallelPoints;
    function getPathString(points, close = false) {
        const start = (0, exports.round)(points[0]);
        const remainingPoints = points.slice(1);
        let pathString = `M ${start.x} ${start.y}`;
        remainingPoints.forEach((point) => {
            const roundedPoint = (0, exports.round)(point);
            pathString += ` L ${roundedPoint.x} ${roundedPoint.y}`;
        });
        if (close) {
            pathString += 'Z';
        }
        return pathString;
    }
    const extendStart = (points, dist) => {
        const filteredPoints = (0, exports._filterParallelPoints)(points);
        if (filteredPoints.length < 2)
            return filteredPoints;
        const p1 = filteredPoints[1];
        const p2 = filteredPoints[0];
        const newStart = (0, exports._extendPointOnLine)(p1, p2, dist);
        const extendedPoints = filteredPoints.slice(1);
        extendedPoints.unshift(newStart);
        return extendedPoints;
    };
    exports.extendStart = extendStart;
});
define("src/models/Stroke", ["require", "exports", "src/geometry"], function (require, exports, geometry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Stroke {
        constructor(path, points, strokeNum, isInRadical = false) {
            this.path = path;
            this.points = points;
            this.strokeNum = strokeNum;
            this.isInRadical = isInRadical;
        }
        getStartingPoint() {
            return this.points[0];
        }
        getEndingPoint() {
            return this.points[this.points.length - 1];
        }
        getLength() {
            return (0, geometry_1.length)(this.points);
        }
        getVectors() {
            let lastPoint = this.points[0];
            const pointsSansFirst = this.points.slice(1);
            return pointsSansFirst.map((point) => {
                const vector = (0, geometry_1.subtract)(point, lastPoint);
                lastPoint = point;
                return vector;
            });
        }
        getDistance(point) {
            const distances = this.points.map((strokePoint) => (0, geometry_1.distance)(strokePoint, point));
            return Math.min(...distances);
        }
        getAverageDistance(points) {
            const totalDist = points.reduce((acc, point) => acc + this.getDistance(point), 0);
            return totalDist / points.length;
        }
    }
    exports.default = Stroke;
});
define("src/models/Character", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Character {
        constructor(symbol, strokes) {
            this.symbol = symbol;
            this.strokes = strokes;
        }
    }
    exports.default = Character;
});
define("src/Mutation", ["require", "exports", "src/utils"], function (require, exports, utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Delay {
        constructor(duration) {
            this._duration = duration;
            this._startTime = null;
            this._paused = false;
            this.scope = `delay.${duration}`;
        }
        run() {
            this._startTime = (0, utils_2.performanceNow)();
            this._runningPromise = new Promise((resolve) => {
                this._resolve = resolve;
                this._timeout = setTimeout(() => this.cancel(), this._duration);
            });
            return this._runningPromise;
        }
        pause() {
            if (this._paused)
                return;
            const elapsedDelay = (0, utils_2.performanceNow)() - (this._startTime || 0);
            this._duration = Math.max(0, this._duration - elapsedDelay);
            clearTimeout(this._timeout);
            this._paused = true;
        }
        resume() {
            if (!this._paused)
                return;
            this._startTime = (0, utils_2.performanceNow)();
            this._timeout = setTimeout(() => this.cancel(), this._duration);
            this._paused = false;
        }
        cancel() {
            clearTimeout(this._timeout);
            if (this._resolve) {
                this._resolve();
            }
            this._resolve = undefined;
        }
    }
    class Mutation {
        constructor(scope, valuesOrCallable, options = {}) {
            this._tick = (timing) => {
                if (this._startPauseTime !== null) {
                    return;
                }
                const progress = Math.min(1, (timing - this._startTime - this._pausedDuration) / this._duration);
                if (progress === 1) {
                    this._renderState.updateState(this._values);
                    this._frameHandle = undefined;
                    this.cancel(this._renderState);
                }
                else {
                    const easedProgress = ease(progress);
                    const stateChanges = getPartialValues(this._startState, this._values, easedProgress);
                    this._renderState.updateState(stateChanges);
                    this._frameHandle = (0, utils_2.requestAnimationFrame)(this._tick);
                }
            };
            this.scope = scope;
            this._valuesOrCallable = valuesOrCallable;
            this._duration = options.duration || 0;
            this._force = options.force;
            this._pausedDuration = 0;
            this._startPauseTime = null;
        }
        run(renderState) {
            if (!this._values)
                this._inflateValues(renderState);
            if (this._duration === 0)
                renderState.updateState(this._values);
            if (this._duration === 0 || isAlreadyAtEnd(renderState.state, this._values)) {
                return Promise.resolve();
            }
            this._renderState = renderState;
            this._startState = renderState.state;
            this._startTime = (0, utils_2.performanceNow)();
            this._frameHandle = (0, utils_2.requestAnimationFrame)(this._tick);
            return new Promise((resolve) => {
                this._resolve = resolve;
            });
        }
        _inflateValues(renderState) {
            let values = this._valuesOrCallable;
            if (typeof this._valuesOrCallable === 'function') {
                values = this._valuesOrCallable(renderState.state);
            }
            this._values = (0, utils_2.inflate)(this.scope, values);
        }
        pause() {
            if (this._startPauseTime !== null) {
                return;
            }
            if (this._frameHandle) {
                (0, utils_2.cancelAnimationFrame)(this._frameHandle);
            }
            this._startPauseTime = (0, utils_2.performanceNow)();
        }
        resume() {
            if (this._startPauseTime === null) {
                return;
            }
            this._frameHandle = (0, utils_2.requestAnimationFrame)(this._tick);
            this._pausedDuration += (0, utils_2.performanceNow)() - this._startPauseTime;
            this._startPauseTime = null;
        }
        cancel(renderState) {
            var _a;
            (_a = this._resolve) === null || _a === void 0 ? void 0 : _a.call(this);
            this._resolve = undefined;
            (0, utils_2.cancelAnimationFrame)(this._frameHandle || -1);
            this._frameHandle = undefined;
            if (this._force) {
                if (!this._values)
                    this._inflateValues(renderState);
                renderState.updateState(this._values);
            }
        }
    }
    Mutation.Delay = Delay;
    exports.default = Mutation;
    function getPartialValues(startValues, endValues, progress) {
        const target = {};
        for (const key in endValues) {
            const endValue = endValues[key];
            const startValue = startValues === null || startValues === void 0 ? void 0 : startValues[key];
            if (typeof startValue === 'number' && typeof endValue === 'number' && endValue >= 0) {
                target[key] = progress * (endValue - startValue) + startValue;
            }
            else {
                target[key] = getPartialValues(startValue, endValue, progress);
            }
        }
        return target;
    }
    function isAlreadyAtEnd(startValues, endValues) {
        for (const key in endValues) {
            const endValue = endValues[key];
            const startValue = startValues === null || startValues === void 0 ? void 0 : startValues[key];
            if (endValue >= 0) {
                if (endValue !== startValue) {
                    return false;
                }
            }
            else if (!isAlreadyAtEnd(startValue, endValue)) {
                return false;
            }
        }
        return true;
    }
    const ease = (x) => -Math.cos(x * Math.PI) / 2 + 0.5;
});
define("src/RenderState", ["require", "exports", "src/utils"], function (require, exports, utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RenderState {
        constructor(character, options, onStateChange = utils_3.noop) {
            this._mutationChains = [];
            this._onStateChange = onStateChange;
            this.state = {
                options: {
                    drawingFadeDuration: options.drawingFadeDuration,
                    drawingWidth: options.drawingWidth,
                    drawingColor: (0, utils_3.colorStringToVals)(options.drawingColor),
                    strokeColor: (0, utils_3.colorStringToVals)(options.strokeColor),
                    outlineColor: (0, utils_3.colorStringToVals)(options.outlineColor),
                    radicalColor: (0, utils_3.colorStringToVals)(options.radicalColor || options.strokeColor),
                    highlightColor: (0, utils_3.colorStringToVals)(options.highlightColor),
                },
                character: {
                    main: {
                        opacity: options.showCharacter ? 1 : 0,
                        strokes: {},
                    },
                    outline: {
                        opacity: options.showOutline ? 1 : 0,
                        strokes: {},
                    },
                    highlight: {
                        opacity: 1,
                        strokes: {},
                    },
                },
                userStrokes: null,
            };
            for (let i = 0; i < character.strokes.length; i++) {
                this.state.character.main.strokes[i] = {
                    opacity: 1,
                    displayPortion: 1,
                };
                this.state.character.outline.strokes[i] = {
                    opacity: 1,
                    displayPortion: 1,
                };
                this.state.character.highlight.strokes[i] = {
                    opacity: 0,
                    displayPortion: 1,
                };
            }
        }
        overwriteOnStateChange(onStateChange) {
            this._onStateChange = onStateChange;
        }
        updateState(stateChanges) {
            const nextState = (0, utils_3.copyAndMergeDeep)(this.state, stateChanges);
            this._onStateChange(nextState, this.state);
            this.state = nextState;
        }
        run(mutations, options = {}) {
            const scopes = mutations.map((mut) => mut.scope);
            this.cancelMutations(scopes);
            return new Promise((resolve) => {
                const mutationChain = {
                    _isActive: true,
                    _index: 0,
                    _resolve: resolve,
                    _mutations: mutations,
                    _loop: options.loop,
                    _scopes: scopes,
                };
                this._mutationChains.push(mutationChain);
                this._run(mutationChain);
            });
        }
        _run(mutationChain) {
            if (!mutationChain._isActive) {
                return;
            }
            const mutations = mutationChain._mutations;
            if (mutationChain._index >= mutations.length) {
                if (mutationChain._loop) {
                    mutationChain._index = 0;
                }
                else {
                    mutationChain._isActive = false;
                    this._mutationChains = this._mutationChains.filter((chain) => chain !== mutationChain);
                    mutationChain._resolve({ canceled: false });
                    return;
                }
            }
            const activeMutation = mutationChain._mutations[mutationChain._index];
            activeMutation.run(this).then(() => {
                if (mutationChain._isActive) {
                    mutationChain._index++;
                    this._run(mutationChain);
                }
            });
        }
        _getActiveMutations() {
            return this._mutationChains.map((chain) => chain._mutations[chain._index]);
        }
        pauseAll() {
            this._getActiveMutations().forEach((mutation) => mutation.pause());
        }
        resumeAll() {
            this._getActiveMutations().forEach((mutation) => mutation.resume());
        }
        cancelMutations(scopesToCancel) {
            for (const chain of this._mutationChains) {
                for (const chainId of chain._scopes) {
                    for (const scopeToCancel of scopesToCancel) {
                        if (chainId.startsWith(scopeToCancel) || scopeToCancel.startsWith(chainId)) {
                            this._cancelMutationChain(chain);
                        }
                    }
                }
            }
        }
        cancelAll() {
            this.cancelMutations(['']);
        }
        _cancelMutationChain(mutationChain) {
            var _a;
            mutationChain._isActive = false;
            for (let i = mutationChain._index; i < mutationChain._mutations.length; i++) {
                mutationChain._mutations[i].cancel(this);
            }
            (_a = mutationChain._resolve) === null || _a === void 0 ? void 0 : _a.call(mutationChain, { canceled: true });
            this._mutationChains = this._mutationChains.filter((chain) => chain !== mutationChain);
        }
    }
    exports.default = RenderState;
});
define("src/parseCharData", ["require", "exports", "src/models/Stroke", "src/models/Character"], function (require, exports, Stroke_1, Character_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = parseCharData;
    Stroke_1 = __importDefault(Stroke_1);
    Character_1 = __importDefault(Character_1);
    function generateStrokes({ radStrokes, strokes, medians }) {
        const isInRadical = (strokeNum) => { var _a; return ((_a = radStrokes === null || radStrokes === void 0 ? void 0 : radStrokes.indexOf(strokeNum)) !== null && _a !== void 0 ? _a : -1) >= 0; };
        return strokes.map((path, index) => {
            const points = medians[index].map((pointData) => {
                const [x, y] = pointData;
                return { x, y };
            });
            return new Stroke_1.default(path, points, index, isInRadical(index));
        });
    }
    function parseCharData(symbol, charJson) {
        const strokes = generateStrokes(charJson);
        return new Character_1.default(symbol, strokes);
    }
});
define("src/models/UserStroke", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class UserStroke {
        constructor(id, startingPoint, startingExternalPoint) {
            this.id = id;
            this.points = [startingPoint];
            this.externalPoints = [startingExternalPoint];
        }
        appendPoint(point, externalPoint) {
            this.points.push(point);
            this.externalPoints.push(externalPoint);
        }
    }
    exports.default = UserStroke;
});
define("src/strokeMatches", ["require", "exports", "src/utils", "src/geometry"], function (require, exports, utils_4, geometry_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = strokeMatches;
    const COSINE_SIMILARITY_THRESHOLD = 0;
    const START_AND_END_DIST_THRESHOLD = 250;
    const FRECHET_THRESHOLD = 0.4;
    const MIN_LEN_THRESHOLD = 0.35;
    function strokeMatches(userStroke, character, strokeNum, options = {}) {
        const strokes = character.strokes;
        const points = stripDuplicates(userStroke.points);
        if (points.length < 2) {
            return { isMatch: false, meta: { isStrokeBackwards: false } };
        }
        const { isMatch, meta, avgDist } = getMatchData(points, strokes[strokeNum], options);
        if (!isMatch) {
            return { isMatch, meta };
        }
        const laterStrokes = strokes.slice(strokeNum + 1);
        let closestMatchDist = avgDist;
        for (let i = 0; i < laterStrokes.length; i++) {
            const { isMatch, avgDist } = getMatchData(points, laterStrokes[i], Object.assign(Object.assign({}, options), { checkBackwards: false }));
            if (isMatch && avgDist < closestMatchDist) {
                closestMatchDist = avgDist;
            }
        }
        if (closestMatchDist < avgDist) {
            const leniencyAdjustment = (0.6 * (closestMatchDist + avgDist)) / (2 * avgDist);
            const { isMatch, meta } = getMatchData(points, strokes[strokeNum], Object.assign(Object.assign({}, options), { leniency: (options.leniency || 1) * leniencyAdjustment }));
            return { isMatch, meta };
        }
        return { isMatch, meta };
    }
    const startAndEndMatches = (points, closestStroke, leniency) => {
        const startingDist = (0, geometry_2.distance)(closestStroke.getStartingPoint(), points[0]);
        const endingDist = (0, geometry_2.distance)(closestStroke.getEndingPoint(), points[points.length - 1]);
        return (startingDist <= START_AND_END_DIST_THRESHOLD * leniency &&
            endingDist <= START_AND_END_DIST_THRESHOLD * leniency);
    };
    const getEdgeVectors = (points) => {
        const vectors = [];
        let lastPoint = points[0];
        points.slice(1).forEach((point) => {
            vectors.push((0, geometry_2.subtract)(point, lastPoint));
            lastPoint = point;
        });
        return vectors;
    };
    const directionMatches = (points, stroke) => {
        const edgeVectors = getEdgeVectors(points);
        const strokeVectors = stroke.getVectors();
        const similarities = edgeVectors.map((edgeVector) => {
            const strokeSimilarities = strokeVectors.map((strokeVector) => (0, geometry_2.cosineSimilarity)(strokeVector, edgeVector));
            return Math.max(...strokeSimilarities);
        });
        const avgSimilarity = (0, utils_4.average)(similarities);
        return avgSimilarity > COSINE_SIMILARITY_THRESHOLD;
    };
    const lengthMatches = (points, stroke, leniency) => {
        return ((leniency * ((0, geometry_2.length)(points) + 25)) / (stroke.getLength() + 25) >= MIN_LEN_THRESHOLD);
    };
    const stripDuplicates = (points) => {
        if (points.length < 2)
            return points;
        const [firstPoint, ...rest] = points;
        const dedupedPoints = [firstPoint];
        for (const point of rest) {
            if (!(0, geometry_2.equals)(point, dedupedPoints[dedupedPoints.length - 1])) {
                dedupedPoints.push(point);
            }
        }
        return dedupedPoints;
    };
    const SHAPE_FIT_ROTATIONS = [
        Math.PI / 16,
        Math.PI / 32,
        0,
        (-1 * Math.PI) / 32,
        (-1 * Math.PI) / 16,
    ];
    const shapeFit = (curve1, curve2, leniency) => {
        const normCurve1 = (0, geometry_2.normalizeCurve)(curve1);
        const normCurve2 = (0, geometry_2.normalizeCurve)(curve2);
        let minDist = Infinity;
        SHAPE_FIT_ROTATIONS.forEach((theta) => {
            const dist = (0, geometry_2.frechetDist)(normCurve1, (0, geometry_2.rotate)(normCurve2, theta));
            if (dist < minDist) {
                minDist = dist;
            }
        });
        return minDist <= FRECHET_THRESHOLD * leniency;
    };
    const getMatchData = (points, stroke, options) => {
        const { leniency = 1, isOutlineVisible = false, checkBackwards = true, averageDistanceThreshold = 350, } = options;
        const avgDist = stroke.getAverageDistance(points);
        const distMod = isOutlineVisible || stroke.strokeNum > 0 ? 0.5 : 1;
        const withinDistThresh = avgDist <= averageDistanceThreshold * distMod * leniency;
        if (!withinDistThresh) {
            return { isMatch: false, avgDist, meta: { isStrokeBackwards: false } };
        }
        const startAndEndMatch = startAndEndMatches(points, stroke, leniency);
        const directionMatch = directionMatches(points, stroke);
        const shapeMatch = shapeFit(points, stroke.points, leniency);
        const lengthMatch = lengthMatches(points, stroke, leniency);
        const isMatch = withinDistThresh && startAndEndMatch && directionMatch && shapeMatch && lengthMatch;
        if (checkBackwards && !isMatch) {
            const backwardsMatchData = getMatchData([...points].reverse(), stroke, Object.assign(Object.assign({}, options), { checkBackwards: false }));
            if (backwardsMatchData.isMatch) {
                return {
                    isMatch,
                    avgDist,
                    meta: { isStrokeBackwards: true },
                };
            }
        }
        return { isMatch, avgDist, meta: { isStrokeBackwards: false } };
    };
});
define("src/characterActions", ["require", "exports", "src/Mutation", "src/utils"], function (require, exports, Mutation_1, utils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.animateCharacterLoop = exports.animateCharacter = exports.showStroke = exports.animateSingleStroke = exports.animateStroke = exports.highlightStroke = exports.updateColor = exports.hideCharacter = exports.showCharacter = exports.showStrokes = void 0;
    Mutation_1 = __importDefault(Mutation_1);
    const showStrokes = (charName, character, duration) => {
        return [
            new Mutation_1.default(`character.${charName}.strokes`, (0, utils_5.objRepeat)({ opacity: 1, displayPortion: 1 }, character.strokes.length), { duration, force: true }),
        ];
    };
    exports.showStrokes = showStrokes;
    const showCharacter = (charName, character, duration) => {
        return [
            new Mutation_1.default(`character.${charName}`, {
                opacity: 1,
                strokes: (0, utils_5.objRepeat)({ opacity: 1, displayPortion: 1 }, character.strokes.length),
            }, { duration, force: true }),
        ];
    };
    exports.showCharacter = showCharacter;
    const hideCharacter = (charName, character, duration) => {
        return [
            new Mutation_1.default(`character.${charName}.opacity`, 0, { duration, force: true }),
            ...(0, exports.showStrokes)(charName, character, 0),
        ];
    };
    exports.hideCharacter = hideCharacter;
    const updateColor = (colorName, colorVal, duration) => {
        return [new Mutation_1.default(`options.${colorName}`, colorVal, { duration })];
    };
    exports.updateColor = updateColor;
    const highlightStroke = (stroke, color, speed) => {
        const strokeNum = stroke.strokeNum;
        const duration = (stroke.getLength() + 600) / (3 * speed);
        return [
            new Mutation_1.default('options.highlightColor', color),
            new Mutation_1.default('character.highlight', {
                opacity: 1,
                strokes: {
                    [strokeNum]: {
                        displayPortion: 0,
                        opacity: 0,
                    },
                },
            }),
            new Mutation_1.default(`character.highlight.strokes.${strokeNum}`, {
                displayPortion: 1,
                opacity: 1,
            }, { duration }),
            new Mutation_1.default(`character.highlight.strokes.${strokeNum}.opacity`, 0, {
                duration,
                force: true,
            }),
        ];
    };
    exports.highlightStroke = highlightStroke;
    const animateStroke = (charName, stroke, speed) => {
        const strokeNum = stroke.strokeNum;
        const duration = (stroke.getLength() + 600) / (3 * speed);
        return [
            new Mutation_1.default(`character.${charName}`, {
                opacity: 1,
                strokes: {
                    [strokeNum]: {
                        displayPortion: 0,
                        opacity: 1,
                    },
                },
            }),
            new Mutation_1.default(`character.${charName}.strokes.${strokeNum}.displayPortion`, 1, {
                duration,
            }),
        ];
    };
    exports.animateStroke = animateStroke;
    const animateSingleStroke = (charName, character, strokeNum, speed) => {
        const mutationStateFunc = (state) => {
            const curCharState = state.character[charName];
            const mutationState = {
                opacity: 1,
                strokes: {},
            };
            for (let i = 0; i < character.strokes.length; i++) {
                mutationState.strokes[i] = {
                    opacity: curCharState.opacity * curCharState.strokes[i].opacity,
                };
            }
            return mutationState;
        };
        const stroke = character.strokes[strokeNum];
        return [
            new Mutation_1.default(`character.${charName}`, mutationStateFunc),
            ...(0, exports.animateStroke)(charName, stroke, speed),
        ];
    };
    exports.animateSingleStroke = animateSingleStroke;
    const showStroke = (charName, strokeNum, duration) => {
        return [
            new Mutation_1.default(`character.${charName}.strokes.${strokeNum}`, {
                displayPortion: 1,
                opacity: 1,
            }, { duration, force: true }),
        ];
    };
    exports.showStroke = showStroke;
    const animateCharacter = (charName, character, fadeDuration, speed, delayBetweenStrokes) => {
        let mutations = (0, exports.hideCharacter)(charName, character, fadeDuration);
        mutations = mutations.concat((0, exports.showStrokes)(charName, character, 0));
        mutations.push(new Mutation_1.default(`character.${charName}`, {
            opacity: 1,
            strokes: (0, utils_5.objRepeat)({ opacity: 0 }, character.strokes.length),
        }, { force: true }));
        character.strokes.forEach((stroke, i) => {
            if (i > 0)
                mutations.push(new Mutation_1.default.Delay(delayBetweenStrokes));
            mutations = mutations.concat((0, exports.animateStroke)(charName, stroke, speed));
        });
        return mutations;
    };
    exports.animateCharacter = animateCharacter;
    const animateCharacterLoop = (charName, character, fadeDuration, speed, delayBetweenStrokes, delayBetweenLoops) => {
        const mutations = (0, exports.animateCharacter)(charName, character, fadeDuration, speed, delayBetweenStrokes);
        mutations.push(new Mutation_1.default.Delay(delayBetweenLoops));
        return mutations;
    };
    exports.animateCharacterLoop = animateCharacterLoop;
});
define("src/quizActions", ["require", "exports", "src/Mutation", "src/characterActions", "src/utils"], function (require, exports, Mutation_2, characterActions, utils_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.highlightStroke = exports.highlightCompleteChar = exports.removeAllUserStrokes = exports.hideUserStroke = exports.updateUserStroke = exports.startUserStroke = exports.startQuiz = void 0;
    Mutation_2 = __importDefault(Mutation_2);
    characterActions = __importStar(characterActions);
    const startQuiz = (character, fadeDuration, startStrokeNum) => {
        return [
            ...characterActions.hideCharacter('main', character, fadeDuration),
            new Mutation_2.default('character.highlight', {
                opacity: 1,
                strokes: (0, utils_6.objRepeat)({ opacity: 0 }, character.strokes.length),
            }, { force: true }),
            new Mutation_2.default('character.main', {
                opacity: 1,
                strokes: (0, utils_6.objRepeatCb)(character.strokes.length, (i) => ({
                    opacity: i < startStrokeNum ? 1 : 0,
                })),
            }, { force: true }),
        ];
    };
    exports.startQuiz = startQuiz;
    const startUserStroke = (id, point) => {
        return [
            new Mutation_2.default('quiz.activeUserStrokeId', id, { force: true }),
            new Mutation_2.default(`userStrokes.${id}`, {
                points: [point],
                opacity: 1,
            }, { force: true }),
        ];
    };
    exports.startUserStroke = startUserStroke;
    const updateUserStroke = (userStrokeId, points) => {
        return [new Mutation_2.default(`userStrokes.${userStrokeId}.points`, points, { force: true })];
    };
    exports.updateUserStroke = updateUserStroke;
    const hideUserStroke = (userStrokeId, duration) => {
        return [
            new Mutation_2.default(`userStrokes.${userStrokeId}.opacity`, 0, { duration }),
        ];
    };
    exports.hideUserStroke = hideUserStroke;
    const removeAllUserStrokes = (userStrokeIds) => {
        return (userStrokeIds === null || userStrokeIds === void 0 ? void 0 : userStrokeIds.map(userStrokeId => new Mutation_2.default(`userStrokes.${userStrokeId}`, null, { force: true }))) || [];
    };
    exports.removeAllUserStrokes = removeAllUserStrokes;
    const highlightCompleteChar = (character, color, duration) => {
        return [
            new Mutation_2.default('options.highlightColor', color),
            ...characterActions.hideCharacter('highlight', character),
            ...characterActions.showCharacter('highlight', character, duration / 2),
            ...characterActions.hideCharacter('highlight', character, duration / 2),
        ];
    };
    exports.highlightCompleteChar = highlightCompleteChar;
    exports.highlightStroke = characterActions.highlightStroke;
});
define("src/Quiz", ["require", "exports", "src/strokeMatches", "src/models/UserStroke", "src/utils", "src/quizActions", "src/geometry", "src/characterActions"], function (require, exports, strokeMatches_1, UserStroke_1, utils_7, quizActions, geometry, characterActions) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    strokeMatches_1 = __importDefault(strokeMatches_1);
    UserStroke_1 = __importDefault(UserStroke_1);
    quizActions = __importStar(quizActions);
    geometry = __importStar(geometry);
    characterActions = __importStar(characterActions);
    const getDrawnPath = (userStroke) => ({
        pathString: geometry.getPathString(userStroke.externalPoints),
        points: userStroke.points.map((point) => geometry.round(point)),
    });
    class Quiz {
        constructor(character, renderState, positioner) {
            this._currentStrokeIndex = 0;
            this._mistakesOnStroke = 0;
            this._totalMistakes = 0;
            this._character = character;
            this._renderState = renderState;
            this._isActive = false;
            this._positioner = positioner;
        }
        startQuiz(options) {
            if (this._userStrokesIds) {
                this._renderState.run(quizActions.removeAllUserStrokes(this._userStrokesIds));
            }
            this._userStrokesIds = [];
            this._isActive = true;
            this._options = options;
            const startIndex = (0, utils_7.fixIndex)(options.quizStartStrokeNum, this._character.strokes.length);
            this._currentStrokeIndex = Math.min(startIndex, this._character.strokes.length - 1);
            this._mistakesOnStroke = 0;
            this._totalMistakes = 0;
            return this._renderState.run(quizActions.startQuiz(this._character, options.strokeFadeDuration, this._currentStrokeIndex));
        }
        startUserStroke(externalPoint) {
            var _a;
            if (!this._isActive) {
                return null;
            }
            if (this._userStroke) {
                return this.endUserStroke();
            }
            const point = this._positioner.convertExternalPoint(externalPoint);
            const strokeId = (0, utils_7.counter)();
            this._userStroke = new UserStroke_1.default(strokeId, point, externalPoint);
            (_a = this._userStrokesIds) === null || _a === void 0 ? void 0 : _a.push(strokeId);
            return this._renderState.run(quizActions.startUserStroke(strokeId, point));
        }
        continueUserStroke(externalPoint) {
            if (!this._userStroke) {
                return Promise.resolve();
            }
            const point = this._positioner.convertExternalPoint(externalPoint);
            this._userStroke.appendPoint(point, externalPoint);
            const nextPoints = this._userStroke.points.slice(0);
            return this._renderState.run(quizActions.updateUserStroke(this._userStroke.id, nextPoints));
        }
        setPositioner(positioner) {
            this._positioner = positioner;
        }
        endUserStroke() {
            var _a;
            if (!this._userStroke)
                return;
            this._renderState.run(quizActions.hideUserStroke(this._userStroke.id, (_a = this._options.drawingFadeDuration) !== null && _a !== void 0 ? _a : 300));
            if (this._userStroke.points.length === 1) {
                this._userStroke = undefined;
                return;
            }
            const { acceptBackwardsStrokes, markStrokeCorrectAfterMisses } = this._options;
            const currentStroke = this._getCurrentStroke();
            const { isMatch, meta } = (0, strokeMatches_1.default)(this._userStroke, this._character, this._currentStrokeIndex, {
                isOutlineVisible: this._renderState.state.character.outline.opacity > 0,
                leniency: this._options.leniency,
                averageDistanceThreshold: this._options.averageDistanceThreshold,
            });
            const isForceAccepted = markStrokeCorrectAfterMisses &&
                this._mistakesOnStroke + 1 >= markStrokeCorrectAfterMisses;
            const isAccepted = isMatch || isForceAccepted || (meta.isStrokeBackwards && acceptBackwardsStrokes);
            if (isAccepted) {
                this._handleSuccess(meta);
            }
            else {
                this._handleFailure(meta);
                const { showHintAfterMisses, highlightColor, strokeHighlightSpeed, } = this._options;
                if (showHintAfterMisses !== false &&
                    this._mistakesOnStroke >= showHintAfterMisses) {
                    this._renderState.run(characterActions.highlightStroke(currentStroke, (0, utils_7.colorStringToVals)(highlightColor), strokeHighlightSpeed));
                }
            }
            this._userStroke = undefined;
        }
        cancel() {
            this._isActive = false;
            if (this._userStrokesIds) {
                this._renderState.run(quizActions.removeAllUserStrokes(this._userStrokesIds));
            }
        }
        _getStrokeData({ isCorrect, meta, }) {
            return {
                character: this._character.symbol,
                strokeNum: this._currentStrokeIndex,
                mistakesOnStroke: this._mistakesOnStroke,
                totalMistakes: this._totalMistakes,
                strokesRemaining: this._character.strokes.length - this._currentStrokeIndex - (isCorrect ? 1 : 0),
                drawnPath: getDrawnPath(this._userStroke),
                isBackwards: meta.isStrokeBackwards,
            };
        }
        nextStroke() {
            if (!this._options)
                return;
            const { strokes, symbol } = this._character;
            const { onComplete, highlightOnComplete, strokeFadeDuration, highlightCompleteColor, highlightColor, strokeHighlightDuration, } = this._options;
            let animation = characterActions.showStroke('main', this._currentStrokeIndex, strokeFadeDuration);
            this._mistakesOnStroke = 0;
            this._currentStrokeIndex += 1;
            const isComplete = this._currentStrokeIndex === strokes.length;
            if (isComplete) {
                this._isActive = false;
                onComplete === null || onComplete === void 0 ? void 0 : onComplete({
                    character: symbol,
                    totalMistakes: this._totalMistakes,
                });
                if (highlightOnComplete) {
                    animation = animation.concat(quizActions.highlightCompleteChar(this._character, (0, utils_7.colorStringToVals)(highlightCompleteColor || highlightColor), (strokeHighlightDuration || 0) * 2));
                }
            }
            this._renderState.run(animation);
        }
        _handleSuccess(meta) {
            if (!this._options)
                return;
            const { onCorrectStroke } = this._options;
            onCorrectStroke === null || onCorrectStroke === void 0 ? void 0 : onCorrectStroke(Object.assign({}, this._getStrokeData({ isCorrect: true, meta })));
            this.nextStroke();
        }
        _handleFailure(meta) {
            var _a, _b;
            this._mistakesOnStroke += 1;
            this._totalMistakes += 1;
            (_b = (_a = this._options).onMistake) === null || _b === void 0 ? void 0 : _b.call(_a, this._getStrokeData({ isCorrect: false, meta }));
        }
        _getCurrentStroke() {
            return this._character.strokes[this._currentStrokeIndex];
        }
    }
    exports.default = Quiz;
});
define("src/defaultCharDataLoader", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const VERSION = '2.0.1';
    const getCharDataUrl = (char) => `https://cdn.jsdelivr.net/npm/hanzi-writer-data@${VERSION}/${char}.json`;
    const defaultCharDataLoader = (char, onLoad, onError) => {
        const xhr = new XMLHttpRequest();
        if (xhr.overrideMimeType) {
            xhr.overrideMimeType('application/json');
        }
        xhr.open('GET', getCharDataUrl(char), true);
        xhr.onerror = (event) => {
            onError(xhr, event);
        };
        xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4)
                return;
            if (xhr.status === 200) {
                onLoad(JSON.parse(xhr.responseText));
            }
            else if (xhr.status !== 0 && onError) {
                onError(xhr);
            }
        };
        xhr.send(null);
    };
    exports.default = defaultCharDataLoader;
});
define("src/defaultOptions", ["require", "exports", "src/defaultCharDataLoader"], function (require, exports, defaultCharDataLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    defaultCharDataLoader_1 = __importDefault(defaultCharDataLoader_1);
    const defaultOptions = {
        charDataLoader: defaultCharDataLoader_1.default,
        onLoadCharDataError: null,
        onLoadCharDataSuccess: null,
        showOutline: true,
        showCharacter: true,
        renderer: 'svg',
        width: 0,
        height: 0,
        padding: 20,
        strokeAnimationSpeed: 1,
        strokeFadeDuration: 400,
        strokeHighlightDuration: 200,
        strokeHighlightSpeed: 2,
        delayBetweenStrokes: 1000,
        delayBetweenLoops: 2000,
        strokeColor: '#555',
        radicalColor: null,
        highlightColor: '#AAF',
        outlineColor: '#DDD',
        drawingColor: '#333',
        leniency: 1,
        showHintAfterMisses: 3,
        highlightOnComplete: true,
        highlightCompleteColor: null,
        markStrokeCorrectAfterMisses: false,
        acceptBackwardsStrokes: false,
        quizStartStrokeNum: 0,
        averageDistanceThreshold: 350,
        drawingFadeDuration: 300,
        drawingWidth: 4,
        strokeWidth: 2,
        outlineWidth: 2,
        rendererOverride: {},
    };
    exports.default = defaultOptions;
});
define("src/LoadingManager", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LoadingManager {
        constructor(options) {
            this._loadCounter = 0;
            this._isLoading = false;
            this.loadingFailed = false;
            this._options = options;
        }
        _debouncedLoad(char, count) {
            const wrappedResolve = (data) => {
                var _a;
                if (count === this._loadCounter) {
                    (_a = this._resolve) === null || _a === void 0 ? void 0 : _a.call(this, data);
                }
            };
            const wrappedReject = (reason) => {
                var _a;
                if (count === this._loadCounter) {
                    (_a = this._reject) === null || _a === void 0 ? void 0 : _a.call(this, reason);
                }
            };
            const returnedData = this._options.charDataLoader(char, wrappedResolve, wrappedReject);
            if (returnedData) {
                if ('then' in returnedData) {
                    returnedData.then(wrappedResolve).catch(wrappedReject);
                }
                else {
                    wrappedResolve(returnedData);
                }
            }
        }
        _setupLoadingPromise() {
            return new Promise((resolve, reject) => {
                this._resolve = resolve;
                this._reject = reject;
            })
                .then((data) => {
                var _a, _b;
                this._isLoading = false;
                (_b = (_a = this._options).onLoadCharDataSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, data);
                return data;
            })
                .catch((reason) => {
                this._isLoading = false;
                this.loadingFailed = true;
                if (this._options.onLoadCharDataError) {
                    this._options.onLoadCharDataError(reason);
                    return;
                }
                if (reason instanceof Error) {
                    throw reason;
                }
                const err = new Error(`Failed to load char data for ${this._loadingChar}`);
                err.reason = reason;
                throw err;
            });
        }
        loadCharData(char) {
            this._loadingChar = char;
            const promise = this._setupLoadingPromise();
            this.loadingFailed = false;
            this._isLoading = true;
            this._loadCounter++;
            this._debouncedLoad(char, this._loadCounter);
            return promise;
        }
    }
    exports.default = LoadingManager;
});
define("src/HanziWriter", ["require", "exports", "src/RenderState", "src/parseCharData", "src/Positioner", "src/Quiz", "./renderers/svg", "./renderers/canvas", "src/defaultOptions", "src/LoadingManager", "src/characterActions", "src/utils", "src/typings/types"], function (require, exports, RenderState_1, parseCharData_1, Positioner_1, Quiz_1, svg_1, canvas_1, defaultOptions_1, LoadingManager_1, characterActions, utils_8, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    RenderState_1 = __importDefault(RenderState_1);
    parseCharData_1 = __importDefault(parseCharData_1);
    Positioner_1 = __importDefault(Positioner_1);
    Quiz_1 = __importDefault(Quiz_1);
    svg_1 = __importDefault(svg_1);
    canvas_1 = __importDefault(canvas_1);
    defaultOptions_1 = __importDefault(defaultOptions_1);
    LoadingManager_1 = __importDefault(LoadingManager_1);
    characterActions = __importStar(characterActions);
    __exportStar(types_1, exports);
    class HanziWriter {
        static create(element, character, options) {
            const writer = new HanziWriter(element, options);
            writer.setCharacter(character);
            return writer;
        }
        static loadCharacterData(character, options = {}) {
            const loadingManager = (() => {
                const { _loadingManager, _loadingOptions } = HanziWriter;
                if ((_loadingManager === null || _loadingManager === void 0 ? void 0 : _loadingManager._loadingChar) === character && _loadingOptions === options) {
                    return _loadingManager;
                }
                return new LoadingManager_1.default(Object.assign(Object.assign({}, defaultOptions_1.default), options));
            })();
            HanziWriter._loadingManager = loadingManager;
            HanziWriter._loadingOptions = options;
            return loadingManager.loadCharData(character);
        }
        static getScalingTransform(width, height, padding = 0) {
            const positioner = new Positioner_1.default({ width, height, padding });
            return {
                x: positioner.xOffset,
                y: positioner.yOffset,
                scale: positioner.scale,
                transform: (0, utils_8.trim)(`
        translate(${positioner.xOffset}, ${positioner.height - positioner.yOffset})
        scale(${positioner.scale}, ${-1 * positioner.scale})
      `).replace(/\s+/g, ' '),
            };
        }
        constructor(element, options = {}) {
            const { HanziWriterRenderer, createRenderTarget } = options.renderer === 'canvas' ? canvas_1.default : svg_1.default;
            const rendererOverride = options.rendererOverride || {};
            this._renderer = {
                HanziWriterRenderer: rendererOverride.HanziWriterRenderer || HanziWriterRenderer,
                createRenderTarget: rendererOverride.createRenderTarget || createRenderTarget,
            };
            this.target = this._renderer.createRenderTarget(element, options.width, options.height);
            this._options = this._assignOptions(options);
            this._loadingManager = new LoadingManager_1.default(this._options);
            this._setupListeners();
        }
        showCharacter(options = {}) {
            this._options.showCharacter = true;
            return this._withData(() => {
                var _a;
                return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.run(characterActions.showCharacter('main', this._character, typeof options.duration === 'number'
                    ? options.duration
                    : this._options.strokeFadeDuration)).then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            });
        }
        hideCharacter(options = {}) {
            this._options.showCharacter = false;
            return this._withData(() => {
                var _a;
                return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.run(characterActions.hideCharacter('main', this._character, typeof options.duration === 'number'
                    ? options.duration
                    : this._options.strokeFadeDuration)).then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            });
        }
        animateCharacter(options = {}) {
            this.cancelQuiz();
            return this._withData(() => {
                var _a;
                return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.run(characterActions.animateCharacter('main', this._character, this._options.strokeFadeDuration, this._options.strokeAnimationSpeed, this._options.delayBetweenStrokes)).then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            });
        }
        animateStroke(strokeNum, options = {}) {
            this.cancelQuiz();
            return this._withData(() => {
                var _a;
                return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.run(characterActions.animateSingleStroke('main', this._character, (0, utils_8.fixIndex)(strokeNum, this._character.strokes.length), this._options.strokeAnimationSpeed)).then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            });
        }
        highlightStroke(strokeNum, options = {}) {
            const promise = () => {
                if (!this._character || !this._renderState) {
                    return;
                }
                return this._renderState
                    .run(characterActions.highlightStroke((0, utils_8.selectIndex)(this._character.strokes, strokeNum), (0, utils_8.colorStringToVals)(this._options.highlightColor), this._options.strokeHighlightSpeed))
                    .then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            };
            return this._withData(promise);
        }
        async loopCharacterAnimation() {
            this.cancelQuiz();
            return this._withData(() => this._renderState.run(characterActions.animateCharacterLoop('main', this._character, this._options.strokeFadeDuration, this._options.strokeAnimationSpeed, this._options.delayBetweenStrokes, this._options.delayBetweenLoops), { loop: true }));
        }
        pauseAnimation() {
            return this._withData(() => { var _a; return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.pauseAll(); });
        }
        resumeAnimation() {
            return this._withData(() => { var _a; return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.resumeAll(); });
        }
        showOutline(options = {}) {
            this._options.showOutline = true;
            return this._withData(() => {
                var _a;
                return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.run(characterActions.showCharacter('outline', this._character, typeof options.duration === 'number'
                    ? options.duration
                    : this._options.strokeFadeDuration)).then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            });
        }
        hideOutline(options = {}) {
            this._options.showOutline = false;
            return this._withData(() => {
                var _a;
                return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.run(characterActions.hideCharacter('outline', this._character, typeof options.duration === 'number'
                    ? options.duration
                    : this._options.strokeFadeDuration)).then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            });
        }
        updateDimensions({ width, height, padding }) {
            if (width !== undefined)
                this._options.width = width;
            if (height !== undefined)
                this._options.height = height;
            if (padding !== undefined)
                this._options.padding = padding;
            this.target.updateDimensions(this._options.width, this._options.height);
            if (this._character &&
                this._renderState &&
                this._hanziWriterRenderer &&
                this._positioner) {
                this._hanziWriterRenderer.destroy();
                const hanziWriterRenderer = this._initAndMountHanziWriterRenderer(this._character);
                this._renderState.overwriteOnStateChange((nextState) => hanziWriterRenderer.render(nextState));
                hanziWriterRenderer.render(this._renderState.state);
                if (this._quiz) {
                    this._quiz.setPositioner(this._positioner);
                }
            }
        }
        updateColor(colorName, colorVal, options = {}) {
            var _a;
            let mutations = [];
            const fixedColorVal = (() => {
                if (colorName === 'radicalColor' && !colorVal) {
                    return this._options.strokeColor;
                }
                return colorVal;
            })();
            const mappedColor = (0, utils_8.colorStringToVals)(fixedColorVal);
            this._options[colorName] = colorVal;
            const duration = (_a = options.duration) !== null && _a !== void 0 ? _a : this._options.strokeFadeDuration;
            mutations = mutations.concat(characterActions.updateColor(colorName, mappedColor, duration));
            if (colorName === 'radicalColor' && !colorVal) {
                mutations = mutations.concat(characterActions.updateColor(colorName, null, 0));
            }
            return this._withData(() => {
                var _a;
                return (_a = this._renderState) === null || _a === void 0 ? void 0 : _a.run(mutations).then((res) => {
                    var _a;
                    (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, res);
                    return res;
                });
            });
        }
        quiz(quizOptions = {}) {
            return this._withData(async () => {
                if (this._character && this._renderState && this._positioner) {
                    this.cancelQuiz();
                    this._quiz = new Quiz_1.default(this._character, this._renderState, this._positioner);
                    this._options = Object.assign(Object.assign({}, this._options), quizOptions);
                    this._quiz.startQuiz(this._options);
                }
            });
        }
        skipQuizStroke() {
            if (this._quiz) {
                this._quiz.nextStroke();
            }
        }
        cancelQuiz() {
            if (this._quiz) {
                this._quiz.cancel();
                this._quiz = undefined;
            }
        }
        setCharacter(char) {
            this.cancelQuiz();
            this._char = char;
            if (this._hanziWriterRenderer) {
                this._hanziWriterRenderer.destroy();
            }
            if (this._renderState) {
                this._renderState.cancelAll();
            }
            this._hanziWriterRenderer = null;
            this._withDataPromise = this._loadingManager
                .loadCharData(char)
                .then((pathStrings) => {
                if (!pathStrings || this._loadingManager.loadingFailed) {
                    return;
                }
                this._character = (0, parseCharData_1.default)(char, pathStrings);
                this._renderState = new RenderState_1.default(this._character, this._options, (nextState) => hanziWriterRenderer.render(nextState));
                const hanziWriterRenderer = this._initAndMountHanziWriterRenderer(this._character);
                hanziWriterRenderer.render(this._renderState.state);
            });
            return this._withDataPromise;
        }
        _initAndMountHanziWriterRenderer(character) {
            const { width, height, padding } = this._options;
            this._positioner = new Positioner_1.default({ width, height, padding });
            const hanziWriterRenderer = new this._renderer.HanziWriterRenderer(character, this._positioner);
            hanziWriterRenderer.mount(this.target);
            this._hanziWriterRenderer = hanziWriterRenderer;
            return hanziWriterRenderer;
        }
        async getCharacterData() {
            if (!this._char) {
                throw new Error('setCharacter() must be called before calling getCharacterData()');
            }
            const character = await this._withData(() => this._character);
            return character;
        }
        _assignOptions(options) {
            const mergedOptions = Object.assign(Object.assign({}, defaultOptions_1.default), options);
            if (options.strokeAnimationDuration && !options.strokeAnimationSpeed) {
                mergedOptions.strokeAnimationSpeed = 500 / options.strokeAnimationDuration;
            }
            if (options.strokeHighlightDuration && !options.strokeHighlightSpeed) {
                mergedOptions.strokeHighlightSpeed = 500 / mergedOptions.strokeHighlightDuration;
            }
            if (!options.highlightCompleteColor) {
                mergedOptions.highlightCompleteColor = mergedOptions.highlightColor;
            }
            return this._fillWidthAndHeight(mergedOptions);
        }
        _fillWidthAndHeight(options) {
            const filledOpts = Object.assign({}, options);
            if (filledOpts.width && !filledOpts.height) {
                filledOpts.height = filledOpts.width;
            }
            else if (filledOpts.height && !filledOpts.width) {
                filledOpts.width = filledOpts.height;
            }
            else if (!filledOpts.width && !filledOpts.height) {
                const { width, height } = this.target.getBoundingClientRect();
                const minDim = Math.min(width, height);
                filledOpts.width = minDim;
                filledOpts.height = minDim;
            }
            return filledOpts;
        }
        _withData(func) {
            if (this._loadingManager.loadingFailed) {
                throw Error('Failed to load character data. Call setCharacter and try again.');
            }
            if (this._withDataPromise) {
                return this._withDataPromise.then(() => {
                    if (!this._loadingManager.loadingFailed) {
                        return func();
                    }
                });
            }
            return Promise.resolve().then(func);
        }
        _setupListeners() {
            this.target.addPointerStartListener((evt) => {
                if (this._quiz) {
                    evt.preventDefault();
                    this._quiz.startUserStroke(evt.getPoint());
                }
            });
            this.target.addPointerMoveListener((evt) => {
                if (this._quiz) {
                    evt.preventDefault();
                    this._quiz.continueUserStroke(evt.getPoint());
                }
            });
            this.target.addPointerEndListener(() => {
                var _a;
                (_a = this._quiz) === null || _a === void 0 ? void 0 : _a.endUserStroke();
            });
        }
    }
    HanziWriter._loadingManager = null;
    HanziWriter._loadingOptions = null;
    exports.default = HanziWriter;
});
define("src/renderers/StrokeRendererBase", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StrokeRendererBase {
        constructor(stroke) {
            this.stroke = stroke;
            this._pathLength = stroke.getLength() + StrokeRendererBase.STROKE_WIDTH / 2;
        }
        _getStrokeDashoffset(displayPortion) {
            return this._pathLength * 0.999 * (1 - displayPortion);
        }
        _getColor({ strokeColor, radicalColor, }) {
            return radicalColor && this.stroke.isInRadical ? radicalColor : strokeColor;
        }
    }
    StrokeRendererBase.STROKE_WIDTH = 200;
    exports.default = StrokeRendererBase;
});
define("src/renderers/canvas/canvasUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pathStringToCanvas = exports.drawPath = void 0;
    const drawPath = (ctx, points) => {
        ctx.beginPath();
        const start = points[0];
        const remainingPoints = points.slice(1);
        ctx.moveTo(start.x, start.y);
        for (const point of remainingPoints) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
    };
    exports.drawPath = drawPath;
    const pathStringToCanvas = (pathString) => {
        const pathParts = pathString.split(/(^|\s+)(?=[A-Z])/).filter((part) => part !== ' ');
        const commands = [(ctx) => ctx.beginPath()];
        for (const part of pathParts) {
            const [cmd, ...rawParams] = part.split(/\s+/);
            const params = rawParams.map((param) => parseFloat(param));
            if (cmd === 'M') {
                commands.push((ctx) => ctx.moveTo(...params));
            }
            else if (cmd === 'L') {
                commands.push((ctx) => ctx.lineTo(...params));
            }
            else if (cmd === 'C') {
                commands.push((ctx) => ctx.bezierCurveTo(...params));
            }
            else if (cmd === 'Q') {
                commands.push((ctx) => ctx.quadraticCurveTo(...params));
            }
            else if (cmd === 'Z') {
            }
        }
        return (ctx) => commands.forEach((cmd) => cmd(ctx));
    };
    exports.pathStringToCanvas = pathStringToCanvas;
});
define("src/renderers/canvas/StrokeRenderer", ["require", "exports", "src/geometry", "src/renderers/canvas/canvasUtils", "src/renderers/StrokeRendererBase"], function (require, exports, geometry_3, canvasUtils_1, StrokeRendererBase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    StrokeRendererBase_1 = __importDefault(StrokeRendererBase_1);
    class StrokeRenderer extends StrokeRendererBase_1.default {
        constructor(stroke, usePath2D = true) {
            super(stroke);
            if (usePath2D && Path2D) {
                this._path2D = new Path2D(this.stroke.path);
            }
            else {
                this._pathCmd = (0, canvasUtils_1.pathStringToCanvas)(this.stroke.path);
            }
            this._extendedMaskPoints = (0, geometry_3.extendStart)(this.stroke.points, StrokeRendererBase_1.default.STROKE_WIDTH / 2);
        }
        render(ctx, props) {
            var _a;
            if (props.opacity < 0.05) {
                return;
            }
            ctx.save();
            if (this._path2D) {
                ctx.clip(this._path2D);
            }
            else {
                (_a = this._pathCmd) === null || _a === void 0 ? void 0 : _a.call(this, ctx);
                ctx.globalAlpha = 0;
                ctx.stroke();
                ctx.clip();
            }
            const { r, g, b, a } = this._getColor(props);
            const color = a === 1 ? `rgb(${r},${g},${b})` : `rgb(${r},${g},${b},${a})`;
            const dashOffset = this._getStrokeDashoffset(props.displayPortion);
            ctx.globalAlpha = props.opacity;
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = StrokeRendererBase_1.default.STROKE_WIDTH;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.setLineDash([this._pathLength, this._pathLength], dashOffset);
            ctx.lineDashOffset = dashOffset;
            (0, canvasUtils_1.drawPath)(ctx, this._extendedMaskPoints);
            ctx.restore();
        }
    }
    exports.default = StrokeRenderer;
});
define("src/renderers/canvas/CharacterRenderer", ["require", "exports", "src/renderers/canvas/StrokeRenderer"], function (require, exports, StrokeRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    StrokeRenderer_1 = __importDefault(StrokeRenderer_1);
    class CharacterRenderer {
        constructor(character) {
            this._strokeRenderers = character.strokes.map((stroke) => new StrokeRenderer_1.default(stroke));
        }
        render(ctx, props) {
            if (props.opacity < 0.05)
                return;
            const { opacity, strokeColor, radicalColor, strokes } = props;
            for (let i = 0; i < this._strokeRenderers.length; i++) {
                this._strokeRenderers[i].render(ctx, {
                    strokeColor,
                    radicalColor,
                    opacity: strokes[i].opacity * opacity,
                    displayPortion: strokes[i].displayPortion || 0,
                });
            }
        }
    }
    exports.default = CharacterRenderer;
});
define("src/renderers/canvas/RenderTarget", ["require", "exports", "src/renderers/RenderTargetBase"], function (require, exports, RenderTargetBase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    RenderTargetBase_1 = __importDefault(RenderTargetBase_1);
    class RenderTarget extends RenderTargetBase_1.default {
        constructor(canvas) {
            super(canvas);
        }
        static init(elmOrId, width = '100%', height = '100%') {
            const element = (() => {
                if (typeof elmOrId === 'string') {
                    return document.getElementById(elmOrId);
                }
                return elmOrId;
            })();
            if (!element) {
                throw new Error(`HanziWriter target element not found: ${elmOrId}`);
            }
            const nodeType = element.nodeName.toUpperCase();
            const canvas = (() => {
                if (nodeType === 'CANVAS') {
                    return element;
                }
                const canvas = document.createElement('canvas');
                element.appendChild(canvas);
                return canvas;
            })();
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            return new RenderTarget(canvas);
        }
        getContext() {
            return this.node.getContext('2d');
        }
    }
    exports.default = RenderTarget;
});
define("src/renderers/canvas/renderUserStroke", ["require", "exports", "src/renderers/canvas/canvasUtils"], function (require, exports, canvasUtils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = renderUserStroke;
    function renderUserStroke(ctx, props) {
        if (props.opacity < 0.05) {
            return;
        }
        const { opacity, strokeWidth, strokeColor, points } = props;
        const { r, g, b, a } = strokeColor;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        (0, canvasUtils_2.drawPath)(ctx, points);
        ctx.restore();
    }
});
define("src/renderers/canvas/HanziWriterRenderer", ["require", "exports", "src/renderers/canvas/CharacterRenderer", "src/renderers/canvas/renderUserStroke", "src/utils"], function (require, exports, CharacterRenderer_1, renderUserStroke_1, utils_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    CharacterRenderer_1 = __importDefault(CharacterRenderer_1);
    renderUserStroke_1 = __importDefault(renderUserStroke_1);
    class HanziWriterRenderer {
        constructor(character, positioner) {
            this.destroy = utils_9.noop;
            this._character = character;
            this._positioner = positioner;
            this._mainCharRenderer = new CharacterRenderer_1.default(character);
            this._outlineCharRenderer = new CharacterRenderer_1.default(character);
            this._highlightCharRenderer = new CharacterRenderer_1.default(character);
        }
        mount(target) {
            this._target = target;
        }
        _animationFrame(cb) {
            const { width, height, scale, xOffset, yOffset } = this._positioner;
            const ctx = this._target.getContext();
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(xOffset, height - yOffset);
            ctx.transform(1, 0, 0, -1, 0, 0);
            ctx.scale(scale, scale);
            cb(ctx);
            ctx.restore();
            if (ctx.draw) {
                ctx.draw();
            }
        }
        render(props) {
            const { outline, main, highlight } = props.character;
            const { outlineColor, strokeColor, radicalColor, highlightColor, drawingColor, drawingWidth, } = props.options;
            this._animationFrame((ctx) => {
                this._outlineCharRenderer.render(ctx, {
                    opacity: outline.opacity,
                    strokes: outline.strokes,
                    strokeColor: outlineColor,
                });
                this._mainCharRenderer.render(ctx, {
                    opacity: main.opacity,
                    strokes: main.strokes,
                    strokeColor: strokeColor,
                    radicalColor: radicalColor,
                });
                this._highlightCharRenderer.render(ctx, {
                    opacity: highlight.opacity,
                    strokes: highlight.strokes,
                    strokeColor: highlightColor,
                });
                const userStrokes = props.userStrokes || {};
                for (const userStrokeId in userStrokes) {
                    const userStroke = userStrokes[userStrokeId];
                    if (userStroke) {
                        const userStrokeProps = Object.assign({ strokeWidth: drawingWidth, strokeColor: drawingColor }, userStroke);
                        (0, renderUserStroke_1.default)(ctx, userStrokeProps);
                    }
                }
            });
        }
    }
    exports.default = HanziWriterRenderer;
});
define("src/renderers/canvas/index", ["require", "exports", "src/renderers/canvas/HanziWriterRenderer", "src/renderers/canvas/RenderTarget"], function (require, exports, HanziWriterRenderer_1, RenderTarget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    HanziWriterRenderer_1 = __importDefault(HanziWriterRenderer_1);
    RenderTarget_1 = __importDefault(RenderTarget_1);
    exports.default = {
        HanziWriterRenderer: HanziWriterRenderer_1.default,
        createRenderTarget: RenderTarget_1.default.init,
    };
});
define("src/renderers/svg/svgUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createElm = createElm;
    exports.attr = attr;
    exports.attrs = attrs;
    exports.urlIdRef = urlIdRef;
    exports.removeElm = removeElm;
    function createElm(elmType) {
        return document.createElementNS('http://www.w3.org/2000/svg', elmType);
    }
    function attr(elm, name, value) {
        elm.setAttributeNS(null, name, value);
    }
    function attrs(elm, attrsMap) {
        Object.keys(attrsMap).forEach((attrName) => attr(elm, attrName, attrsMap[attrName]));
    }
    function urlIdRef(id) {
        let prefix = '';
        if (window.location && window.location.href) {
            prefix = window.location.href.replace(/#[^#]*$/, '').replace(/"/gi, '%22');
        }
        return `url("${prefix}#${id}")`;
    }
    function removeElm(elm) {
        var _a;
        (_a = elm === null || elm === void 0 ? void 0 : elm.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(elm);
    }
});
define("src/renderers/svg/RenderTarget", ["require", "exports", "src/renderers/svg/svgUtils", "src/renderers/RenderTargetBase"], function (require, exports, svgUtils_1, RenderTargetBase_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    RenderTargetBase_2 = __importDefault(RenderTargetBase_2);
    class RenderTarget extends RenderTargetBase_2.default {
        static init(elmOrId, width = '100%', height = '100%') {
            const element = (() => {
                if (typeof elmOrId === 'string') {
                    return document.getElementById(elmOrId);
                }
                return elmOrId;
            })();
            if (!element) {
                throw new Error(`HanziWriter target element not found: ${elmOrId}`);
            }
            const nodeType = element.nodeName.toUpperCase();
            const svg = (() => {
                if (nodeType === 'SVG' || nodeType === 'G') {
                    return element;
                }
                else {
                    const svg = (0, svgUtils_1.createElm)('svg');
                    element.appendChild(svg);
                    return svg;
                }
            })();
            (0, svgUtils_1.attrs)(svg, { width, height });
            const defs = (0, svgUtils_1.createElm)('defs');
            svg.appendChild(defs);
            return new RenderTarget(svg, defs);
        }
        constructor(svg, defs) {
            super(svg);
            this.svg = svg;
            this.defs = defs;
            if ('createSVGPoint' in svg) {
                this._pt = svg.createSVGPoint();
            }
        }
        createSubRenderTarget() {
            const group = (0, svgUtils_1.createElm)('g');
            this.svg.appendChild(group);
            return new RenderTarget(group, this.defs);
        }
        _getMousePoint(evt) {
            var _a;
            if (this._pt) {
                this._pt.x = evt.clientX;
                this._pt.y = evt.clientY;
                if ('getScreenCTM' in this.node) {
                    const localPt = this._pt.matrixTransform((_a = this.node.getScreenCTM()) === null || _a === void 0 ? void 0 : _a.inverse());
                    return { x: localPt.x, y: localPt.y };
                }
            }
            return super._getMousePoint.call(this, evt);
        }
        _getTouchPoint(evt) {
            var _a;
            if (this._pt) {
                this._pt.x = evt.touches[0].clientX;
                this._pt.y = evt.touches[0].clientY;
                if ('getScreenCTM' in this.node) {
                    const localPt = this._pt.matrixTransform((_a = this.node.getScreenCTM()) === null || _a === void 0 ? void 0 : _a.inverse());
                    return { x: localPt.x, y: localPt.y };
                }
            }
            return super._getTouchPoint(evt);
        }
    }
    exports.default = RenderTarget;
});
define("src/renderers/svg/StrokeRenderer", ["require", "exports", "src/utils", "src/renderers/svg/svgUtils", "src/geometry", "src/renderers/StrokeRendererBase"], function (require, exports, utils_10, svg, geometry_4, StrokeRendererBase_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    svg = __importStar(svg);
    StrokeRendererBase_2 = __importDefault(StrokeRendererBase_2);
    const STROKE_WIDTH = 200;
    class StrokeRenderer extends StrokeRendererBase_2.default {
        constructor(stroke) {
            super(stroke);
            this._oldProps = undefined;
        }
        mount(target) {
            this._animationPath = svg.createElm('path');
            this._clip = svg.createElm('clipPath');
            this._strokePath = svg.createElm('path');
            const maskId = `mask-${(0, utils_10.counter)()}`;
            svg.attr(this._clip, 'id', maskId);
            svg.attr(this._strokePath, 'd', this.stroke.path);
            this._animationPath.style.opacity = '0';
            svg.attr(this._animationPath, 'clip-path', svg.urlIdRef(maskId));
            const extendedMaskPoints = (0, geometry_4.extendStart)(this.stroke.points, STROKE_WIDTH / 2);
            svg.attr(this._animationPath, 'd', (0, geometry_4.getPathString)(extendedMaskPoints));
            svg.attrs(this._animationPath, {
                stroke: '#FFFFFF',
                'stroke-width': STROKE_WIDTH.toString(),
                fill: 'none',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'miter',
                'stroke-dasharray': `${this._pathLength},${this._pathLength}`,
            });
            this._clip.appendChild(this._strokePath);
            target.defs.appendChild(this._clip);
            target.svg.appendChild(this._animationPath);
            return this;
        }
        render(props) {
            var _a, _b;
            if (props === this._oldProps || !this._animationPath) {
                return;
            }
            if (props.displayPortion !== ((_a = this._oldProps) === null || _a === void 0 ? void 0 : _a.displayPortion)) {
                this._animationPath.style.strokeDashoffset = this._getStrokeDashoffset(props.displayPortion).toString();
            }
            const color = this._getColor(props);
            if (!this._oldProps || color !== this._getColor(this._oldProps)) {
                const { r, g, b, a } = color;
                svg.attrs(this._animationPath, { stroke: `rgba(${r},${g},${b},${a})` });
            }
            if (props.opacity !== ((_b = this._oldProps) === null || _b === void 0 ? void 0 : _b.opacity)) {
                this._animationPath.style.opacity = props.opacity.toString();
            }
            this._oldProps = props;
        }
    }
    exports.default = StrokeRenderer;
});
define("src/renderers/svg/CharacterRenderer", ["require", "exports", "src/utils", "src/renderers/svg/StrokeRenderer"], function (require, exports, utils_11, StrokeRenderer_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    StrokeRenderer_2 = __importDefault(StrokeRenderer_2);
    class CharacterRenderer {
        constructor(character) {
            this._oldProps = undefined;
            this._strokeRenderers = character.strokes.map((stroke) => new StrokeRenderer_2.default(stroke));
        }
        mount(target) {
            const subTarget = target.createSubRenderTarget();
            this._group = subTarget.svg;
            this._strokeRenderers.forEach((strokeRenderer) => {
                strokeRenderer.mount(subTarget);
            });
        }
        render(props) {
            var _a, _b, _c, _d;
            if (props === this._oldProps || !this._group) {
                return;
            }
            const { opacity, strokes, strokeColor, radicalColor = null } = props;
            if (opacity !== ((_a = this._oldProps) === null || _a === void 0 ? void 0 : _a.opacity)) {
                this._group.style.opacity = opacity.toString();
                if (!utils_11.isMsBrowser) {
                    if (opacity === 0) {
                        this._group.style.display = 'none';
                    }
                    else if (((_b = this._oldProps) === null || _b === void 0 ? void 0 : _b.opacity) === 0) {
                        this._group.style.removeProperty('display');
                    }
                }
            }
            const colorsChanged = !this._oldProps ||
                strokeColor !== this._oldProps.strokeColor ||
                radicalColor !== this._oldProps.radicalColor;
            if (colorsChanged || strokes !== ((_c = this._oldProps) === null || _c === void 0 ? void 0 : _c.strokes)) {
                for (let i = 0; i < this._strokeRenderers.length; i++) {
                    if (!colorsChanged &&
                        ((_d = this._oldProps) === null || _d === void 0 ? void 0 : _d.strokes) &&
                        strokes[i] === this._oldProps.strokes[i]) {
                        continue;
                    }
                    this._strokeRenderers[i].render({
                        strokeColor,
                        radicalColor,
                        opacity: strokes[i].opacity,
                        displayPortion: strokes[i].displayPortion,
                    });
                }
            }
            this._oldProps = props;
        }
    }
    exports.default = CharacterRenderer;
});
define("src/renderers/svg/UserStrokeRenderer", ["require", "exports", "src/renderers/svg/svgUtils", "src/geometry"], function (require, exports, svg, geometry_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    svg = __importStar(svg);
    class UserStrokeRenderer {
        constructor() {
            this._oldProps = undefined;
        }
        mount(target) {
            this._path = svg.createElm('path');
            target.svg.appendChild(this._path);
        }
        render(props) {
            var _a, _b, _c, _d;
            if (!this._path || props === this._oldProps) {
                return;
            }
            if (props.strokeColor !== ((_a = this._oldProps) === null || _a === void 0 ? void 0 : _a.strokeColor) ||
                props.strokeWidth !== ((_b = this._oldProps) === null || _b === void 0 ? void 0 : _b.strokeWidth)) {
                const { r, g, b, a } = props.strokeColor;
                svg.attrs(this._path, {
                    fill: 'none',
                    stroke: `rgba(${r},${g},${b},${a})`,
                    'stroke-width': props.strokeWidth.toString(),
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                });
            }
            if (props.opacity !== ((_c = this._oldProps) === null || _c === void 0 ? void 0 : _c.opacity)) {
                svg.attr(this._path, 'opacity', props.opacity.toString());
            }
            if (props.points !== ((_d = this._oldProps) === null || _d === void 0 ? void 0 : _d.points)) {
                svg.attr(this._path, 'd', (0, geometry_5.getPathString)(props.points));
            }
            this._oldProps = props;
        }
        destroy() {
            svg.removeElm(this._path);
        }
    }
    exports.default = UserStrokeRenderer;
});
define("src/renderers/svg/HanziWriterRenderer", ["require", "exports", "src/renderers/svg/CharacterRenderer", "src/renderers/svg/UserStrokeRenderer", "src/renderers/svg/svgUtils"], function (require, exports, CharacterRenderer_2, UserStrokeRenderer_1, svg) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    CharacterRenderer_2 = __importDefault(CharacterRenderer_2);
    UserStrokeRenderer_1 = __importDefault(UserStrokeRenderer_1);
    svg = __importStar(svg);
    class HanziWriterRenderer {
        constructor(character, positioner) {
            this._character = character;
            this._positioner = positioner;
            this._mainCharRenderer = new CharacterRenderer_2.default(character);
            this._outlineCharRenderer = new CharacterRenderer_2.default(character);
            this._highlightCharRenderer = new CharacterRenderer_2.default(character);
            this._userStrokeRenderers = {};
        }
        mount(target) {
            const positionedTarget = target.createSubRenderTarget();
            const group = positionedTarget.svg;
            const { xOffset, yOffset, height, scale } = this._positioner;
            svg.attr(group, 'transform', `translate(${xOffset}, ${height - yOffset}) scale(${scale}, ${-1 * scale})`);
            this._outlineCharRenderer.mount(positionedTarget);
            this._mainCharRenderer.mount(positionedTarget);
            this._highlightCharRenderer.mount(positionedTarget);
            this._positionedTarget = positionedTarget;
        }
        render(props) {
            var _a;
            const { main, outline, highlight } = props.character;
            const { outlineColor, radicalColor, highlightColor, strokeColor, drawingWidth, drawingColor, } = props.options;
            this._outlineCharRenderer.render({
                opacity: outline.opacity,
                strokes: outline.strokes,
                strokeColor: outlineColor,
            });
            this._mainCharRenderer.render({
                opacity: main.opacity,
                strokes: main.strokes,
                strokeColor,
                radicalColor: radicalColor,
            });
            this._highlightCharRenderer.render({
                opacity: highlight.opacity,
                strokes: highlight.strokes,
                strokeColor: highlightColor,
            });
            const userStrokes = props.userStrokes || {};
            for (const userStrokeId in this._userStrokeRenderers) {
                if (!userStrokes[userStrokeId]) {
                    (_a = this._userStrokeRenderers[userStrokeId]) === null || _a === void 0 ? void 0 : _a.destroy();
                    delete this._userStrokeRenderers[userStrokeId];
                }
            }
            for (const userStrokeId in userStrokes) {
                const stroke = userStrokes[userStrokeId];
                if (!stroke) {
                    continue;
                }
                const userStrokeProps = Object.assign({ strokeWidth: drawingWidth, strokeColor: drawingColor }, stroke);
                const strokeRenderer = (() => {
                    if (this._userStrokeRenderers[userStrokeId]) {
                        return this._userStrokeRenderers[userStrokeId];
                    }
                    const newStrokeRenderer = new UserStrokeRenderer_1.default();
                    newStrokeRenderer.mount(this._positionedTarget);
                    this._userStrokeRenderers[userStrokeId] = newStrokeRenderer;
                    return newStrokeRenderer;
                })();
                strokeRenderer.render(userStrokeProps);
            }
        }
        destroy() {
            svg.removeElm(this._positionedTarget.svg);
            this._positionedTarget.defs.innerHTML = '';
        }
    }
    exports.default = HanziWriterRenderer;
});
define("src/renderers/svg/index", ["require", "exports", "src/renderers/svg/HanziWriterRenderer", "src/renderers/svg/RenderTarget"], function (require, exports, HanziWriterRenderer_2, RenderTarget_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    HanziWriterRenderer_2 = __importDefault(HanziWriterRenderer_2);
    RenderTarget_2 = __importDefault(RenderTarget_2);
    exports.default = {
        HanziWriterRenderer: HanziWriterRenderer_2.default,
        createRenderTarget: RenderTarget_2.default.init,
    };
});

var HW=req("src/HanziWriter"); window.HanziWriter=HW.default||HW;
})();
