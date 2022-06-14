let canvas;
let backgroundImg;
let animate = true;

let cardDrawable, videoDrawable;
let drawList = [];

let mouseDown = false;
let mouseTarget = undefined;

const CORNERS = {
    topLeft: "TOP_LEFT",
    topRight: "TOP_RIGHT",
    bottomLeft: "BOTTOM_LEFT",
    bottomRight: "BOTTOM_RIGHT"
};

function squaredEuclideanDistance(x1, y1, x2, y2) {
    const l = x2 - x1;
    const r = y2 - y1;
    return (l * l) + (r * r);
}

function fitToBox(imgW, imgH, boxW, boxH, useMax = false) {
    const width_ratio = boxW / imgW;
    const height_ratio = boxH / imgH;
    return useMax ? Math.max(width_ratio, height_ratio) : Math.min(width_ratio, height_ratio);
}

class Handle {
    constructor(x, y, corner) {
        this.position = {x,y};
        this.corner = corner;
        this._color = 'orchid';
        this._radius = 8;
        this._squaredRadius = this._radius * this._radius;
    }

    toString() {
        return `${this.corner} (${this.position.x}, ${this.position.y})`;
    }

    draw(ctx) {
        ctx.fillStyle = this._color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this._radius, 0, 2 * Math.PI);
        ctx.fill();
    }

    hitTest(mouseX, mouseY) {
        const hit = squaredEuclideanDistance(this.position.x,this.position.y,mouseX,mouseY) < this._squaredRadius;
        if (hit) {
            this._color = 'darkorchid';
        } else {
            this._color = 'orchid';
        }
        return hit;
    }

    move(dX,dY) {
        this.position.x += dX;
        this.position.y += dY;
    }

    setPos(x,y) {
        this.position.x = x;
        this.position.y = y;
    }
}

class Drawable {
    constructor(source, name, initialZIndex=0) {
        this.source = source;
        this.name = name;
        this.zIndex = initialZIndex;

        this.position = {x: 0, y: 0};
        this.size = {x: 0, y: 0};
        this.scaledSize = {x: 0, y: 0};

        const cornerArr = [CORNERS.topLeft, CORNERS.bottomLeft, CORNERS.topRight, CORNERS.bottomRight];
        this._handles = cornerArr.map(c => new Handle(0,0,c));

        this.ready = false;
        this.source.addEventListener("load", () => {
            this._updateBounds();
        }, false);
        this.source.addEventListener("loadeddata", () => {
            this._updateBounds();
        }, false);
    }

    _updateBounds() {
        this.size.x = this.source.videoWidth ?? this.source.naturalWidth;
        this.size.y = this.source.videoHeight ?? this.source.naturalHeight;

        if (this.size.x > canvas.width || this.size.y > canvas.height) {
            this.scale = fitToBox(this.size.x, this.size.y, canvas.width, canvas.height);
        } else {
            this.scale = 1;
        }
        this.scaledSize.x = this.size.x * this.scale;
        this.scaledSize.y = this.size.y * this.scale;

        this._updateHandles();
        this.ready = true;
    }

    _updateHandles() {
        let handleCount = 0;
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                this._handles[handleCount].setPos(
                    this.position.x + this.scaledSize.x * x, 
                    this.position.y + this.scaledSize.y * y
                );
                handleCount++;
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.source, this.position.x, this.position.y, this.scaledSize.x, this.scaledSize.y);
        for (let handle of this._handles) {
            handle.draw(ctx);
        }
    }

    hitTest(mouseX, mouseY) {
        for (let handle of this._handles) {
            if (handle.hitTest(mouseX, mouseY)) {
                return {isHandle: true, target: this, corner: handle.corner};
            }
        }
        if (mouseX >= this.position.x && mouseX <= this.position.x + this.scaledSize.x) {
            if (mouseY >= this.position.y && mouseY <= this.position.y + this.scaledSize.y) {
                return {isHandle: false, target: this};
            }
        }
        return undefined;
    }

    move(dX,dY) {
        this.position.x += dX;
        this.position.y += dY;
        for (let handle of this._handles) {
            handle.move(dX,dY);
        }
    }

    scaleBy(dX, dY, corner) {
        let newBoundingWidth = this.scaledSize.x;
        let newBoundingHeight = this.scaledSize.y;
        let scalingIn = false;

        switch (corner) {
            case CORNERS.topLeft:
                newBoundingWidth -= dX;
                newBoundingHeight -= dY;
                scalingIn = (dX > 0 || dY > 0);
                break;
            case CORNERS.topRight:
                newBoundingWidth += dX;
                newBoundingHeight -= dY;
                scalingIn = (dX < 0 || dY > 0);
                break;
            case CORNERS.bottomLeft:
                newBoundingWidth -= dX;
                newBoundingHeight += dY;
                scalingIn = (dX > 0 || dY < 0);
                break;
            case CORNERS.bottomRight:
                newBoundingWidth += dX;
                newBoundingHeight += dY;
                scalingIn = (dX < 0 || dY < 0);
                break;
        }

        this.scale = fitToBox(this.size.x, this.size.y, newBoundingWidth, newBoundingHeight, !scalingIn);
        const newW = this.size.x * this.scale;
        const newH = this.size.y * this.scale;
        const dW = this.scaledSize.x - newW;
        const dH = this.scaledSize.y - newH;

        this.scaledSize.x = this.size.x * this.scale;
        this.scaledSize.y = this.size.y * this.scale;

        switch (corner) {
            case CORNERS.topLeft:
                this.position.x += dW;
                this.position.y += dH;
                break;
            case CORNERS.topRight:
                this.position.y += dH;
                break;
            case CORNERS.bottomLeft:
                this.position.x += dW;
                break;
            case CORNERS.bottomRight:
                break;
        }

        this._updateHandles();
    }
}

function togglePause(button) {
    animate = !animate;
    if (animate) {
        button.innerHTML = `
        <span class="material-symbols-rounded">
            pause
        </span>`;
        draw();
    } else {
        button.innerHTML = `
        <span class="material-symbols-rounded">
            play_arrow
        </span>`;
    }
}

function updateCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

function sortDrawList() {
    drawList.sort((a, b) => a.zIndex - b.zIndex);
}

function draw() {
    if (animate) {
        requestAnimationFrame(draw);
    }

    updateCanvasSize();
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    
    const backgroundPattern = ctx.createPattern(backgroundImg, "repeat");
    ctx.fillStyle = backgroundPattern;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for (let drawable of drawList) {
        if (drawable.ready) {
            drawable.draw(ctx);
        }
    }
}

function sendRequest() {
    const minPoint = {
        x: drawList.reduce((prev, cur) => Math.min(prev, cur.position.x), 9999),
        y: drawList.reduce((prev, cur) => Math.min(prev, cur.position.y), 9999)
    };
    const scale = 1 / cardDrawable.scale;
    const itemData = drawList.map(drawable => {
        const correctedScale = drawable.scale * scale;
        // todo: fix relative positions
        const relativePosition = {
            x: (drawable.position.x - minPoint.x) * correctedScale, 
            y: (drawable.position.y - minPoint.y) * correctedScale
        };

        // todo: remove all of this once the scaling code works; it's just to visualize the output
        drawable.position.x = relativePosition.x;
        drawable.position.y = relativePosition.y;
        drawable.scale = correctedScale;
        drawable.size.x = drawable.size.x * correctedScale;
        drawable.size.y = drawable.size.y * correctedScale;
        drawable.scaledSize.x = drawable.size.x;
        drawable.scaledSize.y = drawable.size.y;
        drawable._updateHandles();

        return {
            name: drawable.name,
            position: relativePosition,
            size: {
                x: drawable.size.x * correctedScale, 
                y: drawable.size.y * correctedScale
            }, // post-scale size
            zIndex: drawable.zIndex
        };
    });
    console.log(JSON.stringify(itemData));
}

function addMouseListeners() {
    canvas.addEventListener("mousemove", ({pageX,pageY,movementX,movementY}) => {
        if (mouseTarget && mouseDown) {
            if (mouseTarget.isHandle) {
                mouseTarget.target.scaleBy(movementX, movementY, mouseTarget.corner);
            } else {
                mouseTarget.target.move(movementX, movementY);
            }
        } else {
            for (let drawable of drawList) {
                if (drawable.ready) {
                    drawable.hitTest(pageX, pageY);
                }
            }
        }
    }, false);
    canvas.addEventListener("mousedown", ({pageX, pageY}) => {
        mouseDown = true;
        for (let drawable of drawList) {
            if (drawable.ready) {
                const hit = drawable.hitTest(pageX, pageY);
                if (hit !== undefined) {
                    mouseTarget = hit;
                }
            }
        }
    }, false);
    canvas.addEventListener("mouseup", () => {
        mouseDown = false;
        mouseTarget = undefined;
    }, false);
}

function addLoadingListeners() {
    const imgSrc = document.getElementById('image-loader');
    if (imgSrc) {
        drawList = drawList.filter(drawable => drawable.name !== "card");
        cardDrawable = new Drawable(imgSrc, "card", 1);
        drawList.push(cardDrawable);
        sortDrawList();
    }
    const videoSrc = document.getElementById('video-loader');
    if (videoSrc) {
        drawList = drawList.filter(drawable => drawable.name !== "video");
        videoDrawable = new Drawable(videoSrc, "video");
        drawList.push(videoDrawable);
        sortDrawList();
    }
}

function addButtonListeners() {
    const imgFrontButton = document.getElementById('card-to-front');
    imgFrontButton.addEventListener("click", () => {
        // TODO: actual z-ordering algorithm
        cardDrawable.zIndex = 1;
        videoDrawable.zIndex = 0;
        sortDrawList();
    }, false);
    const imgBackButton = document.getElementById('card-to-back');
    imgBackButton.addEventListener("click", () => {
        cardDrawable.zIndex = 0;
        videoDrawable.zIndex = 1;
        sortDrawList();
    }, false);

    const pauseButton = document.getElementById('pause-button');
    pauseButton.addEventListener("click", e => togglePause(e.target), false);

    const generateButton = document.getElementById('generate-button');
    generateButton.addEventListener("click", () => sendRequest(), false);
}

function initialize() {
    canvas = document.getElementById('canvas');
    backgroundImg = document.getElementById('background-loader');

    addMouseListeners();
    addLoadingListeners();
    addButtonListeners();
    
    draw();
}

document.addEventListener('DOMContentLoaded', initialize, false);