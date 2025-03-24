import {getDist} from './svg_utils';
import {Coord} from './types';

export async function animatePosition(
  keyframes: Coord[],
  duration: number,
  positionHandler: (thisCoord: Coord) => void,
  totalDistance?: number
): Promise<void> {
  if (!totalDistance) {
    totalDistance = getDist(keyframes);
  }

  console.log({keyframes, duration});

  let from = keyframes.shift();
  if (!from) {
    return Promise.resolve();
  }
  // const durationPerFrame = duration / keyframes.length;
  while (keyframes.length) {
    let timeSpent = 0;
    const to = keyframes.shift()!;
    if (!to) {
      positionHandler(from);
      return Promise.resolve();
    }
    const thisDistance = getDist([from, to]);
    const distanceRatio = thisDistance / totalDistance;
    const thisDuration = duration * distanceRatio;

    let thisStartTime = 0;
    while (timeSpent < thisDuration) {
      const {x, y, startTime, timeOffset} = await commitPositionFrame(
        from,
        to,
        thisDuration,
        thisStartTime
      );
      thisStartTime = startTime;
      positionHandler({x, y});
      timeSpent = timeOffset;
    }
    from = to;
  }
}

async function commitPositionFrame(
  from: Coord,
  to: Coord,
  duration: number,
  startTime?: number
) {
  const time = await getFrame();
  if (!startTime) {
    startTime = time;
  }
  const timeOffset = time - startTime;
  const duratio = timeOffset / duration;
  const xDist = to.x - from.x;
  const yDist = to.y - from.y;

  return {
    x: from.x + xDist * duratio,
    y: from.y + yDist * duratio,
    startTime,
    timeOffset,
  };
}

function getFrame(): Promise<number> {
  return new Promise((resolve) => {
    window.requestAnimationFrame((time) => {
      resolve(time);
    });
  });
}
