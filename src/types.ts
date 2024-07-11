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

export enum TetrominoOrientation {
    North = 0,
    West = 90,
    South = 180,
    East = 270,
}

export enum GameState {
    Menu,
    Running,
    Paused,
    GameOver,
    //HighScore,
}
