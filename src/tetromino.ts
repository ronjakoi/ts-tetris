import { Playfield } from "./game.js";
import { TileMatrix, intersects } from "./tiles.js";
import { Orientation, Vec2, Tile, Move, Maybe } from "./types.js";

// matrix rotation helpers
const makeTileArray = (mtx: boolean[][], tt: Tile): Tile[] =>
    mtx.flatMap((row) => row.map((cell) => (cell ? tt.valueOf() : Tile.Empty)));

export const transpose = <T>(arr: T[][]): T[][] =>
    arr[0].map((_: T, i: number) => arr.map((row) => row[i]));

export const rotate90CW = <T>(arr: T[][]): T[][] =>
    transpose(arr).map((row) => makeReversed(row));

const makeReversed = <T>(arr: T[]): T[] => {
    const ret = Array.from(arr);
    ret.reverse();
    return ret;
};

// JS % operator is remainder, not modulo: different behaviour with
// negative operands
const modulo = (n: number, d: number): number => ((n % d) + d) % d;

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

export const maybeMove = (piece: Tetromino, pf: Playfield, move: Move): Maybe<Vec2> => {
    if (!piece.position) return undefined;
    const newPosition: Vec2 = [...piece.position];
    switch (move) {
        case Move.Left:
            newPosition[0]--;
            break;
        case Move.Right:
            newPosition[0]++;
            break;
        case Move.Down:
            newPosition[1]++;
            break;
    }
    if (
        // past left edge
        newPosition[0] < 0 ||
        // past right edge
        newPosition[0] > pf.width - piece.width ||
        // past bottom edge
        Math.floor(newPosition[1]) > pf.height - piece.height ||
        // overlapping with previous tiles
        intersects(piece.tiles[piece.orientation], pf.tiles, newPosition)
    ) {
        return undefined;
    } else {
        return newPosition;
    }
};

export const maybeRotate = (piece: Tetromino, pf: Playfield, deg: -90 | 90): Maybe<{o: Orientation, width: number, height: number}> => {
        if (piece.position === undefined) return undefined;
        const ret = piece.getRotation(deg);
        // revert rotation if piece extends beyond right edge or intersects
        // with tiles already on the playfield
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