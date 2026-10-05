import { FLAG_DELIMITERS } from '../../src/ts/types';
const ui = {
    log: (message, options = { timeout: 2000 }) => {
        let n;
        const prom = new Promise((res) => {
            n = figma.notify(message, { ...options, onDequeue: res });
        });
        prom.cancel = () => {
            n.cancel();
        };
        return prom;
    },
    error: (message, options = { timeout: 2000 }) => {
        let n;
        const prom = new Promise((res) => {
            n = figma.notify(message, { ...options, error: true, onDequeue: res });
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
    return (text ?? '')
        .trim()
        .replace(/,$/, '')
        .replace(/^("|“|”|`|'|‘)/, '')
        .replace(/("|“|”|`|'|’)$/, '');
}
function processTextToLines(text) {
    return ((text ?? '')
        .split(/\r?\n|\r|\n/g)
        .map((l) => cleanTextLine(l))
        .filter((l) => !!l.trim()));
}
function processNodeText(node) {
    let nodeText = node.text.characters;
    const re = /queue:\n?\[((.*\n|.)*)\]/g;
    const match = re.exec(nodeText);
    let queue = [];
    if (match?.length) {
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
            firstLine?.startsWith('`') ||
            firstLine?.startsWith(':')) {
            if (firstLine) {
                textLines.unshift(firstLine);
            }
        }
        else {
            stepName = firstLine.replace(' ', '');
        }
        const lastLine = textLines.pop();
        if (lastLine?.trim().startsWith('goto')) {
            convoStep.goto = lastLine.replace('goto:', '').trim();
            hasGoto = true;
        }
        else if (lastLine && lastLine.trim() !== 'end') {
            textLines.push(lastLine);
        }
        if (queue?.length) {
            const queueFinishGotoLine = textLines.findIndex((l) => l.startsWith('onQueueFinishGoto'));
            if (queueFinishGotoLine > -1) {
                const onQueueFinishGoto = cleanTextLine(textLines[queueFinishGotoLine].replace('onQueueFinishGoto:', ''));
                textLines.splice(queueFinishGotoLine, 1);
                convoStep.onQueueFinishGoto = onQueueFinishGoto;
            }
            convoStep.queue = queue;
        }
        if (textLines?.length) {
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
            connector.connectorEnd
                ?.endpointNodeId === node.id) {
            continue;
        }
        const to = dir.to;
        const otherEndpointNodeId = connector[to]?.endpointNodeId;
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
                            condition = textLines.shift() ?? undefined;
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
        ? connectedStepNames[0] ?? ''
        : stepName;
}
const selection = figma.currentPage.selection;
if (selection.length !== 1) {
    (async () => {
        await ui.error('Please select a single node as root');
        figma.closePlugin();
    })();
}
else {
    const elem = selection[0];
    if (elem.type !== 'SHAPE_WITH_TEXT') {
        (async () => {
            await ui.error('Please select a node (a box with text inside) in your flowchart as root');
            figma.closePlugin();
        })();
    }
    else {
        const convo = {};
        traverse(elem, convo);
        const stringified = JSON.stringify(convo);
        (async () => {
            figma.showUI(__html__, { themeColors: true, width: 500, height: 400 });
            figma.ui.postMessage(stringified);
        })();
    }
}
//# sourceMappingURL=code.js.map