"use client";

import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { Resizable } from "re-resizable";
import { FaTimes, FaMinus, FaExpand, FaCompress } from "react-icons/fa";

const MW = {
  frame:     "#c8a030",
  frameDark: "#a07820",
  content:   "#060604",
  gold:      "#1e1808",
  goldDim:   "#0e0c04",
  cream:     "#d4c880",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;
const CORNERS_ONLY = { top: false, right: false, bottom: false, left: false, topRight: true, bottomRight: true, bottomLeft: true, topLeft: true };
const iconStyle = { display: "block", width: "55%", height: "55%" };

// ─── Phaser Scene factories ──────────────────────────────────────────────────

function makeBootScene() {
  return class BootScene extends window.Phaser.Scene {
    constructor() { super("Boot"); }
    create() {
      const g = this.make.graphics({ x: 0, y: 0, add: false });

      // Knight (armored)
      g.clear();
      g.fillStyle(0x8899aa); g.fillRect(4, 0, 8, 8);
      g.fillStyle(0x6688aa); g.fillRect(3, 8, 10, 10);
      g.fillStyle(0x8899aa); g.fillRect(1, 10, 3, 8);
      g.fillStyle(0x8899aa); g.fillRect(12, 10, 3, 8);
      g.fillStyle(0x6677aa); g.fillRect(3, 18, 4, 6);
      g.fillStyle(0x6677aa); g.fillRect(9, 18, 4, 6);
      g.fillStyle(0xddcc88); g.fillRect(14, 8, 2, 10);
      g.generateTexture("knight", 16, 24);

      // Knight stripped
      g.clear();
      g.fillStyle(0xffccaa); g.fillRect(4, 0, 8, 8);
      g.fillStyle(0xffffff); g.fillRect(3, 8, 10, 10);
      g.fillStyle(0xffccaa); g.fillRect(1, 10, 3, 8);
      g.fillStyle(0xffccaa); g.fillRect(12, 10, 3, 8);
      g.fillStyle(0xffffff); g.fillRect(3, 18, 4, 6);
      g.fillStyle(0xffffff); g.fillRect(9, 18, 4, 6);
      g.generateTexture("knight_hit", 16, 24);

      // Zombie
      g.clear();
      g.fillStyle(0x559944); g.fillRect(3, 0, 8, 8);
      g.fillStyle(0x447733); g.fillRect(2, 8, 10, 10);
      g.fillStyle(0x559944); g.fillRect(0, 10, 3, 8);
      g.fillStyle(0x559944); g.fillRect(11, 10, 3, 8);
      g.fillStyle(0x447733); g.fillRect(2, 18, 4, 6);
      g.fillStyle(0x447733); g.fillRect(8, 18, 4, 6);
      g.fillStyle(0xff3300); g.fillRect(4, 3, 2, 2);
      g.fillStyle(0xff3300); g.fillRect(8, 3, 2, 2);
      g.generateTexture("zombie", 14, 22);

      // Red Arremer
      g.clear();
      g.fillStyle(0xcc2200); g.fillRect(3, 0, 12, 6);
      g.fillStyle(0xcc2200); g.fillRect(4, 4, 10, 12);
      g.fillStyle(0xff4400); g.fillRect(0, 2, 4, 8);
      g.fillStyle(0xff4400); g.fillRect(14, 2, 4, 8);
      g.fillStyle(0xffff00); g.fillRect(5, 2, 2, 2);
      g.fillStyle(0xffff00); g.fillRect(11, 2, 2, 2);
      g.fillStyle(0xcc2200); g.fillRect(5, 14, 4, 6);
      g.fillStyle(0xcc2200); g.fillRect(9, 14, 4, 6);
      g.generateTexture("arremer", 18, 20);

      // Lance projectile
      g.clear();
      g.fillStyle(0xddcc44); g.fillRect(0, 2, 14, 3);
      g.fillStyle(0xffee88); g.fillRect(12, 0, 4, 7);
      g.generateTexture("lance", 16, 7);

      // Fireball
      g.clear();
      g.fillStyle(0xff6600); g.fillCircle(5, 5, 5);
      g.fillStyle(0xffcc00); g.fillCircle(5, 5, 3);
      g.generateTexture("fireball", 10, 10);

      // Platform tile
      g.clear();
      g.fillStyle(0x8877aa); g.fillRect(0, 0, 32, 16);
      g.fillStyle(0x6655aa); g.fillRect(0, 0, 32, 4);
      g.fillStyle(0xaaaacc); g.fillRect(1, 1, 30, 2);
      g.generateTexture("platform", 32, 16);

      // Ground tile
      g.clear();
      g.fillStyle(0x443355); g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x332244); g.fillRect(0, 0, 32, 4);
      g.fillStyle(0x665577); g.fillRect(1, 1, 30, 2);
      g.generateTexture("ground", 32, 32);

      g.destroy();
      this.scene.start("Game");
    }
  };
}

function makeGameScene() {
  return class GameScene extends window.Phaser.Scene {
    constructor() {
      super("Game");
      this.lives = 3;
      this.score = 0;
      this.armored = true;
      this.isInvincible = false;
      this.canDoubleJump = true;
      this._lastAttack = 0;
      this._spawnTick = 0;
      this._kills = 0;
      this._arremers = [];
      // touch flags
      this.touchLeft = false;
      this.touchRight = false;
      this.touchJump = false;
      this.touchAttack = false;
    }

    create() {
      const W = this.scale.width;
      const H = this.scale.height;

      // Backgrounds
      const bg2 = this.add.graphics();
      bg2.fillStyle(0x1a0a2e); bg2.fillRect(0, 0, W * 3, H * 0.6);
      bg2.fillStyle(0x2a1040); bg2.fillRect(0, H * 0.6, W * 3, H * 0.4);
      bg2.fillStyle(0xeeeebb); bg2.fillCircle(W * 0.8, H * 0.15, 28);
      bg2.fillStyle(0x1a0a2e); bg2.fillCircle(W * 0.8 + 10, H * 0.15 - 5, 22);
      const cx = W * 1.5;
      bg2.fillStyle(0x110822);
      bg2.fillRect(cx, H * 0.3, 120, H * 0.35);
      bg2.fillRect(cx - 10, H * 0.2, 20, H * 0.15);
      bg2.fillRect(cx + 110, H * 0.2, 20, H * 0.15);
      bg2.fillRect(cx + 50, H * 0.15, 20, H * 0.2);
      bg2.setScrollFactor(0.2);

      const bg1 = this.add.graphics();
      [80, 240, 410, 600, 750, 960, 1140, 1360, 1550, 1780, 2000, 2200].forEach((x) => {
        bg1.fillStyle(0x554477);
        bg1.fillRect(x, H - 82, 14, 30);
        bg1.fillRect(x - 4, H - 97, 22, 12);
        bg1.fillRect(x + 4, H - 109, 6, 16);
      });
      bg1.setScrollFactor(0.5);

      // Ground
      this.ground = this.physics.add.staticGroup();
      for (let x = 0; x < W * 3; x += 32) {
        this.ground.create(x + 16, H - 16, "ground").refreshBody();
      }

      // Platforms
      this.platforms = this.physics.add.staticGroup();
      [
        { x: 150,  y: H - 120, w: 4 },
        { x: 350,  y: H - 180, w: 3 },
        { x: 550,  y: H - 130, w: 5 },
        { x: 780,  y: H - 200, w: 4 },
        { x: 980,  y: H - 150, w: 3 },
        { x: 1150, y: H - 210, w: 6 },
        { x: 1400, y: H - 170, w: 4 },
        { x: 1620, y: H - 130, w: 3 },
        { x: 1850, y: H - 190, w: 5 },
        { x: 2100, y: H - 160, w: 4 },
      ].forEach(({ x, y, w }) => {
        for (let i = 0; i < w; i++) this.platforms.create(x + i * 32, y, "platform").refreshBody();
      });

      // Player
      this.player = this.physics.add.sprite(80, H - 80, "knight");
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(12, 22).setOffset(2, 1);
      this.player.setDepth(10);

      // Groups
      this.lances = this.physics.add.group();
      this.enemies = this.physics.add.group();
      this.enemyBullets = this.physics.add.group();

      // Colliders
      this.physics.add.collider(this.player,  this.ground);
      this.physics.add.collider(this.player,  this.platforms);
      this.physics.add.collider(this.enemies, this.ground);
      this.physics.add.collider(this.enemies, this.platforms);
      this.physics.add.overlap(this.lances,       this.enemies,      this._hitEnemy,  null, this);
      this.physics.add.overlap(this.player,        this.enemies,      this._playerHit, null, this);
      this.physics.add.overlap(this.player,        this.enemyBullets, this._playerHit, null, this);

      // World + camera
      this.physics.world.setBounds(0, 0, W * 3, H);
      this.cameras.main.setBounds(0, 0, W * 3, H);
      this.cameras.main.startFollow(this.player, true, 0.1, 1);

      // Input
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd    = this.input.keyboard.addKeys({ up: "W", left: "A", right: "D" });
      this.zKey    = this.input.keyboard.addKey("Z");
      this.xKey    = this.input.keyboard.addKey("X");

      // Initial enemies
      this._spawnZombie(300, H - 60);
      this._spawnZombie(600, H - 60);
      this._spawnZombie(900, H - 60);
      this._spawnArremer(500, H - 200);

      // Expose touch API
      this.game._touch = {
        left:   (v) => { this.touchLeft   = v; },
        right:  (v) => { this.touchRight  = v; },
        jump:   (v) => { this.touchJump   = v; },
        attack: (v) => { this.touchAttack = v; },
      };

      this.scene.launch("UI", { game: this });
    }

    _spawnZombie(x, y) {
      const z = this.enemies.create(x, y, "zombie");
      z.body.setSize(10, 20).setOffset(2, 1);
      z.enemyType = "zombie";
      z.hp = 1;
      z.setVelocityX(-55);
    }

    _spawnArremer(x, y) {
      const a = this.enemies.create(x, y, "arremer");
      a.enemyType = "arremer";
      a.hp = 3;
      a.body.allowGravity = false;
      a._dir = 1;
      a._tick = 0;
      a._shootTick = 0;
      this._arremers.push(a);
    }

    _hitEnemy(lance, enemy) {
      lance.destroy();
      enemy.hp -= 1;
      enemy.setTint(0xff8888);
      this.time.delayedCall(120, () => { if (enemy.active) enemy.clearTint(); });
      if (enemy.hp <= 0) {
        this.score += enemy.enemyType === "arremer" ? 500 : 100;
        this._kills += 1;
        this.scene.get("UI")?.events.emit("score", this.score);
        this._arremers = this._arremers.filter((a) => a !== enemy);
        enemy.destroy();
      }
    }

    _playerHit(player, obj) {
      if (this.isInvincible) return;
      if (obj.texture?.key === "fireball" || obj.enemyType == null) obj.destroy?.();
      this.isInvincible = true;
      if (this.armored) {
        this.armored = false;
        player.setTexture("knight_hit");
        this.tweens.add({ targets: player, alpha: 0, duration: 80, yoyo: true, repeat: 8,
          onComplete: () => { player.setAlpha(1); this.isInvincible = false; } });
      } else {
        this._die();
      }
    }

    _die() {
      this.lives -= 1;
      this.scene.get("UI")?.events.emit("lives", this.lives);
      if (this.lives <= 0) { this.scene.stop("UI"); this.scene.start("GameOver"); return; }
      this.player.setPosition(80, this.scale.height - 80);
      this.player.setVelocity(0, 0);
      this.armored = true;
      this.player.setTexture("knight").setAlpha(1);
      this.cameras.main.pan(80, this.scale.height / 2, 400);
      this.tweens.add({ targets: this.player, alpha: 0, duration: 100, yoyo: true, repeat: 10,
        onComplete: () => { this.player.setAlpha(1); this.isInvincible = false; } });
    }

    update(time) {
      if (!this.player?.active) return;
      const P = this.player;
      const onGround = P.body.blocked.down;
      const K = this.cursors;
      const left   = K.left.isDown   || this.wasd.left.isDown  || this.touchLeft;
      const right  = K.right.isDown  || this.wasd.right.isDown || this.touchRight;
      const jump   = window.Phaser.Input.Keyboard.JustDown(K.up)    ||
                     window.Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
                     window.Phaser.Input.Keyboard.JustDown(this.xKey) ||
                     this.touchJump;
      const attack = window.Phaser.Input.Keyboard.JustDown(this.zKey) || this.touchAttack;

      if (onGround) this.canDoubleJump = true;

      if (left)       { P.setVelocityX(-160); P.setFlipX(true);  }
      else if (right) { P.setVelocityX(160);  P.setFlipX(false); }
      else            { P.setVelocityX(0); }

      if (jump) {
        if (onGround)                { P.setVelocityY(-480); }
        else if (this.canDoubleJump) { P.setVelocityY(-400); this.canDoubleJump = false; }
      }

      if (attack && time - this._lastAttack > 350) {
        this._lastAttack = time;
        const dir = P.flipX ? -1 : 1;
        const l = this.lances.create(P.x + dir * 10, P.y - 4, "lance");
        l.setVelocityX(dir * 420);
        l.setFlipX(P.flipX);
        l.body.allowGravity = false;
        this.time.delayedCall(1200, () => { if (l.active) l.destroy(); });
      }

      // Enemy AI
      this.enemies.getChildren().forEach((e) => {
        if (!e.active) return;
        const dx = P.x - e.x;
        const dy = P.y - e.y;

        if (e.enemyType === "zombie") {
          e.setVelocityX(dx > 0 ? 55 : -55);
          e.setFlipX(dx < 0);
        }

        if (e.enemyType === "arremer") {
          e._tick += 1;
          e._shootTick += 1;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (e._shootTick > 100 && dist < 450) {
            e._shootTick = 0;
            const fb = this.enemyBullets.create(e.x, e.y, "fireball");
            fb.body.allowGravity = false;
            const spd = 170;
            fb.setVelocity((dx / dist) * spd, (dy / dist) * spd);
            this.time.delayedCall(2500, () => { if (fb.active) fb.destroy(); });
          }

          if (dist < 200 && e._tick > 60) {
            e._tick = 0;
            e.setVelocity((dx / dist) * 140, (dy / dist) * 140);
          } else if (e._tick > 130) {
            e._tick = 0;
            e._dir *= -1;
          } else if (dist >= 200) {
            e.setVelocityX(e._dir * 70);
            e.setVelocityY(Math.sin(time * 0.003) * 55);
          }
        }
      });

      // Periodic spawn — threshold shrinks as kills accumulate (harder over time)
      this._spawnTick += 1;
      const spawnThreshold = Math.max(60, 320 - this._kills * 12);
      if (this._spawnTick > spawnThreshold) {
        this._spawnTick = 0;
        const wx = this.physics.world.bounds.width;
        const sx = Phaser.Math.Clamp(P.x + (Math.random() > 0.5 ? 550 : -550), 50, wx - 50);
        this._spawnZombie(sx, this.scale.height - 60);
        // Occasionally spawn an arremer once the player has proven themselves
        if (this._kills >= 5 && this._arremers.length < 3 && Math.random() < 0.25) {
          const ax = Phaser.Math.Clamp(P.x + (Math.random() > 0.5 ? 500 : -500), 50, wx - 50);
          this._spawnArremer(ax, this.scale.height - 200);
        }
      }

      // Cull off-screen lances
      this.lances.getChildren().forEach((l) => {
        if (l.x < 0 || l.x > this.physics.world.bounds.width) l.destroy();
      });
    }
  };
}

function makeUIScene() {
  return class UIScene extends window.Phaser.Scene {
    constructor() { super("UI"); }
    init(data) { this._gs = data.game; }
    create() {
      this.scoreText = this.add.text(12, 6, "SCORE  0", {
        fontFamily: "monospace", fontSize: "13px", color: "#d4c880",
        stroke: "#000", strokeThickness: 3,
      });
      this.livesText = this.add.text(this.scale.width - 12, 6,
        this._gs ? "♥ ".repeat(this._gs.lives).trim() : "♥ ♥ ♥", {
          fontFamily: "monospace", fontSize: "13px", color: "#ff6666",
          stroke: "#000", strokeThickness: 3,
        }).setOrigin(1, 0);
      this.events.on("score", (s) => this.scoreText.setText(`SCORE  ${s}`));
      this.events.on("lives", (l) => this.livesText.setText("♥ ".repeat(Math.max(0, l)).trim() || "☠"));
    }
  };
}

function makeGameOverScene() {
  return class GameOverScene extends window.Phaser.Scene {
    constructor() { super("GameOver"); }
    create() {
      const W = this.scale.width, H = this.scale.height;
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);
      this.add.text(W / 2, H / 2 - 44, "GAME OVER", {
        fontFamily: "monospace", fontSize: "34px", color: "#ff4444",
        stroke: "#000", strokeThickness: 4,
      }).setOrigin(0.5);
      const btn = this.add.text(W / 2, H / 2 + 28, "[ PLAY AGAIN ]", {
        fontFamily: "monospace", fontSize: "18px", color: "#d4c880",
        stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on("pointerover",  () => btn.setStyle({ color: "#ffffff" }));
      btn.on("pointerout",   () => btn.setStyle({ color: "#d4c880" }));
      btn.on("pointerdown",  () => {
        this.scene.start("Game");
        this.scene.launch("UI", { game: this.scene.get("Game") });
      });
    }
  };
}

// ─── React component ──────────────────────────────────────────────────────────

export default function GhoulsGameModal({ folder, onClose, onMinimizeFolder, isMinimized }) {
  const isMobileDefault = typeof window !== "undefined" && window.innerWidth < 768;
  const [isFS, setFS] = useState(isMobileDefault);
  const [size, setSize] = useState(() => ({
    width:  typeof window !== "undefined" ? Math.min(820, window.innerWidth  - 32) : 820,
    height: typeof window !== "undefined" ? Math.min(520, window.innerHeight - 100) : 520,
  }));
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [showResume, setShowResume] = useState(false);
  const CANVAS_ID      = useRef(`ghoulsgame-${Math.random().toString(36).slice(2)}`).current;
  const dragRef        = useRef(null);
  const isResizingRef  = useRef(false);
  const gameRef        = useRef(null);
  const wasPausedRef   = useRef(false);

  useEffect(() => {
    if (gameRef.current || typeof window === "undefined") return;
    // Small delay so the DOM node with CANVAS_ID is guaranteed to be mounted
    const t = setTimeout(() => {
      const el = document.getElementById(CANVAS_ID);
      if (!el || gameRef.current) return;
      import("phaser").then((mod) => {
        window.Phaser = mod.default ?? mod;
        const P = window.Phaser;
        gameRef.current = new P.Game({
          type:   P.AUTO,
          width:  el.clientWidth  || 800,
          height: el.clientHeight || 450,
          parent: el,
          scale: {
            mode:       P.Scale?.FIT ?? 2,
            autoCenter: P.Scale?.CENTER_BOTH ?? 1,
          },
          backgroundColor: "#1a0a2e",
          physics: { default: "arcade", arcade: { gravity: { y: 600 }, debug: false } },
          scene: [makeBootScene(), makeGameScene(), makeUIScene(), makeGameOverScene()],
          render: { pixelArt: true },
        });
      });
    }, 100);
    return () => {
      clearTimeout(t);
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
    };
  }, []);

  // Refresh Phaser scale after fullscreen toggle so it fills the new container
  useEffect(() => {
    if (!gameRef.current) return;
    const t = setTimeout(() => gameRef.current?.scale?.refresh(), 60);
    return () => clearTimeout(t);
  }, [isFS]);

  // Clamp windowed size if browser window shrinks, then refresh Phaser scale
  useEffect(() => {
    const onResize = () => {
      setSize((s) => ({
        width:  Math.min(s.width,  window.innerWidth  - 32),
        height: Math.min(s.height, window.innerHeight - 100),
      }));
      setTimeout(() => gameRef.current?.scale?.refresh(), 150);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Pause Phaser scenes when minimized; show tap-to-resume overlay when restored
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    if (isMinimized) {
      try {
        if (g.scene.isActive("Game")) g.scene.pause("Game");
        if (g.scene.isActive("UI"))   g.scene.pause("UI");
        wasPausedRef.current = true;
      } catch (_) {}
    } else if (wasPausedRef.current) {
      setShowResume(true);
      setTimeout(() => g.scale?.refresh(), 60);
    }
  }, [isMinimized]);

  const resumeGame = () => {
    const g = gameRef.current;
    if (!g) return;
    try {
      if (g.scene.isPaused("Game")) g.scene.resume("Game");
      if (g.scene.isPaused("UI"))   g.scene.resume("UI");
    } catch (_) {}
    wasPausedRef.current = false;
    setShowResume(false);
    setTimeout(() => g.scale?.refresh(), 30);
  };

  const touch = () => gameRef.current?._touch;

  const TBtn = ({ onDown, onUp, label }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); onDown(); }}
      onPointerUp={(e)   => { e.preventDefault(); onUp();   }}
      onPointerLeave={(e)=> { e.preventDefault(); onUp();   }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: 52, height: 52,
        backgroundColor: "rgba(212,200,128,0.15)",
        border: "1px solid rgba(212,200,128,0.4)",
        color: "#d4c880", fontFamily: "monospace", fontSize: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        touchAction: "none",
      }}
    >{label}</button>
  );

  const titleBar = (
    <div
      className="title-bar relative flex items-center justify-center flex-shrink-0 h-8 px-3 cursor-move"
      style={{ backgroundColor: MW.frameDark, backgroundImage: stoneNoise, borderBottom: `1px solid ${MW.gold}` }}
    >
      <div className="absolute left-3 flex items-center space-x-1.5">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
          onClick={onClose}
          className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}
        >
          <FaTimes style={{ ...iconStyle, color: MW.content }} />
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onMinimizeFolder(folder); }}
          onClick={() => onMinimizeFolder(folder)}
          className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}
        >
          <FaMinus style={{ ...iconStyle, color: MW.content }} />
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setFS((f) => !f); }}
          onClick={(e) => { e.stopPropagation(); setFS((f) => !f); }}
          className="w-5 h-5 md:w-3 md:h-3 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: MW.frame, border: `1px solid ${MW.gold}` }}
        >
          {isFS ? <FaCompress style={{ ...iconStyle, color: MW.content }} /> : <FaExpand style={{ ...iconStyle, color: MW.content }} />}
        </button>
      </div>
      <span
        className="text-xs font-serif tracking-widest uppercase select-none truncate"
        style={{ color: MW.cream, backgroundColor: MW.content, padding: "1px 8px" }}
      >
        {folder?.title ?? "Ghouls & Ghosts"}
      </span>
    </div>
  );

  // The canvas container is always rendered so the Phaser DOM node is stable.
  // We use CSS to show it in either windowed or fullscreen layout.
  const noSelect = {
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none",
    WebkitTapHighlightColor: "transparent",
  };

  const canvasArea = (
    <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0, ...noSelect }}>
      <div id={CANVAS_ID} className="w-full h-full" style={{ backgroundColor: "#1a0a2e", ...noSelect }} />
      {/* Touch controls */}
      <div className="absolute bottom-4 inset-x-0 flex justify-between px-4 pointer-events-none" style={{ zIndex: 20, ...noSelect }}>
        <div className="flex gap-1 pointer-events-auto">
          <TBtn label="◀" onDown={() => touch()?.left(true)}  onUp={() => touch()?.left(false)} />
          <TBtn label="▶" onDown={() => touch()?.right(true)} onUp={() => touch()?.right(false)} />
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <TBtn label="⚔" onDown={() => { touch()?.attack(true); setTimeout(() => touch()?.attack(false), 80); }} onUp={() => {}} />
          <TBtn label="↑" onDown={() => { touch()?.jump(true);   setTimeout(() => touch()?.jump(false),   80); }} onUp={() => {}} />
        </div>
      </div>
      {showResume && (
        <div
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); resumeGame(); }}
          onClick={(e) => { e.stopPropagation(); resumeGame(); }}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 30,
            cursor: "pointer",
            ...noSelect,
          }}
        >
          <div
            className="font-mono tracking-widest"
            style={{
              color: MW.cream,
              fontSize: 18,
              padding: "14px 26px",
              border: `1px solid ${MW.frame}`,
              backgroundColor: "rgba(6,6,4,0.8)",
              textAlign: "center",
            }}
          >
            PAUSED
            <div style={{ fontSize: 12, marginTop: 8, color: "#d4c880" }}>TAP TO RESUME</div>
          </div>
        </div>
      )}
    </div>
  );

  const windowContent = (full) => (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full h-full flex flex-col"
      style={{
        padding: full ? 0 : "5px",
        backgroundColor: MW.frame,
        backgroundImage: stoneNoise,
        border: full ? "none" : `1px solid ${MW.gold}`,
        boxShadow: full ? "none" : `0 0 0 1px ${MW.goldDim}, 0 24px 72px rgba(0,0,0,0.95)`,
      }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{ flex: 1, minHeight: 0, backgroundColor: MW.content, border: full ? "none" : `1px solid ${MW.gold}` }}
      >
        {titleBar}
        {canvasArea}
      </div>
    </div>
  );

  // Always render a single DOM tree so containerRef stays stable across fullscreen toggle.
  // Fullscreen is achieved by CSS on the outer wrapper.
  return (
    <div
      onClick={() => { if (!isResizingRef.current) onMinimizeFolder(folder); }}
      className={
        isFS
          ? "fixed inset-0 flex items-center justify-center z-[60]"
          : "absolute inset-0 flex items-center justify-center z-30"
      }
    >
      <Draggable
        handle=".title-bar"
        bounds="parent"
        nodeRef={dragRef}
        disabled={isFS}
        position={isFS ? { x: 0, y: 0 } : dragPos}
        onStop={(_e, data) => { if (!isFS) setDragPos({ x: data.x, y: data.y }); }}
      >
        <div
          ref={dragRef}
          onClick={(e) => e.stopPropagation()}
          style={isFS
            ? { position: "absolute", inset: 0 }
            : { display: "inline-block" }
          }
        >
          {isFS ? (
            windowContent(true)
          ) : (
            <Resizable
              size={size}
              onResizeStart={() => { isResizingRef.current = true; }}
              onResizeStop={(e, dir, ref) => {
                setSize({ width: ref.offsetWidth, height: ref.offsetHeight });
                setTimeout(() => {
                  gameRef.current?.scale?.refresh();
                  isResizingRef.current = false;
                }, 100);
              }}
              minWidth={480} minHeight={320}
              maxWidth="calc(100vw - 2rem)" maxHeight="90vh"
              enable={CORNERS_ONLY}
            >
              {windowContent(false)}
            </Resizable>
          )}
        </div>
      </Draggable>
    </div>
  );
}
