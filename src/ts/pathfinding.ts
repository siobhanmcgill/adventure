import {
  getDistance,
  isPointWithinPath,
  createSvgElement,
  createSVGPoint,
  getDist,
} from './svg_utils';
import {Coord} from './types';

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

  const {length: testLength, line: testLine} = getDistance([start, end]);

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
    const results = [
      upAttempt,
      downAttempt,
      leftAttempt,
      rightAttempt,
    ].filter(r => !!r && r.length > 1).sort((a, b) => {
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
