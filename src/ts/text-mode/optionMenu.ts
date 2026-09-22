import {AgencyText} from '.';
import {ConvoResponseOption} from '../types';
import {doNothing, html, htmlToNode, query} from '../utils/utils';

/**
 * Show a menu of options for the player to choose from.
 * Returns a promise that resolves with the goto of the selected option.
 */
export async function showOptions(
  game: AgencyText,
  options: ConvoResponseOption[]
): Promise<string> {
  // TODO: filter options based on their conditionals and the active state.
  return new Promise<string>((resolve) => {
    const menuContainer: HTMLDivElement = htmlToNode(
      html`<div class="text-menu"></div>`
    );

    const optionElements: HTMLDivElement[] = [];
    let activeOptionIndex = 0;

    const bodyKeyFn = async (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          activeOptionIndex--;
          if (activeOptionIndex < 0) {
            activeOptionIndex = options.length - 1;
          }
          event.preventDefault();
          event.stopPropagation();
          break;
        case 'ArrowDown':
          activeOptionIndex++;
          if (activeOptionIndex >= options.length) {
            activeOptionIndex = 0;
          }
          event.preventDefault();
          event.stopPropagation();
          break;
        case 'Enter':
          selectOption();
          break;
        default:
          // Do nothing.
          break;
      }
      showActiveOption();
    };

    const selectOption = async () => {
      document.body.removeEventListener('keydown', bodyKeyFn, {
        capture: true,
      });
      game
        .getContainer()
        .removeEventListener('keydown', doNothing, {capture: true});
      const selectedText = options[activeOptionIndex].text;
      menuContainer.remove();
      await game.print('player::' + selectedText);

      resolve(options[activeOptionIndex].goto);
    };

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const optionElement: HTMLDivElement = htmlToNode(
        html`<div class="option">${String(i + 1)}. ${option.text}</div>`
      );
      menuContainer.appendChild(optionElement);
      optionElements.push(optionElement);

      optionElement.addEventListener('mouseover', () => {
        activeOptionIndex = i;
        showActiveOption();
      });
      optionElement.addEventListener('click', () => selectOption());
      optionElement;
    }

    game.getContainer().appendChild(menuContainer);
    game.scrollToBottom();

    const showActiveOption = () => {
      for (let i = 0; i < options.length; i++) {
        optionElements[i].classList.remove('active');
      }
      optionElements[activeOptionIndex]?.classList.add('active');
    };
    showActiveOption();
    // game.getContainer().addEventListener('keydown', doNothing, {capture: true});
    // Arrow keys only register keydown events.
    document.body.addEventListener('keydown', bodyKeyFn, {capture: true});
  });
}
