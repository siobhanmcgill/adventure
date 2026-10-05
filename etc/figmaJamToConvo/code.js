"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const FLAG_DELIMITERS = ['##', '#', '>', '@', '.', '$'];
const ui = {
    log: (message, options = { timeout: 2000 }) => {
        let n;
        const prom = new Promise((res) => {
            n = figma.notify(message, Object.assign(Object.assign({}, options), { onDequeue: res }));
        });
        prom.cancel = () => {
            n.cancel();
        };
        return prom;
    },
    error: (message, options = { timeout: 2000 }) => {
        let n;
        const prom = new Promise((res) => {
            n = figma.notify(message, Object.assign(Object.assign({}, options), { error: true, onDequeue: res }));
        });
        prom.cancel = () => {
            n.cancel();
        };
        return prom;
    },
};
const arrowLike = ['ARROW_LINES', 'ARROW_EQUILATERAL'];
function computeDirectionOfEdge(connector) {
    if (arrowLike.includes(connector.connectorEndStrokeCap)) {
        if (arrowLike.includes(connector.connectorStartStrokeCap)) {
            return { directional: 'BI' };
        }
        else {
            return {
                dir: {
                    to: 'connectorEnd',
                    from: 'connectorStart',
                },
                directional: 'UNI',
            };
        }
    }
    else {
        if (arrowLike.includes(connector.connectorStartStrokeCap)) {
            return {
                dir: {
                    to: 'connectorStart',
                    from: 'connectorEnd',
                },
                directional: 'UNI',
            };
        }
        else {
            return { directional: 'BI' };
        }
    }
}
figma.skipInvisibleInstanceChildren = true;
function getNodeFromId(id) {
    return figma.getNodeById(id);
}
const RESPONSE_SHAPE = 'HEXAGON';
const STEP_SHAPE = 'SQUARE';
const RESPONSE_IGNORE_LIST = ['[ITEM]', '[FRIEND]', '[CRASH]'];
const knownNodes = new Map();
const knownEdges = [];
function cleanTextLine(text) {
    return (text !== null && text !== void 0 ? text : '')
        .trim()
        .replace(/,$/, '')
        .replace(/^("|“|”|`|'|‘)/, '')
        .replace(/("|“|”|`|'|’)$/, '');
}
function processTextToLines(text) {
    return ((text !== null && text !== void 0 ? text : '')
        .split(/\r?\n|\r|\n/g)
        .map((l) => cleanTextLine(l))
        .filter((l) => !!l.trim()));
}
function processNodeText(node) {
    let nodeText = node.text.characters;
    const re = /queue:\n?\[((.*\n|.)*)\]/g;
    const match = re.exec(nodeText);
    let queue = [];
    if (match === null || match === void 0 ? void 0 : match.length) {
        queue = processTextToLines(match[1]);
        nodeText = nodeText.replace(re, '');
    }
    const textLines = processTextToLines(nodeText);
    return { textLines, queue };
}
function getProperStepNameFromNodeName(otherNodeName) {
    if (otherNodeName.includes('>')) {
        return otherNodeName.split('>').pop();
    }
    return otherNodeName.split(/[\\#|\\@|\\.|\\$]/)[0];
}
function traverse(node, convo) {
    var _a, _b, _c, _d;
    if (knownNodes.has(node.id)) {
        return knownNodes.get(node.id);
    }
    let stepName = node.id;
    let hasGoto = false;
    if (node.shapeType === STEP_SHAPE) {
        const convoStep = {};
        const { textLines, queue } = processNodeText(node);
        const firstLine = textLines.shift();
        if (!firstLine ||
            (firstLine === null || firstLine === void 0 ? void 0 : firstLine.startsWith('`')) ||
            (firstLine === null || firstLine === void 0 ? void 0 : firstLine.startsWith(':'))) {
            if (firstLine) {
                textLines.unshift(firstLine);
            }
        }
        else {
            stepName = firstLine.replace(' ', '');
        }
        const lastLine = textLines.pop();
        if (lastLine === null || lastLine === void 0 ? void 0 : lastLine.trim().startsWith('goto')) {
            convoStep.goto = lastLine.replace('goto:', '').trim();
            hasGoto = true;
        }
        else if (lastLine && lastLine.trim() !== 'end') {
            textLines.push(lastLine);
        }
        if (queue === null || queue === void 0 ? void 0 : queue.length) {
            const queueFinishGotoLine = textLines.findIndex((l) => l.startsWith('onQueueFinishGoto'));
            if (queueFinishGotoLine > -1) {
                const onQueueFinishGoto = cleanTextLine(textLines[queueFinishGotoLine].replace('onQueueFinishGoto:', ''));
                textLines.splice(queueFinishGotoLine, 1);
                convoStep.onQueueFinishGoto = onQueueFinishGoto;
            }
            convoStep.queue = queue;
        }
        if (textLines === null || textLines === void 0 ? void 0 : textLines.length) {
            convoStep.text = textLines;
        }
        convo[stepName] = convoStep;
    }
    knownNodes.set(node.id, stepName);
    const connectedStepNames = [];
    const responses = [];
    for (const connector of node.attachedConnectors) {
        if (knownEdges.includes(connector.id)) {
            continue;
        }
        const { directional, dir } = computeDirectionOfEdge(connector);
        if (directional === 'BI' ||
            ((_a = connector.connectorEnd) === null || _a === void 0 ? void 0 : _a.endpointNodeId) === node.id) {
            continue;
        }
        const to = dir.to;
        const otherEndpointNodeId = (_b = connector[to]) === null || _b === void 0 ? void 0 : _b.endpointNodeId;
        if (otherEndpointNodeId) {
            const otherNode = getNodeFromId(otherEndpointNodeId);
            if (otherNode &&
                otherNode.type === 'SHAPE_WITH_TEXT' &&
                (otherNode.shapeType === STEP_SHAPE ||
                    otherNode.shapeType === RESPONSE_SHAPE)) {
                const otherNodeName = traverse(otherNode, convo);
                if (otherNode.shapeType === STEP_SHAPE) {
                    connectedStepNames.push(otherNodeName);
                }
                if (otherNode.shapeType === RESPONSE_SHAPE) {
                    const { textLines } = processNodeText(otherNode);
                    if (!RESPONSE_IGNORE_LIST.includes(textLines[0])) {
                        let condition = undefined;
                        if ([...FLAG_DELIMITERS, '!'].includes(textLines[0].charAt(0))) {
                            condition = (_c = textLines.shift()) !== null && _c !== void 0 ? _c : undefined;
                        }
                        let goto = undefined;
                        if (textLines[textLines.length - 1].startsWith('goto')) {
                            goto = textLines.pop().replace('goto:', '').trim();
                        }
                        else if (otherNodeName) {
                            goto = getProperStepNameFromNodeName(otherNodeName);
                        }
                        responses.push({
                            condition,
                            text: textLines.join(' '),
                            goto,
                        });
                    }
                }
                else if (convo[stepName] &&
                    !hasGoto &&
                    otherNode.shapeType === STEP_SHAPE &&
                    otherNodeName &&
                    !otherNodeName.startsWith(stepName)) {
                    convo[stepName].goto = getProperStepNameFromNodeName(otherNodeName);
                }
            }
        }
        if (responses.length && convo[stepName]) {
            convo[stepName].responses = responses;
        }
        knownEdges.push(connector.id);
    }
    return node.shapeType === RESPONSE_SHAPE
        ? (_d = connectedStepNames[0]) !== null && _d !== void 0 ? _d : ''
        : stepName;
}
const selection = figma.currentPage.selection;
if (selection.length !== 1) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        yield ui.error('Please select a single node as root');
        figma.closePlugin();
    }))();
}
else {
    const elem = selection[0];
    if (elem.type !== 'SHAPE_WITH_TEXT') {
        (() => __awaiter(void 0, void 0, void 0, function* () {
            yield ui.error('Please select a node (a box with text inside) in your flowchart as root');
            figma.closePlugin();
        }))();
    }
    else {
        const convo = {};
        traverse(elem, convo);
        const stringified = JSON.stringify(convo, null, ' ');
        (() => __awaiter(void 0, void 0, void 0, function* () {
            figma.showUI(__html__, { themeColors: true, width: 500, height: 400 });
            figma.ui.postMessage(stringified);
        }))();
    }
}
//# sourceMappingURL=code.js.map