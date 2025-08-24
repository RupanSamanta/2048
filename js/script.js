const SIZE = 4;
const TILE_SIZE = 91;
const TILE_OFFSET = 10;
const ANIMATION_DURATION = 120;

let board = [];
let score = 0;
let bestScore = Number(localStorage.getItem("best-score")) || 0;
let isMoving = false; // Prevent multiple moves during animation
let tileCounter = 0; // Unique tile IDs
let initialX = null;
let initialY = null;

function initGame() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    tileCounter = 0;
    $('.tile').remove(); // Clear all tiles
    addRandomTile();
    addRandomTile();
    updateUI();
}

function addRandomTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) 
              empty.push([r, c]);
        }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    board[r][c] = { value, id: ++tileCounter, isNew: true };
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
            const cell = board[r][c];
            if (!cell) continue;

            const tileId = `tile-${cell.id}`;
            const pos = getPosition(r, c);
            let $tile = $(`#${tileId}`);

            if ($tile.length === 0) {
                // Create new tile with immediate positioning to avoid jump
                $tile = $(`<div class="tile ${cell.isNew ? 'new-tile' : ''}" data-tile-value="${cell.value}" id="${tileId}" style="top: ${pos.y}px; left: ${pos.x}px;">${cell.value}</div>`);
                $(".tile-layer").append($tile);

                // Remove new-tile class after animation
                if (cell.isNew) {
                    setTimeout(() => {
                        cell.isNew = false;
                        $tile.removeClass('new-tile');
                    }, 200);
                }
            } else {
                // Update existing tile
                $tile.text(cell.value).attr("data-tile-value", cell.value);
                $tile.css({ top: `${pos.y}px`, left: `${pos.x}px` });

                // Add merged animation if this tile was just merged
                if (cell.merged) {
                    $tile.addClass('merged');
                    setTimeout(() => {
                        cell.merged = false;
                        $tile.removeClass('merged');
                    }, 200);
                }
            }

            existingTiles.add(tileId);
        }
    }

    // Remove tiles that no longer exist
    $(".tile").each(function () {
        if (!existingTiles.has(this.id)) {
            $(this).remove();
        }
    });

    $("#score").text(score);
    bestScore = Math.max(bestScore, score);
    $("#best-score").text(bestScore);
    localStorage.setItem("best-score", bestScore);
}

function moveLeft() {
    if (isMoving) return;

    let changed = false;
    const newBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

    for (let r = 0; r < SIZE; r++) {
        const row = board[r].filter(cell => cell && cell.value > 0);
        let pos = 0;

        for (let i = 0; i < row.length; i++) {
            if (i < row.length - 1 && row[i].value === row[i + 1].value) {
                // Merge tiles
                const mergedValue = row[i].value * 2;
                newBoard[r][pos] = {
                    value: mergedValue,
                    id: row[i].id,
                    merged: true
                };
                score += mergedValue;
                i++; // Skip the next tile as it's been merged
                changed = true;
            } else {
                // Move tile
                newBoard[r][pos] = { ...row[i] };
                if (pos !== findOriginalPosition(row[i].id, board)[1]) {
                    changed = true;
                }
            }
            pos++;
        }
    }

    if (changed) {
        board = newBoard;
        afterMove();
    }
}

function findOriginalPosition(id, originalBoard) {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (originalBoard[r][c] && originalBoard[r][c].id === id) {
                return [r, c];
            }
        }
    }
    return [-1, -1];
}

function moveRight() {
    if (isMoving) return;

    let changed = false;
    const newBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

    for (let r = 0; r < SIZE; r++) {
        const row = board[r].filter(cell => cell && cell.value > 0);
        let pos = SIZE - 1;

        for (let i = row.length - 1; i >= 0; i--) {
            if (i > 0 && row[i].value === row[i - 1].value) {
                // Merge tiles
                const mergedValue = row[i].value * 2;
                newBoard[r][pos] = {
                    value: mergedValue,
                    id: row[i].id,
                    merged: true
                };
                score += mergedValue;
                i--; // Skip the next tile as it's been merged
                changed = true;
            } else {
                // Move tile
                newBoard[r][pos] = { ...row[i] };
                if (pos !== findOriginalPosition(row[i].id, board)[1]) {
                    changed = true;
                }
            }
            pos--;
        }
    }

    if (changed) {
        board = newBoard;
        afterMove();
    }
}

function moveUp() {
    if (isMoving) return;

    let changed = false;
    const newBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

    for (let c = 0; c < SIZE; c++) {
        const column = [];
        for (let r = 0; r < SIZE; r++) {
            if (board[r][c] && board[r][c].value > 0) {
                column.push(board[r][c]);
            }
        }

        let pos = 0;
        for (let i = 0; i < column.length; i++) {
            if (i < column.length - 1 && column[i].value === column[i + 1].value) {
                // Merge tiles
                const mergedValue = column[i].value * 2;
                newBoard[pos][c] = {
                    value: mergedValue,
                    id: column[i].id,
                    merged: true
                };
                score += mergedValue;
                i++; // Skip the next tile as it's been merged
                changed = true;
            } else {
                // Move tile
                newBoard[pos][c] = { ...column[i] };
                if (pos !== findOriginalPosition(column[i].id, board)[0]) {
                    changed = true;
                }
            }
            pos++;
        }
    }

    if (changed) {
        board = newBoard;
        afterMove();
    }
}

function moveDown() {
    if (isMoving) return;

    let changed = false;
    const newBoard = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

    for (let c = 0; c < SIZE; c++) {
        const column = [];
        for (let r = 0; r < SIZE; r++) {
            if (board[r][c] && board[r][c].value > 0) {
                column.push(board[r][c]);
            }
        }

        let pos = SIZE - 1;
        for (let i = column.length - 1; i >= 0; i--) {
            if (i > 0 && column[i].value === column[i - 1].value) {
                // Merge tiles
                const mergedValue = column[i].value * 2;
                newBoard[pos][c] = {
                    value: mergedValue,
                    id: column[i].id,
                    merged: true
                };
                score += mergedValue;
                i--; // Skip the next tile as it's been merged
                changed = true;
            } else {
                // Move tile
                newBoard[pos][c] = { ...column[i] };
                if (pos !== findOriginalPosition(column[i].id, board)[0]) {
                    changed = true;
                }
            }
            pos--;
        }
    }

    if (changed) {
        board = newBoard;
        afterMove();
    }
}

function afterMove() {
    isMoving = true;
    updateUI();

    // Add new tile quickly after move starts, not after animation completes
    setTimeout(() => {
        addRandomTile();
        updateUI();
    }, 50); // Much shorter delay - new tile appears while other tiles are still moving

    setTimeout(() => {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("best-score", bestScore);
        }

        if (checkGameOver()) {
            setTimeout(() => alert("Game Over!"), 100);
        }

        isMoving = false;
    }, ANIMATION_DURATION);
}

function checkGameOver() {
    // Check for empty cells
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (!board[r][c]) return false;
        }
    }

    // Check for possible merges
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const current = board[r][c].value;
            if (c < SIZE - 1 && board[r][c + 1] && current === board[r][c + 1].value) return false;
            if (r < SIZE - 1 && board[r + 1][c] && current === board[r + 1][c].value) return false;
        }
    }
    return true;
}

function startTouch(e) {
   initialX = e.touches[0].clientX;
   initialY = e.touches[0].clientY;
}

function moveTouch(e) {
   if (initialX === null || initialY === null) {
      return;
   }
   let currentX = e.touches[0].clientX;
   let currentY = e.touches[0].clientY;
   
   let diffX = initialX - currentX;
   let diffY = initialY - currentY;
   
   if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
         moveLeft();
      } else {
         moveRight();
      }
   } else {
      if (diffY > 0) {
         moveUp();
      } else {
         moveDown();
      }
   }
   initialX = initialY = null;
}

$(document).ready(function () {
    $(document).on('keydown', function (e) {
        if (isMoving) return; // Prevent moves during animation

        switch (e.key) {
            case "ArrowLeft":
            case "a":
                e.preventDefault();
                moveLeft();
                break;
            case "ArrowRight":
            case "d":
                e.preventDefault();
                moveRight();
                break;
            case "ArrowUp":
            case "w":
                e.preventDefault();
                moveUp();
                break;
            case "ArrowDown":
            case "s":
                e.preventDefault();
                moveDown();
                break;
        }
    });
    
    $('.game-grid')
    .on('touchstart', startTouch)
    .on('touchmove', moveTouch);
    
    $('#new-game').click(()=> {
       $('#dialog-box')[0].showModal();
    });
    
    $('#dialog-box button').click(function(e) {
       e.preventDefault();
       $('#dialog-box').addClass('closing');
       setTimeout(()=> {
          $('#dialog-box').removeClass('closing')
          $('#dialog-box')[0].close();
          if (this.value == 'new-game')
             initGame();
       }, 250);
    });
    
    initGame();
});
