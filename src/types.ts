export enum Tile {
    Empty = 0x00,
    LightBlue = 0x01,
    DarkBlue = 0x02,
    Orange = 0x03,
    Yellow = 0x04,
    Green = 0x05,
    Red = 0x06,
    Magenta = 0x07,
}

export type Vec2 = [number, number];

export enum Move {
    Left,
    Right,
    Down
}

export const KEYCODE_TO_MOVE = {
    'ArrowLeft': Move.Left,
    'ArrowRight': Move.Right,
    'ArrowDown': Move.Down,
};

export enum Orientation {
    North = 0,
    East = 90,
    South = 180,
    West = 270,
}

export enum GameState {
    Menu,
    Running,
    Paused,
    GameOver,
    //HighScore,
}

export type Maybe<T> = T | undefined;

/**
 * Circular buffer of frame times
 */
export class MeanBuffer {
    times: number[];
    idx: number = 0;

    /**
     * Create a buffer and initialize with real values.
     * @param len {number} - Length of buffer
     */
    constructor(len: number) {
        this.times = Array(len);
        let tmp = performance.now();
        let count = len;
        const init = () => {
            if(count-- > 0) {
                const now = performance.now();
                this.push((now - tmp) / 1000);
                tmp = now;
                requestAnimationFrame(init);
            }
        }
        requestAnimationFrame(init);
        console.log(this.times);
    }

    /**
     *
     * @returns {number} The mean of the values in the buffer.
     */
    getMean(): number {
        return this.times.reduce((acc, curr) => acc + curr) / this.times.length;
    }

    /**
     *
     * @param x {number} Push a value into the buffer, replacing older ones.
     */
    push(x: number): void {
        this.times[this.idx] = x;
        this.idx = (this.idx + 1) % this.times.length;
    }
}
