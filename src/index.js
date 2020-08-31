import {
  init,
  Sprite,
  SpriteSheet,
  GameLoop,
  initKeys,
  keyPressed,
  Scene,
  Quadtree,
  Vector
} from "kontra";
import spritesheet from "./assets/images/sprites/spritesheet.png";

let { canvas, context } = init();
context.imageSmoothingEnabled = false;
initKeys();
const quad = Quadtree({
  bounds: {x:0, y:0, width:128, height:128},
  maxObjects: 10
})

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
  flippedcontext.drawImage(spriteImage, 0, 0, 32, 16, 0, 0, 32, 16);
  
  const totalanimcanvas = document.createElement("canvas");
  totalanimcanvas.height = 32
  totalanimcanvas.width = 32
  const totalanimcontext = totalanimcanvas.getContext('2d')
  totalanimcontext.drawImage(spriteImage, 0, 0, 32, 16, 0, 0, 32, 16)
  totalanimcontext.drawImage(flippedcanvas, 0, 0, 32, 16, 0, 16, 32, 16)

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
        frames: [11, 10],
        frameRate: 1,
        loop: true,
      },
      fwalk: {
        frames: [9, 8],
        frameRate: 5,
        loop: true
      },
      jump: {
        frames: [4, 5],
        frameRate: 5,
        loop: true
      },
      fall: {
        frames: [6, 7],
        frameRate: 5,
        loop: true
      },
      fjump: {
        frames: [15, 14],
        frameRate: 5,
        loop: true
      },
      ffall: {
        frames: [13, 12],
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

  const jumpHeight = 16
  const timeToApex = 80
  const g = (2 * jumpHeight)/(timeToApex^2)
  //const initJumpVel = Math.sqrt(2*g*jumpHeight)

  pc = Sprite({
    x: 10,
    y: 32,
    sx: 0.6,
    sy: 0.6,
    dt: 1/60,
    width: 8,
    height: 8,
    animations: ssheet.animations,
    currentAnimation: ssheet.animations['idle'],
    inGround: false,
    isMoving: false,
    jumping: false,
    flipped: false,
    falling: false,
    jumpButtonPressed: false,
    animStarted: false,
    update: function () {
      
      this.isMoving = false;
      if (keyPressed("left")) {
        //console.log("pressing left")
        this.isMoving = true;
        this.flipped = true;
        this.x -= this.sx + g*this.dt;
        //this.sx += 0.6
      }
  
      if (keyPressed("right")) {
        //console.log("pressing right")
        this.isMoving = true;
        this.flipped = false;
        this.x += this.sy + g*this.dt;
        //this.sx += 0.6
      }

      if (keyPressed("a") && this.inGround && !this.jumpButtonPressed) {
        this.jumpButtonPressed = true
        this.jumping = true
        this.baseY = this.y
        this.inGround = false
      } else {
        if (keyPressed("a") === false) {
          this.jumpButtonPressed = false
        }
      }

      if (this.jumping) {
        //console.log("pressing right")
        this.isMoving = true;
        this.y -= Math.sqrt(2*g*jumpHeight);
          console.log("baseY",this.baseY)
        console.log("dif UP",Math.sqrt(2*g*jumpHeight))
        console.log("y UP",this.y)

        if (this.y <= this.baseY - jumpHeight) {
          console.log("falling from jump")
          this.falling = true
          this.jumping = false
        } 

        //this.sx += 0.6
      } 
      
      quad.clear()
      quad.add(this)
      for (let i = 0; i < landSprite.length; i++) {
        quad.add(landSprite[i])
      }

      const inQuad = quad.get(this)
      //console.log("inQuad", inQuad.length)
      let col = false
      if (inQuad.length > 0) {
        for (let i = 0; i < inQuad.length && !col; i++) {
          let land = inQuad[i]
          if (this.y + 8 >= land.y && this.y + 7 <= land.y && 
            this.x + 5 >= land.x && this.x + 3 <= land.x + 8) {
            col = true
            this.y = land.y - 7
            this.inGround = true
            this.falling = false
          } 
        }
      }
  
      
      if (!col && !this.jumping) {
        //console.log(col)
        this.falling = true
        this.y += g * 1.8
        this.inGround = false
      }
      
    },
    render: function () {

      if (this.flipped) {
        if (this.isMoving) {
          this.animStarted = false
          this.currentAnimation = this.animations["fwalk"]
        } else {
          if (!this.animStarted) {
            this.animations['fidle'].reset()
            this.animStarted = true
          }
          this.currentAnimation = this.animations["fidle"]
        }

        if (this.jumping) {
          this.currentAnimation = this.animations["fjump"]
        }

        if (this.falling) {
          this.currentAnimation = this.animations["ffall"]
        }
      } else {
        if (this.isMoving) {
          this.animStarted = false
          this.currentAnimation = this.animations["walk"]
        } else {
          if (!this.animStarted) {
            this.animations['idle'].reset()
            this.animStarted = true
          }
          this.currentAnimation = this.animations["idle"]
        }

        if (this.jumping) {
          this.currentAnimation = this.animations["jump"]
        }

        if (this.falling) {
          this.currentAnimation = this.animations["fall"]
        }
      }
/*
        if (this.isMoving) {
          
          this.animStarted = false
          
          if (this.flipped) {
            console.log('WALK animation')
            this.currentAnimation = this.animations["fwalk"]
          } else {
            
          }
          if (this.jumping) {
            console.log('JUMP animation')
            if (this.flipped) {
              this.currentAnimation = this.animations["fjump"]
            } else {
              this.currentAnimation = this.animations["jump"]
            }
          }
          if (this.falling) {
            console.log('FALL animation')
            if (this.flipped) {
              this.currentAnimation = this.animations["ffall"]
            } else {
              this.currentAnimation = this.animations["fall"]
            }
          }
          
        } else {
          if (this.flipped) {
            if (!this.animStarted) {
              this.animations['fidle'].reset()
              this.animStarted = true
            }
            this.currentAnimation = this.animations["fidle"]
          } else {
            
          }
          
          //this.sprite.playAnimation("idle");
        }
        

        */
        this.currentAnimation.update()
        this.draw()
      }
  })

  const mapcanvas = document.createElement("canvas");
  mapcontext = mapcanvas.getContext("2d");
  mapcontext.drawImage(spriteImage, 0, 16, 24, 8, 0, 0, 24, 8);

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
          //console.log('sprite 1', chance)
          maptilespritescontext.drawImage(spriteImage, 32, 0, 8, 8, 0, 0, 8, 8);
        } else {
          //console.log('sprite 2', chance)
          maptilespritescontext.drawImage(spriteImage, 40, 0, 8, 8, 0, 0, 8, 8);
        }
        if (chance > 0.5) {
          //console.log('sprite 1', chance)
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
      //gameScene.lookAt(pc)
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

