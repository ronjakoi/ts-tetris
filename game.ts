window.addEventListener("load", startGame);

const PLAYFIELD_HEIGHT = 20;
const PLAYFIELD_WIDTH = 10;

enum TileType {
    Empty = 0x00,
    LightBlue = 0x01,
    DarkBlue = 0x02,
    Orange = 0x03,
    Yellow = 0x04,
    Green = 0x05,
    Red = 0x06,
    Magenta = 0x07,
}

const CANVAS_COLORS: { [key in TileType]: string } = {
    [TileType.Empty]: "black",
    [TileType.LightBlue]: "cyan",
    [TileType.DarkBlue]: "#1E90FF",
    [TileType.Orange]: "orange",
    [TileType.Yellow]: "yellow",
    [TileType.Green]: "green",
    [TileType.Red]: "red",
    [TileType.Magenta]: "magenta",
};

class TileMatrix {
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

class Playfield {
    tiles: TileMatrix;
    height: number;
    width: number;

    constructor() {
        const mtx = Array(PLAYFIELD_WIDTH * PLAYFIELD_HEIGHT).fill(TileType.Empty);
        this.tiles = new TileMatrix(mtx, PLAYFIELD_WIDTH, PLAYFIELD_WIDTH);
        [this.height, this.width] = [this.tiles.height, this.tiles.width];
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

type Vec2 = [number, number];

enum TetrominoMove {
    Left,
    Right,
    Down
}

class Tetromino {
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


const tetrominoFactory = {
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
        const t = this.templates[Math.floor(Math.random() * this.templates.length)];
        return new Tetromino(t.matrix, t.color);
    }
}

function startGame() {
    const canvas = <HTMLCanvasElement>document.getElementById("game");
    const cWidth = canvas.getBoundingClientRect().width;
    const cHeight = canvas.getBoundingClientRect().height;
    const ctx = canvas.getContext("2d");


    if (ctx) {
        const tileSize = Math.floor(cWidth / PLAYFIELD_WIDTH); // pixels

        const pf = new Playfield();
        const t = tetrominoFactory.getRandom();
        const drawTiles = pf.overlay(t.tiles);
        for (let i = 0; i < PLAYFIELD_HEIGHT; i++) {
            for (let j = 0; j < PLAYFIELD_WIDTH; j++) {
                ctx.fillStyle = CANVAS_COLORS[drawTiles.get(j, i)];
                ctx.fillRect(j * tileSize, i * tileSize, tileSize, tileSize);
            }
        }
    }
}