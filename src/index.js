/**
 * Lost Pages - A game for the js13k 2020 competition
 * by Ragnatic https://twitter.com/Ragnatic
 *
 * This is a platform game made quickly using the KontraJS
 * engine. Looking back I think I should have used custom made 
 * classes to have a better looking code and less headaches. 
 * I always creating objects using KontraJS classes directly 
 * with no inheritance. The average pixelart is made by me with
 * some suggestions of my wife https://twitter.com/caroldesignart.
 */

import {
  init,
  Sprite,
  SpriteSheet,
  GameLoop,
  initKeys,
  keyPressed,
  Scene,
  Quadtree,
  GameObject,
  lerp, 
  randInt
} from "kontra"
import {initFont} from "tinyfont"
import {font} from "tinyfont/font-tiny"
import spritesheet from "./assets/images/sprites/spritesheet.png"

let { canvas, context } = init()

const showText = initFont(font, context)
context.imageSmoothingEnabled = false 
initKeys() 

// I make heavy use (like too much) of the KontraJS quadtree in collisions
const quad = Quadtree({
  bounds: {x:0, y:0, width:128, height:128},
  maxObjects: 10
})

let gameScene = undefined

let landSprite = [] 
let pc = undefined

/**
 * The camera should focus on this object and not the player.
 * This makes camera movements less vomit-inducing
 */
let camFocus = GameObject({update: function () {
  if (pc.x >= this.x + 16) {
    this.x += pc.x - (this.x + 16)
    if (this.x >= 128 * 2 + 32) {
      this.x = 128 * 2 + 32
    }
  }

  if (pc.x <= this.x - 16) {
    this.x -= (this.x - 16) - pc.x
    if (this.x <= 10) {
      this.x = 10
    }
  }
}})

/**
 * Get collision box of objects
 * @param {GameObject} obj 
 */
function collbox (obj) {
  return {x1: obj.x, x2:obj.x + obj.width, y1: obj.y, y2: obj.y + obj.height}
}

/**
 * Classic AABB collision check
 * @param {GameObject} obj1 
 * @param {GameObject} obj2 
 */
function collided(obj1, obj2) {
  const box1 = collbox(obj1)
  const box2 = collbox(obj2)
  if (box1.x1 >= box2.x2 || 
    box1.y1 >= box2.y2 ||
    box2.x1 >= box1.x2 ||
    box2.y1 >= box1.y2) {
      return false
    } 
    return true
}

let arrowPool = {
  active: [],
  inactive: []
}

for (let i = 0; i < 4; i++) {
  arrowPool.inactive.push(new Sprite({
    id: "enemy",
    width: 8,
    height: 8
}))
}

let enemiesInScene = []

/**
 * I was going to create like 2 or 3 attacks for the player
 * but I ended using just one
 */
const attacks =[]
attacks.push(Sprite({
  id: 'attack',
  width: 8,
  height: 8,
  x:0, 
  y:0,
  opacity: 0,
  time: 0,
  update: function() {
    if (this.opacity !== 0) {
      const inQuad = quad.get(this)
      let col = false
      if (inQuad.length > 0 && this.opacity !== 0) {
        
        for (let i = 0; i < inQuad.length && !col; i++) {
          let land = inQuad[i]
          if (land.id === 'enemy') {
            if (collided(this, land)) {
                  col = true
                  land.isHit = true
                }
          }    
        }
      }
    }
  }
}))

/**
 * This object will display an animation where
 * an enemy is defeated
 */
const deadFX = Sprite({
  height: 8,
  width: 8,
  visFrames: 0,
  opacity: 0,
  visible: false,
  update: function() {
    if (this.opacity === 1 && !this.visible) {
      this.visible = true
      this.visFrames = 20
    }

    if (this.visFrames > 0) {
      this.visFrames--
      if (this.visFrames <= 0) {
        this.visible = false
        this.opacity = 0
        
      }
    }

  },
  render: function() {
    if (this.visible) {
      this.context.imageSmoothingEnabled = false
      this.context.strokeStyle = `rgb(245, 237, 186)`
      this.context.beginPath()
      this.context.translate(4, 4)
      this.context.rotate(Math.round(Math.random() * 10))
      this.context.rect(0, 0, this.visFrames % 5, this.visFrames % 5)
      this.context.stroke()
    }
    
  }
})

// An array of the items to collect
let pages = []

let resetGameState = undefined
/**
 * 
 */ 
const spriteImage = new Image() 
spriteImage.src = spritesheet 
spriteImage.onload = () => {

  const flippedcanvas = document.createElement("canvas") 
  const flippedcontext = flippedcanvas.getContext("2d") 
  flippedcontext.translate(32, 0)
  flippedcontext.scale(-1,1)
  flippedcontext.drawImage(spriteImage, 0, 0, 32, 24, 0, 0, 32, 24) 
  
  const totalanimcanvas = document.createElement("canvas") 
  totalanimcanvas.height = 48
  totalanimcanvas.width = 32
  const totalanimcontext = totalanimcanvas.getContext('2d')
  totalanimcontext.drawImage(spriteImage, 0, 0, 32, 24, 0, 0, 32, 24)
  totalanimcontext.drawImage(flippedcanvas, 0, 0, 32, 24, 0, 24, 32, 24)
  let ssheetImage = new Image()
  ssheetImage.src = totalanimcanvas.toDataURL("image/png")
  let ssheet = SpriteSheet({
    image: ssheetImage,
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
      hurt: {
        frames: [10, 11],
        frameRate: 3,
        loop: false
      },
      fhurt: {
        frames: [21, 20],
        frameRate: 3,
        loop: false
      },
    },
  }) 

  totalanimcontext.clearRect(0, 0, totalanimcanvas.width, totalanimcanvas.height)
  totalanimcanvas.height = 8
  totalanimcanvas.width = 16
  totalanimcontext.drawImage(spriteImage, 0, 24, 16, 8, 0, 0, 16, 8)
  let enemyssheetImage = new Image()
  enemyssheetImage.src = totalanimcanvas.toDataURL("image/png")
  let enemyssheet = SpriteSheet({
    image: enemyssheetImage,
    frameWidth: 8,
    frameHeight: 8,
    animations: {
      slime: {
        frames: [0, 1],
        frameRate: 6,
        loop: true,
      },
    }
  })

  flippedcontext.clearRect(0, 0, 16, 8)
  flippedcanvas.height = 8
  flippedcanvas.width = 16
  flippedcontext.translate(16, 0)
  flippedcontext.scale(-1,1)
  flippedcontext.drawImage(spriteImage, 16, 24, 16, 8, 0, 0, 16, 8)
  totalanimcontext.clearRect(0, 0, 32, 16)
  totalanimcanvas.height = 16
  totalanimcanvas.width = 16
  totalanimcontext.drawImage(spriteImage, 16, 24, 16, 8, 0, 0, 16, 8)
  totalanimcontext.drawImage(flippedcanvas, 0, 0, 16, 8, 0, 8, 16, 8)
  let enemyssheetImage2 = new Image()
  enemyssheetImage2.src = totalanimcanvas.toDataURL("image/png")
  let enemyssheet2 = SpriteSheet({
    image: enemyssheetImage2,
    frameWidth: 8,
    frameHeight: 8,
    animations: {
      wolfman: {
        frames: [0, 1],
        frameRate: 5,
        loop: true,
      },
      fwolfman: {
        frames: [3, 2],
        frameRate: 5,
        loop: true,
      },
    }
  })

  const jumpHeight = 16
  const timeToApex = 80
  const g = (2 * jumpHeight)/(timeToApex^2)

  pc = Sprite({
    id: 'player',
    x: 10,
    y: 32,
    dx: 0.6,
    dy: 0.6,
    dt: 1/60,
    width: 8,
    height: 8,
    hp: "LLL",
    life: "LLL",
    animations: ssheet.animations,
    currentAnimation: ssheet.animations['idle'],
    inGround: false,
    isMoving: false,
    hurtFrames: 0,
    lastLand: undefined,
    jumping: false,
    flipped: false,
    falling: false,
    attacking: false,
    jumpButtonPressed: false,
    attackButtonPressed: false,
    animStarted: false,
    attackTimer: 0,
    update: function () {
      
      this.isMoving = false 

      if (keyPressed("left") && !this.attacking && this.hurtFrames===0)  {
        this.isMoving = true 
        this.flipped = true 
        this.x -= this.dx + g*this.dt 
      }
  
      if (keyPressed("right") && !this.attacking && this.hurtFrames===0) {
        this.isMoving = true 
        this.flipped = false 
        this.x += this.dx + g*this.dt 
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
        this.isMoving = true 
        this.y -= Math.sqrt(2*g*jumpHeight) 

        if (this.y <= this.baseY - jumpHeight) {
          this.falling = true
          this.jumping = false
        }
      } 
      
      

      const inQuad = quad.get(this)
      //console.log("inQuad", inQuad.length)
      let col = false
      if (inQuad.length > 0) {
        for (let i = 0; i < inQuad.length; i++) {
          let land = inQuad[i]
          if (land.id === 'land' && this.y + 9 >= land.y && this.y + 7 <= land.y && 
            this.x + 5 >= land.x && this.x + 3 <= land.x + 8) {
            col = true
            this.y = land.y - 8
            this.inGround = true
            this.falling = false
            this.lastLand = land
          }
          
          if ((land.id === 'enemy') && 
          collided(land, this) && this.hurtFrames === 0) {
            console.log("player hurt by", land.id, " at ", land.x, land.y)
            console.log('PLAYER HURT')
            
            this.hp = this.hp.substr(0, this.hp.length - 1)
            
            this.hurtFrames = 30
          }
        }
      }
  
      if(this.hurtFrames > 0) {
        this.hurtFrames--
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

        if (this.hurtFrames > 0) {
          this.currentAnimation = this.animations["fhurt"]
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

        if (this.hurtFrames > 0) {
          this.currentAnimation = this.animations["hurt"]
        }
      }
        this.currentAnimation.update()
        this.draw()
      }
  })

  const maptilesprites = document.createElement("canvas") 
  const maptilespritescontext = maptilesprites.getContext("2d")
  
  maptilespritescontext.clearRect(0, 0, 8, 8)
  maptilesprites.width = 8
  maptilesprites.height = 8
  maptilespritescontext.drawImage(spriteImage, 32, 8, 8, 8, 0, 0, 8, 8)

  const attackImg = new Image()
  attackImg.src = maptilesprites.toDataURL("image/png")
  attacks[0].image = attackImg

  let mapcontext = undefined
  const mapcanvas = document.createElement("canvas") 
  mapcontext = mapcanvas.getContext("2d") 
  mapcontext.drawImage(spriteImage, 0, 32, 40, 8, 0, 0, 40, 8) 
  maptilesprites.width = 8
  maptilesprites.height = 8

  maptilespritescontext.clearRect(0, 0, 8, 8)
  maptilesprites.width = 8
  maptilesprites.height = 8
  maptilespritescontext.drawImage(spriteImage, 40, 8, 8, 8, 0, 0, 8, 8)       
  let pageImage = new Image()
  pageImage.src = maptilesprites.toDataURL("image/png")
   
  resetGameState = () => {
    quad.clear()
    enemiesInScene = []
    landSprite = []
    pages = []
    pc.x = 10
    pc.y = 32
    pc.hp = "LLL"
    pc.life = "LLL"
    camFocus.x = pc.x
    camFocus.y = pc.y

    for (let i = 0; i < 40; i++) {
      for (let j = 0; j < 8; j++) {
        const pixelData = mapcontext.getImageData(i, j, 1, 1).data 
        if (pixelData[0] === 245) {
          //console.log("drawing at ", i, " and ", j) 
          
          maptilespritescontext.clearRect(0, 0, maptilesprites.width, maptilesprites.height)
          const chance = Math.random()
          if (chance > 0.5) {
            //console.log('sprite 1', chance)
            maptilespritescontext.drawImage(spriteImage, 32, 0, 8, 8, 0, 0, 8, 8) 
          } else {
            //console.log('sprite 2', chance)
            maptilespritescontext.drawImage(spriteImage, 40, 0, 8, 8, 0, 0, 8, 8) 
          }
          if (chance > 0.5) {
            //console.log('sprite 1', chance)
            maptilespritescontext.translate(8, 0)
            maptilespritescontext.scale(-1, 1) 
          } 
          let temp = new Image()
          temp.src = maptilesprites.toDataURL("image/png")
          landSprite.push(
            Sprite({
              id: 'land',
              width: 8,
              height: 8,
              x: i * 8,
              y: j * 8,
              floor: true,
              image: temp,
            })
          )
        }
        if (pixelData[0] === 52) {
          // Slime        
          enemiesInScene.push(Sprite({
            id: 'enemy',
            width: 8,
            height: 8,
            x: i*8,
            y: j*8,
            dir: Math.random() > 0.5 ? -1 : 1,
            isHit: false,
            animations: enemyssheet.animations,
            currentAnimation: enemyssheet.animations['slime'],
            update: function () {
              if ((Math.abs(this.x - pc.x) < 90)) {
                const inQuad = quad.get(this)
                //console.log("inQuad", inQuad.length)
                
                let col = false
                
                if (inQuad.length > 0) {
                  
                  for (let i = 0; i < inQuad.length && !col; i++) {
                    let land = inQuad[i]
                    if (land.id === 'land' && 
                    this.y + 8 >= land.y && this.y + 7 <= land.y && 
                    this.x + 3 >= land.x && this.x + 1 <= land.x + 8) {
                      col = true
                    }
                  }
                }
    
                if (!col) {
                  this.dir = this.dir * -1
                }
                
                this.x += this.dir * 0.3
              }
              
            },
            render: function () {
              this.currentAnimation.update()
              this.draw()
            }
          }))
          console.log("setting slime", i*8, j*8)
        }
  
        if (pixelData[0] === 88) {
          // Wolfman
          maptilespritescontext.clearRect(0, 0, maptilesprites.width, maptilesprites.height)
          maptilesprites.width = 8
          maptilesprites.height = 8
          maptilespritescontext.drawImage(spriteImage, 32, 16, 8, 8, 0, 0, 8, 8)
          const wolfAttackImg = new Image()
          wolfAttackImg.src = maptilesprites.toDataURL("image/png")
          enemiesInScene.push(Sprite({
            id: 'enemy',
            width: 8,
            height: 8,
            x: i*8,
            y: j*8,
            dir: 1,
            isHit: false,
            turnFrames: 0,
            toShootFrames: 35,
            shootingFrames: 15,
            animations: enemyssheet2.animations,
            currentAnimation: enemyssheet2.animations['wolfman'],
            update: function () {
              if (Math.abs(this.x - pc.x) < 90) {
                const inQuad = quad.get(this)
              //console.log("inQuad", inQuad.length)
              let col = false
              
              if (inQuad.length > 0) {
                //console.log("slime touch ", inQuad.length)
                for (let i = 0; i < inQuad.length && !col; i++) {
                  let land = inQuad[i]
                  const offset = this.dir === 1 ? 7 : 2
                  if (land.id === 'land' &&  
                  this.y + 9 >= land.y &&
                  this.x + offset >= land.x && this.x + offset <= land.x + 8) {
                    col = true
                  }
                }
              }
  
              if (!col && this.turnFrames === 0) {
                this.dir = this.dir * -1
                this.turnFrames = 60
              }
  
              if (this.turnFrames > 0) {
                this.turnFrames--
              }
  
              if (this.toShootFrames > 0 ) {
                this.toShootFrames--
                if (this.toShootFrames <= 0) {
                  this.shootingFrames = 45
                }
              }
  
              if (this.shootingFrames > 0) {
                this.shootingFrames--
                if (this.shootingFrames === 15) {
                  
                  const dir = this.dir
                  const pos = {x:this.x, y:this.y}
                  // Arrow
                  let newArrow = undefined
                  console.log("new arrow at dir", dir)
                  if (arrowPool.inactive.length > 0) {
                    newArrow = arrowPool.inactive.pop()
                  } else {
                    newArrow = Sprite({})
                  }
                  console.log('active arrows', arrowPool.active.length)
                  console.log('inactive arrows', arrowPool.inactive.length)
                  arrowPool.active.push(newArrow)
                  
                    
                    newArrow.dx= 0.8 * dir
                    newArrow.x= dir === 1 ? pos.x: pos.x + 8
                    newArrow.scaleX= dir 
                    newArrow.y=pos.y
                    newArrow.image= wolfAttackImg
                    newArrow.update= function() {
                      const inQuad = quad.get(newArrow)
                      let col = false
                      if (inQuad.length > 0) {
                        
                        for (let i = 0; i < inQuad.length && !col; i++) {
                          let land = inQuad[i]
                          if (land.id === 'player') {
                            if (collided(newArrow, land)) {
                                  col = true
                            }
                          }    
                        }      
                      }

                      newArrow.advance()

                      if (Math.abs(newArrow.x - pc.x) > 90) {
                        newArrow.update = undefined
                        enemiesInScene.splice(enemiesInScene.indexOf(newArrow), 1)
                        arrowPool.active.splice(arrowPool.active.indexOf(newArrow), 1)
                        arrowPool.inactive.push(newArrow)
                        gameScene.removeChild(newArrow)
                        console.log("gamescene children", gameScene.children.length)
                      }
                  }
                  
                  enemiesInScene.push(newArrow)
                  gameScene.addChild(newArrow)     
                } else {
                    if (this.shootingFrames <= 0) {
                      this.toShootFrames = 65
                    }
                }
              } else {
                
                this.x += this.dir * 0.3
              }
              }
              
            },
            render: function () {
              if (this.dir === 1) {
                this.currentAnimation = this.animations["wolfman"]
              } else {
                this.currentAnimation = this.animations["fwolfman"]
              }
              
              this.currentAnimation.update()
              this.draw()
            }
          }))
          console.log("setting wolfman", i*8, j*8)
        }
  
        if (pixelData[0] === 228) {
          
          pages.push(Sprite({
            id: 'page',
            width: 8,
            height: 8,
            x: i*8,
            y: j*8,
            //anchor: {x:0, y:0},
            yMax: j*8 - 3,
            yMin: j*8,
            p: 0,
            dir: -1,
            image: pageImage,
            isHit: false,
            timer: 0,
            update: function () {
              const inQuad = quad.get(this)
              //console.log("inQuad", inQuad.length)
              let col = false
              
              if (inQuad.length > 0) {
                //console.log("slime touch ", inQuad.length)
                for (let i = 0; i < inQuad.length && !col; i++) {
                  let land = inQuad[i]
                  if (land.id === 'player') {
                    if (collided(this, land)) {
                          
                          console.log("PAGE COLLECTED")
                          col = true
                          this.isHit = true
                        }
                  }
                }
              }
              
              this.y = lerp(this.yMin, this.yMax, this.p)
              this.p += 0.03 * this.dir
              if (this.p >= 1) {
                this.dir = -1
              }
              if (this.p <= 0) {
                this.dir = 1
              }
            }
          }))
          console.log('page at', i*8, j*8)
        }
      }
    }
    
    const bgGroundRocks = []
    for (let i = 0; i < 30; i++) {
      bgGroundRocks.push({x:i * 20 + Math.random() * 10, y:randInt(110, 124)})
    }

    let bg = Sprite({
      x: camFocus.x - 64,
      y: 0,
      width: 450,
      height: 128,
      update: function() {
        
        this.y = camFocus.y - 64
      },
      render: function() {
        this.context.fillStyle = `rgb(62, 33, 55)`
        this.context.fillRect(0, 0, 450, 128)
        this.context.fillStyle = `rgb(52, 133, 157)`
        this.context.fillRect(0, 0, 450, 25)
        this.context.fillStyle = `rgb(126, 196, 193)`
        this.context.fillRect(0, 25, 450, 15)
        this.context.fillStyle = `rgb(154, 99, 72)`
        //this.context.fillRect(0, 120, 128, 8)
        this.context.lineWidth = 1
        
        this.context.beginPath()
        this.context.lineTo(0, 128)
        for (let i = 0; i < 20; i++) {
          const point = bgGroundRocks[i]
          this.context.lineTo(point.x, point.y)
        }
        this.context.lineTo(bgGroundRocks[bgGroundRocks.length - 1].x, 128)
        
        this.context.closePath()
        this.context.fill()
        //this.context.fill()
      }
    })
    //camFocus.addChild(bg)
    gameScene = new Scene({id: 'game',
    
    children:[bg, ...landSprite, ...enemiesInScene, deadFX, pc, ...attacks, ...pages, camFocus]})
  }
  
  resetGameState()
} 

let firstLoad = true
let delay = 0
const states = []
states.push(GameLoop({
  update() {
    if (keyPressed("a")) {
      if (!firstLoad) {
        resetGameState()
      } else {
        firstLoad = false
      }
      delay = 30 
    }

    if (delay > 0) {
      delay--
      if (delay <= 0) {
        states[0].stop()
        states[1].start()
      }
    }
  },
  render() {
    showText("LOST PAGES", 44, 20, 4, 'rgb(245, 237, 186)')
    showText("RAGNATIC", 50, 90, 4, 'rgb(245, 237, 186)')
    showText("2020", 55, 100, 4, 'rgb(245, 237, 186)')
  }
})) 

states.push(GameLoop({
  update() {
    if (gameScene!==undefined) {
      quad.clear()
      quad.add(pc)
      for (let i = 0; i < landSprite.length; i++) {
        quad.add(landSprite[i])
      }
      //console.log("enemiesinscene length", enemiesInScene.length)
      for (let i = enemiesInScene.length - 1; i >= 0 ; i--) {
        const enemy = enemiesInScene[i]
        if (enemy.isHit) {
          deadFX.x = enemy.x
          deadFX.y = enemy.y
          deadFX.opacity = 1
          gameScene.removeChild(enemy)
          enemiesInScene.splice(enemiesInScene.indexOf(enemy), 1)
        } else {
          quad.add(enemiesInScene[i])
        }        
      }

      for (let i = pages.length - 1; i >= 0; i--) {
        const page = pages[i]
        if (page.isHit) {
          console.log(pages.length - 1, 'pages left')
          gameScene.removeChild(page)
          pages.splice(pages.indexOf(page), 1)
        } else {
          quad.add(pages[i])
        }
        
      }
      //console.log("quad length", quad.)
      if (pc.y > 128) {
        pc.hp = "LLL"  
        pc.life = pc.life.substr(0, pc.life.length - 1)
      
        if (pc.life.length === 0) {
          states[1].stop()
          states[0].start()
        } else {
          pc.x = pc.lastLand.x
          pc.y = pc.lastLand.y - 10
        }
      }

      if (pc.hp.length === 0) {
        pc.hp = "LLL"
        pc.life = pc.life.substr(0, pc.life.length - 1)
        if (pc.life.length === 0) {
          states[1].stop()
          states[0].start()
        } else {
          pc.x = pc.lastLand.x
          pc.y = pc.lastLand.y - 10
        }
      }

      if (pages.length <= 0) {
        states[1].stop()
        states[2].start()
      }

      gameScene.update()
      gameScene.lookAt(camFocus)
    }
    
  },
  render() {
    if (gameScene!==undefined) {
      
      
      
      gameScene.render()
      showText("LIFE", 0, 10, 4, 'rgb(245, 237, 186)')
      showText(pc.life, 12, 10, 4, 'rgb(100, 125, 52)')
      showText("HP", 0, 16, 4, 'rgb(245, 237, 186)')
      showText(pc.hp, 8, 16, 4, 'rgb(210, 100, 113)')
      
    }
  },
}))

states.push(GameLoop({
  update() {
    if (keyPressed("a")) {
      delay = 30 
    }

    if (delay > 0) {
      delay--
      if (delay <= 0) {
        states[2].stop()
        states[0].start()
      }
    }
  },
  render() {
    showText("CONGRATULATIONS!!", 34, 60, 4, 'rgb(245, 237, 186)')
    showText("YOU FOUND ALL PAGES!!", 28, 54, 4, 'rgb(245, 237, 186)')
  }
}))

states[0].start()

