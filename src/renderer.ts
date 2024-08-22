import { CANVAS_COLORS, PLAYFIELD_WIDTH } from "./constants.js";
import { Tetromino } from "./tetromino.js";
import { Matrix, TileMatrix } from "./tiles.js";
import { Maybe, Vec2 } from "./types.js";

type Drawable = Matrix;
export class Renderer {

    tileSize: number;
    fieldCtx: CanvasRenderingContext2D;
    fieldPixels: Vec2;
    nextCtx: CanvasRenderingContext2D;
    nextPixels: Vec2;
    levelDisplay: HTMLElement;
    scoreDisplay: HTMLElement;

    constructor(args: {
        fieldCanvas: HTMLCanvasElement;
        nextCanvas: HTMLCanvasElement;
        width?: number;
        height?: number;
    }) {
        const fCtx = args.fieldCanvas.getContext("2d");
        const nCtx = args.nextCanvas.getContext("2d");
        this.fieldPixels = [args.fieldCanvas.width, args.fieldCanvas.height];
        this.nextPixels = [args.nextCanvas.width, args.nextCanvas.height];
        if (!fCtx || !nCtx) {
            throw Error("Unable to get canvas context!");
        }

        this.fieldCtx = fCtx;
        this.nextCtx = nCtx;
        this.tileSize = Math.floor(this.fieldPixels[0] / (args.width ? args.width : PLAYFIELD_WIDTH));
        this.levelDisplay = document.getElementById("levelDisplay")!;
        this.scoreDisplay = document.getElementById("scoreDisplay")!;
    }

    printScore(score: string | number): void {
        this.scoreDisplay.textContent = `${score}`;
    }
    printLevel(level: string | number): void {
        this.levelDisplay.textContent = `${level}`;
    }

    drawGame(mtx: Drawable): void {
        for (let i = 0; i < mtx.height; i++) {
            for (let j = 0; j < mtx.width; j++) {
                this.fieldCtx.fillStyle = CANVAS_COLORS[mtx.get(j, i)];
                this.fieldCtx.fillRect(
                    j * this.tileSize,
                    i * this.tileSize,
                    this.tileSize,
                    this.tileSize,
                );
            }
        }
    }

    drawGuides(mtx: Drawable, currentPiece: Maybe<Drawable>): void {
        if(!currentPiece || !currentPiece.position) return;

        this.fieldCtx.strokeStyle = "rgb(255 255 255 / 0.6)";
        const leftX = currentPiece.position[0] * this.tileSize;
        if (leftX > 0) {
            this.fieldCtx.beginPath();
            this.fieldCtx.moveTo(leftX, 0);
            this.fieldCtx.lineTo(leftX, mtx.height * this.tileSize);
            this.fieldCtx.stroke();
        }
        const rightX = (currentPiece.position[0] + currentPiece.width) * this.tileSize;
        if (rightX < mtx.width * this.tileSize) {
            this.fieldCtx.beginPath();
            this.fieldCtx.moveTo(rightX, 0);
            this.fieldCtx.lineTo(rightX, mtx.height * this.tileSize);
            this.fieldCtx.stroke();
        }
    }

    drawNext(nextPiece: Maybe<Drawable>): void {
        this.blankCanvas(this.nextCtx);
        if (!nextPiece) return;
        const [pxW, pxH] = [
            nextPiece.width * this.tileSize,
            nextPiece.height * this.tileSize,
        ];
        const topLeftX = (this.nextPixels[0] - nextPiece.width * this.tileSize) / 2;
        const topLeftY = (this.nextPixels[1] - nextPiece.height * this.tileSize) / 2;
        for (let i = 0; i < nextPiece.height; i++) {
            for (let j = 0; j < nextPiece.width; j++) {
                this.nextCtx.fillStyle = CANVAS_COLORS[nextPiece.get(j, i)];
                this.nextCtx.fillRect(
                    topLeftX + j * this.tileSize,
                    topLeftY + i * this.tileSize,
                    this.tileSize,
                    this.tileSize,
                );
            }
        }
    }

    drawTextOverlay(mtx: Drawable, text: string): void {
        this.drawGame(mtx);
        this.fieldCtx.save();
        this.fieldCtx.fillStyle = "rgba(0, 0, 0, .65)";
        this.fieldCtx.fillRect(0, 0, this.fieldPixels[0], this.fieldPixels[1]);
        this.fieldCtx.fillStyle = "white";
        this.fieldCtx.font = "bold 16pt sans-serif";
        this.fieldCtx.textAlign = "center";
        const x = this.fieldPixels[0] / 2;
        const y = this.fieldPixels[1] * 0.33;
        this.fieldCtx.fillText(text, x, y);
        this.fieldCtx.restore();
    }

    drawMenu(): void {
        this.blankCanvas(this.fieldCtx);
        this.fieldCtx.fillStyle = "white";
        this.fieldCtx.font = "bold 12pt sans-serif";
        this.fieldCtx.textAlign = "center";
        const x = this.fieldPixels[0] / 2;
        const y = this.fieldPixels[1] * 0.33;
        this.fieldCtx.fillText("Press Enter to start", x, y);
    }

    blankCanvas(ctx: CanvasRenderingContext2D): void {
        const [x, y] = ctx === this.fieldCtx ? this.fieldPixels : this.nextPixels;
        ctx.save();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, x, y);
        ctx.restore();
    }

}
