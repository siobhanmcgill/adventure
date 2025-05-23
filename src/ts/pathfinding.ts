import {getDist, isPointWithinPath} from './svg_utils';
import {Coord} from './types';

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
  const unvisitedNodes: Node[] = [{...inputStart, distanceFromStart: 0}];
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
            getDist([currentNode, {x, y}], accessibleArea);

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
            const path: Coord[] = [{x, y}];
            let previous = newNode;
            let pathNode = {...currentNode};
            while (
              (pathNode.x !== inputStart.x || pathNode.y !== inputStart.y) &&
              !!pathNode.through
            ) {
              if (
                pathNode.x - pathNode.through.x !== previous.x - pathNode.x ||
                pathNode.y - pathNode.through.y !== previous.y - pathNode.y
              ) {
                path.unshift({x: pathNode.x, y: pathNode.y});
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
