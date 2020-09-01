import {
  init,
  Sprite,
  SpriteSheet,
  GameLoop,
  initKeys,
  keyPressed,
  Scene,
  Quadtree,
  Vector,
  GameObject
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


let landSprite = [];
let pc = undefined
let camFocus = GameObject({update: function () {
  //console.log("camFocus x", this.x)
  if (pc.x >= this.x + 16) {
    console.log("moving focus")
    this.x += pc.x - (this.x + 16)
  }

  if (pc.x <= this.x - 16) {
    console.log("moving focus")
    this.x -= (this.x - 16) - pc.x
  }
}})

const attacks =[]
attacks.push(Sprite({
  width: 8,
  height: 8,
  x:0, 
  y:0,
  opacity: 0
}))


let mapcontext = undefined;

const spriteImage = new Image();
spriteImage.src = spritesheet;

spriteImage.onload = () => {

  const flippedcanvas = document.createElement("canvas");
  const flippedcontext = flippedcanvas.getContext("2d");
  flippedcontext.translate(32, 0)
  flippedcontext.scale(-1,1)
  flippedcontext.drawImage(spriteImage, 0, 0, 32, 24, 0, 0, 32, 24);
  
  const totalanimcanvas = document.createElement("canvas");
  totalanimcanvas.height = 48
  totalanimcanvas.width = 32
  const totalanimcontext = totalanimcanvas.getContext('2d')
  totalanimcontext.drawImage(spriteImage, 0, 0, 32, 24, 0, 0, 32, 24)
  totalanimcontext.drawImage(flippedcanvas, 0, 0, 32, 24, 0, 24, 32, 24)

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
        frames: [15, 14],
        frameRate: 1,
        loop: true,
      },
      fwalk: {
        frames: [13, 12],
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
        frames: [19, 18],
        frameRate: 5,
        loop: true
      },
      ffall: {
        frames: [17, 16],
        frameRate: 5,
        loop: true
      },
      attack: {
        frames: [8, 9, 9, 9],
        frameRate: 5,
        loop: false
      },
      fattack: {
        frames: [23, 22, 22, 22],
        frameRate: 5,
        loop: false
      },
    },
  });

  const jumpHeight = 16
  const timeToApex = 80
  const g = (2 * jumpHeight)/(timeToApex^2)

  pc = Sprite({
    x: 10,
    y: 32,
    dx: 0.6,
    dy: 0.6,
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
    attacking: false,
    jumpButtonPressed: false,
    attackButtonPressed: false,
    animStarted: false,
    attackTimer: 0,
    update: function () {
      
      this.isMoving = false;
      if (keyPressed("left") && !this.attacking) {
        //console.log("pressing left")
        this.isMoving = true;
        this.flipped = true;
        this.x -= this.dx + g*this.dt;
        //this.sx += 0.6
      }
  
      if (keyPressed("right") && !this.attacking) {
        //console.log("pressing right")
        this.isMoving = true;
        this.flipped = false;
        this.x += this.dx + g*this.dt;
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

      if (keyPressed("s") && this.inGround && !this.attackButtonPressed) {
        this.attackButtonPressed = true
        this.attacking = true
        this.animations["attack"].reset()
        this.animations["fattack"].reset()
        this.attackTimer = this.animations["attack"].frameRate * this.animations["attack"].frames.length + 5
        /*console.log("this.attackTimer", this.attackTimer)
        console.log("this.x", this.x)
        console.log("this.y", this.y)
        console.log("this.world", this.world)
        console.log("this.attackTimer", this.attackTimer)*/

      } else {
        if (keyPressed("s") === false) {
          this.attackButtonPressed = false
        }
      }

      if (this.attacking) {
        this.attackTimer--
        if (this.attackTimer <= 0) {
          this.attacking = false
        }
      }

      if (this.jumping) {
        this.isMoving = true;
        this.y -= Math.sqrt(2*g*jumpHeight);

        if (this.y <= this.baseY - jumpHeight) {
          this.falling = true
          this.jumping = false
        }
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
            this.y = land.y - 8
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
      attacks[0].opacity = 0
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

        if (this.attacking) {
          this.animStarted = false
          this.currentAnimation = this.animations["fattack"]

          if (this.attackTimer < 10) {
            attacks[0].x = this.x 
            attacks[0].y = this.y
            attacks[0].opacity = 1
            attacks[0].setScale(-1, 1)
          } else {
            attacks[0].opacity = 0
          }
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

        if (this.attacking) {
          this.animStarted = false
          this.currentAnimation = this.animations["attack"]

          if (this.attackTimer < 10) {
            attacks[0].x = this.x + 8
            attacks[0].y = this.y
            attacks[0].setScale(1, 1)
            attacks[0].opacity = 1
          } else {
            attacks[0].opacity = 0
          }
        }
      }
        this.currentAnimation.update()
        this.draw()
      }
  })

  camFocus.x = pc.x
  camFocus.y = pc.y

  const mapcanvas = document.createElement("canvas");
  mapcontext = mapcanvas.getContext("2d");
  mapcontext.drawImage(spriteImage, 0, 24, 24, 8, 0, 0, 24, 8);

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

  maptilespritescontext.clearRect(0, 0, 8, 8)
  maptilesprites.width = 8
  maptilesprites.height = 8
  maptilespritescontext.drawImage(spriteImage, 32, 8, 8, 8, 0, 0, 8, 8)

  const attackImg = new Image()
  attackImg.src = maptilesprites.toDataURL("image/png")
  attacks[0].image = attackImg
  //attacks[0].setScale(1, 1)
  gameScene = new Scene({id: 'game',
  children:[...landSprite, pc, ...attacks, camFocus]})
  

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
      //camFocus.update()
      gameScene.lookAt(camFocus)
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

