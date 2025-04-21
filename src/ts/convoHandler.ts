import { firstValueFrom } from 'rxjs';
import { GameState } from './state';
import { printDialog, printResponseOptions } from './svg_utils';
import { Convo, ConvoQuote, ConvoQuoteParams, Quote, Room } from './types';
import { findMatchingKey } from './utils';

export class ConvoHandler {
  readonly convo: Convo;

  private path: string[] = [];

  constructor(
    private readonly convoId: string,
    private readonly state: GameState,
    private readonly roomData: Room,
    private readonly printDialogFn: typeof printDialog,
    private readonly printResponsesFn: typeof printResponseOptions,
    private readonly onDone?: () => void
  ) {
    this.convo = (this.roomData.convos ?? {})[this.convoId];

    if (!this.convo) {
      return;
    }
  }

  private async getStates() {
    return (await firstValueFrom(this.state.roomStates$)).reverse();
  }

  async converse() {
    console.log('starting conversation!', this.convoId);

    const states = await this.getStates();
    const key = findMatchingKey(this.convo, 'default', states);

    await this.goto(String(key));
  }

  private async goto(goto: string) {
    console.log('going to path', goto);
    this.path.push(goto);

    const matchingPaths = Object.keys(this.convo)
      .filter((key) => key.includes(goto))
      .reverse();

    const pathKey =
      matchingPaths.length === 1
        ? goto
        : matchingPaths.find((p) =>
            p.split('>').every((x) => this.path.includes(x.trim()))
          )!;

    await this.handleConvo(this.convo[pathKey]);
  }

  private async handleConvo(thisConvo: ConvoQuote) {
    const quotes: string[] = [];
    for (const q of thisConvo) {
      if (typeof q === 'string') {
        quotes.push(q);
      } else if (typeof q.quote === 'string') {
        quotes.push(q.quote);
      } else {
        quotes.push(...((q.quote as string[]) ?? []));
      }
    }

    if (quotes.length) {
      await this.printDialogFn(
        quotes.map((q) => q.replace(/^me::/, `${this.convoId}::`)),
        this.state,
        this.roomData
      );
    }

    if (thisConvo.length) {
      const lastConvoItem = thisConvo[thisConvo.length - 1];
      const { goto, responses } = lastConvoItem as ConvoQuoteParams;
      if (goto && this.convo[goto]) {
        await this.goto(goto);
      }
      if (responses) {
        console.log({ responses });
        const states = await this.getStates();
        const targets = await this.printResponsesFn(
          responses.filter((r) => {
            let use = true;
            if (r.ifState) {
              use = use && states.includes(r.ifState);
            }
            if (r.ifNotState) {
              use = use && !states.includes(r.ifNotState);
            }
            if (r.ifPath) {
              use = use && this.path.includes(r.ifPath);
            }
            if (r.ifTag) {
              // TODO
            }
            return use;
          }),
          this.state,
          async (selectedResponse) => {
            await this.printDialogFn(
              selectedResponse.text,
              this.state,
              this.roomData
            );

            if (selectedResponse.action) {
              const {addState, removeState, addTag} = selectedResponse.action;
              if (addState) {
                this.state.addRoomState(addState);
              }
              if (removeState) {
                this.state.removeRoomState(removeState);
              }
              if (addTag) {
                this.state.addTag(addTag);
              }
            }
            const gotoKey = findMatchingKey(
              selectedResponse as { [index: string]: any },
              'goto',
              states
            );
            await this.goto((selectedResponse as any)[gotoKey]);
          }
        );
      }

      if (!goto && !responses) {
        this.done();
      }
    } else {
      this.done();
    }
  }

  private done() {
    // This conversation is over.
    console.log('End of conversation.');
    if (this.onDone) {
      this.onDone();
    }
  }
}

// else {
//   const done = document.createElement('div');
//   done.textContent = 'Done.';
//   done.classList.add('convo-done');
//   convoText.appendChild(done);
//   document
//     .querySelector('.convo-output .convo-text-scroll')!
//     .scrollTo(0, 1000000);
// }
