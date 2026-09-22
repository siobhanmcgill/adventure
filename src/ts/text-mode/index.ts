import {
  BehaviorSubject,
  combineLatest,
  debounce,
  debounceTime,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  merge,
  Observable,
  startWith,
  Subject,
  take,
  zip,
} from 'rxjs';
import {AnyGameMode, GameMode} from '..';
import {ActionHandler} from '../actionHandler';
import {FIRST_ROOM, NEW_GAME_PROMPT} from '../constants';
import {AGENCY_SAVE_STATE, GameState, LOCALSTORAGE_DEBUG} from '../game-state';
import {InventoryHandler} from '../inventoryHandler';
import {getRoom} from '../lazyLoaders';
import {ObjectPanelHandler} from '../objectPanelHandler';
import {GeneralPanel} from '../panels/generalPanel';
import {RoomHandler} from '../roomHandler';
import {TooltipHandler} from '../tooltipHandler';
import {Quote} from '../types';
import {
  areAnimationsDisabled,
  disectQuoteString,
  findMatchingKey,
  formatString,
  getStorage,
  getVersionString,
  html,
  htmlToNode,
  promiseWait,
  query,
  queryAll,
  setStorage,
  transitionToClass,
  typeEffect,
} from '../utils/utils';
import {showOptions} from './optionMenu';

export class AgencyText implements GameMode<HTMLElement> {
  private readonly textStream: HTMLDivElement | null =
    query('.main-game-stream');

  private readonly inputWrapper: HTMLDivElement = query('.prompt-line');
  private readonly promptValue = new Subject<string>();
  private readonly mainLoopActiveSource = new BehaviorSubject<boolean>(true);
  private readonly bodyClickSource = new Subject<Event>();

  readonly roomHandler: RoomHandler<HTMLElement>;
  readonly tooltipHandler: TooltipHandler;
  readonly actionHandler: ActionHandler;
  readonly inventoryHandler: InventoryHandler;
  readonly objectPanelHandler: ObjectPanelHandler;

  constructor(readonly state: GameState) {
    this.roomHandler = new RoomHandler(this);
    this.tooltipHandler = new TooltipHandler(this);
    this.actionHandler = new ActionHandler(this);
    this.inventoryHandler = new InventoryHandler(this);
    this.objectPanelHandler = new ObjectPanelHandler(this);

    // When states are added or removed, apply any "onApply" or "onRemove" functions.
    let previousStates: string[] = [];
    const stateOnloadStates = new Map<string, unknown | undefined>();
    combineLatest([this.state.room$, this.state.roomStates$])
      .pipe(
        filter(([roomData]) => !!roomData),
        debounceTime(100)
      )
      .subscribe(([roomData, states]) => {
        // Trigger the onapply function for any state that is added.
        for (const state of states) {
          if (
            !previousStates.includes(state) &&
            roomData.states[state]?.onApply
          ) {
            stateOnloadStates.set(state, roomData.states[state].onApply(this));
          }
        }
        for (const state of previousStates) {
          if (!states.includes(state) && roomData.states[state]?.onRemove) {
            roomData.states[state].onRemove(this, stateOnloadStates.get(state));
            stateOnloadStates.delete(state);
          }
        }
        previousStates = states;
      });

    combineLatest([
      this.mainLoopActiveSource,
      this.roomHandler.isRoomReady$,
      this.promptValue.pipe(startWith('')),
    ])
      .pipe(debounceTime(100))
      .subscribe(async ([active, roomReady, input]) => {
        if (active && roomReady) {
          this.showInput();
        } else {
          this.hideInput();
        }
        if (active && roomReady && input) {
          this.promptValue.next('');
          this.print(`player::${input}`);

          if (CUSTOM_COMMANDS[input]) {
            await CUSTOM_COMMANDS[input](this);
          } else {
            await promiseWait(100);
            await this.actionHandler.doActionString(input);
          }
        }
      });

    merge(
      fromEvent(document.body, 'click'),
      fromEvent(document.body, 'keypress')
    )
      .pipe(
        filter((event) => {
          return (
            !(event as KeyboardEvent).key ||
            (event as KeyboardEvent).key === 'Space' ||
            (event as KeyboardEvent).key === 'Enter'
          );
        })
      )
      .subscribe(this.bodyClickSource);
  }

  async onBodyClick(): Promise<void> {
    const isLoopActive = this.mainLoopActiveSource.getValue();
    if (isLoopActive) {
      this.mainLoopActiveSource.next(false);
    }
    document.body.classList.add('waiting-for-click');
    await firstValueFrom(this.bodyClickSource);
    document.body.classList.remove('waiting-for-click');
    if (isLoopActive && !this.bodyClickSource.observed) {
      this.mainLoopActiveSource.next(true);
    }
  }

  isGraphic(): boolean {
    return false;
  }

  debug(...data: any[]) {
    if (this.state.isDebug()) {
      console.log('DEBUG:', ...data);
    }
  }

  getContainer(): HTMLDivElement {
    return this.textStream!;
  }

  clear() {
    this.getContainer().innerHTML = '';
    // TODO: fade the text out
    return promiseWait(100);
  }

  async play(): Promise<void> {
    if (!this.getContainer()) {
      console.error("Unable to find text stream! The game shan't work!");
      return Promise.resolve();
    }

    const mainTitle = query('.main-title h1') as HTMLElement;
    mainTitle.textContent = getVersionString('An Interactive Fiction Game');

    this.setupMenus();
    this.setupInputPrompt();
    this.setupBottomBar();

    const mainPanel = query('.main-text-panel') as HTMLElement;
    // Show the main panel
    await transitionToClass(mainPanel, 'show');

    // If there's no saved state, this is a new game.
    if (!getStorage(AGENCY_SAVE_STATE, undefined)) {
      this.newGame();
    }
  }

  private showInput() {
    this.inputWrapper.classList.add('show');
    this.scrollToBottom();
  }

  private hideInput() {
    this.inputWrapper.classList.remove('show');
  }

  async print(text: Quote, system = false, format = true): Promise<void> {
    if (!system) {
      // Hide the prompt.
      this.mainLoopActiveSource.next(false);
    }

    const queue = ([] as string[]).concat(text);
    const thisText = queue.shift() || '';
    const {effects, characterId, dialogText, stateControls, tooltipText} =
      disectQuoteString(thisText);

    this.debug('Printing', {
      text,
      system,
      effects,
      characterId,
      dialogText,
      stateControls,
      tooltipText,
    });

    if (effects?.includes('delay') && !areAnimationsDisabled()) {
      await promiseWait(1000);
    }
    if (effects?.includes('delay2') && !areAnimationsDisabled()) {
      await promiseWait(2000);
    }
    if (dialogText) {
      let node: HTMLElement;
      if (characterId) {
        node = await this.printCharacter({effects, characterId, dialogText});
      } else {
        const formattedText = format
          ? formatString(dialogText, this.state)
          : dialogText;
        let nodeClass = 'text-line';
        if (effects?.includes('float-left')) {
          nodeClass += ' float-left';
        }
        if (effects?.includes('fullscreen')) {
          nodeClass += ' fullscreen';
        }
        if (effects?.includes('center')) {
          nodeClass += ' center';
        }
        node = htmlToNode(
          html`<div class="${nodeClass}">${formattedText}</div>`
        );

        if (tooltipText) {
          this.tooltipHandler.registerTarget(node, tooltipText);
        }

        this.getContainer().appendChild(node);
        this.scrollToBottom();

        if (effects?.includes('type') || effects?.includes('slow')) {
          await typeEffect(node, effects?.includes('slow'));
        } else if (!areAnimationsDisabled()) {
          const duration = Math.max(
            150,
            Math.ceil(node.innerText.length / 125) * 60
          );

          node.classList.add('reveal');
          node.style.transitionDuration = duration + 'ms';
          await promiseWait();
          node.classList.add('show');
          await promiseWait(duration);
        }
      }

      this.roomHandler.scanForObjects(node);
    }

    this.state.parseRoomStateControls(stateControls);

    if (queue.length) {
      if (!effects?.includes('nowait') && !areAnimationsDisabled()) {
        await this.onBodyClick();
      }
      await this.print(queue, true);
    }

    if (!system) {
      // Hide the prompt.
      this.mainLoopActiveSource.next(true);
    }
  }

  private async printCharacter({
    effects,
    characterId,
    dialogText,
  }: {
    effects: string[];
    characterId: string;
    dialogText: string;
  }): Promise<HTMLElement> {
    let speakerName = '';
    if (characterId === 'protagonist' || characterId === 'p') {
      speakerName = this.state.getProtagonistName();
    } else if (characterId === 'player') {
      speakerName = 'You';
    }
    // else if (roomData.objects[characterId]) {
    //   const states = (
    //     await firstValueFrom(this.game.state.roomStates$)
    //   ).reverse();
    //   const key = findMatchingKey(
    //     roomData.objects[characterId],
    //     'name',
    //     states
    //   );
    //   speakerName = (roomData.objects[characterId][key] as string) ?? '';
    // }

    const formattedText = formatString(dialogText, this.state);
    const characterLine: HTMLDivElement = htmlToNode(
      html`<div class="text-line character-line">
        <div class="character character-${characterId}">
          <div class="name">${speakerName}</div>
          <div class="text">${formattedText}</div>
        </div>
      </div>`
    );
    this.getContainer().appendChild(characterLine);
    this.scrollToBottom();
    if (characterId === 'player') {
      await promiseWait(100);
    } else {
      await typeEffect(
        query('.text', characterLine),
        effects?.includes('slow')
      );
    }
    return characterLine;
  }

  /** Prompt for user input. */
  async prompt(): Promise<string> {
    let shouldHide = false;
    if (!this.inputWrapper.classList.contains('show')) {
      this.showInput();
      shouldHide = true;
    }
    query<HTMLInputElement>('input', this.inputWrapper).focus();
    this.scrollToBottom();

    const value = await firstValueFrom(this.promptValue.pipe(filter(Boolean)));
    this.promptValue.next('');

    if (shouldHide) {
      this.hideInput();
    }
    return value;
  }

  private async newGame(): Promise<void> {
    console.log('new game!');
    await this.clear();
    await this.print(NEW_GAME_PROMPT);
    const name = await this.newGameNamePrompt();

    this.state.setProtagonistName(name);

    await this.print([
      `{nowait}No judgement, just making sure.`,
      `Now then, where were we . . .`,
    ]);
    await this.onBodyClick();

    await this.clear();
    await this.print(`{slow,fullscreen}<h2>Prologue</h2>`);
    await this.onBodyClick();
    this.state.setChapter('Prologue');

    this.clear();
    this.state.setRoom((await getRoom(FIRST_ROOM))!);
    this.state.markReady();
  }

  async scrollToBottom() {
    query('.scroll-to-here').scrollIntoView({behavior: 'smooth'});
    await promiseWait(300);
  }

  private async newGameNamePrompt(again = 0): Promise<string> {
    if (again > 0) {
      let actual = '';
      for (let x = 0; x < again; x++) {
        actual += 'actual ';
      }
      await this.print(`Okay, then what is her ${actual} name?`);
    }

    const name = await this.prompt();
    this.print('player::' + name);

    await this.print(`Really? Her name is ${name}?`);

    const response = await showOptions(this, [
      {text: 'Yes', goto: 'yes'},
      {text: 'Just kidding', goto: 'no'},
    ]);

    if (response === 'yes') {
      return name;
    } else {
      return this.newGameNamePrompt(again + 1);
    }
  }

  private setupInputPrompt() {
    const inputElement: HTMLInputElement = query('input', this.inputWrapper);
    // Clicking anywhere will set focus in the input if it is visible.
    document.body.addEventListener('click', () => {
      if (this.inputWrapper.classList.contains('show')) {
        inputElement.focus();
      }
    });

    // Pressing enter on the input will send the value to the internal subject.
    inputElement.addEventListener(
      'keypress',
      (event) => {
        const inputValue = inputElement.value;
        // Ignore an empty response and keys that aren't enter.
        if (
          !inputValue ||
          ((event as KeyboardEvent).key &&
            (event as KeyboardEvent).key !== 'Enter')
        ) {
          return;
        }

        this.promptValue.next(inputValue);
        inputElement.value = '';
      },
      {capture: true}
    );
  }

  private setupMenus() {
    const menuBar = query('.main-text-panel .menu-bar');
    const overlayElement = query('.overlays');

    const hideAllMenus = () => {
      for (const submenu of queryAll<HTMLElement>('.overlays .menu-menu')) {
        submenu.classList.remove('show');
        submenu.style.left = '';
      }
      for (const menuButton of queryAll<HTMLElement>(
        '.main-text-panel .menu-bar .menu-button'
      )) {
        menuButton.classList.remove('active');
      }
    };

    document.body.addEventListener('click', (e) => {
      hideAllMenus();
    });

    for (const menu of MENUS) {
      const menuButton = htmlToNode(
        html`<button class="menu-button">${menu.label}</button>`
      );

      menuBar.appendChild(menuButton);

      const submenu = htmlToNode(html`<div class="menu-menu"></div>`);
      for (const option of menu.options ?? []) {
        let toggleHtml = '';
        if (option.getToggleState) {
          const initialToggleState = option.getToggleState(this);
          toggleHtml = html`<span class="toggle-state"
            >${initialToggleState ? '&#x2713;' : ''}</span
          >`;
        }
        const optionButton = htmlToNode(
          html`<button class="menu-button">
            ${toggleHtml} ${option.label}
          </button>`
        );
        submenu.appendChild(optionButton);
        optionButton.addEventListener('click', async (e) => {
          hideAllMenus();
          e.preventDefault();
          e.stopPropagation();

          if (option.onclick) {
            await option.onclick(this);
          }
          if (option.getToggleState) {
            const newState = option.getToggleState(this);
            query('.toggle-state', optionButton).innerHTML = newState
              ? '&#x2713;'
              : '';
          }
        });
      }
      if (!menu.options?.length) {
        // No list of options
        const optionButton = htmlToNode(
          html`<button class="menu-button">
            (This menu does not exist yet.)
          </button>`
        );
        submenu.appendChild(optionButton);
      }
      overlayElement.appendChild(submenu);

      menuButton.addEventListener('click', (e) => {
        hideAllMenus();

        if (!submenu.classList.contains('show')) {
          submenu.classList.add('show');
          const {left, top, height} = menuButton.getBoundingClientRect();
          submenu.style.left = `${left}px`;
          submenu.style.top = `${top + height}px`;

          menuButton.classList.add('active');
        }

        e.preventDefault();
        e.stopPropagation();
      });
    }
  }

  private setupBottomBar() {
    const bottomBar = query('.main-text-panel .bottom-bar');
    combineLatest([this.state.room$, this.state.roomStates$]).subscribe(
      ([room, states]) => {
        bottomBar.innerHTML = '<span></span>';
        if (this.state.getProtagonistFullName()) {
          const nameSpan = htmlToNode(
            html`<span>${this.state.getProtagonistFullName()}</span>`
          );
          bottomBar.appendChild(nameSpan);
        }

        if (this.state.getChapter()) {
          const nameSpan = htmlToNode(
            html`<span>${this.state.getChapter()}</span>`
          );
          bottomBar.appendChild(nameSpan);
        }

        if (room) {
          const name = room.name
            ? room.name[findMatchingKey(room.name, 'default', states)]
            : 'Room';
          const nameSpan = htmlToNode(
            html`<span>${formatString(String(name), this.state)}</span>`
          );
          bottomBar.appendChild(nameSpan);
        }
      }
    );
  }
}

interface Menu {
  label: string;
  onclick?: (mode: AnyGameMode) => void | Promise<void>;
  getToggleState?: (mode: AnyGameMode) => boolean;
  options?: Menu[];
}

const MENUS: Menu[] = [
  {
    label: 'File',
    options: [
      {
        label: 'New game',
        onclick: async (mode) => {
          const commit = await new GeneralPanel(mode).show({
            contents: "Are you sure? You'll lose your progress.",
            options: [
              {text: 'Yes', value: true},
              {text: 'No', value: false},
            ],
            title: 'Start a new game?',
          });
          if (commit) {
            const debugstate = getStorage(LOCALSTORAGE_DEBUG, false);
            window.localStorage.clear();
            setStorage(LOCALSTORAGE_DEBUG, debugstate);

            window.location.reload();
          }
        },
      },
      {
        label: 'Reset room',
        onclick: async (mode) => {
          await mode.roomHandler.resetRoom();
        },
      },
      {
        label: 'Quit',
        onclick: () => {
          window.location.href = 'https://denyconformity.com';
        },
      },
    ],
  },
  {
    label: 'Options',
    options: [
      // {
      //   label: 'Show room object list',
      //   getToggleState: (game) => game.objectPanelHandler.isObjectListShown(),
      //   onclick: (game) => {
      //     game.objectPanelHandler.toggleObjectList();
      //   },
      // },
      // {
      //   label: 'Show inventory',
      //   getToggleState: (game) => game.objectPanelHandler.isInventoryShown(),
      //   onclick: (game) => {
      //     game.objectPanelHandler.toggleInventory();
      //   },
      // },
      // {
      //   label: 'Show network',
      //   getToggleState: (game) => game.objectPanelHandler.isNetworkListShown(),
      //   onclick: (game) => {
      //     game.objectPanelHandler.toggleNetworkList();
      //   },
      // },
      {
        label: 'Print room state',
        onclick: async (game) => {
          const states = await firstValueFrom(game.state.roomStates$);
          const room = await firstValueFrom(game.state.room$);
          game.print(
            `Current room: ${room.roomId}, states: ${states.join(', ')}`,
            true,
            false
          );
        },
      },
      {
        label: 'Debug mode',
        getToggleState: (game) => game.state.isDebug(),
        onclick: (game) => {
          game.state.toggleDebug();
        },
      },
    ],
  },
  {
    label: 'Help',
    options: [
      {
        label: 'About',
        onclick: (mode) => {
          new GeneralPanel(mode).show({
            contents: html`
              <div class="column center">
                <h1>Agency</h1>
                <div>Created by Siobhan Genesis</div>
                <div>latha.siobhan@gmail.com</div>
                <div>&copy; 2026</div>
              </div>
            `,
          });
        },
      },
    ],
  },
];

const CUSTOM_COMMANDS: {[index: string]: (game: AnyGameMode) => Promise<void>} =
  {
    roomcheck: async (game) => {
      await game.roomHandler.debug_roomcheck();
    },
  };
