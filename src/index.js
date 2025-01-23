import Phaser from 'phaser';

import GameScene from './scenes/GameScene';
import PlayScene from './scenes/PlayScene';
import PreloadScene from './scenes/PreloadScene';

export const PRELOAD_CONFIG = {
    cactusesCount: 6,
    birdsCount: 1
  }

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#FFF",
    physics: { 
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let ground;
let clouds;

function preload() {
    //load assets
    this.load.spritesheet("dino", "assets/dino-run.png", {frameWidth: 88, frameHeight:94})
    this.load.image("ground", "assets/ground.png");
    this.load.image("cloud", "assets/cloud.png");

    for(let i = 0; i < 6; i++) {
        const cactusNum = i + 1;
        this.load.image(`obstacle-${cactusNum}`, `assets/cactuses_${cactusNum}.png`)
    }

    this.load.image("game-over", "assets/game-over.png");
    this.load.image("restart", "assets/restart.png");
}

function create() {
    this.isGameRunning = true;
    this.gameSpeed = 5;
    this.timer = 0;
    this.cursors = this.input.keyboard.createCursorKeys();

    //initialise score and frameCounter
    this.score = 0;
    this.frameCounter = 0;

    // add scoretext variable at visible position
    this.scoreText = this.add.text(700, 50, "00000", {
        fontSize: 30,
        fontFamily: "Arial",
        color: "#535353",
        resolution: 5
    }).setOrigin(1,0);

    /*
    const score = Array.from(String(this.score), Number);
    for (let i = 0; i < 5 - String(this.score).length; i++) {
        score.unshift(0);
    }
    this.scoreText.setText(score.join(""));
    console.log(score);
    */

    //add the dino sprite
    this.player = this.physics.add.sprite(200, 200, "dino")
        .setDepth(1)
        .setOrigin(0, 1)
        .setGravityY(5000)
        .setCollideWorldBounds(true)
        .setBodySize(44,92);
        

    //add the ground image
    this.ground = this.add
        .tileSprite(0, 300, 1000, 30, "ground")
        .setOrigin(0,1);

    //add the cloud images
    this.clouds = this.add.group();
    this.clouds = this.clouds.addMultiple([this.add.image(200, 100, "cloud"),
                                           this.add.image(300, 130, "cloud"),
                                           this.add.image(450, 90, "cloud")]);

    //add an invisible staticSprite to handle collisions 
    this.groundCollider = this.physics.add.staticSprite(0, 300, "ground").setOrigin(0, 1);
    this.groundCollider.body.setSize(1000, 30); // Adjust collision size if necessary

    //enable collision between the player and the invisible collider 
    this.physics.add.collider(this.player, this.groundCollider);

    this.obstacles = this.physics.add.group({
        allowGravity: false // No gravity for cactuses
    });

    this.physics.add.collider(this.obstacles, this.player, gameOver, null, this);

    this.gameOverText = this.add.image(0,0,"game-over");
    this.restartText = this.add.image(0,80,"restart").setInteractive();
    this.gameOverContainer = this.add
        .container(1000 / 2, (300 / 2) -50)
        .add([this.gameOverText, this.restartText])
        .setAlpha(0);

}

function gameOver() {
    this.physics.pause();
    this.timer = 0;
    this.isGameRunning = false;
    this.gameOverContainer.setAlpha(1);
}

function update(time, delta) {
    if(!this.isGameRunning) {return;}
    this.ground.tilePositionX += this.gameSpeed;

    //create cactus obstacle using timer
    this.timer += delta;
    //console.log(this.timer);
    if (this.timer > 1000) {
        this.obstacleNum = Math.floor(Math.random() * 6) + 1;
        this.obstacles.create(750, 220, `obstacle-${this.obstacleNum}`).setOrigin(0);
        this.timer -= 1000; 
    }

    Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);

    this.obstacles.getChildren().forEach(obstacle => {
        if (obstacle.getBounds().right < 0) {
            this.obstacles.remove(obstacle);
            obstacle.destroy();
        }
    })

    const {space, up} = this.cursors;
    if (Phaser.Input.Keyboard.JustDown(space)
        || Phaser.Input.Keyboard.JustDown(up)
        && this.player.body.onFloor()) {
        this.player.setVelocityY(-1600);
    }

    this.restartText.on("pointerdown", () => {
        this.physics.resume();
        this.player.setVelocityY(0);
        this.obstacles.clear(true, true);
        this.gameOverContainer.setAlpha(0);
        this.isGameRunning = true;
        this.frameCounter = 0;
    })

    this.frameCounter++;
    if (this.frameCounter > 100) {
        this.score += 100;
        const formattedScore = String(Math.floor(this.score)).padStart(5, "0");
        this.scoreText.setText(formattedScore);
        this.frameCounter -= 100;
    }

}
