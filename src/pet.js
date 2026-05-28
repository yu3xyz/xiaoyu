// === 小雨 Nekomimi - Cat Girl Pet Drawing & Animation Engine ===

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
    this.mood = 'neutral';
    this.emotionTimer = 0;
    this.cheekBlush = 0;
    this.petting = false;
    this.petCount = 0;
    this.tailWag = 0;
    this.tailSway = 0;

    // Cat-girl colors — warm calico/ginger theme
    this.colors = {
      skin: '#FDE8E0',
      skinShadow: '#F5D5C8',
      hair: '#E8905A',
      hairLight: '#F0A870',
      hairDark: '#D07840',
      earInner: '#FFB0B8',
      eye: '#E8A030',
      eyeLight: '#F0C060',
      eyeShine: '#FFFFFF',
      dress: '#FFF5EE',
      dressDark: '#F0E0D0',
      dressLight: '#FFFFFF',
      blush: 'rgba(255, 150, 150, 0.35)',
      mouth: '#E07080',
      collar: '#FF6B8A',
      bell: '#FFD700',
      bellShine: '#FFF0A0',
      paw: '#FDE8E0',
      pawPad: '#FFB0B8',
      tail: '#E8905A',
      tailLight: '#F0A870',
      sock: '#FFFFFF',
      shoe: '#E8A030',
      shoeShine: '#FFFFFF',
      whisker: 'rgba(160, 140, 130, 0.4)'
    };

    // Idle animation sequence
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
    this.earTwitch = 0;

    this.init();
  }

  init() {
    this.drawLoop();
  }

  setState(newState) {
    if (this.state === newState) return;
    this.state = newState;
    this.stateTimer = 0;
    if (newState === PetState.TALKING) this.talkFrame = 0;
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

    // Blink
    if (!this.isBlinking) {
      this.blinkTimer++;
      if (this.blinkTimer > 120 + Math.random() * 80) {
        this.isBlinking = true;
        this.blinkDuration = 6;
        this.blinkTimer = 0;
      }
    } else {
      this.blinkDuration--;
      if (this.blinkDuration <= 0) this.isBlinking = false;
    }

    // Mood timer
    if (this.emotionTimer > 0) this.emotionTimer--;
    else this.mood = 'neutral';

    this.cheekBlush *= 0.95;

    // Eye movement smoothing
    this.eyeDirection.x += (this.targetEyeDir.x - this.eyeDirection.x) * 0.05;
    this.eyeDirection.y += (this.targetEyeDir.y - this.eyeDirection.y) * 0.05;

    // Tail animation
    this.tailWag *= 0.92;
    if (this.mood === 'happy' || this.petting) {
      this.tailWag = Math.max(this.tailWag, 0.6);
    }
    this.tailSway = Math.sin(this.frame * 0.04) * 0.3;

    // Ear twitch (random)
    this.earTwitch = Math.sin(this.frame * 0.1) * (Math.random() > 0.98 ? 0.15 : 0.02);

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

    // Idle sequence
    if (this.state === PetState.IDLE || this.state === PetState.THINKING) {
      this.sequenceTimer++;
      const currentSeq = this.idleSequence[this.sequenceIndex];
      if (this.sequenceTimer > currentSeq.duration) {
        this.sequenceTimer = 0;
        this.sequenceIndex = (this.sequenceIndex + 1) % this.idleSequence.length;
      }
      switch (currentSeq.type) {
        case 'look_left':
          this.targetEyeDir.x = -0.4; this.targetEyeDir.y = 0;
          this.handPosition = 0; this.bodyTilt *= 0.9;
          break;
        case 'look_right':
          this.targetEyeDir.x = 0.4; this.targetEyeDir.y = 0;
          this.handPosition = 0; this.bodyTilt *= 0.9;
          break;
        case 'look_center':
          this.targetEyeDir.x *= 0.9; this.targetEyeDir.y *= 0.9;
          this.handPosition = 0; this.bodyTilt *= 0.9;
          break;
        case 'tilt':
          this.targetEyeDir.x = 0; this.targetEyeDir.y = 0;
          this.bodyTilt = 0.05; this.handPosition = 0;
          break;
        case 'think':
          this.targetEyeDir.x = 0.2; this.targetEyeDir.y = -0.3;
          this.handPosition = 2;
          break;
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2 + 20);

    const breathe = this.breathOffset;
    const tilt = this.bodyTilt;

    // === DRAW ORDER: back to front ===
    this.drawTail(ctx, breathe);
    this.drawHairBack(ctx, breathe);
    this.drawBody(ctx, breathe);
    this.drawArm(ctx, 'left', breathe, tilt);
    this.drawHead(ctx, breathe, tilt);
    this.drawCatEars(ctx, breathe, tilt);
    this.drawFace(ctx, breathe, tilt);
    this.drawWhiskers(ctx, breathe, tilt);
    this.drawHairFront(ctx, breathe, tilt);
    this.drawArm(ctx, 'right', breathe, tilt);
    if (this.petting) this.drawPetEffect(ctx);

    ctx.restore();
  }

  // ==================== CAT EARS ====================

  drawCatEars(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    const twitch = this.earTwitch;

    // Left ear
    ctx.beginPath();
    ctx.moveTo(-26 + twitch * 5, -38);
    ctx.lineTo(-34 + twitch * 5, -56);
    ctx.lineTo(-14 + twitch * 5, -42);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 120, 60, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left inner ear
    ctx.beginPath();
    ctx.moveTo(-24 + twitch * 5, -40);
    ctx.lineTo(-30 + twitch * 5, -52);
    ctx.lineTo(-18 + twitch * 5, -43);
    ctx.closePath();
    ctx.fillStyle = this.colors.earInner;
    ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.moveTo(26 - twitch * 5, -38);
    ctx.lineTo(34 - twitch * 5, -56);
    ctx.lineTo(14 - twitch * 5, -42);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 120, 60, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right inner ear
    ctx.beginPath();
    ctx.moveTo(24 - twitch * 5, -40);
    ctx.lineTo(30 - twitch * 5, -52);
    ctx.lineTo(18 - twitch * 5, -43);
    ctx.closePath();
    ctx.fillStyle = this.colors.earInner;
    ctx.fill();

    ctx.restore();
  }

  // ==================== TAIL ====================

  drawTail(ctx, breathe) {
    ctx.save();
    ctx.translate(0, 20 + breathe);

    const wag = this.tailWag;
    const sway = this.tailSway;
    const wagOffset = Math.sin(this.frame * 0.15) * wag * 20;

    // Tail base position (behind the body, lower right)
    const baseX = 20;
    const baseY = 35;

    // Draw tail curving out from behind
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);

    // Tail curve control points, affected by wag
    const cp1x = baseX + 15 + wagOffset + sway * 10;
    const cp1y = baseY - 5;
    const cp2x = baseX + 25 + wagOffset * 1.3 + sway * 15;
    const cp2y = baseY - 20;
    const endX = baseX + 20 + wagOffset * 1.5 + sway * 20;
    const endY = baseY - 30;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.strokeStyle = this.colors.tail;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tail lighter underside
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.strokeStyle = this.colors.tailLight;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Tail tip (white/fluffy)
    ctx.beginPath();
    ctx.arc(endX, endY - 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.sock;
    ctx.fill();

    ctx.restore();
  }

  // ==================== HEAD ====================

  drawHead(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    // Head shape (slightly rounder for cat-girl)
    ctx.beginPath();
    ctx.ellipse(0, 2, 38, 42, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 160, 150, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // ==================== HAIR ====================

  drawHairBack(ctx, breathe) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3);

    // Back hair
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

    // Bangs back layer
    ctx.beginPath();
    ctx.moveTo(-30, -32);
    ctx.quadraticCurveTo(-20, -44, -8, -39);
    ctx.quadraticCurveTo(0, -44, 8, -39);
    ctx.quadraticCurveTo(20, -44, 30, -32);
    ctx.quadraticCurveTo(25, -22, 15, -28);
    ctx.quadraticCurveTo(0, -34, -15, -28);
    ctx.quadraticCurveTo(-25, -22, -30, -32);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    ctx.restore();
  }

  drawHairFront(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    // Side hair
    ctx.beginPath();
    ctx.moveTo(-32, -24);
    ctx.quadraticCurveTo(-40, -5, -36, 22);
    ctx.quadraticCurveTo(-34, 32, -28, 30);
    ctx.quadraticCurveTo(-30, 12, -26, -12);
    ctx.quadraticCurveTo(-24, -22, -32, -24);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(32, -24);
    ctx.quadraticCurveTo(40, -5, 36, 22);
    ctx.quadraticCurveTo(34, 32, 28, 30);
    ctx.quadraticCurveTo(30, 12, 26, -12);
    ctx.quadraticCurveTo(24, -22, 32, -24);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    // Bangs front layer — cat-girl style with V-cut in middle
    ctx.beginPath();
    ctx.moveTo(-32, -34);
    ctx.quadraticCurveTo(-26, -44, -16, -38);
    ctx.quadraticCurveTo(-10, -42, -4, -36);
    ctx.quadraticCurveTo(0, -44, 4, -36);
    ctx.quadraticCurveTo(10, -42, 16, -38);
    ctx.quadraticCurveTo(26, -44, 32, -34);
    ctx.quadraticCurveTo(28, -28, 20, -30);
    ctx.quadraticCurveTo(12, -26, 6, -32);
    ctx.quadraticCurveTo(0, -28, -6, -32);
    ctx.quadraticCurveTo(-12, -26, -20, -30);
    ctx.quadraticCurveTo(-28, -28, -32, -34);
    ctx.closePath();
    ctx.fillStyle = this.colors.hair;
    ctx.fill();

    // Hair highlights
    ctx.beginPath();
    ctx.moveTo(-14, -38);
    ctx.quadraticCurveTo(-8, -42, 0, -37);
    ctx.quadraticCurveTo(8, -42, 14, -38);
    ctx.quadraticCurveTo(8, -34, 0, -36);
    ctx.quadraticCurveTo(-8, -34, -14, -38);
    ctx.closePath();
    ctx.fillStyle = this.colors.hairLight;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Streaks/different colored hair tufts (calico)
    ctx.beginPath();
    ctx.moveTo(-28, -30);
    ctx.quadraticCurveTo(-22, -36, -18, -32);
    ctx.quadraticCurveTo(-22, -28, -28, -30);
    ctx.closePath();
    ctx.fillStyle = this.colors.hairDark;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(22, -32);
    ctx.quadraticCurveTo(26, -38, 30, -32);
    ctx.quadraticCurveTo(26, -28, 22, -32);
    ctx.closePath();
    ctx.fillStyle = this.colors.hairDark;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // ==================== FACE ====================

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
      // Closed eyes
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-eyeSpacing - eyeW + 2, eyeY);
      ctx.quadraticCurveTo(-eyeSpacing, eyeY - 2, -eyeSpacing + eyeW - 2, eyeY);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eyeSpacing - eyeW + 2, eyeY);
      ctx.quadraticCurveTo(eyeSpacing, eyeY - 2, eyeSpacing + eyeW - 2, eyeY);
      ctx.stroke();
    } else if (this.mood === 'happy' && this.emotionTimer > 30) {
      // Happy crescent eyes
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(-eyeSpacing, eyeY, eyeW * 0.7, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(eyeSpacing, eyeY, eyeW * 0.7, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    } else {
      // Cat-style eyes (slightly almond-shaped)
      const leftEyeX = -eyeSpacing;
      const rightEyeX = eyeSpacing;

      // Eye whites
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, eyeW, eyeH, -0.05, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX, eyeY, eyeW, eyeH, 0.05, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Iris (slightly larger, cat-like)
      const irisR = 7.5;
      const irisOffsetX = lookX * 3;
      const irisOffsetY = lookY * 2;

      ctx.beginPath();
      ctx.ellipse(leftEyeX + irisOffsetX, eyeY + irisOffsetY, irisR, irisR * 1.1, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eye;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + irisOffsetX, eyeY + irisOffsetY, irisR, irisR * 1.1, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eye;
      ctx.fill();

      // Inner iris glow
      ctx.beginPath();
      ctx.ellipse(leftEyeX + irisOffsetX + 1, eyeY + irisOffsetY, 4, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeLight;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + irisOffsetX + 1, eyeY + irisOffsetY, 4, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeLight;
      ctx.fill();

      // Cat-like pupil (vertical slit hint — just a dark vertical ellipse)
      ctx.beginPath();
      ctx.ellipse(leftEyeX + irisOffsetX, eyeY + irisOffsetY, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A2E';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + irisOffsetX, eyeY + irisOffsetY, 2.5, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1A1A2E';
      ctx.fill();

      // Eye shine (big highlight)
      ctx.beginPath();
      ctx.arc(leftEyeX + irisOffsetX + 3.5, eyeY + irisOffsetY - 3, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeShine;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + irisOffsetX + 3.5, eyeY + irisOffsetY - 3, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.eyeShine;
      ctx.fill();

      // Small secondary shine
      ctx.beginPath();
      ctx.arc(leftEyeX + irisOffsetX - 2.5, eyeY + irisOffsetY + 2.5, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + irisOffsetX - 2.5, eyeY + irisOffsetY + 2.5, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      // Upper eyelid
      ctx.beginPath();
      ctx.moveTo(leftEyeX - eyeW, eyeY - 5);
      ctx.quadraticCurveTo(leftEyeX, eyeY - 9, leftEyeX + eyeW, eyeY - 5);
      ctx.strokeStyle = this.colors.hair;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightEyeX - eyeW, eyeY - 5);
      ctx.quadraticCurveTo(rightEyeX, eyeY - 9, rightEyeX + eyeW, eyeY - 5);
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

      // Lower eyelash (subtle cat-eye)
      ctx.beginPath();
      ctx.moveTo(leftEyeX - eyeW + 2, eyeY + 6);
      ctx.quadraticCurveTo(leftEyeX, eyeY + 9, leftEyeX + eyeW - 2, eyeY + 6);
      ctx.strokeStyle = 'rgba(200, 160, 150, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightEyeX - eyeW + 2, eyeY + 6);
      ctx.quadraticCurveTo(rightEyeX, eyeY + 9, rightEyeX + eyeW - 2, eyeY + 6);
      ctx.strokeStyle = 'rgba(200, 160, 150, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
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
      const openAmount = 3 + Math.sin(this.frame * 0.4) * 2;
      ctx.beginPath();
      ctx.ellipse(0, mouthY + 2, 5, openAmount, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.mouth;
      ctx.fill();
      if (openAmount > 3) {
        ctx.beginPath();
        ctx.ellipse(0, mouthY + 2 + openAmount * 0.4, 3, 2.5, 0, 0, Math.PI);
        ctx.fillStyle = '#FF8A9E';
        ctx.fill();
      }
    } else if (this.mood === 'happy') {
      ctx.beginPath();
      ctx.arc(0, mouthY, 6, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = this.colors.mouth;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (this.mood === 'surprised') {
      ctx.beginPath();
      ctx.ellipse(0, mouthY, 3, 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.mouth;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, mouthY, 4, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = this.colors.mouth;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==================== WHISKERS ====================

  drawWhiskers(ctx, breathe, tilt) {
    ctx.save();
    ctx.translate(0, -50 + breathe * 0.3 + tilt * 10);

    const baseY = 4;
    const color = this.colors.whisker;

    // Left whiskers
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-22, baseY + i * 4);
      ctx.lineTo(-42, baseY + i * 5 - 3);
      ctx.stroke();
    }

    // Right whiskers
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(22, baseY + i * 4);
      ctx.lineTo(42, baseY + i * 5 - 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==================== BODY ====================

  drawBody(ctx, breathe) {
    ctx.save();
    ctx.translate(0, 20 + breathe);

    // Neck
    ctx.beginPath();
    ctx.ellipse(0, -32, 10, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.skin;
    ctx.fill();

    // Torso - dress (cream/white cat-girl dress)
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
    ctx.strokeStyle = 'rgba(200, 180, 170, 0.3)';
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
    ctx.strokeStyle = 'rgba(200, 180, 170, 0.3)';
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

    // === CAT COLLAR ===
    ctx.beginPath();
    ctx.moveTo(-12, -30);
    ctx.quadraticCurveTo(-8, -26, -4, -30);
    ctx.lineTo(4, -30);
    ctx.quadraticCurveTo(8, -26, 12, -30);
    ctx.quadraticCurveTo(8, -24, 4, -28);
    ctx.lineTo(-4, -28);
    ctx.quadraticCurveTo(-8, -24, -12, -30);
    ctx.closePath();
    ctx.fillStyle = this.colors.collar;
    ctx.fill();

    // Collar tag / bell
    ctx.beginPath();
    ctx.arc(0, -22, 5, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.bell;
    ctx.fill();
    ctx.strokeStyle = '#D4A000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bell highlight
    ctx.beginPath();
    ctx.arc(-1.5, -24, 2, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.bellShine;
    ctx.fill();

    // Bell slit
    ctx.beginPath();
    ctx.ellipse(0, -21, 1.5, 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#B8860B';
    ctx.fill();

    // Bell ringer
    ctx.beginPath();
    ctx.arc(0, -19.5, 1.3, 0, Math.PI * 2);
    ctx.fillStyle = '#D4A000';
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
    ctx.strokeStyle = this.colors.dressDark;
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
    ctx.moveTo(-14, 46); ctx.lineTo(-14, 50);
    ctx.lineTo(-4, 50); ctx.lineTo(-4, 46);
    ctx.closePath();
    ctx.fillStyle = this.colors.sock;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 46); ctx.lineTo(4, 50);
    ctx.lineTo(14, 50); ctx.lineTo(14, 46);
    ctx.closePath();
    ctx.fillStyle = this.colors.sock;
    ctx.fill();

    ctx.restore();
  }

  // ==================== ARMS & PAWS ====================

  drawArm(ctx, side, breathe, tilt) {
    ctx.save();
    ctx.translate(0, 20 + breathe);

    const dir = side === 'left' ? -1 : 1;
    const shoulderX = dir * 28;
    const shoulderY = -18;

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

    // Sleeve
    ctx.beginPath();
    ctx.ellipse(0, 4, 9, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.dress;
    ctx.fill();

    // Paw hand (rounder, cat-like)
    ctx.beginPath();
    ctx.arc(0, 24, 7, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.paw;
    ctx.fill();

    // Paw pads
    ctx.beginPath();
    ctx.ellipse(0, 26, 3, 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.colors.pawPad;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Toe beans
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 3.5, 22, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.pawPad;
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  // ==================== PET EFFECT ====================

  drawPetEffect(ctx) {
    ctx.save();

    // Paws and hearts when petted
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

  // ==================== PUBLIC API ====================

  setMood(mood) {
    this.mood = mood;
    this.emotionTimer = 80;
    if (mood === 'happy') this.cheekBlush = 0.9;
  }

  setTalking(talking) {
    this.setState(talking ? PetState.TALKING : PetState.IDLE);
  }

  startPet() {
    this.petting = true;
    this.petCount = 0;
    this.mood = 'happy';
    this.cheekBlush = 0.9;
    this.emotionTimer = 80;
    this.tailWag = 1;
  }

  wave() {
    this.handPosition = 1;
    setTimeout(() => { this.handPosition = 0; }, 2000);
  }
}
