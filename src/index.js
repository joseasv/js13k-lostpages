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
let landSprite = [];
let pc = {
  x: 10,
  y: 10,
  sprite: undefined,
  isMoving: false,
  flipped: false,
  update: function () {
    
    this.isMoving = false;
    if (keyPressed("left")) {
      //console.log("pressing left")
      this.isMoving = true;
      this.flipped = true;
      this.x -= 1;
    }

    if (keyPressed("right")) {
      //console.log("pressing right")
      this.isMoving = true;
      this.flipped = false;
      this.x += 1;
    }

    let col = false
    if (landSprite.length > 0) {
      for (let i = 0; i < landSprite.length && !col; i++) {
        let land = landSprite[i]
        if (this.y + 8 >= land.y && 
          this.x + 5 >= land.x && this.x + 3 <= land.x + 8) {
          //console.log("col in sprite", land.id, "this.x", this.x, " :land.x", land.x)
          col = true
          this.y = land.y - 8
        } 
      }
    }

    if (!col) {
      //console.log(col)
      this.y += 0.5
    }

    this.sprite.update();
    
  },
  render: function () {
    if (this.sprite !== undefined) {
      this.sprite.x = this.x;
      this.sprite.y = this.y;

      if (this.isMoving) {
        //console.log("isMoving");
        this.sprite.playAnimation("walk");
      } else {
        this.sprite.playAnimation("idle");
      }

      if (this.flipped) {
        //console.log("FLIP");
        this.sprite.scaleX = -1;
        this.sprite.x = this.x + this.sprite.width;
      } else {
        this.sprite.scaleX = 1;
      }
      this.sprite.render();
    }
  }
};

let mapcontext = undefined;

const spriteImage = new Image();
spriteImage.src = spritesheet;

spriteImage.onload = () => {
  let ssheet = SpriteSheet({
    image: spriteImage,
    frameWidth: 8,
    frameHeight: 8,
    animations: {
      walk: {
        frames: [2, 3],
        frameRate: 5,
        loop: true,
      },
      idle: {
        frames: [0, 1],
        frameRate: 1,
        loop: true,
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
  spriteTest.context.imageSmoothingEnabled = false;
  //spriteTest.setScale(10, 10)
  pc.sprite = spriteTest;

  const mapcanvas = document.createElement("canvas");
  mapcontext = mapcanvas.getContext("2d");
  mapcontext.drawImage(spriteImage, 0, 8, 24, 8, 0, 0, 24, 8);

  const maptilesprites = document.createElement("canvas");
  const maptilespritescontext = maptilesprites.getContext("2d");
  maptilespritescontext.drawImage(spriteImage, 32, 0, 8, 8, 0, 0, 8, 8);

  let landId = 0
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 8; j++) {
      const pixelData = mapcontext.getImageData(i, j, 1, 1).data;
      if (pixelData[0] === 245) {
        //console.log("drawing at ", i, " and ", j);
      
        landSprite.push(
          Sprite({
            id: landId++,
            width: 8,
            height: 8,
            x: i * 8,
            y: j * 8,
            floor: true,
            image: maptilesprites,
          })
        )
      }
    }
  }

  //console.log("landSprite length", landSprite.length);
};

let aStateId = 0

const loop = GameLoop({
  update() {
    pc.update();
  },
  render() {
    pc.render();

    for (let i = 0; i < landSprite.length; i++) {
      landSprite[i].render();
    }
  },
});

const states = [loop]

states[aStateId].start();

