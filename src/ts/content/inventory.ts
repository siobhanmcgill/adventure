import {InventoryList} from '../types';

export const inventory: InventoryList = {
  'pill': {
    'description': 'A small blue pill.',
    use: {
      protagonist: {
        'quote': 'Under the tongue with you...',
        'animation': 'protagonist-takePill',
        'quoteAfterAnimation': 'I feel more feminized already.'
      }
    }
  },
  'empty_thc_capsule': {
    use: {
      protagonist: 'Yep, it\'s empty.',
    }
  },
  'pants': {
    'description':
        'Straightforward black pants. Well, straight downward black pants.',
    use: {
      'protagonist': {
        'removeState': 'no_pants',
        'animation': 'protagonist-putOnPants',
        'quoteAfterAnimation': 'Don\'t ask me where I was keeping those.'
      }
    }
  },
  'sweater': {},
  'cup': {
    use: {
      'protagonist': 'I don\'t have to. There\'s a toilet down the hall.',
    }
  },
  'cup_of_water': {
    description: 'It\'s a glass of water. For when I want to wat.',
    use: {
      protagonist: {
        'animation': 'protagonist-drink',
        'quoteAfterAnimation':
            'Ahh. You can really taste the reclamation system.',
        'removeItem': 'cup_of_water',
        'addItem': 'cup'
      }
    }
  }
}
