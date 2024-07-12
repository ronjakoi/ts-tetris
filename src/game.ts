import {
    PLAYFIELD_HEIGHT,
    PLAYFIELD_WIDTH,
    CANVAS_COLORS,
    FRAMES_PER_SECOND,
    STARTING_GRAVITY,
    SOFTDROP_GRAVITY,
    SOFTDROP_RESET_MS,
    LOCK_DELAY_MS,
} from "./constants.js";
import { Tile, Vec2, Move, GameState, KEYCODE_TO_MOVE, TetrominoOrientation } from "./types.js";

export class TileMatrix {
    tiles: Tile[];
    height: number;
    width: number;
    readonly length: number;

    constructor(t: Tile[], w: number, h: number) {
        this.tiles = Array.from(t);
        this.height = h;
        this.width = w;
        this.length = this.tiles.length;
    }

    static newEmpty(width: number, height: number) {
        const t = Array(width * height).fill(Tile.Empty);
        return new TileMatrix(t, width, height);
    }

    get = (x: number, y: number): Tile => this.tiles[y * this.width + x];

    rotate(deg: number): void {
        // TODO
    }

    overlay(other: TileMatrix | Tetromino, position?: Vec2): TileMatrix {
        const ret = new TileMatrix(this.tiles, this.width, this.height);

        let pos: Vec2;
        if (position) {
            pos = position;
        } else {
            pos =
                other instanceof Tetromino && other.position
                    ? // other.position[1] (y coordinate) can be fractional
                      [other.position[0], Math.floor(other.position[1])]
                    : [0, 0];
        }
        for (let i = pos[1], y = 0; i < this.height && y < other.height; i++, y++) {
            for (let j = pos[0], x = 0; j < this.width && x < other.width; j++, x++) {
                const t = other.get(x, y);
                if (t != Tile.Empty) {
                    ret.tiles[i * this.width + j] = t.valueOf();
                }
            }
        }
        return ret;
    }

    clearRows(rows: number[]): void {
        // create new array with $lines * $width empty tiles
        let newTiles: Tile[] = Array(rows.length * this.width).fill(Tile.Empty);
        const lineStartIdxs = rows.map((n) => n * this.width);
        const lastLineStart = this.tiles.length - this.width;
        for (let i = 0; i <= lastLineStart; i += this.width) {
            // if this is not a line to be deleted, copy it to new array
            if (!lineStartIdxs.includes(i)) {
                const keepLine = this.tiles.slice(i, i + this.width);
                newTiles = newTiles.concat(keepLine);
            }
        }
        this.tiles = newTiles;
    }

    getFullRows(): number[] {
        const rows: number[] = [...Array(this.height).keys()];
        return rows.filter((row) =>
            this.tiles
                .slice(row * this.width, row * this.width + this.width)
                .every((col) => col != Tile.Empty),
        );
    }
}

export class Playfield {
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

    overlay = (other: TileMatrix | Tetromino, position?: Vec2): TileMatrix =>
        this.tiles.overlay(other, position);

    get = (x: number, y: number): Tile => this.tiles.get(x, y);

    clearRows = (lines: number[]): void => this.tiles.clearRows(lines);

    getFullRows = (): number[] => this.tiles.getFullRows();
}

export class Tetromino {
    orientation: TetrominoOrientation;
    tiles: TileMatrix;
    public width: number;
    public height: number;
    position: Vec2 | undefined;
    readonly length: number;

    constructor(mtx: boolean[][], tt: Tile) {
        this.orientation = TetrominoOrientation.North;
        this.width = mtx[0].length;
        this.height = mtx.length;
        this.tiles = new TileMatrix(
            mtx.map((row) => row.map((cell) => (cell ? tt.valueOf() : Tile.Empty))).flat(),
            this.width,
            this.height,
        );
        this.position = undefined;
        this.length = this.tiles.length;
    }

    rotate(deg: number): void {
        // positive degrees is counter-clockwise
        this.orientation = (this.orientation + deg) % 360;
        //this.tiles.rotate(deg);
    }

    get = (x: number, y: number): Tile => this.tiles.get(x, y);

    intersects(other: Playfield | TileMatrix): boolean {
        if (this.position === undefined) return false;
        const y0 = Math.floor(this.position[1]);
        const x0 = this.position[0];
        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                if (this.get(j, i) != Tile.Empty && other.get(x0 + j, y0 + i) != Tile.Empty) {
                    return true;
                }
            }
        }
        return false;
    }
}

export const tetrominoFactory: {
    templates: any[];
    randomBag: number[];
    currentIndex: number;
    shuffle: () => void;
    getNext: () => Tetromino;
    getByName: (name: string) => Tetromino | undefined;
    getByIdx: (idx: number) => Tetromino;
} = {
    templates: [
        {
            name: "T",
            color: Tile.Magenta,
            matrix: [
                [false, true, false],
                [true, true, true],
            ],
        },
        {
            name: "I",
            color: Tile.LightBlue,
            matrix: [[true, true, true, true]],
        },
        {
            name: "O",
            color: Tile.Yellow,
            matrix: [
                [true, true],
                [true, true],
            ],
        },
        {
            name: "J",
            color: Tile.DarkBlue,
            matrix: [
                [false, true],
                [false, true],
                [true, true],
            ],
        },
        {
            name: "L",
            color: Tile.Orange,
            matrix: [
                [true, false],
                [true, false],
                [true, true],
            ],
        },
        {
            name: "S",
            color: Tile.Green,
            matrix: [
                [false, true, true],
                [true, true, false],
            ],
        },
        {
            name: "Z",
            color: Tile.Red,
            matrix: [
                [true, true, false],
                [false, true, true],
            ],
        },
    ],
    randomBag: [0, 1, 2, 3, 4, 5, 6, 7],
    currentIndex: 0,
    shuffle: function (): void {
        // Durstenfeld shuffle
        for (let i = this.randomBag.length - 1; i--; i > 0) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.randomBag[i], this.randomBag[j]] = [this.randomBag[j], this.randomBag[i]];
        }
        this.currentIndex = 0;
    },
    getNext: function (): Tetromino {
        if (this.currentIndex === this.randomBag.length - 1) {
            this.shuffle();
        }
        return this.getByIdx(this.randomBag[this.currentIndex++]);
    },
    getByName: function (name: string): Tetromino | undefined {
        const t = this.templates.find((x) => {
            x.name === name;
        });
        return t === undefined ? undefined : new Tetromino(t.matrix, t.color);
    },
    getByIdx: function (idx: number): Tetromino {
        const t = this.templates[idx];
        return new Tetromino(t.matrix, t.color);
    },
};

export class Game {
    pf: Playfield;
    currentPiece: Tetromino | undefined;
    nextPiece: Tetromino | undefined;
    state: GameState;
    score: number;
    fieldCtx: CanvasRenderingContext2D;
    fieldPixels: Vec2;
    nextCtx: CanvasRenderingContext2D;
    nextPixels: Vec2;
    gravity: number;
    tileSize: number;
    softDrop: boolean;
    frameDelay: number;
    lockTimeout: NodeJS.Timeout | undefined;

    constructor(args: {
        fieldCanvas: HTMLCanvasElement;
        nextCanvas: HTMLCanvasElement;
        width?: number;
        height?: number;
    }) {
        this.pf = new Playfield(args.width, args.height);
        this.state = GameState.Menu;
        this.currentPiece = undefined;
        this.nextPiece = undefined;
        this.score = 0;
        this.gravity = STARTING_GRAVITY;

        const fCtx = args.fieldCanvas.getContext("2d");
        const nCtx = args.nextCanvas.getContext("2d");
        this.fieldPixels = [args.fieldCanvas.width, args.fieldCanvas.height];
        this.nextPixels = [args.nextCanvas.width, args.nextCanvas.height];
        if (!fCtx || !nCtx) {
            throw Error("Unable to get canvas context!");
        }

        this.fieldCtx = fCtx;
        this.nextCtx = nCtx;
        this.tileSize = Math.floor(this.fieldPixels[0] / this.pf.width);
        this.softDrop = false;
        this.frameDelay = (1 / FRAMES_PER_SECOND) * 0.8;
    }

    reset(): void {
        this.pf = new Playfield(this.pf.width, this.pf.height);
        tetrominoFactory.shuffle();
        this.currentPiece = tetrominoFactory.getNext();
        this.nextPiece = tetrominoFactory.getNext();
        this.state = GameState.Running;
        this.score = 0;
        this.gravity = STARTING_GRAVITY;
        this.softDrop = false;
        console.log("Started game.");
        console.log(this);
        this.blankCanvas();
    }

    lockPiece(): void {
        if (this.currentPiece !== undefined && this.currentPiece.position !== undefined) {
            if (this.currentPiece.position[1] < 1.0) {
                this.state = GameState.GameOver;
                return;
            }
            this.pf.tiles = this.pf.overlay(this.currentPiece);
            this.currentPiece = this.nextPiece;
            this.nextPiece = tetrominoFactory.getNext();
        }
    }

    isPieceObstructed(direction: Move): boolean {
        // 1. no piece right now: false
        if (!this.currentPiece || !this.currentPiece.position) return false;
        // 2. piece is bumping against a playfield edge: true
        switch (direction) {
            case Move.Down:
                if (this.currentPiece.position[1] === this.pf.height - this.currentPiece.height)
                    return true;
                break;
            case Move.Left:
                if (this.currentPiece.position[0] === 0) return true;
                break;
            case Move.Right:
                if (this.currentPiece.position[0] === this.pf.width - this.currentPiece.width)
                    return true;
                break;
        }
        // 3a. temporarily move piece in $direction
        // 3b. check if new position intersects with existing non-empty tiles
        // 3c. restore saved position
        // 3d. return value from 3b.
        const tmp: Vec2 = [...this.currentPiece.position];
        this.move(direction);
        const ret = this.currentPiece.intersects(this.pf);
        this.currentPiece.position = tmp;
        return ret;
    }

    isPieceLanded(): boolean {
        return this.isPieceObstructed(Move.Down);
    }

    hardDrop(): void {
        while (!this.isPieceLanded()) {
            this.move(Move.Down);
        }
        this.lockPiece();
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case "ArrowLeft":
            case "ArrowRight":
                this.move(KEYCODE_TO_MOVE[event.code]);
                break;
            case "ArrowDown":
                if (this.gravity < 1) {
                    this.softDrop = true;
                }
                break;
            case "Space":
                this.hardDrop();
                break;
            case "ArrowUp":
                if (!this.currentPiece) return;
                this.currentPiece.rotate(-90);
                break;
            case "KeyZ":
                if (!this.currentPiece) return;
                this.currentPiece.rotate(90);
                break;
            case "Pause":
            case "KeyP":
                if (this.state === GameState.Running) this.state = GameState.Paused;
                else if (this.state === GameState.Paused) this.state = GameState.Running;
                break;
            case "Enter":
                if ([GameState.Menu, GameState.GameOver].includes(this.state)) {
                    this.reset();
                }
                break;
        }
    }

    handleKeyUp(event: KeyboardEvent): void {
        switch (event.code) {
            case "ArrowDown":
                this.softDrop = false;
                break;
        }
    }

    move(d: Move): void {
        if (!this.currentPiece || !this.currentPiece.position) return;
        //const tmp = this.currentPiece.position;
        // const tmp: Vec2 = [...this.currentPiece.position];
        const tmpX = this.currentPiece.position[0].valueOf();
        switch (d) {
            case Move.Left:
                if (this.currentPiece.position[0] > 0) {
                    this.currentPiece.position[0]--;
                }
                break;
            case Move.Right:
                if (this.currentPiece.position[0] < this.pf.width - this.currentPiece.width) {
                    this.currentPiece.position[0]++;
                }
                break;
            case Move.Down:
                if (this.currentPiece.position[1] < this.pf.height - 1) {
                    this.currentPiece.position[1]++;
                }
                break;
        }
        // revert if piece intersects blocks on the field
        if (this.currentPiece.intersects(this.pf)) {
            this.currentPiece.position[0] = tmpX;
        }
    }

    drawGame(): void {
        const drawTiles = this.currentPiece ? this.pf.overlay(this.currentPiece) : this.pf.tiles;
        for (let i = 0; i < this.pf.height; i++) {
            for (let j = 0; j < this.pf.width; j++) {
                this.fieldCtx.fillStyle = CANVAS_COLORS[drawTiles.get(j, i)];
                this.fieldCtx.fillRect(
                    j * this.tileSize,
                    i * this.tileSize,
                    this.tileSize,
                    this.tileSize,
                );
            }
        }
    }

    drawGameOver(): void {
        this.drawGame();
        this.fieldCtx.save();
        this.fieldCtx.fillStyle = "rgba(0, 0, 0, .65)";
        this.fieldCtx.fillRect(0, 0, this.fieldPixels[0], this.fieldPixels[1]);
        this.fieldCtx.fillStyle = "white";
        this.fieldCtx.font = "bold 16pt sans-serif";
        this.fieldCtx.textAlign = "center";
        const x = this.fieldPixels[0] / 2;
        const y = this.fieldPixels[1] * 0.33;
        this.fieldCtx.fillText("Game Over", x, y);
        this.fieldCtx.restore();
    }

    drawMenu(): void {
        this.blankCanvas();
        this.fieldCtx.fillStyle = "white";
        this.fieldCtx.font = "bold 12pt sans-serif";
        this.fieldCtx.textAlign = "center";
        const x = this.fieldPixels[0] / 2;
        const y = this.fieldPixels[1] * 0.33;
        this.fieldCtx.fillText("Press Enter to start", x, y);
    }

    blankCanvas(): void {
        this.fieldCtx.save();
        this.fieldCtx.fillStyle = "black";
        this.fieldCtx.fillRect(0, 0, this.fieldPixels[0], this.fieldPixels[1]);
        this.fieldCtx.restore();
    }

    doFall(): void {
        if(this.currentPiece === undefined || this.currentPiece.position === undefined) return;
        if(this.gravity < 1.0) {
            this.currentPiece.position[1] += this.softDrop && this.gravity < SOFTDROP_GRAVITY
                ? SOFTDROP_GRAVITY
                : this.gravity;
        } else {
            const maxRows = Math.floor(this.gravity);
            let counter;
            for(counter = 0; counter < maxRows && !this.isPieceLanded(); counter++) this.move(Move.Down);
            const remainderG = this.gravity - counter;
            if(!this.isPieceLanded()) this.currentPiece.position[1] += remainderG;
        }
    }

    play(): void {
        // probably only want to run this tight loop in GameState.Running
        let prevState: null | GameState = null;
        setInterval(() => {
            switch (this.state) {
                case GameState.Menu:
                    this.drawMenu();
                    break;
                case GameState.Running:
                    if (this.currentPiece!.position === undefined) {
                        this.currentPiece!.position = [
                            Math.floor((this.pf.width / 2) - (this.currentPiece!.width / 2)),
                            0,
                        ];
                    }

                    if (this.isPieceLanded()) {
                        if (this.lockTimeout === undefined) {
                            this.lockTimeout = setTimeout(() => {
                                // the player can still move the piece to a non-landed
                                // position during the lock delay, so check again
                                if (this.isPieceLanded()) this.lockPiece();
                                // release timeout
                                this.lockTimeout = undefined;
                            }, LOCK_DELAY_MS);
                        }
                    } else {
                        this.doFall();
                    }
                    this.pf.clearRows(this.pf.getFullRows());
                    this.drawGame();
                    break;
                case GameState.GameOver:
                    // TODO:
                    this.drawGameOver();
                    break;
            }
        }, this.frameDelay);
    }
}
