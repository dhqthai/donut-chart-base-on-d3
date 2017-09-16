/**
 *
 */
var psd3 = {};
psd3.Graph = function(config) {
    var _this = this;
    this.config = config;
    this.defaults = {
        width: 400,
        height: 400,
        value: "value",
        inner: "inner",
        label: function(d) {
            return d.data[_this.config.value];
        },
        tooltip: function(d) {
            if (_this.config.value !== undefined) {
                return d[_this.config.value];
            } else {
                return d.value;
            }

        },
        transition: "linear",
        transitionDuration: 1000,
        donutRadius: 0,
        gradient: false,
        colors: d3.scale.category20(),
        labelColor: "black",
        drilldownTransition: "linear",
        drilldownTransitionDuration: 0,
        stroke: "white",
        strokeWidth: 2,
        highlightColor: "orange",
        rotateLabel: false,
        familyFill: false
    };

    for (var property in this.defaults) {
        if (this.defaults.hasOwnProperty(property)) {
            if (!config.hasOwnProperty(property)) {
                config[property] = this.defaults[property];
            }
        }
    }
};

psd3.Pie = function(config) {
    psd3.Graph.call(this, config);
    this.zoomStack = [];
    var pos = "top";
    if (this.config.heading !== undefined && this.config.heading.pos !== undefined) {
        pos = this.config.heading.pos;
    }
    if (pos == "top") {
        this.setHeading();
    }
    this.drawPie(config.data);
    if (pos == "bottom") {
        this.setHeading();
    }
};

psd3.Pie.prototype = Object.create(psd3.Graph.prototype);

psd3.Pie.prototype.constructor = psd3.Pie;

psd3.Pie.prototype.findMaxDepth = function(dataset) {
    if (dataset === null || dataset === undefined || dataset.length < 1) {
        return 0;
    }
    var currentLevel;
    var maxOfInner = 0;
    for (var i = 0; i < dataset.length; i++) {
        var maxInnerLevel = this.findMaxDepth(dataset[i][this.config.inner]);
        if (maxOfInner < maxInnerLevel) {
            maxOfInner = maxInnerLevel;
        }
    }
    currentLevel = 1 + maxOfInner;
    return currentLevel;
};

psd3.Pie.prototype.setHeading = function() {
    if (this.config.heading !== undefined) {
        d3.select("#" + this.config.containerId)
            .append("div")
            .style("text-align", "center")
            .style("width", "" + this.config.width + "px")
            .style("padding-top", "20px")
            .style("padding-bottom", "20px")
            .append("strong")
            .text(this.config.heading.text);
    }
};

psd3.Pie.prototype.mouseover = function(d) {
    d3.select("#" + _this.tooltipId)
        .style("left", (d3.event.clientX + window.scrollX) + "px")
        .style("top", (d3.event.clientY + window.scrollY) + "px")
        .select("#value")
        .html(_this.config.tooltip(d.data, _this.config.label));
    d3.select("#" + _this.tooltipId).classed("psd3Hidden", false);
    d3.select(d.path)
        .style("fill", _this.config.highlightColor);
};
psd3.Pie.prototype.mouseout = function(d) {
    d3.select("#" + _this.tooltipId).classed("psd3Hidden", true);
    d3.select(d.path)
        .style("fill", d.fill);
};

psd3.Pie.prototype.drawPie = function(dataset) {
    if (dataset === null || dataset === undefined || dataset.length < 1) {
        return;
    }
    _this = this;
    _this.arcIndex = 0;
    var svg = d3.select("#" + _this.config.containerId)
        .append("svg")
        .attr("id", _this.config.containerId + "_svg")
        .attr("width", _this.config.width)
        .attr("height", _this.config.height);
    _this.tooltipId = _this.config.containerId + "_tooltip";
    var tooltipDiv = d3.select("#" + _this.config.containerId).append("div")
        .attr("id", _this.tooltipId)
        .attr("class", "psd3Hidden psd3Tooltip");
    tooltipDiv.append("p")
        .append("span")
        .attr("id", "value")
        .text("100%");

    // to contain pie circle
    var radius;
    if (_this.config.width > _this.config.height) {
        radius = _this.config.width / 2;
    } else {
        radius = _this.config.height / 2;
    }
    var innerRadius = _this.config.donutRadius;
    var maxDepth = _this.findMaxDepth(dataset);

    var outerRadius = innerRadius + (radius - innerRadius) / maxDepth;
    var originalOuterRadius = outerRadius;
    var radiusDelta = outerRadius - innerRadius;
    _this.draw(svg, radius, dataset, dataset, dataset.length, innerRadius, outerRadius, radiusDelta, 0, 360 * 22 / 7 / 180, [0, 0]);
};

psd3.Pie.prototype.customArcTween = function(d) {
    var start = {
        startAngle: d.startAngle,
        endAngle: d.startAngle
    };
    var interpolate = d3.interpolate(start, d);
    return function(t) {
        return d.arc(interpolate(t));
    };
};

psd3.Pie.prototype.textTransform = function(d) {
    return "translate(" + d.arc.centroid(d) + ")";
};

psd3.Pie.prototype.textTitle = function(d) {
    return d.data[_this.config.value];
};

psd3.Pie.prototype.draw = function(svg, totalRadius, dataset, originalDataset, originalDatasetLength, innerRadius, outerRadius, radiusDelta, startAngle, endAngle, parentCentroid) {
    _this = this;

    if (dataset === null || dataset === undefined || dataset.length < 1) {
        return;
    }

    psd3.Pie.prototype.textText = function(d) {
        return _this.config.label(d);
    };

    var pie = d3.layout.pie();
    pie.sort(null);

    pie.value(function(d) {
        return d[_this.config.value];
    });

    pie.startAngle(startAngle)
        .endAngle(endAngle);

    var click = function(d) {
        _this.reDrawPie(d, originalDataset);
    };

    var arc = d3.svg.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    //Set up groups
    _this.arcIndex = _this.arcIndex + 1;
    var clazz = _this.config.containerId + _this.arcIndex;

    var customFamilyFill = function(d) {
        if (d.data.familyFill === undefined) {
            var fill = _this.config.label(d);
            d.data['familyFill'] = fill;
            var inner = d.data[_this.config.inner];
            if (inner !== undefined) {
                for (var j = 0; j < inner.length; j++) {
                    inner[j]['familyFill'] = fill;
                };
            }
        }
    };

    var storeMetadataWithArc = function(d) {
        d.path = this;
        d.fill = this.fill;
        d.arc = arc;
        d.length = dataset.length;
        d.context = _this;
    };

    var arcs = svg.selectAll("g." + clazz)
        .data(pie(dataset))
        .enter()
        .append("g")
        .attr("class", "arc " + clazz)
        .attr("transform",
            "translate(" + (totalRadius) + "," + (totalRadius) + ")");

    // arcs.each(customFamilyFill);

    //Draw arc paths
    var paths = arcs.append("path")
        .attr("fill", function(d) {
            if (_this.config.familyFill) {
                customFamilyFill(d);
                return _this.config.colors(d.data.familyFill);
            } else {
                return _this.config.colors(_this.config.label(d));
            }
        })
        .style("stroke", _this.config.stroke)
        .style("stroke-width", _this.config.strokeWidth)
        .on("click", function(d) {
            _this = d.context;
            click(d);
        });

    paths.each(storeMetadataWithArc);

    paths.on("mouseover", function(d) {
        _this = d.context;
        _this.mouseover(d);
    });

    paths.on("mouseout", function(d) {
        _this = d.context;
        _this.mouseout(d);
    });

    paths.transition()
        .duration(_this.config.transitionDuration)
        .delay(_this.config.transitionDuration * (_this.arcIndex - 1))
        .ease(_this.config.transition)
        .attrTween("d", _this.customArcTween);

    //Labels
    var texts = arcs.append("text")
        .attr("x", function() {
            return parentCentroid[0];
        })
        .attr("y", function() {
            return parentCentroid[1];
        })
        .transition()
        .ease(_this.config.transition)
        .duration(_this.config.transitionDuration)
        .delay(_this.config.transitionDuration * (_this.arcIndex - 1))
        .attr("transform", function(d) {
            var a = [];
            a[0] = arc.centroid(d)[0] - parentCentroid[0];
            a[1] = arc.centroid(d)[1] - parentCentroid[1];
            var rotate = "";
            if (_this.config.rotateLabel === true) {
                var rotateAngle = (d.endAngle + d.startAngle) / 2 * (180 / Math.PI) + 90;
                var b = [];
                b[0] = parentCentroid[0];
                b[1] = parentCentroid[1];
                rotate = "rotate( " + rotateAngle + ", " + b + ")";
            }
            return "translate(" + a + ")" + rotate;
        })
        .attr("text-anchor", "middle")
        .text(_this.textText)
        .style("fill", _this.config.labelColor)
        .attr("title", _this.textTitle);

    for (var j = 0; j < dataset.length; j++) {
        if (dataset[j][_this.config.inner] !== undefined) {
            _this.draw(svg, totalRadius, dataset[j][_this.config.inner], originalDataset, originalDatasetLength, innerRadius + radiusDelta, outerRadius + radiusDelta, radiusDelta, paths.data()[j].startAngle, paths.data()[j].endAngle, arc.centroid(paths.data()[j]));
        }
    }
};

psd3.Pie.prototype.reDrawPie = function(d, ds) {
    var tmp = [];
    d3.select("#" + _this.tooltipId).remove();
    d3.select("#" + _this.config.containerId).select("svg") //.remove();
        .transition()
        .ease(_this.config.drilldownTransition)
        .duration(_this.config.drilldownTransitionDuration)
        .style("height", 0)
        .remove()
        .each("end", function() {
            if (d.length == 1) {
                tmp = _this.zoomStack.pop();
            } else {
                tmp.push(d.data);
                _this.zoomStack.push(ds);
            }
            _this.drawPie(tmp);
        });
};