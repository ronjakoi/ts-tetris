import { PLAYFIELD_WIDTH, CANVAS_COLORS } from "./constants.js";
import { Playfield, tetrominoFactory } from "./game.js";

window.addEventListener("load", startGame);

function startGame() {
    const canvas = <HTMLCanvasElement>document.getElementById("game");
    const cWidth = canvas.getBoundingClientRect().width;
    const cHeight = canvas.getBoundingClientRect().height;
    const ctx = canvas.getContext("2d");

    window.addEventListener("keydown", (event) => {
        console.log(event);
    });


    if (ctx) {
        const tileSize = Math.floor(cWidth / PLAYFIELD_WIDTH); // pixels

        const pf = new Playfield();
        //const t = tetrominoFactory.getRandom();
        const t = tetrominoFactory.getByIdx(2);
        const drawTiles = pf.overlay(t.tiles);
        for (let i = 0; i < pf.height; i++) {
            for (let j = 0; j < pf.width; j++) {
                ctx.fillStyle = CANVAS_COLORS[drawTiles.get(j, i)];
                ctx.fillRect(j * tileSize, i * tileSize, tileSize, tileSize);
            }
        }
    }
}
