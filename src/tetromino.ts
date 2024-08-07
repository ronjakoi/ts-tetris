import { Playfield } from "./game.js";
import { Matrix, TileMatrix } from "./tiles.js";
import { Orientation, Vec2, Tile, Move, Maybe } from "./types.js";

// matrix rotation helpers
const makeTileArray = (mtx: boolean[][], tt: Tile): Tile[] =>
    mtx.flatMap((row) => row.map((cell) => (cell ? tt.valueOf() : Tile.Empty)));

export const transpose = <T>(arr: T[][]): T[][] =>
    arr[0].map((_: T, i: number) => arr.map((row) => row[i]));

export const rotate90CW = <T>(arr: T[][]): T[][] => transpose(arr).map((row) => makeReversed(row));

const makeReversed = <T>(arr: T[]): T[] => {
    const ret = Array.from(arr);
    ret.reverse();
    return ret;
};

// JS % operator is remainder, not modulo: different behaviour with
// negative operands
const modulo = (n: number, d: number): number => ((n % d) + d) % d;

export class Tetromino implements Matrix {
    orientation: Orientation = Orientation.North;
    tiles: { [key in Orientation]: TileMatrix };
    width: number;
    height: number;
    position: Vec2 | undefined = undefined;

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
    }

    getRotation(deg: -90 | 90): Orientation {
        // positive degrees is clockwise
        return modulo(this.orientation + deg, 360);
    }

    get = (x: number, y: number): Tile => this.tiles[this.orientation].get(x, y);

    intersects(other: Matrix): boolean {
        if (!this.position) return false;
        return this.tiles[this.orientation].intersects(other, this.position);
    }

    overlay(other: Matrix, position?: Vec2): Matrix {
        return this.tiles[this.orientation].overlay(other, position);
    }

    inBoundsOf(other: Matrix, position?: Vec2): boolean {
        const pos = position ? position : this.position;
        return this.tiles[this.orientation].inBoundsOf(other, pos);
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
    getByName: function (name: string): Maybe<Tetromino> {
        const t = this.templates.find((x) => x.name === name);
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
        !piece.inBoundsOf(pf.tiles, newPosition) ||
        piece.tiles[piece.orientation].intersects(pf.tiles, newPosition)
    ) {
        return undefined;
    } else {
        return newPosition;
    }
};

export const maybeRotate = (piece: Tetromino, pf: Playfield, deg: -90 | 90): Maybe<[Orientation, Vec2]> => {
    if (piece.position === undefined) return undefined;
    const newOrientation = piece.getRotation(deg);
    const testMatrix = piece.tiles[newOrientation];
    // Scoot to the left if rotating the piece would put it past the right edge.
    // This feels nicer than returning `undefined`, i.e. disallowing rotations too close to the edge
    const newX = Math.min(piece.position[0], pf.width - testMatrix.width);
    if (
        testMatrix.inBoundsOf(pf.tiles, [newX, piece.position[1]]) &&
        !testMatrix.intersects(pf.tiles, piece.position)
    ) {
        return [newOrientation, [newX, piece.position[1]]];
    } else {
        return undefined;
    }
};

export const isPieceObstructed = (piece: Tetromino, pf: Playfield, direction: Move): boolean =>
    maybeMove(piece, pf, direction) === undefined ? true : false;
