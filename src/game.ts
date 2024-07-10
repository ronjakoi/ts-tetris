import { PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH, CANVAS_COLORS } from "./constants.js";
import { TileType, Vec2, TetrominoMove } from "./types.js";

export class TileMatrix {
    tiles: TileType[];
    height: number;
    width: number;
    readonly length: number;

    constructor(t: TileType[], w: number, h: number) {
        this.tiles = Array.from(t);
        this.height = h;
        this.width = w;
        this.length = this.tiles.length;
    }

    static newEmpty(width: number, height: number) {
        const t = Array(width * height).fill(TileType.Empty);
        return new TileMatrix(t, width, height);
    }

    get = (x: number, y: number): TileType => this.tiles[y * this.width + x];

    rotate(deg: number): void {
        // TODO
    }

    overlay(other: TileMatrix | Tetromino, position?: Vec2): TileMatrix {
        let pos = [0, 0];
        if (position) {
            pos = position;
        }
        let ret = new TileMatrix(this.tiles, this.width, this.height);
        for (let i = pos[1], y = 0; i < this.height && y < other.height; i++, y++) {
            for (let j = pos[0], x = 0; j < this.width && x < other.width; j++, x++) {
                const t = other.get(x, y);
                if (t != TileType.Empty) {
                    ret.tiles[i * this.width + j] = t.valueOf();
                }
            }
        }
        return ret;
    }
}

export class Playfield {
    tiles: TileMatrix;
    height: number;
    width: number;

    constructor(width?: number, height?: number) {
        [this.width, this.height] = [height ? height : PLAYFIELD_HEIGHT, width ? width : PLAYFIELD_HEIGHT];
        const mtx = Array(this.width * this.height).fill(TileType.Empty);
        this.tiles = new TileMatrix(mtx, this.width, this.height);
    }

    overlay = (other: TileMatrix | Tetromino, position?: Vec2): TileMatrix => this.tiles.overlay(other);

    deleteLines(lines: number[]): void {
        let newTiles: TileType[] = Array();
        for (let i = this.tiles.length - this.width; i >= 0; i -= this.width) {
            if (!lines.includes(i * this.width)) {
                newTiles.concat(this.tiles.tiles.slice(i, this.width + 1));
            }
        }
        this.tiles.tiles = newTiles;
    }

    get = (x: number, y: number): TileType => this.tiles.get(x, y);
}

export class Tetromino {
    rotation: number;
    tiles: TileMatrix;
    public width: number;
    public height: number;
    position: Vec2 | null;
    readonly length: number;

    constructor(mtx: boolean[][], tt: TileType) {
        this.rotation = 0;
        this.width = mtx[0].length;
        this.height = mtx.length;
        this.tiles = new TileMatrix(
            mtx.map(row => row.map(cell => cell ? tt.valueOf() : TileType.Empty)).flat(),
            this.width,
            this.height);
        this.position = null;
        this.length = this.tiles.length;
    }

    //overlay = (other: TileMatrix | Tetromino, position?: Vec2): TileMatrix => this.tiles.overlay(other);

    rotate(deg: number): void {
        this.tiles.rotate(deg);
    }

    move(d: TetrominoMove): void {
        // TODO
    }

    get = (x: number, y: number): TileType => this.tiles.get(x, y);
}


export const tetrominoFactory = {
    templates: [
        {
            name: "T",
            color: TileType.Magenta,
            matrix: [[false, true, false],
                    [true, true, true]]
        },
        {
            name: "I",
            color: TileType.LightBlue,
            matrix: [[true, true, true, true]],
        },
        {
            name: "O",
            color: TileType.Yellow,
            matrix: [[true, true],
                    [true, true]],
        },
        {
            name: "J",
            color: TileType.DarkBlue,
            matrix: [[false, true],
                    [false, true],
                    [true, true]]
        },
        {
            name: "L",
            color: TileType.Orange,
            matrix: [[true, false],
                    [true, false],
                    [true, true]]
        },
        {
            name: "S",
            color: TileType.Green,
            matrix: [[false, true, true],
                    [true, true, false]]
        },
        {
            name: "Z",
            color: TileType.Red,
            matrix: [[true, true, false],
                    [false, true, true]]
        }
    ],
    getRandom: function (): Tetromino {
        return this.getByIdx(Math.floor(Math.random() * this.templates.length));
    },
    getByName: function (name: string): Tetromino | undefined {
        //this.templates.forEach(x => { console.debug(`${x.name} === ${name} == ${x.name === name}\n`)});
        const t = this.templates.find(x => { x.name === name });
        return (t === undefined) ? undefined : new Tetromino(t.matrix, t.color);
    },
    getByIdx: function (idx: number): Tetromino {
        const t = this.templates[idx];
        return new Tetromino(t.matrix, t.color);
    }
}
