import { select as d3_select } from 'd3-selection';

import { getRetinaRatio } from './helpers.js';


class TwoRectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.stroke = "#000";
        this.fill = "#000";
        this.linewidth = 1;
        this.opacity = 1;
        this.rotation = null;
    }

    noFill() {
        this.fill = null;
    }

    noStroke() {
        this.stroke = null;
    }
}

class TwoCircle {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;

        this.stroke = "#000";
        this.fill = "#000";
        this.linewidth = 1;
        this.opacity = 1;
    }

    noFill() {
        this.fill = null;
    }

    noStroke() {
        this.stroke = null;
    }
    
}

class TwoLine {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;

        this.stroke = "#000";
        this.linewidth = 1;
        this.opacity = 1;
    }

    noStroke() {
        this.stroke = null;
    }
}

class TwoPath {
    constructor(points) {
        this.points = points;

        this.stroke = "#000";
        this.linewidth = 1;
        this.opacity = 1;
    }

    noStroke() {
        this.stroke = null;
    }
}

export default class Two {

    constructor({ width, height, domElement }) {
        this.width = width;
        this.height = height;
        this.domElement = domElement;

        this.elements = [];

        this.init();
    }

    initSvg() {
        this.svg = d3_select(this.domElement);
        this.svg
            .attr("width", this.width)
            .attr("height", this.height);
        
        this.g = this.svg
            .append("g")
                .attr("width", this.width)
                .attr("height", this.height);
    }

    initCanvas() {
        const context = this.domElement.getContext('2d');
        this.context = context;

        const ratio = getRetinaRatio(context);
        const scaledWidth = this.width * ratio;
        const scaledHeight = this.height * ratio;

        this.domElement.width = scaledWidth;
        this.domElement.height = scaledHeight;
        
        context.scale(ratio, ratio);
        this.ratio = ratio;
    }

    init() {
        switch(this.domElement.nodeName.toLowerCase()) {
            case 'canvas':
                this.initCanvas();
                break;
            case 'svg':
                this.initSvg();
                break;
            default:
                console.warn("Unknown DOM element type.");
        }
    }

    makeRectangle(x, y, width, height) {
        const rect = new TwoRectangle(x, y, width, height);
        this.elements.push(rect);
        return rect;
    }

    makeCircle(x, y, size) {
        const circle = new TwoCircle(x, y, size);
        this.elements.push(circle);
        return circle;
    }

    makeLine(x1, y1, x2, y2) {
        const line = new TwoLine(x1, y1, x2, y2);
        this.elements.push(line);
        return line;
    }

    makePath() {
        const args = Array.from(arguments);
        const points = [];
        for(let i = 0; i < args.length; i += 2) {
            points.push([ args[i], args[i+1] ]);
        }

        const path = new TwoPath(points);
        this.elements.push(path);
        return path;
    }

    renderSvg() {
        const g = this.g;
        this.elements.forEach((d) => {
            if(d instanceof TwoRectangle) {
                const rect = g.append("rect")
                    .attr("x", d.x - d.width/2)
                    .attr("y", d.y - d.height/2)
                    .attr("width", d.width)
                    .attr("height", d.height)
                    .attr("opacity", d.opacity);
                
                if(d.fill != null) {
                    rect
                        .attr("fill", d.fill);
                } else {
                    rect
                        .attr("fill", "transparent");
                }
                if(d.stroke != null) {
                    rect
                        .attr("stroke-width", d.linewidth)
                        .attr("stroke", d.stroke);
                }
                if(d.rotation != null) {
                    rect
                        .attr("transform", `rotate(${d.rotation * 180/Math.PI},${d.x},${d.y})`);
                }
            } else if(d instanceof TwoCircle) {
                const circle = g.append("circle")
                    .attr("cx", d.x)
                    .attr("cy", d.y)
                    .attr("r", d.size)
                    .attr("opacity", d.opacity);
                
                if(d.fill != null) {
                    circle
                        .attr("fill", d.fill);
                } else {
                    circle
                        .attr("fill", "transparent");
                }
                if(d.stroke != null) {
                    circle
                        .attr("stroke-width", d.linewidth)
                        .attr("stroke", d.stroke);
                }
            } else if(d instanceof TwoLine) {
                const line = g.append("line")
                    .attr("x1", d.x1)
                    .attr("y1", d.y1)
                    .attr("x2", d.x2)
                    .attr("y2", d.y2)
                    .attr("opacity", d.opacity);
                if(d.stroke != null) {
                    line
                        .attr("stroke-width", d.linewidth)
                        .attr("stroke", d.stroke);
                }
            } else if(d instanceof TwoPath) {
                const path = g.append("path")
                    .attr("opacity", d.opacity);
                
                let pathD = "";
                if(d.points.length > 1) {
                    d.points.forEach((p, i) => {
                        if(i == 0) {
                            pathD += `M ${p[0]} ${p[1]}`;
                        } else {
                            pathD += `L ${p[0]} ${p[1]}`;
                        }
                    });
                }

                
                if(d.stroke != null) {
                    path
                        .attr("stroke-width", d.linewidth)
                        .attr("stroke", d.stroke);
                }
                path.attr("d", pathD);
            }
        });
    }

    renderCanvas() {
        const context = this.context;

        this.elements.forEach((d) => {
            context.lineWidth = d.linewidth;
            context.globalAlpha = d.opacity;

            if(d instanceof TwoRectangle) {
                if(d.rotation != null) {
                    context.save();
                    context.translate(d.x, d.y);
                    context.rotate(d.rotation);
                    context.translate(-d.x, -d.y);
                }
                if(d.fill != null) {
                    context.fillStyle = d.fill;
                    context.fillRect(d.x - d.width/2, d.y - d.height/2, d.width, d.height);
                }
                if(d.stroke != null) {
                    context.strokeStyle = d.stroke;
                    context.strokeRect(d.x - d.width/2, d.y - d.height/2, d.width, d.height);
                }
                if(d.rotation != null) {
                    context.restore();
                }
            } else if(d instanceof TwoCircle) {
                if(d.fill != null) {
                    context.fillStyle = d.fill;
                }
                if(d.stroke != null) {
                    context.strokeStyle = d.stroke;
                }
                context.beginPath();
                context.arc(d.x, d.y, d.size, 0, 2*Math.PI);
                if(d.fill != null) {
                    context.fill();
                }
                if(d.stroke != null) {
                    context.stroke();
                }
            } else if(d instanceof TwoLine) {
                if(d.stroke != null) {
                    context.strokeStyle = d.stroke;
                }
                context.beginPath();
                context.moveTo(d.x1, d.y1);
                context.lineTo(d.x2, d.y2);
                if(d.stroke != null) {
                    context.stroke();
                }
            } else if(d instanceof TwoPath) {
                if(d.stroke != null) {
                    context.strokeStyle = d.stroke;
                }
                if(d.points.length > 1) {
                    context.beginPath();
                    d.points.forEach((p, i) => {
                        if(i == 0) {
                            context.moveTo(p[0], p[1]);
                        } else {
                            context.lineTo(p[0], p[1]);
                        }
                    });
                }
                if(d.stroke != null) {
                    context.stroke();
                }
            }
        });
    }

    update() {
        switch(this.domElement.nodeName.toLowerCase()) {
            case 'canvas':
                this.renderCanvas();
                break;
            case 'svg':
                this.renderSvg();
                break;
            default:
                console.warn("Unknown DOM element type.");
        }
    }
}