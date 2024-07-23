import {
    PLAYFIELD_HEIGHT,
    PLAYFIELD_WIDTH,
    CANVAS_COLORS,
    FRAMES_PER_SECOND,
    STARTING_GRAVITY,
    SOFTDROP_GRAVITY,
    LOCK_DELAY_MS,
    LINES_PER_LEVEL,
} from "./constants.js";
import { Tile, Vec2, Move, GameState, KEYCODE_TO_MOVE, Orientation, Maybe } from "./types.js";

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

    clearRows(lines: number[]): void {
        this.tiles.clearRows(lines);
    }

    getFullRows = (): number[] => this.tiles.getFullRows();
}

const makeTileArray = (mtx: boolean[][], tt: Tile): Tile[] =>
    mtx.flatMap((row) => row.map((cell) => (cell ? tt.valueOf() : Tile.Empty)));

export const transpose = <T = any>(arr: T[][]): T[][] =>
    arr[0].map((_: T, i: number) => arr.map((row) => row[i]));

export const rotate90CW = <T = any>(arr: T[][]): T[][] =>
    transpose(arr).map((row) => makeReversed(row));

const modulo = (n: number, d: number): number => ((n % d) + d) % d;
const makeReversed = <T = any>(arr: T[]): T[] => {
    const ret = Array.from(arr);
    ret.reverse();
    return ret;
};

export class Tetromino {
    orientation: Orientation = Orientation.North;
    tiles: { [key in Orientation]: TileMatrix };
    width: number;
    height: number;
    position: Vec2 | undefined = undefined;
    readonly length: number;

    constructor(mtxNorth: boolean[][], tt: Tile) {
        this.width = mtxNorth[0].length;
        this.height = mtxNorth.length;

        const mtxEast = rotate90CW(mtxNorth);
        const mtxSouth = rotate90CW(mtxEast);
        const mtxWest = rotate90CW(mtxSouth);
        const N = makeTileArray(mtxNorth, tt);
        const E = makeTileArray(mtxEast, tt);
        const S = makeTileArray(mtxSouth, tt);
        const W = makeTileArray(mtxWest, tt);
        this.tiles = {
            [Orientation.North]: new TileMatrix(N, this.width, this.height),
            [Orientation.East]: new TileMatrix(E, this.height, this.width),
            [Orientation.South]: new TileMatrix(S, this.width, this.height),
            [Orientation.West]: new TileMatrix(W, this.height, this.width),
        };
        this.length = N.length;
    }

    getRotation(deg: -90 | 90): {o: Orientation, width: number, height: number} {
        // positive degrees is clockwise
        return {o: modulo(this.orientation + deg, 360), width: this.height, height: this.width};
    }

    get = (x: number, y: number): Tile => this.tiles[this.orientation].get(x, y);

    intersects(other: TileMatrix): boolean {
        if(!this.position) return false;
        return intersects(this.tiles[this.orientation], other, this.position);
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
                [true, false, false],
                [true, true, true],
            ],
        },
        {
            name: "L",
            color: Tile.Orange,
            matrix: [
                [false, false, true],
                [true, true, true],
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

export const intersects = (a: TileMatrix, b: TileMatrix, pos: Vec2): boolean => {
    if (pos === undefined) return false;
    const y0 = Math.floor(pos[1]);
    const x0 = pos[0];
    for (let i = 0; i < a.height; i++) {
        for (let j = 0; j < a.width; j++) {
            if (a.get(j, i) != Tile.Empty && b.get(x0 + j, y0 + i) != Tile.Empty) {
                return true;
            }
        }
    }
    return false;
};

export const maybeMove = (piece: Tetromino, pf: Playfield, move: Move): Maybe<Vec2> => {
    if (!piece || !piece.position) return undefined;
    const ret: Vec2 = [...piece.position];
    switch (move) {
        case Move.Left:
            ret[0]--;
            break;
        case Move.Right:
            ret[0]++;
            break;
        case Move.Down:
            ret[1]++;
            break;
    }
    if (
        ret[0] < 0 ||
        ret[0] > pf.width - piece.width ||
        Math.floor(ret[1]) > pf.height - piece.height ||
        intersects(piece.tiles[piece.orientation], pf.tiles, ret)
    ) {
        return undefined;
    } else {
        return ret;
    }
};

export const maybeRotate = (piece: Tetromino, pf: Playfield, deg: -90 | 90): Maybe<{o: Orientation, width: number, height: number}> => {
        if (piece === undefined || piece.position === undefined) return undefined;
        const ret = piece.getRotation(deg);
        // revert rotation if piece extends beyond right edge or intersects
        // with tiles already on the playfield
        // FIXME: doesn't work :(
        const testMatrix = piece.tiles[ret.o];
        if (
            piece.position[0] <= pf.width - ret.width &&
            !intersects(piece.tiles[ret.o], pf.tiles, piece.position)
        ) {
            return ret;
        } else {
            return undefined;
        }
}

export const isPieceObstructed = (piece: Tetromino, pf: Playfield, direction: Move): boolean => {
    return maybeMove(piece, pf, direction) === undefined ? true : false;
};

const computeScore = (level: number, n: number): number => {
    switch (level) {
        case 4:
            return 1200 * (n + 1);
        case 3:
            return 300 * (n + 1);
        case 2:
            return 100 * (n + 1);
        case 1:
            return 40 * (n + 1);
        default:
            return 0;
    }
};

export class Game {
    pf: Playfield;
    currentPiece: Tetromino | undefined = undefined;
    nextPiece: Tetromino | undefined = undefined;
    state: GameState = GameState.Menu;
    score: number = 0;
    fieldCtx: CanvasRenderingContext2D;
    fieldPixels: Vec2;
    nextCtx: CanvasRenderingContext2D;
    nextPixels: Vec2;
    gravity: number = STARTING_GRAVITY;
    tileSize: number;
    softDrop: boolean = false;
    frameDelay: number = (1 / FRAMES_PER_SECOND) * 0.8;
    lockTimeout: NodeJS.Timeout | undefined = undefined;
    level: number = 1;
    levelProgress: number = 0;
    levelDisplay: HTMLElement;
    scoreDisplay: HTMLElement;

    constructor(args: {
        fieldCanvas: HTMLCanvasElement;
        nextCanvas: HTMLCanvasElement;
        width?: number;
        height?: number;
    }) {
        this.pf = new Playfield(args.width, args.height);

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
        this.levelDisplay = document.getElementById("levelDisplay")!;
        this.levelDisplay.textContent = `${this.level}`;
        this.scoreDisplay = document.getElementById("scoreDisplay")!;
        this.scoreDisplay.textContent = `${this.score}`;
    }

    reset(): void {
        this.pf = new Playfield(this.pf.width, this.pf.height);
        tetrominoFactory.shuffle();
        this.currentPiece = tetrominoFactory.getNext();
        this.nextPiece = tetrominoFactory.getNext();
        this.state = GameState.Running;
        this.score = 0;
        this.level = 1;
        this.levelDisplay.textContent = "1";
        this.scoreDisplay.textContent = "0";
        this.gravity = STARTING_GRAVITY;
        this.softDrop = false;
        this.blankCanvas(this.fieldCtx);
        this.blankCanvas(this.nextCtx);
    }

    updateScoreAndLevel(): void {
        this.scoreDisplay.textContent = `${this.score}`;
        this.levelDisplay.textContent = `${this.level}`;
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
            const fullRows = this.pf.getFullRows();
            const fullRowsCount = fullRows.length;
            if (fullRowsCount > 0) {
                this.pf.clearRows(fullRows);
                this.score += computeScore(this.level, fullRowsCount);
                this.maybeNextLevel(fullRowsCount);
                this.updateScoreAndLevel();
            }
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
        if(!this.currentPiece) return;
        const newRotation = maybeRotate(this.currentPiece, this.pf, deg);
        if(newRotation !== undefined) {
            this.currentPiece.orientation = newRotation.o;
            this.currentPiece.width = newRotation.width;
            this.currentPiece.height = newRotation.height;
        }
    }

    handleKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case "ArrowLeft":
            case "ArrowRight":
                if (this.state != GameState.Running) return;
                this.move(KEYCODE_TO_MOVE[event.code]);
                break;
            case "ArrowDown":
                if (this.state != GameState.Running) return;
                if (this.gravity < 1) {
                    this.softDrop = true;
                }
                if (this.isPieceLanded()) this.lockPiece();
                break;
            case "Space":
                if (this.state != GameState.Running) return;
                this.hardDrop();
                break;
            case "ArrowUp":
                if (this.state != GameState.Running) return;
                if (!this.currentPiece) return;
                this.rotate(90);
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
                break;
            case "NumpadAdd":
                this.gravity = Math.min(this.pf.height, this.gravity * 2);
                console.log(`new gravity: ${this.gravity}`);
                break;
            case "NumpadSubtract":
                this.gravity = Math.max(STARTING_GRAVITY, this.gravity / 2);
                console.log(`new gravity: ${this.gravity}`);
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

    drawNext(): void {
        this.blankCanvas(this.nextCtx);
        if (!this.nextPiece) return;
        const [pxW, pxH] = [
            this.nextPiece.width * this.tileSize,
            this.nextPiece.height * this.tileSize,
        ];
        const topLeftX = (this.nextPixels[0] - this.nextPiece.width * this.tileSize) / 2;
        const topLeftY = (this.nextPixels[1] - this.nextPiece.height * this.tileSize) / 2;
        for (let i = 0; i < this.nextPiece.height; i++) {
            for (let j = 0; j < this.nextPiece.width; j++) {
                this.nextCtx.fillStyle = CANVAS_COLORS[this.nextPiece.get(j, i)];
                this.nextCtx.fillRect(
                    topLeftX + j * this.tileSize,
                    topLeftY + i * this.tileSize,
                    this.tileSize,
                    this.tileSize,
                );
            }
        }
    }

    drawTextOverlay(text: string): void {
        this.drawGame();
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

    doFall(): void {
        if (this.currentPiece === undefined || this.currentPiece.position === undefined) return;
        if (this.gravity < 1.0) {
            this.currentPiece.position[1] +=
                this.softDrop && this.gravity < SOFTDROP_GRAVITY ? SOFTDROP_GRAVITY : this.gravity;
        } else {
            const maxRows = Math.floor(this.gravity);
            let counter;
            for (counter = 0; counter < maxRows && !this.isPieceLanded(); counter++)
                this.move(Move.Down);
            const remainderG = this.gravity - counter;
            if (!this.isPieceLanded()) this.currentPiece.position[1] += remainderG;
        }
    }

    maybeNextLevel(lines: number): void {
        this.levelProgress += lines;
        if (this.levelProgress >= LINES_PER_LEVEL) {
            this.level++;
            this.levelProgress = 0;
            this.gravity = Math.min(this.pf.height, this.gravity * 2);
        }
    }

    play(): void {
        setInterval(() => {
            switch (this.state) {
                case GameState.Menu:
                    this.drawMenu();
                    this.blankCanvas(this.nextCtx);
                    break;
                case GameState.Running:
                    if (this.currentPiece!.position === undefined) {
                        this.currentPiece!.position = [
                            Math.floor(this.pf.width / 2 - this.currentPiece!.width / 2),
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
                                clearTimeout(this.lockTimeout);
                                this.lockTimeout = undefined;
                            }, LOCK_DELAY_MS);
                        }
                    } else {
                        this.doFall();
                    }
                    this.drawGame();
                    this.drawNext();
                    break;
                case GameState.GameOver:
                    this.drawTextOverlay("Game Over");
                    break;
                case GameState.Paused:
                    this.drawTextOverlay("Paused");
                    break;
            }
        }, this.frameDelay);
    }
}
