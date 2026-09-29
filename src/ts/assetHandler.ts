import {loadSvgString} from './utils/svg_utils';

const ICON_URL = new URL('../../content/artwork/icons.svg', import.meta.url);

/** Loads and caches various assets. */
export class AssetHandler {
  private assetCache = new Map<string, string>();

  async getIcon(name: string): Promise<string> {
    if (!this.assetCache.has(`icon_${name}`)) {
      await loadSvgString(ICON_URL, name);
    }
    return this.assetCache.get(`icon_${name}`) ?? '';
  }
}
