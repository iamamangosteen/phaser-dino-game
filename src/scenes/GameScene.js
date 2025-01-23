
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    
    constructor(key) {
        super(key);
        this.isGameRunning = false; // Initialize the property in the constructor
    }

    // Getter for gameHeight
    get gameHeight() {
        return this.game.config.height;
    }

    // Getter for gameWidth
    get gameWidth() {
        return this.game.config.width;
    }
}
