import Phaser from 'phaser';

export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  init(data) {
    this.result = data.result || 'lose';
    this.reason = data.reason || '';
    this.stats = data.stats || {};
  }

  create() {
    const { width, height } = this.scale;
    const won = this.result === 'win';
    const sfx = this.registry.get('sfx');

    if (sfx) {
      // Keep playing the BGM!
    }

    this.add.rectangle(0, 0, width, height, won ? 0x356f65 : 0x331f2a).setOrigin(0);
    this.add.image(180, 520, 'cloud-1').setScale(1.5).setAlpha(0.78);
    this.add.image(790, 132, 'cloud-2').setScale(1.1).setAlpha(0.7);

    const titlePanel = this.add.graphics();
    titlePanel.fillStyle(won ? 0xf1dfad : 0xdccaa0, 0.94);
    titlePanel.fillRoundedRect(width / 2 - 300, 42, 600, 138, 8);
    titlePanel.lineStyle(4, won ? 0x4f6b3a : 0x6b4b31, 0.84);
    titlePanel.strokeRoundedRect(width / 2 - 300, 42, 600, 138, 8);

    this.add.text(width / 2, 92, won ? 'BASECAMP HANCUR' : 'KERAJAAN RUNTUH', {
      fontFamily: 'Georgia, serif',
      fontSize: won ? '36px' : '31px',
      color: won ? '#2b3721' : '#3d2530',
      stroke: '#fff1bf',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(width / 2, 146, won
      ? 'Castle Piercer selamat. Warga bertahan, castle berdiri, dan panji merah padam.'
      : (this.reason === 'castle'
        ? 'Castle jatuh sebelum pasukan merah dipukul mundur.'
        : 'Hero gugur sebelum serangan balik selesai.'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: won ? '#2b3721' : '#3d2530',
      stroke: '#fff1bf',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0.5);

    this.add.sprite(width / 2 - 118, height / 2 + 4, won ? 'blue-warrior-idle' : 'red-warrior-idle')
      .setScale(0.8)
      .play(won ? 'blue-idle' : 'red-warrior-idle');

    if (won) {
      this.add.image(width / 2 + 95, height / 2 + 5, 'gold-resource-highlight')
        .setScale(0.72)
        .setAlpha(0.95);
    } else {
      this.add.circle(width / 2 + 95, height / 2 + 5, 44, 0x6b2430, 0.82);
      this.add.rectangle(width / 2 + 95, height / 2 + 5, 82, 14, 0xf2c07c, 0.96).setAngle(45);
      this.add.rectangle(width / 2 + 95, height / 2 + 5, 82, 14, 0xf2c07c, 0.96).setAngle(-45);
    }

    const scoreLines = [
      `Wave: ${this.stats.wave ?? 0}/${this.stats.maxWaves ?? 3}`,
      `Castle: ${this.stats.castleHp ?? 0}/${this.stats.castleMaxHp ?? 0}`,
      `Kills: ${this.stats.kills ?? 0}`,
      `Score: ${this.stats.score ?? 0}`,
    ];

    this.add.text(width / 2, height / 2 + 142, scoreLines.join('   '), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      color: '#fff4ce',
      stroke: '#1b2b34',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const restartButton = this.add.image(width / 2, height - 96, won ? 'button-blue-wide' : 'button-red-wide').setDisplaySize(250, 78);
    const restartText = this.add.text(width / 2, height - 96, 'MAIN LAGI', {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '24px',
      color: '#fff4c8',
      stroke: '#1b3146',
      strokeThickness: 5,
    }).setOrigin(0.5);

    restartButton.setInteractive({ cursor: 'pointer' });
    restartButton.on('pointerover', () => restartButton.setTint(0xf8f0b7));
    restartButton.on('pointerout', () => restartButton.clearTint());
    restartButton.on('pointerdown', () => {
      restartButton.setTexture(won ? 'button-blue-wide-pressed' : 'button-red-wide-pressed');
      sfx?.click();
      restartText.y += 2;
    });
    restartButton.on('pointerup', () => this.scene.start('GameScene'));

    this.input.keyboard.once('keydown', (event) => {
      if (event.code === 'Enter' || event.code === 'Space') {
        this.scene.start('GameScene');
      }
    });
  }
}
