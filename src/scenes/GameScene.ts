

export class GameScene extends Phaser.Scene {
    
    constructor(key: string) {
        super(key);
    }

    isGameRunning: boolean = false;

    get gameHeight() {
        return this.game.config.height as number;
    }

    get gameWidth() {
        return this.game.config.width as number;
    }
}