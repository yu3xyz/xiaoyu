// === 小雨 - Pet Drawing & Animation Engine ===

const PetState = {
  IDLE: 'idle',
  TALKING: 'talking',
  HAPPY: 'happy',
  THINKING: 'thinking',
  BLINK: 'blink',
  SLEEP: 'sleep',
  PET: 'pet'
};

class XiaoYu {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = PetState.IDLE;
    this.frame = 0;
    this.blinkTimer = 0;
    this.blinkDuration = 0;
    this.isBlinking = false;
    this.talkFrame = 0;
    this.breathOffset = 0;
    this.eyeDirection = { x: 0, y: 0 };
    this.targetEyeDir = { x: 0, y: 0 };
    this.mood = 'neutral'; // neutral, happy, sad, angry, surprised
    this.emotionTimer = 0;
    this.cheekBlush = 0;
    this.petting = false;
    this.petCount = 0;
    this.tailWag = 0;

    // Character colors
    this.colors = {
      skin: '#FDE8E0',
      skinShadow: '#F5D5C8',
      hair: '#4A4A6A',
      hairLight: '#6A6A8A',
      eye: '#6A5ACD',
      eyeLight: '#8B7BEF',
      eyeShine: '#FFFFFF',
      dress: '#F0B4C8',
      dressDark: '#E09AB0',
      dressLight: '#F8D0DC',
      blush: 'rgba(255, 150, 150, 0.35)',
      mouth: '#E07080',
      ribbon: '#FF6B8A',
      ribbonDark: '#E05070',
      sock: '#FFFFFF',
      shoe: '#4A4A6A',
      shoeShine: '#FFFFFF'
    };

    // Animation cycle: [state, duration_frames]
    this.idleSequence = [
      { type: 'look_left', duration: 60 },
      { type: 'look_right', duration: 60 },
      { type: 'look_center', duration: 120 },
      { type: 'tilt', duration: 40 },
      { type: 'look_center', duration: 100 },
    ];
    this.sequenceIndex = 0;
    this.sequenceTimer = 0;
    this.handPosition = 0; // 0 = down, 1 = wave, 2 = think
    this.bodyTilt = 0;

    this.init();
  }

  init() {
    this.drawLoop();
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateTimer = 0;
    if (newState === PetState.TALKING) {
      this.talkFrame = 0;
    }
    if (newState === PetState.BLINK) {
      this.isBlinking = true;
      this.blinkDuration = 6;
    }
  }

  drawLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.drawLoop());
  }

  update() {
    this.frame++;
    this.breathOffset = Math.sin(this.frame * 0.03) * 1.5;
    this.stateTimer++;

    // Blink automatically
    if (!this.isBlinking) {
      this.blinkTimer++;
      if (this.blinkTimer > 120 + Math.random() * 80) {
        this.isBlinking = true;
        this.blinkDuration = 6;
        this.blinkTimer = 0;
      }
    } else {
      this.blinkDuration--;
      if (this.blinkDuration <= 0) {
        this.isBlinking = false;
      }
    }

    // Mood emotion timer
    if (this.emotionTimer > 0) {
      this.emotionTimer--;
    } else {
      this.mood = 'neutral';
    }

    // Cheek blush fades
    this.cheekBlush *= 0.95;

    // Eye movement smoothing
    this.eyeDirection.x += (this.targetEyeDir.x - this.eyeDirection.x) * 0.05;
    this.eyeDirection.y += (this.targetEyeDir.y - this.eyeDirection.y) * 0.05;

    // Pet reaction
    if (this.petting) {
      this.petCount++;
      if (this.petCount > 60) {
        this.petting = false;
        this.petCount = 0;
      }
      this.cheekBlush = Math.max(this.cheekBlush, 0.8);
      this.mood = 'happy';
      this.emotionTimer = 60;
    }

    // Idle sequence - random eye movement
    if (this.state === PetState.IDLE || this.state === PetState.THINKING) {
      this.sequenceTimer++;
      const currentSeq = this.idleSequence[this.sequenceIndex];
      if (this.sequenceTimer > currentSeq.duration) {
        this.sequenceTimer = 0;
        this.sequenceIndex = (this.sequenceIndex + 1) % this.idleSequence.length;
      }
      switch (currentSeq.type) {
        case 'look_left':
          this.targetEyeDir.x = -0.4;
          this.targetEyeDir.y = 0;
          this.handPosition = 0;
          this.bodyTilt *= 0.9;
          break;
        case 'look_right':
          this.targetEyeDir.x = 0.4;
          this.targetEyeDir.y = 0;
          this.handPosition = 0;
          this.bodyTilt *= 0.9;
          break;
        case 'look_center':
          this.targetEyeDir.x *= 0.9;
          this.targetEyeDir.y *= 0.9;
          this.handPosition = 0;
          this.bodyTilt *= 0.9;
          break;
        case 'tilt':
          this.targetEyeDir.x = 0;
          this.targetEyeDir.y = 0;
          this.bodyTilt = 0.05;
          this.handPosition = 0;
          break;
        case 'think':
          this.targetEyeDir.x = 0.2;
          this.targetEyeDir.y = -0.3;
          this.handPosition = 2;
          break;
      }
    }

    // Tail wag decay
    this.tailWag *= 0.9;
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    // Center the character
    ctx.translate(w / 2, h / 2 + 20);
    ctx.scale(1, 1);

    const breathe = this.breathOffset;
    const tilt = this.bodyTilt;

    // === DRAW ORDER: back to front ===

    // Hair back
    this.drawHairBack(ctx, breathe);

    // Body (behind arms)
    this.drawBody(ctx, breathe);

    // Left arm
    this.drawArm(ctx, 'left', breathe, tilt);

    // Head
    this.drawHead(ctx, breathe, tilt);

    // Face
    this.drawFace(ctx, breathe, tilt);

    // Hair front
    this.drawHairFront(ctx, breathe, tilt);

    // Ribbon
    this.drawRibbon(ctx, breathe, tilt);

    // Right arm
    this.drawArm(ctx, 'right', breathe, tilt);

    // Pet effect
    if (this.petting) {
      this.drawPetEffect(ctx);
    }

    ctx.restore();
  }

  drawHead(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    // Head shape
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 42, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 160, 150, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ears
    ctx.beginPath();
    ctx.ellipse(-34, -5, 8, 10, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(34, -5, 8, 10, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();

    ctx.restore();
  }

  drawHairBack(ctx, breathe) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3);

    // Back hair - flowing down
    ctx.beginPath();
    ctx.moveTo(-30, -30);
    ctx.quadraticCurveTo(-42, 0, -38, 30);
    ctx.quadraticCurveTo(-36, 40, -32, 45);
    ctx.quadraticCurveTo(-30, 25, -25, -5);
    ctx.quadraticCurveTo(-22, -25, -30, -30);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(30, -30);
    ctx.quadraticCurveTo(42, 0, 38, 30);
    ctx.quadraticCurveTo(36, 40, 32, 45);
    ctx.quadraticCurveTo(30, 25, 25, -5);
    ctx.quadraticCurveTo(22, -25, 30, -30);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    // Bangs - back layer
    ctx.beginPath();
    ctx.moveTo(-28, -32);
    ctx.quadraticCurveTo(-20, -42, -10, -38);
    ctx.quadraticCurveTo(0, -42, 10, -38);
    ctx.quadraticCurveTo(20, -42, 28, -32);
    ctx.quadraticCurveTo(25, -22, 15, -28);
    ctx.quadraticCurveTo(0, -34, -15, -28);
    ctx.quadraticCurveTo(-25, -22, -28, -32);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    ctx.restore();
  }

  drawHairFront(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    // Side hair - left
    ctx.beginPath();
    ctx.moveTo(-32, -28);
    ctx.quadraticCurveTo(-40, -10, -36, 20);
    ctx.quadraticCurveTo(-34, 30, -28, 28);
    ctx.quadraticCurveTo(-30, 10, -26, -15);
    ctx.quadraticCurveTo(-24, -25, -32, -28);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    // Side hair - right
    ctx.beginPath();
    ctx.moveTo(32, -28);
    ctx.quadraticCurveTo(40, -10, 36, 20);
    ctx.quadraticCurveTo(34, 30, 28, 28);
    ctx.quadraticCurveTo(30, 10, 26, -15);
    ctx.quadraticCurveTo(24, -25, 32, -28);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    // Bangs - front layer (asymmetrical)
    ctx.beginPath();
    ctx.moveTo(-30, -34);
    ctx.quadraticCurveTo(-24, -42, -14, -38);
    ctx.quadraticCurveTo(-6, -42, 2, -37);
    ctx.quadraticCurveTo(10, -42, 20, -36);
    ctx.quadraticCurveTo(28, -32, 26, -26);
    ctx.quadraticCurveTo(18, -24, 8, -30);
    ctx.quadraticCurveTo(0, -26, -8, -30);
    ctx.quadraticCurveTo(-18, -24, -26, -28);
    ctx.quadraticCurveTo(-32, -30, -30, -34);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    // Hair highlights
    ctx.beginPath();
    ctx.moveTo(-12, -38);
    ctx.quadraticCurveTo(-6, -40, 0, -36);
    ctx.quadraticCurveTo(6, -38, 12, -34);
    ctx.quadraticCurveTo(6, -32, 0, -34);
    ctx.quadraticCurveTo(-6, -32, -12, -38);
    ctx.closePath();
    ctx.fillStyle = this.colors.hairLight;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawFace(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    // === EYES ===
    const eyeY = -2;
    const eyeSpacing = 16;
    const eyeW = 12;
    const eyeH = 14;
    const lookX = this.eyeDirection.x;
    const lookY = this.eyeDirection.y;

    if (this.isBlinking && this.blinkDuration > 2) {
      // Closed eyes (blink) - draw eyelashes
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-eyeSpacing - eyeW + 2, eyeY);
      ctx.quadraticCurveTo(-eyeSpacing, eyeY - 2, -eyeSpacing + eyeW - 2, eyeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(eyeSpacing - eyeW + 2, eyeY);
      ctx.quadraticCurveTo(eyeSpacing, eyeY - 2, eyeSpacing + eyeW - 2, eyeY);
      ctx.stroke();
    } else if (this.mood === 'happy' && this.emotionTimer > 30) {
      // Happy - crescent eyes
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY, eyeW * 0.7, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY, eyeW * 0.7, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    } else {
      // Normal eyes
      const leftEyeX = -eyeSpacing;
      const rightEyeX = eyeSpacing;

      // Eye whites
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Iris
      const irisR = 7;
      const irisOffsetX = lookX * 3;
      const irisOffsetY = lookY * 2;

      ctx.beginPath();
      ctx.ellipse(leftEyeX + irisOffsetX, eyeY + irisOffsetY, irisR, irisR, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eye;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + irisOffsetX, eyeY + irisOffsetY, irisR, irisR, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eye;
      ctx.fill();

      // Iris highlight
      const irisInnerR = 4;
      ctx.beginPath();
      ctx.ellipse(leftEyeX + irisOffsetX, eyeY + irisOffsetY, irisInnerR, irisInnerR, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeLight;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + irisOffsetX, eyeY + irisOffsetY, irisInnerR, irisInnerR, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeLight;
      ctx.fill();

      // Eye shine
      ctx.beginPath();
      ctx.arc(leftEyeX + irisOffsetX + 3, eyeY + irisOffsetY - 3, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeShine;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + irisOffsetX + 3, eyeY + irisOffsetY - 3, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeShine;
      ctx.fill();

      // Small secondary shine
      ctx.beginPath();
      ctx.arc(leftEyeX + irisOffsetX - 2, eyeY + irisOffsetY + 2, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + irisOffsetX - 2, eyeY + irisOffsetY + 2, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();

      // Upper eyelid shadow
      ctx.beginPath();
      ctx.moveTo(leftEyeX - eyeW, eyeY - 5);
      ctx.quadraticCurveTo(leftEyeX, eyeY - 8, leftEyeX + eyeW, eyeY - 5);
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightEyeX - eyeW, eyeY - 5);
      ctx.quadraticCurveTo(rightEyeX, eyeY - 8, rightEyeX + eyeW, eyeY - 5);
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eyelashes
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 1.5;
      for (let side = -1; side <= 1; side += 2) {
        const cx = side * eyeSpacing;
        for (let i = -1; i <= 1; i++) {
          const lx = cx + i * 5;
          ctx.beginPath();
          ctx.moveTo(lx, eyeY - 5);
          ctx.lineTo(lx + side * 1.5, eyeY - 9 + Math.abs(i) * 1.5);
          ctx.stroke();
        }
      }
    }

    // === EYEBROWS ===
    const browY = -16;
    ctx.strokeStyle = this.colors.hair;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 4, browY);
    ctx.quadraticCurveTo(-eyeSpacing, browY - 2, -eyeSpacing + 4, browY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeSpacing - 4, browY);
    ctx.quadraticCurveTo(eyeSpacing, browY - 2, eyeSpacing + 4, browY);
    ctx.stroke();

    // === CHEEK BLUSH ===
    if (this.cheekBlush > 0.05 || this.mood === 'happy') {
      const blushAlpha = Math.max(this.cheekBlush, this.mood === 'happy' ? 0.3 : 0);
      ctx.globalAlpha = blushAlpha * 0.8;
      ctx.beginPath();
      ctx.ellipse(-24, 8, 10, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.blush;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(24, 8, 10, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.blush;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // === MOUTH ===
    const mouthY = 12;

    if (this.state === PetState.TALKING) {
      // Open mouth (talking)
      const openAmount = 3 + Math.sin(this.frame * 0.4) * 2;
      ctx.beginPath();
      ctx.ellipse(0, mouthY + 2, 5, openAmount, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.mouth;
      ctx.fill();
      // Tongue
      if (openAmount > 3) {
        ctx.beginPath();
        ctx.ellipse(0, mouthY + 2 + openAmount * 0.4, 3, 2.5, 0, 0, Math.PI);
        ctx.fillStyle = '#FF8A9E';
        ctx.fill();
      }
    } else if (this.mood === 'happy') {
      // Big smile
      ctx.beginPath();
      ctx.arc(0, mouthY, 6, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = this.colors.mouth;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.mood === 'surprised') {
      // Small O mouth
      ctx.beginPath();
      ctx.ellipse(0, mouthY, 4, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.mouth;
      ctx.fill();
    } else {
      // Default smile
      ctx.beginPath();
      ctx.arc(0, mouthY, 4, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = this.colors.mouth;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBody(ctx, breathe) {
    ctx.save();
    ctx.translate(0, 20 + breathe);

    // Neck
    ctx.beginPath();
    ctx.ellipse(0, -32, 10, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();

    // Torso - dress
    ctx.beginPath();
    ctx.moveTo(-28, -28);
    ctx.quadraticCurveTo(-30, -10, -32, 10);
    ctx.quadraticCurveTo(-35, 25, -30, 40);
    ctx.lineTo(-18, 38);
    ctx.quadraticCurveTo(-16, 30, -14, 18);
    ctx.quadraticCurveTo(-12, 5, -10, -10);
    ctx.lineTo(-28, -28);
    ctx.closePath();
    ctx.fillStyle = this.colors.dress;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 150, 160, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(28, -28);
    ctx.quadraticCurveTo(30, -10, 32, 10);
    ctx.quadraticCurveTo(35, 25, 30, 40);
    ctx.lineTo(18, 38);
    ctx.quadraticCurveTo(16, 30, 14, 18);
    ctx.quadraticCurveTo(12, 5, 10, -10);
    ctx.lineTo(28, -28);
    ctx.closePath();
    ctx.fillStyle = this.colors.dress;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 150, 160, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Front dress panel
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.quadraticCurveTo(-8, 8, -6, 20);
    ctx.quadraticCurveTo(-4, 30, -2, 35);
    ctx.lineTo(2, 35);
    ctx.quadraticCurveTo(4, 30, 6, 20);
    ctx.quadraticCurveTo(8, 8, 10, -10);
    ctx.closePath();
    ctx.fillStyle = this.colors.dressLight;
    ctx.fill();

    // Collar
    ctx.beginPath();
    ctx.moveTo(-8, -28);
    ctx.quadraticCurveTo(0, -22, 8, -28);
    ctx.quadraticCurveTo(0, -24, -8, -28);
    ctx.closePath();
    ctx.fillStyle = this.colors.dressDark;
    ctx.fill();

    // Dress ribbon/bow
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.ribbon;
    ctx.fill();

    // Ribbon tails
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.quadraticCurveTo(-8, 10, -6, 14);
    ctx.quadraticCurveTo(-4, 10, -2, 4);
    ctx.closePath();
    ctx.fillStyle = this.colors.ribbon;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 2);
    ctx.quadraticCurveTo(8, 10, 6, 14);
    ctx.quadraticCurveTo(4, 10, 2, 4);
    ctx.closePath();
    ctx.fillStyle = this.colors.ribbon;
    ctx.fill();

    // Skirt
    ctx.beginPath();
    ctx.moveTo(-30, 40);
    ctx.quadraticCurveTo(-25, 48, -18, 50);
    ctx.quadraticCurveTo(-10, 52, 0, 50);
    ctx.quadraticCurveTo(10, 52, 18, 50);
    ctx.quadraticCurveTo(25, 48, 30, 40);
    ctx.quadraticCurveTo(20, 44, 12, 42);
    ctx.quadraticCurveTo(0, 40, -12, 42);
    ctx.quadraticCurveTo(-20, 44, -30, 40);
    ctx.closePath();
    ctx.fillStyle = this.colors.dress;
    ctx.fill();

    // Skirt frill
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const ax = -24 + i * 7;
      const ay = 46 + (i % 2 === 0 ? 3 : -1);
      if (i === 0) ctx.moveTo(ax, ay);
      else ctx.lineTo(ax, ay);
    }
    ctx.strokeStyle = this.colors.dressLight;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.ellipse(-8, 52, 6, 4, 0, 0, Math.PI);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 52, 6, 4, 0, 0, Math.PI);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();

    // Shoes
    ctx.beginPath();
    ctx.ellipse(-9, 55, 7, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.shoe;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(9, 55, 7, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.shoe;
    ctx.fill();

    // Socks
    ctx.beginPath();
    ctx.moveTo(-14, 46);
    ctx.lineTo(-14, 50);
    ctx.lineTo(-4, 50);
    ctx.lineTo(-4, 46);
    ctx.closePath();
    ctx.fillStyle = this.colors.sock;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 46);
    ctx.lineTo(4, 50);
    ctx.lineTo(14, 50);
    ctx.lineTo(14, 46);
    ctx.closePath();
    ctx.fillStyle = this.colors.sock;
    ctx.fill();

    ctx.restore();
  }

  drawArm(ctx, side, breathe, tilt) {
    ctx.save();
    ctx.translate(0, 20 + breathe);

    const dir = side === 'left' ? -1 : 1;
    const shoulderX = dir * 28;
    const shoulderY = -18;

    // Arm wave animation
    let armAngle = 0.3;
    if (this.handPosition === 1) {
      armAngle = -0.8 + Math.sin(this.frame * 0.08) * 0.2;
    } else if (this.handPosition === 2) {
      armAngle = -1.2;
      if (side === 'right') armAngle = -0.6;
    } else if (this.petting && side === 'right') {
      armAngle = -0.5 + Math.sin(this.frame * 0.15) * 0.1;
    }

    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(dir * armAngle);

    // Upper arm
    ctx.beginPath();
    ctx.ellipse(0, 12, 7, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();

    // Hand
    ctx.beginPath();
    ctx.arc(0, 24, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();

    // Sleeve
    ctx.beginPath();
    ctx.ellipse(0, 4, 9, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.dress;
    ctx.fill();

    ctx.restore();
  }

  drawRibbon(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    // Hair ribbon on top
    ctx.beginPath();
    ctx.moveTo(-5, -40);
    ctx.quadraticCurveTo(-18, -48, -20, -38);
    ctx.quadraticCurveTo(-18, -34, -5, -38);
    ctx.closePath();
    ctx.fillStyle = this.colors.ribbon;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(5, -40);
    ctx.quadraticCurveTo(18, -48, 20, -38);
    ctx.quadraticCurveTo(18, -34, 5, -38);
    ctx.closePath();
    ctx.fillStyle = this.colors.ribbon;
    ctx.fill();

    // Center knot
    ctx.beginPath();
    ctx.ellipse(0, -39, 4, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.ribbonDark;
    ctx.fill();

    ctx.restore();
  }

  drawPetEffect(ctx) {
    ctx.save();

    // Hearts floating up
    const heartCount = 3;
    for (let i = 0; i < heartCount; i++) {
      const phase = (this.frame + i * 20) % 40;
      const progress = phase / 40;
      const x = Math.sin(progress * Math.PI * 2 + i) * 15;
      const y = -80 - progress * 40;
      const size = 4 + progress * 4;
      const alpha = 1 - progress;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FF6B8A';
      this.drawHeart(ctx, x, y, size);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(
      x - size * 0.5, y - size * 0.3,
      x - size, y + size * 0.5,
      x, y + size
    );
    ctx.bezierCurveTo(
      x + size, y + size * 0.5,
      x + size * 0.5, y - size * 0.3,
      x, y + size * 0.3
    );
    ctx.fill();
  }

  setMood(mood) {
    this.mood = mood;
    this.emotionTimer = 80;
    if (mood === 'happy') {
      this.cheekBlush = 0.9;
    }
  }

  setTalking(talking) {
    if (talking) {
      this.setState(PetState.TALKING);
    } else {
      this.setState(PetState.IDLE);
    }
  }

  startPet() {
    this.petting = true;
    this.petCount = 0;
    this.mood = 'happy';
    this.cheekBlush = 0.9;
    this.emotionTimer = 80;
  }

  wave() {
    this.handPosition = 1;
    setTimeout(() => {
      this.handPosition = 0;
    }, 2000);
  }
}
