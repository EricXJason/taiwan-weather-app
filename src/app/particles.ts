export class ParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    type: 'circle' | 'cross' | 'square';
  }> = [];
  private animationFrameId: number | null = null;
  private mouse = { x: null as number | null, y: null as number | null, radius: 150 };
  private resizeListener: () => void;
  private mouseMoveListener: (e: MouseEvent) => void;
  private mouseLeaveListener: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.resizeListener = () => this.resize();
    this.mouseMoveListener = (e: MouseEvent) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
    this.mouseLeaveListener = () => {
      this.mouse.x = null;
      this.mouse.y = null;
    };

    window.addEventListener('resize', this.resizeListener);
    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseleave', this.mouseLeaveListener);

    this.resize();
    this.animate();
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.initParticles(rect.width, rect.height);
  }

  private initParticles(width: number, height: number) {
    const count = 50;
    this.particles = [];
    const types: ('circle' | 'cross' | 'square')[] = ['circle', 'cross', 'square'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1.2,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
  }

  private animate() {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    this.ctx.clearRect(0, 0, width, height);

    const gridSize = 55;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let x = (width % gridSize) / 2; x < width; x += gridSize) {
      for (let y = (height % gridSize) / 2; y < height; y += gridSize) {
        this.ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
      }
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      if (p.type === 'circle') {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'cross') {
        const size = p.radius * 1.6;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x - size, p.y);
        this.ctx.lineTo(p.x + size, p.y);
        this.ctx.moveTo(p.x, p.y - size);
        this.ctx.lineTo(p.x, p.y + size);
        this.ctx.stroke();
      } else if (p.type === 'square') {
        const size = p.radius * 1.6;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        this.ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }
    }

    const maxLineDistance = 120;
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxLineDistance) {
          const alpha = (1 - dist / maxLineDistance) * 0.12;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }

      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = p1.x - this.mouse.x;
        const dy = p1.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.mouse.radius) {
          const alpha = (1 - dist / this.mouse.radius) * 0.22;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.stroke();

          p1.x -= dx * 0.008;
          p1.y -= dy * 0.008;
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  public destroy() {
    window.removeEventListener('resize', this.resizeListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);
    window.removeEventListener('mouseleave', this.mouseLeaveListener);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
