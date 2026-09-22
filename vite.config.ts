import path from 'path';
import type {UserConfig} from 'vite';

export default {
  root: './src/',
  base: '',
  publicDir: 'src/assets',
  css: {
    devSourcemap: true,
  },
} satisfies UserConfig;
