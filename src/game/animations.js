export function createGameAnimations(scene) {
  const make = (key, texture, end, frameRate = 8, repeat = -1) => {
    const textureData = scene.textures.get(texture);
    const maxFrame = Math.max(0, textureData.frameTotal - 2);
    const endFrame = Math.min(end, maxFrame);

    if (scene.anims.exists(key)) {
      scene.anims.remove(key);
    }

    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(texture, { start: 0, end: endFrame }),
      frameRate,
      repeat,
    });
  };

  make('blue-idle', 'blue-warrior-idle', 7, 7);
  make('blue-run', 'blue-warrior-run', 5, 10);
  make('blue-attack', 'blue-warrior-attack', 3, 14, 0);

  make('red-warrior-idle', 'red-warrior-idle', 7, 7);
  make('red-warrior-run', 'red-warrior-run', 5, 9);
  make('red-warrior-attack', 'red-warrior-attack', 3, 12, 0);

  make('red-archer-idle', 'red-archer-idle', 5, 7);
  make('red-archer-run', 'red-archer-run', 3, 9);
  make('red-archer-shoot', 'red-archer-shoot', 7, 12, 0);

  make('black-lancer-idle', 'black-lancer-idle', 11, 7);
  make('black-lancer-run', 'black-lancer-run', 5, 9);
  make('black-lancer-attack', 'black-lancer-attack', 2, 11, 0);

  make('yellow-monk-idle', 'yellow-monk-idle', 5, 6);
  make('yellow-monk-heal', 'yellow-monk-heal', 10, 11, 0);
  make('yellow-monk-heal-effect', 'yellow-monk-heal-effect', 10, 11, 0);
  make('yellow-pawn-gold-idle', 'yellow-pawn-gold-idle', 7, 7);
  make('yellow-pawn-gold-run', 'yellow-pawn-gold-run', 5, 8);

  make('sheep-idle', 'sheep-idle', 5, 5);
  make('sheep-move', 'sheep-move', 3, 5);
  make('dust-puff', 'dust', 7, 16, 0);
  make('fire-burn', 'fire', 7, 12);
  make('water-splash', 'water-splash', 8, 15, 0);
  make('explode', 'explosion', 7, 16, 0);
  make('explode-big', 'explosion-big', 9, 16, 0);
}
