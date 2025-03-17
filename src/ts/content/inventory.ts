import {InventoryList} from '../types';

export const MAIN_INVENTORY_ART = new URL(
  `../../../artwork/inventory.svg`,
  import.meta.url
);

export const inventory: InventoryList = {
  pill: {
    description: 'A small blue pill.',
    artwork: {
      url: MAIN_INVENTORY_ART,
      layerId: 'pill',
      viewBox: '0 0 150 150',
    },
    use: {
      protagonist: {
        quote: 'Under the tongue with you...',
        animation: 'protagonist-takePill',
        quoteAfterAnimation: 'I feel more feminized already.',
      },
    },
  },
  empty_thc_capsule: {
    name: 'Empty capsules',
    description: 'Once filled with perfectly harmless inhalable drugs, now they are just useless metal tubes.',
    artwork: {
      url: MAIN_INVENTORY_ART,
      layerId: 'capsules',
      viewBox: '0 0 150 150',
    },
    use: {
      protagonist: "Yep, they're empty.",
    },
  },
  pants: {
    description:
      'Straightforward black pants. Well, straight downward black pants.',
    artwork: {
      url: MAIN_INVENTORY_ART,
      layerId: 'pants',
      viewBox: '0 0 150 150',
    },
    use: {
      protagonist: {
        removeState: 'no_pants',
        animation: 'protagonist-putOnPants',
        quoteAfterAnimation: "Don't ask me where I was keeping those.",
      },
    },
  },
  cup: {
    description:
      "A cup made of space-age plastiglass polymer. It's as durable as it is capable of holding a small volume of liquid.",
    artwork: {
      url: MAIN_INVENTORY_ART,
      layerId: 'cup',
      viewBox: '0 0 150 150',
    },
    use: {
      protagonist: "I don't have to. There's a toilet in my room.",
    },
  },
  sweater: {
    description:
      'A very cute and very hot sweater. Seriously this thing is like standing inside a fire.',
    artwork: {
      url: MAIN_INVENTORY_ART,
      layerId: 'sweater',
      viewBox: '0 0 150, 150',
    },
  },
  // 'cup_of_water': {
  //   description: 'It\'s a glass of water. For when I want to wat.',
  //   use: {
  //     protagonist: {
  //       'animation': 'protagonist-drink',
  //       'quoteAfterAnimation':
  //           'Ahh. You can really taste the reclamation system.',
  //       'removeItem': 'cup_of_water',
  //       'addItem': 'cup'
  //     }
  //   }
  // }
};
