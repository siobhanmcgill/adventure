import {
  getDistance,
  isPointWithinPath,
  createSvgElement,
  createSVGPoint,
  getDist,
} from './svg_utils';
import { Coord } from './types';

export function findPath(
  start: Coord,
  end: Coord,
  accessibleArea: SVGPathElement,
  recursion = 0,
  direction?: 'up' | 'down' | 'left' | 'right'
): Coord[] | undefined {
  if (recursion > 10) {
    // Assume there's no possible path this way.
    return undefined;
  }

  const { length: testLength, line: testLine } = getDistance([start, end]);

  let inside = true;
  let crosses: DOMPoint[] = [];
  for (let p = 5; p < testLength; p += 5) {
    const testPos = testLine.getPointAtLength(p);
    if (isPointWithinPath(testPos, accessibleArea)) {
      if (!inside) {
        // We've crossed back inside the accessible area.
        crosses.push(testLine.getPointAtLength(Math.min(testLength, p + 10)));
      }
      inside = true;
    } else {
      if (inside) {
        // We've crossed outside the accessible area.
        crosses.push(testLine.getPointAtLength(Math.max(0, p - 50)));
      }
      inside = false;
    }
  }
  /** DEBUG */
  for (const cross of crosses) {
    const circ = createSvgElement('circle', 'test-whatever', {
      cx: cross.x,
      cy: cross.y,
      r: 5,
      fill: 'red',
    });
    testLine.after(circ);
  }
  /** /DEBUG */

  const vertexes: Coord[] = [start];
  for (let index = 1; index < crosses.length; index += 2) {
    const firstCross = crosses[index - 1];
    const secondCross = crosses[index];

    // if (
    //   Math.abs(firstCross.y - secondCross.y) <
    //   Math.abs(firstCross.x - secondCross.x)
    // ) {
    // They are roughly horizontal
    //   console.log('horizontal', {direction});
    let downAttempt: Coord[] | undefined;
    let upAttempt: Coord[] | undefined;
    //   if (direction !== 'up') {
    const down = createSVGPoint({
      x: firstCross.x,
      y: firstCross.y + (recursion + 1) * 10,
    });
    if (isPointWithinPath(down, accessibleArea)) {
      downAttempt = findPath(down, end, accessibleArea, recursion + 1, 'down');
    }
    //   }
    //   if (direction !== 'down') {
    const up = createSVGPoint({
      x: firstCross.x,
      y: firstCross.y + (recursion + 1) * -5,
    });
    if (isPointWithinPath(up, accessibleArea)) {
      upAttempt = findPath(up, end, accessibleArea, recursion + 1, 'up');
    }
    // console.log({upAttempt, up});
    //   }
    //   if (
    //     (!upAttempt && downAttempt?.length) ||
    //     (upAttempt &&
    //       downAttempt &&
    //       upAttempt?.length > downAttempt?.length)
    //   ) {
    //     vertexes.push(...downAttempt);
    //   } else {
    //     vertexes.push(...(upAttempt ?? []));
    //   }
    // } else if (
    //   Math.abs(firstCross.x - secondCross.x) <
    //   Math.abs(firstCross.y - secondCross.y)
    // ) {
    // They are roughly vertical
    //   console.log('vertical', {direction});
    let leftAttempt: Coord[] | undefined;
    let rightAttempt: Coord[] | undefined;
    //   if (direction !== 'left') {
    const right = createSVGPoint({
      x: firstCross.x,
      y: firstCross.y + (recursion + 1) * 5,
    });
    if (isPointWithinPath(right)) {
      rightAttempt = findPath(
        right,
        end,
        accessibleArea,
        recursion + 1,
        'right'
      );
    }
    //   }
    //   if (direction !== 'right') {
    const left = createSVGPoint({
      x: firstCross.x,
      y: firstCross.y + (recursion + 1) * -5,
    });
    if (isPointWithinPath(left)) {
      leftAttempt = findPath(left, end, accessibleArea, recursion + 1, 'left');
    }
    //   }

    if (!upAttempt && !downAttempt && !leftAttempt && !rightAttempt) {
      return undefined;
    }
    const results = [upAttempt, downAttempt, leftAttempt, rightAttempt]
      .filter((r) => !!r && r.length > 1)
      .sort((a, b) => {
        const aLength = !a ? 0 : getDist(a);
        const bLength = !b ? 0 : getDist(b);
        return aLength - bLength;
      });
    return results[0] ?? undefined;

    // }

    //       // Try the bottom corner first.
    //       vertextPoint = createSVGPoint({x: end.x - emergecyBrake * 5, y: start.y});
    //       if (!isPointWithinPath(vertextPoint, accessibleArea)) {
    //         // Try the top corner.
    //         vertextPoint = createSVGPoint({
    //           x: start.x + emergecyBrake * 5,
    //           y: end.y,
    //         });
    //       }
  }
  //     if (vertextPoint && !isPointWithinPath(vertextPoint, accessibleArea)) {
  //       vertextPoint = undefined;
  //     }
  //     if (vertextPoint) {
  //       vertexes.push(...findPath(vertexes.pop()!, vertextPoint, accessibleArea));
  //     } else {
  //       // Just give up?
  //     }
  //   }
  vertexes.push(end);
  //   }

  return vertexes;
}

export function reducePath(path: Coord[]): Coord[] {
  const reduced: Coord[] = [path[0]];
  for (let i = 1; i < path.length; i += 2) {
    const previous = path[i - 1];
    const node = path[i];
    const next = path[i + 1];
    if (
      next?.x - node.x !== node.x - previous.x ||
      next?.y - node.y !== node.y - previous.y
    ) {
      reduced.push(node);
    }
    if (next) {
      reduced.push(next);
    }
  }
  if (
    reduced[reduced.length - 1].x !== path[path.length - 1].x ||
    reduced[reduced.length - 1].y !== path[path.length - 1].y
  ) {
    reduced.push(path[path.length - 1]);
  }
  console.log('reduced', { path, reduced });
  return reduced.length < path.length ? reducePath(reduced) : reduced;
}

interface Node extends Coord {
  distanceFromStart: number;
  through?: Node;
}

const NODE_SPACING = 10;

export function dijkstra(
  inputStart: Coord,
  inputEnd: Coord,
  accessibleArea: SVGPathElement
): Coord[] {
  // If this is the first step, start with the start - galaxy brain move.
  const unvisitedNodes: Node[] = [{ ...inputStart, distanceFromStart: 0 }];
  const visitedNodes: Node[] = [];

  //If the unvisited set is empty, or contains only nodes with infinite distance
  // (which are unreachable), then the algorithm terminates.
  while (
    unvisitedNodes.filter((n) => n.distanceFromStart !== Infinity).length
  ) {
    // From the unvisited set, select the current node to be the one with the smallest (finite) distance.
    unvisitedNodes.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
    const currentNode = unvisitedNodes.shift();

    if (currentNode) {
      /**
       * For the current node, consider all of its unvisited neighbors and update their distances
       * through the current node; compare the newly calculated distance to the one currently
       * assigned to the neighbor and assign the smaller one to it. For example, if the current
       * node A is marked with a distance of 6, and the edge connecting it with its neighbor B
       * has length 2, then the distance to B through A is 6 + 2 = 8. If B was previously marked
       * with a distance greater than 8, then update it to 8 (the path to B through A is shorter).
       * Otherwise, keep its current distance (the path to B through A is not the shortest).
       */

      // Left, middle, right.
      for (
        let offsetX = -NODE_SPACING;
        offsetX <= NODE_SPACING;
        offsetX += NODE_SPACING
      ) {
        // Above, middle, below.
        for (
          let offsetY = -NODE_SPACING;
          offsetY <= NODE_SPACING;
          offsetY += NODE_SPACING
        ) {
          if (offsetX === 0 && offsetY === 0) {
            continue;
          }
          const x = currentNode.x + offsetX;
          const y = currentNode.y + offsetY;
          const distanceFromStart =
            currentNode.distanceFromStart +
            getDist([currentNode, { x, y }], accessibleArea);

          const newNode: Node = {
            x,
            y,
            distanceFromStart,
            through: currentNode,
          };

          // The algorithm terminates once the current node is the target node.
          if (
            Math.abs(x - inputEnd.x) < NODE_SPACING &&
            Math.abs(y - inputEnd.y) < NODE_SPACING
          ) {
            // We found the end!
            const path: Coord[] = [{ x, y }];
            let previous = newNode;
            let pathNode = { ...currentNode };
            while (
              (pathNode.x !== inputStart.x || pathNode.y !== inputStart.y) &&
              !!pathNode.through
            ) {
              if (
                pathNode.x - pathNode.through.x !== previous.x - pathNode.x ||
                pathNode.y - pathNode.through.y !== previous.y - pathNode.y
              ) {
                path.unshift({ x: pathNode.x, y: pathNode.y });
              }
              previous = pathNode;
              pathNode = pathNode.through;
            }
            path.unshift(inputStart);
            return path;
          }

          // Ignore nodes that are outside the accessible area.
          // else
          if (isPointWithinPath(newNode, accessibleArea)) {
            const existingUnvisitedNodeIndex = unvisitedNodes.findIndex(
              (n) => n.x === newNode.x && n.y === newNode.y
            );
            const existingVisitedNodeIndex = visitedNodes.findIndex(
              (n) => n.x === newNode.x && n.y === newNode.y
            );
            // If this node doesn't already exist, store this one.
            if (
              existingVisitedNodeIndex === -1 &&
              existingUnvisitedNodeIndex === -1
            ) {
              unvisitedNodes.push(newNode);
            } else if (
              // If this node already exists, but we found a shorter path to it, take the shorter path.
              existingUnvisitedNodeIndex >= 0 &&
              newNode.distanceFromStart <
                unvisitedNodes[existingUnvisitedNodeIndex].distanceFromStart
            ) {
              unvisitedNodes[existingUnvisitedNodeIndex] = newNode;
            }
          }
        }
      }

      /**
       * After considering all of the current node's unvisited neighbors, the current node is
       * removed from the unvisited set. Thus a visited node is never rechecked, which is
       * correct because the distance recorded on the current node is minimal.
       */
      visitedNodes.push(currentNode);
    }
  }

  // We've visited every node! If we haven't found the end yet, we're in trouble.
  return [];
}
