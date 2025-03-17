import {GameState} from './state';
import {getSvg} from './svg_utils';

export function onBodyClick(capture = false) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      document.body.addEventListener('click', (event: MouseEvent) => {
        if (capture) {
          event.preventDefault();
          event.stopPropagation();
        }
        resolve();
      }, {capture, once: true});
    });
  });
}

/**
 * {{p}} will be replaced with the protagonist name.
 * _word_ will be italicized
 * Newlines will become paragraphs.
 */
export function formatString(input: string, state: GameState): string {
  return input.replace(/_(.+)_/, '<em>$1</em>')
      .replace('{{p}}', state.getProtagonistName())
      .split('\n')
      .filter(p => !!p)
      .map(p => `<p>${p}</p>`)
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

export function findMatchingKey(
    data: {[index: string]: unknown}, base: string, states: string[]) {
  const keys = Object.keys(data);
  let matchingKey: string = base;
  states.some(s => {
    const thisAction = `${base}.${s}`;
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
    element: HTMLElement, slow = false): Promise<void> {
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
  return await iterateOverChildren(elementClone, element, time);
}

async function iterateOverChildren(
    clone: HTMLElement|ChildNode, originalParent: HTMLElement,
    charTime: number): Promise<void> {
  if (clone.hasChildNodes()) {
    const children = clone.childNodes;
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE &&
          (child.textContent ?? '').length > 0) {
        const newTextNode = document.createTextNode('');
        originalParent.appendChild(newTextNode);
        await doChar(
            (child.textContent ?? '').split(''), newTextNode, charTime);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        const thisChildClone = child.cloneNode() as HTMLElement;
        originalParent.appendChild(thisChildClone);
        await iterateOverChildren(child, thisChildClone, charTime);
      } else {
        originalParent.appendChild(child.cloneNode());
      }
    }
  }
}

async function doChar(
    chars: string[], to: ChildNode|HTMLElement, time: number): Promise<void> {
  const thisChar = chars.shift() ?? '';
  await new Promise(resolve => {
    setTimeout(() => {
      to.textContent = (to.textContent ?? '') + thisChar;
      resolve(null);
    }, time);
  });
  return await (chars.length ? doChar(chars, to, time) : Promise.resolve());
}