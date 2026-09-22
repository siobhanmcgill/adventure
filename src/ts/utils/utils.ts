import {firstValueFrom, Observable} from 'rxjs';
import {ActionType, Coord, Quote, Room} from '../types';
import {DIALOG_TEXT_DURATION, VERSION} from '../constants';
import {GameState} from '../game-state';

/** Use like this: html`<div>whatever</div>` to make a template string smarter. */
export function html(strings: TemplateStringsArray, ...values: string[]) {
  return String.raw({raw: strings}, ...values);
}

export function setStorage<T>(key: string, value: T) {
  if (value === undefined) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

export function getStorage<T>(key: string, orProvide: T): T {
  const item = window.localStorage.getItem(key);
  if (item) {
    return JSON.parse(item);
  } else {
    return orProvide;
  }
}

export function hideActionButtons() {
  document.body.classList.remove('actions-available');
}

export function showActionButtons() {
  document.body.classList.add('actions-available');
}

export function getVersionString(extra = '') {
  return `Agency v${VERSION} ${!!extra ? '|' : ''} ${extra}`;
}

export function doNothing(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export function whatIs(input?: ActionType): 'action' | 'quote' {
  if (
    typeof input === 'string' ||
    ((input as string[]).length && typeof (input as string[])[0] === 'string')
  ) {
    return 'quote';
  }

  return 'action';
}

export function query<T extends Element>(
  selector: string,
  parent?: Element
): T {
  // Select SVG layers by label using a $
  if (selector.startsWith('$')) {
    selector = `[inkscape\\:label='${selector.replace('$', '')}']`;
  }

  return (parent ?? document).querySelector(selector) as T;
}

export function queryAll<T extends Element>(
  selector: string,
  parent?: Element
): NodeListOf<T> {
  // Select SVG layers by label using a $
  if (selector.startsWith('$')) {
    selector = `[inkscape\\:label='${selector.replace('$', '')}']`;
  }

  return (parent ?? document).querySelectorAll(selector);
}

// TODO: Figure out a way to clear this from outside this context.
// export function onBodyClick(capture = false) {
//   return new Promise<void>((resolve) => {
//     setTimeout(() => {
//       const fn = (event: Event) => {
//         if (
//           (event as KeyboardEvent).key &&
//           (event as KeyboardEvent).key !== 'Space' &&
//           (event as KeyboardEvent).key !== 'Enter'
//         ) {
//           return;
//         }

//         if (capture) {
//           event.preventDefault();
//           event.stopPropagation();
//         }
//         resolve();
//         document.body.classList.remove('waiting-for-click');
//         document.body.removeEventListener('click', fn);
//         document.body.removeEventListener('keypress', fn);
//       };
//       document.body.classList.add('waiting-for-click');
//       document.body.addEventListener('click', fn, {capture, once: true});
//       document.body.addEventListener('keypress', fn, {capture, once: true});
//     });
//   });
// }

export function disectQuoteString(quote: string) {
  if (quote.startsWith('::')) {
    // This is just a state control.
    return {
      characterId: '',
      effects: ['nowait'],
      dialogText: '',
      stateControls: quote.replace('::', ''),
      tooltipText: '',
    };
  }

  const matcher =
    // /^(([a-z-_]+)::)?({([a-z-_:, ]+)})?((?:(?!::).)+)(::([a-z-+_]+))?/i;
    /^(([a-z-_]+)::)?({([a-z-_:0-9, ]+)})?((?:(?!::|%).)+)(::([a-z-+_]+))?(%%(.*))?/i;

  /**
   * p::{slow}Here's an example line::+spoken%Some tooltip
   * Matching groups:
   * 0. Entire string
   * 1. p::
   * 2. p -           characterId
   * 3. {slow}        -
   * 4. slow -        effects
   * 5.               dialogText
   * 6. ::+spoken     -
   * 7. +spoken -     stateControls
   * 8. %%Some tooltip -
   * 9.               tooltipText
   */
  const [
    ,
    ,
    characterId,
    ,
    effects,
    dialogText,
    ,
    stateControls,
    ,
    tooltipText,
  ] = quote.trim().replaceAll('\n', '').match(matcher) ?? [];

  return {
    characterId: characterId ?? '',
    effects: effects?.split(','),
    dialogText,
    stateControls: stateControls,
    tooltipText,
  };
}

export function parseStateControls(state: GameState, stateControls?: string) {
  const chars = stateControls?.split('');
  let add: boolean = true;
  let thisState = '';
  for (const char of chars ?? []) {
    if (char === '+' || char === '-') {
      if (thisState) {
        if (add) {
          state.addRoomState(thisState);
        } else {
          state.removeRoomState(thisState);
        }
        thisState = '';
      }
    }
    if (char === '+') {
      add = true;
    } else if (char === '-') {
      add = false;
    } else {
      thisState += char;
    }
  }
  if (thisState) {
    if (add) {
      state.addRoomState(thisState);
    } else {
      state.removeRoomState(thisState);
    }
  }
}

// Look for object references in the text, which will look like:
// . . . #[objectId]:[some text]#
export const OBJECT_MATCHER = /#([a-zA-Z0-9_-]+):?(((?!#).)*)?#/gi;

/**
 * Pseudo-markdown formatting
 * {{p}} will be replaced with the protagonist name.
 * _word_ will be italicized
 * ![alt](url) is an image
 * Newlines will become paragraphs.
 */
export function formatString(input: string, state: GameState): string {
  if (!input) {
    return '';
  }
  if (input.startsWith('<') && input.endsWith('>')) {
    // This is html, so we expect it to already be formatted.
    return input;
  }

  // Put it into paragraphs unless it seems to be entirely an html tag.
  input = input
    .trim()
    .split('\n')
    .filter((p) => !!p)
    .map((p) => `<p>${p}</p>`)
    .join('');

  const objectMatches = input.matchAll(OBJECT_MATCHER);
  for (const [match, objectId, objectName] of objectMatches ?? []) {
    input = input.replace(
      match,
      `<span class="room-object" data-object-id="${objectId}">${
        objectName ?? objectId
      }</span>`
    );
  }

  return (
    input
      // .replaceAll(
      //   objectMatcher,
      //   '<span class="room-object" data-object-id="$1">$2</span>'
      // )
      .replace(/\b_([^_]+)_\b/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<s>$1</s>')
      .replace(
        /\!\[(.*)\]\((.*)\)/,
        html`<img
          class="inline-image"
          src="./assets/$2"
          alt="$1" />`
      )
      .replace('{{p}}', state.getProtagonistName())
      .replace('{{pp}}', state.getProtagonistFullName())
      .replace('{{pl}}', state.getProtagonistLastName())
      .replace('{{pd}}', state.getProtagonistDeadname())
      .replace('{{pdd}}', state.getProtagonistDeadFullName())
  );
}

export async function loadStyles(id: string, styleUrl: URL) {
  if (!!document.querySelector('style.loaded-styles-' + id)) {
    // It's already loaded.
    return;
  }

  // TODO: there might be a better way to dynamically import CSS with Vite.
  // TODO: document.adoptedStyleSheets??
  const styleContent = (
    await import(/* @vite-ignore */ styleUrl.href + '?inline')
  ).default;
  var styleElement = document.createElement('style');
  styleElement.media = 'all';
  styleElement.innerHTML = styleContent;
  styleElement.classList.add('loaded-style');
  styleElement.classList.add('loaded-styles-' + id);
  document.head.appendChild(styleElement);
}

export function htmlToNode<T extends HTMLElement | SVGElement>(
  html: string
): T {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild as T;
}

export function findMatchingKey<
  T extends {[index in string | `${string}.${string}`]: unknown}
>(data: T, base: string, states: string[]): keyof T {
  const keys = Object.keys(data) as Array<keyof T>;
  let matchingKey: keyof T = base;
  states.some((s) => {
    const thisAction: keyof T = `${base}.${s}`;
    const pass = keys.includes(thisAction);
    if (pass) {
      matchingKey = thisAction;
    }
    return pass;
  });
  return matchingKey;
}

/**
 * Clone all contents to a placeholder
 * Calculate time
 * For each child...
 *  If it's a text node
 *    Add each character one at a time to parent
 *  Else
 *    Clone to original parent without any children
 *    Recurse with this node's children
 */

export async function typeEffect(
  element: HTMLElement,
  slow = false
): Promise<void> {
  if (areAnimationsDisabled()) {
    return Promise.resolve();
  }

  const elementClone = element.cloneNode(true) as HTMLElement;

  const placeholder = document.createElement('div');
  placeholder.classList.add('placeholder');
  placeholder.appendChild(elementClone);

  element.innerHTML = '';

  const charCount = (elementClone.textContent ?? '').length;
  let time = Math.min(Math.max(DIALOG_TEXT_DURATION / charCount, 0.5), 20);
  if (slow) {
    time *= 5;
  }
  let canceller = {cancelled: false};

  const cancelCallback = (event: Event) => {
    if (!canceller.cancelled) {
      canceller.cancelled = true;
      element.innerHTML = elementClone.innerHTML;

      event.preventDefault();
      event.stopPropagation();
    }
  };
  setTimeout(() => {
    document.body.addEventListener('click', cancelCallback, {once: true});
    document.body.addEventListener('keydown', cancelCallback, {once: true});
  });

  await iterateOverChildren(elementClone, element, time, canceller);

  document.body.removeEventListener('click', cancelCallback);
  document.body.removeEventListener('keydown', cancelCallback);
}

async function iterateOverChildren(
  clone: HTMLElement | ChildNode,
  originalParent: HTMLElement,
  charTime: number,
  canceller: {cancelled: boolean}
): Promise<void> {
  if (canceller.cancelled) {
    return;
  }
  if (clone.hasChildNodes()) {
    const children = clone.childNodes;
    for (const child of children) {
      if (
        child.nodeType === Node.TEXT_NODE &&
        (child.textContent ?? '').length > 0
      ) {
        const newTextNode = document.createTextNode('');
        originalParent.appendChild(newTextNode);
        await doChar(
          (child.textContent ?? '').split(''),
          newTextNode,
          charTime,
          canceller
        );
      } else if (child.nodeType !== Node.TEXT_NODE) {
        const thisChildClone = child.cloneNode() as HTMLElement;
        originalParent.appendChild(thisChildClone);
        await iterateOverChildren(child, thisChildClone, charTime, canceller);
      } else {
        originalParent.appendChild(child.cloneNode());
      }
    }
  }
}

async function doChar(
  chars: string[],
  to: ChildNode | HTMLElement,
  time: number,
  canceller: {cancelled: boolean}
): Promise<void> {
  if (canceller.cancelled) {
    return;
  }
  const thisChar = chars.shift() ?? '';
  await new Promise((resolve) => {
    setTimeout(() => {
      to.textContent = (to.textContent ?? '') + thisChar;
      resolve(null);
    }, time);
  });
  return await (chars.length
    ? doChar(chars, to, time, canceller)
    : Promise.resolve());
}

// Converts a timeout to a promise so we can awaita for it.
export async function promiseWait(ms = 1) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function areAnimationsDisabled() {
  return document.body.classList.contains('disable-animations');
}

/**
 * Applies (or removes) a class on an element, and then returns a promise which
 * fires when the transition completes. This way I can await a CSS transition
 * before moving on.
 */
export async function transitionToClass(
  element: HTMLElement | SVGElement,
  className: string | `${'-'}${string}`
) {
  await promiseWait();

  const animWaiter = new Promise<number>((resolve) => {
    let isThereAnimation = false;
    element.onanimationstart = () => {
      isThereAnimation = true;
    };
    element.onanimationend = (event) => resolve(event.elapsedTime);
    element.onanimationcancel = (event) => resolve(event.elapsedTime);
    element.addEventListener('transitionstart', () => {
      isThereAnimation = true;
    });
    element.addEventListener('transitionend', (event) =>
      resolve((event as TransitionEvent).elapsedTime)
    );
    element.addEventListener('transitioncancel', (event) =>
      resolve((event as TransitionEvent).elapsedTime)
    );
    if (areAnimationsDisabled()) {
      resolve(0);
    }
    // If an animation hasn't started, just abort.
    setTimeout(() => {
      if (!isThereAnimation) {
        resolve(0);
      }
    }, 500);
  });

  if (className.startsWith('-')) {
    // If the element is already missing the class, we can't wait on the transition.
    if (!element.classList.contains(className.substring(1))) {
      return Promise.resolve();
    }
    element.classList.remove(className.substring(1));
  } else {
    // If the element already has the class, we can't wait on the transition.
    if (element.classList.contains(className.substring(1))) {
      return Promise.resolve();
    }
    element.classList.add(className);
  }

  return animWaiter;
}

export function computed<T>(from: Observable<T>) {
  let value: T;
  from.subscribe((v) => (value = v));

  return () => value;
}
