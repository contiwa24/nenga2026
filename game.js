// Canvas要素と描画コンテキストを取得
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// ボールの設定
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 2; // ボールのx方向の速度
let dy = -2; // ボールのy方向の速度
const ballRadius = 10;

// パドル（バー）の設定
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2; // パドルのx座標

// キー操作の状態
let rightPressed = false;
let leftPressed = false;

// ブロックの設定
const brickRowCount = 10; // 縦の数を10
const brickColumnCount = 14; // 横の数を14
const brickPadding = 0; // 隙間を0
const brickWidth = 30; // ブロック1個の幅を30ピクセル
const brickHeight = 15; // ブロックの高さは15

// 中央揃えと上端開始のためのオフセット計算
const brickOffsetTop = 0; // 縦は上端から開始
const brickOffsetLeft = (canvas.width - (brickColumnCount * brickWidth)) / 2; // 左右の余白は 30

// ブロック群の画像ロード処理
const bricksImage = new Image();
// ★ここを実際の画像ファイル名に置き換えてください★
bricksImage.src = 'wp5493583-original-blue-wallpapers.jpg';

// ブロック配列の初期化
const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        const brickX = (c * brickWidth) + brickOffsetLeft;
        const brickY = (r * brickHeight) + brickOffsetTop;

        bricks[c][r] = {
            x: brickX,
            y: brickY,
            status: 1 // 1は「存在する」
        };
    }
}

// --- イベントリスナー ---
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
// ★タッチ操作★
document.addEventListener("touchstart", touchHandler, false);
document.addEventListener("touchmove", touchHandler, false);
// ★マウス操作★
document.addEventListener("mousemove", mouseMoveHandler, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;

    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
        if (paddleX < 0) {
            paddleX = 0;
        } else if (paddleX > canvas.width - paddleWidth) {
            paddleX = canvas.width - paddleWidth;
        }
    }
}

function touchHandler(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const rect = canvas.getBoundingClientRect();
    const relativeX = touchX - rect.left;

    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;

        if (paddleX < 0) {
            paddleX = 0;
        } else if (paddleX > canvas.width - paddleWidth) {
            paddleX = canvas.width - paddleWidth;
        }
    }
}

// --- 描画関数 ---

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#FF0000"; // ボールを赤色に
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#333333"; // パドルを濃い灰色に
    ctx.fill();
    ctx.closePath();
}

// ブロックの画像描画関数
function drawBricks() {
    // 画像が読み込まれていない場合は、描画処理をスキップ
    if (!bricksImage.complete) return;

    const totalBricksWidth = brickColumnCount * brickWidth;
    const totalBricksHeight = brickRowCount * brickHeight;

    // 1. ブロック群の画像をまるごと描画
    ctx.drawImage(bricksImage, brickOffsetLeft, brickOffsetTop, totalBricksWidth, totalBricksHeight);

    // 2. 壊れたブロックを個別にクリアして見えなくする
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 0) { // 破壊されたブロックの場合
                // その部分を透明な四角形で上書きして見えなくする
                ctx.clearRect(b.x, b.y, brickWidth, brickHeight);
            }
        }
    }
}

// --- 衝突判定 ---

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];

            if (b.status === 1) {
                // 大まかな衝突判定
                if (x + ballRadius > b.x && x - ballRadius < b.x + brickWidth && y + ballRadius > b.y && y - ballRadius < b.y + brickHeight) {

                    // 1. ボールがブロックの上面に当たった場合 (上に跳ね返らない設定)
                    if (y + ballRadius >= b.y && dy > 0) {
                        // dyの反転処理は行わない (下に進行し続ける)
                        b.status = 0; // ブロックを破壊
                        continue;
                    }

                    // 2. ボールがブロックの底面に当たった場合 (上に進むときの貫通防止、下に跳ね返る)
                    if (y - ballRadius <= b.y + brickHeight && dy < 0) {
                        dy = -dy; // 下に跳ね返る
                        b.status = 0; // ブロックを破壊
                        continue;
                    }

                    // 3. 水平方向（左右の側面）に当たった場合
                    if (y + ballRadius > b.y && y - ballRadius < b.y + brickHeight) {
                        dx = -dx; // 水平方向を反転
                        b.status = 0; // ブロックを破壊
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

    // 各要素の描画
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection(); // 衝突判定

    // 壁との衝突判定
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx; // 左右の壁で反転
    }
    if (y + dy < ballRadius) {
        dy = -dy; // 上の壁で反転
    } else if (y + dy > canvas.height - ballRadius) {

        // パドルとの衝突判定（反射角調整含む）
        if (x > paddleX && x < paddleX + paddleWidth) {

            // 1. 垂直方向を反転 (上に跳ね返る)
            dy = -dy;

            // 2. パドルの中心からの相対的な衝突位置を計算
            const paddleCenterX = paddleX + paddleWidth / 2;
            const relativeIntersectX = x - paddleCenterX;

            // 3. 衝突位置に応じて水平速度 (dx) を調整
            const currentSpeed = Math.sqrt(dx * dx + dy * dy);
            const normalizedRelativeIntersectionX = relativeIntersectX / (paddleWidth / 2);

            dx = currentSpeed * normalizedRelativeIntersectionX * 0.8; // 0.8は調整係数

            if (Math.abs(dx) < 1) {
                dx = (dx >= 0 ? 1 : -1);
            }

        } else {
            // パドルで受け止められなかった場合
            alert("GAME OVER");
            document.location.reload();
        }
    }

    // パドルの移動処理 (キーボード操作)
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    // ボールの位置更新
    x += dx;
    y += dy;

    // 次のフレームを要求
    requestAnimationFrame(draw);
}

// ゲーム開始
// 画像のロード完了を待たずに即座に開始します。
// drawBricks関数内で画像ロードのチェックを行っているため、描画は遅延されます。
draw();
