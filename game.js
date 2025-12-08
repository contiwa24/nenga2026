// Canvas要素と描画コンテキストを取得
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// ★★★ グローバル変数の定義 ★★★
let x;
let y;
let dx;
let dy;
const initialSpeedFactor = 0.004;
const ballRadius = 10;

let paddleWidth;
let paddleX;

// ブロックの定数
const brickRowCount = 10;
const brickColumnCount = 10;
const brickPadding = 0;
let brickWidth;
let brickHeight;
const paddleHeight = 10;
const brickOffsetTop = 30;
let brickOffsetLeft = 0;

// D-Pad操作設定
let dPadRightPressed = false;
let dPadLeftPressed = false;
const dPadButtonSize = 50;
const dPadPadding = 10;
let dPadLeftX, dPadRightX, dPadY;

let isGameStarted = false;
let gameOver = false;
let animationId;

let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER', 'CLEARED'
let lives = 3;
let ballOnPaddle = false;

// リスタートボタンの設定
const actionButtonWidth = 150;
const actionButtonHeight = 40;
let actionButtonX;
let actionButtonY;

// 画面サイズに応じたメニュー表示用変数
let menuTitleFontSize;
let menuSubtitleFontSize;
let menuTitleY;
let menuSubtitleY;


// ブロック群の画像ロード処理 (PNG)
const bricksImage = new Image();
bricksImage.src = 'initial_bricks_layout.png';

// 隠し画像ロード処理 (PNG)
const hiddenImage = new Image();
hiddenImage.src = 'hidden_background.png';

// ブロック配列
const bricks = [];

// --- ゲーム開始/リスタート 関数 ---
function startGame() {
    const speed = canvas.height * initialSpeedFactor;
    dx = speed;
    dy = -speed;

    gameState = 'PLAYING';
    gameOver = false;
    isGameStarted = false;

    dPadLeftPressed = false;
    dPadRightPressed = false;

    resizeGame();

    // すべてのブロックを status: 1 (存在する状態) で初期化
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const brickX = (c * brickWidth) + brickOffsetLeft;
            const brickY = (r * brickHeight) + brickOffsetTop;
            bricks[c][r] = { x: brickX, y: brickY, status: 1 };
        }
    }

    resetBallPosition();
}

function restartGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    lives = 3;
    startGame();
}

function resetBallPosition() {
    ballOnPaddle = true;

    paddleX = (canvas.width - paddleWidth) / 2;

    x = paddleX + paddleWidth / 2;
    y = canvas.height - paddleHeight - ballRadius;

    const speed = canvas.height * initialSpeedFactor;
    dx = speed;
    dy = -speed;
}

// --- イベントリスナーの削除関数 ---
function removeEventListeners() {
    canvas.removeEventListener('mousedown', dPadHandler);
    canvas.removeEventListener('mouseup', dPadHandler);
    canvas.removeEventListener('touchstart', dPadHandler);
    canvas.removeEventListener('touchend', dPadHandler);
}

// --- サイズ計算と初期化を行う関数 ---
function resizeGame() {
    const initialWindowWidth = window.innerWidth;
    const initialWindowHeight = window.innerHeight;

    canvas.height = initialWindowHeight;

    // 縦幅を大きくするため 0.05 に設定
    brickHeight = canvas.height * 0.05;
    const totalBrickHeight = brickRowCount * brickHeight;

    let calculatedCanvasWidth;

    const imageToUse = bricksImage.complete ? bricksImage : hiddenImage;

    if (imageToUse.complete) {
        const imageRatio = imageToUse.width / imageToUse.height;
        const requiredWidthByRatio = totalBrickHeight * imageRatio;

        // 最大幅をウィンドウ幅の 90% (0.90) に設定し、表示を大きくする
        const maxCanvasWidth = initialWindowWidth * 0.90;

        if (requiredWidthByRatio > maxCanvasWidth) {
            calculatedCanvasWidth = maxCanvasWidth;
        } else {
            calculatedCanvasWidth = requiredWidthByRatio;
        }

    } else {
        // 画像未ロード時は、暫定で画面幅の90%を設定
        calculatedCanvasWidth = initialWindowWidth * 0.90;
    }

    canvas.width = calculatedCanvasWidth;

    paddleWidth = canvas.width * 0.3;
    if (paddleX === undefined || !isGameStarted) {
        paddleX = (canvas.width - paddleWidth) / 2;
    } else {
        if (paddleX > canvas.width - paddleWidth) paddleX = canvas.width - paddleWidth;
    }

    brickWidth = canvas.width / brickColumnCount;
    brickOffsetLeft = 0;

    dPadY = canvas.height - dPadButtonSize - dPadPadding;
    dPadLeftX = dPadPadding;
    dPadRightX = canvas.width - dPadButtonSize - dPadPadding;

    // メニュー/ゲームオーバー画面の文字サイズを「横幅」基準にする
    menuTitleFontSize = canvas.width * 0.1;
    if (menuTitleFontSize > 60) menuTitleFontSize = 60;

    menuSubtitleFontSize = canvas.width * 0.045;
    if (menuSubtitleFontSize > 20) menuSubtitleFontSize = 20;

    menuTitleY = canvas.height * 0.3;
    menuSubtitleY = canvas.height * 0.5;
    actionButtonX = canvas.width / 2 - actionButtonWidth / 2;
    actionButtonY = canvas.height * 0.6;

    if (dx === undefined || dy === undefined) {
        const speed = canvas.height * initialSpeedFactor;
        dx = speed;
        dy = -speed;
    }

    if (!isGameStarted) {
        x = canvas.width / 2;
        y = canvas.height - 50;

        // resizeGameの初期化時も、すべてのブロックを生成
        if (bricks.length === 0 || gameState === 'MENU') {
            for (let c = 0; c < brickColumnCount; c++) {
                bricks[c] = [];
                for (let r = 0; r < brickRowCount; r++) {
                    const brickX = (c * brickWidth) + brickOffsetLeft;
                    const brickY = (r * brickHeight) + brickOffsetTop;
                    bricks[c][r] = { x: brickX, y: brickY, status: 1 };
                }
            }
        } else {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    const brickX = (c * brickWidth) + brickOffsetLeft;
                    const brickY = (r * brickHeight) + brickOffsetTop;
                    if (bricks[c][r]) {
                        bricks[c][r].x = brickX;
                        bricks[c][r].y = brickY;
                    }
                }
            }
        }

        removeEventListeners();
        canvas.addEventListener('mousedown', dPadHandler);
        canvas.addEventListener('mouseup', dPadHandler);
        canvas.addEventListener('touchstart', dPadHandler);
        canvas.addEventListener('touchend', dPadHandler);

        isGameStarted = true;
        draw();

    } else {
        if (x !== undefined && y !== undefined && !ballOnPaddle) {
            x = Math.min(Math.max(x, ballRadius), canvas.width - ballRadius);
            y = Math.min(Math.max(y, ballRadius), canvas.height - ballRadius);
        }

        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const brickX = (c * brickWidth) + brickOffsetLeft;
                const brickY = (r * brickHeight) + brickOffsetTop;
                if (bricks[c][r]) {
                    bricks[c][r].x = brickX;
                    bricks[c][r].y = brickY;
                }
            }
        }
    }
}

window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);


// --- D-Pad/スタート/リスタート ボタン ハンドラ ---
function dPadHandler(e) {
    e.preventDefault();
    const isDown = (e.type === 'mousedown' || e.type === 'touchstart');
    const isUp = (e.type === 'mouseup' || e.type === 'touchend');

    let clientX, clientY;
    if (e.type === 'touchstart' || e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else if (e.type === 'touchend') {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // MENU, GAMEOVER, CLEARED 画面でのボタン操作
    if ((gameState === 'MENU' || gameOver || gameState === 'CLEARED') && isUp) {
        const isActionButton =
            relativeX > actionButtonX &&
            relativeX < actionButtonX + actionButtonWidth &&
            relativeY > actionButtonY &&
            relativeY < actionButtonY + actionButtonHeight;

        if (isActionButton) {
            if (gameState === 'MENU' || gameOver || gameState === 'CLEARED') {
                restartGame();
            }
            return;
        }
    }

    if (gameState === 'PLAYING' && !gameOver) {
        const isLeftButton = relativeX > dPadLeftX && relativeX < dPadLeftX + dPadButtonSize && relativeY > dPadY && relativeY < dPadY + dPadButtonSize;
        const isRightButton = relativeX > dPadRightX && relativeX < dPadRightX + dPadButtonSize && relativeY > dPadY && relativeY < dPadY + dPadButtonSize;

        if (ballOnPaddle && isUp && !isLeftButton && !isRightButton) {
            ballOnPaddle = false;
        }

        if (isDown) {
            dPadLeftPressed = false;
            dPadRightPressed = false;

            if (isLeftButton) {
                dPadLeftPressed = true;
            } else if (isRightButton) {
                dPadRightPressed = true;
            }
        } else if (isUp) {
            dPadLeftPressed = false;
            dPadRightPressed = false;
        }
    }
}


// --- 描画関数 ---

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);

    // 塗りつぶし（ボール本体の色: #00CC00）
    ctx.fillStyle = "#00CC00";
    ctx.fill();

    // 縁取り（色: #009900）
    ctx.strokeStyle = "#009900";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#333333";
    ctx.fill();
    ctx.closePath();
}

function drawDPad() {
    // 左ボタン
    ctx.beginPath();
    ctx.rect(dPadLeftX, dPadY, dPadButtonSize, dPadButtonSize);
    ctx.fillStyle = dPadLeftPressed ? "#AAAAAA" : "#666666";
    ctx.fill();

    ctx.font = '24px Arial';
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = 'center';
    ctx.fillText('◀', dPadLeftX + dPadButtonSize / 2, dPadY + dPadButtonSize / 2 + 8);
    ctx.closePath();

    // 右ボタン
    ctx.beginPath();
    ctx.rect(dPadRightX, dPadY, dPadButtonSize, dPadButtonSize);
    ctx.fillStyle = dPadRightPressed ? "#AAAAAA" : "#666666";
    ctx.fill();
    ctx.closePath();

    // 右ボタンテキスト
    ctx.font = '24px Arial';
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = 'center';
    ctx.fillText('▶', dPadRightX + dPadButtonSize / 2, dPadY + dPadButtonSize / 2 + 8);
}

function drawLives() {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = "#333333";
    ctx.textAlign = 'right';
    ctx.fillText('残機: ' + lives, canvas.width - 15, 20);
}

function drawTapToStart() {
    if (ballOnPaddle) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = "#333333";
        ctx.textAlign = 'center';

        // ブロックの下端を基準にする
        const bricksBottomY = brickOffsetTop + (brickRowCount * brickHeight);
        // ブロックの下端から少し下に表示位置を設定
        const tapToStartDisplayY = bricksBottomY + 50;

        ctx.fillText('TAP TO START', canvas.width / 2, tapToStartDisplayY);
    }
}

// --- 描画関数: ブロックの個別描画 ---
function drawBricks() {
    if (!bricksImage.complete) return;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];

            if (b.status === 1) {
                const sx = (bricksImage.width / brickColumnCount) * c;
                const sy = (bricksImage.height / brickRowCount) * r;
                const sWidth = bricksImage.width / brickColumnCount;
                const sHeight = bricksImage.height / brickRowCount;

                ctx.drawImage(
                    bricksImage,
                    sx, sy, sWidth, sHeight,
                    b.x, b.y, brickWidth, brickHeight
                );
            }
        }
    }
}

// --- テキストを折り返して描画するヘルパー関数 ---
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    let words = text.split('');
    let line = '';

    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n];
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n];
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

function drawMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `bold ${menuTitleFontSize}px Arial`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = 'center';
    ctx.fillText('ブロック崩しゲーム', canvas.width / 2, menuTitleY);

    ctx.font = `${menuSubtitleFontSize}px Arial`;
    ctx.fillStyle = "#CCCCCC";

    // 説明文を折り返して表示
    drawWrappedText(
        ctx,
        '画面下のパドルを左右に操作してボールを打ち返そう！',
        canvas.width / 2,
        menuSubtitleY,
        canvas.width * 0.9,
        menuSubtitleFontSize * 1.5
    );

    ctx.beginPath();
    ctx.rect(actionButtonX, actionButtonY, actionButtonWidth, actionButtonHeight);
    ctx.fillStyle = "#00DD00";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText('START', canvas.width / 2, actionButtonY + 28);
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `bold ${menuTitleFontSize}px Arial`;
    ctx.fillStyle = "#FF0000";
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, menuTitleY);

    ctx.beginPath();
    ctx.rect(actionButtonX, actionButtonY, actionButtonWidth, actionButtonHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText('RESTART', canvas.width / 2, actionButtonY + 28);
}

// ゲームクリア画面を描画する関数
function drawWin() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `bold ${menuTitleFontSize}px Arial`;
    ctx.fillStyle = "#00FF00";
    ctx.textAlign = 'center';
    ctx.fillText('HAPPY NEW YEAR!!', canvas.width / 2, menuTitleY);

    ctx.beginPath();
    ctx.rect(actionButtonX, actionButtonY, actionButtonWidth, actionButtonHeight);
    ctx.fillStyle = "#00DD00";
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText('RESTART', canvas.width / 2, actionButtonY + 28);
}


// --- 衝突判定 ---
function collisionDetection() {
    if (ballOnPaddle) return;

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];

            if (b.status === 1) {
                const ballX = x;
                const ballY = y;
                const brickCenterX = b.x + brickWidth / 2;
                const brickCenterY = b.y + brickHeight / 2;
                const dxCenter = ballX - brickCenterX;
                const dyCenter = ballY - brickCenterY;

                if (ballX + ballRadius > b.x && ballX - ballRadius < b.x + brickWidth &&
                    ballY + ballRadius > b.y && ballY - ballRadius < b.y + brickHeight) {

                    b.status = 0;

                    const combinedHalfWidths = brickWidth / 2 + ballRadius;
                    const combinedHalfHeights = brickHeight / 2 + ballRadius;
                    const absDX = Math.abs(dxCenter);
                    const absDY = Math.abs(dyCenter);
                    const overlapX = combinedHalfWidths - absDX;
                    const overlapY = combinedHalfHeights - absDY;

                    if (overlapX > overlapY) {
                        dy = -dy;
                    } else if (overlapX < overlapY) {
                        dx = -dx;
                    } else {
                        dx = -dx;
                        dy = -dy;
                    }
                    return;
                }
            }
        }
    }
}

// ゲームクリア判定を行う関数
function checkWin() {
    let allBricksBroken = true;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                allBricksBroken = false;
                break;
            }
        }
        if (!allBricksBroken) {
            break;
        }
    }

    if (allBricksBroken) {
        gameState = 'CLEARED';
    }
}

// --- メイン描画ループ ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (hiddenImage.complete) {
        const totalBricksWidth = brickColumnCount * brickWidth;
        const totalBricksHeight = brickRowCount * brickHeight;

        ctx.drawImage(
            hiddenImage,
            0, 0, hiddenImage.width, hiddenImage.height,
            brickOffsetLeft, brickOffsetTop, totalBricksWidth, totalBricksHeight
        );
    }

    drawBricks();

    if (gameState === 'MENU') {
        drawMenu();
        animationId = requestAnimationFrame(draw);
        return;
    }

    if (gameState === 'CLEARED') {
        drawWin();
        animationId = requestAnimationFrame(draw);
        return;
    }

    drawBall();
    drawPaddle();
    drawDPad();
    drawLives();
    drawTapToStart();

    if (gameOver) {
        drawGameOver();
        animationId = requestAnimationFrame(draw);
        return;
    }

    collisionDetection();
    checkWin();

    if (dPadRightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (dPadLeftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    if (ballOnPaddle) {
        x = paddleX + paddleWidth / 2;
        y = canvas.height - paddleHeight - ballRadius;
    } else {
        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
            dx = -dx;
        }
        if (y + dy < ballRadius) {
            dy = -dy;
        } else if (y + dy > canvas.height - ballRadius) {
            if (x > paddleX && x < paddleX + paddleWidth) {
                dy = -dy;
                const paddleCenterX = paddleX + paddleWidth / 2;
                const relativeIntersectX = x - paddleCenterX;
                const currentSpeed = Math.sqrt(dx * dx + dy * dy);
                const normalizedRelativeIntersectionX = relativeIntersectX / (paddleWidth / 2);
                dx = currentSpeed * normalizedRelativeIntersectionX * 0.8;

                if (Math.abs(dx) < 1) {
                    dx = (dx >= 0 ? 1 : -1);
                }
                dy = Math.sign(dy) * Math.sqrt(currentSpeed * currentSpeed - dx * dx);

            } else {
                lives--;
                if (lives <= 0) {
                    gameOver = true;
                } else {
                    resetBallPosition();
                }
            }
        }
        x += dx;
        y += dy;
    }

    animationId = requestAnimationFrame(draw);
}
