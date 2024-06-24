import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }
    create() {
        // Add the underwater background image
        const canvas_w = this.game.canvas.width;
        const canvas_h = this.game.canvas.height;
        this.add.image(0, 0, 'underwater_bg').setOrigin(0).setDisplaySize(canvas_w, canvas_h);

// Enable physics in the scene
this.physics.world.setBounds(0, 0, canvas_w, canvas_h);

        // Create the player using the hook image
        this.player = this.physics.add.image(16, 16, 'hook').setDepth(2);
        this.physics.add.existing(this.player);

        // Ensure the player's physics body is dynamic and affected by gravity
        this.player.body.setCollideWorldBounds(true);
        this.player.setCircle(this.player.width / 2); // Optional: add some bounce to the player

        // Disable gravity initially
        this.player.body.allowGravity = false;

        // Make the camera follow the player
        this.cameras.main.startFollow(this.player);

        const canvasWidth = this.game.canvas.width;
        const canvasHeight = this.game.canvas.height;



        // Add visual cues (markers)
        for (let k = 50; k < this.cameras.main.height; k += 100) {
            this.add.text(this.cameras.main.width / 2, k, k.toString(), { font: '16px Arial', fill: '#000000' }).setDepth(1).setOrigin(0.5);
        }

        // Set up a flag to track whether the player is being controlled by the mouse
        this.isDragging = true;
        this.isReturning = false; // Flag to track if the ball is returning


    // Array of fish keys
    const fishData = [
        { key: 'fish', width: 32, height: 32 },
        { key: 'perch', width: 32, height: 32 },
        { key: 'pike', width: 100, height: 100 },
        { key: 'roach', width: 35, height: 35 },
        { key: 'zander', width: 40, height: 40 }
    ];
    

    // Create fish group with random fish types and sizes
    this.fishGroup = this.add.group();
    const numFish = Phaser.Math.Between(5, 15);
    for (let i = 0; i < numFish; i++) {
        const fishInfo = fishData[Phaser.Math.Between(0, fishData.length - 1)];
        const y = Phaser.Math.Between(50, canvasHeight - 50);
        const fish = this.add.image(Phaser.Math.Between(50, canvasWidth - 50), y, fishInfo.key).setDepth(1);
        fish.setDisplaySize(fishInfo.width, fishInfo.height);
        fish.speed = Phaser.Math.Between(50, 100) * (Math.random() < 0.5 ? 1 : -1);
        this.fishGroup.add(fish);
    }

        // Initialize the score counter
        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'Caught: 0', { font: '32px Arial', fill: '#000000' }).setScrollFactor(0);

        // Add event listener for mouse move
        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                this.player.x = pointer.x;
            }
        });

        // Add event listener for mouse down
        this.input.on('pointerdown', () => {
            if (!this.isReturning) {
                this.isDragging = true;
                this.player.body.allowGravity = false;
                this.player.body.setVelocity(0, 0); // Stop any existing velocity
            }
        });

        // Add event listener for mouse up
        this.input.on('pointerup', () => {
            if (!this.isReturning) {
                this.isDragging = false;
                this.player.body.allowGravity = true;
            }
        });

        // Emit an event when the scene is ready
        EventBus.emit('current-scene-ready', this);
         // Add catch sound
        this.catchSound = this.sound.add('catch');
    }

    update() {
        // If you want to see the player falling without the camera follow, you can initially stop following
        if (!this.cameras.main._follow) {
            this.cameras.main.scrollY += 1; // Adjust the scroll speed as needed to see the falling effect
        }

        // Move fish horizontally
        this.fishGroup.getChildren().forEach((fish) => {
            if (fish.active) { // Ensure the fish is still active
                fish.x += fish.speed * 0.016; // Adjust the speed as needed
                if (fish.x < 0 || fish.x > this.game.canvas.width) {
                    fish.speed *= -1; // Reverse direction at screen edges
                    fish.setFlipX(fish.speed < 0); // Adjust flip based on new speed
                }
            }
        });

        // Check if the player has reached the bottom
        if (this.player.y >= this.physics.world.bounds.height - this.player.body.halfHeight) {
            this.isReturning = true;
            this.player.body.allowGravity = false;
            this.player.body.setVelocityY(-300); // Adjust the speed as needed
        }

        // Stop horizontal movement when the ball is returning
        if (this.isReturning) {
            this.player.body.setVelocityX(0);
            // Stop the ball when it reaches the top
            if (this.player.y <= this.player.body.halfHeight) {
                this.player.body.setVelocityY(0);
                this.isReturning = false;
                this.player.body.allowGravity = false;

                // Allow player to choose where the ball drops again
                this.isDragging = true; // Re-enable dragging
            }

            // Check for collision with fish
            this.fishGroup.getChildren().forEach((fish) => {
                if (fish.active && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), fish.getBounds())) {
                    fish.destroy();
                    this.score += 1;
                    this.scoreText.setText('Caught: ' + this.score);
                    this.catchSound.play(); // Play the catch sound
                }
            });
        }
    }

    
    
    
      
    

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
