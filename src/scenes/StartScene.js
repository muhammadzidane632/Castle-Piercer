import Phaser from 'phaser';
import { createGameAnimations } from '../game/animations.js';
import { Sfx } from '../systems/Sfx.js';

export class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  create() {
    createGameAnimations(this);
    const sfx = this.registry.get('sfx') || new Sfx();
    this.registry.set('sfx', sfx);

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x43aaa6).setOrigin(0);
    this.add.image(140, 520, 'cloud-1').setScale(1.4).setAlpha(0.8);
    this.add.image(820, 96, 'cloud-2').setScale(1.05).setAlpha(0.65);
    this.add.image(815, 560, 'cloud-3').setScale(1.25).setAlpha(0.85);
    this.add.image(164, 330, 'blue-castle').setScale(0.92).setAlpha(0.95);
    this.add.image(818, 346, 'red-castle').setScale(0.94).setAlpha(0.95);

    const titlePanel = this.add.graphics();
    titlePanel.fillStyle(0xf1dfad, 0.94);
    titlePanel.fillRoundedRect(width / 2 - 290, 42, 580, 124, 8);
    titlePanel.lineStyle(4, 0x6b4b31, 0.84);
    titlePanel.strokeRoundedRect(width / 2 - 290, 42, 580, 124, 8);

    this.add.text(width / 2, 72, 'CASTLE PIERCER', {
      fontFamily: 'Georgia, serif',
      fontSize: '38px',
      color: '#2a1e1b',
      stroke: '#fff1b8',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, 137, 'Defend the village, survive the red waves, then lead the counter attack into their basecamp.', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#2a1e1b',
      stroke: '#fff1b8',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 690 },
    }).setOrigin(0.5);

    const hero = this.add.sprite(width / 2 - 70, height / 2 + 34, 'blue-warrior-idle').setScale(0.76).play('blue-idle');
    const scout = this.add.sprite(width / 2 + 82, height / 2 + 40, 'yellow-pawn-gold-run').setScale(0.68).play('yellow-pawn-gold-run');
    hero.setDepth(4);
    scout.setDepth(4);

    const glow = this.add.ellipse(width / 2, height / 2 + 108, 250, 44, 0x183446, 0.28);
    glow.setDepth(1);

    const startButton = this.add.image(width / 2, height - 112, 'button-blue-wide').setDisplaySize(250, 78);
    const startText = this.add.text(width / 2, height - 112, 'MULAI', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '26px',
      color: '#fff4c8',
      stroke: '#1b3146',
      strokeThickness: 5,
    }).setOrigin(0.5);

    startButton.setInteractive({ cursor: 'pointer' });
    startButton.on('pointerover', () => startButton.setTint(0xf8f0b7));
    startButton.on('pointerout', () => {
      startButton.clearTint();
      startButton.setTexture('button-blue-wide');
    });
    startButton.on('pointerdown', () => {
      startButton.setTexture('button-blue-wide-pressed');
      startText.y += 2;
      sfx.click();
    });
    startButton.on('pointerup', () => {
      sfx.ensure();
      sfx.startMusic(this);
      this.scene.start('GameScene');
    });

    this.input.keyboard.once('keydown', () => {
      sfx.ensure();
      sfx.click();
      sfx.startMusic(this);
      this.scene.start('GameScene');
    });

    this.tweens.add({
      targets: [hero, scout],
      y: '+=8',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
