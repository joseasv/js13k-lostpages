//import './main.scss'
import {
  init,
  Sprite,
  SpriteSheet,
  GameLoop,
  initKeys,
  keyPressed,
} from "kontra";
import spritesheet from "./assets/images/sprites/spritesheet.png";

let { canvas, context } = init();
context.imageSmoothingEnabled = false;
initKeys();

let spriteTest = undefined;

let pc = {
  x: 10,
  y: 10,
  sprite: undefined,
  isMoving: false,
  flipped: false,
  render: function () {
    if (this.sprite !== undefined) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;

      if (this.isMoving) {
        console.log("isMoving");
        this.sprite.playAnimation("walk");
      } else {
        this.sprite.playAnimation("idle");
      }

      if (this.flipped) {
        console.log("FLIP");
        this.sprite.scaleX = -1;
        this.sprite.x = this.x + this.sprite.width;
      } else {
        this.sprite.scaleX = 1;
      }
      this.sprite.render();
    }
  },
  update: function () {
    if (this.sprite !== undefined) {
      this.isMoving = false;
      if (keyPressed("left")) {
        //console.log("pressing left")
        this.isMoving = true;
        this.flipped = true;
        this.x -= 0.6;
      }

      if (keyPressed("right")) {
        //console.log("pressing right")
        this.isMoving = true;
        this.flipped = false;
        this.x += 0.6;
      }

      this.sprite.update();
    }
  },
};

const spriteImage = new Image();
spriteImage.src = spritesheet;

spriteImage.onload = () => {
  let ssheet = SpriteSheet({
    image: spriteImage,
    frameWidth: 8,
    frameHeight: 8,
    animations: {
      walk: {
        frames: [1, 0],
        frameRate: 5,
        loop: true,
      },
      idle: {
        frames: 0,
        frameRate: 1,
        loop: false,
      },
    },
  });

  spriteTest = Sprite({
    x: 3,
    y: 5,
    width: 8,
    height: 8,
    animations: ssheet.animations,
  });
  spriteTest.context.imageSmoothingEnabled = false
  //spriteTest.setScale(10, 10)
  pc.sprite = spriteTest;
};

let sprites = [];

function createAsteroid() {
  let asteroid = Sprite({
    type: "asteroid",
    x: 50,
    y: 50,
    dx: Math.random() * 0.8 - 0.2,
    dy: Math.random() * 0.8 - 0.2,
    radius: 12,
    render() {
      this.context.strokeStyle = "white";
      this.context.beginPath();
      this.context.arc(0, 0, this.radius, 0, Math.PI * 2);
      this.context.stroke();
    },
  });

  sprites.push(asteroid);
}

for (let i = 0; i < 4; i++) {
  createAsteroid();
}

let loop = GameLoop({
  update() {
    pc.update();
    /*spriteTest.update()
    if (spriteTest.x > canvas.width) {
      spriteTest.x = -spriteTest.width
    }*/

    /*sprites.map(sprite => {
      sprite.update()
 
      if (sprite.x < -sprite.radius) {
        sprite.x = canvas.width + sprite.radius
      } else if (sprite.x > canvas.width + sprite.radius) {
        sprite.x = 0 - sprite.radius
      }

      if (sprite.y < -sprite.radius) {
        sprite.y = canvas.height + sprite.radius
      } else if (sprite.y > canvas.height + sprite.radius) {
        sprite.y = -sprite.radius
      }
    })*/
  },
  render() {
    pc.render();
    //spriteTest.render()
    //sprites.map(sprite => sprite.render())
  },
});

loop.start();
