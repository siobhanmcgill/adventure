import {BehaviorSubject, map, Subject, withLatestFrom} from 'rxjs';
import {GameMode} from '..';
import {getCharacter} from '../lazyLoaders';
import {Character, CharacterStyle, Coord, Room} from '../types';
import {animatePosition} from '../utils/anim_utils';
import {
  createSvgElement,
  getDist,
  getDistance,
  getPosition,
  isPointWithinPath,
  loadSvgString,
  showQuotePanel,
  tooltip,
} from '../utils/svg_utils';
import {areAnimationsDisabled, computed} from '../utils/utils';
import {dijkstra} from './pathfinding';
import {FALLBACK_USE_ITEM_WITH} from '../constants';

/** This class handles setting up and controlling the protagonist in the level. */
export class ProtagonistHandler {
  private protagonistContainer?: SVGGElement;
  private protagonistPosition: SVGCircleElement = createSvgElement(
    'circle',
    'protagonist-position',
    {r: 5}
  ) as SVGCircleElement;

  private currentPosition = new BehaviorSubject<Coord>({x: 0, y: 0}); //Coord = {x: 0, y: 0};
  private protagonistData?: Character;
  private activeCharacterStyle?: CharacterStyle;
  private activeCharacterScale: () => number;

  private readonly isProtagReady = new Subject<boolean>();
  readonly isProtagReady$ = this.isProtagReady.asObservable();

  constructor(private readonly game: GameMode<SVGElement>) {
    this.activeCharacterScale = computed(
      this.currentPosition.pipe(
        withLatestFrom(this.game.state.room$),
        map(([{x, y}, room]) => {
          const charPos = y; // + (this.activeCharacterStyle!.artwork.coords?.y ?? 0);
          const {top, bottom} = getPosition(
            this.game.roomHandler.getAccessibleArea()!,
            this.game.getContainer()
          );
          const [scaleBottom, scaleTop] = room.init.protagonistScale;

          return (
            scaleTop +
            (scaleBottom - scaleTop) * ((charPos - top) / (bottom - top))
          );
        })
      )
    );

    this.currentPosition.subscribe(({x, y}) => {
      this.protagonistPosition.setAttribute('cx', String(x));
      this.protagonistPosition.setAttribute('cy', String(y));

      this.protagonistContainer?.setAttribute(
        'transform',
        `translate(${
          x -
          (this.activeCharacterStyle!.artwork.coords?.x ?? 0) *
            this.activeCharacterScale()
        }, ${
          y -
          (this.activeCharacterStyle!.artwork.coords?.y ?? 0) *
            this.activeCharacterScale()
        }) scale(${this.activeCharacterScale()})`
      );
    });
  }

  async setupProtagonist(room: Room, startingCoord: Coord) {
    this.protagonistData = (await getCharacter('protagonist'))!;

    // Insert the protagonist.
    this.activeCharacterStyle =
      this.protagonistData.styles[room.roomId] ??
      this.protagonistData.styles.main;
    const protagonistArt = await loadSvgString(
      this.activeCharacterStyle.artwork.url
    );

    this.protagonistContainer = createSvgElement(
      'g',
      'protagonist character',
      {}
    ) as SVGGElement;

    this.protagonistContainer.innerHTML = protagonistArt;
    this.game.roomHandler.getAccessibleArea()?.after(this.protagonistContainer);

    this.game.roomHandler.getAccessibleArea()?.after(this.protagonistPosition);

    tooltip(this.protagonistContainer, this.game.getContainer()).setText(
      this.game.state.getProtagonistName()
    );

    this.setProtagonistPosition(startingCoord);
    this.setupProtagonistClick();

    this.isProtagReady.next(true);
  }

  isProtagonistCloseToObject(targetElement: SVGElement): Boolean {
    if (!this.protagonistContainer) {
      return true;
    }
    const target = getPosition(targetElement, this.game.getContainer());
    const scale = this.activeCharacterScale();

    const protagRect = getPosition(
      this.protagonistPosition,
      this.game.getContainer()
    );
    const protagLeft = protagRect.left;
    const protagRight = protagLeft + protagRect.width * scale;
    const protagTop = protagRect.top;
    const protagBottom = protagRect.bottom;
    const protagHands = protagTop + (protagRect.height * scale) / 4;

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
      protagRect.width * scale
    );
  }

  async moveProtagonistAsCloseAsPossibleTo(
    target: DOMRect,
    ignoreFailure = false
  ): Promise<void> {
    const targetCoord: Coord = {x: 0, y: target.bottom - target.width / 2};
    const protag = getPosition(
      this.protagonistPosition,
      this.game.getContainer()
    );
    if (target.right < protag.left) {
      targetCoord.x = target.right;
    } else if (target.left > protag.right) {
      targetCoord.x = target.left;
    } else {
      targetCoord.x = target.left + target.width;
    }

    const isClickedPointInsideArea = isPointWithinPath(
      targetCoord,
      this.game.getContainer(),
      this.game.roomHandler.getAccessibleArea()
    );

    let gotoPoint: Coord | undefined = undefined;
    if (isClickedPointInsideArea) {
      gotoPoint = this.roundCoords(targetCoord);
    } else {
      // Draw a line from the current coords to the clicked coord - the last point which is
      // within the accessible area is the target??

      const {left: areaX, top: areaY} = getPosition(
        this.game.roomHandler.getAccessibleArea()!,
        this.game.getContainer()
      );

      const coords: Coord[] = [targetCoord];
      if (targetCoord.y < areaY) {
        coords.push({x: Math.max(areaX, targetCoord.x), y: areaY});
      }
      coords.push(this.currentPosition.getValue());
      const {length, line} = getDistance(coords, this.protagonistPosition);

      for (let p = 20; p < length; p += 20) {
        const pos = line.getPointAtLength(p);
        if (
          isPointWithinPath(
            pos,
            this.game.getContainer(),
            this.game.roomHandler.getAccessibleArea()
          )
        ) {
          gotoPoint = this.roundCoords(pos);

          p = length;
        }
      }
      line.remove();
    }

    if (gotoPoint) {
      // TODO: add some padding to give the protag space.

      await this.animateProtagonistTo(gotoPoint);
    } else if (!ignoreFailure) {
      await this.cannotGetThere();
    }
    this.game.state.setProtagonistPosition(this.currentPosition.getValue());
  }

  private roundCoords(coords: Coord) {
    return {x: Math.round(coords.x), y: Math.round(coords.y)};
  }

  private async cannotGetThere() {
    await showQuotePanel(`I don't know how to get to there.`, this.game);
  }

  private async animateProtagonistTo(gotoPoint: Coord) {
    if (areAnimationsDisabled()) {
      this.setProtagonistPosition(gotoPoint);
      return;
    }

    const waypoints = dijkstra(
      this.currentPosition.getValue(),
      gotoPoint,
      this.game.getContainer(),
      this.game.roomHandler.getAccessibleArea()!
    );

    if (!waypoints?.length) {
      await this.cannotGetThere();
      return;
    }

    /** DEBUG */
    if (document.body.classList.contains('debug')) {
      for (const node of waypoints) {
        const circ = createSvgElement('circle', 'test-whatever', {
          cx: node.x,
          cy: node.y,
          r: 5,
          fill: 'blue',
        });
        this.game.getContainer().append(circ);
      }
    }
    /** /DEBUG */

    const length = getDist(waypoints, undefined, this.game.getContainer());

    const speed = this.activeCharacterStyle!.speed ?? 200;
    const seconds = length / speed;

    await animatePosition(waypoints, seconds * 1000, (coord) => {
      this.setProtagonistPosition(this.roundCoords(coord));
    });
  }

  private setProtagonistPosition({x, y}: Coord) {
    this.currentPosition.next({x, y});
  }

  private setupProtagonistClick() {
    this.protagonistContainer?.addEventListener('click', (event) => {
      const grabbedItem = this.game.state.getGrabbedItem();
      if (grabbedItem) {
        this.game.actionHandler.doAction({
          action: grabbedItem.use?.protagonist ?? FALLBACK_USE_ITEM_WITH,
          target: 'item',
          targetId: 'protagonist',
          actionName: 'usewith:protagonist',
        });
      }

      event.stopImmediatePropagation();
      event.stopPropagation();
    });
  }
}
