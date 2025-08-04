const SIZE = 4;
const TILE_SIZE = 91;
const TILE_OFFSET = 10;

let board = [];
let score = 0;
let bestScore = Number(localStorage.getItem("best-2048")) || 0;

function initGame() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    addRandomTile();
    addRandomTile();
    updateUI();
}

function addRandomTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) empty.push([r, c]);
        }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function getPosition(row, col) {
    return {
        x: col * TILE_SIZE + TILE_OFFSET,
        y: row * TILE_SIZE + TILE_OFFSET
    };
}

function updateUI() {
    const existingTiles = new Set();

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const val = board[r][c];
            if (!val) continue;

            const tileId = `tile-r${r}-c${c}`;
            const pos = getPosition(r, c);
            let $tile = $(`#${tileId}`);

            if ($tile.length === 0) {
                $tile = $(`<div class="tile" data-tile-value="${val}" id="${tileId}">${val}</div>`);
                $(".tile-layer").append($tile);
            } else {
                $tile.text(val).attr("data-tile-value", val);
            }

            $tile.css({ top: `${pos.y}px`, left: `${pos.x}px` });
            existingTiles.add(tileId);
        }
    }

    $(".tile").each(function () {
        if (!existingTiles.has(this.id)) $(this).remove();
    });

    $("#score").text(score);
    $("#best-score").text(bestScore);
}

function moveLeft() {
    let changed = false;
    for (let r = 0; r < SIZE; r++) {
        let row = board[r].filter(x => x);
        for (let i = 0; i < row.length - 1; i++) {
            if (row[i] === row[i + 1]) {
                row[i] *= 2;
                score += row[i];
                row[i + 1] = 0;
                i++;
                changed = true;
            }
        }
        row = row.filter(x => x);
        while (row.length < SIZE) row.push(0);
        if (!arraysEqual(row, board[r])) changed = true;
        board[r] = row;
    }
    if (changed) afterMove();
}

function moveRight() {
    reverseRows();
    moveLeft();
    reverseRows();
    updateUI();
}

function moveUp() {
    transpose();
    moveLeft();
    transpose();
    updateUI();
}

function moveDown() {
    transpose();
    moveRight();
    transpose();
    updateUI();
}

function afterMove() {
    addRandomTile();
    updateUI();
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("best-2048", bestScore);
    }
    if (checkGameOver()) {
        setTimeout(() => alert("Game Over!"), 100);
    }
}

function transpose() {
    board = board[0].map((_, c) => board.map(row => row[c]));
}

function reverseRows() {
    board = board.map(row => [...row].reverse());
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

function checkGameOver() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) return false;
            if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return false;
            if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return false;
        }
    }
    return true;
}

$(document).ready(function () {
    $('#new-game').on('click', initGame);

    $(document).on('keydown', function (e) {
        switch (e.key) {
            case "ArrowLeft": moveLeft(); break;
            case "ArrowRight": moveRight(); break;
            case "ArrowUp": moveUp(); break;
            case "ArrowDown": moveDown(); break;
        }
    });

    initGame();
});
