import {
    PLAYFIELD_HEIGHT,
    PLAYFIELD_WIDTH,
    FRAMES_PER_SECOND,
    STARTING_GRAVITY,
    SOFTDROP_GRAVITY,
    LOCK_DELAY_MS,
    LINES_PER_LEVEL,
    LEVEL_UP_GRAVITY_FACTOR,
} from "./constants.js";
import { Renderer } from "./renderer.js";
import {
    Tetromino,
    tetrominoFactory,
    maybeMove,
    maybeRotate,
    isPieceObstructed,
} from "./tetromino.js";
import { Matrix, TileMatrix } from "./tiles.js";
import { Tile, Vec2, Move, GameState, KEYCODE_TO_MOVE, Maybe, MeanBuffer } from "./types.js";

export class Playfield implements Matrix {
    tiles: TileMatrix;
    height: number;
    width: number;

    constructor(width?: number, height?: number) {
        [this.width, this.height] = [
            width ? width : PLAYFIELD_WIDTH,
            height ? height : PLAYFIELD_HEIGHT,
        ];
        const mtx = Array(this.width * this.height).fill(Tile.Empty);
        this.tiles = new TileMatrix(mtx, this.width, this.height);
    }

    overlay = (other: Maybe<Matrix>, position?: Vec2): Matrix =>
        other !== undefined ? this.tiles.overlay(other, position) : this.tiles;

    get = (x: number, y: number): Tile => this.tiles.get(x, y);

    clearRows(lines: number[]): void {
        this.tiles.clearRows(lines);
    }

    getFullRows = (): number[] => this.tiles.getFullRows();
}

const computeScore = (clearedLines: number, level: number): number => {
    switch (clearedLines) {
        case 4:
            return 1200 * (level + 1);
        case 3:
            return 300 * (level + 1);
        case 2:
            return 100 * (level + 1);
        case 1:
            return 40 * (level + 1);
        default:
            return 0;
    }
};

export class Game {
    pf: Playfield;
    renderer: Renderer;
    currentPiece: Maybe<Tetromino> = undefined;
    nextPiece: Maybe<Tetromino> = undefined;
    state: GameState = GameState.Menu;
    score: number = 0;
    gravity: number = STARTING_GRAVITY;
    lastFrame: DOMHighResTimeStamp;
    softDrop: boolean = false;
    frameDelay: number = (1 / FRAMES_PER_SECOND) * 0.8;
    lockTimeout: Maybe<NodeJS.Timeout> = undefined;
    level: number = 1;
    levelProgress: number = 0;
    meanDt: MeanBuffer;

    constructor(args: {
        fieldCanvas: HTMLCanvasElement;
        nextCanvas: HTMLCanvasElement;
        width?: number;
        height?: number;
    }) {
        this.pf = new Playfield(args.width, args.height);
        this.renderer = new Renderer({
            fieldCanvas: args.fieldCanvas,
            nextCanvas: args.nextCanvas,
        });
        this.update = this.update.bind(this);
        this.lastFrame = performance.now();
        this.meanDt = new MeanBuffer(20);
    }

    reset(): void {
        this.pf = new Playfield(this.pf.width, this.pf.height);
        tetrominoFactory.shuffle();
        this.currentPiece = tetrominoFactory.getNext();
        this.nextPiece = tetrominoFactory.getNext();
        this.state = GameState.Running;
        this.score = 0;
        this.level = 1;
        this.renderer.printLevel(this.level);
        this.renderer.printScore(this.score);
        this.gravity = STARTING_GRAVITY;
        this.softDrop = false;
        this.renderer.blankCanvas(this.renderer.fieldCtx);
        this.renderer.blankCanvas(this.renderer.nextCtx);
        this.lastFrame = performance.now();
    }

    lockPiece(): void {
        if (this.currentPiece === undefined || this.currentPiece.position === undefined) return;
        if (this.currentPiece.position[1] < 1.0) {
            this.state = GameState.GameOver;
            return;
        }
        this.pf.tiles = this.pf.overlay(this.currentPiece) as TileMatrix;
        this.currentPiece = this.nextPiece;
        this.nextPiece = tetrominoFactory.getNext();
        const fullRows = this.pf.getFullRows();
        const fullRowsCount = fullRows.length;
        if (fullRowsCount > 0) {
            this.pf.clearRows(fullRows);
            this.score += computeScore(this.level, fullRowsCount);
            this.maybeNextLevel(fullRowsCount);
            this.renderer.printScore(this.score);
            this.renderer.printLevel(this.level);
        }
    }

    move(d: Move): void {
        if (this.currentPiece === undefined || this.currentPiece.position === undefined) return;
        const newPos = maybeMove(this.currentPiece, this.pf, d);
        if (newPos) this.currentPiece.position = newPos;
    }

    isPieceLanded(): boolean {
        if (!this.currentPiece || !this.currentPiece.position) return false;
        return isPieceObstructed(this.currentPiece, this.pf, Move.Down);
    }

    hardDrop(): void {
        while (!this.isPieceLanded()) {
            this.move(Move.Down);
        }
        this.lockPiece();
    }

    rotate(deg: -90 | 90): void {
        if (!this.currentPiece) return;
        const temp = maybeRotate(this.currentPiece, this.pf, deg);
        if (temp !== undefined) {
            this.currentPiece.orientation = temp[0];
            this.currentPiece.position = temp[1];
            this.currentPiece.width = this.currentPiece.tiles[temp[0]].width;
            this.currentPiece.height = this.currentPiece.tiles[temp[0]].height;
        }
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case "ArrowLeft":
            case "ArrowRight":
                if (this.state != GameState.Running) return;
                this.move(KEYCODE_TO_MOVE[event.code]);
                event.preventDefault();
                break;
            case "ArrowDown":
                if (this.state != GameState.Running) return;
                const totalDistance = this.gravity * this.meanDt.getMean();
                if (totalDistance < 1.0) {
                    this.softDrop = true;
                }
                if (this.isPieceLanded()) this.lockPiece();
                event.preventDefault();
                break;
            case "Space":
                if (this.state != GameState.Running) return;
                this.hardDrop();
                event.preventDefault();
                break;
            case "ArrowUp":
                if (this.state != GameState.Running) return;
                if (!this.currentPiece) return;
                this.rotate(90);
                event.preventDefault();
                break;
            case "KeyZ":
                if (this.state != GameState.Running) return;
                if (!this.currentPiece) return;
                this.rotate(-90);
                break;
            case "Pause":
            case "KeyP":
                switch (this.state) {
                    case GameState.Running:
                        this.state = GameState.Paused;
                        break;
                    case GameState.Paused:
                        this.state = GameState.Running;
                        break;
                }
                break;
            case "Enter":
                if ([GameState.Menu, GameState.GameOver].includes(this.state)) {
                    this.reset();
                }
                event.preventDefault();
                break;
        }
    }

    handleKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case "ArrowDown":
                this.softDrop = false;
                event.preventDefault();
                break;
        }
    }

    /**
     * Performs the effect of gravity on the current tetromino each frame.
     * @param {number} dt - Δtime in seconds
     */
    doFall(dt: number): void {
        if (this.currentPiece === undefined || this.currentPiece.position === undefined) return;
        const totalDistance =
            dt * (this.softDrop ? Math.max(this.gravity, SOFTDROP_GRAVITY) : this.gravity);
        const maxRows = Math.floor(totalDistance);
        let counter;
        for (counter = 0; counter < maxRows && !this.isPieceLanded(); counter++)
            this.move(Move.Down);
        const fractionalDistance = totalDistance - counter;
        if (!this.isPieceLanded()) this.currentPiece.position[1] += fractionalDistance;
    }

    maybeNextLevel(lines: number): void {
        this.levelProgress += lines;
        if (this.levelProgress >= LINES_PER_LEVEL) {
            this.level++;
            this.levelProgress -= LINES_PER_LEVEL;
            // piece cannot fall further than the height of the playfield
            // in one frame
            const maxGravity = this.pf.height / this.meanDt.getMean();
            this.gravity = Math.min(maxGravity, this.gravity * LEVEL_UP_GRAVITY_FACTOR);
        }
    }

    /**
     * Update game state each frame.
     */
    update(): void {
        const now = performance.now();
        const dt = (now - this.lastFrame) / 1000;
        this.meanDt.push(dt);
        this.lastFrame = now;
        if (this.currentPiece !== undefined && this.currentPiece.position === undefined) {
            this.currentPiece.position = [
                Math.floor(this.pf.width / 2 - this.currentPiece.width / 2),
                0,
            ];
        }
        const drawTiles = this.pf.overlay(this.currentPiece);
        switch (this.state) {
            case GameState.Menu:
                this.renderer.drawMenu();
                this.renderer.blankCanvas(this.renderer.nextCtx);
                break;
            case GameState.Running:
                if (this.isPieceLanded()) {
                    if (this.lockTimeout === undefined) {
                        this.lockTimeout = setTimeout(() => {
                            // the player can still move the piece to a non-landed
                            // position during the lock delay, so check again
                            if (this.isPieceLanded()) this.lockPiece();
                            // release timeout
                            clearTimeout(this.lockTimeout);
                            this.lockTimeout = undefined;
                        }, LOCK_DELAY_MS);
                    }
                } else {
                    this.doFall(dt);
                }
                this.renderer.drawGame(drawTiles);
                this.renderer.drawGuides(drawTiles, this.currentPiece);
                this.renderer.drawNext(this.nextPiece);
                break;
            case GameState.GameOver:
                this.renderer.drawTextOverlay(drawTiles, "Game Over");
                break;
            case GameState.Paused:
                this.renderer.drawTextOverlay(drawTiles, "Paused");
                break;
        }
        requestAnimationFrame(this.update);
    }

    /**
     * Start the game.
     */
    play(): void {
        tetrominoFactory.shuffle();
        requestAnimationFrame(this.update);
    }
}
