import {firstValueFrom} from 'rxjs';
import {AnyGameMode} from '.';
import {FALLBACK_FALLBACK, FALLBACTIONS, NULL_ACTIONS} from './constants';
import {ACTION_MAP, ObjectHandler} from './objectHandler';
import {Action, ActionOptions, ActionType, Quote} from './types';
import {transitionToClass, whatIs} from './utils/utils';

export class ActionHandler {
  constructor(private readonly game: AnyGameMode) {}

  private async getRoomData() {
    return await firstValueFrom(this.game.state.room$);
  }

  private async getRoomStates() {
    return await firstValueFrom(this.game.state.roomStates$);
  }

  /** Takes a player input like "use lightswitch" and figures out the logical action. */
  async doActionString(input: string) {
    // Why say many word when few word do trick?
    const useless = ['the', 'those', 'some', 'that', 'of', 'off', 'back', 'a'];
    const prepositions = [
      'in',
      'on',
      'to',
      'at',
      'by',
      'for',
      'with',
      'about',
      'against',
      'between',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'out',
    ];

    // This will be the input without the semantically useless words.
    const filteredInput = input
      .replaceAll(/\!|\?|\.|\,/gi, '')
      .trim()
      .toLowerCase()
      .split(' ')
      .filter((w) => {
        return w && !useless.includes(w);
      })
      .join(' ');

    const clauses = filteredInput
      .split(new RegExp(`\\s(${prepositions.join('|')})\\s`, 'gi'))
      .filter((w) => !prepositions.includes(w.trim()))
      .map((c) => c.trim());
    // Now ideally clauses[0] contains either VERB or VERB NOUN
    // clauses[1] contains either NOUN or nothing

    const matchingObjects: ObjectHandler[] = [];
    const clausesWithoutObjects: string[] = [];
    for (const clause of clauses) {
      // TODO: handle "you" or "yourself" meaning the protagonist.
      const [object, clauseWithoutObject] =
        // We check for the inventory item first, because the same object ID might exist in the room.
        this.game.inventoryHandler.lookUpObject(clause) ??
        this.game.roomHandler.lookUpObject(clause) ??
        [];
      if (object) {
        matchingObjects.push(object);
        clausesWithoutObjects.push(clauseWithoutObject ?? '');
      } else {
        clausesWithoutObjects.push(clause);
      }
    }

    // TODO: if matchingObjects.length < clauses.length
    // split the first clause by space to see if we can parse
    // an unknown verb/noun from it?

    let actionToDo: ActionType | undefined;
    // Replace all verb synonyms with the main internal action options.
    const verbClause = clausesWithoutObjects[0].trim();

    let firstObjectId = matchingObjects[0]?.getId();
    let secondObjectId = matchingObjects[1]?.getId();
    if (
      !matchingObjects[0] &&
      (clausesWithoutObjects[0]?.includes('yourself') ||
        clausesWithoutObjects[0]?.includes('you') ||
        clausesWithoutObjects[0]?.includes(
          this.game.state.getProtagonistName()
        ))
    ) {
      firstObjectId = 'yourself';
    }
    if (
      !matchingObjects[1] &&
      (clausesWithoutObjects[1]?.includes('yourself') ||
        clausesWithoutObjects[1]?.includes('you') ||
        clausesWithoutObjects[1]?.includes(
          this.game.state.getProtagonistName()
        ))
    ) {
      secondObjectId = 'yourself';
    }

    if (!matchingObjects.length) {
      actionToDo = this.getFallbackAction(verbClause);
    } else {
      actionToDo =
        (await matchingObjects[0].findAction(verbClause, secondObjectId)) ??
        (await matchingObjects[1]?.findAction(verbClause, firstObjectId));

      if (!actionToDo) {
        actionToDo = this.getFallbackAction(
          verbClause,
          await matchingObjects[0]?.getName(),
          await matchingObjects[1]?.getName()
        );
      }
    }

    actionToDo = await this.filterActionByState(
      actionToDo,
      verbClause,
      firstObjectId,
      secondObjectId
    );

    this.game.debug(`Attempting action`, {
      input,
      filteredInput,
      clauses,
      verbClause,
      matchingObjects: matchingObjects.map((o) => o.getId()),
      zmatchingObjects: matchingObjects,
      actionToDo,
      clausesWithoutObjects,
      firstObjectId,
      secondObjectId,
    });

    await this.doAction(actionToDo, matchingObjects);
  }

  private getFallbackAction(
    verb?: string,
    noun?: string,
    otherNoun?: string
  ): ActionType {
    let matchingVerb: ActionOptions | undefined;
    if (verb) {
      for (const [actionVerb, synonyms] of ACTION_MAP) {
        if (synonyms.find((s) => verb.includes(s)) || actionVerb === verb) {
          matchingVerb = actionVerb;
          break;
        }
      }
    }
    if (noun && otherNoun) {
      // The player tried "use X on Y" but neither object can interact with the other.
      const vowels = 'aeiouy';
      const an1 = vowels.includes(noun.charAt(0)) ? 'an' : 'a';
      const an2 = vowels.includes(otherNoun.charAt(0)) ? 'an' : 'a';
      return `p::I don't think ${an1} ${noun} goes with ${an2} ${otherNoun}.`;
    } else if (matchingVerb && !noun && !otherNoun) {
      // The player tried "X at Y" where X is a valid verb but Y is not a valid
      // object.
      return NULL_ACTIONS[matchingVerb];
    } else if (verb) {
      // The player tried "X at Y" where X is not a valid verb.
      let text = `p::I don't know how to ${verb}`;
      if (noun) {
        text += ` a ${noun}`;
      }
      return `${text}.`;
    } else {
      // The player tried some wacky thing that couldn't be parsed.
      return FALLBACK_FALLBACK;
    }
  }

  /** Run the operations of a chosen action. */
  private async doAction(
    action: ActionType,
    matchingObjects?: ObjectHandler[]
  ): Promise<void> {
    if (whatIs(action) === 'quote') {
      // This action just prints one or more lines of text.
      await this.game.print(action as Quote);
    } else {
      // Explicit action (not like that - specific steps happen).

      let commitAction = action as Action;

      // If it's a queue, we'll shift the next action from the queue.
      // The next time the player does this action, they'll see the next
      // action in the queue.
      const queue = commitAction.queue ?? [];
      if (queue?.length) {
        const queueAction = queue.shift()!;
        if (whatIs(queueAction) === 'quote') {
          commitAction = {
            quote: queueAction as Quote,
          };
        } else {
          commitAction = queueAction as Action;
        }
      }

      this.game.state.addRoomState(commitAction.addState);
      this.game.state.removeRoomState(commitAction.removeState);

      await this.textOrQuotes(commitAction.text, commitAction.quote);

      if (
        (commitAction.text || commitAction.quote) &&
        (commitAction.popup || commitAction.custom || commitAction.loadRoom)
      ) {
        // Wait for the user to read the intro quote before showing the popup.
        await this.game.onBodyClick();
      }

      // Show the popup if there is one.
      await (commitAction.popup
        ? this.game.roomHandler.showPopup(commitAction.popup)
        : Promise.resolve());

      if (commitAction.custom) {
        await commitAction.custom(this.game, matchingObjects);
      }

      await this.showActionAnimation(commitAction);

      if (commitAction.removeItem) {
        this.game.state.removeFromInventory(commitAction.removeItem);
      }
      if (commitAction.addItem) {
        this.game.state.addToInventory(commitAction.addItem);
        this.game.state.addRoomState(`${commitAction.addItem}-picked-up`);
      }

      if (commitAction.addTag) {
        this.game.state.addTag(commitAction.addTag);
      }

      await this.textOrQuotes(
        commitAction.textAfterAnimation,
        commitAction.quoteAfterAnimation
      );

      // We've gone to another room!
      if (commitAction.loadRoom) {
        // TODO: do we need a loading indicator here?
        await this.game.state.loadRoomById(commitAction.loadRoom);
      }

      // If the queue is now empty, do that action if there is one.
      if (!queue.length && commitAction.onQueueFinish) {
        await this.doAction(commitAction.onQueueFinish, matchingObjects);
      }
    }
  }

  async filterActionByState(
    actionToAttempt: ActionType,
    verb: string,
    noun?: string,
    otherNoun?: string
  ): Promise<ActionType> {
    // Active states on the current room.
    const states = await this.getRoomStates();

    // Get any matching state entries, because they may have action filter functions.
    const stateWithFilter = Object.entries(
      (await this.getRoomData()).states
    ).find(([key, state]) => states.includes(key) && !!state.actionFilter);

    let action: ActionType;
    // So if an active state has a filter function, the action must be passed through that.
    // Otherwise we use the action selected.
    if (
      stateWithFilter &&
      stateWithFilter[1] &&
      stateWithFilter[1].actionFilter
    ) {
      action = await stateWithFilter[1].actionFilter(
        this.game,
        actionToAttempt,
        verb,
        noun,
        otherNoun
      );
    } else {
      action = actionToAttempt;
    }
    return action;
  }

  private async textOrQuotes(text?: Quote, quote?: Quote) {
    if (this.game.isGraphic() || !text) {
      // Show the action quotes in graphic mode or when there is no text to show.
      await (quote
        ? // ? showQuotePanel(([] as string[]).concat(commitAction.quote), this.game)
          this.game.print(quote)
        : Promise.resolve());
    } else {
      // Show the action text when there is some in text mode.
      await (text ? this.game.print(text) : Promise.resolve());
    }
  }

  private async showActionAnimation(commitAction: Action) {
    if (commitAction.animation) {
      const animationClass = `animation-${commitAction.animation}`;
      await transitionToClass(this.game.getContainer(), animationClass);
      if (!commitAction.loadRoom) {
        this.game.getContainer().classList.remove(animationClass);
      }
    }
  }
}
