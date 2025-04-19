import {animatePosition} from './anim_utils';
import {useItemsTogether} from './inventoryHandler';
import {getCharacter} from './lazyLoaders';
import {dijkstra} from './pathfinding';
import {RoomHandler} from './roomHandler';
import {GameState} from './state';
import {
  createSvgElement,
  getDist,
  getDistance,
  getPosition,
  isPointWithinPath,
  loadSvgString,
  printDialog,
  tooltip,
} from './svg_utils';
import {Character, CharacterStyle, Coord, Room, RoomEntry} from './types';

export class ProtagonistHandler {
  private protagonistContainer?: SVGGElement;
  private protagonistPosition: SVGCircleElement = createSvgElement(
    'circle',
    'protagonist-position',
    {r: 5}
  ) as SVGCircleElement;

  private currentPosition: Coord = {x: 0, y: 0};
  private protagonistData?: Character;
  private activeCharacterStyle?: CharacterStyle;
  private activeCharacterScale = 1;

  constructor(
    private readonly gameState: GameState,
    private readonly roomHandler: RoomHandler
  ) {}

  async setupProtagonist(room: Room, entry: RoomEntry, startingCoord?: Coord) {
    this.protagonistData = (await getCharacter('protagonist'))!;

    // Insert the protagonist.
    this.activeCharacterStyle =
      this.protagonistData.styles[room.roomId] ??
      this.protagonistData.styles.main;
    const protagonistArt = await loadSvgString(
      this.activeCharacterStyle.artwork.url
    );

    this.activeCharacterScale = room.init.protagonistScale;
    this.currentPosition = startingCoord ?? entry.coords;
    this.protagonistContainer = createSvgElement(
      'g',
      'protagonist character',
      {}
    ) as SVGGElement;

    this.protagonistContainer.innerHTML = protagonistArt;
    this.roomHandler.getAccessibleArea()?.after(this.protagonistContainer);

    this.roomHandler.getAccessibleArea()?.after(this.protagonistPosition);

    tooltip(this.protagonistContainer).setText(
      this.gameState.getProtagonistName()
    );

    this.setProtagonistPosition(this.currentPosition);
    this.setupProtagonistClick();
  }

  isProtagonistCloseToObject(targetElement: SVGElement): Boolean {
    if (!this.protagonistContainer) {
      return true;
    }
    const target = getPosition(targetElement);

    const protagRect = getPosition(this.protagonistPosition);
    const protagLeft = protagRect.left;
    const protagRight =
      protagLeft + protagRect.width * this.activeCharacterScale;
    const protagTop = protagRect.top;
    const protagBottom = protagRect.bottom;
    const protagHands =
      protagTop + (protagRect.height * this.activeCharacterScale) / 4;

    const startingX =
      target.left + target.width < protagLeft ? protagLeft : protagRight;
    const endingX =
      target.left < protagLeft ? target.left + target.width : target.left;

    const startingY = target.top > protagTop ? protagBottom : protagHands;
    const endingY = target.top < protagBottom ? target.bottom : target.top;

    return (
      getDist(
        [
          {x: startingX, y: startingY},
          {x: endingX, y: endingY},
        ],
        this.protagonistPosition
      ) <=
      protagRect.width * this.activeCharacterScale
    );
  }

  async moveProtagonistAsCloseAsPossibleTo(target: DOMRect): Promise<void> {
    const targetCoord: Coord = {x: 0, y: target.bottom - target.width / 2};
    const protag = getPosition(this.protagonistPosition);
    if (target.right < protag.left) {
      targetCoord.x = target.right;
    } else if (target.left > protag.right) {
      targetCoord.x = target.left;
    } else {
      targetCoord.x = target.left + target.width;
    }

    const isClickedPointInsideArea = isPointWithinPath(
      targetCoord,
      this.roomHandler.getAccessibleArea()
    );

    let gotoPoint: Coord | undefined = undefined;
    if (isClickedPointInsideArea) {
      gotoPoint = targetCoord;
    } else {
      // Draw a line from the current coords to the clicked coord - the last point which is
      // within the accessible area is the target??

      const {left: areaX, top: areaY} = getPosition(
        this.roomHandler.getAccessibleArea()!
      );

      const coords: Coord[] = [targetCoord];
      if (targetCoord.y < areaY) {
        coords.push({x: Math.max(areaX, targetCoord.x), y: areaY});
      }
      coords.push(this.currentPosition);
      const {length, line} = getDistance(coords, this.protagonistPosition);

      for (let p = 20; p < length; p += 20) {
        const pos = line.getPointAtLength(p);
        if (isPointWithinPath(pos, this.roomHandler.getAccessibleArea())) {
          gotoPoint = pos;

          p = length;
        }
      }
      line.remove();
    }

    if (gotoPoint) {
      // TODO: add some padding to give the protag space.

      await this.animateProtagonistTo(gotoPoint);
    } else {
      await this.cannotGetThere();
    }
    this.gameState.setProtagonistPosition(this.currentPosition);
  }

  private async cannotGetThere() {
    await printDialog(`I don't know how to get to there.`, this.gameState);
  }

  private async animateProtagonistTo(gotoPoint: Coord) {
    const waypoints = dijkstra(
      this.currentPosition,
      gotoPoint,
      this.roomHandler.getAccessibleArea()!
    );

    if (!waypoints?.length) {
      await this.cannotGetThere();
      return;
    }

    /** DEBUG */
    // for (const node of waypoints) {
    //   const circ = createSvgElement('circle', 'test-whatever', {
    //     cx: node.x,
    //     cy: node.y,
    //     r: 5,
    //     fill: 'blue',
    //   });
    //   getSvg().append(circ);
    // }
    /** /DEBUG */

    const length = getDist(waypoints);

    const speed = this.activeCharacterStyle!.speed ?? 200;
    const seconds = length / speed;

    await animatePosition(waypoints, seconds * 1000, (coord) => {
      this.setProtagonistPosition(coord);
    });
  }

  private setProtagonistPosition({x, y}: Coord) {
    this.currentPosition = {x, y};

    this.protagonistPosition.setAttribute('cx', String(x));
    this.protagonistPosition.setAttribute('cy', String(y));

    this.protagonistContainer!.setAttribute(
      'transform',
      `translate(${
        x -
        (this.activeCharacterStyle!.artwork.coords?.x ?? 0) *
          this.activeCharacterScale
      }, ${
        y -
        (this.activeCharacterStyle!.artwork.coords?.y ?? 0) *
          this.activeCharacterScale
      }) scale(${this.activeCharacterScale})`
    );
  }

  private setupProtagonistClick() {
    this.protagonistContainer?.addEventListener('click', (event) => {
      const grabbedItem = this.gameState.getGrabbedItem();
      if (grabbedItem) {
        useItemsTogether(
          grabbedItem,
          'protagonist',
          'protagonist',
          this.gameState,
          this.roomHandler
        );
      }

      event.stopImmediatePropagation();
      event.stopPropagation();
    });
  }
}
