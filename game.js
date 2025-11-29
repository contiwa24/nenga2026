// Canvas要素と描画コンテキストを取得
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// ★★★ グローバル変数の定義 ★★★
let x;
let y;
let dx; // 動的に設定
let dy; // 動的に設定
// ★★★ 速度調整: 0.0125 から 0.007 に変更 (速度が遅くなる) ★★★
const initialSpeedFactor = 0.007;
const ballRadius = 10;

let paddleWidth;
let paddleX;

// ブロックの定数
const brickRowCount = 10;
const brickColumnCount = 14;
const brickPadding = 0;
let brickWidth;
let brickHeight;
const paddleHeight = 10;
const brickOffsetTop = 0;
let brickOffsetLeft = 0;

// D-Pad操作設定
let dPadRightPressed = false;
let dPadLeftPressed = false;
const dPadButtonSize = 50;
const dPadPadding = 10;
let dPadLeftX, dPadRightX, dPadY; // 描画座標

let isGameStarted = false;
let gameOver = false;

// リスタートボタンの設定
const restartButtonWidth = 150;
const restartButtonHeight = 40;
let restartButtonX;
let restartButtonY;

// ブロック群の画像ロード処理
const bricksImage = new Image();
bricksImage.src = 'initial_bricks_layout.png';

// ブロック配列（座標とサイズは resizeGame で更新される）
const bricks = [];

// --- ゲームリスタート関数 ---
function restartGame() {
    // ブロックの状態をリセット
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c] && bricks[c][r]) {
                bricks[c][r].status = 1;
            }
        }
    }

    // フラグと位置を初期化
    gameOver = false;
    isGameStarted = false;
    x = undefined;
    y = undefined;
    dPadLeftPressed = false;
    dPadRightPressed = false;

    // ★★★ 修正: 速度を再計算 ★★★
    const speed = canvas.height * initialSpeedFactor;
    dx = speed;
    dy = -speed;

    // 全ての変数を初期化し、再描画を開始
    resizeGame();
}

// --- サイズ計算と初期化を行う関数 ---
function resizeGame() {
    // 1. Canvasの描画サイズを現在のウィンドウサイズに設定
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 2. ゲーム要素のサイズと位置を再計算

    // パドルのサイズと位置
    paddleWidth = canvas.width * 0.15;
    paddleX = (canvas.width - paddleWidth) / 2;

    // ブロックのサイズとオフセット
    brickWidth = canvas.width / brickColumnCount;
    brickHeight = canvas.height * 0.04;
    brickOffsetLeft = 0;

    // D-Padの描画座標を計算
    dPadY = canvas.height - dPadButtonSize - dPadPadding;
    dPadLeftX = dPadPadding;
    dPadRightX = canvas.width - dPadButtonSize - dPadPadding;

    // リスタートボタンの座標計算
    restartButtonX = canvas.width / 2 - restartButtonWidth / 2;
    restartButtonY = canvas.height / 2 + 30;

    // ★★★ ボール速度を画面サイズに合わせて動的に設定 ★★★
    const speed = canvas.height * initialSpeedFactor;
    dx = speed;
    dy = -speed;

    // ボールの初期位置（リサイズ時の調整）
    if (!isGameStarted) {
        // 初回ロード時のみ初期位置を設定
        x = canvas.width / 2;
        y = canvas.height - 50;

        // ★★★ 初回のみ実行される初期化処理 ★★★

        // 3. ブロック配列の初期化
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                const brickX = (c * brickWidth) + brickOffsetLeft;
                const brickY = (r * brickHeight) + brickOffsetTop;
                bricks[c][r] = { x: brickX, y: brickY, status: 1 };
            }
        }

        // 4. イベントリスナーを登録（D-Pad/リスタートボタンのみ）
        canvas.addEventListener('mousedown', dPadHandler);
        canvas.addEventListener('mouseup', dPadHandler);
        canvas.addEventListener('touchstart', dPadHandler);
        canvas.addEventListener('touchend', dPadHandler);

        isGameStarted = true;
        // 5. ゲームループを開始
        draw();

    } else {
        // リサイズ時：ボールが画面外に出ないように境界をチェック
        x = Math.min(Math.max(x, ballRadius), canvas.width - ballRadius);
        y = Math.min(Math.max(y, ballRadius), canvas.height - ballRadius);

        // 3'. リサイズ時：ブロック配列の座標のみを更新
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const brickX = (c * brickWidth) + brickOffsetLeft;
                const brickY = (r * brickHeight) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
            }
        }
    }
}

// --- イベントリスナーの起動 ---
window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);


// ★★★ D-Pad/リスタートボタン ハンドラ ★★★
function dPadHandler(e) {
    e.preventDefault();
    const isDown = (e.type === 'mousedown' || e.type === 'touchstart');
    const isUp = (e.type === 'mouseup' || e.type === 'touchend');

    // 座標の取得
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Canvas上の相対座標へ変換
    const rect = canvas.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // 1. ゲームオーバー時のリスタートボタン処理
    if (gameOver && isUp) {
        const isRestartButton =
            relativeX > restartButtonX &&
            relativeX < restartButtonX + restartButtonWidth &&
            relativeY > restartButtonY &&
            relativeY < restartButtonY + restartButtonHeight;

        if (isRestartButton) {
            restartGame();
            return;
        }
    }

    // 2. D-Padの処理 (ゲームオーバー時以外)
    if (!gameOver) {
        const isLeftButton = relativeX > dPadLeftX && relativeX < dPadLeftX + dPadButtonSize && relativeY > dPadY && relativeY < dPadY + dPadButtonSize;
        const isRightButton = relativeX > dPadRightX && relativeX < dPadRightX + dPadButtonSize && relativeY > dPadY && relativeY < dPadY + dPadButtonSize;

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
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#333333";
    ctx.fill();
    ctx.closePath();
}

// D-Padの描画関数
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
    ctx.fillText('▶', dPadRightX + dPadButtonSize / 2, dPadY + dPadButtonSize / 2 + 8);
    ctx.closePath();
}

// ブロックの画像描画関数
function drawBricks() {
    if (!bricksImage.complete) return;

    const totalBricksWidth = brickColumnCount * brickWidth;
    const totalBricksHeight = brickRowCount * brickHeight;

    // 1. ブロック群の画像をまるごと描画
    ctx.drawImage(bricksImage, brickOffsetLeft, brickOffsetTop, totalBricksWidth, totalBricksHeight);

    // 2. 壊れたブロックを個別にクリアして見えなくする
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 0) {
                ctx.clearRect(b.x, b.y, brickWidth, brickHeight);
            }
        }
    }
}

// ゲームオーバー画面の描画関数
function drawGameOver() {
    // 画面全体を半透明の黒で覆う
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // GAME OVER テキスト
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = "#FF0000";
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

    // リスタートボタンの描画
    ctx.beginPath();
    ctx.rect(restartButtonX, restartButtonY, restartButtonWidth, restartButtonHeight);
    ctx.fillStyle = "#0095DD"; // 青色のボタン
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // リスタートボタンのテキスト
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText('RESTART', canvas.width / 2, restartButtonY + 28);
}


// --- 衝突判定 ---

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];

            if (b.status === 1) {
                if (x + ballRadius > b.x && x - ballRadius < b.x + brickWidth && y + ballRadius > b.y && y - ballRadius < b.y + brickHeight) {

                    // 1. ボールがブロックの上面に当たった場合
                    if (y + ballRadius >= b.y && dy > 0) {
                        b.status = 0;
                        continue;
                    }

                    // 2. ボールがブロックの底面に当たった場合 (貫通防止)
                    if (y - ballRadius <= b.y + brickHeight && dy < 0) {
                        dy = -dy;
                        b.status = 0;
                        continue;
                    }

                    // 3. 水平方向（左右の側面）に当たった場合
                    if (y + ballRadius > b.y && y - ballRadius < b.y + brickHeight) {
                        dx = -dx;
                        b.status = 0;
                        continue;
                    }
                }
            }
        }
    }
}

// --- メイン描画ループ ---

function draw() {
    // 描画をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ゲームオーバー時はゲームオーバー画面を描画して処理を終了
    if (gameOver) {
        drawGameOver();
        requestAnimationFrame(draw);
        return;
    }

    // 各要素の描画
    drawBricks();
    drawBall();
    drawPaddle();
    drawDPad();
    collisionDetection();

    // 壁との衝突判定
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {

        // パドルとの衝突判定（反射角調整含む）
        if (x > paddleX && x < paddleX + paddleWidth) {

            dy = -dy;

            const paddleCenterX = paddleX + paddleWidth / 2;
            const relativeIntersectX = x - paddleCenterX;

            // 速度の大きさは常に一定を保つ
            const currentSpeed = Math.sqrt(dx * dx + dy * dy);
            const normalizedRelativeIntersectionX = relativeIntersectX / (paddleWidth / 2);

            // 水平速度を調整
            dx = currentSpeed * normalizedRelativeIntersectionX * 0.8;

            // 速度が極端に遅くならないように最小値を設定
            if (Math.abs(dx) < 1) {
                dx = (dx >= 0 ? 1 : -1);
            }

            // 速度の大きさが変わらないようにdyを再計算
            // Math.sign(dy) は dy の符号 (+1 or -1) を取得
            dy = Math.sign(dy) * Math.sqrt(currentSpeed * currentSpeed - dx * dx);

        } else {
            // ボールを打ち返せなかった場合、ゲームオーバーフラグを立てる
            gameOver = true;
        }
    }

    // パドルの移動処理 (D-Pad操作)
    if (dPadRightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (dPadLeftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    // ボールの位置更新
    x += dx;
    y += dy;

    // 次のフレームを要求
    requestAnimationFrame(draw);
}
