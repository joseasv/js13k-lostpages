//import './main.scss'
import {
  init,
  Sprite,
  SpriteSheet,
  GameLoop,
  initKeys,
  keyPressed,
  Scene
} from "kontra";
import spritesheet from "./assets/images/sprites/spritesheet.png";

let { canvas, context } = init();
context.imageSmoothingEnabled = false;
initKeys();

let gameScene = undefined

let spriteTest = undefined;
let landSprite = [];
let pc = undefined
/*let pc = {
  x: 10,
  y: 10,
  sprite: undefined,
  isMoving: false,
  flipped: false,
  animStarted: false,
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
        this.animStarted = false
        this.sprite.playAnimation("walk");
        
      } else {
        if (!this.animStarted) {
          //this.sprite.animations['idle'].reset()
          this.animStarted = true
        }
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
};*/

let mapcontext = undefined;

const spriteImage = new Image();
spriteImage.src = spritesheet;

spriteImage.onload = () => {

  const flippedcanvas = document.createElement("canvas");
  const flippedcontext = flippedcanvas.getContext("2d");
  flippedcontext.translate(32, 0)
  flippedcontext.scale(-1,1)
  flippedcontext.drawImage(spriteImage, 0, 0, 32, 8, 0, 0, 32, 8);
  
  const totalanimcanvas = document.createElement("canvas");
  totalanimcanvas.height = 16
  totalanimcanvas.width = 32
  const totalanimcontext = totalanimcanvas.getContext('2d')
  totalanimcontext.drawImage(spriteImage, 0, 0, 32, 8, 0, 0, 32, 8)
  totalanimcontext.drawImage(flippedcanvas, 0, 0, 32, 8, 0, 8, 32, 8)

  let ssheet = SpriteSheet({
    image: totalanimcanvas,
    frameWidth: 8,
    frameHeight: 8,
    animations: {
      idle: {
        frames: [0, 1],
        frameRate: 1,
        loop: true,
      },
      walk: {
        frames: [2, 3],
        frameRate: 5,
        loop: true
      },
      fidle: {
        frames: [7, 6],
        frameRate: 1,
        loop: true,
      },
      fwalk: {
        frames: [5, 4],
        frameRate: 5,
        loop: true
      },
      
    },
  });

  /*spriteTest = Sprite({
    x: 3,
    y: 5,
    width: 8,
    height: 8,
    animations: ssheet.animations,
  });
  spriteTest.context.imageSmoothingEnabled = false;
  
  pc.sprite = spriteTest;*/

  pc = Sprite({
    x: 10,
    y: 10,
    width: 8,
    height: 8,
    animations: ssheet.animations,
    currentAnimation: ssheet.animations['idle'],
    isMoving: false,
    flipped: false,
    animStarted: false,
    update: function () {
      
      this.isMoving = false;
      if (keyPressed("left")) {
        //console.log("pressing left")
        this.isMoving = true;
        this.flipped = true;
        this.x -= 0.6;
        //this.sx += 0.6
      }
  
      if (keyPressed("right")) {
        //console.log("pressing right")
        this.isMoving = true;
        this.flipped = false;
        this.x += 0.6;
        //this.sx += 0.6
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
  
      //this.update();
      
    },
    render: function () {
        if (this.isMoving) {
          //console.log("isMoving");
          this.animStarted = false
          if (this.flipped) {
            this.currentAnimation = this.animations["fwalk"]
          } else {
            this.currentAnimation = this.animations["walk"]
          }
          
          
        } else {
          if (this.flipped) {
            if (!this.animStarted) {
              this.animations['fidle'].reset()
              this.animStarted = true
            }
            this.currentAnimation = this.animations["fidle"]
          } else {
            if (!this.animStarted) {
              this.animations['idle'].reset()
              this.animStarted = true
            }
            this.currentAnimation = this.animations["idle"]
          }
          
          //this.sprite.playAnimation("idle");
        }
        

        
        this.currentAnimation.update()
        this.draw()
      }
  })

  const mapcanvas = document.createElement("canvas");
  mapcontext = mapcanvas.getContext("2d");
  mapcontext.drawImage(spriteImage, 0, 8, 24, 8, 0, 0, 24, 8);

  const maptilesprites = document.createElement("canvas");
  maptilesprites.width = 8
  maptilesprites.height = 8
  const maptilespritescontext = maptilesprites.getContext("2d");
  

  let landId = 0
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 8; j++) {
      const pixelData = mapcontext.getImageData(i, j, 1, 1).data;
      if (pixelData[0] === 245) {
        //console.log("drawing at ", i, " and ", j);
        
        maptilespritescontext.clearRect(0, 0, maptilesprites.width, maptilesprites.height)
        const chance = Math.random()
        if (chance > 0.5) {
          console.log('sprite 1', chance)
          maptilespritescontext.drawImage(spriteImage, 32, 0, 8, 8, 0, 0, 8, 8);
        } else {
          console.log('sprite 2', chance)
          maptilespritescontext.drawImage(spriteImage, 40, 0, 8, 8, 0, 0, 8, 8);
        }
        if (chance > 0.5) {
          console.log('sprite 1', chance)
          maptilespritescontext.translate(8, 0)
          maptilespritescontext.scale(-1, 1);
        } 
        let temp = new Image()
        temp.src = maptilesprites.toDataURL("image/png")
        landSprite.push(
          Sprite({
            id: landId++,
            width: 8,
            height: 8,
            x: i * 8,
            y: j * 8,
            floor: true,
            image: temp,
          })
        )
        //
      }
    }
  }

  gameScene = new Scene({id: 'game',
  children:[...landSprite, pc]})
  

  //console.log("landSprite length", landSprite.length);
};



let aStateId = 0

// const loop = GameLoop({
//   update() {
//     pc.update();
//   },
//   render() {
//     pc.render();

//     for (let i = 0; i < landSprite.length; i++) {
//       landSprite[i].render();
//     }
//   },
// });
const loop = GameLoop({
  update() {
    if (gameScene!==undefined) {
      gameScene.update();
      gameScene.lookAt(pc)
    }
    
  },
  render() {
    if (gameScene!==undefined) {
      gameScene.render();
    }
    

    /*for (let i = 0; i < landSprite.length; i++) {
      landSprite[i].render();
    }*/
  },
});

const states = [loop]

states[aStateId].start();

