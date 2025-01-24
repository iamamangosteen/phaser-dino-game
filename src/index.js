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
    this.load.spritesheet("dino", "assets/dino-run.png", {frameWidth: 88, frameHeight:94});
    this.load.image("dino-hurt", "assets/dino-hurt.png");
    this.load.image("ground", "assets/ground.png");
    this.load.image("cloud", "assets/cloud.png");

    for(let i = 0; i < 6; i++) {
        const cactusNum = i + 1;
        this.load.image(`obstacle-${cactusNum}`, `assets/cactuses_${cactusNum}.png`)
    }

    this.load.image("game-over", "assets/game-over.png");
    this.load.image("restart", "assets/restart.png");

    //load sound assets
    this.load.audio("jump", "assets/jump.m4a");
    this.load.audio("hit", "assets/hit.m4a");
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

    //display high score
    this.highScore = 0;
    this.highScoreText = this.add.text(700, 0, "High: 00000", {
        fontSize: 30,
        fontFamily: "Arial",
        color: "#535353",
        resolution: 5
    }).setOrigin(1,0).setAlpha(1);

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

    //Optional congrats message
    this.congratsText = this.add.text(0, 0, "Congratulations! A new high score!", {
        fontSize: 30,
        fontFamily: "Arial",
        color: "#535353",
        resolution: 5
    }).setOrigin(0).setAlpha(0); //alpha 0 to hide message initially
}

function gameOver() {
    //check to see if high score
    if (this.score > this.highScore) {
        
        //update high score variable
        this.highScore = this.score;

        //update high score text
        this.highScoreText.setText("High: " + String(this.highScore).padStart(5,"0"));

        //show Congrats
        this.congratsText.setAlpha(1);
    }

    this.physics.pause();
    this.timer = 0;
    this.isGameRunning = false;
    this.gameOverContainer.setAlpha(1);
    this.anims.pauseAll();
    this.player.setTexture("dino-hurt");
    this.sound.play("hit");
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
        this.sound.play("jump");
    }

    this.restartText.on("pointerdown", () => {
        this.physics.resume();
        this.player.setVelocityY(0);
        this.obstacles.clear(true, true);
        this.gameOverContainer.setAlpha(0);
        this.congratsText.setAlpha(0);
        this.frameCounter = 0;
        this.score = 0;
        const formattedScore = String(Math.floor(this.score)).padStart(5, "0");
        this.scoreText.setText(formattedScore);
        this.isGameRunning = true;
        this.anims.resumeAll();
    })

    //update score
    this.frameCounter++;
    if (this.frameCounter > 100) {
        this.score += 100;
        const formattedScore = String(Math.floor(this.score)).padStart(5, "0");
        this.scoreText.setText(formattedScore);
        this.frameCounter -= 100;
    }

    //create dino-run animation
    this.anims.create({
        key: "dino-run",
        frames: this.anims.generateFrameNames("dino", {start: 2, end: 3}),
        frameRate: 10,
        repeat: -1
    });

    // if jumping, do not display dino-run animation and display texture
    if (this.player.body.deltaAbsY() > 4) {
        //temporarily stop the running animation
        this.player.anims.stop();
        //set texture to the first frame (index 0) in the spritesheet
        this.player.setTexture("dino", 0); 
    } else {
        //otherwise play the dino-run animation
        this.player.play("dino-run", true);
    }
    

}
