import { GameState } from './state';
import { getSvg } from './svg_utils';
import {
  ActionOptions,
  ActionOptionsWithState,
  Quote,
  Action,
  RoomObject,
  RoomObjectKey,
  ActionType,
} from './types';

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

export function onBodyClick(capture = false) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      if (capture) {
        document.body.classList.remove('actions-available');
      }
      document.body.addEventListener(
        'click',
        (event: MouseEvent) => {
          if (capture) {
            event.preventDefault();
            event.stopPropagation();
          }
          resolve();
          document.body.classList.add('actions-available');
        },
        { capture, once: true }
      );
    });
  });
}

/**
 * {{p}} will be replaced with the protagonist name.
 * _word_ will be italicized
 * Newlines will become paragraphs.
 */
export function formatString(input: string, state: GameState): string {
  return input
    .replace(/_(.+)_/, '<em>$1</em>')
    .replace('{{p}}', state.getProtagonistName())
    .replace('{{pp}}', state.getProtagonistFullName())
    .split('\n')
    .filter((p) => !!p)
    .map((p) => `<p>${p}</p>`)
    .join('');
}

export async function loadStyles(id: string, styleUrl: URL) {
  if (document.querySelector('style.loaded-styles-' + id)) {
    // It's already loaded.
    return;
  }

  const styleContent = await (await fetch(styleUrl)).text();
  var styleElement = document.createElement('style');
  styleElement.media = 'all';
  styleElement.innerHTML = styleContent;
  styleElement.className = 'loaded-styles-' + id;
  document.body.appendChild(styleElement);
}

export function findMatchingKey<
  T extends { [index in string | `${string}.${string}`]: unknown }
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
  const elementClone = element.cloneNode(true) as HTMLElement;

  const placeholder = document.createElement('div');
  placeholder.classList.add('placeholder');
  placeholder.appendChild(elementClone);

  element.innerHTML = '';

  const charCount = (element.textContent ?? '').length;
  let time = Math.min(Math.max(600 / charCount, 1), 10);
  if (slow) {
    time *= 10;
  }

  let canceller = { cancelled: false };

  const cancelCallback = (event: MouseEvent) => {
    console.log('cancelling!', canceller);
    if (!canceller.cancelled) {
      canceller.cancelled = true;
      element.innerHTML = elementClone.innerHTML;

      event.preventDefault();
      event.stopPropagation();
    }
  };
  setTimeout(() => {
    document.body.addEventListener('click', cancelCallback, { once: true });
  });

  await iterateOverChildren(elementClone, element, time, canceller);

  document.body.removeEventListener('click', cancelCallback);
}

async function iterateOverChildren(
  clone: HTMLElement | ChildNode,
  originalParent: HTMLElement,
  charTime: number,
  canceller: { cancelled: boolean }
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
  canceller: { cancelled: boolean }
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
