import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  firstValueFrom,
} from 'rxjs';
import {AnyGameMode} from '.';
import {
  findMatchingKey,
  formatString,
  getStorage,
  html,
  htmlToNode,
  query,
  setStorage,
  transitionToClass,
} from './utils/utils';
import {ObjectHandler} from './objectHandler';

const SETTING_OBJECT_LIST_SHOWN = 'side-pane-list-shown';

type ObjectListOptions = 'room' | 'inventory' | 'friends' | undefined;

export class ObjectPanelHandler {
  private readonly paneElem: HTMLElement = query('.object-list-pane');

  private whichObjectListIsShownSource = new BehaviorSubject<ObjectListOptions>(
    getStorage(SETTING_OBJECT_LIST_SHOWN, undefined)
  );

  private roomPane = query('.room-pane');
  private inventoryPane = query('.inventory-pane');
  private friendsPane = query('.friends-pane');
  // private roomTab: HTMLElement = query('.room-panel-tab', this.panelElem);
  // private roomListElem: HTMLElement = query('.room-list', this.panelElem);

  // private inventoryTab: HTMLElement = query(
  //   '.inventory-panel-tab',
  //   this.panelElem
  // );
  // private inventoryListElem: HTMLElement = query(
  //   '.inventory-list',
  //   this.panelElem
  // );

  // private networkTab: HTMLElement = query('.network-panel-tab', this.panelElem);
  // private networkListElem: HTMLElement = query('.network-list', this.panelElem);

  private panelHeight = 0;

  constructor(private readonly game: AnyGameMode) {
    this.setupButtons();

    // query(
    //   'h4',
    //   this.roomListElem
    // ).innerHTML = `Stuff ${this.game.state.getProtagonistName()} has seen`;
    // query(
    //   'h4',
    //   this.inventoryListElem
    // ).innerHTML = `${this.game.state.getProtagonistName()}'s inventory`;

    combineLatest([
      this.whichObjectListIsShownSource,
      this.game.state.roomStates$,
      this.game.roomHandler.objectUpdates$,
      this.game.inventoryHandler.inventoryUpdated$,
    ])
      .pipe(debounceTime(100))
      .subscribe(async ([which, states]) => {
        const toolbar = query('.main-text-panel .toolbar');
        const roomBtn = query('.toolbar-room-button', toolbar);
        const inventoryBtn = query('.toolbar-inventory-button', toolbar);
        const friendBtn = query('.toolbar-friends-button', toolbar);

        if (!this.game.roomHandler.getObjects().length) {
          roomBtn.classList.add('displaynone');
        } else {
          if (roomBtn.classList.contains('displaynone')) {
            roomBtn.classList.remove('displaynone');
            roomBtn.classList.add('animation-blink');
          }
        }

        if (!this.game.inventoryHandler.getInventory().length) {
          inventoryBtn.classList.add('displaynone');
        } else {
          if (inventoryBtn.classList.contains('displaynone')) {
            inventoryBtn.classList.remove('displaynone');
            inventoryBtn.classList.add('animation-blink');
          }
        }

        friendBtn.classList.add('displaynone');

        setStorage(SETTING_OBJECT_LIST_SHOWN, which);
        const roomPane = query('.room-pane', this.paneElem);
        const inventoryPane = query('.inventory-pane', this.paneElem);
        const friendsPane = query('.friends-pane', this.paneElem);

        if (which) {
          // We don't have to wait for it to show to change the contents.
          this.paneElem.classList.remove('hidden');
        } else if (!this.paneElem.classList.contains('hidden')) {
          // Wait until it is hidden to change any contents.
          await transitionToClass(this.paneElem, 'hidden');
        }

        roomPane.classList.add('displaynone');
        inventoryPane.classList.add('displaynone');
        friendsPane.classList.add('displaynone');

        // It's the switch witch!
        switch (which) {
          case 'room':
            roomBtn.classList.add('active');
            roomPane.classList.remove('displaynone');
            this.refreshObjectListPanel(states);
            break;
          case 'inventory':
            inventoryBtn.classList.add('active');
            inventoryPane.classList.remove('displaynone');
            this.refreshInventoryList();
            break;
          case 'friends':
            friendBtn.classList.add('active');
            friendsPane.classList.remove('displaynone');
            // this.refreshInventoryList();
            break;
          default:
            break;
        }
      });
  }

  isRoomListShown() {
    return this.whichObjectListIsShownSource.getValue() === 'room';
  }

  toggleRoomList() {
    this.whichObjectListIsShownSource.next(
      this.isRoomListShown() ? undefined : 'room'
    );
  }

  isInventoryShown() {
    return this.whichObjectListIsShownSource.getValue() === 'inventory';
  }

  toggleInventory() {
    this.whichObjectListIsShownSource.next(
      this.isInventoryShown() ? undefined : 'inventory'
    );
  }

  isFriendListShown() {
    return this.whichObjectListIsShownSource.getValue() === 'friends';
  }

  toggleFriendList() {
    this.whichObjectListIsShownSource.next(
      this.isFriendListShown() ? undefined : 'friends'
    );
  }

  private setupButtons() {
    const toolbar = query('.main-text-panel .toolbar');
    const roomBtn = query('.toolbar-room-button', toolbar);
    const inventoryBtn = query('.toolbar-inventory-button', toolbar);
    const friendBtn = query('.toolbar-friends-button', toolbar);

    if (!this.game.roomHandler.getObjects().length) {
      roomBtn.classList.add('displaynone');
    } else {
      roomBtn.classList.remove('displaynone');
    }

    if (!this.game.inventoryHandler.getInventory().length) {
      inventoryBtn.classList.add('displaynone');
    } else {
      inventoryBtn.classList.remove('displaynone');
    }

    friendBtn.classList.add('displaynone');

    roomBtn.addEventListener('click', (e) => {
      roomBtn.classList.remove('active');
      inventoryBtn.classList.remove('active');
      friendBtn.classList.remove('active');

      this.toggleRoomList();

      e.preventDefault();
      e.stopPropagation();
    });

    inventoryBtn.addEventListener('click', (e) => {
      roomBtn.classList.remove('active');
      inventoryBtn.classList.remove('active');
      friendBtn.classList.remove('active');
      this.toggleInventory();

      e.preventDefault();
      e.stopPropagation();
    });

    friendBtn.addEventListener('click', (e) => {
      roomBtn.classList.remove('active');
      inventoryBtn.classList.remove('active');
      friendBtn.classList.remove('active');

      this.toggleFriendList();

      e.preventDefault();
      e.stopPropagation();
    });
  }

  private async refreshObjectListPanel(states: string[]) {
    const room = await firstValueFrom(this.game.state.room$);
    const name = room.name[findMatchingKey(room.name, 'default', states)];
    query('.object-list-pane h4', this.paneElem).innerHTML = formatString(
      name,
      this.game.state
    );

    const objects = this.game.roomHandler.getObjects();
    const container: HTMLElement = query('.room-list');
    container.innerHTML = '';
    for (const object of objects) {
      if (!states.includes(`${object.getId()}-picked-up`)) {
        await this.createObjectListItem(object, container);
      }
    }
    if (!container.childNodes.length) {
      container.appendChild(htmlToNode(html`<span>Nothing yet!</span>`));
    }
  }

  private async refreshInventoryList() {
    const objects = this.game.inventoryHandler.getInventory();
    const container: HTMLElement = query('.inventory-list');
    container.innerHTML = '';
    for (const object of objects) {
      await this.createObjectListItem(object, container);
    }
    if (!container.childNodes.length) {
      container.appendChild(htmlToNode(html`<span>Nothing yet!</span>`));
    }
  }

  private async createObjectListItem(
    object: ObjectHandler,
    container: HTMLElement
  ) {
    const text = await object.getName();
    const thisItem = htmlToNode(html`
      <div
        class="object-list-item"
        data-object-id="${object.getId()}">
        ${object.getIconHtml()}
        <p>${text}</p>
      </div>
    `);
    container.appendChild(thisItem);
  }
}
