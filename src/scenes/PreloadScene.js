import Phaser from 'phaser';
import { IMAGE_ASSETS, MAP_PATH, SPRITESHEET_ASSETS, TILESETS, assetUrl } from '../data/assets.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, height / 2 - 54, 'Asterfall Defense', {
      fontFamily: 'Georgia, serif',
      fontSize: '34px',
      color: '#f7f0c4',
      stroke: '#1f2b36',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const barBack = this.add.rectangle(width / 2, height / 2 + 8, 420, 18, 0x14232e, 0.85).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - 206, height / 2 + 8, 8, 10, 0xf8d66d, 1).setOrigin(0, 0.5);
    const status = this.add.text(width / 2, height / 2 + 44, 'Loading assets...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#d8f3ec',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = Phaser.Math.Clamp(value, 0, 1) * 412;
    });

    this.load.on('loaderror', (file) => {
      status.setText(`Missing asset: ${file.key}`);
    });

    this.load.tilemapTiledJSON('adventure-map', assetUrl(MAP_PATH));
    TILESETS.forEach((tileset) => {
      this.load.image(tileset.key, assetUrl(tileset.image));
    });

    IMAGE_ASSETS.forEach((asset) => {
      this.load.image(asset.key, assetUrl(asset.path));
    });

    SPRITESHEET_ASSETS.forEach((asset) => {
      this.load.spritesheet(asset.key, assetUrl(asset.path), {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    });

    this.load.once('complete', () => {
      title.setText('Ready');
      status.setText('Rallying the village...');
    });
  }

  create() {
    this.scene.start('StartScene');
  }
}
