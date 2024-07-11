import { PLAYFIELD_WIDTH, CANVAS_COLORS } from "./constants.js";
import { Playfield, tetrominoFactory, Game } from "./game.js";

window.addEventListener("load", startGame);

function startGame() {
    const fieldCanvas = <HTMLCanvasElement>document.getElementById("game");
    const nextCanvas = <HTMLCanvasElement>document.getElementById("next");

    tetrominoFactory.shuffle();

    const game = new Game({ fieldCanvas: fieldCanvas, nextCanvas: nextCanvas });
    window.addEventListener("keydown", (event) => {
        game.handleKeyDown(event);
    });
    window.addEventListener("keyup", (event) => {
        game.handleKeyUp(event);
    });
    game.play();
}
