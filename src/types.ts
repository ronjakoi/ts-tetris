export enum TileType {
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

export enum TetrominoMove {
    Left,
    Right,
    Down
}
