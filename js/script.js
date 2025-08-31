const GAME_CONFIG = {
    SIZE: 4,
    TILE_SIZE: 91,
    TILE_OFFSET: 10,
    ANIMATION_DURATION: 120,
    MAX_UNDO_MOVES: 5,
    NEW_TILE_PROBABILITY: 0.9, // Probability of getting 2 vs 4
    NEW_TILE_DELAY: 50 // Delay before new tile appears
};

const gameState = {
    board: [],
    score: 0,
    movesCount: 0,
    bestScore: Number(localStorage.getItem("best-score")) || 0,
    isMoving: false,
    tileCounter: 0,
    canUndo: GAME_CONFIG.MAX_UNDO_MOVES,
    previousState: null,
    
    // Touch handling
    touch: {
        initialX: null,
        initialY: null
    },
    
    // Swap tiles feature
    swap: {
        isActive: false,
        firstSelected: null,
        swapsRemaining: 3
    }
};

function initGame() {
    // Reset game state
    gameState.board = Array.from({ length: GAME_CONFIG.SIZE }, () => Array(GAME_CONFIG.SIZE).fill(0));
    gameState.score = 0;
    gameState.movesCount = 0;
    gameState.tileCounter = 0;
    gameState.canUndo = GAME_CONFIG.MAX_UNDO_MOVES;
    gameState.previousState = null;
    gameState.swap.swapsRemaining = 3;
    
    // Clear UI
    $('.tile').remove();
    updateUndoButton();
    updateSwapButton();
    
    // Add initial tiles
    addRandomTile();
    addRandomTile();
    updateUI();
}

function addRandomTile() {
    const emptyPositions = getEmptyPositions();
    if (emptyPositions.length === 0) return;
    
    const [r, c] = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    const value = Math.random() < GAME_CONFIG.NEW_TILE_PROBABILITY ? 2 : 4;
    
    gameState.board[r][c] = { 
        value, 
        id: ++gameState.tileCounter, 
        isNew: true 
    };
}

function getEmptyPositions() {
    const empty = [];
    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
            if (gameState.board[r][c] === 0) {
                empty.push([r, c]);
            }
        }
    }
    return empty;
}

// game mechanics
function moveLeft() {
    if (gameState.isMoving) return;
    saveGameState();

    let changed = false;
    const newBoard = Array.from({ length: GAME_CONFIG.SIZE }, () => Array(GAME_CONFIG.SIZE).fill(0));

    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        const row = gameState.board[r].filter(cell => cell && cell.value > 0);
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
                gameState.score += mergedValue;
                i++; // Skip merged tile
                changed = true;
            } else {
                // Move tile
                newBoard[r][pos] = { ...row[i] };
                if (pos !== findOriginalPosition(row[i].id, gameState.board)[1]) {
                    changed = true;
                }
            }
            pos++;
        }
    }

    finalizeMoveIfChanged(newBoard, changed);
}

function moveRight() {
    if (gameState.isMoving) return;
    saveGameState();

    let changed = false;
    const newBoard = Array.from({ length: GAME_CONFIG.SIZE }, () => Array(GAME_CONFIG.SIZE).fill(0));

    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        const row = gameState.board[r].filter(cell => cell && cell.value > 0);
        let pos = GAME_CONFIG.SIZE - 1;

        for (let i = row.length - 1; i >= 0; i--) {
            if (i > 0 && row[i].value === row[i - 1].value) {
                // Merge tiles
                const mergedValue = row[i].value * 2;
                newBoard[r][pos] = {
                    value: mergedValue,
                    id: row[i].id,
                    merged: true
                };
                gameState.score += mergedValue;
                i--; // Skip merged tile
                changed = true;
            } else {
                // Move tile
                newBoard[r][pos] = { ...row[i] };
                if (pos !== findOriginalPosition(row[i].id, gameState.board)[1]) {
                    changed = true;
                }
            }
            pos--;
        }
    }

    finalizeMoveIfChanged(newBoard, changed);
}

function moveUp() {
    if (gameState.isMoving) return;
    saveGameState();

    let changed = false;
    const newBoard = Array.from({ length: GAME_CONFIG.SIZE }, () => Array(GAME_CONFIG.SIZE).fill(0));

    for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
        const column = [];
        for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
            if (gameState.board[r][c] && gameState.board[r][c].value > 0) {
                column.push(gameState.board[r][c]);
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
                gameState.score += mergedValue;
                i++; // Skip merged tile
                changed = true;
            } else {
                // Move tile
                newBoard[pos][c] = { ...column[i] };
                if (pos !== findOriginalPosition(column[i].id, gameState.board)[0]) {
                    changed = true;
                }
            }
            pos++;
        }
    }

    finalizeMoveIfChanged(newBoard, changed);
}

function moveDown() {
    if (gameState.isMoving) return;
    saveGameState();

    let changed = false;
    const newBoard = Array.from({ length: GAME_CONFIG.SIZE }, () => Array(GAME_CONFIG.SIZE).fill(0));

    for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
        const column = [];
        for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
            if (gameState.board[r][c] && gameState.board[r][c].value > 0) {
                column.push(gameState.board[r][c]);
            }
        }

        let pos = GAME_CONFIG.SIZE - 1;
        for (let i = column.length - 1; i >= 0; i--) {
            if (i > 0 && column[i].value === column[i - 1].value) {
                // Merge tiles
                const mergedValue = column[i].value * 2;
                newBoard[pos][c] = {
                    value: mergedValue,
                    id: column[i].id,
                    merged: true
                };
                gameState.score += mergedValue;
                i--; // Skip merged tile
                changed = true;
            } else {
                // Move tile
                newBoard[pos][c] = { ...column[i] };
                if (pos !== findOriginalPosition(column[i].id, gameState.board)[0]) {
                    changed = true;
                }
            }
            pos--;
        }
    }

    finalizeMoveIfChanged(newBoard, changed);
}

// Swap tiles
function toggleSwapMode() {
    if (gameState.swap.swapsRemaining <= 0 || gameState.isMoving) return;
    
    gameState.swap.isActive = !gameState.swap.isActive;
    gameState.swap.firstSelected = null;
    
    updateSwapButton();
    removeAllHighlights();
    
    // Toggle cursor style for grid
    if (gameState.swap.isActive) {
        $('.game-grid').addClass('swap-mode');
    } else {
        $('.game-grid').removeClass('swap-mode');
    }
}

function handleTileClick(tileId) {
    if (!gameState.swap.isActive || gameState.isMoving) return;
    
    const position = findTilePosition(tileId);
    if (!position) return;
    
    const { row, col } = position;
    
    if (!gameState.swap.firstSelected) {
        // Select first tile
        gameState.swap.firstSelected = { row, col, tileId };
        highlightTile(tileId);
    } else {
        if (gameState.swap.firstSelected.tileId === tileId) {
            // Clicking same tile - deselect
            gameState.swap.firstSelected = null;
            removeAllHighlights();
        } else {
            // Swap the tiles
            performSwap(gameState.swap.firstSelected, { row, col, tileId });
        }
    }
}

function performSwap(first, second) {
    saveGameState();
    
    // Swap the tile objects
    const temp = gameState.board[first.row][first.col];
    gameState.board[first.row][first.col] = gameState.board[second.row][second.col];
    gameState.board[second.row][second.col] = temp;
    
    // Update state
    gameState.swap.swapsRemaining--;
    gameState.swap.isActive = false;
    gameState.swap.firstSelected = null;
    gameState.movesCount++;
    
    // Update UI
    updateUI();
    updateSwapButton();
    removeAllHighlights();
    $('.game-grid').removeClass('swap-mode');
}

function findTilePosition(tileId) {
    const id = parseInt(tileId.split('-')[1]);
    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
            if (gameState.board[r][c] && gameState.board[r][c].id === id) {
                return { row: r, col: c };
            }
        }
    }
    return null;
}

function highlightTile(tileId) {
    $(`#${tileId}`).addClass('selected');
}

function removeAllHighlights() {
    $('.tile').removeClass('selected');
}

function updateSwapButton() {
    const $swapBtn = $('#swap-tiles-buttons');
    
    // Update text
    $swapBtn.find('span').text(`SWAP (${gameState.swap.swapsRemaining})`);
    
    // Update classes
    if (gameState.swap.swapsRemaining <= 0) {
        $swapBtn.addClass('disabled').removeClass('active');
    } else if (gameState.swap.isActive) {
        $swapBtn.addClass('active').removeClass('disabled');
    } else {
        $swapBtn.removeClass('active disabled');
    }
}

function saveGameState() {
    gameState.previousState = {
        board: JSON.parse(JSON.stringify(gameState.board)),
        score: gameState.score,
        tileCounter: gameState.tileCounter
    };
}

// undo fucntion
function undoMove() {
    if (!gameState.canUndo || !gameState.previousState || gameState.isMoving) return;

    gameState.board = gameState.previousState.board;
    gameState.score = gameState.previousState.score;
    gameState.tileCounter = gameState.previousState.tileCounter;
    gameState.movesCount--;
    gameState.canUndo--;
    
    updateUI();
    updateUndoButton();
}

function updateUndoButton() {
    const hasUndo = gameState.canUndo > 0 && gameState.movesCount > 0;
    $('#undo-button').prop('disabled', !hasUndo);
    $('#undo-turns').text(gameState.canUndo);
}

// utility fucntion
function getPosition(row, col) {
    return {
        x: col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_OFFSET,
        y: row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_OFFSET
    };
}

function findOriginalPosition(id, originalBoard) {
    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
            if (originalBoard[r][c] && originalBoard[r][c].id === id) {
                return [r, c];
            }
        }
    }
    return [-1, -1];
}

function finalizeMoveIfChanged(newBoard, changed) {
    if (changed) {
        gameState.board = newBoard;
        afterMove();
    }
}

function afterMove() {
    gameState.isMoving = true;
    gameState.movesCount++;
    updateUI();
    updateUndoButton();
    
    // Add new tile after short delay
    setTimeout(() => {
        addRandomTile();
        updateUI();
    }, GAME_CONFIG.NEW_TILE_DELAY);

    // Complete move after animation
    setTimeout(() => {
        updateBestScore();
        
        if (checkGameOver()) {
            showDialogBox({
                heading: 'Game Over',
                message: 'Do you want to restart the game?',
                button: "Restart Game"
            });
        }
        
        gameState.isMoving = false;
    }, GAME_CONFIG.ANIMATION_DURATION);
}

function updateBestScore() {
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem("best-score", gameState.bestScore);
    }
}

// check game over 
function checkGameOver() {
    // Check for empty cells
    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
            if (!gameState.board[r][c]) return false;
        }
    }

    // Check for possible merges
    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
            const current = gameState.board[r][c].value;
            if (c < GAME_CONFIG.SIZE - 1 && gameState.board[r][c + 1] && current === gameState.board[r][c + 1].value) return false;
            if (r < GAME_CONFIG.SIZE - 1 && gameState.board[r + 1][c] && current === gameState.board[r + 1][c].value) return false;
        }
    }
    return true;
}

// update ui after move, undo, swap
function updateUI() {
    const existingTiles = new Set();

    for (let r = 0; r < GAME_CONFIG.SIZE; r++) {
        for (let c = 0; c < GAME_CONFIG.SIZE; c++) {
            const cell = gameState.board[r][c];
            if (!cell) continue;

            const tileId = `tile-${cell.id}`;
            const pos = getPosition(r, c);
            let $tile = $(`#${tileId}`);

            if ($tile.length === 0) {
                // Create new tile
                $tile = createTileElement(cell, tileId, pos);
                $(".tile-layer").append($tile);
                
                if (cell.isNew) {
                    setTimeout(() => {
                        cell.isNew = false;
                        $tile.removeClass('new-tile');
                    }, 200);
                }
            } else {
                // Update existing tile
                updateExistingTile($tile, cell, pos);
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

    updateScoreDisplay();
}

function createTileElement(cell, tileId, pos) {
    return $(`<div class="tile ${cell.isNew ? 'new-tile' : ''}" data-tile-value="${cell.value}" id="${tileId}" style="top: ${pos.y}px; left: ${pos.x}px;">${cell.value}</div>`);
}

function updateExistingTile($tile, cell, pos) {
    $tile.text(cell.value).attr("data-tile-value", cell.value);
    $tile.css({ top: `${pos.y}px`, left: `${pos.x}px` });

    if (cell.merged) {
        $tile.addClass('merged');
        setTimeout(() => {
            cell.merged = false;
            $tile.removeClass('merged');
        }, 200);
    }
}

// update score
function updateScoreDisplay() {
    $("#score").text(gameState.score);
    gameState.bestScore = Math.max(gameState.bestScore, gameState.score);
    $("#best-score").text(gameState.bestScore);
    localStorage.setItem("best-score", gameState.bestScore);
}

// touch functions
function startTouch(e) {
    gameState.touch.initialX = e.touches[0].clientX;
    gameState.touch.initialY = e.touches[0].clientY;
}

function moveTouch(e) {
    if (gameState.touch.initialX === null || gameState.touch.initialY === null) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const diffX = gameState.touch.initialX - currentX;
    const diffY = gameState.touch.initialY - currentY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
        // Horizontal swipe
        diffX > 0 ? moveLeft() : moveRight();
    } else if (Math.abs(diffY) > minSwipeDistance) {
        // Vertical swipe
        diffY > 0 ? moveUp() : moveDown();
    }
    
    gameState.touch.initialX = gameState.touch.initialY = null;
}

// dialog box managing fucntion
function showDialogBox(config) {
    const $box = $('#dialog-box .message').eq(0);
    $box.children('.message-heading').eq(0).text(config.heading);
    $box.children('.message-text').eq(0).text(config.message);
    $('#dialog-box button').eq(0).text(config.button);
    $('#dialog-box')[0].showModal();
}

function closeDialog(callback) {
    $('#dialog-box').addClass('closing');
    setTimeout(() => {
        $('#dialog-box').removeClass('closing');
        $('#dialog-box')[0].close();
        if (callback) callback();
    }, 250);
}

// event handlers
$(document).ready(function () {
    // Keyboard controls
    $(document).on('keydown', function (e) {
        if (gameState.isMoving) return;

        const keyMap = {
            'ArrowLeft': moveLeft,
            'a': moveLeft,
            'ArrowRight': moveRight,
            'd': moveRight,
            'ArrowUp': moveUp,
            'w': moveUp,
            'ArrowDown': moveDown,
            's': moveDown
        };

        if (keyMap[e.key]) {
            e.preventDefault();
            keyMap[e.key]();
        }
    });
    
    // Touch controls
    $('.game-grid')
        .on('touchstart', startTouch)
        .on('touchmove', moveTouch);
    
    // Tile clicks for swap mode
    $(document).on('click', '.tile', function() {
        handleTileClick(this.id);
    });
    
    // Button handlers
    $('#new-game').click(() => {
        showDialogBox({
            heading: 'New Game',
            message: 'Do you want to start a new game?',
            button: "Start New Game"
        });
    });
    
    $('#swap-tiles-buttons').click(function() {
        if (!$(this).hasClass('disabled')) {
            toggleSwapMode();
        }
    });
    
    $('#dialog-box button').click(function(e) {
        e.preventDefault();
        closeDialog(() => {
            if (this.value === 'new-game') {
                initGame();
            }
        });
    });
    
    $('#undo-button').click(undoMove);
    
    // Initialize game
    initGame();
});